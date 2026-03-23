# Star Rating Refactor Brief

## Objective

Keep `star-rating` aligned with Vanilla Breeze's actual philosophy:

- Layer 1: native radio-group markup is the baseline
- Layer 2: `[data-rating]` CSS provides the visual treatment
- Layer 3: `star-rating` is a convenience wrapper that generates the native pattern and adds form association via `ElementInternals`

The refactor should make that layering reliable and explicit. It should not turn `star-rating` into an isolated widget that duplicates the native rating system.

The next implementation should deliver all of the following before any extra polish work:

- The web component composes correctly with the native rating layers it is meant to wrap.
- Form value, validation, reset, and restore stay correct in the wrapped version.
- Multiple instances can coexist without radio-group collisions.
- The docs and tooling describe the three-layer model accurately.
- The CSS-first design remains the source of visual truth.

## Files To Read First

- `src/web-components/star-rating/logic.js`
- `src/web-components/star-rating/styles.css`
- `src/native-elements/rating/styles.css`
- `src/effects/rating.js`
- `src/lib/vb.js`
- `src/web-components/star-rating/static.html`
- `demos/examples/demos/rating-basic.html`
- `site/src/pages/docs/elements/web-components/rating.njk`
- `site/src/pages/docs/principles.njk`
- `site/src/pages/docs/concepts/form-association.njk`
- `src/htmlvalidate/elements.cjs`
- `tests/element-visual/compendium/compendium.json`

## What To Preserve

These parts are conceptually right and should survive the refactor:

- The native `fieldset` + `radio` pattern is the real baseline.
- `[data-rating]` CSS is the primary visual system, not something the web component should replace.
- The web component is a convenience layer, not the only way to use rating UI.
- `ElementInternals` is the right mechanism for form participation in the wrapper layer.

The current brief should focus on broken composition between layers, not on replacing the layered design with a monolithic component.

## Current Failures

### 1. The wrapper layer does not clearly compose with the JS enhancement layer

Evidence:

- The docs describe three layers and say the JS enhancement adds clear/unrate and `rating-change` behavior in `site/src/pages/docs/elements/web-components/rating.njk:77-84` and `site/src/pages/docs/elements/web-components/rating.njk:147-156`
- The web component listens for `rating-change` on its generated fieldset in `src/web-components/star-rating/logic.js:116-120`
- The generated fieldset only gets `data-rating` / `data-rating-half` in `src/web-components/star-rating/logic.js:61-64`
- The enhancement logic is implemented in `src/effects/rating.js:35-83`
- The VB effects system initializes registered effects from `[data-effect]` elements in `src/lib/vb.js:37-45`, `src/lib/vb.js:116-121`, and `src/lib/vb.js:223-230`

Why this is bad:

- The Layer 3 wrapper is depending on behavior from Layer 3 enhancement JS, but the contract is unclear and appears incomplete.
- This is not a reason to inline all enhancement logic into `star-rating`.
- It is a reason to make the handshake between the layers explicit and reliable.

Pragmatic interpretation:

- Either the rating enhancement should auto-apply to all rating fieldsets, or
- the web component should intentionally opt its generated fieldset into that enhancement, or
- both layers should share a common helper instead of relying on an accidental event path

The bug is the broken composition, not the fact that layers exist.

### 2. Form-associated state currently hangs on that shaky handshake

Evidence:

- Initial form state is synced once in `src/web-components/star-rating/logic.js:51-52`
- After that, interactive updates rely on `rating-change` in `src/web-components/star-rating/logic.js:116-120`
- There is no direct fallback listener for native radio `change`

Why this is bad:

- If the enhancement layer does not attach as expected, the radios still work visually as native controls, but the host's `ElementInternals` value can become stale.
- That breaks the main Layer 3 reason for existing in the first place: native-like form participation through the custom element host.

This is a real bug. The fix should strengthen the layer bridge, not abandon the layered model.

### 3. `connectedCallback()` is not idempotent

Evidence:

- `connectedCallback()` always renders and appends a new fieldset in `src/web-components/star-rating/logic.js:35-54`
- Interactive render appends a fieldset in `src/web-components/star-rating/logic.js:114-120`
- Readonly render appends a container in `src/web-components/star-rating/logic.js:123-166`
- `disconnectedCallback()` only removes `data-upgraded` in `src/web-components/star-rating/logic.js:56-58`

Why this is bad:

- Reconnects can duplicate internal DOM.
- This is a lifecycle bug regardless of philosophy.

### 4. The internal radio naming model can create cross-instance collisions

Evidence:

- Interactive mode falls back to `name="rating"` in `src/web-components/star-rating/logic.js:43`
- That same `name` is assigned to every generated radio in `src/web-components/star-rating/logic.js:76-79`, `src/web-components/star-rating/logic.js:89-93`, and `src/web-components/star-rating/logic.js:102-106`

Why this is bad:

- Native radio grouping is keyed by `name`.
- Two wrapper instances without explicit names can interfere with each other.
- This is especially at odds with the goal of the WC being a safe convenience wrapper.

### 5. Readonly rendering weakens the CSS-first model by pushing presentation into JS

Evidence:

- Readonly mode builds inline-styled spans in `src/web-components/star-rating/logic.js:123-166`

Why this is bad:

