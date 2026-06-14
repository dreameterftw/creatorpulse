export default function UsageBadge({ usage }) {
  if (!usage) return null

  const remaining = usage.limit - usage.used
  const isLow = remaining <= 5
  const isEmpty = remaining <= 0

  return (
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
  )
}
