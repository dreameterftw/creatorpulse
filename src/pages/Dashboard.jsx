import { useState, useEffect } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "../firebase/config"
import { useAuth } from "../context/AuthContext"
import { Link } from "react-router-dom"
import AppShell from "../components/AppShell"
import KpiCard from "../components/KpiCard"
import InsightCard from "../components/InsightCard"
import ToolCard from "../components/ToolCard"
import PageHeader from "../components/PageHeader"
import { CardSkeleton } from "../components/LoadingSkeleton"
import UsageBadge from "../components/UsageBadge"
import { TrendingUp, Sparkles, Target, Zap } from "lucide-react"

const QUICK_ACTIONS = [
  { to: "/rate-calculator", icon: <TrendingUp size={20} className="text-[#010120]" />, title: "Run Rate Analysis",  description: "AI-justified sponsorship rates for your channels",  badge: "AI" },
  { to: "/pitch-generator", icon: <Zap size={20} className="text-[#010120]" />, title: "Generate Pitch",      description: "Personalized outbound pitch & media kits",    badge: "AI" },
  { to: "/fit-score",       icon: <Target size={20} className="text-[#010120]" />, title: "Check Brand Fit",     description: "Evaluate audience & category match",          badge: "AI" },
  { to: "/what-if",         icon: <Sparkles size={20} className="text-[#010120]" />, title: "Simulate Growth",    description: "Model growth & project future income levels", badge: "AI" },
]

function getInsights(profile) {
  if (!profile) return []
  const insights = []
  const eng = parseFloat(profile.engagementRate || 0)
  const followers = Number(profile.followers || 0)

  // Standard specific examples
  if (eng > 3) {
    insights.push({
      text: `Your engagement rate is above average for creators in ${profile.niche || "your niche"}.`,
      tag: "Audit"
    })
  }
  insights.push({
    text: `You may be undercharging by 22% for Instagram Reels sponsorships.`,
    tag: "Monetization"
  })
  
  if (!profile.incomeStreams?.includes("ugc")) {
    insights.push({
      text: "Adding UGC licensing deals could increase monthly earnings by up to 15%.",
      tag: "Revenue Streams"
    })
  }
  return insights.slice(0, 3)
}

export default function Dashboard() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      const snap = await getDoc(doc(db, "users", user.uid))
      if (snap.exists()) setProfile(snap.data())
      setLoading(false)
    }
    fetchProfile()
  }, [])

  const firstName = profile?.name?.split(" ")[0] || user.email?.split("@")[0] || "Creator"
  const insights = getInsights(profile)

  // KPI calculations
  const followers = Number(profile?.followers || 0)
  const eng = parseFloat(profile?.engagementRate || 0)
  const suggestedRate = followers > 0
    ? `₹${Math.round(followers * 0.0003 * (1 + eng / 10)).toLocaleString()}`
    : "—"
  const monthlyPotential = followers > 0
    ? `₹${Math.round(followers * 0.0009 * (1 + eng / 10)).toLocaleString()}`
    : "—"
  const growthScore = Math.min(Math.round(eng * 10 + (followers > 100000 ? 20 : followers > 10000 ? 10 : 0)), 100)
  const brandReadiness = profile?.profileComplete ? Math.min(Math.round(eng * 8 + 30), 100) : 0

  return (
    <AppShell>
      <PageHeader
        eyebrow="CREATORPULSE OVERVIEW"
        title={`Welcome back, ${firstName}`}
        description="Review your creator monetization insights and analytics."
        action={<UsageBadge usage={null} />}
      />

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => <CardSkeleton key={i} height="110px" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KpiCard label="Potential Monthly Earnings" value={monthlyPotential} accent icon="💰" />
          <KpiCard label="Suggested Post Rate" value={suggestedRate} icon="📊" />
          <KpiCard label="Growth Opportunity Score" value={`${growthScore}/100`} icon="📈"
            delta={growthScore > 60 ? { value: "strong", positive: true } : undefined} />
          <KpiCard label="Brand Readiness Score" value={`${brandReadiness}/100`} icon="🎯" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2 space-y-4">
          <p className="eyebrow text-gray-400 font-mono text-[10px] tracking-wider uppercase">Quick Actions</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {QUICK_ACTIONS.map((t) => (
              <ToolCard key={t.to} {...t} />
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Profile Snapshot */}
          <div className="card p-5 border border-white/5 rounded bg-white/[0.02]">
            <div className="flex items-center justify-between mb-4">
              <p className="eyebrow text-white/40 font-mono text-[10px] tracking-wider uppercase font-medium">Profile Snapshot</p>
              <Link to="/onboarding" className="text-[12px] font-medium text-white/50 hover:text-white transition-colors no-underline">
                Edit →
              </Link>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-3 rounded animate-pulse bg-white/5" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  ["Platform",    profile?.platform],
                  ["Followers",   followers > 0 ? followers.toLocaleString() : "—"],
                  ["Niche",       profile?.niche],
                  ["Engagement",  profile?.engagementRate ? `${profile.engagementRate}%` : "—"],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-[12px] text-white/50">{label}</span>
                    <span className="text-[12px] font-medium text-white uppercase">{value || "—"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Insights Feed */}
          <div className="card p-5 border border-white/5 rounded">
            <p className="eyebrow text-white/40 font-mono text-[10px] tracking-wider uppercase font-medium mb-4">Insights Feed</p>
            {loading ? (
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => <div key={i} className="h-10 rounded animate-pulse bg-white/5" />)}
              </div>
            ) : insights.length > 0 ? (
              <div className="divide-y divide-white/5">
                {insights.map((ins, i) => (
                  <InsightCard key={i} text={ins.text} tag={ins.tag} />
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-white/40">
                Complete your profile to see personalized insights.
              </p>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
