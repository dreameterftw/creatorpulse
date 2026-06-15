import { useState, useEffect, useRef } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "../firebase/config"
import { useAuth } from "../context/AuthContext"
import { useCreator } from "../context/CreatorContext"
import { useWhatIfSimulator } from "../hooks/useWhatIfSimulator"
import AppShell from "../components/AppShell"
import PageHeader from "../components/PageHeader"
import UsageBadge from "../components/UsageBadge"
import ToolExplainer from "../components/ToolExplainer"
import {
  Sparkles, Sliders, TrendingUp, Calendar, CheckCircle2,
  RotateCcw, ArrowUpRight, Zap, Target, Users, Activity
} from "lucide-react"

const FREQUENCIES = ["Daily", "3-4x per week", "1-2x per week", "A few times a month"]

/* ---------------- Ambient background glows ---------------- */
function SimGlow({ delta }) {
  // shift accent based on projected gain
  const topColor =
    delta > 80 ? "rgba(46,213,115,0.20)" :
    delta > 30 ? "rgba(0,242,254,0.18)" :
    "rgba(239,44,193,0.16)"
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
      <div
        className="absolute -top-40 -right-40 w-[520px] h-[520px] rounded-full transition-all duration-1000"
        style={{ background: `radial-gradient(circle, ${topColor} 0%, transparent 70%)`, filter: "blur(60px)" }}
      />
      <div
        className="absolute -bottom-40 -left-40 w-[480px] h-[480px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(239,44,193,0.14) 0%, transparent 70%)", filter: "blur(60px)" }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(255,140,66,0.08) 0%, transparent 70%)", filter: "blur(80px)" }}
      />
    </div>
  )
}

/* ---------------- Animated number counter ---------------- */
function useCountUp(target, duration = 900, deps = []) {
  const [val, setVal] = useState(0)
  const prev = useRef(0)
  useEffect(() => {
    const from = prev.current
    const to = Number(target) || 0
    const start = performance.now()
    let raf
    const tick = (t) => {
      const p = Math.min(1, (t - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(from + (to - from) * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
      else prev.current = to
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line
  }, deps)
  return val
}

/* ---------------- Branded slider ---------------- */
function BrandedSlider({ label, value, min, max, step, onChange, suffix = "", current, accent = "#00f2fe" }) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="font-mono text-[10px] tracking-widest uppercase text-[#8a89a0]">{label}</span>
        <span className="font-mono text-[13px] font-bold text-white">
          {typeof value === "number" && value >= 1000 ? value.toLocaleString() : value}{suffix}
        </span>
      </div>
      <div className="relative">
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-200"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${accent}, #ef2cc1)`,
              boxShadow: `0 0 12px ${accent}66`
            }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={onChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white pointer-events-none transition-all duration-200"
          style={{
            left: `calc(${pct}% - 8px)`,
            boxShadow: `0 0 0 3px ${accent}33, 0 0 12px ${accent}88`
          }}
        />
      </div>
      {current !== undefined && (
        <span className="text-[10px] text-[#5d5c75] font-mono mt-1.5 inline-block">
          Now: {typeof current === "number" && current >= 1000 ? current.toLocaleString() : current}{suffix}
        </span>
      )}
    </div>
  )
}

/* ---------------- Comparison bars ---------------- */
function CompareBars({ current, projected }) {
  const max = Math.max(current, projected) * 1.1 || 1
  const curPct = (current / max) * 100
  const projPct = (projected / max) * 100
  const [mounted, setMounted] = useState(false)
  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t) }, [current, projected])

  return (
    <div className="space-y-5">
      <div>
        <div className="flex justify-between text-[11px] mb-1.5">
          <span className="font-mono text-[#8a89a0] uppercase tracking-widest text-[10px]">Today</span>
          <span className="font-mono text-white">₹{current.toLocaleString()}</span>
        </div>
        <div className="h-3 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{
              width: mounted ? `${curPct}%` : "0%",
              background: "linear-gradient(90deg, rgba(255,255,255,0.15), rgba(255,255,255,0.3))"
            }}
          />
        </div>
      </div>
      <div>
        <div className="flex justify-between text-[11px] mb-1.5">
          <span className="font-mono text-[#00f2fe] uppercase tracking-widest text-[10px]">Projected</span>
          <span className="font-mono font-bold text-white">₹{projected.toLocaleString()}</span>
        </div>
        <div className="h-3 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{
              width: mounted ? `${projPct}%` : "0%",
              background: "linear-gradient(90deg, #00f2fe, #ef2cc1)",
              boxShadow: "0 0 16px rgba(0,242,254,0.5)",
              transitionDelay: "200ms"
            }}
          />
        </div>
      </div>
    </div>
  )
}

