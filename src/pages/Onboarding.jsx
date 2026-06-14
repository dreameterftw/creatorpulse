import { useState } from "react"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "../firebase/config"
import { useAuth } from "../context/AuthContext"
import { useNavigate } from "react-router-dom"
import { Zap } from "lucide-react"

const STEPS = [
  { id: "basic",   title: "Start with the basics",    sub: "Platform, niche, and your name" },
  { id: "metrics", title: "Your numbers",              sub: "Followers, engagement, and frequency" },
  { id: "money",   title: "Current earnings",          sub: "Income streams and monthly revenue" },
]

const PLATFORMS   = ["Instagram", "YouTube", "LinkedIn", "Twitter/X", "TikTok"]
const NICHES      = ["Fitness", "Tech", "Finance", "Fashion", "Food", "Travel", "Education", "Gaming", "Lifestyle", "Beauty"]
const FREQUENCIES = ["Daily", "3-4x per week", "1-2x per week", "A few times a month"]
const LOCATIONS   = ["India", "USA", "UK", "UAE", "Global Mix"]
const INCOME_STREAM_OPTIONS = [
  { value: "brand_deals",      label: "Brand Deals" },
  { value: "affiliate",        label: "Affiliate" },
  { value: "adsense",          label: "AdSense / Ads" },
  { value: "digital_products", label: "Digital Products" },
  { value: "memberships",      label: "Memberships" },
  { value: "ugc",              label: "UGC" },
  { value: "none",             label: "None yet" },
]

function PillGroup({ options, value, onChange, multi = false }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const val = typeof opt === "string" ? opt : opt.value
        const label = typeof opt === "string" ? opt : opt.label
        const active = multi ? value?.includes(val) : value === val
        return (
          <button key={val} type="button"
            onClick={() => {
              if (multi) {
                onChange(active ? value.filter((v) => v !== val) : [...(value || []), val])
              } else { onChange(val) }
            }}
            className={`pill text-[13px] transition-colors ${active ? "pill-active" : ""}`}>
            {label}
          </button>
        )
      })}
    </div>
  )
}

