import { useTheme } from "../context/ThemeContext";
import { Scissors, Package, CheckCircle, Bell } from "lucide-react";

const iconMap = {
  scissors: Scissors,
  package: Package,
  check: CheckCircle,
  bell: Bell,
};

const colorMap = {
  scissors: "gradient-bg",
  package: "gradient-blue",
  check: "gradient-green",
  bell: "gradient-amber",
};

export default function ActivityFeed({ activities }) {
  const { isDark } = useTheme();

  return (
    <div className={`rounded-2xl border overflow-hidden
      ${isDark ? "bg-slate-800/60 border-slate-700/50" : "bg-white border-slate-200"}`}>

      <div className="p-5 border-b" style={{ borderColor: isDark ? "#1e293b" : "#e2e8f0" }}>
        <h2 className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Recent Activity</h2>
        <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Live stock deductions</p>
      </div>

      <div className="p-4 space-y-1">
        {activities.map((activity, index) => {
          const Icon = iconMap[activity.icon] || Bell;
          const gradient = colorMap[activity.icon] || "gradient-bg";
          return (
            <div key={activity.id}
              className={`flex items-start gap-3 p-3 rounded-xl transition-colors
                ${isDark ? "hover:bg-slate-700/30" : "hover:bg-slate-50"}`}>

              {/* Timeline dot + line */}
              <div className="flex flex-col items-center">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${gradient}`}>
                  <Icon size={12} className="text-white" />
                </div>
                {index < activities.length - 1 && (
                  <div className={`w-px flex-1 mt-1 min-h-[12px] ${isDark ? "bg-slate-700" : "bg-slate-200"}`} />
                )}
              </div>

              <div className="flex-1 min-w-0 pb-2">
                <p className={`text-sm font-medium ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                  {activity.action}
                </p>
                <p className={`text-xs mt-0.5 truncate ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                  {activity.impact}
                </p>
                <p className={`text-xs mt-0.5 ${isDark ? "text-slate-600" : "text-slate-300"}`}>
                  {activity.time}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
