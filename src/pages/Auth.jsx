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
import { Zap } from "lucide-react"

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const saveUserToFirestore = async (user) => {
    const ref = doc(db, "users", user.uid)
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
    setError("")
    setLoading(true)
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const data = await saveUserToFirestore(result.user)
      navigate(data.profileComplete ? "/dashboard" : "/onboarding")
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  const handleEmailAuth = async () => {
    setError("")
    setLoading(true)
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
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex" style={{ background: "var(--color-dark)" }}>
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 p-10"
        style={{ borderRight: "1px solid rgba(255,255,255,0.06)" }}>
        <Link to="/" className="flex items-center gap-2 no-underline">
          <div className="w-7 h-7 rounded-md gradient-accent flex items-center justify-center">
            <Zap size={14} color="white" strokeWidth={2.5} />
          </div>
          <span className="text-white font-semibold text-[15px]">CreatorPulse</span>
        </Link>
        <div>
          <h2 className="text-white font-semibold mb-3"
            style={{ fontSize: "28px", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
            Creator intelligence,<br />all in one place.
          </h2>
          <p className="text-[15px] leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
            Rate cards, gap analysis, pitch generation, brand fit scoring — powered by AI.
          </p>
        </div>
        <p className="text-[13px]" style={{ color: "rgba(255,255,255,0.2)" }}>
          © 2026 CreatorPulse
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[360px]">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-6 h-6 rounded gradient-accent flex items-center justify-center">
              <Zap size={12} color="white" />
            </div>
            <span className="text-white font-semibold text-[15px]">CreatorPulse</span>
          </div>

          <h1 className="text-white font-semibold text-[22px] mb-1 tracking-tight">
            {isLogin ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-[14px] mb-8" style={{ color: "rgba(255,255,255,0.4)" }}>
            {isLogin ? "Sign in to your account" : "Get started for free"}
          </p>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-md text-[13px]"
              style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.2)", color: "#fca5a5" }}>
              {error}
            </div>
          )}

          {/* Google */}
          <button onClick={handleGoogle} disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-md text-[14px] font-medium mb-4 transition-colors"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
          >
            <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="" />
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
            <span className="text-[12px]" style={{ color: "rgba(255,255,255,0.3)" }}>or</span>
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
          </div>

          {/* Email / Password */}
          <div className="space-y-3 mb-4">
            <input type="email" placeholder="Email address" value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-md text-[14px] outline-none transition-colors"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
              onFocus={(e) => e.target.style.borderColor = "rgba(255,255,255,0.3)"}
              onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
            />
            <input type="password" placeholder="Password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-md text-[14px] outline-none transition-colors"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
              onFocus={(e) => e.target.style.borderColor = "rgba(255,255,255,0.3)"}
              onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
              onKeyDown={(e) => e.key === "Enter" && handleEmailAuth()}
            />
          </div>

          <button onClick={handleEmailAuth} disabled={loading}
            className="w-full py-2.5 rounded-md text-[14px] font-semibold transition-opacity"
            style={{ background: "white", color: "var(--color-dark)", opacity: loading ? 0.6 : 1 }}>
            {loading ? "Please wait..." : isLogin ? "Sign in" : "Create account"}
          </button>

          <p className="text-center text-[13px] mt-5" style={{ color: "rgba(255,255,255,0.35)" }}>
            {isLogin ? "No account?" : "Already have an account?"}{" "}
            <button onClick={() => { setIsLogin(!isLogin); setError("") }}
              className="font-medium transition-colors"
              style={{ color: "rgba(255,255,255,0.7)" }}
              onMouseEnter={(e) => e.target.style.color = "white"}
              onMouseLeave={(e) => e.target.style.color = "rgba(255,255,255,0.7)"}>
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
