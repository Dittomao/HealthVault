---
name: shadcn-ui-architect
description: Forces the agent to act as a Senior UI Engineer using modern React and Tailwind patterns.
---

# Shadcn UI Architect Guidelines

When generating or modifying frontend UI components, you must adhere to the following strict guidelines:

1. **Primitive First**: Always prioritize using accessible Radix UI primitives and Tailwind CSS.
2. **Component Architecture**: Mimic the architecture of `shadcn/ui`. Components should be modular, reusable, and cleanly separated from business logic.
3. **Styling**: Never write raw CSS or standard inline styles unless absolutely necessary. Rely entirely on Tailwind utility classes.
4. **Consistency**: Ensure uniform padding, typography, and color tokens (using `bg-background`, `text-primary`, `ring-offset-background`, etc.) to match modern SaaS dashboards.
