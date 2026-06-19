import { useState, useEffect, useRef } from "react"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "../firebase/config"
import { useAuth } from "../context/AuthContext"
import { useCreator } from "../context/CreatorContext"
import { Link } from "react-router-dom"
import AppShell from "../components/AppShell"
import UsageBadge from "../components/UsageBadge"
import GrowthTracker from "../components/GrowthTracker"
import {
  TrendingUp, Sparkles, Target, Zap, ArrowRight,
  DollarSign, Activity, Lightbulb, Copy, Check,
  SlidersHorizontal, X, Save,
} from "lucide-react"

// ─── Data ────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { to: "/rate-calculator", Icon: TrendingUp, title: "Run Rate Analysis",  description: "AI-justified sponsorship rates for your channels", accent: "#ef2cc1" },
  { to: "/pitch-generator", Icon: Zap,        title: "Generate Pitch",     description: "Personalized outbound pitch & media kit",          accent: "#00f2fe" },
  { to: "/fit-score",       Icon: Target,     title: "Check Brand Fit",    description: "Evaluate your audience & category match",          accent: "#fc4c02" },
  { to: "/what-if",         Icon: Sparkles,   title: "Simulate Growth",    description: "Model growth & project future income",             accent: "#ef2cc1" },
]

const INSIGHT_COLORS = { Audit: "#00f2fe", Monetization: "#ef2cc1", "Revenue Streams": "#fc4c02" }
const INSIGHT_ICONS  = { Audit: Activity,  Monetization: DollarSign, "Revenue Streams": TrendingUp }

const BAR_MONTHS  = ["Jan","Feb","Mar","Apr","May","Jun","Jul"]
const BAR_HEIGHTS = [22, 30, 38, 52, 64, 80, 100]

function getInsights(profile) {
  if (!profile) return []
  const insights = []
  const eng = parseFloat(profile?.engagementRate || 0)
  if (eng > 3)
    insights.push({ text: `Your ${eng}% engagement is above average — use it to justify higher rates.`, tag: "Audit" })
  insights.push({ text: "You may be undercharging by ~22% for Instagram Reels sponsorships.", tag: "Monetization" })
  if (!profile?.incomeStreams?.includes("ugc"))
    insights.push({ text: "UGC licensing deals could add up to 15% monthly — with zero extra posting.", tag: "Revenue Streams" })
  return insights.slice(0, 3)
}

// ─── Animated counter ────────────────────────────────────────
function useCountUp(target, duration = 1100, delay = 0, enabled = true) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!enabled || !target) return
    let raf, start = null
    const run = (ts) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      const e = 1 - Math.pow(1 - p, 4)
      setVal(Math.round(e * target))
      if (p < 1) raf = requestAnimationFrame(run)
    }
    const id = setTimeout(() => { raf = requestAnimationFrame(run) }, delay)
    return () => { clearTimeout(id); cancelAnimationFrame(raf) }
  }, [target, enabled, delay])
  return val
}

// ─── Shimmer sweep ───────────────────────────────────────────
function ShimmerText({ children, style, className, trigger }) {
  const [sweep, setSweep] = useState(false)
  useEffect(() => {
    if (!trigger) return
    const t = setTimeout(() => {
      setSweep(true)
      setTimeout(() => setSweep(false), 800)
    }, 1250)
    return () => clearTimeout(t)
  }, [trigger])
  return (
    <span className={`relative inline-block ${className}`} style={style}>
      {children}
      {sweep && (
        <span className="absolute inset-0 pointer-events-none overflow-hidden rounded"
          style={{
            background: "linear-gradient(105deg, transparent 25%, rgba(255,255,255,0.3) 50%, transparent 75%)",
            animation: "shimmer-sweep 0.75s ease-out forwards",
          }} />
      )}
    </span>
  )
}

// ─── Spark burst ─────────────────────────────────────────────
function SparkBurst({ trigger }) {
  const [sparks, setSparks] = useState([])
  useEffect(() => {
    if (!trigger) return
    const t = setTimeout(() => {
      setSparks(Array.from({ length: 10 }, (_, i) => ({
        id: i, angle: (i / 10) * 360,
        color: ["#ef2cc1","#00f2fe","#fc4c02","#ffffff","#4ade80"][i % 5],
        size: 3 + Math.random() * 3, dist: 28 + Math.random() * 36,
      })))
      setTimeout(() => setSparks([]), 900)
    }, 1200)
    return () => clearTimeout(t)
  }, [trigger])
  if (!sparks.length) return null
  return (
    <span className="absolute pointer-events-none inset-0 flex items-center justify-center">
      {sparks.map((s) => {
        const rad = (s.angle * Math.PI) / 180
        return (
          <span key={s.id} className="absolute rounded-full"
            style={{
              width: s.size, height: s.size, background: s.color,
              boxShadow: `0 0 6px ${s.color}`,
              animation: "spark-fly 0.85s ease-out forwards",
              "--tx": `${Math.cos(rad) * s.dist}px`,
              "--ty": `${Math.sin(rad) * s.dist}px`,
            }} />
        )
      })}
    </span>
  )
}

