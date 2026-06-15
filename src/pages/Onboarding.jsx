import { useState, useEffect } from "react"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "../firebase/config"
import { useAuth } from "../context/AuthContext"
import { useNavigate } from "react-router-dom"
import { Zap, ArrowRight, Check } from "lucide-react"

// ─── Constants ───────────────────────────────────────────────
const STEPS = [
  { id: "basic",   title: "Start with the basics",  sub: "Platform, niche, and your name" },
  { id: "metrics", title: "Your numbers",            sub: "Followers, engagement, and frequency" },
  { id: "money",   title: "Current earnings",        sub: "Income streams and monthly revenue" },
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

// ─── Pill selector ────────────────────────────────────────────
function PillGroup({ options, value, onChange, multi = false }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const val    = typeof opt === "string" ? opt : opt.value
        const label  = typeof opt === "string" ? opt : opt.label
        const active = multi ? value?.includes(val) : value === val
        return (
          <button
            key={val}
            type="button"
            onClick={() => {
              if (multi) {
                onChange(active ? value.filter((v) => v !== val) : [...(value || []), val])
              } else {
                onChange(val)
              }
            }}
            className="text-[13px] px-4 py-2 rounded-full font-medium transition-all duration-200"
            style={
              active
                ? {
                    background: "linear-gradient(135deg, rgba(0,242,254,0.12), rgba(239,44,193,0.12))",
                    border: "1px solid rgba(239,44,193,0.5)",
                    color: "white",
                    boxShadow: "0 0 10px rgba(239,44,193,0.1)",
                  }
                : {
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#8a89a0",
                  }
            }
            onMouseEnter={(e) => {
              if (!active) e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"
            }}
            onMouseLeave={(e) => {
              if (!active) e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"
            }}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

// ─── Field wrapper ────────────────────────────────────────────
function Field({ label, children, hint }) {
  return (
    <div>
      <label className="block mb-2 text-[11px] font-mono font-semibold tracking-widest uppercase text-[#8a89a0]">
        {label}
      </label>
      {children}
      {hint && (
        <p className="text-[12px] mt-1.5 font-mono text-[#8a89a0]/50">{hint}</p>
      )}
    </div>
  )
}

// ─── Text input ───────────────────────────────────────────────
function TextInput({ type = "text", value, onChange, placeholder }) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className="w-full px-4 py-3 rounded-lg text-[14px] outline-none text-white placeholder-[#8a89a0]/40 transition-all duration-300"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: `1px solid ${focused ? "rgba(239,44,193,0.5)" : "rgba(255,255,255,0.08)"}`,
        boxShadow: focused ? "0 0 0 3px rgba(239,44,193,0.07)" : "none",
      }}
    />
  )
}

