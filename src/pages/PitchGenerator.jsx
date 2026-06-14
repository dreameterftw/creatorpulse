import { useState, useEffect } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "../firebase/config"
import { useAuth } from "../context/AuthContext"
import { usePitchGenerator } from "../hooks/usePitchGenerator"
import { sanitizeInput } from "../utils/sanitize"
import AppShell from "../components/AppShell"
import PageHeader from "../components/PageHeader"
import AIResponseCard from "../components/AIResponseCard"
import EmptyState from "../components/EmptyState"
import UsageBadge from "../components/UsageBadge"
import { CardSkeleton } from "../components/LoadingSkeleton"
import { Copy, Check, Download, Mail, FileText, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react"

export default function PitchGenerator() {
  const { user } = useAuth()
  const { result, loading, error, usage, generatePitch } = usePitchGenerator()
  const [profile, setProfile] = useState(null)
  
  // Input states
  const [brandName, setBrandName] = useState("")
  const [campaignGoal, setCampaignGoal] = useState("Product Launch")
  const [customGoal, setCustomGoal] = useState("")

  const [selectedSubject, setSelectedSubject] = useState(0)
  const [copiedEmail, setCopiedEmail] = useState(false)
  const [activeTab, setActiveTab] = useState("email")

  useEffect(() => {
    const fetchProfile = async () => {
      const snap = await getDoc(doc(db, "users", user.uid))
      if (snap.exists()) setProfile(snap.data())
    }
    fetchProfile()
  }, [])

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

  return (
    <AppShell>
      <PageHeader
        eyebrow="AI TOOL"
        title="Pitch Generator"
        description="Craft high-conversion outreach messages and customize downloadable media kits."
        action={<UsageBadge usage={usage} />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Panel: Inputs */}
        <div className="lg:col-span-5 card p-6 border border-black/5 bg-gray-50/30">
          <p className="eyebrow mb-4 text-gray-400 font-mono text-[10px] tracking-wider uppercase font-medium">Brand Inputs</p>
          <div className="space-y-4">
            <div>
              <label className="block text-[12px] font-medium text-gray-500 mb-1.5 uppercase font-mono">Brand Name</label>
              <input
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="e.g. Mamaearth, boAt, Nykaa"
                className="input text-[13px] bg-white text-black border border-black/10 rounded focus:border-black/30 outline-none p-2 w-full"
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-gray-500 mb-1.5 uppercase font-mono">Campaign Focus</label>
              <select
                value={campaignGoal}
                onChange={(e) => setCampaignGoal(e.target.value)}
                className="input text-[13px] bg-white text-black border border-black/10 rounded focus:border-black/30 outline-none p-2 w-full"
              >
                <option value="Product Launch">Product Launch</option>
                <option value="Brand Awareness">Brand Awareness</option>
                <option value="Conversion/Promo Code">Conversion/Promo Code</option>
                <option value="User Generated Content (UGC)">User Generated Content (UGC)</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {campaignGoal === "Other" && (
              <div>
                <label className="block text-[12px] font-medium text-gray-500 mb-1.5 uppercase font-mono">Campaign Goal Details</label>
                <input
                  value={customGoal}
                  onChange={(e) => setCustomGoal(e.target.value)}
                  placeholder="e.g. Creator awareness campaign for summer line"
                  className="input text-[13px] bg-white text-black border border-black/10 rounded focus:border-black/30 outline-none p-2 w-full"
                />
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={loading || !brandName.trim()}
              className="btn-primary w-full text-[13px] py-2.5 rounded font-medium text-white transition-opacity bg-[#010120] flex items-center justify-center gap-2"
            >
              <Mail size={14} /> {loading ? "Drafting Pitch..." : "Generate Pitch Details"}
            </button>
          </div>
        </div>

        {/* Right Panel: Pitch email/media-kit tab preview */}
        <div className="lg:col-span-7 space-y-6">
          {loading ? (
            <div className="space-y-4">
              <CardSkeleton height="60px" />
              <CardSkeleton height="280px" />
            </div>
          ) : error ? (
            <div className="card p-5 border border-red-200 bg-red-50 text-red-700 flex items-start gap-3">
              <AlertCircle className="flex-shrink-0 mt-0.5 text-red-500" size={18} />
              <div>
                <p className="font-semibold text-[14px]">Pitching Error</p>
                <p className="text-[13px] mt-1">{error}</p>
              </div>
            </div>
          ) : !result ? (
            <EmptyState
              icon="✉️"
              title="Draft Brand Emails & Kits"
              description="Configure brand name and objectives on the left to generate customized pitches, talking points, and downloadable media kits."
            />
          ) : (
            <div className="space-y-4">
              {/* Tab Navigation */}
              <div className="flex border-b border-black/5 pb-1 gap-2">
                {[
                  { id: "email", label: "Email Pitch", icon: <Mail size={13} /> },
                  { id: "mediakit", label: "Media Kit", icon: <FileText size={13} /> },
                  { id: "talking", label: "Talking Points", icon: <CheckCircle2 size={13} /> },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`flex items-center gap-1.5 px-4 py-2 text-[12px] font-medium transition-all border-b-2 bg-transparent ${
                      activeTab === t.id
                        ? "border-[#010120] text-[#010120]"
                        : "border-transparent text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    {t.icon}
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              {activeTab === "email" && (
                <div className="space-y-4">
                  {/* Subject lines picker */}
                  <div className="card p-4 border border-black/5 bg-gray-50/50 rounded">
                    <span className="text-[10px] font-mono text-gray-400 uppercase font-medium">Select Email Subject</span>
                    <div className="mt-2 space-y-1.5">
                      {result.subjectLines?.map((subj, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedSubject(idx)}
                          className={`w-full text-left text-[12px] p-2 rounded transition-colors border ${
                            selectedSubject === idx
                              ? "bg-white border-black/10 font-medium text-black"
                              : "bg-transparent border-transparent text-gray-500 hover:bg-black/[0.02]"
                          }`}
                        >
                          {subj}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Mock Email UI */}
                  <div className="card border border-black/5 rounded overflow-hidden shadow-sm">
                    {/* Header */}
                    <div className="bg-gray-50 px-5 py-3 border-b border-black/5 text-[11px] text-gray-500 space-y-1">
                      <div><span className="font-semibold">To:</span> Marketing Team &lt;collabs@{brandName.toLowerCase().replace(/\s+/g, "")}.com&gt;</div>
                      <div><span className="font-semibold">Subject:</span> {result.subjectLines?.[selectedSubject]}</div>
                    </div>
                    {/* Body */}
                    <div className="p-6 bg-white relative">
                      <div className="absolute right-4 top-4">
                        <button
                          onClick={() => copyText(result.email, setCopiedEmail)}
                          className="btn-ghost px-2 py-1 text-[11px] border border-black/10 rounded flex items-center gap-1 bg-white hover:bg-gray-50 text-gray-600"
                        >
                          {copiedEmail ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                          {copiedEmail ? "Copied" : "Copy Email"}
                        </button>
                      </div>
                      <div className="text-[13px] text-gray-700 whitespace-pre-wrap leading-relaxed font-sans pt-6">
                        {result.email}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "mediakit" && (
                <div className="space-y-4">
                  {/* Visual mockup of the media kit card */}
                  <div className="card p-6 border border-black/5 rounded bg-gray-50/50 flex flex-col items-center">
                    <p className="eyebrow text-gray-400 font-mono text-[10px] tracking-wider uppercase font-medium mb-6">Media Kit Profile Preview</p>
                    
                    <div className="w-full max-w-[320px] rounded-lg border border-black/10 bg-white p-5 shadow-sm text-black">
                      <div className="flex items-center gap-3 pb-3 border-b border-black/5 mb-4">
                        <div className="w-10 h-10 rounded-full bg-[#010120] text-white flex items-center justify-center font-bold text-sm">
                          {profile?.name?.charAt(0) || "C"}
                        </div>
                        <div>
                          <h4 className="text-[13px] font-semibold text-gray-900">{profile?.name || "Creator Profile"}</h4>
                          <span className="text-[10px] font-mono text-gray-400 uppercase">{profile?.niche || "Niche"}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-center mb-4">
                        <div className="p-2 bg-gray-50 rounded">
                          <div className="text-[9px] font-mono text-gray-400 uppercase">FOLLOWERS</div>
                          <div className="text-sm font-semibold text-[#010120]">
                            {Number(profile?.followers || 0).toLocaleString()}
                          </div>
                        </div>
                        <div className="p-2 bg-gray-50 rounded">
                          <div className="text-[9px] font-mono text-gray-400 uppercase">ENGAGEMENT</div>
                          <div className="text-sm font-semibold text-[#010120]">
                            {profile?.engagementRate || "—"}%
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-[11px] text-gray-600">
                        <div className="flex justify-between">
                          <span>Primary Audience:</span>
                          <span className="font-semibold text-gray-900">{profile?.audienceLocation || "India"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Verified Channels:</span>
                          <span className="font-semibold text-gray-900 uppercase">{profile?.platform || "Instagram"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* PDF download trigger button */}
                  <button
                    onClick={handleDownloadPDF}
                    className="btn-primary w-full justify-center py-2.5 rounded font-medium text-white transition-opacity bg-[#010120] flex items-center gap-2"
                  >
                    <Download size={14} /> Download Media Kit PDF
                  </button>
                </div>
              )}

              {activeTab === "talking" && (
                <div className="space-y-4">
                  <AIResponseCard title="Brand Conversation Strategy">
                    <ul className="space-y-3">
                      {result.talkingPoints?.map((pt, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-[13px] text-gray-600">
                          <span className="text-green-500 font-bold">✓</span>
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </AIResponseCard>

                  {result.redFlags?.length > 0 && (
                    <div className="card p-5 border border-red-100 bg-red-50/15 rounded">
                      <p className="eyebrow text-red-500/70 font-mono text-[10px] tracking-wider uppercase font-medium mb-3">Watch Out Concerns</p>
                      <ul className="space-y-2">
                        {result.redFlags.map((flag, idx) => (
                          <li key={idx} className="text-[12px] text-red-800/80">• {flag}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => { setBrandName(""); setCampaignGoal("Product Launch") }}
                className="btn-secondary w-full py-2 rounded font-medium border border-black/15 text-black hover:bg-black/[0.02] transition-colors flex items-center justify-center gap-1.5"
              >
                <RefreshCw size={12} /> Pitch Another Brand
              </button>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
