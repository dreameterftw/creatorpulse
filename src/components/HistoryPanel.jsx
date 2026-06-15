import { useState, useEffect, useRef } from "react"
import { Clock, X, Trash2, ChevronRight } from "lucide-react"
import { getHistory, clearHistory, formatHistoryTime } from "../utils/history"

/**
 * HistoryPanel — slide-in panel showing previous results for a tool.
 *
 * Props:
 *   tool        — string key e.g. "rate_calculator"
 *   onRestore   — (entry) => void — called when user clicks a history item
 *   renderEntry — (entry) => ReactNode — how to render each history item preview
 */
export default function HistoryPanel({ tool, onRestore, renderEntry }) {
  const [open, setOpen]       = useState(false)
  const [entries, setEntries] = useState([])
  const panelRef              = useRef()

  useEffect(() => {
    if (open) setEntries(getHistory(tool))
  }, [open, tool])

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const handleClear = () => {
    clearHistory(tool)
    setEntries([])
  }

  const handleRestore = (entry) => {
    onRestore(entry)
    setOpen(false)
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.09)",
          color: "rgba(255,255,255,0.55)",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(0,242,254,0.35)"; e.currentTarget.style.color = "#00f2fe" }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"; e.currentTarget.style.color = "rgba(255,255,255,0.55)" }}
      >
        <Clock size={12} />
        History
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(3px)" }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide-in panel */}
      {open && (
        <div
          ref={panelRef}
          className="fixed right-0 top-0 h-full z-50 flex flex-col"
          style={{
            width: "min(420px, 100vw)",
            background: "#0f0e26",
            borderLeft: "1px solid rgba(255,255,255,0.08)",
            animation: "slideInRight 220ms cubic-bezier(0.34,1.2,0.64,1)",
          }}
        >
          <style>{`
            @keyframes slideInRight {
              from { transform: translateX(100%); opacity: 0; }
              to   { transform: translateX(0); opacity: 1; }
            }
          `}</style>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center gap-2">
              <Clock size={14} style={{ color: "#00f2fe" }} />
              <h2 className="text-white font-semibold text-[15px]">History</h2>
              {entries.length > 0 && (
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(0,242,254,0.1)", color: "#00f2fe", border: "1px solid rgba(0,242,254,0.2)" }}>
                  {entries.length}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {entries.length > 0 && (
                <button onClick={handleClear}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] transition-colors"
                  style={{ color: "#8a89a0", background: "rgba(255,255,255,0.04)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#ef4444" }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#8a89a0" }}
                >
                  <Trash2 size={11} /> Clear
                </button>
              )}
              <button onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                style={{ background: "rgba(255,255,255,0.06)", color: "#8a89a0" }}
                onMouseEnter={(e) => e.currentTarget.style.color = "white"}
                onMouseLeave={(e) => e.currentTarget.style.color = "#8a89a0"}
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-8">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <Clock size={20} style={{ color: "#8a89a0" }} />
                </div>
                <p className="text-white font-semibold text-[14px] mb-1">No history yet</p>
                <p className="text-[12px] leading-relaxed" style={{ color: "#8a89a0" }}>
                  Run the tool to see your previous results here.
                  Results are saved locally on this device.
                </p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                {entries.map((entry, i) => (
                  <button
                    key={i}
                    onClick={() => handleRestore(entry)}
                    className="w-full text-left px-5 py-4 transition-colors group"
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {renderEntry(entry)}
                        <p className="font-mono text-[10px] mt-1.5" style={{ color: "rgba(255,255,255,0.2)" }}>
                          {formatHistoryTime(entry.savedAt)}
                        </p>
                      </div>
                      <ChevronRight size={13} className="flex-shrink-0 mt-1 transition-transform group-hover:translate-x-0.5"
                        style={{ color: "#8a89a0" }} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="px-5 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <p className="text-[11px] text-center" style={{ color: "rgba(255,255,255,0.2)" }}>
              Saved locally · up to 10 entries per tool
            </p>
          </div>
        </div>
      )}
    </>
  )
}
