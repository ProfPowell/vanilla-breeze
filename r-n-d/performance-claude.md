# Vanilla Breeze Bundle Size Audit

## Current State

| Asset | Raw | Gzip | Brotli |
|-------|-----|------|--------|
| `vanilla-breeze.css` | 400.6 KB | 62.3 KB | 48.9 KB |
| `vanilla-breeze.js` | 257.6 KB | 67.6 KB | 54.7 KB |
| **Total** | **658.3 KB** | **129.9 KB** | **103.6 KB** |

The CSS compresses at 88% (→ 48.9 KB brotli) because it's heavily repetitive token declarations and attribute selectors. The JS compresses at 79% (→ 54.7 KB brotli). Over-the-wire cost is reasonable at ~104 KB, but raw parse cost still matters — browsers must parse and index all selectors even if unused.

---

## Opportunity Map

### 1. Extreme Themes: 120 KB raw CSS (29% of CSS bundle)

11 extreme themes ship in the main bundle but most sites use zero or one of them.

| Theme | Size |
|-------|------|
| `win9x` | 20.3 KB |
| `rough` | 16.4 KB |
| `nes` | 15.0 KB |
| `kawaii` | 12.0 KB |
| `8bit` | 11.5 KB |
| `terminal` | 10.2 KB |
| `cyber` | 9.7 KB |
| `organic` | 7.9 KB |
| `editorial` | 7.5 KB |
| `brutalist` | 7.4 KB |
| `swiss` | 5.4 KB |

**Opportunity:** Move extreme themes to separate opt-in files. A site using `data-theme="win9x"` loads only that theme. The core bundle drops by ~120 KB raw / ~8–10 KB brotli.

**Approach options:**
- **A) Separate CSS files per theme** — `vanilla-breeze-theme-win9x.css` etc. Users add one `<link>` for their chosen theme. Zero JS required.
- **B) Dynamic `@import` via `theme-wc`** — The theme switcher component already exists; it could inject a `<link>` for the active theme CSS on demand.
- **C) Build-time tree-shaking flag** — Offer a build config that strips unused themes. Only helps bundler-based consumers.

**Recommended:** Option A (simplest, works for CDN users) with B as a progressive enhancement for the theme switcher demo.

---

### 2. Layout Attributes Duplication: 48 KB raw CSS (12% of CSS bundle)

`layout-attributes.css` (48.3 KB, 1,353 lines) provides `data-layout="stack"` etc. on arbitrary HTML elements. The 12 `<layout-*>` custom elements (25.5 KB combined) provide the same layouts via tag names. The gap/align attribute selectors are repeated per layout type — each layout independently declares the same 10 gap values and 4–5 alignment values.

**Repetition analysis:**
- 82 `data-layout-gap` declarations across the file
- 17 `data-layout-align` declarations
- Each of the ~16 component layouts repeats a near-identical block of gap/align selectors

**Opportunity:** Refactor shared gap/align into layout-agnostic selectors that apply to any `[data-layout]` element:

```css
/* Instead of per-layout gap repetition: */
[data-layout][data-layout-gap="xs"]  { --_gap: var(--size-xs); }
[data-layout][data-layout-gap="s"]   { --_gap: var(--size-s); }
/* ... one set instead of 8 duplicated sets */
```

**Estimated savings:** ~15–20 KB raw. The gap/align modifiers are semantically identical across all layout types, so a single set of rules would suffice. Only layout-specific overrides (e.g., grid column counts) need per-type selectors.

---

### 3. Charts Layer: 31 KB raw CSS (8% of CSS bundle)

The full charts layer (bar, line, area, pie, column, legend, tooltip) ships to every consumer. Many sites will never use SVG charts.

**Opportunity:** Extract `@import "./charts/index.css" layer(charts)` from `main.css` into a separate `vanilla-breeze-charts.css` add-on. Sites using charts add one extra `<link>`.

**Estimated savings:** ~31 KB raw / ~3 KB brotli from the core bundle.

---

### 4. Dev-Only Utilities in Production: ~24 KB raw CSS + ~20 KB JS

These are development/prototyping tools shipped in the production bundle:

| File | Size | Purpose |
|------|------|---------|
| `wireframe.css` | 16.9 KB | Prototype wireframe mode |
| `wireframe-fonts.css` | 0.9 KB | Wireframe font declarations |
| `debug.css` | 1.4 KB | Content model debug overlays |
| `debug-content-model.js` | 5.3 KB | Runtime content validation |
| `wizard.js` | 14.6 KB | Multi-step form wizard |

Wireframe mode (`data-wireframe`) and debug mode (`data-debug`) are gated by attribute/localStorage — they never activate in normal use, but their CSS selectors still occupy parse time and bundle space.

