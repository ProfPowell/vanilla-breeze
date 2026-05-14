# Plan: `@profpowell/meme-maker` — stand-alone web component for meme creation

> Status: draft, ready to bootstrap a repo
> Companion docs: [render-tag-rnd.md](./render-tag-rnd.md), [canvas-text-plan.md](./canvas-text-plan.md)
> Authored: 2026-05-14

## Goal

A `<meme-maker>` web component that takes an image + caption text and
produces a downloadable, shareable PNG. Captions are rendered as
rich text (bold, italic, stroke, shadow, gradient) using either
`render-tag` directly or — if `@profpowell/canvas-text` is available —
delegating text rendering to it.

Lives in its own repo, stand-alone, VB-friendly via the same theme
bridge pattern. The "fun" companion to `canvas-text`; uses the same
canvas-rendering primitives but for an end-user product rather than a
developer primitive.

## Why this is actually a good fit

Memes have unusual constraints that make canvas rendering acceptable:

- The **artifact is an image** (PNG to save / Slack / iMessage). The fact
  that canvas output isn't in the DOM is irrelevant — the entire point is
  to leave the DOM.
- A11y burden is lower than for content components: a meme is an image
  with alt text. Users authoring memes write the captions themselves, so
  they can provide the alt.
- Caption rendering needs exactly the things `render-tag` does well:
  stroke, shadow, bold/italic, gradient fill, line wrapping, large
  display fonts. The classic Impact-with-black-stroke meme look is
  literally a `render-tag` test case.
- Synchronous rendering means live preview at full quality with no
  flicker.

## Scope

**In**
- Custom element `<meme-maker>` orchestrating image + text overlays.
- Built-in UI: image source picker (file/URL/drop), top/bottom caption
  inputs, font/stroke/fill controls.
- Live canvas preview as the user types.
- Output: download as PNG/JPEG/WebP, copy to clipboard, Web Share API
  with file payload.
- Preset styles: "Impact classic," "modern bold," "thought bubble,"
  "deep-fried" (for the chronically online).
- Save / load drafts to `localStorage`.
- VB-compatible theming for the **chrome** (the editor UI), not the
  meme output itself (the meme has its own preset styles).

**Out (v1)**
- Stickers, emoji overlays beyond what fits in caption text.
- Multi-frame / GIF / video. PNG only.
- Drag-to-position text. Positions are top/bottom in v1; custom
  positions in v2.
- Server-side rendering.
- Auth, cloud storage, sharing back to a service.

## Architecture

```
┌────────────────────────────────────────────────────────┐
│ <meme-maker>                                           │
│   <img slot="image" src="…" alt="…"> (optional)        │
│   "Top text"  (slot="top" or attr)                     │
│   "Bottom text"  (slot="bottom" or attr)               │
│                                                        │
│   ┌──── editor panel (light DOM) ────────┐             │
│   │ [file picker]                        │             │
│   │ [top text input]                     │             │
│   │ [bottom text input]                  │             │
│   │ [preset selector]                    │             │
│   │ [color / stroke controls]            │             │
│   └──────────────────────────────────────┘             │
│                                                        │
│   ┌──── live preview canvas ─────────────┐             │
│   │  ┌────────────────────────────┐      │             │
│   │  │ <img> drawn via            │      │             │
│   │  │ ctx.drawImage              │      │             │
│   │  │                            │      │             │
│   │  │ render-tag text overlay 1  │      │             │
│   │  │ (top caption, drawn at top)│      │             │
│   │  │                            │      │             │
│   │  │ render-tag text overlay 2  │      │             │
│   │  │ (bottom caption)           │      │             │
│   │  └────────────────────────────┘      │             │
│   └──────────────────────────────────────┘             │
│                                                        │
│   ┌──── output controls ─────────────────┐             │
│   │ [download] [copy] [share] [reset]    │             │
│   └──────────────────────────────────────┘             │
└────────────────────────────────────────────────────────┘
```

Rendering pipeline (synchronous, runs on every preview update, coalesced
to one rAF):

1. **Resolve image.** Load via `HTMLImageElement.decode()` so `drawImage`
   has a settled bitmap. Cache the decoded image; only re-decode when the
   source changes.
2. **Size the canvas.** Match the image's natural dimensions (or
   `width`/`height` attributes if set), clamped to a max (default 1600px).
