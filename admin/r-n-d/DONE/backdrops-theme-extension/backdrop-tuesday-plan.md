---
title: "Backdrop Tuesday Plan — Consolidated Go-Forward"
description: "Unified implementation plan merging background-spec.md, backdrop-phase-1.md, and backdrop-phase-2.md with corrected VB syntax"
author: Thomas
date: 2026-03-03
tags:
  - vanilla-breeze
  - backdrop
  - themes
  - plan
status: active
---

# Backdrop Tuesday Plan

Consolidated go-forward plan bringing together the three backdrop spec documents into a single implementation roadmap, with all syntax corrected to match actual Vanilla Breeze conventions.

**Source documents:**
- `background-spec.md` — Core page background token system (v1/v2/v3 phasing)
- `backdrop-phase-1.md` — Deferred features: ghost cards, multi-canvas, page transitions
- `backdrop-phase-2.md` — Living Themes: transparent surfaces, environmental awareness, brand system

---

## Current State

**Already implemented** (in `src/tokens/extensions/surfaces.css` and `src/base/reset.css`):

- `--page-bg-*` tokens defined: `--page-bg-type`, `--page-bg-color`, `--page-bg-gradient`, `--page-bg-image`, `--page-bg-attachment`, `--page-bg-size`, `--page-bg-position`, `--page-bg-blend`, `--page-bg-overlay`
- `body` rule in `reset.css` already consumes these tokens
- Texture tokens: `--texture-noise`, `--texture-grain`, `--texture-dots`, `--texture-grid`, `--texture-lines`
- Glass tokens: `--glass-blur`, `--glass-opacity`, `--glass-bg`, `--glass-border`
- Gradient presets: `--gradient-subtle`, `--gradient-radial`, `--gradient-mesh`

**Not yet implemented:**
- Theme overrides using `--page-bg-*` tokens in individual theme files
- Theme Composer "Page Background" controls
- Surface gradient CSS output bug fix in Theme Composer
- Ghost cards, multi-canvas, transitions (deferred features)
- Living Themes concepts (environmental awareness, seasonal, brand)

---

## Syntax Corrections

The spec documents contain several naming/syntax mismatches with VB conventions. This section documents what changes.

### Element Naming

| Spec Used | Correct VB Syntax | Notes |
|-----------|-------------------|-------|
| `<vb-backdrop>` | `<layout-backdrop>` | Layout elements use `layout-*` prefix, no `vb-` |
| `<vb-canvas>` | `<layout-canvas>` | Same — follows `layout-grid`, `layout-stack` pattern |
| `<vb-card>` | `<layout-card>` | Already exists in VB |
| `<vb-hero-moment>` | `<hero-moment>` | Web components don't use `vb-` prefix either |
| `.vb-layout-region` | Native elements with `data-*` attributes | VB avoids utility classes — use semantic HTML + attributes |
| `.vb-card-list` | `<layout-grid>` with cards | Use existing layout elements |
| `.vb-card` | `<layout-card>` | Already exists |

### Token Naming

| Spec Used | Correct VB Syntax | Notes |
|-----------|-------------------|-------|
| `--vb-surface-bg` | `--color-surface` | VB uses `--color-*` for colors, no `--vb-` prefix |
| `--vb-surface-radius` | `--radius-m` | VB uses `--radius-*` scale |
| `--vb-surface-shadow` | `--shadow-md` | VB uses `--shadow-*` scale |
| `--vb-surface-filter` | `--glass-blur` | Already exists in surfaces.css |
| `--vb-accent` | `--color-accent` | VB uses `--color-*` |
| `--vb-card-bg` | `--color-surface-raised` | Already exists in colors.css |
| `--vb-card-radius` | `--radius-m` | Existing token |
| `--vb-card-shadow` | `--shadow-sm` | Existing token |
| `--vb-card-gap` | `--size-m` | VB uses `--size-*` scale (t-shirt sizing) |
| `--vb-layout-gap` | `--size-l` | Same |
| `--vb-layout-padding` | `--size-l` | Same |
| `--vb-depth-step` | `--depth-step` | No `--vb-` prefix |
| `--vb-parallax-offset` | `--parallax-offset` | No `--vb-` prefix |
| `--vb-env-sky-hue` | `--env-sky-hue` | No `--vb-` prefix |
| `--vb-env-sky-lightness` | `--env-sky-lightness` | No `--vb-` prefix |
| `--vb-env-chroma-modifier` | `--env-chroma-modifier` | No `--vb-` prefix |
| `--vb-backdrop-animation` | `--page-bg-animation` | Use existing `--page-bg-*` namespace |

### CSS Layer Order

| Spec Used | Correct VB Syntax |
|-----------|-------------------|
| `vb.reset, vb.tokens, vb.theme, ...` | `tokens, reset, native-elements, custom-elements, web-components, utils` |

