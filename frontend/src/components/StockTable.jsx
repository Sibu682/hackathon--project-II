import { useTheme } from "../context/ThemeContext";
import { AlertTriangle, CheckCircle, XCircle, MapPin } from "lucide-react";

function StatusBadge({ status }) {
  const configs = {
    healthy: { label: "Healthy", color: "text-green-500 bg-green-500/10 border-green-500/20" },
    warning: { label: "Low", color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
    critical: { label: "Critical", color: "text-red-500 bg-red-500/10 border-red-500/20" },
  };
  const { label, color } = configs[status] || configs.healthy;
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${color}`}>
      {label}
    </span>
  );
}

function StockBar({ current, max, status }) {
  const percent = Math.round((current / max) * 100);
  const barColor = {
    healthy: "gradient-green",
    warning: "gradient-amber",
    critical: "gradient-red",
  }[status];

  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor} stock-bar`}
          style={{ "--fill-width": `${percent}%`, width: `${percent}%` }}
        />
      </div>
      <span className="text-xs font-mono font-semibold w-8 text-right" style={{
        color: status === "critical" ? "#ef4444" : status === "warning" ? "#f59e0b" : "#22c55e"
      }}>
        {percent}%
      </span>
    </div>
  );
}

export default function StockTable({ items }) {
  const { isDark } = useTheme();

  const statusIcon = {
    healthy: <CheckCircle size={14} className="text-green-500" />,
    warning: <AlertTriangle size={14} className="text-amber-500" />,
    critical: <XCircle size={14} className="text-red-500" />,
  };

  return (
    <div className={`rounded-2xl border overflow-hidden
      ${isDark ? "bg-slate-800/60 border-slate-700/50" : "bg-white border-slate-200"}`}>

      <div className="p-5 border-b flex items-center justify-between"
        style={{ borderColor: isDark ? "#1e293b" : "#e2e8f0" }}>
        <div>
          <h2 className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Stock Inventory</h2>
          <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            {items.length} items tracked · AI-estimated levels
          </p>
        </div>
        <div className="flex gap-3 text-xs">
          <span className="flex items-center gap-1 text-green-500"><span className="w-2 h-2 rounded-full bg-green-500" />Healthy</span>
          <span className="flex items-center gap-1 text-amber-500"><span className="w-2 h-2 rounded-full bg-amber-500" />Low</span>
          <span className="flex items-center gap-1 text-red-500"><span className="w-2 h-2 rounded-full bg-red-500" />Critical</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className={`text-xs uppercase tracking-wider ${isDark ? "text-slate-500 bg-slate-900/40" : "text-slate-400 bg-slate-50"}`}>
              <th className="text-left px-5 py-3 font-medium">Product</th>
              <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Location</th>
              <th className="text-left px-4 py-3 font-medium">Stock Level</th>
              <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Qty</th>
              <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Cost/Unit</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: isDark ? "#1e293b" : "#f1f5f9" }}>
            {items.map((item) => (
              <tr key={item.id}
                className={`transition-colors ${isDark ? "hover:bg-slate-700/30" : "hover:bg-slate-50"}
                  ${item.status === "critical" ? "glow-red" : ""}`}>

                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    {statusIcon[item.status]}
                    <div>
                      <p className={`font-medium ${isDark ? "text-white" : "text-slate-900"}`}>{item.name}</p>
                      <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>{item.sku} · {item.category}</p>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-3.5 hidden md:table-cell">
                  <div className="flex items-center gap-1">
                    <MapPin size={12} className={isDark ? "text-slate-500" : "text-slate-400"} />
                    <span className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{item.location}</span>
                  </div>
                </td>

                <td className="px-4 py-3.5">
                  <StockBar current={item.currentStock} max={item.maxStock} status={item.status} />
                </td>

                <td className="px-4 py-3.5 hidden sm:table-cell">
                  <span className={`text-xs font-mono ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                    {item.currentStock.toLocaleString()} / {item.maxStock.toLocaleString()} {item.unit}
                  </span>
                </td>

                <td className="px-4 py-3.5 hidden lg:table-cell">
                  <span className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    R{item.unitCost.toFixed(2)}
                  </span>
                </td>

                <td className="px-4 py-3.5">
                  <StatusBadge status={item.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
