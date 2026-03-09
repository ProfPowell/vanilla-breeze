---
title: "Backdrop Phase 1 — Deferred Features Spec"
description: "Informational specification for ghost cards, multi-canvas layouts, and page transitions — features designed but deferred from the initial data-backdrop implementation"
author: Thomas
date: 2026-03-03
tags:
  - vanilla-breeze
  - backdrop
  - canvas
  - transitions
  - ghost-cards
status: informational
---

# Backdrop Phase 1 — Deferred Features Spec

Three features were designed alongside `data-backdrop` but deferred from the initial implementation. Each section covers concept, proposed API, implementation notes, complexity assessment, and dependencies.

---

## 1. Ghost Cards (Depth Illusion)

### Concept

Ghost cards create a physical depth illusion behind the main canvas using `::before` and `::after` pseudo-elements. They simulate a stack of pages beneath the active canvas — offset, slightly scaled, and faded — giving the impression that the canvas floats above other content.

### Proposed API

```html
<!-- Depth 0 (default): no ghost cards -->
<html data-backdrop>

<!-- Depth 1: one ghost card behind canvas -->
<html data-backdrop data-canvas-depth="1">

<!-- Depth 2: two ghost cards (stack effect) -->
<html data-backdrop data-canvas-depth="2">
```

**Token:** `--canvas-depth: 0 | 1 | 2` (default `0`, no ghost cards)

### CSS Implementation

```css
/* Ghost card base — shared by ::before and ::after */
[data-backdrop][data-canvas-depth] > main {
  position: relative;
}

[data-backdrop][data-canvas-depth] > main::before,
[data-backdrop][data-canvas-depth] > main::after {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--canvas-bg);
  border-radius: var(--canvas-radius);
  z-index: -1;
  pointer-events: none;
}

/* First ghost card (depth >= 1) */
[data-backdrop][data-canvas-depth="1"] > main::before,
[data-backdrop][data-canvas-depth="2"] > main::before {
  transform: translateY(8px) scale(0.97);
  opacity: 0.5;
  box-shadow: 0 2px 4px oklch(0% 0 0 / 0.04);
}

/* Second ghost card (depth = 2) */
[data-backdrop][data-canvas-depth="2"] > main::after {
  transform: translateY(16px) scale(0.94);
  opacity: 0.25;
  box-shadow: 0 1px 2px oklch(0% 0 0 / 0.02);
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  [data-backdrop][data-canvas-depth] > main::before,
  [data-backdrop][data-canvas-depth] > main::after {
    transition: none;
  }
}
```

### Implementation Notes

- Pure CSS — no new JavaScript, no new elements
- Ghost cards use the same `--canvas-bg` and `--canvas-radius` as the main canvas
- `z-index: -1` keeps ghost cards behind the main content but above the page background
- Overflow must be handled carefully — ghost cards extend below `main`, so the parent grid area needs room
- When `data-backdrop="flush"` (radius 0), ghost cards degrade gracefully (just offset shadows)

### Complexity

**Medium** — Pure CSS, no new elements, but needs careful z-index management and overflow handling. The pseudo-elements are already used by some themes for texture overlays, so a collision audit is required.

### Dependencies

- `data-backdrop` (this phase) — ghost cards are an addon to the base backdrop system

---

## 2. Multi-Canvas Layouts

### Concept

The basic backdrop supports one canvas (`<main>`). Multi-canvas layouts allow multiple floating sheets within a shared environment — split views, side-by-side comparison, cascading windows, or stacked cards.

This requires two new custom elements:
- `<layout-backdrop>` — the environment layer (replaces `body` background role)
- `<layout-canvas>` — individual floating sheet (replaces `main` elevation role)

### Proposed API

```html
<layout-backdrop>
  <!-- Stack: canvases in a vertical column -->
  <layout-canvas data-layout="stack">
    <header>...</header>
  </layout-canvas>
  <layout-canvas data-layout="stack">
    <main>...</main>
  </layout-canvas>

  <!-- Split: side-by-side canvases -->
  <layout-canvas data-layout="split">
    <article>Editor</article>
  </layout-canvas>
  <layout-canvas data-layout="split">
    <article>Preview</article>
  </layout-canvas>
</layout-backdrop>
```

**Layout modes via attribute:**
| Mode | Description |
|------|-------------|
| `stack` | Vertical column, full-width canvases |
| `split` | Side-by-side, 50/50 or configurable ratio |
| `grid` | CSS grid layout with configurable columns |
| `cascade` | Overlapping windows (desktop metaphor) |

### Implementation Notes

```css
layout-backdrop {
  display: block;
  position: relative;
  min-height: 100dvh;
  background: var(--page-bg-gradient, var(--page-bg-color, var(--color-surface)));
}

layout-canvas {
  display: block;
  background: var(--canvas-bg);
  border-radius: var(--canvas-radius);
  box-shadow: var(--canvas-shadow);
  max-width: var(--canvas-width);
  margin-inline: auto;
}
```

