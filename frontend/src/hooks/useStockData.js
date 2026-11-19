import { useState, useEffect, useCallback } from "react";
import {
  getStock, getAlerts, getEvidence,
  recordDelivery as apiDelivery,
  recordService  as apiService,
} from "../api/client";

/**
 * Central data hook — fetches stock + alerts from the backend
 * and exposes mutation helpers (delivery, service).
 *
 * Falls back to the mock data if the backend isn't reachable
 * so the UI still looks good during development.
 */
import {
  stockItems as mockStock,
  alerts     as mockAlerts,
  recentActivity as mockActivity,
} from "../data/mockData";

export function useStockData() {
  const [stock,     setStock]     = useState(mockStock);
  const [alerts,    setAlerts]    = useState(mockAlerts);
  const [evidence,  setEvidence]  = useState(null);
  const [activity,  setActivity]  = useState(mockActivity);
  const [loading,   setLoading]   = useState(true);
  const [backendOk, setBackendOk] = useState(false);
  const [error,     setError]     = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [stockData, alertsData, evidenceData] = await Promise.all([
        getStock(),
        getAlerts(),
        getEvidence(),
      ]);
      setStock(stockData);
      setAlerts(alertsData);
      setEvidence(evidenceData);
      setBackendOk(true);
      setError(null);
    } catch (e) {
      // Backend not up yet — use mock data silently
      setBackendOk(false);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    // Poll every 30 seconds while the page is open
    const id = setInterval(fetchAll, 30_000);
    return () => clearInterval(id);
  }, [fetchAll]);

  // ── Delivery ────────────────────────────────────────────────────────────────
  const handleDelivery = useCallback(async (sku, qty, supplier) => {
    if (backendOk) {
      await apiDelivery(sku, qty, supplier);
      await fetchAll();                       // refresh from backend
    } else {
      // Optimistic local update (mock mode)
      setStock((prev) =>
        prev.map((item) => {
          if (item.sku !== sku && item.id !== sku) return item;
          const newStock = Math.min(item.currentStock + qty, item.maxStock);
          const pct = newStock / item.maxStock;
          return {
            ...item,
            currentStock: newStock,
            status: pct > 0.5 ? "healthy" : pct > 0.25 ? "warning" : "critical",
          };
        })
      );
    }
    const item = stock.find((i) => i.sku === sku || i.id === sku);
    setActivity((prev) => [
      {
        id:     Date.now(),
        action: "Delivery recorded",
        impact: `+${qty} units of ${item?.name || sku}`,
        time:   "just now",
        icon:   "package",
      },
      ...prev.slice(0, 9),
    ]);
  }, [backendOk, fetchAll, stock]);

  // ── Service ─────────────────────────────────────────────────────────────────
  const handleService = useCallback(async (serviceLabel, usageMap) => {
    // usageMap: { sku: qty } when talking to real backend
    //           { id:  qty } when in mock mode
    if (backendOk) {
      await apiService(serviceLabel, usageMap);
      await fetchAll();
    } else {
      setStock((prev) =>
        prev.map((item) => {
          const used = usageMap[item.id] || usageMap[item.sku] || 0;
          if (!used) return item;
          const newStock = Math.max(item.currentStock - used, 0);
          const pct = newStock / item.maxStock;
          return {
            ...item,
            currentStock: newStock,
            status: pct > 0.5 ? "healthy" : pct > 0.25 ? "warning" : "critical",
          };
        })
      );
    }
    setActivity((prev) => [
      {
        id:     Date.now(),
        action: `Service: ${serviceLabel}`,
        impact: `${Object.keys(usageMap).length} products deducted`,
        time:   "just now",
        icon:   "scissors",
      },
      ...prev.slice(0, 9),
    ]);
  }, [backendOk, fetchAll]);

  return {
    stock, alerts, evidence, activity,
    loading, backendOk, error,
    refetch: fetchAll,
    handleDelivery,
    handleService,
  };
}
