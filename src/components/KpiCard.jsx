/**
 * KPI card — large number with label and optional delta.
 * delta: { value: "+22%", positive: true }
 */
export default function KpiCard({ label, value, delta, icon, accent }) {
  return (
    <div className="card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="eyebrow">{label}</p>
        {icon && (
          <div
            className="w-8 h-8 rounded-md flex items-center justify-center text-base"
            style={{ background: "var(--color-bg)" }}
          >
            {icon}
          </div>
        )}
      </div>
      <div>
        {accent ? (
          <p className="kpi-number gradient-text">{value}</p>
        ) : (
          <p className="kpi-number">{value}</p>
        )}
        {delta && (
          <p
            className="text-[13px] mt-1 font-medium"
            style={{ color: delta.positive ? "#16a34a" : "#dc2626" }}
          >
            {delta.positive ? "↑" : "↓"} {delta.value}
          </p>
        )}
      </div>
    </div>
  )
}
