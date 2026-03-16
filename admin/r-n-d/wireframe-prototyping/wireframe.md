# Wireframe Mode: Current State and Extension Opportunities

## Current Situation (As Implemented)

Wireframe mode is implemented primarily as CSS, with an optional JS helper that currently is not bundled into distributable JS artifacts.

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
- Global “mode badge” (`WIREFRAME`, `SKETCH`, `PREVIEW`) for root mode.

4. Labeling support:
- `data-wf-label` label badges on elements.
- `data-wf-img-label` for figure/image overlay labels.
- `picture[data-wf-label]` label overlays.

5. Theme and accessibility alignment:
- Dark mode tokens for wireframe colors.
- `prefers-color-scheme` behavior when explicit mode is not set.
- Reduced-motion override to disable transitions/animations in wireframe mode.

6. Composer integration:
- Grid composer has a wireframe toggle that adds/removes `data-wireframe` on `vb-canvas`.

### Optional JS helper (exists, but not distributed)

`src/lib/wireframe.js` provides:
- `labelElements()`
- `label(target, text)`
- `setFidelity(level)`
- `toggle(level?)`
- `isActive()`
- `getFidelity()`

It also attaches `window.VanillaBreeze.wireframe` when executed.

## Packaging and Availability

1. Included:
- `vanilla-breeze.css` (full bundle) includes wireframe CSS and wireframe fonts.
- `vanilla-breeze-dev.css` includes wireframe CSS and wireframe fonts.

2. Not included:
- `vanilla-breeze-core.css` does not include wireframe mode.
- JS bundles (`vanilla-breeze.js`, `core.js`, `extras.js`, `dev.js`) do not include `src/lib/wireframe.js`.
- There is no package export path for wireframe JS API.

## Documentation and Reality Gaps

1. Docs show a wireframe JS API import from `/src/lib/wireframe.js`, but this is repo-local and not package-consumer friendly.

2. “Images auto-use alt text” is only true if JS helper logic runs (`labelElements()`); CSS alone cannot pull `img[alt]` into overlay text.

3. `wireframe.js` sets `--wf-img-overlay` dimensions, but current wireframe CSS does not render that variable anywhere.

4. Annotate mode’s generic rule uses `attr(data-label, "")`, but no standard `data-label` population exists for most elements.

5. The standalone demo in `docs/examples/demos/wireframe-mode.html` links `/src/main.css` (core), while wireframe styles live in full/dev CSS.

6. No automated tests currently cover wireframe behavior.

## Extension Opportunities

### Near-term (high value, low-to-medium effort)

1. Ship wireframe JS API properly:
- Bundle `src/lib/wireframe.js` in a distributable entry.
- Add package export (for example `vanilla-breeze/wireframe-js`).

2. Add optional auto-init behavior:
- In dev JS (or explicit enhancer), run `labelElements()` when `data-wireframe` is present.

3. Fix docs/demo accuracy:
- Update demo to load full/dev CSS where wireframe styles exist.
- Clarify that alt-text overlays and dimensions need JS helper execution.

4. Complete annotate mode:
- Replace/augment `data-label` dependency with a reliable labeling strategy.
- Ensure generic annotate output always has useful content.

5. Render image dimensions:
- Use `--wf-img-overlay` in CSS (or move to `data-*` attribute consumed by CSS).

6. Add tests:
- Playwright component test for fidelity toggles and `data-wf-label`.
- Test for JS helper availability/behavior once exported.

### Mid-term (feature expansion)

1. Grid and spacing overlays:
- `data-show-grid`, `data-show-spacing` style overlays for layout review.

2. Palette variants:
- `data-wf-palette="mono|grayscale|blueprint|sepia|neon"` token sets.

3. Rough border integration:
- Optional integration with border-style/roughness tokens in lo-fi mode.

4. Better scoped mode ergonomics:
- Separate global and container badge behavior.
- Scoped helper API (`wireframe.setFidelity(level, root)`).

### Longer-term (workflow tooling)

1. Content abstraction modes:
- Lorem/redacted/block replacement while preserving structure.

2. Annotation workflow:
- Callouts, comment metadata, exportable notes.

3. Export tooling:
- Screenshot/spec export for design review handoffs.

4. Scaffolding integration:
- Starter templates with wireframe-first authoring mode.

## Recommendation

Start with distribution and correctness first:
1. Ship JS API (or remove docs references to unshipped API).
2. Fix demo/docs mismatches.
3. Add tests.
4. Then layer in overlays and abstraction features.

