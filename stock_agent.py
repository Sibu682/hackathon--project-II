#!/usr/bin/env python3
"""
Stock-taking agent for a small shop, powered by the Gemini API.

How it works
  1. Python does the maths: compares system stock to the physical count, values gaps at cost.
  2. Gemini investigates each gap. It can call TOOLS (sales history, deliveries, product info,
     other gaps in the same location) before deciding the likely cause.
  3. You get a plain-language report for the owner (stock_report.md) and machine-readable
     findings (findings.json) that can be scored against answer_key.csv.

Setup
  pip install -r requirements.txt
  export GEMINI_API_KEY="your-key"        (Windows PowerShell: $env:GEMINI_API_KEY="your-key")

Run
  python stock_agent.py --dry-run         # no API call: shows the evidence the agent receives
  python stock_agent.py                   # full run with Gemini
  python stock_agent.py --score           # score findings.json against data/answer_key.csv
"""
import argparse, json, os, re, sys, time
from pathlib import Path
import pandas as pd
from dotenv import load_dotenv

load_dotenv()

DEFAULT_MODEL = os.environ.get("GEMINI_MODEL", "gemini-3.5-flash")

CAUSES = ["theft_suspected", "expired_or_spoiled", "damaged", "unrecorded_delivery",
          "miscount", "mislocated", "pricing_error", "unclear",
          "not_in_system", "duplicate_line", "not_counted"]

SYSTEM_PROMPT = f"""You are a stock-take assistant for a small South African spaza / convenience shop.
You receive an evidence pack comparing the system's stock figures to a physical count on the shelves.
Prices are in rand (ZAR).

YOUR JOB: for every product with a variance, and every entry in "data_issues", work out the most
likely cause and tell the owner what to do.

You have tools. USE THEM before concluding on anything that is not obvious:
- get_sales_history(sku): did sales look normal? any weekend spikes?
- get_deliveries(sku): was stock received recently?
- get_product_info(sku): shelf life, cost, price, location
- get_location_variances(location): are several products in the same spot short? (theft pattern)

Allowed causes (use these exact words): {", ".join(CAUSES)}

Guidance:
- counted HIGHER than system: usually unrecorded_delivery (also cash-and-carry purchases, customer returns)
  or mislocated stock. If the system shows 0 but the shelf has stock, a delivery was probably never captured.
- counted LOWER than system: theft_suspected (small, high-value, easy-to-pocket items, items near the till or door,
  or several short items in one location), expired_or_spoiled (perishables, or notes say so),
  damaged (breakable or bulky items, or notes say so), miscount (small gap on heavy or bulk items).
- Never recalculate numbers. Use variance_units and variance_zar exactly as given.
- If the evidence is thin, use "unclear" and recommend a recount. Do not guess.
- Give each finding a confidence: high, medium or low.
- Data issues: duplicate_line (same product counted twice), not_in_system (new product), not_counted (missed on the sheet).

OUTPUT FORMAT (exactly this order):
1. A 3-sentence summary for the owner, with total losses in rand.
2. A markdown table: Product | Gap (units / R) | Likely cause | Confidence | Action.
3. The top 3 things to do this week.
4. Finally a fenced json block, and nothing after it, in this shape:
```json
{{"findings": [{{"sku": "DRK001", "cause": "theft_suspected", "confidence": "high"}}]}}
```
Include one entry per variance product AND one per data issue. Use plain, friendly language."""


# ---------------------------------------------------------------- data + maths (no AI here)
def load_data(folder):
    f = Path(folder)
    return {
        "products": pd.read_csv(f / "products.csv"),
        "system":   pd.read_csv(f / "system_stock.csv"),
        "count":    pd.read_csv(f / "physical_count.csv"),
        "sales":    pd.read_csv(f / "sales_log.csv", parse_dates=["date"]),
        "deliv":    pd.read_csv(f / "deliveries.csv", parse_dates=["date"]),
    }


