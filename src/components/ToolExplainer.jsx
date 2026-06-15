/**
 * ToolExplainer — collapsible "How this works" section
 * shown at the top of every AI tool page.
 */
import { useState } from "react"
import { ChevronDown, Info } from "lucide-react"

export default function ToolExplainer({ title, what, how, steps, tip }) {
  const [open, setOpen] = useState(false)

  return (
    <div
      className="rounded-xl mb-7 overflow-hidden transition-all duration-300"
      style={{ background: "rgba(0,242,254,0.04)", border: "1px solid rgba(0,242,254,0.12)" }}
    >
      {/* Header row — always visible */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(0,242,254,0.15)", border: "1px solid rgba(0,242,254,0.25)" }}>
            <Info size={11} style={{ color: "#00f2fe" }} />
          </div>
          <span className="text-[12px] font-semibold" style={{ color: "rgba(255,255,255,0.6)" }}>
            How {title} works
          </span>
        </div>
        <ChevronDown
          size={13}
          style={{
            color: "#8a89a0",
            transform: open ? "rotate(180deg)" : "rotate(0)",
            transition: "transform 200ms",
          }}
        />
      </button>

      {/* Expandable content */}
      {open && (
        <div className="px-5 pb-5 space-y-4" style={{ borderTop: "1px solid rgba(0,242,254,0.08)" }}>
          {/* What it does */}
          <div className="pt-4">
            <p className="font-mono text-[10px] tracking-widest uppercase mb-1.5" style={{ color: "#00f2fe" }}>
              WHAT IT DOES
            </p>
            <p className="text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>{what}</p>
          </div>

          {/* How to use */}
          {steps && steps.length > 0 && (
            <div>
              <p className="font-mono text-[10px] tracking-widest uppercase mb-2" style={{ color: "#ef2cc1" }}>
                HOW TO USE IT
              </p>
              <ol className="space-y-1.5">
                {steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[13px]" style={{ color: "rgba(255,255,255,0.5)" }}>
                    <span
                      className="flex-shrink-0 w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center mt-0.5"
                      style={{ background: "rgba(239,44,193,0.12)", color: "#ef2cc1" }}
                    >{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Pro tip */}
          {tip && (
            <div className="px-3.5 py-2.5 rounded-lg text-[12px] leading-relaxed"
              style={{ background: "rgba(252,76,2,0.07)", border: "1px solid rgba(252,76,2,0.15)", color: "rgba(255,255,255,0.45)" }}>
              <span style={{ color: "#fc4c02" }}>💡 Tip: </span>{tip}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
