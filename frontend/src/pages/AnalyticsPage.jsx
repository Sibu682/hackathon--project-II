import { useTheme } from "../context/ThemeContext";
import { UsageBarChart, StockTrendChart } from "../components/Charts";
import { weeklyUsageData, stockTrendData } from "../data/mockData";

export default function AnalyticsPage() {
  const { isDark } = useTheme();
  return (
    <div className="space-y-6">
      <div>
        <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Analytics</h1>
        <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          Usage trends and stock depletion forecasts
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UsageBarChart data={weeklyUsageData} />
        <StockTrendChart data={stockTrendData} />
      </div>
    </div>
  );
}
