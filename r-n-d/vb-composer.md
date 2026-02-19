# Vanilla Breeze Composer — Build Spec

A wireframe layout composer that lets users place semantic page regions onto a CSS Grid canvas, generating clean HTML + CSS in real time.

## Design philosophy

The composer is itself a Vanilla Breeze application: custom elements for editor chrome, CSS layers to isolate editor styles from exported content, semantic markup throughout, progressive enhancement from static to interactive.

The exported output is the point. Every design decision in the editor serves the goal of producing markup you would actually ship.

---

## Concepts

**Canvas grid.** A 12-column CSS Grid container representing the page surface. Columns are fluid (`minmax(0, 1fr)`). Rows snap to a configurable unit (default `3rem` — large enough to be a useful wireframe row, small enough for fine placement).

**Blocks.** Semantic HTML elements placed onto the grid: `header`, `main`, `aside`, `footer`, `section`, `article`, `nav`, `figure`, `form`. Each block has a grid placement (`col-start`, `col-span`, `row-start`, `row-span`) and an optional subgrid flag.

**Wireframe mode.** A toggle that reveals outlines, labels, and drag/resize handles. When off, the canvas renders as a plain styled grid — the progressive enhancement baseline.

**Export modes.** Two output strategies, selectable by the user:

- *Named areas* — generates `grid-template-areas` with semantic area names. Best for fixed page layouts.
- *Placement vars* — generates CSS custom property–driven placement (`--col`, `--cspan`). Best for reusable/dynamic layouts.

---

## Problems in the prior spec (and fixes)

**Nested `<main>`.** The prior spec used `<main>` for the app shell while also allowing `<main>` blocks on the canvas. HTML allows only one `<main>` per document. *Fix:* The app shell uses a `<vb-composer>` custom element as its root. The canvas is a `<vb-canvas>` element. Semantic blocks inside the canvas are the *content* elements; the editor chrome is custom elements that don't collide.

**`<div>` wrapper in export.** Wrapping exported blocks in `<div class="vb-grid">` contradicts the semantic-first goal. *Fix:* The export container is `<body>` (for full-page layouts) or a semantic element the user selects. No wrapper div.

**Inline style vars in export (placement mode).** Acceptable as one option, but the prior spec offered no alternative. *Fix:* Named-area export generates proper `grid-template-areas` rules with no inline styles. Placement-var export retains inline vars but generates a companion CSS rule set.

**`grid-auto-rows: subgrid` is not a real CSS value.** Subgrid applies to `grid-template-columns` or `grid-template-rows` on an element that spans defined parent tracks. *Fix:* Subgrid blocks use `grid-template-columns: subgrid` (widely supported) and a regular `grid-auto-rows` for the row axis.

**24px row size.** Too small for wireframe composition; produces excessive row counts. *Fix:* Default `--row-size: 3rem` (48px at default font size). Configurable via the inspector.

**No CSS layers.** Editor styles and exported content styles must not bleed into each other. *Fix:* Editor chrome lives in `@layer editor`; exported/canvas content lives in `@layer content`. Layer order declared at the top of the stylesheet.

**No responsive story.** A grid composer that ignores breakpoints is incomplete. *Fix:* v0 exports a single layout. v1 adds a breakpoint switcher in the editor (viewport width presets) with per-breakpoint block placement, exported as `@media` rules.

**Data model ambiguity.** The prior spec said "canvas is the source of truth" but also maintained a parallel JSON model. *Fix:* The DOM is the source of truth during editing. `serialize()` reads the DOM into JSON for export/import. No parallel state to drift.

---

## Architecture

### Custom elements

| Element | Role |
|---------|------|
| `<vb-composer>` | App shell. Contains canvas, inspector, code output. |
| `<vb-canvas>` | Grid surface. Hosts semantic blocks. Manages wireframe mode. |
| `<vb-inspector>` | Property panel for the selected block. |
| `<vb-code-output>` | Live HTML + CSS preview. |
| `<vb-block-handle>` | Resize affordance (button). Placed inside blocks by the editor. |

Editor-injected elements use the `vb-` prefix and are stripped on export.

### CSS layers

```css
@layer reset, tokens, content, editor;
```

- `content` — styles for the grid and blocks (what gets exported).
- `editor` — wireframe outlines, handles, labels, selection highlights. Scoped to `[data-wireframe]` on the canvas.

### File structure

```
index.html
styles/
  main.css          /* layer declarations + imports */
  _tokens.css       /* design tokens */
  _content.css      /* grid + block placement rules */
  _editor.css       /* wireframe/editor chrome */
js/
  composer.js       /* vb-composer element, orchestration */
  canvas.js         /* vb-canvas element, block management */
  interaction.js    /* pointer-based drag + resize */
  serialize.js      /* DOM → JSON, JSON → DOM */
  export.js         /* JSON → clean HTML + CSS strings */
  inspector.js      /* vb-inspector element */
```

