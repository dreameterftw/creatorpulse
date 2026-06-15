import { useEffect, useMemo, useRef, useState } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "../firebase/config"
import { useAuth } from "../context/AuthContext"
import { useGapAnalyzer } from "../hooks/useGapAnalyzer"
import AppShell from "../components/AppShell"
import PageHeader from "../components/PageHeader"
import UsageBadge from "../components/UsageBadge"
import ToolExplainer from "../components/ToolExplainer"
import { CardSkeleton } from "../components/LoadingSkeleton"
import { Zap, TrendingUp, RefreshCw, AlertTriangle, Sparkles } from "lucide-react"

/* ---------- Count-up hook (matches WhatIfSimulator) ---------- */
function useCountUp(target, { duration = 900, deps = [] } = {}) {
  const [val, setVal] = useState(0)
  const raf = useRef()
  useEffect(() => {
    const start = performance.now()
    const from = 0
    const to = Number(target) || 0
    const tick = (t) => {
      const p = Math.min(1, (t - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(from + (to - from) * eased))
      if (p < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
    // eslint-disable-next-line
  }, deps)
  return val
}

/* ---------- Ambient gap glow (red intensity scales w/ missed %) ---------- */
function GapGlow({ intensity = 0 }) {
  // intensity 0..1
  const pinkOpacity = 0.10 + intensity * 0.18
  const cyanOpacity = 0.06 + (1 - intensity) * 0.12
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div
        className="absolute -top-32 -left-24 w-[520px] h-[520px] rounded-full blur-[120px] transition-all duration-700"
        style={{ background: `rgba(236,72,153,${pinkOpacity})` }}
      />
      <div
        className="absolute -bottom-40 -right-24 w-[560px] h-[560px] rounded-full blur-[140px] transition-all duration-700"
        style={{ background: `rgba(34,211,238,${cyanOpacity})` }}
      />
      <div className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.6) 1px,transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
    </div>
  )
}

export default function GapRadar() {
  const { user } = useAuth()
  const { result, loading, error, usage, analyzeGaps } = useGapAnalyzer()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const fetchAndAnalyze = async () => {
      const snap = await getDoc(doc(db, "users", user.uid))
      if (snap.exists()) analyzeGaps(snap.data())
    }
    fetchAndAnalyze()
  }, [])

  const streams = result?.streams || [
    { label: "Brand Deals", score: 85, monthlyPotential: 45000, currentlyUsing: true },
    { label: "UGC Licensing", score: 40, monthlyPotential: 18500, currentlyUsing: false },
    { label: "Affiliate Revenue", score: 30, monthlyPotential: 12000, currentlyUsing: false },
    { label: "Courses", score: 10, monthlyPotential: 25000, currentlyUsing: false },
    { label: "Memberships", score: 15, monthlyPotential: 15000, currentlyUsing: false },
    { label: "Consulting", score: 20, monthlyPotential: 20000, currentlyUsing: false },
  ]

  const totalMissed = streams.filter(s => !s.currentlyUsing).reduce((s, x) => s + x.monthlyPotential, 0)
  const currentTotal = result?.currentMonthlyEstimate || 45000
  const potentialTotal = currentTotal + totalMissed
  const intensity = Math.min(1, totalMissed / Math.max(potentialTotal, 1))

  const animCurrent = useCountUp(currentTotal, { deps: [currentTotal, mounted] })
  const animPotential = useCountUp(potentialTotal, { deps: [potentialTotal, mounted] })
  const animMissed = useCountUp(totalMissed, { deps: [totalMissed, mounted] })

  const opportunities = useMemo(
    () => streams.filter(s => !s.currentlyUsing).sort((a, b) => b.monthlyPotential - a.monthlyPotential),
    [streams],
  )

  const getNodeCoords = (i, total) => {
    const angle = (i * 2 * Math.PI) / total - Math.PI / 2
    return { x: 150 + 105 * Math.cos(angle), y: 150 + 105 * Math.sin(angle) }
  }

  const refresh = async () => {
    const snap = await getDoc(doc(db, "users", user.uid))
    if (snap.exists()) analyzeGaps(snap.data())
  }

  return (
    <AppShell>
      <div className="relative">
        <GapGlow intensity={intensity} />

        <PageHeader
          eyebrow="AI TOOL"
          title="Monetization Gap Radar"
          description="Audit your creator revenue streams and uncover untapped monetization gaps."
          action={<UsageBadge usage={usage} />}
        />

        <ToolExplainer
          title="the Gap Radar"
          what="The Gap Radar audits your current income streams against 8 possible monetization channels and calculates the exact monthly income you're missing. It ranks each untapped stream by priority and tells you exactly how to start."
          steps={[
            "The tool auto-loads your profile — no inputs needed",
            "It evaluates all 8 income streams: brand deals, affiliate, UGC, courses, memberships, and more",
            "Your current vs potential monthly income is shown at the top",
            "The Revenue Wheel visualizes your stream coverage at a glance",
            "Scroll down to see each gap ranked by priority and monthly potential",
          ]}
          tip="UGC (User Generated Content) is the fastest income stream to start — brands pay for content creation without requiring you to post it."
        />

        {loading && (
          <div className="space-y-4 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <CardSkeleton height="100px" />
              <CardSkeleton height="100px" />
              <CardSkeleton height="100px" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5"><CardSkeleton height="360px" /></div>
              <div className="lg:col-span-7"><CardSkeleton height="360px" /></div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-xl border border-pink-400/30 bg-pink-500/10 text-pink-200 p-4 flex items-start gap-3">
            <AlertTriangle size={18} className="mt-0.5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {!loading && !error && (
          <div
            className="space-y-8 mt-2"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? "translateY(0)" : "translateY(14px)",
              transition: "opacity .6s ease, transform .6s ease",
              transitionDelay: ".05s",
            }}
          >
            {/* KPI row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <KpiCard
                label="Current Income"
                value={`₹${animCurrent.toLocaleString()}`}
                suffix="/mo"
                tone="neutral"
              />
              <KpiCard
                label="Your Potential"
                value={`₹${animPotential.toLocaleString()}`}
                suffix="/mo"
                tone="cyan"
                icon={<TrendingUp size={14} />}
              />
              <KpiCard
                label="Left On Table"
                value={`₹${animMissed.toLocaleString()}`}
                suffix="/mo"
                tone="pink"
                icon={<AlertTriangle size={14} />}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Revenue Wheel */}
              <div className="lg:col-span-5">
                <div className="relative h-full rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6 overflow-hidden">
                  <div
                    className="absolute inset-0 -z-10 opacity-60"
                    style={{
                      background:
                        "radial-gradient(circle at 50% 50%, rgba(34,211,238,0.10), transparent 60%)",
                    }}
                  />
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-white/40">
                      Revenue Wheel
                    </p>
                    <span className="text-[10px] font-mono uppercase text-cyan-300/80 flex items-center gap-1">
                      <Sparkles size={11} /> Live
                    </span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="relative w-[320px] h-[320px]">
                      <svg width="100%" height="100%" viewBox="0 0 300 300" className="overflow-visible">
                        <defs>
                          <radialGradient id="hubGrad" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.9" />
                            <stop offset="100%" stopColor="#0e7490" stopOpacity="1" />
                          </radialGradient>
                          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="3" result="b" />
                            <feMerge>
                              <feMergeNode in="b" />
                              <feMergeNode in="SourceGraphic" />
                            </feMerge>
                          </filter>
                        </defs>

                        {/* spokes */}
                        {streams.map((s, i) => {
                          const { x, y } = getNodeCoords(i, streams.length)
                          return (
                            <line
                              key={`l-${i}`}
                              x1={150} y1={150} x2={x} y2={y}
                              stroke={s.currentlyUsing ? "rgba(34,211,238,0.6)" : "rgba(255,255,255,0.12)"}
                              strokeWidth={s.currentlyUsing ? 1.5 : 1}
                              strokeDasharray={s.currentlyUsing ? "0" : "3,4"}
                              style={{
                                strokeDashoffset: mounted ? 0 : 200,
                                transition: `stroke-dashoffset .9s ease ${i * 70}ms`,
                              }}
                            />
                          )
                        })}

                        {/* outer ring pulse */}
                        <circle
                          cx={150} cy={150} r={105}
                          fill="none"
                          stroke="rgba(255,255,255,0.06)"
                          strokeWidth="1"
                        />

                        {/* hub */}
                        <circle cx={150} cy={150} r={44} fill="url(#hubGrad)" filter="url(#glow)" />
                        <circle cx={150} cy={150} r={44} fill="none" stroke="rgba(34,211,238,0.5)" strokeWidth="1" />
                        <text x={150} y={144} textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="500" opacity="0.7">CURRENT</text>
                        <text x={150} y={160} textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="700">
                          ₹{Math.round(animCurrent / 1000)}k
                        </text>

                        {/* nodes */}
                        {streams.map((s, i) => {
                          const { x, y } = getNodeCoords(i, streams.length)
                          const active = s.currentlyUsing
                          return (
                            <g
                              key={`n-${i}`}
                              style={{
                                opacity: mounted ? 1 : 0,
                                transform: mounted ? "scale(1)" : "scale(0.6)",
                                transformOrigin: `${x}px ${y}px`,
                                transition: `opacity .5s ease ${200 + i * 80}ms, transform .5s cubic-bezier(.34,1.56,.64,1) ${200 + i * 80}ms`,
                              }}
                            >
                              <circle
                                cx={x} cy={y} r={20}
                                fill={active ? "rgba(34,211,238,0.15)" : "rgba(255,255,255,0.04)"}
                                stroke={active ? "rgba(34,211,238,0.8)" : "rgba(255,255,255,0.18)"}
                                strokeWidth={1.5}
                                filter={active ? "url(#glow)" : undefined}
                              />
                              <circle
                                cx={x} cy={y} r={5}
                                fill={active ? "#22d3ee" : "rgba(236,72,153,0.7)"}
                              />
                              <text
                                x={x}
                                y={y > 150 ? y + 30 : y - 26}
                                textAnchor="middle"
                                fill={active ? "#ffffff" : "rgba(255,255,255,0.55)"}
                                fontSize="10"
                                fontWeight="600"
                              >
                                {s.label.split(" ")[0]}
                              </text>
                            </g>
                          )
                        })}
                      </svg>
                    </div>

                    <div className="mt-3 flex items-center gap-4 text-[11px] font-mono uppercase tracking-wider">
                      <span className="flex items-center gap-1.5 text-cyan-300/90">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                        Active
                      </span>
                      <span className="flex items-center gap-1.5 text-white/40">
                        <span className="w-2 h-2 rounded-full bg-pink-400/70" />
                        Untapped
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Opportunities */}
              <div className="lg:col-span-7 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-white/40">
                    Missed Opportunities
                  </p>
                  <span className="text-[10px] font-mono uppercase text-pink-300/80">
                    {opportunities.length} gaps found
                  </span>
                </div>

                <div className="space-y-3">
                  {opportunities.map((opp, idx) => (
                    <div
                      key={idx}
                      className="group relative rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-cyan-400/30 transition-all duration-300 p-4 flex items-start justify-between gap-4 overflow-hidden"
                      style={{
                        opacity: mounted ? 1 : 0,
                        transform: mounted ? "translateY(0)" : "translateY(10px)",
                        transition: `opacity .5s ease ${idx * 70}ms, transform .5s ease ${idx * 70}ms, background-color .25s, border-color .25s`,
                      }}
                    >
                      <div
                        className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-cyan-400 to-pink-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                      <div className="flex gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-pink-500/20 to-cyan-500/10 border border-white/10 flex items-center justify-center text-pink-300 flex-shrink-0">
                          <Zap size={15} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-[14px] font-semibold text-white mb-0.5">
                            {opp.label} Gap
                          </h4>
                          <p className="text-[13px] text-white/55 leading-snug">
                            {opp.tip || `Tap into new sponsorship formats and revenue structures to expand brand reach.`}
                          </p>
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-cyan-200 mt-2 font-mono uppercase bg-cyan-400/10 border border-cyan-400/20 px-2 py-0.5 rounded">
                            Complexity: {opp.score > 50 ? "Medium" : "Easy"}
                          </span>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div className="text-[10px] text-white/40 font-mono uppercase tracking-wider">Potential</div>
                        <div className="text-[15px] font-bold text-green-400 mt-0.5 drop-shadow-[0_0_6px_rgba(74,222,128,0.35)]">
                          +₹{opp.monthlyPotential?.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-white/40 font-mono">/mo</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={refresh}
              className="group w-full py-3 rounded-xl font-medium border border-white/15 text-white/85 bg-white/[0.03] hover:bg-white/[0.07] hover:border-cyan-400/40 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw size={15} className="transition-transform group-hover:rotate-180 duration-500" />
              Refresh Gap Analysis
            </button>
          </div>
        )}
      </div>
    </AppShell>
  )
}

