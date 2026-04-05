---
title: "refactor: Component Quality Foundation — backfill, enforce, scaffold"
type: refactor
status: active
date: 2026-04-04
origin: docs/brainstorms/2026-04-04-component-quality-foundation-requirements.md
deepened: 2026-04-04
---

# refactor: Component Quality Foundation — backfill, enforce, scaffold

## Overview

Close the api.json and static.html gaps across all web components in one push. Build a generator to backfill missing api.json and static.html files, add a conformance script that enforces their presence, and create a scaffold command that generates complete component directories for future work. Ships as a single squash-merged commit so enforcement never activates before backfill is complete.

## Problem Frame

Quality tools (api-drift-check, build-api-registry, html-validate) require `api.json` to operate, but only ~26 components have one. Similarly, ~21 components are missing `static.html`. These gaps mean quality tools cover ~35% of the component surface. No conformance rule enforces presence, and no scaffold command generates these files for new components. (see origin: `docs/brainstorms/2026-04-04-component-quality-foundation-requirements.md`)

## Requirements Trace

- R1. api.json backfill generator — extract attributes from `observedAttributes`, JSDoc `@attr`, `getAttribute()`, `this.dataset.*` (corrected: 12 components in the missing set DO use `observedAttributes`)
- R2. static.html backfill generator — full self-contained HTML documents (corrected from origin "bare fragment" — actual codebase convention is full documents)
- R3. Generated files are drafts; human authoring of `kind`/`purpose` required (~200 classifications)
- R4. Companion conformance script fails build when JS entry file exists without api.json
- R5. Same script fails build when JS entry file exists without static.html
- R6. Companion script runs via `npm run conformance`
- R7. Scaffold command generates logic.js, styles.css, api.json, static.html (full document, corrected from origin "bare fragment")
- R8. Scaffold generates demo stub at `demos/examples/demos/<name>-basic.html`
- R9. Scaffold registers import in `src/web-components/index.js`
- R10. Scaffold adds entry to `.claude/schemas/elements.json`
- R11. Generated files pass conformance immediately
- R12. Scaffold refuses if component already exists

## Scope Boundaries

- Not backfilling doc pages (already ~100% coverage)
- Not rewriting existing api.json files
- Not changing api.json schema
- Not adding doc page generation to scaffold
- Not merging the two element registries (`.claude/schemas/elements.json` vs auto-generated `elements.cjs`)
- Not wiring checks into pre-commit hooks
- Not extracting `structure[]` or `childAttributes[]` in the generator — emit empty arrays; these require semantic understanding and belong in the human authoring pass

## Context & Research

### Relevant Code and Patterns

- **api.json schema**: `src/schemas/api.schema.json` — uses `additionalProperties: false` everywhere; typos are hard failures
- **Existing api.json examples**: `src/web-components/{accordion-wc,combo-box,data-table}/api.json`
- **VBElement base class**: `src/lib/vb-element.js` — setup()/teardown() lifecycle, listen() for auto-cleanup, data-upgraded guard
- **Component registration**: `src/lib/bundle-registry.js` — `registerComponent(tag, class)`
- **Build pipeline consumer**: `scripts/build-api-registry.js` — discovers `src/web-components/*/api.json`, generates `elements.cjs` and `apiRegistry.js`
- **Conformance checker**: `scripts/quality/vb-conformance.js` — parses HTML files for markup rules (no-div, no-inline-style, etc.)
- **API drift checker**: `scripts/quality/api-drift-check.js` — 4-guardrail system checking manifest-vs-runtime consistency
- **Static HTML examples**: `src/web-components/{accordion-wc,tool-tip,data-table}/static.html` — full HTML documents with DOCTYPE, self-contained CSS, upgrade comments
- **Demo examples**: `demos/examples/demos/accordion-basic.html` — links `/src/main.css` and `/src/main.js`
- **Elements registry**: `.claude/schemas/elements.json` — hand-maintained, 693 lines
- **Index registration**: `src/web-components/index.js` — simple side-effect imports, append at end

### Institutional Learnings

- **api_manifest_pattern.md**: Always read `logic.js` first for the real API. Document `structure[]` for components requiring specific children. Document `childAttributes[]` by scanning `querySelector('[data-*]')` patterns. Reflected/output-only attributes need `direction: "output"`.
- **feedback_chunked_changes.md**: Break cross-cutting work into category batches. Complete each fully before moving on.
- **feedback_foundation_first.md**: Work foundation-first, base upward.

## Key Technical Decisions

