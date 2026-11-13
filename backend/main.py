"""
FastAPI backend for StockSense AI.

Endpoints
---------
GET  /api/stock            → all products with live stock levels + status
GET  /api/evidence         → full build_evidence() output (variances, data_issues, totals)
GET  /api/alerts           → derived alerts for the frontend AlertPanel
GET  /api/findings         → last findings.json from the agent
GET  /api/report           → last stock_report.md text
GET  /api/products/{sku}/sales?days=14
GET  /api/products/{sku}/deliveries?days=30
GET  /api/location/{location}/variances
POST /api/delivery         → record a new delivery (updates system_stock CSV)
POST /api/service          → record a service (deducts estimated usage)
POST /api/run-agent        → trigger full Gemini agent run (returns SSE stream)
GET  /api/score            → score findings.json against answer_key.csv

Run:  uvicorn backend.main:app --reload --port 8000
"""
import json, os, re, threading, time
from pathlib import Path
from typing import Optional
from datetime import date

import pandas as pd
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv

# ── paths ──────────────────────────────────────────────────────────────────────
ROOT      = Path(__file__).parent.parent          # hackathon--project-II/
DATA_DIR  = ROOT / "data"
FINDINGS  = ROOT / "findings.json"
REPORT    = ROOT / "stock_report.md"

load_dotenv(ROOT / ".env")

