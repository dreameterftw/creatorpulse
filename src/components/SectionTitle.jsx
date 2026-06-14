export default function SectionTitle({ children, className = "" }) {
  return (
    <h2 className={`text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-4 ${className}`}>
      {children}
    </h2>
  )
}