3. **Draw the image.** `ctx.drawImage(img, 0, 0, w, h)`.
4. **Render top caption.** Call `render-tag.render({ html: topHtml,
   width: w - 2*pad })`. Composite the returned canvas at `(pad, pad)`.
5. **Render bottom caption.** Same, composited at
   `(pad, h - captionHeight - pad)`.
6. Emit `meme-maker:rendered`.

The two captions use `render-tag`'s preset styling (stroke, fill, shadow)
applied as inline `style=` on the HTML passed in — see Presets below.

### Why not use `<canvas-text>` directly inside `<meme-maker>`?

Two options:

**A. Use `render-tag` directly inside `meme-maker`.** Simpler dependency
graph (one peer dep instead of two), tighter control over compositing,
no double-canvas overhead.

**B. Compose `<canvas-text>` elements internally.** Reuses the work in
`canvas-text`, single source of truth for theme bridging, but means
`meme-maker` carries a peer-dep on `@profpowell/canvas-text` too.

**Recommend B if `canvas-text` ships first** (we get the a11y fallback,
theme bridge, and DPR handling for free) and the compositing is just
`drawImage(canvasTextElement.getCanvas(), x, y)`. Otherwise A.

Decide at Phase 1 based on whether `canvas-text@0.1.0` is published when
we start.

## Element API

### Attributes

| Attribute | Type | Default | Description |
|---|---|---|---|
| `src` | string | — | Image URL. Mutually exclusive with `slot="image"`. |
| `top` | string | — | Top caption text (plain). Use `slot="top"` for rich text. |
| `bottom` | string | — | Bottom caption text. |
| `preset` | `impact` \| `modern` \| `thought` \| `fried` | `impact` | Visual style. |
| `width` | number | image natural width | Canvas width. |
| `height` | number | image natural height | Canvas height. |
| `format` | `png` \| `jpeg` \| `webp` | `png` | Export MIME. |
| `editor` | `full` \| `compact` \| `none` | `full` | Editor UI variant. `none` renders the canvas only. |
| `max-size` | number | `1600` | Maximum dimension for export. |
| `data-upgraded` | (set by element) | — | After first render. |

### Slots

- `image` — `<img>` element. Useful when the page already has the image
  in the DOM (e.g. drag-and-drop targets).
- `top` — rich-text HTML for the top caption.
- `bottom` — rich-text HTML for the bottom caption.
- default — anything else, ignored.

### Methods

```ts
toBlob(type?: string, quality?: number): Promise<Blob>;
toDataURL(type?: string, quality?: number): string;
getCanvas(): HTMLCanvasElement;
download(filename?: string): void;        // triggers a save
copy(): Promise<void>;                    // writes PNG to clipboard
share(): Promise<void>;                   // Web Share API with file
reset(): void;                            // clears state
```

### Events

| Event | Detail | When |
|---|---|---|
| `meme-maker:rendered` | `{ width, height }` | After each successful render |
| `meme-maker:image-loaded` | `{ src, width, height }` | After image decode |
| `meme-maker:exported` | `{ type, size, action }` | After download/copy/share |
| `meme-maker:error` | `{ error, phase }` | On render or export failure |

## Presets

A preset is a small object that decides:

- Default font family + weight
- Fill color
- Stroke color + width
- Text-shadow
- Text-transform (uppercase for Impact, etc.)
- Padding from canvas edges
- Optional background plate behind text

```ts
type Preset = {
  font: string;
  fill: string;
  stroke: { color: string; width: number };
  shadow?: { color: string; offsetX: number; offsetY: number; blur: number };
  transform?: 'uppercase' | 'none';
  pad: number;
};

const PRESETS: Record<string, Preset> = {
  impact: {
    font: '"Impact", "Anton", sans-serif',
    fill: '#fff',
    stroke: { color: '#000', width: 6 },
    transform: 'uppercase',
    pad: 24,
  },
  modern: { /* Inter, no stroke, drop shadow */ },
  thought: { /* serif, italic, dark plate behind */ },
  fried:   { /* over-saturated, gnarly shadow */ },
};
```

Presets serialize to inline CSS that gets fed to `render-tag` (or
to `canvas-text` if we go with composition route B).

## VB compatibility

