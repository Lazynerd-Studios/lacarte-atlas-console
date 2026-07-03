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
    - app/components/AppHeader.vue
---

The frontend styling system is a hybrid approach built on Nuxt 4 with the following layers:

**Core framework & component library**
- Nuxt 4 application using `@nuxt/ui` (v4.5.1) as the primary component library, providing primitives like `<UIcon>` and base UI tokens.
- Global stylesheet imported via `nuxt.config.ts` (`css: ['~/assets/css/main.css']`).
- No Tailwind or utility-first framework — styles are written in plain CSS.

**Design tokens**
- Centralized in `app/assets/css/main.css` as CSS custom properties under `:root`:
  - Font family: Manrope (loaded from Google Fonts).
  - Brand color palette: `--color-primary`, `--color-primary-hover`, `--color-primary-foreground`.
  - Neutral palette: `--color-surface`, `--color-border`, `--color-text`, `--color-text-muted`.
- These variables are referenced throughout components for colors, borders, and typography.

**Layout & responsive strategy**
- Layouts (`layouts/dashboard.vue`, `layouts/default.vue`) provide full-viewport shell layouts with fixed header/sidebar and scrollable main content.
- Responsive breakpoints are defined inline in `main.css` at 1024px (tablet) and 640px (mobile), plus a 480px micro-breakpoint for very small screens.
- Grid utilities (`.grid-cols-2/3/4`, `.grid-map`, `.grid-billing-charts`) encapsulate common dashboard grid patterns; they collapse to single-column on mobile.
- Mobile sidebar uses a fixed-position drawer with a backdrop overlay, toggled via the `sidebar-mobile-open` class.

**Component-level styling conventions**
- Components mix CSS classes (for layout/responsive behavior) with inline `style` attributes for precise per-component sizing, spacing, and color overrides — especially visible in `AppHeader.vue` where most visual details are applied inline.
- Shared animations live in `main.css`: skeleton shimmer loader and spinner keyframes, reused by `PageSkeleton.vue`.
- Icons come from `@nuxt/ui`'s icon system (`i-lucide-*` names).

**What is NOT used**
- No SCSS/Sass, no CSS-in-JS, no Tailwind config, no separate theme files beyond the single `main.css` token file.
- No dark mode switching (configured as light-only via `colorMode.preference: 'light'`).

**Developer conventions**
- Keep design tokens in `:root` CSS variables rather than hardcoding hex values.
- Use the shared grid utility classes instead of writing ad-hoc grid layouts.
- Apply global layout classes (`.page-content`, `.dashboard-main`) for consistent page padding and spacing.
- Rely on `@nuxt/ui` icons and primitives; avoid importing additional icon libraries.