import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { auth, db } from "../firebase/config"
import { deleteUser, reauthenticateWithCredential, EmailAuthProvider, reauthenticateWithPopup, GoogleAuthProvider } from "firebase/auth"
import { doc, deleteDoc } from "firebase/firestore"
import { useAuth } from "../context/AuthContext"
import AppShell from "../components/AppShell"
import PageHeader from "../components/PageHeader"
import { User, Shield, Bell, Trash2, AlertCircle } from "lucide-react"

export default function AccountSettings() {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  // Settings Tab
  const [activeTab, setActiveTab] = useState("profile")

  // Notification toggles
  const [rateAlerts, setRateAlerts] = useState(true)
  const [weeklyDigest, setWeeklyDigest] = useState(false)
  const [pitchUpdates, setPitchUpdates] = useState(true)

  // Account deletion states
  const [confirmText, setConfirmText] = useState("")
  const [password, setPassword] = useState("")
  const [step, setStep] = useState("idle")
  const [error, setError] = useState("")

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
      await reauthenticateWithCredential(auth.currentUser, EmailAuthProvider.credential(user.email, password))
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

  const SETTINGS_TABS = [
    { id: "profile", label: "Profile Settings", icon: <User size={14} /> },
    { id: "security", label: "Security", icon: <Shield size={14} /> },
    { id: "notifications", label: "Notifications", icon: <Bell size={14} /> },
    { id: "danger", label: "Danger Zone", icon: <Trash2 size={14} /> },
  ]

  return (
    <AppShell>
      <PageHeader
        eyebrow="SETTINGS"
        title="Account Settings"
        description="Manage your profile information, notifications, and login credentials."
      />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Tabs Navigation */}
        <div className="md:col-span-4 space-y-1">
          {SETTINGS_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded text-[13px] font-medium transition-colors bg-transparent border-0 text-left ${
                activeTab === t.id
                  ? "bg-black/[0.04] text-[#010120] font-semibold"
                  : "text-gray-500 hover:bg-black/[0.01] hover:text-gray-900"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Right Side: Tab Panel Content */}
        <div className="md:col-span-8">
          
          {/* PROFILE SETTINGS */}
          {activeTab === "profile" && (
            <div className="card p-6 border border-black/5 rounded space-y-6">
              <div>
                <h3 className="text-[14px] font-semibold text-gray-900 mb-1">Profile Details</h3>
                <p className="text-[12px] text-gray-400">Your email address and registration info.</p>
              </div>

              <div className="space-y-4 pt-4 border-t border-black/5">
                <div className="flex justify-between items-center py-1">
                  <span className="text-[13px] text-gray-500">Email Address</span>
                  <span className="text-[13px] font-medium text-gray-900">{user?.email}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-[13px] text-gray-500">Sign-in Method</span>
                  <span className="text-[13px] font-medium text-gray-900 uppercase font-mono text-[11px] bg-gray-100 px-2 py-0.5 rounded">
                    {isGoogleUser ? "Google" : "Email & Password"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* SECURITY */}
          {activeTab === "security" && (
            <div className="card p-6 border border-black/5 rounded space-y-6">
              <div>
                <h3 className="text-[14px] font-semibold text-gray-900 mb-1">Security Credentials</h3>
                <p className="text-[12px] text-gray-400">Review email verification status and credential types.</p>
              </div>

              <div className="space-y-4 pt-4 border-t border-black/5">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${user?.emailVerified ? "bg-green-500" : "bg-red-400"}`} />
                  <span className="text-[13px] text-gray-700">
                    {user?.emailVerified ? "Verified Email Address" : "Email Verification Pending"}
                  </span>
                </div>
                <p className="text-[13px] text-gray-500 leading-relaxed">
                  {isGoogleUser
                    ? "Your account utilizes Google Single-Sign-On (SSO) for authorization. Passwords and keys are managed securely via your Google profile."
                    : "Your password is encrypted and managed securely. Ensure you update it periodically to maintain high security."}
                </p>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS */}
          {activeTab === "notifications" && (
            <div className="card p-6 border border-black/5 rounded space-y-6">
              <div>
                <h3 className="text-[14px] font-semibold text-gray-900 mb-1">Alert Preferences</h3>
                <p className="text-[12px] text-gray-400">Configure how you receive rate notifications and campaign evaluations.</p>
              </div>

              <div className="space-y-4 pt-4 border-t border-black/5">
                {[
                  { id: "rate", label: "Rate Audits", desc: "Get notified when new sponsored rates are calculated for your niche.", val: rateAlerts, set: setRateAlerts },
                  { id: "weekly", label: "Weekly Growth Insights", desc: "A summary of opportunities left on the table.", val: weeklyDigest, set: setWeeklyDigest },
                  { id: "pitch", label: "Collab Tracker Update", desc: "Alert when brands accept or review your outreach pitches.", val: pitchUpdates, set: setPitchUpdates },
                ].map((item) => (
                  <div key={item.id} className="flex items-start justify-between py-2">
                    <div className="max-w-md">
                      <p className="text-[13px] font-semibold text-gray-800">{item.label}</p>
                      <p className="text-[12px] text-gray-500 mt-0.5">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => item.set(!item.val)}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors relative border-0 outline-none flex items-center ${
                        item.val ? "bg-[#010120]" : "bg-gray-200"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          item.val ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DANGER ZONE */}
          {activeTab === "danger" && (
            <div className="card p-6 border border-red-100 bg-red-50/5 rounded space-y-6">
              <div>
                <h3 className="text-[14px] font-semibold text-red-700 mb-1">Danger Zone</h3>
                <p className="text-[12px] text-gray-400">Deletes all profile history and data permanently. This cannot be undone.</p>
              </div>

              <div className="pt-4 border-t border-red-100">
                {error && (
                  <div className="mb-4 px-4 py-3 rounded text-[12px] border border-red-200 bg-red-50 text-red-700">
                    {error}
                  </div>
                )}

                {step === "idle" && (
                  <button
                    onClick={() => setStep("confirming")}
                    className="px-4 py-2 rounded text-[13px] font-medium transition-colors bg-red-600 text-white border-0 hover:bg-red-700"
                  >
                    Delete Account
                  </button>
                )}

                {step === "confirming" && (
                  <div className="space-y-3">
                    <p className="text-[13px] text-gray-700">
                      Type <code className="px-1.5 py-0.5 rounded bg-gray-100 text-[12px] font-mono font-bold text-red-600">DELETE</code> to confirm account removal:
                    </p>
                    <input
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder="DELETE"
                      className="input text-[13px] bg-white border border-red-200 rounded max-w-xs focus:border-red-400 outline-none p-2 w-full"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (confirmText !== "DELETE") { setError('Type "DELETE" exactly.'); return }
                          setError(""); setStep("reauth")
                        }}
                        className="px-4 py-2 rounded text-[13px] font-medium bg-red-600 text-white border-0 hover:bg-red-700"
                      >
                        Continue Removal
                      </button>
                      <button
                        onClick={handleCancel}
                        className="btn-secondary py-2 px-4 text-[13px]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {step === "reauth" && (
                  <div className="space-y-3">
                    <p className="text-[13px] text-gray-700">Please re-authenticate to confirm delete:</p>
                    {isEmailUser && (
                      <form onSubmit={handleReauthEmail} className="space-y-2 max-w-xs">
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Current password"
                          className="input text-[13px] bg-white border border-black/10 rounded focus:border-black/30 outline-none p-2 w-full"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 rounded text-[13px] font-medium bg-red-600 text-white border-0 hover:bg-red-700"
                        >
                          Confirm Delete
                        </button>
                      </form>
                    )}
                    {isGoogleUser && (
                      <button
                        onClick={handleReauthGoogle}
                        className="flex items-center gap-2 px-4 py-2 rounded text-[13px] font-medium bg-red-600 text-white border-0 hover:bg-red-700"
                      >
                        <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="" />
                        Re-authenticate with Google
                      </button>
                    )}
                    <button
                      onClick={handleCancel}
                      className="btn-ghost py-1 text-[13px] text-gray-500 hover:text-black"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {step === "deleting" && (
                  <div className="flex items-center gap-2 text-[13px] text-red-600 animate-pulse font-medium">
                    <AlertCircle size={15} /> Deleting all accounts and configurations...
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

      </div>
    </AppShell>
  )
}
