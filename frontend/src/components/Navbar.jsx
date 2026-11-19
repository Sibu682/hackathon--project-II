import { Sun, Moon, Bell, Store, Menu, X } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useState } from "react";

export default function Navbar({ alertCount, businessName, onMenuToggle }) {
  const { isDark, toggle } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-4 md:px-8 border-b
      ${isDark
        ? "bg-[#0a0f1e]/90 border-slate-800 backdrop-blur-md"
        : "bg-white/90 border-slate-200 backdrop-blur-md"
      }`}>

      {/* Left — logo + business name */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className={`md:hidden p-2 rounded-lg ${isDark ? "hover:bg-slate-800" : "hover:bg-slate-100"}`}>
          <Menu size={20} className={isDark ? "text-slate-300" : "text-slate-600"} />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
            <Store size={16} className="text-white" />
          </div>
          <div>
            <p className={`text-sm font-bold leading-tight ${isDark ? "text-white" : "text-slate-900"}`}>
              StockSense AI
            </p>
            <p className={`text-xs leading-tight ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              So Convenient
            </p>
          </div>
        </div>
      </div>

      {/* Right — theme toggle + notifications */}
      <div className="flex items-center gap-2">

        {/* Theme toggle */}
        <button
          onClick={toggle}
          className={`relative w-14 h-7 rounded-full transition-all duration-300 focus:outline-none
            ${isDark ? "bg-indigo-600" : "bg-slate-200"}`}>
          <span className={`absolute top-0.5 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm
            ${isDark ? "left-7 bg-white" : "left-0.5 bg-white"}`}>
            {isDark
              ? <Moon size={12} className="text-indigo-600" />
              : <Sun size={12} className="text-amber-500" />
            }
          </span>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative p-2 rounded-lg transition-colors
              ${isDark ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-100 text-slate-600"}`}>
            <Bell size={20} />
            {alertCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center pulse-alert font-bold">
                {alertCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className={`absolute right-0 top-12 w-72 rounded-xl shadow-2xl border p-4 z-50
              ${isDark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"}`}>
              <div className="flex items-center justify-between mb-3">
                <p className={`font-semibold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>
                  Alerts
                </p>
                <button onClick={() => setShowNotifications(false)}>
                  <X size={14} className={isDark ? "text-slate-400" : "text-slate-500"} />
                </button>
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-2 p-2 rounded-lg bg-red-500/10">
                  <span className="w-2 h-2 mt-1.5 rounded-full bg-red-500 flex-shrink-0" />
                  <p className="text-xs text-red-500 font-medium">Cotton Pads critically low — action needed</p>
                </div>
                <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-500/10">
                  <span className="w-2 h-2 mt-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                  <p className={`text-xs font-medium ${isDark ? "text-amber-400" : "text-amber-600"}`}>Razors at 36% — confirm stock level</p>
                </div>
                <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-500/10">
                  <span className="w-2 h-2 mt-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                  <p className={`text-xs font-medium ${isDark ? "text-amber-400" : "text-amber-600"}`}>Hair Gel approaching reorder point</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
