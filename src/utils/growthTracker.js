/**
 * Growth tracking utilities — weekly snapshots stored in Firestore.
 * Collection: users/{uid}/growth/{weekKey}
 * weekKey format: "2026-W24" (ISO week)
 */
import { collection, doc, setDoc, getDocs, orderBy, query, limit } from "firebase/firestore"
import { db } from "../firebase/config"

/**
 * Returns ISO week key like "2026-W24"
 */
export function getCurrentWeekKey() {
  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const week = Math.ceil(((now - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7)
  return `${now.getFullYear()}-W${String(week).padStart(2, "0")}`
}

/**
 * Returns a human-readable label for a week key
 */
export function weekLabel(key) {
  try {
    const [year, w] = key.split("-W")
    const weekNum = parseInt(w)
    // Get approximate date of that week
    const jan1 = new Date(parseInt(year), 0, 1)
    const dayOffset = (weekNum - 1) * 7
    const d = new Date(jan1.getTime() + dayOffset * 86400000)
    return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" })
  } catch {
    return key
  }
}

/**
 * Save a weekly growth snapshot for a platform
 */
export async function saveGrowthEntry(uid, platform, followers, engagementRate) {
  const weekKey = getCurrentWeekKey()
  const ref = doc(db, "users", uid, "growth", `${platform}_${weekKey}`)
  await setDoc(ref, {
    platform,
    followers: Number(followers),
    engagementRate: Number(engagementRate) || 0,
    weekKey,
    recordedAt: new Date(),
  })
}

/**
 * Fetch last N weeks of growth data for a platform
 */
export async function getGrowthHistory(uid, platform, weeks = 8) {
  const ref = collection(db, "users", uid, "growth")
  const q   = query(ref, orderBy("recordedAt", "desc"), limit(weeks * 2))
  const snap = await getDocs(q)
  const entries = []
  snap.forEach(d => {
    const data = d.data()
    if (data.platform === platform) entries.push(data)
  })
  // Sort oldest first and deduplicate by weekKey (keep latest per week)
  const byWeek = {}
  entries.forEach(e => { byWeek[e.weekKey] = e })
  return Object.values(byWeek)
    .sort((a, b) => a.weekKey.localeCompare(b.weekKey))
    .slice(-weeks)
}

/**
 * Calculate week-over-week delta
 */
export function calcGrowthDelta(entries) {
  if (entries.length < 2) return null
  const latest = entries[entries.length - 1]
  const prev   = entries[entries.length - 2]
  const delta  = latest.followers - prev.followers
  const pct    = prev.followers > 0 ? ((delta / prev.followers) * 100).toFixed(1) : 0
  return { delta, pct: Number(pct), latest, prev }
}
