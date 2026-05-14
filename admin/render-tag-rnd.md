# R&D: `render-tag` — HTML rich text on `<canvas>`

> Status: exploratory evaluation, not a recommendation to adopt.
> Library: [polotno-project/render-tag](https://github.com/polotno-project/render-tag) — [docs](https://polotno.com/render-tag/)
> Reviewed: 2026-05-14 against `render-tag@0.1.7` (published 2026-05-06)

## TL;DR

`render-tag` is a small, focused, MIT-licensed library from the Polotno team
that takes an HTML+CSS rich-text snippet and **paints it onto a `<canvas>`
with the 2D API** — no SVG `foreignObject`, no DOM cloning, no `html2canvas`
heuristics. It is genuinely good at the niche it targets: rich-text labels
inside canvas-based applications (design editors, image exporters, 2D games).

For Vanilla Breeze the verdict is: **mostly not a fit, with two narrow
"maybe" cases.** VB is an HTML-first framework; canvas rendering loses the
DOM (and with it the a11y tree, selection, copy/paste, anchors, view
transitions, CSS cascade). The places where canvas is unavoidable —
sharable image cards, screensaver-style animations, raster export of a
component — are also the places `render-tag` is best at. So if we ever
need those, this is the cleanest available primitive. Until then, adopting
it would be a solution looking for a problem.

The two "maybe" tracks worth flagging:

1. **Stand-alone `@profpowell/og-image` (or similar)** — a small wrapper
   component for generating share/OG card PNGs at runtime from VB markup.
   Most natural fit; lives outside VB core, like `@profpowell/code-block`
   and `@profpowell/browser-window`.
2. **Vanilla-press build-time OG card generation** — node-canvas +
   `render-tag` to emit per-page social images during the static build.

Everything else (charts, kanban snapshots, screen-saver, etc.) is better
served by the platform primitives VB already prefers (SVG, HTML, CSS).

---

## What it is, concretely

From the package README and homepage:

> "`render-tag` takes HTML + CSS and draws it onto a canvas element with the
> 2D API. No SVG. No `foreignObject`. Synchronous. Zero dependencies."

The synchronous, dep-free, canvas-only posture is the whole pitch. Where
existing tools like `html2canvas`, `dom-to-image`, or the
`<foreignObject>`-into-SVG trick all lean on the browser's HTML engine
to do the heavy lifting (and pay for it in speed and reliability),
`render-tag` writes its own micro layout engine — a CSS parser, an inline
formatter, a paragraph breaker, a `ctx.fillText` rasterizer — restricted
to rich-text-shaped HTML. The trade-off is: it is very fast and very
predictable, but **the scope is text + a small amount of block layout, not
arbitrary web pages.**

### Concrete API

```javascript
import { render } from 'render-tag';

const { canvas, height } = render({
  html: '<p>Hello <strong>world</strong></p>',
  width: 400,
});

document.body.appendChild(canvas);
```

Two-phase variant for redraws:

```javascript
import { layout, drawLayout } from 'render-tag';

const { layoutRoot, height, lines } = layout({ html, width: 400 });
const { canvas } = drawLayout({ layoutRoot, width: 400, height });
```

### Supported HTML / CSS

Per the README:

- **Elements:** `p`, `h1`-`h6`, `div`, `span`, `ul`/`ol`/`li` (nested),
  `table`, `pre`, `code`, `kbd`, `samp`, plus inline phrasing (`strong`,
  `em`, `u`, `s`, `b`, `i`, etc.).
- **Typography:** font family, size, weight (100-900), line height, letter
  spacing, word spacing.
- **Text styling:** color, background-color, bold, italic, underline,
  strikethrough, overline, text-shadow, text-stroke, gradient text,
  decoration styles (solid/dotted/dashed/double/wavy).
- **Layout:** alignment (left/center/right/justify), flexbox row/column,
  table layout.
- **Whitespace:** `pre-wrap`, `overflow-wrap: break-word`, soft hyphens.
- **Scripts:** RTL text, CJK, emoji.

### What it explicitly **does not** do

- Interactive elements (`<button>`, `<input>`, `<iframe>`, anchors as
  navigable links — anchors render but are paint-only).
- Arbitrary CSS — no Grid, no float, no positioning, no animations, no
  pseudo-elements (`::before`/`::after`), no media queries.
- Replaced content — no `<img>`, no `<svg>`, no `<video>`.
- Fonts are not loaded — caller is responsible (e.g. `document.fonts.load`
  before render).
- Container queries, view transitions, scroll-driven anything — n/a in canvas.

### Bundle, deps, maturity

| Metric | Value |
|---|---|
| Latest version | 0.1.7 |
| First publish | 2026-03-29 |
| Last publish | 2026-05-06 |
| Unpacked size | ~553 KB |
| Dependencies | 0 |
| License | MIT |
| TypeScript | yes (`.d.ts` shipped) |
| GitHub stars | ~95 |
| Open issues | 0 visible |
| Maintainer | Polotno (single-vendor) |

Six weeks old, eight patch releases, single-vendor. Active but
**pre-1.0 and very young.** Don't put it on a critical path yet. If we
adopt, pin to a known version and hold our breath on minor bumps.

---

## Where it could plug into VB — case by case

I went through the VB component surface (~120 web components) and asked:
"does this thing produce rasterized output, or could it benefit from rich
text on a canvas?" The matrix:

### 1. OG / share card image generation — **strongest fit (maybe)**

Vanilla Breeze ships [`share-wc`](../src/web-components/share-wc/) and
the site has SEO/social metadata via the meta-tag contract v1
(`admin/specs/`). Today, social cards are either:

- Static images served from `dist/` (good but author-burden);
- Pre-rendered via a build step (none currently);
- Generated by the consuming platform (Cloudflare workers, etc.).

Generating a card with `<title>` + a deck snippet + brand bug is exactly
`render-tag`'s sweet spot. A wrapper component:

```html
<og-image
  title="Vanilla Breeze 1.0"
  deck="HTML-first CSS framework with web components."
  width="1200" height="630">
  <!-- optional rich children, slotted into the canvas -->
</og-image>
```

…would render to a `<canvas>` and emit a `data:` URL or `Blob` we can hand
to `<meta property="og:image">` or download.

**Pros**
- The hard problem (laying out rich text into a fixed-aspect box, with
  bold/italic, gradient titles, line wrapping, fallback fonts) is exactly
  what `render-tag` solves.
- Synchronous, deterministic — predictable across runs, important for
  cache-key stability.
- No headless browser, no Playwright spin-up.
- Works at build time (with `node-canvas`/`skia-canvas`) **and** at runtime
  (browser canvas). Could live in either layer.
- Easy to ship as a stand-alone npm — fits VB's `@profpowell/*` precedent
  alongside `code-block` and `browser-window`.

**Cons**
- We don't currently have a clamoring need for per-page OG cards. Adding
  this is opt-in feature work, not gap-fill.
- Image-shaped, so a11y is "off the table" — the social card itself is a
  pure image; the *contract* with social platforms is image + `og:image:alt`.
  Fine, but a reminder that the moment we cross into canvas we leave VB's
  HTML-first lane.
- Library is six weeks old and pre-1.0. Build-pipeline dependencies on
  young projects bite when they ship breaking changes mid-cycle.
- Node-side use requires a canvas polyfill (~10 MB `node-canvas`), which
  is heavier than the library itself and brings native bindings into our
  toolchain. `skia-canvas` is the cleaner option but still a chunk.

**Verdict:** Plausible. Worth scoping as its own R&D if/when the OG-card
need becomes real. **Not** worth speculatively prebuilding.

### 2. Vanilla-press OG / preview images at build time — **strongest fit (maybe), build-side variant**

Same use case, different layer. Vanilla-press already has the corpus,
themes, and provenance system; building per-page social images during
`npm run build` is a natural extension. Pros and cons largely mirror the
above. The build-time variant has a few advantages:

- Image is cached as a static asset; no runtime CPU cost on visit.
- Output is plain `og:image: /og/{slug}.png` — boring, fast, CDN-friendly.
- Easier to add page-aware variations (article hero color → card gradient,
  reading time → small overlay).

And one extra wart:

- Node-side fonts. `render-tag` requires fonts pre-loaded; in Node the
  caller has to `registerFont()` on the canvas. Means committing OTF/TTF
  to the repo (or downloading per build). VB uses Google Fonts CSS API
  in browser (per memory `hardcoded-fonts-gstatic-com-woff2-urls-in-theme`);
  for build-time generation we'd need to mirror the woff2 files or use
  `@fontsource/*` packages.

**Verdict:** Same as #1 — plausible, scope-it-when-needed. The build-time
flavor is slightly more attractive because it avoids runtime canvas work
on visitor devices.

### 3. `screen-saver` component — **maybe, mostly novelty**

VB has a `screen-saver` component (user mentioned). Today it's almost
certainly DOM-based animation. Rich text on a canvas drifting around
could be a striking demo of `render-tag`'s capability.

**Pros**
- Showcase value: "here's a thing native HTML can't easily do — paint a
  multi-line paragraph with bold/italic onto a moving canvas." Good
  marketing for the framework's flexibility.
- Self-contained — screen-saver is by nature a non-interactive, opt-in
  full-screen experience, so the a11y trade-off is acceptable.

**Cons**
- It's a demo, not a feature anyone has asked for.
- Adding a 553 KB dependency to power one decorative component is a poor
  trade unless we also use it for #1 or #2.
- VB's screen-saver already exists without `render-tag`, so this is pure
  capability-expansion, not gap-fill.

**Verdict:** Cute. Not a reason to take the dependency in isolation.
Worth keeping in the back pocket as a demo for whatever shape we land on.

### 4. Charts (`chart-wc`, `gantt-chart`, `burndown-chart`) — **no**

VB charts render with SVG, which already handles rich text, layout, a11y
(via `<title>`/`<desc>`), and CSS theming. There's no canvas pipeline
here that needs feeding. The thing `render-tag` is best at — getting
rich text into a canvas — doesn't apply, because there is no canvas.

If at some point a chart variant needed canvas (huge datasets, WebGL, an
export-to-PNG mode), then the *export-to-PNG* leg could reuse a card
component built on `render-tag`. But the chart logic itself stays SVG.

**Verdict:** No. SVG is the right primitive here.

### 5. Diagram-shaped components (`diagram-wc`, `flow-diagram`, `quadrant-grid`, `kanban-board`, `story-map`, `impact-effort`, `empathy-map`, `user-journey`) — **no**

All HTML/SVG, all interactive, all benefit from being in the DOM (drag,
focus, keyboard, view transitions, theme tokens, selection). Forcing them
into a canvas loses every one of those things. Even an "export this card
as PNG" feature is better implemented by *rasterizing the existing DOM
node* via `<foreignObject>` in SVG or a server-side headless render — not
by re-implementing the layout in `render-tag`.

**Verdict:** No.

### 6. `code-block`-style stand-alone component (e.g. `<canvas-card>`) — **plausible**

The user explicitly raised this option, and it's the cleanest packaging
if we do go forward. Precedent:

- `@profpowell/code-block` (^2.9.0) — syntax-highlighted code block, used
  by VB but lives outside it.
- `@profpowell/browser-window` (^1.4.6) — chrome-decorated frame, used
  for component demos.

Both ship as their own npm package, are upgradable on their own schedule,
and stay out of VB's core bundle. A `@profpowell/canvas-card` (or
`og-image`, `share-image`, `render-card`) component fits the same mold:

