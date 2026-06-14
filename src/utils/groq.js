import { auth } from "../firebase/config"
import { getAppCheckToken } from "../firebase/appCheck"
import { checkAndIncrementUsage } from "./rateLimit"

const PROXY_URL = import.meta.env.VITE_GROQ_PROXY_URL || ""

/**
 * Central Groq call.
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @param {string} feature - identifier logged for audit/cost tracking
 * Returns { content: string, usage: { used, limit } | null }
 */
export async function askGroq(systemPrompt, userPrompt, feature = "unknown") {
  const user = auth.currentUser
  if (!user) throw new Error("Not authenticated")

  if (PROXY_URL) {
    // ── Production: Worker handles rate limiting + audit logging server-side ──
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
      body: JSON.stringify({ systemPrompt, userPrompt, feature }),
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

  // ── Dev fallback: client-side Firestore rate limit + direct Groq call ──
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
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    }),
  })

  const data = await response.json()
  const limit = 30
  const used = limit - remaining
  return {
    content: data.choices[0].message.content,
    usage: { used, limit },
  }
}
