---
kind: build_system
name: Nuxt 4 + Vite Build Pipeline
category: build_system
scope:
    - '**'
source_files:
    - package.json
    - nuxt.config.ts
    - vitest.config.ts
---

This project uses a minimal, Nuxt-native build system with no custom Makefiles, Dockerfiles, or CI pipelines checked into the repository. The entire build and artifact lifecycle is driven by Nuxt 4's built-in tooling on top of Vite.

**Build & dev scripts** — All entry points are declared in `package.json`:
- `dev`: `nuxt dev` (Vite-powered development server)
- `build`: `nuxt build` (production SSR/SPA bundle via Vite)
- `generate`: `nuxt generate` (static export)
- `preview`: `nuxt preview` (serve the production build locally)
- `postinstall`: `nuxt prepare` (typegen / module bootstrap after install)
- `test` / `test:watch`: Vitest (`--run` vs interactive)

**Bundler configuration** — Centralized in `nuxt.config.ts`:
- Modules: `@nuxt/ui`, `@pinia/nuxt`, `@pinia-plugin-persistedstate/nuxt`
- Global CSS injected from `~/assets/css/main.css`
- Runtime config exposed through `runtimeConfig.public` (`NUXT_PUBLIC_API_BASE`, `NUXT_PUBLIC_TOMTOM_API_KEY`) consumed at runtime; values default to production URLs when env vars are absent.
- Route-level SSR toggles via `routeRules` (`/login`, `/forgot-password`, `/pay/**`, `/tracking/**` are client-only).
- Vite overrides set `build.target = 'esnext'` and pre-bundle `xlsx` via `optimizeDeps.include`.

**TypeScript & path aliases** — `tsconfig.json` is present alongside `nuxt.config.ts`; Vitest mirrors the app alias layout by mapping both `~` and `@` to the `app/` directory in `vitest.config.ts`. Tests run against `happy-dom` with global test APIs enabled.

**Dependency management** — Single flat lockfile `bun.lock` indicates Bun as the package manager; no vendoring or workspaces are configured.

**What is NOT present** — There are no Dockerfiles, docker-compose files, GitHub Actions workflows, Makefiles, shell-based build/deploy scripts, or release automation in this repository. Packaging and deployment are therefore handled outside the codebase (e.g., platform-specific hosting for Nuxt apps).