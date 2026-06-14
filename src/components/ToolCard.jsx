import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"

/**
 * Tool card used on the dashboard quick-actions grid.
 */
export default function ToolCard({ to, icon, title, description, badge }) {
  return (
    <Link
      to={to}
      className="card p-5 flex flex-col gap-3 hover:shadow-md transition-shadow duration-200 group"
    >
      <div className="flex items-start justify-between">
        <div className="text-2xl leading-none">{icon}</div>
        {badge && (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
            {badge}
          </span>
        )}
      </div>
      <div>
        <p className="text-[15px] font-semibold text-gray-900 mb-0.5">{title}</p>
        <p className="text-[13px] leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          {description}
        </p>
      </div>
      <div className="flex items-center gap-1 text-[13px] font-medium text-gray-400 group-hover:text-gray-700 transition-colors mt-auto">
        Open <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
      </div>
    </Link>
  )
}
