# Progress Enhancement: Consolidation vs Separate `progress-ring`

Date: 2026-02-20
Status: Proposed architecture and migration plan
Decision target: Full consolidation on native `<progress>` with immediate switch

## Context and Goal

Vanilla Breeze currently has two parallel progress patterns:

1. Native linear `<progress>` (`src/native-elements/progress/styles.css`) using element-class variants (e.g., `progress.success`, `progress.l`).
2. Circular `<progress-ring>` (`src/custom-elements/progress-ring/styles.css`) with data-* configuration (`data-size`, `data-variant`, `data-indeterminate`) and `--progress`.

The question is whether circular progress should remain a separate custom element, or be consolidated into the same native-first mechanism used elsewhere (similar to `nav.horizontal.pills` and `nav.breadcrumb[data-separator="chevron"]`).

Goal: define a decision-complete consolidation strategy that preserves visual capability while reducing API surface and maintenance overhead.

## Current State Audit

### Native progress (linear)
- CSS source: `src/native-elements/progress/styles.css`
- API shape today:
  - Size classes: `.xs`, `.s`, `.m`, `.l`
  - State classes: `.success`, `.warning`, `.error`
  - Native indeterminate: `progress:indeterminate`
  - Wrapper pattern: `.labeled`
- Docs: `11ty-site/src/pages/docs/elements/native/progress.njk`

### Custom progress ring (circular)
- CSS source: `src/custom-elements/progress-ring/styles.css`
- API shape today:
  - Custom tag: `<progress-ring>`
  - Data attrs: `data-size`, `data-variant`, `data-indeterminate`
  - Value input: inline `--progress: N` (0-100)
  - Optional slotted center text
- Docs: `11ty-site/src/pages/docs/elements/custom-elements/progress-ring.njk`

### Surface area using `progress-ring`
- Docs demos:
  - `docs/examples/demos/progress-ring-basic.html`
  - `docs/patterns/demos/dashboard-stats.html`
- 11ty snippets/pattern docs:
  - `11ty-site/src/pages/docs/snippets/css/loading-states.njk`
  - `11ty-site/src/pages/docs/patterns/application/dashboard.njk`
- Index/data references:
  - `11ty-site/src/_data/customElements.js`
  - `11ty-site/src/_data/elements.js`
  - `src/custom-elements/index.css` (imports ring styles)

## Decision Drivers

1. API consistency
- Native elements in VB prefer element.class composition.
- `nav` is the clearest precedent (`nav.horizontal.pills`, `nav.breadcrumb[data-separator]`).

2. Semantic correctness
- `<progress>` carries built-in semantics (`value`, `max`, indeterminate state).
- `<progress-ring>` requires explicit ARIA boilerplate on every instance.

3. Maintenance burden
- Two progress APIs duplicate concepts (size, variant, determinate/indeterminate).

4. Migration blast radius
- Ring is referenced in docs/patterns/snippets and custom-element indexes, but the blast radius is finite and discoverable.

5. Progressive enhancement alignment
- Native-first baseline is preferable if equivalent visuals are achievable.

## Option A: Keep Separate `<progress-ring>`

### Pros
- Existing ring examples continue working unchanged.
- No migration effort.
- Distinct API can optimize for circular visual pattern directly.

### Cons
- Ongoing dual API overhead for the same conceptual component.
- Duplicate documentation and styling logic across linear/ring progress.
- Semantics rely on manual ARIA vs native progress semantics.
- Less consistent with VB’s native-first style for styled primitives.

## Option B: Consolidate to Native `<progress>` (Recommended)

### Pros
- Single progress primitive across linear and circular presentations.
- Better semantic baseline via native element behavior.
- Aligns with existing class/data composition conventions.
- Reduces docs and style maintenance complexity over time.

### Cons
- Requires migration of all `<progress-ring>` usages.
- Circular determinate rendering still needs a percentage input for conic-gradient (see risk section on `--progress` synchronization).
- Center label support must move to wrapper pattern (no slotting).

## Precedent: `nav` Class/Data Pattern

`src/native-elements/nav/styles.css` already demonstrates VB’s preferred pattern:
- Base element selector (`nav`)
- Layout/style modifiers via class (`.horizontal`, `.pills`, `.tabs`, `.breadcrumb`)
- Fine-grained options via data-* (`data-separator`, `data-collapsed`, `data-variant`)

Progress can follow the same model:
- Base: `progress`
- Circular visual mode: `progress.ring`
- Optional controls: `data-size`, state classes, indeterminate state through native semantics.

## Decision

Adopt **Option B: Full Consolidation** with an **Immediate Switch**.

