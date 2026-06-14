import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { Zap, Search, Bell, User } from "lucide-react"

/**
 * Premium SaaS Navbar.
 * Dark background, no shadows, 1px bottom border.
 */
export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <nav
      className="sticky top-0 z-50 flex items-center justify-between px-6 h-14 w-full"
      style={{
        background: "#0a0916",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
      }}
    >
      {/* Left: Logo */}
      <div className="flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2 no-underline">
          <div className="w-6 h-6 rounded flex items-center justify-center gradient-accent">
            <Zap size={13} color="white" strokeWidth={2.5} />
          </div>
          <span className="text-white font-semibold text-[15px] tracking-tight">CreatorPulse</span>
        </Link>

        {/* Center-left: Public links (only when NOT logged in or as fallback) */}
        {!user && (
          <div className="hidden md:flex items-center gap-6 ml-6">
            {["Products", "Resources", "Pricing"].map((item) => (
              <span
                key={item}
                className="text-[13px] font-medium cursor-pointer transition-colors"
                style={{ color: "rgba(255, 255, 255, 0.55)" }}
                onMouseEnter={(e) => (e.target.style.color = "#ffffff")}
                onMouseLeave={(e) => (e.target.style.color = "rgba(255, 255, 255, 0.55)")}
              >
                {item}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Right side conditional rendering */}
      {user ? (
        // Logged-in state layout
        <div className="flex items-center gap-4 flex-1 justify-end max-w-xl">
          {/* Search bar */}
          <div className="relative w-full max-w-[200px] hidden sm:block">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full bg-white/5 border border-white/10 rounded px-8 py-1 text-[12px] text-white placeholder-gray-400 focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>

          {/* Notifications */}
          <button className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
            <Bell size={16} />
          </button>

          {/* Profile link */}
          <Link
            to="/account"
            className="flex items-center gap-2 px-2 py-1 rounded text-gray-400 hover:text-white hover:bg-white/5 transition-colors no-underline"
          >
            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
              <User size={12} className="text-white" />
            </div>
            <span className="text-[12px] font-medium hidden md:inline">{user.email?.split("@")[0] || "Profile"}</span>
          </Link>
        </div>
      ) : (
        // Public state layout
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/auth")}
            className="text-[13px] font-medium transition-colors"
            style={{ color: "rgba(255, 255, 255, 0.6)" }}
            onMouseEnter={(e) => (e.target.style.color = "#ffffff")}
            onMouseLeave={(e) => (e.target.style.color = "rgba(255, 255, 255, 0.6)")}
          >
            Login
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="btn-primary text-[12px]"
            style={{ background: "#ffffff", color: "#010120", fontWeight: 500 }}
          >
            Dashboard
          </button>
        </div>
      )}
    </nav>
  )
}
