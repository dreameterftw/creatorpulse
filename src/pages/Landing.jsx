import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"
import PlatformMarquee from "../components/PlatformMarquee"
import { ArrowRight, DollarSign, Radar, Target, Mail, Sparkles, TrendingUp, Shield, Layers, Plus, Check, Zap } from "lucide-react"

export default function Landing() {
  const navigate = useNavigate()
  const [emailInput, setEmailInput] = useState("")

  const [followersSim, setFollowersSim] = useState(60000)

  const handleGetStarted = (e) => {
    e.preventDefault()
    navigate("/auth")
  }

  // Calculate simulated rates based on interactive slider
  const sponsorRateSim = Math.round(followersSim * 0.3).toLocaleString()
  const aiSuggestedRateSim = Math.round(followersSim * 0.41).toLocaleString()
  const confidenceScoreSim = Math.min(90 + Math.floor(followersSim / 15000), 99)

  return (
    <div className="min-h-screen flex flex-col font-sans relative" style={{ background: "#0a0916" }}>


      {/* Top Navbar */}
      <Navbar />

      {/* ── 1. Hero Section ── */}
      <section 
        className="relative max-w-7xl mx-auto px-6 pt-20 pb-28 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full"
        style={{
          background: "radial-gradient(circle at 75% 25%, rgba(239, 44, 193, 0.14), rgba(139, 92, 246, 0.08), transparent 50%), radial-gradient(circle at 25% 75%, rgba(252, 76, 2, 0.06), transparent 45%), transparent"
        }}
      >

        {/* Left Column */}
        <div className="lg:col-span-7 flex flex-col text-left z-10">
          <h1 className="text-white font-display font-extrabold tracking-tight mb-6 leading-[1.08] text-5xl md:text-6xl lg:text-7xl">
            Get paid early<br />
            price automatically<br />
            <span className="bg-gradient-to-r from-[#00f2fe] via-[#ef2cc1] to-[#fc4c02] bg-clip-text text-transparent">
              all your content.
            </span>
          </h1>

          <p className="text-[16px] text-[#8a89a0] leading-relaxed max-w-xl mb-10">
            CreatorPulse supports creators with automatic rate calculations, powerful gap analysis, 
            instant pitch generation, and revenue simulators. Make sponsorship pricing effortless.
          </p>

          {/* Email input box style */}
          <form onSubmit={handleGetStarted} className="flex items-center w-full max-w-lg bg-[#111026] border border-white/5 rounded-lg p-1.5 mb-12 focus-within:border-[#00f2fe] transition-all">
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="Your creator email address"
              className="bg-transparent border-none text-white text-[14px] px-3.5 focus:outline-none flex-1 placeholder-[#8a89a0]/60"
              required
            />
            <button
              type="submit"
              className="cta-glow-button h-11 min-w-[164px] text-[13px] font-semibold"
            >
              <span>
                Get Started <ArrowRight size={13} />
              </span>
              <div className="hoverEffect" aria-hidden="true">
                <div />
              </div>
            </button>
          </form>

          {/* Trust strip */}
          <div>
            <span className="text-[11px] font-mono tracking-widest text-[#8a89a0]/50 uppercase block mb-4">TRUSTED ON</span>
            <div className="flex flex-wrap gap-8 items-center opacity-65">
              <span className="text-white font-display font-bold text-lg tracking-tight">Instagram</span>
              <span className="text-white font-display font-bold text-lg tracking-tight">YouTube</span>
              <span className="text-white font-display font-bold text-lg tracking-tight">Twitter/X</span>
              <span className="text-white font-display font-bold text-lg tracking-tight">LinkedIn</span>
            </div>
          </div>
        </div>

        {/* Right Column: Overlapping mockup cards + Engagement Ring + Simulator */}
        <div className="lg:col-span-5 relative flex flex-col justify-center items-center h-[560px] lg:h-[640px] z-10">

          {/* ─── Animated Engagement Donut Ring (Background centerpiece) ─── */}
          <div className="absolute top-[28%] left-[10%] -translate-x-1/4 w-[320px] h-[320px] z-0">
            {/* Outer rotating ring */}
            <svg className="w-full h-full animate-[spin_25s_linear_infinite]" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <circle cx="100" cy="100" r="90" fill="none" stroke="url(#ringGrad)" strokeWidth="2" strokeDasharray="120 450" strokeLinecap="round" />
              <defs>
                <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.5" />
                  <stop offset="50%" stopColor="#ef2cc1" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#fc4c02" stopOpacity="0.3" />
                </linearGradient>
              </defs>
            </svg>
            {/* Inner counter-rotating ring */}
            <svg className="absolute inset-0 w-full h-full animate-[spin_18s_linear_infinite_reverse]" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="65" fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="1" />
              <circle cx="100" cy="100" r="65" fill="none" stroke="rgba(239,44,193,0.2)" strokeWidth="1.5" strokeDasharray="80 330" strokeLinecap="round" />
            </svg>
            {/* Center stat */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-3xl font-display font-extrabold text-white">{Math.round(followersSim/1000)}K</p>
              <p className="text-[9px] font-mono text-[#8a89a0] tracking-widest uppercase mt-1">Reach</p>
            </div>
          </div>

          {/* ─── Floating decorative dots ─── */}
          <div className="absolute top-[12%] right-[8%] w-2 h-2 rounded-full bg-[#00f2fe] animate-pulse shadow-[0_0_8px_rgba(0,242,254,0.6)]" />
          <div className="absolute top-[25%] left-[5%] w-1.5 h-1.5 rounded-full bg-[#ef2cc1] animate-pulse shadow-[0_0_6px_rgba(239,44,193,0.5)]" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-[30%] right-[5%] w-2.5 h-2.5 rounded-full bg-[#fc4c02]/70 animate-pulse shadow-[0_0_10px_rgba(252,76,2,0.4)]" style={{ animationDelay: '2s' }} />
          <div className="absolute top-[60%] left-[12%] w-1.5 h-1.5 rounded-full bg-white/30 animate-pulse" style={{ animationDelay: '0.5s' }} />
          <div className="absolute bottom-[18%] left-[30%] w-1 h-1 rounded-full bg-[#00f2fe]/50 animate-pulse" style={{ animationDelay: '3s' }} />

          {/* ─── Card 1: Creator Card (top-left, overlapping the ring) ─── */}
          <div className="absolute top-4 left-0 z-20 w-[250px] h-[155px] rounded-xl bg-gradient-to-br from-[#ef2cc1] to-[#fc4c02] p-5 shadow-[0_8px_32px_rgba(239,44,193,0.25)] flex flex-col justify-between text-white transform -rotate-6 hover:rotate-0 hover:scale-105 transition-all duration-300 cursor-default">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-mono opacity-80 uppercase tracking-widest">CREATOR CARD</p>
                <p className="text-lg font-semibold font-display tracking-tight mt-1">Aryan Rane</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs backdrop-blur-sm">CP</div>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[8px] font-mono opacity-60">SPONSOR RATE</p>
                <p className="text-xl font-bold font-mono">₹{sponsorRateSim}</p>
              </div>
              <span className="text-[10px] font-mono tracking-widest bg-white/10 px-2 py-0.5 rounded-full">VERIFIED</span>
            </div>
          </div>

          {/* ─── Card 2: AI Collaboration (top-right, overlapping the ring) ─── */}
          <div className="absolute top-28 -right-2 z-10 w-[270px] bg-[#111026] border border-white/8 rounded-xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.4)] space-y-3 transform rotate-3 hover:rotate-0 hover:scale-105 transition-all duration-300 text-white cursor-default">
            <div className="flex items-center gap-3 pb-3 border-b border-white/5">
              <div className="w-9 h-9 rounded bg-[#ef2cc1]/10 flex items-center justify-center text-[#ef2cc1]">
                <Sparkles size={16} />
              </div>
              <div>
                <h4 className="text-[12px] font-semibold text-white">Mamaearth Collaboration</h4>
                <p className="text-[10px] text-[#8a89a0] font-mono">Invoice #2026-04</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-[#8a89a0]">AI Suggested Rate</span>
                <span className="font-semibold text-white font-mono">₹{aiSuggestedRateSim}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#8a89a0]">Confidence Score</span>
                <span className="text-green-400 font-mono">{confidenceScoreSim}% (High)</span>
              </div>
            </div>
            <div className="w-full py-2 bg-[#00f2fe] text-[#0a0916] rounded text-center text-xs font-bold select-none">
              Accept Partnership
            </div>
          </div>

          {/* ─── Card 3: Interactive Simulator Slider (bottom, fills the gap) ─── */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[290px] bg-[#111026]/95 border border-white/10 rounded-xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.4)] text-white backdrop-blur-md hover:border-[#ef2cc1]/20 transition-all duration-300">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-mono text-[#8a89a0] tracking-wider uppercase font-semibold">Simulated Reach</span>
              <span className="text-xs font-bold text-[#00f2fe] font-mono">{(followersSim).toLocaleString()}</span>
            </div>
            <input 
              type="range" 
              min="10000" 
              max="250000" 
              step="5000"
              value={followersSim} 
              onChange={(e) => setFollowersSim(Number(e.target.value))}
              className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#ef2cc1]"
            />
            <div className="flex justify-between text-[8px] font-mono text-[#8a89a0]/50 mt-2">
              <span>10K</span>
              <span>50K</span>
              <span>100K</span>
              <span>250K</span>
            </div>
            {/* Mini live stats row */}
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/5">
              <div className="flex-1 text-center">
                <p className="text-[10px] text-[#8a89a0] font-mono">Rate</p>
                <p className="text-xs font-bold text-white font-mono">₹{sponsorRateSim}</p>
              </div>
              <div className="w-px h-6 bg-white/10" />
              <div className="flex-1 text-center">
                <p className="text-[10px] text-[#8a89a0] font-mono">AI Rate</p>
                <p className="text-xs font-bold text-[#ef2cc1] font-mono">₹{aiSuggestedRateSim}</p>
              </div>
              <div className="w-px h-6 bg-white/10" />
              <div className="flex-1 text-center">
                <p className="text-[10px] text-[#8a89a0] font-mono">Score</p>
                <p className="text-xs font-bold text-green-400 font-mono">{confidenceScoreSim}%</p>
              </div>
            </div>
          </div>

          {/* Decorative glowing backdrops */}
          <div className="absolute w-80 h-80 rounded-full bg-[#ef2cc1]/8 blur-3xl -z-10 top-[15%] left-[10%]" />
          <div className="absolute w-64 h-64 rounded-full bg-[#00f2fe]/8 blur-3xl -z-10 bottom-[20%] right-[5%]" />
          <div className="absolute w-48 h-48 rounded-full bg-[#fc4c02]/5 blur-3xl -z-10 top-[50%] right-[20%]" />
        </div>
      </section>

      {/* ── Platform Marquee ── */}
      <PlatformMarquee />

      {/* ── 2. Feature Section 1 (Scale Experience) ── */}
      <section className="bg-white py-24 px-6 text-[#0a0916]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end mb-16">
            <div>
              <span className="text-[11px] font-mono font-semibold tracking-wider text-[#ef2cc1] uppercase">CREATOR ENGINE</span>
              <h2 className="text-4xl font-display font-extrabold tracking-tight mt-3 text-[#0a0916]">
                Experience that grows<br />with your channel scale.
              </h2>
            </div>
            <p className="text-base text-gray-500 max-w-md leading-relaxed">
              CreatorPulse provides an advanced analytics operating system that evaluates your audience demographics, prices deliverables, and handles brand collaborations seamlessly.
            </p>
          </div>

          {/* 3 columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-lg bg-[#ef2cc1]/10 flex items-center justify-center text-[#ef2cc1]">
                <DollarSign size={20} />
              </div>
              <h3 className="text-[17px] font-semibold text-[#0a0916]">Fair Pricing</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Generate highly accurate, data-justified rate cards. Never wonder what to charge brands again.
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-lg bg-[#00f2fe]/10 flex items-center justify-center text-[#00f2fe]">
                <Radar size={20} />
              </div>
              <h3 className="text-[17px] font-semibold text-[#0a0916]">Untapped Revenue</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Identify gaps in your monetization streams and unlock affiliate, UGC, or consulting channels.
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-lg bg-[#fc4c02]/10 flex items-center justify-center text-[#fc4c02]">
                <Target size={20} />
              </div>
              <h3 className="text-[17px] font-semibold text-[#0a0916]">Unmatched Brand Alignment</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Evaluate your audience fit against brand demographics using our multi-dimension Fit Score.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Why Prefer CreatorPulse (Grid Mockups) ── */}
      <section className="bg-[#0f0e26] py-24 px-6 text-white border-t border-b border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[11px] font-mono tracking-widest text-[#00f2fe] uppercase">WHY US</span>
            <h2 className="text-3xl md:text-4xl font-display font-extrabold tracking-tight mt-2">
              Why professional creators prefer CreatorPulse
            </h2>
          </div>

          {/* Grid blocks */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Box 1 (Left): Stat block */}
            <div className="lg:col-span-5 card p-8 border border-white/5 bg-[#141332] flex flex-col justify-between rounded-xl">
              <div>
                <h3 className="text-5xl font-display font-extrabold text-[#00f2fe]">Day 1</h3>
                <p className="text-base font-semibold mt-4">We're just getting started — and we want you here from the beginning.</p>
              </div>
              <p className="text-xs text-[#8a89a0] mt-8 leading-relaxed">
                CreatorPulse is built by creators who got tired of guessing what to charge. We're not a big corp — we're a small team that genuinely cares about helping you earn what you deserve.
              </p>
            </div>

            {/* Box 2 (Right): Growth simulated graph */}
            <div className="lg:col-span-7 card p-8 border border-white/5 bg-[#141332] rounded-xl flex flex-col justify-between">
              <div>
                <h4 className="text-lg font-semibold mb-2">Simulate Earning Growth Potential</h4>
                <p className="text-sm text-[#8a89a0] mb-6">See how building engagement can exponentially increase post rates.</p>
              </div>
              {/* Graphic line chart mockup */}
              <div className="bg-[#0a0916] border border-white/5 rounded-lg p-6 flex flex-col justify-between">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-mono text-[#8a89a0]">EARNINGS SUMMARY (6 MONTHS)</span>
                  <span className="text-xs font-semibold text-green-400">₹45,000 → ₹1,20,000</span>
                </div>
                <div className="flex items-end gap-1.5 h-24 pt-2">
                  {[20, 25, 30, 48, 62, 85, 100].map((h, idx) => (
                    <div key={idx} className="flex-1 flex flex-col justify-end h-full">
                      <div
                        className="w-full rounded-t-sm bg-gradient-to-t from-[#ef2cc1] to-[#00f2fe]"
                        style={{ height: `${h}%` }}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-[9px] font-mono text-[#8a89a0]/40 mt-3">
                  <span>JAN</span>
                  <span>FEB</span>
                  <span>MAR</span>
                  <span>APR</span>
                  <span>MAY</span>
                  <span>JUN</span>
                  <span>JUL</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Numbered 3-Step Section ── */}
      <section className="bg-[#0a0916] py-24 px-6 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[11px] font-mono tracking-widest text-[#fc4c02] uppercase font-medium">PROCESS</span>
            <h2 className="text-3xl md:text-4xl font-display font-extrabold tracking-tight mt-2 max-w-2xl mx-auto leading-tight">
              Maximize your deal revenue with a dashboard built to convert.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { num: "1", title: "Verify Your Profile", desc: "Connect or input your channel stats to verify actual views, niche dynamics, and follower counts." },
              { num: "2", title: "Analyze The Gaps", desc: "Let our AI audit your monetization channels and highlight what sponsored streams you are missing." },
              { num: "3", title: "Download Pitch Media Kits", desc: "Instantly draft customized brand outreach proposals and download PDF media kits to close deals." },
            ].map((step, idx) => (
              <div key={idx} className="card p-8 border border-white/5 bg-[#111026] rounded-xl flex flex-col gap-6">
                <span className="text-5xl font-display font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#00f2fe] to-[#ef2cc1]">
                  {step.num}
                </span>
                <div>
                  <h4 className="text-base font-semibold text-white mb-2">{step.title}</h4>
                  <p className="text-xs text-[#8a89a0] leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. Stats Section ── */}
      <section className="bg-white py-24 px-6 text-[#0a0916] border-t border-black/5">
        <div className="max-w-6xl mx-auto text-center">
          <span className="text-[11px] font-mono font-semibold tracking-wider text-[#ef2cc1] uppercase">OUR IMPACT</span>
          <h2 className="text-3xl md:text-4xl font-display font-extrabold tracking-tight mt-3 mb-16">
            The tools we wish we had starting out.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <p className="text-5xl font-display font-extrabold text-[#0a0916]">Free</p>
              <p className="text-sm font-semibold text-[#ef2cc1] mt-2">No credit card, no catch</p>
            </div>
            <div>
              <p className="text-5xl font-display font-extrabold text-[#0a0916]">5 tools</p>
              <p className="text-sm font-semibold text-[#00f2fe] mt-2">All AI-powered, all in one place</p>
            </div>
            <div>
              <p className="text-5xl font-display font-extrabold text-[#0a0916]">Yours</p>
              <p className="text-sm font-semibold text-[#fc4c02] mt-2">Your data stays yours, always</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. Pricing Section ── */}
      <section id="pricing" className="bg-[#0a0916] py-24 px-6 text-white border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[11px] font-mono tracking-widest text-[#00f2fe] uppercase">PRICING</span>
            <h2 className="text-3xl md:text-4xl font-display font-extrabold tracking-tight mt-2">
              Simple, honest pricing.
            </h2>
            <p className="text-[15px] text-[#8a89a0] mt-4 max-w-xl mx-auto leading-relaxed">
              The entire stack runs on free-tier infrastructure. Zero fixed server costs at launch.
              We’re freemium — and we’re proud of it.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">

            {/* Free Tier */}
            <div className="rounded-2xl p-8 flex flex-col gap-6 relative overflow-hidden"
              style={{ background: "#111026", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div>
                <span className="text-[11px] font-mono tracking-widest uppercase text-[#8a89a0]">FREE FOREVER</span>
                <div className="flex items-end gap-2 mt-2">
                  <span className="text-5xl font-display font-extrabold text-white">₹0</span>
                  <span className="text-[#8a89a0] text-sm mb-2">/ month</span>
                </div>
                <p className="text-[13px] text-[#8a89a0] mt-3 leading-relaxed">
                  Full access to all five AI tools — enough to show you exactly what you’re missing before we ask for anything.
                </p>
              </div>
              <ul className="space-y-3 flex-1">
                {[
                  "Rate Calculator — AI-justified sponsor rates",
                  "Pitch Generator — personalized outbound drafts",
                  "Brand Fit Score — multi-dimension audience match",
                  "What-If Simulator — model growth & income",
                  "Gap Analyzer — identify missing revenue streams",
                  "10 AI calls per day",
                ].map((feat) => (
                  <li key={feat} className="flex items-start gap-3 text-[13px] text-[#8a89a0]">
                    <Check size={14} className="flex-shrink-0 mt-0.5" style={{ color: "#00f2fe" }} />
                    {feat}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate("/auth")}
                className="w-full py-3 rounded-xl text-[13px] font-semibold transition-all"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "white" }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = "rgba(0,242,254,0.4)"}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"}
              >
                Get Started Free
              </button>
            </div>

            {/* Pro Tier */}
            <div className="rounded-2xl p-8 flex flex-col gap-6 relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #141332 0%, #1a1040 100%)",
                border: "1px solid rgba(239,44,193,0.35)",
                boxShadow: "0 0 40px rgba(239,44,193,0.08)",
              }}>
              {/* Popular badge */}
              <div className="absolute top-5 right-5">
                <span className="text-[10px] font-mono font-semibold tracking-widest uppercase px-2.5 py-1 rounded-full"
                  style={{ background: "rgba(239,44,193,0.15)", color: "#ef2cc1", border: "1px solid rgba(239,44,193,0.3)" }}>
                  MOST VALUE
                </span>
              </div>

              <div>
                <span className="text-[11px] font-mono tracking-widest uppercase" style={{ color: "#ef2cc1" }}>PRO</span>
                <div className="flex items-end gap-2 mt-2">
                  <span className="text-5xl font-display font-extrabold text-white">₹399</span>
                  <span className="text-[#8a89a0] text-sm mb-2">/ month</span>
                </div>
                <p className="text-[13px] text-[#8a89a0] mt-3 leading-relaxed">
                  Less than what a creator loses on a single underpriced deal. Unlocks unlimited calls, media kits, and brand CRM.
                </p>
              </div>
              <ul className="space-y-3 flex-1">
                {[
                  "Everything in Free",
                  "Unlimited AI calls per day",
                  "PDF media kit downloads",
                  "Brand outreach CRM",
                  "Priority AI responses",
                  "Early access to new tools",
                ].map((feat, i) => (
                  <li key={feat} className="flex items-start gap-3 text-[13px] text-white">
                    <Check size={14} className="flex-shrink-0 mt-0.5" style={{ color: i === 0 ? "#8a89a0" : "#ef2cc1" }} />
                    <span style={{ color: i === 0 ? "#8a89a0" : "white" }}>{feat}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate("/auth")}
                className="cta-glow-button w-full py-3 text-[13px] font-semibold"
              >
                <span className="flex items-center justify-center gap-2">
                  <Zap size={14} />
                  Upgrade to Pro
                </span>
                <div className="hoverEffect" aria-hidden="true"><div /></div>
              </button>
            </div>
          </div>

          {/* Footnote */}
          <p className="text-center text-[12px] text-[#8a89a0]/50 mt-10 font-mono">
            No contracts. Cancel anytime. Prices in INR, built for the Indian creator market.
          </p>
        </div>
      </section>

      {/* ── 7. Large CTA Card Section ── */}
      <section className="bg-[#0a0916] py-24 px-6 text-white border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="card p-10 md:p-14 rounded-2xl bg-gradient-to-br from-[#111026] via-[#111026] to-[#ef2cc1]/15 border border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 shadow-2xl">
            <div className="text-left max-w-lg">
              <span className="text-[10px] font-mono tracking-widest text-[#00f2fe] uppercase">TRY IT NOW</span>
              <h3 className="text-3xl font-display font-extrabold tracking-tight mt-2 text-white leading-tight">
                Ready to level up your sponsorship pricing process?
              </h3>
              <p className="text-xs text-[#8a89a0] mt-3">
                Unlock immediate rate recommendations, pitch templates, and growth simulations.
              </p>
            </div>
            <div className="flex flex-wrap gap-4 flex-shrink-0">
              <button
                onClick={() => navigate("/auth")}
                className="cta-glow-button h-11 min-w-[164px] text-[13px] font-semibold"
              >
                <span>Get Started Now</span>
                <div className="hoverEffect" aria-hidden="true">
                  <div />
                </div>
              </button>
              <button
                onClick={() => navigate("/auth")}
                className="btn-secondary hover-glow-border-button rounded-md py-3 px-6 text-[13px] font-semibold text-[#8a89a0] border border-white/10 hover:text-white"
              >
                Learn More →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. Footer ── */}
      <footer className="bg-[#0a0916] border-t border-white/5 py-16 px-6 text-[#8a89a0]">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          {/* Logo column */}
          <div className="col-span-2 space-y-4">
            <span className="text-white font-display font-bold text-lg tracking-tight">CreatorPulse</span>
            <p className="text-xs leading-relaxed text-[#8a89a0]/60 max-w-xs">
              The professional analytics operating system for content creators in India. Secure your sponsorship deals with high confidence.
            </p>
          </div>
          {/* Links columns */}
          <div>
            <h5 className="text-white text-xs font-semibold uppercase tracking-wider mb-4">Solutions</h5>
            <ul className="space-y-2 text-xs">
              <li>Rate Card</li>
              <li>Gap Analysis</li>
              <li>Outreach Pitch</li>
              <li>Growth Simulation</li>
            </ul>
          </div>
          <div>
            <h5 className="text-white text-xs font-semibold uppercase tracking-wider mb-4">Company</h5>
            <ul className="space-y-2 text-xs">
              <li>About Us</li>
              <li>Careers</li>
              <li>Privacy Policy</li>
              <li>Terms</li>
            </ul>
          </div>
          <div>
            <h5 className="text-white text-xs font-semibold uppercase tracking-wider mb-4">Resources</h5>
            <ul className="space-y-2 text-xs">
              <li>Blog</li>
              <li>Help Center</li>
              <li>Guidelines</li>
              <li>API Docs</li>
            </ul>
          </div>
          <div>
            <h5 className="text-white text-xs font-semibold uppercase tracking-wider mb-4">Social</h5>
            <div className="flex gap-3 text-white">
              {/* Simple text labels or symbols */}
              <span className="text-xs hover:text-[#00f2fe] cursor-pointer">Twitter</span>
              <span className="text-xs hover:text-[#ef2cc1] cursor-pointer">LinkedIn</span>
            </div>
          </div>
        </div>
        
        <div className="max-w-6xl mx-auto border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between text-xs text-[#8a89a0]/40">
          <p>© 2026 CreatorPulse. All rights reserved.</p>
          <p>Built for Indian creators.</p>
        </div>
      </footer>
    </div>
  )
}
