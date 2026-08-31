# Lead Finder Client (Frontend)

This is the React frontend for the Lead Finder enterprise B2B discovery platform, built with Vite, TailwindCSS, and Framer Motion.

## 🚀 Features
- **Leads Dashboard**: A comprehensive CRM view for discovered leads, with multi-field filtering and priority sorting.
- **Smart Search**: Synchronous lead discovery with geo-expansion capabilities.
- **WhatsApp Integration**: Manual fallback or Meta Cloud API outreach capabilities.
- **Real-Time Job Polling**: Track asynchronous background scraping tasks directly in the top navigation bar.

## 🛠 Tech Stack
- React 19 + Vite
- Tailwind CSS 4 + Lucide Icons
- Framer Motion
- React Hook Form + Zod
- Axios with interceptors

## ⚙️ Development Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Environment configuration**:
   Copy `.env.example` to `.env` and adjust variables if needed.
   ```bash
   cp .env.example .env
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```