- **Attribute extraction priority order**: (1) `static get observedAttributes()` — returns an explicit array, most reliable; 12 missing components use this. (2) JSDoc `@attr` comments — provide type hints and descriptions. (3) `getAttribute()`/`hasAttribute()` calls in setup(). (4) `this.dataset.*` access. Merge and deduplicate across all sources.
- **`@attr` regex must handle union types**: Use `/@attr\s+\{([^}]+)\}\s+([\w-]+)\s*-?\s*(.*)/` (note `[^}]+` instead of `\w+`) to capture union types like `{'auto'|'manual'|'button'}`. Parse union types as `type: "enum"` with extracted `values` array.
- **`kind` is partially inferrable**: `data-*` → `data`, standard HTML names (disabled, required, name, etc.) → `native`, `aria-*` → `aria`, everything else → `host-api`. ~70% coverage; rest needs human review.
- **`purpose` requires human authoring**: Generator emits `"purpose": "config"` as default placeholder. Summary output flags these for manual classification.
- **`structure[]` and `childAttributes[]` are NOT auto-extracted**: Emit empty arrays. These require semantic understanding of component structure and belong in the human authoring pass alongside `kind`/`purpose`. This avoids brittle querySelector heuristics that produce mostly wrong results.
- **static.html files are full documents (correction from origin)**: Every existing static.html is a complete HTML document. The origin says "bare HTML fragment" but the plan follows actual codebase convention.
- **static.html generator is minimal**: Generates a valid HTML5 document template for all missing components (title, noscript fallback, component-specific TODO comment). Does NOT attempt to infer meaningful static markup — that's an authoring task, not a generation task. The conformance check only verifies file existence.
- **Scaffold is a Claude Code command (`.claude/commands/`)**: R9-R10 require modifying `index.js` and `elements.json` — file modifications that a Claude command handles naturally.
- **Old `add-element` command is deleted**: `.claude/commands/add-element.md` is superseded by the new scaffold command. Leaving both would create a trap: `add-element` produces non-conformant components that fail the new companion script.
- **JS entry file detection**: Trigger is `logic.js` OR `<dirname>.js` (e.g., `icon-wc/icon-wc.js`). Check `logic.js` first, fall back to `<dirname>.js`. If both exist, `logic.js` takes precedence.
- **Companion script named `component-files-check.js`**: Not "contract-check" — the word "contract" is ambiguous in this codebase (could mean API contract, behavioral contract, or structural contract). "files-check" describes exactly what it does: verify required files exist.
- **Generators are disposable one-shot scripts**: After the backfill commit, they have no further purpose. New components use the scaffold command. Mark with a prominent header comment: `// ONE-SHOT BACKFILL SCRIPT — safe to delete after initial run.`
- **Companion script wired into `npm run conformance`**: Not just `npm run check`. A developer running `npm run conformance` should get the full picture. The `conformance` script calls both `vb-conformance.js` and `component-files-check.js`.
- **`this.dataset.propName` → `data-prop-name`**: Generator must convert camelCase dataset properties to kebab-case data attributes (standard JavaScript dataset API behavior).

## Open Questions

### Resolved During Planning

- **Extraction method**: `observedAttributes` primary (12 components use it), JSDoc `@attr` secondary (provides types/descriptions), `getAttribute()`/`hasAttribute()` tertiary, `this.dataset.*` quaternary. All sources merged and deduped.
- **Scaffold command type**: Claude Code command (`.claude/commands/`).
- **Minimal demo boilerplate**: Full HTML5 document linking `/src/main.css` and `/src/main.js`, component usage in body, no divs, no inline styles.
- **Companion script location**: `scripts/quality/component-files-check.js`.
- **static.html format**: Full HTML documents, not fragments.
- **structure/childAttributes**: Not auto-extracted. Emit empty arrays. Human authoring pass handles these.

### Deferred to Implementation

- **Exact `kind` heuristic coverage**: Run the generator against all components and measure correct vs. incorrect classifications.
- **api-drift-check triage**: Some generated manifests will trigger guardrail 3 (ARIA contract) or guardrail 4 (reflected state) failures. Triage each: fix the manifest if extraction was inaccurate, flag for later if logic.js needs changes.

## Implementation Units

