import { useState, useEffect, useRef } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "../firebase/config"
import { useAuth } from "../context/AuthContext"
import { useRateCalculator } from "../hooks/useRateCalculator"
import AppShell from "../components/AppShell"
import UsageBadge from "../components/UsageBadge"
import ToolExplainer from "../components/ToolExplainer"
import {
  Sparkles, AlertCircle, CheckCircle, ChevronDown,
  TrendingUp, Zap, BarChart2, Users
} from "lucide-react"

/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */
const PLATFORMS = [
  { value: "instagram", label: "Instagram",  accent: "#ef2cc1" },
  { value: "youtube",   label: "YouTube",    accent: "#fc4c02" },
  { value: "tiktok",    label: "TikTok",     accent: "#00f2fe" },
  { value: "twitter",   label: "Twitter / X", accent: "#8a89a0" },
]

const NICHES = [
  { value: "tech",     label: "Tech & Gadgets" },
  { value: "fashion",  label: "Fashion & Lifestyle" },
  { value: "finance",  label: "Finance & Business" },
  { value: "fitness",  label: "Fitness & Health" },
  { value: "travel",   label: "Travel & Adventure" },
  { value: "food",     label: "Food & Cooking" },
  { value: "gaming",   label: "Gaming" },
  { value: "beauty",   label: "Beauty & Skincare" },
  { value: "education",label: "Education" },
  { value: "lifestyle",label: "Lifestyle" },
]

const DELIVERABLES = [
  { value: "sponsored_post",      label: "Sponsored Post" },
  { value: "story_set",           label: "Story Set (3 stories)" },
  { value: "reel",                label: "Reel / Short Video" },
  { value: "youtube_integration", label: "YouTube Integration" },
  { value: "brand_ambassador",    label: "Brand Ambassador (monthly)" },
  { value: "ugc_only",            label: "UGC Only (no posting)" },
]

const getConfidenceScore = (tier) => {
  if (tier === "excellent") return 96
  if (tier === "good")      return 88
  if (tier === "average")   return 76
  return 62
}

/* ─────────────────────────────────────────────
   AMBIENT GLOW
───────────────────────────────────────────── */
function RateGlow({ platform }) {
  const accent = PLATFORMS.find((p) => p.value === platform)?.accent ?? "#00f2fe"
  return (
    <>
      <div className="pointer-events-none fixed top-[-100px] right-[-80px] w-[400px] h-[400px] rounded-full transition-all duration-1000"
        style={{ background: `radial-gradient(circle, ${accent} 0%, transparent 70%)`, filter: "blur(90px)", opacity: 0.07 }} />
      <div className="pointer-events-none fixed bottom-[-80px] left-[-60px] w-[320px] h-[320px] rounded-full"
        style={{ background: "radial-gradient(circle, #ef2cc1 0%, transparent 70%)", filter: "blur(70px)", opacity: 0.05 }} />
    </>
  )
}

/* ─────────────────────────────────────────────
   PLATFORM PILL SELECTOR
───────────────────────────────────────────── */
function PlatformPicker({ value, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {PLATFORMS.map((p) => {
        const active = value === p.value
        return (
          <button
            key={p.value}
            type="button"
            onClick={() => onChange(p.value)}
            className="px-3 py-2.5 rounded-xl text-[12px] font-semibold border-0 transition-all duration-200"
            style={{
              background: active ? `${p.accent}22` : "rgba(255,255,255,0.04)",
              color: active ? p.accent : "#8a89a0",
              border: active ? `1px solid ${p.accent}45` : "1px solid rgba(255,255,255,0.07)",
              boxShadow: active ? `0 0 14px ${p.accent}25` : "none",
            }}
          >
            {p.label}
          </button>
        )
      })}
    </div>
  )
}

