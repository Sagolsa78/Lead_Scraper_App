# Google Places Lead Finder (Enterprise Edition) 🚀

A professional-grade SaaS application designed to extract high-intent business leads from Google Places. It filters for businesses missing websites, stores them in PostgreSQL/Google Sheets, and facilitates automated WhatsApp outreach.

## 🌟 Key Features

### Data Extraction & Enrichment

- **Google Places API**: Real-time extraction of business data (name, phone, address, rating).
- **Website Filtering**: Automatically identifies and prioritizes businesses without websites.
- **Geocoding & Caching**: Precise location mapping with Redis-based caching to minimize costs and latency.
- **Duplicate Prevention**: Phone number normalization and unique indexing prevent redundant leads.

### CRM & Lead Management

- **Enterprise Storage**: PostgreSQL database managed via Prisma ORM for high performance.
- **Dynamic Dashboard**: Full-featured CRM UI with advanced search, multi-field filtering, and pagination.
- **Sync to Sheets**: Automatic secondary export to Google Sheets for collaboration and backup.

### WhatsApp Integration

- **Hybrid Messaging**: Supports Meta Cloud API for automated scale and manual `wa.me` fallback.
- **Background Workers**: BullMQ and Redis handle bulk message queueing with exponential backoff retries.
- **Secure Configuration**: WhatsApp tokens are AES-256 encrypted before being stored.

### Robust Architecture

- **Clean Architecture & SOLID**: Maintainable and testable codebase.
- **Structured Logging**: Winston logger with Request ID tracking for production monitoring.
- **Security**: Centralized error handling, Zod validation, and rate limiting.

## 🛠 Tech Stack

- **Backend**: Node.js, Express.js, Prisma ORM, PostgreSQL.
- **Frontend**: React (Vite), Tailwind CSS, Lucide Icons, React Router.
- **Infrastructure**: Redis (Caching & Queues), BullMQ.
- **APIs**: Google Places, Google Geocoding, Google Sheets, Meta WhatsApp Cloud API.

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- PostgreSQL
- Redis Server
- Google Cloud Project (API Key & Service Account)
- Meta Developer Account (WhatsApp Cloud API)

### 1. Project Initialization

```bash
# Clone the repository
git clone <repository-url>
cd lead-proof-app
```

### 2. Backend Setup

```bash
cd backend
npm install

# Setup Environment Variables
cp .env.example .env
# Edit .env with your credentials

# Database Migration
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate

# Start Server
npm run dev
```

### 3. Frontend Setup

```bash
cd client
npm install

# Setup Environment Variables
echo "VITE_API_URL=http://localhost:5005/api/v1" > .env

# Start Client
npm run dev
```

## 📖 Environment Variables (Detailed)

### Backend (`/backend/.env`)

| Variable                   | Description                          |
| :------------------------- | :----------------------------------- |
| `DATABASE_URL`             | PostgreSQL connection string.        |
| `REDIS_URL`                | Redis for BullMQ and Caching.        |
| `GOOGLE_PLACES_API_KEY`    | Google Maps API Key.                 |
| `GOOGLE_SHEET_ID`          | ID of the target Google Sheet.       |
| `ENCRYPTION_KEY`           | 32-character key for token security. |
| `WHATSAPP_PHONE_NUMBER_ID` | From Meta Business settings.         |

### Client (`/client/.env`)

| Variable       | Description                    |
| :------------- | :----------------------------- |
| `VITE_API_URL` | Base path of your backend API. |

## 📁 Project Structure

```text
lead-proof-app/
├── backend/            # Express API & Workers
│   ├── config/         # Database, Redis, Logger configs
│   ├── controllers/    # Request handlers
│   ├── middleware/     # Validation, Auth, Error handling
│   ├── prisma/         # Schema & Migrations
│   ├── routes/         # API Route definitions
│   ├── services/       # Business logic (WhatsApp, Places, Sheets)
│   └── workers/        # BullMQ background processors
└── client/             # Vite + React Frontend
    ├── src/
    │   ├── api/        # Axios service definitions
    │   ├── components/ # Reusable UI components
    │   ├── pages/      # Dashboard, Settings, Generator views
    │   └── layouts/    # Sidebar and navigation layouts
```

## 🛡 License

Built with ❤️ for professional lead generation experts.
