import { useState, useEffect, useRef } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "../firebase/config"
import { useAuth } from "../context/AuthContext"
import { useFitScore } from "../hooks/useFitScore"
import { sanitizeInput } from "../utils/sanitize"
import AppShell from "../components/AppShell"
import UsageBadge from "../components/UsageBadge"
import ToolExplainer from "../components/ToolExplainer"
import {
  Sparkles, ChevronDown, AlertTriangle, TrendingUp,
  Target, RotateCcw, Copy, Check, X
} from "lucide-react"

/* ─────────────────────────────────────────────
   AMBIENT GLOW — color shifts with score tier
───────────────────────────────────────────── */
function ScoreGlow({ score }) {
  const accent =
    score == null ? "#00f2fe"
    : score >= 70  ? "#22d3a5"
    : score >= 50  ? "#fc4c02"
    : "#ef2cc1"

  return (
    <>
      <div className="pointer-events-none fixed top-[-80px] right-[-60px] w-[380px] h-[380px] rounded-full transition-all duration-1000"
        style={{ background: `radial-gradient(circle, ${accent} 0%, transparent 70%)`, filter: "blur(80px)", opacity: 0.07 }} />
      <div className="pointer-events-none fixed bottom-[-60px] left-[-40px] w-[300px] h-[300px] rounded-full"
        style={{ background: "radial-gradient(circle, #ef2cc1 0%, transparent 70%)", filter: "blur(70px)", opacity: 0.055 }} />
    </>
  )
}

/* ─────────────────────────────────────────────
   ANIMATED SCORE RING
───────────────────────────────────────────── */
function ScoreRing({ score, animate }) {
  const [displayed, setDisplayed]   = useState(0)
  const [dashOffset, setDashOffset] = useState(339)
  const circumference = 339

  const color  = score >= 70 ? "#22d3a5" : score >= 50 ? "#fc4c02" : "#ef4444"
  const gradId = `rg-${score}`
  const tier   = score >= 70 ? "STRONG FIT" : score >= 50 ? "MODERATE FIT" : "WEAK FIT"

  useEffect(() => {
    if (!animate) return
    const duration = 1200
    const start    = performance.now()
    const tick = (now) => {
      const p    = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setDashOffset(circumference - (circumference * score * ease) / 100)
      setDisplayed(Math.round(score * ease))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [animate, score])

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: 200, height: 200 }}>
        <svg width="200" height="200" style={{ transform: "rotate(-90deg)" }}>
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={color} stopOpacity="0.35" />
              <stop offset="100%" stopColor={color} stopOpacity="1" />
            </linearGradient>
          </defs>
          <circle cx="100" cy="100" r="54" stroke="rgba(255,255,255,0.07)" strokeWidth="10" fill="transparent" />
          <circle
            cx="100" cy="100" r="54"
            stroke={`url(#${gradId})`}
            strokeWidth="10" fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 10px ${color}88)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display font-extrabold text-white tracking-tight" style={{ fontSize: 44, lineHeight: 1 }}>
            {displayed}
          </span>
          <span className="font-mono text-[9px] tracking-widest uppercase mt-1" style={{ color: "#8a89a0" }}>
            FIT INDEX
          </span>
        </div>
      </div>
      <div
        className="mt-4 px-4 py-1.5 rounded-full font-mono font-bold text-[11px] tracking-widest uppercase"
        style={{ background: `${color}20`, color, border: `1px solid ${color}40`, boxShadow: `0 0 16px ${color}25` }}
      >
        {tier}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   DIMENSION ROW — expandable
