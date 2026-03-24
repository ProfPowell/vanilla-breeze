# Toast Msg Refactor Brief

## Objective

Keep `toast-msg` aligned with Vanilla Breeze's actual philosophy:

- baseline feedback should still exist without JavaScript as inline status, server-rendered confirmation, or page-level messaging
- `toast-msg` is an imperative enhancement surface for transient notifications, not the baseline content container itself
- the web component should stay small: queueing, placement, dismissal, and announcement behavior

The refactor should make that enhancement honest and reliable. It should not turn `toast-msg` into a declarative message framework that tries to replace normal feedback patterns.

The next implementation should deliver all of the following before any extra polish work:

- the component has one clear API across runtime, docs, validators, and fixtures
- announcement semantics are appropriate for the message severity
- timers, queueing, and disconnect cleanup are predictable
- the imperative service-element model is documented clearly
- tests protect the queue, ARIA, and lifecycle seams that matter

## Files To Read First

- `src/web-components/toast-msg/logic.js`
- `src/web-components/toast-msg/styles.css`
- `src/web-components/toast-msg/static.html`
- `site/src/pages/docs/elements/web-components/toast.njk`
- `src/htmlvalidate/elements.cjs`
- `tests/element-visual/compendium/compendium.json`
- `demos/examples/demos/toast-basic.html`

## What To Preserve

These parts are conceptually right and should survive the refactor:

- `toast-msg` is programmatic on purpose; the author places a container once and calls `.show()`
- the static fallback story in `src/web-components/toast-msg/static.html:12-28` is directionally right: baseline feedback is inline and durable, not ephemeral floating UI
- the fixed-position container plus queue/max-visible model is a sensible enhancement layer for VB
- the visual styling is CSS-first and already decoupled from the imperative API

The main problem is not that `toast-msg` is imperative. The problem is that its repo contract and accessibility semantics are still blurry.

## Current Failures

### 1. The component contract is split across runtime and visual tooling

Evidence:

- Runtime reads plain attributes `position`, `duration`, and `max` in `src/web-components/toast-msg/logic.js:7-9`, `src/web-components/toast-msg/logic.js:188-195`, and `src/web-components/toast-msg/styles.css:23-63`
- htmlvalidate also documents plain attributes in `src/htmlvalidate/elements.cjs:574-583`
- the visual compendium still renders `data-position` in `tests/element-visual/compendium/compendium.json:4212`, `tests/element-visual/compendium/compendium.json:4220`, and `tests/element-visual/compendium/compendium.json:4228`

Why this is bad:

- Runtime, validator metadata, and fixtures are not exercising the same API.
- The current fixture set can still look visually correct because `top-end` is also the default, which means the mismatch is easy to miss.
- That weakens trust in the visual layer.

### 2. Announcement semantics are too blunt for a component that presents four severities

Evidence:

- The host is marked as a polite live region in `src/web-components/toast-msg/logic.js:31-35`
- Every generated toast is also marked `role="alert"` in `src/web-components/toast-msg/logic.js:77-81`
- The static fallback distinguishes polite status messaging from alert-level error messaging in `src/web-components/toast-msg/static.html:37-54`

Why this is bad:

- `info`, `success`, `warning`, and `error` are all announced with the same assertive semantics once JS runs.
- That undermines the more nuanced baseline story already present in the static artifact.
- The component should not become noisier and less disciplined than the fallback.

### 3. The docs do not make the imperative-service model explicit enough

Evidence:

- The static artifact explains that the no-JS baseline is inline status and server-response messaging in `src/web-components/toast-msg/static.html:12-28` and `src/web-components/toast-msg/static.html:56-67`
- The docs page focuses almost entirely on the floating container API in `site/src/pages/docs/elements/web-components/toast.njk:145-156` and later examples
- htmlvalidate intentionally permits no child content in `src/htmlvalidate/elements.cjs:574-577`

Why this is bad:

- The repo does contain the right progressive-enhancement idea, but it is split between static fallback documentation and the component page.
- Someone refactoring from the docs alone could easily treat `toast-msg` like the baseline message system instead of an enhancement layer over existing feedback patterns.

