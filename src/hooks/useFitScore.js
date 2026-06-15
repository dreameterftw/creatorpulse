import { useState } from "react"
import { askGroq } from "../utils/groq"
import { saveToHistory } from "../utils/history"

export function useFitScore() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [usage, setUsage] = useState(null)

  const analyzeFit = async (profile, brandName, brandDescription) => {
    setLoading(true)
    setError(null)

    const systemPrompt = `You are an expert influencer marketing strategist who deeply understands brand-creator alignment in the Indian creator economy. You analyze compatibility between creators and brands across multiple dimensions. Always respond in valid JSON only — no markdown, no explanation outside the JSON.`

    const userPrompt = `Analyze the fit between this creator and brand across multiple dimensions:

CREATOR PROFILE:
Name: ${profile.name}
Platform: ${profile.platform}
Niche: ${profile.niche}
Followers: ${profile.followers}
Engagement Rate: ${profile.engagementRate}%
Audience Location: ${profile.audienceLocation}
Content Frequency: ${profile.contentFrequency}

BRAND:
Brand Name: ${brandName}
Brand Description: ${brandDescription || "Not provided — infer from brand name"}

Analyze fit across these 5 dimensions and return a JSON object with this exact structure:
{
  "overallScore": number 0-100,
  "verdict": "Strong Fit | Moderate Fit | Weak Fit | Poor Fit",
  "summary": "3-4 sentence overall assessment of this pairing",
  "dimensions": [
    {
      "name": "Audience Match",
      "score": number 0-100,
      "description": "how well creator's audience matches brand's target customer",
      "positive": "what works",
      "concern": "what could be a problem"
    },
    {
      "name": "Niche Relevance",
      "score": number 0-100,
      "description": "how relevant creator's content niche is to brand's category",
      "positive": "what works",
      "concern": "what could be a problem"
    },
    {
      "name": "Platform Alignment",
      "score": number 0-100,
      "description": "how well creator's platform suits brand's marketing goals",
      "positive": "what works",
      "concern": "what could be a problem"
    },
    {
      "name": "Engagement Quality",
      "score": number 0-100,
      "description": "whether creator's engagement rate justifies brand investment",
      "positive": "what works",
      "concern": "what could be a problem"
    },
    {
      "name": "Brand Safety",
      "score": number 0-100,
      "description": "how safe and aligned the creator's content style is for the brand",
      "positive": "what works",
      "concern": "what could be a problem"
    }
  ],
  "shouldPitch": true or false,
  "pitchAngle": "if shouldPitch is true — the specific angle to use when pitching this brand",
  "dealBreakers": ["any absolute dealbreakers that would make a brand reject immediately"],
  "negotiationTips": ["tip 1 for negotiating with this brand", "tip 2"],
  "competitorBrands": ["3 similar brands that might be an even better fit"]
}`

    try {
      const { content: raw, usage: u } = await askGroq(systemPrompt, userPrompt, "fit_score")
      const cleaned = raw.replace(/```json|```/g, "").trim()
      const parsed = JSON.parse(cleaned)
      setResult({ ...parsed, brandName })
      setUsage(u)
      saveToHistory("fit_score", { result: { ...parsed, brandName }, brandName })
    } catch (err) {
      if (err.isRateLimit) {
        setUsage(err.usage)
      } else {
        setError(err.message || "Failed to analyze fit. Please try again.")
      }
      console.error(err)
    }

    setLoading(false)
  }

  return { result, loading, error, usage, analyzeFit }
}
