import { useState, useEffect } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "../firebase/config"
import { useAuth } from "../context/AuthContext"
import { useCreator } from "../context/CreatorContext"
import { usePitchGenerator } from "../hooks/usePitchGenerator"
import { sanitizeInput } from "../utils/sanitize"
import AppShell from "../components/AppShell"
import PageHeader from "../components/PageHeader"
import AIResponseCard from "../components/AIResponseCard"
import EmptyState from "../components/EmptyState"
import UsageBadge from "../components/UsageBadge"
import ToolExplainer from "../components/ToolExplainer"
import { CardSkeleton } from "../components/LoadingSkeleton"
import {
  Copy, Check, Download, Mail, FileText, CheckCircle2,
  AlertCircle, RefreshCw, Sparkles, Send,
} from "lucide-react"

/* ---------- Ambient glow ---------- */
function PitchGlow({ hasResult }) {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div
        className="absolute -top-32 -left-24 w-[520px] h-[520px] rounded-full blur-[120px] transition-all duration-700"
        style={{ background: hasResult ? "rgba(34,211,238,0.18)" : "rgba(34,211,238,0.10)" }}
      />
      <div
        className="absolute -bottom-40 -right-24 w-[560px] h-[560px] rounded-full blur-[140px] transition-all duration-700"
        style={{ background: hasResult ? "rgba(168,85,247,0.18)" : "rgba(236,72,153,0.10)" }}
      />
      <div className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.6) 1px,transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
    </div>
  )
}

const GOALS = [
  "Product Launch",
  "Brand Awareness",
  "Conversion/Promo Code",
  "User Generated Content (UGC)",
  "Other",
]

