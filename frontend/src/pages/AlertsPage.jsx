import { useTheme } from "../context/ThemeContext";
import AlertPanel from "../components/AlertPanel";

export default function AlertsPage({ alerts = [] }) {
  const { isDark } = useTheme();
  return (
    <div className="space-y-6">
      <div>
        <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Agent Alerts</h1>
        <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          Review and respond to AI recommendations
        </p>
      </div>
      <div className="max-w-2xl">
        <AlertPanel alerts={alerts} />
      </div>
    </div>
  );
}
