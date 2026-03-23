---
title: Variable Font & Icon System
description: Specification for integrating variable fonts and an animated icon system into Vanilla Breeze
author: Thomas Powell
date: 2025-03-09
tags:
  - vanilla-breeze
  - typography
  - variable-fonts
  - icons
  - specification
status: draft
---

# Variable Font & Icon System

Specification for integrating a curated variable font stack and a responsive icon system
into Vanilla Breeze as opt-in bundles. This document covers font selection rationale,
CSS architecture, loading strategy, icon system design, and the *attractor icon* concept —
icons that pulse, breathe, and respond to context with minimal authoring effort.

## Table of Contents

- [Goals](#goals)
- [Font Bundle Architecture](#font-bundle-architecture)
- [Foundation Fonts](#foundation-fonts)
- [Display Fonts](#display-fonts)
- [Expressive Fonts](#expressive-fonts)
- [CSS Token System](#css-token-system)
- [Font Loading Strategy](#font-loading-strategy)
- [Icon System](#icon-system)
- [Attractor Icons](#attractor-icons)
- [SVG Icon Alternative](#svg-icon-alternative)
- [Implementation Plan](#implementation-plan)
- [Open Questions](#open-questions)

---

## Goals

1. **Opt-in, not opt-out.** Zero font weight added unless bundles are explicitly loaded.
2. **One file per role.** Variable fonts eliminate the multi-weight loading problem.
3. **Axis-aware tokens.** CSS custom properties expose font axes so components compose naturally without per-component overrides.
4. **Icons that track text.** Icon weight, fill, and optical size should follow the surrounding type weight automatically — no separate icon CSS needed.
5. **Attractor affordance.** A small, composable CSS + JS layer makes icons pulse, draw attention, and respond to state with almost no authoring cost.

---

## Font Bundle Architecture

Vanilla Breeze uses a layered bundle approach. Each bundle is an independent `@layer` and a separate file reference. Authors include only what they need.

```
vb-fonts-foundation.css   ← Inter + Literata + Recursive
vb-fonts-display.css      ← Fraunces + Cormorant + Bodoni Moda
vb-fonts-expressive.css   ← Nabla + Honk + Kablammo
vb-icons.css              ← Material Symbols (variable icon font)
vb-icons-svg.css          ← SVG sprite alternative
```

Usage in HTML:

```html
<!-- Always: foundation -->
<link rel="stylesheet" href="/vb/vb-fonts-foundation.css">

<!-- Optional: display serifs for editorial content -->
<link rel="stylesheet" href="/vb/vb-fonts-display.css">

<!-- Optional: icons -->
<link rel="stylesheet" href="/vb/vb-icons.css">
```

Bundles are independent. Including `vb-fonts-display.css` without foundation is valid.
Each bundle defines its own tokens under `@layer vb.fonts.*`.

---

## Foundation Fonts

These three fonts cover every functional role in a UI or content site.

### Inter — UI & Interface

**Source:** [rsms/inter](https://rsms.me/inter/) · OFL License

| Axis | Range | CSS Property |
|------|-------|-------------|
| `wght` | 100–900 | `font-weight` |
| `opsz` | 14–32 | `font-optical-sizing` |
| `slnt` | −10–0 | `font-style: oblique Xdeg` |

**Why Inter:** Designed for screen rendering, not adaptation from print. The `opsz` axis
matters — caption text at `opsz 14` has slightly wider proportions and increased spacing
vs display text at `opsz 32`. This is the correct behaviour, not cosmetic. Inter v4+
fixed historical kern issues at small sizes.

**Key OpenType features:**
- `ss01`–`ss04` — disambiguation alternates (`l`/`1`/`I`, `0`/`O`)
- `zero` — slashed zero (enable for code/data contexts)
- `tnum` — tabular numerals (enable for any numeric table)
- `calt` — contextual alternates (on by default)

**Token assignment:** `--vb-font-sans`, `--vb-font-ui`

---

### Literata — Editorial & Long-form

**Source:** [googlefonts/literata](https://github.com/googlefonts/literata) · OFL License

| Axis | Range | CSS Property |
|------|-------|-------------|
| `wght` | 200–900 | `font-weight` |
| `opsz` | 7–72 | `font-optical-sizing` |
| `ital` | 0–1 | `font-style` |

**Why Literata:** Commissioned by Google Books for long-form reading. The `opsz` range
is unusually wide (7 to 72), meaning one file genuinely covers footnote size through
display pull-quote. Has real `onum` (oldstyle figures), real `smcp` (small caps —
actual redrawn glyphs, not scaled caps), and `dlig` discretionary ligatures. This is
the best OpenType story of any variable serif available on Google Fonts.

**Key OpenType features:**
- `onum` — oldstyle numerals (enable for body prose)
- `smcp` — small caps (use `font-variant-caps: small-caps`, not `font-feature-settings`)
- `liga`, `dlig` — standard and discretionary ligatures
- `kern` — kerning (always on)

**Token assignment:** `--vb-font-serif`, `--vb-font-body` (when editorial theme active)

---

### Recursive — Code & Casual UI

**Source:** [arrowtype/recursive](https://www.recursive.design/) · OFL License

| Axis | Range | Notes |
|------|-------|-------|
| `wght` | 300–1000 | Weight |
| `MONO` | 0–1 | **0 = proportional sans, 1 = monospace** |
| `CASL` | 0–1 | Casual/informal strokes |
| `slnt` | −30–0 | Slant (functional italic) |

**Why Recursive:** The `MONO` axis is architecturally interesting — a single font file
covers both casual sans-serif UI labels and monospace code. `CASL` at high values gives
a handwritten warmth useful for annotations, callouts, or playful contexts. Setting
`MONO 0, CASL 0` produces a clean sans; `MONO 1` produces a code font. This makes
Recursive a legitimate candidate for contexts where two separate font roles are needed
but only one file load is acceptable.

**Token assignment:** `--vb-font-mono`, `--vb-font-code`

---

## Display Fonts

Loaded via `vb-fonts-display.css` for editorial, marketing, or publication contexts.

### Fraunces — Display Serif with Character Axes

**Source:** [undercasetype/fraunces](https://github.com/undercasetype/fraunces) · OFL License

| Axis | Range | Notes |
|------|-------|-------|
| `wght` | 100–900 | Weight |
| `opsz` | 9–144 | Optical size |
| `WONK` | 0–1 | Glyph irregularity — the unique axis |
| `SOFT` | 0–100 | Stroke terminus softness |

`WONK 0` is crisp, refined, controlled. `WONK 1` introduces deliberate irregularity
evoking hand-press type from the late 1800s. This makes Fraunces unusual — it has a
*mood axis*, not just a weight axis. Useful for section headers where warmth vs formality
needs to be tuned to context without swapping fonts.

**Token assignment:** `--vb-font-display`

---

### Cormorant — Garamond-lineage with Full OpenType Suite

**Source:** [CatharsisFonts/Cormorant](https://github.com/CatharsisFonts/Cormorant) · OFL License

| Axis | Range |
|------|-------|
| `wght` | 300–700 |
| `ital` | 0–1 |

Cormorant's variable axis range is narrow, but its OpenType feature set is the deepest
of any font in this stack:

- `swsh` — swash alternates (display/pull-quote use)
- `hist` — historical ligatures (`ſ`, `ct`, `st`)
- `smcp` — real small caps
- `dlig` — discretionary ligatures
- `calt` — contextual alternates

Use Cormorant for drop caps, pull quotes, section openers, and anywhere the text needs
to *feel* typeset rather than just set. Do not use at body size — it is fragile below
`1.5rem`.

**Token assignment:** `--vb-font-editorial`

---

### Bodoni Moda — Dramatic Optical Contrast

**Source:** Google Fonts · OFL License

| Axis | Range |
|------|-------|
| `wght` | 400–900 |
| `opsz` | 6–96 |
| `ital` | 0–1 |

The `opsz` range here is dramatic enough that `opsz 6` and `opsz 96` look like
different typefaces. High stroke contrast makes this unforgiving — bad rendering
or wrong weight for the context reads as broken. Use with intent.

**Token assignment:** `--vb-font-dramatic`

---

## Expressive Fonts

Loaded via `vb-fonts-expressive.css`. Not appropriate for body text; targeted at
hero sections, marketing, CMS block types, and the icon-adjacent creative layer.

### Nabla — COLR v1 Color Font

**Source:** Google Fonts · OFL License · COLR v1

| Axis | Range | Effect |
|------|-------|--------|
| `EDPT` | 0–200 | 3D extrusion depth |
| `FLAT` | 0–100 | Flattens the 3D perspective |

Nabla is a color font using the COLR v1 format, which means the browser composites
multiple color layers natively — no SVG, no image, no JS. The `EDPT` axis is
animatable with CSS `@property` or a simple transition, creating a depth-breathing
effect from a single font declaration.

```css
@property --nabla-depth {
  syntax: '<number>';
  inherits: false;
  initial-value: 100;
}

.hero-title {
  font-family: 'Nabla', cursive;
  font-variation-settings: 'EDPT' var(--nabla-depth), 'FLAT' 0;
  animation: depth-pulse 3s ease-in-out infinite;
}

@keyframes depth-pulse {
  0%, 100% { --nabla-depth: 80; }
  50%       { --nabla-depth: 140; }
}
```

**Token assignment:** `--vb-font-nabla`

---

### Honk & Kablammo — Morphology Fonts

Both use `MORF` as their primary expressive axis.

- **Honk** (`MORF −40–40`, `SHLN 0–50`) — inflatable, rounded, neon-adjacent
- **Kablammo** (`MORF −40–40`) — comic, impact, high-energy

These are single-purpose display fonts. Their value in a framework context is primarily
in the attractor icon system (see below) and in CMS block type palettes where authors
need to signal tone without custom design work.

---

## CSS Token System

All font bundles write into a shared token namespace under `@layer vb.tokens`.

```css
@layer vb.tokens {
  :root {
    /* ── Family assignments ── */
    --vb-font-sans:      'Inter', system-ui, sans-serif;
    --vb-font-serif:     'Literata', Georgia, serif;
    --vb-font-mono:      'Recursive', 'Cascadia Code', monospace;
    --vb-font-ui:        var(--vb-font-sans);
    --vb-font-body:      var(--vb-font-serif);
    --vb-font-code:      var(--vb-font-mono);
    --vb-font-display:   'Fraunces', var(--vb-font-serif);
    --vb-font-editorial: 'Cormorant', var(--vb-font-serif);
    --vb-font-dramatic:  'Bodoni Moda', var(--vb-font-serif);

    /* ── Axis defaults ── */
    --vb-font-weight:    400;
    --vb-font-opsz:      auto;  /* browser infers from font-size */

    /* ── Derived fvs helpers (compose, don't override) ── */
    --vb-fvs-inter:      'wght' var(--vb-font-weight);
    --vb-fvs-literata:   'wght' var(--vb-font-weight);
    --vb-fvs-recursive:  'wght' var(--vb-font-weight), 'MONO' 1, 'CASL' 0, 'slnt' 0;

    /* ── Icon axis defaults ── */
    --vb-icon-fill:      0;
    --vb-icon-weight:    var(--vb-font-weight);
    --vb-icon-grad:      0;
    --vb-icon-opsz:      24;
  }
}
```

Component-level overrides compose on top without breaking cascade:

```css
/* A "heavy" UI context raises both text and icon weight together */
[data-vb-weight="bold"] {
  --vb-font-weight: 700;
  /* Icon weight follows automatically — no extra declaration needed */
}
```

---

## Font Loading Strategy

### Self-hosting vs Google Fonts

For production, self-host via subsetting. For development and prototyping,
Google Fonts is acceptable. The token system is agnostic to source.

### `@font-face` pattern

```css
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-variable.woff2') format('woff2');
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
  /* Indicate variable axes for UA hints */
  font-variation-settings: normal;
}

@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-variable-italic.woff2') format('woff2');
  font-weight: 100 900;
  font-style: italic;
  font-display: swap;
}
```

### Preload hints

Only preload fonts that are render-blocking for above-the-fold content:

```html
<link rel="preload"
      href="/fonts/inter-variable.woff2"
      as="font" type="font/woff2" crossorigin>
```

Do not preload display or expressive fonts — they are below fold by definition.

### Subsetting recommendations

For the foundation bundle, subset to Latin + Latin Extended. Use `pyftsubset` or
the Google Fonts `text=` API for targeted subsets. The variable font format
means subsetting is still worthwhile even with a single file.

---

## Icon System

### Material Symbols as the default

Material Symbols Outlined is a variable icon font with four axes:

| Axis | Range | Effect |
|------|-------|--------|
| `FILL` | 0–1 | Outline → filled |
| `wght` | 100–700 | Stroke weight |
| `GRAD` | −50–200 | Grade (weight without spacing shift) |
| `opsz` | 20–48 | Optical size — stroke weight relative to glyph size |

This is architecturally superior to static SVG icon sets for most use cases:
one font file, one CSS rule set, all icons in the system with consistent behaviour.

### Base icon CSS

```css
@layer vb.icons {
  .vb-icon {
    font-family: 'Material Symbols Outlined';
    font-weight: normal;
    font-style: normal;
    font-size: 1em;          /* Scales with parent text */
    line-height: 1;
    display: inline-block;
    vertical-align: middle;
    user-select: none;
    font-variation-settings:
      'FILL' var(--vb-icon-fill, 0),
      'wght' var(--vb-icon-weight, 400),
      'GRAD' var(--vb-icon-grad, 0),
      'opsz' var(--vb-icon-opsz, 24);
    transition: font-variation-settings 0.2s ease;
  }

  /* Icon inherits button/heading weight automatically */
  h1 .vb-icon, h2 .vb-icon { --vb-icon-weight: 600; --vb-icon-opsz: 48; }
  h3 .vb-icon, h4 .vb-icon { --vb-icon-weight: 500; --vb-icon-opsz: 40; }
  button .vb-icon           { --vb-icon-weight: var(--vb-font-weight, 400); }
  small .vb-icon, caption .vb-icon { --vb-icon-opsz: 20; }
}
```

### HTML usage

```html
<!-- Inline with text — inherits size and weight -->
<p>Upload your files <span class="vb-icon">upload</span> to get started.</p>

<!-- Button icon — fill transitions on hover via data attribute -->
<button data-vb-icon-fill="hover">
  <span class="vb-icon">favorite</span> Save
</button>

<!-- Standalone large icon -->
<span class="vb-icon" style="font-size: 3rem; --vb-icon-opsz: 48;">
  notifications
</span>
```

---

## Attractor Icons

An *attractor icon* draws the user's attention through motion or visual state change.
The goal is maximum effect from minimum CSS — no JS required for the core cases,
JS-enhanced for intelligence-driven attractors.

### Design principles

1. **Motion should be meaningful.** Pulse = "something happened here". Breathe = "this is interactive but not urgent". Bounce = "new/unread". Wiggle = "error/warning".
2. **Never loop indefinitely by default.** Use `animation-iteration-count: 3` or `animation-play-state` tied to state. Infinite loops are noise.
3. **Respect `prefers-reduced-motion`.** All attractor animations wrap in a media query guard.
4. **Use `@property` for axis animation.** CSS-native number interpolation via registered properties gives smooth transitions that `font-variation-settings` string interpolation cannot.

### Registered axis properties

```css
@layer vb.icons.attractor {
  @property --vb-icon-fill-anim {
    syntax: '<number>';
    inherits: false;
    initial-value: 0;
  }

  @property --vb-icon-weight-anim {
    syntax: '<number>';
    inherits: false;
    initial-value: 400;
  }
}
```

### Attractor patterns via `data-vb-attract`

```html
<!-- Pulse: fill breathes 0 → 1 → 0 -->
<span class="vb-icon" data-vb-attract="pulse">notifications</span>

<!-- Beat: weight pulses like a heartbeat -->
<span class="vb-icon" data-vb-attract="beat">favorite</span>

<!-- Bounce: vertical nudge, 3 times -->
<span class="vb-icon" data-vb-attract="bounce">arrow_downward</span>

<!-- Wiggle: rotation ±15deg, suggests error/warning -->
<span class="vb-icon" data-vb-attract="wiggle">warning</span>

<!-- Breathe: slow, continuous fill oscillation — "active/live" signal -->
<span class="vb-icon" data-vb-attract="breathe">mic</span>
```

### CSS implementation

```css
@layer vb.icons.attractor {

  /* ── pulse: fill 0 → 1 → 0, weight bump ── */
  @keyframes vb-icon-pulse {
    0%   { --vb-icon-fill-anim: 0;   --vb-icon-weight-anim: 400; }
    40%  { --vb-icon-fill-anim: 1;   --vb-icon-weight-anim: 600; }
    60%  { --vb-icon-fill-anim: 1;   --vb-icon-weight-anim: 600; }
    100% { --vb-icon-fill-anim: 0;   --vb-icon-weight-anim: 400; }
  }

  /* ── beat: weight surges like a heartbeat ── */
  @keyframes vb-icon-beat {
    0%   { --vb-icon-weight-anim: 400; transform: scale(1); }
    14%  { --vb-icon-weight-anim: 700; transform: scale(1.2); }
    28%  { --vb-icon-weight-anim: 400; transform: scale(1); }
    42%  { --vb-icon-weight-anim: 600; transform: scale(1.1); }
    70%  { --vb-icon-weight-anim: 400; transform: scale(1); }
    100% { --vb-icon-weight-anim: 400; transform: scale(1); }
  }

  /* ── breathe: slow fill oscillation ── */
  @keyframes vb-icon-breathe {
    0%, 100% { --vb-icon-fill-anim: 0.1; }
    50%       { --vb-icon-fill-anim: 0.9; }
  }

  /* ── bounce ── */
  @keyframes vb-icon-bounce {
    0%, 100% { transform: translateY(0); }
    40%       { transform: translateY(-30%); }
    60%       { transform: translateY(-15%); }
  }

  /* ── wiggle ── */
  @keyframes vb-icon-wiggle {
    0%, 100% { transform: rotate(0deg); }
    20%       { transform: rotate(-12deg); }
    40%       { transform: rotate(10deg); }
    60%       { transform: rotate(-8deg); }
    80%       { transform: rotate(5deg); }
  }

  /* ── Apply animated properties to fvs ── */
  [data-vb-attract] {
    font-variation-settings:
      'FILL' var(--vb-icon-fill-anim),
      'wght' var(--vb-icon-weight-anim),
      'GRAD' var(--vb-icon-grad, 0),
      'opsz' var(--vb-icon-opsz, 24);
  }

  [data-vb-attract="pulse"]   { animation: vb-icon-pulse   0.8s ease-in-out 3; }
  [data-vb-attract="beat"]    { animation: vb-icon-beat     0.8s ease-in-out 3; }
  [data-vb-attract="breathe"] { animation: vb-icon-breathe  2.5s ease-in-out infinite; }
  [data-vb-attract="bounce"]  { animation: vb-icon-bounce   0.6s ease         3; }
  [data-vb-attract="wiggle"]  { animation: vb-icon-wiggle   0.5s ease         3; }

  /* Respect motion preference */
  @media (prefers-reduced-motion: reduce) {
    [data-vb-attract] { animation: none; }

    /* Static fallback: just fill the icon */
    [data-vb-attract="pulse"],
    [data-vb-attract="beat"],
    [data-vb-attract="breathe"] {
      --vb-icon-fill-anim: 1;
    }
  }
}
```

### JS-enhanced attractor intelligence

The pure CSS layer handles static declaration. The JS layer adds:

- **Trigger on event** — add `data-vb-attract` on notification receipt, form error, state change
- **Remove after completion** — clean up so icons don't replay on re-render
- **Whimsy mode** — random attractor type selection from a weighted set

```javascript
// vb-icons-attractor.js
const ATTRACT_TYPES = ['pulse', 'beat', 'bounce', 'wiggle', 'breathe'];

// Weighted random — pulse and beat most common, wiggle rare
const WEIGHTS = [35, 30, 20, 5, 10];

function attract(iconEl, type = 'pulse') {
  iconEl.dataset.vbAttract = type;

  // Clean up after animation ends so it can retrigger
  iconEl.addEventListener('animationend', () => {
    delete iconEl.dataset.vbAttract;
  }, { once: true });
}

function attractRandom(iconEl) {
  const type = weightedRandom(ATTRACT_TYPES, WEIGHTS);
  attract(iconEl, type);
}

// Notification badge: pulse the bell icon
function notifyIcon(selector) {
  const el = document.querySelector(selector);
  if (el) attract(el, 'pulse');
}

// Form error: wiggle the field icon
function errorIcon(selector) {
  const el = document.querySelector(selector);
  if (el) attract(el, 'wiggle');
}

// Whimsy: on a long idle, pick a random visible icon and nudge it
function enableWhimsy(idleMs = 45000) {
  let timer;
  const reset = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const icons = [...document.querySelectorAll('.vb-icon:not([data-vb-attract])')];
      if (icons.length) {
        const target = icons[Math.floor(Math.random() * icons.length)];
        attractRandom(target);
      }
    }, idleMs);
  };

  ['mousemove', 'keydown', 'scroll', 'touchstart'].forEach(e =>
    document.addEventListener(e, reset, { passive: true })
  );
  reset();
}

function weightedRandom(items, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

export { attract, attractRandom, notifyIcon, errorIcon, enableWhimsy };
```

### Semantic attractor mapping (proposed `data-vb-attract-on`)

A declarative API that removes the need to write any JS for common cases:

```html
<!-- Attract when element enters viewport -->
<span class="vb-icon" data-vb-attract="pulse" data-vb-attract-on="visible">
  star
</span>

<!-- Attract when sibling input has error -->
<span class="vb-icon" data-vb-attract="wiggle" data-vb-attract-on="error">
  error
</span>

<!-- Attract when counter increments (watches aria-label or data-count) -->
<span class="vb-icon" data-vb-attract="beat" data-vb-attract-on="increment">
  notifications
</span>
```

The `vb-icons-attractor.js` module uses `IntersectionObserver`, `MutationObserver`,
and attribute watchers to implement these without any per-component event wiring.

---

## SVG Icon Alternative

For projects that need icons not covered by Material Symbols, or that require
custom brand icons, `vb-icons-svg.css` provides a parallel interface using the
same `data-vb-attract` system.

SVG icons are delivered as a `<symbol>` sprite. The attractor animations run on the
`<svg>` element itself using the same `@keyframes` — minus the `font-variation-settings`
fill axis, which doesn't apply. The fill transition uses CSS `fill` property instead:

```css
@keyframes vb-svg-pulse {
  0%, 100% { fill: currentColor; transform: scale(1); }
  50%       { fill: var(--vb-icon-accent, currentColor); transform: scale(1.15); }
}

[data-vb-attract="pulse"] svg,
[data-vb-attract="pulse"] use {
  animation: vb-svg-pulse 0.8s ease-in-out 3;
}
```

The HTML pattern is identical, using a `<svg><use>` inside a wrapper:

```html
<span class="vb-icon" data-vb-attract="bounce">
  <svg aria-hidden="true" focusable="false">
    <use href="/icons/sprite.svg#arrow-down"></use>
  </svg>
</span>
```

This means attractor behaviour is icon-system-agnostic. The same `data-vb-attract`
API works whether the icon is a font glyph or an SVG symbol.

---

## Implementation Plan

### Phase 1 — Foundation bundle

- [ ] Set up `@font-face` declarations for Inter, Literata, Recursive
- [ ] Define token namespace in `@layer vb.tokens`
- [ ] Write `vb-fonts-foundation.css`
- [ ] Add OpenType utility classes: `.vb-tabular`, `.vb-oldstyle`, `.vb-small-caps`, `.vb-fractions`
- [ ] Test FOUT behaviour with `font-display: swap` vs `optional`

### Phase 2 — Icon system base

- [ ] Write `vb-icons.css` with Material Symbols `@font-face` and `.vb-icon` base class
- [ ] Implement context-aware weight/opsz inheritance via cascade
- [ ] Validate that icon weight tracks heading weight automatically
- [ ] Write `vb-icons-svg.css` parallel implementation

### Phase 3 — Attractor system

- [ ] Register `@property` custom properties for animatable axes
- [ ] Write `vb-icons-attractor.css` with all five attractor types
- [ ] Write `vb-icons-attractor.js` module with event-driven triggers
- [ ] Implement `data-vb-attract-on` declarative API
- [ ] Add `enableWhimsy()` as opt-in
- [ ] Test `prefers-reduced-motion` fallbacks

### Phase 4 — Display and expressive bundles

- [ ] Write `vb-fonts-display.css` (Fraunces, Cormorant, Bodoni Moda)
- [ ] Write `vb-fonts-expressive.css` (Nabla, Honk, Kablammo)
- [ ] Validate COLR v1 rendering (Nabla) across Chrome, Firefox, Safari
- [ ] Write `@property`-based Nabla depth animation helper

### Phase 5 — CMS block type integration (Vanilla Press)

- [ ] Map font tokens to block type schema
- [ ] Expose attractor type as a block property for icon blocks
- [ ] Define which expressive fonts are available as block-level CMS choices
- [ ] Document how to add custom fonts following the bundle pattern

---

## Open Questions

**Self-hosting vs CDN for production**
The spec assumes self-hosting for production. Need to decide on a recommended
subsetting workflow — `pyftsubset`, `glyphhanger`, or a build-time plugin.
Google Fonts is acceptable for the dev/demo tier only.

**Nabla COLR v1 support floor**
COLR v1 requires Chrome 98+, Firefox 107+, Safari 17.2+. Below these versions,
Nabla renders as a flat black outline (COLR v0 fallback). Is that acceptable,
or does Vanilla Breeze need a `@supports` gate?

**`font-display: swap` vs `optional` for foundation fonts**
`swap` gives immediate text rendering with font swap; `optional` avoids FOUT
but may never render the web font on slow connections. Foundation fonts (Inter,
Literata) should probably use `swap`. Icon font should use `optional` with a
fallback that hides glyphs.

**Icon font accessibility**
Material Symbols glyphs are not read by screen readers by default when used in
`aria-hidden` spans. The current pattern uses `aria-hidden="true"` on icon spans
next to visible text, and `aria-label` on standalone icon buttons. Need to
document this consistently and potentially add an accessibility audit pass.

**Whimsy opt-in policy**
`enableWhimsy()` is off by default. Should it be a `data-vb-whimsy` attribute
on `<body>` that the framework observes? Or strictly JS opt-in only?
The declarative option makes it more accessible to CMS authors.

**Weight of the icon font file**
Material Symbols variable font is ~4MB unsubsetted. For production, `unicode-range`
subsetting to used codepoints is essential. Need a build-time icon manifest approach
— either a config file listing used icon names, or static analysis of HTML templates.
