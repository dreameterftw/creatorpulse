import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "../firebase/config"

const DAILY_LIMIT = 30

/**
 * Check whether the current user has exceeded their daily AI call limit.
 * Increments the counter if under the limit.
 * Returns { allowed: boolean, remaining: number }.
 */
export async function checkAndIncrementUsage(uid) {
  const ref = doc(db, "users", uid)
  const snap = await getDoc(ref)

  if (!snap.exists()) return { allowed: false, remaining: 0 }

  const data = snap.data()
  const today = new Date().toISOString().slice(0, 10) // "YYYY-MM-DD"

  const lastCallDate = data.lastCallDate || ""
  const dailyAiCalls = lastCallDate === today ? (data.dailyAiCalls || 0) : 0

  if (dailyAiCalls >= DAILY_LIMIT) {
    return { allowed: false, remaining: 0 }
  }

  // Increment — fire and forget, don't block the AI call on this write
  updateDoc(ref, {
    dailyAiCalls: dailyAiCalls + 1,
    lastCallDate: today,
  }).catch(console.error)

  return { allowed: true, remaining: DAILY_LIMIT - dailyAiCalls - 1 }
}
