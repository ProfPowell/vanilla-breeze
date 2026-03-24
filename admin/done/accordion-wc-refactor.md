# Accordion WC Refactor Brief

## Objective

Keep `accordion-wc` aligned with Vanilla Breeze's actual philosophy:

- authored `<details>/<summary>` markup is the real interaction model
- the web component is a light enhancement layer for keyboard focus movement, optional single-open polyfill behavior, and optional view transitions
- the visual variants remain CSS-first and should not require a heavier widget architecture

The refactor should make that enhancement reliable. It should not replace the native disclosure pattern with a larger custom accordion state system.

The next implementation should deliver all of the following before any extra polish work:

- Reconnects do not duplicate listeners or custom events.
- Enhancement works with real authored disclosure content, not only a one-wrapper panel shape.
- ARIA additions stay minimal and remain in sync with native `<details>` state.
- Docs and tests describe the same baseline and enhancement contract the code actually ships.

## Files To Read First

- `src/web-components/accordion-wc/logic.js`
- `src/web-components/accordion-wc/styles.css`
- `src/web-components/accordion-wc/static.html`
- `site/src/pages/docs/elements/web-components/accordion.njk`
- `tests/components/accordion.spec.js`
- `src/htmlvalidate/elements.cjs`
- `tests/element-visual/compendium/compendium.json`

## What To Preserve

These parts are conceptually right and should survive the refactor:

- The static fallback is honest about the baseline: plain `<details>` works without JS in `src/web-components/accordion-wc/static.html:74-98`.
- The component is already built on native disclosure behavior instead of replacing it with custom div/button markup.
- `single` is best understood as a polyfill/support layer for the native `name` behavior, not as a separate accordion model.
- The styling variants are host-attribute driven and do not require the component to own all presentation logic.
- View Transitions can remain an optional richer layer.

## Current Failures

### 1. Setup is not idempotent, and teardown is effectively missing

Evidence:

- `connectedCallback()` always re-runs setup in `src/web-components/accordion-wc/logic.js:36-45`
- `disconnectedCallback()` only removes `data-upgraded` in `src/web-components/accordion-wc/logic.js:47-49`
- `#setup()` adds `click`, `keydown`, and `toggle` listeners in `src/web-components/accordion-wc/logic.js:73-105`

Why this is bad:

- Moving the element in the DOM or reconnecting it can stack listeners on the same summaries/details.
- That creates duplicate keyboard handling and duplicate `accordion-wc:toggle` events.
- For a light-DOM enhancement component, reconnect safety matters more than adding more features.

### 2. The enhancement assumes a single panel wrapper even though native `<details>` allows richer content

Evidence:

- `#initVT()` grabs only the first `:scope > :not(summary)` node in `src/web-components/accordion-wc/logic.js:59-64`
- `#setup()` does the same in `src/web-components/accordion-wc/logic.js:76-91`
- The static fallback describes everything after `<summary>` as normal disclosure content in `src/web-components/accordion-wc/static.html:93-98`

Why this is bad:

- Only the first non-summary child gets `aria-labelledby`, `role="region"`, and VT hookup.
- Authored disclosures with multiple sibling nodes after `summary` are valid baseline HTML, but the enhancement only partially understands them.
- That means the enhancement contract is narrower than the native baseline it claims to preserve.

### 3. The ARIA layer is more imperative than the baseline needs

Evidence:

- `summary` gets `aria-expanded` and `aria-controls` in `src/web-components/accordion-wc/logic.js:87-89`
- The first content node gets `aria-labelledby` and `role="region"` in `src/web-components/accordion-wc/logic.js:90-91`
- `#handleToggle()` manually keeps `aria-expanded` in sync in `src/web-components/accordion-wc/logic.js:108-121`

Why this is bad:

- Native `<summary>` / `<details>` already provide the real disclosure semantics.
- Every manually mirrored state becomes another place to drift from the source of truth.
- This may still be worth doing in some cases, but the refactor should justify each ARIA addition instead of accumulating them automatically.

### 4. Test coverage is only protecting the baseline, not the enhancement seams

Evidence:

- The behavior tests cover basic click and native Enter/Space toggling in `tests/components/accordion.spec.js:25-76`
- I did not find coverage for arrow-key focus movement, reconnect behavior, or multi-sibling content structures

Why this is bad:

- The fragile parts here are lifecycle and enhancement assumptions, not basic `<details>` behavior.
- Native disclosure behavior will keep passing even if the component-specific layer regresses.

## Recommended Refactor Direction

## 1. Preserve native disclosure as the source of truth

Recommended direction:

- Keep `<details>` and `open` as the real state model
- Keep `summary` as the real control
- Keep the component focused on enhancement, not replacement

Why this fits VB better:

- It respects the authored HTML as the baseline.
- It keeps the JS layer smaller and easier to trust.

## 2. Make setup and teardown fully idempotent

Required changes:

- Add a build/setup guard
- Track all event listeners so they can be removed on disconnect
- Reconnect must restore behavior exactly once

If teardown removes nothing and setup always adds more, the component is not production-safe.

## 3. Decide and document the panel-content contract

Pick one of these and make it explicit:

- Require a single wrapper after `summary` and validate for it
- Or wrap all post-summary sibling content into one panel element during upgrade

The current half-state is the problem. The authored baseline allows richer content than the enhancement actually handles.

## 4. Keep ARIA additions minimal and derived from native state

Recommended direction:

- Let `detail.open` remain the source of truth
- Only add relationships that the component can keep correct
- Re-evaluate whether every panel needs `role="region"` or whether that should depend on a stable panel wrapper

The goal is not fewer accessibility semantics at all costs. The goal is semantics that stay correct.

## 5. Expand tests around the actual enhancement seams

At minimum, add tests for:

- ArrowUp / ArrowDown / Home / End focus movement
- Single-open behavior when `single` is present
- Reconnect without duplicate events
- Disclosure content with multiple post-summary siblings

## Suggested Implementation Sequence

1. Add a setup guard and explicit listener cleanup.
2. Decide the panel-content contract and update `#setup()` and `#initVT()` to match it.
3. Simplify ARIA syncing so native `open` stays the source of truth.
4. Update docs and static fallback notes if the content contract becomes stricter.
5. Add behavior tests for lifecycle, keyboard movement, and richer content shapes.

## Acceptance Criteria

- Disconnecting and reconnecting an `accordion-wc` does not duplicate keyboard behavior or custom events.
- Arrow-key focus movement works once and only once.
- `single` mode still behaves correctly with native `name` support and with the JS polyfill path.
- Authored disclosure content either upgrades correctly with multiple siblings or fails in a clearly documented way.
- `accordion-wc:toggle` fires once per real toggle.

## Tests That Should Exist After The Refactor

- A reconnect test that moves an accordion in the DOM and verifies one event per toggle.
- A keyboard test for ArrowUp, ArrowDown, Home, and End.
- A content-shape test where a `<details>` panel has multiple siblings after `summary`.
- A `single` mode test that verifies only one panel stays open.

## Do Not Do This

- Do not replace `<details>/<summary>` with custom button + div markup.
- Do not turn the component into a separate accordion state machine when the browser already provides the baseline.
- Do not add more ARIA just because it looks component-like on paper.

## Bottom Line

`accordion-wc` already starts from the right baseline. The refactor should mostly remove lifecycle brittleness and tighten the authored-content contract, not reinvent the accordion pattern.