- Imports `render-tag` directly; VB neither knows nor cares.
- Consumed by VB only where it's wanted (in `share-wc`, in a
  `vanilla-press` build hook, in a `screen-saver` showcase).
- Tracks `render-tag`'s pre-1.0 churn separately from VB's release cadence.
- Easy to remove if `render-tag` flames out or a better primitive
  emerges.

This is the path I'd recommend **if** we pursue render-tag at all.

---

## Cross-cutting concerns

### Accessibility

Canvas is opaque to assistive technology. Whatever we render into a
canvas needs a parallel DOM representation — `aria-label`,
`<canvas><div>fallback DOM here</div></canvas>`, or an off-screen
duplicate. `render-tag`'s author is aware of this (it's the standard
canvas caveat) but does not solve it for you. Any VB-side wrapper must
ship the dual representation as a non-optional feature.

This is the single biggest philosophical objection to broad adoption.
VB's whole posture is HTML-first, semantics-first. Canvas inverts that.

### Theming

Theme tokens reach `render-tag` only as resolved CSS values — gradients,
colors, font families — passed in as strings. There's no native hook
into VB's cascade-layer theme system. A wrapper component would need to
read `getComputedStyle(host)` (or known tokens like `--color-brand`,
`--font-family-display`) and forge an inline-style HTML snippet to feed
the library. Doable, but it's a copy of the theme rather than a live
binding. Re-themes don't re-render unless we invalidate explicitly.

