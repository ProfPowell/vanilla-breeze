# Grid Composer — Status & Roadmap

Current location: `/src/lib/composer/` (JS) + `/site/pages/lab/experiments/grid-composer.astro` (page)
Live at: `/lab/experiments/grid-composer/`

---

## What works today

The core editing loop is functional after fixing two build issues (tree-shaking removed custom element registrations; row-height calculation used raw CSS values instead of computed pixels).

### Implemented features

| Feature | Status | Notes |
|---------|--------|-------|
| 12-column CSS Grid canvas | Done | Configurable cols, gap, row size |
| Semantic block placement | Done | header, nav, main, aside, section, article, footer, figure, form |
| Click to select | Done | With outline highlight and focus management |
| Drag to move | Done | Pointer Events, grid snapping, column/row clamping |
| Resize handles | Done | East, south, southeast handles with snapping |
| Keyboard movement | Done | Arrow keys move, Shift+Arrow resizes, Delete removes |
| Inspector panel | Done | Tag, column, span, row, row span, subgrid, delete |
| Tag change in inspector | Done | Replaces DOM element, preserves attributes |
| Add blocks from palette | Done | Auto-places at next free row |
| Wireframe toggle | Done | Shows/hides outlines, labels, handles |
| Column overlay toggle | Done | Visual column guides |
| Grid settings (cols, gap, row) | Done | Live toolbar controls |
| Placement vars export | Done | Inline `--col`/`--cspan`/`--row`/`--rspan` + companion CSS |
| Named areas export | Done | `grid-template-areas` generation, duplicate tag suffixing |
| Subgrid support | Done | `grid-template-columns: subgrid` with `@supports` fallback |
| Nesting (drag into block) | Done | Drop zone detection, auto-subgrid |
| Un-nesting | Done | Drag out or inspector button |
| Starter templates | Done | Holy Grail, Blog, Marketing |
| aria-live announcements | Done | All moves, resizes, additions announced |
| MutationObserver → output | Done | Code output auto-updates on any DOM change |

### Architecture

Seven modules, all vanilla JS ES modules:

- `composer.js` — `<vb-composer>` app shell, orchestration, keyboard shortcuts
- `canvas.js` — `<vb-canvas>` grid surface, block lifecycle, selection
- `interaction.js` — `CanvasInteraction` class, pointer drag/resize
- `inspector.js` — `<vb-inspector>` property panel
- `serialize.js` — DOM-to-JSON, `BLOCK_TAGS`, `BLOCK_SELECTOR`
- `export.js` — JSON-to-HTML/CSS strings (both modes)
- `templates.js` — Starter layout data

DOM is the single source of truth. No parallel JSON state.

---

## What's broken or incomplete

### Bugs

1. **Collision detection not implemented.** Blocks can overlap freely. The spec calls for a warning outline on overlap — currently nothing prevents or flags it.

2. **Import from JSON not implemented.** `serialize()` exports to JSON but there's no `deserialize()` / import UI to load a saved layout.

3. **No confirmation on delete for non-empty blocks.** Spec calls for confirmation when deleting blocks that contain nested children — currently deletes immediately (reparenting children to canvas).

### Missing from spec

4. **`<vb-code-output>` custom element.** The spec defines this as a custom element but the implementation uses plain `<section class="composer-output">` with `#out-html` / `#out-css` IDs queried directly by the composer. Works but doesn't match the spec's component boundary.

5. **Grid overlay lines.** The `::before` pseudo-element wireframe background gradient doesn't accurately align with grid columns because it doesn't account for padding and gap. The `::after` column overlay (toggled separately) is more accurate but they serve overlapping purposes.

---

## Gap analysis: Composer vs Vanilla Breeze

The composer currently generates generic CSS Grid markup. It doesn't know about VB's design system. Here's what it would take to make the output feel native to Vanilla Breeze.

### Export: CSS layer wrapping

**Current:** Exported CSS is bare rules (`.layout { ... }`).

**VB convention:** All styles live in declared `@layer` blocks. The export should wrap grid rules in `@layer content { ... }` so exported code drops into a VB project without cascade conflicts.

### Export: design token references

**Current:** Gap, row size, and max-width are exported as literal values (`gap: 0.75rem`).

**VB convention:** Spacing uses token variables (`var(--size-s)`, `var(--size-m)`, etc.). The export should map common values to their token equivalents — or let the user pick tokens in the inspector. At minimum, offer a "Use VB tokens" toggle that replaces literals with `var(--size-*)` references.

Token mapping for common values:
| Literal | Token |
|---------|-------|
| 0.25rem | `var(--size-2xs)` |
| 0.5rem | `var(--size-xs)` |
| 0.75rem | `var(--size-s)` |
| 1rem | `var(--size-m)` |
| 1.5rem | `var(--size-l)` |
| 2rem | `var(--size-xl)` |
| 3rem | `var(--size-2xl)` |

### Export: data-layout integration

**Current:** Export generates raw `display: grid` CSS. No connection to VB's `data-layout` attribute system.

**VB opportunity:** Many common layouts the composer produces already have `data-layout` equivalents:

| Composer layout | VB equivalent |
|-----------------|---------------|
| Header + main + footer, full width | `data-layout="page-stack"` |
| Header, nav, main, aside, footer | `data-layout="holy-grail"` |
| Two columns (content + sidebar) | `data-layout="sidebar"` |
| Two columns with ratio | `data-layout="split"` |
| Full-width hero + content | `data-layout="cover"` + content |

A third export mode — **"VB data-layout"** — could detect these patterns and emit `data-layout` attributes instead of raw CSS. This would produce the most idiomatic VB output. It wouldn't cover every possible layout, but for the common ones it would generate markup you'd actually write by hand.