The **editor UI** is the VB-friendly surface:

- Uses VB-style attribute conventions (`data-upgraded`, kebab-case attrs,
  namespaced events).
- Reads CSS custom properties for the editor chrome (button colors,
  spacing, fonts) via `getComputedStyle`. The controls inherit VB themes
  naturally.
- Can be slotted inside `<form-field>` / `<browser-window>` /
  `<page-tools>` in a VB page.
- No runtime dep on VB.

The **meme output** is intentionally *not* themed by VB — memes have
their own visual language (Impact, white-on-black). Presets win over
VB tokens for the actual canvas painting.

## Repo / package shape

```
meme-maker/
  README.md
  LICENSE                   # MIT
  package.json              # name: "@profpowell/meme-maker"
  src/
    meme-maker.ts           # the element
    presets.ts              # preset definitions
    editor-ui.ts            # the editor controls (form, file picker)
    pipeline.ts             # render pipeline (image + render-tag overlays)
    storage.ts              # localStorage drafts
    index.ts
  test/
    meme-maker.test.ts
    visual/                 # playwright baselines per preset
  examples/
    index.html              # full editor example
    headless.html           # meme-maker editor="none" + JS API only
    vb-integration.html     # inside a VB page with theme
  vite.config.ts
  tsconfig.json
  .github/workflows/
```

Package metadata (peer deps reflect the composition decision in Phase 1):

```json
{
  "name": "@profpowell/meme-maker",
  "version": "0.1.0",
  "type": "module",
  "peerDependencies": {
    "render-tag": "^0.1.7",
    "@profpowell/canvas-text": "^0.1.0"
  },
  "peerDependenciesMeta": {
    "@profpowell/canvas-text": { "optional": true }
  }
}
```

`canvas-text` is **optional** — if absent, fall back to direct
`render-tag` usage.

## Implementation phases

### Phase 0 — Repo bootstrap
- `gh repo create profpowell/meme-maker --public`
- Scaffold identical to `canvas-text` (TS, Vite, Vitest, Playwright,
  GitHub Actions).
- Pin `render-tag@0.1.7`. If `@profpowell/canvas-text@0.1.0` is
  published, take it as optional peer dep.

### Phase 1 — Headless pipeline
- `pipeline.ts`: image load → drawImage → render-tag overlay → composited
  canvas. No UI yet.
- Element accepts `src`, `top`, `bottom`, `preset` attributes and renders
  a canvas. `editor="none"` is the default at this stage.
- Tests: given fixture image + captions + preset, output canvas pixel-
  matches a golden PNG (within tolerance).

### Phase 2 — Editor UI (compact)
- Inline form rendered above the canvas: file input, top, bottom, preset
  selector.
- `<input>`-driven live preview. Debounced to rAF.
- Tests: typing into the input updates the canvas; `meme-maker:rendered`
  fires.

### Phase 3 — Export
- `download()`, `toBlob()`, `toDataURL()`.
- Web Share API integration where supported.
- Clipboard write via `ClipboardItem`.
- Tests: download produces a valid PNG; share is gated on `navigator.share`
  capability.

### Phase 4 — Presets
- All four presets implemented and visually validated.
- Per-preset Playwright snapshot under `test/visual/baselines/`.

### Phase 5 — Drafts
- localStorage persistence under a single key with versioned schema.
- "Resume draft" surface in the editor.
- Tests: save/load round-trips state; corrupted JSON falls back to empty
  state.

### Phase 6 — A11y + polish
- Captions reflected to the canvas as `aria-label` (concatenated
  top/bottom).
- Editor controls fully keyboard-navigable; uses native `<label>`,
  `<input>`, `<select>`.
- Reduced-motion: skip the "punch" animation when adopting a preset.
- Tests: axe-core clean on the editor; keyboard-only walkthrough.

### Phase 7 — Polish & ship 0.1.0
- README, examples deployed, npm publish.
- Demo page hosted somewhere shareable so people can actually use it
  without installing anything.

### Phase 8 (later, optional)
- Drag-to-position text.
- Multi-line caption controls.
- Sticker overlays.
- WebGL/canvas filters (the "deep-fried" preset gets a real implementation
  via 2D filters or a GLSL pass).
- GIF export.

## Testing strategy

