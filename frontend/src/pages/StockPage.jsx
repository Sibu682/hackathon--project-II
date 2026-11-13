import { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import StockTable from "../components/StockTable";
import { DeliveryModal } from "../components/InputModal";
import { Search, Truck } from "lucide-react";

export default function StockPage({ stock, onDelivery }) {
  const { isDark } = useTheme();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showDelivery, setShowDelivery] = useState(false);

  const filtered = stock.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || item.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Stock Inventory</h1>
          <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Full view of all tracked products
          </p>
        </div>
        <button
          onClick={() => setShowDelivery(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-green text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-green-500/20 self-start sm:self-auto">
          <Truck size={15} />
          Record Delivery
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500
              ${isDark ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500" : "bg-white border-slate-200 text-slate-900 placeholder-slate-400"}`}
          />
        </div>
        <div className="flex gap-2">
          {["all", "healthy", "warning", "critical"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold capitalize transition-colors border
                ${filter === f
                  ? "gradient-bg text-white border-transparent"
                  : isDark ? "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <StockTable items={filtered} />

      {showDelivery && (
        <DeliveryModal
          stock={stock}
          onConfirm={(id, qty) => { onDelivery(id, qty); setShowDelivery(false); }}
          onClose={() => setShowDelivery(false)}
        />
      )}
    </div>
  );
}
