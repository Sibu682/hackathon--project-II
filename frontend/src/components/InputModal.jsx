import { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { X, Package, Scissors, Plus, Minus, CheckCircle } from "lucide-react";

// ── Delivery Modal ──────────────────────────────────────────────
export function DeliveryModal({ stock, backendOk = false, onConfirm, onClose }) {
  const { isDark } = useTheme();
  const [selectedId, setSelectedId] = useState("");
  const [qty, setQty] = useState("");
  const [supplier, setSupplier] = useState("");
  const [done, setDone] = useState(false);

  // backend uses SKU, mock mode uses numeric id
  const selected = stock.find((i) =>
    backendOk ? i.sku === selectedId : i.id === parseInt(selectedId)
  );

  const handleSubmit = () => {
    if (!selected || !qty || parseInt(qty) <= 0) return;
    // Pass SKU to backend, id to mock
    const key = backendOk ? selected.sku : selected.id;
    onConfirm(key, parseInt(qty), supplier || "Manual entry");
    setDone(true);
    setTimeout(() => { setDone(false); onClose(); }, 1200);
  };

  const inputClass = `w-full px-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500
    ${isDark ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400" : "bg-white border-slate-300 text-slate-900 placeholder-slate-400"}`;

  return (
    <ModalShell title="Record Delivery" icon={<Package size={18} className="text-white" />} gradient="gradient-blue" onClose={onClose} isDark={isDark}>
      {done ? (
        <SuccessBanner message={`+${qty} ${selected?.unit} of ${selected?.name} added`} />
      ) : (
        <div className="space-y-4">
          <div>
            <label className={labelClass(isDark)}>Product received</label>
            <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className={inputClass}>
              <option value="">Select a product…</option>
              {stock.map((item) => (
                <option key={item.sku} value={backendOk ? item.sku : item.id}>
                  {item.name} — current: {item.currentStock} {item.unit}
                </option>
              ))}
            </select>
          </div>

          {selected && (
            <div className={`rounded-xl p-3 text-xs ${isDark ? "bg-slate-700/60" : "bg-slate-50"}`}>
              <div className="flex justify-between">
                <span className={isDark ? "text-slate-400" : "text-slate-500"}>Current stock</span>
                <span className={`font-semibold ${isDark ? "text-white" : "text-slate-800"}`}>{selected.currentStock} {selected.unit}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className={isDark ? "text-slate-400" : "text-slate-500"}>Max capacity</span>
                <span className={`font-semibold ${isDark ? "text-white" : "text-slate-800"}`}>{selected.maxStock} {selected.unit}</span>
              </div>
              {qty && parseInt(qty) > 0 && (
                <div className="flex justify-between mt-1 pt-1 border-t" style={{ borderColor: isDark ? "#334155" : "#e2e8f0" }}>
                  <span className="text-green-500 font-medium">After delivery</span>
                  <span className="text-green-500 font-semibold">
                    {Math.min(selected.currentStock + parseInt(qty), selected.maxStock)} {selected.unit}
                  </span>
                </div>
              )}
            </div>
          )}

          <div>
            <label className={labelClass(isDark)}>Quantity received ({selected?.unit || "units"})</label>
            <div className="flex items-center gap-2">
              <button onClick={() => setQty((v) => Math.max(0, (parseInt(v) || 0) - 1).toString())}
                className={`w-10 h-10 rounded-xl flex items-center justify-center border ${isDark ? "bg-slate-700 border-slate-600 text-white" : "bg-slate-100 border-slate-200 text-slate-700"}`}>
                <Minus size={14} />
              </button>
              <input
                type="number" min="0" value={qty}
                onChange={(e) => setQty(e.target.value)}
                placeholder="0"
                className={`${inputClass} text-center`}
              />
              <button onClick={() => setQty((v) => ((parseInt(v) || 0) + 1).toString())}
                className={`w-10 h-10 rounded-xl flex items-center justify-center border ${isDark ? "bg-slate-700 border-slate-600 text-white" : "bg-slate-100 border-slate-200 text-slate-700"}`}>
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div>
            <label className={labelClass(isDark)}>Supplier (optional)</label>
            <input
              type="text"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="e.g. Unity Wholesale"
              className={inputClass}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!selected || !qty || parseInt(qty) <= 0}
            className="w-full py-3 rounded-xl gradient-blue text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity">
            Confirm Delivery
          </button>
        </div>
      )}
    </ModalShell>
  );
}

// ── Service Modal ───────────────────────────────────────────────
const PRESET_SERVICES = [
  { label: "Haircut", usage: { 1: 10, 2: 2, 3: 1, 7: 5 } },
  { label: "Shave", usage: { 1: 15, 2: 3, 3: 2 } },
  { label: "Wash & Cut", usage: { 1: 10, 2: 2, 4: 15, 3: 1 } },
  { label: "Custom", usage: {} },
];

