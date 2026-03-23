# Slide Accept Refactor Brief

## Objective

Keep `slide-accept` aligned with Vanilla Breeze's actual philosophy:

- baseline content should remain readable without JavaScript
- CSS should remain the main source of visual truth
- JavaScript should enhance that baseline into a draggable confirmation control

The refactor should make that upgrade path reliable. It should not overcomplicate a component whose main value is a focused interaction on top of a simple fallback.

The next implementation should deliver all of the following before any extra polish work:

- The spring-back / attractor behavior is smooth and interruptible without jumps.
- Reduced-motion mode remains correct, not just visually quieter.
- The visual contract lives in CSS rather than inline JS overrides.
- The fallback story is consistent across runtime, docs, validators, and static examples.
- Public attributes are parsed and documented coherently.

## Files To Read First

- `src/web-components/slide-accept/logic.js`
- `src/web-components/slide-accept/styles.css`
- `src/web-components/slide-accept/static.html`
- `demos/examples/demos/slide-accept-basic.html`
- `site/src/pages/docs/elements/web-components/slide-accept.njk`
- `src/htmlvalidate/elements.cjs`
- `tests/element-visual/compendium/compendium.json`

## What To Preserve

These parts are conceptually right and should survive the refactor:

- The text-content / readable fallback idea is appropriate for VB.
- The main visual treatment belongs in CSS.
- The JS layer should stay focused on interaction, not take over presentation more than necessary.
- The component can stay fairly small; it does not need to become a large generic widget framework.

## Current Failures

### 1. The spring-back interruption math reads the wrong CSS property

Evidence:

- Drag restart during spring-back reads `getComputedStyle(this.#handle).left` in `src/web-components/slide-accept/logic.js:99-105`
- The handle is actually positioned with `inset-inline-start`, not `left`, in `src/web-components/slide-accept/styles.css:56-59`
- The transition itself also animates `inset-inline-start` in `src/web-components/slide-accept/styles.css:81-83`

Why this is bad:

- Re-grabbing the handle while it is springing back can calculate the wrong current position.
- This is the most likely source of the "attractor" / snap-back weirdness you reported.
- The bug is in the seam between JS state and CSS positioning, not in the basic concept of the component.

### 2. Threshold parsing is lossy and not clamped

Evidence:

- `#threshold` is `Number(this.getAttribute('threshold')) || 90` in `src/web-components/slide-accept/logic.js:37-39`

Why this is bad:

- `threshold="0"` can never work because `0 || 90` becomes `90`.
- Invalid, negative, or `>100` values are not normalized.
- The docs describe `threshold` as a real 0-100 percentage in `site/src/pages/docs/elements/web-components/slide-accept.njk:123-126`, but the runtime contract is looser than the docs imply.

### 3. Reduced-motion can leave the host stuck in a transitional state

Evidence:

- Spring-back sets `[transitioning]` in `src/web-components/slide-accept/logic.js:183-186`
- Cleanup depends on `transitionend` from the handle in `src/web-components/slide-accept/logic.js:170-172`
- Reduced-motion forces transition duration to `0s` in `src/web-components/slide-accept/styles.css:178-187`

Why this is bad:

- In reduced-motion environments, `transitionend` is not guaranteed to fire.
- The host can remain marked `[transitioning]`, which changes later drag behavior and motion state.
- That is a correctness bug in an accessibility path.

### 4. Visual styling is hardcoded inline in JS

Evidence:

- The handle gets inline `box-shadow`, `border-width`, and `transform` overrides in `src/web-components/slide-accept/logic.js:50-53`
- The CSS already defines the handle appearance in `src/web-components/slide-accept/styles.css:54-74`

Why this is bad:

- JS is fighting the stylesheet to suppress theme defaults.
- This pushes the component away from VB's CSS-first model.
- Theme and motion work get harder because presentation and behavior are entangled.

### 5. The repo has conflicting fallback and attribute stories

Evidence:

- CSS fallback is a pill-shaped inline element in `src/web-components/slide-accept/styles.css:4-13`
- `static.html` says the no-JS fallback is a checkbox confirmation form in `src/web-components/slide-accept/static.html:20-23` and implements that at `src/web-components/slide-accept/static.html:108-117`
- Docs describe the no-JS state as visible text content in `site/src/pages/docs/elements/web-components/slide-accept.njk:66-72` and `site/src/pages/docs/elements/web-components/slide-accept.njk:87-89`
- htmlvalidate still advertises `data-label`, `data-activated-label`, `data-attention`, and `data-threshold` in `src/htmlvalidate/elements.cjs:505-513`, while the runtime uses plain attributes

