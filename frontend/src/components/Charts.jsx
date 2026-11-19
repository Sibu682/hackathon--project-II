import { useTheme } from "../context/ThemeContext";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";

const CustomTooltip = ({ active, payload, label, isDark }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={`px-3 py-2 rounded-xl shadow-lg border text-xs
      ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`}>
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

export function UsageBarChart({ data }) {
  const { isDark } = useTheme();
  const grid = isDark ? "#1e293b" : "#f1f5f9";
  const axis = isDark ? "#475569" : "#94a3b8";

  return (
    <div className={`rounded-2xl border p-5
      ${isDark ? "bg-slate-800/60 border-slate-700/50" : "bg-white border-slate-200"}`}>
      <h2 className={`font-semibold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>Weekly Service Volume</h2>
      <p className={`text-xs mb-4 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Haircuts per day — drives stock deductions</p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={grid} />
          <XAxis dataKey="day" tick={{ fill: axis, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: axis, fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip isDark={isDark} />} />
          <Bar dataKey="haircuts" name="Haircuts" fill="url(#barGrad)" radius={[4, 4, 0, 0]} />
          <defs>
            <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#667eea" />
              <stop offset="100%" stopColor="#764ba2" />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StockTrendChart({ data }) {
  const { isDark } = useTheme();
  const grid = isDark ? "#1e293b" : "#f1f5f9";
  const axis = isDark ? "#475569" : "#94a3b8";

  return (
    <div className={`rounded-2xl border p-5
      ${isDark ? "bg-slate-800/60 border-slate-700/50" : "bg-white border-slate-200"}`}>
      <h2 className={`font-semibold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>Stock Depletion Trend</h2>
      <p className={`text-xs mb-4 ${isDark ? "text-slate-400" : "text-slate-500"}`}>4-week estimated decline for key items (%)</p>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={grid} />
          <XAxis dataKey="week" tick={{ fill: axis, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fill: axis, fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip isDark={isDark} />} />
          <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
          <Line type="monotone" dataKey="spirits" name="Spirits" stroke="#667eea" strokeWidth={2} dot={{ r: 3, fill: "#667eea" }} />
          <Line type="monotone" dataKey="cotton" name="Cotton Pads" stroke="#ef4444" strokeWidth={2} dot={{ r: 3, fill: "#ef4444" }} />
          <Line type="monotone" dataKey="razors" name="Razors" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3, fill: "#f59e0b" }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
