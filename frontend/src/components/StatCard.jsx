import { useTheme } from "../context/ThemeContext";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatCard({ title, value, subtitle, gradient, icon: Icon, trend, trendValue }) {
  const { isDark } = useTheme();

  return (
    <div className={`card-hover rounded-2xl p-5 relative overflow-hidden border
      ${isDark ? "bg-slate-800/60 border-slate-700/50" : "bg-white border-slate-200"}`}>

      {/* Background gradient blob */}
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 ${gradient}`} />

      <div className="flex items-start justify-between relative">
        <div>
          <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            {title}
          </p>
          <p className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
            {value}
          </p>
          <p className={`text-xs mt-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
            {subtitle}
          </p>
        </div>

        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${gradient}`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>

      {trend && (
        <div className={`flex items-center gap-1 mt-3 text-xs font-medium
          ${trend === "up" ? "text-green-500" : "text-red-500"}`}>
          {trend === "up" ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {trendValue}
        </div>
      )}
    </div>
  );
}
