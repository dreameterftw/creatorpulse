/**
 * Empty state — shown when a tool hasn't been run yet.
 */
export default function EmptyState({ icon = "✦", title, description, action }) {
  return (
    <div className="card flex flex-col items-center justify-center text-center py-16 px-8">
      <div className="text-3xl mb-4 opacity-30">{icon}</div>
      <h3 className="text-[16px] font-semibold text-gray-800 mb-2">{title}</h3>
      {description && (
        <p className="text-[14px] max-w-sm" style={{ color: "var(--color-text-secondary)" }}>
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
