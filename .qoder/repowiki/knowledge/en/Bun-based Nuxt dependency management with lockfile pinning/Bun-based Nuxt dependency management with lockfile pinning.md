---
kind: dependency_management
name: Bun-based Nuxt dependency management with lockfile pinning
category: dependency_management
scope:
    - '**'
source_files:
    - package.json
    - bun.lock
    - skills-lock.json
---

This repository uses **Bun** as its package manager for a single-root Nuxt 4 application. Dependencies are declared in the root `package.json` and resolved/locked via `bun.lock`, which is committed to version control.

### System overview
- **Package manager**: Bun (no `yarn.lock` or `pnpm-lock.yaml`; `bun.lock` is present).
- **Manifest**: Root-level `package.json` with `"private": true` — there are no workspaces, sub-packages, or nested `package.json` files; all dependencies live at the top level.
- **Lockfile**: `bun.lock` (lockfileVersion 1) pins every transitive dependency by name, version, and sha512 hash, ensuring reproducible installs across machines.
- **Postinstall hook**: `postinstall: "nuxt prepare"` runs automatically after install so Nuxt's typegen and plugin scaffolding are available immediately.
- **No vendoring / private registry**: No `.npmrc`, `.bunfig.toml`, `vendor/`, or `GOPRIVATE` configuration was found — packages are pulled directly from the public npm registry.
- **Agent skill lock**: A separate `skills-lock.json` pins an AI agent skill (`tomtom-maps-sdk-js`) sourced from GitHub, independent of npm/Bun.

### Dependency categories
- **Runtime** (`dependencies`): Nuxt 4 framework, Vue 3 + vue-router, Pinia + persisted-state plugin, @nuxt/ui v4, TomTom Maps SDK, xlsx for spreadsheet export.
- **Dev-only** (`devDependencies`): Vitest test runner, happy-dom DOM shim, fast-check property testing, @vue/test-utils, @types/node.
- All versions use caret ranges (`^x.y.z`), allowing minor/patch upgrades while keeping major versions fixed.

### Conventions developers should follow
1. **Always run `bun install`** (not npm/yarn/pnpm) so the correct `bun.lock` is produced and consumed.
2. **Commit `bun.lock`** alongside any change to `package.json` — it is the source of truth for reproducible builds.
3. **Do not introduce nested `package.json` files** — this is a flat, non-workspace project; add new deps to the root manifest only.
4. **Prefer caret ranges** (`^`) for library versions as established by existing entries; avoid exact pins unless a breaking change requires it.
5. **Keep runtime vs dev split clean** — put build/test tooling under `devDependencies` and only ship runtime libs under `dependencies`.