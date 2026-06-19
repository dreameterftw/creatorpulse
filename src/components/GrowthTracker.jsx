import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { useCreator } from "../context/CreatorContext"
import { saveGrowthEntry, weekLabel, getCurrentWeekKey } from "../utils/growthTracker"
import { askGroq } from "../utils/groq"
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts"
import { TrendingUp, TrendingDown, Minus, Plus, Sparkles, ChevronDown } from "lucide-react"

const PLATFORMS = ["Instagram", "YouTube", "Twitter/X", "LinkedIn"]

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="px-3 py-2 rounded-lg text-[12px]"
      style={{ background: "#16143a", border: "1px solid rgba(239,44,193,0.3)", color: "white" }}>
      <p className="font-mono text-[10px] mb-1" style={{ color: "#8a89a0" }}>{label}</p>
      <p className="font-bold">{payload[0].value?.toLocaleString()} followers</p>
    </div>
  )
}

export default function GrowthTracker() {
  const { user }  = useAuth()
  const { profile, growthHistory, growthDelta, refreshGrowth, buildCrossContext } = useCreator()

  const [platform,    setPlatform]    = useState("")
  const [followers,   setFollowers]   = useState("")
  const [engagement,  setEngagement]  = useState("")
  const [saving,      setSaving]      = useState(false)
  const [saved,       setSaved]       = useState(false)
  const [suggestion,  setSuggestion]  = useState(null)
  const [loadingSug,  setLoadingSug]  = useState(false)
  const [showInput,   setShowInput]   = useState(false)

  // Pre-fill from profile
  useEffect(() => {
    if (profile) {
      const p = profile.platforms?.[0] || profile.platform || ""
      setPlatform(p)
      setFollowers(profile.followers || "")
      setEngagement(profile.engagementRate || "")
    }
  }, [profile])

  // Generate AI suggestion when growth data is negative or flat
  useEffect(() => {
    if (!growthDelta || !profile) return
    if (growthDelta.delta <= 0) {
      generateSuggestion(growthDelta, profile)
    }
  }, [growthDelta])

  const generateSuggestion = async (delta, prof) => {
    setLoadingSug(true)
    try {
      const crossContext = buildCrossContext()
      const trend = delta.delta < 0
        ? `losing ${Math.abs(delta.delta)} followers/week`
        : "follower count is flat (no growth)"

      const sys = `You are a creator growth strategist specializing in the Indian creator economy. Give concise, actionable advice. Always respond in valid JSON only.`
      const usr = `A ${prof.niches?.[0] || prof.niche} creator on ${prof.platforms?.[0] || prof.platform} with ${delta.latest.followers.toLocaleString()} followers is ${trend}.${crossContext}

Give 3 specific, actionable suggestions to reverse this trend. Return JSON:
{
  "headline": "short headline summarizing the situation",
  "severity": "warning | critical",
  "tips": [
    { "title": "tip title", "detail": "1 sentence actionable detail" },
    { "title": "tip title", "detail": "1 sentence actionable detail" },
    { "title": "tip title", "detail": "1 sentence actionable detail" }
  ]
}`
      const { content } = await askGroq(sys, usr, "growth_tracker")
      const parsed = JSON.parse(content.replace(/```json|```/g, "").trim())
      setSuggestion(parsed)
    } catch (e) {
      console.error(e)
    }
    setLoadingSug(false)
  }

  const handleSave = async () => {
    if (!followers || !platform) return
    setSaving(true)
    await saveGrowthEntry(user.uid, platform, followers, engagement)
    await refreshGrowth(platform)
    setSaved(true)
    setShowInput(false)
    setTimeout(() => setSaved(false), 2000)
    setSaving(false)
  }

  const chartData = growthHistory.map(e => ({
    week: weekLabel(e.weekKey),
    followers: e.followers,
  }))

  const delta = growthDelta
  const isGrowing  = delta && delta.delta > 0
  const isFlat     = delta && delta.delta === 0
  const isDecline  = delta && delta.delta < 0

  const deltaColor = isGrowing ? "#22d3a5" : isDecline ? "#ef4444" : "#8a89a0"
  const DeltaIcon  = isGrowing ? TrendingUp : isDecline ? TrendingDown : Minus

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "#111026", border: "1px solid rgba(255,255,255,0.07)" }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2">
          <TrendingUp size={15} style={{ color: "#00f2fe" }} />
          <span className="font-mono text-[11px] tracking-widest uppercase text-[#8a89a0]">
            Growth Tracker
          </span>
          {delta && (
            <span className="font-mono text-[11px] px-2 py-0.5 rounded-full ml-1"
              style={{ background: `${deltaColor}15`, color: deltaColor, border: `1px solid ${deltaColor}30` }}>
              <DeltaIcon size={10} className="inline mr-1" />
              {isGrowing ? "+" : ""}{delta.delta.toLocaleString()} this week
            </span>
          )}
        </div>
        <button
          onClick={() => setShowInput(s => !s)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all"
          style={{ background: "rgba(0,242,254,0.08)", border: "1px solid rgba(0,242,254,0.2)", color: "#00f2fe" }}
        >
          <Plus size={12} /> Log this week
        </button>
      </div>

      {/* Input form */}
      {showInput && (
        <div className="px-5 py-4 space-y-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
          <div className="flex flex-wrap gap-2 mb-2">
            {PLATFORMS.map(p => (
              <button key={p} onClick={() => setPlatform(p)}
                className="px-3 py-1.5 rounded-full text-[12px] font-medium transition-all"
                style={platform === p ? {
                  background: "linear-gradient(135deg,rgba(0,242,254,0.15),rgba(239,44,193,0.15))",
                  border: "1px solid rgba(239,44,193,0.5)", color: "white"
                } : {
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)"
                }}>
                {p}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-[10px] tracking-widest uppercase text-[#8a89a0] mb-1">Follower Count</label>
              <input
                type="number" value={followers}
                onChange={e => setFollowers(e.target.value)}
                placeholder="e.g. 48500"
                className="w-full px-3 py-2 rounded-lg text-[13px] outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "white" }}
                onFocus={e => e.target.style.borderColor = "rgba(0,242,254,0.5)"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.09)"}
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] tracking-widest uppercase text-[#8a89a0] mb-1">Engagement % (optional)</label>
              <input
                type="number" value={engagement}
                onChange={e => setEngagement(e.target.value)}
                placeholder="e.g. 6.2"
                className="w-full px-3 py-2 rounded-lg text-[13px] outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "white" }}
                onFocus={e => e.target.style.borderColor = "rgba(0,242,254,0.5)"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.09)"}
              />
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !followers || !platform}
            className="w-full py-2 rounded-lg text-[13px] font-semibold transition-all"
            style={{
              background: saved ? "rgba(34,211,165,0.2)"
                : (!followers || !platform) ? "rgba(255,255,255,0.06)"
                : "linear-gradient(135deg, #00f2fe, #ef2cc1)",
              color: saved ? "#22d3a5" : (!followers || !platform) ? "#8a89a0" : "#0a0916",
              border: saved ? "1px solid rgba(34,211,165,0.4)" : "none",
            }}
          >
            {saved ? "✓ Saved!" : saving ? "Saving…" : "Save This Week's Numbers"}
          </button>
        </div>
      )}

      {/* Chart */}
      {chartData.length > 1 ? (
        <div className="px-5 pt-4 pb-3">
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={chartData}>
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#8a89a0" }} axisLine={false} tickLine={false} />
              <YAxis hide domain={["auto", "auto"]} />
              <Tooltip content={<CustomTooltip />} />
              {delta && delta.delta < 0 && (
                <ReferenceLine y={delta.prev.followers} stroke="rgba(239,68,68,0.3)" strokeDasharray="4 4" />
              )}
              <Line
                type="monotone" dataKey="followers"
                stroke="url(#growthGrad)" strokeWidth={2}
                dot={{ fill: "#ef2cc1", r: 3, strokeWidth: 0 }}
                activeDot={{ fill: "#00f2fe", r: 5, strokeWidth: 0 }}
              />
              <defs>
                <linearGradient id="growthGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#ef2cc1" />
                  <stop offset="100%" stopColor="#00f2fe" />
                </linearGradient>
              </defs>
            </LineChart>
          </ResponsiveContainer>

          {/* Delta summary */}
          {delta && (
            <div className="flex items-center justify-between mt-2 px-1">
              <span className="font-mono text-[11px]" style={{ color: "#8a89a0" }}>
                {delta.prev.followers.toLocaleString()} → {delta.latest.followers.toLocaleString()}
              </span>
              <span className="font-mono text-[11px] font-bold" style={{ color: deltaColor }}>
                {isGrowing ? "+" : ""}{delta.pct}% week-over-week
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="px-5 py-6 text-center">
          <p className="text-[13px]" style={{ color: "#8a89a0" }}>
            Log at least 2 weeks of data to see your growth chart.
          </p>
        </div>
      )}

      {/* AI suggestions for flat/declining growth */}
      {loadingSug && (
        <div className="px-5 pb-4">
          <div className="flex items-center gap-2 text-[12px]" style={{ color: "#8a89a0" }}>
            <Sparkles size={12} className="animate-pulse" style={{ color: "#ef2cc1" }} />
            Analyzing your growth pattern…
          </div>
        </div>
      )}

      {suggestion && !loadingSug && (isFlat || isDecline) && (
        <div className="mx-5 mb-5 rounded-xl p-4"
          style={{
            background: suggestion.severity === "critical" ? "rgba(239,68,68,0.06)" : "rgba(252,76,2,0.06)",
            border: `1px solid ${suggestion.severity === "critical" ? "rgba(239,68,68,0.2)" : "rgba(252,76,2,0.2)"}`,
          }}>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={13} style={{ color: suggestion.severity === "critical" ? "#ef4444" : "#fc4c02" }} />
            <p className="text-[13px] font-semibold text-white">{suggestion.headline}</p>
          </div>
          <div className="space-y-2">
            {suggestion.tips?.map((tip, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="font-mono text-[11px] font-bold mt-0.5 flex-shrink-0"
                  style={{ color: suggestion.severity === "critical" ? "#ef4444" : "#fc4c02" }}>
                  {i + 1}.
                </span>
                <div>
                  <p className="text-[12px] font-semibold text-white">{tip.title}</p>
                  <p className="text-[12px]" style={{ color: "#8a89a0" }}>{tip.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
