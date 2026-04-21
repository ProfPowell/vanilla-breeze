# `<markdown-viewer>` Web Component Spec

**Project:** Vanilla Breeze  
**Type:** Core Component  
**Status:** Planning  
**Companion:** `<markdown-editor>` (separate, Phase 4)

---

## Overview

A platform-native markdown viewer custom element. Inspired by `<zero-md>` but rearchitected around Vanilla Breeze's platform-first philosophy: light DOM rendering, progressive enhancement, pluggable parser, and full VB theming integration.

---

## Design Decisions vs `<zero-md>`

| Concern | `<zero-md>` | `<markdown-viewer>` |
|---|---|---|
| DOM model | Shadow DOM always | Light DOM default |
| Styling | Injected shadow stylesheets | VB cascade applies natively |
| Parser | Hardcoded `marked` | Pluggable, `marked` as lazy default |
| Sanitization | None | HTML Sanitizer API (platform) |
| Syntax highlight | `highlight.js` bundled | Event-based hook, BYO |
| Mermaid | None | Post-render event pattern |
| VB theme | None | `data-theme` propagation |
| VB effects | None | `markdown-viewer:rendered` triggers scan |
| Analytics | None | `ping` attribute |
| Lazy loading | None | `loading="lazy"` via IntersectionObserver |
| Progressive fallback | None | `<pre>` slot renders raw markdown without JS |

### Why Light DOM

Shadow DOM is zero-md's biggest friction point. VB's CSS cascade, `data-theme`, custom properties, and component styles can't reach shadow-rendered content. With light DOM, headings use VB's heading styles, code blocks use VB's code tokens, callouts use VB's alert styles — all for free, zero extra effort.

Shadow DOM remains available as opt-in via `shadow` attribute for strict style isolation use cases.

---

## Element Name

```html
<markdown-viewer></markdown-viewer>
```

Short, readable, valid custom element name. Splits the word naturally at the required hyphen.

---

## Content Slots (Priority Order)

The element resolves content using this chain, in order:

### 1. `src` attribute — external file

```html
<markdown-viewer src="./changelog.md" loading="lazy"></markdown-viewer>
```

Fetched via `fetch()`. CORS rules apply. On error fires `markdown-viewer:error`.

### 2. `<script type="text/markdown">` — inline, hidden

```html
<markdown-viewer>
  <script type="text/markdown">
    # Hello world
    This is **inline** markdown.
  </script>
</markdown-viewer>
```

Browser does not execute or render it. No fallback without JS. No crawler indexability.

### 3. `<template data-md>` — inline, inert

```html
<markdown-viewer>
  <template data-md>
    # Hello world
  </template>
</markdown-viewer>
```

Inert DOM node. Framework-friendly. No fallback without JS.

### 4. `<pre>` — inline, progressive enhancement ✅ **recommended for inline use**

```html
<markdown-viewer>
  <pre>
# Hello world

This is **inline** markdown with a graceful fallback.
  </pre>
</markdown-viewer>
```

The recommended inline slot. `<pre>` renders visible raw markdown text if JS fails or is
disabled — legible, indexable by search engines, accessible to screen readers. Once JS
renders, the `<pre>` is hidden via `display: none` using `data-rendered` on the host.

| Slot | JS disabled | Crawlable | Recommended for |
|---|---|---|---|
| `src` | Nothing visible | No | External files |
| `<script type="text/markdown">` | Nothing visible | No | Inline, build-time content |
| `<template data-md>` | Nothing visible | No | Framework-generated content |
| **`<pre>`** | Raw markdown text ✅ | Yes ✅ | **Progressive enhancement** |

CSS to support the `<pre>` slot:

```css
@layer markdown-viewer {
  markdown-viewer > pre {
    font-family: inherit;
    white-space: pre-wrap;
  }
  markdown-viewer[data-rendered] > pre {
    display: none;
  }
}
```

---

## Rendered DOM Structure

```html
<markdown-viewer src="./doc.md" data-rendered>
  <div class="md-content" part="content">
    <!-- parsed HTML rendered here -->
  </div>
</markdown-viewer>
```

- `data-rendered` stamped on host after successful render
- `part="content"` exposes `::part()` hook for external styling
- Light DOM by default; `shadow` attribute opts into Shadow DOM

---

## Attribute API

| Attribute | Type | Default | Description |
|---|---|---|---|
| `src` | string | — | URL of external markdown file |
| `loading` | `eager` \| `lazy` | `eager` | `lazy` defers fetch until in viewport via IntersectionObserver |
| `sanitize` | boolean | `false` | Run output through HTML Sanitizer API before render |
| `shadow` | boolean | `false` | Opt into Shadow DOM for strict style isolation |
| `data-copy-code` | boolean | `false` | Inject copy buttons on all code blocks post-render |
| `ping` | string | — | URL to ping with render metadata (mirrors VB analytics pattern) |
| `data-theme` | string | — | Propagated to `.md-content`, enabling VB theme cascade |

---

## Parser API

`marked` is the default parser, loaded via dynamic import on first render — zero bytes loaded if
a custom parser is supplied. Override with any function that accepts a markdown string and
returns an HTML string:

```js
// Swap out the parser entirely
document.querySelector('markdown-viewer').parser = (md) => myRenderer(md)

// Or configure marked extensions (applied globally to all instances using the default parser)
import { marked } from 'marked'
import { markedAlert } from 'marked-alert'
marked.use(markedAlert())
```

