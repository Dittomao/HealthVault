---
name: a11y-auditor
description: Strict workflow for ensuring frontend code is fully accessible.
---

# Accessibility (a11y) Auditor Guidelines

Before finalizing any frontend code, you must run a strict mental accessibility audit on the DOM structure:

1. **Contrast**: Ensure text and interactive elements maintain a minimum 4.5:1 color contrast ratio against their backgrounds.
2. **ARIA Attributes**: Apply proper `aria-labels`, `aria-expanded`, `aria-hidden`, and `role` attributes to all custom interactive elements, SVGs, and dynamic components.
3. **Keyboard Navigation**: Ensure every button, link, and form input is reachable via the `Tab` key and visually displays a clear `focus-visible` ring.
4. **Semantic HTML**: Always use semantic tags (`<nav>`, `<main>`, `<article>`, `<button>`) instead of generic `<div>` elements with click handlers.