**Opportunity:** Move wireframe + debug to a `vanilla-breeze-dev.css` / `vanilla-breeze-dev.js` add-on. The doc site can include it; production consumers don't.

**Note on wizard.js:** This is a legitimate runtime feature (multi-step forms), not dev tooling. Assess whether it should be lazy-loaded instead — it's eagerly imported from `main.js` but only activates when `[data-wizard]` forms exist on the page.

**Estimated savings:** ~19 KB raw CSS, ~5 KB JS from core bundle. Wizard lazy-load saves another ~15 KB JS for pages without wizard forms.

---

### 5. Emoji Data in Main JS Bundle: 31 KB raw

`emoji-data.js` (30.7 KB) containing ~250 emoji definitions is bundled into the main JS because `emoji-init.js` and `emoji-picker` both import it eagerly.

**Opportunity:** Lazy-load emoji data on first use. Neither shortcode replacement nor the emoji picker need data at page load — they can fetch it when a user first interacts with an emoji shortcode or opens the picker.

**Approach:**
```js
// Instead of static import at module level:
let emojiData;
async function getEmojiData() {
  if (!emojiData) {
    emojiData = await import('../data/emoji-data.js');
  }
  return emojiData;
}
```

**Estimated savings:** ~31 KB raw / ~5 KB brotli from initial JS parse.

---

### 6. Token Extensions: 24 KB raw CSS

`border-styles.css` (11.1 KB) and `rough-borders.css` (4.6 KB) are primarily consumed by extreme themes. `surfaces.css` (3.4 KB) and `motion-fx.css` (3.3 KB) provide opt-in enhancements that default to disabled.

**Opportunity:** If extreme themes become separate files, the extensions they depend on (`rough-borders`, `border-styles`) could move with them, saving ~16 KB from the core token layer. The remaining `surfaces.css`, `motion-fx.css`, and `fonts.css` (8 KB total) are small enough to keep.

---

### 7. Nav Element Styles: 19 KB raw (largest native element)

`nav/styles.css` is 3x larger than the next biggest native element (`table` at 6 KB). This suggests it contains many nav variants (sidebar, topbar, breadcrumb, tabs, etc.).

**Opportunity:** Audit which nav variants are commonly used vs. niche. Consider splitting rare nav patterns (e.g., mega-menu, command palette nav) into optional add-ons. Even modest pruning could save 5–8 KB.

---

### 8. Layout Custom Elements + Layout Attributes Overlap: ~25 KB redundant

Both systems exist:
- `<layout-stack>`, `<layout-grid>`, etc. (custom element tags) — 25.5 KB total
- `[data-layout="stack"]`, `[data-layout="grid"]`, etc. (attribute system) — 48.3 KB total

They implement the same layouts with nearly identical CSS. Sites typically use one approach or the other.

**Opportunity:** Offer layout custom elements as an optional add-on rather than bundling both systems. Most VB-conformant sites prefer `data-layout` on semantic elements (per the VB refinement pass checklist), making the custom element tags redundant for them.

**Estimated savings:** ~25 KB raw if custom element layouts become opt-in.

---

### 9. Sound Manager: 5.2 KB JS

`sound-manager.js` is imported by `theme-wc` and `settings-panel`. It's a niche feature (UI sound effects) that most sites won't use.

**Opportunity:** Lazy-load behind a feature check — only import when a `[data-sound]` attribute or equivalent opt-in is detected.

---

### 10. Build System: No Tree-Shaking or Code Splitting

The current build (`scripts/build-cdn.js`) uses esbuild with `bundle: true, minify: true` — a single entry point producing a single CSS and single JS file. There's no mechanism for consumers to exclude unused features.

**Opportunity:** Introduce a modular build option:

- **Tiered bundles:**
  - `vanilla-breeze-core.css/js` — tokens, reset, native elements, core custom elements
  - `vanilla-breeze-components.css/js` — web components
  - `vanilla-breeze-charts.css` — charts layer
  - `vanilla-breeze-theme-{name}.css` — individual themes
  - `vanilla-breeze-dev.css/js` — wireframe, debug

- **Or a builder/configurator** (like Open Props does) that produces a custom bundle from selected features.

---

## Summary: Estimated Savings

| Opportunity | Raw CSS Savings | Raw JS Savings | Brotli Savings (est.) |
|-------------|----------------|----------------|-----------------------|
| Externalize extreme themes | ~120 KB | — | ~8–10 KB |
| Deduplicate layout-attributes gap/align | ~15–20 KB | — | ~1–2 KB |
| Externalize charts | ~31 KB | — | ~3 KB |
| Externalize dev utilities | ~19 KB | ~5 KB | ~2 KB |
| Lazy-load emoji data | — | ~31 KB | ~5 KB |
| Move theme-dependent extensions | ~16 KB | — | ~1 KB |
| Externalize layout custom elements | ~25 KB | — | ~2 KB |
| **Total potential** | **~230 KB** | **~36 KB** | **~22–25 KB** |

