# Codebase Audit Report

## Audit Status: Incomplete

The review agent did **not complete the whole-codebase source audit**. The findings below come from independent validation and dependency scanning—not a completed architectural, security, or API review.

This document preserves the full report delivered in the review session, including its limitations. It does not represent completion of the eight-area source audit or approval of the codebase.

### Repository Snapshot

- **Project:** LaCarte Atlas Console
- **Branch:** `prod`
- **Commit:** `fadd8642054d710d5776fb9df213165dcdff14af`
- **Source changes during the audit:** None; the working tree was clean at the end of the audit.
- **Report creation:** This Markdown file was created afterward at the user's request.

## Validation Results

| Check | Result |
|---|---|
| Full test suite | **Incomplete:** 274 tests passed across 23 files. The team-list property suite remained at 0/11 after approximately 8.5 minutes; the audit's test processes were stopped. |
| Rates data-fetching tests | All 8 passed. |
| Rates filtering tests | All 15 passed. |
| Typecheck | No TypeScript diagnostics appeared, but the final exit code could not be recovered. Not counted as a verified pass. |
| Dependency audit | Reported **98 advisories: 5 Critical, 44 High, 40 Medium, 9 Low**. Includes development/build dependencies and repeated advisory entries. |

The scanner's `moderate` severity is presented as **Medium** in this report. The advisory total is the scanner-reported count, not a count of independently verified application vulnerabilities.

Passing tests do not establish that the documented requirements are covered.

### Validation Commands

- `bun run test`
- `node node_modules/nuxt/bin/nuxt.mjs typecheck`
- `bun audit --production`
- `bun audit --audit-level=critical`
- `git status --short`

**Dependency-scan scope caveat:** The installed Bun version's `audit --help` did not list a `--production` option, and the scan output included development dependencies. The initial command must therefore not be interpreted as a production-only audit. A subsequent Critical-only scan confirmed the five Critical-rated dependency advisories listed below.

## Security Findings Requiring Triage

The severities below are **upstream advisory ratings**. Affected dependencies were reported by the scanner; exploitability within this application remains unverified.

### SEC-01 — MapLibre Sanitization Bypass

