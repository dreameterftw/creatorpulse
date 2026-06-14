import { createRemoteJWKSet, jwtVerify } from "jose"
import { handleTurnstileVerify } from "./verify-turnstile"

// ── JWKS endpoints ──
const AUTH_JWKS = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/service_accounts/v1/metadata/jwk/securetoken@system.gserviceaccount.com"
  )
)

let appCheckJwks = null
function getAppCheckJWKS() {
  if (!appCheckJwks) {
    appCheckJwks = createRemoteJWKSet(
      new URL("https://firebaseappcheck.googleapis.com/v1/jwks")
    )
  }
  return appCheckJwks
}

// ── Auth verification ──
async function verifyAuthToken(idToken, projectId) {
  try {
    const { payload } = await jwtVerify(idToken, AUTH_JWKS, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    })
    return payload
  } catch {
    return null
  }
}

// ── App Check verification ──
// Audience uses project NUMBER (not ID): "projects/{number}"
// Firebase Console → Project Settings → General → Project number
async function verifyAppCheckToken(token, projectNumber) {
  try {
    const { payload } = await jwtVerify(token, getAppCheckJWKS(), {
      issuer: `https://firebaseappcheck.googleapis.com/${projectNumber}`,
      audience: `projects/${projectNumber}`,
    })
    return payload.exp * 1000 > Date.now()
  } catch (err) {
    console.error("App Check verification failed:", err.message)
    return false
  }
}

// ── Audit logging ──
async function logAiCall(env, { uid, feature, systemPromptLen, userPromptLen, responseLen }) {
  const timestamp = new Date().toISOString()
  const logKey = `log:${timestamp}:${uid}`

  const entry = {
    uid,
    feature,
    timestamp,
    systemPromptLen,
    userPromptLen,
    responseLen,
    // rough estimate: ~4 chars per token
    estimatedTokens: Math.round((systemPromptLen + userPromptLen + responseLen) / 4),
  }

  // Fire-and-forget — don't block the response on logging
  env.RATE_LIMIT_KV.put(logKey, JSON.stringify(entry), { expirationTtl: 2592000 }) // 30 days
    .catch((err) => console.error("Audit log write failed:", err))
}

// ── KV rate limiting ──
function getTodayKey(uid) {
  const today = new Date().toISOString().slice(0, 10) // "YYYY-MM-DD"
  return `usage:${uid}:${today}`
}

async function checkAndIncrementUsage(env, uid) {
  const key = getTodayKey(uid)
  const limit = Number(env.DAILY_LIMIT || 30)

  const current = await env.RATE_LIMIT_KV.get(key)
  const count = current ? Number(current) : 0

  if (count >= limit) {
    return { allowed: false, count, limit }
  }

  // Expire after 25 hours to handle timezone edge cases
  await env.RATE_LIMIT_KV.put(key, String(count + 1), { expirationTtl: 90000 })

  return { allowed: true, count: count + 1, limit }
}

// ── Helpers ──
function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Firebase-AppCheck",
  }
}

function jsonError(message, status, origin, extra = {}) {
  return new Response(
    JSON.stringify({ error: message, ...extra }),
    {
      status,
      headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
    }
  )
}

// ── Main handler ──
export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const origin = env.ALLOWED_ORIGIN || "*"

    // ── Route: Turnstile → App Check token exchange ──
    if (url.pathname === "/verify-turnstile") {
      return handleTurnstileVerify(request, env)
    }

    // 1. CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) })
    }

    // 2. Method check
    if (request.method !== "POST") {
      return jsonError("Method not allowed", 405, origin)
    }

    // 3. Firebase Auth JWT verification → get uid
    const authHeader = request.headers.get("Authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonError("Missing auth token", 401, origin)
    }
    const idToken = authHeader.slice(7)

    const authPayload = await verifyAuthToken(idToken, env.FIREBASE_PROJECT_ID)
    if (!authPayload) {
      return jsonError("Invalid or expired auth token", 401, origin)
    }
    const uid = authPayload.sub // Firebase uid

    // Block unverified email accounts — Google accounts always have this as true
    if (!authPayload.email_verified) {
      return jsonError("Email not verified", 403, origin)
    }

    // 4. App Check token verification (skipped if FIREBASE_PROJECT_NUMBER not set)
    if (env.FIREBASE_PROJECT_NUMBER) {
      const appCheckToken = request.headers.get("X-Firebase-AppCheck")
      if (!appCheckToken) {
        return jsonError("Missing App Check token", 401, origin)
      }
      const appCheckValid = await verifyAppCheckToken(
        appCheckToken,
        env.FIREBASE_PROJECT_NUMBER
      )
      if (!appCheckValid) {
        return jsonError("Invalid App Check token", 401, origin)
      }
    }

    // 5. Body validation
    let body
    try {
      body = await request.json()
    } catch {
      return jsonError("Invalid JSON body", 400, origin)
    }

    const { systemPrompt, userPrompt, feature } = body
    if (typeof systemPrompt !== "string" || typeof userPrompt !== "string") {
      return jsonError("systemPrompt and userPrompt must be strings", 400, origin)
    }
    if (!systemPrompt.trim() || !userPrompt.trim()) {
      return jsonError("Missing systemPrompt or userPrompt", 400, origin)
    }
    // Guard against prompt bloat (keep Groq costs predictable)
    if (systemPrompt.length > 2000 || userPrompt.length > 4000) {
      return jsonError("Prompt exceeds maximum allowed length", 400, origin)
    }
    // Validate optional feature identifier
    if (feature !== undefined && (typeof feature !== "string" || feature.length > 50)) {
      return jsonError("Invalid feature identifier", 400, origin)
    }

    // 6. Rate limit check (KV)
    const usage = await checkAndIncrementUsage(env, uid)
    if (!usage.allowed) {
      return jsonError(
        "Daily AI usage limit reached. Try again tomorrow.",
        429,
        origin,
        { limit: usage.limit, used: usage.count }
      )
    }

    // 7. Call Groq
    let groqData
    try {
      const groqResponse = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env.GROQ_API_KEY}`,
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
        }
      )
      groqData = await groqResponse.json()
    } catch (err) {
      console.error("Groq fetch error:", err)
      return jsonError("Upstream error contacting Groq", 502, origin)
    }

    const content = groqData?.choices?.[0]?.message?.content
    if (!content) {
      return jsonError("Empty response from Groq", 502, origin)
    }

    // 8. Audit log (fire-and-forget — never blocks the response)
    logAiCall(env, {
      uid,
      feature: feature || "unknown",
      systemPromptLen: systemPrompt.length,
      userPromptLen: userPrompt.length,
      responseLen: content.length,
    })

    // 9. Return content + usage info
    return new Response(
      JSON.stringify({
        content,
        uid,
        usage: { used: usage.count, limit: usage.limit },
      }),
      {
        headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
      }
    )
  },
}
