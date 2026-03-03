---
id: tighten-type-safety
project: vanilla-breeze
status: done
priority: p1
depends: []
created: 2026-03-01
updated: 2026-03-01
---

# Tighten Type Safety — Strict Mode, JSDoc Coverage, Expanded Scope

Incrementally tighten the TypeScript type-checking pipeline introduced in Phases 1–4 by enabling strict flags, adding shared type definitions, enforcing JSDoc on exports, reducing `@type {any}` casts, and expanding scope to scripts/ and tests/.

## Context

- Phases 1–4 established `tsconfig.json` with `checkJs: true`, fixed 367 type errors, wired `tsc --noEmit` and `eslint-plugin-jsdoc` into CI.
- The foundation was lenient: `strict: false`, no JSDoc enforcement, only `src/` checked, just 1 `@typedef` in the codebase, 12 `@type {any}` casts.
- This task covers Phases 5–10 of the type-checking initiative.

## Acceptance Criteria

- [x] `strictNullChecks: true` enabled — all null-safety errors fixed
- [x] `noImplicitReturns: true` enabled — zero errors
- [x] Shared `@typedef` definitions in `src/types.d.ts` for key data shapes
- [x] `jsdoc/require-param` and `jsdoc/require-returns` added as warn-level ESLint rules
- [x] `@type {any}` casts reduced from 12 to 2 (only lazy-load patterns remain)
- [x] `scripts/` and `tests/` added to type-checked scope via separate tsconfigs
- [x] `npm run typecheck` covers all three tsconfigs
- [x] `npm test` — 294 pass, 0 fail
- [x] `npm run lint:js` — 0 errors
- [x] `npm run build:cdn` — succeeds

## Out of Scope

- Enabling full `strict: true` (would require `noImplicitAny` which is too disruptive)
- Fixing the 87 JSDoc warnings (informational, to be addressed incrementally)
- Type-checking Playwright test files (`tests/visual/`, `tests/components/`)

## Notes

- `strictNullChecks` was the highest-impact change, surfacing 279 errors across 39 files. The dominant pattern was class fields initialized as `null` then later assigned — fixed by adding `/** @type {X | null} */` annotations.
- CSS API extensions (`anchorName`, `positionAnchor`, `fieldSizing`) added to `CSSStyleDeclaration` in types.d.ts eliminated several `any` casts for emerging CSS features.
- The `VBCommandRegistry` type replaced the inline Map type on `window.__commandRegistry` and resolved circular-import workaround casts in command-palette and short-cuts.
- Scripts had 211 errors, nearly all from esbuild string literal types in `build-cdn.js` — fixed with `/** @type {const} */` assertions.

---

## Session Log

### 2026-03-01

**Did:** Implemented all 6 phases (5–10) in a single session:
- Phase 5: Enabled `strictNullChecks`, fixed 279 errors across 39 files (null guards, JSDoc type annotations, nullable field types)
- Phase 6: Enabled `noImplicitReturns` — zero additional errors needed fixing
- Phase 7: Added 15 shared interfaces to `src/types.d.ts` (VBCommandEntry, VBCommandRegistry, VBChartOptions, VBSwipeOptions, VBMapImage, VBWizardForm, VBMathGlobal, CSS extensions, etc.)
- Phase 8: Added `jsdoc/require-param` and `jsdoc/require-returns` as warn-level rules to eslint config
- Phase 9: Replaced 10 of 12 `@type {any}` casts with proper types using the new shared definitions
- Phase 10: Created `tsconfig.scripts.json` and `tsconfig.tests.json`, fixed 222 errors in scripts/ and tests/, updated `typecheck` npm script to cover all 3 scopes

**Next:** None — task complete. Future work: incrementally address the 87 JSDoc warnings, consider `noImplicitAny` when coverage is higher.
**Blockers:** None.