/* ─────────────────────────────────────────────
   CUSTOM NICHE PICKER — dropdown + free text
───────────────────────────────────────────── */
function NichePicker({ value, onChange }) {
  const [open, setOpen]       = useState(false)
  const [custom, setCustom]   = useState("")
  const ref                   = useRef()

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const selectedLabel = NICHES.find(n => n.value === value)?.label || value

  const handleSelect = (n) => {
    onChange(n.value)
    setCustom("")
    setOpen(false)
  }

  const handleCustomSubmit = () => {
    if (!custom.trim()) return
    onChange(custom.trim())
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-[13px] transition-all duration-200"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: open ? "1px solid rgba(0,242,254,0.5)" : "1px solid rgba(255,255,255,0.08)",
          color: "white",
          boxShadow: open ? "0 0 0 3px rgba(0,242,254,0.08)" : "none",
        }}
      >
        <span>{selectedLabel || "Select niche"}</span>
        <ChevronDown size={13} style={{ color: "#8a89a0", transform: open ? "rotate(180deg)" : "none", transition: "transform 200ms" }} />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute left-0 right-0 z-50 rounded-xl overflow-hidden mt-1"
          style={{
            background: "#16143a",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
          }}
        >
          {/* Preset options */}
          <div className="max-h-48 overflow-y-auto py-1">
            {NICHES.map(n => (
              <button
                key={n.value}
                type="button"
                onClick={() => handleSelect(n)}
                className="w-full text-left px-4 py-2.5 text-[13px] transition-colors"
                style={{
                  background: value === n.value ? "rgba(0,242,254,0.1)" : "transparent",
                  color: value === n.value ? "#00f2fe" : "rgba(255,255,255,0.7)",
                }}
                onMouseEnter={(e) => { if (value !== n.value) e.currentTarget.style.background = "rgba(255,255,255,0.05)" }}
                onMouseLeave={(e) => { if (value !== n.value) e.currentTarget.style.background = "transparent" }}
              >
                {n.label}
                {value === n.value && <span className="float-right text-[#00f2fe]">✓</span>}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }} />

          {/* Custom input */}
          <div className="p-3">
            <p className="font-mono text-[10px] tracking-widest uppercase mb-2" style={{ color: "#8a89a0" }}>
              Or type your own niche
            </p>
            <div className="flex gap-2">
              <input
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCustomSubmit()}
                placeholder="e.g. Crypto, Parenting…"
                className="flex-1 px-3 py-2 rounded-lg text-[13px] outline-none"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "white",
                }}
              />
              <button
                type="button"
                onClick={handleCustomSubmit}
                className="px-3 py-2 rounded-lg text-[12px] font-semibold transition-colors"
                style={{ background: "rgba(0,242,254,0.15)", color: "#00f2fe", border: "1px solid rgba(0,242,254,0.25)" }}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────
   STYLED NUMBER INPUT
───────────────────────────────────────────── */
function DarkInput({ value, onChange, placeholder, step }) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      type="number"
      step={step}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholder={placeholder}
      className="w-full px-4 py-3 rounded-xl text-[13px] text-white outline-none transition-all duration-200"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: focused ? "1px solid rgba(0,242,254,0.5)" : "1px solid rgba(255,255,255,0.08)",
        boxShadow: focused ? "0 0 0 3px rgba(0,242,254,0.1)" : "none",
      }}
    />
  )
}

/* ─────────────────────────────────────────────
   ANIMATED RATE NUMBER
───────────────────────────────────────────── */
function AnimatedRate({ target, prefix = "₹", duration = 900 }) {
  const [displayed, setDisplayed] = useState(0)
  const prev = useRef(0)

  useEffect(() => {
    if (!target) return
    const from  = prev.current
    const start = performance.now()
    const tick  = (now) => {
      const p    = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      const cur  = Math.round(from + (target - from) * ease)
      setDisplayed(cur)
      if (p < 1) requestAnimationFrame(tick)
      else prev.current = target
    }
    requestAnimationFrame(tick)
  }, [target])

  return (
    <span>
      {prefix}{displayed.toLocaleString()}
    </span>
  )
}

