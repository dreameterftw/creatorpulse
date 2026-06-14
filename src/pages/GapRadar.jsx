import { useEffect } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "../firebase/config"
import { useAuth } from "../context/AuthContext"
import { useGapAnalyzer } from "../hooks/useGapAnalyzer"
import AppShell from "../components/AppShell"
import PageHeader from "../components/PageHeader"
import AIResponseCard from "../components/AIResponseCard"
import UsageBadge from "../components/UsageBadge"
import { CardSkeleton } from "../components/LoadingSkeleton"
import { Zap, ArrowUpRight, TrendingUp } from "lucide-react"

export default function GapRadar() {
  const { user } = useAuth()
  const { result, loading, error, usage, analyzeGaps } = useGapAnalyzer()

  useEffect(() => {
    const fetchAndAnalyze = async () => {
      const snap = await getDoc(doc(db, "users", user.uid))
      if (snap.exists()) analyzeGaps(snap.data())
    }
    fetchAndAnalyze()
  }, [])

  // Mock list of standard streams if API returns empty
  const streams = result?.streams || [
    { label: "Brand Deals", score: 85, monthlyPotential: 45000, currentlyUsing: true },
    { label: "UGC Licensing", score: 40, monthlyPotential: 18500, currentlyUsing: false },
    { label: "Affiliate Revenue", score: 30, monthlyPotential: 12000, currentlyUsing: false },
    { label: "Courses", score: 10, monthlyPotential: 25000, currentlyUsing: false },
    { label: "Memberships", score: 15, monthlyPotential: 15000, currentlyUsing: false },
    { label: "Consulting", score: 20, monthlyPotential: 20000, currentlyUsing: false },
  ]

  const totalMissed = streams
    .filter(s => !s.currentlyUsing)
    .reduce((sum, s) => sum + s.monthlyPotential, 0)

  const currentTotal = result?.currentMonthlyEstimate || 45000
  const potentialTotal = currentTotal + totalMissed

  // Coordinates for nodes around a circle (r=110, cx=150, cy=150)
  const getNodeCoords = (index, total) => {
    const angle = (index * 2 * Math.PI) / total - Math.PI / 2
    return {
      x: 150 + 105 * Math.cos(angle),
      y: 150 + 105 * Math.sin(angle),
    }
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="AI TOOL"
        title="Monetization Gap Radar"
        description="Audit your creator revenue streams and identify untapped monetization gaps."
        action={<UsageBadge usage={usage} />}
      />

      {loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <CardSkeleton height="100px" />
            <CardSkeleton height="100px" />
            <CardSkeleton height="100px" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5"><CardSkeleton height="320px" /></div>
            <div className="lg:col-span-7"><CardSkeleton height="320px" /></div>
          </div>
        </div>
      )}

      {error && (
        <div className="card p-5 border border-red-200 bg-red-50 text-red-700">{error}</div>
      )}

      {!loading && !error && (
        <div className="space-y-8">
          {/* Top KPI row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-5 border border-black/5 rounded bg-gray-50/50">
              <p className="eyebrow text-gray-400 font-mono text-[10px] tracking-wider uppercase font-medium mb-1">Current Income</p>
              <p className="text-2xl font-semibold text-[#010120]">₹{currentTotal.toLocaleString()}/mo</p>
            </div>
            <div className="card p-5 border border-black/5 rounded bg-gray-50/50">
              <p className="eyebrow text-gray-400 font-mono text-[10px] tracking-wider uppercase font-medium mb-1">Your Potential</p>
              <p className="text-2xl font-semibold text-[#010120] flex items-center gap-1.5 text-green-600">
                ₹{potentialTotal.toLocaleString()}/mo
              </p>
            </div>
            <div className="card p-5 border border-red-100 bg-red-50/20 rounded">
              <p className="eyebrow text-red-500/70 font-mono text-[10px] tracking-wider uppercase font-medium mb-1">Left On Table</p>
              <p className="text-2xl font-semibold text-red-600">₹{totalMissed.toLocaleString()}/mo</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Revenue Wheel */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="card p-6 border border-black/5 rounded w-full flex flex-col items-center">
                <p className="eyebrow text-gray-400 font-mono text-[10px] tracking-wider uppercase font-medium mb-6">Revenue Wheel</p>
                
                {/* SVG Revenue Wheel */}
                <div className="relative w-[300px] h-[300px]">
                  <svg width="100%" height="100%" viewBox="0 0 300 300" className="overflow-visible">
                    {/* Connecting spokes */}
                    {streams.map((s, i) => {
                      const { x, y } = getNodeCoords(i, streams.length)
                      return (
                        <line
                          key={`line-${i}`}
                          x1={150}
                          y1={150}
                          x2={x}
                          y2={y}
                          stroke={s.currentlyUsing ? "#010120" : "#e5e7eb"}
                          strokeWidth={s.currentlyUsing ? 1.5 : 1}
                          strokeDasharray={s.currentlyUsing ? "0" : "3,3"}
                        />
                      )
                    })}

                    {/* Central hub (Current Income) */}
                    <circle cx={150} cy={150} r={42} fill="#010120" className="shadow-lg" />
                    <text x={150} y={146} textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="500" fontFamily="Inter" opacity="0.6">CURRENT</text>
                    <text x={150} y={159} textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="700" fontFamily="Inter">₹{Math.round(currentTotal / 1000)}k</text>

                    {/* Outer nodes */}
                    {streams.map((s, i) => {
                      const { x, y } = getNodeCoords(i, streams.length)
                      const isActive = s.currentlyUsing
                      return (
                        <g key={`node-${i}`} className="cursor-pointer group">
                          <circle
                            cx={x}
                            cy={y}
                            r={18}
                            fill={isActive ? "#010120" : "#ffffff"}
                            stroke={isActive ? "#010120" : "#e2e8f0"}
                            strokeWidth={1.5}
                          />
                          {/* Inner icon/marker */}
                          <circle
                            cx={x}
                            cy={y}
                            r={4}
                            fill={isActive ? "#ffffff" : "#cbd5e1"}
                          />
                          {/* Node label text */}
                          <text
                            x={x}
                            y={y > 150 ? y + 26 : y - 22}
                            textAnchor="middle"
                            fill={isActive ? "#010120" : "#94a3b8"}
                            fontSize="10"
                            fontWeight="600"
                            fontFamily="Inter"
                          >
                            {s.label.split(" ")[0]}
                          </text>
                        </g>
                      )
                    })}
                  </svg>
                </div>
              </div>
            </div>

            {/* Right Column: Opportunity Cards */}
            <div className="lg:col-span-7 space-y-4">
              <p className="eyebrow text-gray-400 font-mono text-[10px] tracking-wider uppercase font-medium">Missed Opportunities</p>
              
              <div className="space-y-3">
                {streams
                  .filter(s => !s.currentlyUsing)
                  .sort((a, b) => b.monthlyPotential - a.monthlyPotential)
                  .map((opp, idx) => (
                    <div
                      key={idx}
                      className="card p-5 border border-black/5 rounded hover:border-black/10 transition-colors flex items-start justify-between gap-4"
                    >
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded bg-pink-50 flex items-center justify-center text-pink-500 flex-shrink-0 mt-0.5">
                          <Zap size={15} />
                        </div>
                        <div>
                          <h4 className="text-[14px] font-semibold text-gray-900 mb-0.5">{opp.label} Gap</h4>
                          <p className="text-[13px] text-gray-500">
                            {opp.tip || `Tap into new sponsorship formats and revenue structures to expand brand reach.`}
                          </p>
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#010120] mt-2 font-mono uppercase bg-gray-100 px-2 py-0.5 rounded">
                            Complexity: {opp.score > 50 ? "Medium" : "Easy"}
                          </span>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div className="text-xs text-gray-400 font-mono uppercase">POTENTIAL</div>
                        <div className="text-[15px] font-bold text-green-600 font-sans mt-0.5">
                          +₹{opp.monthlyPotential?.toLocaleString()}/mo
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Recalculate button */}
          <button
            onClick={async () => {
              const snap = await getDoc(doc(db, "users", user.uid))
              if (snap.exists()) analyzeGaps(snap.data())
            }}
            className="btn-secondary w-full py-2.5 rounded font-medium border border-black/15 text-black bg-transparent hover:bg-black/[0.02] transition-colors"
          >
            Refresh Gap Analysis
          </button>
        </div>
      )}
    </AppShell>
  )
}
