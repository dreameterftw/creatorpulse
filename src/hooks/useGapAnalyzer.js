import { useState } from "react"
import { askGroq } from "../utils/groq"
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

    const systemPrompt = `You are an expert creator monetization strategist specializing in the Indian creator economy. You analyze a creator's current income streams and identify exactly what they're missing and how much money they're leaving on the table. Always respond in valid JSON only — no markdown, no explanation outside the JSON.`

    const userPrompt = `Analyze the monetization gaps for this creator:

Name: ${profile.name}
Platform: ${profile.platforms?.join(", ") || profile.platform}
Niche: ${profile.niches?.join(", ") || profile.niche}
Followers: ${profile.followers}
Engagement Rate: ${profile.engagementRate}%
Audience Location: ${profile.audienceLocation}
Current Income Streams: ${profile.incomeStreams?.join(", ") || "none"}
Current Monthly Income: ₹${profile.monthlyIncome}${crossContext}

All possible income streams to evaluate:
1. brand_deals - Sponsored content for brands
2. affiliate - Affiliate marketing commissions
3. adsense - Platform ad revenue
4. digital_products - Ebooks, presets, templates, courses
5. memberships - Paid communities, subscriptions, Patreon
6. ugc - User generated content for brands (no posting required)
7. live_events - Workshops, webinars, meetups
8. consulting - 1-on-1 coaching or consulting

Return a JSON object with this exact structure:
{
  "overallScore": number between 0-100 representing monetization completeness,
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
      "tip": "one specific actionable tip for this stream",
      "howToStart": "one concrete first step to start this stream"
    }
  ],
  "topOpportunities": [
    {
      "stream": "stream name",
      "reason": "why this is the best opportunity for them specifically",
      "estimatedMonthlyIncome": number in INR,
      "timeToFirstEarning": "e.g. 2-4 weeks"
    }
  ],
  "insight": "2-3 sentence overall insight about their monetization strategy"
}`

    try {
      const { content: raw, usage: u } = await askGroq(systemPrompt, userPrompt, "gap_radar")
      const cleaned = raw.replace(/```json|```/g, "").trim()
      const parsed  = JSON.parse(cleaned)
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
