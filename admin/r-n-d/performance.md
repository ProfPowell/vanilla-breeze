# Vanilla Breeze Bundle Size and Performance Notes
Last Modified: Feb 23, 2026

Vanilla Breeze does a lot but it has also gotten byte fat and may go against some its own principles that way.  This document is a summarization of performance thoughts.


---

### CSS De-Duplication - Esp Layout Attributes Duplication: 48 KB raw CSS (12% of CSS bundle)

Given that we have added lots and lots of CSS over time it is likely we have a bit of duplication one apparently is on layout.

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


### Dev-Only Utilities in Production: ~24 KB raw CSS + ~20 KB JS

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


### Token Extension and Refactor: 24 KB raw CSS

`border-styles.css` (11.1 KB) and `rough-borders.css` (4.6 KB) are primarily consumed by extreme themes. `surfaces.css` (3.4 KB) and `motion-fx.css` (3.3 KB) provide opt-in enhancements that default to disabled.

**Opportunity:** If extreme themes become separate files, the extensions they depend on (`rough-borders`, `border-styles`) could move with them, saving ~16 KB from the core token layer. The remaining `surfaces.css`, `motion-fx.css`, and `fonts.css` (8 KB total) are small enough to keep.

We could break the tokens into core-tokens.css and extended-tokens.css and that could be a break off point.

---

### Layout Custom Elements + Layout Attributes Overlap: ~25 KB redundant

Analysis shows we have two systems of layout -element and attribute

Both systems exist:
- `<layout-stack>`, `<layout-grid>`, etc. (custom element tags) — 25.5 KB total
- `[data-layout="stack"]`, `[data-layout="grid"]`, etc. (attribute system) — 48.3 KB total

They implement the same layouts with nearly identical CSS. Sites typically use one approach or the other.

**Opportunity:** Offer layout custom elements as an optional add-on rather than bundling both systems. Most VB-conformant sites prefer `data-layout` on semantic elements (per the VB refinement pass checklist), making the custom element tags redundant for them.

**Estimated savings:** ~25 KB raw if custom element layouts become opt-in.

The problem I have with this is some things can only easily by done one way or the other.  The attribute tends to be more compact and attachs to native, but in some cases it would force a wrapper div.

---

###  Build System: No Tree-Shaking or Code Splitting

We have a build system here -https://vb.test/docs/configure/ but there is always room for improvement.
Tree-Shakable Exports (future)

Instead of a single bundle, publish individual ES module entry points:

```js
// Users import only what they need
import 'vanilla-breeze/components/tabs';
import 'vanilla-breeze/utils/mask';
```

This requires a `package.json` exports map and works with bundlers (Vite, webpack) but not with direct `<script>` tags. It's complementary to Tier 2/3, not a replacement.

import maps may close a gap. The doc says tree-shakable exports "works with bundlers but not  with direct <script> tags," but import maps give you bare-specifier resolution natively in the browser:

  <script type="importmap">
  {
    "imports": {
      "vanilla-breeze/": "/cdn/modules/"
    }
  }
  </script>

  <script type="module">
  import 'vanilla-breeze/components/tabs.js';
  import 'vanilla-breeze/utils/mask.js';
  // browser only fetches these two — nothing else
  </script>

The browser resolves the specifiers and only downloads what's imported. It's tree-shaking at the network
level without a build step.

A few practical considerations:

- Browser support is solid — Chrome 89+, Firefox 108+, Safari 16.4+. By Feb 2026 this is baseline.
- No wildcard imports — import maps don't support "vanilla-breeze/*" glob patterns, so either you use a
  trailing-slash prefix mapping (like above) where paths map 1:1, or you enumerate each module explicitly.
- It blurs Tier 3 and Tier 4 — the autoloader (Tier 3) watches the DOM and dynamically imports
  components. Import maps could back those dynamic imports, so the autoloader's
  import('/cdn/components/geo-map.js') could instead be import('vanilla-breeze/components/geo-map.js')
  resolved via the map. The two tiers become complementary rather than sequential.
- Still requires per-component build outputs — each component needs to be a standalone ES module file,
  same prerequisite as Tier 3.

So import maps don't eliminate the build work (you still need individual module files), but they do
eliminate the "bundler required" limitation for Tier 4. A non-bundler user gets the same selective
loading that a Vite/webpack user gets via tree-shaking.

---

## FOUC Avoidance

Flash of unstyled content is even worse that byte count between CSS :not(defined) and other mechanisms we need to watch out for this especially as bundle sizes grow


To avoid a flash of default-themed content while the external CSS loads, add a blocking `<link rel="preload">` in the HTML for sites that know their theme at build time:

```html
<!-- For a site permanently using the "ocean" theme -->
<link rel="preload" href="/cdn/themes/ocean.css" as="style" />
<link rel="stylesheet" href="/cdn/themes/ocean.css" />
```

For dynamic theme selection (user picks in `theme-wc`), the brief load is acceptable — it's a one-time cost per theme, then cached.

