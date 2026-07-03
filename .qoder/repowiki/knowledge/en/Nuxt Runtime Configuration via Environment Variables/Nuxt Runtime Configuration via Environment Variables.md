---
kind: configuration_system
name: Nuxt Runtime Configuration via Environment Variables
category: configuration_system
scope:
    - '**'
source_files:
    - nuxt.config.ts
    - app/composables/useApi.ts
    - app/stores/auth.ts
---

The application uses Nuxt's built-in runtime configuration system to manage environment-dependent settings. There is no dedicated config directory or custom loader — all configuration flows through `nuxt.config.ts` and is consumed at runtime via `useRuntimeConfig()`.

**Configuration declaration**
- All runtime values are declared in the `runtimeConfig.public` block of `nuxt.config.ts`. Only public (client-accessible) keys are exposed; no private server-only config exists in this codebase.
- Each key reads from a `NUXT_PUBLIC_*` environment variable with a sensible default:
  - `apiBase` → `process.env.NUXT_PUBLIC_API_BASE` defaults to `https://lacarte.lazynerdstudios.com/api`
  - `tomtomApiKey` → `process.env.NUXT_PUBLIC_TOMTOM_API_KEY` defaults to empty string

**Environment variables**
- `.env` and `.env.*` files are gitignored (except `.env.example`), so per-environment secrets are expected to be provided by the deployment platform rather than committed.
- The Kiro steering/spec docs document the required variables (`NUXT_PUBLIC_API_BASE`, `NUXT_PUBLIC_TOMTOM_API_KEY`) as the single source of truth for what must be set.

**Consumption pattern**
- Any client-side code calls `useRuntimeConfig()` and reads `config.public.<key>`:
  - `app/composables/useApi.ts` builds API URLs from `config.public.apiBase`
  - `app/stores/auth.ts` does the same for auth/session endpoints
  - Map/tracking pages read `config.public.tomtomApiKey` and show an error message when it is missing
- There is no central typed config object or schema validation — each consumer reads the raw value directly.

**Design decisions & conventions**
- Only `public` runtime config is used; there are no `private` keys, meaning nothing secret is baked into the client bundle beyond what the backend tolerates (the TomTom API key is intentionally public).
- Defaults are always provided in `nuxt.config.ts`, so the app runs without any env vars (with degraded functionality — e.g., maps show an error instead of crashing).
- No feature-flag framework or layered config merging is implemented; configuration is flat and single-source-of-truth via environment variables.