// ─── Bar column with hover tooltip ───────────────────────────
function BarColumn({ height, delay, monthlyBase, index }) {
  const [h, setH] = useState(0)
  const [hov, setHov] = useState(false)
  // Project each bar as a multiplier of base monthly
  const multipliers = [0.6, 0.75, 0.9, 1.1, 1.35, 1.65, 2.0]
  const projectedValue = monthlyBase ? Math.round(monthlyBase * (multipliers[index] || 1)) : 0

  useEffect(() => {
    const t = setTimeout(() => setH(height), delay + 500)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      className="flex-1 w-full flex flex-col justify-end relative"
      style={{ height: "44px" }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* Tooltip */}
      {hov && projectedValue > 0 && (
        <div
          className="absolute z-20 pointer-events-none"
          style={{
            bottom: "calc(100% + 6px)",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#1a1835",
            border: "1px solid rgba(239,44,193,0.3)",
            borderRadius: "6px",
            padding: "4px 8px",
            whiteSpace: "nowrap",
          }}
        >
          <p className="text-[11px] font-mono font-semibold" style={{ color: "#00f2fe" }}>
            ₹{projectedValue.toLocaleString()}
          </p>
          <div
            className="absolute left-1/2 -translate-x-1/2 w-2 h-2 rotate-45"
            style={{ bottom: "-5px", background: "#1a1835", borderRight: "1px solid rgba(239,44,193,0.3)", borderBottom: "1px solid rgba(239,44,193,0.3)" }}
          />
        </div>
      )}
      <div
        className="w-full rounded-t-sm cursor-pointer transition-all duration-200"
        style={{
          height: `${h}%`,
          background: hov
            ? "linear-gradient(to top, #fc4c02, #ef2cc1)"
            : "linear-gradient(to top, #ef2cc1, #00f2fe)",
          transition: "height 0.75s cubic-bezier(0.34,1.56,0.64,1), background 0.2s",
          boxShadow: hov
            ? "0 0 14px rgba(252,76,2,0.4)"
            : h > 60 ? "0 0 10px rgba(0,242,254,0.25)" : "none",
          transform: hov ? "scaleY(1.04)" : "scaleY(1)",
          transformOrigin: "bottom",
        }}
      />
    </div>
  )
}

// ─── Income gap meter ─────────────────────────────────────────
function IncomeGapMeter({ profile, monthlyRaw, loading }) {
  const currentIncome   = Number(profile?.monthlyIncome || 0)
  const potentialIncome = monthlyRaw || 0
  const gap     = Math.max(potentialIncome - currentIncome, 0)
  const fillPct = potentialIncome > 0 ? Math.min((currentIncome / potentialIncome) * 100, 100) : 0

  const gapReasons = []
  if (!profile?.incomeStreams?.includes("ugc"))             gapReasons.push("No UGC deals")
  if (!profile?.incomeStreams?.includes("affiliate"))       gapReasons.push("No affiliate income")
  if (!profile?.incomeStreams?.includes("digital_products"))gapReasons.push("No digital products")

  if (loading) {
    return (
      <div className="rounded-xl p-5" style={{ background: "#111026", border: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-4 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.05)" }} />)}
        </div>
      </div>
    )
  }

  if (!currentIncome && !potentialIncome) return null

  return (
    <div className="rounded-xl p-5" style={{ background: "#111026", border: "1px solid rgba(255,255,255,0.05)" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] font-mono font-semibold tracking-widest uppercase text-[#8a89a0]">
          Income Gap
        </span>
        <Link to="/gap-radar" className="text-[11px] font-mono font-semibold no-underline text-[#8a89a0] hover:text-[#ef2cc1] transition-colors">
          Full analysis →
        </Link>
      </div>

      {/* Current vs Potential — stacked to avoid overflow */}
      <div className="flex flex-col gap-1 mb-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-[#8a89a0]">You earn</span>
          <span className="text-[16px] font-extrabold font-mono text-white">
            ₹{currentIncome.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-[#8a89a0]">You could earn</span>
          <span className="text-[16px] font-extrabold font-mono" style={{ color: "#00f2fe" }}>
            ₹{potentialIncome.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 rounded-full mb-3 overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div
          className="h-2 rounded-full transition-all duration-1000"
          style={{
            width: `${fillPct}%`,
            background: "linear-gradient(90deg, #ef2cc1, #00f2fe)",
            boxShadow: "0 0 8px rgba(0,242,254,0.3)",
          }}
        />
      </div>

      {/* Gap callout */}
      {gap > 0 && (
        <div
          className="flex items-center justify-between px-3 py-2.5 rounded-lg mb-3"
          style={{ background: "rgba(252,76,2,0.08)", border: "1px solid rgba(252,76,2,0.2)" }}
        >
          <span className="text-[11px] font-mono text-[#fc4c02]">Monthly gap</span>
          <span className="text-[13px] font-extrabold font-mono text-[#fc4c02]">
            ₹{gap.toLocaleString()}
          </span>
        </div>
      )}

      {/* Gap reasons */}
      {gapReasons.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-mono text-[#8a89a0] uppercase tracking-wider mb-2">
            What's causing it
          </p>
          {gapReasons.slice(0, 3).map((reason, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-[#ef2cc1] flex-shrink-0" />
              <span className="text-[12px] text-[#8a89a0]">{reason}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Hero creator card ───────────────────────────────────────
function CreatorHeroCard({ profile, loading, suggestedRaw, monthlyRaw, growthScore }) {
  const [ready, setReady]       = useState(false)
  const [buffer, setBuffer]     = useState(0)
  const [copied, setCopied]     = useState(false)

  useEffect(() => {
    // Show card as soon as component mounts, even if loading
    setTimeout(() => setReady(true), 120)
  }, [])

  const eng          = parseFloat(profile?.engagementRate || 0)
  const brandScore   = profile?.profileComplete ? Math.min(Math.round(eng * 8 + 30), 100) : 0

  // Apply negotiation buffer to the suggested rate
  const bufferedRate = suggestedRaw ? Math.round(suggestedRaw * (1 + buffer / 100)) : 0

  const rateCount    = useCountUp(bufferedRate, 600, 0,   ready && !!bufferedRate)
  const monthlyCount = useCountUp(monthlyRaw,  1000, 350, ready && !!monthlyRaw)
  const scoreCount   = useCountUp(growthScore,  900, 500, ready && !!growthScore)
  const brandCount   = useCountUp(brandScore,   900, 620, ready && !!brandScore)

  const firstName = profile?.name?.split(" ")[0] || "Creator"
  const platform  = profile?.platform || "Creator"

  const handleCopyRate = () => {
    const rateText = `My rate for a sponsored post is ₹${bufferedRate.toLocaleString()}`
    navigator.clipboard.writeText(rateText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const statCards = [
    { label: "Monthly Potential",  value: monthlyRaw   ? `₹${monthlyCount.toLocaleString()}` : "—", accent: "#00f2fe" },
    { label: "Growth Score",       value: growthScore  ? `${scoreCount}/100`                  : "—", accent: "#fc4c02" },
    { label: "Brand Readiness",    value: brandScore   ? `${brandCount}/100`                  : "—", accent: "#ef2cc1" },
    { label: "Engagement Rate",    value: profile?.engagementRate ? `${profile.engagementRate}%` : "—", accent: "#4ade80" },
  ]

  return (
    <div className="relative rounded-2xl overflow-hidden mb-8 transition-all duration-700"
      style={{
        opacity: ready ? 1 : 0,
        transform: ready ? "translateY(0)" : "translateY(16px)",
        background: "linear-gradient(135deg, #141332 0%, #111026 55%, #0f0e26 100%)",
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 24px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(239,44,193,0.07)",
      }}>

      {/* Ambient glows */}
      <div className="absolute top-[-80px] right-[-60px] w-[380px] h-[380px] rounded-full blur-[90px] pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(239,44,193,0.18) 0%, transparent 65%)" }} />
      <div className="absolute bottom-[-60px] left-[8%] w-[300px] h-[300px] rounded-full blur-[80px] pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(0,242,254,0.10) 0%, transparent 65%)" }} />
      <div className="absolute top-[20%] left-[45%] w-[220px] h-[220px] rounded-full blur-[70px] pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(252,76,2,0.07) 0%, transparent 65%)" }} />

      {/* Grid texture */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }} />

      {/* Pulsing dots */}
      <div className="absolute top-6 right-[32%] w-1.5 h-1.5 rounded-full animate-pulse"
        style={{ background:"#ef2cc1", boxShadow:"0 0 8px rgba(239,44,193,0.8)" }} />
      <div className="absolute top-12 right-[30%] w-1 h-1 rounded-full animate-pulse"
        style={{ background:"#00f2fe", boxShadow:"0 0 6px rgba(0,242,254,0.7)", animationDelay:"0.9s" }} />
      <div className="absolute bottom-8 left-[58%] w-2 h-2 rounded-full animate-pulse"
        style={{ background:"rgba(252,76,2,0.7)", boxShadow:"0 0 8px rgba(252,76,2,0.5)", animationDelay:"1.7s" }} />

      <div className="relative z-10 p-8">
        {/* Top row */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <span className="text-[10px] font-mono font-semibold tracking-widest uppercase text-[#8a89a0]">
              CREATORPULSE — EARNINGS CARD
            </span>
            <h2 className="text-white font-display font-extrabold tracking-tight text-2xl mt-1">
              {firstName}
              <span className="ml-2 text-sm font-mono font-normal text-[#8a89a0]">· {platform}</span>
            </h2>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.15)" }}>
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] font-mono text-green-400">Live estimates</span>
          </div>
        </div>

        {/* Big rate reveal + copy button */}
        <div className="mb-6">
          <span className="text-[10px] font-mono font-semibold tracking-widest uppercase text-[#8a89a0] block mb-3">
            Suggested Sponsorship Rate
            {buffer > 0 && (
              <span className="ml-2 text-[#4ade80]">(+{buffer}% negotiation buffer)</span>
            )}
          </span>
          <div className="flex items-end gap-4 relative">
            <SparkBurst trigger={ready && !!suggestedRaw} />
            {loading ? (
              <div className="h-20 w-64 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.05)" }} />
            ) : (
              <ShimmerText trigger={ready && !!suggestedRaw}
                className="font-display font-extrabold leading-none select-none"
                style={{
                  fontSize: "clamp(52px, 8vw, 80px)",
                  background: "linear-gradient(to right, #00f2fe 0%, #ef2cc1 55%, #fc4c02 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}>
                {bufferedRate ? `₹${rateCount.toLocaleString()}` : "—"}
              </ShimmerText>
            )}
            {!loading && bufferedRate > 0 && (
              <div className="mb-3 flex flex-col gap-1.5 items-center">
                <span className="text-[11px] font-mono px-2.5 py-1 rounded-full"
                  style={{ background: "rgba(74,222,128,0.12)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.2)" }}>
                  per post
                </span>
                {/* Copy rate button */}
                <button
                  onClick={handleCopyRate}
                  title="Copy rate to clipboard"
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all"
                  style={{
                    background: copied ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.06)",
                    border: `1px solid ${copied ? "rgba(74,222,128,0.3)" : "rgba(255,255,255,0.1)"}`,
                    color: copied ? "#4ade80" : "#8a89a0",
                  }}
                >
                  {copied
                    ? <><Check size={11} /><span className="text-[10px] font-mono">Copied!</span></>
                    : <><Copy size={11} /><span className="text-[10px] font-mono">Copy rate</span></>
                  }
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Negotiation buffer slider ── */}
        {!loading && suggestedRaw > 0 && (
          <div
            className="mb-6 px-4 py-3.5 rounded-xl"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-[10px] font-mono font-semibold tracking-widest uppercase text-[#8a89a0]">
                  Negotiation Buffer
                </span>
                <span className="text-[10px] font-mono ml-2 text-[#8a89a0]">
                  — drag to add a buffer when pitching brands
                </span>
              </div>
              <span
                className="text-[12px] font-mono font-bold"
                style={{ color: buffer > 0 ? "#4ade80" : "#8a89a0" }}
              >
                {buffer === 0 ? "Off" : `+${buffer}%`}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={40}
              step={5}
              value={buffer}
              onChange={(e) => setBuffer(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #ef2cc1 0%, #00f2fe ${buffer / 40 * 100}%, rgba(255,255,255,0.1) ${buffer / 40 * 100}%)`,
                accentColor: "#ef2cc1",
              }}
            />
            <div className="flex justify-between mt-1.5">
              {[0, 10, 20, 30, 40].map((v) => (
                <span key={v} className="text-[9px] font-mono" style={{ color: v === buffer ? "#ef2cc1" : "rgba(255,255,255,0.2)" }}>
                  {v === 0 ? "Base" : `+${v}%`}
                </span>
              ))}
            </div>
            {buffer > 0 && (
              <p className="text-[11px] font-mono mt-2" style={{ color: "rgba(255,255,255,0.3)" }}>
                Start at ₹{bufferedRate.toLocaleString()} — negotiate down to ₹{suggestedRaw.toLocaleString()} if needed
              </p>
            )}
          </div>
        )}

        {/* Stat mini cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {statCards.map(({ label, value, accent }) => (
            <div key={label} className="rounded-xl p-4 relative overflow-hidden transition-all duration-300"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = `${accent}35`}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"}
            >
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: `radial-gradient(ellipse at 0% 100%, ${accent}08 0%, transparent 60%)` }} />
              <p className="text-[10px] font-mono text-[#8a89a0] mb-2">{label}</p>
              {loading ? (
                <div className="h-6 w-16 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />
              ) : (
                <p className="font-display font-extrabold text-[22px] leading-none" style={{ color: accent }}>{value}</p>
              )}
            </div>
          ))}
        </div>

        {/* Mini bar chart with hover tooltips */}
        {!loading && monthlyRaw > 0 && (
          <div className="pt-5" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="flex items-end justify-between mb-3">
              <span className="text-[10px] font-mono text-[#8a89a0]">
                6-month earning projection
                <span className="ml-1 text-[#8a89a0]/50">(hover bars for values)</span>
              </span>
              <span className="text-[10px] font-mono text-green-400">
                ₹{monthlyRaw.toLocaleString()} → ₹{Math.round(monthlyRaw * 2.2).toLocaleString()}
              </span>
            </div>
            <div className="flex items-end gap-1.5 h-14">
              {BAR_HEIGHTS.map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <BarColumn height={h} delay={i * 65} monthlyBase={monthlyRaw} index={i} />
                  <span className="text-[8px] font-mono text-[#8a89a0]/40">{BAR_MONTHS[i]}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Action card ─────────────────────────────────────────────
function ActionCard({ to, Icon, title, description, accent }) {
  const [hov, setHov] = useState(false)
  return (
    <Link to={to} className="block no-underline"
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <div className="relative rounded-xl p-5 flex flex-col gap-4 overflow-hidden transition-all duration-300"
        style={{
          background: hov ? "#141332" : "#111026",
          border: `1px solid ${hov ? accent + "50" : "rgba(255,255,255,0.05)"}`,
          boxShadow: hov ? `0 12px 36px rgba(0,0,0,0.4), 0 0 20px ${accent}12` : "none",
          transform: hov ? "translateY(-2px)" : "translateY(0)",
        }}>
        <div className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{ opacity: hov ? 1 : 0, background: `radial-gradient(ellipse at 15% 15%, ${accent}14 0%, transparent 55%)` }} />
        <div className="relative z-10 flex items-start justify-between">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300"
            style={{ background: hov ? `${accent}25` : `${accent}15`, border: `1px solid ${accent}30` }}>
            <Icon size={18} style={{ color: accent }} />
          </div>
          <span className="text-[10px] font-mono font-semibold tracking-widest uppercase px-2 py-0.5 rounded-full"
            style={{ background: `${accent}15`, color: accent, border: `1px solid ${accent}25` }}>AI</span>
        </div>
        <div className="relative z-10">
          <p className="text-[14px] font-semibold text-white mb-1">{title}</p>
          <p className="text-[12px] text-[#8a89a0] leading-relaxed">{description}</p>
        </div>
        <div className="relative z-10 flex items-center gap-1.5 text-[12px] font-medium transition-colors duration-200"
          style={{ color: hov ? accent : "#8a89a0" }}>
          Open tool
          <ArrowRight size={12} style={{ transform: hov ? "translateX(3px)" : "translateX(0)", transition: "transform 0.2s" }} />
        </div>
      </div>
    </Link>
  )
}

// ─── Insight row ─────────────────────────────────────────────
function InsightRow({ text, tag, index }) {
  const [vis, setVis] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVis(true), 300 + index * 130); return () => clearTimeout(t) }, [])
  const color = INSIGHT_COLORS[tag] || "#8a89a0"
  const Icon  = INSIGHT_ICONS[tag]  || Lightbulb
  return (
    <div className="flex items-start gap-3 py-3 transition-all duration-500"
      style={{
        opacity: vis ? 1 : 0,
        transform: vis ? "translateX(0)" : "translateX(-10px)",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}>
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
        <Icon size={13} style={{ color }} />
      </div>
      <div className="flex-1">
        <p className="text-[12px] text-white leading-relaxed">{text}</p>
        <span className="text-[10px] font-mono font-semibold tracking-wider uppercase mt-1 inline-block" style={{ color }}>
          {tag}
        </span>
      </div>
    </div>
  )
}

// ─── Profile row ─────────────────────────────────────────────
function ProfileRow({ label, value, accent }) {
  return (
    <div className="flex items-center justify-between py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <span className="text-[12px] font-mono text-[#8a89a0]">{label}</span>
      <span className="text-[12px] font-semibold font-mono" style={{ color: accent || "white" }}>{value || "—"}</span>
    </div>
  )
}

// ─── Edit Profile Panel ──────────────────────────────────────
const EP_PLATFORMS   = ["Instagram", "YouTube", "LinkedIn", "Twitter/X"]
const EP_NICHES      = ["Fitness", "Tech", "Finance", "Fashion", "Food", "Travel", "Education", "Gaming", "Lifestyle", "Beauty"]
const EP_FREQUENCIES = ["Daily", "3-4x per week", "1-2x per week", "A few times a month"]
const EP_LOCATIONS   = ["India", "USA", "UK", "UAE", "Global Mix"]

function EPPill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-[12px] font-medium transition-all"
      style={active ? {
        background: "linear-gradient(135deg, rgba(0,242,254,0.15), rgba(239,44,193,0.15))",
        border: "1px solid rgba(239,44,193,0.5)", color: "white",
      } : {
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)",
      }}
    >{label}</button>
  )
}

function EditProfilePanel({ profile, onClose, onSave }) {
  // Normalise stored values — may be string (old) or array (new)
  const toArr = (v) => Array.isArray(v) ? v : (v ? [v] : [])

  const [form, setForm] = useState({
    name:             profile?.name             || "",
    platforms:        toArr(profile?.platforms  || profile?.platform),
    niches:           toArr(profile?.niches     || profile?.niche),
    customNiche:      "",
    followers:        profile?.followers        || "",
    engagementRate:   profile?.engagementRate   || "",
    contentFrequency: profile?.contentFrequency || "",
    audienceLocation: profile?.audienceLocation || "",
    monthlyIncome:    profile?.monthlyIncome    || "",
  })
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)

  const up = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // Toggle item in an array field
  const toggle = (field, val) => setForm(f => ({
    ...f,
    [field]: f[field].includes(val)
      ? f[field].filter(x => x !== val)
      : [...f[field], val],
  }))

  const handleSave = async () => {
    setSaving(true)
    // Keep backward-compat string fields too so AI prompts still work
    const payload = {
      ...form,
      platform:  form.platforms[0] || "",
      niche:     form.niches[0]    || "",
    }
    delete payload.customNiche
    await onSave(payload)
    setSaving(false)
    setSaved(true)
    setTimeout(() => { setSaved(false); onClose() }, 1000)
  }

  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = "" }
  }, [])

  const inputStyle = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.09)",
    color: "white", borderRadius: "8px",
    padding: "10px 14px", fontSize: "13px",
    width: "100%", outline: "none",
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed right-0 top-0 h-full z-50 flex flex-col"
        style={{
          width: "min(480px, 100vw)",
          background: "#0f0e26",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
          animation: "slideInRight 250ms cubic-bezier(0.34,1.2,0.64,1)",
        }}
      >
        <style>{`
          @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to   { transform: translateX(0);    opacity: 1; }
          }
        `}</style>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div>
            <p className="font-mono text-[10px] tracking-widest uppercase text-[#8a89a0] mb-1">CREATOR PROFILE</p>
            <h2 className="text-white font-bold text-[18px] tracking-tight">Update your details</h2>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: "rgba(255,255,255,0.06)", color: "#8a89a0" }}
            onMouseEnter={(e) => e.currentTarget.style.color = "white"}
            onMouseLeave={(e) => e.currentTarget.style.color = "#8a89a0"}
          ><X size={15} /></button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Name */}
          <div>
            <label className="block font-mono text-[10px] tracking-widest uppercase text-[#8a89a0] mb-2">Name</label>
            <input value={form.name} onChange={(e) => up("name", e.target.value)}
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = "rgba(239,44,193,0.5)"}
              onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.09)"}
            />
          </div>

          {/* Platform — multi-select */}
          <div>
            <label className="block font-mono text-[10px] tracking-widest uppercase text-[#8a89a0] mb-1">
              Platforms
              <span className="ml-2 normal-case font-sans font-normal text-[11px]" style={{ color: "#8a89a0" }}>— select all that apply</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {EP_PLATFORMS.map(p => (
                <EPPill key={p} label={p}
                  active={form.platforms.includes(p)}
                  onClick={() => toggle("platforms", p)} />
              ))}
            </div>
            {form.platforms.length > 1 && (
              <p className="text-[11px] mt-1.5" style={{ color: "rgba(255,255,255,0.25)" }}>
                {form.platforms.length} platforms selected — primary: {form.platforms[0]}
              </p>
            )}
          </div>

          {/* Niche — multi-select + custom */}
          <div>
            <label className="block font-mono text-[10px] tracking-widest uppercase text-[#8a89a0] mb-1">
              Niches
              <span className="ml-2 normal-case font-sans font-normal text-[11px]" style={{ color: "#ef2cc1" }}>
                — switching niches? Update here ↓
              </span>
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {EP_NICHES.map(n => (
                <EPPill key={n} label={n}
                  active={form.niches.includes(n)}
                  onClick={() => toggle("niches", n)} />
              ))}
            </div>
            {/* Custom niche input */}
            <div className="flex gap-2 mt-1">
              <input
                value={form.customNiche}
                onChange={(e) => up("customNiche", e.target.value)}
                placeholder="Or type your own (e.g. Crypto, Parenting…)"
                className="flex-1 px-3 py-2 rounded-lg text-[13px] outline-none transition-all"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "white" }}
                onFocus={(e) => e.target.style.borderColor = "rgba(239,44,193,0.5)"}
                onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.09)"}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && form.customNiche.trim()) {
                    if (!form.niches.includes(form.customNiche.trim())) {
                      toggle("niches", form.customNiche.trim())
                    }
                    up("customNiche", "")
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (form.customNiche.trim() && !form.niches.includes(form.customNiche.trim())) {
                    toggle("niches", form.customNiche.trim())
                  }
                  up("customNiche", "")
                }}
                className="px-3 py-2 rounded-lg text-[12px] font-semibold flex-shrink-0"
                style={{ background: "rgba(239,44,193,0.15)", color: "#ef2cc1", border: "1px solid rgba(239,44,193,0.25)" }}
              >
                Add
              </button>
            </div>
            {/* Selected niches */}
            {form.niches.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {form.niches.filter(n => !EP_NICHES.includes(n)).map(n => (
                  <div key={n} className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium"
                    style={{ background: "linear-gradient(135deg,rgba(0,242,254,0.12),rgba(239,44,193,0.12))", border: "1px solid rgba(239,44,193,0.4)", color: "white" }}>
                    {n}
                    <button onClick={() => toggle("niches", n)} className="ml-0.5 opacity-50 hover:opacity-100">✕</button>
                  </div>
                ))}
              </div>
            )}
            {form.niches.length > 1 && (
              <p className="text-[11px] mt-1.5" style={{ color: "rgba(255,255,255,0.25)" }}>
                {form.niches.length} niches selected
              </p>
            )}
          </div>

          {/* Followers + Engagement */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-[10px] tracking-widest uppercase text-[#8a89a0] mb-2">Followers</label>
              <input type="number" value={form.followers} onChange={(e) => up("followers", e.target.value)}
                placeholder="e.g. 45000" style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = "rgba(239,44,193,0.5)"}
                onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.09)"}
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] tracking-widest uppercase text-[#8a89a0] mb-2">Engagement %</label>
              <input type="number" value={form.engagementRate} onChange={(e) => up("engagementRate", e.target.value)}
                placeholder="e.g. 6.2" style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = "rgba(239,44,193,0.5)"}
                onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.09)"}
              />
            </div>
          </div>

          {/* Posting frequency */}
          <div>
            <label className="block font-mono text-[10px] tracking-widest uppercase text-[#8a89a0] mb-2">Posting Frequency</label>
            <div className="flex flex-wrap gap-2">
              {EP_FREQUENCIES.map(f => <EPPill key={f} label={f} active={form.contentFrequency === f} onClick={() => up("contentFrequency", f)} />)}
            </div>
          </div>

          {/* Audience location */}
          <div>
            <label className="block font-mono text-[10px] tracking-widest uppercase text-[#8a89a0] mb-2">Audience Location</label>
            <div className="flex flex-wrap gap-2">
              {EP_LOCATIONS.map(l => <EPPill key={l} label={l} active={form.audienceLocation === l} onClick={() => up("audienceLocation", l)} />)}
            </div>
          </div>

          {/* Monthly income */}
          <div>
            <label className="block font-mono text-[10px] tracking-widest uppercase text-[#8a89a0] mb-2">Monthly Income (₹)</label>
            <input type="number" value={form.monthlyIncome} onChange={(e) => up("monthlyIncome", e.target.value)}
              placeholder="e.g. 15000" style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = "rgba(239,44,193,0.5)"}
              onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.09)"}
            />
          </div>

          {/* Hint */}
          <div className="px-4 py-3 rounded-xl text-[12px] leading-relaxed"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)" }}>
            💡 Updating your niche or platform refreshes all AI tool recommendations — rate cards, gap analysis, and pitch suggestions will reflect your new direction.
          </div>
        </div>

        {/* Save footer */}
        <div className="px-6 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-[14px] transition-all"
            style={{
              background: saved
                ? "rgba(34,211,165,0.2)"
                : "linear-gradient(135deg, #00f2fe, #ef2cc1)",
              color: saved ? "#22d3a5" : "#0a0916",
              border: saved ? "1px solid rgba(34,211,165,0.4)" : "none",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saved ? <><Check size={15} /> Saved!</> : saving ? "Saving…" : <><Save size={15} /> Save Changes</>}
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Main ────────────────────────────────────────────────────
export default function Dashboard() {
  const { user }  = useAuth()
  const { profile, profileLoading: loading, saveProfile } = useCreator()
  const [mounted, setMounted] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  useEffect(() => {
    if (!loading) setTimeout(() => setMounted(true), 60)
  }, [loading])

  const handleSaveProfile = async (form) => {
    await saveProfile(form)
  }

  const firstName    = profile?.name?.split(" ")[0] || user?.email?.split("@")[0] || "Creator"
  const followers    = Number(profile?.followers || 0)
  const eng          = parseFloat(profile?.engagementRate || 0)
  // Indian market rate benchmarks (INR):
  // Nano  (<10K):  ₹500–₹2,000/post   → ~₹0.15–0.25/follower
  // Micro (10–100K): ₹2,000–₹20,000/post → ~₹0.15–0.20/follower
  // Mid   (100K–1M): ₹20,000–₹1,50,000/post → ~₹0.12–0.18/follower
  // Engagement premium: each 1% above 2% baseline adds ~8% to rate
  const engPremium   = Math.max(1, 1 + (eng - 2) * 0.08)
  const suggestedRaw = followers > 0 ? Math.round(followers * 0.18 * engPremium) : 0
  const monthlyRaw   = followers > 0 ? Math.round(followers * 0.55 * engPremium) : 0
  const growthScore  = Math.min(Math.round(eng * 10 + (followers > 100000 ? 20 : followers > 10000 ? 10 : 0)), 100)
  const insights     = getInsights(profile)

  return (
    <AppShell>
      <style>{`
        @keyframes shimmer-sweep {
          from { transform: translateX(-120%) skewX(-12deg); }
          to   { transform: translateX(260%)  skewX(-12deg); }
        }
        @keyframes spark-fly {
          0%   { transform: translate(0, 0) scale(1);  opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px; height: 14px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ef2cc1, #00f2fe);
          cursor: pointer;
          box-shadow: 0 0 6px rgba(239,44,193,0.5);
        }
        input[type=range]::-moz-range-thumb {
          width: 14px; height: 14px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ef2cc1, #00f2fe);
          cursor: pointer;
          border: none;
        }
      `}</style>

      {/* Edit Profile Panel */}
      {editOpen && (
        <EditProfilePanel
          profile={profile}
          onClose={() => setEditOpen(false)}
          onSave={handleSaveProfile}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 transition-all duration-500"
        style={{ opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(8px)" }}>
        <div>
          <span className="text-[11px] font-mono font-semibold tracking-widest uppercase text-[#8a89a0]">
            CREATORPULSE OVERVIEW
          </span>
          <h1 className="text-white font-display font-extrabold tracking-tight text-[28px] mt-1 mb-1">
            Welcome back, {firstName} 👋
          </h1>
          <p className="text-[14px] text-[#8a89a0]">Here's your monetization snapshot for today.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setEditOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.65)" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(239,44,193,0.4)"; e.currentTarget.style.color = "white" }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(255,255,255,0.65)" }}
          >
            <SlidersHorizontal size={14} />
            Edit Profile
          </button>
          <UsageBadge usage={null} />
        </div>
      </div>

      {/* Creator hero card */}
      <CreatorHeroCard
        profile={profile}
        loading={loading}
        suggestedRaw={suggestedRaw}
        monthlyRaw={monthlyRaw}
        growthScore={growthScore}
      />

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: AI Tools + Insights below */}
        <div className="lg:col-span-2 space-y-6 transition-all duration-500"
          style={{ opacity: mounted ? 1 : 0, transitionDelay: "200ms" }}>

          {/* AI Tools */}
          <div className="space-y-4">
            <span className="text-[11px] font-mono font-semibold tracking-widest uppercase text-[#8a89a0]">AI Tools</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {QUICK_ACTIONS.map((a) => <ActionCard key={a.to} {...a} />)}
            </div>
          </div>

          {/* Insights — horizontal 3-column below tools */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-semibold tracking-widest uppercase text-[#8a89a0]">Insights</span>
              {!loading && <span className="text-[10px] font-mono" style={{ color: "#ef2cc1" }}>{insights.length} new</span>}
            </div>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-24 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
                ))}
              </div>
            ) : insights.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {insights.map((ins, i) => {
                  const color = INSIGHT_COLORS[ins.tag] || "#8a89a0"
                  const Icon  = INSIGHT_ICONS[ins.tag]  || Lightbulb
                  return (
                    <div
                      key={i}
                      className="rounded-xl p-4 flex flex-col gap-3 transition-all duration-500"
                      style={{
                        background: "#111026",
                        border: `1px solid rgba(255,255,255,0.05)`,
                        opacity: mounted ? 1 : 0,
                        transitionDelay: `${300 + i * 100}ms`,
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = `${color}30`}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)"}
                    >
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                        <Icon size={13} style={{ color }} />
                      </div>
                      <p className="text-[12px] text-white leading-relaxed flex-1">{ins.text}</p>
                      <span className="text-[10px] font-mono font-semibold tracking-wider uppercase" style={{ color }}>
                        {ins.tag}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-[12px] text-[#8a89a0]">Complete your profile to unlock personalized insights.</p>
            )}
          </div>

          {/* Growth Tracker */}
          <div className="transition-all duration-500" style={{ opacity: mounted ? 1 : 0, transitionDelay: "350ms" }}>
            <GrowthTracker />
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-5 transition-all duration-500"
          style={{ opacity: mounted ? 1 : 0, transitionDelay: "300ms" }}>

          {/* Income Gap Meter */}
          <IncomeGapMeter profile={profile} monthlyRaw={monthlyRaw} loading={loading} />

          {/* Profile */}
          <div className="rounded-xl p-5" style={{ background: "#111026", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-mono font-semibold tracking-widest uppercase text-[#8a89a0]">Profile</span>
              <Link to="/onboarding" className="text-[11px] font-mono font-semibold no-underline text-[#8a89a0] hover:text-[#00f2fe] transition-colors">
                Edit →
              </Link>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => <div key={i} className="h-3 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.05)" }} />)}
              </div>
            ) : (
              <>
                <ProfileRow label="Platform"   value={profile?.platform}                                              accent="#ef2cc1" />
                <ProfileRow label="Niche"       value={profile?.niche}                                                 accent="#00f2fe" />
                <ProfileRow label="Followers"   value={followers > 0 ? followers.toLocaleString() : null}             accent="white"   />
                <ProfileRow label="Engagement"  value={profile?.engagementRate ? `${profile.engagementRate}%` : null} accent={eng > 3 ? "#4ade80" : "white"} />
                <ProfileRow label="Location"    value={profile?.audienceLocation}                                      accent="#8a89a0" />
              </>
            )}
          </div>

          {/* Pricing Value Card */}
          <div className="rounded-xl p-5 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #111026 0%, #141332 100%)",
              border: "1px solid rgba(239,44,193,0.2)",
            }}>
            {/* Glow */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(ellipse at 100% 0%, rgba(239,44,193,0.06) 0%, transparent 65%)" }} />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono font-semibold tracking-widest uppercase text-[#8a89a0]">Why ₹399/mo?</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(239,44,193,0.12)", color: "#ef2cc1", border: "1px solid rgba(239,44,193,0.25)" }}>
                  PRO
                </span>
              </div>

              <p className="text-[12px] text-[#8a89a0] leading-relaxed mb-4">
                The average Indian creator underprices a brand deal by <span className="text-white font-semibold">₹4,000–₹8,000</span> per post.
                One better-negotiated deal pays for a year of Pro.
              </p>

              {/* Comparison rows */}
              <div className="space-y-2.5">
                {[
                  { label: "One underpriced reel", value: "−₹5,000", color: "#fc4c02" },
                  { label: "Avg. Indian SaaS tool", value: "₹800–₹2,000/mo", color: "#8a89a0" },
                  { label: "CreatorPulse Pro", value: "₹399/mo", color: "#ef2cc1" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between py-1.5"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <span className="text-[11px] text-[#8a89a0]">{label}</span>
                    <span className="text-[12px] font-mono font-semibold" style={{ color }}>{value}</span>
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-[#8a89a0]/60 mt-4 leading-relaxed">
                Built on zero fixed infra costs — we pass those savings directly to Indian creators.
                No VC pricing. No USD conversion markup.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
