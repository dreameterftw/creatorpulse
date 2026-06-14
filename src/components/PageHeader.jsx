/**
 * Consistent page header used across all tool pages.
 * eyebrow: "AI TOOL" label (JetBrains Mono)
 * title: main heading
 * description: subtitle
 * action: optional right-side element (button, badge, etc.)
 */
export default function PageHeader({ eyebrow, title, description, action, children }) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="text-[28px] font-semibold tracking-tight text-gray-900 mb-1">{title}</h1>
        {description && (
          <p className="text-[15px]" style={{ color: "var(--color-text-secondary)" }}>
            {description}
          </p>
        )}
        {children}
      </div>
      {action && <div className="flex-shrink-0 ml-6 mt-1">{action}</div>}
    </div>
  )
}
