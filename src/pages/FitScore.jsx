import { useState, useEffect } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "../firebase/config"
import { useAuth } from "../context/AuthContext"
import { useFitScore } from "../hooks/useFitScore"
import { sanitizeInput } from "../utils/sanitize"
import AppShell from "../components/AppShell"
import PageHeader from "../components/PageHeader"
import AIResponseCard from "../components/AIResponseCard"
import EmptyState from "../components/EmptyState"
import UsageBadge from "../components/UsageBadge"
import { Sparkles, CheckCircle2, AlertTriangle, HelpCircle } from "lucide-react"

export default function FitScore() {
  const { user } = useAuth()
  const { result, loading, error, usage, analyzeFit } = useFitScore()
  const [profile, setProfile] = useState(null)
  const [brandName, setBrandName] = useState("")
  const [brandDescription, setBrandDescription] = useState("")

  useEffect(() => {
    const fetchProfile = async () => {
      const snap = await getDoc(doc(db, "users", user.uid))
      if (snap.exists()) setProfile(snap.data())
    }
    fetchProfile()
  }, [])

  const handleAnalyze = () => {
    if (!brandName.trim() || !profile) return
    analyzeFit(profile, sanitizeInput(brandName, 100), sanitizeInput(brandDescription, 300))
  }

  // Calculate coordinates for SVG circular progress
  const strokeDashoffset = result ? 283 - (283 * result.overallScore) / 100 : 283

  return (
    <AppShell>
      <PageHeader
        eyebrow="AI TOOL"
        title="Brand Fit Score"
        description="Verify brand alignment and outreach feasibility before making a pitch."
        action={<UsageBadge usage={usage} />}
      />

      {/* Input panel */}
      <div className="card p-6 mb-6 border border-black/5 bg-gray-50/30">
        <p className="eyebrow mb-4 text-gray-400 font-mono text-[10px] tracking-wider uppercase font-medium">Outreach Parameters</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[12px] font-medium text-gray-500 mb-1.5 uppercase font-mono">Brand Name</label>
            <input
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="e.g. boAt, Mamaearth, Zomato"
              className="input text-[13px] bg-white text-black border border-black/10 rounded focus:border-black/30 outline-none p-2 w-full"
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-gray-500 mb-1.5 uppercase font-mono">Brand Description (Optional)</label>
            <input
              value={brandDescription}
              onChange={(e) => setBrandDescription(e.target.value)}
              placeholder="e.g. D2C skincare brand targeting young professionals"
              className="input text-[13px] bg-white text-black border border-black/10 rounded focus:border-black/30 outline-none p-2 w-full"
            />
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={handleAnalyze}
            disabled={loading || !brandName.trim()}
            className="btn-primary py-2 px-5 text-[13px] rounded font-medium text-white transition-opacity bg-[#010120]"
          >
            {loading ? "Evaluating Alignment..." : "Analyze Brand Fit"}
          </button>
        </div>
      </div>

      {error && (
        <div className="card p-5 border border-red-200 bg-red-50 text-red-700 mb-6">{error}</div>
      )}

      {!loading && !result && !error && (
        <EmptyState
          icon="🎯"
          title="Analyze Brand Alignment"
          description="Type a brand name above to evaluate audience demographics, niche suitability, and potential campaign blockers."
        />
      )}

      {result && (
        <div className="space-y-6">
          {/* Top side-by-side Score dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Card: Score Circle */}
            <div className="lg:col-span-5 card p-6 border border-black/5 rounded flex flex-col items-center text-center">
              <p className="eyebrow text-gray-400 font-mono text-[10px] tracking-wider uppercase font-medium mb-6">Score Circle</p>
              
              {/* SVG Radial Score */}
              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="45"
                    stroke="#f1f5f9"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="45"
                    stroke={result.overallScore >= 70 ? "#16a34a" : result.overallScore >= 50 ? "#ca8a04" : "#dc2626"}
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray="283"
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-semibold text-[#010120]">{result.overallScore}</span>
                  <span className="text-[10px] text-gray-400 font-mono uppercase mt-0.5">FIT INDEX</span>
                </div>
              </div>

              {/* Recommendation Badge */}
              <div className="mt-6 w-full pt-4 border-t border-black/5">
                <span className="pill pill-active text-[11px] uppercase font-mono px-3 py-1">
                  {result.verdict}
                </span>
                <p className="text-[13px] text-gray-500 mt-3 leading-relaxed">
                  {result.summary}
                </p>
              </div>
            </div>

            {/* Right Card: Dimension scores */}
            <div className="lg:col-span-7 card p-6 border border-black/5 rounded">
              <p className="eyebrow text-gray-400 font-mono text-[10px] tracking-wider uppercase font-medium mb-6">Fit Breakdown</p>
              
              <div className="space-y-5">
                {result.dimensions?.map((dim, i) => {
                  const scoreVal = dim.score
                  const activeColor = scoreVal >= 70 ? "#16a34a" : scoreVal >= 50 ? "#ca8a04" : "#dc2626"
                  return (
                    <div key={i} className="pb-4 border-b border-black/5 last:border-0 last:pb-0">
                      <div className="flex justify-between items-center text-[12px] mb-1.5">
                        <span className="font-semibold text-gray-800">{dim.name}</span>
                        <span className="font-mono font-semibold" style={{ color: activeColor }}>{scoreVal}/100</span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full h-2 rounded-full bg-gray-100 mb-2">
                        <div
                          className="h-2 rounded-full transition-all duration-500"
                          style={{ width: `${scoreVal}%`, backgroundColor: activeColor }}
                        />
                      </div>

                      {/* Pros & Cons */}
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 mt-1 text-[11px] text-gray-500">
                        <span className="flex items-center gap-1"><span className="text-green-500 font-bold">✓</span> {dim.positive}</span>
                        <span className="flex items-center gap-1"><span className="text-red-400 font-bold">✗</span> {dim.concern}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

          </div>

          {/* Tips and Watch Out Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AIResponseCard title="Negotiation Strategy">
              <ul className="space-y-3">
                {result.negotiationTips?.map((tip, i) => (
                  <li key={i} className="flex gap-2.5 text-[12px] text-gray-600">
                    <span className="text-gray-400 font-mono">{i + 1}.</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </AIResponseCard>

            <div className="card p-6 border border-red-100 bg-red-50/10 rounded">
              <p className="eyebrow text-red-500/70 font-mono text-[10px] tracking-wider uppercase font-medium mb-3">Watch Out For</p>
              <ul className="space-y-2">
                {result.dealBreakers?.map((b, i) => (
                  <li key={i} className="flex gap-2 text-[12px] text-red-800/80">
                    <span>•</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <button
            onClick={() => { setBrandName(""); setBrandDescription("") }}
            className="btn-secondary w-full py-2.5 rounded font-medium border border-black/15 text-black bg-transparent hover:bg-black/[0.02] transition-colors"
          >
            Evaluate Another Brand
          </button>
        </div>
      )}
    </AppShell>
  )
}
