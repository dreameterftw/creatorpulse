/**
 * CreatorPulse — Groq Proxy Worker
 * Self-contained: no npm dependencies, uses Web Crypto API only.
 * Paste this directly into the Cloudflare dashboard editor.
 *
 * Required secrets (set in Worker Settings → Variables → Secrets):
 *   GROQ_API_KEY
 *   FIREBASE_PROJECT_ID        (e.g. "creatorpulse-gg")
 *   FIREBASE_PROJECT_NUMBER    (e.g. "518661198406")
 *
 * Required KV binding (set in Worker Settings → KV Namespace Bindings):
 *   Variable name: RATE_LIMIT_KV
 *   Namespace:     RATE_LIMIT_KV  (id: 18b8c3b1ff004e1ea56ee522b0762342)
 *
 * Required vars (set in Worker Settings → Variables → Environment Variables):
 *   ALLOWED_ORIGIN   = https://creatorpulse-gg.web.app
 *   DAILY_LIMIT      = 30
 */

// ─── JWT helpers ───────────────────────────────────────────────────────────

function b64urlDecode(str) {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/")
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4))
  const binary = atob(b64 + pad)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function parseJwt(token) {
  const parts = token.split(".")
  if (parts.length !== 3) throw new Error("Invalid JWT")
  const header  = JSON.parse(new TextDecoder().decode(b64urlDecode(parts[0])))
  const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(parts[1])))
  return { header, payload, parts }
}

async function importRSAKey(jwk) {
  return crypto.subtle.importKey(
    "jwk", jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false, ["verify"]
  )
}

async function verifyJwtSignature(parts, key) {
  const data = new TextEncoder().encode(`${parts[0]}.${parts[1]}`)
  const sig  = b64urlDecode(parts[2])
  return crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, sig, data)
}

// Cache JWKS to avoid fetching on every request
const jwksCache = {}

async function getJwks(url) {
  if (jwksCache[url] && jwksCache[url].expiresAt > Date.now()) {
    return jwksCache[url].keys
  }
  const res  = await fetch(url)
  const data = await res.json()
  // Cache for 5 minutes
  jwksCache[url] = { keys: data.keys || Object.values(data), expiresAt: Date.now() + 300_000 }
  return jwksCache[url].keys
}

async function verifyFirebaseAuthToken(token, projectId) {
  try {
    const { header, payload, parts } = parseJwt(token)

    // Basic claim checks
    if (payload.aud !== projectId) return null
    if (payload.iss !== `https://securetoken.google.com/${projectId}`) return null
    if (payload.exp * 1000 < Date.now()) return null
    if (!payload.sub) return null

    // Fetch Google's public JWKs for Firebase Auth
    const keys = await getJwks(
      "https://www.googleapis.com/service_accounts/v1/metadata/jwk/securetoken@system.gserviceaccount.com"
    )
    const jwk = keys.find(k => k.kid === header.kid)
    if (!jwk) return null

    const key = await importRSAKey(jwk)
    const valid = await verifyJwtSignature(parts, key)
    return valid ? payload : null
  } catch {
    return null
  }
}

async function verifyAppCheckToken(token, projectNumber) {
  try {
    const { header, payload, parts } = parseJwt(token)

    if (!payload.sub) return false
    if (payload.aud !== `projects/${projectNumber}`) return false
    if (payload.iss !== `https://firebaseappcheck.googleapis.com/${projectNumber}`) return false
    if (payload.exp * 1000 < Date.now()) return false

    const keys = await getJwks("https://firebaseappcheck.googleapis.com/v1/jwks")
    const jwk  = keys.find(k => k.kid === header.kid)
    if (!jwk) return false

    const key   = await importRSAKey(jwk)
    return verifyJwtSignature(parts, key)
  } catch {
    return false
  }
}

// ─── Rate limiting (KV) ────────────────────────────────────────────────────

function getTodayKey(uid) {
  return `usage:${uid}:${new Date().toISOString().slice(0, 10)}`
}

async function checkAndIncrementUsage(env, uid) {
  if (!env.RATE_LIMIT_KV || typeof env.RATE_LIMIT_KV.get !== "function") {
    return {
      error: "RATE_LIMIT_KV binding missing or invalid",
      allowed: false,
      count: 0,
      limit: Number(env.DAILY_LIMIT || 30),
    }
  }
  const key   = getTodayKey(uid)
  const limit = Number(env.DAILY_LIMIT || 30)
  const cur   = await env.RATE_LIMIT_KV.get(key)
  const count = cur ? Number(cur) : 0

  if (count >= limit) return { allowed: false, count, limit }

  await env.RATE_LIMIT_KV.put(key, String(count + 1), { expirationTtl: 90000 })
  return { allowed: true, count: count + 1, limit }
}

