import { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { Bot, CheckCircle, XCircle, ShoppingCart, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";

function ConfirmAlert({ alert, onConfirm, onCorrect, isDark }) {
  const [expanded, setExpanded] = useState(false);
  const [correction, setCorrection] = useState("");

  return (
    <div className={`rounded-xl border p-4 glow-amber
      ${isDark ? "bg-amber-500/5 border-amber-500/20" : "bg-amber-50 border-amber-200"}`}>

      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg gradient-amber flex items-center justify-center flex-shrink-0">
          <Bot size={14} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className={`text-sm font-semibold ${isDark ? "text-amber-400" : "text-amber-700"}`}>
              {alert.name}
            </p>
            <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? "bg-amber-500/20 text-amber-400" : "bg-amber-100 text-amber-600"}`}>
              Confirm
            </span>
          </div>
          <p className={`text-xs mt-1 leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
            {alert.message}
          </p>
          <p className={`text-xs mt-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>{alert.timestamp}</p>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={() => onConfirm(alert.id)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-semibold transition-colors">
          <CheckCircle size={13} /> Yes, correct
        </button>
        <button
          onClick={() => setExpanded(!expanded)}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors border
            ${isDark ? "border-slate-600 text-slate-300 hover:bg-slate-700" : "border-slate-300 text-slate-600 hover:bg-slate-100"}`}>
          <HelpCircle size={13} />
          Not quite
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {expanded && (
        <div className="mt-3">
          <p className={`text-xs mb-1.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            What's the actual level? (%)
          </p>
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              max="100"
              value={correction}
              onChange={(e) => setCorrection(e.target.value)}
              placeholder="e.g. 75"
              className={`flex-1 px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500
                ${isDark ? "bg-slate-700 border-slate-600 text-white placeholder-slate-500" : "bg-white border-slate-300 text-slate-900 placeholder-slate-400"}`}
            />
            <button
              onClick={() => onCorrect(alert.id, correction)}
              className="px-4 py-2 rounded-lg gradient-bg text-white text-xs font-semibold">
              Update
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function OrderAlert({ alert, onApprove, onDismiss, isDark }) {
  const isHigh = alert.priority === "high";
  return (
    <div className={`rounded-xl border p-4 ${isHigh ? "glow-red" : "glow-amber"}
      ${isHigh
        ? isDark ? "bg-red-500/5 border-red-500/20" : "bg-red-50 border-red-200"
        : isDark ? "bg-amber-500/5 border-amber-500/20" : "bg-amber-50 border-amber-200"
      }`}>

      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isHigh ? "gradient-red" : "gradient-amber"}`}>
          <ShoppingCart size={14} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className={`text-sm font-semibold ${isHigh
              ? isDark ? "text-red-400" : "text-red-700"
              : isDark ? "text-amber-400" : "text-amber-700"}`}>
              {alert.name}
            </p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isHigh
              ? isDark ? "bg-red-500/20 text-red-400" : "bg-red-100 text-red-600"
              : isDark ? "bg-amber-500/20 text-amber-400" : "bg-amber-100 text-amber-600"}`}>
              {isHigh ? "Urgent" : "Order"}
            </span>
          </div>
          <p className={`text-xs mt-1 leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
            {alert.message}
          </p>
          <div className={`flex items-center gap-3 mt-1.5 text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            <span>Qty: <strong>{alert.suggestedQty}</strong></span>
            <span>Est. cost: <strong className="text-green-500">R{alert.estimatedCost?.toFixed(2)}</strong></span>
            <span>{alert.timestamp}</span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={() => onApprove(alert.id)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg gradient-blue text-white text-xs font-semibold transition-opacity hover:opacity-90">
          <ShoppingCart size={13} /> Approve Order
        </button>
        <button
          onClick={() => onDismiss(alert.id)}
          className={`flex items-center justify-center px-3 py-2 rounded-lg text-xs font-semibold transition-colors
            ${isDark ? "bg-slate-700 text-slate-400 hover:bg-slate-600" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
          <XCircle size={13} />
        </button>
      </div>
    </div>
  );
}

export default function AlertPanel({ alerts: initialAlerts }) {
  const { isDark } = useTheme();
  const [alerts, setAlerts] = useState(initialAlerts);

  const dismiss = (id) => setAlerts(alerts.filter((a) => a.id !== id));

  return (
    <div className={`rounded-2xl border overflow-hidden
      ${isDark ? "bg-slate-800/60 border-slate-700/50" : "bg-white border-slate-200"}`}>

      <div className="p-5 border-b flex items-center justify-between"
        style={{ borderColor: isDark ? "#1e293b" : "#e2e8f0" }}>
        <div>
          <h2 className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
            Agent Alerts
          </h2>
          <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Human-in-the-loop confirmations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Agent active</span>
        </div>
      </div>

      <div className="p-4 space-y-3 max-h-[520px] overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="text-center py-10">
            <CheckCircle size={32} className="mx-auto text-green-500 mb-2" />
            <p className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-600"}`}>
              All clear!
            </p>
            <p className={`text-xs mt-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              No pending actions
            </p>
          </div>
        ) : (
          alerts.map((alert) =>
            alert.type === "confirm" ? (
              <ConfirmAlert
                key={alert.id}
                alert={alert}
                onConfirm={dismiss}
                onCorrect={dismiss}
                isDark={isDark}
              />
            ) : (
              <OrderAlert
                key={alert.id}
                alert={alert}
                onApprove={dismiss}
                onDismiss={dismiss}
                isDark={isDark}
              />
            )
          )
        )}
      </div>
    </div>
  );
}
