# LaCarte Atlas Console

Admin dashboard for LaCarte Waste Management — manage customers, drivers, trucks, pickups, billing, and live tracking.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Nuxt 4](https://nuxt.com/) (Vue 3 + Vite) |
| UI | [@nuxt/ui](https://ui.nuxt.com/) + custom CSS design system |
| State | [Pinia](https://pinia.vuejs.org/) with persisted state |
| Auth | Better Auth (email/password + JWT tokens) |
| Maps | TomTom Maps SDK |
| Testing | [Vitest](https://vitest.dev/) + [Vue Test Utils](https://test-utils.vuejs.org/) |
| Runtime | [Bun](https://bun.sh/) |

## Prerequisites

- [Bun](https://bun.sh/) ≥ 1.x
- Node.js ≥ 20 (alternative runtime)

## Environment Variables

Copy `.env.example` (create it from the template below) and fill in your values:

```bash
NUXT_PUBLIC_API_BASE=https://your-api.example.com/api
NUXT_PUBLIC_TOMTOM_API_KEY=your_tomtom_api_key
NUXT_PUBLIC_SESSION_DURATION_MINUTES=30
NUXT_PUBLIC_SESSION_WARNING_SECONDS=120
NUXT_PUBLIC_SESSION_CHECK_INTERVAL_MINUTES=5
```

| Variable | Description | Default |
|---|---|---|
| `NUXT_PUBLIC_API_BASE` | Backend API base URL | Required |
| `NUXT_PUBLIC_TOMTOM_API_KEY` | TomTom Maps API key | Required |
| `NUXT_PUBLIC_SESSION_DURATION_MINUTES` | Session lifetime in minutes | `30` |
| `NUXT_PUBLIC_SESSION_WARNING_SECONDS` | Seconds before expiry to show warning | `120` |
| `NUXT_PUBLIC_SESSION_CHECK_INTERVAL_MINUTES` | Periodic session validation interval | `5` |

## Setup

```bash
bun install
```

## Development

```bash
bun run dev
```

Starts the dev server at `http://localhost:3000` with hot module replacement.

## Testing

```bash
# Run tests once
bun run test

# Watch mode
bun run test:watch
```

## Production Build

```bash
bun run build
bun run preview   # preview the production build locally
```

## Project Structure

```
app/
├── assets/css/         # Global CSS + design tokens
├── components/         # Reusable Vue components
│   └── __tests__/      # Component unit tests
├── composables/        # Shared logic (useApi, useToast, usePermissions, etc.)
│   └── __tests__/
├── layouts/            # Page layouts (dashboard, default)
├── middleware/          # Route guards (auth, permissions)
├── pages/              # File-based routes
│   └── __tests__/      # Page-level tests
├── plugins/            # Nuxt plugins (auth init, Pinia persist)
├── stores/             # Pinia stores (auth)
├── types/              # TypeScript type definitions
│   └── api.ts          # Shared API response envelopes
└── utils/              # Pure utility functions
    └── __tests__/
```

## Key Architecture Decisions

- **API layer**: `useApi()` composable provides typed `get`/`post`/`put`/`patch`/`del` helpers with automatic error toasts via `useErrorHandler()`. Shared response types in `app/types/api.ts` should be used for all API calls.
- **Auth**: JWT-based with Better Auth. Token persisted in `sessionStorage` (not `localStorage`) for security. Session expiry is managed via calculated `setTimeout` timers rather than polling intervals.
- **Permissions**: Route-level guard in `permissions.global.ts` + component-level `PermissionGuard`. Admin roles bypass all permission checks.
- **Styling**: Inline styles with CSS custom properties (`--color-primary: #ffb400`, etc.) + responsive grid utilities in `main.css`. No CSS framework beyond `@nuxt/ui` base.
- **No `console.log` in production**: Per code review checklist, debug logging should be stripped before merging.

## Git Workflow

See `.kiro/steering/git-workflow.md` for branch naming, commit conventions, and PR checklist.

## Testing Guidelines

See `.kiro/steering/testing-guidelines.md` for manual testing checklist, accessibility requirements, and performance benchmarks.