Why this is bad:

- The component's progressive-enhancement story is not one story.
- Anyone trying to improve it is starting from contradictory source material.

### 6. The previous brief overstated live attribute reactivity

Evidence:

- The earlier review leaned toward `observedAttributes` as a primary concern

Why this matters:

- In VB, the first priority is reliable upgrade behavior from initial markup plus resilient fallback.
- Live attribute mutation can be useful, but it is not the philosophical center of this component.
- The more important issue is whether initial attributes are parsed predictably and documented honestly.

### 7. Tests are not protecting the real risk areas

Evidence:

- I only found a visual compendium entry for `slide-accept` in `tests/element-visual/compendium/compendium.json:3778-3788`
- I did not find component-specific behavior tests for drag, spring-back interruption, reduced motion, or keyboard behavior

Why this is bad:

- The bugs here are interaction bugs.
- Static render fixtures will not catch them.

## Recommended Refactor Direction

## 1. Keep the upgrade model simple, but make the motion contract coherent

Recommended direction:

- Preserve the text fallback
- Preserve CSS ownership of the basic visual treatment
- Fix the motion seam so JS and CSS read and write the same position model

Preferred approach:

- Keep the spring-back CSS-driven if possible
- But make interruption logic use the same positioning primitive the CSS is animating

Only move more motion into JS if the CSS-first path cannot be made reliable.

## 2. Move the full visual contract back into CSS

Refactor goal:

- Remove the inline style override from `connectedCallback()`
- Express handle surface, shadow, and state styling through CSS rules and custom properties
- Let themes override the component without JS involvement

## 3. Make attribute handling predictable, not necessarily framework-reactive

Required:

- Clamp and normalize `threshold`
- Make initial `label`, `activated-label`, `attention`, and `threshold` parsing coherent
- Align docs and validators with the actual attribute API

Optional:

- Add live attribute reactivity if it is useful and low-risk

Do not make that the first goal.

## 4. Choose one fallback story and align the repo around it

The following must agree with each other:

- component CSS fallback
- `static.html`
- docs page
- htmlvalidate metadata
- demos / fixtures

Do not leave the component documented as text-only in one place and checkbox-based in another.

## 5. Add behavior tests before more motion tuning

The next person working on this should not be tuning easing curves blind. The motion contract needs tests first.

## Suggested Implementation Sequence

1. Normalize the fallback and attribute story across runtime, docs, and htmlvalidate.
2. Fix the spring-back / interruption logic so it uses one authoritative position model.
3. Remove the inline handle styling and move presentation back into CSS.
4. Clamp threshold values and make initialization-time attribute parsing predictable.
5. Add browser tests for drag, spring-back interruption, reduced motion, and keyboard interaction.
6. Only then tune the animation feel.

## Acceptance Criteria

Claude should not call the refactor done until all of these are true:

- Re-grabbing during spring-back continues from the visible handle position instead of jumping.
- Reduced-motion mode never leaves `[transitioning]` stuck on the host.
- `threshold="0"`, `threshold="60"`, and `threshold="100"` behave predictably.
- Invalid threshold values clamp or fall back intentionally.
- Theme styling works without JS-injected inline overrides.
- The initial attribute contract and no-JS story are consistent across runtime, docs, validators, and static examples.
- The component still upgrades from a simple readable fallback rather than requiring a more complex no-JS widget.

## Tests That Should Exist After The Refactor

At minimum add automated coverage for:

- Pointer drag below threshold, verify spring-back to zero
- Pointer drag above threshold, verify activation
- Interrupt spring-back with a new drag, verify no jump
- Reduced-motion spring-back cleanup
- Keyboard movement and activation
- Threshold parsing edge cases
- Basic reset behavior after activation

## Do Not Do This

- Do not add more easing tweaks on top of the current split motion model.
- Do not keep the inline JS handle styling.
- Do not keep contradictory fallback stories across the repo.
- Do not optimize for generic live-attr reactivity before fixing the actual interaction bugs.

## Bottom Line

The right refactor for `slide-accept` is not to make it more elaborate.

The right refactor is:

- preserve the readable fallback
- preserve the CSS-first visual model
- fix the broken motion seam
- make the repo describe the same enhancement story the component actually ships
