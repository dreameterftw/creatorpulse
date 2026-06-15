import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { auth, db } from "../firebase/config"
import {
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
  reauthenticateWithPopup,
  GoogleAuthProvider,
} from "firebase/auth"
import { doc, deleteDoc } from "firebase/firestore"
import { useAuth } from "../context/AuthContext"
import AppShell from "../components/AppShell"
import { User, Shield, Bell, Trash2, AlertCircle, CheckCircle, XCircle, Mail, Zap } from "lucide-react"

/* ─── animated background blobs ─── */
function SettingsGlow() {
  return (
    <>
      <div
        className="pointer-events-none fixed top-[-120px] right-[-80px] w-[420px] h-[420px] rounded-full opacity-[0.07]"
        style={{ background: "radial-gradient(circle, #00f2fe 0%, transparent 70%)", filter: "blur(60px)" }}
      />
      <div
        className="pointer-events-none fixed bottom-[-80px] left-[-60px] w-[340px] h-[340px] rounded-full opacity-[0.06]"
        style={{ background: "radial-gradient(circle, #ef2cc1 0%, transparent 70%)", filter: "blur(60px)" }}
      />
      <div
        className="pointer-events-none fixed top-[40%] left-[38%] w-[260px] h-[260px] rounded-full opacity-[0.04]"
        style={{ background: "radial-gradient(circle, #fc4c02 0%, transparent 70%)", filter: "blur(80px)" }}
      />
    </>
  )
}

/* ─── branded toggle ─── */
function Toggle({ value, onChange, accent = "#ef2cc1" }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="relative flex-shrink-0 w-10 h-[22px] rounded-full border-0 outline-none transition-all duration-300"
      style={{
        background: value
          ? `linear-gradient(90deg, ${accent}cc, ${accent})`
          : "rgba(255,255,255,0.08)",
        boxShadow: value ? `0 0 12px ${accent}55` : "none",
      }}
    >
      <div
        className="absolute top-[3px] w-4 h-4 rounded-full transition-all duration-300"
        style={{
          left: value ? "calc(100% - 19px)" : "3px",
          background: "white",
          boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
        }}
      />
    </button>
  )
}

/* ─── section wrapper with mount animation ─── */
function TabPanel({ children, active }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (active) {
      const t = setTimeout(() => setVisible(true), 30)
      return () => clearTimeout(t)
    } else {
      setVisible(false)
    }
  }, [active])

  if (!active) return null
  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(10px)",
        transition: "opacity 250ms ease, transform 250ms ease",
      }}
    >
      {children}
    </div>
  )
}

