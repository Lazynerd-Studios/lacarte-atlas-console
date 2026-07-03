---
kind: configuration_system
name: Nuxt Runtime Config via Environment Variables
category: configuration_system
scope:
    - '**'
source_files:
    - nuxt.config.ts
    - app/composables/useApi.ts
    - app/stores/auth.ts
---

The application uses Nuxt's built-in `runtimeConfig` system to manage runtime configuration. All configuration is loaded from environment variables at build/runtime time and exposed through the public runtime config API.

**Configuration source**
- Single source of truth: `nuxt.config.ts` under `runtimeConfig.public`.
- Values are read from environment variables with fallback defaults:
  - `NUXT_PUBLIC_API_BASE` → base URL for all API calls (default: `https://lacarte.lazynerdstudios.com/api`)
  - `NUXT_PUBLIC_TOMTOM_API_KEY` → TomTom Maps SDK key (default: empty string)
- No `.env`, `.env.local`, or other env files are committed; values must be provided by the deployment environment.

**Access pattern**
- Configuration is consumed exclusively via the Nuxt composable `useRuntimeConfig()`.
- Two consumers in the codebase:
  - `app/composables/useApi.ts` — reads `config.public.apiBase` to construct full API URLs.
  - `app/stores/auth.ts` — reads `config.public.apiBase` for auth endpoints (`/user/profile`, `/auth/get-session`, `/auth/sign-out`).
- There is no private server-side runtime config section; only the `public` namespace is used, meaning all configuration is available on both client and server.

**Environment variable naming convention**
- All keys follow the `NUXT_PUBLIC_<NAME>` prefix so Nuxt automatically exposes them as `config.public.<name>`.
- This convention ensures that any value added to `runtimeConfig.public` is automatically typed and accessible without additional setup.

**Conventions developers should follow**
1. Add new runtime configuration entries under `runtimeConfig.public` in `nuxt.config.ts` using the `process.env.NUXT_PUBLIC_*` pattern with sensible defaults.
2. Access configuration via `useRuntimeConfig().public.*` inside composables, stores, or components.
3. Do not hardcode URLs, API keys, or feature flags directly in component or store code — always route through `runtimeConfig`.
4. Since only the `public` namespace is configured, treat all runtime config as client-visible; do not place secrets here.