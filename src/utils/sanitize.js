/**
 * Strip characters that could break JSON parsing or attempt prompt injection,
 * then truncate to a safe length.
 */
export function sanitizeInput(str, maxLength = 200) {
  if (typeof str !== "string") return ""
  return str
    .replace(/[<>{}[\]\\]/g, "")   // strip shell/JSON/HTML metacharacters
    .replace(/(\bignore\b|\bforget\b|\boverride\b|\bsystem prompt\b)/gi, "") // basic prompt injection guard
    .slice(0, maxLength)
    .trim()
}
