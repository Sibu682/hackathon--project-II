import { useState } from "react";
import { Package, AlertTriangle, TrendingDown, Scissors, Truck } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import StatCard from "../components/StatCard";
import StockTable from "../components/StockTable";
import AlertPanel from "../components/AlertPanel";
import ActivityFeed from "../components/ActivityFeed";
import { UsageBarChart, StockTrendChart } from "../components/Charts";
import { DeliveryModal, ServiceModal } from "../components/InputModal";
import AgentRunner from "../components/AgentRunner";
import { weeklyUsageData, stockTrendData } from "../data/mockData";

export default function Dashboard({
  stock = [], activity = [], alerts = [], evidence = null,
  backendOk = false, onDelivery, onService, onAgentDone,
}) {
  const { isDark } = useTheme();
  const [showDelivery, setShowDelivery] = useState(false);
  const [showService,  setShowService]  = useState(false);

  const criticalCount = stock.filter((i) => i.status === "critical").length;
  const totalValue    = stock.reduce((sum, i) => sum + i.currentStock * i.unitCost, 0);
  const healthyPct    = stock.length
    ? Math.round((stock.filter((i) => i.status === "healthy").length / stock.length) * 100)
    : 0;

  const totalLosses  = evidence?.total_losses_zar  ?? 0;
  const totalSurplus = evidence?.total_surplus_zar ?? 0;

  return (
    <div className="space-y-6">

      {/* Welcome banner */}
      <div className="relative rounded-2xl overflow-hidden gradient-bg p-6">
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 0%, transparent 50%), radial-gradient(circle at 80% 20%, white 0%, transparent 40%)" }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-white/80 text-sm font-medium">Welcome back 👋</p>
            <h1 className="text-2xl font-bold text-white mt-0.5">So Convenient</h1>
            <p className="text-white/70 text-sm mt-1">
              {backendOk ? "Live data · AI agent ready" : "Demo mode · Start backend for live data"}
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <div className="text-center bg-white/20 rounded-xl px-4 py-3">
              <p className="text-2xl font-bold text-white">{healthyPct}%</p>
              <p className="text-white/70 text-xs">Stock Health</p>
            </div>
            <div className="text-center bg-white/20 rounded-xl px-4 py-3">
              <p className="text-2xl font-bold text-white">{alerts.length}</p>
              <p className="text-white/70 text-xs">Alerts</p>
            </div>
            {evidence && (
              <div className="text-center bg-white/20 rounded-xl px-4 py-3">
                <p className="text-2xl font-bold text-white">R{Math.abs(totalLosses).toFixed(0)}</p>
                <p className="text-white/70 text-xs">Losses</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setShowService(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-xl gradient-bg text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-indigo-500/20">
          <Scissors size={16} /> Record Service
        </button>
        <button
          onClick={() => setShowDelivery(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-xl gradient-green text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-green-500/20">
          <Truck size={16} /> Record Delivery
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Items"  value={stock.length}
          subtitle="products tracked" gradient="gradient-bg" icon={Package}
          trend="up" trendValue="Live from backend" />
        <StatCard title="Critical" value={criticalCount}
          subtitle="Need action" gradient="gradient-red" icon={AlertTriangle}
          trend={criticalCount > 0 ? "down" : "up"}
          trendValue={criticalCount > 0 ? `${criticalCount} urgent` : "All clear"} />
        <StatCard title="Stock Value" value={`R${(totalValue / 1000).toFixed(1)}k`}
          subtitle="Current estimate" gradient="gradient-green" icon={TrendingDown}
          trend="up" trendValue="Estimated" />
        <StatCard title="Variance" value={`R${Math.abs(totalLosses).toFixed(0)}`}
          subtitle={evidence ? `Surplus R${totalSurplus.toFixed(0)}` : "Run agent to calculate"}
          gradient="gradient-blue" icon={AlertTriangle}
          trend="down" trendValue="From last count" />
      </div>

      {/* AI Agent runner */}
      {backendOk && <AgentRunner onDone={onAgentDone} />}

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <StockTable items={stock} />
        </div>
        <div>
          <AlertPanel alerts={alerts} />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UsageBarChart data={weeklyUsageData} />
        <StockTrendChart data={stockTrendData} />
      </div>

      <ActivityFeed activities={activity} />

      {/* Modals */}
      {showDelivery && (
        <DeliveryModal
          stock={stock}
          backendOk={backendOk}
          onConfirm={(sku, qty, supplier) => {
            onDelivery(sku, qty, supplier);
            setShowDelivery(false);
          }}
          onClose={() => setShowDelivery(false)}
        />
      )}
      {showService && (
        <ServiceModal
          stock={stock}
          backendOk={backendOk}
          onConfirm={(label, usage) => {
            onService(label, usage);
            setShowService(false);
          }}
          onClose={() => setShowService(false)}
        />
      )}
    </div>
  );
}
