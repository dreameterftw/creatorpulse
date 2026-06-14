import { useState, useEffect } from "react"
import { sendEmailVerification, signOut } from "firebase/auth"
import { auth, db } from "../firebase/config"
import { doc, getDoc } from "firebase/firestore"
import { useNavigate } from "react-router-dom"
import { Zap, Mail, ShieldCheck, Lock, Sparkles } from "lucide-react"

const WHY_POINTS = [
  {
    icon: <ShieldCheck size={14} />,
    title: "Keeps your account secure",
    desc: "Verified emails prevent unauthorized access and make account recovery possible if you ever lose access.",
  },
  {
    icon: <Lock size={14} />,
    title: "Protects your AI usage",
    desc: "Our AI tools run on real infrastructure with real costs. Verification ensures only genuine creators access them.",
  },
  {
    icon: <Sparkles size={14} />,
    title: "Unlocks your full profile",
    desc: "Once verified, your creator profile, rate cards, and pitch history are tied securely to your identity.",
  },
]

export default function VerifyEmail() {
  const navigate = useNavigate()
  const [sending, setSending]   = useState(false)
  const [sent, setSent]         = useState(false)
  const [checking, setChecking] = useState(false)
  const [error, setError]       = useState("")

  useEffect(() => {
    if (!auth.currentUser) { navigate("/auth"); return }
    if (auth.currentUser.emailVerified) handleVerified()
  }, [])

  const handleVerified = async () => {
    const user = auth.currentUser
    const snap = await getDoc(doc(db, "users", user.uid))
    const data = snap.data()
    navigate(data?.profileComplete ? "/dashboard" : "/onboarding")
  }

  const handleResend = async () => {
    setSending(true); setSent(false); setError("")
    try {
      await sendEmailVerification(auth.currentUser)
      setSent(true)
    } catch (err) {
      setError(err.code === "auth/too-many-requests"
        ? "Too many requests. Wait a few minutes before trying again."
        : err.message)
    }
    setSending(false)
  }

  const handleCheckAgain = async () => {
    setChecking(true); setError("")
    try {
      await auth.currentUser.reload()
      if (auth.currentUser.emailVerified) {
        await handleVerified()
      } else {
        setError("Not verified yet — check your inbox and spam folder.")
      }
    } catch (err) { setError(err.message) }
    setChecking(false)
  }

  return (
    <div
      className="min-h-screen flex font-sans"
      style={{ background: "#0a0916" }}
    >
      {/* ── Left panel — why we verify ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 p-12 relative overflow-hidden"
        style={{ borderRight: "1px solid rgba(255,255,255,0.06)" }}
      >
        {/* Glow backdrop */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 20% 50%, rgba(0,242,254,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(239,44,193,0.07) 0%, transparent 55%)" }} />

        {/* Logo */}
        <div className="flex items-center gap-2 relative z-10">
          <div className="w-7 h-7 rounded-md gradient-accent flex items-center justify-center">
            <Zap size={14} color="white" strokeWidth={2.5} />
          </div>
          <span className="text-white font-semibold text-[15px] tracking-tight">CreatorPulse</span>
        </div>

        {/* Content */}
        <div className="relative z-10 space-y-8">
          <div>
            <p className="eyebrow mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>
              ONE LAST STEP
            </p>
            <h2 className="text-white font-bold text-[28px] tracking-tight leading-snug mb-3">
              Why we verify<br />
              <span style={{
                background: "linear-gradient(90deg, #00f2fe, #ef2cc1)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                your email.
              </span>
            </h2>
            <p className="text-[14px] leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
              We take security seriously — not just to protect our platform,
              but to protect <span className="text-white">you</span> and your creator data.
            </p>
          </div>

          <div className="space-y-5">
            {WHY_POINTS.map((pt, i) => (
              <div key={i} className="flex items-start gap-3">
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}
                >
                  {pt.icon}
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-white mb-0.5">{pt.title}</p>
                  <p className="text-[12px] leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>
                    {pt.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div
            className="px-4 py-3 rounded-xl text-[12px] leading-relaxed"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.35)" }}
          >
            💡 This is a one-time step. Once verified, you'll never need to do it again.
          </div>
        </div>

        <p className="text-[12px] relative z-10" style={{ color: "rgba(255,255,255,0.18)" }}>
          © 2026 CreatorPulse
        </p>
      </div>

      {/* ── Right panel — actions ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[380px] text-center">

          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-2 mb-10 lg:hidden">
            <div className="w-7 h-7 rounded-md gradient-accent flex items-center justify-center">
              <Zap size={14} color="white" strokeWidth={2.5} />
            </div>
            <span className="text-white font-semibold text-[15px]">CreatorPulse</span>
          </div>

          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl gradient-accent flex items-center justify-center mx-auto mb-6">
            <Mail size={28} color="white" />
          </div>

          <h1 className="text-white font-bold text-[24px] mb-2 tracking-tight">
            Check your inbox
          </h1>
          <p className="text-[14px] leading-relaxed mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>
            We sent a verification link to
          </p>
          <p className="text-[14px] font-semibold text-white mb-6">
            {auth.currentUser?.email}
          </p>
          <p className="text-[13px] leading-relaxed mb-8 px-4" style={{ color: "rgba(255,255,255,0.3)" }}>
            Click the link in the email, then come back here and hit Continue.
            Check your spam folder if you don't see it within a minute.
          </p>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-lg text-[13px] text-left"
              style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.25)", color: "#fca5a5" }}>
              {error}
            </div>
          )}

          {sent && (
            <div className="mb-5 px-4 py-3 rounded-lg text-[13px]"
              style={{ background: "rgba(22,163,74,0.1)", border: "1px solid rgba(22,163,74,0.25)", color: "#86efac" }}>
              ✓ Verification email sent — check your inbox
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleCheckAgain} disabled={checking}
              className="w-full py-3 rounded-lg text-[14px] font-semibold transition-opacity"
              style={{ background: "white", color: "#0a0916", opacity: checking ? 0.6 : 1 }}
            >
              {checking ? "Checking..." : "I've verified — Continue"}
            </button>

            <button
              onClick={handleResend} disabled={sending}
              className="w-full py-3 rounded-lg text-[14px] font-medium transition-all"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.65)",
                opacity: sending ? 0.6 : 1,
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.09)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
            >
              {sending ? "Sending..." : "Resend verification email"}
            </button>

            <button
              onClick={() => { signOut(auth); navigate("/auth") }}
              className="text-[13px] transition-colors block mx-auto mt-2"
              style={{ color: "rgba(255,255,255,0.25)" }}
              onMouseEnter={(e) => e.target.style.color = "rgba(255,255,255,0.5)"}
              onMouseLeave={(e) => e.target.style.color = "rgba(255,255,255,0.25)"}
            >
              Back to login
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