app = FastAPI(title="StockSense AI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── import the agent logic ─────────────────────────────────────────────────────
import sys
sys.path.insert(0, str(ROOT))
from stock_agent import load_data, build_evidence, make_tools, run_agent, parse_findings, score as score_fn, ACCEPT

# ── in-memory state (reset on server restart) ─────────────────────────────────
# We keep a live copy of system_stock in memory so delivery/service endpoints
# can update it without touching the CSV immediately.
_data_cache: dict = {}
_last_loaded: float = 0.0
CACHE_TTL = 30  # seconds


def get_data(force: bool = False) -> dict:
    """Load CSVs with a short cache so hot-reload doesn't hammer disk."""
    global _data_cache, _last_loaded
    if force or not _data_cache or (time.time() - _last_loaded) > CACHE_TTL:
        _data_cache = load_data(DATA_DIR)
        _last_loaded = time.time()
    return _data_cache


def status_from_pct(pct: float) -> str:
    if pct > 0.5:
        return "healthy"
    if pct > 0.25:
        return "warning"
    return "critical"


# ── helpers to map CSV products → frontend shape ───────────────────────────────
def build_stock_items(D: dict) -> list[dict]:
    """Merge products + system_stock into the shape the frontend stockItems needs."""
    products = D["products"]
    system   = D["system"]
    merged   = products.merge(system, on="sku", how="left")
    merged["system_qty_on_hand"] = merged["system_qty_on_hand"].fillna(0).astype(int)

    items = []
    for i, r in enumerate(merged.itertuples(), start=1):
        qty      = int(r.system_qty_on_hand)
        reorder  = int(r.reorder_level)
        max_cap  = max(int(r.reorder_qty) * 3, qty + 1)   # rough max capacity
        pct      = qty / max_cap if max_cap else 0
        items.append({
            "id":           i,
            "sku":          r.sku,
            "name":         r.product_name,
            "category":     r.category,
            "location":     r.location,
            "unit":         "units",
            "currentStock": qty,
            "maxStock":     max_cap,
            "unitCost":     float(r.unit_cost_zar),
            "reorderPoint": reorder,
            "status":       status_from_pct(pct),
            "supplier":     r.supplier,
            "sellingPrice": float(r.selling_price_zar),
            "shelfLifeDays":int(r.shelf_life_days),
        })
    return items


def derive_alerts(evidence: dict, findings: list[dict]) -> list[dict]:
    """
    Turn the evidence variances + AI findings into AlertPanel-shaped alerts.
    Two types:
      • confirm  → agent found a discrepancy and needs the owner to verify
      • order    → stock below reorder_level
    """
    D       = get_data()
    system  = D["system"].set_index("sku")["system_qty_on_hand"].to_dict()
    products_df = D["products"].set_index("sku")

    findings_by_sku = {f["sku"]: f for f in findings}
    alerts  = []
    aid     = 1

    # Alerts from variances + findings
    for var in evidence.get("variances", []):
        sku  = var["sku"]
        name = var["product_name"]
        f    = findings_by_sku.get(sku, {})
        cause = f.get("cause", "unclear")
        conf  = f.get("confidence", "low")

        if var["variance_units"] != 0:
            if cause in ("theft_suspected", "expired_or_spoiled", "damaged"):
                priority = "high" if abs(var["variance_zar"]) > 100 else "medium"
                alerts.append({
                    "id":        aid,
                    "type":      "confirm",
                    "sku":       sku,
                    "name":      name,
                    "message":   (
                        f"Agent flagged a gap of {var['variance_units']} units "
                        f"(R{abs(var['variance_zar']):.2f}) — likely {cause.replace('_', ' ')}. "
                        f"Can you confirm?"
                    ),
                    "agentEstimate": round(
                        (var["counted_qty"] / max(var["system_qty_on_hand"], 1)) * 100
                    ),
                    "timestamp": "just now",
                    "priority":  priority,
                    "confidence": conf,
                })
                aid += 1

    # Order alerts from reorder_level
    for _, row in products_df.iterrows():
        sku = row.name
        qty = system.get(sku, 0)
        if qty <= row["reorder_level"]:
            alerts.append({
                "id":           aid,
                "type":         "order",
                "sku":          sku,
                "name":         row["product_name"],
                "message":      (
                    f"Stock ({qty} units) is at or below the reorder level ({row['reorder_level']}). "
                    f"Recommend ordering {row['reorder_qty']} units."
                ),
                "suggestedQty": int(row["reorder_qty"]),
                "estimatedCost": round(float(row["unit_cost_zar"]) * float(row["reorder_qty"]), 2),
                "timestamp":    "now",
                "priority":     "high" if qty == 0 else "medium",
            })
            aid += 1

    return alerts


# ── request / response models ──────────────────────────────────────────────────
class DeliveryRequest(BaseModel):
    sku: str
    qty: int
    supplier: Optional[str] = "Manual entry"
    notes: Optional[str] = ""

class ServiceRequest(BaseModel):
    service_label: str
    # {sku: qty_used}
    usage: dict[str, int]

class RunAgentRequest(BaseModel):
    model: Optional[str] = None


# ── routes ─────────────────────────────────────────────────────────────────────

@app.get("/api/stock")
def get_stock():
    """Return all products with live system stock levels and status."""
    return build_stock_items(get_data())


@app.get("/api/evidence")
def get_evidence():
    """Return build_evidence() output: variances, data_issues, totals."""
    D = get_data()
    ev = build_evidence(D)
    return {k: v for k, v in ev.items() if not k.startswith("_")}


@app.get("/api/findings")
def get_findings():
    if not FINDINGS.exists():
        return {"findings": []}
    return json.loads(FINDINGS.read_text(encoding="utf-8"))


@app.get("/api/report")
def get_report():
    if not REPORT.exists():
        return {"report": "", "available": False}
    return {"report": REPORT.read_text(encoding="utf-8"), "available": True}


@app.get("/api/alerts")
def get_alerts():
    findings = get_findings().get("findings", [])
    try:
        D  = get_data()
        ev = build_evidence(D)
    except Exception as e:
        return {"alerts": [], "error": str(e)}
    return {"alerts": derive_alerts(ev, findings)}


@app.get("/api/products/{sku}/sales")
def get_sales(sku: str, days: int = 14):
    D     = get_data()
    sales = D["sales"]
    s     = sales[sales["sku"] == sku]
    if s.empty:
        raise HTTPException(404, f"No sales data for SKU {sku}")
    cutoff = sales["date"].max() - pd.Timedelta(days=days)
    s = s[s["date"] > cutoff]
    return {
        "sku":        sku,
        "days":       days,
        "total_sold": int(s["qty_sold"].sum()),
        "avg_per_day": round(float(s["qty_sold"].sum()) / days, 1),
        "daily": [{"date": str(r.date.date()), "qty": int(r.qty_sold)} for r in s.itertuples()],
    }


@app.get("/api/products/{sku}/deliveries")
def get_deliveries(sku: str, days: int = 30):
    D    = get_data()
    deliv = D["deliv"]
    d    = deliv[deliv["sku"] == sku]
    cutoff = deliv["date"].max() - pd.Timedelta(days=days)
    d    = d[d["date"] > cutoff]
    return {
        "sku":            sku,
        "days":           days,
        "total_received": int(d["qty_received"].sum()),
        "deliveries": [
            {"date": str(r.date.date()), "qty": int(r.qty_received), "supplier": r.supplier}
            for r in d.itertuples()
        ],
    }


@app.get("/api/location/{location}/variances")
def get_location_variances(location: str):
    D  = get_data()
    ev = build_evidence(D)
    df = ev["_df"]
    loc = df[(df["location"].str.lower() == location.lower()) & (df["variance_units"] != 0)]
    return {
        "location": location,
        "items": [
            {
                "sku":            r.sku,
                "product":        r.product_name,
                "variance_units": int(r.variance_units),
                "variance_zar":   float(r.variance_zar),
            }
            for r in loc.itertuples()
        ],
    }


@app.post("/api/delivery")
def record_delivery(req: DeliveryRequest):
    """Add stock to the system_stock CSV for a SKU."""
    csv_path = DATA_DIR / "system_stock.csv"
    df = pd.read_csv(csv_path)

    mask = df["sku"] == req.sku
    if not mask.any():
        raise HTTPException(404, f"SKU {req.sku} not found in system_stock")

    df.loc[mask, "system_qty_on_hand"] = df.loc[mask, "system_qty_on_hand"] + req.qty
    df.to_csv(csv_path, index=False)

    # Also append to deliveries.csv so the agent can see it
    deliv_path = DATA_DIR / "deliveries.csv"
    new_row = pd.DataFrame([{
        "date":          str(date.today()),
        "supplier":      req.supplier,
        "sku":           req.sku,
        "qty_received":  req.qty,
        "unit_cost_zar": 0,   # unknown at point of entry; agent ignores cost here
    }])
    new_row.to_csv(deliv_path, mode="a", header=False, index=False)

    get_data(force=True)   # bust the cache
    new_qty = int(df.loc[mask, "system_qty_on_hand"].iloc[0])
    return {"status": "ok", "sku": req.sku, "new_qty": new_qty}


@app.post("/api/service")
def record_service(req: ServiceRequest):
    """
    Deduct estimated product usage from system_stock for each SKU in the usage map.
    usage = {"BRD001": 2, "MLK001": 1}
    """
    csv_path = DATA_DIR / "system_stock.csv"
    df = pd.read_csv(csv_path)

    updates = []
    for sku, qty_used in req.usage.items():
        mask = df["sku"] == sku
        if not mask.any():
            continue
        current = int(df.loc[mask, "system_qty_on_hand"].iloc[0])
        new_qty  = max(current - qty_used, 0)
        df.loc[mask, "system_qty_on_hand"] = new_qty
        updates.append({"sku": sku, "used": qty_used, "new_qty": new_qty})

    df.to_csv(csv_path, index=False)
    get_data(force=True)
    return {"status": "ok", "service": req.service_label, "updates": updates}


# ── agent run (streaming so the UI can show progress) ─────────────────────────
_agent_running = threading.Lock()

@app.post("/api/run-agent")
def run_agent_endpoint(req: RunAgentRequest):
    """
    Stream the agent's progress back as server-sent events.
    The frontend can show a live log while Gemini thinks.
    """
    if not _agent_running.acquire(blocking=False):
        raise HTTPException(409, "Agent is already running. Try again shortly.")

    model = req.model or os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")

    def stream():
        try:
            yield "data: {\"status\": \"loading_data\"}\n\n"
            D  = get_data(force=True)
            ev = build_evidence(D)
            n  = len(ev["variances"])
            yield f"data: {{\"status\": \"evidence_built\", \"variances\": {n}}}\n\n"

            yield f"data: {{\"status\": \"calling_ai\", \"model\": \"{model}\"}}\n\n"
            tools = make_tools(D, ev)
            text  = run_agent(ev, tools, model)

            yield "data: {\"status\": \"parsing\"}\n\n"
            findings = parse_findings(text)
            REPORT.write_text(text, encoding="utf-8")
            FINDINGS.write_text(json.dumps({"findings": findings}, indent=2), encoding="utf-8")

            payload = json.dumps({
                "status":        "done",
                "findings_count": len(findings),
                "total_losses_zar": ev["total_losses_zar"],
                "total_surplus_zar": ev["total_surplus_zar"],
            })
            yield f"data: {payload}\n\n"
        except Exception as e:
            yield f"data: {{\"status\": \"error\", \"message\": \"{str(e)[:200]}\"}}\n\n"
        finally:
            _agent_running.release()

    return StreamingResponse(stream(), media_type="text/event-stream")


@app.get("/api/score")
def get_score():
    if not FINDINGS.exists():
        raise HTTPException(404, "No findings.json yet. Run the agent first.")
    findings = {f["sku"]: f["cause"] for f in json.loads(FINDINGS.read_text())["findings"]}
    key      = pd.read_csv(DATA_DIR / "answer_key.csv")
    right    = 0
    details  = []
    for r in key.itertuples():
        said = findings.get(r.sku, "(missing)")
        ok   = said in ACCEPT.get(r.cause, {r.cause})
        right += ok
        details.append({"sku": r.sku, "true_cause": r.cause, "agent_said": said, "correct": ok})
    total = len(key)
    return {"score": right, "total": total, "pct": round(100 * right / total, 1), "details": details}


@app.get("/api/health")
def health():
    return {"status": "ok", "data_dir": str(DATA_DIR), "data_exists": DATA_DIR.exists()}