// ─── Sidebar preview card ─────────────────────────────────────
function ProfilePreview({ form, step }) {
  if (!form.name && !form.platform && !form.niche) return null
  return (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <p className="text-[10px] font-mono tracking-widest uppercase text-[#8a89a0]/50">Your Profile</p>
      {form.name && (
        <div>
          <p className="text-white text-[13px] font-semibold font-display">{form.name}</p>
          <div className="flex gap-1.5 mt-1 flex-wrap">
            {form.platform && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                style={{ background: "rgba(239,44,193,0.12)", color: "#ef2cc1", border: "1px solid rgba(239,44,193,0.2)" }}>
                {form.platform}
              </span>
            )}
            {form.niche && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                style={{ background: "rgba(0,242,254,0.08)", color: "#00f2fe", border: "1px solid rgba(0,242,254,0.15)" }}>
                {form.niche}
              </span>
            )}
          </div>
        </div>
      )}
      {step >= 1 && form.followers && (
        <div className="flex justify-between items-center pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <span className="text-[10px] font-mono text-[#8a89a0]/50">Followers</span>
          <span className="text-[12px] font-mono font-semibold text-white">
            {Number(form.followers).toLocaleString()}
          </span>
        </div>
      )}
      {step >= 2 && form.monthlyIncome && (
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-mono text-[#8a89a0]/50">Monthly Income</span>
          <span className="text-[12px] font-mono font-semibold text-green-400">
            ₹{Number(form.monthlyIncome).toLocaleString()}
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────
export default function Onboarding() {
  const { user }   = useAuth()
  const navigate   = useNavigate()
  const [step, setStep]         = useState(0)
  const [loading, setLoading]   = useState(false)
  const [animating, setAnimating] = useState(false)
  const [direction, setDirection] = useState(1) // 1 = forward, -1 = back
  const [visible, setVisible]   = useState(true)

  const [form, setForm] = useState({
    name: "", platform: "", niche: "", followers: "", engagementRate: "",
    contentFrequency: "", incomeStreams: [], monthlyIncome: "", audienceLocation: "",
  })

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }))

  // Animated step transition
  const goToStep = (next) => {
    if (animating) return
    setDirection(next > step ? 1 : -1)
    setAnimating(true)
    setVisible(false)
    setTimeout(() => {
      setStep(next)
      setVisible(true)
      setAnimating(false)
    }, 220)
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const followers      = Math.min(Math.max(Number(form.followers) || 0, 0), 1_000_000_000)
      const engagementRate = Math.min(Math.max(parseFloat(form.engagementRate) || 0, 0), 100)
      const monthlyIncome  = Math.min(Math.max(Number(form.monthlyIncome) || 0, 0), 100_000_000)
      await updateDoc(doc(db, "users", user.uid), {
        ...form, followers, engagementRate, monthlyIncome,
        profileComplete: true, updatedAt: new Date(),
      })
      navigate("/dashboard")
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  return (
    <div
      className="min-h-screen flex font-sans"
      style={{ background: "#0a0916" }}
    >

      {/* ── Left sidebar ───────────────────────────────────── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[300px] flex-shrink-0 p-10 relative overflow-hidden"
        style={{ borderRight: "1px solid rgba(255,255,255,0.05)" }}
      >
        {/* Ambient glow blobs */}
        <div className="absolute w-64 h-64 rounded-full blur-3xl -z-0 top-[30%] left-[-20%] pointer-events-none"
          style={{ background: "rgba(239,44,193,0.07)" }} />
        <div className="absolute w-48 h-48 rounded-full blur-3xl -z-0 bottom-[20%] right-[-10%] pointer-events-none"
          style={{ background: "rgba(0,242,254,0.05)" }} />

        {/* Pulsing dots */}
        <div className="absolute top-[18%] right-[12%] w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ background: "#ef2cc1", boxShadow: "0 0 6px rgba(239,44,193,0.5)", animationDelay: "0s" }} />
        <div className="absolute top-[55%] left-[8%] w-1 h-1 rounded-full animate-pulse"
          style={{ background: "#00f2fe", boxShadow: "0 0 5px rgba(0,242,254,0.4)", animationDelay: "1.2s" }} />
        <div className="absolute bottom-[25%] right-[20%] w-2 h-2 rounded-full animate-pulse"
          style={{ background: "rgba(252,76,2,0.6)", boxShadow: "0 0 8px rgba(252,76,2,0.3)", animationDelay: "2.4s" }} />

        {/* Logo */}
        <div className="flex items-center gap-2.5 relative z-10">
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white"
            style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.1)" }}>
            CP
          </div>
          <span className="text-white font-display font-bold text-lg tracking-tight">CreatorPulse</span>
        </div>

        {/* Step list */}
        <div className="space-y-6 relative z-10">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-start gap-3.5">
              {/* Indicator */}
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-display font-extrabold flex-shrink-0 mt-0.5 transition-all duration-300"
                style={
                  i < step
                    ? { background: "#16a34a", color: "white" }
                    : i === step
                    ? { background: "linear-gradient(135deg, #00f2fe, #ef2cc1)", color: "#0a0916", boxShadow: "0 0 12px rgba(239,44,193,0.3)" }
                    : { border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.2)" }
                }
              >
                {i < step ? <Check size={12} strokeWidth={3} /> : i + 1}
              </div>
              <div>
                <p
                  className="text-[14px] font-semibold transition-colors duration-300"
                  style={{ color: i === step ? "white" : i < step ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.25)" }}
                >
                  {s.title}
                </p>
                <p className="text-[12px] font-mono mt-0.5" style={{ color: "rgba(255,255,255,0.18)" }}>
                  {s.sub}
                </p>
              </div>
            </div>
          ))}

          {/* Connector lines between steps */}
          <style>{`
            .step-list > div:not(:last-child) .step-connector { display: block; }
          `}</style>
        </div>

        {/* Live preview card */}
        <div className="relative z-10 space-y-3">
          <ProfilePreview form={form} step={step} />
          <p className="text-[11px] font-mono" style={{ color: "rgba(255,255,255,0.15)" }}>
            © 2026 CreatorPulse
          </p>
        </div>
      </div>

      {/* ── Right: form panel ──────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-16 relative overflow-hidden">

        {/* Subtle ambient glow for form side */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(239,44,193,0.06) 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(0,242,254,0.04) 0%, transparent 70%)" }} />

        <div className="w-full max-w-[500px] relative z-10">

          {/* Mobile progress bar */}
          <div className="flex gap-1.5 mb-10 lg:hidden">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className="h-1 flex-1 rounded-full transition-all duration-500"
                style={{
                  background:
                    i < step
                      ? "#16a34a"
                      : i === step
                      ? "linear-gradient(90deg, #00f2fe, #ef2cc1)"
                      : "rgba(255,255,255,0.08)",
                }}
              />
            ))}
          </div>

          {/* Step header */}
          <div
            className="mb-8 transition-all duration-300"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible
                ? "translateY(0px)"
                : `translateY(${direction > 0 ? 12 : -12}px)`,
            }}
          >
            <span className="text-[11px] font-mono font-semibold tracking-widest uppercase text-[#8a89a0]">
              STEP {step + 1} OF {STEPS.length}
            </span>
            <h2 className="text-white font-display font-extrabold tracking-tight text-[28px] mt-2 mb-1">
              {STEPS[step].title}
            </h2>
            <p className="text-[14px] text-[#8a89a0]">
              {STEPS[step].sub}
            </p>
          </div>

          {/* Form body — animated on step change */}
          <div
            className="transition-all duration-300"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible
                ? "translateY(0px)"
                : `translateY(${direction > 0 ? 16 : -16}px)`,
            }}
          >

            {/* ── Step 0: Basics ── */}
            {step === 0 && (
              <div className="space-y-6">
                <Field label="Your Name">
                  <TextInput
                    value={form.name}
                    onChange={(v) => update("name", v)}
                    placeholder="e.g. Aryan Sharma"
                  />
                </Field>
                <Field label="Primary Platform">
                  <PillGroup
                    options={PLATFORMS}
                    value={form.platform}
                    onChange={(v) => update("platform", v)}
                  />
                </Field>
                <Field label="Your Niche">
                  <PillGroup
                    options={NICHES}
                    value={form.niche}
                    onChange={(v) => update("niche", v)}
                  />
                </Field>
              </div>
            )}

            {/* ── Step 1: Numbers ── */}
            {step === 1 && (
              <div className="space-y-6">
                <Field label="Follower Count">
                  <TextInput
                    type="number"
                    value={form.followers}
                    onChange={(v) => update("followers", v)}
                    placeholder="e.g. 45000"
                  />
                </Field>
                <Field
                  label="Engagement Rate (%)"
                  hint="(Total likes + comments) ÷ followers × 100"
                >
                  <TextInput
                    type="number"
                    value={form.engagementRate}
                    onChange={(v) => update("engagementRate", v)}
                    placeholder="e.g. 6.2"
                  />
                </Field>
                <Field label="Posting Frequency">
                  <PillGroup
                    options={FREQUENCIES}
                    value={form.contentFrequency}
                    onChange={(v) => update("contentFrequency", v)}
                  />
                </Field>
              </div>
            )}

            {/* ── Step 2: Earnings ── */}
            {step === 2 && (
              <div className="space-y-6">
                <Field label="Current Income Streams">
                  <PillGroup
                    options={INCOME_STREAM_OPTIONS}
                    value={form.incomeStreams}
                    onChange={(v) => update("incomeStreams", v)}
                    multi
                  />
                </Field>
                <Field label="Monthly Income from Content (₹)">
                  <TextInput
                    type="number"
                    value={form.monthlyIncome}
                    onChange={(v) => update("monthlyIncome", v)}
                    placeholder="e.g. 15000"
                  />
                </Field>
                <Field label="Audience Location">
                  <PillGroup
                    options={LOCATIONS}
                    value={form.audienceLocation}
                    onChange={(v) => update("audienceLocation", v)}
                  />
                </Field>
              </div>
            )}
          </div>

          {/* ── Navigation ── */}
          <div
            className="flex justify-between items-center mt-10 pt-8 transition-all duration-300"
            style={{
              borderTop: "1px solid rgba(255,255,255,0.05)",
              opacity: visible ? 1 : 0,
            }}
          >
            <button
              onClick={() => goToStep(step - 1)}
              disabled={step === 0}
              className="px-5 py-2.5 rounded-lg text-[14px] font-medium transition-all duration-200"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: step === 0 ? "rgba(255,255,255,0.15)" : "#8a89a0",
                cursor: step === 0 ? "not-allowed" : "pointer",
              }}
              onMouseEnter={(e) => {
                if (step !== 0) e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"
              }}
            >
              Back
            </button>

            {step < STEPS.length - 1 ? (
              <button
                onClick={() => goToStep(step + 1)}
                className="cta-glow-button h-11 min-w-[160px] text-[13px] font-semibold"
              >
                <span className="flex items-center gap-2">
                  Continue <ArrowRight size={14} />
                </span>
                <div className="hoverEffect" aria-hidden="true"><div /></div>
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="cta-glow-button h-11 min-w-[180px] text-[13px] font-semibold"
                style={{ opacity: loading ? 0.65 : 1 }}
              >
                <span className="flex items-center gap-2">
                  {loading ? "Saving…" : <><Zap size={14} /> Launch Dashboard</>}
                </span>
                <div className="hoverEffect" aria-hidden="true"><div /></div>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}