import { useState, useEffect } from "react"
import { sendEmailVerification, signOut } from "firebase/auth"
import { auth, db } from "../firebase/config"
import { doc, getDoc } from "firebase/firestore"
import { useNavigate } from "react-router-dom"
import { Mail, Zap } from "lucide-react"

export default function VerifyEmail() {
  const navigate = useNavigate()
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState("")

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
        ? "Too many requests. Wait a few minutes."
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
    <div className="min-h-screen flex items-center justify-center px-6"
      style={{ background: "var(--color-dark)" }}>
      <div className="w-full max-w-[380px] text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <div className="w-7 h-7 rounded-md gradient-accent flex items-center justify-center">
            <Zap size={14} color="white" strokeWidth={2.5} />
          </div>
          <span className="text-white font-semibold text-[15px]">CreatorPulse</span>
        </div>

        {/* Icon */}
        <div className="w-14 h-14 rounded-2xl gradient-accent flex items-center justify-center mx-auto mb-6">
          <Mail size={24} color="white" />
        </div>

        <h1 className="text-white font-semibold text-[22px] mb-2 tracking-tight">
          Check your inbox
        </h1>
        <p className="text-[14px] leading-relaxed mb-8"
          style={{ color: "rgba(255,255,255,0.45)" }}>
          We sent a verification link to{" "}
          <span className="text-white font-medium">{auth.currentUser?.email}</span>.
          Click the link, then continue.
        </p>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-md text-[13px] text-left"
            style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.2)", color: "#fca5a5" }}>
            {error}
          </div>
        )}
        {sent && (
          <div className="mb-4 px-4 py-3 rounded-md text-[13px]"
            style={{ background: "rgba(22,163,74,0.1)", border: "1px solid rgba(22,163,74,0.2)", color: "#86efac" }}>
            ✓ Verification email sent
          </div>
        )}

        <div className="space-y-3">
          <button onClick={handleCheckAgain} disabled={checking}
            className="w-full py-2.5 rounded-md text-[14px] font-semibold transition-opacity"
            style={{ background: "white", color: "var(--color-dark)", opacity: checking ? 0.6 : 1 }}>
            {checking ? "Checking..." : "I've verified — Continue"}
          </button>
          <button onClick={handleResend} disabled={sending}
            className="w-full py-2.5 rounded-md text-[14px] font-medium transition-colors"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", opacity: sending ? 0.6 : 1 }}>
            {sending ? "Sending..." : "Resend email"}
          </button>
          <button onClick={() => { signOut(auth); navigate("/auth") }}
            className="text-[13px] transition-colors"
            style={{ color: "rgba(255,255,255,0.3)" }}
            onMouseEnter={(e) => e.target.style.color = "rgba(255,255,255,0.6)"}
            onMouseLeave={(e) => e.target.style.color = "rgba(255,255,255,0.3)"}>
            Back to login
          </button>
        </div>
      </div>
    </div>
  )
}