### 4. Disconnect cleanup is weaker than it should be for a timer-driven component

Evidence:

- `connectedCallback()` only sets ARIA/state attributes in `src/web-components/toast-msg/logic.js:31-35`
- `disconnectedCallback()` only removes `data-upgraded` in `src/web-components/toast-msg/logic.js:38-40`
- Auto-dismiss timers are stored per toast in `src/web-components/toast-msg/logic.js:124-128`
- Internal queue and visible arrays are maintained in `src/web-components/toast-msg/logic.js:24-25`, `src/web-components/toast-msg/logic.js:65-71`, and `src/web-components/toast-msg/logic.js:152-161`

Why this is bad:

- If the host is removed mid-flight, the component keeps internal queue/timer state around without a full teardown path.
- That is not necessarily a user-visible crash today, but it is avoidable lifecycle debt in a small component.
- VB service components should still clean up after themselves.

### 5. The current test surface does not protect the important behavior

Evidence:

- I found visual compendium coverage for open toasts in `tests/element-visual/compendium/compendium.json:4199-4229`
- I did not find component behavior tests for `toast-msg`

Why this is bad:

- The important regressions here are not just visual.
- Queue ordering, dismiss behavior, ARIA behavior, and disconnect cleanup are the real contract edges.

## Recommended Refactor Direction

## 1. Keep `toast-msg` imperative and small

Recommended direction:

- preserve `.show()` and `.dismissAll()`
- preserve the single host container pattern
- preserve the assumption that baseline feedback exists elsewhere

Do not redesign this into authored inline child markup unless the whole repo intentionally wants a different component.

## 2. Pick one attribute API and use it everywhere

The cleanest contract today is already visible in runtime and htmlvalidate:

- `position`
- `duration`
- `max`

Bring compendium fixtures and any remaining demos onto that API.

## 3. Make severity-to-announcement behavior intentional

Refactor goal:

- `error` may justify `alert`
- neutral and success states likely belong on a polite status path
- the host and child roles should not fight each other

This is the most important accessibility decision in the component.

## 4. Document the real progressive-enhancement story

The docs should say clearly:

- `toast-msg` is not the no-JS fallback itself
- the no-JS fallback is ordinary inline/server feedback
- the component adds transient floating notification UX on top of that

That is more VB-aligned than pretending every enhancement must contain its own baseline markup.

## 5. Add real teardown discipline

Required fixes:

- clear outstanding dismiss timers on disconnect
- reset or discard queued/visible state on teardown
- make reconnect behavior predictable even if the host was removed while toasts were active

## Suggested Implementation Sequence

1. Align compendium fixtures with the real plain-attribute API.
2. Decide and implement announcement semantics by severity.
3. Add explicit disconnect cleanup for timers and queues.
4. Tighten the docs around the service-element baseline story.
5. Add behavior tests for queueing, dismiss, and ARIA.

## Acceptance Criteria

Claude should not call the refactor done until all of these are true:

- Runtime, docs, htmlvalidate, and visual fixtures all use the same attribute API.
- Neutral/success toasts are not announced as though they were all urgent alerts unless that choice is deliberate and documented.
- Error messaging still gets appropriate urgency.
- Removing the host while timers are active does not leave stale component state behind.
- The docs clearly explain that baseline feedback lives outside `toast-msg`.

## Tests That Should Exist After The Refactor

At minimum add automated coverage for:

- default position and explicit position variants
- queueing when visible toast count exceeds `max`
- manual dismiss vs auto-dismiss
- announcement behavior for at least one polite variant and one alert variant
- disconnect while a timer is pending
- `dismissAll()` clearing both visible and queued notifications

## Do Not Do This

- Do not rewrite `toast-msg` as a declarative message list that replaces inline/server feedback.
- Do not blur the difference between baseline messaging and transient enhancement UI.
- Do not leave the compendium on a different attribute API than runtime.
- Do not treat accessibility semantics as cosmetic.

## Bottom Line

The right refactor for `toast-msg` is to keep it small and imperative, then make its contract sharper: one API, one honest baseline story, and better ARIA/lifecycle discipline.
