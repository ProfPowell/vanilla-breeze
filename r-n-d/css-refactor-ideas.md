# CSS Refactor Ideas

Potential CSS-side optimizations identified during the bundle size audit (Feb 2026). These were deferred from the modular loading architecture work because the cost/benefit or risk profile didn't justify immediate action.

---

## 1. Deduplicate layout-attributes gap/align selectors (~15-20 KB)

`layout-attributes.css` (48 KB, 1,353 lines) repeats the same gap and alignment selectors for each of the ~16 layout types. Each layout independently declares the same 10 gap values and 4-5 alignment values.

**Current pattern (repeated per layout type):**
```css
[data-layout="stack"][data-layout-gap="xs"]  { --_gap: var(--size-xs); }
[data-layout="stack"][data-layout-gap="s"]   { --_gap: var(--size-s); }
/* ... 10 values ... */

[data-layout="sidebar"][data-layout-gap="xs"]  { --_gap: var(--size-xs); }
[data-layout="sidebar"][data-layout-gap="s"]   { --_gap: var(--size-s); }
/* ... 10 values repeated again ... */
```

**Refactored pattern (once for all layouts):**
```css
[data-layout][data-layout-gap="xs"]  { --_gap: var(--size-xs); }
[data-layout][data-layout-gap="s"]   { --_gap: var(--size-s); }
/* ... one set of 10 values total ... */
```

**Why deferred:** The refactor is straightforward but needs careful testing. The compound `[data-layout="stack"][data-layout-gap="xs"]` selector has higher specificity than `[data-layout][data-layout-gap="xs"]`, and some layouts may have gap overrides that depend on that specificity ordering. A regression in any layout combination could be subtle. Needs a systematic visual regression test across all 16 layout types x 10 gap values before shipping.

**Savings:** ~15-20 KB raw CSS (~1-2 KB brotli).

---

## 2. Move theme-dependent token extensions (~16 KB)

`border-styles.css` (11.1 KB) and `rough-borders.css` (4.6 KB) are primarily consumed by extreme themes (rough, kawaii, nes, win9x, etc.). They ship in the core token layer even though they only activate when those themes are selected.

**Current location:** `src/tokens/extensions/border-styles.css`, `src/tokens/extensions/rough-borders.css`

**Potential approach:** Move these into the individual theme CSS files that need them. Each theme file is already self-contained and built individually — adding the border-style rules they depend on would make them truly standalone.

**Why deferred:** The border-style system is also exposed as a user-facing feature (`data-border-style="sketch"`) independent of themes. A user could apply `data-border-style` without any extreme theme. Moving the CSS into theme files would break that standalone usage unless we also keep a copy in core (defeating the purpose) or create a separate `vanilla-breeze-borders.css` add-on (adding complexity for ~16 KB savings).

**Savings:** ~16 KB raw CSS (~1 KB brotli) — only if the standalone border-style use case is dropped or handled separately.

---

## 3. Nav element styles audit (~5-8 KB)

`nav/styles.css` is 19 KB — 3x larger than the next biggest native element file (`table` at 6 KB). It contains many nav variants: topbar, sidebar, breadcrumb, tabs, pagination, mega-menu, etc.

**Why deferred:** Nav is a core HTML element and all its variants are legitimate native-element patterns. Unlike charts or dev tools, there's no clean category boundary to split on — a site might use breadcrumbs + pagination + sidebar all on the same page. The 19 KB is the natural cost of a comprehensive nav system. Splitting into "common nav" and "exotic nav" would create an arbitrary API decision with unclear boundaries.

**Possible future approach:** If a specific nav variant (e.g., mega-menu) is identified as rarely used and significantly large, it could be extracted as an opt-in. But this needs usage data to justify.

**Savings:** ~5-8 KB raw CSS, speculative.

---

## 4. Layout custom elements / data-layout overlap (~25 KB)

Two parallel systems exist for the same layouts:

| System | Size | Example |
|--------|------|---------|
| Custom element tags | 25.5 KB | `<layout-stack>`, `<layout-grid>` |
| Data attributes | 48.3 KB | `[data-layout="stack"]`, `[data-layout="grid"]` |

Most VB-conformant sites prefer `data-layout` on semantic elements (per the VB refinement checklist: "prefer `form.stacked` over `<div data-layout="stack">`"). The custom element tags are primarily useful for quick prototyping or when no semantic parent exists.

**Why deferred:** The custom elements are part of the public API and documented. Removing them from core would be a breaking change for any consumer using `<layout-stack>` etc. Making them an opt-in add-on is viable but adds friction for new users who discover them in docs. The 25 KB cost is real but the API stability concern outweighs it for now.

**Possible future approach:** Deprecate `<layout-*>` custom elements in favor of `data-layout` in a major version, with the custom elements available as a compatibility add-on. Or: move them to the extras CSS bundle alongside the extras JS bundle.

**Savings:** ~25 KB raw CSS (~2 KB brotli).

---

## Summary

| Idea | Raw Savings | Brotli Savings | Risk | Recommendation |
|------|-------------|----------------|------|----------------|
| Gap/align dedup | ~15-20 KB | ~1-2 KB | Medium (specificity) | Do when visual regression tests cover all layouts |
| Theme-dependent extensions | ~16 KB | ~1 KB | Medium (breaks standalone border-style) | Revisit if border-style usage is audited |
| Nav audit | ~5-8 KB | <1 KB | Low but speculative | Only if a clear split point emerges |
| Layout element overlap | ~25 KB | ~2 KB | High (breaking change) | Defer to major version |
