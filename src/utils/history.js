/**
 * Per-tool result history — stored in localStorage.
 * Max 10 entries per tool, newest first.
 */

const MAX = 10

export function saveToHistory(tool, entry) {
  try {
    const key  = `cp_history_${tool}`
    const prev = JSON.parse(localStorage.getItem(key) || "[]")
    const next = [{ ...entry, savedAt: new Date().toISOString() }, ...prev].slice(0, MAX)
    localStorage.setItem(key, JSON.stringify(next))
  } catch {}
}

export function getHistory(tool) {
  try {
    return JSON.parse(localStorage.getItem(`cp_history_${tool}`) || "[]")
  } catch { return [] }
}

export function clearHistory(tool) {
  localStorage.removeItem(`cp_history_${tool}`)
}

export function formatHistoryTime(iso) {
  try {
    const d = new Date(iso)
    const now = new Date()
    const diffMin = Math.round((now - d) / 60000)
    if (diffMin < 1)  return "Just now"
    if (diffMin < 60) return `${diffMin}m ago`
    const diffH = Math.round(diffMin / 60)
    if (diffH < 24)   return `${diffH}h ago`
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
  } catch { return "" }
}
