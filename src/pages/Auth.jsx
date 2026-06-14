import { useState } from "react"
import { auth, googleProvider, db } from "../firebase/config"
import {
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { useNavigate, Link } from "react-router-dom"
import { Zap, ShieldCheck, TrendingUp, Users, Star } from "lucide-react"

const TRUST_POINTS = [
  { icon: <ShieldCheck size={15} />, text: "Your data is encrypted and never sold" },
  { icon: <TrendingUp size={15} />, text: "AI-powered rates built on real market data" },
  { icon: <Users size={15} />,      text: "Built for Indian creators, by creators" },
  { icon: <Star size={15} />,       text: "Works across Instagram, YouTube & more" },
]

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail]     = useState("")
  const [password, setPassword] = useState("")
  const [error, setError]     = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const saveUserToFirestore = async (user) => {
    const ref  = doc(db, "users", user.uid)
    const snap = await getDoc(ref)
    if (!snap.exists()) {
      await setDoc(ref, {
        name: user.displayName || "",
        email: user.email,
        profileComplete: false,
        createdAt: new Date(),
      })
    }
    const updated = await getDoc(ref)
    return updated.data()
  }

  const handleGoogle = async () => {
    setError(""); setLoading(true)
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const data   = await saveUserToFirestore(result.user)
      navigate(data.profileComplete ? "/dashboard" : "/onboarding")
    } catch (err) { setError(err.message) }
    setLoading(false)
  }

  const handleEmailAuth = async () => {
    setError(""); setLoading(true)
    try {
      let result
      if (isLogin) {
        result = await signInWithEmailAndPassword(auth, email, password)
        if (!result.user.emailVerified) { navigate("/verify-email"); return }
        const data = await saveUserToFirestore(result.user)
        navigate(data.profileComplete ? "/dashboard" : "/onboarding")
      } else {
        result = await createUserWithEmailAndPassword(auth, email, password)
        await sendEmailVerification(result.user)
        await saveUserToFirestore(result.user)
        navigate("/verify-email")
      }
    } catch (err) { setError(err.message) }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex font-sans" style={{ background: "#0a0916" }}>

      {/* ── Left panel ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[460px] flex-shrink-0 p-12 relative overflow-hidden"
        style={{ borderRight: "1px solid rgba(255,255,255,0.06)" }}
      >
        {/* Radial glow backdrop */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 30% 40%, rgba(239,44,193,0.12) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(0,242,254,0.08) 0%, transparent 55%)"
          }}
        />

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 no-underline relative z-10">
          <div className="w-7 h-7 rounded-md gradient-accent flex items-center justify-center">
            <Zap size={14} color="white" strokeWidth={2.5} />
          </div>
          <span className="text-white font-semibold text-[15px] tracking-tight">CreatorPulse</span>
        </Link>

        {/* Main copy */}
        <div className="relative z-10 space-y-6">
          <div>
            <p className="eyebrow mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>
              CREATOR INTELLIGENCE PLATFORM
            </p>
            <h2
              className="font-extrabold tracking-tight leading-[1.1] mb-4"
              style={{ fontSize: "36px" }}
            >
              {/* Gradient blended headline — same as landing hero */}
              <span className="text-white">Know your worth.</span>
              <br />
              <span
                style={{
                  background: "linear-gradient(90deg, #00f2fe, #ef2cc1, #fc4c02)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Get paid fairly.
              </span>
              <br />
              <span className="text-white">Grow faster.</span>
            </h2>
            <p className="text-[15px] leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
              Stop guessing what to charge brands. CreatorPulse gives you AI-backed rate cards,
              gap analysis, pitch generation, and growth simulations — all in one place.
            </p>
          </div>

          {/* Trust points */}
          <div className="space-y-3">
            {TRUST_POINTS.map((pt, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}
                >
                  {pt.icon}
                </div>
                <p className="text-[13px]" style={{ color: "rgba(255,255,255,0.5)" }}>{pt.text}</p>
              </div>
            ))}
          </div>

          {/* Community strip */}
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center flex-shrink-0">
              <Users size={15} color="white" />
            </div>
            <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.4)" }}>
              Don't just join us as a user —{" "}
              <span className="text-white font-medium">join us as a family member.</span>
            </p>
          </div>
        </div>

        <p className="text-[12px] relative z-10" style={{ color: "rgba(255,255,255,0.18)" }}>
          © 2026 CreatorPulse · Privacy · Terms
        </p>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[380px]">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-6 h-6 rounded gradient-accent flex items-center justify-center">
              <Zap size={12} color="white" />
            </div>
            <span className="text-white font-semibold text-[15px]">CreatorPulse</span>
          </div>

          <h1 className="text-white font-bold text-[24px] mb-1 tracking-tight">
            {isLogin ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-[14px] mb-8" style={{ color: "rgba(255,255,255,0.35)" }}>
            {isLogin
              ? "Sign in to access your creator dashboard"
              : "We're building this together — welcome to the family."}
          </p>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-lg text-[13px]"
              style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.25)", color: "#fca5a5" }}>
              {error}
            </div>
          )}

          {/* Google */}
          <button
            onClick={handleGoogle} disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg text-[14px] font-medium mb-5 transition-all"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
          >
            <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="" />
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
            <span className="text-[12px]" style={{ color: "rgba(255,255,255,0.25)" }}>or continue with email</span>
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
          </div>

          {/* Inputs */}
          <div className="space-y-3 mb-5">
            <input
              type="email" placeholder="Email address" value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg text-[14px] outline-none transition-all"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "white" }}
              onFocus={(e) => e.target.style.borderColor = "rgba(239,44,193,0.5)"}
              onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.09)"}
            />
            <input
              type="password" placeholder="Password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg text-[14px] outline-none transition-all"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "white" }}
              onFocus={(e) => e.target.style.borderColor = "rgba(239,44,193,0.5)"}
              onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.09)"}
              onKeyDown={(e) => e.key === "Enter" && handleEmailAuth()}
            />
          </div>

          {/* Submit button — conic rotating border */}
          <div className="auth-submit-poda w-full mb-5">
            <div className="auth-submit-glow" />
            <div className="auth-submit-darkBorderBg" />
            <div className="auth-submit-darkBorderBg" />
            <div className="auth-submit-white" />
            <div className="auth-submit-border" />
            <button
              onClick={handleEmailAuth} disabled={loading}
              className="auth-submit-main w-full py-3 text-[14px] font-semibold text-white transition-opacity"
              style={{ opacity: loading ? 0.6 : 1 }}
            >
              {loading ? "Please wait..." : isLogin ? "Sign in" : "Create account"}
            </button>
          </div>

          <p className="text-center text-[13px]" style={{ color: "rgba(255,255,255,0.3)" }}>
            {isLogin ? "No account?" : "Already have an account?"}{" "}
            <button
              onClick={() => { setIsLogin(!isLogin); setError("") }}
              className="font-semibold transition-colors"
              style={{ color: "rgba(255,255,255,0.65)" }}
              onMouseEnter={(e) => e.target.style.color = "white"}
              onMouseLeave={(e) => e.target.style.color = "rgba(255,255,255,0.65)"}
            >
              {isLogin ? "Sign up free" : "Sign in"}
            </button>
          </p>

          <p className="text-center text-[11px] mt-6" style={{ color: "rgba(255,255,255,0.18)" }}>
            By continuing you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>

    </div>
  )
}
