import { useState, useEffect } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "../firebase/config"
import { useAuth } from "../context/AuthContext"
import { useWhatIfSimulator } from "../hooks/useWhatIfSimulator"
import AppShell from "../components/AppShell"
import PageHeader from "../components/PageHeader"
import AIResponseCard from "../components/AIResponseCard"
import UsageBadge from "../components/UsageBadge"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts"
import { Sparkles, Sliders, TrendingUp, Calendar, CheckCircle2, RotateCcw } from "lucide-react"

const PLATFORMS  = ["Instagram", "YouTube", "LinkedIn", "Twitter/X", "TikTok"]
const NICHES     = ["Fitness", "Tech", "Finance", "Fashion", "Food", "Travel", "Education", "Gaming", "Lifestyle", "Beauty"]
const FREQUENCIES = ["Daily", "3-4x per week", "1-2x per week", "A few times a month"]

export default function WhatIfSimulator() {
  const { user } = useAuth()
  const { result, loading, error, usage, simulate } = useWhatIfSimulator()
  const [profile, setProfile] = useState(null)
  const [sim, setSim] = useState(null)

  useEffect(() => {
    const fetchProfile = async () => {
      const snap = await getDoc(doc(db, "users", user.uid))
      if (snap.exists()) {
        const data = snap.data()
        setProfile(data)
        setSim({
          platform: data.platform || "Instagram",
          niche: data.niche || "Tech",
          followers: Number(data.followers) || 10000,
          engagementRate: Number(data.engagementRate) || 3.0,
          contentFrequency: data.contentFrequency || "1-2x per week"
        })
      }
    }
    fetchProfile()
  }, [])

  const resetSim = () => {
    if (!profile) return
    setSim({
      platform: profile.platform || "Instagram",
      niche: profile.niche || "Tech",
      followers: Number(profile.followers) || 10000,
      engagementRate: Number(profile.engagementRate) || 3.0,
      contentFrequency: profile.contentFrequency || "1-2x per week"
    })
  }

  const hasChanges = profile && sim && (
    sim.platform !== profile.platform ||
    sim.niche !== profile.niche ||
    Number(sim.followers) !== Number(profile.followers) ||
    Number(sim.engagementRate) !== Number(profile.engagementRate) ||
    sim.contentFrequency !== profile.contentFrequency
  )

  const chartData = result ? [
    { name: "Current Income", value: result.currentEstimate?.monthlyIncomePotential || 45000, color: "#e2e8f0" },
    { name: "Projected Income", value: result.simulatedEstimate?.monthlyIncomePotential || 120000, color: "#010120" },
  ] : []

  if (!profile || !sim) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-40">
          <p className="text-gray-400 text-[13px]">Loading simulator configs...</p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="AI TOOL"
        title="What-If Simulator"
        description="Project and simulate your future creator earnings based on metrics shifts."
        action={<UsageBadge usage={usage} />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-8">
        
        {/* Left Column: Growth Controls */}
        <div className="lg:col-span-6 card p-6 border border-black/5 bg-gray-50/30 space-y-6">
          <p className="eyebrow text-gray-400 font-mono text-[10px] tracking-wider uppercase font-medium flex items-center gap-1.5">
            <Sliders size={13} /> Growth Controls
          </p>
          
          {/* Followers Slider */}
          <div>
            <div className="flex justify-between items-center text-[12px] mb-1.5">
              <span className="font-semibold text-gray-500 font-mono uppercase">Followers</span>
              <span className="font-bold text-black">{Number(sim.followers).toLocaleString()}</span>
            </div>
            <input
              type="range"
              min={500}
              max={1000000}
              step={500}
              value={sim.followers}
              onChange={(e) => setSim((s) => ({ ...s, followers: Number(e.target.value) }))}
              className="w-full accent-[#010120]"
            />
            <span className="text-[10px] text-gray-400">Current: {Number(profile.followers || 0).toLocaleString()}</span>
          </div>

          {/* Engagement Slider */}
          <div>
            <div className="flex justify-between items-center text-[12px] mb-1.5">
              <span className="font-semibold text-gray-500 font-mono uppercase">Engagement Rate</span>
              <span className="font-bold text-black">{sim.engagementRate}%</span>
            </div>
            <input
              type="range"
              min={0.2}
              max={15}
              step={0.1}
              value={sim.engagementRate}
              onChange={(e) => setSim((s) => ({ ...s, engagementRate: Number(e.target.value) }))}
              className="w-full accent-[#010120]"
            />
            <span className="text-[10px] text-gray-400">Current: {profile.engagementRate || 0}%</span>
          </div>

          {/* Posting Frequency Dropdown */}
          <div>
            <label className="block text-[12px] font-medium text-gray-500 mb-1.5 uppercase font-mono">Posting Frequency</label>
            <select
              value={sim.contentFrequency}
              onChange={(e) => setSim((s) => ({ ...s, contentFrequency: e.target.value }))}
              className="input text-[13px] bg-white text-black border border-black/10 rounded focus:border-black/30 w-full"
            >
              {FREQUENCIES.map((freq) => (
                <option key={freq} value={freq}>{freq}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => simulate(profile, sim)}
              disabled={loading}
              className="btn-primary flex-1 text-[13px] py-2.5 rounded font-medium text-white transition-opacity bg-[#010120] flex items-center justify-center gap-2"
            >
              <Sparkles size={14} /> {loading ? "Projecting..." : "Simulate Growth Projection"}
            </button>
            <button
              onClick={resetSim}
              className="btn-secondary px-3 py-2.5 rounded border border-black/10 text-gray-500 hover:text-black transition-colors"
            >
              <RotateCcw size={15} />
            </button>
          </div>
        </div>

        {/* Right Column: Chart & Projection Overview */}
        <div className="lg:col-span-6 space-y-6">
          {error && (
            <div className="card p-5 border border-red-200 bg-red-50 text-red-700">{error}</div>
          )}

          {!result ? (
            <EmptyState
              icon="🔮"
              title="Run Earning Projections"
              description="Adjust the sliders on the left to project how scaling followers, posting frequency, or engagement changes your monthly brand revenue."
            />
          ) : (
            <div className="space-y-6">
              {/* Earning Delta Indicator */}
              <div className="card p-6 border border-black/5 bg-[#010120] text-white rounded flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-white/50 uppercase tracking-wider">Projected Growth Potential</span>
                  <h3 className="text-3xl font-semibold text-white mt-1">
                    +₹{result.incomeIncrease?.absolute?.toLocaleString()}/mo
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-green-400 bg-green-500/10 px-2 py-1 rounded">
                    +{result.incomeIncrease?.percentage}% Increase
                  </span>
                </div>
              </div>

              {/* Chart Projection */}
              <div className="card p-6 border border-black/5 rounded">
                <p className="eyebrow text-gray-400 font-mono text-[10px] tracking-wider uppercase font-medium mb-4">Revenue Chart Projection</p>
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} barSize={40}>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                      <YAxis hide />
                      <Tooltip formatter={(val) => `₹${val.toLocaleString()}`} contentStyle={{ borderRadius: 6, border: "1px solid rgba(0,0,0,0.06)", fontSize: 12 }} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

      {result && (
        <div className="space-y-6">
          
          {/* Split Cards: Current vs Future Creator */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Current */}
            <div className="card p-6 border border-black/5 rounded bg-gray-50/30">
              <p className="eyebrow text-gray-400 font-mono text-[10px] tracking-wider uppercase font-medium mb-4">Current Creator Profile</p>
              <div className="space-y-3">
                <div className="flex justify-between text-[13px]">
                  <span className="text-gray-400">Positioning</span>
                  <span className="font-semibold text-gray-800 uppercase">{result.currentEstimate?.marketPosition || "Creator"}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-gray-400">Rate per post</span>
                  <span className="font-semibold text-gray-800">₹{result.currentEstimate?.sponsoredPostRate?.toLocaleString() || "—"}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-gray-400">Monthly Potential</span>
                  <span className="font-semibold text-gray-800">₹{result.currentEstimate?.monthlyIncomePotential?.toLocaleString() || "—"}</span>
                </div>
              </div>
            </div>

            {/* Future */}
            <div className="card p-6 border border-[#010120]/10 rounded bg-[#010120]/[0.01]">
              <p className="eyebrow text-[#010120] font-mono text-[10px] tracking-wider uppercase font-medium mb-4">Future Creator Profile</p>
              <div className="space-y-3">
                <div className="flex justify-between text-[13px]">
                  <span className="text-gray-400">Positioning</span>
                  <span className="font-semibold text-[#010120] uppercase">{result.simulatedEstimate?.marketPosition || "Scale-up"}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-gray-400">Rate per post</span>
                  <span className="font-semibold text-[#010120] font-bold">₹{result.simulatedEstimate?.sponsoredPostRate?.toLocaleString() || "—"}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-gray-400">Monthly Potential</span>
                  <span className="font-semibold text-[#010120] font-bold">₹{result.simulatedEstimate?.monthlyIncomePotential?.toLocaleString() || "—"}</span>
                </div>
              </div>
            </div>

          </div>

          {/* AI Analysis Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Feasibility / Timeline */}
            <div className="card p-6 border border-black/5 rounded space-y-4">
              <div>
                <p className="eyebrow text-gray-400 font-mono text-[10px] tracking-wider uppercase font-medium mb-1 flex items-center gap-1.5"><Calendar size={13} /> Time to Achieve</p>
                <h4 className="text-xl font-semibold text-[#010120]">{result.timeToAchieve}</h4>
              </div>
              <div>
                <p className="eyebrow text-gray-400 font-mono text-[10px] tracking-wider uppercase font-medium mb-1 flex items-center gap-1.5"><CheckCircle2 size={13} /> Feasibility Note</p>
                <p className="text-[13px] text-gray-600 leading-relaxed">{result.feasibilityNote}</p>
              </div>
            </div>

            {/* Action plan */}
            <AIResponseCard title="Simulation Action Plan">
              <ol className="space-y-3">
                {result.actionPlan?.map((step, idx) => (
                  <li key={idx} className="flex gap-2.5 text-[12px] text-gray-600">
                    <span className="text-[#010120] font-mono">{idx + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </AIResponseCard>

          </div>

        </div>
      )}
    </AppShell>
  )
}
