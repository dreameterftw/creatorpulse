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
| 💰 **Rate Calculator** | Generates justified rate cards for sponsored posts, reels, stories, YouTube integrations, UGC, and brand ambassador deals — based on your actual profile |
| 📡 **Monetization Gap Radar** | Audits your current income streams across 8 categories and tells you exactly what you're leaving on the table, with ranked opportunities |
| 🎯 **Brand-Creator Fit Score** | Analyzes how well you match a brand across 5 dimensions before you reach out — so you only pitch when the fit is right |
| ✉️ **Brand Pitch Generator** | Writes a personalized pitch email, 3 subject line variants, a follow-up, collab ideas, and a downloadable PDF media kit for any brand |
| 🔮 **What-If Simulator** | Lets you adjust followers, engagement, niche, platform, and frequency to project how your earning potential would change |

---

## 🛠 Tech Stack

### Frontend
- **React 18** + **Vite** — fast dev server, optimized production builds
- **Tailwind CSS** — utility-first styling with custom design tokens
- **React Router v6** — client-side routing with protected routes
- **Recharts** — radar charts and bar charts for data visualization
- **Lucide React** — icon system
- **jsPDF + html2canvas** — PDF media kit generation (lazy-loaded)

### Backend & AI
- **Groq API** (llama-3.3-70b-versatile) — all AI features run through Groq for fast inference
- **Cloudflare Workers** — serverless proxy that sits between the frontend and Groq, handling auth, rate limiting, and audit logging
- **Cloudflare KV** — per-user daily rate limiting (30 calls/day) and 30-day audit logs

### Auth & Database
- **Firebase Authentication** — email/password + Google OAuth, email verification gate
- **Cloud Firestore** — user profiles with field-level validation rules
- **Firebase App Check** (reCAPTCHA v3) — prevents non-app requests from hitting Firestore
- **Firebase Hosting** — production deployment

### Security Architecture
| Layer | Protection |
|-------|-----------|
| Firestore Rules | Field validation, immutable email, type bounds, default-deny |
| App Check | reCAPTCHA v3 blocks non-app requests to Firestore |
| Worker: Firebase JWT | Verifies every request comes from a real authenticated user |
| Worker: Email Verified | Blocks unverified accounts from reaching Groq |
| Worker: App Check JWT | Double-verifies requests came from the real frontend |
| Worker: KV Rate Limit | 30 AI calls/day per user, server-enforced, resets after 25h |
| Worker: Audit Logs | Every AI call logged with uid, feature, token estimate, TTL 30d |
| Input Sanitization | Strips injection characters from all user-controlled prompt fields |
| Lazy PDF Loading | jsPDF/html2canvas only load when user clicks Download |

---

## 📁 Project Structure

```
creatorpulse/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── AppShell.jsx    # Sidebar + main layout wrapper
│   │   ├── Sidebar.jsx     # Dark nav with gradient active indicator
│   │   ├── Navbar.jsx      # Public landing navbar
│   │   ├── PageHeader.jsx  # Eyebrow / title / description pattern
│   │   ├── KpiCard.jsx     # Dashboard metric cards
│   │   ├── InsightCard.jsx # AI insight feed rows
│   │   ├── ToolCard.jsx    # Dashboard tool grid cards
│   │   ├── AIResponseCard.jsx  # Wrapper for AI-generated content
│   │   ├── UsageBadge.jsx  # Shows remaining daily AI calls
│   │   ├── LoadingSkeleton.jsx # Shimmer placeholders
│   │   ├── EmptyState.jsx  # Empty state UI
│   │   └── ErrorBoundary.jsx   # Runtime error catch
│   ├── pages/
│   │   ├── Landing.jsx     # Public landing page
│   │   ├── Auth.jsx        # Login / signup
│   │   ├── VerifyEmail.jsx # Email verification gate
│   │   ├── Onboarding.jsx  # 3-step creator profile setup
│   │   ├── Dashboard.jsx   # Home base with KPIs + tool grid
│   │   ├── RateCalculator.jsx
│   │   ├── GapRadar.jsx
│   │   ├── FitScore.jsx
│   │   ├── PitchGenerator.jsx
│   │   ├── WhatIfSimulator.jsx
│   │   └── AccountSettings.jsx # Profile + account deletion
│   ├── hooks/              # AI feature hooks (one per tool)
│   ├── utils/
│   │   ├── groq.js         # Central AI call with rate limit + proxy
│   │   ├── generateMediaKit.js  # jsPDF media kit builder
│   │   ├── sanitize.js     # Input sanitization
│   │   └── rateLimit.js    # Client-side Firestore rate limit (dev fallback)
│   ├── firebase/
│   │   ├── config.js       # Firebase init
│   │   └── appCheck.js     # reCAPTCHA v3 App Check
│   ├── context/
│   │   └── AuthContext.jsx # Auth state + loading
│   └── styles/
│       └── tokens.css      # CSS custom properties (design system)
├── groq-proxy/             # Cloudflare Worker
│   └── src/
│       ├── index.standalone.js  # Self-contained Worker (no npm)
│       └── verify-turnstile.js  # Turnstile token exchange (optional)
├── scripts/
│   └── audit-summary.js    # Local ops: summarize KV audit logs
├── firestore.rules         # Production Firestore security rules
├── firestore.indexes.json
├── firebase.json
└── .env.example            # All required env vars documented
```

---

## ⚙️ Environment Variables

Create a `.env` file in the root with:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_GROQ_API_KEY=
VITE_GROQ_PROXY_URL=          # Cloudflare Worker URL (leave empty for local dev)
VITE_RECAPTCHA_SITE_KEY=       # reCAPTCHA v3 site key
VITE_APPCHECK_DEBUG_TOKEN=     # Firebase App Check debug token (local dev only)
VITE_YOUTUBE_API_KEY=          # Optional — reserved for future use
```

> **Note:** `VITE_GROQ_API_KEY` is only used in local dev (direct Groq fallback). In production, all AI calls go through the Cloudflare Worker and the key never reaches the client bundle.

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

For local dev, leave `VITE_GROQ_PROXY_URL` empty — the app automatically falls back to calling Groq directly with your `VITE_GROQ_API_KEY`.

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
The Worker is self-contained in `groq-proxy/src/index.standalone.js` — no npm dependencies, paste directly into the Cloudflare dashboard editor.

**Required Worker secrets** (Settings → Variables → Secrets):
```
GROQ_API_KEY
FIREBASE_PROJECT_ID
FIREBASE_PROJECT_NUMBER
```

**Required environment variables:**
```
ALLOWED_ORIGIN = https://your-app.web.app
DAILY_LIMIT    = 30
```

**Required KV binding:**
```
Variable name: RATE_LIMIT_KV
```

---

## 🔐 Security Notes

- `.env` is gitignored — your keys never touch the repo
- The Groq API key is only used server-side in the Worker in production
- Firestore rules enforce field types, numeric bounds, and email immutability
- Account deletion removes Firestore data first (while auth is still valid), then deletes the Auth account — no orphaned data
- All user-controlled fields (brand name, description) are sanitized before being interpolated into AI prompts

---

## 📄 License

MIT — free to use, modify, and build on.

---

*Built with ❤️ by Aryan Rane & Manvi Gupta*