export function ServiceModal({ stock, backendOk = false, onConfirm, onClose }) {
  const { isDark } = useTheme();
  const [selectedService, setSelectedService] = useState(PRESET_SERVICES[0]);
  const [customUsage, setCustomUsage] = useState({});
  const [done, setDone] = useState(false);

  const isCustom = selectedService.label === "Custom";
  const activeUsage = isCustom ? customUsage : selectedService.usage;

  const handleSubmit = () => {
    if (Object.values(activeUsage).every((v) => !v || v === 0)) return;
    // Backend expects {sku: qty}, mock mode expects {id: qty}
    let usageToSend = activeUsage;
    if (backendOk && !isCustom) {
      // Map numeric id keys from preset to SKU keys
      usageToSend = {};
      for (const [idStr, qty] of Object.entries(activeUsage)) {
        const item = stock.find((i) => i.id === parseInt(idStr));
        if (item && qty > 0) usageToSend[item.sku] = qty;
      }
    }
    onConfirm(selectedService.label, usageToSend);
    setDone(true);
    setTimeout(() => { setDone(false); onClose(); }, 1200);
  };

  const usedItems = stock.filter((i) => activeUsage[i.id] > 0);

  return (
    <ModalShell title="Record Service" icon={<Scissors size={18} className="text-white" />} gradient="gradient-bg" onClose={onClose} isDark={isDark}>
      {done ? (
        <SuccessBanner message={`${selectedService.label} recorded — stock updated`} />
      ) : (
        <div className="space-y-4">
          {/* Service picker */}
          <div>
            <label className={labelClass(isDark)}>Service type</label>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_SERVICES.map((s) => (
                <button key={s.label} onClick={() => setSelectedService(s)}
                  className={`py-2 px-3 rounded-xl text-sm font-medium border transition-all
                    ${selectedService.label === s.label
                      ? "gradient-bg text-white border-transparent"
                      : isDark ? "bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Usage preview for presets */}
          {!isCustom && usedItems.length > 0 && (
            <div className={`rounded-xl p-3 space-y-1.5 ${isDark ? "bg-slate-700/60" : "bg-slate-50"}`}>
              <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Products used
              </p>
              {usedItems.map((item) => (
                <div key={item.id} className="flex justify-between text-xs">
                  <span className={isDark ? "text-slate-300" : "text-slate-600"}>{item.name}</span>
                  <span className="text-red-400 font-semibold">−{activeUsage[item.id]} {item.unit}</span>
                </div>
              ))}
            </div>
          )}

          {/* Custom usage inputs */}
          {isCustom && (
            <div className={`rounded-xl p-3 space-y-2 ${isDark ? "bg-slate-700/60" : "bg-slate-50"}`}>
              <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Enter usage per product
              </p>
              {stock.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <span className={`flex-1 text-xs truncate ${isDark ? "text-slate-300" : "text-slate-600"}`}>{item.name}</span>
                  <input
                    type="number" min="0"
                    value={customUsage[item.id] || ""}
                    onChange={(e) => {
                      const v = parseInt(e.target.value) || 0;
                      setCustomUsage((prev) => ({ ...prev, [item.id]: v }));
                    }}
                    placeholder="0"
                    className={`w-20 px-2 py-1.5 rounded-lg text-xs text-center border focus:outline-none focus:ring-1 focus:ring-indigo-500
                      ${isDark ? "bg-slate-600 border-slate-500 text-white placeholder-slate-400" : "bg-white border-slate-300 text-slate-900"}`}
                  />
                  <span className={`text-xs w-8 ${isDark ? "text-slate-500" : "text-slate-400"}`}>{item.unit}</span>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={Object.values(activeUsage).every((v) => !v || v === 0)}
            className="w-full py-3 rounded-xl gradient-bg text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity">
            Record Service
          </button>
        </div>
      )}
    </ModalShell>
  );
}

// ── Shared helpers ──────────────────────────────────────────────
function ModalShell({ title, icon, gradient, onClose, isDark, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className={`relative w-full max-w-md rounded-2xl shadow-2xl border overflow-hidden
        ${isDark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"}`}>

        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 ${gradient}`}>
          <div className="flex items-center gap-2">
            {icon}
            <h2 className="text-white font-semibold">{title}</h2>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function SuccessBanner({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-3">
      <div className="w-14 h-14 rounded-full gradient-green flex items-center justify-center">
        <CheckCircle size={28} className="text-white" />
      </div>
      <p className="text-sm font-semibold text-green-500 text-center">{message}</p>
    </div>
  );
}

const labelClass = (isDark) =>
  `block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? "text-slate-400" : "text-slate-500"}`;
