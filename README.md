# Google Places Lead Finder (Proof Backend)

A Node.js Express backend application that fetches business leads using Google Places & Geocoding APIs, filters them, and saves valid leads to a Google Sheet.

## Features

- **Geocoding**: Converts city names to latitude/longitude.
- **Places Search**: Finds businesses by type and radius using official Google API.
- **Lead Filtering**:
  - Filters out businesses that already have a website.
  - Skips businesses without a phone number.
- **Duplicate Prevention**: Checks existing phone numbers in the Google Sheet before adding.
- **Google Sheets Integration**: Appends valid leads directly to a specified Sheet.

## Prerequisites

- Node.js installed.
- Google Cloud Platform Project with billing enabled.
- Enabled APIs:
  - Places API (New)
  - Geocoding API
  - Google Sheets API
  - Google Drive API
- Service Account with Editor access to the Google Sheet.

## Installation

1. Clone the repository:

   ```bash
   git clone <repository_url>
   cd lead-proof-app
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure Environment Variables:
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Fill in your API keys and credentials in `.env`.

## Google Cloud Setup

1. **Create Project**: Go to [Google Cloud Console](https://console.cloud.google.com/) and create a new project.
2. **Enable APIs**: Enable Places API, Geocoding API, Sheets API, and Drive API.
3. **Create Service Account**:
   - Go to "IAM & Admin" > "Service Accounts".
   - Create a new service account.
   - Create a JSON key for this account.
   - Open the JSON key file and copy the `private_key` (including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`) and `client_email`.
4. **Share Sheet**:
   - Create a new Google Sheet.
   - Share the sheet with the `client_email` from your service account (Give "Editor" permission).
   - Copy the Sheet ID from the URL (e.g., `https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit`).

## Running the Application

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

## Troubleshooting

### Error: "Google Sheets API has not been used in project..."

**Cause**: The Google Sheets API is not enabled in your Google Cloud Project.
**Fix**:

1. Click the link provided in the error message (e.g., `https://console.developers.google.com/apis/api/sheets.googleapis.com/overview...`).
2. Click the **"ENABLE"** button.
3. Wait a few minutes for changes to propagate.

### Error: "The caller does not have permission"

**Cause**: The Service Account does not have access to your Google Sheet.
**Fix**:

1. Open your `.env` file and look for `GOOGLE_CLIENT_EMAIL`. Copy that email address.
2. Open your Google Sheet in your browser.
3. Click the **"Share"** button in the top right.
4. Paste the Service Account email.
5. Ensure the permission is set to **"Editor"**.
6. Click **"Send"** (uncick "Notify people" if you want).

### Error: "getaddrinfo EAI_AGAIN maps.googleapis.com"

**Cause**: Temporary network or DNS issue. Your server cannot reach Google.
**Fix**:

1. Check your internet connection.
2. Restart the server (`npm run dev`).
3. Try again in a few minutes.

## API usage

### Health Check

**Endpoint**: `GET /health`

**Response**:

```json
{
  "status": "running"
}
```

### Generate Leads

**Endpoint**: `POST /generate-leads`

**Body**:

```json
{
  "location": "Lucknow",
  "businessType": "salon",
  "radius": 3000,
  "limit": 15
}
```

**Response**:

```json
{
  "success": true,
  "totalFetched": 15,
  "noWebsiteLeads": 5,
  "savedToSheet": 3,
  "duplicatesSkipped": 2,
  "data": [...]
}
```
