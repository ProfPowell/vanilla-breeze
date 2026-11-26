# Declarative shadow DOM for VB components and Cook

Tracker: vanilla-breeze-i9c0. Researched 2026-11-25 by reading source and the existing `site/dist` output. No build, test or browser run was made.

## Recommendation

**Adopt for two named components at most: `score-card` now, `icon-wc` only after a restructure. Do not adopt as a framework pattern.**

95 of VB's 102 registered tags are light DOM and DSD cannot touch them. Of the 7 shadow components, 5 render JS-computed or JS-dependent UI where a server-rendered root would be empty or dead. Cook already has two DSD paths, so the Cook cost is small. The real cost is payload: the docs site already ships DSD for `<code-block>`, and those templates are 51.4 MB of the 83.4 MB of built HTML, 43.3 MB of it one repeated stylesheet. Any VB adoption must keep styles out of the per-instance template.

## Findings

### 1. Can DSD eliminate the upgrade flash?

Only for 7 tags.

- `src/web-components/` has 98 component directories registering 102 tags. `attachShadow` appears in 7 files: `icon-wc/icon-wc.js`, `score-card/logic.js`, `audio-player/logic.js`, `video-player/logic.js`, `audio-visualizer/logic.js`, `geo-map/logic.js`, `chart-wc/logic.js`. The other 95 tags are light DOM.
- `chart-wc` attaches its root to an inner `div[data-chart-svg]` it creates in JS, not to the host.
- `src/lib/vb-element.js` (168 lines) has no shadow, template or style handling: a `data-upgraded` guard, `listen()`, `setup()`/`teardown()`, `ElementInternals` state.
- Light-DOM styles arrive in the render-blocking stylesheet via `src/web-components/index.css`, in the `web-components` layer declared at `src/main.css:45`. They apply before upgrade. 66 CSS files carry 94 `:not(:defined)` rules, plus `hide-until-ready` in `src/utils/readiness.css`.
- Shadow styles are a `<style>` string set through `innerHTML`. Only `geo-map/styles.js` uses `adoptedStyleSheets` on a shadow root.

For light-DOM components the flash is JS injecting or rearranging light DOM. DSD does not address that. For the 7, the shadow tree does not exist until the module runs (all layouts load `type="module"` scripts), so DSD would remove that gap, if the root's content can be known at build time.

### 2. Which components benefit?

Built-site usage (`site/dist/pages`, 2,011 HTML files):

| Rank | Component | Instances / pages | Verdict |
|---|---|---|---|
| 1 | `score-card` | 54 / 10 | Best fit. Root is a static shell of named slots; `setup()` already has `if (!this.shadowRoot)` and a reuse branch. Blocker: `styles.js` is 8.3 KB per instance. |
| 2 | `icon-wc` | 4,941 / 685 | Largest win, hardest. The SVG is fetched at runtime, so the build must inline it per `name`/`set`. The constructor calls `attachShadow` unconditionally, which empties a declarative root. I found no light-DOM rule sizing the host, so its box appears to change on upgrade (grep only). `[data-icon]` (`src/custom-elements/icon-attributes.css`) is already a zero-JS icon path. |
| 3 | `audio-player`, `video-player` | 17 / 6, 13 / 7 | Poor. DSD would paint custom controls that do nothing until JS, replacing working native `controls`. |
| 4 | `geo-map`, `chart-wc`, `audio-visualizer` | 32, 25, 8 | None. Tiles, computed SVG and canvas need JS. |

### 3. What Cook must change

Little. Cook (source 2.13.0; the site has 2.2.3 installed, which already includes both files) has:

- `scripts/plugins/declarative-shadow-dom.js`: reads a JSON manifest (tag to shadow HTML), substitutes `${attr:name}`, injects `<template shadowrootmode="open">` as first child. Off by default (`dsd: { enabled: false, manifest: null }`); `site/config/main.js` does not set it. VB has no manifest.
- `scripts/plugins/replace-components.js`: a file in `components/` containing `<template shadowrootmode>` is injected into the preserved custom element (tested in `test/dsd-components.test.js`).
- `scripts/plugins/prerender-code-blocks.js`: already emits DSD for `<code-block>`; 3,315 templates on 527 pages.
- Custom plugin hooks `before` / `default` (per file) / `after`, which the site already uses.

Gaps in the manifest plugin:

