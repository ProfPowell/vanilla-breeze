# MDN Front-End Deep Dive: Findings for Vanilla Breeze

**Source:** [Under the Hood of MDN's New Frontend](https://developer.mozilla.org/en-US/blog/mdn-front-end-deep-dive/) — Leo McArdle, Apr 8 2026 (23 min read)

**TL;DR:** MDN ditched React for Web Components (Lit), built custom Server Components, lazy-loads JS per tag, ships per-component CSS, and uses Declarative Shadow DOM for flash-free progressive enhancement. Their new dev environment starts in 2 seconds. Many of their conclusions validate VB's architecture; a few reveal gaps worth closing.

---

## Article Summary

MDN's old frontend was a Create React App that had accumulated painful debt: 2-minute startup, tangled Sass+CSS, a render-blocking CSS monolith, `dangerouslySetInnerHTML` to inject static content, and duplicate implementations (React + raw DOM). They rebuilt around these pillars:

1. **Web Components via Lit** — islands of interactivity in otherwise static HTML
2. **Custom Server Components** — Lit's `html` template literal rendered to HTML in Node, output includes Declarative Shadow DOM
3. **Lazy-load by tag scan** — `querySelectorAll("*")` finds `mdn-*` tags, triggers `import()` per component
4. **Per-component CSS** — `ServerComponent` tracks which components render; only their CSS appears in `<head>`
5. **Progressive enhancement** — components work before JS loads via DSD + `:not([loaded])` CSS fallbacks
6. **Baseline as guardrails** — Widely Available = ship it; Newly Available = polyfill; Limited = discuss first
7. **HTTP/2+ small-file strategy** — many small bundles beat one big one for caching and parallel download
8. **Rspack** — Webpack-compatible Rust bundler; 650-line config; 2-second startup

---

## Where VB Already Aligns

These are areas where vanilla-breeze already matches or exceeds MDN's approach.

| MDN Practice | VB Equivalent | Notes |
|---|---|---|
| Web Components, no framework | `VBElement` base class, 90 components, zero deps | VB goes further — no Lit dependency at all |
| Progressive enhancement | `:not(:defined)` fallbacks on 20+ components | Same philosophy, different mechanic (`:not(:defined)` vs `:not([loaded])`) |
| Cascade layers for CSS scoping | 9-layer `@layer` system | VB's layer architecture is more comprehensive than MDN's approach |
| Component-level CSS isolation | Each WC has its own `styles.css` in its layer | MDN tracks server-rendered components; VB uses cascade layers |
| View Transitions API | `swap-transition.js`, `view-transition-init.js`, carousel/tab-set support | VB has declarative `data-vt-name` — MDN uses it via html-star-style navigation |
| Modern CSS features | `@property`, `:has()`, nesting, container queries, OKLCH, logical props | VB uses more modern CSS than MDN does |
| `prefers-reduced-motion` | Checked in both CSS and JS across all animated components | Parity |
| Native element styling | 48 native elements styled semantically | MDN doesn't invest here — VB is far ahead |
| `<dialog>` and popover | First-class styling + WC integration | Same |

**Verdict:** VB's HTML-first, zero-dependency approach is philosophically stronger than MDN's Lit-based model. The cascade layer system is more sophisticated than anything MDN describes.

---

## Opportunities Worth Exploring

### 1. Lazy-Load Components by DOM Presence

**What MDN does:** Scans the DOM for `mdn-*` tags and `import()`s only those component scripts.

```js
for (const element of document.querySelectorAll("*")) {
  const tag = element.tagName.toLowerCase();
  if (tag.startsWith("mdn-")) {
    import(`../components/${tag.replace("mdn-", "")}/element.js`);
  }
}
```

**VB today:** Ships a monolithic `vanilla-breeze.js` (or pack-level bundles). All component JS loads whether used or not.

**Opportunity:** VB already has per-component JS files in `src/web-components/*/logic.js`. A thin loader could scan for VB custom element tags and dynamically import only what's on the page. The `bundle-registry.js` already has the tag-to-module mapping.

**Toolchain angle:** **cook** could generate a manifest of which components appear per page at build time and inject only those `<script>` tags — no runtime scan needed. This is better than MDN's approach because it's zero-JS overhead.

**Impact:** High. Reduces JS payload for pages using 3-4 components from the full bundle to just those components.

---

### 2. Declarative Shadow DOM for Server-Rendered Components

**What MDN does:** Renders Lit components to DSD in Node so components appear styled before JS loads. No layout shift.

**VB today:** Components use light DOM with `:not(:defined)` CSS fallbacks. No shadow DOM, no DSD.

**Opportunity:** VB's light-DOM approach is arguably better for most cases (style inheritance, CSS layers work naturally). But for components that *do* encapsulate (e.g., `code-block`, `browser-window`, `markdown-viewer`), DSD could eliminate the flash of unstyled content.

**Toolchain angle:** **cook** already has DSD support (`plugins/` pipeline). It could pre-render shadow roots for select VB components at build time. This is a selective adoption — not all-or-nothing.

**Impact:** Medium. Most VB components benefit from light DOM; a few encapsulated ones would benefit from DSD.

---

### 3. Per-Page CSS Loading

**What MDN does:** Tracks which server components rendered and injects only their `<link>` tags into `<head>`.

**VB today:** Ships `vanilla-breeze.css` as a monolith. Theme packs add their full CSS.

**Opportunity:** Since VB already organizes CSS by component (`web-components/*/styles.css`, `native-elements/*/styles.css`), a build step could analyze each page's HTML and produce a page-specific CSS bundle containing only the layers/components used.

**Toolchain angle:** **cook** processes each page through its plugin pipeline. A plugin could:
1. Parse the rendered HTML for element tags
2. Map tags to their CSS source files
3. Bundle only those files (preserving layer order)
4. Inject as a `<link>` or inline `<style>`

**Impact:** High for sites using a subset of VB. The full CSS is already organized for this — the tooling just doesn't exist yet.

---

### 4. Baseline Adoption Framework

**What MDN does:** Uses the WebDX Baseline system to categorize feature risk:
- **Widely Available** — use freely
- **Newly Available** — discuss polyfill/progressive enhancement
- **Limited** — think carefully, discuss first

**VB today:** Uses `@supports` for some features (CSS shapes, `contrast-color`, `initial-letter`). No formal policy.

**Opportunity:** Document VB's feature tiers explicitly. Many VB features are already Baseline Widely Available (custom elements, shadow DOM, cascade layers, nesting, `:has()`). Some are Newly Available (`@property`, `light-dark()`, popover). A few are Limited (CSS shapes, `contrast-color`). Making this explicit helps users assess risk.

**Toolchain angle:** The doc site could show Baseline badges on component pages, similar to MDN's own component tables.

**Impact:** Medium. Primarily a documentation/communication improvement.

---

### 5. Flat Component File Convention

**What MDN does:** Each component is a flat directory:
```
components/example-component/
  element.css
  element.js
  global.css
  server.css
  server.js
```

**VB today:** Similar but different naming:
```
web-components/example-wc/
  logic.js
  styles.css
  api.json
  static.html
```

**Observation:** VB's convention is already clean. The `api.json` manifest and `static.html` fallback are additions MDN doesn't have — they're strengths. No change needed, but worth noting the validation.

---

### 6. HTTP/2+ Small-File Bundling Strategy

**What MDN does:** Embraces many small files over monolithic bundles. Each component is a separate cacheable unit. Browser downloads in parallel; returning visitors get cache hits on unchanged components.

**VB today:** CDN build produces monolithic files (`vanilla-breeze.js`, `vanilla-breeze.css`) plus pack-level bundles and individual component files.

**Opportunity:** The individual component files already exist in `dist/cdn/components/`. The missing piece is a recommended loading pattern that uses them. A `<script type="module">` loader or import map could let sites cherry-pick components.

**Toolchain angle:** **html-star** could handle this naturally — its prefetch system could preload component scripts for elements about to enter the viewport.

**Impact:** Medium-high. The assets exist; the developer ergonomics for using them don't.

---

### 7. Single-Command Dev Experience

**What MDN does:** `npm run start` — 2 seconds to a working environment with SSR parity.

**VB today:** Multiple commands for different concerns (`npm run build`, Caddy for HTTPS, 11ty for docs). Startup is slower.

**Opportunity:** A unified `npm run dev` that starts Vite dev server + 11ty watch + Caddy proxy in one command. The pieces exist; they just aren't orchestrated.

**Impact:** Low-medium. Developer experience improvement, not a user-facing change.

---

## Toolchain Role Map

How each tool in the ecosystem connects to these opportunities:

| Tool | Role in MDN-Inspired Improvements |
|---|---|
| **vanilla-breeze** | Component library — already well-positioned; needs lazy-load entry point and per-page CSS tooling |
| **cook** | SSG — build-time component analysis, per-page CSS extraction, optional DSD pre-rendering. Cook's plugin pipeline is the natural place for page-level optimization |
| **html-star** | Hypermedia layer — component prefetch on hover/visible, SPA navigation with view transitions, lazy component loading triggered by `data-trigger="visible"` |
| **montane** | Reactive layer — signals for component state, offline-first data for VB data components (data-table, chart-wc), sync queue for form components |

### Specific Integration Ideas

**cook + VB lazy loading:**
Cook knows every element on every page at build time. Instead of a runtime DOM scan (MDN's approach), cook can emit a per-page `<script>` that imports exactly the components used. Zero runtime overhead.

**html-star + VB component prefetch:**
When html-star navigates to a new page (SPA-style), it could parse the incoming HTML fragment for VB tags and prefetch their JS before swapping — eliminating the component-loading delay MDN accepts.

**montane + VB reactivity:**
MDN uses Lit's reactive properties. VB uses manual DOM manipulation. For complex components (data-table filtering, chart updates), montane's signals could provide fine-grained reactivity without adding Lit as a dependency.

---

## Action Items (Ranked by Impact)

### High Impact
1. **Build a VB component loader** — thin script that scans DOM for VB tags and dynamic-imports their individual JS files from CDN. Optionally, cook generates the import list at build time instead.
2. **Add per-page CSS extraction to cook** — plugin that analyzes rendered HTML and bundles only the CSS for elements present on the page.

### Medium Impact
3. **Document Baseline tiers** — classify every VB feature/component by Baseline status on the doc site.
4. **Add import map support** — generate an import map for VB components so sites can use bare specifiers (`import "vb/accordion"`) resolved to CDN paths.
5. **html-star component prefetch** — when navigating SPA-style, prefetch VB component JS for the target page.

### Lower Impact
6. **Selective DSD for encapsulated components** — experiment with DSD for `code-block`, `browser-window`, `markdown-viewer` via cook's existing DSD support.
7. **Unified dev command** — orchestrate Vite + 11ty + Caddy in a single `npm run dev`.
8. **montane signals for complex WCs** — prototype signals-based reactivity in `data-table` or `chart-wc`.

---

## Key Takeaway

MDN's rebuild validates VB's core philosophy: web components, progressive enhancement, platform APIs over frameworks. Where MDN needed Lit to get there, VB arrived with zero dependencies. The biggest gaps aren't architectural — they're in **delivery optimization** (lazy loading, per-page CSS) and **toolchain integration** (cook doing build-time what MDN does at runtime). The pieces exist across cook, html-star, and montane; they just need to be wired together.
