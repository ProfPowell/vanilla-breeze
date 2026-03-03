---
title: Backdrop — Page Canvas System for Vanilla Breeze
description: Specification for fixed-canvas page layout with rich background layers, immersive effects, and animated page transitions
author: Thomas
date: 2026-03-02
updated: 2026-03-02
tags:
  - vanilla-breeze
  - backdrop
  - layout
  - animation
  - themes
status: draft-resolved
---

# Backdrop — Page Canvas System for Vanilla Breeze

A specification for treating the page as a fixed-size canvas elevated above a rich, expressive background layer — inspired by tools like Craft, Keynote, and Pitch.

## Table of Contents

- [Concept](#concept)
- [Architecture](#architecture)
- [Canvas Responsive Behaviour](#canvas-responsive-behaviour)
- [Multi-Canvas Layouts](#multi-canvas-layouts)
- [Backdrop Modes](#backdrop-modes)
- [Background Types](#background-types)
- [Effects Layer](#effects-layer)
- [Page Transition System](#page-transition-system)
- [Animation Catalog](#animation-catalog)
- [Theme Integration](#theme-integration)
- [Theme Composer Extension](#theme-composer-extension)
- [HTML API](#html-api)
- [CSS Custom Properties](#css-custom-properties)
- [JavaScript Behavior](#javascript-behavior)
- [Accessibility](#accessibility)
- [Resolved Decisions](#resolved-decisions)

---

## Concept

Most web pages treat the background as an afterthought — a flat color behind content. Backdrop inverts this: the background is a **first-class design surface**, and the page canvas floats above it like a physical sheet of paper raised off a table.

The result is a visual hierarchy with three distinct layers:

```
┌─────────────────────────────────────────┐
│  ENVIRONMENT (viewport-filling backdrop) │
│  ┌───────────────────────────────────┐  │
│  │  CANVAS (the page "sheet")        │  │
│  │  ┌─────────────────────────────┐ │  │
│  │  │  CONTENT                    │ │  │
│  │  └─────────────────────────────┘ │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

The canvas has physical presence — shadow, border, slight perspective — while the environment behind it can be animated, blurred, or composited with an "immersive" bleed of content color.

---

## Architecture

### Core Elements

| Element | Role |
|---------|------|
| `<vb-backdrop>` | Environment layer — fills the viewport, holds background |
| `<vb-canvas>` | The sheet — fixed-width container elevated above backdrop |
| `<vb-content>` | Inner content area with padding and scroll |

### Stacking Model

```css
vb-backdrop {
  position: fixed;
  inset: 0;
  z-index: 0;
}

vb-canvas {
  position: relative;
  z-index: 1;
  /* elevated sheet appearance */
  box-shadow:
    0 4px 6px -1px oklch(0 0 0 / 0.1),
    0 20px 60px -10px oklch(0 0 0 / 0.3),
    0 0 0 1px oklch(1 0 0 / 0.05);
}
```

The backdrop is `position: fixed` and always viewport-filling. The canvas scrolls normally within the document flow — the backdrop stays put behind it.

---

## Canvas Responsive Behaviour

The canvas uses a fluid breakpoint strategy: full-width on mobile, elevated sheet on tablet and above.

```css
vb-canvas {
  /* Full-width on mobile — no sheet metaphor, just content */
  width: 100%;
  border-radius: 0;
  box-shadow: none;
  margin-inline: 0;
}

@media (width >= 768px) {
  vb-canvas {
    width: var(--vb-canvas-width, 900px);
    max-width: calc(100vw - 4rem);
    margin-inline: auto;
    border-radius: var(--vb-canvas-radius, 12px);
    box-shadow:
      0 4px 6px -1px oklch(0 0 0 / 0.1),
      0 20px 60px -10px oklch(0 0 0 / 0.3),
      0 0 0 1px oklch(1 0 0 / 0.05);
  }
}
```

On mobile the backdrop still renders — it functions as a rich page background — but the canvas is flush to edges without the sheet elevation. The physical metaphor is preserved for larger screens where there is spatial room for it to read correctly.

Themes can override the breakpoint via `--vb-canvas-breakpoint` to support narrower tablet-first designs.

---

## Multi-Canvas Layouts

A single `<vb-backdrop>` can host multiple `<vb-canvas>` elements. This enables layouts where several documents, panels, or views coexist above the same environment layer.

### Layout Modes

| Mode | Attribute | Description |
|------|-----------|-------------|
| `stack` | `data-layout="stack"` | Default — single canvas, centred |
| `split` | `data-layout="split"` | Two canvases side-by-side (e.g. editor + preview) |
| `grid` | `data-layout="grid"` | N canvases in a responsive grid (site overview) |
| `cascade` | `data-layout="cascade"` | Canvases offset at slight angles — physical stack metaphor |

```html
<!-- Split view: editor + preview -->
<vb-backdrop data-layout="split">
  <vb-canvas data-canvas-id="editor" data-canvas-role="primary">
    <!-- editor content -->
  </vb-canvas>
  <vb-canvas data-canvas-id="preview" data-canvas-role="secondary">
    <!-- rendered preview -->
  </vb-canvas>
</vb-backdrop>

<!-- Site overview: grid of page thumbnails -->
<vb-backdrop data-layout="grid" data-canvas-columns="3">
  <vb-canvas data-canvas-id="home">...</vb-canvas>
  <vb-canvas data-canvas-id="about">...</vb-canvas>
  <vb-canvas data-canvas-id="work">...</vb-canvas>
  <vb-canvas data-canvas-id="contact">...</vb-canvas>
</vb-backdrop>
```

### Split Layout CSS

```css
vb-backdrop[data-layout="split"] {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--vb-canvas-gap, 2rem);
  padding: var(--vb-layout-padding, 2rem);
  align-items: start;
}

/* Collapse to stack on narrow screens */
@media (width < 1024px) {
  vb-backdrop[data-layout="split"] {
    grid-template-columns: 1fr;
  }
}
```

### Grid Layout CSS

```css
vb-backdrop[data-layout="grid"] {
  display: grid;
  grid-template-columns: repeat(
    var(--vb-canvas-columns, 3),
    minmax(280px, 1fr)
  );
  gap: var(--vb-canvas-gap, 1.5rem);
  padding: var(--vb-layout-padding, 2rem);
  align-items: start;
}
```

### Cascade Layout

Cascade mode staggers canvases at slight rotations and offsets to create a tangible pile-of-documents feel. Useful for portfolio grids and visual galleries.

```css
vb-backdrop[data-layout="cascade"] > vb-canvas {
  transition: transform 200ms ease, box-shadow 200ms ease;
}

vb-backdrop[data-layout="cascade"] > vb-canvas:nth-child(1) {
  transform: rotate(-1.5deg) translate(-8px, 4px);
}
vb-backdrop[data-layout="cascade"] > vb-canvas:nth-child(2) {
  transform: rotate(0.8deg) translate(4px, -2px);
}
vb-backdrop[data-layout="cascade"] > vb-canvas:nth-child(3) {
  transform: rotate(-0.4deg) translate(-2px, 6px);
}

/* Straighten on hover/focus */
vb-backdrop[data-layout="cascade"] > vb-canvas:hover,
vb-backdrop[data-layout="cascade"] > vb-canvas:focus-within {
  transform: rotate(0deg) translate(0, -4px);
  box-shadow:
    0 8px 16px -2px oklch(0 0 0 / 0.2),
    0 32px 80px -10px oklch(0 0 0 / 0.4);
  z-index: 10;
}
```

### View Transitions in Multi-Canvas

Each canvas declares a unique `view-transition-name` derived from its `data-canvas-id`. This lets individual canvases animate independently during layout changes:

```javascript
// Set view-transition-name from data-canvas-id
document.querySelectorAll('vb-canvas[data-canvas-id]').forEach(canvas => {
  canvas.style.viewTransitionName = `canvas-${canvas.dataset.canvasId}`;
});
```

---

## Backdrop Modes

Four source modes, selectable via `data-backdrop-type`:

| Mode | Attribute Value | Description |
|------|----------------|-------------|
| None | `none` | Transparent / browser default |
| Solid | `solid` | Single flat color |
| Gradient | `gradient` | Two-stop CSS gradient |
| Image | `image` | Photo or texture from preset, Unsplash, or upload |

### Mode Switcher Tab Bar

Rendered as a segmented control (four icon tabs):

```html
<vb-backdrop-picker>
  <button data-mode="none"     aria-label="No backdrop"><!-- slash icon --></button>
  <button data-mode="solid"    aria-label="Solid color"></button>
  <button data-mode="gradient" aria-label="Gradient"></button>
  <button data-mode="image"    aria-label="Image"></button>
</vb-backdrop-picker>
```

---

## Background Types

### Solid Color

- Swatch grid of 12 preset colors per theme
- "More colors" button opens a color wheel (`<input type="color">`)
- Active swatch gets a ring: `outline: 2px solid var(--vb-accent)`

### Gradient

- Same 12 swatch presets (each swatch shows a gradient ball)
- Editable fields:
  - **Start Color** — color picker
  - **End Color** — color picker
  - **Direction** — `<select>` with options: `Top to Bottom`, `Left to Right`, `Radial`
- CSS output:

```css
/* Linear */
background: linear-gradient(
  to bottom,
  var(--vb-backdrop-start),
  var(--vb-backdrop-end)
);

/* Radial */
background: radial-gradient(
  ellipse at center,
  var(--vb-backdrop-start),
  var(--vb-backdrop-end)
);
```

### Image

- Six preset thumbnails (curated per theme)
- **Shuffle** — randomizes from the preset pool
- **Unsplash** — opens a search modal hitting the Unsplash API
- **Upload** — `<input type="file" accept="image/*">` with `URL.createObjectURL()`
- Images are `background-size: cover; background-position: center`

---

## Effects Layer

Effects are composited *between* the backdrop source and the canvas. They are not mutually exclusive.

### Blur Image

- Toggle switch: `data-effect-blur="true|false"`
- Applies `backdrop-filter: blur(20px)` to a pseudo-layer over the backdrop image
- Works only when `data-backdrop-type="image"`

```css
vb-backdrop[data-effect-blur="true"]::after {
  content: '';
  position: absolute;
  inset: 0;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}
```

### Immersive vs. Faded

A segmented toggle that controls how the canvas relates to the backdrop:

| Mode | Behavior |
|------|----------|
| `immersive` | Canvas bleeds color from its content into backdrop via a soft gradient edge. The page feels "in" the environment. |
| `faded` | Canvas has a frosted-glass appearance — `background: oklch(1 0 0 / 0.85)` with `backdrop-filter: blur(12px)` |

**Immersive implementation** uses a `mix-blend-mode` overlay on the canvas edge:

```css
vb-canvas[data-effect="immersive"]::before {
  content: '';
  position: absolute;
  inset: -40px;
  background: inherit; /* picks up dominant page color */
  filter: blur(40px);
  opacity: 0.6;
  z-index: -1;
}
```

**Faded implementation:**

```css
vb-canvas[data-effect="faded"] {
  background: oklch(1 0 0 / 0.85);
  backdrop-filter: blur(12px) saturate(180%);
}
```

---

## Page Transition System

When navigating between pages (or between slides in a single-page app), the canvas can animate using the **View Transitions API** as the primary engine, with a CSS-only fallback.

### Transition Types

| Name | Description | CSS Metaphor |
|------|-------------|--------------|
| `slide-stack` | New page slides in from right, old page slides under — like shuffling a deck | `translate` + `scale` |
| `lift` | Canvas lifts (scales up slightly, shadow grows) then drops into new position | `scale` + `box-shadow` |
| `dissolve` | Cross-fade between canvases | `opacity` |
| `flip` | 3D Y-axis flip revealing new content on back face | `rotateY` |
| `push` | Old canvas pushed off-screen by incoming canvas | `translate` |
| `none` | Instant swap | — |

### View Transitions API Integration

```javascript
async function navigateToPage(url) {
  if (!document.startViewTransition) {
    window.location.href = url;
    return;
  }

  document.startViewTransition(async () => {
    await loadPageContent(url);
  });
}
```

```css
/* Slide-stack transition */
::view-transition-old(canvas) {
  animation: slide-out-stack 300ms ease-in forwards;
}

::view-transition-new(canvas) {
  animation: slide-in-stack 300ms ease-out forwards;
}

@keyframes slide-out-stack {
  to {
    transform: translateX(-60px) scale(0.95);
    opacity: 0.6;
  }
}

@keyframes slide-in-stack {
  from {
    transform: translateX(100%);
  }
}
```

The backdrop does *not* transition — it persists behind the canvas swap, which reinforces the physical metaphor.

### Named View Transition Targets

```html
<vb-canvas style="view-transition-name: canvas">
  <vb-content style="view-transition-name: content">
    ...
  </vb-content>
</vb-canvas>
```

---

## Animation Catalog

Themes assign ambient animations to `vb-backdrop`. All animations use `@property` for smooth interpolation where possible — this is the preferred approach over keyframed positional tricks. All must respect `prefers-reduced-motion`.

| Name | Technique | Use Case |
|------|-----------|----------|
| `drift` | `@property`-animated `background-position` on large image | Landscape photos |
| `pulse` | `@property`-animated radial gradient radius | Soft/calm themes |
| `shimmer` | `@property`-animated hue rotation on gradient | Premium/dark themes |
| `particles` | `@property`-animated dot field via CSS Houdini paint worklet | Techy/dark themes |
| `none` | Static | Default |

### Shimmer — `@property` Hue Rotation

```css
@property --vb-shimmer-hue {
  syntax: '<angle>';
  inherits: false;
  initial-value: 0deg;
}

@media (prefers-reduced-motion: no-preference) {
  vb-backdrop[data-animation="shimmer"] {
    background: linear-gradient(
      135deg,
      oklch(20% 0.15 calc(260deg + var(--vb-shimmer-hue))),
      oklch(12% 0.08 calc(200deg + var(--vb-shimmer-hue)))
    );
    animation: shimmer-hue 12s linear infinite;
  }
}

@keyframes shimmer-hue {
  to { --vb-shimmer-hue: 360deg; }
}
```

### Pulse — `@property` Gradient Radius

```css
@property --vb-pulse-radius {
  syntax: '<percentage>';
  inherits: false;
  initial-value: 40%;
}

@media (prefers-reduced-motion: no-preference) {
  vb-backdrop[data-animation="pulse"] {
    background: radial-gradient(
      ellipse var(--vb-pulse-radius) var(--vb-pulse-radius) at center,
      var(--vb-backdrop-start),
      var(--vb-backdrop-end)
    );
    animation: pulse-radius 6s ease-in-out infinite alternate;
  }
}

@keyframes pulse-radius {
  to { --vb-pulse-radius: 70%; }
}
```

### Drift — `@property` Background Position

```css
@property --vb-drift-x {
  syntax: '<percentage>';
  inherits: false;
  initial-value: 0%;
}

@media (prefers-reduced-motion: no-preference) {
  vb-backdrop[data-animation="drift"] {
    background-position: var(--vb-drift-x) 50%;
    background-size: 150% 150%;
    animation: backdrop-drift 40s ease-in-out infinite alternate;
  }
}

@keyframes backdrop-drift {
  to { --vb-drift-x: 100%; }
}
```

Animations are defined in a theme's backdrop layer:

```css
@layer vb.backdrop.animations { ... }
```

---

## Theme Integration

Themes declare their backdrop defaults using custom properties and a `data-theme` hook. This is where backdrop configuration lives — not in user preferences by default.

```css
[data-theme="midnight"] {
  --vb-backdrop-type: gradient;
  --vb-backdrop-start: oklch(15% 0.03 260);
  --vb-backdrop-end: oklch(8% 0.01 260);
  --vb-backdrop-direction: to bottom;
  --vb-canvas-effect: faded;
  --vb-backdrop-animation: shimmer;
  --vb-page-transition: slide-stack;
  --vb-stack-depth: 1;
}

[data-theme="nature"] {
  --vb-backdrop-type: image;
  --vb-backdrop-preset: forest-mist;
  --vb-canvas-effect: immersive;
  --vb-backdrop-blur: true;
  --vb-backdrop-animation: drift;
  --vb-page-transition: dissolve;
}
```

### Persistence Model

Backdrop configuration has a two-tier scope:

| Tier | Mechanism | Who Sets It |
|------|-----------|-------------|
| **Theme default** | CSS custom properties on `[data-theme]` | Theme author |
| **Page override** | `data-*` attributes on `<vb-backdrop>` in page markup | Page author |

User-facing runtime overrides (via the picker panel) write to `localStorage` at page-level scope — keyed as `vb-backdrop:{pagePath}`. On load, the element reads its localStorage key and promotes those values to `data-*` attributes, which then override the theme CSS cascade.

There is no global "override everything" user setting — preferences are page-scoped. This prevents a user accidentally nuking a carefully designed theme across a whole site.

### Dark/Light Mode Switching

When the system color scheme changes, backdrop values snap immediately — no crossfade. This matches the platform convention that color scheme switches should be instant to avoid an uncanny transitional state.

```css
/* Snap — no transition on color-scheme change */
@media (prefers-color-scheme: dark) {
  [data-theme="aurora"] {
    --vb-backdrop-start: oklch(12% 0.04 280);
    --vb-backdrop-end: oklch(6% 0.02 260);
  }
}

@media (prefers-color-scheme: light) {
  [data-theme="aurora"] {
    --vb-backdrop-start: oklch(92% 0.04 240);
    --vb-backdrop-end: oklch(80% 0.06 220);
  }
}
```

No `transition` is set on backdrop color properties. If a theme wants animated color shifts for other interactions, it scopes them with `:where(:not([data-color-scheme-change]))` or similar.

The picker panel UI always reflects the current resolved values — themes set defaults, pages and users override.

---

## Theme Composer Extension

Backdrop is a first-class tab in the Theme Composer. The composer needs the following additions to support backdrop configuration.

### New Composer Section: "Backdrop"

The Backdrop tab in the composer exposes all backdrop properties as editable controls, grouped into three panels:

**Source panel** — mirrors the picker UI: mode tabs (none/solid/gradient/image), swatch grid, color pickers, direction select, preset thumbnails.

**Effects panel** — blur toggle, Immersive vs. Faded segmented control.

**Motion panel** — ambient animation selector, page transition selector, stack depth slider.

### Stack Depth Control

The stack depth property controls how many ghost canvas cards appear behind the active canvas during a `slide-stack` transition, creating the physical deck illusion.

```css
[data-theme="deck"] {
  --vb-stack-depth: 2; /* 1–9, default 1 */
}
```

Ghost cards are generated as `::before` / `::after` on `vb-canvas`, plus injected `<vb-canvas-ghost>` elements for depths > 2:

```css
/* Depth 1 — single shadow card via pseudo-element */
vb-canvas[style*="--vb-stack-depth"]::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: var(--vb-canvas-bg);
  z-index: -1;
  transform: translateY(6px) scale(0.97);
  opacity: 0.7;
  box-shadow: inherit;
}
```

For depths 2–9, `VbBackdrop` injects the appropriate number of `<vb-canvas-ghost>` siblings with incrementally offset transforms:

```javascript
function renderGhostCards(canvas, depth) {
  // Remove existing ghosts
  canvas.parentElement
    .querySelectorAll('vb-canvas-ghost')
    .forEach(g => g.remove());

  for (let i = 1; i <= Math.min(depth, 9); i++) {
    const ghost = document.createElement('vb-canvas-ghost');
    ghost.style.setProperty('--ghost-index', i);
    canvas.insertAdjacentElement('afterend', ghost);
  }
}
```

```css
vb-canvas-ghost {
  --offset: calc(var(--ghost-index) * 6px);
  --shrink: calc(1 - var(--ghost-index) * 0.025);
  --fade: calc(0.8 - var(--ghost-index) * 0.12);

  position: absolute;
  inset: 0;
  border-radius: var(--vb-canvas-radius);
  background: var(--vb-canvas-bg);
  transform: translateY(var(--offset)) scale(var(--shrink));
  opacity: var(--fade);
  z-index: calc(-1 * var(--ghost-index));
}
```

### Composer Data Model Extension

The theme JSON schema gains a `backdrop` object:

```json
{
  "name": "midnight",
  "backdrop": {
    "type": "gradient",
    "start": "oklch(15% 0.03 260)",
    "end": "oklch(8% 0.01 260)",
    "direction": "to bottom",
    "canvasEffect": "faded",
    "animation": "shimmer",
    "transition": "slide-stack",
    "stackDepth": 1
  }
}
```

The composer serialises this to CSS custom properties when generating the theme stylesheet.

---

## HTML API

### Declarative Configuration

All state lives in `data-*` attributes on `<vb-backdrop>` — no hidden JavaScript state.

```html
<vb-backdrop
  data-backdrop-type="image"
  data-backdrop-image="/assets/bg/forest.jpg"
  data-effect-blur="true"
  data-canvas-effect="immersive"
  data-animation="drift"
  data-transition="slide-stack"
>
  <vb-canvas>
    <vb-content>
      <!-- page content -->
    </vb-content>
  </vb-canvas>
</vb-backdrop>
```

### Picker Panel

The backdrop picker is a `<dialog>` element opened by a trigger button. It is theme-styled but always accessible:

```html
<button
  popovertarget="backdrop-picker"
  aria-label="Change backdrop"
>
  🎨
</button>

<dialog
  id="backdrop-picker"
  popover
  class="vb-backdrop-picker"
>
  <!-- mode tabs, swatches, effects, transition selector -->
</dialog>
```

Uses the native Popover API — no JavaScript needed to open/close.

---

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--vb-backdrop-type` | `none` | Source mode |
| `--vb-backdrop-color` | `oklch(15% 0 0)` | Solid color value |
| `--vb-backdrop-start` | — | Gradient start color |
| `--vb-backdrop-end` | — | Gradient end color |
| `--vb-backdrop-direction` | `to bottom` | Gradient direction |
| `--vb-backdrop-image` | — | URL for image mode |
| `--vb-backdrop-blur` | `false` | Blur effect toggle |
| `--vb-canvas-effect` | `immersive` | `immersive` or `faded` |
| `--vb-canvas-width` | `900px` | Fixed canvas width (tablet+) |
| `--vb-canvas-breakpoint` | `768px` | Width at which sheet mode activates |
| `--vb-canvas-radius` | `12px` | Canvas border radius |
| `--vb-canvas-shadow` | *(layered)* | Elevation shadow |
| `--vb-canvas-gap` | `2rem` | Gap between canvases in multi-canvas layouts |
| `--vb-canvas-columns` | `3` | Column count for grid layout |
| `--vb-layout-padding` | `2rem` | Padding around canvas group |
| `--vb-backdrop-animation` | `none` | Ambient animation name |
| `--vb-page-transition` | `dissolve` | Page change animation |
| `--vb-transition-duration` | `300ms` | Transition speed |
| `--vb-stack-depth` | `1` | Ghost card count during slide-stack (1–9) |

---

## JavaScript Behavior

The `VbBackdrop` custom element handles:

1. **State persistence** — reads/writes page-scoped `localStorage` key `vb-backdrop:{pagePath}` and promotes values to `data-*` attributes on connect
2. **Unsplash integration** — debounced fetch through a server-side proxy (never direct from client); results rendered as `<img>` thumbnails
3. **Upload handling** — `URL.createObjectURL()` for preview; persisted as a blob URL reference in localStorage
4. **Animation frame management** — pauses canvas-based animations when tab is hidden (`visibilitychange`)
5. **Transition orchestration** — wraps navigation in `document.startViewTransition()` with instant fallback
6. **Ghost card management** — renders `<vb-canvas-ghost>` elements for stack depths > 1

### Unsplash Proxy Pattern

The Unsplash API key never appears in client source. All Unsplash requests route through a Cloudflare Worker:

```
Client → /api/unsplash?q={query} → CF Worker → Unsplash API (key in Worker env)
```

```javascript
// In the element — no API key, no knowledge of Unsplash credentials
async #searchUnsplash(query) {
  const res = await fetch(`/api/unsplash?q=${encodeURIComponent(query)}&per_page=9`);
  const { results } = await res.json();
  return results.map(r => ({ thumb: r.urls.thumb, full: r.urls.full, alt: r.alt_description }));
}
```

The Worker returns a normalised shape — the client never sees raw Unsplash response structure, making it easy to swap providers later.

```javascript
class VbBackdrop extends HTMLElement {
  static observedAttributes = [
    'data-backdrop-type',
    'data-backdrop-image',
    'data-canvas-effect',
    'data-animation',
    'data-transition',
    'data-stack-depth',
  ];

  connectedCallback() {
    this.#loadPersistedState();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    this.#applyBackdrop();
    this.#persistState();
  }

  #loadPersistedState() {
    const key = `vb-backdrop:${location.pathname}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      const state = JSON.parse(saved);
      Object.entries(state).forEach(([k, v]) => this.dataset[k] = v);
    }
  }

  #persistState() {
    const key = `vb-backdrop:${location.pathname}`;
    localStorage.setItem(key, JSON.stringify(this.dataset));
  }

  #applyBackdrop() {
    // JavaScript updates data-* attributes; CSS reads them.
    // Only orchestration logic here, no direct style writes.
    const depth = parseInt(this.dataset.stackDepth ?? 1);
    const canvas = this.querySelector('vb-canvas');
    if (canvas && depth > 1) renderGhostCards(canvas, depth);
  }
}

customElements.define('vb-backdrop', VbBackdrop);
```

**Key principle: JavaScript updates `data-*` attributes; CSS reads them.** No direct style manipulation in JS except `view-transition-name` assignment.

---

## Accessibility

- `vb-backdrop` is `aria-hidden="true"` — it is purely decorative
- `vb-canvas` is the landmark container; it maps to `<main>` semantically
- All animations pause when `prefers-reduced-motion: reduce` is set
- Blur effects are skipped when `prefers-reduced-transparency: reduce` is set
- The picker dialog traps focus correctly via native `<dialog>` behavior
- Color swatches have `aria-label` with the color name, not just a visual swatch
- Transitions fall back to `none` when View Transitions API is unavailable

```css
@media (prefers-reduced-motion: reduce) {
  vb-backdrop { animation: none !important; }
  ::view-transition-group(*) { animation-duration: 0ms !important; }
}

@media (prefers-reduced-transparency: reduce) {
  vb-canvas[data-effect="faded"] {
    background: oklch(98% 0 0); /* opaque fallback */
    backdrop-filter: none;
  }
}
```

---

## Resolved Decisions

| Decision | Resolution |
|----------|------------|
| **Canvas responsive breakpoint** | Full-width on mobile, elevated sheet at `768px+`. Breakpoint is configurable via `--vb-canvas-breakpoint`. |
| **Multi-canvas layouts** | Fully supported. Four layout modes: `stack`, `split`, `grid`, `cascade`. Each canvas gets a unique `view-transition-name` for independent animation. |
| **Unsplash API key** | Always server-side. Client requests route through a Cloudflare Worker proxy. API key lives in Worker environment variables, never in client source. |
| **Animated gradients** | Use `@property` for all animated values. Smoother interpolation, interpolates through color space correctly. Accept the slightly higher browser support floor — this is an enhancement, not load-bearing. |
| **Theme persistence scope** | Two-tier: theme CSS sets defaults, page `data-*` attributes override per-page. Runtime user changes persist to `localStorage` keyed by `pagePath`. No global user override. |
| **Stack transition depth** | Default `1`. Configurable `1–9` via `--vb-stack-depth`. Depths > 1 inject `<vb-canvas-ghost>` elements with incrementally offset transforms and fading opacity. |
| **Dark/light mode switching** | Snap — no crossfade. Platform convention is instant; a crossfade between color schemes looks uncanny. |
| **Theme Composer** | Backdrop is a first-class tab in the Theme Composer. Configuration is authored at the theme level and serialised to CSS custom properties in the theme stylesheet. The composer's JSON schema gains a `backdrop` object. |