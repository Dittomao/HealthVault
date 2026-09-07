# 🏥 HealthVault

HealthVault is an AI-powered, centralized personal health assistant built to bridge the comprehension gap in healthcare. It demystifies dense medical jargon, acts as a financial auditor for hospital bills, and provides a single, secure dashboard for families to manage their scattered health records and insurance policies.

![Next.js](https://img.shields.io/badge/Next.js-14+-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white)

---

## ✨ Features

- 📑 **Report Analyzer**: Upload a complex lab report or medical document. The AI acts as a triage nurse, translating the diagnosis into plain English and recommending actionable next steps and specialist appointments.
- 💸 **Bill Analyzer**: Upload a hospital bill to scan for potential financial overcharges. The AI flags padded fees, compares them to fair market prices, and offers cost-saving tips.
- 🧠 **Jargon Buster**: Simplifies incomprehensible medical terminology into 5th-grade English.
- 💊 **Prescription Buy**: Extracts medicine names from prescriptions and generates direct search URLs for quick pharmacy access.
- 🗄️ **Centralized Vault & Timeline**: A single dashboard to chronologically store and view family health profiles, prescriptions, and instantly accessible insurance policy documents for emergencies.

## 🛠️ Built With

- **Frontend:** Next.js (App Router), React, Tailwind CSS, Lucide React
- **Backend/Storage:** Supabase (PostgreSQL, Supabase Storage, Auth)
- **AI Engine:** Google Gemini (`gemini-1.5-flash`, `gemini-1.5-pro`)
- **Hosting:** Vercel

## 🚀 Architecture & File Upload Flow

To bypass Vercel's strict 4.5 MB serverless payload limit for large medical PDFs, HealthVault utilizes an edge-to-cloud upload strategy:

1. The client uploads the raw PDF/Image directly to a secure **Supabase Storage** bucket.
2. The client sends the returned public URL to the **Vercel API Route**.
3. The Vercel server downloads the file directly into memory and streams it to **Google Gemini** for processing.
4. Gemini returns strictly structured JSON, which is stored in a flexible `JSONB` column in the Supabase PostgreSQL database.

## 💻 Getting Started (Local Development)

### Prerequisites
- Node.js 18+
- A Supabase Project (Database & Storage)
- A Google Gemini API Key

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Dittomao/HealthVault.git
   cd HealthVault
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env.local` file in the root directory and add the following keys:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   GEMINI_API_KEY=your_google_gemini_api_key
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🔐 Security & Privacy
HealthVault implements Supabase Row Level Security (RLS) to ensure HIPAA-level privacy concepts. Users can exclusively access their own medical data tied to their authenticated session ID. No sensitive API keys are exposed to the client browser.

