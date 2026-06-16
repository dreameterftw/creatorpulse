export default function UsageBadge({ usage }) {
  if (!usage) return null

  const remaining = usage.limit - usage.used
  const isLow = remaining <= 5
  const isEmpty = remaining <= 0

  const now = new Date()
  const nextUtcMidnight = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0,
    0,
    0,
    0
  ))
  const diffMs = nextUtcMidnight.getTime() - now.getTime()
  const hours = Math.floor(diffMs / 3600000)
  const minutes = Math.floor((diffMs % 3600000) / 60000)
  const resetLabel = `${hours}h ${minutes}m until reset (UTC)`

  return (
    <div className="flex flex-col gap-1 text-left">
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
          isEmpty
            ? "bg-red-100 text-red-700"
            : isLow
            ? "bg-orange-100 text-orange-700"
            : "bg-gray-100 text-gray-500"
        }`}
      >
        ⚡ {remaining} / {usage.limit} AI calls left today
      </div>
      <span className="text-[11px] text-[#6b7280]">{resetLabel}</span>
    </div>
  )
}
