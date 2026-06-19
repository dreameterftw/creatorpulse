import { useState } from "react"
import { askGroq, extractJSON } from "../utils/groq"
import { saveToHistory } from "../utils/history"
import { useCreator } from "../context/CreatorContext"

export function useGapAnalyzer() {
  const [result,  setResult]  = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [usage,   setUsage]   = useState(null)

  const { buildCrossContext, updateSessionInsight } = useCreator()

  const analyzeGaps = async (profile) => {
    setLoading(true)
    setError(null)

    const crossContext = buildCrossContext()

    const systemPrompt = `You are an expert creator monetization strategist specializing in the Indian creator economy. You analyze a creator's current income streams and identify exactly what they're missing.

CRITICAL: All monetary estimates must be in INR calibrated to the Indian market:
- Brand deals: ₹3,000–₹20,000/post for micro creators; ₹20,000–₹80,000 for mid-tier
- Affiliate commissions: ₹2,000–₹15,000/month for active micro creators in finance/tech/lifestyle
- AdSense/YouTube: ₹80–₹200 RPM for Indian audiences (significantly lower than global)
- UGC (no posting): ₹2,000–₹8,000 per deliverable; scalable to ₹20,000+/month
- Digital products (courses, presets): ₹499–₹4,999 one-time; ₹5,000–₹50,000/month at scale
- Memberships (Patreon/etc.): ₹99–₹499/subscriber; realistic ₹3,000–₹20,000/month for micro creators

Always respond in valid JSON only — no markdown, no explanation outside the JSON.`

    const userPrompt = `Analyze the monetization gaps for this creator:

Name: ${profile.name}
Platform: ${profile.platforms?.join(", ") || profile.platform}
Niche: ${profile.niches?.join(", ") || profile.niche}
Followers: ${profile.followers}
Engagement Rate: ${profile.engagementRate}%
Audience Location: ${profile.audienceLocation}
Current Income Streams: ${profile.incomeStreams?.join(", ") || "none"}
Current Monthly Income: ₹${profile.monthlyIncome}${crossContext}

Income streams to evaluate: brand_deals, affiliate, adsense, digital_products, memberships, ugc, live_events, consulting

Return ONLY this JSON — no other text:
{
  "overallScore": number 0-100,
  "currentMonthlyEstimate": number in INR,
  "potentialMonthlyEstimate": number in INR,
  "moneyLeftOnTable": number in INR per month,
  "streams": [
    {
      "id": "brand_deals",
      "label": "Brand Deals",
      "currentlyUsing": true or false,
      "score": number 0-100,
      "monthlyPotential": number in INR,
      "priority": "high | medium | low",
      "tip": "one specific actionable tip",
      "howToStart": "one concrete first step"
    }
  ],
  "topOpportunities": [
    {
      "stream": "stream name",
      "reason": "why this is best for them specifically",
      "estimatedMonthlyIncome": number in INR,
      "timeToFirstEarning": "e.g. 2-4 weeks"
    }
  ],
  "insight": "2-3 sentence overall insight"
}`

    try {
      const { content: raw, usage: u } = await askGroq(systemPrompt, userPrompt, "gap_radar", 0.2)
      const parsed = extractJSON(raw)
      setResult(parsed)
      setUsage(u)
      saveToHistory("gap_radar", {
        result: parsed,
        profile: { platform: profile.platforms?.[0] || profile.platform, niche: profile.niches?.[0] || profile.niche },
      })
      updateSessionInsight(
        "gap_radar",
        `monetization score ${parsed.overallScore}/100, leaving ₹${parsed.moneyLeftOnTable?.toLocaleString()}/mo on table, top opportunity: ${parsed.topOpportunities?.[0]?.stream || "unknown"}`
      )
    } catch (err) {
      if (err.isRateLimit) {
        setUsage(err.usage)
      } else {
        setError(err.message || "Failed to analyze gaps. Please try again.")
      }
      console.error(err)
    }

    setLoading(false)
  }

  return { result, loading, error, usage, analyzeGaps }
}
