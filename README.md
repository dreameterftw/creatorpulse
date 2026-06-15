# ⚡ CreatorPulse

> AI-powered creator intelligence platform — know your worth, find missing income, pitch brands like a pro.

Built for Indian content creators who are tired of guessing what to charge, missing monetization opportunities, or sending generic pitch emails that go unanswered.
 
---

## 👥 Team

| Name | GitHub |
|------|--------|
| Aryan Rane | [@dreameterftw](https://github.com/dreameterftw) |
| Manvi Gupta | [@manviofficial1212-gif](https://github.com/manviofficial1212-gif) |

---

## 🚀 What is CreatorPulse?

CreatorPulse is a full-stack SaaS web app that gives content creators five AI-powered tools in one place:

| Tool | What it does |
|------|-------------|
| 💰 **Rate Calculator** | Justified rate cards for 6 deal types based on actual stats. Custom niche picker with free-text input. |
| 📡 **Gap Radar** | Audits current income streams vs 8 possible channels. Revenue wheel, gap meter, ranked opportunities. |
| 🎯 **Brand Fit Score** | Animated score ring across 5 dimensions. Expandable breakdown, negotiation tips, competitor brands. |
| ✉️ **Pitch Generator** | Personalized pitch email + 3 subject lines + follow-up + collab ideas + downloadable PDF media kit. |
| 🔮 **What-If Simulator** | Slider-based growth projections with bar chart tooltips and a concrete action plan. |

---

## 🧠 AI Context System

Every AI tool call is enriched with cross-tool session context. The system knows what each tool found this session and injects that knowledge into subsequent prompts:

- After Rate Calculator runs → Gap Radar, Pitch Generator, Fit Score, and What-If Simulator all know the creator's market position and engagement tier
- After Gap Radar runs → every other tool knows what income streams are missing and the monthly gap amount
- After Fit Score runs → Pitch Generator knows what brand was evaluated and the score
- After What-If runs → all tools know the projected growth target

This is implemented via `CreatorContext` — a React context that:
1. Loads the Firestore profile **once** and shares it across all pages (eliminates 5 duplicate Firestore reads per session)
2. Tracks session insights in memory as tools are used
3. Builds a `crossContext` string injected into every Groq prompt
4. Falls back to the last saved history entry if no session data exists yet

All profile fields now support **multiple platforms and niches** — creators active on TikTok + Instagram, or covering both Finance and Tech, get accurate cross-platform rate recommendations.

---

## 🎨 UI/UX Features

- **Dark premium design** — `#0a0916` base, Inter + JetBrains Mono typography
- **Gradient accent** — `#fc4c02 → #ef2cc1 → #bdbbff` used consistently
- **Dashboard hero card** — animated rate counter, negotiation buffer slider, copy-rate button, bar chart with hover tooltips
- **Income Gap Meter** — visual showing current vs potential monthly earnings + gap causes
- **Edit Profile panel** — slide-in from dashboard, multi-platform + multi-niche, custom niche text input
- **ToolExplainer** — collapsible "How this works" on every tool page
- **History panel** — every tool saves results to localStorage (up to 10), restoreable with one click
- **Bell notifications** — animated ring on hover, dropdown with contextual tips
- **3-step dark onboarding** — gradient progress, pill selectors, custom niche input

---

## 🛠 Tech Stack

### Frontend
- **React 18** + **Vite** — manual chunk splitting for optimised bundles
- **Tailwind CSS** + CSS custom properties design system
- **React Router v6** — protected routes + email verification gate
- **Recharts** — radar charts, bar charts with hover tooltips
- **jsPDF + html2canvas** — lazy-loaded PDF media kit generation

### Backend & AI
- **Groq API** (`llama-3.3-70b-versatile`) — all AI features
- **Cloudflare Workers** — serverless proxy with Firebase Auth + App Check verification, KV rate limiting (30/day), audit logging
- **Cloudflare KV** — per-user daily limits + 30-day audit logs

### Auth & Database
- **Firebase Auth** — email/password + Google OAuth, email verification gate
- **Firestore** — user profiles, field-level validation rules, no client-side deletes
- **Firebase App Check** (reCAPTCHA v3) — non-app requests blocked
- **Firebase Hosting** — production deployment

### Security
| Layer | Protection |
|-------|-----------|
| Firestore Rules | Field validation, immutable email, numeric bounds, default-deny |
| App Check | reCAPTCHA v3 blocks non-app requests |
| Worker: Auth JWT | Firebase token verified via Google JWKS (no npm deps) |
| Worker: Email Verified | Unverified accounts blocked from Groq |
| Worker: App Check JWT | Double-verification from real frontend only |
| Worker: KV Rate Limit | 30 calls/day per user, server-enforced |
| Worker: Audit Logs | uid + feature + token estimate, 30d TTL |
| Input Sanitization | Injection characters stripped before prompt interpolation |

---

## 📁 Project Structure

```
creatorpulse/
├── src/
│   ├── context/
│   │   ├── AuthContext.jsx       # Firebase auth state
│   │   └── CreatorContext.jsx    # Profile + cross-tool session insights
│   ├── components/
│   │   ├── AppShell.jsx          # Sidebar + main layout
│   │   ├── Sidebar.jsx           # Dark nav
│   │   ├── Navbar.jsx            # Bell notifications + ring animation
│   │   ├── PageHeader.jsx        # White title + eyebrow
│   │   ├── ToolExplainer.jsx     # Collapsible how-it-works
│   │   ├── HistoryPanel.jsx      # Slide-in history per tool
│   │   ├── KpiCard.jsx / InsightCard.jsx / ToolCard.jsx
│   │   ├── AIResponseCard.jsx / UsageBadge.jsx
│   │   └── ErrorBoundary.jsx / LoadingSkeleton.jsx / EmptyState.jsx
│   ├── pages/
│   │   ├── Landing.jsx           # Public landing with hero animation
│   │   ├── Auth.jsx              # Login/signup + conic border animation
│   │   ├── VerifyEmail.jsx       # Split layout with security explainer
│   │   ├── Onboarding.jsx        # 3-step dark profile wizard
│   │   ├── Dashboard.jsx         # Hero card + edit profile panel
│   │   ├── RateCalculator.jsx    # Custom niche picker + animated rates
│   │   ├── GapRadar.jsx          # Revenue wheel + gap meter
│   │   ├── FitScore.jsx          # Score ring + expandable dimensions
│   │   ├── PitchGenerator.jsx    # Tabbed email + PDF download
│   │   ├── WhatIfSimulator.jsx   # Sliders + projection chart
│   │   └── AccountSettings.jsx  # Deletion with re-auth flow
│   ├── hooks/                    # 5 AI hooks — all use CreatorContext
│   ├── utils/
│   │   ├── groq.js               # Central AI call + proxy + rate limit
│   │   ├── history.js            # localStorage per-tool history
│   │   ├── generateMediaKit.js   # jsPDF builder (lazy-loaded)
│   │   ├── sanitize.js           # Prompt injection protection
│   │   └── rateLimit.js          # Dev fallback rate limit
│   ├── firebase/config.js + appCheck.js
│   └── styles/tokens.css         # CSS design tokens
├── groq-proxy/src/index.standalone.js  # Self-contained Cloudflare Worker
├── scripts/audit-summary.js
├── firestore.rules / firestore.indexes.json
├── firebase.json / .firebaserc
└── .env.example
```

---

## ⚙️ Environment Variables

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_GROQ_API_KEY=        # Dev only — never reaches production bundle
VITE_GROQ_PROXY_URL=      # Cloudflare Worker URL (leave empty for local dev)
VITE_RECAPTCHA_SITE_KEY=  # reCAPTCHA v3 site key (public — safe to expose)
VITE_APPCHECK_DEBUG_TOKEN= # Firebase App Check debug token (local dev only)
```

---

## 🏃 Running Locally

```bash
npm install
cp .env.example .env   # fill in your keys
npm run dev            # → http://localhost:5173
```

Leave `VITE_GROQ_PROXY_URL` empty locally — the app calls Groq directly.

---

## 🚢 Deployment

```bash
# Frontend
npm run build
firebase deploy --only hosting

# Firestore rules
firebase deploy --only firestore:rules

# Cloudflare Worker
# Paste groq-proxy/src/index.standalone.js into Cloudflare dashboard
# Set secrets: GROQ_API_KEY, FIREBASE_PROJECT_ID, FIREBASE_PROJECT_NUMBER
# Set vars: ALLOWED_ORIGIN, DAILY_LIMIT=30
# Bind KV: RATE_LIMIT_KV (id: 18b8c3b1ff004e1ea56ee522b0762342)
```

---

## 🔐 Security Notes

- `.env` is gitignored — API keys never reach the repo
- Groq API key is only used server-side in the Worker in production
- Account deletion removes Firestore data first (while auth is valid), then Auth account
- All user-controlled fields are sanitized before AI prompt interpolation

---

*Built with ❤️ by Aryan Rane & Manvi Gupta*
