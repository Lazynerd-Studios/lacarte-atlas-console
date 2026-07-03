---
kind: error_handling
name: Composable-based Error Handling with Toast Feedback
category: error_handling
scope:
    - '**'
source_files:
    - app/composables/useErrorHandler.ts
    - app/composables/useApi.ts
    - app/composables/useToast.ts
    - app/middleware/auth.global.ts
    - app/middleware/permissions.global.ts
    - app/pages/unauthorized.vue
---

The application uses a composable-driven error handling strategy centered around two core composables, `useErrorHandler` and `useApi`, combined with a global toast system for user-facing feedback. There is no centralized error class hierarchy or sentinel-error pattern; instead, errors are thrown as plain `Error` objects and caught locally by callers.

**Core layers**
- `app/composables/useErrorHandler.ts`: Provides a `run(fn, title?, message?)` wrapper that executes an async function, catches any thrown value, displays a toast via `useAppToast().error(title, message)`, and returns `null` on failure so callers can guard with `if (!data)`.
- `app/composables/useApi.ts`: Wraps all HTTP calls through a single `request<T>(path, options)` method. It normalizes non-2xx responses into thrown `Error`s (extracting a `message` field from JSON bodies when available), handles 401 by logging out and redirecting to `/login`, and exposes typed helpers (`get`, `post`, `put`, `patch`, `del`) that automatically wrap each call in `useErrorHandler.run(...)`. A raw `request` entry point is also exported for callers that want to handle errors themselves.
- `app/composables/useToast.ts`: Defines the `ToastType` union (`success | error | warning | info`) and a simple reactive toast store exposed via `useAppToast()`, which is what `useErrorHandler` delegates to for presentation.

**Middleware-level error/authorization flow**
- `app/middleware/auth.global.ts`: Redirects unauthenticated users to `/login`; does not throw or display toasts.
- `app/middleware/permissions.global.ts`: Maps route prefixes to permission strings and redirects denied users to `/unauthorized` (a dedicated page rather than a generic error screen).

**Usage patterns across pages/components**
- Preferred path: use `useApi()`'s typed helpers so failures are auto-toasted and return `null`, e.g. `const data = await api.get('/customers', 'Failed to load customers')`.
- Ad-hoc paths: many components/pages still write their own `try/catch` blocks and call `toast.error(...)` directly, bypassing `useErrorHandler` — this is visible throughout `pages/` and `components/`.
- Validation errors are handled separately in `app/utils/rateValidation.ts` and `app/utils/teamValidation.ts`, returning structured validation messages rather than throwing.

**Conventions developers should follow**
1. Prefer `useApi().get/post/...` over raw `fetch` so 401s, network failures, and non-2xx responses are consistently turned into toasts.
2. When wrapping custom async logic, use `useErrorHandler().run(asyncFn, title, message)` instead of writing local try/catch + toast calls.
3. For auth/permission failures, rely on middleware redirection to `/login` or `/unauthorized` rather than throwing errors in routes.
4. Do not use `throw new Error(...)` at the top level of a page without catching it; always surface errors through `useErrorHandler` or the API layer.