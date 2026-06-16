import { useState } from "react"
import { askGroq, extractJSON } from "../utils/groq"
import { saveToHistory } from "../utils/history"
import { useCreator } from "../context/CreatorContext"

export function useFitScore() {
  const [result,  setResult]  = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [usage,   setUsage]   = useState(null)

  const { buildCrossContext, updateSessionInsight } = useCreator()

  const analyzeFit = async (profile, brandName, brandDescription) => {
    setLoading(true)
    setError(null)

    const crossContext = buildCrossContext()

    const systemPrompt = `You are an expert influencer marketing strategist specializing in brand-creator alignment in the Indian creator economy. Always respond in valid JSON only — no markdown, no explanation outside the JSON.`

    const userPrompt = `Analyze brand-creator fit:

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
DESCRIPTION: ${brandDescription || "infer from brand name"}

Return ONLY this JSON — no other text:
{
  "overallScore": number 0-100,
  "verdict": "Strong Fit | Moderate Fit | Weak Fit | Poor Fit",
  "summary": "3-4 sentence assessment",
  "dimensions": [
    { "name": "Audience Match", "score": number 0-100, "description": "brief desc", "positive": "what works", "concern": "potential issue" },
    { "name": "Niche Relevance", "score": number 0-100, "description": "brief desc", "positive": "what works", "concern": "potential issue" },
    { "name": "Platform Alignment", "score": number 0-100, "description": "brief desc", "positive": "what works", "concern": "potential issue" },
    { "name": "Engagement Quality", "score": number 0-100, "description": "brief desc", "positive": "what works", "concern": "potential issue" },
    { "name": "Brand Safety", "score": number 0-100, "description": "brief desc", "positive": "what works", "concern": "potential issue" }
  ],
  "shouldPitch": true or false,
  "pitchAngle": "specific pitch angle if shouldPitch is true",
  "dealBreakers": ["dealbreaker 1"],
  "negotiationTips": ["tip 1", "tip 2"],
  "competitorBrands": ["brand1", "brand2", "brand3"]
}`

    try {
      const { content: raw, usage: u } = await askGroq(systemPrompt, userPrompt, "fit_score", 0.1)
      const parsed = extractJSON(raw)
      setResult({ ...parsed, brandName })
      setUsage(u)
      saveToHistory("fit_score", { result: { ...parsed, brandName }, brandName })
      updateSessionInsight("fit_score", `${brandName} scored ${parsed.overallScore}/100 (${parsed.verdict}), ${parsed.shouldPitch ? "should pitch" : "skip"}`)
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