Interpretation of immediate switch:
- Remove `<progress-ring>` from active API/docs/indexes in the same release that introduces native ring styling.
- Migrate all current doc/pattern usage to native `<progress class="ring">`.
- Do not keep a compatibility alias path in public docs.

## Target Markup API

### 1) Native linear progress (unchanged baseline)

```html
<label for="upload-p">Upload progress</label>
<progress id="upload-p" value="70" max="100" class="m">70%</progress>
```

### 2) Native circular ring (determinate)

```html
<div class="progress-ring-wrap">
  <progress
    class="ring success"
    data-size="l"
    value="67"
    max="100"
    style="--progress: 67"
  >67%</progress>
  <span class="progress-ring-label">67%</span>
</div>
```

### 3) Native circular ring (indeterminate)

```html
<progress class="ring" data-size="l" aria-label="Loading">Loading...</progress>
```

### 4) Optional authoring convention for ring value sync

For determinate ring visuals, `--progress` should match `value/max * 100`.

Example:
- `value="3" max="5"` => `style="--progress: 60"`

## Migration Map (Old -> New)

| Old (`progress-ring`) | New (`progress`) |
|---|---|
| `<progress-ring style="--progress:75">` | `<progress class="ring" value="75" max="100" style="--progress:75">75%</progress>` |
| `data-size="xs|s|m|l|xl"` | same `data-size` on `<progress class="ring">` |
| `data-variant="success|warning|error"` | class `.success/.warning/.error` |
| `data-indeterminate` | omit `value` (native indeterminate), keep `.ring` |
| slotted center text `<span>75%</span>` | wrapper label element next to/over ring |

## Repo Impact Inventory

### CSS architecture
- Add ring mode to native progress styles:
  - `src/native-elements/progress/styles.css`
- Remove custom ring CSS import and file:
  - `src/custom-elements/index.css` (remove `progress-ring` import)
  - `src/custom-elements/progress-ring/styles.css` (remove)

### Docs and examples
- Remove custom-element ring doc page from nav/index references:
  - `11ty-site/src/pages/docs/elements/custom-elements/progress-ring.njk` (remove or redirect)
  - `11ty-site/src/_data/customElements.js`
  - `11ty-site/src/_data/elements.js`
- Expand native progress doc with ring section:
  - `11ty-site/src/pages/docs/elements/native/progress.njk`
- Migrate ring demos/snippets/pattern references:
  - `docs/examples/demos/progress-ring-basic.html` (convert or replace)
  - `docs/patterns/demos/dashboard-stats.html`
  - `11ty-site/src/pages/docs/snippets/css/loading-states.njk`
  - `11ty-site/src/pages/docs/patterns/application/dashboard.njk`

### QA cleanup opportunity during migration
- In `11ty-site/src/pages/docs/patterns/application/dashboard.njk`, there is a related link to `/docs/elements/web-components/progress-ring/` which should become native progress path (`/docs/elements/native/progress/`) as part of consolidation.

## Risks and Mitigations

### Risk 1: `value/max` and `--progress` can drift
Reason:
- Conic-gradient uses CSS var; native semantics use `value` and `max`.

Mitigations:
1. Document explicit authoring contract: keep `--progress` in sync with `value/max`.
2. In docs, always show both values together.
3. Optional future enhancement (not required for initial consolidation): tiny JS utility that syncs `--progress` from native attributes.

### Risk 2: center labels become less ergonomic vs slotting
Mitigation:
- Provide canonical wrapper pattern with `.progress-ring-wrap` and `.progress-ring-label`.

### Risk 3: immediate switch breaks older snippets
Mitigation:
- Update all first-party docs/snippets/pattern demos in same change.
- Mention break in release notes/changelog.

## Acceptance Criteria

1. Public docs no longer present `<progress-ring>` as active API.
2. Native progress docs include both linear and circular ring usage.
3. All first-party examples compile/build using `<progress class="ring">`.
4. Custom-element index/data no longer lists `progress-ring`.
5. Ring supports size and semantic variants with parity to prior behavior.
6. Native indeterminate ring behavior documented and demonstrated.
7. Accessibility guidance is native-first and explicit.

## Follow-up Implementation Checklist

1. Add ring presentation styles to `src/native-elements/progress/styles.css`.
2. Remove ring custom-element stylesheet and import.
3. Update native progress docs with ring API and examples.
4. Remove/retire custom-element ring docs and index entries.
5. Migrate demo/snippet/pattern ring markup to `<progress class="ring">`.
6. Fix stale ring link in dashboard docs pathing.
7. Run docs/build checks and visually verify ring demos.
8. Record breaking change note for consolidation.

## Non-Goals

1. Building a mandatory JS sync runtime for `--progress`.
2. Keeping dual public APIs long-term.
3. Introducing a new web component for progress during consolidation.