/* ---------- KPI card ---------- */
function KpiCard({ label, value, suffix, tone = "neutral", icon }) {
  const tones = {
    neutral: {
      border: "border-white/10",
      bg: "bg-white/[0.03]",
      text: "text-white",
      label: "text-white/40",
      glow: "",
    },
    cyan: {
      border: "border-cyan-400/25",
      bg: "bg-cyan-400/[0.06]",
      text: "text-cyan-200",
      label: "text-cyan-300/70",
      glow: "shadow-[0_0_30px_-12px_rgba(34,211,238,0.6)]",
    },
    pink: {
      border: "border-pink-400/25",
      bg: "bg-pink-400/[0.06]",
      text: "text-pink-200",
      label: "text-pink-300/70",
      glow: "shadow-[0_0_30px_-12px_rgba(236,72,153,0.55)]",
    },
  }
  const t = tones[tone]
  return (
    <div className={`relative rounded-xl border ${t.border} ${t.bg} ${t.glow} backdrop-blur-sm p-4 transition-transform hover:-translate-y-0.5`}>
      <p className={`font-mono text-[10px] tracking-[0.18em] uppercase ${t.label} mb-1.5 flex items-center gap-1.5`}>
        {icon}{label}
      </p>
      <p className={`text-2xl font-semibold ${t.text} tabular-nums`}>
        {value}
        <span className="text-sm text-white/40 font-normal ml-0.5">{suffix}</span>
      </p>
    </div>
  )
}
