---
kind: frontend_style
name: Nuxt UI + CSS Variables Design System
category: frontend_style
scope:
    - '**'
source_files:
    - app/assets/css/main.css
    - nuxt.config.ts
    - package.json
    - app/layouts/dashboard.vue
    - app/components/AppSidebar.vue
---

The console uses a lightweight, in-house design system layered on top of @nuxt/ui (v4) and Vue's built-in styling. There is no Tailwind or utility-first framework — styling is composed from three sources:

1. Global CSS variables (app/assets/css/main.css) define the brand palette and typography tokens as CSS custom properties under :root: brand colors (--color-primary #ffb400), neutrals (surface #f9fafb, border #ececec, text #111, muted #6b7280), and Manrope font family loaded via Google Fonts import.

2. Shared layout and responsive utilities live in the same global stylesheet: skeleton shimmer animation, grid helpers (.grid-cols-2/3/4, .grid-map, .grid-billing-charts) with consistent 24px gaps, media queries at 1024px and 640px that collapse grids to single-column and switch the sidebar into a fixed overlay with backdrop.

3. Inline styles inside Vue SFCs — many layout and navigation elements (sidebar, header, nav links) are styled directly via inline style= bindings rather than CSS classes.

Component library: @nuxt/ui provides primitives (UIcon, form inputs, dialogs, etc.) and Lucide icons via the i-lucide-* naming convention. The Nuxt UI module is registered in nuxt.config.ts and its default light color mode is enforced via colorMode.preference: 'light'.

No theme configuration file exists — there is no tailwind.config.*, no Nuxt UI theme override, and no separate design-token file beyond the CSS variables in main.css.