/* ─────────────────────────────────────────────
   ANIMATED CONFIDENCE BAR
───────────────────────────────────────────── */
function ConfidenceBar({ score }) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setWidth(score), 200)
    return () => clearTimeout(t)
  }, [score])

  const color = score >= 85 ? "#22d3a5" : score >= 70 ? "#fc4c02" : "#ef4444"
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: "#8a89a0" }}>CONFIDENCE</span>
        <span className="font-mono font-bold text-[13px]" style={{ color }}>{score}%</span>
      </div>
      <div className="w-full h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
        <div
          className="h-1.5 rounded-full"
          style={{
            width: `${width}%`,
            background: `linear-gradient(90deg, ${color}80, ${color})`,
            transition: "width 800ms cubic-bezier(0.34,1.2,0.64,1)",
            boxShadow: `0 0 8px ${color}55`,
          }}
        />
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   DELIVERABLE TAB ROW
───────────────────────────────────────────── */
function DeliverableRow({ d, rateInfo, isSelected, onClick }) {
  const avg = rateInfo ? Math.round((rateInfo.min + rateInfo.max) / 2) : null
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-between px-4 py-3 rounded-xl border-0 transition-all duration-200 text-left"
      style={{
        background: isSelected ? "rgba(0,242,254,0.08)" : "rgba(255,255,255,0.02)",
        border: isSelected ? "1px solid rgba(0,242,254,0.25)" : "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <span className="text-[13px] font-medium" style={{ color: isSelected ? "#00f2fe" : "#c4c3d4" }}>
        {d.label}
      </span>
      {avg ? (
        <span className="font-mono font-bold text-[13px]" style={{ color: isSelected ? "#00f2fe" : "#8a89a0" }}>
          ₹{avg.toLocaleString()}
        </span>
      ) : (
        <span className="font-mono text-[11px]" style={{ color: "rgba(255,255,255,0.2)" }}>—</span>
      )}
    </button>
  )
}

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
export default function RateCalculator() {
  const { user } = useAuth()
  const { result, loading, error, usage, calculateRates } = useRateCalculator()

  const [platform,    setPlatform]    = useState("instagram")
  const [followers,   setFollowers]   = useState("")
  const [engagement,  setEngagement]  = useState("")
  const [niche,       setNiche]       = useState("tech")
  const [deliverable, setDeliverable] = useState("reel")
  const [resultVisible, setResultVisible] = useState(false)

  useEffect(() => {
    const loadProfile = async () => {
      const snap = await getDoc(doc(db, "users", user.uid))
      if (snap.exists()) {
        const data = snap.data()
        if (data.platform)       setPlatform(data.platform)
        if (data.followers)      setFollowers(data.followers)
        if (data.engagementRate) setEngagement(data.engagementRate)
        if (data.niche)          setNiche(data.niche)
        calculateRates(data)
      }
    }
    loadProfile()
  }, [])

  useEffect(() => {
    if (result) {
      setResultVisible(false)
      const t = setTimeout(() => setResultVisible(true), 80)
      return () => clearTimeout(t)
    }
  }, [result])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!followers || !engagement) return
    setResultVisible(false)
    calculateRates({
      name: "Creator",
      platform,
      followers: Number(followers),
      engagementRate: parseFloat(engagement),
      niche,
      audienceLocation: "India",
      contentFrequency: "weekly",
      monthlyIncome: 0,
    })
  }

  const rateInfo    = result?.rates?.[deliverable]
  const avgRate     = rateInfo ? Math.round((rateInfo.min + rateInfo.max) / 2) : 0
  const confidence  = result ? getConfidenceScore(result.engagementTier) : 0
  const platformAccent = PLATFORMS.find((p) => p.value === platform)?.accent ?? "#00f2fe"

  return (
    <AppShell>
      <RateGlow platform={platform} />

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="font-mono text-[10px] tracking-widest uppercase mb-2" style={{ color: "#8a89a0" }}>AI TOOL</p>
          <h1 className="font-display font-extrabold text-white text-3xl tracking-tight mb-1">Rate Calculator</h1>
          <p className="text-[14px]" style={{ color: "#8a89a0" }}>Optimize your brand deal pricing with AI-justified rate cards.</p>
        </div>
        <UsageBadge usage={usage} />
      </div>

      <ToolExplainer
        title="the Rate Calculator"
        what="This tool analyzes your platform, follower count, engagement rate, and niche to generate a personalized rate card for 6 types of brand deals — from sponsored posts to UGC-only content. Rates are benchmarked against real Indian creator economy data."
        steps={[
          "Select your primary platform and enter your follower count",
          "Enter your engagement rate — (likes + comments) ÷ followers × 100",
          "Pick your content niche (or type a custom one)",
          "Click Calculate — your rate card appears on the right",
          "Tap any deliverable row to see its specific rate range",
        ]}
        tip="Your engagement rate matters more than follower count. A creator with 10K followers and 8% engagement will out-earn one with 50K followers and 1% engagement."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* ── LEFT: Input panel ── */}
        <div className="lg:col-span-5">
          <form onSubmit={handleSubmit}>
            <div className="rounded-2xl p-6 space-y-5" style={{ background: "#111026", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="font-mono text-[10px] tracking-widest uppercase" style={{ color: "#8a89a0" }}>PROFILE INPUTS</p>

              {/* Platform */}
              <div>
                <label className="block font-mono text-[10px] tracking-widest uppercase mb-2" style={{ color: "#8a89a0" }}>Platform</label>
                <PlatformPicker value={platform} onChange={setPlatform} />
              </div>

              {/* Followers */}
              <div>
                <label className="block font-mono text-[10px] tracking-widest uppercase mb-2" style={{ color: "#8a89a0" }}>Followers</label>
                <DarkInput value={followers} onChange={setFollowers} placeholder="e.g. 50000" />
              </div>

              {/* Engagement */}
              <div>
                <label className="block font-mono text-[10px] tracking-widest uppercase mb-2" style={{ color: "#8a89a0" }}>Engagement Rate (%)</label>
                <DarkInput value={engagement} onChange={setEngagement} placeholder="e.g. 4.2" step="0.1" />
              </div>

              {/* Niche */}
              <div>
                <label className="block font-mono text-[10px] tracking-widest uppercase mb-2" style={{ color: "#8a89a0" }}>Niche</label>
                <NichePicker value={niche} onChange={setNiche} />
              </div>

              {/* CTA */}
              <button
                type="submit"
                disabled={loading || !followers || !engagement}
                className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl font-semibold text-[13px] border-0 transition-all duration-200"
                style={{
                  background: loading || !followers || !engagement
                    ? "rgba(255,255,255,0.08)"
                    : "linear-gradient(135deg, #00f2fe, #ef2cc1)",
                  color: loading || !followers || !engagement ? "#8a89a0" : "white",
                  boxShadow: loading || !followers || !engagement ? "none" : "0 0 24px rgba(0,242,254,0.3)",
                  cursor: loading || !followers || !engagement ? "not-allowed" : "pointer",
                }}
              >
                <Sparkles size={14} />
                {loading ? "Calculating…" : "Calculate Sponsorship Rates"}
              </button>
            </div>
          </form>
        </div>

        {/* ── RIGHT: Results ── */}
        <div className="lg:col-span-7 space-y-5">

          {/* Error */}
          {error && (
            <div className="rounded-xl px-5 py-4 text-[13px] flex items-center gap-3"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5" }}>
              <AlertCircle size={15} className="flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Empty State */}
          {!loading && !result && !error && (
            <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl"
              style={{ background: "#111026", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: "rgba(239,44,193,0.08)", border: "1px solid rgba(239,44,193,0.15)" }}>
                <BarChart2 size={28} style={{ color: "#ef2cc1" }} />
              </div>
              <h3 className="font-display font-bold text-white text-xl mb-2">Your Rate Card Awaits</h3>
              <p className="text-[14px] max-w-xs leading-relaxed" style={{ color: "#8a89a0" }}>
                Fill in your profile stats on the left to generate AI-justified sponsorship rates.
              </p>
            </div>
          )}

          {/* Loading Skeleton */}
          {loading && (
            <div className="space-y-4">
              {[180, 120, 160].map((h, i) => (
                <div key={i} className="rounded-2xl animate-pulse" style={{ height: h, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }} />
              ))}
            </div>
          )}

          {/* Results */}
          {result && !loading && (
            <div
              className="space-y-5"
              style={{
                opacity: resultVisible ? 1 : 0,
                transform: resultVisible ? "translateY(0)" : "translateY(14px)",
                transition: "opacity 320ms ease, transform 320ms ease",
              }}
            >
              {/* ── Hero Rate Card ── */}
              <div className="rounded-2xl overflow-hidden" style={{ background: "#111026", border: "1px solid rgba(255,255,255,0.07)" }}>
                {/* top accent bar — platform color */}
                <div className="h-0.5 w-full" style={{
                  background: `linear-gradient(90deg, transparent, ${platformAccent}, transparent)`
                }} />

                <div className="p-7">
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <p className="font-mono text-[10px] tracking-widest uppercase mb-1" style={{ color: "#8a89a0" }}>
                        SUGGESTED RATE · {DELIVERABLES.find((d) => d.value === deliverable)?.label}
                      </p>
                      <div className="font-display font-extrabold text-white tracking-tight" style={{ fontSize: 46, lineHeight: 1 }}>
                        <AnimatedRate target={avgRate} />
                      </div>
                      <p className="font-mono text-[12px] mt-2" style={{ color: "#8a89a0" }}>
                        Range:{" "}
                        <span className="text-white">₹{rateInfo?.min?.toLocaleString()} – ₹{rateInfo?.max?.toLocaleString()}</span>
                      </p>
                    </div>

                    {/* Market position badge */}
                    <div
                      className="px-3 py-1.5 rounded-full font-mono font-bold text-[10px] tracking-widest uppercase flex-shrink-0"
                      style={{
                        background: "rgba(34,211,165,0.15)",
                        color: "#22d3a5",
                        border: "1px solid rgba(34,211,165,0.3)",
                        boxShadow: "0 0 12px rgba(34,211,165,0.2)",
                      }}
                    >
                      {result.marketPosition}
                    </div>
                  </div>

                  <ConfidenceBar score={confidence} />

                  {/* Engagement tier chip */}
                  <div className="flex items-center gap-2 mt-4">
                    <CheckCircle size={13} style={{ color: "#22d3a5" }} />
                    <span className="font-mono text-[11px]" style={{ color: "#8a89a0" }}>
                      Engagement tier:{" "}
                      <span className="text-white font-semibold uppercase">{result.engagementTier}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* ── All Deliverables — interactive rate browser ── */}
              <div className="rounded-2xl p-6" style={{ background: "#111026", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: "rgba(252,76,2,0.12)", border: "1px solid rgba(252,76,2,0.2)" }}>
                    <Zap size={13} style={{ color: "#fc4c02" }} />
                  </div>
                  <p className="font-mono text-[10px] tracking-widest uppercase" style={{ color: "#8a89a0" }}>
                    ALL DELIVERABLES · tap to select
                  </p>
                </div>
                <div className="space-y-1.5">
                  {DELIVERABLES.map((d) => (
                    <DeliverableRow
                      key={d.value}
                      d={d}
                      rateInfo={result.rates?.[d.value]}
                      isSelected={deliverable === d.value}
                      onClick={() => setDeliverable(d.value)}
                    />
                  ))}
                </div>
              </div>

              {/* ── Justification + Strengths row ── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* Justification */}
                <div className="rounded-2xl p-6" style={{ background: "#111026", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: "rgba(0,242,254,0.1)", border: "1px solid rgba(0,242,254,0.2)" }}>
                      <TrendingUp size={13} style={{ color: "#00f2fe" }} />
                    </div>
                    <p className="font-mono text-[10px] tracking-widest uppercase" style={{ color: "#8a89a0" }}>PRICING RATIONALE</p>
                  </div>
                  <p className="text-[13px] leading-relaxed" style={{ color: "#c4c3d4" }}>{result.justification}</p>
                </div>

                {/* Strengths */}
                <div className="rounded-2xl p-6" style={{ background: "#111026", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: "rgba(34,211,165,0.1)", border: "1px solid rgba(34,211,165,0.2)" }}>
                      <Users size={13} style={{ color: "#22d3a5" }} />
                    </div>
                    <p className="font-mono text-[10px] tracking-widest uppercase" style={{ color: "#8a89a0" }}>MARKET STRENGTHS</p>
                  </div>
                  <div className="space-y-2.5">
                    {result.strengths?.map((s, i) => (
                      <div key={i} className="flex gap-3 items-start"
                        style={{ animation: `fadeUp 250ms ease ${i * 70 + 100}ms both` }}>
                        <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-[6px]"
                          style={{ background: "#22d3a5", boxShadow: "0 0 6px #22d3a588" }} />
                        <p className="text-[13px] leading-relaxed" style={{ color: "#c4c3d4" }}>{s}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}