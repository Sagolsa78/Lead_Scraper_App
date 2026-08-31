# LeadFinder 🎯

**Autonomous B2B lead discovery — finds local businesses without websites and pipes them straight into your CRM, Google Sheets, and WhatsApp outreach queue.**

> ⬇️ *[Add a 15-30 sec GIF here showing: search → leads populating → CRM view → WhatsApp send]*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green?logo=node.js)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Prisma%20ORM-336791?logo=postgresql)](https://www.postgresql.org/)

---

## Why I built this

Agencies and freelancers who sell web design services spend hours manually searching Google Maps, copy-pasting phone numbers into spreadsheets, and guessing which businesses actually need a website. Every existing scraping tool either spits out unfiltered noise, locks you into expensive subscriptions, or requires deep technical setup.

LeadFinder automates the entire sourcing pipeline: it hits the Google Places API, runs each result through a strict validation filter (no phone? has website? low rating? rejected), enriches survivors with social media data and a priority score, and delivers a clean CRM list — ready for WhatsApp outreach — in minutes.

---

## Features

- **🔍 Google Places Extraction** — Real-time geospatial search with keyword targeting, configurable radius, and automatic pagination across up to 3 result pages
- **🚫 Website Filtering** — Automatically rejects any business that already has a website, rating below 3.8, fewer than 25 reviews, or falls into excluded categories (ATMs, banks, government)
- **💾 Dual Storage** — Leads are simultaneously saved to PostgreSQL (via Prisma ORM) and appended to a configured Google Sheet for collaboration
- **📊 Full CRM Dashboard** — Search, filter by city/category/priority, paginate, and manage lead status from a built-in React frontend
- **📱 WhatsApp Integration** — Supports both Meta Cloud API (bulk, automated) and `wa.me` manual fallback; tokens are AES-256-GCM encrypted at rest
- **⚙️ Background Job Queue** — BullMQ + Redis worker queues with progress tracking, cancellation support, and exponential-backoff retries
- **🧠 AI Priority Scoring** — Deterministic scoring engine weighs review count, rating, social presence, and business category into a `HIGH / MEDIUM / LOW` priority rank
- **🔐 Authentication** — JWT access/refresh token rotation with Google OAuth support; multi-tenant organization model
- **🌐 Social Discovery** — Enriches leads with Instagram, Facebook, and LinkedIn profile detection via SerpAPI

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19 + Vite 7, Tailwind CSS v4, Framer Motion, React Hook Form |
| **Backend** | Node.js 20, Express.js, Prisma ORM |
| **Database** | PostgreSQL |
| **Queue / Cache** | Redis, BullMQ |
| **APIs** | Google Places, Google Geocoding, Google Sheets, Meta WhatsApp Cloud API |
| **Auth** | JWT (access + refresh rotation), Google OAuth 2.0, bcrypt |
| **Optional** | Twilio (phone validation), Google Gemini AI, SerpAPI (social discovery) |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Browser (React / Vite)                        │
│           Lead Finder Form  ─►  CRM Dashboard  ─►  Analytics        │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ HTTPS (JWT Bearer)
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Express.js API  (port 5005)                     │
│  /auth  /leads  /whatsapp  /phone                                    │
│  ● Helmet  ● CORS whitelist  ● Rate-limit  ● Zod validation          │
└──────────┬──────────────────────────────────────┬───────────────────┘
           │ Prisma ORM                            │ BullMQ Job enqueue
           ▼                                       ▼
┌─────────────────────┐               ┌────────────────────────────────┐
│    PostgreSQL DB     │               │   Redis  +  BullMQ Workers     │
│  Users / Orgs        │               │   ● Discovery Worker           │
│  Leads / Jobs        │               │     ├─ Google Places API       │
│  RefreshTokens       │◄──────────────│     ├─ Validate & Score        │
│  Settings            │  upsert leads │     ├─ Social Discovery        │
└─────────────────────┘               │     └─ Save to DB + Sheets     │
                                       │   ● WhatsApp Worker            │
                                       └────────────────────────────────┘
                                                     │
                                                     ▼
                                         ┌──────────────────────┐
                                         │   Google Sheets API   │
                                         │   (secondary export)  │
                                         └──────────────────────┘
```

---

## Quick Start

### Prerequisites

- Node.js v20+
- PostgreSQL (running locally or via Docker)
- Redis (running locally or via Docker)
- Google Cloud project with **Places API**, **Geocoding API**, and **Sheets API** enabled
- A Google Service Account (for Sheets access) — [how to create one](https://cloud.google.com/iam/docs/service-accounts-create)

### Option A — Docker Compose (recommended)

```bash
git clone https://github.com/your-username/leadfinder.git
cd leadfinder

# Copy and fill in your environment variables
cp backend/.env.example backend/.env
# edit backend/.env with your API keys

docker-compose up -d
```

The frontend will be served at `http://localhost:5173` and the API at `http://localhost:5005`.

### Option B — Manual Setup

```bash
git clone https://github.com/your-username/leadfinder.git
cd leadfinder

# ── Backend ──────────────────────────────────────────────────
cd backend
npm install
cp .env.example .env
# Fill in backend/.env (see Environment Variables below)

npx prisma migrate dev --name init   # create DB schema
npx prisma generate                  # generate Prisma client
npm run dev                          # starts API on :5005

# ── Frontend (new terminal) ────────────────────────────────
cd ../client
npm install
cp .env.example .env
# VITE_API_URL=http://localhost:5005/api/v1
npm run dev                          # starts Vite on :5173
```

---

## Environment Variables

### Backend — `backend/.env`

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `REDIS_URL` | ✅ | Redis URL for BullMQ and caching |
| `GOOGLE_PLACES_API_KEY` | ✅ | Google Maps Platform API key |
| `GOOGLE_GEOCODING_API_KEY` | ✅ | Google Geocoding API key |
| `JWT_SECRET` | ✅ | 64-char random string for access tokens |
| `JWT_REFRESH_SECRET` | ✅ | 64-char random string for refresh tokens |
| `ENCRYPTION_KEY` | ✅ | Min 16-char key — encrypts stored WhatsApp tokens |
| `ALLOWED_ORIGINS` | ✅ | Comma-separated CORS origins (e.g. `http://localhost:5173`) |
| `GOOGLE_SHEET_ID` | ⚠️ Optional | Target Google Spreadsheet ID |
| `GOOGLE_CLIENT_EMAIL` | ⚠️ Optional | Service account email for Sheets auth |
| `GOOGLE_PRIVATE_KEY` | ⚠️ Optional | Service account private key for Sheets auth |
| `WHATSAPP_PHONE_NUMBER_ID` | ⚠️ Optional | Meta Business WhatsApp Phone Number ID |
| `TWILIO_ACCOUNT_SID` | ⚠️ Optional | Twilio SID for phone number validation |
| `TWILIO_AUTH_TOKEN` | ⚠️ Optional | Twilio auth token |
| `GEMINI_API_KEY` | ⚠️ Optional | Google Gemini key for AI features |
| `SERPAPI_KEY` | ⚠️ Optional | SerpAPI key for social profile discovery |

> **Tip:** Generate strong secrets with `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

### Frontend — `client/.env`

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | ✅ | Base API URL (e.g. `http://localhost:5005/api/v1`) |
| `VITE_GOOGLE_CLIENT_ID` | ⚠️ Optional | Google OAuth Client ID for the "Sign in with Google" button |

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/auth/register` | Create account + organization |
| `POST` | `/api/v1/auth/login` | Login, returns access + refresh tokens |
| `POST` | `/api/v1/auth/refresh` | Rotate refresh token |
| `POST` | `/api/v1/auth/logout` | Invalidate refresh token |
| `GET` | `/api/v1/auth/me` | Fetch current user profile |
| `POST` | `/api/v1/leads/generate` | Enqueue a new lead discovery job |
| `GET` | `/api/v1/leads` | List all leads (filters, pagination) |
| `GET` | `/api/v1/leads/jobs` | List all background jobs |
| `POST` | `/api/v1/leads/jobs/:id/cancel` | Cancel a running job |
| `GET` | `/api/v1/health` | Health check |

---

## Known Issues / Roadmap

> These are tracked from the pre-launch audit. Contributions welcome.

### Bugs (tracked)
- [ ] **Refresh token race condition** — Concurrent `/auth/refresh` requests (common in React StrictMode) can trigger a Prisma `RecordNotFound` error if both requests attempt to delete the same token. Fix: change `prisma.refreshToken.delete()` to `deleteMany()` on line 197 of `authController.js`.

### Improvements (medium priority)
- [ ] Replace `console.log` statements in `discoveryWorker.js` with structured Winston logger calls
- [ ] README setup commands use old project name (`lead-proof-app`) — update to `leadfinder`

### Roadmap (future)
- [ ] Email/phone verification on registration
- [ ] Webhook support for real-time job status updates (instead of polling)
- [ ] Role-based access control enforcement on dashboard actions (schema already supports OWNER / ADMIN / MEMBER / VIEWER)
- [ ] Export leads to CSV directly from the dashboard
- [ ] Bring-your-own-prompt for Gemini AI scoring customization

---

## Project Structure

```
leadfinder/
├── backend/
│   ├── config/           # DB, Redis, Logger, Encryption configs
│   ├── controllers/      # authController, leadController, whatsappController
│   ├── middleware/        # Auth guard, error handler, rate limiter
│   ├── prisma/            # schema.prisma + migrations
│   ├── routes/            # Express route definitions
│   ├── services/          # Google Places, Sheets, WhatsApp, Social Discovery
│   ├── workers/           # BullMQ discovery + WhatsApp workers
│   ├── utils/             # Duplicate checker, API limiter, formatters
│   └── server.js
└── client/
    └── src/
        ├── api/           # Axios service layer
        ├── components/    # LeadForm, ResultSummary, ErrorBoundary, ThemeToggle
        ├── context/       # AuthContext, JobContext
        └── pages/         # LeadsDashboard, WhatsAppSettings, Analytics, Docs
```

---

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you'd like to change.

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please run `npm run lint` in both `backend/` and `client/` before submitting.

---

## License

[MIT](./LICENSE) — © 2026 LeadFinder
