# HealthVault Constitution

This document contains the non-negotiable rules for all human and AI agents working on the HealthVault project. Before submitting any code, agents must cross-reference their work against this file and self-correct.

## Non-Negotiables

1. **Styling & UI**: 
   - All UI components must use the Tailwind utility classes defined in our stack. 
   - Never hardcode HEX values; always use the Tailwind color palette (e.g., `text-blue-600` instead of `text-[#2563eb]`).
   - Maintain the existing "PDF Island" whimsical, clean aesthetic.

2. **Data & Database**:
   - All database calls (via Supabase) must be `async/await`.
   - Never bypass Row Level Security (RLS). Ensure all queries are tied to the authenticated user's session.
   - For file uploads, always upload to Supabase Storage first and only pass the public URL to backend APIs to avoid Next.js payload limitations.

3. **Backend & APIs**:
   - All serverless API routes must be robust. If calling external APIs (like Gemini), wrap them in `try/catch` and gracefully handle rate limiting or service unavailability.
   - Use the App Router (`src/app/api/...`) strictly.

4. **Component Architecture**:
   - Use `'use client'` strictly only when React hooks (useState, useEffect) or interactive event listeners (onClick, onChange) are needed. Otherwise, keep components as server components by default.