The spec proposed new layers (`vb.theme.seasonal`, `vb.theme.event`, `vb.theme.environment`, `vb.backdrop`, `vb.backdrop.animations`). VB does not use dotted layer names or a `vb.` prefix. Any new layers would be flat names added to the existing declaration.

**Decision:** No new layers needed for the near-term work. Theme overrides live in theme CSS files which load after the main bundle. Environmental/seasonal CSS can live in the `utils` layer or in a `dev` add-on. Revisit if layer conflicts emerge.

### Theme Selector

| Spec Used | Correct VB Syntax |
|-----------|-------------------|
| `[data-theme="cyber"]` | `[data-theme~="cyber"]` |

VB uses `~=` (space-separated attribute selector) to allow theme composition:
```html
<html data-theme="cyber a11y-high-contrast">
```

Both forms appear in the spec — the dual selector pattern used in theme files is correct:
```css
:root[data-theme~="cyber"],
[data-theme~="cyber"] { ... }
```

### Attribute Naming

| Spec Used | Correct VB Syntax | Notes |
|-----------|-------------------|-------|
| `data-backdrop-type` | `data-backdrop` | VB uses the attribute value itself, not separate `-type` attrs |
| `data-canvas-effect` | `data-backdrop-effect` | Keep in `data-backdrop-*` namespace |
| `data-animation="shimmer"` | `data-backdrop-animation="shimmer"` | Namespace to avoid collision with other animation attrs |
| `data-layout-mode="windowed"` | `data-backdrop="windowed"` | Value on the main backdrop attribute |
| `data-surface="frosted"` | `data-surface="frosted"` | This one is fine as-is |
| `data-gap-breathing="true"` | Not needed | Transparent gaps are the default when backdrop is windowed |
| `data-scope="section"` | `data-backdrop-scope="section"` | Namespace under backdrop |

---

## Implementation Phases

### Phase 1: Theme Background Overrides (Tuesday target)

**Goal:** Get `--page-bg-gradient` working in 6-8 themes so switching themes shows visible backdrop differences.

**Files to modify:**
- Theme CSS files in `src/tokens/themes/` (add `--page-bg-gradient` overrides)

**Theme overrides to add:**

```css
/* Cyber — dark diagonal with cyan/magenta undertones */
:root[data-theme~="cyber"],
[data-theme~="cyber"] {
  --page-bg-gradient: linear-gradient(
    135deg,
    oklch(8% 0.04 280) 0%,
    oklch(12% 0.02 280) 40%,
    oklch(10% 0.06 200) 100%
  );
}

/* Midnight — deep blue-black vertical */
:root[data-theme~="midnight"],
[data-theme~="midnight"] {
  --page-bg-gradient: linear-gradient(
    180deg,
    oklch(10% 0.04 260) 0%,
    oklch(6% 0.02 240) 100%
  );
}

/* Dracula — purple-tinted vertical */
:root[data-theme~="dracula"],
[data-theme~="dracula"] {
  --page-bg-gradient: linear-gradient(
    180deg,
    oklch(16% 0.06 280) 0%,
    oklch(12% 0.04 300) 100%
  );
}

/* Vaporwave — pink-to-cyan horizontal */
:root[data-theme~="vaporwave"],
[data-theme~="vaporwave"] {
  --page-bg-gradient: linear-gradient(
    90deg,
    oklch(30% 0.12 330) 0%,
    oklch(25% 0.10 260) 50%,
    oklch(20% 0.08 200) 100%
  );
}

/* Nord — cool blue subtle vertical */
:root[data-theme~="nord"],
[data-theme~="nord"] {
  --page-bg-gradient: linear-gradient(
    180deg,
    oklch(22% 0.04 230) 0%,
    oklch(18% 0.03 220) 100%
  );
}

/* GenAI — multi-stop mesh-like */
:root[data-theme~="genai"],
[data-theme~="genai"] {
  --page-bg-gradient: linear-gradient(
    135deg,
    oklch(12% 0.06 280) 0%,
    oklch(15% 0.04 220) 40%,
    oklch(10% 0.08 300) 70%,
    oklch(8% 0.05 260) 100%
  );
}

/* Glassmorphism — gradient base for blur effects */
:root[data-theme~="glassmorphism"],
[data-theme~="glassmorphism"] {
  --page-bg-gradient: linear-gradient(
    135deg,
    oklch(20% 0.08 260) 0%,
    oklch(15% 0.06 300) 50%,
    oklch(18% 0.04 200) 100%
  );
}

/* Organic — earthy warm vertical */
:root[data-theme~="organic"],
[data-theme~="organic"] {
  --page-bg-gradient: linear-gradient(
    180deg,
    oklch(25% 0.06 80) 0%,
    oklch(20% 0.04 60) 100%
  );
}
```