- [ ] **Unit 1: Backfill generator script (api.json + static.html)**

  **Goal:** Build a single Node.js script that scans all component directories, generates missing api.json drafts and missing static.html documents.

  **Requirements:** R1, R2, R3

  **Dependencies:** None

  **Files:**
  - Create: `scripts/generators/backfill-component-files.js`
  - Read: `src/schemas/api.schema.json`
  - Read: `src/web-components/*/logic.js` (or `<dirname>.js`)
  - Create: ~48 new `src/web-components/*/api.json` files (output)
  - Create: ~22 new `src/web-components/*/static.html` files (output)

  **Approach:**
  - Single script with two modes: `--api` and `--static` (or both by default)
  - Shared component discovery: scan `src/web-components/*/`, find JS entry file (`logic.js` then `<dirname>.js` fallback), skip non-component entries
  - **api.json generation:**
    1. Read the JS entry file
    2. Parse `static get observedAttributes()` — extract the returned array literal
    3. Parse `@attr` JSDoc using regex: `/@attr\s+\{([^}]+)\}\s+([\w-]+)\s*-?\s*(.*)/`
    4. Scan for `getAttribute('name')`, `hasAttribute('name')` calls
    5. Scan for `this.dataset.propName` — convert camelCase to `data-kebab-case`
    6. Merge and deduplicate attribute names across all sources
    7. Infer `kind` from naming patterns
    8. Set `purpose` to `"config"` as default placeholder
    9. Infer `type` from JSDoc type hints; parse union types as `type: "enum"` with `values`
    10. Scan for `dispatchEvent(new CustomEvent(...))` patterns to populate `events` array
    11. Emit empty `structure` and `childAttributes` arrays
    12. Validate against `api.schema.json` before writing
  - **static.html generation:**
    1. Read JS entry file for component description from JSDoc header
    2. Generate minimal HTML5 document template: DOCTYPE, `<html lang="en">`, head with title, body with component name in heading, `<noscript>` fallback message, and a TODO comment for substantive authoring
    3. No inference of meaningful static markup — all components get the same template
  - Print summary: components processed, attributes per component, zero-attribute flags, ambiguous extractions
  - Mark script with header: `// ONE-SHOT BACKFILL SCRIPT — safe to delete after initial run.`

  **Patterns to follow:**
  - Schema structure from `src/web-components/accordion-wc/api.json`
  - Event patterns from `src/web-components/combo-box/api.json`
  - Field naming from `src/schemas/api.schema.json`
  - Static HTML document structure from `src/web-components/accordion-wc/static.html`

  **Test scenarios:**
  - Happy path: Run against component with `@attr` annotations (calendar-wc) → produces valid api.json with correct attribute names and types
  - Happy path: Run against component with `observedAttributes` (icon-wc) → extracts all 4 observed attributes even without `@attr` JSDoc
  - Happy path: Run against all missing components → produces valid api.json and static.html files, zero schema validation errors
  - Edge case: Component with zero attributes (form-field) → produces api.json with `"attributes": []`, flagged in summary
  - Edge case: Component using `<dirname>.js` naming (icon-wc) → correctly found and processed
  - Edge case: `this.dataset.spotlightPadding` → extracted as `data-spotlight-padding` with `kind: "data"` (camelCase→kebab)
  - Edge case: `@attr {'auto'|'manual'|'button'} data-trigger` (page-tour union type) → extracted as `type: "enum"` with `values: ["auto", "manual", "button"]`
  - Edge case: Component with mixed kinds (native `disabled`/`required` + data-* + host-api) → each attribute gets correct `kind`
  - Edge case: Component with `dispatchEvent(new CustomEvent('change'))` → `events` array populated
  - Edge case: Malformed `@attr` JSDoc (missing type hint) → falls back to `getAttribute()` extraction, attribute still captured
  - Error path: Directory already has api.json → skips it
  - Error path: Directory already has static.html → skips it
  - Integration: All generated api.json files pass `npm run validate:api`
  - Idempotency: Running the script twice produces no changes on second run

  **Verification:**
  - All component directories have api.json and static.html
  - `npm run validate:api` passes
  - Summary output clearly lists which components need `kind`/`purpose`/`structure`/`childAttributes` human authoring