/* ============================================================ */
export default function WhatIfSimulator() {
  const { user } = useAuth()
  const { profile } = useCreator()
  const { result, loading, error, usage, simulate } = useWhatIfSimulator()
  const [sim, setSim] = useState(null)
  const [resultMounted, setResultMounted] = useState(false)

  // Initialise sim sliders when profile loads from context
  useEffect(() => {
    if (profile && !sim) {
      setSim({
        platform: profile.platforms?.[0] || profile.platform || "Instagram",
        niche: profile.niches?.[0] || profile.niche || "Tech",
        followers: Number(profile.followers) || 10000,
        engagementRate: Number(profile.engagementRate) || 3.0,
        contentFrequency: profile.contentFrequency || "1-2x per week",
      })
    }
  }, [profile])

  useEffect(() => {
    if (result) {
      setResultMounted(false)
      const t = setTimeout(() => setResultMounted(true), 40)
      return () => clearTimeout(t)
    }
  }, [result])

  const resetSim = () => {
    if (!profile) return
    setSim({
      platform: profile.platforms?.[0] || profile.platform || "Instagram",
      niche: profile.niches?.[0] || profile.niche || "Tech",
      followers: Number(profile.followers) || 10000,
      engagementRate: Number(profile.engagementRate) || 3.0,
      contentFrequency: profile.contentFrequency || "1-2x per week"
    })
  }

  const hasChanges = profile && sim && (
    Number(sim.followers) !== Number(profile.followers) ||
    Number(sim.engagementRate) !== Number(profile.engagementRate) ||
    sim.contentFrequency !== profile.contentFrequency
  )

  // delta % for glow tinting
  const deltaPct = result?.incomeIncrease?.percentage || 0

  // animated counters
  const currentIncome = result?.currentEstimate?.monthlyIncomePotential || 0
  const projectedIncome = result?.simulatedEstimate?.monthlyIncomePotential || 0
  const incomeDelta = result?.incomeIncrease?.absolute || 0
  const animDelta = useCountUp(incomeDelta, 1100, [incomeDelta])
  const animPct = useCountUp(deltaPct, 1100, [deltaPct])

  if (!profile || !sim) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-40 relative z-10">
          <p className="text-[#8a89a0] text-[13px] font-mono">Loading simulator configs...</p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <SimGlow delta={deltaPct} />

      <div className="relative z-10">
        <PageHeader
          eyebrow="AI TOOL"
          title="What-If Simulator"
          description="Project and simulate your future creator earnings based on metrics shifts."
          action={<UsageBadge usage={usage} />}
        />

        <ToolExplainer
          title="the What-If Simulator"
          what="This tool lets you model hypothetical growth scenarios — change your followers, engagement rate, or posting frequency and instantly see how your estimated sponsorship rates and monthly income potential would shift. It's a planning tool, not a guarantee."
          steps={[
            "Adjust the Followers slider to a target you're working towards",
            "Set your desired engagement rate and posting frequency",
            "Hit Run Simulation — the AI projects your new earning potential",
            "Check the Action Plan section for concrete steps to get there",
          ]}
          tip="The biggest income jumps usually come from improving engagement rate, not just follower count. Try bumping engagement by 2% and see what happens."
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mb-6">

          {/* ============ LEFT: Growth Controls ============ */}
          <div
            className="lg:col-span-5 rounded-xl border border-white/[0.06] p-6 space-y-6"
            style={{ background: "#111026" }}
          >
            <div className="flex items-center justify-between">
              <p className="font-mono text-[10px] tracking-widest uppercase text-[#8a89a0] flex items-center gap-2">
                <Sliders size={12} className="text-[#00f2fe]" /> Growth Controls
              </p>
              {hasChanges && (
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#ef2cc1] px-2 py-1 rounded bg-[#ef2cc1]/10">
                  Unsaved
                </span>
              )}
            </div>

            <BrandedSlider
              label="Followers"
              value={sim.followers}
              min={500}
              max={1000000}
              step={500}
              onChange={(e) => setSim((s) => ({ ...s, followers: Number(e.target.value) }))}
              current={Number(profile.followers || 0)}
              accent="#00f2fe"
            />

            <BrandedSlider
              label="Engagement Rate"
              value={sim.engagementRate}
              min={0.2}
              max={15}
              step={0.1}
              suffix="%"
              onChange={(e) => setSim((s) => ({ ...s, engagementRate: Number(e.target.value) }))}
              current={profile.engagementRate || 0}
              accent="#ef2cc1"
            />

            {/* Frequency pills */}
            <div>
              <label className="block font-mono text-[10px] tracking-widest uppercase text-[#8a89a0] mb-2">
                Posting Frequency
              </label>
              <div className="grid grid-cols-2 gap-2">
                {FREQUENCIES.map((freq) => {
                  const active = sim.contentFrequency === freq
                  return (
                    <button
                      key={freq}
                      onClick={() => setSim((s) => ({ ...s, contentFrequency: freq }))}
                      className="text-[11px] font-mono uppercase tracking-wider py-2.5 px-3 rounded-lg border transition-all duration-200"
                      style={{
                        background: active ? "rgba(0,242,254,0.10)" : "rgba(255,255,255,0.02)",
                        borderColor: active ? "rgba(0,242,254,0.4)" : "rgba(255,255,255,0.06)",
                        color: active ? "#00f2fe" : "#8a89a0",
                        boxShadow: active ? "0 0 16px rgba(0,242,254,0.15)" : "none"
                      }}
                    >
                      {freq}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => simulate(profile, sim)}
                disabled={loading}
                className="flex-1 text-[13px] py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all duration-200"
                style={{
                  background: loading
                    ? "rgba(255,255,255,0.05)"
                    : "linear-gradient(90deg, #00f2fe, #ef2cc1)",
                  color: loading ? "#5d5c75" : "#0d0c1e",
                  boxShadow: loading ? "none" : "0 0 24px rgba(0,242,254,0.35)",
                  cursor: loading ? "not-allowed" : "pointer"
                }}
              >
                <Sparkles size={14} />
                {loading ? "Projecting..." : "Run Simulation"}
              </button>
              <button
                onClick={resetSim}
                className="px-3 py-3 rounded-lg border border-white/[0.06] text-[#8a89a0] hover:text-white hover:border-white/20 transition-colors"
                title="Reset to current profile"
              >
                <RotateCcw size={15} />
              </button>
            </div>
          </div>

          {/* ============ RIGHT: Hero result ============ */}
          <div className="lg:col-span-7 space-y-6">
            {error && (
              <div className="rounded-xl p-4 border border-red-500/20 text-red-300 text-[13px] font-mono"
                style={{ background: "linear-gradient(135deg, #1a0a0a, #111026)" }}>
                {error}
              </div>
            )}

            {!result ? (
              <div
                className="rounded-xl border border-white/[0.06] p-10 text-center"
                style={{ background: "#111026" }}
              >
                <div
                  className="inline-flex w-14 h-14 rounded-full items-center justify-center mb-4"
                  style={{
                    background: "rgba(0,242,254,0.08)",
                    boxShadow: "0 0 24px rgba(0,242,254,0.2)"
                  }}
                >
                  <TrendingUp size={22} className="text-[#00f2fe]" />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">Run Earning Projections</h3>
                <p className="text-[#8a89a0] text-[13px] max-w-sm mx-auto leading-relaxed">
                  Adjust the sliders to project how scaling followers, posting frequency,
                  or engagement reshapes your monthly brand revenue.
                </p>
              </div>
            ) : (
              <div
                className="relative rounded-xl border border-white/[0.06] overflow-hidden transition-all duration-700"
                style={{
                  background: "#111026",
                  opacity: resultMounted ? 1 : 0,
                  transform: resultMounted ? "translateY(0)" : "translateY(14px)"
                }}
              >
                {/* top accent line */}
                <div
                  className="absolute top-0 left-0 right-0 h-[2px]"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, #00f2fe, #ef2cc1, transparent)"
                  }}
                />

                <div className="p-6">
                  <p className="font-mono text-[10px] tracking-widest uppercase text-[#8a89a0] mb-2 flex items-center gap-2">
                    <Zap size={12} className="text-[#00f2fe]" /> Projected Growth Potential
                  </p>
                  <div className="flex items-end justify-between flex-wrap gap-3">
                    <div>
                      <h2
                        className="text-4xl font-extrabold tracking-tight"
                        style={{
                          background: "linear-gradient(90deg, #00f2fe, #ef2cc1)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent"
                        }}
                      >
                        +₹{animDelta.toLocaleString()}
                      </h2>
                      <span className="text-[11px] font-mono text-[#8a89a0] uppercase tracking-widest">
                        per month
                      </span>
                    </div>
                    <div
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[12px] font-bold"
                      style={{
                        background: "rgba(46,213,115,0.10)",
                        color: "#2ed573",
                        boxShadow: "0 0 16px rgba(46,213,115,0.18)"
                      }}
                    >
                      <ArrowUpRight size={14} />
                      +{animPct}%
                    </div>
                  </div>

                  <div className="h-px bg-white/[0.06] my-6" />

                  <p className="font-mono text-[10px] tracking-widest uppercase text-[#8a89a0] mb-4">
                    Revenue Trajectory
                  </p>
                  <CompareBars current={currentIncome} projected={projectedIncome} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ============ Below-the-fold detail ============ */}
        {result && (
          <div
            className="space-y-6 transition-all duration-700"
            style={{
              opacity: resultMounted ? 1 : 0,
              transform: resultMounted ? "translateY(0)" : "translateY(14px)",
              transitionDelay: "120ms"
            }}
          >
            {/* Current vs Future split */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ProfileCard
                title="Current Creator Profile"
                icon={<Users size={12} />}
                accent="#8a89a0"
                data={result.currentEstimate}
                muted
              />
              <ProfileCard
                title="Future Creator Profile"
                icon={<Target size={12} />}
                accent="#00f2fe"
                data={result.simulatedEstimate}
              />
            </div>

            {/* AI grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Feasibility / Timeline */}
              <div
                className="rounded-xl border border-white/[0.06] p-6 space-y-5"
                style={{ background: "#111026" }}
              >
                <div>
                  <p className="font-mono text-[10px] tracking-widest uppercase text-[#8a89a0] mb-2 flex items-center gap-2">
                    <Calendar size={12} className="text-[#ef2cc1]" /> Time to Achieve
                  </p>
                  <h4
                    className="text-2xl font-extrabold"
                    style={{
                      background: "linear-gradient(90deg, #ef2cc1, #ff8c42)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent"
                    }}
                  >
                    {result.timeToAchieve}
                  </h4>
                </div>
                <div className="h-px bg-white/[0.06]" />
                <div>
                  <p className="font-mono text-[10px] tracking-widest uppercase text-[#8a89a0] mb-2 flex items-center gap-2">
                    <CheckCircle2 size={12} className="text-[#2ed573]" /> Feasibility Note
                  </p>
                  <p className="text-[13px] text-[#c5c4d8] leading-relaxed">
                    {result.feasibilityNote}
                  </p>
                </div>
              </div>

              {/* Action plan */}
              <div
                className="rounded-xl border border-white/[0.06] p-6"
                style={{ background: "#111026" }}
              >
                <p className="font-mono text-[10px] tracking-widest uppercase text-[#8a89a0] mb-4 flex items-center gap-2">
                  <Activity size={12} className="text-[#00f2fe]" /> Simulation Action Plan
                </p>
                <ol className="space-y-3">
                  {result.actionPlan?.map((step, idx) => (
                    <li
                      key={idx}
                      className="flex gap-3 items-start transition-all duration-500"
                      style={{
                        opacity: resultMounted ? 1 : 0,
                        transform: resultMounted ? "translateX(0)" : "translateX(-8px)",
                        transitionDelay: `${200 + idx * 80}ms`
                      }}
                    >
                      <span
                        className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center font-mono text-[11px] font-bold"
                        style={{
                          background: "rgba(0,242,254,0.12)",
                          color: "#00f2fe",
                          boxShadow: "inset 0 0 0 1px rgba(0,242,254,0.25)"
                        }}
                      >
                        {idx + 1}
                      </span>
                      <span className="text-[13px] text-[#c5c4d8] leading-relaxed pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}

/* ---------------- Profile comparison card ---------------- */
function ProfileCard({ title, icon, accent, data, muted = false }) {
  const rows = [
    { label: "Positioning", value: (data?.marketPosition || "—").toUpperCase() },
    { label: "Rate per post", value: `₹${(data?.sponsoredPostRate || 0).toLocaleString()}` },
    { label: "Monthly Potential", value: `₹${(data?.monthlyIncomePotential || 0).toLocaleString()}` }
  ]
  return (
    <div
      className="rounded-xl border p-6 relative overflow-hidden"
      style={{
        background: muted ? "#111026" : "linear-gradient(135deg, rgba(0,242,254,0.06), #111026 60%)",
        borderColor: muted ? "rgba(255,255,255,0.06)" : "rgba(0,242,254,0.18)"
      }}
    >
      {!muted && (
        <div
          className="absolute -top-20 -right-20 w-40 h-40 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(0,242,254,0.18) 0%, transparent 70%)",
            filter: "blur(30px)"
          }}
        />
      )}
      <p
        className="font-mono text-[10px] tracking-widest uppercase mb-4 flex items-center gap-2 relative"
        style={{ color: accent }}
      >
        {icon} {title}
      </p>
      <div className="space-y-3 relative">
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between items-center text-[13px]">
            <span className="text-[#8a89a0] font-mono text-[11px] uppercase tracking-wider">{r.label}</span>
            <span
              className="font-bold font-mono"
              style={{ color: muted ? "#c5c4d8" : "#ffffff" }}
            >
              {r.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
