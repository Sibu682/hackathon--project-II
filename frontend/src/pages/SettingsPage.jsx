import { useTheme } from "../context/ThemeContext";
import { useState } from "react";
import { Save, Store, Scissors, Plus, Trash2 } from "lucide-react";

const businessTypes = ["Barbershop", "Salon", "Bakery", "Spaza Shop", "Restaurant", "Other"];

export default function SettingsPage() {
  const { isDark } = useTheme();
  const [businessName, setBusinessName] = useState("So Convenient");
  const [businessType, setBusinessType] = useState("Barbershop");
  const [reorderThreshold, setReorderThreshold] = useState(25);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const inputClass = `w-full px-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500
    ${isDark ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500" : "bg-white border-slate-200 text-slate-900"}`;

  const labelClass = `block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? "text-slate-400" : "text-slate-500"}`;

  const cardClass = `rounded-2xl border p-6 ${isDark ? "bg-slate-800/60 border-slate-700/50" : "bg-white border-slate-200"}`;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Settings</h1>
        <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          Configure your business profile and agent behaviour
        </p>
      </div>

      {/* Business profile */}
      <div className={cardClass}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center">
            <Store size={16} className="text-white" />
          </div>
          <h2 className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Business Profile</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className={labelClass}>Business Name</label>
            <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Business Type</label>
            <select
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              className={inputClass}>
              {businessTypes.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className={labelClass}>Location</label>
            <input type="text" defaultValue="Soweto, Johannesburg" className={inputClass} />
          </div>
        </div>
      </div>

      {/* Agent settings */}
      <div className={cardClass}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl gradient-green flex items-center justify-center">
            <Scissors size={16} className="text-white" />
          </div>
          <h2 className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Agent Behaviour</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className={labelClass}>Reorder Threshold (%)</label>
            <div className="flex items-center gap-4">
              <input
                type="range" min="10" max="50" value={reorderThreshold}
                onChange={(e) => setReorderThreshold(Number(e.target.value))}
                className="flex-1 accent-indigo-500"
              />
              <span className={`text-sm font-bold w-10 text-center ${isDark ? "text-white" : "text-slate-900"}`}>
                {reorderThreshold}%
              </span>
            </div>
            <p className={`text-xs mt-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              Agent will suggest an order when stock drops below this level
            </p>
          </div>

          <div>
            <label className={labelClass}>Confirmation Threshold (%)</label>
            <div className="flex items-center gap-4">
              <input type="range" min="40" max="70" defaultValue={50} className="flex-1 accent-amber-500" />
              <span className={`text-sm font-bold w-10 text-center ${isDark ? "text-white" : "text-slate-900"}`}>50%</span>
            </div>
            <p className={`text-xs mt-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              Agent will ask you to confirm stock level at this point
            </p>
          </div>

          <div>
            <label className={labelClass}>Order Frequency</label>
            <select className={inputClass} defaultValue="monthly">
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="asneeded">As needed only</option>
            </select>
          </div>
        </div>
      </div>

      {/* API key */}
      <div className={cardClass}>
        <h2 className={`font-semibold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>Grok API Key</h2>
        <div>
          <label className={labelClass}>API Key</label>
          <input
            type="password"
            defaultValue="xai-••••••••••••••••••••••"
            className={inputClass}
          />
          <p className={`text-xs mt-1.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
            Get your key at <a href="https://console.x.ai" target="_blank" rel="noreferrer" className="text-indigo-400 underline">console.x.ai</a>. Never share this.
          </p>
        </div>
      </div>

      <button
        onClick={handleSave}
        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all
          ${saved ? "bg-green-500" : "gradient-bg hover:opacity-90"}`}>
        <Save size={16} />
        {saved ? "Saved!" : "Save Settings"}
      </button>
    </div>
  );
}
