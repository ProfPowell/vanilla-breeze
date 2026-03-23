# Drag Surface Refactor Brief

## Objective

Keep `drag-surface` aligned with Vanilla Breeze's actual philosophy:

- authored content order is the real baseline
- native HTML drag-and-drop and keyboard reordering are enhancement layers over that authored order
- CSS state should stay declarative and visible in the markup, not hidden inside a larger JS model

The refactor should make that enhancement reliable and honest. It should not turn `drag-surface` into a bigger sortable framework than the repo needs.

The next implementation should deliver all of the following before any extra polish work:

- Reconnects do not duplicate live regions or listeners.
- The shipped CSS actually covers the state attributes the docs promise.
- Keyboard and mouse paths share one clear lifecycle.
- Tests cover lifecycle and not just the happy-path keyboard flow.

## Files To Read First

- `src/web-components/drag-surface/logic.js`
- `src/web-components/drag-surface/styles.css`
- `src/web-components/drag-surface/static.html`
- `site/src/pages/docs/elements/web-components/drag-surface.njk`
- `tests/components/drag-surface.spec.js`
- `src/htmlvalidate/elements.cjs`
- `tests/element-visual/compendium/compendium.json`

## What To Preserve

These parts are conceptually right and should survive the refactor:

- The static fallback is honest: ordinary ordered content still communicates sequence in `src/web-components/drag-surface/static.html:12-23`.
- Keyboard reordering is the right accessibility complement to native drag-and-drop.
- Using data attributes for visual state is philosophically right for VB.
- `group`-based cross-surface transfer is a reasonable richer enhancement.

## Current Failures

### 1. Lifecycle cleanup is missing, and reconnect will duplicate both behavior and live regions

Evidence:

- `connectedCallback()` always creates a live region and installs listeners in `src/web-components/drag-surface/logic.js:42-50`
- `#createLiveRegion()` prepends a new node each time in `src/web-components/drag-surface/logic.js:90-98`
- `#setupDragListeners()` and `#setupKeyboardListeners()` add listeners in `src/web-components/drag-surface/logic.js:112-119` and `src/web-components/drag-surface/logic.js:235-237`
- `disconnectedCallback()` does not remove those listeners or the live region in `src/web-components/drag-surface/logic.js:52-58`

Why this is bad:

- Reconnecting the component can duplicate announcements, events, and keyboard behavior.
- The bound listeners are especially problematic because they are attached through inline `bind(this)` calls and cannot be cleanly removed later.

### 2. The docs promise a richer CSS/state system than the shipped stylesheet provides

Evidence:

- The docs describe CSS-driven visual states such as `data-dragging`, `data-drop-target`, `data-reorder-mode`, `data-just-dropped`, and a flash animation in `site/src/pages/docs/elements/web-components/drag-surface.njk:171-208`
- The docs also mention reduced-motion animation handling in `site/src/pages/docs/elements/web-components/drag-surface.njk:345-346`
- The shipped stylesheet is only a minimal host rule in `src/web-components/drag-surface/styles.css:1-12`

Why this is bad:

- The runtime does set many state attributes.
- But the component stylesheet does not actually implement the visual system the docs describe.
- That is a clear docs/runtime gap.

### 3. Mouse and keyboard behavior share state conceptually, but not through one explicit lifecycle model

Evidence:

- Mouse drag uses the static `#activeDrag` state and drag events in `src/web-components/drag-surface/logic.js:121-230`
- Keyboard reorder uses `aria-grabbed`, `data-reorder-mode`, and `#keyboardOriginalIndex` in `src/web-components/drag-surface/logic.js:239-387`

Why this matters:

- The current behavior works in many cases, but the lifecycle is spread across two different state models.
- That increases the risk of subtle regressions when reconnect or cross-surface interactions are involved.

### 4. Reduced-motion intent is present in JS/docs but not coherently implemented

Evidence:

- The component stores `#reducedMotion` in `src/web-components/drag-surface/logic.js:38` and sets it in `src/web-components/drag-surface/logic.js:44`
- The docs describe reduced-motion behavior in `site/src/pages/docs/elements/web-components/drag-surface.njk:345-346`
- The component stylesheet does not currently contain the promised animation/state system to honor that contract

Why this is bad:

- The repo is describing a motion contract that is only partially real.

### 5. The current tests are strong on keyboard happy paths but weak on lifecycle and styling contract

Evidence:

- The component has good keyboard and transfer tests in `tests/components/drag-surface.spec.js:18-244`
- I did not find reconnect tests or tests that the documented CSS-state contract is actually implemented

Why this is bad:

- The biggest remaining risks are lifecycle duplication and docs/CSS drift.
- The existing suite does not protect those seams.

## Recommended Refactor Direction

## 1. Preserve the authored-order baseline and CSS-state philosophy

Recommended direction:

- Keep authored child order as the core model
- Keep the state attributes as the styling contract
- Do not replace that with a hidden JS-only data model

## 2. Make lifecycle fully reversible and idempotent

Required changes:

- Create the live region once
- Store listener references explicitly
- Remove listeners on disconnect
- Reconnect must restore behavior exactly once

## 3. Make the shipped stylesheet match the documented state model

Choose one:

- Implement the documented visual states and motion rules in the component stylesheet
- Or shrink the docs to the styling contract that actually ships

The current mismatch is the problem.

## 4. Tighten the shared state model between pointer drag and keyboard reorder

Refactor goal:

- Clear ownership for "active item," "drop target," and "commit/cancel" state
- Predictable cleanup when a drag/reorder ends or the component disconnects

## Suggested Implementation Sequence

1. Add explicit listener/live-region teardown and reconnect safety.
2. Align the CSS-state contract with the docs.
3. Normalize active-state handling across mouse and keyboard paths.
4. Add lifecycle and CSS-contract tests.

## Acceptance Criteria

- Reconnecting `drag-surface` does not create duplicate live regions or duplicate events.
- The component stylesheet implements the visible state attributes the docs teach, or the docs are reduced to the shipped contract.
- Keyboard and mouse reorder still work after lifecycle changes.
- Reduced-motion behavior is either real or honestly undocumented.

## Tests That Should Exist After The Refactor

- A reconnect test verifying one live region and one event sequence.
- A CSS-state contract test for `data-dragging`, `data-drop-target`, and `data-just-dropped`.
- A mouse-drag lifecycle test, not only keyboard reorder.
- A grouped-surfaces lifecycle test after reconnect.

## Do Not Do This

- Do not replace the CSS-state model with a hidden sortable framework.
- Do not keep docs describing styling/motion that the shipped stylesheet does not implement.
- Do not leave the current reconnect duplication path in place while adding more behaviors.

## Bottom Line

`drag-surface` already has the right baseline and a solid keyboard story. The refactor should mostly make lifecycle safe and make the docs/CSS contract truthful.
