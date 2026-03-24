# Compare Surface Refactor Brief

## Objective

Keep `compare-surface` aligned with Vanilla Breeze's actual philosophy:

- two authored child elements remain the real content
- without JS, both pieces of content remain fully visible side-by-side
- with JS, the component adds a thin interactive reveal layer with pointer and keyboard support

The refactor should make that enhancement reliable and explicit. It should not turn `compare-surface` into a heavier slideshow or image-app component.

The next implementation should deliver all of the following before any extra polish work:

- Reconnects do not duplicate divider handles.
- The numeric `position` contract matches what the docs promise.
- The "exactly two children" assumption is made explicit and enforced.
- Tests cover lifecycle and edge values.

## Files To Read First

- `src/web-components/compare-surface/logic.js`
- `src/web-components/compare-surface/styles.css`
- `src/web-components/compare-surface/static.html`
- `site/src/pages/docs/elements/web-components/comparison.njk`
- `src/htmlvalidate/elements.cjs`
- `tests/element-visual/compendium/compendium.json`

Also note:

- I did not find dedicated `tests/components` behavior tests for `compare-surface`

## What To Preserve

These parts are conceptually right and should survive the refactor:

- The static fallback is honest: both children stay visible side-by-side in `src/web-components/compare-surface/static.html:12-19`.
- The component remains light-DOM and works with arbitrary child content, not only images.
- `role="slider"` on the divider is a reasonable accessibility model for the enhancement layer.
- The CSS is simple and focused on overlapping the two authored children.

## Current Failures

### 1. Setup is not idempotent, and reconnect duplicates the divider

Evidence:

- `connectedCallback()` always appends a new divider in `src/web-components/compare-surface/logic.js:23-38`
- `disconnectedCallback()` removes listeners but does not remove the divider node in `src/web-components/compare-surface/logic.js:48-53`

Why this is bad:

- A disconnected and reconnected component can accumulate multiple handles.
- This is a straightforward lifecycle bug in a very small enhancement component.

### 2. `position="0"` is impossible even though the docs describe a `0-100` range

Evidence:

- Initial position is computed as `Number(...) || 50` in `src/web-components/compare-surface/logic.js:27`
- The docs describe `position` as ranging from `0` to `100` in `site/src/pages/docs/elements/web-components/comparison.njk:82-85`

Why this is bad:

- A documented edge value cannot actually be represented.
- That is a real public contract bug, not an implementation detail.

### 3. The component assumes "two children" but does not actually enforce that authored contract

Evidence:

- The logic only checks for "at least two" children in `src/web-components/compare-surface/logic.js:23-25`
- The defined-state CSS overlaps all non-divider children and only clips the second child in `src/web-components/compare-surface/styles.css:22-31`
- The docs consistently describe the component as operating on two children in `site/src/pages/docs/elements/web-components/comparison.njk:53-53`

Why this is bad:

- If more than two children are present, the layout becomes undefined and visually confusing.
- The authored contract should either be enforced or normalized.

### 4. Runtime state is input-only from markup and not reflected back clearly

Evidence:

- The host `position` attribute is used only at startup in `src/web-components/compare-surface/logic.js:27`
- Interaction updates CSS and ARIA state in `src/web-components/compare-surface/logic.js:92-100`
- The host attribute itself is not updated

Why this matters:

- Scripts and diagnostics can see the current `aria-valuenow`, but not a reflected host state.
- That may be fine, but the contract should be explicit instead of accidental.

### 5. Behavior coverage is missing for the real seams

Evidence:

- I found htmlvalidate metadata and compendium coverage
- I did not find component behavior tests for reconnect, keyboard movement, or edge values

Why this is bad:

- The weak points here are lifecycle and public numeric contract, not the default visual.

## Recommended Refactor Direction

## 1. Preserve the side-by-side no-JS baseline and the two-child model

Recommended direction:

- Keep the authored content visible without JS
- Treat "exactly two children" as a real contract
- Validate or normalize that contract during upgrade

## 2. Make setup and teardown fully idempotent

Required changes:

- Reuse or remove an existing divider on reconnect
- Ensure event listeners are installed exactly once

## 3. Fix numeric parsing and make the state model explicit

Refactor goal:

- Honor `0` as a valid position
- Decide whether current position should reflect back to a host attribute or remain an internal/runtime-only state
- Document that choice clearly

## 4. Add missing tests before adding more slider features

The component does not need a larger feature surface first.

## Suggested Implementation Sequence

1. Fix reconnect/idempotency around the divider.
2. Fix `position` parsing so `0` is valid.
3. Enforce or normalize the exactly-two-children contract.
4. Decide whether host-level state reflection is desirable.
5. Add behavior tests.

## Acceptance Criteria

- Reconnecting `compare-surface` does not create duplicate divider handles.
- `position="0"` behaves as documented.
- More than two authored children are either rejected clearly or normalized intentionally.
- Keyboard and pointer interaction still work with one clear divider instance.

## Tests That Should Exist After The Refactor

- A reconnect test.
- A `position="0"` test.
- A keyboard interaction test for arrow movement.
- A contract test for extra children.

## Do Not Do This

- Do not turn `compare-surface` into a richer gallery/slideshow widget.
- Do not keep the current vague "at least two children" runtime when the docs teach an exact two-child pattern.
- Do not add more visual effects before fixing lifecycle.

## Bottom Line

`compare-surface` is already the kind of thin enhancement VB wants. The refactor should mostly fix lifecycle, honor the documented numeric contract, and make the two-child assumption explicit.
