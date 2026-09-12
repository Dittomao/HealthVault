# 🏥 HealthVault

HealthVault is an AI-assisted personal health-document organizer. It simplifies medical language, reviews hospital bills for potential issues, extracts medicine names from prescriptions, and keeps analyzed records, family profiles, and insurance details in one authenticated dashboard.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white)

## Features

- **Report Analyzer:** Summarizes uploaded reports and suggests questions or follow-up actions. It does not replace professional medical advice.
- **Bill Analyzer:** Identifies possible duplicate, inflated, or disputable charges and offers cost-saving ideas.
- **Jargon Buster:** Rewrites complex medical terminology in plain English.
- **Prescription Buy:** Extracts medicine names and builds searches for known pharmacy sites; it does not purchase medicine.
- **Timeline:** Displays analyzed documents chronologically.
- **Family Profiles:** Stores and copies commonly needed family health details.
- **Insurance Connect:** Stores policy details and optional private policy documents.

Supported uploads are PDF, JPEG, PNG, and WebP files up to 10 MB.

## Built With

- **Frontend:** Next.js 16 App Router, React 19, Tailwind CSS 4, Framer Motion, Lucide React
- **Backend:** Next.js Route Handlers and Supabase Auth/PostgreSQL/Storage
- **AI:** Google Gemini through `@google/genai`; model selection is configured server-side
- **Hosting:** Vercel

## Architecture and Upload Flow

HealthVault keeps large file bodies out of Next.js requests:

1. The authenticated browser validates and uploads a file directly to a private Supabase Storage path owned by the user.
2. The browser sends only that storage path and the requested analysis mode to an authenticated Next.js Route Handler.
3. The server confirms the user owns the path, downloads the object, checks its type and size, and sends its contents to Gemini.
4. The server validates and normalizes Gemini's structured JSON response.
5. The browser stores the validated summary and metadata in owner-scoped Supabase tables. Authorized document viewing uses a short-lived signed URL rather than a permanent public URL.

## Local Development

### Prerequisites

- A Node.js version supported by Next.js 16
- A Supabase project
- A Google Gemini API key

### Setup

```bash
git clone https://github.com/Dittomao/HealthVault.git
cd HealthVault
npm install
```

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_google_gemini_api_key
```

Apply the version-controlled Supabase migrations to an appropriate development project, then start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Security and Privacy

HealthVault uses Supabase authentication, owner-scoped database Row Level Security, and private Storage policies. Files are processed by Supabase, the deployed Next.js server, and Google Gemini; analysis does not happen entirely in the browser. Do not treat this project as HIPAA-certified or as a substitute for medical, legal, insurance, or financial advice. Review the configured policies and deployment environment before handling real health information.