export default function PitchGenerator() {
  const { user } = useAuth()
  const { profile } = useCreator()
  const { result, loading, error, usage, generatePitch } = usePitchGenerator()
  const [mounted, setMounted] = useState(false)

  const [brandName, setBrandName] = useState("")
  const [campaignGoal, setCampaignGoal] = useState("Product Launch")
  const [customGoal, setCustomGoal] = useState("")

  const [selectedSubject, setSelectedSubject] = useState(0)
  const [copiedEmail, setCopiedEmail] = useState(false)
  const [activeTab, setActiveTab] = useState("email")

  useEffect(() => { setMounted(true) }, [])

  const handleGenerate = () => {
    if (!brandName.trim() || !profile) return
    const goalText = campaignGoal === "Other" ? customGoal : campaignGoal
    generatePitch(profile, sanitizeInput(brandName, 100), goalText)
    setActiveTab("email")
  }

  const copyText = (text, setter) => {
    navigator.clipboard.writeText(text)
    setter(true)
    setTimeout(() => setter(false), 2000)
  }

  const handleDownloadPDF = async () => {
    const { generateMediaKit } = await import("../utils/generateMediaKit")
    generateMediaKit(profile, result)
  }

  const inputCls =
    "w-full text-[13px] bg-white/[0.04] text-white placeholder-white/30 border border-white/10 rounded-lg px-3 py-2.5 outline-none transition-all focus:border-cyan-400/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-cyan-400/15"

  return (
    <AppShell>
      <div className="relative">
        <PitchGlow hasResult={!!result} />

        <PageHeader
          eyebrow="AI TOOL"
          title="Pitch Generator"
          description="Craft high-conversion outreach messages and customize downloadable media kits."
          action={<UsageBadge usage={usage} />}
        />

        <ToolExplainer
          title="the Pitch Generator"
          what="This tool writes a personalized brand outreach email tailored to your creator profile and the specific brand you're targeting. It also generates 3 subject line options, a follow-up email, collaboration ideas, key talking points, and a downloadable PDF media kit — all in one go."
          steps={[
            "Enter the brand name you want to pitch (e.g. boAt, Mamaearth)",
            "Select the campaign goal — what you think the brand needs right now",
            "Click Generate — the AI writes everything based on your profile",
            "Choose your favourite subject line from 3 options",
            "Copy the email directly or download the PDF media kit to attach",
          ]}
          tip="The more specific your campaign goal, the more targeted the pitch. 'Product Launch' gets a very different email than 'Brand Awareness' — pick the one that matches what the brand is currently doing."
        />

        <div
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mt-2"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(14px)",
            transition: "opacity .55s ease, transform .55s ease",
          }}
        >
          {/* Left: Inputs */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6 overflow-hidden">
              <div
                className="absolute inset-0 -z-10 opacity-60"
                style={{
                  background:
                    "radial-gradient(circle at 20% 0%, rgba(34,211,238,0.10), transparent 60%)",
                }}
              />
              <div className="flex items-center justify-between mb-5">
                <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-white/40">
                  Brand Inputs
                </p>
                <span className="text-[10px] font-mono uppercase text-cyan-300/80 flex items-center gap-1">
                  <Sparkles size={11} /> AI Draft
                </span>
              </div>

              <div className="space-y-4">
                <Field label="Brand Name">
                  <input
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="e.g. Mamaearth, boAt, Nykaa"
                    className={inputCls}
                  />
                </Field>

                <Field label="Campaign Focus">
                  <div className="grid grid-cols-2 gap-2">
                    {GOALS.map((g) => {
                      const active = campaignGoal === g
                      return (
                        <button
                          key={g}
                          onClick={() => setCampaignGoal(g)}
                          className={`text-[12px] px-3 py-2 rounded-lg border text-left transition-all ${
                            active
                              ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-100 shadow-[0_0_18px_-8px_rgba(34,211,238,0.7)]"
                              : "border-white/10 bg-white/[0.03] text-white/60 hover:text-white hover:border-white/20"
                          }`}
                        >
                          {g}
                        </button>
                      )
                    })}
                  </div>
                </Field>

                {campaignGoal === "Other" && (
                  <div className="animate-[fade-in_.3s_ease-out]">
                    <Field label="Campaign Goal Details">
                      <input
                        value={customGoal}
                        onChange={(e) => setCustomGoal(e.target.value)}
                        placeholder="e.g. Creator awareness for summer line"
                        className={inputCls}
                      />
                    </Field>
                  </div>
                )}

                <button
                  onClick={handleGenerate}
                  disabled={loading || !brandName.trim()}
                  className="group relative w-full text-[13px] py-3 rounded-xl font-medium text-white transition-all bg-gradient-to-r from-cyan-500 to-purple-500 hover:shadow-[0_0_30px_-6px_rgba(34,211,238,0.6)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 overflow-hidden"
                >
                  <span className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  {loading ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Drafting Pitch…
                    </>
                  ) : (
                    <>
                      <Send size={14} /> Generate Pitch Details
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right: Output */}
          <div className="lg:col-span-7 space-y-5">
            {loading ? (
              <div className="space-y-4">
                <CardSkeleton height="60px" />
                <CardSkeleton height="280px" />
              </div>
            ) : error ? (
              <div className="rounded-xl border border-pink-400/30 bg-pink-500/10 text-pink-100 p-4 flex items-start gap-3">
                <AlertCircle className="flex-shrink-0 mt-0.5 text-pink-300" size={18} />
                <div>
                  <p className="font-semibold text-[14px]">Pitching Error</p>
                  <p className="text-[13px] mt-1 text-pink-200/80">{error}</p>
                </div>
              </div>
            ) : !result ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
                <EmptyState
                  icon="✉️"
                  title="Draft Brand Emails & Kits"
                  description="Configure brand name and objectives on the left to generate customized pitches, talking points, and downloadable media kits."
                />
              </div>
            ) : (
              <div
                className="space-y-4"
                style={{
                  animation: "fade-in .5s ease-out",
                }}
              >
                {/* Tab Navigation */}
                <div className="flex gap-1 p-1 rounded-xl border border-white/10 bg-white/[0.03]">
                  {[
                    { id: "email", label: "Email Pitch", icon: <Mail size={13} /> },
                    { id: "mediakit", label: "Media Kit", icon: <FileText size={13} /> },
                    { id: "talking", label: "Talking Points", icon: <CheckCircle2 size={13} /> },
                  ].map((t) => {
                    const active = activeTab === t.id
                    return (
                      <button
                        key={t.id}
                        onClick={() => setActiveTab(t.id)}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[12px] font-medium rounded-lg transition-all ${
                          active
                            ? "bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white border border-cyan-400/30 shadow-[0_0_18px_-8px_rgba(34,211,238,0.6)]"
                            : "text-white/50 hover:text-white/80 border border-transparent"
                        }`}
                      >
                        {t.icon}
                        {t.label}
                      </button>
                    )
                  })}
                </div>

                {/* Email tab */}
                {activeTab === "email" && (
                  <div className="space-y-4 animate-[fade-in_.4s_ease-out]">
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                      <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">
                        Select Email Subject
                      </span>
                      <div className="mt-2.5 space-y-1.5">
                        {result.subjectLines?.map((subj, idx) => {
                          const active = selectedSubject === idx
                          return (
                            <button
                              key={idx}
                              onClick={() => setSelectedSubject(idx)}
                              className={`w-full text-left text-[12.5px] p-2.5 rounded-lg transition-all border ${
                                active
                                  ? "bg-cyan-400/10 border-cyan-400/40 text-white shadow-[0_0_14px_-8px_rgba(34,211,238,0.7)]"
                                  : "bg-transparent border-white/5 text-white/55 hover:bg-white/[0.04] hover:text-white/85"
                              }`}
                              style={{
                                animation: `fade-in .35s ease-out ${idx * 60}ms both`,
                              }}
                            >
                              <span className="inline-flex items-center gap-2">
                                <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" : "bg-white/20"}`} />
                                {subj}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Mock email */}
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
                      <div className="px-5 py-3 border-b border-white/5 text-[11px] text-white/55 space-y-1 bg-white/[0.02]">
                        <div>
                          <span className="font-semibold text-white/70">To:</span> Marketing Team &lt;collabs@{brandName.toLowerCase().replace(/\s+/g, "")}.com&gt;
                        </div>
                        <div>
                          <span className="font-semibold text-white/70">Subject:</span>{" "}
                          <span className="text-cyan-200">{result.subjectLines?.[selectedSubject]}</span>
                        </div>
                      </div>
                      <div className="p-6 relative">
                        <button
                          onClick={() => copyText(result.email, setCopiedEmail)}
                          className="absolute right-4 top-4 px-2.5 py-1 text-[11px] border border-white/10 rounded-lg flex items-center gap-1 bg-white/[0.04] hover:bg-white/[0.08] text-white/70 transition-all"
                        >
                          {copiedEmail ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                          {copiedEmail ? "Copied" : "Copy Email"}
                        </button>
                        <div className="text-[13px] text-white/75 whitespace-pre-wrap leading-relaxed pt-6">
                          {result.email}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Media kit */}
                {activeTab === "mediakit" && (
                  <div className="space-y-4 animate-[fade-in_.4s_ease-out]">
                    <div className="relative rounded-xl border border-white/10 bg-white/[0.03] p-6 flex flex-col items-center overflow-hidden">
                      <div
                        className="absolute inset-0 -z-10 opacity-60"
                        style={{
                          background:
                            "radial-gradient(circle at 50% 0%, rgba(168,85,247,0.12), transparent 60%)",
                        }}
                      />
                      <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-white/40 mb-6">
                        Media Kit Profile Preview
                      </p>

                      <div className="w-full max-w-[340px] rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-5 shadow-[0_20px_60px_-20px_rgba(34,211,238,0.35)] backdrop-blur">
                        <div className="flex items-center gap-3 pb-3 border-b border-white/10 mb-4">
                          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 text-white flex items-center justify-center font-bold text-sm shadow-[0_0_18px_-4px_rgba(34,211,238,0.7)]">
                            {profile?.name?.charAt(0) || "C"}
                          </div>
                          <div>
                            <h4 className="text-[13px] font-semibold text-white">
                              {profile?.name || "Creator Profile"}
                            </h4>
                            <span className="text-[10px] font-mono text-cyan-300/80 uppercase tracking-wider">
                              {profile?.niche || "Niche"}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5 text-center mb-4">
                          <Stat label="Followers" value={Number(profile?.followers || 0).toLocaleString()} />
                          <Stat label="Engagement" value={`${profile?.engagementRate || "—"}%`} />
                        </div>

                        <div className="space-y-1.5 text-[11px] text-white/60">
                          <Row k="Primary Audience" v={profile?.audienceLocation || "India"} />
                          <Row k="Verified Channels" v={(profile?.platform || "Instagram").toUpperCase()} />
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleDownloadPDF}
                      className="group w-full justify-center py-3 rounded-xl font-medium text-white transition-all bg-gradient-to-r from-cyan-500 to-purple-500 hover:shadow-[0_0_30px_-6px_rgba(168,85,247,0.6)] flex items-center gap-2"
                    >
                      <Download size={14} className="transition-transform group-hover:translate-y-0.5" />
                      Download Media Kit PDF
                    </button>
                  </div>
                )}

                {/* Talking points */}
                {activeTab === "talking" && (
                  <div className="space-y-4 animate-[fade-in_.4s_ease-out]">
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                      <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-white/40 mb-3">
                        Brand Conversation Strategy
                      </p>
                      <ul className="space-y-2.5">
                        {result.talkingPoints?.map((pt, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2.5 text-[13px] text-white/75"
                            style={{ animation: `fade-in .4s ease-out ${idx * 70}ms both` }}
                          >
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)] flex-shrink-0" />
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {result.redFlags?.length > 0 && (
                      <div className="rounded-xl border border-pink-400/25 bg-pink-500/[0.06] p-5">
                        <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-pink-300/80 mb-3">
                          Watch Out Concerns
                        </p>
                        <ul className="space-y-2">
                          {result.redFlags.map((flag, idx) => (
                            <li key={idx} className="text-[12.5px] text-pink-100/85 flex gap-2">
                              <span className="text-pink-400">•</span>
                              {flag}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={() => { setBrandName(""); setCampaignGoal("Product Launch") }}
                  className="group w-full py-2.5 rounded-xl font-medium border border-white/15 text-white/85 bg-white/[0.03] hover:bg-white/[0.07] hover:border-cyan-400/40 transition-all flex items-center justify-center gap-1.5"
                >
                  <RefreshCw size={12} className="transition-transform group-hover:rotate-180 duration-500" />
                  Pitch Another Brand
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}

/* ---------- Helpers ---------- */
function Field({ label, children }) {
  return (
    <div>
      <label className="block text-[10px] font-medium text-white/40 mb-1.5 uppercase font-mono tracking-[0.18em]">
        {label}
      </label>
      {children}
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="p-2.5 rounded-lg bg-white/[0.04] border border-white/5">
      <div className="text-[9px] font-mono text-white/40 uppercase tracking-wider">{label}</div>
      <div className="text-sm font-semibold text-white mt-0.5 tabular-nums">{value}</div>
    </div>
  )
}

function Row({ k, v }) {
  return (
    <div className="flex justify-between">
      <span>{k}:</span>
      <span className="font-semibold text-white/90">{v}</span>
    </div>
  )
}
