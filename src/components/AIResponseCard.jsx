import { Sparkles } from "lucide-react"

/**
 * Wrapper for AI-generated content blocks.
 * Adds a subtle "AI" badge and consistent styling.
 */
export default function AIResponseCard({ title, children, className = "" }) {
  return (
    <div className={`card p-6 ${className}`}>
      {title && (
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 rounded gradient-accent flex items-center justify-center">
            <Sparkles size={11} color="white" strokeWidth={2} />
          </div>
          <h3 className="text-[15px] font-semibold text-gray-900">{title}</h3>
        </div>
      )}
      {children}
    </div>
  )
}
