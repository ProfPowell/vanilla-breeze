---
title: CSS Color Modernisation
description: Plan to replace Sass-era color patterns with native CSS relative color syntax and color-mix() across the Vanilla Breeze token and theme system.
date: 2026-03-13
tags:
  - css
  - tokens
  - themes
  - color
  - architecture
status: proposal
---

# CSS Color Modernisation

Native CSS now covers everything Sass color functions once required. This document formalises a plan to exploit `color-mix()` and relative color syntax across the Vanilla Breeze token and theme system — reducing theme file size, simplifying the component color contract, and enabling richer theming from fewer declared values.

## Table of Contents

- [Background and Rationale](#background-and-rationale)
- [Color Function Reference](#color-function-reference)
- [Current State Analysis](#current-state-analysis)
- [Improvement Plan](#improvement-plan)
  - [1. Seed and Derived Token Architecture](#1-seed-and-derived-token-architecture)
  - [2. Collapse Light and Dark Mode Token Duplication](#2-collapse-light-and-dark-mode-token-duplication)
  - [3. Standardise the Component Color Contract](#3-standardise-the-component-color-contract)
  - [4. Eliminate Alpha Pre-computation](#4-eliminate-alpha-pre-computation)
  - [5. Hue-Derived Accent Colors in Themes](#5-hue-derived-accent-colors-in-themes)
  - [6. Register Seed Tokens as @property for Transitions](#6-register-seed-tokens-as-property-for-transitions)
  - [7. Update llm-theme-reference.css](#7-update-llm-theme-referencecss)
- [Implementation Phases](#implementation-phases)
- [Progressive Enhancement and Browser Support](#progressive-enhancement-and-browser-support)
- [Related Documents](#related-documents)

---

## Background and Rationale

The VB color system already uses OKLCH, `light-dark()`, and CSS custom properties — good foundations. The current gap is that every theme still declares a large set of explicit color values, and component states (hover, active, border, ring) are either pre-computed or re-declared per component. This is the pattern Sass color functions were invented to solve.

Two native CSS features, now at baseline support, close that gap entirely:

- **`color-mix(in oklab, ...)`** — perceptual mixing for tints, shades, and state variants, equivalent to Sass `mix()`, `tint()`, and `shade()`
- **Relative color syntax** (`oklch(from var(--x) l c h)`) — derive new colors from an existing token by overriding individual channels, equivalent to Sass `lighten()`, `darken()`, `adjust-hue()`, `saturate()`, `complement()`, and `rgba()`

The key design principle that follows: **themes declare seed tokens; the Core layer derives everything else**. CSS custom properties pierce shadow DOM, so derived tokens are available to web components without re-declaration.

---

## Color Function Reference

This table maps common Sass color operations to their native CSS equivalents for use across VB's token authoring.

| Sass Function | Native CSS Equivalent | Notes |
|---|---|---|
| `rgba($c, 0.4)` | `rgb(from var(--c) r g b / 40%)` | Relative color syntax |
| `lighten($c, 20%)` | `oklch(from var(--c) calc(l + 0.2) c h)` | OKLCH gives more natural results than HSL |
| `darken($c, 20%)` | `oklch(from var(--c) calc(l - 0.2) c h)` | Clamp at 0 to avoid wrapping |
| `tint($c, 20%)` | `color-mix(in oklab, var(--c) 80%, white)` | Mix with white; use `oklab` for perceptual accuracy |
| `shade($c, 20%)` | `color-mix(in oklab, var(--c) 80%, black)` | Mix with black |
| `adjust-hue($c, 40deg)` | `oklch(from var(--c) l c calc(h + 40))` | Hue is in degrees in OKLCH |
| `complement($c)` | `oklch(from var(--c) l c calc(h + 180))` | Opposite on the color wheel |
| `grayscale($c)` | `oklch(from var(--c) l 0 h)` | Set chroma to 0 |
| `saturate($c, 20%)` | `oklch(from var(--c) l calc(c + 0.02) h)` | OKLCH chroma is 0–0.4 range |
| `desaturate($c, 20%)` | `oklch(from var(--c) l calc(c - 0.02) h)` | Clamp at 0 |

> **Color space rule of thumb:** Use **OKLCH** tokens (readable by eye, easy to tweak). Use **OKLab** for mixing (`color-mix`). OKLab blends avoid unexpected hue shifts at the midpoint that sRGB mixing produces.

---

## Current State Analysis

The existing VB color architecture overrides three hue variables per theme:

```css
/* Current pattern — themes today */
:root {
  --hue-primary: 260;
  --hue-secondary: 200;
  --hue-accent: 30;
}
```

Semantic colors are then built from those hues in `colors.css`:

```css
--color-primary: light-dark(
  oklch(45% 0.2 var(--hue-primary)),
  oklch(70% 0.15 var(--hue-primary))
);
```

This is a solid start. The problems this plan addresses:

1. **State variants are not derived** — hover, active, border, and ring states are likely declared as independent values rather than computed from the seed
2. **Alpha variants require pre-computation** — hex+opacity values may be stored as static tokens
3. **Light/dark mode may duplicate token sets** — each mode re-declaring colors rather than shifting a single variable
4. **Component state tokens are inconsistent** — no standardised contract means each component handles its own hover state differently

---

## Improvement Plan

### 1. Seed and Derived Token Architecture

**Goal:** Move all derived color tokens into the Core `tokens` layer. Themes only declare seeds.

The organizing principle is a two-tier token system:

| Tier | Declared by | Examples |
|---|---|---|
| **Seeds** | Each theme file | `--brand`, `--surface`, `--text`, `--accent` |
| **Derived** | Core `tokens` layer | hover, active, border, ring, subtle, alpha variants |

**Recommended seed token set per theme:**

```css
/* Theme file — seeds only */
[data-theme="ocean"] {
  --brand:   oklch(58% 0.19 220);
  --surface: oklch(16% 0.02 220);
  --text:    oklch(95% 0.01 220);
  --accent:  oklch(72% 0.17 170);
}
```

**Core layer derives the rest:**

```css
/* src/tokens/colors.css — @layer tokens */
:root {
  /* Interactive states — derived from brand seed */
  --brand-subtle:    color-mix(in oklab, var(--brand), var(--surface) 85%);
  --brand-hover:     color-mix(in oklab, var(--brand), black 10%);
  --brand-active:    color-mix(in oklab, var(--brand), black 20%);
  --brand-border:    color-mix(in oklab, var(--brand), black 30%);
  --brand-ring:      rgb(from var(--brand) r g b / 30%);

  /* Surface and text scales */
  --surface-raised:  color-mix(in oklab, var(--surface), white 6%);
  --surface-overlay: color-mix(in oklab, var(--surface), white 12%);
  --text-muted:      color-mix(in oklab, var(--text), var(--surface) 40%);
  --text-faint:      color-mix(in oklab, var(--text), var(--surface) 65%);
  --border:          color-mix(in oklab, var(--surface), var(--text) 15%);
  --border-strong:   color-mix(in oklab, var(--surface), var(--text) 30%);
}
```

This means refactoring a theme is a 4-line change instead of a 40-line change.

---

### 2. Collapse Light and Dark Mode Token Duplication

**Goal:** A single seed per mode rather than two complete token sets.

The current `light-dark()` pattern in VB already handles switching, but it may be declaring every color twice. With relative color syntax, light and dark can shift the same seed:

```css
/* In Core layer — not in theme files */
[data-mode="light"] {
  --surface: color-mix(in oklab, var(--brand), white 94%);
  --text:    color-mix(in oklab, var(--brand), black 82%);
  --border:  color-mix(in oklab, var(--brand), black 22%);
}

[data-mode="dark"] {
  --surface: color-mix(in oklab, var(--brand), black 88%);
  --text:    color-mix(in oklab, var(--brand), white 88%);
  --border:  color-mix(in oklab, var(--brand), white 20%);
}
```

Themes that need a genuinely distinct dark palette (e.g. Super2026 with its neon-on-black treatment) can still override `--surface` and `--text` directly. This is opt-in differentiation, not the default burden.

---

### 3. Standardise the Component Color Contract

**Goal:** Every component accepts a `--component-color` seed and derives all states from it. No per-variant hover tokens.

Establish this as a VB component authoring rule in `BUNDLE-SYSTEM.md`:

```css
/* Component authoring pattern */
.btn {
  /* Accept an override; fall back to brand */
  --_color:  var(--btn-color, var(--brand));

  /* Derive all states — never declare these externally */
  --_hover:  color-mix(in oklab, var(--_color), black 10%);
  --_active: color-mix(in oklab, var(--_color), black 20%);
  --_ring:   rgb(from var(--_color) r g b / 30%);
  --_border: color-mix(in oklab, var(--_color), black 28%);
  --_subtle: color-mix(in oklab, var(--_color), var(--surface) 88%);

  background: var(--_color);
  border-color: var(--_border);
}

.btn:hover  { background: var(--_hover);  }
.btn:active { background: var(--_active); }

.btn:focus-visible {
  box-shadow: 0 0 0 0.25rem var(--_ring);
}

/* Variant — just change the seed */
.btn[data-variant="danger"]   { --btn-color: var(--error); }
.btn[data-variant="success"]  { --btn-color: var(--success); }
.btn[data-variant="subtle"] {
  background: var(--_subtle);
  color: color-mix(in oklab, var(--_color), black 45%);
}
```

All state rendering flows from one variable. Theming a component is one line. The `--_` private property convention (double-hyphen, underscore) signals that these are internal to the component and not part of the public API.

---

### 4. Eliminate Alpha Pre-computation

**Goal:** Remove any statically computed hex+opacity alpha tokens from the token files.

Replace patterns like:

```css
/* Before — requires pre-computation or Sass */
--color-primary-10: #6b6af71a;
--color-primary-20: #6b6af733;
```

With on-demand relative color syntax:

```css
/* After — computed at runtime, always in sync with the seed */
--brand-alpha-10: rgb(from var(--brand) r g b / 10%);
--brand-alpha-20: rgb(from var(--brand) r g b / 20%);
--brand-alpha-30: rgb(from var(--brand) r g b / 30%);
```

These stay permanently in sync with the seed. When a theme changes `--brand`, the alpha variants update automatically with no cascade of hex values to maintain.

For components that need ad-hoc alpha, the pattern can be used inline:

```css
.overlay {
  background: rgb(from var(--surface) r g b / 80%);
}
```

---

### 5. Hue-Derived Accent Colors in Themes

**Goal:** Give themes a generative color scheme option — harmonious accents from a single brand hue.

This is especially compelling for the **extended theme tier**, where a user provides one brand color and gets a coherent palette:

```css
/* Theme declares one seed; harmonics derive automatically */
[data-theme="brand-custom"] {
  --brand: oklch(62% 0.19 26);
}

/* Core layer or theme extension adds harmonics */
:root {
  --brand-complement: oklch(from var(--brand) l c calc(h + 180));
  --brand-triad-a:    oklch(from var(--brand) l c calc(h + 120));
  --brand-triad-b:    oklch(from var(--brand) l c calc(h + 240));
  --brand-analog-a:   oklch(from var(--brand) l c calc(h + 30));
  --brand-analog-b:   oklch(from var(--brand) l c calc(h - 30));
}
```

These derived harmonics can feed the `--accent` seed so the full theme palette cascades from one value. The `theme-picker` web component could expose this as a colour wheel input.

---

### 6. Register Seed Tokens as `@property` for Transitions

**Goal:** Enable smooth theme-switch transitions without extra JavaScript.

When seed tokens are registered as typed `<color>` properties, browsers can interpolate between values during theme transitions. ThemeManager's dynamic loading already provides the switching mechanism — this makes it visually smooth for free:

```css
@property --brand {
  syntax: '<color>';
  inherits: true;
  initial-value: oklch(50% 0.1 260);
}

@property --surface {
  syntax: '<color>';
  inherits: true;
  initial-value: oklch(14% 0.02 260);
}

@property --text {
  syntax: '<color>';
  inherits: true;
  initial-value: oklch(96% 0.01 260);
}

@property --accent {
  syntax: '<color>';
  inherits: true;
  initial-value: oklch(72% 0.18 30);
}

/* Theme transition */
:root {
  transition: --brand 300ms ease, --surface 300ms ease, --text 300ms ease;
}
```

All derived tokens cascade from the seeds, so the entire palette animates from those four transitions. This pairs naturally with `prefers-reduced-motion` — set durations to `0ms` in the existing motion token block.

---

### 7. Update `llm-theme-reference.css`

**Goal:** Ensure AI-assisted theme authoring understands the seed/derived contract and does not generate static hex alpha variants or per-state colors.

The `llm-theme-reference.css` file should be updated to:

1. **Document which tokens are seeds** (declare in theme) vs. **derived** (auto-computed in Core)
2. **Include the color function reference table** as a CSS comment block
3. **Show a minimal theme template** that only declares seeds
4. **Explicitly warn against** pre-computing hover/active/alpha variants

```css
/*
 * VANILLA BREEZE — THEME AUTHORING REFERENCE
 *
 * SEEDS (declare these in your theme):
 *   --brand    - Primary brand color in OKLCH
 *   --surface  - Background/surface color
 *   --text     - Primary text color
 *   --accent   - Secondary accent color (optional; derives from --brand if omitted)
 *
 * DERIVED (do not declare these — they compute from seeds automatically):
 *   --brand-hover, --brand-active, --brand-subtle, --brand-border, --brand-ring
 *   --surface-raised, --surface-overlay
 *   --text-muted, --text-faint
 *   --border, --border-strong
 *   --brand-alpha-10/20/30
 *   --brand-complement, --brand-triad-*, --brand-analog-*
 *
 * COLOR MIXING REFERENCE:
 *   Tint (add white): color-mix(in oklab, var(--token), white 20%)
 *   Shade (add black): color-mix(in oklab, var(--token), black 20%)
 *   Alpha: rgb(from var(--token) r g b / 30%)
 *   Lighten: oklch(from var(--token) calc(l + 0.1) c h)
 *   Darken: oklch(from var(--token) calc(l - 0.1) c h)
 *   Complement: oklch(from var(--token) l c calc(h + 180))
 */
```

---

## Implementation Phases

These phases align with the existing five-phase CSS layer refactor roadmap.

| Phase | Work | Priority |
|---|---|---|
| **1 — Foundation** | Add derived token block to Core `tokens` layer. No theme changes yet. | High |
| **2 — Seed migration** | Migrate `ocean`, `forest`, `sunset` themes to seed-only declarations. Remove redundant state tokens. | High |
| **3 — Component contract** | Refactor `button`, `input`, and interactive components to the `--component-color` derivation pattern. Update `BUNDLE-SYSTEM.md`. | Medium |
| **4 — Alpha cleanup** | Audit and remove pre-computed hex alpha tokens. Replace with `rgb(from ...)` inline or as derived tokens. | Medium |
| **5 — `@property` + transitions** | Register seed tokens. Add transition block behind `prefers-reduced-motion` guard. Update ThemeManager if needed. | Low |
| **6 — LLM reference** | Update `llm-theme-reference.css` and authoring docs. | Low |
| **7 — Extended themes** | Apply generative harmonic pattern to extended theme tier. Consider `theme-picker` colour wheel input. | Future |

---

## Progressive Enhancement and Browser Support

Both `color-mix()` and relative color syntax are at **Baseline 2024** — available in all modern browsers. For any surface that must support legacy browsers, wrap enhancements in `@supports`:

```css
/* Static fallback — works everywhere */
.badge {
  background: oklch(62% 0.19 26);
  color: white;
}

/* Enhancement — derived colors for modern browsers */
@supports (color: color-mix(in oklab, red, white)) {
  .badge {
    background: color-mix(in oklab, var(--brand), white 15%);
    color: color-mix(in oklab, var(--brand), black 55%);
  }
}
```

Given VB's zero-dependency, platform-native philosophy, `@supports` fallbacks are preferable to a polyfill. In practice, if the seed token system is established before derived tokens exist, static OKLCH values as fallbacks are trivially maintainable — they are just the seed values themselves.

---

## Related Documents

- [BUNDLE-SYSTEM.md](./BUNDLE-SYSTEM.md) — component authoring rules and color layer contracts
- [llm-theme-reference.css](./llm-theme-reference.css) — theme authoring reference for AI-assisted development
- [CSS Layer Architecture](./CSS-LAYER-ARCHITECTURE.md) — four-layer system and refactor roadmap
- [Theme System Refactor](./THEME-SYSTEM-REFACTOR.md) — ThemeManager, manifest.json, and tier migration