GFM is enabled by default (`{ gfm: true }`). This gives tables, task lists (`- [x]`),
strikethrough (`~~text~~`), autolinks, and fenced code blocks with language hints at zero cost.

---

## Extended Markdown Support

### GFM — free, zero config

Tables, task lists, strikethrough, autolinks, fenced code with language attribute — all from
`marked` with `gfm: true`.

### Mermaid — lazy, event-driven

`marked` outputs fenced mermaid blocks as:

```html
<pre><code class="language-mermaid">graph TD A --> B</code></pre>
```

The component fires `markdown-viewer:rendered`. An optional VB integration module handles the rest:

```js
// vb-mermaid.js — import separately, never bundled into the component
document.addEventListener('markdown-viewer:rendered', ({ detail }) => {
  const diagrams = detail.node.querySelectorAll('code.language-mermaid')
  if (diagrams.length) {
    import('mermaid').then(m => m.default.run({ nodes: diagrams }))
  }
})
```

Mermaid (~2MB) is never loaded unless a rendered `<markdown-viewer>` actually contains a mermaid block.

### Syntax Highlighting — event hook

```js
// vb-highlight.js — or consumer's own
document.addEventListener('markdown-viewer:highlight', ({ detail }) => {
  // detail.node     = the <code> element
  // detail.language = e.g. "javascript"
  hljs.highlightElement(detail.node)
})
```

The `highlight` attribute opts the element into firing per-block events. Consumer brings their
own highlighter — the component has no opinion.

### VB Callout Blocks — marked extension

```markdown
:::warning
This is a warning callout.
:::
```

Registered as a `marked` extension in `markdown-viewer-vb-extensions.js`, outputs native VB markup:

```html
<div role="note" data-kind="warning" class="callout">...</div>
```

Approximately 15 lines. Separate import, not bundled into the core element.

### Math (KaTeX) — same pattern as Mermaid

Post-render scan for `code.language-math`, lazy dynamic import of KaTeX, render in place.

---

## Events

All events bubble. Listening at `document` level covers all instances — clean pattern for
Mermaid, highlight, and any other post-render integrations.

| Event | `detail` | Fired when |
|---|---|---|
| `markdown-viewer:fetch` | `{ src }` | Fetch begins |
| `markdown-viewer:rendered` | `{ src, node }` | Parse and render complete |
| `markdown-viewer:highlight` | `{ node, language }` | Per code block, if `highlight` attr set |
| `markdown-viewer:error` | `{ error }` | Fetch or parse failure |

---

## VB Integration

### Theme propagation

```js
// Inside connectedCallback / render
const theme = this.dataset.theme
  ?? this.closest('[data-theme]')?.dataset.theme
if (theme) contentEl.dataset.theme = theme
```

### `@layer` cascade position

```css
@layer markdown-viewer; /* declared below vb-components, above vb-base */
```

VB component and token styles always win over markdown base styles.

### Effects system

`markdown-viewer:rendered` fires with `detail.node`. VB's effect scanner listens and activates any
`data-*` declarative effects found inside rendered markdown content — same as any other VB component.

---

## File Structure

```
vanilla-breeze/
  components/
    markdown-viewer/
      markdown-viewer.js                  # element definition, ~150 lines
      markdown-viewer.css                 # @layer markdown-viewer base styles
      markdown-viewer-vb-extensions.js   # VB callout/alert marked extensions
      vb-mermaid.js                # optional mermaid integration module
      README.md
```

No build step. Single ES module. Drop-in via `<script type="module">`:

```html
<script type="module" src="/components/markdown-viewer/markdown-viewer.js"></script>
```

---

## Phase Plan

### Phase 1 — Core viewer

- Custom element definition, `connectedCallback`, `attributeChangedCallback`
- Slot resolution chain: `src` → `<script type="text/markdown">` → `<template data-md>` → `<pre>`
- Light DOM render into `.md-content`
- Dynamic import of `marked` as default parser, GFM enabled
- `markdown-viewer:rendered` event dispatch
- `data-rendered` attribute stamped on host
- `<pre>` slot hidden via CSS after render

### Phase 2 — VB integration

- `data-theme` propagation to `.md-content`
- `@layer markdown-viewer` stylesheet with VB token usage
- VB callout extension (`:::type` blocks → VB alert markup)
- `ping` analytics attribute
- `markdown-viewer:rendered` consumed by VB effects scanner

### Phase 3 — Enhancements

- `loading="lazy"` — IntersectionObserver-based deferred fetch
- `sanitize` — HTML Sanitizer API, graceful no-op where unsupported
- `data-copy-code` — copy buttons injected on code blocks post-render
- `markdown-viewer:highlight` per-block events (gated by `highlight` attribute)
- `shadow` opt-in attribute

### Phase 4 — `<mark-editor>` companion

Separate component, separate file, separate import. `<textarea>` + `<markdown-viewer>` preview
side-by-side. Uses VB split layout primitives. Emits standard `change` event on the textarea.
Does not re-bundle the viewer — imports `<markdown-viewer>` as a peer.

---

## Open Questions

1. Should `sanitize` default to `true` (security-first), with an explicit `unsanitized` opt-out? - Sanitize first
2. Should the default `marked` import be resolved from an importmap entry so the host page controls the version — avoiding double-bundling if the consumer already uses `marked`?
3. `<markdown-editor>` toolbar — VB declarative `data-*` pattern or imperative JS API? - BOTH!
