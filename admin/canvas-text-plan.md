# Plan: `@profpowell/canvas-text` — stand-alone web component wrapping `render-tag`

> Status: draft, ready to bootstrap a repo
> Companion docs: [render-tag-rnd.md](./render-tag-rnd.md), [meme-maker-plan.md](./meme-maker-plan.md)
> Authored: 2026-05-14

## Goal

A tiny, dependency-light web component — `<canvas-text>` — that takes a
rich-text HTML snippet (slot or attribute) and paints it onto an internal
`<canvas>` via [`render-tag`](https://polotno.com/render-tag/). Output is
both an in-DOM canvas the page can use directly and an imperative API
(`toBlob`, `toDataURL`, `getCanvas`) so consumers can export.

Lives in its own repo. Vanilla Breeze-compatible (reads VB theme tokens
when present) but stands alone — does not depend on VB at runtime.

## Why a stand-alone package

- Mirrors the VB precedent for `@profpowell/code-block` and
  `@profpowell/browser-window` — load-bearing primitives that VB uses
  but does not own.
- Keeps `render-tag`'s pre-1.0 churn off VB's release cadence.
- Reusable outside VB (any HTML page, any framework).
- Becomes the foundation for `meme-maker` (and any future canvas-text
  consumer: OG cards, screensavers, sticker tools).

## Scope

**In**
- Custom element `<canvas-text>` rendering a single rich-text block.
- Synchronous-feeling render via `render-tag` (layout + paint).
- Auto-render on connect, attribute change, slot mutation.
- Theme bridge: opt-in copy of CSS custom properties into the render input.
- Public methods: `getCanvas()`, `toBlob()`, `toDataURL()`.
- TypeScript types and ESM-only distribution.
- A11y: optional `alt`-style fallback DOM for screen readers.

**Out**
- Image rendering (no `<img>` support — consumers composite externally;
  see `meme-maker-plan.md`).
- Animation, scroll-driven render, view transitions.
- Server-side / node usage in v1. (Pluggable canvas factory pattern keeps
  the door open for v2.)
- Interactive editing (caret, selection). Render only.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│ <canvas-text width="600" theme="inherit">               │
│   <strong>Hello</strong> world                          │
│ </canvas-text>                                          │
│                                                         │
│   ▼ (on upgrade / mutation / attr-change)               │
│                                                         │
│ 1. read slot innerHTML or [html] attribute              │
│ 2. if theme=inherit, getComputedStyle(host) → inline    │
│ 3. render-tag.render({ html, width, … })                │
│ 4. replace internal <canvas> with returned one          │
│ 5. emit canvas-text:rendered                            │
│                                                         │
│  ┌────────────────────────────────────────┐             │
│  │ <canvas>                               │             │
│  │   (rasterized rich text)               │             │
│  └────────────────────────────────────────┘             │
│  + offscreen fallback DOM (visually hidden, AT-visible) │
└─────────────────────────────────────────────────────────┘
```

Internals are light DOM (consistent with VB style). No shadow DOM in v1
— shadow DOM hides the source HTML from accessibility tools and the
fallback DOM trick gets harder. Revisit if encapsulation becomes a real
need.

## Element API

### Attributes

| Attribute | Type | Default | Description |
|---|---|---|---|
| `html` | string | — | Rich-text HTML to render. If omitted, falls back to slotted children. |
| `width` | number | `600` | Canvas width in CSS pixels. |
| `height` | number | auto | Optional fixed height; otherwise computed from layout. |
| `theme` | `inherit` \| `none` \| `inline` | `inherit` | Theme bridge mode (see below). |
| `accuracy` | `default` \| `balanced` | `default` | Passed through to `render-tag`. |
| `lang` | string | host `lang` | Hint for bidi / CJK. |
| `dpr` | number | `auto` | Device pixel ratio override; `auto` reads `window.devicePixelRatio`. |
| `format` | `png` \| `jpeg` \| `webp` | `png` | Default MIME for `toBlob`/`toDataURL`. |
| `data-upgraded` | (set by element) | — | Reflects "first render complete". Follows VB convention. |

### Slots

- **default slot** — rich-text content. Read once at upgrade, then again
  on `MutationObserver` slot changes. Element name allows `<strong>`,
  `<em>`, `<u>`, `<s>`, `<span style="…">`, headings, lists, etc., per
  `render-tag`'s supported surface.

### Methods

```ts
getCanvas(): HTMLCanvasElement;
toBlob(type?: string, quality?: number): Promise<Blob>;
toDataURL(type?: string, quality?: number): string;
render(): void;  // force a re-render
```

### Events

| Event | Detail | When |
|---|---|---|
| `canvas-text:rendered` | `{ width, height, durationMs }` | After each successful render |
| `canvas-text:error` | `{ error }` | If `render-tag` throws |

## Theme bridge (the VB-friendly bit)

`render-tag` resolves styles from inline `style="…"` attributes on the
HTML it receives. It does **not** know about CSS custom properties, the
cascade, or external stylesheets.

To make `<canvas-text>` feel native inside VB (or any tokenized design
system), we read **a small allowlist** of computed properties from the
host element and inline them onto the snippet's root before handing to
`render-tag`.

Allowlist (v1):

```
color
font-family
font-size
font-weight
font-style
line-height
letter-spacing
text-align
background-color
```

Modes:

- `theme="inherit"` (default) — copy the allowlist from
  `getComputedStyle(host)` and prepend as an inline `style=` on the
  outer wrapper passed to `render-tag`. Authors get VB tokens
  automatically because VB sets these via CSS variables on the cascade.
- `theme="inline"` — assume the consumer has already inlined styles on
  the HTML they passed in. Pass through unchanged.
- `theme="none"` — render with `render-tag`'s defaults only.

This is one-shot at render time. Theme changes after first render are
not observed in v1 (we'd need a `MutationObserver` on `:root` or a
`prefers-color-scheme`-style listener). Document this as a known
limitation; if it becomes a real pain, add a `re-render-on-theme-change`
attribute later.

## Accessibility

Canvas output is opaque to assistive tech. Two complementary mitigations:

1. **Mandatory fallback DOM.** The slotted HTML stays in the light DOM,
   marked `aria-hidden="false"` but visually hidden via `clip-path` or
   `position: absolute; inset-block-start: -9999px`. AT users see the
   actual rich text; sighted users see the canvas. The canvas itself
   gets `aria-hidden="true"`.
2. **`alt` attribute** — optional plain-text fallback for when the
   slotted DOM isn't sufficient (e.g. when the HTML is supplied via the
   `html` attribute and there are no children). Used as
   `<canvas aria-label="…">`.

This is the **non-negotiable** part — if we ship without it, we
contradict every other instinct in the VB philosophy.

## Repo / package shape

```
canvas-text/
  README.md
  LICENSE                  # MIT
  package.json             # name: "@profpowell/canvas-text"
  src/
    canvas-text.ts         # the element
    theme-bridge.ts        # getComputedStyle → inline-style serializer
    index.ts               # registerElement + re-exports
  test/
    canvas-text.test.ts    # vitest + happy-dom for unit
    visual/                # playwright visual baselines
  examples/
    index.html             # static playground
    vb-integration.html    # showcase inside a VB themed page
  vite.config.ts
  tsconfig.json
  .github/workflows/
    ci.yml                 # test + build on PR
    release.yml            # tag → npm publish on main
```

Package metadata:

```json
{
  "name": "@profpowell/canvas-text",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/canvas-text.js",
  "types": "./dist/canvas-text.d.ts",
  "exports": {
    ".": {
      "import": "./dist/canvas-text.js",
      "types": "./dist/canvas-text.d.ts"
    }
  },
  "peerDependencies": {
    "render-tag": "^0.1.7"
  },
  "sideEffects": ["./dist/canvas-text.js"]
}
```

`render-tag` is a `peerDependency` so consumers control the version (and
we don't double-bundle if multiple `@profpowell/*` components pull it).

## Implementation phases

### Phase 0 — Repo bootstrap
- `gh repo create profpowell/canvas-text --public`
- Scaffold with VB conventions: ESM, TypeScript, no build for source,
  Vite for bundling, Vitest, Playwright.
- Add MIT license, README placeholder, GitHub Actions for CI.
- Pin `render-tag@0.1.7` (current latest).

### Phase 1 — Minimum viable element
- `<canvas-text>` class extending `HTMLElement`.
- On `connectedCallback`, read slot or `html` attr, call `render-tag.render`,
  append `<canvas>`.
- Set `data-upgraded` and fire `canvas-text:rendered`.
- Tests: renders simple HTML, sets width, dispatches event.

### Phase 2 — Reactivity
- `observedAttributes`: `html`, `width`, `height`, `theme`, `lang`,
  `accuracy`, `dpr`, `format`.
- `MutationObserver` on the element's child list / character data for
  slot changes.
- Debounce re-render to `requestAnimationFrame` so back-to-back attribute
  flips coalesce.
- Tests: attribute mutation triggers re-render; rapid mutations coalesce
  to one render.

### Phase 3 — Theme bridge
- Implement `theme-bridge.ts` allowlist-based serializer.
- Wire `theme="inherit"` path.
- Example page that loads a VB theme stylesheet and shows the same
  snippet rendered to canvas under three themes.

### Phase 4 — Output API
- `getCanvas()`, `toBlob()`, `toDataURL()`.
- `format` attribute determines the default MIME.
- Tests: `toBlob('image/png')` returns a non-empty PNG; `toDataURL`
  returns a `data:image/png;base64,…` string.

### Phase 5 — Accessibility
- Visually-hidden fallback DOM container; `aria-hidden="true"` on canvas.
- `alt` attribute → `aria-label` on canvas when no slotted children.
- Tests: axe-core clean; AT-visible text matches slot.

### Phase 6 — Polish & ship 0.1.0
- README with installation, basic usage, theme bridge, a11y notes,
  limitations.
- Examples page deployed (GitHub Pages or Cloudflare Pages).
- `npm publish` under `@profpowell/canvas-text@0.1.0`.

### Phase 7 (later) — Optional
- `re-render-on-theme-change` attribute (`MutationObserver` on `:root`).
- Pluggable canvas factory for node-canvas / skia-canvas usage.
- `<canvas-text-pool>` shared layout cache (the two-phase `layout` +
  `drawLayout` API in render-tag) for cases where the same snippet is
  rendered repeatedly.

## Testing strategy

- **Unit (Vitest + happy-dom):** API contract, attribute reactivity,
  theme bridge serialization, event dispatching.
- **Visual (Playwright):** snapshot a small matrix of (html × theme ×
  width) on Chromium. Baselines committed under
  `test/visual/baselines/`.
- **A11y (axe-core in Playwright):** verify the visually-hidden fallback
  is exposed to AT and the canvas itself is `aria-hidden`.
- **Manual:** the `examples/` page is the source of truth for "does this
  feel right in a VB page" — keep it honest by always loading a real VB
  theme stylesheet from the CDN.

## VB compatibility checklist

- Element registers globally; uses `customElements.define` not VB's
  `registerComponent` (we're not depending on VB).
- Light DOM only — VB convention.
- `data-upgraded` set after first render — VB convention.
- Attributes are kebab-case strings — VB convention.
- Events namespaced `canvas-text:*` — VB convention.
- Theme bridge reads CSS custom properties; doesn't assume any specific
  VB token names — works with VB themes by virtue of inheriting computed
  style.
- No reliance on VB's `VBElement` base class, `bundle-registry`, or
  `vb-element` utilities — stand-alone.

## Open questions

1. **Should `html` be reflected as an attribute or only as a property?**
   Long HTML strings as attributes are ugly. Lean: property setter
   accepts strings; attribute mirrors the first ~256 chars and shows
   `[…]` if truncated. Or skip the attribute entirely and require
   property assignment when not using slotted children. Decide during
   Phase 1.
2. **Slot vs. attribute precedence.** If both are set, attribute wins?
   Slot wins? Recommend slot wins (more HTML-first), document loudly.
3. **DPR handling.** `render-tag` accepts a `dpr` option. Default
   `auto` (read `devicePixelRatio` at render). Confirm canvas physical
   size and CSS size diverge as expected.
4. **Naming.** `<canvas-text>` is clean but `canvas-text` (the HTML
   `canvas-text` tag) might collide with future platform additions.
   Alternative: `<rich-canvas>`. Decide before publishing.
5. **License compatibility.** `render-tag` is MIT. We can be MIT
   downstream. Done.

## Risks

- `render-tag` is six weeks old and pre-1.0. **Mitigation:** pin exact
  version, fork-mirror in our org if it goes stale.
- A11y story is a meaningful chunk of the work and easy to skimp on.
  **Mitigation:** Phase 5 is non-negotiable; ship without it = don't ship.
- Bundle size: `render-tag` is ~553 KB unpacked. **Mitigation:** mark as
  peer dep so the consumer chooses; document the cost in the README.
- Theme bridge is one-shot at render. **Mitigation:** document; ship
  re-render-on-theme-change in Phase 7 if anyone asks.

## Definition of done (v0.1.0)

- [ ] `<canvas-text>` renders slotted rich text to a canvas.
- [ ] Attribute changes trigger re-render (coalesced).
- [ ] `theme="inherit"` picks up VB tokens automatically.
- [ ] `toBlob`, `toDataURL`, `getCanvas` work and are typed.
- [ ] Fallback DOM exposes the text to AT; axe-core clean.
- [ ] README explains install, theme bridge, a11y, limitations.
- [ ] Examples page deployed.
- [ ] Published to npm as `@profpowell/canvas-text@0.1.0`.