/* ─── card primitive ─── */
function Card({ children, className = "", danger = false }) {
  return (
    <div
      className={`rounded-xl border p-6 space-y-6 ${className}`}
      style={{
        background: danger
          ? "linear-gradient(135deg, #1a0a0a 0%, #111026 100%)"
          : "#111026",
        border: danger ? "1px solid rgba(239,68,68,0.2)" : "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {children}
    </div>
  )
}

/* ─── section eyebrow heading ─── */
function SectionHeader({ eyebrow, title, desc }) {
  return (
    <div>
      <p className="text-[10px] font-mono font-semibold tracking-widest uppercase mb-1"
        style={{ color: "#8a89a0" }}>{eyebrow}</p>
      <h3 className="font-display font-bold text-white text-[17px] tracking-tight mb-1">{title}</h3>
      <p className="text-[13px]" style={{ color: "#8a89a0" }}>{desc}</p>
    </div>
  )
}

/* ─── divider ─── */
function Divider() {
  return <div className="border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }} />
}

const TABS = [
  { id: "profile",       label: "Profile",       icon: User,     accent: "#00f2fe" },
  { id: "security",      label: "Security",      icon: Shield,   accent: "#22d3a5" },
  { id: "notifications", label: "Notifications", icon: Bell,     accent: "#ef2cc1" },
  { id: "danger",        label: "Danger Zone",   icon: Trash2,   accent: "#fc4c02" },
]

export default function AccountSettings() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState("profile")
  const [rateAlerts,    setRateAlerts]    = useState(true)
  const [weeklyDigest,  setWeeklyDigest]  = useState(false)
  const [pitchUpdates,  setPitchUpdates]  = useState(true)

  const [confirmText, setConfirmText] = useState("")
  const [password,    setPassword]    = useState("")
  const [step,        setStep]        = useState("idle")
  const [error,       setError]       = useState("")

  const isGoogleUser = user?.providerData?.some((p) => p.providerId === "google.com")
  const isEmailUser  = user?.providerData?.some((p) => p.providerId === "password")

  const handleCancel = () => { setStep("idle"); setConfirmText(""); setPassword(""); setError("") }

  const performDeletion = async () => {
    setStep("deleting"); setError("")
    try {
      await deleteDoc(doc(db, "users", auth.currentUser.uid))
      await deleteUser(auth.currentUser)
      navigate("/")
    } catch (err) {
      if (err.code === "auth/requires-recent-login") {
        setError("For security, please re-authenticate to continue.")
        setStep("reauth")
      } else {
        setError("Something went wrong. Please try again.")
        setStep("confirming")
      }
    }
  }

  const handleReauthEmail = async (e) => {
    e.preventDefault(); setError("")
    try {
      await reauthenticateWithCredential(
        auth.currentUser,
        EmailAuthProvider.credential(user.email, password)
      )
      await performDeletion()
    } catch { setError("Incorrect password."); setStep("reauth") }
  }

  const handleReauthGoogle = async () => {
    setError("")
    try {
      await reauthenticateWithPopup(auth.currentUser, new GoogleAuthProvider())
      await performDeletion()
    } catch { setError("Re-authentication failed."); setStep("reauth") }
  }

  const activeAccent = TABS.find((t) => t.id === activeTab)?.accent ?? "#00f2fe"

  return (
    <AppShell>
      <SettingsGlow />

      {/* Page header */}
      <div className="mb-8">
        <p className="text-[10px] font-mono font-semibold tracking-widest uppercase mb-2"
          style={{ color: "#8a89a0" }}>ACCOUNT</p>
        <h1 className="font-display font-extrabold text-white text-3xl tracking-tight mb-1">
          Settings
        </h1>
        <p className="text-[14px]" style={{ color: "#8a89a0" }}>
          Manage your profile, security, and preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">

        {/* ── Left nav ── */}
        <div className="md:col-span-3">
          <div
            className="rounded-xl border p-2 space-y-0.5"
            style={{ background: "#111026", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            {TABS.map(({ id, label, icon: Icon, accent }) => {
              const active = activeTab === id
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 border-0 text-left"
                  style={{
                    background: active ? `${accent}18` : "transparent",
                    color: active ? accent : "#8a89a0",
                    boxShadow: active ? `inset 0 0 0 1px ${accent}30` : "none",
                  }}
                >
                  <span
                    className="flex items-center justify-center w-6 h-6 rounded-md flex-shrink-0 transition-all duration-200"
                    style={{ background: active ? `${accent}25` : "rgba(255,255,255,0.05)" }}
                  >
                    <Icon size={13} style={{ color: active ? accent : "#8a89a0" }} />
                  </span>
                  {label}
                  {active && (
                    <span
                      className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: accent, boxShadow: `0 0 6px ${accent}` }}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="md:col-span-9">

          {/* PROFILE */}
          <TabPanel active={activeTab === "profile"}>
            <Card>
              <SectionHeader
                eyebrow="PROFILE"
                title="Your Details"
                desc="Email address and account registration info."
              />
              <Divider />
              <div className="space-y-0">
                <InfoRow label="Email Address" value={user?.email} mono />
                <InfoRow
                  label="Sign-in Method"
                  value={isGoogleUser ? "Google SSO" : "Email & Password"}
                  badge
                  accent="#00f2fe"
                />
                <InfoRow
                  label="Account Status"
                  value={user?.emailVerified ? "Verified" : "Unverified"}
                  badge
                  accent={user?.emailVerified ? "#22d3a5" : "#fc4c02"}
                />
              </div>
            </Card>
          </TabPanel>

          {/* SECURITY */}
          <TabPanel active={activeTab === "security"}>
            <Card>
              <SectionHeader
                eyebrow="SECURITY"
                title="Credentials & Access"
                desc="Review your verification status and authentication type."
              />
              <Divider />
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  {user?.emailVerified ? (
                    <CheckCircle size={18} className="mt-0.5 flex-shrink-0" style={{ color: "#22d3a5" }} />
                  ) : (
                    <XCircle size={18} className="mt-0.5 flex-shrink-0" style={{ color: "#fc4c02" }} />
                  )}
                  <div>
                    <p className="text-[13px] font-semibold text-white mb-0.5">
                      {user?.emailVerified ? "Email Verified" : "Email Not Verified"}
                    </p>
                    <p className="text-[13px]" style={{ color: "#8a89a0" }}>
                      {user?.emailVerified
                        ? "Your email address has been successfully verified."
                        : "Check your inbox for a verification link."}
                    </p>
                  </div>
                </div>

                <div
                  className="rounded-lg p-4 border"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <p className="text-[11px] font-mono font-semibold tracking-widest uppercase mb-2"
                    style={{ color: "#8a89a0" }}>AUTHENTICATION METHOD</p>
                  <div className="flex items-center gap-2">
                    {isGoogleUser ? (
                      <>
                        <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
                        <span className="text-[13px] text-white font-medium">Google Single Sign-On</span>
                      </>
                    ) : (
                      <>
                        <Mail size={15} style={{ color: "#00f2fe" }} />
                        <span className="text-[13px] text-white font-medium">Email & Password</span>
                      </>
                    )}
                  </div>
                  <p className="text-[12px] mt-2 leading-relaxed" style={{ color: "#8a89a0" }}>
                    {isGoogleUser
                      ? "Your credentials are managed securely by Google. No password is stored on our servers."
                      : "Your password is encrypted. Update it periodically to maintain strong security."}
                  </p>
                </div>
              </div>
            </Card>
          </TabPanel>

          {/* NOTIFICATIONS */}
          <TabPanel active={activeTab === "notifications"}>
            <Card>
              <SectionHeader
                eyebrow="NOTIFICATIONS"
                title="Alert Preferences"
                desc="Configure how and when you hear from CreatorPulse."
              />
              <Divider />
              <div className="space-y-1">
                {[
                  {
                    label: "Rate Audits",
                    desc: "Get notified when new sponsored rates are calculated for your niche.",
                    val: rateAlerts,
                    set: setRateAlerts,
                    accent: "#ef2cc1",
                  },
                  {
                    label: "Weekly Growth Insights",
                    desc: "A weekly summary of monetization opportunities in your niche.",
                    val: weeklyDigest,
                    set: setWeeklyDigest,
                    accent: "#00f2fe",
                  },
                  {
                    label: "Collab Tracker Updates",
                    desc: "Alert when brands review or respond to your outreach pitches.",
                    val: pitchUpdates,
                    set: setPitchUpdates,
                    accent: "#22d3a5",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-4 py-4 border-b"
                    style={{ borderColor: "rgba(255,255,255,0.05)" }}
                  >
                    <div>
                      <p className="text-[13px] font-semibold text-white mb-0.5">{item.label}</p>
                      <p className="text-[12px] leading-relaxed" style={{ color: "#8a89a0" }}>
                        {item.desc}
                      </p>
                    </div>
                    <Toggle value={item.val} onChange={item.set} accent={item.accent} />
                  </div>
                ))}
              </div>
            </Card>
          </TabPanel>

          {/* DANGER ZONE */}
          <TabPanel active={activeTab === "danger"}>
            <Card danger>
              <SectionHeader
                eyebrow="DANGER ZONE"
                title="Delete Account"
                desc="Permanently removes all your data, history, and content. This cannot be undone."
              />
              <Divider />

              {error && (
                <div
                  className="flex items-start gap-2.5 px-4 py-3 rounded-lg text-[13px]"
                  style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5" }}
                >
                  <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
                  {error}
                </div>
              )}

              {step === "idle" && (
                <div>
                  <p className="text-[13px] mb-4" style={{ color: "#8a89a0" }}>
                    Deleting your account will erase your profile, rate history, pitch drafts, and all saved data.
                  </p>
                  <DangerButton onClick={() => setStep("confirming")}>
                    Delete My Account
                  </DangerButton>
                </div>
              )}

              {step === "confirming" && (
                <div className="space-y-4">
                  <p className="text-[13px]" style={{ color: "#8a89a0" }}>
                    Type{" "}
                    <code
                      className="px-1.5 py-0.5 rounded text-[12px] font-mono font-bold"
                      style={{ background: "rgba(239,68,68,0.15)", color: "#f87171" }}
                    >
                      DELETE
                    </code>{" "}
                    to confirm:
                  </p>
                  <DangerInput
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="DELETE"
                  />
                  <div className="flex gap-2">
                    <DangerButton
                      onClick={() => {
                        if (confirmText !== "DELETE") { setError('Type "DELETE" exactly.'); return }
                        setError(""); setStep("reauth")
                      }}
                    >
                      Continue
                    </DangerButton>
                    <GhostButton onClick={handleCancel}>Cancel</GhostButton>
                  </div>
                </div>
              )}

              {step === "reauth" && (
                <div className="space-y-4">
                  <p className="text-[13px]" style={{ color: "#8a89a0" }}>
                    Re-authenticate to confirm deletion:
                  </p>
                  {isEmailUser && (
                    <div className="space-y-3">
                      <DangerInput
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Current password"
                      />
                      <div className="flex gap-2">
                        <DangerButton onClick={handleReauthEmail}>Confirm Delete</DangerButton>
                        <GhostButton onClick={handleCancel}>Cancel</GhostButton>
                      </div>
                    </div>
                  )}
                  {isGoogleUser && (
                    <div className="flex gap-2">
                      <DangerButton onClick={handleReauthGoogle}>
                        <img src="https://www.google.com/favicon.ico" className="w-3.5 h-3.5" alt="" />
                        Re-auth with Google
                      </DangerButton>
                      <GhostButton onClick={handleCancel}>Cancel</GhostButton>
                    </div>
                  )}
                </div>
              )}

              {step === "deleting" && (
                <div className="flex items-center gap-2.5 text-[13px] font-medium" style={{ color: "#f87171" }}>
                  <span className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#f87171", borderTopColor: "transparent" }} />
                  Deleting your account…
                </div>
              )}
            </Card>
          </TabPanel>

        </div>
      </div>
    </AppShell>
  )
}

/* ── small helpers ── */

function InfoRow({ label, value, mono, badge, accent }) {
  return (
    <div
      className="flex items-center justify-between py-3 border-b"
      style={{ borderColor: "rgba(255,255,255,0.05)" }}
    >
      <span className="text-[13px]" style={{ color: "#8a89a0" }}>{label}</span>
      {badge ? (
        <span
          className="text-[11px] font-mono font-semibold tracking-wide px-2.5 py-1 rounded-full"
          style={{ background: `${accent}20`, color: accent, border: `1px solid ${accent}35` }}
        >
          {value}
        </span>
      ) : (
        <span
          className={`text-[13px] font-medium text-white ${mono ? "font-mono" : ""}`}
        >
          {value}
        </span>
      )}
    </div>
  )
}

function DangerButton({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold border-0 transition-all duration-200"
      style={{
        background: "linear-gradient(135deg, #dc2626, #b91c1c)",
        color: "white",
        boxShadow: "0 0 0 0 rgba(239,68,68,0)",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 0 16px rgba(239,68,68,0.4)" }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 0 0 0 rgba(239,68,68,0)" }}
    >
      {children}
    </button>
  )
}

function GhostButton({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-lg text-[13px] font-medium border-0 transition-colors duration-150"
      style={{ color: "#8a89a0", background: "rgba(255,255,255,0.05)" }}
      onMouseEnter={(e) => { e.currentTarget.style.color = "white" }}
      onMouseLeave={(e) => { e.currentTarget.style.color = "#8a89a0" }}
    >
      {children}
    </button>
  )
}

function DangerInput({ value, onChange, placeholder, type = "text" }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full max-w-xs px-3 py-2 rounded-lg text-[13px] font-mono outline-none transition-all duration-200"
      style={{
        background: "rgba(239,68,68,0.07)",
        border: "1px solid rgba(239,68,68,0.25)",
        color: "white",
      }}
      onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(239,68,68,0.6)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(239,68,68,0.1)" }}
      onBlur={(e)  => { e.currentTarget.style.borderColor = "rgba(239,68,68,0.25)"; e.currentTarget.style.boxShadow = "none" }}
    />
  )
}