def build_evidence(D):
    products, system, count, sales, deliv = (D[k] for k in ("products", "system", "count", "sales", "deliv"))
    issues = []

    for sku in count[count.duplicated("sku", keep=False)]["sku"].unique():
        issues.append({"sku": sku, "issue": "duplicate_line", "detail": "SKU counted more than once; first line used"})
    count = count.drop_duplicates("sku", keep="first")

    for _, r in count[~count["sku"].isin(products["sku"])].iterrows():
        issues.append({"sku": r["sku"], "issue": "not_in_system", "detail": f"counted {r['counted_qty']}; note: {r['notes']}"})

    for _, r in system[~system["sku"].isin(count["sku"])].iterrows():
        issues.append({"sku": r["sku"], "issue": "not_counted", "detail": f"system says {r['system_qty_on_hand']}"})

    df = products.merge(system, on="sku").merge(count[["sku", "counted_qty", "notes"]], on="sku")
    df["variance_units"] = df["counted_qty"] - df["system_qty_on_hand"]
    df["variance_zar"] = (df["variance_units"] * df["unit_cost_zar"]).round(2)

    last_day = sales["date"].max()
    s7 = sales[sales["date"] > last_day - pd.Timedelta(days=7)].groupby("sku")["qty_sold"].sum()
    d7 = deliv[deliv["date"] > last_day - pd.Timedelta(days=7)].groupby("sku")["qty_received"].sum()
    avg30 = sales.groupby("sku")["qty_sold"].sum() / 30
    df["sold_last_7d"] = df["sku"].map(s7).fillna(0).astype(int)
    df["received_last_7d"] = df["sku"].map(d7).fillna(0).astype(int)
    df["avg_daily_sales"] = df["sku"].map(avg30).fillna(0).round(1)

    flagged = df[df["variance_units"] != 0].copy()
    flagged["abs_zar"] = flagged["variance_zar"].abs()
    flagged = flagged.sort_values("abs_zar", ascending=False)

    cols = ["sku", "product_name", "category", "location", "shelf_life_days", "system_qty_on_hand",
            "counted_qty", "variance_units", "variance_zar", "sold_last_7d", "received_last_7d",
            "avg_daily_sales", "notes"]
    return {
        "count_date": str(last_day.date()),
        "total_variance_zar": round(float(df["variance_zar"].sum()), 2),
        "total_losses_zar": round(float(df.loc[df["variance_zar"] < 0, "variance_zar"].sum()), 2),
        "total_surplus_zar": round(float(df.loc[df["variance_zar"] > 0, "variance_zar"].sum()), 2),
        "data_issues": issues,
        "variances": flagged[cols].fillna("").to_dict("records"),
        "_df": df,  # full table for the tools; stripped before sending to the model
    }


# ---------------------------------------------------------------- tools the agent can call
def make_tools(D, evidence):
    """Each function's name, type hints and docstring are what Gemini sees. Keep them clear."""
    products, sales, deliv, df = D["products"], D["sales"], D["deliv"], evidence["_df"]

    def get_product_info(sku: str) -> dict:
        """Get details for one product: name, category, supplier, cost and selling price in rand,
        shelf life in days, shelf location, and reorder level."""
        row = products[products["sku"] == sku]
        if row.empty:
            return {"error": f"Unknown SKU {sku}"}
        return {k: (v.item() if hasattr(v, "item") else v) for k, v in row.iloc[0].to_dict().items()}

    def get_sales_history(sku: str, days: int = 14) -> dict:
        """Get daily units sold for one product over the last N days (default 14), with the average per day."""
        s = sales[sales["sku"] == sku]
        cutoff = sales["date"].max() - pd.Timedelta(days=days)
        s = s[s["date"] > cutoff]
        return {"sku": sku, "days": days, "total_sold": int(s["qty_sold"].sum()),
                "avg_per_day": round(float(s["qty_sold"].sum()) / days, 1),
                "daily": [{"date": str(r.date.date()), "qty": int(r.qty_sold)} for r in s.itertuples()]}

    def get_deliveries(sku: str, days: int = 30) -> dict:
        """Get recorded supplier deliveries for one product over the last N days (default 30).
        Only deliveries that were captured in the system appear here."""
        d = deliv[deliv["sku"] == sku]
        cutoff = deliv["date"].max() - pd.Timedelta(days=days)
        d = d[d["date"] > cutoff]
        return {"sku": sku, "days": days, "total_received": int(d["qty_received"].sum()),
                "deliveries": [{"date": str(r.date.date()), "qty": int(r.qty_received), "supplier": r.supplier}
                               for r in d.itertuples()]}

    def get_location_variances(location: str) -> dict:
        """List every product with a stock gap in one shelf location (for example 'Fridge', 'Counter',
        'Shelf B'). Useful for spotting theft patterns: several short items in the same spot."""
        loc = df[(df["location"].str.lower() == location.lower()) & (df["variance_units"] != 0)]
        return {"location": location,
                "items": [{"sku": r.sku, "product": r.product_name, "variance_units": int(r.variance_units),
                           "variance_zar": float(r.variance_zar)} for r in loc.itertuples()]}

    return [get_product_info, get_sales_history, get_deliveries, get_location_variances]


