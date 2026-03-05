---
title: Vanilla Breeze Bundle System
description: Consolidated specification for themes, effects bundles, and component bundles. Implementation reference for Claude Code.
version: 1.0.0
status: canonical
---

# Vanilla Breeze Bundle System

A bundle is a named, self-contained package that extends Vanilla Breeze with a coherent aesthetic identity. A bundle may contain a theme (tokens), effects (data-* attribute animations), components (web components), or any combination of the three. All three layers share one design contract: the token layer is owned by the theme and auto-inherited everywhere; the chrome layer is owned by the bundle and defines the aesthetic personality.

This document is the authoritative implementation reference. Read it fully before writing any bundle file.

---

## Table of Contents

- [Mental Model](#mental-model)
- [CSS Layer Architecture](#css-layer-architecture)
- [Directory Structure](#directory-structure)
- [Loading Contracts](#loading-contracts)
  - [Theme file](#1-theme-file)
  - [Effects CSS](#2-effects-css)
  - [Effects JS](#3-effects-js)
  - [Component JS](#4-component-js)
  - [Bundle index](#5-bundle-index)
  - [Convenience rollup](#6-convenience-rollup)
- [Token System](#token-system)
  - [Consumed tokens](#consumed-tokens)
  - [Exposed tokens](#exposed-tokens)
  - [Naming rules](#naming-rules)
- [Effects Authoring Contract](#effects-authoring-contract)
  - [CSS effect rules](#css-effect-rules)
  - [JS effect rules](#js-effect-rules)
  - [Registration API](#effects-registration-api)
- [Component Authoring Contract](#component-authoring-contract)
  - [Five rules](#five-rules)
  - [Parts API](#parts-api)
  - [Attribute API](#attribute-api)
  - [Events API](#events-api)
  - [Static metadata](#static-metadata)
  - [Registration API](#component-registration-api)
  - [Contract file format](#contract-file-format)
- [Conflict Resolution](#conflict-resolution)
- [Graceful Degradation](#graceful-degradation)
- [First-Party Bundles](#first-party-bundles)
- [Third-Party Bundle Guide](#third-party-bundle-guide)
- [Validation Checklist](#validation-checklist)

---

## Mental Model

```
Theme active: retro
│
├── Token layer          ← owned by theme. All CSS custom props.
│   --color-primary: phosphor green
│   --radius-m: 0px
│   --font-mono: VT323, monospace
│
├── Effects layer        ← owned by bundle. data-* attribute animations.
│   [data-scanlines]     CRT overlay
│   [data-flipboard]     split-flap letter animation
│   [data-phosphor]      green glow text
│
└── Components layer     ← owned by bundle. Web components with retro chrome.
    <audio-player>       VU meters, beveled bezel, oscilloscope screen
    <led-counter>        7-segment digit display
    <crt-terminal>       phosphor terminal emulator

Switch theme to: kawaii
│
├── Token layer swaps automatically
│   --color-primary: bubblegum pink
│   --radius-m: 999px
│   --font-mono: system-ui (kawaii doesn't lean on mono)
│
├── Effects layer stays retro IF retro.css is loaded
│   The same [data-scanlines] now uses pink tokens.        ← auto
│   Load kawaii.css to swap effects too.
│
└── Components layer: retro chrome with pink/round tokens  ← auto swap
    Load kawaii audio-player to get bubbly chrome instead.
```

The token layer swaps for free. Chrome swaps only when you load a different bundle's CSS/JS. Both behaviors are valid and intentional.

---

## CSS Layer Architecture

The extended layer order for the full bundle system:

```css
@layer
  tokens,           /* design tokens — lowest priority */
  reset,            /* browser normalization */
  native-elements,  /* semantic HTML element styles */
  custom-elements,  /* layout custom elements */
  web-components,   /* interactive web components */
  utils,            /* data-* attribute utilities — core effects */
  bundle-theme,     /* bundle token overrides */
  bundle-effects,   /* bundle effect styles */
  bundle-components;/* bundle component styles — highest priority */
```

Layer order is **declared once** in `src/main.css`. Bundle CSS files must use `@layer bundle-theme`, `@layer bundle-effects`, or `@layer bundle-components` to slot into the correct position. They never redeclare the full layer order.

`bundle-components` sits above `bundle-effects` so component internal styles always win over loose effect attributes applied to the same element.

---

## Directory Structure

```
src/
├── main.css                      # Layer declaration + core imports
├── main.js                       # Core registry + MutationObserver boot
│
├── tokens/
│   ├── colors.css
│   ├── typography.css
│   ├── spacing.css
│   ├── motion.css
│   └── themes/
│       ├── forest.css            # First-party brand theme
│       ├── ocean.css
│       └── sunset.css
│
├── effects/
│   ├── core.css                  # Core effects (blink, shimmer, highlight…)
│   └── core.js                   # Core effects JS (typewriter, scramble…)
│
└── bundles/
    ├── retro/
    │   ├── retro.theme.css       # Token overrides for retro aesthetic
    │   ├── retro.effects.css     # CSS effects (scanlines, phosphor, static)
    │   ├── retro.effects.js      # JS effects (flipboard, slot-machine)
    │   ├── retro.components.js   # All component registrations
    │   ├── retro.bundle.js       # Bundle index — manifest + lazy loaders
    │   ├── retro.full.css        # Rollup: theme + effects CSS
    │   ├── retro.full.js         # Rollup: effects JS + components JS
    │   └── components/
    │       ├── audio-player/
    │       │   ├── audio-player.js
    │       │   └── audio-player.contract.md
    │       ├── led-counter/
    │       │   ├── led-counter.js
    │       │   └── led-counter.contract.md
    │       └── crt-terminal/
    │           ├── crt-terminal.js
    │           └── crt-terminal.contract.md
    ├── kawaii/
    │   └── … same structure
    └── sci-fi/
        └── … same structure

dist/
└── cdn/
    ├── vanilla-breeze-core.css   # Built: all core layers
    ├── vanilla-breeze-core.js    # Built: all core JS
    ├── bundles/
    │   ├── retro.theme.css
    │   ├── retro.effects.css
    │   ├── retro.full.css        # convenience rollup
    │   ├── retro.full.js
    │   └── …
    └── components/
        └── audio-player.contract.json  # Machine-readable contracts
```

---

## Loading Contracts

Every bundle exposes six possible files. Users load only what they need. All six are independently valid — no hidden required pairs.

### 1. Theme file

**File:** `retro.theme.css`
**Layer:** `bundle-theme`
**Contains:** CSS custom property overrides only. No selectors other than `:root` and `[data-theme="retro"]`. No animations. No component styles.

```css
/* retro.theme.css */
@layer bundle-theme {

  /* Applied when this theme is active */
  :root[data-theme="retro"],
  [data-theme="retro"] {
    /* Hue pivots — all derived colors update automatically */
    --hue-primary: 145;      /* phosphor green */
    --hue-secondary: 145;
    --hue-accent: 75;        /* amber */

    /* Override specific semantic tokens */
    --color-primary: oklch(70% 0.28 145);
    --color-surface: oklch(10% 0.02 260);
    --color-surface-sunken: oklch(6% 0.015 260);
    --color-surface-raised: oklch(18% 0.03 260);
    --color-border: oklch(32% 0.04 260);
    --color-text: oklch(90% 0.01 260);
    --color-text-muted: oklch(55% 0.02 260);

    /* Override shape tokens */
    --radius-m: 2px;         /* retro = sharp corners */
    --radius-l: 4px;
    --radius-full: 4px;      /* even pills are boxy */

    /* Typography */
    --font-mono: 'VT323', 'Courier New', monospace;

    /* Motion — retro uses steps() not easing */
    --ease-out: steps(4);
    --duration-fast: 50ms;
  }

  /* Dark mode override within this theme (optional) */
  :root[data-theme="retro"][data-mode="light"] {
    --color-primary: oklch(40% 0.2 145);
    --color-surface: oklch(94% 0.005 145);
    --color-surface-sunken: oklch(88% 0.01 145);
    --color-text: oklch(12% 0.02 260);
  }
}
```

**Loading:**
```html
<link rel="stylesheet" href="cdn/bundles/retro.theme.css">
```

**When to use alone:** You want retro token aesthetics applied to core VB components without loading any retro-specific effects or components.

---

### 2. Effects CSS

**File:** `retro.effects.css`
**Layer:** `bundle-effects`
**Contains:** `[data-*]` attribute selectors, `@keyframes`, CSS custom property defaults for effects. No component styles. No `:host` rules.

```css
/* retro.effects.css */
@layer bundle-effects {

  /* ── Phosphor text glow ────────────────────────────────────── */
  /* Usage: <span data-phosphor>TEXT</span> */
  /* Usage: <span data-phosphor="amber">TEXT</span> */

  [data-phosphor] {
    --vb-phosphor-color: var(--color-primary, oklch(70% 0.28 145));
    color: var(--vb-phosphor-color);
    animation: vb-phosphor-pulse 3s ease-in-out infinite alternate;
  }

  [data-phosphor="amber"] { --vb-phosphor-color: oklch(75% 0.2 75); }
  [data-phosphor="white"] { --vb-phosphor-color: oklch(90% 0.01 260); }

  @keyframes vb-phosphor-pulse {
    from { text-shadow: 0 0 4px var(--vb-phosphor-color), 0 0 12px color-mix(in oklch, var(--vb-phosphor-color), transparent 50%); }
    to   { text-shadow: 0 0 2px var(--vb-phosphor-color), 0 0 8px color-mix(in oklch, var(--vb-phosphor-color), transparent 70%); }
  }

  /* ── CRT scanlines overlay ─────────────────────────────────── */
  /* Usage: <div data-scanlines>…</div> */
  /* Positions over content — element must be position:relative  */

  [data-scanlines] {
    position: relative;
    isolation: isolate;

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      background: repeating-linear-gradient(
        to bottom,
        transparent,
        transparent 2px,
        oklch(0% 0 0 / var(--vb-scanline-opacity, 0.08)) 2px,
        oklch(0% 0 0 / var(--vb-scanline-opacity, 0.08)) 4px
      );
      pointer-events: none;
      z-index: 1;
      border-radius: inherit;
    }
  }

  [data-scanlines="heavy"] { --vb-scanline-opacity: 0.18; }
  [data-scanlines="light"] { --vb-scanline-opacity: 0.04; }

  /* ── Static noise ──────────────────────────────────────────── */
  /* Usage: <div data-static>…</div> */

  [data-static] {
    position: relative;
    isolation: isolate;

    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E");
      pointer-events: none;
      z-index: 1;
      animation: vb-static-shift 0.12s steps(1) infinite;
    }
  }

  @keyframes vb-static-shift {
    0%   { transform: translate(0, 0); }
    25%  { transform: translate(-1px, 1px); }
    50%  { transform: translate(1px, 0); }
    75%  { transform: translate(0, -1px); }
    100% { transform: translate(1px, 1px); }
  }

  /* ── Reduced motion overrides ──────────────────────────────── */
  @media (prefers-reduced-motion: reduce) {
    [data-phosphor]   { animation: none; }
    [data-static]::before { animation: none; }
  }

  :root[data-motion-reduced] [data-phosphor]      { animation: none; }
  :root[data-motion-reduced] [data-static]::before { animation: none; }

  /* ── Print strip ───────────────────────────────────────────── */
  @media print {
    [data-phosphor] { color: currentColor; text-shadow: none; animation: none; }
    [data-scanlines]::after,
    [data-static]::before { display: none; }
  }
}
```

**Loading:**
```html
<!-- After core, after theme -->
<link rel="stylesheet" href="cdn/bundles/retro.effects.css">
```

**When to use alone:** You want retro data-* effects on a page that uses core VB tokens (not the retro theme). Works fine — effects fall back to `var(--color-primary)` if the retro theme tokens aren't present.

---

### 3. Effects JS

**File:** `retro.effects.js`
**Contains:** JS-enhanced effects that require DOM manipulation (char splitting, canvas drawing, timer loops). Registers into the core effects registry so the existing `MutationObserver` boot picks them up automatically.

```js
// retro.effects.js
import { registerEffect } from '../../../main.js'

// ── Flipboard ────────────────────────────────────────────────────────────────
// Usage: <span data-flipboard>ARRIVALS</span>
// Usage: <span data-flipboard="hover">HOVER ME</span>
// Usage: <span data-flipboard="scroll">SCROLL TRIGGER</span>

registerEffect('flipboard', {
  selector: '[data-flipboard]',
  bundle: 'retro',

  // Called once per element when first seen by MutationObserver
  init(el) {
    const text    = el.textContent.trim()
    const trigger = el.getAttribute('data-flipboard') || 'load'

    // Wrap each character
    el.innerHTML = [...text].map((ch, i) =>
      `<span class="vb-fb-char" data-char="${ch}" style="--i:${i}">${ch}</span>`
    ).join('')

    el.setAttribute('data-flipboard-init', '')

    const run = () => flipAll(el, text)

    if (trigger === 'hover') {
      el.addEventListener('mouseenter', run, { once: false })
    } else if (trigger === 'scroll') {
      new IntersectionObserver(([entry], obs) => {
        if (entry.isIntersecting) { run(); obs.disconnect() }
      }, { threshold: 0.5 }).observe(el)
    } else {
      // load — slight delay so page paint completes first
      setTimeout(run, 100)
    }
  },

  destroy(el) {
    // Restore original text, remove init attribute
    const original = [...el.querySelectorAll('.vb-fb-char')]
      .map(s => s.dataset.char).join('')
    el.textContent = original
    el.removeAttribute('data-flipboard-init')
  },

  reducedMotionFallback(el) {
    // Skip animation — text is already readable
    el.setAttribute('data-flipboard-init', '')
  }
})

const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·—'

function flipAll(el, finalText) {
  const chars = el.querySelectorAll('.vb-fb-char')
  chars.forEach((span, i) => flipChar(span, finalText[i], i * 40))
}

function flipChar(span, finalChar, delay) {
  let steps = 8
  let count = 0
  const iv = setInterval(() => {
    if (count >= steps) {
      clearInterval(iv)
      span.textContent = finalChar
      span.classList.add('vb-fb-resolved')
      return
    }
    span.textContent = CHARSET[Math.floor(Math.random() * CHARSET.length)]
    count++
  }, delay + count * 30)
}
```

**The `registerEffect` signature:**

```js
/**
 * @param {string} name - matches the data-* attribute value root
 * @param {object} def
 * @param {string}   def.selector  - CSS selector the effect applies to
 * @param {string}   def.bundle    - bundle name (for tooling/devtools)
 * @param {function} def.init      - called once per element on first observation
 * @param {function} def.destroy   - called when element leaves DOM
 * @param {function} [def.reducedMotionFallback] - called instead of init when motion reduced
 */
registerEffect(name, def)
```

**Loading:**
```html
<script type="module" src="cdn/bundles/retro.effects.js"></script>
```

---

### 4. Component JS

**File:** `retro.components.js`
**Contains:** All component class definitions and registrations for the bundle. Imports individual component files; does not define logic itself.

```js
// retro.components.js
import { registerComponent } from '../../../main.js'
import { AudioPlayer }  from './components/audio-player/audio-player.js'
import { LedCounter }   from './components/led-counter/led-counter.js'
import { CrtTerminal }  from './components/crt-terminal/crt-terminal.js'

registerComponent('audio-player', AudioPlayer, {
  bundle: 'retro',
  contract: 'audio-player',
  priority: 10,
})

registerComponent('led-counter', LedCounter, {
  bundle: 'retro',
  contract: 'numeric-display',
  priority: 10,
})

registerComponent('crt-terminal', CrtTerminal, {
  bundle: 'retro',
  contract: 'terminal',
  priority: 10,
})
```

**The `registerComponent` signature:**

```js
/**
 * @param {string}      tag      - custom element tag name
 * @param {class}       impl     - HTMLElement subclass
 * @param {object}      opts
 * @param {string}      opts.bundle    - bundle name
 * @param {string}      opts.contract  - contract identifier (from .contract.md)
 * @param {number}      opts.priority  - higher wins on tag conflicts (default 0)
 */
registerComponent(tag, impl, opts)
```

`registerComponent` wraps `customElements.define()`. If the tag is already defined by a higher-priority registration, it skips silently. If same priority, last-loaded wins and logs a console warning.

**Loading:**
```html
<script type="module" src="cdn/bundles/retro.components.js"></script>
```

---

### 5. Bundle index

**File:** `retro.bundle.js`
**Contains:** Bundle manifest and lazy component loaders. This is what tooling, devtools, and the `theme-picker` component consume. It does **not** register anything itself — it exports metadata.

```js
// retro.bundle.js
export const bundle = {
  name: 'retro',
  version: '1.0.0',
  label: 'Retro / CRT',
  description: 'Phosphor terminals, split-flap boards, VU meters. Peak 1979.',

  // CSS files in recommended load order
  css: [
    { role: 'theme',      href: 'retro.theme.css' },
    { role: 'effects',    href: 'retro.effects.css' },
  ],

  // JS files in recommended load order
  js: [
    { role: 'effects',    src: 'retro.effects.js' },
    { role: 'components', src: 'retro.components.js' },
  ],

  // Individual components — lazy loaded on first use
  components: [
    {
      tag: 'audio-player',
      contract: 'audio-player',
      label: 'Audio Player',
      load: () => import('./components/audio-player/audio-player.js'),
    },
    {
      tag: 'led-counter',
      contract: 'numeric-display',
      label: 'LED Counter',
      load: () => import('./components/led-counter/led-counter.js'),
    },
    {
      tag: 'crt-terminal',
      contract: 'terminal',
      label: 'CRT Terminal',
      load: () => import('./components/crt-terminal/crt-terminal.js'),
    },
  ],

  // Effects registered by this bundle
  effects: [
    { name: 'flipboard',    selector: '[data-flipboard]',  type: 'js' },
    { name: 'slot-machine', selector: '[data-slot-machine]', type: 'js' },
    { name: 'phosphor',     selector: '[data-phosphor]',   type: 'css' },
    { name: 'scanlines',    selector: '[data-scanlines]',  type: 'css' },
    { name: 'static',       selector: '[data-static]',     type: 'css' },
  ],

  // Tokens this theme overrides (for documentation/tooling)
  tokenOverrides: [
    '--hue-primary', '--hue-secondary', '--hue-accent',
    '--color-primary', '--color-surface', '--color-surface-sunken',
    '--radius-m', '--radius-l', '--font-mono', '--ease-out',
  ],
}
```

---

### 6. Convenience rollup

**Files:** `retro.full.css`, `retro.full.js`
**Generated by build script** — not hand-authored. Concatenates theme + effects CSS into one file and effects + components JS into one file. For CDN users who want one request per bundle.

```css
/* retro.full.css — GENERATED, do not edit */
/* Concatenation of: retro.theme.css + retro.effects.css */
@layer bundle-theme { … }
@layer bundle-effects { … }
```

```js
// retro.full.js — GENERATED, do not edit
// Concatenation of: retro.effects.js + retro.components.js
```

**HTML loading — minimal (theme only):**
```html
<link rel="stylesheet" href="cdn/vanilla-breeze-core.css">
<link rel="stylesheet" href="cdn/bundles/retro.theme.css">
<script type="module" src="cdn/vanilla-breeze-core.js"></script>
```

**HTML loading — full bundle:**
```html
<link rel="stylesheet" href="cdn/vanilla-breeze-core.css">
<link rel="stylesheet" href="cdn/bundles/retro.full.css">
<script type="module" src="cdn/vanilla-breeze-core.js"></script>
<script type="module" src="cdn/bundles/retro.full.js"></script>
```

**HTML loading — granular (recommended for build pipelines):**
```html
<link rel="stylesheet" href="cdn/vanilla-breeze-core.css">
<link rel="stylesheet" href="cdn/bundles/retro.theme.css">
<link rel="stylesheet" href="cdn/bundles/retro.effects.css">
<script type="module" src="cdn/vanilla-breeze-core.js"></script>
<script type="module" src="cdn/bundles/retro.effects.js"></script>
<script type="module" src="cdn/bundles/retro.components.js"></script>
```

**Switching themes at runtime (JS):**
```js
import { activateBundle } from 'vanilla-breeze'

// Loads CSS dynamically, re-registers components at new priority
await activateBundle('kawaii')
```

---

## Token System

### Consumed tokens

Every bundle file — effects CSS, component shadow DOM styles — reads from the core token set. These are the tokens that auto-swap when the theme changes. **Never use raw colour values. Always reference these.**

| Token | Purpose |
|---|---|
| `--color-primary` | Main accent. Active states, highlights, key UI. |
| `--color-secondary` | Supporting accent. |
| `--color-accent` | Tertiary emphasis. |
| `--color-surface` | Page/body background. |
| `--color-surface-sunken` | Recessed areas, inputs, code blocks. |
| `--color-surface-raised` | Elevated elements, cards, dropdowns. |
| `--color-border` | Lines, dividers, input borders. |
| `--color-text` | Primary text. |
| `--color-text-muted` | Secondary/hint text. |
| `--color-success` / `--color-warning` / `--color-danger` | Semantic states. |
| `--size-3xs` → `--size-3xl` | Spacing scale. T-shirt sizing. |
| `--radius-s` / `--radius-m` / `--radius-l` / `--radius-full` | Corner rounding. |
| `--font-sans` / `--font-serif` / `--font-mono` | Type stacks. |
| `--font-size-sm` → `--font-size-xl` | Type scale. |
| `--shadow-s` / `--shadow-m` / `--shadow-l` | Elevation scale. |
| `--duration-fast` / `--duration-normal` / `--duration-slow` | Animation timing. |
| `--ease-out` / `--ease-in-out` / `--motion-snappy` | Easing functions. |

### Exposed tokens

Every effect and component exposes its own override API via `--{thing}-{property}` custom properties. These **always fall back to system tokens**.

```css
/* Pattern: component/effect sets its own token, falling back to system */
:host {
  --audioplayer-screen-color: var(--color-primary);
  --audioplayer-bg:           var(--color-surface-sunken);
  --audioplayer-bezel:        var(--color-border);
}
```

This means:
1. Out of the box, the component uses the active theme's colors.
2. Authors can override one property inline without touching others.
3. Changing `--color-primary` on a parent changes `--audioplayer-screen-color` automatically unless the author has overridden it.

### Naming rules

| Scope | Pattern | Example |
|---|---|---|
| Effect CSS prop | `--vb-{effect}-{property}` | `--vb-phosphor-color` |
| Effect speed | `--vb-{effect}-speed` | `--vb-flipboard-speed` |
| Component prop | `--{tag}-{property}` | `--audioplayer-bg` |
| Component part prop | `--{tag}-{part}-{property}` | `--audioplayer-screen-color` |

---

## Effects Authoring Contract

### CSS effect rules

1. **All rules inside `@layer bundle-effects`**. No exceptions.
2. **Selector is always the `[data-*]` attribute**. Never a class.
3. **Variants are attribute values**: `[data-phosphor="amber"]`. Space-separated for compound variants: `[data-phosphor~="amber"]`.
4. **All colours reference tokens or `--vb-effect-*` props** that fall back to tokens.
5. **Always include reduced-motion override** in the same file — both the `@media` form and the `:root[data-motion-reduced]` form.
6. **Always include a `@media print` strip** that removes all animation and filter effects.
7. **Custom properties are set on the selector**, not on `:root`, so they scope to the element.

```css
/* ✓ Correct scoping */
[data-phosphor] {
  --vb-phosphor-color: var(--color-primary);
  color: var(--vb-phosphor-color);
}

/* ✗ Wrong — global, can't be overridden per-element */
:root {
  --vb-phosphor-color: var(--color-primary);
}
```

### JS effect rules

1. **Import `registerEffect` from core**. Never call `document.querySelectorAll` manually — the registry and MutationObserver handle observation.
2. **`init(el)` must be idempotent**. Check for an `*-init` attribute before doing work. Set it when done.
3. **`destroy(el)` must fully reverse `init`**. No DOM leaks, no dangling event listeners, no orphaned intervals/rAF.
4. **`reducedMotionFallback(el)` is required**. Must produce a readable, static final state without any motion.
5. **Never use `innerHTML` on the original element without saving original text**. Char-splitting effects must restore the original string on `destroy`.
6. **Timing**: use `requestAnimationFrame` for visual loops, `setTimeout` for staggered delays. Never `setInterval` for animation.

### Effects registration API

```js
import { registerEffect } from 'vanilla-breeze/registry'

registerEffect('phosphor', {
  selector: '[data-phosphor]',
  bundle: 'retro',           // for devtools / conflict reporting

  init(el) {
    if (el.hasAttribute('data-phosphor-init')) return   // idempotent guard
    // … setup …
    el.setAttribute('data-phosphor-init', '')
  },

  destroy(el) {
    // … tear down …
    el.removeAttribute('data-phosphor-init')
  },

  reducedMotionFallback(el) {
    // Show resolved/final state with no animation
    el.setAttribute('data-phosphor-init', '')
  },
})
```

---

## Component Authoring Contract

### Five rules

Every component — regardless of bundle — must follow all five rules.

**Rule 1: All colours are tokens**

No hardcoded colour values anywhere in the shadow DOM stylesheet.

```css
/* ✗ */
:host { background: #1a1a1a; }

/* ✓ */
:host { background: var(--audioplayer-bg, var(--color-surface-sunken)); }
```

**Rule 2: Expose a `--{tag}-*` custom property API**

Every styleable value is reachable via a documented custom property that defaults to a system token.

```css
:host {
  --audioplayer-screen-color: var(--color-primary);
  --audioplayer-bg:           var(--color-surface-sunken);
  --audioplayer-bezel:        var(--color-border);
  --audioplayer-text:         var(--color-text);
  --audioplayer-radius:       var(--radius-m);
}
```

**Rule 3: Expose structural regions via `::part()`**

Name parts by **function not appearance**. `controls` not `bottom-bar`. `screen` not `dark-rectangle`.

Compound parts use space-separated names: `part="play-button control"` so consumers can target `::part(play-button)` or `::part(control)` to get all controls at once.

**Rule 4: Declare static metadata**

```js
class AudioPlayer extends HTMLElement {
  static bundle          = 'retro'
  static contract        = 'audio-player'
  static version         = '1.0.0'
  static consumesTokens  = ['--color-primary', '--color-surface-sunken', '…']
  static exposesTokens   = ['--audioplayer-screen-color', '--audioplayer-bg', '…']
  static reducedMotionFallback(el) { /* stop animation, show static state */ }
}
```

**Rule 5: Render usable content without JS**

The component must have meaningful light-DOM fallback content that displays before the custom element is defined.

```html
<audio-player src="track.mp3">
  <!-- Shown if JS unavailable or before element upgrades -->
  <audio controls src="track.mp3">
    Your browser does not support audio playback.
  </audio>
</audio-player>
```

### Parts API

Required parts by component category:

| Category | Required parts |
|---|---|
| Media players | `screen`, `controls`, `bezel`, `timeline`, `volume` |
| Data displays | `display`, `label`, `value` |
| Navigation | `nav`, `item`, `indicator` |
| Forms | `field`, `label`, `input`, `error` |
| Notifications | `panel`, `title`, `body`, `close` |

All additional parts are at the bundle author's discretion.

### Attribute API

Conventions that must be consistent across all bundle implementations of the same contract:

| Convention | Rule | Example |
|---|---|---|
| Boolean attributes | Presence/absence only | `<audio-player autoplay>` |
| Enum variants | `data-` prefix | `data-visualizer="bars"` |
| Content | Plain attribute name | `src`, `label`, `value` |
| State reflection | `data-state` on host | `data-state="playing"` |
| Bundle override | `data-bundle` | `data-bundle="retro"` |

### Events API

All events follow `vb:{tag}:{action}` naming. All events set `bubbles: true, composed: true` so they cross the shadow DOM boundary.

```js
this.dispatchEvent(new CustomEvent('vb:audioplayer:play', {
  bubbles: true,
  composed: true,
  detail: {
    currentTime: this._audio.currentTime,
    src: this._audio.src,
  }
}))
```

Events the contract defines are the stable API. Implementations may emit additional events but must not omit contract-defined ones.

### Static metadata

```js
class MyComponent extends HTMLElement {
  // Required
  static bundle          = 'retro'      // which bundle provides this
  static contract        = 'tag-name'   // which contract this implements
  static version         = '1.0.0'      // semver

  // Required — used by tooling and docs generators
  static consumesTokens = [
    '--color-primary',
    '--color-surface-sunken',
    // … every system token this component reads
  ]

  static exposesTokens = [
    '--audioplayer-screen-color',
    // … every --{tag}-* prop this component declares
  ]

  // Required — called by registry when reduced motion is active
  static reducedMotionFallback(el) {
    // Must produce a readable static state
    // Must not throw if called before connectedCallback
  }
}
```

### Component registration API

```js
import { registerComponent } from 'vanilla-breeze/registry'

registerComponent('audio-player', AudioPlayer, {
  bundle: 'retro',
  contract: 'audio-player',
  priority: 10,
  // priority 0 = core/default
  // higher number wins when multiple bundles loaded
  // data-bundle="retro" on the element overrides priority entirely
})
```

Internally `registerComponent`:
- Checks if the tag is already defined at equal or higher priority.
- If not: calls `customElements.define(tag, impl)`.
- If yes, same priority: warns in console, skips.
- If yes, lower priority: skips silently (existing wins).
- Registers the static metadata in the bundle registry for tooling.
- Wires `reducedMotionFallback` into the motion preference observer.

### Contract file format

Every component ships a `.contract.md` file. The YAML frontmatter is machine-readable (used by the doc generator and contract validator). The Markdown body is the human-readable spec for alternative implementors.

```markdown
---
contract: audio-player
version: 1.0.0
tag: audio-player
bundle-hint: retro
category: media

consumes-tokens:
  - --color-primary
  - --color-surface-sunken
  - --color-border
  - --color-text
  - --size-m
  - --radius-m
  - --font-mono

exposes-tokens:
  - name: --audioplayer-screen-color
    default: var(--color-primary)
    description: Visualizer line colour and active accent colour
  - name: --audioplayer-bg
    default: var(--color-surface-sunken)
    description: Main body background
  - name: --audioplayer-bezel
    default: var(--color-border)
    description: Housing border and bevel colour
  - name: --audioplayer-text
    default: var(--color-text)
    description: Labels and readout text colour
  - name: --audioplayer-radius
    default: var(--radius-m)
    description: Corner rounding of the housing

parts:
  - name: bezel
    description: Outer housing
  - name: screen
    description: Visualizer canvas area
  - name: controls
    description: Transport control region
  - name: play-button
    also: control
    description: Play/pause toggle
  - name: skip-button
    also: control
    description: Skip/restart button
  - name: timeline
    also: control
    description: Seek range input
  - name: volume
    also: control
    description: Volume range input
  - name: time-display
    also: display
    description: Current time and duration readout
  - name: track-title
    also: display
    description: Track name display

attributes:
  - name: src
    required: true
    type: string
    description: Audio source URL
  - name: data-title
    required: false
    type: string
    description: Track display name. Inferred from src filename if omitted.
  - name: autoplay
    required: false
    type: boolean
  - name: loop
    required: false
    type: boolean
  - name: data-visualizer
    required: false
    type: enum
    values: [wave, bars, circle, none]
    default: wave
  - name: data-bundle
    required: false
    type: string
    description: Force a specific bundle implementation of this contract.

events:
  - name: vb:audioplayer:play
    detail: "{ currentTime: number, src: string }"
  - name: vb:audioplayer:pause
    detail: "{ currentTime: number }"
  - name: vb:audioplayer:ended
    detail: "{ src: string }"
  - name: vb:audioplayer:timeupdate
    detail: "{ currentTime: number, duration: number, progress: number }"

fallback: >
  Provide a native <audio controls src="…"> element as child content.
  It renders immediately without JavaScript and is adopted by the component
  as its audio source when JS runs.
---

# audio-player

A themeable audio player with a canvas visualizer display.

## Minimum viable implementation

An implementation is contract-compliant when it:

1. Plays audio from the `src` attribute
2. Provides accessible play/pause, seek, and volume controls
3. Reflects `data-state="playing|paused|ended"` on the host element
4. Dispatches all events listed above with correct `detail` shapes
5. Exposes all listed `::part()` names
6. Reads all listed `--audioplayer-*` tokens with documented fallbacks
7. Renders usable native audio fallback before JS executes

## What implementations may vary

- Visual layout and chrome structure
- Presence and style of a visualizer
- Number of visualizer modes
- Additional custom properties beyond the required set
- Additional parts beyond the required set
- Animation character and style
```

---

## Conflict Resolution

When multiple bundles are loaded and both register the same component tag:

```
Priority (higher wins) > Last loaded (if equal priority)
data-bundle attribute on element (always overrides both)
```

```html
<!-- retro loaded at priority 10, kawaii at priority 10 -->
<!-- kawaii was loaded last → kawaii wins for all <audio-player> -->

<!-- Unless: -->
<audio-player data-bundle="retro" src="track.mp3">
<!-- Forces retro implementation for this specific element -->
```

The registry logs a warning to the console when two equal-priority registrations conflict, identifying both bundle names.

---

## Graceful Degradation

Three layers of graceful degradation, all required:

**Layer 1 — No JS**

The component's light DOM slot content renders. A `<audio controls>` element plays audio with native browser UI. The page works.

**Layer 2 — Reduced motion**

`static reducedMotionFallback(el)` is called by the registry. The component must:
- Cancel any `requestAnimationFrame` loops
- Cancel any CSS transitions that create motion
- Still show a readable static state (e.g., oscilloscope shows a flat line, not a blank canvas)

For CSS-only effects, `@media (prefers-reduced-motion: reduce)` handles this directly in the stylesheet. The `:root[data-motion-reduced]` selector provides the same gate for JS-toggled preference.

**Layer 3 — No CSS**

Structural HTML in the shadow DOM should be readable. Labels, buttons, and controls must be identifiable from their accessible names alone — `aria-label` on every button, `<label>` for every input.

---

## First-Party Bundles

| Bundle | Aesthetic | Theme | Effects | Components |
|---|---|---|---|---|
| **retro** | CRT, 80s terminal, Winamp | Phosphor green / amber, sharp corners, VT323 mono | `data-scanlines`, `data-phosphor`, `data-static`, `data-flipboard`, `data-slot-machine` | `audio-player`, `led-counter`, `crt-terminal`, `vumeter` |
| **kawaii** | Cute, bubbly, pastel | Pink / lavender, pill radius, rounded sans | `data-sparkle`, `data-bubble`, `data-bounce`, `data-float` | `audio-player`, `pet-cursor`, `star-burst` |
| **brutalist** | Raw, aggressive, editorial | High contrast, zero radius, heavy weight | `data-stencil`, `data-overprint`, `data-redact` | `typeout-block`, `manifesto` |
| **sci-fi** | HUD, holographic, terminal | Electric blue, dark surface, scan artifacts | `data-scan`, `data-hologram`, `data-hud-line` | `audio-player`, `hud-display`, `scan-panel` |
| **editorial** | Magazine, print | Serif, generous white space, subtle | `data-drop-cap` (promoted), `data-runaround` | `pull-quote`, `counter-up` |

---

## Third-Party Bundle Guide

A third-party bundle follows the exact same file structure and APIs. The only difference is the import path for `registerEffect` and `registerComponent`.

```
my-bundle/
├── my-bundle.theme.css
├── my-bundle.effects.css
├── my-bundle.effects.js
├── my-bundle.components.js
├── my-bundle.bundle.js
└── components/
    └── audio-player/
        ├── audio-player.js        ← implements the audio-player contract
        └── audio-player.contract.md
```

**Entry point for consumers:**
```html
<link rel="stylesheet" href="my-bundle/my-bundle.full.css">
<script type="module" src="my-bundle/my-bundle.full.js"></script>
```

**Priority recommendation:** Third-party bundles should use `priority: 20` or higher so they can override first-party implementations when loaded alongside them.

**Contract compliance:** If your bundle provides an `audio-player`, it must implement the `audio-player` contract exactly — same attributes, same events, same parts. Additional parts and tokens are allowed. Removing required ones is a breaking change.

**Naming your effects:** Use a vendor prefix to avoid collisions with first-party effects.

```js
// ✓ namespaced
registerEffect('my-bundle/sparkle', {
  selector: '[data-my-sparkle]',
  …
})

// ✗ risky — 'sparkle' might be claimed by kawaii bundle
registerEffect('sparkle', {…})
```

---

## Validation Checklist

Run against every file before publishing.

### Theme file
- [ ] Only `@layer bundle-theme` — no other layers declared
- [ ] Only `:root[data-theme]` and `[data-theme]` selectors
- [ ] No hardcoded colours — only OKLCH with system token fallbacks
- [ ] Both light and dark overrides if the theme supports both modes

### Effects CSS
- [ ] `@layer bundle-effects` wraps all rules
- [ ] Every effect selector is `[data-*]`, never a class
- [ ] Every colour references `var(--vb-effect-*)` or `var(--color-*)`
- [ ] `@media (prefers-reduced-motion: reduce)` block present
- [ ] `:root[data-motion-reduced]` block present
- [ ] `@media print` strip present

### Effects JS
- [ ] Uses `registerEffect` from core — not bare `querySelectorAll`
- [ ] `init` is idempotent — checks for `*-init` attribute
- [ ] `destroy` fully reverses `init` — no DOM leaks
- [ ] `reducedMotionFallback` defined — shows static final state

### Component JS
- [ ] `static bundle`, `static contract`, `static version` defined
- [ ] `static consumesTokens` lists every system token read
- [ ] `static exposesTokens` lists every `--{tag}-*` prop declared
- [ ] `static reducedMotionFallback` defined
- [ ] All colours in shadow DOM styles reference tokens
- [ ] All `--{tag}-*` props fall back to system tokens
- [ ] All structural regions have `part` attributes
- [ ] Part names are functional not visual
- [ ] All interactive elements have `aria-label` or visible `<label>`
- [ ] All events use `vb:{tag}:{action}` naming
- [ ] All events set `bubbles: true, composed: true`
- [ ] Light DOM fallback renders without JS
- [ ] Registered via `registerComponent` not bare `customElements.define`

### Contract file
- [ ] YAML frontmatter is valid
- [ ] All `consumes-tokens` match what the JS file actually reads
- [ ] All `exposes-tokens` match what the JS file actually declares
- [ ] All `parts` match the shadow DOM `part` attributes
- [ ] All `attributes` match `observedAttributes` in the class
- [ ] All `events` match `dispatchEvent` calls in the class
- [ ] `fallback` describes the light DOM fallback pattern

### Bundle index
- [ ] `css` array lists all CSS files in correct load order
- [ ] `js` array lists all JS files in correct load order
- [ ] `components` array has entry for every registered component
- [ ] `effects` array has entry for every registered effect
- [ ] `tokenOverrides` lists every token the theme overrides