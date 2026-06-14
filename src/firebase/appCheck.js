import { initializeAppCheck, ReCaptchaV3Provider, getToken } from "firebase/app-check"
import { app } from "./config"

/**
 * Initialize Firebase App Check with reCAPTCHA v3 (free, no usage limits).
 *
 * Setup:
 * 1. https://www.google.com/recaptcha/admin → Create → reCAPTCHA v3
 *    → add your domain + localhost → copy site key
 * 2. Firebase Console → App Check → Register web app → reCAPTCHA v3 → paste site key
 * 3. App Check → APIs tab → Firestore → Enforce
 * 4. For local dev: App Check → Manage debug tokens → Add token
 *    → set VITE_APPCHECK_DEBUG_TOKEN=your_debug_token in .env
 */

// Enable debug token for localhost (reCAPTCHA v3 doesn't work on localhost)
if (import.meta.env.DEV && import.meta.env.VITE_APPCHECK_DEBUG_TOKEN) {
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = import.meta.env.VITE_APPCHECK_DEBUG_TOKEN
}

let appCheckInstance = null

export function initAppCheck() {
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY

  if (!siteKey) {
    console.warn("[AppCheck] VITE_RECAPTCHA_SITE_KEY not set — App Check disabled")
    return
  }

  appCheckInstance = initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(siteKey),
    isTokenAutoRefreshEnabled: true,
  })
}

/**
 * Get the current App Check token to send to the Cloudflare Worker.
 * Returns null if App Check is not initialized (e.g. in dev without a site key).
 */
export async function getAppCheckToken() {
  if (!appCheckInstance) return null

  try {
    const result = await getToken(appCheckInstance, /* forceRefresh */ false)
    return result.token
  } catch (err) {
    console.warn("[AppCheck] Failed to get token:", err.message)
    return null
  }
}
