---
title: Animated Background Component — <animated-bg>
description: Spec for a progressive-enhancement background component with WebGL canvas, CSS animation, and static image fallback
date: 2026-03-18
status: draft
source: Stripe layout research (stripe-layout-learnings.md)
tags:
  - web-components
  - animation
  - progressive-enhancement
---

# Animated Background Component: `<animated-bg>`

## Problem

Hero sections and marketing pages benefit from animated backgrounds (gradients, particles, waves, noise fields). Currently VB has no standard pattern for this. Authors either skip it (boring hero) or write one-off JS (inconsistent, breaks PE contract).

Stripe uses a Three.js canvas with a `<picture>` fallback — clean progressive enhancement. VB should provide the PE shell without mandating a specific rendering library.

## Design Principles

1. **The component is the PE wrapper, not the renderer.** VB provides the `<animated-bg>` element that manages capability detection, fallback, and state. The author provides the rendering code (CSS animation, canvas, WebGL, Lottie — whatever they want).
2. **`<picture>` or `<img>` in light DOM is the Layer 2 fallback.** Always works without JS.
3. **`data-ready` is the PE toggle.** CSS uses `[data-ready]` to show the animated layer and hide the static fallback.
4. **Respects `prefers-reduced-motion`.** If reduced motion, the component never activates — the static image stays.

## Proposed API

### HTML (author writes this)

```html
<!-- Inside a hero section -->
<section class="hero" data-mode="dark" data-bleed>
  <animated-bg aria-hidden="true">
    <!-- Layer 2: static fallback (always works) -->
    <picture>
      <source srcset="hero-bg.avif" type="image/avif">
      <source srcset="hero-bg.webp" type="image/webp">
      <img src="hero-bg.jpg" alt="">
    </picture>
  </animated-bg>

  <layout-center>
    <h1>Hero content on top</h1>
  </layout-center>
</section>
```

### CSS (VB provides)

```css
animated-bg {
  position: absolute;
  inset: 0;
  z-index: -1;
  overflow: hidden;
}

animated-bg > picture,
animated-bg > img {
  display: block;
  inline-size: 100%;
  block-size: 100%;
  object-fit: cover;
}

/* When JS activates, hide static fallback */
animated-bg[data-ready] > picture,
animated-bg[data-ready] > img {
  display: none;
}

/* Canvas fills the component */
animated-bg > canvas {
  display: none;
  inline-size: 100%;
  block-size: 100%;
}

animated-bg[data-ready] > canvas {
  display: block;
}
```

### JS (VB provides the shell)

```js
class AnimatedBg extends HTMLElement {
  connectedCallback() {
    // Check capabilities
    const noMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (noMotion) return; // Static fallback stays

    // Check for author-provided render function
    const renderSrc = this.dataset.render;
    if (renderSrc) {
      // Dynamic import of author's render module
      import(renderSrc)
        .then(mod => {
          const canvas = document.createElement('canvas');
          this.appendChild(canvas);
          mod.default(canvas, this);
          this.dataset.ready = '';
        })
        .catch(() => {
          // Import failed — static fallback stays
        });
    }

    // Or: author can call animated-bg's API directly
    // const bg = document.querySelector('animated-bg');
    // bg.activate(canvas => { /* render to canvas */ });
  }

  activate(renderFn) {
    const canvas = document.createElement('canvas');
    this.appendChild(canvas);
    renderFn(canvas);
    this.dataset.ready = '';
  }

  disconnectedCallback() {
    // Clean up animation frame, WebGL context, etc.
    delete this.dataset.ready;
  }
}
```

### Author's render module (author provides)

```js
// hero-wave.js — author's custom animation
export default function render(canvas, container) {
  const ctx = canvas.getContext('2d'); // or 'webgl2'
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;

  function animate() {
    // Draw frame...
    requestAnimationFrame(animate);
  }
  animate();
}
```

## Built-in Render Presets (future)

VB could ship a few CSS-only animated backgrounds that don't need canvas at all:

```html
<!-- CSS gradient animation — no JS needed -->
<animated-bg data-preset="gradient-shift">
  <img src="fallback.jpg" alt="">
</animated-bg>
```

CSS presets:
- `gradient-shift` — slow hue rotation via `@property` + `@keyframes`
- `noise` — subtle SVG noise texture with opacity animation
- `aurora` — multi-color gradient that shifts position
- `particles` — CSS-only floating dots via `background-image` animation

These would live in `src/web-components/animated-bg/presets.css`.

## Progressive Enhancement Stack

| Layer | What renders | Requires |
|-------|-------------|----------|
| 1. Background color | Section's `background` token | Nothing |
| 2. Static image | `<picture>` / `<img>` inside `<animated-bg>` | HTML only |
| 3. CSS animation | `data-preset` CSS keyframes | CSS (no JS) |
| 4. Canvas/WebGL | Author-provided render function | JS + GPU |

Each layer falls back to the previous. The component never shows a blank state.

## Integration with Hero Bleed

When used inside `section.hero[data-bleed]`, the hero's `::before` handles the background bleed behind the nav. `<animated-bg>` fills the section's visual area (which extends behind the nav thanks to the bleed). The z-index stacking:

```
section.hero[data-bleed]
  ::before (z-index: -1, background bleed behind nav)
  animated-bg (z-index: -1, inside section, below content)
  layout-center (z-index: auto, content on top)
```

If both `::before` and `animated-bg` are present, the `::before` provides the color bleed and the `animated-bg` provides the visual layer. The `animated-bg` should NOT use `::before` itself.

## Open Questions

1. Should `data-render` accept a URL to auto-import, or should activation always be explicit JS?
2. Should CSS presets be in the component's styles or a separate opt-in file?
3. ResizeObserver for canvas sizing — should the component handle this automatically?
4. Should there be a `data-fps` throttle attribute for performance-conscious contexts?
5. Memory management: when the component scrolls out of viewport, pause the animation?

## Estimated Effort

- Component shell (CSS + JS): Small-Medium
- CSS presets (gradient-shift, noise, aurora): Medium
- Canvas/WebGL example renders: Author-provided, not framework scope
- Documentation: Medium (PE philosophy needs clear explanation)
