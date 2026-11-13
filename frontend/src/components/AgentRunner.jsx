import { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { Bot, Play, CheckCircle, AlertCircle, Loader, X, ChevronDown, ChevronUp } from "lucide-react";
import { runAgent } from "../api/client";

const STATUS_LABELS = {
  loading_data:    "Loading CSV data…",
  evidence_built:  "Evidence pack built…",
  calling_ai:      "Asking the AI agent…",
  parsing:         "Parsing findings…",
  done:            "Analysis complete!",
  error:           "Something went wrong",
};

export default function AgentRunner({ onDone }) {
  const { isDark } = useTheme();
  const [open,   setOpen]   = useState(false);
  const [log,    setLog]    = useState([]);
  const [status, setStatus] = useState("idle");  // idle | running | done | error
  const [result, setResult] = useState(null);

  const start = () => {
    setLog([]);
    setStatus("running");
    setResult(null);

    const stop = runAgent((event) => {
      setLog((prev) => [...prev, event]);
      if (event.status === "done") {
        setStatus("done");
        setResult(event);
        onDone?.();
      } else if (event.status === "error") {
        setStatus("error");
      }
    });

    return stop;
  };

  const isRunning = status === "running";

  return (
    <div className={`rounded-2xl border overflow-hidden
      ${isDark ? "bg-slate-800/60 border-slate-700/50" : "bg-white border-slate-200"}`}>

      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between px-5 py-4 ${isDark ? "hover:bg-slate-700/40" : "hover:bg-slate-50"} transition-colors`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center">
            <Bot size={16} className="text-white" />
          </div>
          <div className="text-left">
            <p className={`font-semibold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>AI Stock Analysis</p>
            <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Run the Gemini agent to investigate all stock gaps
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {status === "done" && <CheckCircle size={16} className="text-green-500" />}
          {status === "error" && <AlertCircle size={16} className="text-red-500" />}
          {isRunning && <Loader size={16} className="text-indigo-400 animate-spin" />}
          {open ? <ChevronUp size={16} className={isDark ? "text-slate-400" : "text-slate-500"} />
                : <ChevronDown size={16} className={isDark ? "text-slate-400" : "text-slate-500"} />}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4">
          {/* Run button */}
          <button
            onClick={start}
            disabled={isRunning}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-opacity
              ${isRunning ? "opacity-50 cursor-not-allowed gradient-bg" : "gradient-bg hover:opacity-90"}`}>
            {isRunning
              ? <><Loader size={14} className="animate-spin" /> Agent running…</>
              : <><Play size={14} /> Run Agent Now</>
            }
          </button>

          {/* Live log */}
          {log.length > 0 && (
            <div className={`rounded-xl p-3 space-y-1.5 font-mono text-xs
              ${isDark ? "bg-slate-900/60" : "bg-slate-50"}`}>
              {log.map((e, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className={
                    e.status === "done"  ? "text-green-500" :
                    e.status === "error" ? "text-red-500"   : "text-indigo-400"
                  }>›</span>
                  <span className={isDark ? "text-slate-300" : "text-slate-700"}>
                    {STATUS_LABELS[e.status] || e.status}
                    {e.variances !== undefined && ` (${e.variances} gaps found)`}
                    {e.model     && ` using ${e.model}`}
                    {e.message   && `: ${e.message}`}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Result summary */}
          {status === "done" && result && (
            <div className={`rounded-xl p-4 ${isDark ? "bg-green-500/10 border border-green-500/20" : "bg-green-50 border border-green-200"}`}>
              <p className="text-green-500 font-semibold text-sm mb-2">Analysis complete</p>
              <div className={`grid grid-cols-3 gap-3 text-xs ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                <div>
                  <p className={isDark ? "text-slate-500" : "text-slate-400"}>Findings</p>
                  <p className="font-bold text-base">{result.findings_count}</p>
                </div>
                <div>
                  <p className={isDark ? "text-slate-500" : "text-slate-400"}>Losses</p>
                  <p className="font-bold text-base text-red-400">R{Math.abs(result.total_losses_zar).toFixed(2)}</p>
                </div>
                <div>
                  <p className={isDark ? "text-slate-500" : "text-slate-400"}>Surplus</p>
                  <p className="font-bold text-base text-green-500">R{result.total_surplus_zar.toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
