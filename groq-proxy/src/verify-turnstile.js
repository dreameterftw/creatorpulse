/**
 * Cloudflare Worker: Turnstile → Firebase App Check token exchange
 *
 * Secrets to set via wrangler:
 *   TURNSTILE_SECRET_KEY   — from Cloudflare Turnstile dashboard
 *   FIREBASE_PROJECT_ID    — e.g. "creatorpulse-gg"
 *   FIREBASE_APP_ID        — from Firebase project settings (the web app ID)
 *   APP_CHECK_SECRET       — generate with:
 *                            openssl rand -base64 32
 *                            then register it in Firebase Console →
 *                            App Check → Manage debug tokens → Add secret
 *
 * wrangler secret put TURNSTILE_SECRET_KEY
 * wrangler secret put FIREBASE_PROJECT_ID
 * wrangler secret put FIREBASE_APP_ID
 * wrangler secret put APP_CHECK_SECRET
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}

export async function handleTurnstileVerify(request, env) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS })
  }

  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return new Response("Invalid JSON", { status: 400 })
  }

  const { turnstileToken } = body
  if (!turnstileToken) {
    return new Response("Missing turnstileToken", { status: 400 })
  }

  // ── 1. Verify with Cloudflare siteverify ──
  const formData = new FormData()
  formData.append("secret", env.TURNSTILE_SECRET_KEY)
  formData.append("response", turnstileToken)

  const verifyRes = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    { method: "POST", body: formData }
  )
  const verifyData = await verifyRes.json()

  if (!verifyData.success) {
    return new Response(
      JSON.stringify({ error: "Turnstile verification failed", codes: verifyData["error-codes"] }),
      { status: 403, headers: { ...CORS, "Content-Type": "application/json" } }
    )
  }

  // ── 2. Exchange for Firebase App Check token ──
  // Uses the Firebase App Check custom provider REST API
  const appCheckRes = await fetch(
    `https://firebaseappcheck.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/apps/${env.FIREBASE_APP_ID}:exchangeCustomToken`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customToken: env.APP_CHECK_SECRET }),
    }
  )

  if (!appCheckRes.ok) {
    const err = await appCheckRes.text()
    return new Response(
      JSON.stringify({ error: "App Check exchange failed", detail: err }),
      { status: 502, headers: { ...CORS, "Content-Type": "application/json" } }
    )
  }

  const { token, ttl } = await appCheckRes.json()
  // ttl is like "3600s" — convert to ms
  const ttlMillis = parseInt(ttl) * 1000

  return new Response(
    JSON.stringify({ appCheckToken: token, ttlMillis }),
    { headers: { ...CORS, "Content-Type": "application/json" } }
  )
}