### Fonts

The library does not load fonts. Browser-side that's fine — we ensure
the document has the right `@font-face` declarations (VB's theme system
already does this via Google's `css2` API per
`hardcoded-fonts-gstatic-com-woff2-urls-in-theme`). Build-side it is more
painful (committing woff2/ttf, or pulling `@fontsource/*` deps).

### Bundle cost

553 KB unpacked is *fine* for a stand-alone component you opt into, and
unacceptable for VB core. If we adopt, it must be in a stand-alone
package, not the main framework bundle.

### Maturity risk

Pre-1.0, six weeks old, single vendor, single contributor, 95 stars.
That's not a red flag — it's a *yellow* flag. Many great tools start here.
But:

- Pin the version, don't `^`-range it.
- Vendor or fork-mirror if it becomes load-bearing.
- Don't put it on a build pipeline that blocks deploys until the API
  stabilizes (1.0 + 6 months of quiet).

### Alternatives

- **`<foreignObject>` in SVG → rasterized via `drawImage`** — slow,
  unreliable across browsers, but uses the actual browser engine and
  inherits a11y/semantics via the source DOM.
- **`html2canvas`** — older, larger, async, heuristic-based, well-known.
  Works on arbitrary DOM. Slower than render-tag but covers the full HTML
  surface. Probably the right tool if we ever want "snapshot this VB
  component as a PNG."
