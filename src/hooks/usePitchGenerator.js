import { useState } from "react"
import { askGroq } from "../utils/groq"
import { saveToHistory } from "../utils/history"
import { useCreator } from "../context/CreatorContext"

export function usePitchGenerator() {
  const [result,  setResult]  = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [usage,   setUsage]   = useState(null)

  const { buildCrossContext, updateSessionInsight } = useCreator()

  // brandGoal = campaign goal (e.g. "Product Launch", "Brand Awareness")
  const generatePitch = async (profile, brandName, brandGoal) => {
    setLoading(true)
    setError(null)

    const crossContext = buildCrossContext()

    const systemPrompt = `You are an expert influencer marketing consultant who writes highly converting brand pitch emails for content creators. You write personalized, professional pitches that get responses — not generic templates. Always respond in valid JSON only — no markdown, no explanation outside the JSON.`

    const userPrompt = `Generate a personalized brand pitch for this creator targeting this brand:

CREATOR PROFILE:
Name: ${profile.name}
Platform: ${profile.platforms?.join(", ") || profile.platform}
Niche: ${profile.niches?.join(", ") || profile.niche}
Followers: ${profile.followers}
Engagement Rate: ${profile.engagementRate}%
Audience Location: ${profile.audienceLocation}
Content Frequency: ${profile.contentFrequency}
Monthly Income: ₹${profile.monthlyIncome}
Income Streams: ${profile.incomeStreams?.join(", ") || "not specified"}${crossContext}

TARGET BRAND:
Brand Name: ${brandName}
Campaign Goal: ${brandGoal}

Return a JSON object with this exact structure:
{
  "subjectLines": [
    "subject line option 1 - curiosity driven",
    "subject line option 2 - value driven",
    "subject line option 3 - direct and confident"
  ],
  "email": "full personalized pitch email body — mention the brand by name, tie the creator's audience to the brand's target customer, include a specific collaboration idea aligned with the campaign goal, end with a clear CTA. Make it 200-250 words. Professional but conversational tone.",
  "followUpEmail": "a short 80-100 word follow up email to send 5 days later if no response",
  "collaborationIdeas": [
    {
      "idea": "specific collaboration concept aligned with the campaign goal",
      "format": "e.g. Instagram Reel, YouTube integration",
      "whyItWorks": "why this idea fits both the creator and brand"
    },
    {
      "idea": "second collaboration concept",
      "format": "e.g. Story series, dedicated post",
      "whyItWorks": "why this idea fits both the creator and brand"
    }
  ],
  "talkingPoints": ["point 1", "point 2", "point 3", "point 4"],
  "redFlags": ["potential concern a brand might have and how to address it"],
  "fitScore": number between 0-100,
  "fitReason": "2 sentence explanation of why this creator and brand are a good or bad fit"
}`

    try {
      const { content: raw, usage: u } = await askGroq(systemPrompt, userPrompt, "pitch_generator")
      const cleaned = raw.replace(/```json|```/g, "").trim()
      const parsed  = JSON.parse(cleaned)
      setResult({ ...parsed, brandName, brandGoal })
      setUsage(u)
      saveToHistory("pitch_generator", {
        result: { ...parsed, brandName, brandGoal },
        brandName,
      })
      updateSessionInsight(
        "pitch_generator",
        `pitched ${brandName} (fit score ${parsed.fitScore}/100, goal: ${brandGoal})`
      )
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
