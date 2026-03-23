# Settings Panel Refactor Brief

## Objective

Keep `settings-panel` aligned with Vanilla Breeze's actual philosophy:

- `ThemeManager`, `EnvironmentManager`, and related utilities remain the real state owners
- `settings-panel` is a compact control surface over that shared state
- the component can stay richer than something like `theme-picker`, but it should still be honest about being a JavaScript control panel rather than a true no-JS form enhancement

The refactor should make that control surface reliable and explicit. It should not turn `settings-panel` into a larger self-contained settings framework.

The next implementation should deliver all of the following before any extra polish work:

- connect, disconnect, and reconnect are idempotent
- the repo tells the truth about the component's baseline and enhancement model
- docs, styles, and runtime describe the same control set
- dialog and focus behavior are real, not just implied by wording
- the public `open` contract is intentional and testable

## Files To Read First

- `src/web-components/settings-panel/logic.js`
- `src/web-components/settings-panel/styles.css`
- `src/web-components/settings-panel/static.html`
- `site/src/pages/docs/elements/web-components/settings-panel.njk`
- `demos/examples/demos/settings-panel-basic.html`
- `demos/examples/demos/settings-panel-custom-trigger.html`
- `demos/examples/demos/settings-panel-panels.html`
- `src/lib/theme-manager.js`
- `src/lib/environment-manager.js`
- `src/htmlvalidate/elements.cjs`
- `tests/element-visual/compendium/compendium.json`

Also note:

- I did not find component-specific behavior tests for `settings-panel`

## What To Preserve

These parts are conceptually right and should survive the refactor:

- Shared state should continue to live in `ThemeManager`, `EnvironmentManager`, and related utilities.
- A compact trigger-driven panel is a valid complement to `theme-picker`.
- A custom trigger via `[data-trigger]` is the right extension point.
- The richer layout, accessibility, backdrop, and environment controls can stay here rather than being pushed into `theme-picker`.

The main problem is not that `settings-panel` is JavaScript-heavy. The problem is that the repo is still describing it more like a clean progressive enhancement than the runtime actually is.

## Current Failures

### 1. Setup is not idempotent

Evidence:

- `connectedCallback()` always calls `#render()` and `#bindEvents()`
- `#render()` always appends a new panel
- Auto-generated triggers can also be created during render
- `disconnectedCallback()` removes some window and document listeners, but does not tear down the rendered panel or per-control listeners
- `src/web-components/settings-panel/logic.js`

Why this is bad:

- Reconnect can duplicate internal DOM and event wiring.
- This is a structural lifecycle problem, not a styling issue.

### 2. The repo is still implying a stronger no-JS baseline than the runtime actually ships

Evidence:

- The stylesheet hides `settings-panel:not(:defined)`
- The static artifact presents a full form as "the baseline"
- The runtime is actually a JS-built control surface over shared managers and storage
- `src/web-components/settings-panel/styles.css`
- `src/web-components/settings-panel/static.html`
- `src/web-components/settings-panel/logic.js`

Why this is bad:

- The static form is a useful conceptual reference, but it is not the actual authored baseline of the shipped component.
- This component is closer to a JS-only site-settings panel than to a true form enhancement.
- The docs should say that plainly so future refactors optimize the right thing.

### 3. Docs, styles, and runtime have drifted apart on what the panel actually contains

Evidence:

- The docs still describe four main sections and accent swatches
- The runtime currently renders appearance, accessibility, layout, effects, environment, and system sections, plus backdrop and page-background controls
- The stylesheet still contains accent-swatch rules, but the runtime does not render accent controls
- `site/src/pages/docs/elements/web-components/settings-panel.njk`
- `src/web-components/settings-panel/logic.js`
- `src/web-components/settings-panel/styles.css`

Why this is bad:

- Someone working from the docs gets the wrong mental model.
- Someone working from the CSS can assume dead controls still exist.
- This is exactly the kind of repo-contract drift that keeps causing churn.

### 4. The accessibility and dialog story is overstated

Evidence:

