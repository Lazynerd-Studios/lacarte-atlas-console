---
kind: logging_system
name: No structured logging system — raw console.log throughout
category: logging_system
scope:
    - '**'
source_files:
    - app/composables/useApi.ts
    - app/middleware/auth.global.ts
    - app/middleware/permissions.global.ts
    - app/plugins/auth-init.client.ts
    - app/stores/auth.ts
---

This repository does not implement a structured logging system. There is no dedicated logger library (e.g. pino, winston, bunyan), no log-level configuration, no centralized logger initialization, and no logging middleware or plugin in `nuxt.config.ts` or the Nuxt plugins directory.

All logging is done via ad-hoc `console.log`, `console.debug`, and `console.error` calls scattered across composables (`app/composables/useApi.ts`), global middlewares (`app/middleware/auth.global.ts`, `app/middleware/permissions.global.ts`), client-side plugins (`app/plugins/auth-init.client.ts`), Pinia stores (`app/stores/auth.ts`), and individual Vue components/pages. The only convention observed is a bracketed module prefix on messages (e.g. `[useApi]`, `[auth]`, `[permissions]`, `[mail]`) to help identify the source of each line in the browser console.

There are no log sinks, rotation, remote ingestion, or environment-based level filtering. Errors are logged to the console but are not surfaced through the application's toast/notification layer.