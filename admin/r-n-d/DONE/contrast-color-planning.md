---
title: "contrast-color() Integration Plan for Vanilla Breeze"
description: "Planning document for adopting the native CSS contrast-color() function across the Vanilla Breeze token and theming system."
date: 2026-03-12
tags:
  - accessibility
  - css
  - theming
  - vanilla-breeze
status: draft
---

# `contrast-color()` Integration Plan for Vanilla Breeze

`contrast-color()` is now available in all modern browsers as of Chrome 147, Safari 26, and Firefox 146 (shipping end of March 2026). It takes any CSS `<color>` value and returns whichever of `black` or `white` provides the highest contrast against it, meeting WCAG 2.1 AA minimum (4.5:1). This is a significant opportunity to reduce token complexity and harden accessibility across Vanilla Breeze's entire theming system.

## Table of Contents

- [What It Does](#what-it-does)
- [Browser Support and Progressive Enhancement Strategy](#browser-support-and-progressive-enhancement-strategy)
- [Integration Targets](#integration-targets)
- [Token System Simplification](#token-system-simplification)
- [Theme Implications](#theme-implications)
- [Brand Replicator Impact](#brand-replicator-impact)
- [Component Targets](#component-targets)
- [Alpenglow Gear Demo Opportunities](#alpenglow-gear-demo-opportunities)
- [Limitations and Trade-offs](#limitations-and-trade-offs)
- [Implementation Checklist](#implementation-checklist)
- [References](#references)

---

## What It Does

```css
color: contrast-color(purple);   /* → white */
color: contrast-color(yellow);   /* → black */
color: contrast-color(var(--vb-color-surface)); /* → whichever wins */
```

The browser calculates contrast ratios for both black and white against the input color and returns the higher result. On a tie (perfect mid-gray), it returns `white`.

**Current limitation:** Returns only `black` or `white`. Custom color lists and alternative contrast algorithms (APCA, WCAG 3.0) were removed from the spec to ship faster. This is a real constraint for VB's branded color surfaces.

---

## Browser Support and Progressive Enhancement Strategy

All three major engines ship support in Q1 2026. This aligns well with VB's platform-first philosophy.

**Baseline fallback pattern** using `@supports`:

```css
/* Base layer: explicit foreground token (existing behavior) */
.button {
  color: var(--vb-color-on-brand);
}

/* Enhancement layer: replace with automated contrast */
@supports (color: contrast-color(red)) {
  .button {
    color: contrast-color(var(--vb-color-brand));
  }
}
```

For VB's `@layer` architecture, this enhancement belongs in a dedicated `@layer utilities.accessibility` or as an opt-in modifier. The existing `-on-*` tokens remain authoritative until the feature reaches VB's browser support floor.

---

## Integration Targets

### Priority 1 — Dynamic/Themeable Surfaces

These are highest-impact because the foreground color is currently hard to predict at token-definition time:

| Surface | Current Token | `contrast-color()` Benefit |
|---|---|---|
| `--vb-color-brand` button text | `--vb-color-on-brand` | Auto from brand color |
| `data-theme` brand switcher backgrounds | Explicit per-theme | One rule covers all |
| Brand Replicator extracted tokens | None — user-defined | Critical coverage |
| Alert / badge variants | Per-variant tokens | Simplifies variants |
| `<meter>` / `<progress>` value text | N/A (no text) | Label overlay cases |

### Priority 2 — Dark / High Contrast Themes

The five VB themes (Base, Dark, High Contrast, Compact, Prose) currently maintain separate `--vb-color-on-*` tokens per theme. `contrast-color()` can eliminate the dark/light split for surface-to-text relationships:

```css
/* Before: two tokens, manually kept in sync */
:root { --vb-color-surface: #eee; --vb-color-on-surface: #111; }
[data-theme="dark"] { --vb-color-surface: #1a1a1a; --vb-color-on-surface: #f5f5f5; }

/* After: one token drives both */
:root { --vb-color-surface: #eee; }
[data-theme="dark"] { --vb-color-surface: #1a1a1a; }

body {
  background: var(--vb-color-surface);
  color: contrast-color(var(--vb-color-surface));
}
```

This also reduces errors when a theme author adjusts a background token and forgets its paired foreground.

### Priority 3 — Hover / Interaction States

VB's declarative effects system (`data-*` attribute grammar, `VB` JS API) generates color variations via `color-mix()`. `contrast-color()` composes cleanly here, automatically keeping text readable as backgrounds shift:

```css
[data-effect="lift"]:hover {
  --vb-bg: color-mix(in oklch, var(--vb-color-brand) 60%, white);
  background: var(--vb-bg);
  color: contrast-color(var(--vb-bg));
}
```

---

## Token System Simplification

`contrast-color()` enables a targeted reduction in the `-on-*` token family. Not all `-on-*` tokens can be removed — only those where the foreground is constrained to black or white is acceptable.

**Candidates for retirement (with `@supports` gate):**

- `--vb-color-on-brand`
- `--vb-color-on-surface`
- `--vb-color-on-surface-variant`
- `--vb-color-on-primary`
- `--vb-color-on-secondary`

**Tokens that must remain** (foreground is not black/white):

- `--vb-color-on-error` (white on red is correct but should be declared, not derived)
- Any token where brand guidelines mandate a specific foreground
- Prose theme body text (APCA is better here; defer to explicit tokens)

Introduce a new CSS custom property naming convention to signal automated contrast:

```css
/* Explicit: always honored, never overridden */
--vb-on-brand: white;

/* Automated: computed, overrideable */
--vb-on-brand-auto: contrast-color(var(--vb-color-brand));
```

---

## Theme Implications

### Brand Theme Switcher (Anthropic / McDonald's / IBM)

Each brand's primary color is already extracted as a token. With `contrast-color()`, button and badge text in the switcher demo becomes zero-maintenance:

```css
[data-brand] .vb-button--primary {
  background: var(--vb-brand-primary);
  color: contrast-color(var(--vb-brand-primary));
}
```

Anthropic purple → white, McDonald's yellow → black, IBM blue → white. No per-brand overrides needed.

### High Contrast Theme

The High Contrast theme should **not** use `contrast-color()` as its sole mechanism — the theme needs to enforce specific WCAG AAA ratios and often uses colors beyond black and white. Keep explicit tokens there. `contrast-color()` can supplement it but not replace intentional HC color choices.

---

## Brand Replicator Impact

The Brand Replicator Cloudflare Worker extracts CSS tokens from real brand sites. These extracted colors are inherently unknown at build time — `contrast-color()` is exactly the right tool here. When a user pastes in a brand URL:

1. Worker extracts `--extracted-primary`, `--extracted-surface`, etc.
2. VB renders a preview using `contrast-color(var(--extracted-*))` for all text
3. No manual color mapping needed for legibility

This is arguably the single highest-value use case in the VB ecosystem right now.

---

## Component Targets

The following components are the best near-term targets:

- **Buttons** — all variant backgrounds
- **Badges / Tags** — especially status variants (success, warning, error)
- **Alert / Callout** — colored background with text overlay
- **`<meter>` labels** — when value label overlays the track
- **Chat bubble component** (`shape()` bubbles) — user vs. agent coloring
- **`<vb-consent>`** — branded consent dialog backgrounds
- **Attractor icons** — icon color over animated background fills

---

## Alpenglow Gear Demo Opportunities

- Product badges (sale, new, limited) — color-coded with readable labels automatically
- Category navigation cards with variable background images/colors
- Size/color swatch selectors — text label over swatch
- Cart totals and promotional banners

---

## Limitations and Trade-offs

| Limitation | Impact | Mitigation |
|---|---|---|
| Black or white only | Can't use brand foreground colors | Keep explicit `-on-*` tokens for brand-mandated colors |
| No APCA support | Misses perceptual accuracy for body text | Use for UI chrome, not long-form Prose theme |
| Mid-tone bias | Mid-gray returns white (arbitrary) | Avoid mid-tone surfaces in critical text areas |
| No custom contrast target | Can't request AAA (7:1) specifically | Supplement with explicit High Contrast tokens |

---

## Implementation Checklist

### Phase 1 — Infrastructure

- [ ] Add `@supports (color: contrast-color(red))` detection to VB's feature flag layer
- [ ] Introduce `--vb-on-*-auto` token convention alongside existing `-on-*` tokens
- [ ] Document the explicit vs. automated token contract in VB architecture docs

### Phase 2 — Core Token Reduction

- [ ] Audit all `-on-*` tokens and categorize as black/white safe vs. must-remain
- [ ] Replace eligible `-on-*` usages with `contrast-color()` under `@supports`
- [ ] Update Base and Dark themes first; validate High Contrast theme separately

### Phase 3 — Brand Switcher & Replicator

- [ ] Wire `contrast-color()` into brand switcher demo for all text on brand surfaces
- [ ] Update Brand Replicator output template to use `contrast-color()` for extracted token previews

### Phase 4 — Component Sweep

- [ ] Buttons (all variants)
- [ ] Badges / Tags
- [ ] Alert / Callout
- [ ] Chat bubble component
- [ ] `<vb-consent>` dialog
- [ ] Attractor icon overlays

### Phase 5 — Alpenglow Gear Demo

- [ ] Apply to product badges, category cards, swatches, promotional banners
- [ ] Capture before/after screenshots for migration guide content

### Phase 6 — Migration Guide Content

- [ ] Add `contrast-color()` section to the Tailwind migration guide (Tailwind requires JS for dynamic contrast; VB does it in CSS)
- [ ] Add to Sass migration guide as the native successor to `contrasted()` and custom contrast functions
- [ ] Teaching note for CSE courses: contrast as a CSS concern, not a design tool concern

---

## References

- [CSS Color Level 5 Spec: `contrast-color()`](https://drafts.csswg.org/css-color-5/#contrast-color)
- [MDN: `contrast-color()`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/contrast-color)
- [Una Kravets: Automated Accessible Text with contrast-color()](https://una.im/contrast-color)
- [Chrome Status: contrast-color()](https://chromestatus.com/feature/4841046007742464)
- [WCAG 2.2: Contrast Minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum)
- [APCA Contrast Calculator](https://apcacontrast.com/)