Applying all opportunities would reduce the core bundle from ~658 KB → ~392 KB raw, or from ~104 KB → ~79 KB over the wire (brotli). The biggest wins are externalizing extreme themes and deduplicating layout-attribute selectors.

---

## Recommendations Priority

1. **Quick win — Deduplicate layout gap/align selectors.** Pure refactor, no API change, ~15–20 KB saved.
2. **High impact — Externalize all decorative themes with fetch-and-cache.** ~146 KB raw saved. See detailed design below.
3. **Clean separation — Extract charts layer.** ~31 KB saved, only affects chart users.
4. **Lazy-load emoji data.** ~31 KB JS deferred, improves initial parse time.
5. **Extract dev utilities.** ~24 KB removed from production consumers.
6. **Longer term — Modular/tiered build system.** Biggest architectural change but enables all of the above cleanly.

---

## Deep Dive: External Theme Loading Strategy

### What stays in core vs. what gets externalized

**Stays in core bundle (always loaded):**

| Category | Files | Size | Rationale |
|----------|-------|------|-----------|
| Default theme | (no file — it's the base tokens) | 0 KB | Already the core token layer; no `data-theme` selector needed |
| Accessibility: system | `_access-system.css` | 3.4 KB | Uses `@media (prefers-contrast)` and `@media (forced-colors)` — must be present for automatic a11y compliance |
| Accessibility: high-contrast | `_access-high-contrast.css` | 6.2 KB | Opt-in via `data-theme~="a11y-high-contrast"` — functional, not decorative |
| Accessibility: large-text | `_access-large-text.css` | 5.6 KB | Opt-in via `data-theme~="a11y-large-text"` |
| Accessibility: dyslexia | `_access-dyslexia.css` | 5.5 KB | Opt-in via `data-theme~="a11y-dyslexia"` |
| **Total kept** | | **~20.6 KB** | |

**Externalized (fetched on demand):**

| Category | Files | Total Size | Per-file range |
|----------|-------|------------|----------------|
| Color themes (10) | `ocean`, `forest`, `sunset`, `rose`, `lavender`, `coral`, `slate`, `emerald`, `amber`, `indigo` | ~14 KB | 1.3–1.5 KB each |
| Personality themes (3) | `modern`, `minimal`, `classic` | ~10.6 KB | 3.3–3.9 KB each |
| Extreme themes (11) | `brutalist`, `swiss`, `cyber`, `organic`, `editorial`, `terminal`, `kawaii`, `8bit`, `nes`, `win9x`, `rough` | ~123 KB | 5.4–20.3 KB each |
| **Total removed from core** | **24 themes** | **~147 KB** | |

**Core bundle CSS savings: ~147 KB raw (~10–12 KB brotli)**

### How it works

#### 1. Build step: emit individual theme files

The build script produces one CSS file per theme alongside the main bundle:

```
dist/cdn/
  vanilla-breeze.css          ← core (no decorative themes)
  vanilla-breeze.js           ← core JS (includes ThemeLoader)
  themes/
    ocean.css
    forest.css
    modern.css
    win9x.css
    ...                       ← 24 files
```

Each theme file is self-contained — just the `[data-theme~="..."]` selectors. They're placed in a `/themes/` subdirectory for clean CDN paths.

#### 2. ThemeLoader: fetch, inject, cache

A small addition to the existing `ThemeManager` (~40 lines, negligible bundle cost):

```js
// Inside theme-manager.js or a new theme-loader.js

const THEME_CACHE = new Map();   // in-memory: theme name → <link> element
const CORE_THEMES = new Set([    // these are in the main bundle
  'default', 'a11y-high-contrast', 'a11y-large-text', 'a11y-dyslexia'
]);

/**
 * Ensure a theme's CSS is loaded before applying it.
 * Returns immediately for core themes. Fetches + caches for external themes.
 */
async function ensureThemeLoaded(themeName, baseURL) {
  // Core themes are already in the bundle
  if (CORE_THEMES.has(themeName) || themeName === 'default') return;

  // Already loaded this session
  if (THEME_CACHE.has(themeName)) return;

  const url = `${baseURL}/themes/${themeName}.css`;

  // Inject <link> — the browser handles HTTP caching (Cache-Control, ETags)
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = url;
  link.dataset.vbTheme = themeName;

  // Wait for it to load before applying (prevents FOUC)
  await new Promise((resolve, reject) => {
    link.onload = resolve;
    link.onerror = () => reject(new Error(`Theme "${themeName}" failed to load from ${url}`));
    document.head.appendChild(link);
  });

  THEME_CACHE.set(themeName, link);
}
```

#### 3. Integration with ThemeManager.apply()

The existing `ThemeManager.apply()` currently sets `root.dataset.theme` synchronously. The change is minimal — make `setBrand()` await the CSS load:

```js
// theme-manager.js — updated setBrand
async setBrand(brand) {
  await ensureThemeLoaded(brand, this._baseURL);
  const updated = this.save({ brand });
  this.apply(updated);
}
```

The `_baseURL` is derived from the script's own URL (same CDN origin), or configurable via:
```html
<script>window.__VB_THEME_BASE = '/cdn';</script>
```

#### 4. Caching strategy

Three layers of caching, zero extra libraries:

| Layer | Mechanism | Lifetime |
|-------|-----------|----------|
| **HTTP cache** | Standard `Cache-Control` / `ETag` headers from CDN | Browser-managed (typically 1 year for versioned assets) |
| **In-memory** | `Map` in ThemeLoader | Per page session — instant on re-selection |
| **Persistent (optional)** | `Cache API` via service worker | Offline support — theme works without network |

For most sites, HTTP caching alone is sufficient. The `<link>` element stays in `<head>` across the session so re-selecting a theme is instant (no fetch). On subsequent page loads the browser serves it from disk cache.

For the doc site (which has a service worker), the SW can pre-cache the full theme directory during install:

```js
// service-worker.js — optional pre-cache
const THEME_FILES = [
  '/cdn/themes/ocean.css',
  '/cdn/themes/modern.css',
  // ...
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open('vb-themes-v1').then(c => c.addAll(THEME_FILES)));
});
```

#### 5. theme-wc integration

The `theme-wc` component already knows the theme list (its static `#EXTREME_THEMES`, `#COLOR_THEMES`, etc. arrays). On brand change:

```js
#handleBrandChange = async (e) => {
  const brand = e.target.value;

  // Show loading state on the swatch
  const label = e.target.closest('.swatch-cell');
  label?.classList.add('loading');

  try {
    await ThemeManager.setBrand(brand);  // now async — loads CSS first
  } catch (err) {
    console.warn(`[theme-wc] ${err.message}`);
    // Graceful degradation: theme applies without custom CSS (falls back to defaults)
  } finally {
    label?.classList.remove('loading');
  }

  this.#applyA11yThemes();
  this.#autoDismiss();
};
```

#### 6. Saved theme on page load (returning visitors)

When `ThemeManager.init()` runs, it reads the saved brand from `localStorage`. If it's an external theme, it needs to load the CSS before the page renders. This is the one timing-sensitive path:

```js
// theme-manager.js — updated init()
async init() {
  const saved = this.load();

  // Load external theme CSS before applying (prevents FOUC)
  if (saved.brand && saved.brand !== 'default') {
    try {
      await ensureThemeLoaded(saved.brand, this._baseURL);
    } catch {
      // Network failure — fall back to default theme gracefully
      saved.brand = 'default';
    }
  }

  this.apply(saved);
  this._watchSystemPreference();
  return saved;
}
```

To avoid a flash of default-themed content while the external CSS loads, add a blocking `<link rel="preload">` in the HTML for sites that know their theme at build time:

```html
<!-- For a site permanently using the "ocean" theme -->
<link rel="preload" href="/cdn/themes/ocean.css" as="style" />
<link rel="stylesheet" href="/cdn/themes/ocean.css" />
```

For dynamic theme selection (user picks in `theme-wc`), the brief load is acceptable — it's a one-time cost per theme, then cached.

#### 7. Fallback / graceful degradation

If a theme CSS fails to load (network error, 404):
- The `data-theme` attribute still gets set
- No matching CSS selectors exist → the page renders with **default theme**
- This is safe: no broken layouts, no invisible text — just default colors

### Summary of changes needed

| File | Change |
|------|--------|
| `scripts/build-cdn.js` | Add theme file emission step (copy + minify individual theme files to `dist/cdn/themes/`) |
| `src/tokens/themes/index.css` | Remove all `@import` lines except `_access-*.css` |
| `src/lib/theme-manager.js` | Add `ensureThemeLoaded()`, make `init()` and `setBrand()` async |
| `src/web-components/theme-wc/logic.js` | Make `#handleBrandChange` async, add loading state |
| `package.json` exports | Add `"./themes/*"` export path |

No changes needed to: `main.css` layer declaration, `main.js`, any component CSS, or the HTML API (`data-theme` attribute works identically).
