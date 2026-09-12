# HealthVault Constitution

This document contains the non-negotiable rules for all human and AI agents working on the HealthVault project. Before submitting any code, agents must cross-reference their work against this file and self-correct.

## Non-Negotiables

1. **Styling & UI**:
   - All UI components must use Tailwind utility classes defined in the project stack.
   - Prefer the Tailwind color palette and established project design tokens over introducing new one-off colors.
   - Maintain the existing "PDF Island" whimsical, clean aesthetic.

2. **Data & Database**:
   - All Supabase calls must use `async`/`await`.
   - Never bypass Row Level Security. Queries and mutations must remain tied to the authenticated user.
   - Upload files directly from the authenticated browser to private Supabase Storage paths prefixed with the user ID to avoid Next.js request-body limits.
   - Persist private storage paths, not permanent public URLs. Create short-lived signed URLs only when an authorized user requests access.

3. **Backend & APIs**:
   - Wrap external API operations in robust error handling and gracefully handle rate limits and service unavailability.
   - Keep API Route Handlers under `app/api/` and follow the bundled documentation for the installed Next.js version.
   - Treat AI output as untrusted data: request structured output, validate it, and normalize it before persistence or display.

4. **Component Architecture**:
   - Use `'use client'` only when React state, lifecycle logic, event handlers, or browser APIs are required. Otherwise, keep components as Server Components.
