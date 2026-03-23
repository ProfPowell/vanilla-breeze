---
title: Multi-Axis Section Modifiers — data-flavor & data-accent
description: Spec for adding flavor (decorative treatment) and accent (highlight color) axes to VB's section/component system
date: 2026-03-18
status: draft
source: Stripe layout research (stripe-layout-learnings.md)
tags:
  - architecture
  - theming
  - sections
---

# Multi-Axis Section Modifiers: `data-flavor` & `data-accent`

## Problem

VB currently has one theming axis on sections: `data-mode` (light/dark). Stripe uses three independent axes: theme (light/dark), flavor (decorative background treatment), and accent (highlight color). This allows a footer to be `data-mode="light" data-flavor="gradient" data-accent="teal"` — three orthogonal concerns composed on one element.

## Current State

- `data-mode="light|dark"` — fully implemented, overrides color token cascade
- No `data-flavor` — decorative backgrounds are one-off per-page CSS
- No `data-accent` — accent color is locked to the theme's `--hue-accent` token

## Proposed Design

### `data-accent` (simpler, implement first)

Sets `--color-accent` and related tokens for a scoped region. Useful for multi-brand pages, feature section differentiation, or per-card accent colors.

```html
<section data-mode="dark" data-accent="teal">
  <!-- All accent-colored elements (buttons, links, highlights) use teal -->
</section>

<section data-mode="light" data-accent="indigo">
  <!-- Different accent for this section -->
</section>
```

```css
[data-accent="teal"]   { --hue-accent: 180; --color-accent: oklch(60% 0.15 180); }
[data-accent="indigo"] { --hue-accent: 250; --color-accent: oklch(55% 0.18 250); }
[data-accent="rose"]   { --hue-accent: 350; --color-accent: oklch(60% 0.18 350); }
[data-accent="amber"]  { --hue-accent: 45;  --color-accent: oklch(70% 0.16 45); }
/* ... one per brand color */
```

This is essentially the same as VB's existing color themes (ocean, forest, etc.) but scoped to a single token axis rather than the full theme cascade. Could potentially reuse the same hue values from `COLOR_THEMES` in `theme-data.js`.

**Key question:** Should `data-accent` just override `--hue-accent`, letting the existing OKLCH color generation handle the rest? Or should it set explicit computed colors? The former is more composable; the latter is more predictable.

### `data-flavor` (more complex, implement second)

Controls the decorative `::before` background treatment on a section. The flavor is the visual personality — gradient, solid, textured — independent of light/dark mode.

```html
<section data-mode="dark" data-flavor="gradient">
  <!-- Dark section with gradient background -->
</section>

<section data-mode="light" data-flavor="solid">
  <!-- Light section with flat color -->
</section>

<footer data-mode="dark" data-flavor="transparent">
  <!-- Footer floats over previous section's background -->
</footer>
```

```css
[data-flavor="gradient"]::before {
  background: var(--gradient-brand, linear-gradient(135deg, var(--color-primary), var(--color-accent)));
}

[data-flavor="solid"]::before {
  background: var(--color-surface);
}

[data-flavor="transparent"] {
  background: transparent;
}

[data-flavor="mesh"]::before {
  background: var(--mesh-gradient, conic-gradient(from 45deg, ...));
}
```

**Key question:** Does `data-flavor` require a `::before` pseudo-element on every section? This conflicts with `data-angle` which also uses `::before`. They may need to share, or flavor could use `::after` while angle uses `::before`.

## Dependencies

- Requires `data-angle` and hero bleed to be implemented first (they establish the `::before` pattern on sections)
- Should integrate with the existing theme system — themes could provide default flavor/accent combinations
- Theme picker would need UI for accent color selection (similar to the existing color swatch row)

## Open Questions

1. Should `data-accent` override just `--hue-accent` or set multiple computed color tokens?
2. How does `data-flavor` interact with `data-angle`'s `::before`? Share or use different pseudo-elements?
3. Should flavors be theme-aware? (A "gradient" flavor in the brutalist theme might be a hard diagonal stripe)
4. How many accent presets? Match the 10 existing color themes, or a smaller set?
5. Should `data-accent` work on any element (button, card, section) or only on sections?

## Estimated Effort

- `data-accent`: Small — 1 CSS file, ~30 rules, one new token override per color
- `data-flavor`: Medium — needs `::before` coordination, gradient token definitions, theme integration
- Theme picker UI: Medium — new accent swatch row or section in settings panel
