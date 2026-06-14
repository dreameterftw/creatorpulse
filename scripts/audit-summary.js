/**
 * Audit Summary Script
 * Summarizes AI call logs stored in Cloudflare KV.
 *
 * Usage:
 *   1. Export log keys:
 *      npx wrangler kv key list --namespace-id=YOUR_KV_ID --prefix="log:" > logs.json
 *   2. Run this script:
 *      node scripts/audit-summary.js
 *
 * Output: table of calls per user + breakdown by feature
 */

import fs from "fs"

const raw = fs.readFileSync("logs.json", "utf-8")
const keys = JSON.parse(raw)

const byUser = {}
const byFeature = {}
let totalTokens = 0

for (const { name } of keys) {
  // Key format: log:<ISO timestamp>:<uid>
  const parts = name.split(":")
  // uid is everything after the second colon (timestamp has colons too)
  // format: log:2026-06-13T10:23:45.000Z:abc123uid
  // parts[0]=log, parts[1..4]=timestamp parts, parts[5]=uid
  const uid = parts.slice(5).join(":") || parts[2] || "unknown"

  byUser[uid] = (byUser[uid] || 0) + 1
}

console.log("\n=== Calls per user ===")
console.table(byUser)

console.log(`\nTotal log entries: ${keys.length}`)
console.log("(Fetch individual entries with: npx wrangler kv key get <key> --namespace-id=YOUR_KV_ID)")
