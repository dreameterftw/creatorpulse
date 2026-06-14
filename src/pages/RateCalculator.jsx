import { useState, useEffect } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "../firebase/config"
import { useAuth } from "../context/AuthContext"
import { useRateCalculator } from "../hooks/useRateCalculator"
import AppShell from "../components/AppShell"
import PageHeader from "../components/PageHeader"
import AIResponseCard from "../components/AIResponseCard"
import EmptyState from "../components/EmptyState"
import UsageBadge from "../components/UsageBadge"
import { CardSkeleton } from "../components/LoadingSkeleton"
import { Sparkles, CheckCircle2, AlertCircle } from "lucide-react"

const DELIVERABLES = [
  { value: "sponsored_post",       label: "Sponsored Post" },
  { value: "story_set",            label: "Story Set (3 stories)" },
  { value: "reel",                 label: "Reel / Short Video" },
  { value: "youtube_integration",  label: "YouTube Integration" },
  { value: "brand_ambassador",     label: "Brand Ambassador (monthly)" },
  { value: "ugc_only",             label: "UGC Only (no posting)" },
]

export default function RateCalculator() {
  const { user } = useAuth()
  const { result, loading, error, usage, calculateRates } = useRateCalculator()

  // Input states
  const [platform, setPlatform] = useState("instagram")
  const [followers, setFollowers] = useState("")
  const [engagement, setEngagement] = useState("")
  const [niche, setNiche] = useState("tech")
  const [deliverable, setDeliverable] = useState("reel")

  // Load Firestore profile on mount to prefill
  useEffect(() => {
    const loadProfile = async () => {
      const snap = await getDoc(doc(db, "users", user.uid))
      if (snap.exists()) {
        const data = snap.data()
        if (data.platform) setPlatform(data.platform)
        if (data.followers) setFollowers(data.followers)
        if (data.engagementRate) setEngagement(data.engagementRate)
        if (data.niche) setNiche(data.niche)
        
        // Auto-run initial calculation
        calculateRates(data)
      }
    }
    loadProfile()
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    calculateRates({
      name: "Creator",
      platform,
      followers: Number(followers),
      engagementRate: parseFloat(engagement),
      niche,
      audienceLocation: "India",
      contentFrequency: "weekly",
      monthlyIncome: 0
    })
  }

  // Calculate selected rate details
  const rateInfo = result?.rates?.[deliverable]
  const avgRate = rateInfo ? Math.round((rateInfo.min + rateInfo.max) / 2) : 0
  
  // Calculate a mock confidence score based on engagement tier
  const getConfidenceScore = (tier) => {
    if (tier === "excellent") return 96
    if (tier === "good") return 88
    if (tier === "average") return 76
    return 62
  }
  const confidence = result ? getConfidenceScore(result.engagementTier) : 80

  return (
    <AppShell>
      <PageHeader
        eyebrow="AI TOOL"
        title="Rate Calculator"
        description="Optimize your brand deal pricing with high-confidence rate cards."
        action={<UsageBadge usage={usage} />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Inputs */}
        <div className="lg:col-span-5 card p-6 border border-black/5 bg-gray-50/30">
          <p className="eyebrow mb-4 text-gray-400 font-mono text-[10px] tracking-wider uppercase font-medium">Profile Inputs</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[12px] font-medium text-gray-500 mb-1.5 uppercase font-mono">Platform</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="input text-[13px] bg-white text-black border border-black/10 rounded focus:border-black/30 outline-none p-2 w-full"
              >
                <option value="instagram">Instagram</option>
                <option value="youtube">YouTube</option>
                <option value="tiktok">TikTok</option>
                <option value="twitter">Twitter / X</option>
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-gray-500 mb-1.5 uppercase font-mono">Followers</label>
              <input
                type="number"
                value={followers}
                onChange={(e) => setFollowers(e.target.value)}
                placeholder="e.g. 50000"
                className="input text-[13px] bg-white text-black border border-black/10 rounded focus:border-black/30 outline-none p-2 w-full"
                required
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-gray-500 mb-1.5 uppercase font-mono">Engagement Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={engagement}
                onChange={(e) => setEngagement(e.target.value)}
                placeholder="e.g. 4.2"
                className="input text-[13px] bg-white text-black border border-black/10 rounded focus:border-black/30 outline-none p-2 w-full"
                required
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-gray-500 mb-1.5 uppercase font-mono">Niche</label>
              <select
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                className="input text-[13px] bg-white text-black border border-black/10 rounded focus:border-black/30 outline-none p-2 w-full"
              >
                <option value="tech">Tech & Gadgets</option>
                <option value="fashion">Fashion & Lifestyle</option>
                <option value="finance">Finance & Business</option>
                <option value="fitness">Fitness & Health</option>
                <option value="travel">Travel & Adventure</option>
                <option value="food">Food & Cooking</option>
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-gray-500 mb-1.5 uppercase font-mono">Target Deliverable</label>
              <select
                value={deliverable}
                onChange={(e) => setDeliverable(e.target.value)}
                className="input text-[13px] bg-white text-black border border-black/10 rounded focus:border-black/30 outline-none p-2 w-full"
              >
                {DELIVERABLES.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-[13px] py-2.5 rounded font-medium text-white transition-opacity bg-[#010120] flex items-center justify-center gap-2"
            >
              <Sparkles size={14} /> {loading ? "Analyzing..." : "Calculate Sponsorship Rate"}
            </button>
          </form>
        </div>

        {/* Right Side: Results */}
        <div className="lg:col-span-7 space-y-6">
          {loading ? (
            <div className="space-y-4">
              <CardSkeleton height="150px" />
              <CardSkeleton height="100px" />
              <CardSkeleton height="150px" />
            </div>
          ) : error ? (
            <div className="card p-5 border border-red-200 bg-red-50 text-red-700 flex items-start gap-3">
              <AlertCircle className="flex-shrink-0 mt-0.5 text-red-500" size={18} />
              <div>
                <p className="font-semibold text-[14px]">Calculation Error</p>
                <p className="text-[13px] mt-1">{error}</p>
              </div>
            </div>
          ) : !result ? (
            <EmptyState
              icon="💰"
              title="Estimate Sponsorship Earnings"
              description="Enter your stats on the left and click calculate to generate custom, AI-justified rate cards."
            />
          ) : (
            <div className="space-y-5">
              {/* Primary Rate Card */}
              <div className="card p-6 border border-black/5 bg-[#010120] text-white rounded shadow-sm">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                  <span className="text-[10px] font-mono tracking-wider text-white/50 uppercase">SUGGESTED POST RATE</span>
                  <span className="text-[10px] font-mono tracking-wider text-green-400 bg-green-500/10 px-2 py-0.5 rounded">
                    {result.marketPosition?.toUpperCase()}
                  </span>
                </div>
                
                <h2 className="text-4xl font-semibold tracking-tight mb-2">
                  ₹{avgRate ? avgRate.toLocaleString() : "—"}
                </h2>

                <div className="flex justify-between items-center text-[13px] text-white/70 mt-4 pt-2">
                  <span>Suggested Range:</span>
                  <span className="font-mono font-medium text-white">
                    ₹{rateInfo?.min?.toLocaleString()} – ₹{rateInfo?.max?.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center text-[13px] text-white/70 mt-2">
                  <span>Confidence Score:</span>
                  <span className="font-mono font-medium text-white flex items-center gap-1 text-green-400">
                    <CheckCircle2 size={13} /> {confidence}%
                  </span>
                </div>
              </div>

              {/* Justification Card */}
              <div className="card p-6 border border-black/5 rounded">
                <p className="eyebrow text-gray-400 font-mono text-[10px] tracking-wider uppercase font-medium mb-3">AI Pricing Justification</p>
                <p className="text-[14px] text-gray-700 leading-relaxed font-sans">{result.justification}</p>
              </div>

              {/* Market Position & Summary details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AIResponseCard title="Market Strengths">
                  <ul className="space-y-2">
                    {result.strengths?.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-[12px] text-gray-600">
                        <span className="text-green-500 font-medium">✓</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </AIResponseCard>

                <AIResponseCard title="Audience Quality">
                  <div className="space-y-2">
                    <div className="flex justify-between text-[12px]">
                      <span className="text-gray-400">Engagement Tier</span>
                      <span className="font-semibold text-[#010120] uppercase">{result.engagementTier}</span>
                    </div>
                    <div className="flex justify-between text-[12px]">
                      <span className="text-gray-400">Target Demographic</span>
                      <span className="font-semibold text-[#010120]">India Focus</span>
                    </div>
                  </div>
                </AIResponseCard>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
