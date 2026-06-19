import { useState, useEffect, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { Zap, Search, Bell, User, TrendingUp, Sparkles, Target, DollarSign } from "lucide-react"

const NOTIFICATIONS = [
  { icon: <TrendingUp size={13} />, color: "#00f2fe", title: "Rate Calculator ready", body: "Your AI rate card is calculated and ready to view.", time: "Just now" },
  { icon: <Sparkles size={13} />,   color: "#ef2cc1", title: "Try What-If Simulator", body: "See how 10K more followers would change your earnings.", time: "2 min ago" },
  { icon: <Target size={13} />,     color: "#fc4c02", title: "Pitch a brand today", body: "Generate a personalized pitch for any brand in seconds.", time: "Today" },
  { icon: <DollarSign size={13} />, color: "#4ade80", title: "Income gap detected", body: "You may be missing 3 income streams. Check Gap Radar.", time: "Today" },
]

export default function Navbar() {
  const { user }   = useAuth()
  const navigate   = useNavigate()
  const [notifOpen, setNotifOpen] = useState(false)
  const [hasNew,    setHasNew]    = useState(true)
  const notifRef = useRef()

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false) }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const handleBellClick = () => {
    setNotifOpen(o => !o)
    setHasNew(false)
  }

  return (
    <nav
      className="sticky top-0 z-50 flex items-center justify-between px-6 h-14 w-full"
      style={{ background: "#0a0916", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
    >
      {/* Left: Logo */}
      <div className="flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2 no-underline">
          <div className="w-6 h-6 rounded flex items-center justify-center gradient-accent">
            <Zap size={13} color="white" strokeWidth={2.5} />
          </div>
          <span className="text-white font-semibold text-[15px] tracking-tight">CreatorPulse</span>
        </Link>

        {!user && (
          <div className="hidden md:flex items-center gap-6 ml-6">
            {["Products", "Resources"].map((item) => (
              <span key={item} className="nav-gradient-text text-[13px] font-medium cursor-pointer">{item}</span>
            ))}
            <a
              href="/#pricing"
              onClick={(e) => {
                // If already on the landing page, smooth-scroll instead of navigating
                const el = document.getElementById("pricing")
                if (el) {
                  e.preventDefault()
                  el.scrollIntoView({ behavior: "smooth" })
                }
              }}
              className="nav-gradient-text text-[13px] font-medium cursor-pointer no-underline"
            >
              Pricing
            </a>
          </div>
        )}
      </div>

      {/* Right */}
      {user ? (
        <div className="flex items-center gap-4 flex-1 justify-end max-w-xl">
          {/* Search */}
          <div className="relative w-full max-w-[200px] hidden sm:block">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full bg-white/5 border border-white/10 rounded px-8 py-1 text-[12px] text-white placeholder-gray-400 focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>

          {/* Bell */}
          <div ref={notifRef} className="relative">
            <button
              onClick={handleBellClick}
              className="relative p-1.5 rounded transition-colors"
              style={{ color: notifOpen ? "white" : "rgba(255,255,255,0.5)", background: notifOpen ? "rgba(255,255,255,0.08)" : "transparent" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
              onMouseLeave={(e) => { if (!notifOpen) e.currentTarget.style.background = "transparent" }}
            >
              {/* Bell SVG with ring animation on hover */}
              <svg
                viewBox="0 0 448 512"
                className="bell-icon"
                style={{ width: 16, height: 16, fill: "currentColor", transformOrigin: "top center" }}
              >
                <path d="M224 0c-17.7 0-32 14.3-32 32V49.9C119.5 61.4 64 124.2 64 200v33.4c0 45.4-15.5 89.5-43.8 124.9L5.3 377c-5.8 7.2-6.9 17.1-2.9 25.4S14.8 416 24 416H424c9.2 0 17.6-5.3 21.6-13.6s2.9-18.2-2.9-25.4l-14.9-18.6C399.5 322.9 384 278.8 384 233.4V200c0-75.8-55.5-138.6-128-150.1V32c0-17.7-14.3-32-32-32zm0 96h8c57.4 0 104 46.6 104 104v33.4c0 47.9 13.9 94.6 39.7 134.6H72.3C98.1 328 112 281.3 112 233.4V200c0-57.4 46.6-104 104-104h8zm64 352H224 160c0 17 6.7 33.3 18.7 45.3s28.3 18.7 45.3 18.7s33.3-6.7 45.3-18.7s18.7-28.3 18.7-45.3z" />
              </svg>
              {/* Unread dot */}
              {hasNew && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
                  style={{ background: "#ef2cc1", boxShadow: "0 0 6px #ef2cc1" }} />
              )}
            </button>

            {/* Notification dropdown */}
            {notifOpen && (
              <div
                className="absolute right-0 top-full mt-2 rounded-xl overflow-hidden"
                style={{
                  width: 320,
                  background: "#111026",
                  border: "1px solid rgba(255,255,255,0.09)",
                  boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
                  animation: "fadeUp 180ms ease both",
                }}
              >
                <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}`}</style>

                <div className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <span className="font-mono text-[10px] tracking-widest uppercase text-[#8a89a0]">Notifications</span>
                  <span className="font-mono text-[10px]" style={{ color: "#ef2cc1" }}>4 new</span>
                </div>

                <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                  {NOTIFICATIONS.map((n, i) => (
                    <div key={i} className="flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors"
                      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: `${n.color}15`, border: `1px solid ${n.color}25`, color: n.color }}>
                        {n.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-white mb-0.5">{n.title}</p>
                        <p className="text-[11px] leading-relaxed" style={{ color: "#8a89a0" }}>{n.body}</p>
                      </div>
                      <span className="text-[10px] font-mono flex-shrink-0 mt-0.5" style={{ color: "rgba(255,255,255,0.2)" }}>
                        {n.time}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="px-4 py-2.5" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <button className="text-[11px] font-mono w-full text-center transition-colors"
                    style={{ color: "#8a89a0" }}
                    onMouseEnter={(e) => e.target.style.color = "#00f2fe"}
                    onMouseLeave={(e) => e.target.style.color = "#8a89a0"}
                  >
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <Link to="/account"
            className="flex items-center gap-2 px-2 py-1 rounded text-gray-400 hover:text-white hover:bg-white/5 transition-colors no-underline">
            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
              <User size={12} className="text-white" />
            </div>
            <span className="text-[12px] font-medium hidden md:inline">{user.email?.split("@")[0] || "Profile"}</span>
          </Link>
        </div>
      ) : (
        <div className="flex items-center gap-7">
          <button onClick={() => navigate("/auth")} className="nav-gradient-text text-[13px] font-medium">
            Login
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="h-9 px-6 text-[12px] font-medium rounded-md border text-white transition-colors"
            style={{ borderColor: "rgba(255,255,255,0.2)", background: "transparent" }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.5)"}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"}
          >
            Dashboard
          </button>
        </div>
      )}
    </nav>
  )
}
