---
kind: logging_system
name: No dedicated logging system — raw console calls only
category: logging_system
scope:
    - '**'
---

This repository does not implement a structured or centralized logging system. There is no logging framework (e.g., pino, winston, bunyan), no logger initialization in `nuxt.config.ts`, and no logging-related dependencies in `package.json`. All diagnostic output is produced ad hoc via bare `console.log` / `console.error` calls scattered throughout Vue components, composables, and middleware (for example in `app/components/AddRoleModal.vue`, `app/composables/useApi.ts`, `app/middleware/auth.global.ts`). These calls are unstructured, lack log levels beyond the implicit `log`/`error` distinction, and have no central sink or configuration. As such, this category does not apply to the codebase.