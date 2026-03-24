# Carousel WC Refactor Brief

## Objective

Keep `carousel-wc` aligned with Vanilla Breeze's actual philosophy:

- direct child content remains the real slide content
- without JS, the carousel is still a browsable horizontal scroll surface
- with JS, the component adds controls, indicators, keyboard support, autoplay, and optional persistence

The refactor should make that enhancement reliable. It should not turn the component into a larger app-like carousel framework that obscures the authored content.

The next implementation should deliver all of the following before any extra polish work:

- Upgrade happens once and remains safe across disconnect/reconnect.
- Autoplay and gesture listeners are cleaned up correctly.
- The two runtime modes, scroll-snap and View Transition mode, share one clear lifecycle contract.
- Indicator semantics are honest and minimal.
- Tests cover the actual risk areas rather than only initial rendering.

## Files To Read First

- `src/web-components/carousel-wc/logic.js`
- `src/web-components/carousel-wc/styles.css`
- `src/web-components/carousel-wc/static.html`
- `site/src/pages/docs/elements/web-components/carousel.njk`
- `tests/components/carousel.spec.js`
- `src/htmlvalidate/elements.cjs`
- `tests/element-visual/compendium/compendium.json`

## What To Preserve

These parts are conceptually right and should survive the refactor:

- The static fallback is strong: a scrollable row with visible slides in `src/web-components/carousel-wc/static.html:9-20`.
- The host uses direct child content as the slide source instead of requiring a separate template system.
- Keyboard navigation, autoplay, and persistence are reasonable enhancement features on top of the authored content.
- Reduced-motion handling is a good baseline principle.
- View Transition mode can remain an optional richer presentation layer.

## Current Failures

### 1. Upgrade is destructive and not reconnect-safe

Evidence:

- `connectedCallback()` moves all host children into a generated track and injects buttons, indicators, and a live region in `src/web-components/carousel-wc/logic.js:61-188`
- `disconnectedCallback()` removes only a small subset of behavior in `src/web-components/carousel-wc/logic.js:191-200`
- There is no setup guard or DOM restoration path

Why this is bad:

- Reconnecting the component can rebuild chrome on top of already-mutated DOM.
- That makes the authored-child contract unpredictable over time.
- A progressive-enhancement carousel should be allowed to move in the DOM without compounding itself.

### 2. Listener teardown is incomplete, especially for autoplay and VT gesture wiring

Evidence:

- `#setupAutoplay()` adds `mouseenter`, `mouseleave`, `focusin`, `focusout`, and `touchstart` listeners in `src/web-components/carousel-wc/logic.js:345-360`
- Those listeners are never removed in `disconnectedCallback()`
- VT mode adds `swipe-left` and `swipe-right` listeners in `src/web-components/carousel-wc/logic.js:149-155`
- `disconnectedCallback()` only calls the gesture cleanup helper and removes the track keydown listener in `src/web-components/carousel-wc/logic.js:193-200`

Why this is bad:

- Reconnects can produce repeated pause/play behavior and repeated swipe navigation.
- Autoplay bugs are especially hard to reason about when multiple copies of the same listeners remain active.

### 3. Indicator semantics are borrowed from tabs rather than from the carousel's own contract

Evidence:

- Indicators are given `role="tablist"` and each dot gets `role="tab"` in `src/web-components/carousel-wc/logic.js:103-119`
- The docs repeat that semantics story in `site/src/pages/docs/elements/web-components/carousel.njk:203-206`

Why this is bad:

- A carousel is not automatically a tabs interface.
- Borrowing tab semantics from another pattern raises the accessibility burden without clearly improving the baseline.
- Simple buttons with clear labels may fit the component better unless the full tabs-style relationship model is actually justified.

### 4. The component really has two implementations, but they are not treated as first-class lifecycle modes

Evidence:

- Mode selection happens via `transition` plus View Transition support in `src/web-components/carousel-wc/logic.js:65-67`
- Scroll-snap mode uses `IntersectionObserver` in `src/web-components/carousel-wc/logic.js:158-165`
- VT mode hides all but one slide and uses `hidden` plus swap transitions in `src/web-components/carousel-wc/logic.js:171-177` and `src/web-components/carousel-wc/logic.js:224-252`
- The docs describe these as distinct behaviors in `site/src/pages/docs/elements/web-components/carousel.njk:228-243`

Why this is bad:

- Bugs can be fixed in one mode while quietly surviving in the other.
- A refactor needs to make shared lifecycle, teardown, and navigation rules explicit across both paths.

### 5. Test coverage is too shallow for the real failure modes

Evidence:

- The current tests only verify visibility, that some buttons exist, and that the track can receive focus in `tests/components/carousel.spec.js:14-39`

Why this is bad:

- The biggest risks are reconnect behavior, autoplay pause/resume correctness, persistence, swipe behavior, and mode differences.
- The current tests do not protect any of those seams.

## Recommended Refactor Direction

## 1. Preserve the scroll-snap baseline and direct-child slide contract

Recommended direction:

- Keep authored direct children as slides
- Keep no-JS horizontal browsing intact
- Keep JS focused on controls and richer interaction, not content ownership

This is already the strongest part of the component.

## 2. Make upgrade either reversible or strictly one-time and idempotent

Required changes:

- Add a build guard
- Decide whether teardown restores authored children or whether reconnect simply rebinds existing upgraded DOM
- Do not allow the host to be rebuilt repeatedly without a controlled lifecycle

Either approach can work. The current implicit mutation-on-every-connect path cannot.

## 3. Centralize listener registration and teardown

Refactor goal:

- Every listener added by autoplay, buttons, keyboard support, persistence, or gestures must have a matching removal path
- Mode-specific listeners should be tracked separately from shared listeners

This matters more than adding more carousel options.

## 4. Re-evaluate indicator semantics

Recommended direction:

- Prefer indicator buttons with clear labels unless a stronger semantics model is truly needed
- If tab semantics remain, justify them and implement the full relationship model intentionally

The refactor should reduce semantic drift, not add more of it.

## 5. Treat scroll-snap mode and VT mode as two explicit enhancement layers over the same API

Implementation guidance:

- Shared navigation methods should stay the same
- Shared teardown rules should stay the same
- Mode-specific observers and listeners should be installed and removed predictably

## Suggested Implementation Sequence

1. Add a build guard and decide the reconnect strategy.
2. Move listener wiring into explicit registration/cleanup paths.
3. Normalize shared state updates across scroll-snap and VT mode.
4. Simplify or justify indicator semantics.
5. Add tests for reconnect, autoplay, persistence, and both runtime modes.

## Acceptance Criteria

- Reconnecting a `carousel-wc` does not duplicate buttons, indicators, or listeners.
- Hover/focus/touch pause logic fires once and resumes once.
- Swipe navigation works once per gesture in VT mode.
- Scroll-snap mode and VT mode both honor the same public navigation API.
- The no-JS baseline still presents all slides as browsable content.

## Tests That Should Exist After The Refactor

- A reconnect test that verifies one set of controls after remount.
- An autoplay lifecycle test for pause/resume on hover and focus.
- A persistence test for `persist`.
- A VT-mode test covering next/prev and swipe behavior.
- A non-VT test covering observer-driven current-index updates.

## Do Not Do This

- Do not hide the slides behind a larger app shell that only works with JS.
- Do not move to a shadow-DOM-only architecture just to simplify internal code.
- Do not keep adding mode-specific behavior without a shared lifecycle contract.

## Bottom Line

`carousel-wc` already has the right baseline. The refactor should mostly make upgrade and teardown trustworthy, then tighten the semantics around indicators and the two-mode architecture.
