# Print Page Refactor Brief

## Objective

Keep `print-page` aligned with Vanilla Breeze's actual philosophy:

- the real printing model is still the browser's native print flow
- the component is only a thin convenience wrapper over `window.print()` and VB's print CSS
- authored text inside the element should remain the source of truth for the label unless the component clearly documents otherwise

The refactor should make that wrapper predictable. It should not turn `print-page` into a larger print state system.

The next implementation should deliver all of the following before any extra polish work:

- Reconnects do not lose or corrupt the authored label contract.
- `raw-toggle` cleanup is robust even when `afterprint` is unreliable.
- The ARIA wrapper semantics are only applied when they are actually needed.
- Docs describe the same grouping and cleanup behavior the runtime ships.

## Files To Read First

- `src/web-components/print-page/logic.js`
- `src/web-components/print-page/styles.css`
- `src/web-components/print-page/static.html`
- `site/src/pages/docs/elements/web-components/print-page.njk`
- `src/utils/print.css`
- `tests/components/print-page.spec.js`
- `src/htmlvalidate/elements.cjs`
- `tests/element-visual/compendium/compendium.json`

## What To Preserve

These parts are conceptually right and should survive the refactor:

- The static fallback is honest: the browser already has a print command in `src/web-components/print-page/static.html:12-21`.
- `print-page` is small and appropriately narrow.
- `raw-toggle` is a sensible user-facing bridge to `data-print-raw`.
- The actual print-hiding behavior lives in shared print CSS, which fits VB better than making the component own all print styling.

## Current Failures

### 1. Setup destroys the authored light-DOM contract, and reconnect changes the label source

Evidence:

- `connectedCallback()` derives the label from current text content in `src/web-components/print-page/logic.js:24-26`
- It then clears the element with `this.innerHTML = ''` in `src/web-components/print-page/logic.js:28`

Why this is bad:

- On first upgrade, the authored text is consumed and replaced by generated controls.
- On reconnect, the next label is derived from the already-generated button and checkbox text rather than the original authored content.
- That is a classic light-DOM idempotency bug.

### 2. `role="group"` is applied more broadly than the docs claim

Evidence:

- The runtime always sets `role="group"` in `src/web-components/print-page/logic.js:29`
- The docs say the component sets `role="group"` when both button and toggle are present in `site/src/pages/docs/elements/web-components/print-page.njk:95-100`

Why this is bad:

- A single native button does not need to be wrapped in an ARIA group.
- This is small, but it is a clear docs/runtime mismatch.

### 3. Raw-mode cleanup is less robust than the comment and docs imply

Evidence:

- The docs say `data-print-raw` is removed after printing in `site/src/pages/docs/elements/web-components/print-page.njk:65-70`
- The runtime comment says "Use both afterprint and a timeout fallback" in `src/web-components/print-page/logic.js:64-67`
- But the implementation only adds `afterprint` cleanup in `src/web-components/print-page/logic.js:67-72`

Why this is bad:

- If `afterprint` is not fired reliably, `data-print-raw` can stick on `<html>`.
- That turns a one-time user action into a lingering global page state bug.

### 4. The current tests do not protect the real lifecycle seam

Evidence:

- The tests cover rendering, raw-toggle presence, print-media hiding, and raw cleanup in `tests/components/print-page.spec.js:14-123`
- I did not find coverage for reconnect behavior or label preservation across reconnect

Why this is bad:

- The most likely regression here is not "does the button exist."
- It is "does the component still respect the authored label/fallback contract after lifecycle events."

## Recommended Refactor Direction

## 1. Preserve the authored label as the stable source of truth

Recommended direction:

- Capture the initial authored label once
- Reuse that stored label on reconnect
- Avoid re-deriving state from already-generated internal markup

## 2. Apply grouping semantics only when multiple controls exist

Refactor goal:

- No `role="group"` for the single-button case
- `role="group"` only when the checkbox is actually present

## 3. Make raw-mode cleanup defensible

Required changes:

- Keep `afterprint`
- Add a timeout or other fallback cleanup path
- Ensure the cleanup is safe even if the print dialog is cancelled or behaves differently across browsers

## 4. Keep the component thin and print.css-driven

What should not change:

- `window.print()` remains the real behavior
- shared print CSS remains the place where print-mode hiding and raw mode actually matter

## Suggested Implementation Sequence

1. Capture and preserve the authored label contract.
2. Make setup idempotent across reconnects.
3. Narrow `role="group"` to the multi-control case.
4. Add real raw-mode cleanup fallback.
5. Add reconnect tests.

## Acceptance Criteria

- Reconnecting `print-page` does not change the label unexpectedly.
- `role="group"` is only present when both button and toggle are rendered.
- `data-print-raw` does not linger if `afterprint` fails to fire.
- The no-JS baseline still reads as a simple instruction or authored text.

## Tests That Should Exist After The Refactor

- A reconnect test for label preservation.
- A reconnect test for `raw-toggle` duplication or drift.
- A cleanup test that simulates missing `afterprint` and verifies timeout fallback.
- A semantic test for `role="group"` only in the two-control case.

## Do Not Do This

- Do not grow `print-page` into a larger print-settings component.
- Do not keep deriving state from already-generated markup.
- Do not put print-specific behavior into the component that belongs in shared print CSS.

## Bottom Line

`print-page` is philosophically close already. The refactor mostly needs to make the light-DOM contract and raw-mode cleanup reliable.