# ---------------------------------------------------------------- the agent (Gemini)
def run_agent(evidence, tools, model):
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        sys.exit("No API key found. Set it first:\n  export GEMINI_API_KEY='your-key'   (Mac/Linux)\n"
                 "  $env:GEMINI_API_KEY='your-key'      (Windows PowerShell)\nGet a free key at https://aistudio.google.com/apikey")
    try:
        from google import genai
        from google.genai import types
    except ImportError:
        sys.exit("Missing package. Run:  pip install google-genai pandas")

    client = genai.Client(api_key=api_key)
    config = types.GenerateContentConfig(
        system_instruction=SYSTEM_PROMPT,
        tools=tools,                       # the SDK runs the tool-calling loop for us
        temperature=0.2,
        automatic_function_calling=types.AutomaticFunctionCallingConfig(maximum_remote_calls=40),
    )
    payload = {k: v for k, v in evidence.items() if not k.startswith("_")}
    prompt = "Here is tonight's stock-take evidence pack:\n" + json.dumps(payload, indent=2, default=str)

    for attempt in range(4):
        try:
            resp = client.models.generate_content(model=model, contents=prompt, config=config)
            return resp.text
        except Exception as e:  # rate limits / overloaded servers: wait and retry
            msg = str(e)
            if any(code in msg for code in ("429", "500", "503")) and attempt < 3:
                wait = 5 * (attempt + 1)
                print(f"  API busy ({msg[:60]}...). Retrying in {wait}s")
                time.sleep(wait)
                continue
            if "404" in msg or "not found" in msg.lower():
                sys.exit(f"Model '{model}' was not found. Try another:  python stock_agent.py --model gemini-3-flash-preview")
            raise


def parse_findings(text):
    m = re.findall(r"```json\s*(\{.*?\})\s*```", text, re.S)
    if not m:
        return []
    try:
        return json.loads(m[-1]).get("findings", [])
    except json.JSONDecodeError:
        return []


# ---------------------------------------------------------------- scoring against the answer key
ACCEPT = {
    "theft_suspected": {"theft_suspected"},
    "spoilage": {"expired_or_spoiled"}, "expired": {"expired_or_spoiled"},
    "damaged": {"damaged"},
    "unrecorded_delivery": {"unrecorded_delivery"},
    "miscount": {"miscount"},
    "miscount_or_unrecorded_return": {"miscount", "unrecorded_delivery"},
    "pricing_or_ring_up_error": {"pricing_error", "miscount"},
    "mislocated": {"mislocated"},
    "not_in_system": {"not_in_system"}, "duplicate_line": {"duplicate_line"}, "not_counted": {"not_counted"},
}


def score(findings_path, key_path):
    findings = {f["sku"]: f["cause"] for f in json.loads(Path(findings_path).read_text())["findings"]}
    key = pd.read_csv(key_path)
    right = 0
    print(f"{'SKU':8} {'TRUE CAUSE':32} {'AGENT SAID':22} RESULT")
    for r in key.itertuples():
        said = findings.get(r.sku, "(missing)")
        ok = said in ACCEPT.get(r.cause, {r.cause})
        right += ok
        print(f"{r.sku:8} {r.cause:32} {said:22} {'OK' if ok else 'WRONG'}")
    print(f"\nScore: {right}/{len(key)} = {100 * right / len(key):.0f}%")


# ---------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser(description="Gemini-powered stock-taking agent")
    ap.add_argument("--data", default="data", help="folder with the CSV files (default: data)")
    ap.add_argument("--model", default=DEFAULT_MODEL, help=f"Gemini model (default: {DEFAULT_MODEL})")
    ap.add_argument("--dry-run", action="store_true", help="show the evidence and skip the API call")
    ap.add_argument("--score", action="store_true", help="score findings.json against answer_key.csv")
    a = ap.parse_args()

    if a.score:
        return score("findings.json", Path(a.data) / "answer_key.csv")

    D = load_data(a.data)
    evidence = build_evidence(D)
    n, issues = len(evidence["variances"]), len(evidence["data_issues"])
    print(f"Count date {evidence['count_date']}: {n} products with gaps, {issues} data issues, "
          f"losses R{abs(evidence['total_losses_zar']):,.2f}, surplus R{evidence['total_surplus_zar']:,.2f}")

    if a.dry_run:
        print(json.dumps({k: v for k, v in evidence.items() if not k.startswith('_')}, indent=2, default=str)[:3000], "\n...")
        tools = make_tools(D, evidence)
        print("\nTool check:", tools[1]("DRK001", 3)["avg_per_day"], "avg Coke cans/day;",
              len(tools[3]("Fridge")["items"]), "gaps in the Fridge")
        return

    print(f"Asking Gemini ({a.model}) to investigate...")
    text = run_agent(evidence, make_tools(D, evidence), a.model)
    Path("stock_report.md").write_text(text, encoding="utf-8")
    findings = parse_findings(text)
    Path("findings.json").write_text(json.dumps({"findings": findings}, indent=2), encoding="utf-8")
    print("\n" + text)
    print(f"\nSaved stock_report.md and findings.json ({len(findings)} findings). "
          f"Run `python stock_agent.py --score` to check it against the answer key.")


if __name__ == "__main__":
    main()
