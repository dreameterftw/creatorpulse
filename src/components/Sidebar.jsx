import { NavLink, useNavigate } from "react-router-dom"
import { signOut } from "firebase/auth"
import { auth } from "../firebase/config"
import {
  LayoutDashboard,
  DollarSign,
  Radar,
  Target,
  Mail,
  Sparkles,
  Settings,
  LogOut,
} from "lucide-react"

const NAV_ITEMS = [
  { to: "/dashboard",       icon: LayoutDashboard, label: "Overview" },
  { to: "/rate-calculator", icon: DollarSign,       label: "Rate Calculator" },
  { to: "/gap-radar",       icon: Radar,            label: "Gap Radar" },
  { to: "/fit-score",       icon: Target,           label: "Fit Score" },
  { to: "/pitch-generator", icon: Mail,             label: "Pitch Generator" },
  { to: "/what-if",         icon: Sparkles,         label: "What-If Simulator" },
]

export default function Sidebar() {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut(auth)
    navigate("/")
  }

  return (
    <aside
      className="fixed top-14 left-0 flex flex-col z-40 border-r border-white/5"
      style={{
        width: "var(--sidebar-width)",
        height: "calc(100vh - 3.5rem)",
        background: "#010120",
      }}
    >
      {/* Nav */}
      <nav className="flex-1 px-3 py-6 space-y-0.5 overflow-y-auto">
        <p className="eyebrow px-3 mb-3 text-[10px] tracking-widest text-white/30">DASHBOARD</p>
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <Icon size={16} strokeWidth={1.75} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 space-y-0.5 border-t border-white/5">
        <NavLink
          to="/account"
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
        >
          <Settings size={16} strokeWidth={1.75} />
          Account
        </NavLink>
        <button onClick={handleLogout} className="nav-item w-full text-left">
          <LogOut size={16} strokeWidth={1.75} />
          Logout
        </button>
      </div>
    </aside>
  )
}