- **Unit (Vitest):** API surface, preset serialization, pipeline against
  a fixed image fixture, storage round-trip.
- **Visual (Playwright):** for each preset × image fixture pair, snapshot
  the canvas output. Baselines per platform — fonts render slightly
  differently on macOS vs. Linux CI, so allow a small `maxDiffPixelRatio`.
- **A11y:** axe-core on the editor UI.
- **Manual / dogfood:** the demo page is the source of truth. If you
  can't make a working "drake meme" in under 30 seconds from a cold load,
  the editor isn't good enough.

## VB compatibility checklist

Same as `canvas-text`:

- Light DOM only.
- `data-upgraded` set after first render.
- Kebab-case attributes.
- `meme-maker:*` events.
- Computed-style theme bridge for editor chrome.
- No runtime dep on VB.
- Documented as usable inside a VB page with no special integration.

## Open questions

1. **Editor UI in the same component or split?** Tempting to ship a
   headless `<meme-maker>` and a separate `<meme-maker-editor>` that wraps
   it. **Lean toward keeping them merged** behind an `editor=` attribute
   for v1 — splitting hurts the "drop one tag in and go" pitch. Revisit
   if the headless use grows.
2. **Slotted `<img>` vs. `src` attribute.** Both? `src` is simpler for
   first-time users; slotted `<img>` is more progressive-enhancement-
   friendly (the image is real DOM even before the element upgrades).
   **Recommend both, slot wins if present.**
3. **Should captions be HTML or plain text by default?** Plain text via
   attribute is friendlier (`top="…"`); rich HTML via slot is more
   powerful. Both, attribute is plain-text only, slot is HTML.
4. **Fonts.** Impact ships on Windows/macOS but not Linux. Provide a
   bundled Anton fallback via `@fontsource/anton`? Or document the
   fallback chain and ship without? **Lean toward documenting; let the
   consumer load the font.** Otherwise we're shipping a 100 KB font with
   the package.
5. **Naming.** `<meme-maker>` is fun. `<meme-card>`, `<meme-canvas>` are
   variants. Decide before publishing.
6. **Watermark / branding.** Tempting to add a small "made with
   meme-maker" mark on output. **Don't.** Defeats the point.

## Risks

- `render-tag` pre-1.0 churn (same as `canvas-text`). Same mitigation —
  pin version, mirror.
- Font availability — see open question 4. Memes look wrong without
  Impact-class condensed display fonts.
- Image cross-origin issues — `drawImage` will taint the canvas if the
  image is from a different origin without CORS headers. Result:
  `toBlob`/`toDataURL` throws. **Mitigation:** detect tainted canvas,
  surface a clear error event, document the workaround (use a CORS-OK
  source or paste a local file).
- Clipboard API support varies — `ClipboardItem` with image MIME is
  Chromium-first, Firefox is catching up. **Mitigation:** feature detect;
  fall back to "download" behavior.
- Web Share API with files is mobile-first; on desktop browsers it
  no-ops. **Mitigation:** feature detect; hide the share button when
  unsupported.

## Definition of done (v0.1.0)

- [ ] `<meme-maker>` renders a meme from image + captions to a canvas.
- [ ] All four presets work and have visual baselines.
- [ ] Editor UI: file picker, top/bottom inputs, preset select.
- [ ] Export: download PNG, copy to clipboard, Web Share (where
      supported).
- [ ] Drafts persist in localStorage and resume on reload.
- [ ] A11y: editor keyboard-navigable, axe-core clean, canvas has
      `aria-label` from captions.
- [ ] README with install, basic usage, presets gallery, font notes.
- [ ] Examples page hosted; a stranger can make a meme in under 30
      seconds.
- [ ] Published to npm as `@profpowell/meme-maker@0.1.0`.

## Relationship to `canvas-text`

`canvas-text` is the **primitive**: one rich-text snippet → one canvas.
`meme-maker` is the **product**: image + two rich-text snippets +
presets + editor UI + export → a meme PNG.

If `canvas-text` ships first, `meme-maker` should reuse it (composition
route B) so the a11y fallback and theme bridge are inherited. If they
ship in parallel or `meme-maker` lands first, use `render-tag` directly
(route A) and revisit later.

Either way, the two repos are independent — they don't share build
infrastructure beyond following the same scaffold conventions.