1. One static string per tag. Per-instance content (an icon's SVG) needs a renderer function, or a VB plugin in `site/plugins/` (no Cook change).
2. `${attr:name}` values are inserted unescaped.
3. The skip check uses `el.querySelector('template[shadowrootmode]')`, which matches descendants, so a host containing another DSD component is skipped. `replace-components.js` checks direct children.
4. No style sharing across instances.

The `static.html` files are unrelated to this pipeline. There are 98, one per component, required by `scripts/quality/component-files-check.js`; no build step reads them. They document the light-DOM markup an author writes and how it behaves without JS. DSD would describe the other tree, the shadow root. Demos are built by `scripts/build-demos.js` after Cook, so they would not get DSD (inferred from `package.json` script order).

### 4. Complement or conflict?

Complement for `score-card`: its `static.html` is slotted children directly under the host, which is what a declarative root needs. Conflict for the media players: their fallback is working native controls, and a declarative root replaces that with inert chrome. Irrelevant for the 95 light-DOM tags. DSD should stay an exception for shells with no behaviour.

### 5. Browser support

From MDN browser-compat-data, fetched 2026-11-25 (Chrome / Firefox / Safari):

| Feature | Versions |
|---|---|
| `shadowrootmode` | 111 / 123 / 16.4 |
| `shadowrootclonable` | 124 / 125 / 18 |
| `shadowrootdelegatesfocus` | 123 / 123 / 18 |
| `shadowrootserializable`, `getHTML()` | 125 / 128 / 18 |
| `setHTMLUnsafe()` | 124 / 123 / 26 |
| `Document.parseHTMLUnsafe()` | 124 / 128 / 26 |

- MDN lists `setHTMLUnsafe` as Baseline newly available since September 2025. web.dev gives 5 August 2024 for DSD itself.
- Streaming: the root attaches when the parser meets the opening `<template>` tag, so content renders as it arrives (web.dev).
- `innerHTML` and `insertAdjacentHTML` do not create shadow roots; the template stays an inert `<template>`. This affects `include-file` and anything else injecting HTML at runtime.
- `attachShadow()` on a host with a declarative root does not throw; it empties and returns the root (web.dev).
- Polyfill: not needed. Without DSD the template is ignored and the component builds its root as today. Components must then remove the leftover `<template>` child.

Unverified: release dates per version; behaviour in a real browser.

### 6. SSR/SSG impact

- **Per-instance style duplication.** Measured on the existing `code-block` output: the home page has 4 templates totalling 69 KB of a 111 KB page, each with an identical 13,075-byte `<style>`. web.dev says identical sheets are parsed once, so the cost is bytes. Compressed transfer size is unverified.
- **`adoptedStyleSheets`** cannot be expressed declaratively. Declarative CSS modules (`shadowrootadoptedstylesheets`) are at Chromium origin-trial stage with an open WebKit bug, per search results only; unverified.
- **Lit SSR** (`@lit-labs/ssr`, still Labs) emits a declarative root per instance, requires its hydrate-support module to load before `lit`, and hides the page with a `dsd-pending` body attribute for browsers needing the polyfill (lit.dev). Not checked against Lit source.
- **Hydration.** VB has no template or reactivity layer, so each component needs a hand-written reuse branch. `score-card` has one; the other six do not.
- **Tokens and `@layer`.** Custom properties inherit into shadow roots, and the shadow styles already read VB tokens. Layers do not cross the boundary, so server-rendered shadow styles sit outside VB's layer order, as they do today.

## If we proceed

Smallest experiment: `score-card`.

1. **VB:** move `:host` rules that can be light DOM into a `score-card` rule in the `web-components` layer, so the shadow `<style>` is minimal. Replace `:state(trend-*)` selectors that must work before upgrade with `:host([trend=…])`. Emit `dsd-manifest.json` for `score-card` from the `TEMPLATE` string in `logic.js` during `build:cdn`.
2. **Cook:** no code change. Set `dsd: { enabled: true, manifest: … }` in `site/config/main.js`. Fix gaps 2 and 3 before going further.
3. **Measure:** a Playwright spec loading one `score-card` docs page with and without DSD, with the JS bundles delayed 2 s by route interception. Record the host's bounding box at `DOMContentLoaded` and after `score-card:upgraded`, plus `layout-shift` entries, and the page's byte delta. Pass: no box change and no layout shift with DSD, and under 1 KB added per instance.

Go on to `icon-wc` only if step 3 passes and the per-instance template can be reduced to the bare `<svg>`.