// ─── Audit logging (KV, fire-and-forget) ──────────────────────────────────

function logAiCall(env, { uid, feature, systemPromptLen, userPromptLen, responseLen }) {
  if (!env.RATE_LIMIT_KV || typeof env.RATE_LIMIT_KV.put !== "function") return
  const entry = JSON.stringify({
    uid, feature,
    timestamp: new Date().toISOString(),
    systemPromptLen, userPromptLen, responseLen,
    estimatedTokens: Math.round((systemPromptLen + userPromptLen + responseLen) / 4),
  })
  env.RATE_LIMIT_KV
    .put(`log:${new Date().toISOString()}:${uid}`, entry, { expirationTtl: 2592000 })
    .catch(err => console.error("Audit log failed:", err))
}

// ─── CORS + error helpers ──────────────────────────────────────────────────

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Firebase-AppCheck",
  }
}

function jsonError(msg, status, origin, extra = {}) {
  return new Response(
    JSON.stringify({ error: msg, ...extra }),
    { status, headers: { "Content-Type": "application/json", ...corsHeaders(origin) } }
  )
}

// ─── Main handler ──────────────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    const origin = env.ALLOWED_ORIGIN || "*"

    // 1. CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) })
    }

    // 2. Method check
    if (request.method !== "POST") {
      return jsonError("Method not allowed", 405, origin)
    }

    // 3. Firebase Auth JWT
    const authHeader = request.headers.get("Authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonError("Missing auth token", 401, origin)
    }

    const authPayload = await verifyFirebaseAuthToken(
      authHeader.slice(7), env.FIREBASE_PROJECT_ID
    )
    if (!authPayload) {
      return jsonError("Invalid or expired auth token", 401, origin)
    }
    const uid = authPayload.sub

    // 4. Email verification check
    if (!authPayload.email_verified) {
      return jsonError("Email not verified", 403, origin)
    }

    // 5. App Check (optional — only enforced if FIREBASE_PROJECT_NUMBER is set)
    if (env.FIREBASE_PROJECT_NUMBER) {
      const appCheckToken = request.headers.get("X-Firebase-AppCheck")
      if (!appCheckToken) {
        return jsonError("Missing App Check token", 401, origin)
      }
      const valid = await verifyAppCheckToken(appCheckToken, env.FIREBASE_PROJECT_NUMBER)
      if (!valid) {
        return jsonError("Invalid App Check token", 401, origin)
      }
    }

    // 6. Parse + validate body
    let body
    try { body = await request.json() }
    catch { return jsonError("Invalid JSON body", 400, origin) }

    const { systemPrompt, userPrompt, feature } = body

    if (typeof systemPrompt !== "string" || typeof userPrompt !== "string") {
      return jsonError("systemPrompt and userPrompt must be strings", 400, origin)
    }
    if (!systemPrompt.trim() || !userPrompt.trim()) {
      return jsonError("Missing systemPrompt or userPrompt", 400, origin)
    }
    if (systemPrompt.length > 2000 || userPrompt.length > 4000) {
      return jsonError("Prompt exceeds maximum allowed length", 400, origin)
    }
    if (feature !== undefined && (typeof feature !== "string" || feature.length > 50)) {
      return jsonError("Invalid feature identifier", 400, origin)
    }

    // 7. Rate limit
    const usage = await checkAndIncrementUsage(env, uid)
    if (!usage.allowed) {
      return jsonError(
        "Daily AI usage limit reached. Try again tomorrow.",
        429, origin,
        { limit: usage.limit, used: usage.count }
      )
    }

    // 8. Call Groq
    let groqData
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user",   content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 1500,
        }),
      })
      groqData = await res.json()
    } catch (err) {
      console.error("Groq fetch error:", err)
      return jsonError("Upstream error contacting Groq", 502, origin)
    }

    const content = groqData?.choices?.[0]?.message?.content
    if (!content) {
      return jsonError("Empty response from Groq", 502, origin)
    }

    // 9. Audit log (non-blocking)
    logAiCall(env, {
      uid,
      feature: feature || "unknown",
      systemPromptLen: systemPrompt.length,
      userPromptLen:   userPrompt.length,
      responseLen:     content.length,
    })

    // 10. Return
    return new Response(
      JSON.stringify({ content, uid, usage: { used: usage.count, limit: usage.limit } }),
      { headers: { "Content-Type": "application/json", ...corsHeaders(origin) } }
    )
  }
}
