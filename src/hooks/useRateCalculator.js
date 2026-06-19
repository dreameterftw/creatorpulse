import { useState } from "react"
import { askGroq, extractJSON } from "../utils/groq"
import { saveToHistory } from "../utils/history"
import { useCreator } from "../context/CreatorContext"
import { makeCacheKey, getCached, setCached } from "../utils/resultCache"

export function useRateCalculator() {
  const [result,  setResult]  = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [usage,   setUsage]   = useState(null)

  const { updateSessionInsight } = useCreator()
  // Note: we intentionally do NOT use buildCrossContext here.
  // Rates must be deterministic based purely on hard stats, not session state.

  const calculateRates = async (profile) => {
    setLoading(true)
    setError(null)

    // ── Build deterministic cache key from the inputs that affect rates ──
    const cacheInputs = {
      platform:        profile.platforms?.[0] || profile.platform,
      niche:           (profile.niches || [profile.niche]).sort().join(","),
      followers:       Number(profile.followers),
      engagementRate:  Number(profile.engagementRate),
      audienceLocation:profile.audienceLocation,
    }
    const cacheKey = makeCacheKey(cacheInputs)
    const cached = getCached(cacheKey)
    if (cached) {
      setResult(cached)
      setLoading(false)
      return
    }

    // ── Prompt — no cross-context, temperature 0 for determinism ──
    const systemPrompt = `You are an expert influencer marketing consultant with deep knowledge of the Indian creator economy. You provide data-backed rate recommendations calibrated to the Indian market.

CRITICAL: All rates must be in INR and anchored to these Indian market benchmarks:
- Nano creator (<10K followers, 5% eng): ₹500–₹2,000 per sponsored post
- Micro creator (10K–100K followers, 4–6% eng): ₹3,000–₹20,000 per sponsored post
- Mid-tier creator (100K–500K followers, 3–5% eng): ₹20,000–₹80,000 per sponsored post
- Macro creator (500K–1M followers): ₹80,000–₹2,00,000 per sponsored post
- Reels command 1.3–1.6x a static post rate; Stories are 0.4–0.6x; YouTube integration 1.8–2.5x static post; Brand ambassador 4–6x monthly post rate; UGC-only 0.5–0.7x post rate
- High engagement (>6%) justifies up to 40% premium; low engagement (<2%) warrants 20–30% discount
- Finance, tech, and D2C niches in India command 20–35% premium over lifestyle/entertainment

Always respond in valid JSON only — no markdown, no explanation outside the JSON.`

    const userPrompt = `Calculate sponsorship rates for this creator. Use only the stats provided — do not infer or add assumptions beyond what is given.

Platform: ${cacheInputs.platform}
Niche: ${profile.niches?.join(", ") || profile.niche}
Followers: ${cacheInputs.followers}
Engagement Rate: ${cacheInputs.engagementRate}%
Audience Location: ${cacheInputs.audienceLocation || "India"}
Content Frequency: ${profile.contentFrequency || "not specified"}
Current Monthly Income: ₹${profile.monthlyIncome || 0}

IMPORTANT: For a creator with ${cacheInputs.followers} followers and ${cacheInputs.engagementRate}% engagement, provide precise, consistent rates that reflect the Indian market. Do not round to large numbers — be specific.

Return ONLY this JSON structure, no other text:
{
  "summary": "2-3 sentences explaining the rate rationale",
  "rates": {
    "sponsored_post":      { "min": number, "max": number, "currency": "INR" },
    "story_set":           { "min": number, "max": number, "currency": "INR" },
    "reel":                { "min": number, "max": number, "currency": "INR" },
    "youtube_integration": { "min": number, "max": number, "currency": "INR" },
    "brand_ambassador":    { "min": number, "max": number, "currency": "INR" },
    "ugc_only":            { "min": number, "max": number, "currency": "INR" }
  },
  "strengths": ["strength1", "strength2", "strength3"],
  "engagementTier": "low | average | good | excellent",
  "marketPosition": "nano | micro | mid | macro",
  "justification": "2-3 sentences explaining rate reasoning with specific reference to follower count and engagement"
}`

    try {
      // temperature: 0 → fully deterministic output for same inputs
      const { content: raw, usage: u } = await askGroq(systemPrompt, userPrompt, "rate_calculator", 0)
      const parsed = extractJSON(raw)

      // Cache result so re-runs with same inputs return instantly
      setCached(cacheKey, parsed)
      setResult(parsed)
      setUsage(u)

      saveToHistory("rate_calculator", {
        result: parsed,
        profile: { platform: cacheInputs.platform, niche: cacheInputs.niche, followers: cacheInputs.followers },
      })

      updateSessionInsight(
        "rate_calculator",
        `${parsed.marketPosition} creator, ${parsed.engagementTier} engagement, suggested post rate ₹${Math.round(((parsed.rates?.sponsored_post?.min || 0) + (parsed.rates?.sponsored_post?.max || 0)) / 2)?.toLocaleString()}`
      )
    } catch (err) {
      if (err.isRateLimit) {
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