- The docs talk about dialog semantics and focus-return behavior
- The runtime uses a `div` with `role="dialog"`
- There is no focus trap
- `open()` does not move focus into the panel
- Focus is returned to the trigger only on the Escape path, not on all close paths
- There is no `aria-modal`
- `site/src/pages/docs/elements/web-components/settings-panel.njk`
- `src/web-components/settings-panel/logic.js`

Why this is bad:

- The docs currently sound closer to native dialog behavior than the runtime actually provides.
- That is an accessibility contract problem, not just copy drift.

### 5. The `open` attribute is presented as public state, but it is not a real external control contract

Evidence:

- Docs and htmlvalidate document `open`
- Runtime methods `open()`, `close()`, and `toggle()` add or remove the attribute internally
- There is no `observedAttributes` path
- There is no initial sync from authored `<settings-panel open>`
- `site/src/pages/docs/elements/web-components/settings-panel.njk`
- `src/htmlvalidate/elements.cjs`
- `src/web-components/settings-panel/logic.js`

Why this is bad:

- The attribute currently reads more like an output flag than a supported public input.
- The repo should either make it reactive or document the component as method-driven.

### 6. The current test surface is mostly visual

Evidence:

- I found visual compendium fixtures and demos
- I did not find behavior tests for open/close, reconnect, focus behavior, or state sync

Why this is bad:

- The main risks here are lifecycle, focus, public API semantics, and manager synchronization.
- Visual coverage alone is not enough.

## Recommended Refactor Direction

## 1. Treat `settings-panel` as a JS control surface, not a fake form enhancement

Recommended direction:

- preserve the shared-manager architecture
- preserve the compact control surface
- stop implying that the shipped host itself degrades to a real no-JS saved-preferences form

That is the philosophically consistent answer for this component.

## 2. Make setup and teardown reversible

Required fixes:

- render once intentionally, or tear down fully on disconnect
- avoid appending duplicate panels
- avoid stacking listeners on reconnect

## 3. Align docs, styles, and runtime around one actual control set

Choose the real surface and update all three layers:

- docs
- runtime
- CSS

Dead accent-swatch styling or outdated docs should not survive if the runtime has moved on.

## 4. Make the dialog/focus story real

There are two valid directions:

- use a real dialog/popover primitive and inherit its focus behavior, or
- keep the custom surface but implement actual focus management and document its limits honestly

What should not remain is dialog language that overstates the runtime.

## 5. Decide whether `open` is input, output, or both

Pick one of these:

- method-driven component, with `open` as reflected output state only
- attribute-driven component, with authored and runtime `open` kept in sync
- both, with a clear single source of truth

Any of these can work. The current ambiguity is the problem.

## Suggested Implementation Sequence

1. Fix lifecycle idempotency.
2. Decide and document the real baseline/enhancement story.
3. Align the rendered control set with docs and CSS.
4. Fix or narrow the dialog/focus claims.
5. Decide and implement the `open` contract.
6. Add behavior tests for lifecycle, focus, and public API behavior.

## Acceptance Criteria

Claude should not call the refactor done until all of these are true:

- Reconnecting a `settings-panel` instance does not duplicate DOM or listeners.
- The docs no longer imply a stronger no-JS baseline than the component actually has.
- Docs, runtime, and CSS agree on the control set.
- Focus behavior is either truly dialog-like or documented more narrowly.
- The `open` contract is explicit and testable.
- Tests cover lifecycle and focus, not just visuals.

## Tests That Should Exist After The Refactor

At minimum add automated coverage for:

- default trigger generation
- custom trigger wiring
- reconnect without duplicate panel creation
- `open()`, `close()`, and `toggle()`
- authored `[open]` behavior, if that remains supported
- Escape close and focus return
- close-button close and outside-click close behavior
- shared state sync after theme or extension changes

## Do Not Do This

- Do not pretend `settings-panel` is a full progressive enhancement of a real saved-preferences form if the host is actually hidden before upgrade.
- Do not move shared state ownership out of the manager utilities and into the component.
- Do not keep stale doc/CSS concepts like accent swatches if they are no longer real.
- Do not keep dialog language that the runtime does not actually satisfy.

## Bottom Line

The right refactor for `settings-panel` is to keep it as a shared-state control surface, then make that reality explicit: honest baseline story, real lifecycle discipline, one actual control set, and a dialog/API contract the runtime genuinely supports.