- **`satori`** (Vercel) — JSX → SVG, then rasterize via `resvg`. Build-time
  only. Used by Next.js OG-image route. Closest competitor for the
  build-side OG card use case. *Probably the more conservative choice for
  vanilla-press OG card generation* — bigger ecosystem, better mileage.
  But adds a different dependency.
- **A headless browser snapshot (Playwright, Puppeteer)** — heaviest, most
  faithful. Overkill for OG cards, the right answer for "render this full
  page as a PNG."

If we're picking on technical merit alone for the OG-card build-time case,
`satori` + `resvg-js` is probably the safer choice today; `render-tag` is
the more elegant choice on paper but pre-1.0.

---

## Decision matrix

| Use case | Fit | Pros | Cons | Verdict |
|---|---|---|---|---|
| OG/share card runtime generation | High | Synchronous, predictable, zero deps | A11y, theme bridge, maturity | Defer — build only if there's a real ask |
| OG card build-time (vanilla-press) | High | Cacheable, no runtime cost | Node fonts pain, maturity | Defer — and prefer `satori` if we do it soon |
| Stand-alone `@profpowell/canvas-card` | High packaging fit | Mirrors `code-block`/`browser-window` precedent | Speculative until we have a consumer | Hold — design but don't build |
| `screen-saver` rich text demo | Medium | Showcase, self-contained | Demo-only justification for big dep | Skip unless we ship #1 or #2 |
| Inside `share-wc` | Medium | Same as #1, narrower API surface | Couples VB to a canvas dep | Skip; expose via a stand-alone the consumer adds |
| Charts / diagrams / kanban | Low | — | Loses DOM, a11y, theming, interactivity | No |
| Replacement for `foreignObject` in existing VB components | Low | Faster than current approach (none — we don't do this today) | — | No |

---

## Recommendation

**Do not adopt `render-tag` into Vanilla Breeze core.**

**Do** keep it bookmarked. The next time someone asks for one of:

- "Can we auto-generate share images for vanilla-press articles?"
- "Can we export this component as a PNG?"
- "Can we put a stylized rich-text overlay on a canvas animation?"

…revisit this document, and at that point design a stand-alone
`@profpowell/*` component that wraps `render-tag` (or `satori`, whichever
has aged better by then). Until then, the HTML-first lane VB has
committed to is the right lane, and the platform's native rich-text
rendering — the DOM — is already the best tool for the job.

## Open questions / next steps if we do pursue

1. Inventory actual demand: is anyone asking for OG card generation or
   component-to-PNG export? (Check `bd ready` and recent vanilla-press
   handoff notes.)
2. Spike a `<canvas-card>` POC in a worktree — measure: bundle cost,
   render time, theme-token bridging effort, a11y duplicate-DOM API.
3. Compare side-by-side with `satori` for the build-time card case.
4. Decide stand-alone package name and repo location (`@profpowell/*` org).
5. File a `bd` issue tying back to this document only after the demand
   signal exists. Don't speculatively schedule.

## Sources

- [render-tag — HTML rich text on canvas (Polotno)](https://polotno.com/render-tag/)
- [polotno-project/render-tag on GitHub](https://github.com/polotno-project/render-tag)
- [npm registry — render-tag](https://registry.npmjs.org/render-tag) (metadata as of 2026-05-14)
- [WICG/html-in-canvas](https://github.com/WICG/html-in-canvas) — the broader platform proposal that may eventually obviate libraries like this
- [Konva — Rich Text on canvas](https://konvajs.org/docs/sandbox/Rich_Text.html) (existing pattern for canvas frameworks)
- [Frontend Masters: First Experiments with HTML in Canvas](https://frontendmasters.com/blog/the-web-is-fun-again-first-experiments-with-html-in-canvas/)
