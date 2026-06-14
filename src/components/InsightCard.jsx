/**
 * AI insight card — used in the dashboard insights feed.
 */
export default function InsightCard({ icon = "✦", text, tag }) {
  return (
    <div className="flex items-start gap-3 py-3" style={{ borderBottom: "1px solid var(--color-border)" }}>
      <div
        className="w-7 h-7 rounded-md flex items-center justify-center text-xs flex-shrink-0 mt-0.5 gradient-accent"
        style={{ color: "white" }}
      >
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-[14px] text-gray-700 leading-relaxed">{text}</p>
        {tag && (
          <span className="inline-block mt-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
            {tag}
          </span>
        )}
      </div>
    </div>
  )
}