**Verification:** Switch between themes using `<settings-panel>` and see gradient backgrounds change.

### Phase 2: Theme Composer Extension

**Goal:** Add "Page Background" controls to the Theme Composer (settings-panel).

**Files to modify:**
- `src/web-components/settings-panel/settings-panel.js` — Add page background controls
- `src/web-components/settings-panel/settings-panel.css` — Styles for new controls

**New controls:**
| Control | Type | Token Written |
|---------|------|---------------|
| Background Type | `<select>` | Determines which tokens are emitted |
| Background Color | `<input type="color">` | `--page-bg-color` |
| Gradient Start | `<input type="color">` | Component of `--page-bg-gradient` |
| Gradient End | `<input type="color">` | Component of `--page-bg-gradient` |
| Gradient Direction | `<select>` | Direction value in `--page-bg-gradient` |

**State model extension** (in existing `surfaces` section):
```javascript
surfaces: {
  // existing...
  pageBgType: 'none',
  pageBgColor: '#1a1a2e',
  pageBgGradStart: '#1a1a2e',
  pageBgGradEnd: '#16213e',
  pageBgGradDirection: 'to bottom',
}
```

**Bug fix:** The existing `surface-gradient` state is tracked but never emitted in CSS output. Fix `generateCSS()` to emit gradient tokens when `state.surfaces.gradient !== 'none'`.

### Phase 3: Ghost Cards (CSS-only)

**Goal:** Add optional depth illusion behind `<main>` when backdrop is active.

**API:**
```html
<body data-backdrop data-canvas-depth="1">
<body data-backdrop data-canvas-depth="2">
```

**Token:** `--canvas-depth` (not `--vb-canvas-depth`)

**File to create:** `src/utils/backdrop-depth.css` (imported in utils layer)

**CSS (corrected from spec):**
```css
[data-backdrop][data-canvas-depth] > main {
  position: relative;
}

[data-backdrop][data-canvas-depth] > main::before,
[data-backdrop][data-canvas-depth] > main::after {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--color-surface);
  border-radius: var(--radius-l);
  z-index: -1;
  pointer-events: none;
}

/* First ghost card (depth >= 1) */
[data-backdrop][data-canvas-depth="1"] > main::before,
[data-backdrop][data-canvas-depth="2"] > main::before {
  transform: translateY(8px) scale(0.97);
  opacity: 0.5;
  box-shadow: var(--shadow-sm);
}

/* Second ghost card (depth = 2) */
[data-backdrop][data-canvas-depth="2"] > main::after {
  transform: translateY(16px) scale(0.94);
  opacity: 0.25;
  box-shadow: var(--shadow-xs);
}

@media (prefers-reduced-motion: reduce) {
  [data-backdrop][data-canvas-depth] > main::before,
  [data-backdrop][data-canvas-depth] > main::after {
    transition: none;
  }
}
```

**Prerequisite:** Audit existing themes that use `body::before` / `body::after` for texture overlays (cyber scanlines, etc.) to avoid pseudo-element collisions. Ghost cards target `main::before/after`, not `body::before/after`, so this should be safe.

### Phase 4: Transparent Surface Mode

**Goal:** Let backdrop show through gaps between layout regions.

**API (corrected from spec):**
```html
<body data-backdrop data-surface="windowed">
```

Surface types on individual regions:
```html
<header data-surface="frosted">...</header>
<main data-surface="solid">...</main>
<aside data-surface="ghost">...</aside>
```

**Surface spectrum (corrected tokens):**

| Type | CSS |
|------|-----|
| `solid` | `background: var(--color-surface)` |
| `frosted` | `background: oklch(from var(--color-surface) l c h / 0.8); backdrop-filter: blur(16px) saturate(160%)` |
| `tinted` | `background: oklch(from var(--color-accent) l c h / 0.15); backdrop-filter: blur(8px)` |
| `ghost` | `background: oklch(from var(--color-surface) l c h / 0.05); border: 1px solid oklch(from var(--color-text) l c h / 0.1)` |
| `transparent` | `background: transparent` |

**File to create:** `src/utils/surface-types.css`

```css
[data-surface="frosted"] {
  background: oklch(from var(--color-surface) l c h / 0.75);
  backdrop-filter: blur(16px) saturate(160%);
  border: 1px solid oklch(from var(--color-text) l c h / 0.08);
}

[data-surface="tinted"] {
  background: oklch(from var(--color-accent) l c h / 0.12);
  backdrop-filter: blur(8px);
}

[data-surface="ghost"] {
  background: oklch(from var(--color-surface) l c h / 0.05);
  border: 1px solid oklch(from var(--color-text) l c h / 0.1);
}

[data-surface="transparent"] {
  background: transparent;
}

@media (prefers-reduced-transparency: reduce) {
  [data-surface="frosted"],
  [data-surface="tinted"] {
    background: var(--color-surface);
    backdrop-filter: none;
  }
}
```

