# pdf-viewer VB token-compat audit

**Bead:** `vanilla-breeze-3xwu`
**Source:** https://github.com/ProfPowell/pdf-viewer (`src/pdf-viewer.js`, ~/src/pdf-viewer)
**Live:** https://profpowell.github.io/pdf-viewer/
**Audit date:** 2026-05-09

## Summary

The component already wires VB **color tokens** correctly via `var(--token, fallback)` for theme-aware surfaces. **Spacing, typography, radii, borders, and shadows are still hardcoded** (~86 `px` values across the stylesheet). To ship inside VB, those need to swap to VB tokens so theme packs can re-skin the chrome cleanly.

## What's already good (no change needed)

| VB token | pdf-viewer alias | Lines |
|---|---|---|
| `--color-surface` | `--_pv-bg` | 1566, 1582 |
| `--color-surface-raised` | `--_pv-toolbar-bg` | 1567, 1583 |
| `--color-surface-sunken` | `--_pv-sidebar-bg` | 1574, 1590 |
| `--color-surface-hover` | `--_pv-hover-bg` | 1572, 1588 |
| `--color-border` | `--_pv-border` | 1568, 1584 |
| `--color-text` | `--_pv-text` | 1569, 1585 |
| `--color-text-muted` | `--_pv-text-muted` | 1570, 1586 |
| `--color-interactive` | `--_pv-accent` | 1571, 1587 |
| `--font-sans` | `font-family` host rule | 1560 |

The dark-mode override (line 1582–1593, plus `prefers-color-scheme: dark` at 1607) works correctly with VB's theme system.

## What needs token wiring

### 1. Spacing (~50 occurrences)

Replace pixel literals with `--size-*` tokens. Suggested mapping:

| Hardcoded | Token | Notes |
|---|---|---|
| `2px` | `var(--size-3xs)` | sub-element gaps, thin dividers |
| `3px` | `var(--size-2xs)` | small inset (highlight padding) |
| `4px` | `var(--size-2xs)` | most button paddings, gaps |
| `6px` | `var(--size-xs)` | small input padding |
| `8px` | `var(--size-xs)` or `var(--size-s)` | medium gap |
| `12px` | `var(--size-s)` | toolbar padding-inline |
| `20px` | `var(--size-m)` | divider height |
| `28px` | n/a — keep (control size) |
| `40px` | n/a — keep (`--_pv-toolbar-height`) |
| `42px` | n/a — keep (page-counter min-width) |
| `200px` | n/a — keep (`--_pv-sidebar-width`) |

Concrete spots (sampled, not exhaustive):

- 1629: `gap: 4px` → `var(--size-2xs)`
- 1630: `padding: 4px 8px` → `var(--size-2xs) var(--size-xs)`
- 1642: `gap: 2px` → `var(--size-3xs)`
- 1675: `padding: 4px` → `var(--size-2xs)`
- 1742: `gap: 8px` → `var(--size-xs)`
- 1743: `padding: 6px 12px` → `var(--size-xs) var(--size-s)`
- 1756: `gap: 6px` → `var(--size-xs)`
- 1761: `padding: 4px 8px` → `var(--size-2xs) var(--size-xs)`
- 1809: `padding: 8px` → `var(--size-xs)`
- 1813: `gap: 8px` → `var(--size-xs)`

### 2. Border radius (8 occurrences)

| Hardcoded | Token |
|---|---|
| `2px` | `var(--radius-xs)` |
| `3px` | `var(--radius-xs)` |
| `4px` | `var(--radius-s)` |
| `8px` | `var(--radius-m)` |
| `50%` | keep (avatar/circle) |

Lines: 1620, 1674, 1713, 1760, 1819, 1961, 2001, 2047, 2058.

### 3. Font sizes (8 occurrences, lines 1561–1990)

| Hardcoded | Token |
|---|---|
| `11px` | `var(--font-size-2xs)` |
| `12px` | `var(--font-size-xs)` |
| `13px` | `var(--font-size-sm)` |
| `14px` | `var(--font-size-base)` |

The host's `font-size: 14px` (line 1561) should become `var(--font-size-base)` so VB's typographic scale governs the whole component.

### 4. Border widths

Replace every `1px solid` (lines 1619, 1634, 1646, ...) with `var(--border-width-thin) solid`. There are no `2px` or thicker borders in the file.

### 5. Box-shadows (5 occurrences)

| Hardcoded | Token candidate |
|---|---|
| `0 1px 3px rgba(0,0,0,0.15)` (line 1838) | `var(--shadow-s)` |
| `0 2px 8px rgba(0,0,0,0.15)` (line 1577 light, 1838 default) | `var(--shadow-m)` |
| `0 2px 8px rgba(0,0,0,0.4)` (lines 1591, 1607) | `var(--shadow-l)` (heavier dark variant) |

Wire as `--_pv-shadow: var(--shadow-m)` (light) / `var(--shadow-l)` (dark) with current rgba as fallback.

### 6. Non-themeable surface colors (2 outstanding)

These are **not** wired to VB tokens at all — they will not theme:

- **Line 1573 / 1589**: `--_pv-content-bg` is the canvas background behind PDF pages. Currently `#e8e8e8` (light) / `#3a3a3c` (dark). Should map to `var(--color-surface-sunken, fallback)` (already used for sidebar at line 1574, but content-bg is hardcoded). Decide whether they should share or get a distinct token.
- **Lines 1578 / 1592**: `--_pv-page-bg: #ffffff` is the page paper color. By PDF convention pages are white in both light and dark mode (matching print) — **do not theme this**. Document the decision in code as an intentional carve-out, otherwise dark-theme users will see a "broken" white page and assume it's a bug.

### 7. Search highlight colors (lines 2085, 2091)

`rgba(255, 213, 0, 0.4)` and `rgba(255, 150, 0, 0.6)` are the search-result highlight tints. Consider exposing as `--pdf-viewer-highlight` / `--pdf-viewer-highlight-active` so users can match brand or accessibility preferences. VB doesn't have a stock highlight token, so naming them in the `--pdf-viewer-*` namespace is fine.

## Focus rings

Component does not appear to set explicit `outline` rules on focusable controls — relies on UA defaults. VB convention is `outline: var(--focus-ring)` (or equivalent) on `:focus-visible`. **Add `:focus-visible` rules** for toolbar buttons (line 1671 onward) and search input (line 1758) so focus is visible against the toolbar background under all themes.

## Theme-pack swap test (manual, before merge)

Once tokens are wired, drop `<pdf-viewer src="...">` into a VB demo page and verify chrome re-themes correctly when switching themes (default ↔ rough ↔ extreme-swiss ↔ extreme-neumorphism). All toolbar surfaces, borders, and text should change; PDF page (paper) stays white by design.

## Out of scope for this bead

- **Refactoring the external repo.** The user has it in progress; this audit is the deliverable, not a PR against the external repo.
- **Importing into VB.** Once tokens land in the external repo, importing is a separate task: copy `src/pdf-viewer.js` + `src/lib/theme-observer.js`, register in `src/web-components/index.js`, add api.json + doc page + demo. File a follow-up bead for that.

## Suggested follow-up beads

1. **Apply audit to external repo** (against ProfPowell/pdf-viewer) — wire the tokens above. Owned by user, not VB.
2. **Import pdf-viewer into VB** — once external repo is token-clean, scaffold the VB integration following the bread-crumb / pop-over recipe (api.json, doc page, demo, registry entries, validate.cjs auto-gen).
