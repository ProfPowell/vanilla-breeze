# Theme Consistency: Cross-Theme Card Layout & Color Mode Stability

## Problem Statement

When switching between themes, card grids (particularly the "Built Different" section on the home page) exhibit layout inconsistency due to font metric differences. Themes using monospace fonts (Brutalist, Cyber, Terminal, 8bit, NES) cause card headings like "Progressive Enhancement" to wrap to 2 lines, while proportional sans-serif themes keep them on 1 line. This produces misaligned heading/body regions across cards in the same row.

Additionally, some themes have incomplete dark mode token coverage, causing border/background glitches during light/dark mode switching.

## Root Causes

### Card Layout

1. **Font width variance** — Monospace fonts are ~50% wider per character than proportional fonts at the same font-size. A heading that fits in 280px in system-ui wraps in Cascadia Code.
2. **No internal alignment mechanism** — The grid equalizes card height per row (CSS grid default behavior), but heading and body text start at different vertical positions across cards because there's no subgrid alignment.
3. **No font metric normalization** — `font-size-adjust` is not used anywhere. Different fonts with different x-height ratios render at different visual sizes even at the same `font-size`.

### Color Mode

1. **Incomplete dark mode overrides** — Brutalist dark is missing `--color-surface-sunken` and `--color-border-muted`. 8bit has no light mode variant at all.
2. **`color-scheme` vs `data-mode` conflict** — Themes that set `color-scheme: light` in their base then provide a `[data-mode="dark"]` variant. Any tokens NOT explicitly overridden in the dark variant fall through to `:root`'s `light-dark()` values, which are neutral grays — clashing with the theme's tinted palette.
3. **No per-theme token coverage enforcement** — The existing `dark-mode-check.js` operates on combined CSS output, not per-theme.

## Solutions

### 1. Nested Subgrid for Card Alignment

The existing `data-layout-subgrid` mechanism handles `grid > child` but the home page structure is `grid > li > article.card > h3 + p`, requiring nested subgrid to reach the heading and body elements.

Page-level CSS for the features section:

```css
.features-section [data-layout="grid"] > li {
  display: grid;
  grid-row: span 2;
  grid-template-rows: subgrid;
}

.features-section [data-layout="grid"] > li > article {
  display: grid;
  grid-row: span 2;
  grid-template-rows: subgrid;
}
```

This forces all headings in a row to share one row track and all descriptions to share another, regardless of wrapping. Browser support: all modern browsers (Chrome 117+, Firefox 71+, Safari 16+).

**Framework enhancement**: Add `data-layout-subgrid="2"` and `data-layout-subgrid="4"` variants to `layout-attributes.css` for pages with simpler or more complex card structures (vs. the current default `span 3`).

### 2. `font-size-adjust` Tokens

Add `--font-size-adjust: none` to `typography.css`. Themes with non-default font families set their own value:

| Theme | Font Family | Recommended `font-size-adjust` |
|-------|------------|-------------------------------|
| Brutalist | ui-monospace, Cascadia Code | 0.48 |
| Cyber | JetBrains Mono | 0.50 |
| Terminal | VT323, monospace | 0.46 |
| 8bit | "Press Start 2P" | 0.42 |
| Classic | Charter, serif | 0.47 |

Applied via `body { font-size-adjust: var(--font-size-adjust); }`.

This normalizes visual rendering so monospace characters don't appear oversized, reducing heading wrapping. Note: affects all text globally — test prose readability per-theme.

### 3. Complete Override Principle

Any theme that sets `color-scheme: light` MUST provide a `[data-mode="dark"]` variant that explicitly overrides ALL surface, text, and border tokens. It cannot rely on `light-dark()` fallback from `:root` because the theme's tinted values will clash with neutral grays.

**Required tokens for every theme's alternate mode:**
- `--color-surface`, `--color-surface-raised`, `--color-surface-sunken`, `--color-background`
- `--color-text`, `--color-text-muted`
- `--color-border`, `--color-border-strong`
- `--shadow-sm`, `--shadow-md` (opacity adjustment for dark backgrounds)

### 4. Per-Theme Token Coverage Script

New `scripts/quality/theme-token-coverage.js`:
- Parses each theme CSS file individually
- Extracts base tokens and dark/light variant tokens
- Reports missing required tokens
- Exits non-zero on critical gaps → integrates into CI quality gate

### 5. Card Grid Test Surface

New `demos/tools/theme-lab/surfaces/card-grid.html` with varied-length card headings, picked up automatically by the existing `theme-surfaces.spec.js` for visual regression across all 20 core themes × 2 modes × 2 viewports.

## Confirmed Fixes Needed

| Theme | Mode | Missing Tokens |
|-------|------|---------------|
| Brutalist | dark | `--color-surface-sunken`, `--color-border-muted`, `--color-text-subtle` |
| 8bit | light | Entire light mode variant |
| Others | TBD | Run `theme-token-coverage.js` audit |

## What We're NOT Doing

- **Container queries for card sizing** — doesn't help equalize height across siblings, only helps individual card responsiveness
- **Magic `min-height` values** — fragile across themes/viewports
- **Utility class generation** — contrary to VB's semantic HTML philosophy (see sugarcube.md analysis)

## Key Files

- `site/src/pages/index.njk` — home page features grid
- `src/custom-elements/layout-attributes.css` — grid + subgrid system
- `src/tokens/typography.css` — font-size-adjust token
- `src/tokens/themes/_extreme-brutalist.css` — primary fix target
- `src/tokens/themes/_theme-template.css` — override principle docs
- `scripts/quality/theme-token-coverage.js` — new audit script
- `demos/tools/theme-lab/surfaces/card-grid.html` — new test surface
