/**
 * Shimmer loading skeleton.
 * Usage: <LoadingSkeleton lines={3} /> or <LoadingSkeleton className="h-40" />
 */
export default function LoadingSkeleton({ lines = 1, className = "" }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-md bg-gray-100"
          style={{ height: "16px", width: i === lines - 1 && lines > 1 ? "60%" : "100%" }}
        />
      ))}
    </div>
  )
}

/**
 * Full card skeleton — replaces a card while loading.
 */
export function CardSkeleton({ height = "120px" }) {
  return (
    <div
      className="card animate-pulse"
      style={{ height, background: "linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)", backgroundSize: "200% 100%" }}
    />
  )
}
