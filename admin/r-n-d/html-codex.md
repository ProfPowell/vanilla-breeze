# HTML Codex: Native Elements Upscaling Ideas

Status date: February 24, 2026

## What We Have Today

Vanilla Breeze already has strong native-first coverage.

- Native docs pages: 114 (`11ty-site/src/pages/docs/elements/native/*.njk`)
- Native style modules: 40 (`src/native-elements/**/styles.css`)
- Native tags referenced in native CSS: 106 of 114
- Core bundle already auto-inits many markup-first attribute behaviors (`data-mask`, `data-range`, `data-upload`, `data-show-when`, `data-autosave`, `data-math`, etc.) via `src/web-components/core.js`

The overall direction is good: semantic tags first, CSS defaults, optional JS enhancement.

## Key Gaps To Close

### 1) API grammar is inconsistent

Native element variants are mixed between:

- class-based (`form.stacked`, `search.inline`, `nav.pills`, `table.striped`, `img.rounded`)
- data-attribute-based (`a[data-variant]`, `dialog[data-size]`, `table[data-density]`)

This makes the markup API harder to learn than it needs to be.

### 2) Some docs and runtime contracts drift

Concrete examples:

- `nav` docs use `data-layout-density="compact"` for tree mode, but nav CSS targets `data-density="compact"`.
- `input` docs show `fieldset data-toggle-tags data-layout-max="3"`, but runtime selector is `fieldset[data-toggle-tags][data-max]`.
- `dialog` docs show `data-no-backdrop-close`, but there is no built-in runtime handler; only example page JS demonstrates it.

### 3) Markup behaviors are broader than docs surface

Runtime supports attributes not fully represented in the attribute index and native pages (for example loading/feedback/view-transition related attributes). This hides capability and creates discoverability gaps.

### 4) Schema/lint source of truth is lagging

`src/htmlvalidate/elements.cjs` still encodes older attribute patterns (`data-gap`, `data-align`) while current docs/runtime widely use `data-layout-*`. This reduces confidence that docs, linting, and runtime are in sync.

## Upscaling Direction (Markup-First)

### P0: Define a canonical native variant contract

Standardize on a small cross-element grammar:

- `data-variant`
- `data-size`
- `data-density`
- `data-state`
- `data-layout` (when layout semantics are the actual concern)

Keep existing classes as backward-compatible aliases, but document `data-*` as primary.

### P0: Fix the documented drift now

- Update nav tree compact examples to `data-density="compact"` or support both attrs.
- Update toggle-tags docs to `data-max`.
- Either implement built-in `dialog[data-no-backdrop-close]` behavior or remove it from "native API" language and keep it as optional custom JS snippet.

### P0: Add capability badges per feature

Each native element page should label each feature as:

- `CSS only`
- `JS enhanced (core-js)`
- `JS enhanced (extras-js)`

This will prevent markup that silently depends on missing JS bundles.

### P1: Migrate high-usage class variants to canonical data attrs

Start where usage is heaviest and semantics are clear:

- `form`: `data-layout="stacked|inline|grid"`
- `search`: `data-variant="inline|compact|rounded|expanded|header|with-icon"`
- `nav`: `data-variant="horizontal|vertical|pills|tabs|breadcrumb|pagination|tree|steps"`
- `table`: keep existing `data-density`, expand class parity (`striped`, `bordered`) via `data-variant`
- `button` and button-style links: move to `data-variant` and `data-size` parity

### P1: Normalize state hooks

Use consistent state attributes where possible:

- `data-state="loading|empty|error|selected|expanded|collapsed"`

That enables shared CSS patterns across table, nav, form, output, and future data views.

### P2: Expand native recipes, not new component count

Prefer composable native patterns before inventing new elements:

- `details + summary + nav` recipes for tree/docs UX
- `dialog + form method="dialog"` recipes for safe confirmation flows
- `table + data-*` recipes for sticky, card mode, selection, expand rows
- `search + form + datalist + results` recipes for progressive search

## Suggested Canonical Mappings

- `form.stacked` -> `form[data-layout="stacked"]`
- `form.inline` -> `form[data-layout="inline"]`
- `form.grid` -> `form[data-layout="grid"]`
- `search.inline` -> `search[data-variant="inline"]`
- `search.compact` -> `search[data-variant="compact"]`
- `search.rounded` -> `search[data-variant="rounded"]`
- `table.striped` -> `table[data-variant~="striped"]`
- `table.bordered` -> `table[data-variant~="bordered"]`
- `nav.pills` -> `nav[data-variant="pills"]`
- `nav.tabs` -> `nav[data-variant="tabs"]`
- `nav.tree` -> `nav[data-variant="tree"]`

Use alias selectors for compatibility during migration.

## Quick Wins (Next Iteration)

1. Fix the three known drift points (`nav` density, toggle-tags max attribute, dialog backdrop-close contract).
2. Add a small "variant grammar" guide to `/docs/elements/native/` so element APIs feel unified.
3. Convert one pilot group (`search`, `form`, `table`) to canonical `data-*` first-class docs + alias compatibility in CSS.
4. Auto-generate docs metadata from selectors/initializers so new attrs cannot ship undocumented.

## Bottom Line

Vanilla Breeze already has substantial native-element depth. The highest-value upscaling move is now consistency: one clear markup grammar, explicit bundle contracts, and docs/runtime/lint alignment. That will make the existing system feel significantly more powerful without adding much new complexity.
