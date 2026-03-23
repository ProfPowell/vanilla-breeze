# Wireframe Mode: Current State and Extension Opportunities

## Current Situation (As Implemented)

Wireframe mode is CSS-first with a JS helper bundled in `dev.js`. It provides a three-tier overlay model for prototyping, design review, and developer handoff.

### What is implemented today

1. Wireframe activation via `data-wireframe` on:
- `<html>` for global mode.
- Any container element for scoped mode.

2. Fidelity modes:
- `data-wireframe="lo"`: sketch style (Redacted Script), strong black/white contrast.
- `data-wireframe="mid"`: block style (Flow Block), grayscale structure view.
- `data-wireframe="hi"`: near-production preview with muted grayscale.
- `data-wireframe="annotate"`: annotation-oriented mode.
- Empty `data-wireframe` behaves like legacy/default wireframe styling.

3. Core visual transformations:
- Grayscale filtering (full in default/lo/mid, reduced in hi).
- Borders normalized to dashed/solid wireframe lines.
- Decorative effects stripped (`box-shadow`, `text-shadow` removed).
- Media placeholders with X-pattern treatment.
- Simplified controls, form fields, tables, blockquotes, code blocks.
- Global "mode badge" (`WIREFRAME`, `SKETCH`, `PREVIEW`) for root mode.

4. Three-tier overlay model (all can be active simultaneously):

| System | Attribute | Purpose | Rendering | Position |
|--------|-----------|---------|-----------|----------|
| **Labels** | `data-wf-label` | "What this IS" — structural name | `::before` badge | Top-left inside |
| **Annotations** | `data-wf-annotate` / `data-wireframe="annotate"` | "What tag this uses" — developer ref | `::after` monospace | Top-right outside |
| **Callouts** | `data-wf-callout` | "What a reviewer thinks" — design comments | Injected `<mark>` marker + `<aside>` footnote panel | Top-right corner |

- Labels and annotations use pseudo-elements (`::before` / `::after`) — zero JS, no collision.
- Annotations are deduplicated via `:is()` selector — one rule set serves both `data-wireframe="annotate"` and `data-wf-annotate`.
- Annotations exclude replaced elements (`img`, `input`, `select`, `textarea`, `video`, `iframe`, `canvas`, `figure`, `picture`).
- Callouts use JS to inject semantic `<mark>` markers with `aria-label` and a footnote `<aside>` panel with `<ol>`.

5. Palette variants:
- `data-wf-palette="blueprint"`: blue-toned wireframe.
- `data-wf-palette="sepia"`: warm paper-toned wireframe.

6. Grid and spacing overlays (independent of wireframe mode):
- `data-show-grid`: 12-column grid overlay.
- `data-show-spacing`: box-model outline on all elements.

7. Theme and accessibility alignment:
- Dark mode tokens for wireframe colors.
- `prefers-color-scheme` behavior when explicit mode is not set.
- Reduced-motion override to disable transitions/animations in wireframe mode.

8. Keyboard shortcut: `Ctrl/Cmd+Shift+W` toggles wireframe mode.

### JS API (bundled in dev.js)

`src/lib/wireframe.js` is imported by `src/dev.js` and provides:

**Core:**
- `toggle(level?)` — toggle wireframe on/off
- `setFidelity(level)` — set fidelity directly
- `isActive()` — check if wireframe mode is on
- `getFidelity()` — get current fidelity level

**Labels:**
- `labelElements()` — auto-label elements with `data-wf-label` and images with `alt` text
- `label(target, text)` — label a specific element
- `wrapStandaloneImages()` — wrap non-figure images for pseudo-element labels

**Annotations:**
- `toggleAnnotations()` — toggle composable annotation layer

**Callouts:**
- `addCallout(target, text)` — attach a design review comment
- `removeCallout(target)` — remove a callout
- `renderCallouts()` — inject numbered `<mark>` markers on `[data-wf-callout]` elements
- `renderCalloutPanel(container?)` — render `<aside>` footnote panel with `<ol>` of callout texts
- `toggleCallouts()` — toggle marker/panel visibility

Attaches to `window.VanillaBreeze.wireframe` on load.

## Key Files

