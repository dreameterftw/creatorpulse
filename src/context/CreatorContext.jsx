/**
 * CreatorContext — single source of truth for profile + cross-tool insights.
 *
 * What it provides:
 * - profile:       Firestore user document (live, refreshes on edit)
 * - refreshProfile: re-fetches from Firestore (called after edit)
 * - crossContext:  a compact string injected into every AI prompt giving
 *                  the model context about what the user has already done
 *                  across tools this session
 * - updateCrossContext: called by each hook after a successful AI result
 */

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "../firebase/config"
import { useAuth } from "./AuthContext"
import { getHistory } from "../utils/history"
import { getGrowthHistory, calcGrowthDelta } from "../utils/growthTracker"

const CreatorContext = createContext(null)

export function CreatorProvider({ children }) {
  const { user } = useAuth()
  const [profile,        setProfile]        = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [growthHistory,  setGrowthHistory]  = useState([])
  const [growthDelta,    setGrowthDelta]    = useState(null)
  // Session insights — what each tool found this session
  const [sessionInsights, setSessionInsights] = useState({})

  // ── Load profile once on mount ──
  const fetchProfile = useCallback(async () => {
    if (!user) return
    setProfileLoading(true)
    const snap = await getDoc(doc(db, "users", user.uid))
    if (snap.exists()) {
      const data = snap.data()
      setProfile(data)
      // Load growth history for primary platform
      const platform = data.platforms?.[0] || data.platform
      if (platform) {
        const history = await getGrowthHistory(user.uid, platform, 8)
        setGrowthHistory(history)
        setGrowthDelta(calcGrowthDelta(history))
      }
    }
    setProfileLoading(false)
  }, [user])

  useEffect(() => { fetchProfile() }, [fetchProfile])

  // ── Save profile update + refresh local state + reload growth ──
  const saveProfile = async (updates) => {
    if (!user) return
    const followers      = Math.min(Math.max(Number(updates.followers) || 0, 0), 1_000_000_000)
    const engagementRate = Math.min(Math.max(parseFloat(updates.engagementRate) || 0, 0), 100)
    const monthlyIncome  = Math.min(Math.max(Number(updates.monthlyIncome) || 0, 0), 100_000_000)
    const payload        = { ...updates, followers, engagementRate, monthlyIncome, updatedAt: new Date() }
    await updateDoc(doc(db, "users", user.uid), payload)
    setProfile(p => ({ ...p, ...payload }))
  }

  // ── Record what a tool found this session ──
  const updateSessionInsight = useCallback((tool, summary) => {
    setSessionInsights(prev => ({ ...prev, [tool]: summary }))
  }, [])

  // ── Refresh growth data after a new entry is saved ──
  const refreshGrowth = useCallback(async (platform) => {
    if (!user) return
    const history = await getGrowthHistory(user.uid, platform, 8)
    setGrowthHistory(history)
    const delta = calcGrowthDelta(history)
    setGrowthDelta(delta)
    if (delta) {
      const trend = delta.delta > 0
        ? `gaining ${delta.delta.toLocaleString()} followers/week (+${delta.pct}%)`
        : delta.delta < 0
        ? `losing ${Math.abs(delta.delta).toLocaleString()} followers/week (${delta.pct}%)`
        : "flat growth this week"
      updateSessionInsight("growth", `${trend}, now at ${delta.latest.followers.toLocaleString()} followers on ${platform}`)
    }
  }, [user, updateSessionInsight])

  // ── Build cross-context string injected into every prompt ──
  const buildCrossContext = useCallback(() => {
    const lines = []

    // Growth trend
    if (growthDelta) {
      const trend = growthDelta.delta > 0
        ? `gaining ${growthDelta.delta.toLocaleString()} followers/week (+${growthDelta.pct}%)`
        : growthDelta.delta < 0
        ? `losing ${Math.abs(growthDelta.delta).toLocaleString()} followers/week (${growthDelta.pct}%)`
        : "follower count is flat this week"
      lines.push(`Growth trend: ${trend}, currently at ${growthDelta.latest.followers.toLocaleString()} followers`)
    }

    // Session insights (live this session)
    if (sessionInsights.rate_calculator) {
      lines.push(`Rate analysis (this session): ${sessionInsights.rate_calculator}`)
    }
    if (sessionInsights.gap_radar) {
      lines.push(`Monetization gaps (this session): ${sessionInsights.gap_radar}`)
    }
    if (sessionInsights.fit_score) {
      lines.push(`Brand fit (this session): ${sessionInsights.fit_score}`)
    }
    if (sessionInsights.what_if_simulator) {
      lines.push(`Growth simulation (this session): ${sessionInsights.what_if_simulator}`)
    }
    if (sessionInsights.pitch_generator) {
      lines.push(`Recent pitch (this session): ${sessionInsights.pitch_generator}`)
    }
    if (sessionInsights.growth) {
      lines.push(`Live growth update: ${sessionInsights.growth}`)
    }

    // Enrich with latest history if no session data
    const tools = ["rate_calculator", "gap_radar", "fit_score", "pitch_generator"]
    for (const t of tools) {
      if (sessionInsights[t]) continue  // already have session data
      const h = getHistory(t)
      if (h.length > 0) {
        const latest = h[0]
        if (t === "rate_calculator" && latest.result?.marketPosition) {
          lines.push(`Previous rate analysis: creator is a ${latest.result.marketPosition} creator with ${latest.result.engagementTier} engagement`)
        }
        if (t === "gap_radar" && latest.result?.overallScore != null) {
          lines.push(`Previous gap analysis: monetization score ${latest.result.overallScore}/100, top opportunity: ${latest.result.topOpportunities?.[0]?.stream || "unknown"}`)
        }
        if (t === "fit_score" && latest.brandName) {
          lines.push(`Previously evaluated: ${latest.brandName} brand fit`)
        }
        if (t === "pitch_generator" && latest.brandName) {
          lines.push(`Previously pitched: ${latest.brandName}`)
        }
      }
    }

    if (lines.length === 0) return ""
    return `\n\nCREATOR SESSION CONTEXT (use this to give more tailored advice):\n${lines.map(l => `- ${l}`).join("\n")}`
  }, [sessionInsights, growthDelta])

  return (
    <CreatorContext.Provider value={{
      profile,
      profileLoading,
      refreshProfile: fetchProfile,
      saveProfile,
      growthHistory,
      growthDelta,
      refreshGrowth,
      updateSessionInsight,
      buildCrossContext,
    }}>
      {children}
    </CreatorContext.Provider>
  )
}

export function useCreator() {
  const ctx = useContext(CreatorContext)
  if (!ctx) throw new Error("useCreator must be used inside CreatorProvider")
  return ctx
}
