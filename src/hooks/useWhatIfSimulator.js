import { useState } from "react"
import { askGroq } from "../utils/groq"

export function useWhatIfSimulator() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [usage, setUsage] = useState(null)

  const simulate = async (currentProfile, simulatedProfile) => {
    setLoading(true)
    setError(null)

    const systemPrompt = `You are an expert creator economy analyst. You compare a creator's current profile against a hypothetical "what-if" version and project how their monetization potential would change. Always respond in valid JSON only — no markdown, no explanation outside the JSON.`

    const userPrompt = `Compare these two creator profiles and project the monetization impact:

CURRENT PROFILE:
Platform: ${currentProfile.platform}
Niche: ${currentProfile.niche}
Followers: ${currentProfile.followers}
Engagement Rate: ${currentProfile.engagementRate}%
Content Frequency: ${currentProfile.contentFrequency}
Monthly Income: ₹${currentProfile.monthlyIncome}

SIMULATED "WHAT-IF" PROFILE:
Platform: ${simulatedProfile.platform}
Niche: ${simulatedProfile.niche}
Followers: ${simulatedProfile.followers}
Engagement Rate: ${simulatedProfile.engagementRate}%
Content Frequency: ${simulatedProfile.contentFrequency}

Return a JSON object with this exact structure:
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
  "incomeIncrease": {
    "absolute": number in INR,
    "percentage": number
  },
  "keyChanges": [
    {
      "factor": "e.g. Followers, Engagement Rate, Niche",
      "impact": "description of how this change affects earning potential",
      "magnitude": "high | medium | low"
    }
  ],
  "timeToAchieve": "realistic estimate of how long it would take to reach the simulated profile, e.g. '6-9 months'",
  "actionPlan": ["concrete step 1 to get there", "concrete step 2", "concrete step 3"],
  "feasibility": "high | medium | low",
  "feasibilityNote": "1-2 sentence note on how realistic this growth target is",
  "insight": "2-3 sentence insight comparing the two scenarios"
}`

    try {
      const { content: raw, usage: u } = await askGroq(systemPrompt, userPrompt, "what_if_simulator")
      const cleaned = raw.replace(/```json|```/g, "").trim()
      const parsed = JSON.parse(cleaned)
      setResult(parsed)
      setUsage(u)
    } catch (err) {
      if (err.isRateLimit) {
        setError(`Daily AI limit reached (${err.usage?.used}/${err.usage?.limit}). Try again tomorrow.`)
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