───────────────────────────────────────────── */
function DimRow({ dim, delay }) {
  const [expanded, setExpanded] = useState(false)
  const [barWidth, setBarWidth] = useState(0)
  const color = dim.score >= 70 ? "#22d3a5" : dim.score >= 50 ? "#fc4c02" : "#ef4444"

  useEffect(() => {
    const t = setTimeout(() => setBarWidth(dim.score), delay)
    return () => clearTimeout(t)
  }, [dim.score, delay])

  return (
    <div
      className="rounded-xl cursor-pointer transition-all duration-200"
      style={{
        background: expanded ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
        border: expanded ? `1px solid ${color}30` : "1px solid rgba(255,255,255,0.06)",
        padding: "14px 16px",
      }}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-semibold text-white">{dim.name}</span>
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-[13px]" style={{ color }}>{dim.score}/100</span>
              <ChevronDown
                size={14}
                style={{
                  color: "#8a89a0",
                  transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 200ms ease",
                }}
              />
            </div>
          </div>
          <div className="w-full h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
            <div
              className="h-1.5 rounded-full"
              style={{
                width: `${barWidth}%`,
                background: `linear-gradient(90deg, ${color}80, ${color})`,
                transition: "width 700ms cubic-bezier(0.34,1.2,0.64,1)",
                boxShadow: `0 0 8px ${color}55`,
              }}
            />
          </div>
        </div>
      </div>

      {expanded && (
        <div
          className="mt-3 pt-3 border-t grid grid-cols-2 gap-3"
          style={{ borderColor: "rgba(255,255,255,0.07)" }}
        >
          <div className="rounded-lg p-3" style={{ background: "rgba(34,211,165,0.07)", border: "1px solid rgba(34,211,165,0.15)" }}>
            <p className="font-mono text-[9px] tracking-widest uppercase mb-1.5" style={{ color: "#22d3a5" }}>POSITIVE</p>
            <p className="text-[12px] leading-relaxed" style={{ color: "rgba(255,255,255,0.8)" }}>{dim.positive}</p>
          </div>
          <div className="rounded-lg p-3" style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.15)" }}>
            <p className="font-mono text-[9px] tracking-widest uppercase mb-1.5" style={{ color: "#ef4444" }}>CONCERN</p>
            <p className="text-[12px] leading-relaxed" style={{ color: "rgba(255,255,255,0.8)" }}>{dim.concern}</p>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────
   COPY BUTTON — with success state
───────────────────────────────────────────── */
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const handle = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }
  return (
    <button
      onClick={handle}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono font-semibold border-0 transition-all duration-200"
      style={{
        background: copied ? "rgba(34,211,165,0.15)" : "rgba(255,255,255,0.06)",
        color: copied ? "#22d3a5" : "#8a89a0",
        border: copied ? "1px solid rgba(34,211,165,0.3)" : "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? "Copied!" : "Copy Summary"}
    </button>
  )
}

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
export default function FitScore() {
  const { user }    = useAuth()
  const { result, loading, error, usage, analyzeFit } = useFitScore()

  const [profile,          setProfile]          = useState(null)
  const [brandName,        setBrandName]        = useState("")
  const [brandDescription, setBrandDescription] = useState("")
  const [nameFocused,      setNameFocused]      = useState(false)
  const [descFocused,      setDescFocused]      = useState(false)
  const [ringAnimate,      setRingAnimate]      = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      const snap = await getDoc(doc(db, "users", user.uid))
      if (snap.exists()) setProfile(snap.data())
    }
    fetchProfile()
  }, [])

  useEffect(() => {
    if (result) {
      const t = setTimeout(() => setRingAnimate(true), 100)
      return () => clearTimeout(t)
    } else {
      setRingAnimate(false)
    }
  }, [result])

  const handleAnalyze = () => {
    if (!brandName.trim() || !profile || loading) return
    setRingAnimate(false)
    analyzeFit(
      profile,
      sanitizeInput(brandName, 100),
      sanitizeInput(brandDescription, 300)
    )
  }

  // Scroll to top + clear inputs so the user can type a new brand
  const handleReset = () => {
    setBrandName("")
    setBrandDescription("")
    setRingAnimate(false)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Re-run the exact same brand without clearing anything
  const handleReanalyze = () => {
    if (!brandName.trim() || !profile) return
    setRingAnimate(false)
    setTimeout(() => {
      analyzeFit(
        profile,
        sanitizeInput(brandName, 100),
        sanitizeInput(brandDescription, 300)
      )
    }, 50)
  }

  // Text block copied to clipboard via CopyButton
  const summaryText = result
    ? [
        `Brand Fit Score — ${brandName}`,
        `Overall: ${result.overallScore}/100 (${
          result.overallScore >= 70 ? "Strong Fit" : result.overallScore >= 50 ? "Moderate Fit" : "Weak Fit"
        })`,
        "",
        result.summary,
        "",
        "Dimensions:",
        ...(result.dimensions?.map((d) => `• ${d.name}: ${d.score}/100`) ?? []),
        "",
        "Negotiation Tips:",
        ...(result.negotiationTips?.map((t, i) => `${i + 1}. ${t}`) ?? []),
        "",
        "Watch Out For:",
        ...(result.dealBreakers?.map((b) => `• ${b}`) ?? []),
      ].join("\n")
    : ""

  const tierColor =
    result?.overallScore >= 70 ? "#22d3a5"
    : result?.overallScore >= 50 ? "#fc4c02"
    : "#ef4444"

  return (
    <AppShell>
      <ScoreGlow score={result?.overallScore ?? null} />

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="font-mono text-[10px] tracking-widest uppercase mb-2" style={{ color: "#8a89a0" }}>AI TOOL</p>
          <h1 className="font-display font-extrabold text-white text-3xl tracking-tight mb-1">Brand Fit Score</h1>
          <p className="text-[14px]" style={{ color: "#8a89a0" }}>Verify brand alignment before making a pitch.</p>
        </div>
        <UsageBadge usage={usage} />
      </div>

      <ToolExplainer
        title="Brand Fit Score"
        what="Before spending time writing a pitch, this tool checks how well you and a brand actually match — across 5 dimensions: audience overlap, niche relevance, platform alignment, engagement quality, and brand safety. It then tells you whether to pitch and what angle to use."
        steps={[
          "Type a brand name (e.g. Mamaearth, boAt, Zomato)",
          "Optionally add a short brand description for more accurate results",
          "Click Analyze — the AI scores your fit across 5 dimensions",
          "Check the Should Pitch / Skip banner for a clear yes or no",
          "If yes, use the Pitch Angle provided as your opening line",
        ]}
        tip="Adding a brand description (even one sentence) significantly improves accuracy. Try: 'D2C skincare brand targeting women 20-35, focused on natural ingredients.'"
      />

      {/* ── Input Card ── */}
      <div className="rounded-2xl p-6 mb-8" style={{ background: "#111026", border: "1px solid rgba(255,255,255,0.07)" }}>
        <p className="font-mono text-[10px] tracking-widest uppercase mb-5" style={{ color: "#8a89a0" }}>OUTREACH PARAMETERS</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div>
            <label className="block font-mono text-[10px] tracking-widest uppercase mb-2" style={{ color: "#8a89a0" }}>Brand Name *</label>
            <input
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
              onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
              placeholder="e.g. boAt, Mamaearth, Zomato"
              className="w-full px-4 py-3 rounded-xl text-[13px] text-white outline-none transition-all duration-200"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: nameFocused ? "1px solid rgba(0,242,254,0.5)" : "1px solid rgba(255,255,255,0.08)",
                boxShadow: nameFocused ? "0 0 0 3px rgba(0,242,254,0.1)" : "none",
              }}
            />
          </div>
          <div>
            <label className="block font-mono text-[10px] tracking-widest uppercase mb-2" style={{ color: "#8a89a0" }}>
              Description <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span>
            </label>
            <input
              value={brandDescription}
              onChange={(e) => setBrandDescription(e.target.value)}
              onFocus={() => setDescFocused(true)}
              onBlur={() => setDescFocused(false)}
              placeholder="e.g. D2C skincare brand targeting young professionals"
              className="w-full px-4 py-3 rounded-xl text-[13px] text-white outline-none transition-all duration-200"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: descFocused ? "1px solid rgba(0,242,254,0.5)" : "1px solid rgba(255,255,255,0.08)",
                boxShadow: descFocused ? "0 0 0 3px rgba(0,242,254,0.1)" : "none",
              }}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* PRIMARY — analyze */}
          <button
            onClick={handleAnalyze}
            disabled={loading || !brandName.trim()}
            className="flex items-center gap-2.5 px-6 py-3 rounded-xl font-semibold text-[13px] border-0 transition-all duration-200"
            style={{
              background: loading || !brandName.trim() ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg, #00f2fe, #ef2cc1)",
              color: loading || !brandName.trim() ? "#8a89a0" : "white",
              boxShadow: loading || !brandName.trim() ? "none" : "0 0 24px rgba(0,242,254,0.3)",
              cursor: loading || !brandName.trim() ? "not-allowed" : "pointer",
            }}
          >
            <Sparkles size={14} />
            {loading ? "Evaluating…" : "Analyze Brand Fit"}
          </button>

          {/* CLEAR inputs — visible only when something is typed */}
          {(brandName || brandDescription) && !loading && (
            <button
              onClick={() => { setBrandName(""); setBrandDescription("") }}
              className="flex items-center justify-center w-10 h-10 rounded-xl border-0 transition-all duration-150"
              style={{ background: "rgba(255,255,255,0.05)", color: "#8a89a0" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "white"; e.currentTarget.style.background = "rgba(255,255,255,0.09)" }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#8a89a0"; e.currentTarget.style.background = "rgba(255,255,255,0.05)" }}
              title="Clear fields"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="rounded-xl px-5 py-4 mb-6 text-[13px] flex items-center gap-3"
          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5" }}>
          <AlertTriangle size={15} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {/* ── Empty State ── */}
      {!loading && !result && !error && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
            style={{ background: "rgba(0,242,254,0.08)", border: "1px solid rgba(0,242,254,0.15)" }}>
            <Target size={28} style={{ color: "#00f2fe" }} />
          </div>
          <h3 className="font-display font-bold text-white text-xl mb-2">Analyze Brand Alignment</h3>
          <p className="text-[14px] max-w-sm leading-relaxed" style={{ color: "#8a89a0" }}>
            Enter a brand name above to evaluate audience fit, niche suitability, and potential campaign blockers.
          </p>
        </div>
      )}

      {/* ── Loading Skeleton ── */}
      {loading && (
        <div className="rounded-2xl p-8 flex flex-col items-center gap-5"
          style={{ background: "#111026", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="w-[200px] h-[200px] rounded-full animate-pulse" style={{ background: "rgba(255,255,255,0.05)" }} />
          <div className="w-32 h-4 rounded-lg animate-pulse" style={{ background: "rgba(255,255,255,0.07)" }} />
          <div className="w-56 h-3 rounded-lg animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
        </div>
      )}

      {/* ── Results ── */}
      {result && !loading && (
        <div className="space-y-5" style={{ animation: "fadeUp 350ms ease both" }}>
          <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}`}</style>

          {/* Score Hero */}
          <div className="rounded-2xl overflow-hidden"
            style={{ background: "#111026", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="h-0.5 w-full"
              style={{ background: `linear-gradient(90deg, transparent, ${tierColor}, transparent)` }} />

            <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="flex justify-center">
                <ScoreRing score={result.overallScore} animate={ringAnimate} />
              </div>

              <div>
                <p className="font-mono text-[10px] tracking-widest uppercase mb-2" style={{ color: "#8a89a0" }}>
                  VERDICT FOR {brandName.toUpperCase()}
                </p>
                <h2 className="font-display font-extrabold text-white text-2xl tracking-tight mb-3 leading-tight">
                  {result.verdict}
                </h2>
                <p className="text-[14px] leading-relaxed mb-6" style={{ color: "#8a89a0" }}>
                  {result.summary}
                </p>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Copies full structured summary to clipboard */}
                  <CopyButton text={summaryText} />

                  {/* Runs the same brand through the API again */}
                  <button
                    onClick={handleReanalyze}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono font-semibold border-0 transition-all duration-200"
                    style={{ background: "rgba(255,255,255,0.06)", color: "#8a89a0", border: "1px solid rgba(255,255,255,0.08)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "white"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)" }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "#8a89a0"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)" }}
                  >
                    <RotateCcw size={11} /> Re-analyze
                  </button>

                  {/* Clears inputs and scrolls up for a new brand */}
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono font-semibold border-0 transition-all duration-200"
                    style={{ background: "rgba(239,44,193,0.08)", color: "#ef2cc1", border: "1px solid rgba(239,44,193,0.2)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,44,193,0.14)" }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(239,44,193,0.08)" }}
                  >
                    <Sparkles size={11} /> New Brand
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Dimension Breakdown */}
          <div className="rounded-2xl p-6" style={{ background: "#111026", border: "1px solid rgba(255,255,255,0.07)" }}>
            <p className="font-mono text-[10px] tracking-widest uppercase mb-4" style={{ color: "#8a89a0" }}>
              FIT BREAKDOWN · tap rows to expand
            </p>
            <div className="space-y-2">
              {result.dimensions?.map((dim, i) => (
                <DimRow key={i} dim={dim} delay={i * 100 + 200} />
              ))}
            </div>
          </div>

          {/* Strategy + Watch Out */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="rounded-2xl p-6" style={{ background: "#111026", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(0,242,254,0.1)", border: "1px solid rgba(0,242,254,0.2)" }}>
                  <TrendingUp size={13} style={{ color: "#00f2fe" }} />
                </div>
                <p className="font-mono text-[10px] tracking-widest uppercase" style={{ color: "#8a89a0" }}>NEGOTIATION STRATEGY</p>
              </div>
              <div className="space-y-3">
                {result.negotiationTips?.map((tip, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center font-mono font-bold text-[10px] mt-0.5"
                      style={{ background: "rgba(0,242,254,0.12)", color: "#00f2fe" }}>{i + 1}</span>
                    <p className="text-[13px] leading-relaxed" style={{ color: "#c4c3d4" }}>{tip}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl p-6"
              style={{ background: "linear-gradient(135deg, #1a0a0a 0%, #111026 100%)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  <AlertTriangle size={13} style={{ color: "#ef4444" }} />
                </div>
                <p className="font-mono text-[10px] tracking-widest uppercase" style={{ color: "#ef4444", opacity: 0.7 }}>WATCH OUT FOR</p>
              </div>
              <div className="space-y-2.5">
                {result.dealBreakers?.map((b, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-[7px]"
                      style={{ background: "#ef4444", boxShadow: "0 0 6px #ef444488" }} />
                    <p className="text-[13px] leading-relaxed" style={{ color: "#fca5a5", opacity: 0.85 }}>{b}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}
    </AppShell>
  )
}