export default function Onboarding() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep]   = useState(0)
  const [loading, setLoading] = useState(false)
  const [form, setForm]   = useState({
    name: "", platform: "", niche: "", followers: "", engagementRate: "",
    contentFrequency: "", incomeStreams: [], monthlyIncome: "", audienceLocation: "",
  })

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }))

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const followers      = Math.min(Math.max(Number(form.followers) || 0, 0), 1000000000)
      const engagementRate = Math.min(Math.max(parseFloat(form.engagementRate) || 0, 0), 100)
      const monthlyIncome  = Math.min(Math.max(Number(form.monthlyIncome) || 0, 0), 100000000)
      await updateDoc(doc(db, "users", user.uid), {
        ...form, followers, engagementRate, monthlyIncome, profileComplete: true, updatedAt: new Date(),
      })
      navigate("/dashboard")
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex" style={{ background: "var(--color-dark)" }}>
      {/* Left */}
      <div className="hidden lg:flex flex-col justify-between w-[320px] flex-shrink-0 p-10"
        style={{ borderRight: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md gradient-accent flex items-center justify-center">
            <Zap size={14} color="white" strokeWidth={2.5} />
          </div>
          <span className="text-white font-semibold text-[15px]">CreatorPulse</span>
        </div>
        <div className="space-y-4">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-start gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0 mt-0.5 ${
                i < step ? "bg-green-500 text-white" : i === step ? "gradient-accent text-white" : ""
              }`} style={i > step ? { border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.3)" } : {}}>
                {i < step ? "✓" : i + 1}
              </div>
              <div>
                <p className={`text-[14px] font-medium ${i === step ? "text-white" : "text-white/40"}`}>{s.title}</p>
                <p className="text-[12px] text-white/25">{s.sub}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[13px] text-white/20">© 2026 CreatorPulse</p>
      </div>

      {/* Right */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[480px]">
          {/* Mobile progress */}
          <div className="flex gap-1.5 mb-8 lg:hidden">
            {STEPS.map((_, i) => (
              <div key={i} className="h-1 flex-1 rounded-full transition-all"
                style={{ background: i <= step ? "white" : "rgba(255,255,255,0.15)" }} />
            ))}
          </div>

          <p className="eyebrow mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>
            STEP {step + 1} OF {STEPS.length}
          </p>
          <h2 className="text-white font-semibold text-[24px] mb-1 tracking-tight">{STEPS[step].title}</h2>
          <p className="text-[14px] mb-8" style={{ color: "rgba(255,255,255,0.4)" }}>{STEPS[step].sub}</p>

          {/* Step 0 */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <label className="eyebrow block mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>YOUR NAME</label>
                <input value={form.name} onChange={(e) => update("name", e.target.value)}
                  placeholder="e.g. Aryan Sharma"
                  className="w-full px-3.5 py-2.5 rounded-md text-[14px] outline-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
                  onFocus={(e) => e.target.style.borderColor = "rgba(255,255,255,0.3)"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                />
              </div>
              <div>
                <label className="eyebrow block mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>PRIMARY PLATFORM</label>
                <PillGroup options={PLATFORMS} value={form.platform} onChange={(v) => update("platform", v)} />
              </div>
              <div>
                <label className="eyebrow block mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>YOUR NICHE</label>
                <PillGroup options={NICHES} value={form.niche} onChange={(v) => update("niche", v)} />
              </div>
            </div>
          )}

          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="eyebrow block mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>FOLLOWER COUNT</label>
                <input type="number" value={form.followers} onChange={(e) => update("followers", e.target.value)}
                  placeholder="e.g. 45000"
                  className="w-full px-3.5 py-2.5 rounded-md text-[14px] outline-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
                  onFocus={(e) => e.target.style.borderColor = "rgba(255,255,255,0.3)"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                />
              </div>
              <div>
                <label className="eyebrow block mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>ENGAGEMENT RATE (%)</label>
                <input type="number" value={form.engagementRate} onChange={(e) => update("engagementRate", e.target.value)}
                  placeholder="e.g. 6.2"
                  className="w-full px-3.5 py-2.5 rounded-md text-[14px] outline-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
                  onFocus={(e) => e.target.style.borderColor = "rgba(255,255,255,0.3)"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                />
                <p className="text-[12px] mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                  (likes + comments) ÷ followers × 100
                </p>
              </div>
              <div>
                <label className="eyebrow block mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>POSTING FREQUENCY</label>
                <PillGroup options={FREQUENCIES} value={form.contentFrequency} onChange={(v) => update("contentFrequency", v)} />
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="eyebrow block mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>CURRENT INCOME STREAMS</label>
                <PillGroup options={INCOME_STREAM_OPTIONS} value={form.incomeStreams} onChange={(v) => update("incomeStreams", v)} multi />
              </div>
              <div>
                <label className="eyebrow block mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>MONTHLY INCOME FROM CONTENT (₹)</label>
                <input type="number" value={form.monthlyIncome} onChange={(e) => update("monthlyIncome", e.target.value)}
                  placeholder="e.g. 15000"
                  className="w-full px-3.5 py-2.5 rounded-md text-[14px] outline-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
                  onFocus={(e) => e.target.style.borderColor = "rgba(255,255,255,0.3)"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                />
              </div>
              <div>
                <label className="eyebrow block mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>AUDIENCE LOCATION</label>
                <PillGroup options={LOCATIONS} value={form.audienceLocation} onChange={(v) => update("audienceLocation", v)} />
              </div>
            </div>
          )}

          {/* Nav */}
          <div className="flex justify-between mt-8">
            <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}
              className="btn-secondary text-[14px] px-5"
              style={{ borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.5)", background: "transparent", opacity: step === 0 ? 0.3 : 1 }}>
              Back
            </button>
            {step < STEPS.length - 1 ? (
              <button onClick={() => setStep((s) => s + 1)}
                className="btn-primary text-[14px] px-6"
                style={{ background: "white", color: "var(--color-dark)" }}>
                Continue →
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading}
                className="btn-primary text-[14px] px-6"
                style={{ background: "white", color: "var(--color-dark)", opacity: loading ? 0.6 : 1 }}>
                {loading ? "Saving..." : "Launch Dashboard ⚡"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
