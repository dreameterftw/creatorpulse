import { useState } from "react"
import { askGroq, extractJSON } from "../utils/groq"
import { saveToHistory } from "../utils/history"
import { useCreator } from "../context/CreatorContext"

export function usePitchGenerator() {
  const [result,  setResult]  = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [usage,   setUsage]   = useState(null)

  const { buildCrossContext, updateSessionInsight } = useCreator()

  const generatePitch = async (profile, brandName, brandGoal) => {
    setLoading(true)
    setError(null)

    const crossContext = buildCrossContext()

    const systemPrompt = `You are an expert influencer marketing consultant who writes highly converting brand pitch emails. You write personalized, professional pitches that get responses. Always respond in valid JSON only — no markdown, no explanation outside the JSON.`

    const userPrompt = `Generate a personalized brand pitch:

CREATOR:
Name: ${profile.name}
Platform: ${profile.platforms?.join(", ") || profile.platform}
Niche: ${profile.niches?.join(", ") || profile.niche}
Followers: ${profile.followers}
Engagement Rate: ${profile.engagementRate}%
Audience Location: ${profile.audienceLocation}
Content Frequency: ${profile.contentFrequency}
Monthly Income: ₹${profile.monthlyIncome}${crossContext}

BRAND: ${brandName}
CAMPAIGN GOAL: ${brandGoal}

Return ONLY this JSON — no other text:
{
  "subjectLines": ["curiosity-driven subject", "value-driven subject", "direct subject"],
  "email": "200-250 word pitch email body mentioning ${brandName} by name, linking creator audience to brand, with specific collab idea for ${brandGoal}, ending with CTA",
  "followUpEmail": "80-100 word follow-up for day 5",
  "collaborationIdeas": [
    { "idea": "concept 1", "format": "e.g. Instagram Reel", "whyItWorks": "reason" },
    { "idea": "concept 2", "format": "e.g. Story series", "whyItWorks": "reason" }
  ],
  "talkingPoints": ["point 1", "point 2", "point 3", "point 4"],
  "redFlags": ["concern and how to address it"],
  "fitScore": number 0-100,
  "fitReason": "2 sentences on creator-brand fit"
}`

    try {
      const { content: raw, usage: u } = await askGroq(systemPrompt, userPrompt, "pitch_generator", 0.4)
      const parsed = extractJSON(raw)
      setResult({ ...parsed, brandName, brandGoal })
      setUsage(u)
      saveToHistory("pitch_generator", { result: { ...parsed, brandName, brandGoal }, brandName })
      updateSessionInsight("pitch_generator", `pitched ${brandName} (fit score ${parsed.fitScore}/100, goal: ${brandGoal})`)
    } catch (err) {
      if (err.isRateLimit) {
        setUsage(err.usage)
      } else {
        setError(err.message || "Failed to generate pitch. Please try again.")
      }
      console.error(err)
    }

    setLoading(false)
  }

  return { result, loading, error, usage, generatePitch }
}
