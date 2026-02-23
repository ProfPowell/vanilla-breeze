# Bundle Splitting Strategy — R&D

> Status: R&D / in-progress investigation
> Related: bead `vanilla-breeze-eieb` (Component autoloader for lazy web component loading)
> Pilot: `emoji-extended.js` (separate opt-in data file)

## Current State

The CDN JS bundle (`vanilla-breeze.js`) is **234.7 KB minified / 62 KB gzipped**. It contains:

| Category | Source Size | Modules | Notes |
|----------|-----------|---------|-------|
| Web Components | ~544 KB | 25+ | All registered on load |
| Utility inits | ~300 KB | 38 | All auto-init on DOMContentLoaded |
| Library code | ~128 KB | 15 | wizard, composer, charts, forms |
| Data files | ~32 KB | 1 | emoji-data (core) |
| **Total source** | **~1,004 KB** | **63** | **→ 234.7 KB minified** |

**Zero dynamic imports.** Every module is statically imported and bundled upfront.

## The Problem

A page using 5 components pays for all 25+. A page with no emoji pays for 32 KB of emoji data. The bundle will only grow as we add features.

## Pilot: emoji-extended.js

The extended emoji dataset demonstrates the opt-in pattern:

- **Separate file:** `dist/cdn/emoji-extended.js` (96 KB min / 23 KB gzip)
- **Self-registering:** Uses `globalThis.__vbEmojiRegister` / `__vbEmojiExtended` for load-order-independent registration
- **Zero coupling:** No imports from the main bundle; communicates via globals
- **Additive:** Supplements the core set, never replaces it
- **Cost to main bundle:** 1.4 KB for the registration hook

This pattern works well for **data files** but isn't directly applicable to **components** (which need the full custom element registration machinery).

## Splitting Strategies (Ordered by Effort)

### Tier 1: Data Extraction (done for emoji)

Move large data payloads to separate opt-in files. Already working for emoji. Candidates:

| Data | Current Size | Approach |
|------|-------------|----------|
| emoji-data | 32 KB source | ✅ Done — emoji-extended.js |
| Icon SVG paths (if icon-wc inlines) | varies | Same pattern |

**Effort:** Low. Same globalThis registration pattern.

### Tier 2: Feature Bundles

Split the monolith into 2-3 bundles by usage tier:

```
vanilla-breeze-core.js    — theme, layout attrs, form utils, essential WCs
vanilla-breeze-extras.js  — specialized WCs (geo-map, emoji-picker, composer)
vanilla-breeze.js         — full bundle (backwards compat, includes both)
```

The core bundle would contain the ~15 most commonly used components and all data-* attribute utilities. Extras would contain niche/heavy components.

**Candidates for extras (heavy, niche):**
- `geo-map` + interact.js (~31 KB source) — only pages with maps
- `emoji-picker` (~14 KB) — only pages with emoji input
- `drag-surface` (~16 KB) — only pages with drag-and-drop
- `composer/` (~44 KB) — dev tool, not production pages
- `command-wc` + `shortcuts-wc` — power-user features
- `type-specimen-wc`, `color-palette-wc` — docs/tools pages only

**Effort:** Medium. Requires splitting `web-components/index.js` into two entry points. Build change only — no runtime complexity.

### Tier 3: Component Autoloader (bead vanilla-breeze-eieb)

Lazy-load web components on first use. When the browser encounters an unknown `<geo-map>` tag, the autoloader fetches and registers it.

```html
<!-- Just include the autoloader -->
<script type="module" src="/cdn/vanilla-breeze.js"></script>

<!-- Components load on demand when used in HTML -->
<geo-map lat="40.7" lng="-74.0"></geo-map>
<!-- ^ triggers async load of geo-map/logic.js -->
```

**Implementation approaches:**
1. **MutationObserver + `customElements.whenDefined`** — watch for unknown elements, dynamically import them
2. **Import map** — browser-native, but requires all component URLs declared upfront
3. **`customElements.define` lazy wrapper** — register a placeholder class that loads the real implementation on `connectedCallback`

Approach 3 is the most robust:
```js
// Register a lazy placeholder for each component
customElements.define('geo-map', class extends HTMLElement {
  async connectedCallback() {
    const { default: GeoMap } = await import('/cdn/components/geo-map.js');
    customElements.define('geo-map', GeoMap); // redefine not allowed...
  }
});
```

Wait — `customElements.define` can't redefine. So the placeholder approach would need to:
- Define a temporary element that loads the real module
- The real module upgrades the element via prototype swapping or replacement

This is complex. A simpler approach: **don't register components by default, let a small autoloader script handle it.** The autoloader watches the DOM and imports component files when their tags appear.

**Effort:** High. Requires per-component build outputs, a manifest file, and the autoloader script. But the payoff is significant — pages only load what they use.

### Tier 4: Tree-Shakable Exports (future)

Instead of a single bundle, publish individual ES module entry points:

```js
// Users import only what they need
import 'vanilla-breeze/components/tabs';
import 'vanilla-breeze/utils/mask';
```

This requires a `package.json` exports map and works with bundlers (Vite, webpack) but not with direct `<script>` tags. It's complementary to Tier 2/3, not a replacement.

## Recommended Path

1. **Now:** The emoji-extended pilot validates the opt-in data pattern ✅
2. **Next:** Tier 2 feature bundles — low-effort, high-impact split that can happen with a build config change
3. **Later:** Tier 3 autoloader for the long tail of components (the bead already exists)
4. **Eventually:** Tier 4 tree-shakable exports when VB is consumed as an npm package

## Size Budget

A reasonable target for the core bundle:

| Metric | Current | Target |
|--------|---------|--------|
| Minified | 234.7 KB | ~150 KB |
| Gzipped | 62 KB | ~40 KB |

Moving geo-map, composer, drag-surface, emoji-picker, and a few animation utils to extras would get us there.
