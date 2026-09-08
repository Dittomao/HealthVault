---
name: code-review
description: Team standard for performing automated code reviews
---

# Code Review Guidelines

When running a code review, always enforce the following standards for the HealthVault project:

1. **Accessibility**: Verify that all UI components have appropriate accessibility tags (e.g., `aria-labels`, `alt` text for images).
2. **Variable Naming Conventions**: Ensure all variables use `camelCase`, and React components use `PascalCase`.
3. **Tailwind Best Practices**: Check for excessively long inline classes; encourage using component logic where appropriate.
4. **Error Handling**: Ensure all asynchronous operations (`fetch` calls, Supabase queries) are wrapped in `try/catch` blocks and errors are surfaced to the user appropriately.
5. **Security**: Ensure no secrets or API keys are hardcoded in the codebase. All keys must be referenced via `process.env`.
