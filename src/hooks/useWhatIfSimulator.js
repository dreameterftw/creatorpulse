import { useState } from "react"
import { askGroq, extractJSON } from "../utils/groq"
import { saveToHistory } from "../utils/history"
import { useCreator } from "../context/CreatorContext"

export function useWhatIfSimulator() {
  const [result,  setResult]  = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [usage,   setUsage]   = useState(null)

  const { buildCrossContext, updateSessionInsight } = useCreator()

  const simulate = async (currentProfile, simulatedProfile) => {
    setLoading(true)
    setError(null)

    const crossContext = buildCrossContext()

    const systemPrompt = `You are an expert creator economy analyst. You compare current vs hypothetical creator profiles and project monetization changes. Always respond in valid JSON only — no markdown, no explanation outside the JSON.`

    const userPrompt = `Compare these two profiles and project monetization impact:

CURRENT:
Platform: ${currentProfile.platforms?.join(", ") || currentProfile.platform}
Niche: ${currentProfile.niches?.join(", ") || currentProfile.niche}
Followers: ${currentProfile.followers}
Engagement Rate: ${currentProfile.engagementRate}%
Content Frequency: ${currentProfile.contentFrequency}
Monthly Income: ₹${currentProfile.monthlyIncome}
Audience Location: ${currentProfile.audienceLocation || "India"}${crossContext}

SIMULATED:
Platform: ${simulatedProfile.platform}
Niche: ${simulatedProfile.niche}
Followers: ${simulatedProfile.followers}
Engagement Rate: ${simulatedProfile.engagementRate}%
Content Frequency: ${simulatedProfile.contentFrequency}

Return ONLY this JSON — no other text:
{
  "currentEstimate": {
    "sponsoredPostRate": number in INR,
    "monthlyIncomePotential": number in INR,
    "marketPosition": "nano | micro | mid | macro"
  },
  "simulatedEstimate": {
    "sponsoredPostRate": number in INR,
    "monthlyIncomePotential": number in INR,
    "marketPosition": "nano | micro | mid | macro"
  },
  "incomeIncrease": { "absolute": number in INR, "percentage": number },
  "keyChanges": [
    { "factor": "factor name", "impact": "impact description", "magnitude": "high | medium | low" }
  ],
  "timeToAchieve": "e.g. '6-9 months'",
  "actionPlan": ["step 1", "step 2", "step 3"],
  "feasibility": "high | medium | low",
  "feasibilityNote": "1-2 sentences",
  "insight": "2-3 sentences comparing scenarios"
}`

    try {
      const { content: raw, usage: u } = await askGroq(systemPrompt, userPrompt, "what_if_simulator", 0.1)
      const parsed = extractJSON(raw)
      setResult(parsed)
      setUsage(u)
      saveToHistory("what_if_simulator", {
        result: parsed,
        simulated: { platform: simulatedProfile.platform, niche: simulatedProfile.niche, followers: simulatedProfile.followers },
      })
      updateSessionInsight(
        "what_if_simulator",
        `simulated ${simulatedProfile.followers?.toLocaleString()} followers on ${simulatedProfile.platform}, projected +₹${parsed.incomeIncrease?.absolute?.toLocaleString()}/mo (+${parsed.incomeIncrease?.percentage}%)`
      )
    } catch (err) {
      if (err.isRateLimit) {
        setUsage(err.usage)
      } else {
        setError(err.message || "Failed to run simulation. Please try again.")
      }
      console.error(err)
    }

    setLoading(false)
  }

  return { result, loading, error, usage, simulate }
}