- Each `<layout-canvas>` gets its own `view-transition-name` for independent animation
- Responsive collapse: on mobile (<640px), all layout modes collapse to single-column stack
- Must interact correctly with existing `data-page-layout` — when a canvas contains a `[data-page-layout]` grid, the canvas provides the floating container and the grid handles internal structure
- The `cascade` mode requires JS for drag/resize — consider limiting to CSS-only modes initially

### Complexity

**Hard** — Two new custom elements, responsive grid variants, interaction with existing `data-page-layout`, and potentially drag/resize for cascade mode. Significant design work needed for the responsive collapse behavior.

### Dependencies

- `data-backdrop` (this phase) — establishes the token vocabulary (`--canvas-*`)
- Layout attributes system (`layout-attributes.css`) — canvas must not conflict with existing grid areas
- View Transitions API (see section 3) — for independent canvas animations

---

## 3. Page Transitions

### Concept

The backdrop creates a persistent environment. When navigating between pages, the environment should stay put while only the canvas animates — sliding, lifting, dissolving, or flipping. This is the key physical metaphor: the desk stays still, the paper changes.

Uses the View Transitions API for same-document navigation (SPA) with fallback for MPA (cross-document transitions via `@view-transition`).

### Proposed API

```html
<!-- Named transition on the canvas -->
<html data-backdrop data-transition="slide-stack">
```

**Named transitions:**

| Name | Effect |
|------|--------|
| `slide-stack` | New canvas slides in from right, old slides left and scales down |
| `lift` | Old canvas lifts up and fades, new canvas fades in from below |
| `dissolve` | Cross-fade between old and new canvas |
| `flip` | 3D card flip revealing new canvas on the back |
| `push` | Old canvas pushes off-screen, new pushes in from opposite side |

### CSS Implementation

```css
/* View transition groups — backdrop persists, canvas animates */
[data-backdrop] {
  view-transition-name: backdrop;
}

[data-backdrop] > main {
  view-transition-name: canvas;
}

/* Backdrop: no animation (persists) */
::view-transition-old(backdrop),
::view-transition-new(backdrop) {
  animation: none;
}

/* Slide-stack transition */
@keyframes canvas-slide-out {
  to { transform: translateX(-100%) scale(0.95); opacity: 0.5; }
}
@keyframes canvas-slide-in {
  from { transform: translateX(100%) scale(0.95); opacity: 0.5; }
}

[data-transition="slide-stack"]::view-transition-old(canvas) {
  animation: canvas-slide-out 300ms ease-in-out;
}
[data-transition="slide-stack"]::view-transition-new(canvas) {
  animation: canvas-slide-in 300ms ease-in-out;
}

/* Dissolve transition */
[data-transition="dissolve"]::view-transition-old(canvas) {
  animation: fade-out 250ms ease;
}
[data-transition="dissolve"]::view-transition-new(canvas) {
  animation: fade-in 250ms ease;
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(canvas),
  ::view-transition-new(canvas) {
    animation-duration: 0ms;
  }
}
```

### JavaScript Orchestration (SPA)

```javascript
function navigateTo(url) {
  if (!document.startViewTransition) {
    // Fallback: instant swap
    window.location.href = url;
    return;
  }

  document.startViewTransition(async () => {
    const response = await fetch(url);
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Swap only the canvas (main), keep backdrop intact
    document.querySelector('main').replaceWith(
      doc.querySelector('main')
    );

    // Update document title
    document.title = doc.title;

    // Update URL
    history.pushState({}, '', url);
  });
}
```

### MPA Support (Cross-Document)

```css
/* In the source page */
@view-transition {
  navigation: auto;
}
```

This is simpler but requires browser support for cross-document view transitions (Chrome 126+).

### Implementation Notes

- The View Transitions API is well-supported in Chromium (Chrome 111+) but not yet in Firefox/Safari
- Fallback: instant swap with no animation when the API is unavailable
- `prefers-reduced-motion: reduce` sets `animation-duration: 0ms` — the transition still happens logically but is visually instant
- Interaction with existing router/navigation: the JS orchestration wraps whatever navigation system the site uses (11ty links, SPA router, etc.)
- The `flip` transition requires `perspective` on the transition group — needs testing across devices for performance

### Complexity

**Hard** — Requires JavaScript orchestration for SPA mode, broad browser support considerations, and interaction with existing navigation patterns. The CSS-only MPA path is simpler but requires newest browser features. Both paths need thorough testing.

### Dependencies

- `data-backdrop` (this phase) — provides the persistent environment
- `view-transition-name` assignments — must not conflict with existing VTA usage
- Router integration — needs hooks into whatever navigation system the consuming site uses

---

## Summary

| Feature | Complexity | Type | Dependencies |
|---------|-----------|------|-------------|
| Ghost Cards | Medium | Pure CSS | `data-backdrop` |
| Multi-Canvas | Hard | CSS + Custom Elements | `data-backdrop`, layout system |
| Page Transitions | Hard | CSS + JS | `data-backdrop`, View Transitions API |

Recommended implementation order: Ghost Cards first (pure CSS, low risk), then Page Transitions (highest user impact), then Multi-Canvas Layouts (largest scope).
