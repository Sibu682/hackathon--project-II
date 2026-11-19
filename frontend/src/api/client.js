/**
 * Central API client — all backend calls go through here.
 * Base URL is set via the VITE_API_URL env var, defaults to localhost:8000.
 */
const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `API error ${res.status}`);
  }
  return res.json();
}

// ── Stock ─────────────────────────────────────────────────────────────────────
export const getStock    = ()         => request("/api/stock");
export const getEvidence = ()         => request("/api/evidence");
export const getAlerts   = ()         => request("/api/alerts").then((r) => r.alerts);
export const getFindings = ()         => request("/api/findings").then((r) => r.findings);
export const getReport   = ()         => request("/api/report");
export const getScore    = ()         => request("/api/score");

export const getSalesHistory  = (sku, days = 14) => request(`/api/products/${sku}/sales?days=${days}`);
export const getDeliveries    = (sku, days = 30) => request(`/api/products/${sku}/deliveries?days=${days}`);
export const getLocationVars  = (loc)            => request(`/api/location/${encodeURIComponent(loc)}/variances`);

// ── Mutations ─────────────────────────────────────────────────────────────────
export const recordDelivery = (sku, qty, supplier = "Manual entry", notes = "") =>
  request("/api/delivery", {
    method: "POST",
    body: JSON.stringify({ sku, qty, supplier, notes }),
  });

export const recordService = (service_label, usage) =>
  request("/api/service", {
    method: "POST",
    body: JSON.stringify({ service_label, usage }),
  });

// ── Agent (SSE stream) ────────────────────────────────────────────────────────
/**
 * Run the AI agent and stream progress updates.
 * onEvent(event) is called for each SSE message with a parsed JSON object.
 * Returns a cleanup function to abort the stream.
 */
export function runAgent(onEvent, model) {
  const ctrl = new AbortController();

  fetch(`${BASE}/api/run-agent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: model || null }),
    signal: ctrl.signal,
  })
    .then(async (res) => {
      const reader = res.body.getReader();
      const dec    = new TextDecoder();
      let   buf    = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop();
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try { onEvent(JSON.parse(line.slice(6))); } catch {}
          }
        }
      }
    })
    .catch((e) => {
      if (e.name !== "AbortError") onEvent({ status: "error", message: e.message });
    });

  return () => ctrl.abort();
}
