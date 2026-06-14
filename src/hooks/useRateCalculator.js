import { useState } from "react"
import { askGroq } from "../utils/groq"

export function useRateCalculator() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [usage, setUsage] = useState(null)

  const calculateRates = async (profile) => {
    setLoading(true)
    setError(null)

    const systemPrompt = `You are an expert influencer marketing consultant with deep knowledge of the Indian creator economy. You provide data-backed rate recommendations for content creators. Always respond in valid JSON only — no markdown, no explanation outside the JSON.`

    const userPrompt = `Calculate detailed brand deal rates for this creator:

Name: ${profile.name}
Platform: ${profile.platform}
Niche: ${profile.niche}
Followers: ${profile.followers}
Engagement Rate: ${profile.engagementRate}%
Audience Location: ${profile.audienceLocation}
Content Frequency: ${profile.contentFrequency}
Current Monthly Income: ₹${profile.monthlyIncome}

Return a JSON object with this exact structure:
{
  "summary": "2-3 sentence summary of why this creator is worth what they are",
  "rates": {
    "sponsored_post": { "min": number, "max": number, "currency": "INR" },
    "story_set": { "min": number, "max": number, "currency": "INR" },
    "reel": { "min": number, "max": number, "currency": "INR" },
    "youtube_integration": { "min": number, "max": number, "currency": "INR" },
    "brand_ambassador": { "min": number, "max": number, "currency": "INR" },
    "ugc_only": { "min": number, "max": number, "currency": "INR" }
  },
  "strengths": ["strength1", "strength2", "strength3"],
  "engagementTier": "low | average | good | excellent",
  "marketPosition": "nano | micro | mid | macro",
  "justification": "2-3 sentences explaining the rate reasoning with niche and engagement context"
}`

    try {
      const { content: raw, usage: u } = await askGroq(systemPrompt, userPrompt, "rate_calculator")
      const cleaned = raw.replace(/```json|```/g, "").trim()
      const parsed = JSON.parse(cleaned)
      setResult(parsed)
      setUsage(u)
    } catch (err) {
      if (err.isRateLimit) {
        setError(`Daily AI limit reached (${err.usage?.used}/${err.usage?.limit}). Try again tomorrow.`)
        setUsage(err.usage)
      } else {
        setError(err.message || "Failed to calculate rates. Please try again.")
      }
      console.error(err)
    }

    setLoading(false)
  }

  return { result, loading, error, usage, calculateRates }
}