---

## Grid CSS (content layer)

```css
@layer content {
  vb-canvas {
    --cols: 12;
    --gap: 1rem;
    --row-size: 3rem;
    --max-w: 1100px;

    display: grid;
    grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
    grid-auto-rows: var(--row-size);
    gap: var(--gap);
    max-inline-size: var(--max-w);
    margin-inline: auto;
    padding: var(--gap);
    container-type: inline-size;
  }

  /* Block placement via CSS vars (editor + placement-var export) */
  vb-canvas > :is(header, main, aside, footer, section, article, nav, figure, form) {
    grid-column: var(--col, 1) / span var(--cspan, 12);
    grid-row: var(--row, auto) / span var(--rspan, 2);
  }

  /* Subgrid: columns only. Rows stay auto. */
  [data-subgrid] {
    display: grid;
    grid-template-columns: subgrid;
    grid-auto-rows: var(--row-size);
    gap: var(--gap);
  }
}
```

### Why the selector targets tag names

The whole point: the canvas contains *real* semantic elements. The selector `:is(header, main, ...)` ensures only valid content elements participate. Editor chrome (`vb-block-handle`, etc.) is excluded naturally.

---

## Editor CSS (editor layer)

```css
@layer editor {
  /* Only active in wireframe mode */
  vb-canvas[data-wireframe] > :is(header, main, aside, footer, section, article, nav, figure, form) {
    outline: 2px dashed currentColor;
    border-radius: var(--radius-sm, 4px);
    min-block-size: calc(var(--row-size) * 2);
    position: relative;
    user-select: none;
    cursor: grab;

    &[data-selected] {
      outline-style: solid;
      outline-color: var(--primary, oklch(55% 0.22 260));
    }

    &:focus-visible {
      outline-color: var(--primary, oklch(55% 0.22 260));
      outline-offset: 2px;
    }
  }

  /* Block label */
  vb-canvas[data-wireframe] [data-vb-label]::before {
    content: attr(data-vb-label);
    position: absolute;
    inset-block-start: 0.25rem;
    inset-inline-start: 0.25rem;
    font: 0.75rem/1.2 system-ui, sans-serif;
    padding: 0.1rem 0.4rem;
    border-radius: 999px;
    background: color-mix(in oklch, currentColor 12%, transparent);
    pointer-events: none;
  }

  /* Resize handles */
  vb-block-handle {
    display: block;
    position: absolute;
    inline-size: 14px;
    block-size: 14px;
    border-radius: 4px;
    background: var(--primary, oklch(55% 0.22 260));
    border: 0;
    opacity: 0;
    transition: opacity 0.15s;
  }

  /* Show handles on hover/focus */
  [data-selected] vb-block-handle,
  :is(header, main, aside, footer, section, article, nav, figure, form):hover vb-block-handle {
    opacity: 0.75;
  }

  vb-block-handle[data-dir="e"]  { inset-inline-end: -7px; inset-block-start: 50%; translate: 0 -50%; cursor: ew-resize; }
  vb-block-handle[data-dir="s"]  { inset-block-end: -7px; inset-inline-start: 50%; translate: -50% 0; cursor: ns-resize; }
  vb-block-handle[data-dir="se"] { inset-inline-end: -7px; inset-block-end: -7px; cursor: nwse-resize; }

  /* Grid overlay (wireframe background lines) */
  vb-canvas[data-wireframe]::before {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      repeating-linear-gradient(
        90deg,
        color-mix(in oklch, currentColor 6%, transparent) 0 1px,
        transparent 1px calc(100% / var(--cols))
      );
    z-index: -1;
  }
}
```

---

## HTML structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>VB Grid Composer</title>
  <link rel="stylesheet" href="styles/main.css" />
