<div align="center">

# ⚡ CreatorPulse

**AI-powered creator intelligence platform for Indian content creators**

Know your worth. Find missing income. Pitch brands like a pro. Track your growth.

[![Live Demo](https://img.shields.io/badge/Live-creatorpulse--gg.web.app-blue?style=flat-square)](https://creatorpulse-gg.web.app)
[![GitHub](https://img.shields.io/badge/GitHub-dreameterftw%2Fcreatorpulse-black?style=flat-square&logo=github)](https://github.com/dreameterftw/creatorpulse)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

</div>

---

## 👥 Team

| Name | Id |
|------|------|
| **Aryan Rane** | [@dreameterftw](https://github.com/dreameterftw) |
| **Manvi Gupta** | [@manviofficial1212-gif](https://github.com/manviofficial1212-gif) | Co-founder

---

## 🌟 What is CreatorPulse?

CreatorPulse is a full-stack SaaS platform that gives Indian content creators five AI-powered tools to take control of their creator business — all in one place. No guesswork. No generic advice. Everything is personalised to your actual profile.

The platform is built around a **context-aware AI system** — every tool knows what the others found. If your Rate Calculator says you're a "micro creator with good engagement", your Pitch Generator, Gap Radar, and What-If Simulator all factor that in automatically.

---

## 🚀 Five AI Tools

### 💰 Rate Calculator
Generate a justified rate card for 6 types of brand deals — sponsored posts, reels, story sets, YouTube integrations, brand ambassador, and UGC-only. Rates are benchmarked against real Indian creator economy data, not generic formulas.

- Custom niche picker with free-text input
- Animated rate counter with negotiation buffer slider (+0% to +40%)
- Copy-rate button that copies "My rate for a sponsored post is ₹X" to clipboard
- Confidence score and engagement tier badge

### 📡 Monetization Gap Radar
Audit your current income streams against 8 possible monetization channels and find exactly what you're leaving on the table.

- Revenue wheel visualisation
- Ranked opportunity list with monthly potential estimates and time-to-first-earning
- Top 3 missed streams with actionable first steps

### 🎯 Brand-Creator Fit Score
Check how well you match a brand across 5 dimensions before spending time on a pitch.

- Animated score ring (0–100) with eased counter
- 5 expandable dimension cards: Audience Match, Niche Relevance, Platform Alignment, Engagement Quality, Brand Safety
- Should Pitch / Skip verdict with specific pitch angle
- Negotiation tips, deal breakers, similar brands (clickable to re-analyze)

### ✉️ Pitch Generator
Type a brand name and a campaign goal — get a complete outreach package in seconds.

- Personalized pitch email (200–250 words)
- 3 subject line options (curiosity / value / direct)
- Follow-up email for day 5
- 2 collaboration ideas with format and reasoning
- Downloadable PDF media kit (lazy-loaded, no bloat on initial page)

### 🔮 What-If Simulator
Model growth scenarios with sliders and see the projected income impact.

- Followers and engagement rate sliders with live counter animation
- Platform, niche, and posting frequency selectors
- Before/After comparison cards
- Bar chart projection with hover tooltips showing exact ₹ values
- Feasibility assessment and concrete action plan

---

## 📈 Growth Tracker

Track your follower growth on a weekly basis — logged manually by the creator for each platform.

- Select platform, enter follower count + engagement rate
- Data stored in Firestore under `users/{uid}/growth/{platform}_{weekKey}`
- Line chart showing up to 8 weeks of trend data
- Week-over-week delta badge (green/red/grey) with % change
- **AI-powered suggestions** when growth is flat or declining — 3 specific tips with severity rating
- Growth trend is injected into the cross-tool AI context so all tools give growth-aware advice

---

## 🧠 Cross-Tool AI Context System

Every AI call is enriched with context from what the user has done in the current session and in recent history:

```
CREATOR SESSION CONTEXT:
- Growth trend: gaining 1,200 followers/week (+2.5%), now at 48,500 on Instagram
- Rate analysis: micro creator, good engagement, suggested post rate ₹8,500
- Gap analysis: monetization score 42/100, leaving ₹26,000/mo on table, top: ugc
- Brand fit (this session): boAt scored 78/100 (Strong Fit), should pitch
```

This is handled by `CreatorContext` — a React context that:
1. Loads the Firestore profile **once** and shares it across all pages (eliminates 5 duplicate reads per session)
2. Loads growth history and calculates week-over-week delta
3. Tracks session insights as tools are used
4. Builds a `crossContext` string injected into every Groq prompt
5. Falls back to localStorage history if no live session data exists

---

## 🎨 Design System

| Element | Value |
|---------|-------|
| Background | `#0a0916` |
| Dark surface | `#111026` |
| Accent gradient | `#fc4c02 → #ef2cc1 → #bdbbff` |
| Primary font | Inter |
| Monospace font | JetBrains Mono |

### UI Features
- **Landing page** — dark hero with animated creator card mockup, interactive follower slider, platform marquee (smooth infinite scroll), feature sections alternating dark/white
- **Auth pages** — split layout with gradient headline + trust points + conic-gradient rotating border on submit button
- **Onboarding** — 3-step dark wizard with gradient progress, pill selectors, custom niche input
- **Dashboard** — animated hero card with negotiation buffer slider, copy-rate button, bar chart with tooltips, income gap meter, growth tracker, edit profile panel
- **Edit Profile** — slide-in panel with multi-platform + multi-niche selection, custom niche text input
- **Tool pages** — collapsible ToolExplainer on every page, History panel (up to 10 entries per tool), UsageBadge showing remaining AI calls
- **Sidebar** — gradient active indicator, settings gear spins on hover
- **Bell** — SVG ring animation on hover, functional notification dropdown

---

## 🛠 Tech Stack

### Frontend
- **React 18** + **Vite 5** — manual chunk splitting (Firebase, Recharts, React vendor)
- **Tailwind CSS** + CSS custom properties design tokens
- **React Router v6** — protected routes, email verification gate
- **Recharts** — radar charts, line charts, bar charts with custom tooltips
- **Lucide React** — icon system
- **jsPDF + html2canvas** — lazy-loaded via dynamic `import()` for PDF media kit

### Backend & AI
- **Groq API** (`llama-3.3-70b-versatile`) — all 5 AI tools + growth suggestions
- **Cloudflare Workers** — serverless proxy (`index.standalone.js`, no npm deps):
  - Firebase Auth JWT verification via Google JWKS
  - Firebase App Check JWT verification
  - Email verification enforcement
  - KV-based rate limiting (30 calls/day per user)
  - Audit logging (uid + feature + estimated tokens, 30-day TTL)
- **Cloudflare KV** — rate limits + audit logs

### Auth & Database
- **Firebase Auth** — email/password + Google OAuth + email verification gate
- **Firestore** — user profiles + growth history subcollection
- **Firebase App Check** (reCAPTCHA v3)
- **Firebase Hosting** — production at `creatorpulse-gg.web.app`

### CI/CD
- **GitHub Actions** — auto-deploy on push to `main` via `FirebaseExtended/action-hosting-deploy`

---

## 🔒 Security Architecture

| Layer | What it protects |
|-------|-----------------|
| **Firestore Rules** | Field-type validation, numeric bounds, immutable email, growth subcollection bounds, default-deny on all other collections |
| **App Check (reCAPTCHA v3)** | Blocks non-app requests to Firestore entirely |
| **Worker: Firebase Auth JWT** | Every AI call requires a valid Firebase ID token (verified via Google JWKS — no npm deps) |
| **Worker: Email Verified** | Unverified email accounts cannot reach Groq |
| **Worker: App Check JWT** | Double-verifies request came from the real frontend (not a script with a stolen auth token) |
| **Worker: KV Rate Limit** | 30 AI calls/day per `uid`, server-enforced, resets after 25h (timezone-safe TTL) |
| **Worker: Audit Logs** | Every call logged with uid, feature, prompt lengths, estimated tokens, 30-day expiry |
| **Input Sanitization** | `sanitizeInput()` strips `<>{}[]\\` and basic prompt injection keywords before interpolation |
| **Lazy PDF Loading** | jsPDF + html2canvas only load when user clicks Download — not in initial bundle |
| **Account Deletion** | Firestore doc deleted first (while auth is valid), then Auth account — no orphaned data |

---

## 📁 Project Structure

```
creatorpulse/
├── .github/workflows/
│   └── deploy.yml              # GitHub Actions: build + Firebase deploy on push
├── src/
│   ├── context/
│   │   ├── AuthContext.jsx     # Firebase auth state
│   │   └── CreatorContext.jsx  # Profile + growth + cross-tool session insights
│   ├── components/
│   │   ├── AppShell.jsx        # Sidebar + scrollable main layout
│   │   ├── Sidebar.jsx         # Dark nav, gradient active indicator, gear spin
│   │   ├── Navbar.jsx          # Bell + ring animation + notification dropdown
│   │   ├── PageHeader.jsx      # Eyebrow / white title / subtitle
│   │   ├── ToolExplainer.jsx   # Collapsible "how this works" per tool
│   │   ├── HistoryPanel.jsx    # Slide-in history (localStorage, 10 per tool)
│   │   ├── GrowthTracker.jsx   # Weekly follower logging + line chart + AI tips
│   │   ├── PlatformMarquee.jsx # Infinite scroll platform strip (landing page)
│   │   ├── KpiCard.jsx
│   │   ├── InsightCard.jsx
│   │   ├── ToolCard.jsx
│   │   ├── AIResponseCard.jsx
│   │   ├── UsageBadge.jsx
│   │   ├── LoadingSkeleton.jsx
│   │   ├── EmptyState.jsx
│   │   └── ErrorBoundary.jsx
│   ├── pages/
│   │   ├── Landing.jsx         # Dark hero + marquee + feature sections
│   │   ├── Auth.jsx            # Split layout + conic border animation
│   │   ├── VerifyEmail.jsx     # Split layout with security explainer
│   │   ├── Onboarding.jsx      # 3-step dark wizard
│   │   ├── Dashboard.jsx       # Hero card + growth tracker + edit profile
│   │   ├── RateCalculator.jsx  # Custom niche picker + animated rates
│   │   ├── GapRadar.jsx        # Revenue wheel + gap meter
│   │   ├── FitScore.jsx        # Score ring + expandable dimensions
│   │   ├── PitchGenerator.jsx  # Tabbed email + PDF download
│   │   ├── WhatIfSimulator.jsx # Sliders + bar chart projection
│   │   └── AccountSettings.jsx # Deletion with re-auth flow
│   ├── hooks/
│   │   ├── useRateCalculator.js
│   │   ├── useGapAnalyzer.js
│   │   ├── usePitchGenerator.js
│   │   ├── useFitScore.js
│   │   └── useWhatIfSimulator.js
│   ├── utils/
│   │   ├── groq.js             # Central AI call + proxy routing + rate limit
│   │   ├── history.js          # localStorage per-tool history (10 entries max)
│   │   ├── growthTracker.js    # Firestore growth subcollection utilities
│   │   ├── generateMediaKit.js # jsPDF builder (dynamic import)
│   │   ├── sanitize.js         # Prompt injection protection
│   │   └── rateLimit.js        # Dev fallback Firestore rate limit
│   ├── firebase/
│   │   ├── config.js
│   │   └── appCheck.js
│   └── styles/tokens.css       # CSS design tokens
├── groq-proxy/
│   └── src/
│       └── index.standalone.js # Self-contained Cloudflare Worker (no npm)
├── scripts/
│   └── audit-summary.js        # Local ops: inspect KV audit logs
├── firestore.rules             # Full production security rules
├── firestore.indexes.json
├── firebase.json
└── .env.example
```

---

## ⚙️ Environment Variables

```env
# Firebase (all public — safe in frontend)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# AI Proxy
VITE_GROQ_API_KEY=           # Dev only — direct Groq fallback (never in production bundle)
VITE_GROQ_PROXY_URL=         # Cloudflare Worker URL — leave empty for local dev

# App Check
VITE_RECAPTCHA_SITE_KEY=     # reCAPTCHA v3 site key (public — safe to expose)
VITE_APPCHECK_DEBUG_TOKEN=   # Firebase App Check debug token (local dev only)
```

---

## 🏃 Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Copy env template and fill in your keys
cp .env.example .env

# 3. Start dev server
npm run dev
# → http://localhost:5173
```

Leave `VITE_GROQ_PROXY_URL` empty locally — the app falls back to direct Groq calls using `VITE_GROQ_API_KEY`.

---

## 🚢 Deployment

### Option A — GitHub Actions (recommended, auto-deploys on push)

1. Firebase Console → Project Settings → Service Accounts → Generate new private key
2. Add secrets to [GitHub repo settings](https://github.com/dreameterftw/creatorpulse/settings/secrets/actions):
   - `FIREBASE_SERVICE_ACCOUNT` — paste the full service account JSON
   - All `VITE_*` env vars from `.env.example`
3. Push to `main` → GitHub Actions builds and deploys automatically

### Option B — Manual

```bash
npm run build
firebase deploy              # deploys hosting + firestore rules
```

### Cloudflare Worker

Paste `groq-proxy/src/index.standalone.js` into the Cloudflare dashboard editor (Workers & Pages → Edit Code).

**Secrets** (Settings → Variables → Secrets):
```
GROQ_API_KEY
FIREBASE_PROJECT_ID        = creatorpulse-gg
FIREBASE_PROJECT_NUMBER    = 518661198406
```

**Environment Variables:**
```
ALLOWED_ORIGIN   = https://creatorpulse-gg.web.app
DAILY_LIMIT      = 30
```

**KV Binding:**
```
Variable name: RATE_LIMIT_KV
Namespace ID:  18b8c3b1ff004e1ea56ee522b0762342
```

---

## 📊 Live URLs

| Service | URL |
|---------|-----|
| Web App | https://creatorpulse-gg.web.app |
| Groq Proxy | https://groq-proxy.dr3amtoosadr07.workers.dev |
| GitHub | https://github.com/dreameterftw/creatorpulse |

---

<div align="center">

*Built with ❤️ by **Aryan Rane** & **Manvi Gupta***

*Don't just join us as a user — join us as a family member.*

</div>
