---
name: mobile-first-enforcer
description: Strictly enforces mobile-first design principles for all UI components.
---

# Mobile-First Enforcer Guidelines

You must design all components for mobile screens first and scale up carefully. 

1. **Base Classes**: Base Tailwind classes MUST target mobile devices (e.g., `<div class="p-4 flex-col">`).
2. **Breakpoints**: Use standard responsive prefixes (`sm:`, `md:`, `lg:`, `xl:`) only to adjust the layout for larger screens (e.g., `<div class="p-4 flex-col md:flex-row md:p-8">`).
3. **Viewport Limits**: Reject or refactor any code that causes horizontal scrolling on a 320px viewport. Ensure images and containers use `max-w-full` or `w-full`.
4. **Touch Targets**: Ensure all interactive elements (buttons, links) have a minimum touch target size of `44x44px` on mobile layouts.
