/**
 * In-memory result cache for AI tool outputs.
 * Keyed by a hash of the inputs — same inputs always return the same result.
 * Cleared on page reload (intentional — Firestore profile changes should re-trigger).
 */

const cache = new Map()

/**
 * Create a deterministic cache key from any object.
 * Sorts keys so { a:1, b:2 } and { b:2, a:1 } produce the same key.
 */
export function makeCacheKey(obj) {
  return JSON.stringify(obj, Object.keys(obj).sort())
}

export function getCached(key) {
  return cache.get(key) || null
}

export function setCached(key, value) {
  cache.set(key, value)
}

export function clearCache() {
  cache.clear()
}