### Phase 5: Layout Canvas Element (Future)

**Element:** `<layout-canvas>` — follows `layout-*` naming convention

**API:**
```html
<body data-backdrop>
  <layout-canvas>
    <main>...</main>
  </layout-canvas>
</body>
```

**Tokens (corrected):**
| Token | Default | Description |
|-------|---------|-------------|
| `--canvas-width` | `860px` | Fixed canvas width (tablet+) |
| `--canvas-radius` | `var(--radius-l)` | Uses existing radius scale |
| `--canvas-shadow` | `var(--shadow-lg)` | Uses existing shadow scale |
| `--canvas-effect` | `none` | `none`, `faded` |

**Responsive behavior:**
```css
layout-canvas {
  display: block;
  background: var(--color-surface);
  inline-size: 100%;
  border-radius: 0;
  box-shadow: none;
  margin-inline: 0;
}

@media (width >= 768px) {
  layout-canvas {
    inline-size: var(--canvas-width, 860px);
    max-inline-size: calc(100vw - var(--size-2xl));
    margin-inline: auto;
    border-radius: var(--canvas-radius, var(--radius-l));
    box-shadow: var(--canvas-shadow, var(--shadow-lg));
  }
}
```

### Phase 6: Living Themes Concepts (Future exploration)

These are aspirational features from `backdrop-phase-2.md`. Each is independently valuable but depends on the foundation from Phases 1-5.

**6a. Scoped theme accent overrides:**
```html
<!-- Uses existing data-theme cascade — already works -->
<section data-theme="midnight">...</section>

<!-- New: accent-only override (lightweight) -->
<section style="--hue-accent: 80">...</section>
```
VB already uses `--hue-primary`, `--hue-secondary`, `--hue-accent` as `@property`-registered values. Accent overrides work today via inline styles or scoped custom properties — no new infrastructure needed.

**6b. Time-of-day palette shifts:**
- New utility: `src/lib/environment.js`
- Sets `--env-sky-hue`, `--env-sky-lightness` on `:root` based on `Date`
- Themes that opt in reference these tokens in their `--page-bg-gradient`
- Requires `@property` registration for smooth CSS transitions

**6c. Seasonal modifiers:**
- Calendar evaluation in environment service
- Sets `data-season="winter"` on `<html>`
- Theme CSS files include seasonal overrides: `[data-theme~="aurora"][data-season="winter"] { ... }`

**6d. Weather atmosphere:**
- Cloudflare Worker proxy for weather API
- Sets `data-weather="rain"` on `<html>`
- CSS modifiers for chroma/lightness shifts

**6e. Brand-as-theme demos:**
- Theme JSON files encoding full brand identity
- Demo page showing same HTML under multiple brand themes
- Teaching tool for semantic HTML + theme separation

---

## Priority Order

| Priority | Phase | Effort | Impact |
|----------|-------|--------|--------|
| 1 | Phase 1: Theme gradient overrides | Small (add tokens to 8 theme files) | High — immediate visual payoff |
| 2 | Phase 2: Theme Composer controls | Medium (JS + UI work) | Medium — enables user customization |
| 3 | Phase 3: Ghost cards | Small (one CSS file) | Medium — depth illusion, pure CSS |
| 4 | Phase 4: Surface types | Small (one CSS file) | High — frosted/ghost surfaces |
| 5 | Phase 5: `<layout-canvas>` | Large (new custom element) | High — the canvas metaphor |
| 6 | Phase 6: Living Themes | Large (JS services, infra) | Aspirational — builds over time |

---

## Files Reference

**Existing files (modify):**
- `src/tokens/extensions/surfaces.css` — Page background tokens (already defined)
- `src/base/reset.css` — Body background rule (already consuming tokens)
- `src/tokens/themes/_extreme-*.css` — Individual theme files for gradient overrides
- `src/web-components/settings-panel/settings-panel.js` — Theme Composer extension

**New files (create):**
- `src/utils/backdrop-depth.css` — Ghost card pseudo-elements (Phase 3)
- `src/utils/surface-types.css` — `data-surface` attribute styles (Phase 4)
- `src/custom-elements/layout-canvas/` — Canvas custom element (Phase 5)
- `src/lib/environment.js` — Environmental awareness service (Phase 6)

**Not creating (spec correction):**
- No `<layout-backdrop>` element in near-term — `body` with `--page-bg-*` tokens is sufficient
- No new CSS layers — existing layer structure handles all phases
- No `--vb-` prefixed tokens — use semantic category prefixes
