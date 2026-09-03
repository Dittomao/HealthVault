Created c:\Users\neeru\Documents\Projects\HealthVault\health-world\architecture.md
Created architecture.md

I've created a comprehensive document breaking down exactly how HealthVault works under the hood. 

You can read the full deep dive here: [architecture.md](file:///C:/Users/neeru/.gemini/antigravity/brain/14daf3fe-3590-402d-9eff-014050f2ba1e/architecture.md)

Here is a quick summary of the core concepts:
1. **The Architecture Stack:** It's built on a modern **Next.js (App Router)** foundation. **Supabase** acts as the secure PostgreSQL database and file storage engine. **Vercel** hosts the serverless backend, and **Google Gemini** powers the intelligence.
2. **The "Payload" Fix:** As explained in the architecture diagram in the document, we bypass rigid Vercel payload limits by uploading files straight to Supabase Storage first, then passing just the small URL to the Vercel backend. Vercel downloads it server-side and streams it to Gemini.
3. **The Database:** Supabase relies on strict Row Level Security (RLS) to ensure users can only ever query documents linked directly to their authenticated `user_id`. The database leans heavily into a `JSONB` column structure to cleanly store dynamic AI outputs (like cost-saving tips vs. recommended actions) without cluttering the table with empty columns.
4. **The AI Engine:** The Next.js API uses highly-engineered context prompts depending on the user's action (Financial Auditor for bills, Triage Nurse for reports, etc.). It forces the Gemini AI to respond in strict JSON, and even has an automated fallback loop to switch to older Gemini models if the primary one hits rate limits.

Take a look at the document for the detailed mermaid sequence diagrams and the full breakdown! Let me know if you have any questions about specific parts of the codebase.
