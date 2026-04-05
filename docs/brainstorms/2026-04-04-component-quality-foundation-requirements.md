---
date: 2026-04-04
topic: component-quality-foundation
---

# Component Quality Foundation

## Problem Frame

Vanilla Breeze has 73 web components (directories with JS entry files under `src/web-components/`), but three downstream quality systems — API drift detection (`scripts/quality/api-drift-check.js`), HTML validation (`build-api-registry.js` → `elements.cjs`), and doc generation — all require `api.json` to operate. Only 26 of 73 components have one. Similarly, `static.html` (the zero-JS progressive enhancement baseline) is missing from 21 components, leaving the spec template's "Static HTML Form" section unfulfilled.

The result: quality tools run on ~35% of the component surface. New components added without these files perpetuate the gap because there is no scaffold command that generates them and no conformance rule that enforces their presence.

This initiative closes all three gaps in one push: backfill existing components, enforce the contract going forward, and provide a scaffold that makes compliance the path of least resistance.

```
┌─────────────────────────────────────────────────────┐
│           Component Quality Foundation               │
│                                                      │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │  Backfill    │  │  Enforce     │  │  Scaffold  │ │
│  │             │  │              │  │            │ │
│  │ • 47 api.json│  │ • companion  │  │ • full dir │ │
│  │ • 21 static  │  │   script     │  │ • demo     │ │
│  │ • script +   │  │   checks dir │  │ • elements │ │
│  │   human      │  │   structure  │  │ • index.js │ │
│  │   authoring  │  │              │  │            │ │
│  └──────┬──────┘  └──────┬───────┘  └─────┬──────┘ │
│         │                │                 │         │
│         └────────────────┼─────────────────┘         │
│                          ▼                           │
│              100% contract coverage                  │
│         All quality tools fully activated             │
└─────────────────────────────────────────────────────┘
```

## Requirements

**Backfill Generator**

- R1. A generator script scans each component directory for its JS entry file (`logic.js` or component-named `.js` file — e.g., `icon-wc/icon-wc.js`), reads `observedAttributes`, `@attr` JSDoc annotations, and `getAttribute()` calls, and produces an `api.json` draft matching the schema at `src/schemas/api.schema.json`. Attribute names are extractable; `kind` and `purpose` fields will require human authoring for each attribute (~150-200 classifications across 47 components).
- R2. A generator script creates `static.html` stubs for the 21 missing components. Each stub is a bare HTML fragment (not a full document) containing minimal semantic markup that represents the component's degraded state. For JS-dependent components (chart-wc, calendar-wc, color-picker), the stub contains a graceful degradation message. The generator uses a canned fallback template for components where no meaningful static form can be inferred.
- R3. Generated files are drafts. The script outputs a summary of what it generated, flags components with zero extractable attributes (valid outcome — some components have `"attributes": []`), and flags components where extraction was ambiguous. Human authoring of attribute `kind`/`purpose` classifications is required before enforcement activates.

**Conformance Enforcement**

- R4. A new companion script (not added to `vb-conformance.js`, which parses HTML) scans `src/web-components/*/` directories and fails the build when a directory contains a JS entry file (`logic.js` or component-named `.js`) but no `api.json`.
- R5. The same companion script fails the build when a directory contains a JS entry file but no `static.html`.
- R6. The companion script is called by `npm run conformance` (or a parent `npm run check` path) so it runs in CI alongside existing checks. Enforcement activates only after backfill is complete — the companion script and backfilled files ship in the same commit.

**Scaffold Command**

- R7. A command generates a complete component directory under `src/web-components/<name>/` with: `logic.js` (VBElement subclass stub), `styles.css` (empty with standard header), `api.json` (valid stub with element name and empty attributes array), and `static.html` (bare fragment with fallback markup).
- R8. The command generates a demo stub at `demos/examples/demos/<name>-basic.html` using `<browser-window>` + `<code-block>` conventions.
- R9. The command registers the component's import at the end of `src/web-components/index.js`.
- R10. The command adds the element definition to `.claude/schemas/elements.json` (the hand-maintained HTML validation registry). The auto-generated `src/htmlvalidate/elements.cjs` is rebuilt from `api.json` by `build-api-registry.js` — no manual edit needed there.
- R11. All generated source files and the demo pass existing `npm run conformance` and the new companion script immediately after creation with zero manual edits. Note: `static.html` files live outside the `npm run conformance` HTML scan path and are covered only by the companion script's presence check.
- R12. If the command is run for a component name that already exists, it refuses and exits with an error message listing which files already exist.