</head>
<body>
  <vb-composer>

    <header>
      <h1>Grid Composer</h1>
      <nav aria-label="Block palette">
        <button type="button" data-action="add" data-tag="header">header</button>
        <button type="button" data-action="add" data-tag="nav">nav</button>
        <button type="button" data-action="add" data-tag="main">main</button>
        <button type="button" data-action="add" data-tag="aside">aside</button>
        <button type="button" data-action="add" data-tag="section">section</button>
        <button type="button" data-action="add" data-tag="article">article</button>
        <button type="button" data-action="add" data-tag="footer">footer</button>
      </nav>
      <label>
        <input type="checkbox" data-action="wireframe" checked />
        Wireframe
      </label>
    </header>

    <vb-canvas data-wireframe data-cols="12">
      <!-- Semantic blocks are placed here -->
      <!-- Example starting state: -->
      <header data-vb-label="header" style="--col:1;--cspan:12;--row:1;--rspan:2;">
        <vb-block-handle data-dir="e"></vb-block-handle>
        <vb-block-handle data-dir="s"></vb-block-handle>
        <vb-block-handle data-dir="se"></vb-block-handle>
      </header>
    </vb-canvas>

    <vb-inspector aria-label="Block inspector">
      <h2>Inspector</h2>
      <p>Select a block to edit its properties.</p>
      <!-- Populated dynamically when a block is selected -->
    </vb-inspector>

    <vb-code-output aria-label="Generated code">
      <h2>Output</h2>
      <fieldset>
        <legend>Export mode</legend>
        <label><input type="radio" name="export-mode" value="areas" checked /> Named areas</label>
        <label><input type="radio" name="export-mode" value="vars" /> Placement vars</label>
      </fieldset>
      <div>
        <h3>HTML</h3>
        <pre><code id="out-html"></code></pre>
      </div>
      <div>
        <h3>CSS</h3>
        <pre><code id="out-css"></code></pre>
      </div>
    </vb-code-output>

    <div aria-live="polite" class="visually-hidden" id="status"></div>

  </vb-composer>

  <script type="module" src="js/composer.js"></script>
</body>
</html>
```

No nested `<main>`. The app-level `<header>` is for the tool itself. Canvas blocks are content elements inside `<vb-canvas>`, which is the grid container.

---

## Interaction model

### Primary: Pointer Events

Pointer Events for both drag and resize. No HTML Drag and Drop — it adds complexity and cross-browser inconsistency without benefit here.

**Drag (move)**

1. `pointerdown` on a block (not on a handle) → capture pointer, record initial `--col`/`--row` and pointer position.
2. `pointermove` → compute delta in grid units: `deltaCol = Math.round(dx / colWidth)`, `deltaRow = Math.round(dy / rowHeight)`.
3. Update `--col` and `--row`, clamped to `[1, cols - cspan + 1]` and `[1, maxRow]`.
4. `pointerup` → release capture, announce via `aria-live`.

**Resize**

1. `pointerdown` on `<vb-block-handle>` → capture, record initial `--cspan`/`--rspan`.
2. `pointermove` → compute span delta based on handle direction.
	- `e` handle: adjust `--cspan`.
	- `s` handle: adjust `--rspan`.
	- `se` handle: adjust both.
3. Clamp: `cspan ∈ [1, cols - col + 1]`, `rspan ∈ [1, maxRows]`.
4. `pointerup` → release, announce.

**Snapping** is implicit — `Math.round()` to nearest grid unit.

**Collision detection** (v0: optional). Check all blocks for overlap after a move/resize. If overlap, revert or show a warning outline. Keep it simple — no constraint solver.

### Keyboard

- `Tab` to focus blocks in wireframe mode (blocks get `tabindex="0"`).
- `Arrow` keys move the focused block by 1 grid unit.
- `Shift + Arrow` resizes the focused block by 1 unit.
- `Delete` / `Backspace` removes the focused block (with confirmation for non-empty blocks).
- `Escape` deselects.
- All changes announced via `#status` (`aria-live="polite"`).

---

## Data serialization

The DOM is the source of truth. `serialize()` reads it into a plain object for export/import:

```js
function serialize(canvas) {
  const blocks = [...canvas.querySelectorAll(':scope > :is(header, main, aside, footer, section, article, nav, figure, form)')];
  return {
    grid: {
      cols: Number(getComputedStyle(canvas).getPropertyValue('--cols')),
      rowSize: getComputedStyle(canvas).getPropertyValue('--row-size').trim(),
      gap: getComputedStyle(canvas).getPropertyValue('--gap').trim(),
      maxWidth: getComputedStyle(canvas).getPropertyValue('--max-w').trim(),
    },
    blocks: blocks.map(el => ({
      tag: el.localName,
      col: Number(el.style.getPropertyValue('--col')),
      cspan: Number(el.style.getPropertyValue('--cspan')),
      row: Number(el.style.getPropertyValue('--row')),
      rspan: Number(el.style.getPropertyValue('--rspan')),
      subgrid: el.hasAttribute('data-subgrid'),
    })),
  };
}
```

No parallel JSON state. No drift.

---

## Export: named areas mode

Given blocks: `header` (cols 1–12, rows 1–2), `nav` (cols 1–2, rows 3–8), `main` (cols 3–12, rows 3–8), `footer` (cols 1–12, rows 9–10):

### Exported HTML

```html
<body class="layout">
  <header>...</header>
  <nav>...</nav>
  <main>...</main>
  <footer>...</footer>
</body>
```

### Exported CSS