- [ ] **Unit 2: Companion conformance script**

  **Goal:** Build a directory-structure checker that fails the build when any component directory is missing required files.

  **Requirements:** R4, R5, R6

  **Dependencies:** None (can be built in parallel with Unit 1, but only activated alongside backfilled files)

  **Files:**
  - Create: `scripts/quality/component-files-check.js`
  - Modify: `package.json` (add script entry, wire into `conformance`)

  **Approach:**
  - Scan `src/web-components/*/` directories
  - For each directory, detect JS entry file: `logic.js` first, then `<dirname>.js` fallback. If both exist, `logic.js` wins.
  - If no JS entry file found, skip (handles `_component-spec-template.md`, `core.css`, `index.js`, etc.)
  - If JS entry file found: check for both `api.json` and `static.html` presence
  - Report ALL missing files per component (not short-circuit on first missing file)
  - Exit non-zero if any errors found
  - Add `"check:component-files": "node scripts/quality/component-files-check.js"` to package.json
  - Wire into the `conformance` script so `npm run conformance` runs both vb-conformance.js and component-files-check.js

  **Patterns to follow:**
  - Exit code convention from `scripts/quality/api-drift-check.js`
  - Reporting format from `scripts/quality/vb-conformance.js` (✗ for errors, ⚠ for warnings)
  - Discovery pattern from `scripts/build-api-registry.js`

  **Test scenarios:**
  - Happy path: All component directories have api.json and static.html → exit 0, clean output
  - Error path: One component missing api.json → exit 1, error names component and missing file
  - Error path: One component missing static.html → exit 1, error names component and missing file
  - Error path: Component missing BOTH api.json AND static.html → reports both missing files (not just first)
  - Edge case: Non-component directory entries (index.js, core.css, _component-spec-template.md) → silently skipped
  - Edge case: Component using `<dirname>.js` naming (icon-wc) → correctly detected
  - Edge case: Directory with only styles.css and no JS entry file → correctly skipped (no false error)
  - Edge case: Directory with both `logic.js` and `<dirname>.js` → uses `logic.js` as trigger
  - Integration: After Unit 1 backfill, `npm run conformance` exits 0 (proves integration with conformance pipeline)

  **Verification:**
  - `npm run conformance` passes with all components having both files
  - Removing one api.json causes `npm run conformance` to fail with a clear error