- The CSS-first visual system is one of the main VB design principles.
- Inline colors, positioning, and clip-path styling in JS make theming and maintenance harder than they need to be.
- This is not about making the component "more self-contained"; it is about putting presentation back where VB wants it: in CSS.

### 6. The docs and tooling are underspecified around the wrapper contract

Evidence:

- The docs correctly emphasize the three-layer model in `site/src/pages/docs/elements/web-components/rating.njk:77-84`
- But they still refer to `rating-init.js` rather than the current `src/effects/rating.js` system in `site/src/pages/docs/elements/web-components/rating.njk:82` and `site/src/pages/docs/elements/web-components/rating.njk:148`
- htmlvalidate barely documents `star-rating` at all in `src/htmlvalidate/elements.cjs:529-532`
- The visual compendium only covers render fixtures in `tests/element-visual/compendium/compendium.json:3845-3865`

Why this is bad:

- The philosophy is documented, but the actual runtime contract is not.
- Anyone trying to refactor this can easily optimize for the wrong layer.

### 7. The current brief overstated reactivity as a primary concern

Evidence:

- The previous review leaned hard on generic attribute reactivity and standalone ownership

Why this matters:

- In VB, not every web component needs framework-style live attr reactivity to be correct.
- The first priority here is reliable initial render, form correctness, lifecycle, and clean composition with the native rating layers.
- Live attribute mutation can still be useful, but it is not the philosophical center of this component.

## Recommended Refactor Direction

## 1. Keep `star-rating` thin, but make the layer bridge explicit

Recommended direction:

- Preserve the generated `fieldset[data-rating]` structure
- Preserve reuse of native rating CSS
- Preserve the enhancement layer concept
- Fix the contract so the wrapper can reliably participate in it

Possible valid approaches:

- Make the rating enhancement auto-initialize on all `fieldset[data-rating]`
- Add an explicit enhancement hook that `star-rating` calls for its generated fieldset
- Extract the shared rating behavior into a small helper used by both manual markup and the WC wrapper

All three respect the VB philosophy better than duplicating the whole enhancement inside the WC.

## 2. Make form-associated correctness resilient even if enhancement wiring changes

The wrapper should not lose `ElementInternals` correctness because one enhancement event path fails.

Pragmatic guidance:

- Keep the existing enhancement event if it is part of the public pattern
- Add a direct native-change synchronization path or equivalent resilient bridge
- Ensure `setFormValue()` and validation do not depend on one fragile event source

This is not "code first." This is preserving resilience across layers.

## 3. Fix lifecycle and grouping bugs without changing the architectural shape

Required fixes:

- Make connect / disconnect / reconnect idempotent
- Use a unique internal radio-group name per instance
- Keep the host's submitted form name separate from internal radio grouping if needed

These are straightforward correctness issues and do not conflict with the progressive-enhancement model.

## 4. Move readonly presentation back toward CSS

Refactor goal:

- Keep the readonly structure simple in JS
- Move color / fill / positioning rules into CSS where practical

This aligns the component more closely with VB's CSS-first philosophy.

## 5. Tighten docs around the three-layer contract

The docs should clearly say:

- what works with pure HTML + CSS
- what the JS enhancement adds
- what `star-rating` adds on top of that
- how the current enhancement system is actually wired

That is more important here than adding lots of generic component API surface.

## Suggested Implementation Sequence

1. Fix the bridge between generated fieldsets and the rating enhancement layer.
2. Add a resilient fallback path so host form value stays correct.
3. Make lifecycle idempotent.
4. Fix internal radio-name collisions.
5. Refactor readonly visuals toward CSS-first styling.
6. Update docs and htmlvalidate to reflect the real three-layer contract.
7. Add tests that cover each layer and the transitions between them.

## Acceptance Criteria

Claude should not call the refactor done until all of these are true:

- Manual `fieldset[data-rating]` usage still works as the baseline pattern.
- The JS enhancement layer still provides clear/unrate and `rating-change` behavior for the intended rating markup.
- `star-rating` composes with that enhancement layer intentionally, not accidentally.
- Clicking a star updates the host form value and validity correctly.
- `form.reset()` and form-state restore behave correctly through the wrapper.
- Two wrapper instances do not interfere with each other.
- Reconnecting the element does not duplicate internal DOM.
- Readonly rendering remains themeable through CSS rather than inline JS presentation rules.
- Docs and tooling explain the same three-layer architecture the code actually ships.

## Tests That Should Exist After The Refactor

At minimum add automated coverage for:

- CSS-only rating fieldset baseline
- JS-enhanced manual fieldset behavior
- `star-rating` form submission via `ElementInternals`
- Reset and restore behavior
- Two instances on one page with no radio cross-talk
- Reconnect / disconnect behavior
- Readonly rendering
- The bridge between the wrapper and enhancement layer

## Do Not Do This

- Do not rewrite `star-rating` as a fully isolated widget with duplicated rating CSS and behavior.
- Do not move away from the native `fieldset` / `radio` foundation.
- Do not optimize for generic framework-style reactivity before fixing the layer contract.
- Do not describe the current reuse of native layers as a flaw by itself.

## Bottom Line

The right refactor for `star-rating` is not "make it own everything."

The right refactor is:

- preserve the native rating foundation
- preserve the CSS-first model
- preserve the layered architecture
- fix the broken seams between those layers so the wrapper is reliable