| File | Owns |
|------|------|
| `src/utils/wireframe.css` | All wireframe CSS: fidelity, labels, annotations, callouts, palettes, overlays |
| `src/lib/wireframe.js` | JS API for labels, annotations, callouts |
| `demos/examples/demos/wireframe-mode.html` | Interactive demo: all toggles, fidelity, palettes, overlays, callouts |
| `demos/examples/demos/prototyping-toolkit.html` | Full-page prototype demo: mock + lorem + wireframe together |
| `site/src/pages/docs/attributes/data-wireframe.njk` | Attribute reference docs |
| `site/src/pages/docs/prototyping.njk` | Prototyping toolkit guide |
| `.claude/patterns/feedback/wireframe.md` | Pattern reference for Claude |
| `tests/unit/wireframe.test.js` | Unit tests (pure functions) |
| `tests/components/wireframe.spec.js` | Playwright component tests |

## Packaging and Availability

1. Included:
- `vanilla-breeze.css` (full bundle) includes wireframe CSS and wireframe fonts.
- `vanilla-breeze-dev.css` includes wireframe CSS and wireframe fonts.
- `vanilla-breeze-dev.js` includes wireframe JS API.

2. Not included:
- `vanilla-breeze-core.css` does not include wireframe mode.
- Main JS bundles (`vanilla-breeze.js`, `core.js`, `extras.js`) do not include wireframe JS.

## Documentation and Reality Gaps

1. ~~Docs show a wireframe JS API import from `/src/lib/wireframe.js`, but this is repo-local and not package-consumer friendly.~~ **Fixed**: dev.js bundles wireframe.js.

2. "Images auto-use alt text" is only true if JS helper logic runs (`labelElements()`); CSS alone cannot pull `img[alt]` into overlay text. (Documented.)

3. ~~`wireframe.js` sets `--wf-img-overlay` dimensions, but current wireframe CSS does not render that variable anywhere.~~ **Fixed**: Dimensions propagated to `data-wf-img-dims` on figure, CSS renders them.

4. ~~Annotate mode's generic rule uses `attr(data-label, "")`, but no standard `data-label` population exists for most elements.~~ **Fixed**: Now uses `var(--wf-label-text, "")` and expanded hardcoded label list (18 semantic + 9 VB layout elements).

5. ~~The standalone demo links `/src/main.css` (core), while wireframe styles live in full/dev CSS.~~ **Fixed**: Demo loads dev.css and dev.js.

6. ~~No automated tests currently cover wireframe behavior.~~ **Fixed**: Unit and Playwright component tests added.

## Extension Opportunities

### Done

1. ~~Ship wireframe JS API properly~~ — Bundled in dev.js.
2. ~~Fix docs/demo accuracy~~ — Demo loads dev CSS/JS, docs clarify JS requirement.
3. ~~Complete annotate mode~~ — Uses `var(--wf-label-text)`, expanded to 27 elements. Composable `data-wf-annotate` added.
4. ~~Render image dimensions~~ — Propagated to `data-wf-img-dims` on figure, CSS renders them.
5. ~~Add tests~~ — Unit tests + Playwright component tests.
6. ~~Grid and spacing overlays~~ — `data-show-grid`, `data-show-spacing` implemented.
7. ~~Palette variants~~ — `data-wf-palette="blueprint|sepia"` implemented.
8. ~~Annotation workflow / callouts~~ — Three-tier overlay model: labels (`::before`), annotations (`::after`), callouts (JS `<mark>` markers + `<aside>` panel).
9. ~~Keyboard shortcut~~ — `Ctrl/Cmd+Shift+W` auto-registered.

### Open

1. Auto-init behavior:
- Demo calls `labelElements()` on init. Auto-init on attribute detection is a future enhancement.

2. Rough border integration:
- Optional integration with border-style/roughness tokens in lo-fi mode.

3. Better scoped mode ergonomics:
- Separate global and container badge behavior.
- Scoped helper API (`wireframe.setFidelity(level, root)`).

4. Content abstraction modes:
- Lorem/redacted/block replacement while preserving structure.

5. Export tooling:
- Screenshot/spec export for design review handoffs.

6. Scaffolding integration:
- Starter templates with wireframe-first authoring mode.