### Export: Grid Identity / Zen Garden

**Current:** Export wraps blocks in `<body class="layout">`.

**VB alternative:** The Grid Identity system uses `data-page-layout` on `<body>` and auto-assigns grid areas by semantic element type — no classes needed on children. The export could offer a "Grid Identity" mode that generates:

```html
<body data-page-layout="sidebar-left">
  <header>...</header>
  <nav>...</nav>
  <main>...</main>
  <footer>...</footer>
</body>
```

With zero CSS needed from the user (VB provides it). This only works for page-level layouts with standard semantic elements, but that's the composer's core use case.

### Export: element-scoped classes

**Current:** Semantic elements are exported bare (`<header></header>`).

**VB convention:** Semantic elements have element-scoped classes: `<header class="site">`, `<nav class="horizontal pills">`, `<main class="contained">`, `<footer class="site columns">`, `<form class="stacked">`. The inspector could offer a class picker for each block's tag — showing only the classes VB defines for that element type.

### Export: container queries

**Current:** No container query support.

**VB convention:** `main`, `article`, `section`, `aside` all get `container-type: inline-size` and named containers. Exported CSS could include these declarations so blocks are container-query-ready.

### Responsive behavior

**Current:** Single fixed layout. No breakpoints.

**VB convention:** Built-in layouts have responsive behavior (holy-grail stacks at `60rem`, sidebar collapses, dashboard sidebar goes offscreen at `48rem`). Two approaches:

1. **Per-breakpoint placement editor** (spec's v1 plan) — a viewport width switcher in the toolbar with separate block positions per breakpoint, exported as `@media` rules.

2. **VB-native responsive** — if exporting as `data-layout="holy-grail"`, responsive behavior comes free from VB's built-in CSS. No `@media` rules needed in export.

### Content slots / placeholder content

**Current:** Blocks are empty rectangles with a tag label.

**Opportunity:** Allow placeholder text, headings, or images inside blocks for higher-fidelity wireframes. The export would include this content. This bridges the gap between "layout tool" and "page builder."

### Form block integration

**Current:** `<form>` is a placeable block like any other.

**VB opportunity:** When a form block is selected, the inspector could offer VB form layout classes (`.stacked`, `.inline`, `.grid`) and allow adding `<form-field>` children. This turns the composer into a basic form builder for VB projects.

---

## Proposed roadmap

### Phase 1: Stability & polish (current state → v0.8)

- [ ] Fix column overlay alignment (account for padding + gap)
- [ ] Add collision detection (warning outline, not blocking)
- [ ] Add JSON import UI (paste or file upload)
- [ ] Add undo/redo (command stack on the serialized state)
- [ ] Add "copy to clipboard" buttons on code output panels

### Phase 2: VB-native export (v0.9)

- [ ] Add `@layer content { }` wrapping to all export modes
- [ ] Add "Use VB tokens" toggle — maps literal spacing to `var(--size-*)` references
- [ ] Add element-scoped class picker to inspector (tag-aware: header gets site/page/card, nav gets horizontal/vertical/pills, etc.)
- [ ] Add third export mode: **"VB data-layout"** — pattern-matches common layouts to `data-layout` attributes
- [ ] Add Grid Identity export for page-level layouts (`data-page-layout` on body)
- [ ] Use logical properties throughout export (already mostly done)

### Phase 3: Responsive (v1.0)

- [ ] Viewport width switcher in toolbar (mobile / tablet / desktop presets)
- [ ] Per-breakpoint block placement storage
- [ ] Export `@media` rules for custom layouts
- [ ] Auto-detect when VB-native responsive covers the layout (skip `@media` rules)
- [ ] Container query declarations in export

### Phase 4: Content & depth (v1.x)

- [ ] Content slots — placeholder text/headings/images inside blocks
- [ ] Form builder integration — `<form-field>` children, VB form classes
- [ ] Nested block improvements — visual nesting depth indicator, drag constraints
- [ ] Block duplication (select + duplicate shortcut)
- [ ] Save/load layouts to localStorage
- [ ] Template gallery — more starters covering VB patterns (docs page, dashboard, marketing, blog, form-heavy)

### Phase 5: Teaching tool (v2.0)

- [ ] Lint warnings — flag non-semantic patterns, overlapping blocks, missing landmarks
- [ ] "Explain this layout" — annotate the exported code with comments explaining the CSS
- [ ] Side-by-side preview — render the exported HTML/CSS in an iframe alongside the editor
- [ ] Accessibility audit — check landmark structure, heading order, skip-nav
- [ ] Export as full HTML page (with `<!DOCTYPE>`, VB stylesheet link, meta tags)

---

## Files

```
src/lib/composer/
  composer.js        # <vb-composer> app shell
  canvas.js          # <vb-canvas> grid surface
  interaction.js     # Pointer-based drag/resize
  inspector.js       # <vb-inspector> property panel
  serialize.js       # DOM ↔ JSON
  export.js          # JSON → HTML + CSS strings
  templates.js       # Starter layouts

site/pages/lab/experiments/
  grid-composer.astro  # Lab experiment page

docs/examples/demos/
  grid-composer.html   # Standalone demo
```

## Build notes

The composer modules register custom elements as side effects. Two requirements for production builds:

1. `package.json` must list `"./src/lib/composer/*.js"` in the `sideEffects` array — otherwise the bundler tree-shakes the custom element registrations.
2. `composer.js` uses side-effect imports (`import './canvas.js'`) not named imports — the imported classes are never referenced directly, only used via DOM.