## Success Criteria

- 73/73 component directories contain both `api.json` and `static.html`
- The companion conformance script fails if any component directory has a JS entry file without `api.json` or `static.html`
- Running the scaffold command for a new component produces a directory that passes all quality gates on first run
- Existing quality tools (`api-drift-check.js`, `build-api-registry.js`) operate on the full component surface
- After backfill, `npm run build:api` succeeds and incorporates all 73 manifests into generated output

## Scope Boundaries

- **Not backfilling doc pages** — already at ~100% coverage (75 pages for 73 components)
- **Not rewriting existing api.json files** — the 26 existing manifests are left as-is
- **Not changing api.json schema** — generated files follow the existing schema at `src/schemas/api.schema.json`
- **Not adding doc page generation to the scaffold** — doc pages require substantive prose authoring; a stub would be noise. The existing convention ("ship docs alongside new components") remains a social contract, not an automated check.
- **Not wiring new checks into pre-commit hooks** — conformance in CI is sufficient; hooks add friction during rapid iteration
- **Not merging the two element registries** — `.claude/schemas/elements.json` (hand-maintained) and `src/htmlvalidate/elements.cjs` (auto-generated from api.json) coexist. Consolidation is a separate initiative.

## Key Decisions

- **Backfill + scaffold ship first; enforcement activates in the same commit**: The companion script and all backfilled files land together. Intermediate commits during development may fail the companion script — use branch strategy (squash merge) to avoid CI failures on partial work.
- **Script-generated + human authoring for backfill**: The generator extracts attribute names automatically but `kind`/`purpose` fields require human authoring (~200 classifications). This is an authoring task, not just a review pass.
- **static.html universally required**: Even JS-heavy components get a static.html with a graceful degradation message. Stubs are bare HTML fragments, not full documents.
- **Full structural scaffold**: One command produces source files, demo stub, `.claude/schemas/elements.json` entry, and `index.js` registration. A new component is immediately buildable and conformance-passing. Doc page authoring remains manual.
- **Companion script for directory-level checks**: The existing `vb-conformance.js` parses HTML files for markup violations. Directory-structure checks (api.json/static.html presence) belong in a separate companion script to avoid mixing concerns.
- **JS entry file detection includes non-standard names**: The trigger is `logic.js` OR a `.js` file matching the component directory name (e.g., `icon-wc/icon-wc.js`). This ensures `icon-wc` is not silently excluded from enforcement.

## Dependencies / Assumptions

- The existing `api.json` schema at `src/schemas/api.schema.json` is the target format for generated manifests
- `build-api-registry.js` discovers api.json files by scanning `src/web-components/*/api.json` — new files are picked up automatically without code changes
- Components without `@attr` JSDoc or `observedAttributes` will produce api.json with `"attributes": []` — this is a valid outcome, not an error
- Some components access attributes exclusively via `this.dataset.*` — the generator should detect `dataset` access patterns alongside `getAttribute()` calls

## Outstanding Questions

### Deferred to Planning

- [Affects R1][Needs research] Which extraction method produces the most complete api.json — `observedAttributes` array, `@attr` JSDoc, `getAttribute()` calls, `this.dataset.*`, or a combination? Investigate the 26 existing api.json files to determine the canonical source of truth and validate against a sample of the 47 missing components.
- [Affects R7][Technical] Should the scaffold command be a Node.js script in `scripts/` or a Claude Code command in `.claude/commands/`? The current `add-element` is a Claude command but only touches `elements.json`. R9-R10 require file modifications that a Claude command handles naturally but a Node.js script would need to implement as text transforms.
- [Affects R8][Technical] What is the minimal demo HTML that passes conformance? Audit an existing passing demo to extract the required boilerplate.

## Next Steps

→ `/ce:plan` for structured implementation planning