```css
.layout {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  grid-template-rows: repeat(2, 3rem) repeat(6, 3rem) repeat(2, 3rem);
  grid-template-areas:
    "header header header header header header header header header header header header"
    "header header header header header header header header header header header header"
    "nav    nav    main   main   main   main   main   main   main   main   main   main"
    "nav    nav    main   main   main   main   main   main   main   main   main   main"
    "nav    nav    main   main   main   main   main   main   main   main   main   main"
    "nav    nav    main   main   main   main   main   main   main   main   main   main"
    "nav    nav    main   main   main   main   main   main   main   main   main   main"
    "nav    nav    main   main   main   main   main   main   main   main   main   main"
    "footer footer footer footer footer footer footer footer footer footer footer footer"
    "footer footer footer footer footer footer footer footer footer footer footer footer";
  gap: 1rem;
  max-inline-size: 1100px;
  margin-inline: auto;
}

header { grid-area: header; }
nav    { grid-area: nav; }
main   { grid-area: main; }
footer { grid-area: footer; }
```

Clean, readable, no framework dependency. Duplicate tag names (e.g., two `<section>` blocks) get suffixed: `section-1`, `section-2`.

---

## Export: placement vars mode

### Exported HTML

```html
<body class="layout">
  <header style="--col:1;--cspan:12;--row:1;--rspan:2"></header>
  <nav style="--col:1;--cspan:2;--row:3;--rspan:6"></nav>
  <main style="--col:3;--cspan:10;--row:3;--rspan:6"></main>
  <footer style="--col:1;--cspan:12;--row:9;--rspan:2"></footer>
</body>
```

### Exported CSS

```css
.layout {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  grid-auto-rows: 3rem;
  gap: 1rem;
  max-inline-size: 1100px;
  margin-inline: auto;
}

.layout > * {
  grid-column: var(--col) / span var(--cspan);
  grid-row: var(--row) / span var(--rspan);
}
```

---

## Inspector panel

When a block is selected, the inspector shows:

- **Tag** — `<select>` to change the semantic element. Changing the tag replaces the element in the DOM (using `document.createElement` + copying attributes/children).
- **Column start / span** — number inputs, clamped.
- **Row start / span** — number inputs, clamped.
- **Subgrid** — checkbox toggle. Adds/removes `data-subgrid`.
- **Delete** — removes the block.

All inspector changes write directly to the DOM element's style/attributes. The code output re-renders on every change via a `MutationObserver` on the canvas.

---

## Progressive enhancement

**Without JS:** The page renders the `<vb-canvas>` as a static CSS Grid with whatever blocks are in the markup. The wireframe overlay, inspector, and code output are inert but visible as static content. Usable as a layout preview.

**With JS:** Custom elements upgrade. Wireframe mode activates. Drag, resize, inspector, and code generation all come alive.

**Without subgrid support:** The `@supports` fallback repeats the parent column definition:

```css
@supports not (grid-template-columns: subgrid) {
  [data-subgrid] {
    grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
  }
}
```

---

## Milestones

### v0.1 — Static grid + block rendering

- `<vb-canvas>` renders 12-column grid.
- Blocks placed via CSS vars.
- Wireframe mode (visual only, no interaction).
- Code output shows current HTML/CSS.

### v0.2 — Selection + inspector

- Click to select a block.
- Inspector binds to selected block.
- Change tag, spans, subgrid via inspector.
- Code output updates on change.

### v0.3 — Drag to move

- Pointer event drag with grid snapping.
- Clamp to canvas bounds.
- `aria-live` announcements.

### v0.4 — Resize handles

- East, south, corner handles.
- Pointer event resize with snapping.
- Span clamping.

### v0.5 — Add/delete blocks + keyboard

- Toolbar buttons create new blocks with default placement.
- Delete removes blocks.
- Arrow key movement and shift+arrow resize.

### v0.6 — Named areas export

- Generate `grid-template-areas` from block layout.
- Handle duplicate tag names.
- Toggle between export modes.

### v0.7 — Polish

- Grid overlay lines in wireframe mode.
- Collision detection (warning outline).
- Import from JSON.
- Starter templates (blog layout, docs page, marketing landing).

---

## Future (post-v0)

- **Breakpoint editor** — viewport width presets with per-breakpoint placement. Exports `@media` rules.
- **Nested blocks** — place blocks inside a subgrid container (children of the subgrid element).
- **Content slots** — allow placeholder text/images inside blocks for higher-fidelity wireframes.
- **CSS layer isolation in export** — generate layered CSS matching VB conventions.
- **Lint warnings** — discourage non-semantic containers, flag overlapping blocks.

---

## Constraints for implementation

- Vanilla JS only. No build step. ES modules.
- Pointer Events for all drag/resize. No HTML Drag and Drop API.
- Blocks must be real semantic elements — not divs with roles.
- Editor chrome uses `vb-` prefixed custom elements, stripped on export.
- Exported HTML must be clean enough to paste into a project and use immediately.
- CSS uses logical properties (`inline-size`, `inset-block-start`, etc.) throughout.
- `@layer` for all styles.