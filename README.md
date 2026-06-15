# ⚡ CreatorPulse

> AI-powered creator intelligence platform — know your worth, find missing income, pitch brands like a pro.

Built for Indian content creators who are tired of guessing what to charge, missing monetization opportunities, or sending generic pitch emails that go unanswered.
 
---

## 👥 Team

| Name | GitHub |
|------|--------|
| Aryan Rane | [@dreameterftw](https://github.com/dreameterftw) |
| Manvi Gupta | — |

---

## 🚀 What is CreatorPulse?

CreatorPulse is a full-stack SaaS web app that gives content creators five AI-powered tools in one place:

| Tool | What it does |
|------|-------------|
| 💰 **Rate Calculator** | Generates justified rate cards for 6 deal types — based on your actual follower count, engagement rate, and niche. Includes a custom niche picker with free-text input. |
| 📡 **Monetization Gap Radar** | Audits your current income streams across 8 categories and tells you exactly what you're leaving on the table, with ranked opportunities |
| 🎯 **Brand-Creator Fit Score** | Analyzes how well you match a brand across 5 dimensions before you reach out — animated score ring, expandable dimension breakdown, and competitor brand suggestions |
| ✉️ **Brand Pitch Generator** | Writes a personalized pitch email, 3 subject line variants, a follow-up, collab ideas, and a downloadable PDF media kit for any brand |
| 🔮 **What-If Simulator** | Adjust followers, engagement, niche, platform, and frequency to project how your earning potential would change |

---

## 🎨 UI/UX Features

- **Dark premium design** — `#0a0916` base, Inter + JetBrains Mono typography
- **Gradient accent system** — `#fc4c02 → #ef2cc1 → #bdbbff` used consistently across the app
- **Animated hero card** on Dashboard — live rate counter with spark burst animation, negotiation buffer slider, copy-rate button
- **Bar chart tooltips** — hover any projection bar to see the exact ₹ value
- **Income Gap Meter** — visual showing current vs potential monthly earnings and what's causing the gap
- **Edit Profile panel** — slide-in from dashboard, supports multiple platforms + multiple niches, custom niche text input
- **ToolExplainer** — collapsible "How this works" section on every tool page
- **History panel** — every tool saves results locally (up to 10 entries), restoreable with one click
- **Bell notifications** — animated ring on hover, dropdown with contextual tips per tool
- **Onboarding flow** — 3-step dark-themed wizard with gradient progress indicator

---

## 🛠 Tech Stack

### Frontend
- **React 18** + **Vite** — fast dev server, optimized production builds with manual chunk splitting
- **Tailwind CSS** — utility-first styling with custom CSS design tokens (`src/styles/tokens.css`)
- **React Router v6** — client-side routing with protected routes + email verification gate
- **Recharts** — radar charts, bar charts with hover tooltips
- **Lucide React** — icon system
- **jsPDF + html2canvas** — PDF media kit generation (lazy-loaded via dynamic import)

### Backend & AI
- **Groq API** (llama-3.3-70b-versatile) — all AI features, fast inference
- **Cloudflare Workers** — serverless proxy with Firebase Auth verification, App Check verification, KV rate limiting, and audit logging
- **Cloudflare KV** — per-user daily rate limiting (30 calls/day) and 30-day audit logs

### Auth & Database
- **Firebase Authentication** — email/password + Google OAuth, email verification gate
- **Cloud Firestore** — user profiles with field-level validation rules
- **Firebase App Check** (reCAPTCHA v3) — prevents non-app requests to Firestore
- **Firebase Hosting** — production deployment

### Security Architecture
| Layer | Protection |
|-------|-----------|
| Firestore Rules | Field validation, immutable email, numeric bounds, default-deny |
| App Check | reCAPTCHA v3 blocks non-app requests to Firestore |
| Worker: Firebase JWT | Verifies every request with Google JWKS (no npm deps) |
| Worker: Email Verified | Blocks unverified accounts from Groq proxy |
| Worker: App Check JWT | Double-verifies requests came from the real frontend |
| Worker: KV Rate Limit | 30 AI calls/day per user, server-enforced, TTL 25h |
| Worker: Audit Logs | Every AI call logged (uid, feature, token estimate, 30d TTL) |
| Input Sanitization | Strips injection characters from all user-controlled prompt fields |
| Lazy PDF Loading | jsPDF/html2canvas only load when user clicks Download |

---

## 📁 Project Structure

```
creatorpulse/
├── src/
│   ├── components/
│   │   ├── AppShell.jsx        # Sidebar + main layout
│   │   ├── Sidebar.jsx         # Dark nav with gradient active indicator
│   │   ├── Navbar.jsx          # Public navbar + bell notifications
│   │   ├── PageHeader.jsx      # Eyebrow / title / description
│   │   ├── ToolExplainer.jsx   # Collapsible "how this works" per tool
│   │   ├── HistoryPanel.jsx    # Slide-in history for all tool pages
│   │   ├── KpiCard.jsx
│   │   ├── InsightCard.jsx
│   │   ├── ToolCard.jsx
│   │   ├── AIResponseCard.jsx
│   │   ├── UsageBadge.jsx
│   │   ├── LoadingSkeleton.jsx
│   │   ├── EmptyState.jsx
│   │   └── ErrorBoundary.jsx
│   ├── pages/
│   │   ├── Landing.jsx         # Public landing page
│   │   ├── Auth.jsx            # Login/signup with conic border animation
│   │   ├── VerifyEmail.jsx     # Email verification with security explainer
│   │   ├── Onboarding.jsx      # 3-step dark-themed profile setup
│   │   ├── Dashboard.jsx       # Command centre: KPIs, tools, insights, edit profile
│   │   ├── RateCalculator.jsx  # Custom niche picker, animated rate card
│   │   ├── GapRadar.jsx        # Revenue wheel, gap meter, opportunity cards
│   │   ├── FitScore.jsx        # Animated score ring, expandable dimensions
│   │   ├── PitchGenerator.jsx  # Tabbed pitch email + PDF media kit
│   │   ├── WhatIfSimulator.jsx # Sliders + bar chart projection
│   │   └── AccountSettings.jsx # Profile info + account deletion flow
│   ├── hooks/                  # One hook per AI tool (auto-save to history)
│   ├── utils/
│   │   ├── groq.js             # Central AI call with rate limit + proxy
│   │   ├── generateMediaKit.js # jsPDF builder (lazy-loaded)
│   │   ├── history.js          # localStorage history per tool
│   │   ├── sanitize.js         # Input sanitization
│   │   └── rateLimit.js        # Client-side fallback rate limit
│   ├── firebase/
│   │   ├── config.js
│   │   └── appCheck.js
│   ├── context/AuthContext.jsx
│   └── styles/tokens.css       # CSS custom properties (design system)
├── groq-proxy/
│   └── src/
│       └── index.standalone.js # Self-contained Cloudflare Worker
├── scripts/
│   └── audit-summary.js        # Local ops: summarize KV audit logs
├── firestore.rules
├── firestore.indexes.json
├── firebase.json
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
VITE_GROQ_API_KEY=           # Only used in local dev (direct Groq fallback)
VITE_GROQ_PROXY_URL=         # Cloudflare Worker URL — leave empty for local dev
VITE_RECAPTCHA_SITE_KEY=     # reCAPTCHA v3 site key (public)
VITE_APPCHECK_DEBUG_TOKEN=   # Firebase App Check debug token (local dev only)
VITE_YOUTUBE_API_KEY=        # Reserved for future use
```

---

## 🏃 Running Locally

```bash
npm install
cp .env.example .env   # fill in your keys
npm run dev            # → http://localhost:5173
```

Leave `VITE_GROQ_PROXY_URL` empty locally — the app calls Groq directly with `VITE_GROQ_API_KEY`.

---

## 🚢 Deployment

### Frontend → Firebase Hosting
```bash
npm run build
firebase login
firebase deploy --only hosting
```

### Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### Cloudflare Worker
Paste `groq-proxy/src/index.standalone.js` into the Cloudflare dashboard editor (no npm needed).

**Worker secrets:** `GROQ_API_KEY`, `FIREBASE_PROJECT_ID`, `FIREBASE_PROJECT_NUMBER`

**Worker env vars:** `ALLOWED_ORIGIN`, `DAILY_LIMIT=30`

**KV binding:** `RATE_LIMIT_KV` (namespace id: `18b8c3b1ff004e1ea56ee522b0762342`)

---

## 🔐 Security Notes

- `.env` is gitignored — API keys never reach the repo
- Groq API key is only used server-side in the Worker in production
- Account deletion removes Firestore data first (while auth is valid), then Auth account
- All user-controlled fields are sanitized before AI prompt interpolation

---

## 📄 License

MIT — free to use, modify, and build on.

---

*Built with ❤️ by Aryan Rane & Manvi Gupta*
