---
kind: error_handling
name: Composable-Centric Error Handling with Toast Feedback
category: error_handling
scope:
    - '**'
source_files:
    - app/composables/useErrorHandler.ts
    - app/composables/useApi.ts
    - app/composables/useToast.ts
    - app/components/AppToast.vue
---

The application uses a composable-based error handling strategy centered around two core composables: useErrorHandler and useApi, backed by a global toast notification system.

Core Architecture
- app/composables/useErrorHandler.ts — A thin wrapper that executes an async function and converts any thrown error into a user-facing toast notification via useAppToast(). The run(fn, title?, message?) method returns T | null, allowing callers to guard with if (!data) instead of try/catch blocks.
- app/composables/useApi.ts — Centralized HTTP client built on fetch. It handles authentication headers, session expiration (401 -> logout + redirect), and response parsing. Non-success status codes throw Error objects with either the server's message field or a generic Request failed (status) message. Provides typed convenience methods (get, post, put, patch, del) that automatically wrap calls through useErrorHandler.run() to show toasts and return null on failure. A raw request method is also exposed for callers who want to handle errors themselves.
- app/composables/useToast.ts + app/components/AppToast.vue — Global toast state managed via a Vue ref singleton. Supports four types (success, error, warning, info) with auto-dismiss timers and a fixed-position overlay component.

Error Propagation Pattern
Errors flow in two layers:
1. Network layer (useApi.request): Converts HTTP failures into Error objects with descriptive messages.
2. Presentation layer (useErrorHandler.run): Catches those errors, displays a toast, and returns null.

Callers typically use the convenience methods which already include toast wrapping:
const result = await api.patch('/customer/admin/.../suspend', { reason }, 'Failed to suspend account')
if (result) { /* success path */ }
// no explicit catch needed

For operations requiring custom error handling, the raw request method is available.

Conventions Observed
- All API calls go through useApi() — direct fetch usage is avoided.
- User-facing error titles are passed as the third argument to convenience methods (e.g., 'Failed to load data').
- Success feedback uses toast.success() directly after checking the returned value.
- Validation errors (non-API) call toast.error() directly from components.
- No sentinel error types, error classes, or structured error codes are defined — errors are plain Error instances.
- No middleware-level error handling exists; session expiry is handled at the HTTP layer.
- No try/catch blocks are used in pages when using the wrapped API methods.

Notable Gaps
- No centralized error logging or analytics integration.
- No distinction between network errors, validation errors, and business logic errors beyond message strings.
- No retry logic or exponential backoff for failed requests.