- [ ] **Unit 3: Scaffold command**

  **Goal:** Create a Claude Code command that generates a complete, conformance-passing component directory with one invocation.

  **Requirements:** R7, R8, R9, R10, R11, R12

  **Dependencies:** Unit 2 (scaffold output must pass the companion script)

  **Files:**
  - Create: `.claude/commands/scaffold-component.md`
  - Delete: `.claude/commands/add-element.md` (superseded — leaving it would create a trap)
  - Read: `src/web-components/accordion-wc/` (reference for file patterns)
  - Read: `demos/examples/demos/accordion-basic.html` (reference for demo pattern)
  - Modify (at runtime): `src/web-components/index.js`, `.claude/schemas/elements.json`

  **Approach:**
  - Receives component name as `$ARGUMENTS` (e.g., `my-widget`)
  - **Name validation**: Verify the name matches custom element naming rules (lowercase, contains hyphen, doesn't start with digit). Refuse with clear error if invalid.
  - **Guard check (R12)**: Check if `src/web-components/<name>/` exists. If so, list existing files and refuse. This check must happen before any file modifications (no partial state).
  - Generate these files:
    1. `src/web-components/<name>/logic.js` — VBElement subclass with setup()/teardown() stubs, `registerComponent()` call, correct import path (`../../lib/vb-element.js`), JSDoc header with `@attr` placeholder
    2. `src/web-components/<name>/styles.css` — empty file with standard comment header
    3. `src/web-components/<name>/api.json` — valid stub: `{ "element": "<name>", "type": "web-component", "attributes": [] }`
    4. `src/web-components/<name>/static.html` — full HTML document with fallback markup, self-contained CSS, and upgrade comments
    5. `demos/examples/demos/<name>-basic.html` — conformance-passing demo linking `/src/main.css` and `/src/main.js`, component in body with `<browser-window>` wrapper
  - Register the component:
    6. Append `import './<name>/logic.js';` at end of `src/web-components/index.js`
    7. Add element entry to `.claude/schemas/elements.json` with `flow: true`, `permittedContent: ["@flow"]`, empty attributes
  - Print summary of created files

  **Patterns to follow:**
  - VBElement subclass from `src/web-components/accordion-wc/logic.js`
  - Demo structure from `demos/examples/demos/accordion-basic.html`
  - Static HTML from `src/web-components/accordion-wc/static.html`
  - Elements.json entries from `.claude/schemas/elements.json`

  **Test scenarios:**
  - Happy path: `/scaffold-component my-widget` → creates 5 files, modifies 2, all pass conformance
  - Happy path: Generated api.json passes `npm run validate:api`
  - Happy path: Generated demo passes `npm run conformance`
  - Happy path: Generated component passes `npm run check:component-files`
  - Happy path: Generated logic.js imports VBElement from correct path, calls `registerComponent` with correct tag, has `setup()`/`teardown()` methods
  - Happy path: After scaffold, `index.js` contains exactly one new import line matching existing entry format
  - Error path: Existing component name → refuses with error BEFORE any file modifications
  - Error path: Invalid name (no hyphen, uppercase, starts with digit) → refuses with clear error
  - Edge case: Component name with single hyphen (e.g., `tab-set`) → valid, works correctly

  **Verification:**
  - Running the command and then `npm run check` passes without errors
  - The generated component appears in `build:api` output

- [ ] **Unit 4: Integration, verification, and wiring**

  **Goal:** Wire companion script into CI, verify the full quality gate passes, prepare for squash merge.

  **Requirements:** R6, R11, success criteria

  **Dependencies:** Units 1, 2, 3

  **Files:**
  - Modify: `package.json` (ensure `check:component-files` is in both `conformance` and `check` pipelines)
  - Read: all generated api.json and static.html files (verification)

  **Approach:**
  - Verify `npm run conformance` runs both vb-conformance.js and component-files-check.js
  - Run `npm run build:api` to regenerate `elements.cjs` and `apiRegistry.js` from all manifests
  - Run `npm run validate:api` to verify all manifests pass schema validation
  - Run `npm run check:api-drift` — triage any failures:
    - Guardrail 3 (ARIA contract): fix manifest if claimed ARIA attributes aren't in logic.js
    - Guardrail 4 (reflected state): fix manifest if `direction: "output"` attributes lack corresponding `setAttribute` calls
    - Fix manifests or remove incorrect classifications; flag logic.js issues for later
  - Run `npm run check` end-to-end

  **Test scenarios:**
  - Integration: `npm run check` passes end-to-end with all manifests and the new files check
  - Integration: `npm run build:api` succeeds and generates updated `elements.cjs`
  - Integration: `npm run conformance` alone catches a missing api.json (proving it's wired correctly)
  - Integration: Removing one api.json causes `npm run check` to fail
  - Integration: `npm run check:api-drift` passes after manifest triage (guardrails 3+4 clean)
  - Integration: Scaffold command produces a component that passes `npm run check`

  **Verification:**
  - `npm run check` exits 0
  - `npm run build:api` generates output incorporating all manifests
  - The scaffold command produces a conformance-passing component

## System-Wide Impact

- **Interaction graph:** `build-api-registry.js` consumes api.json → generates `elements.cjs` + `apiRegistry.js`. New manifests flow through automatically. `api-drift-check.js` guardrails 3 and 4 will now run against all components — expect some pre-existing ARIA or reflected-state inconsistencies to surface.
- **Error propagation:** Schema validation errors in generated api.json fail `npm run validate:api`. The generator validates before writing to catch early.
- **State lifecycle risks:** Squash merge prevents intermediate CI failures. If the branch is rebased during human authoring, new components added on main could be missed — rerun generator after rebase.
- **API surface parity:** `elements.cjs` (auto-generated) and `.claude/schemas/elements.json` (hand-maintained) will have overlapping entries. This is the current design — no change. The scaffold writes only to `elements.json`; `elements.cjs` is rebuilt by `build:api`.
- **Unchanged invariants:** Existing api.json files are not modified. Existing quality scripts are not modified. Existing static.html files are not modified.

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Attribute extraction incomplete for some components | `observedAttributes` as primary source catches 12 components JSDoc alone would miss. Summary flags gaps for human review. |
| Human authoring of ~200 kind/purpose + structure/childAttributes is time-consuming | Batch by component category per institutional preference |
| Generated api.json triggers api-drift-check guardrail failures | Expected — Unit 4 includes explicit triage step before shipping |
| Squash merge grows large (~48 api.json + ~22 static.html + 2 new scripts + 1 command) | Files are small and independent. Review by category batch. |
| New components added on main during branch work | Rerun generator after rebase; companion script catches gaps |
| Generator scripts left in repo after backfill | Marked as one-shot with deletion-safe header. Scaffold prevents future gaps. |

## Sources & References

- **Origin document:** [docs/brainstorms/2026-04-04-component-quality-foundation-requirements.md](docs/brainstorms/2026-04-04-component-quality-foundation-requirements.md)
- Related code: `scripts/build-api-registry.js`, `scripts/quality/api-drift-check.js`, `scripts/quality/vb-conformance.js`
- Schema: `src/schemas/api.schema.json`
- Memory: `api_manifest_pattern.md`, `feedback_chunked_changes.md`, `feedback_foundation_first.md`
