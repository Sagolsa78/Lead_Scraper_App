# Lead Finder Backend (API & Workers)

The core engine for the Google Places Lead Finder, responsible for data extraction, lead management, and automated outreach.

## 🚀 Features

- **Lead Processing**: Geocoding, Places API integration with Redis caching.
- **Enterprise Storage**: PostgreSQL with **Prisma ORM** (Prisma 7 compatible).
- **Messaging Engine**:
  - Meta WhatsApp Cloud API integration.
  - Manual WhatsApp fallback.
  - Background job processing via **BullMQ** and **Redis**.
- **Security**:
  - AES-256 encryption for WhatsApp tokens.
  - Zod request validation.
  - JWT/Token-ready architecture.
- **Observability**: Structured Winston logging with Request-ID correlation.

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL (Prisma ORM)
- **Task Queue**: BullMQ
- **Caching**: Redis
- **Validation**: Zod
- **External APIs**: Google Maps, Meta WhatsApp

## ⚙️ Development Setup

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Database configuration**:
   Ensure `DATABASE_URL` is set in `.env`.

   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

3. **Start services**:
   ```bash
   npm run dev    # Starts API and background workers (nodemon)
   ```

## 🧪 Key Endpoints

- `GET /health`: Health and connection status.
- `POST /api/v1/leads/generate`: Trigger new lead search.
- `POST /api/v1/whatsapp/send`: Send direct WhatsApp (Manual or Cloud).
- `POST /api/v1/whatsapp/bulk-send`: Queue bulk outreach.

## 📁 Core Directory Structure

- `config/`: Configuration for Prisma, Redis, BullMQ, and Logging.
- `controllers/`: Request handling logic.
- `workers/`: BullMQ worker implementations.
- `services/`: Business logic for third-party integrations (WhatsApp, Sheets, Maps).
- `utils/`: Reusable utilities (Encryption, Helpers).
