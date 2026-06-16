import { auth } from "../firebase/config"
import { getAppCheckToken } from "../firebase/appCheck"
import { checkAndIncrementUsage } from "./rateLimit"

const PROXY_URL = import.meta.env.VITE_GROQ_PROXY_URL || ""

/**
 * Robustly extract valid JSON from an AI response string.
 * Handles: markdown fences, leading/trailing text, truncated responses.
 */
export function extractJSON(raw) {
  if (!raw) throw new Error("Empty response from AI")

  // Strip markdown fences
  let cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim()

  // Try direct parse first
  try { return JSON.parse(cleaned) } catch {}

  // Find the outermost { ... } block
  const start = cleaned.indexOf("{")
  const end   = cleaned.lastIndexOf("}")
  if (start !== -1 && end !== -1 && end > start) {
    try { return JSON.parse(cleaned.slice(start, end + 1)) } catch {}
  }

  // Find the outermost [ ... ] block
  const aStart = cleaned.indexOf("[")
  const aEnd   = cleaned.lastIndexOf("]")
  if (aStart !== -1 && aEnd !== -1 && aEnd > aStart) {
    try { return JSON.parse(cleaned.slice(aStart, aEnd + 1)) } catch {}
  }

  throw new Error("Could not parse AI response as JSON")
}

/**
 * Central Groq call.
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @param {string} feature      - identifier logged for audit/cost tracking
 * @param {number} temperature  - 0.0–1.0, default 0.3 (lower = more consistent)
 * Returns { content: string, usage: { used, limit } | null }
 */
export async function askGroq(systemPrompt, userPrompt, feature = "unknown", temperature = 0.3) {
  const user = auth.currentUser
  if (!user) throw new Error("Not authenticated")

  if (PROXY_URL) {
    const [idToken, appCheckToken] = await Promise.all([
      user.getIdToken(),
      getAppCheckToken(),
    ])

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    }
    if (appCheckToken) {
      headers["X-Firebase-AppCheck"] = appCheckToken
    }

    const response = await fetch(PROXY_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({ systemPrompt, userPrompt, feature, temperature }),
    })

    const data = await response.json()

    if (!response.ok) {
      if (response.status === 429) {
        const err = new Error(data.error || "Daily limit reached")
        err.isRateLimit = true
        err.usage = { used: data.used, limit: data.limit }
        throw err
      }
      throw new Error(data.error || `Request failed (${response.status})`)
    }

    return { content: data.content, usage: data.usage }
  }

  // ── Dev fallback ──
  const { allowed, remaining } = await checkAndIncrementUsage(user.uid)
  if (!allowed) {
    const err = new Error("Daily AI limit reached (30 calls/day). Try again tomorrow.")
    err.isRateLimit = true
    err.usage = { used: 30, limit: 30 }
    throw err
  }

  console.debug(`[groq] dev mode (${feature}) — ${remaining} calls remaining today`)

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userPrompt },
      ],
      temperature,
      max_tokens: 1500,
    }),
  })

  const data = await response.json()
  const limit = 30
  const used  = limit - remaining
  return {
    content: data.choices[0].message.content,
    usage: { used, limit },
  }
}
