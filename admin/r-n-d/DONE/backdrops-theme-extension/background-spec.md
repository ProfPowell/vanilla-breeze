---
title: Backdrop — Page Canvas System for Vanilla Breeze
description: Specification for rich page backgrounds, canvas elevation, and immersive theme effects
author: Thomas
date: 2026-03-02
updated: 2026-03-02
tags:
  - vanilla-breeze
  - backdrop
  - layout
  - themes
status: draft-resolved
---

# Backdrop — Page Canvas System for Vanilla Breeze

A specification for treating the page as a fixed-size canvas elevated above a rich, expressive background layer — inspired by tools like Craft, Keynote, and Pitch.

## Table of Contents

- [Concept](#concept)
- [Phasing](#phasing)
- [Architecture](#architecture)
- [v1 — Page Background Tokens](#v1--page-background-tokens)
- [v1 — Theme Integration](#v1--theme-integration)
- [v1 — Theme Composer Extension](#v1--theme-composer-extension)
- [v2 — Canvas Elevation](#v2--canvas-elevation)
- [v3 — Transitions & Animations](#v3--transitions--animations)
- [CSS Custom Properties](#css-custom-properties)
- [Accessibility](#accessibility)
- [Resolved Decisions](#resolved-decisions)
- [Deferred Items](#deferred-items)

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

## Phasing

The system is delivered in three phases. Each phase is independently useful and builds on the last.

| Phase | Scope | Deliverables |
|-------|-------|-------------|
| **v1** — Page Backgrounds | Rich `body` backgrounds via CSS tokens | `--page-bg-*` tokens, `body` rule expansion, theme overrides, Theme Composer controls |
| **v2** — Canvas Elevation | `<layout-canvas>` element with sheet metaphor | Custom element, shadow/radius tokens, responsive breakpoints, multi-canvas layouts |
| **v3** — Transitions & Animation | Page transitions + ambient animations | View Transitions API integration, `@property` animations (shimmer, pulse, drift) |

### What's in v1 (this implementation)

- `--page-bg-*` design tokens in `src/tokens/extensions/surfaces.css`
- Expanded `body` rule in `src/base/reset.css` consuming those tokens
- Theme overrides for all extreme themes (gradients, images, blends)
- Theme Composer "Page Background" controls in the Surfaces panel
- `::before` / `::after` pseudo-element overlay patterns for theme effects (scanlines, grids)

### What's deferred

See [Deferred Items](#deferred-items) for the full list.

---

## Architecture

### Naming Alignment

VB elements follow established naming families. The backdrop system uses:

| Element | Family | Role |
|---------|--------|------|
| `<layout-backdrop>` | `layout-*` | Environment layer — fills viewport, holds background (v2) |
| `<layout-canvas>` | `layout-*` | The sheet — fixed-width container elevated above backdrop (v2) |
| `<main>` | Native HTML | Content container — no new element needed |

In v1, there are **no new custom elements**. The page background is applied to `body` via CSS custom properties. The `<layout-backdrop>` and `<layout-canvas>` elements are specced for v2.

### Token-First Approach

All backdrop configuration flows through CSS custom properties. This follows VB's convention where:

1. Tokens are defined in `src/tokens/extensions/surfaces.css` with sensible defaults
2. `body` in `reset.css` consumes the tokens
3. Themes override tokens in their `:root[data-theme~="name"]` block
4. The Theme Composer reads/writes these same tokens

No JavaScript is required for v1. The system is purely CSS.

### Stacking Model (v2)

```css
layout-backdrop {
  position: fixed;
  inset: 0;
  z-index: 0;
}

layout-canvas {
  position: relative;
  z-index: 1;
  box-shadow:
    0 4px 6px -1px oklch(0 0 0 / 0.1),
    0 20px 60px -10px oklch(0 0 0 / 0.3),
    0 0 0 1px oklch(1 0 0 / 0.05);
}
```

The backdrop is `position: fixed` and always viewport-filling. The canvas scrolls normally within the document flow — the backdrop stays put behind it.

---

## v1 — Page Background Tokens

New tokens added to `src/tokens/extensions/surfaces.css` alongside existing texture, glass, and gradient tokens.

### Token Reference

| Token | Default | Description |
|-------|---------|-------------|
| `--page-bg-type` | `solid` | Background mode: `solid`, `gradient`, or `image` |
| `--page-bg-color` | `var(--color-background)` | Solid background color |
| `--page-bg-gradient` | `none` | CSS gradient value (linear, radial, conic) |
| `--page-bg-image` | `none` | Background image URL |
| `--page-bg-attachment` | `scroll` | `scroll` or `fixed` |
| `--page-bg-size` | `cover` | `cover`, `contain`, or `auto` |
| `--page-bg-position` | `center` | Background position value |
| `--page-bg-blend` | `normal` | Blend mode for compositing |
| `--page-bg-overlay` | `none` | Color overlay on top of image (future use) |

### Token Definitions

```css
:root {
  /* Page Background */
  --page-bg-type: solid;
  --page-bg-color: var(--color-background, var(--color-surface));
  --page-bg-gradient: none;
  --page-bg-image: none;
  --page-bg-attachment: scroll;
  --page-bg-size: cover;
  --page-bg-position: center;
  --page-bg-blend: normal;
  --page-bg-overlay: none;
}
```

### Body Rule

The `body` rule in `reset.css` expands to consume these tokens:

```css
body {
  /* existing rules... */
  background-color: var(--page-bg-color, var(--color-surface));
  background-image: var(--page-bg-gradient, var(--page-bg-image, none));
  background-attachment: var(--page-bg-attachment, scroll);
  background-size: var(--page-bg-size, cover);
  background-position: var(--page-bg-position, center);
  background-blend-mode: var(--page-bg-blend, normal);
}
```

**Key design choice**: `background-image` falls through from `--page-bg-gradient` to `--page-bg-image` using CSS custom property fallbacks. When a theme sets `--page-bg-gradient`, it takes precedence over `--page-bg-image`. When neither is set, both resolve to `none`.

### Default Theme Impact

With `--page-bg-type: solid` and `--page-bg-color` defaulting to `var(--color-background)`, the base theme sees **no visual change**. The `background-image: none` and other defaults are inert.

---

## v1 — Theme Integration

Themes override `--page-bg-*` tokens in their existing `:root[data-theme~="name"]` block. No new selectors or layers are needed.

### Example: Cyber Theme

```css
:root[data-theme~="cyber"],
[data-theme~="cyber"] {
  /* existing tokens... */

  /* Page Background */
  --page-bg-gradient: linear-gradient(
    135deg,
    oklch(8% 0.04 280) 0%,
    oklch(12% 0.02 280) 40%,
    oklch(10% 0.06 200) 100%
  );
}
```

### Overlay Patterns via Pseudo-Elements

Themes that use scanline grids, dot patterns, or other overlay textures apply them via `body::before` or `body::after` — not through the `--page-bg-*` token system. This is already the VB way for extreme theme effects.

```css
/* Example: cyber scanlines (already in _extreme-cyber.css) */
body::before {
  content: "";
  position: fixed;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    oklch(0% 0 0 / 0.03) 2px,
    oklch(0% 0 0 / 0.03) 4px
  );
  pointer-events: none;
  z-index: 9999;
}
```

### Theme Override Examples

Each extreme theme adds 2-4 `--page-bg-*` lines:

| Theme | Background Style |
|-------|-----------------|
| Cyber | Dark diagonal gradient with cyan/magenta undertones |
| Midnight | Deep blue-black vertical gradient |
| Dracula | Purple-tinted vertical gradient |
| Vaporwave | Pink-to-cyan horizontal gradient |
| Nord | Cool blue subtle vertical gradient |
| GenAI | Multi-stop mesh-like gradient |
| Glassmorphism | Gradient base for glass blur effects |
| Organic | Earthy warm vertical gradient |

---

## v1 — Theme Composer Extension

The Theme Composer gains a "Page Background" sub-section within the existing **Surfaces** panel.

### New Controls

| Control | Type | Values |
|---------|------|--------|
| Background Type | `<select>` | None / Solid / Gradient |
| Background Color | `<input type="color">` | Any color (visible when type = solid) |
| Gradient Start | `<input type="color">` | Start color (visible when type = gradient) |
| Gradient End | `<input type="color">` | End color (visible when type = gradient) |
| Gradient Direction | `<select>` | to bottom / to right / to bottom right / radial / conic |

### State Model Extension

```javascript
surfaces: {
  texture: 'none',
  textureOpacity: 0.03,
  glassBlur: 0,
  gradient: 'none',
  // New page background state
  pageBgType: 'none',       // none | solid | gradient
  pageBgColor: '#1a1a2e',   // hex color for solid
  pageBgGradStart: '#1a1a2e', // gradient start
  pageBgGradEnd: '#16213e',   // gradient end
  pageBgGradDirection: 'to bottom', // direction
}
```

### CSS Output

When `pageBgType` is not `none`, the composer emits `--page-bg-*` tokens:

```css
/* Solid */
--page-bg-color: #1a1a2e;

/* Gradient */
--page-bg-gradient: linear-gradient(to bottom, #1a1a2e, #16213e);
```

### Bug Fix: Surface Gradient CSS Output

The existing `surface-gradient` state is tracked in the state model but never emitted in the CSS output. The `generateCSS()` function checks `state.surfaces.gradient` for the change detection condition but doesn't emit a `--gradient-*` token. This is fixed alongside the page background addition.

---

## v2 — Canvas Elevation (Future)

> **Status: Specced, not yet implemented.**

### `<layout-canvas>` Element

A custom element that creates the elevated sheet metaphor. Full-width on mobile, sheet-with-shadow on tablet+.

```css
layout-canvas {
  width: 100%;
  border-radius: 0;
  box-shadow: none;
  margin-inline: 0;
}

@media (width >= 768px) {
  layout-canvas {
    width: var(--canvas-width, 900px);
    max-width: calc(100vw - 4rem);
    margin-inline: auto;
    border-radius: var(--canvas-radius, 12px);
    box-shadow:
      0 4px 6px -1px oklch(0 0 0 / 0.1),
      0 20px 60px -10px oklch(0 0 0 / 0.3),
      0 0 0 1px oklch(1 0 0 / 0.05);
  }
}
```

### Canvas Tokens (v2)

| Token | Default | Description |
|-------|---------|-------------|
| `--canvas-width` | `900px` | Fixed canvas width (tablet+) |
| `--canvas-radius` | `12px` | Canvas border radius |
| `--canvas-shadow` | *(layered)* | Elevation shadow |
| `--canvas-effect` | `none` | `immersive` or `faded` |

### Multi-Canvas Layouts (v2)

| Mode | Description |
|------|-------------|
| `stack` | Single canvas, centred (default) |
| `split` | Two canvases side-by-side |
| `grid` | N canvases in a responsive grid |
| `cascade` | Canvases offset at slight angles |

Multi-canvas layouts use `<layout-backdrop>` as the container with `data-layout` attributes.

---

## v3 — Transitions & Animations (Future)

> **Status: Specced, not yet implemented.**

### Page Transitions via View Transitions API

| Transition | Description |
|------------|-------------|
| `slide-stack` | New page slides in from right, old slides under |
| `lift` | Canvas lifts then drops into new position |
| `dissolve` | Cross-fade between canvases |
| `flip` | 3D Y-axis flip |
| `push` | Old canvas pushed off-screen |
| `none` | Instant swap |

The backdrop persists during page transitions — only the canvas animates.

### Ambient Animations via `@property`

All animations use CSS `@property` for smooth interpolation and respect `prefers-reduced-motion`.

| Animation | Technique | Use Case |
|-----------|-----------|----------|
| `shimmer` | `@property`-animated hue rotation | Premium/dark themes |
| `pulse` | `@property`-animated radial gradient radius | Soft/calm themes |
| `drift` | `@property`-animated background position | Landscape photos |

Example — shimmer animation:

```css
@property --shimmer-hue {
  syntax: '<angle>';
  inherits: false;
  initial-value: 0deg;
}

@media (prefers-reduced-motion: no-preference) {
  body[data-animation="shimmer"] {
    background: linear-gradient(
      135deg,
      oklch(20% 0.15 calc(260deg + var(--shimmer-hue))),
      oklch(12% 0.08 calc(200deg + var(--shimmer-hue)))
    );
    animation: shimmer-hue 12s linear infinite;
  }
}

@keyframes shimmer-hue {
  to { --shimmer-hue: 360deg; }
}
```

---

## CSS Custom Properties

### v1 Tokens (Implemented)

| Property | Default | Description |
|----------|---------|-------------|
| `--page-bg-type` | `solid` | Background mode |
| `--page-bg-color` | `var(--color-background)` | Solid background color |
| `--page-bg-gradient` | `none` | CSS gradient value |
| `--page-bg-image` | `none` | Background image URL |
| `--page-bg-attachment` | `scroll` | Scroll behavior |
| `--page-bg-size` | `cover` | Sizing mode |
| `--page-bg-position` | `center` | Position |
| `--page-bg-blend` | `normal` | Blend mode |
| `--page-bg-overlay` | `none` | Color overlay |

### v2 Tokens (Specced)

| Property | Default | Description |
|----------|---------|-------------|
| `--canvas-width` | `900px` | Canvas width |
| `--canvas-radius` | `12px` | Canvas border radius |
| `--canvas-shadow` | *(layered)* | Canvas elevation shadow |
| `--canvas-effect` | `none` | Canvas visual effect |

### v3 Tokens (Specced)

| Property | Default | Description |
|----------|---------|-------------|
| `--page-transition` | `dissolve` | Page change animation |
| `--transition-duration` | `300ms` | Transition speed |
| `--backdrop-animation` | `none` | Ambient animation |

---

## Accessibility

- The page background is purely decorative — screen readers ignore it
- All v3 animations pause when `prefers-reduced-motion: reduce` is set
- v3 blur effects are skipped when `prefers-reduced-transparency: reduce` is set
- Color contrast requirements are met by the content layer (canvas), not the backdrop
- v1 gradient backgrounds do not affect content readability since text sits on `--color-surface` cards

```css
@media (prefers-reduced-motion: reduce) {
  body { animation: none !important; }
  ::view-transition-group(*) { animation-duration: 0ms !important; }
}

@media (prefers-reduced-transparency: reduce) {
  layout-canvas[data-effect="faded"] {
    background: oklch(98% 0 0);
    backdrop-filter: none;
  }
}
```

---

## Resolved Decisions

| Decision | Resolution |
|----------|------------|
| **Element naming** | `layout-backdrop` and `layout-canvas` follow the `layout-*` family. No `vb-` prefix. |
| **v1 scope** | Tokens + body rule + theme overrides. No new custom elements in v1. |
| **Token namespace** | `--page-bg-*` for page background, `--canvas-*` for canvas (v2). No `--vb-` prefix — VB tokens don't use a namespace prefix. |
| **Content container** | Native `<main>` — no `<vb-content>` element. HTML already has this. |
| **Ghost cards** | CSS `::before`/`::after` pseudo-elements for depth ≤ 2. No `<vb-canvas-ghost>` element — pseudo-elements handle the common case. |
| **Picker UI** | Extension of existing `settings-panel` infrastructure, not a new `<vb-backdrop-picker>` element. |
| **Token fallback chain** | `--page-bg-gradient` falls through to `--page-bg-image` via CSS custom property fallbacks in the `background-image` declaration. |
| **Default theme impact** | Zero visual change. `--page-bg-type: solid` with `--page-bg-color` defaulting to `var(--color-background)` produces the same result as the current `background: var(--color-surface)`. |
| **Dark/light mode** | Snap, no crossfade. Platform convention is instant switching. |
| **Animated gradients (v3)** | `@property` for all animated values. Higher browser support floor is acceptable — this is enhancement, not load-bearing. |
| **Persistence (v2+)** | Two-tier: theme CSS sets defaults, page `data-*` attributes override per-page. Runtime user changes persist to `localStorage` keyed by page path. |

---

## Deferred Items

These are specced above but **not implemented** in the v1 milestone:

| Item | Phase | Notes |
|------|-------|-------|
| `<layout-backdrop>` element | v2 | Viewport-filling environment container |
| `<layout-canvas>` element | v2 | Elevated sheet with responsive breakpoints |
| Multi-canvas layouts (split, grid, cascade) | v2 | Multiple canvases above same backdrop |
| Canvas responsive breakpoint | v2 | Full-width mobile → sheet on tablet+ |
| Page transitions (View Transitions API) | v3 | slide-stack, lift, dissolve, flip, push |
| Ambient animations (shimmer, pulse, drift) | v3 | `@property`-based CSS animations |
| Stack depth / ghost cards | v3 | `::before`/`::after` offset cards |
| Unsplash integration | v3+ | Server-side proxy for image search |
| Upload handling | v3+ | `URL.createObjectURL()` for preview |
| `--page-bg-image` in themes | v2 | Photo/texture backgrounds (gradients first) |
| `--page-bg-overlay` implementation | v2 | Color overlay compositing on images |
| Picker dialog (settings-panel extension) | v2 | End-user backdrop customization UI |
