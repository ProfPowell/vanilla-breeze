# Elena.js Evaluation for Vanilla Breeze

**Source**: https://elenajs.com/ (2.6kB progressive web components library)
**Initial eval**: 2026-03-25 | **Deep eval**: 2026-03-25

---

## Strong alignment (validates VB's direction)

- **Light DOM first** — Elena defaults to Light DOM, Shadow DOM is opt-in. VB already does this. Elena's comparison table against Lit is basically VB's argument written out for you.
- **Zero production deps** — Same constraint, same reasoning.
- **JSDoc + optional TypeScript** — Elena itself is authored in JSDoc with `checkJs`. Validates VB's preferred pattern.
- **llms.txt + per-page `.md` URLs** — Elena has this. VB's `VB-AI-NATIVE.md` spec is more comprehensive, but seeing it in the wild confirms the direction.
- **MCP server** — `@elenajs/mcp` exists. Validates `vb-mcp`.

---

## Deep evaluation: what to adopt, adapt, or skip

### 1. `@scope` for component CSS — PARTIAL ADOPT

**Elena's approach**: `@scope` as the primary CSS encapsulation mechanism, with `all: unset` inside for full style isolation. External styles cannot reach in.

**What VB actually does today**: VB has three CSS selector strategies across 53 web-components:

| Strategy | Count | Example | @scope needed? |
|---|---|---|---|
| Element-name selectors | ~28 | `tab-set > details > summary` | No — inherently scoped |
| @scope-wrapped class selectors | 18 | `@scope (combo-box) { .tags-input-area }` | Already using it |
| Bare class selectors (the gap) | 7 | `carousel-wc .carousel-track` | Yes |

The 26 custom-elements (Layer 2) use element-name selectors (`form-field output.hint`, `layout-stack > *`) — also inherently scoped. No gap there.

**The 7 gap components** (use class selectors without @scope):
- `carousel-wc` (20 bare classes), `reader-view` (28), `page-tour` (25), `image-map` (17), `split-surface` (6), `slide-accept` (3), `compare-surface` (3), `foot-notes` (1)

**Why "formalize @scope as the Layer 2 pattern" is wrong**: Elena uses `@scope` + `all: unset` for style *isolation* — external styles cannot reach in. VB's 9-layer cascade is the deliberate opposite: tokens, native-element styles, and theme overrides *flow into* components by design. These are contradictory philosophies. Elena's isolation pattern would break VB's token inheritance. Additionally, `@scope` interacting with `@layer` has produced real debugging pain (see scope-cascade-debugging notes) — more `@scope` means more edge cases.

**Decision**:
- **ADOPT**: Add @scope to the 7 gap components — mechanical wrap of existing selectors
- **ADOPT**: Document the decision rule: *"Use `@scope` when component CSS targets class selectors (`.foo`). Skip it when selectors are already anchored to the element name."*
- **SKIP**: Do not mandate @scope for element-name-selector components (adds verbosity, zero safety improvement)
- **SKIP**: Do not adopt Elena's `all: unset` isolation pattern
- **SKIP**: Do not add @scope to Layer 2 custom-elements

**Effort**: 1-2 days for gap closure + docs

---

### 2. Mixin pattern → vb-core.js — SKIP (for now)

**Elena's approach**: `Draggable(Tooltipped(Elena(HTMLElement)))` — class composition via `(superClass) => class extends superClass`.

**Why it doesn't fit VB today**:
- VB components are self-contained units, not composed from optional behaviors
- VB shares behavior through utility function imports (`form-internals.js`, `swap-transition.js`, `popover-support.js`) — these are explicit, discoverable, and tree-shakeable
- Mixin chains hide what a class does and create implicit `super.connectedCallback()` call chains
- VB has no cross-cutting behaviors that are "optional per component" — the exact pattern mixins solve

**When to revisit**: If VB builds a headless behavior library (focus trapping, roving tabindex, drag handles, tooltip anchoring), the mixin pattern is correct for *that* project. But it's a separate initiative, not a refactor of existing components.

---

### 3. VBElement base class — ADOPT (thin version, no props magic)

**Elena's approach**: `static props = ["variant"]` with auto-reflection, type inference from defaults, batched re-renders. This is a runtime.

**VB's boilerplate problem**: Every web component repeats 15-30 lines of mechanical code:
- `data-upgraded` guard in `connectedCallback` (all 54 components)
- `data-upgraded` removal in `disconnectedCallback` (all 54 components)
- `#cleanups` array + `#listen()` helper (only 6 of 54 have this — the other 48 may have event listener leaks)

**What VB should build instead** — a minimal base class with no props magic:

```js
// src/lib/vb-element.js
class VBElement extends HTMLElement {
  #cleanups = [];

  connectedCallback() {
    if (this.hasAttribute('data-upgraded')) return;
    this.setup();
    this.setAttribute('data-upgraded', '');
  }

  disconnectedCallback() {
    for (const fn of this.#cleanups) fn();
    this.#cleanups = [];
    this.removeAttribute('data-upgraded');
    this.teardown();
  }

  listen(target, event, handler, opts) {
    target.addEventListener(event, handler, opts);
    this.#cleanups.push(() => target.removeEventListener(event, handler, opts));
  }

  setup() {}    // override in subclass
  teardown() {} // override in subclass
}
```

**What this buys**: Eliminates 8-12 lines of boilerplate per component. Standardizes event cleanup across all components (fixes ~48 potential leak paths). Zero runtime weight.

**What to skip from Elena**:
- `static props` auto-reflection — only 17 components observe attributes, each with different update logic
- Non-reflected props (`reflect: false`) — VB uses private fields (`#state`) for internal state
- Type inference from defaults — VB reads attributes as strings and coerces explicitly

**Migration strategy**: Start with the 6 components that already have `#cleanups` (tab-set, carousel-wc, accordion-wc, drag-surface, form-field, page-tour). Then simple components. Leave form-associated components (combo-box, star-rating) for last.

**Effort**: 3-5 days | **Risk**: Medium (needs component-by-component cleanup audit)

---

### 4. CEM generation — EVALUATE via proof-of-concept

**Elena's approach**: `@elenajs/bundler` generates `custom-elements.json` from JSDoc. The standard tool `@custom-elements-manifest/analyzer` does the same.

**VB's current state**: `compendium.json` is hand-maintained (serves visual regression testing). Extensive JSDoc `@attr`/`@fires`/`@example` coverage across 50 components — enough to feed a CEM analyzer.

**What CEM would provide**: IDE autocomplete for VB element attributes/events/slots, auto-generated doc page attribute tables, standard metadata format.

**Feasibility concerns**: VB uses `registerComponent()` not `customElements.define()` — needs a custom analyzer plugin. `compendium.json` has HTML variant snippets CEM can't represent — CEM supplements but doesn't replace.

**PoC result** (2026-03-25): Installed `@custom-elements-manifest/analyzer` with two custom plugins:
1. `registerComponentPlugin` — resolves `registerComponent('tag', Class)` to associate tag names
2. `hoistFileJsdocPlugin` — reads source files to hoist top-of-file `@attr`/`@fires`/description to the class (VB puts JSDoc above imports, not above the class)

Tested against 5 components (tab-set, slide-accept, combo-box, tool-tip, accordion-wc). Output includes tag names, descriptions, typed attributes, and events — all auto-extracted from existing JSDoc.

**CEM supplements but does not replace compendium.json**:
- CEM adds: attributes with types, events, descriptions, member inventory (auto from JSDoc)
- CEM cannot produce: HTML variant snippets, category/type classification, CSS file paths

**Verdict**: ADOPT as an additive build artifact. Config at `custom-elements-manifest.config.mjs`. Expand globs to all components when ready. Useful for IDE autocomplete and doc page generation.

**Effort**: 1-2 days for full rollout | **Risk**: Low (additive, no code changes)

---

## What doesn't translate

- **`render()` template model** — Elena components render their own HTML via tagged template literals. VB's Layer 4 components *wrap* SSG-rendered HTML; they don't own it. Adopting render() would break the "wrap, don't replace" principle.
- **`Elena()` factory / runtime mixin** — VB doesn't need this abstraction. The thin VBElement base class above is sufficient and keeps the runtime surface minimal.
- **Their bundler/CLI** — VB uses 11ty. Their build tooling is irrelevant, but the CEM *output* format is worth targeting.
- **`all: unset` style isolation** — Contradicts VB's cascade-by-design philosophy where tokens and themes flow into components.

---

## Priority actions (revised)

| Priority | Action | Effort | Verdict |
|---|---|---|---|
| High | Document @scope decision rule in CSS authoring guide | 2 hours | ADOPT |
| Medium | Add @scope to 7 gap components (consistency pass) | 1-2 days | ADOPT |
| Medium | Build thin VBElement base class + incremental migration | 3-5 days | ADOPT |
| Low | CEM proof-of-concept with `@custom-elements-manifest/analyzer` | 1-2 days | ADOPT (PoC passed) |
| — | Mandate @scope everywhere / Layer 2 | — | SKIP |
| — | Elena's `all: unset` isolation pattern | — | SKIP |
| — | Mixin composition pattern (revisit for headless lib) | — | SKIP |
| — | `static props` auto-reflection / non-reflected props | — | SKIP |