- **Severity:** Critical — upstream advisory rating.
- **Dependency path:** TomTom Maps SDK → `maplibre-gl`.
- **Finding:** Untrusted map attribution HTML can execute scripts because of a sanitization bypass.
- **Exposure conditions:** The upstream advisory concerns applications rendering untrusted or third-party style attribution strings, or user-supplied custom attributions. This application's exposure was not established.
- **Recommendation:** Upgrade through a compatible SDK/dependency path resolving MapLibre **6.4.1 or later**. Avoid an untested major-version override.
- **Verification:** Confirm the resolved dependency version, verify attribution sources, and add malicious-attribution regression tests.
- **Reference:** [GHSA-jrc7-96c5-q579](https://github.com/advisories/GHSA-jrc7-96c5-q579).

### SEC-02 — Nuxt DevTools Unauthenticated RPC Command Execution

- **Severity:** Critical — upstream advisory rating.
- **Dependency path:** Nuxt → `@nuxt/devtools`.
- **Finding:** Affected DevTools versions expose an unauthenticated RPC path that can lead to command execution on the developer's machine.
- **Exposure conditions:** This affects development environments, not production builds. Reachability of the development HMR endpoint matters; the advisory also describes cross-origin browser access.
- **Recommendation:** Resolve DevTools **3.3.1 or later**. Disable affected DevTools until upgraded.
- **Verification:** Confirm the resolved lockfile version and verify development tooling behavior after updating.
- **Reference:** [GHSA-279x-mwfv-vcqv](https://github.com/advisories/GHSA-279x-mwfv-vcqv).

### SEC-03 — shell-quote Command Injection

- **Severity:** Critical — upstream advisory rating.
- **Dependency path:** Nuxt → DevTools → editor-launching dependencies → `shell-quote`.
- **Finding:** Shell command injection is possible when attacker-influenced operator objects are quoted and the result is executed by a shell.
- **Exposure conditions:** Requires attacker-influenced operator objects to reach shell execution. An affected package in the dependency tree alone does not establish this path in the application.
- **Recommendation:** Resolve **1.8.4 or later** through compatible parent updates.
- **Verification:** Confirm the resolved dependency version and verify editor integration afterward.
- **Reference:** [GHSA-w7jw-789q-3m8p](https://github.com/advisories/GHSA-w7jw-789q-3m8p).

### SEC-04 — tar Resource Exhaustion

- **Severity:** Critical — upstream advisory rating.
- **Dependency path:** Nitro/build dependency chain → `tar`.
- **Finding:** Processing malicious archives can exhaust disk space and CPU because of insufficient decompression and parsing limits.
- **Exposure conditions:** Exploitation requires processing untrusted archives. Application or build-pipeline reachability was not established.
- **Recommendation:** Resolve **7.5.19 or later**. Identify archive-processing exposure and impose resource limits where applicable.
- **Verification:** Confirm the resolved dependency version and validate bounded archive processing if that functionality is exposed.
- **Reference:** [GHSA-23hp-3jrh-7fpw](https://github.com/advisories/GHSA-23hp-3jrh-7fpw).

### SEC-05 — seroval Unsafe Deserialization

- **Severity:** Critical — upstream advisory rating.
- **Dependency path:** Nuxt → Vite builder → `seroval`.
- **Finding:** A type-confusion issue can cause unintended side effects during deserialization.
- **Exposure conditions:** Impact depends on untrusted input and enabled deserialization plugins. Application reachability was not established.
- **Recommendation:** Resolve **1.5.3 or later** and determine whether the affected path is reachable outside trusted tooling.
- **Verification:** Confirm the resolved dependency version and, where applicable, test that untrusted deserialization cannot invoke unintended behavior.
- **Reference:** [GHSA-mv8w-475r-vwqw](https://github.com/advisories/GHSA-mv8w-475r-vwqw).

### SEC-06 — SheetJS Prototype Pollution and ReDoS Advisories

- **Severity:** High — upstream advisory rating.
- **Evidence:** The project declares `xlsx: ^0.18.5` in [package.json](./package.json#L23), and the dependency scan flagged both advisories.
- **Finding:** The dependency is associated with prototype pollution and regular-expression denial-of-service vulnerabilities.
- **Exposure conditions:** Establish whether the application parses untrusted workbooks. Dependency presence alone does not prove that vulnerable parsing paths are exposed.
- **Recommendation:** Move to a maintained, patched distribution or replacement.
- **Verification:** Confirm the resolved dependency version and regression-test spreadsheet functionality, including untrusted-input handling if supported.
- **References:** [Prototype pollution — GHSA-4r6h-8v6p-xvw6](https://github.com/advisories/GHSA-4r6h-8v6p-xvw6); [ReDoS — GHSA-5pgg-2g8v-p4x9](https://github.com/advisories/GHSA-5pgg-2g8v-p4x9).

### SEC-07 — Nuxt Framework Advisories

- **Severity:** High — upstream advisory rating for the highlighted findings.
- **Evidence:** The dependency scan flagged Nuxt framework advisories, including route-rule middleware bypass and server-island vulnerabilities.
- **Exposure conditions:** Affected feature usage and deployment exposure were not established.
- **Recommendation:** Upgrade to a patched compatible release, then test route protection and any server-island functionality.
- **Verification:** Confirm the resolved dependency versions, rerun the audit, and verify authorization behavior for relevant route variations and server-rendering entry points.
- **Reference:** [Middleware bypass — GHSA-mm7m-92g8-7m47](https://github.com/advisories/GHSA-mm7m-92g8-7m47).

### Dependency Remediation Guidance

After dependency updates, rerun the complete audit, tests, typecheck, and production build. Do not treat blanket dependency overrides as verified fixes.

The findings above highlight selected scanner results, including all five Critical-rated advisories. They are not an individually triaged inventory of all 98 reported entries.

## Testing and Quality Findings

### TEST-01 — Test-Suite Completion Was Unreliable in This Run

- **Severity:** Medium.
- **Evidence:** [team-list-property.test.ts](./app/pages/team/__tests__/team-list-property.test.ts) did not complete while the other 23 suites passed.
- **Observed behavior:** The suite remained at 0/11 after approximately 8.5 minutes. The test run reported 274 passed tests out of 285 before its processes were stopped.
- **Impact:** The run could not establish a complete test-suite pass and demonstrated a potential CI completion risk.
- **Recommendation:** Reproduce with a recorded property-test seed, investigate generator/shrinking termination, and enforce a process-level CI timeout.
- **Verification:** Complete the affected suite and the full test run within a documented time budget; preserve any reproducible seed and regression case.
- **Limitation:** The underlying cause is not established. The final exit code, 255, resulted from stopping the run and is not evidence of an assertion failure.

### TEST-02 — Component Tests Emit Unresolved-Component Warnings

- **Severity:** Low.
- **Evidence:** All eight [ConfirmDialog tests](./app/components/__tests__/ConfirmDialog.test.ts) passed while emitting `Failed to resolve component: UIcon`.
- **Impact:** The test environment does not resolve the intended icon component, so passing assertions do not validate that integration.
- **Recommendation:** Register the intended component or an explicit test stub. Make unexpected Vue warnings fail tests so missing integrations are not silently accepted.
- **Verification:** Rerun the component tests without unresolved-component warnings and verify that the chosen real-component or stub behavior is intentional.

## Outstanding Review Scope

The following requested assessments remain **unverified**, not issue-free:

| Requested area | Outstanding assessment |
|---|---|
| Code Quality and Consistency | Adherence to `coding_conventions.md`, production logging, missing error handling, inconsistent patterns, and type-safety practices. |
| API Integration | Handling of 400, 401, 403, 404, and 500 responses; loading states; data refresh behavior; comparison with rate and subscription design specifications. |
| Testing Coverage | Requirement-to-test mapping, including the rates data-fetching/filtering tests and `rate-management/tasks.md`; distinction between testing production implementation and test-local logic. |
| State Management | Pinia state, persistence, composable ownership, cleanup, hydration, and SSR compatibility. |
| Application Security | Authentication and authorization enforcement, permission handling, and sensitive-data exposure. Dependency advisories do not substitute for this assessment. |
| Performance | Fetching efficiency, request duplication, debouncing/throttling, unnecessary rendering, and runtime bottlenecks. |
| Documentation | Accuracy and completeness of conventions, architecture documentation, specifications, and task status relative to current implementation. |
| UI/UX Consistency | Design-system adherence, loading/empty/error states, and toast behavior using `useToast.ts`. No rendered visual or accessibility approval was established. |

## Recommended Priorities

1. **Triage dependency-security exposure.** Start with the five Critical-rated advisories, distinguish runtime exposure from development/build tooling, and plan compatible patched updates.
2. **Resolve the stalled test suite.** Capture a reproducible case, establish bounded execution, and obtain a complete suite result.
3. **Obtain definitive validation results.** Capture a typecheck exit code and rerun tests, the dependency audit, and a production build after remediation.
4. **Complete the source-review pass.** Map the requested specifications to implementation and tests, and assess all eight requested areas with exact source evidence.

## Final Assessment

The immediate priorities supported by this run are dependency-security triage and resolving the stalled test suite. A complete source-review pass is still required to deliver the requested eight-area audit.

**This report must not be used as codebase approval or as evidence that unreviewed areas are free of issues.**
