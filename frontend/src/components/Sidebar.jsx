import { LayoutDashboard, Package, Bell, TrendingUp, Settings, ChevronRight, Scissors } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", id: "dashboard" },
  { icon: Package, label: "Stock", id: "stock" },
  { icon: Bell, label: "Alerts", id: "alerts", badge: 4 },
  { icon: TrendingUp, label: "Analytics", id: "analytics" },
  { icon: Settings, label: "Settings", id: "settings" },
];

export default function Sidebar({ activePage, onNavigate, isOpen, onClose }) {
  const { isDark } = useTheme();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 z-40 flex flex-col border-r transition-transform duration-300
        ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        ${isDark ? "bg-[#0a0f1e] border-slate-800" : "bg-white border-slate-200"}`}>

        {/* Business badge */}
        <div className={`mx-4 mt-6 mb-4 p-3 rounded-xl ${isDark ? "bg-slate-800/60" : "bg-slate-50"}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg gradient-bg flex items-center justify-center flex-shrink-0">
              <Scissors size={18} className="text-white" />
            </div>
            <div>
              <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>So Convenient</p>
              <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Soweto, JHB</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Agent active</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map(({ icon: Icon, label, id, badge }) => (
            <button
              key={id}
              onClick={() => { onNavigate(id); onClose(); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${activePage === id
                  ? isDark
                    ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                    : "bg-indigo-50 text-indigo-600 border border-indigo-200"
                  : isDark
                    ? "text-slate-400 hover:text-white hover:bg-slate-800"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}>
              <div className="flex items-center gap-3">
                <Icon size={18} />
                {label}
              </div>
              <div className="flex items-center gap-2">
                {badge && (
                  <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {badge}
                  </span>
                )}
                {activePage === id && <ChevronRight size={14} />}
              </div>
            </button>
          ))}
        </nav>

        {/* Bottom status */}
        <div className={`mx-4 mb-6 p-3 rounded-xl ${isDark ? "bg-slate-800/40" : "bg-slate-50"}`}>
          <p className={`text-xs font-medium mb-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Stock Health</p>
          <div className={`w-full rounded-full h-2 ${isDark ? "bg-slate-700" : "bg-slate-200"}`}>
            <div className="h-2 rounded-full gradient-green w-[68%]" />
          </div>
          <p className={`text-xs mt-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>68% — 2 items need attention</p>
        </div>
      </aside>
    </>
  );
}
