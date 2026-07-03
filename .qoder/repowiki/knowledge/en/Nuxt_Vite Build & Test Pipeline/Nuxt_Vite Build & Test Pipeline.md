---
kind: build_system
name: Nuxt/Vite Build & Test Pipeline
category: build_system
scope:
    - '**'
source_files:
    - package.json
    - nuxt.config.ts
    - vitest.config.ts
---

This repository is a single Nuxt 4 application with no monorepo tooling (no Turborepo, Nx, pnpm workspaces). The build system is minimal and centered on three files: package.json scripts, nuxt.config.ts, and vitest.config.ts.

Build toolchain:
- Bundler: Vite via Nuxt (nuxt build / nuxt generate). Target is esnext; dependency pre-bundling includes xlsx explicitly.
- Runtime config: injected through runtimeConfig.public.* from NUXT_PUBLIC_* env vars; SSR is disabled for login/pay/tracking routes via routeRules.
- Output: .output/ directory produced by nuxt build; static export available via nuxt generate.

Scripts (from package.json):
- dev: nuxt dev
- build: nuxt build
- generate: nuxt generate (SSG)
- preview: nuxt preview (serve the .output dir)
- postinstall: nuxt prepare (type-gen + module bootstrap)
- test / test:watch: Vitest run in happy-dom environment

Testing:
- Vitest 4 with @vitejs/plugin-vue and happy-dom environment.
- Path aliases ~ and @ resolve to ./app, mirroring Nuxt's app root so tests can import components/composables directly.
- Tests live alongside source under __tests__/ directories inside feature folders (e.g. app/pages/management/__tests__, app/utils/__tests__).

What is NOT present:
- No Dockerfile, docker-compose, or containerization configuration.
- No CI pipeline (no .github/workflows, .gitlab-ci.yml, Jenkinsfile, etc.).
- No Makefile or shell-based build/deploy scripts.
- No version bumping or release automation beyond manual Git tags.

Conventions for developers:
- Add new npm scripts only in package.json; do not introduce separate build shells.
- Keep test files co-located with the code they exercise under __tests__/ sibling directories.
- New runtime values must be added to runtimeConfig.public in nuxt.config.ts and consumed via useRuntimeConfig().public.*.
- If adding pages that need client-only rendering, register them in routeRules.ssr: false.