# Content Swap Refactor Brief

## Objective

Keep `content-swap` aligned with Vanilla Breeze's actual philosophy:

- authored front/back content remains readable content, not internal component state
- JavaScript is justified here because hiding one face accessibly requires real state management, not only CSS
- motion, card chrome, and visual variants remain primarily CSS-driven

The refactor should make the enhancement reliable and explicit. It should not turn `content-swap` into a more abstract flipping-widget framework than the repo needs.

The next implementation should deliver all of the following before any extra polish work:

- The no-JS story remains readable and honest.
- The activation model is predictable and does not rewrite rich content into surprise buttons.
- The dual entry-point story, `<content-swap>` and `[data-swap]`, is either clarified or reduced.
- Reconnects do not duplicate listeners.
- Focus movement is intentional rather than automatic by default.

## Files To Read First

- `src/web-components/content-swap/logic.js`
- `src/web-components/content-swap/styles.css`
- `src/web-components/content-swap/static.html`
- `site/src/pages/docs/elements/web-components/content-swap.njk`
- `src/htmlvalidate/elements.cjs`
- `tests/element-visual/compendium/compendium.json`

## What To Preserve

These parts are conceptually right and should survive the refactor:

- The static fallback is honest: both faces remain visible content in `src/web-components/content-swap/static.html:11-20`.
- The component is right to justify JS through `inert` rather than pretending CSS-only hiding is enough in `site/src/pages/docs/elements/web-components/content-swap.njk:111-113`.
- The CSS already supports both the custom element form and the `[data-swap]` form, including card variants and auto-card styling in `src/web-components/content-swap/styles.css:210-255`.
- Motion remains token-driven and CSS-first.
- `card`, `data-variant`, and `data-swap-autocard` are worth preserving because they already fit the repo's styling layer.

## Current Failures

### 1. Initialization is not idempotent for the custom element path

Evidence:

- `connectedCallback()` always calls `initSwapBehavior(this)` in `src/web-components/content-swap/logic.js:145-149`
- `disconnectedCallback()` only removes `data-upgraded` in `src/web-components/content-swap/logic.js:151-153`
- `initSwapBehavior()` adds click and keydown listeners in `src/web-components/content-swap/logic.js:61-81`

Why this is bad:

- Reconnecting a `<content-swap>` can stack listeners and repeat swaps.
- This is a classic lifecycle bug in a light-DOM enhancement component.

### 2. The default whole-element trigger path rewrites authored containers into buttons

Evidence:

- When no explicit triggers exist, the host gets `role="button"` and `tabindex="0"` in `src/web-components/content-swap/logic.js:59-73`
- The docs explicitly describe "click anywhere on the element" behavior in `site/src/pages/docs/elements/web-components/content-swap.njk:276-277`

Why this is bad:

- Rich containers can become surprise buttons even when they contain complex semantic content.
- That is a blunt default for a system that otherwise values authored HTML meaning.
- Whole-element activation may still be useful, but it should be intentional and bounded.

### 3. The component is really two systems, and the boundary is under-specified

Evidence:

- The logic explicitly supports both clean attributes on `<content-swap>` and `data-*` attributes on `[data-swap]` in `src/web-components/content-swap/logic.js:34-40`
- The custom element path and the attribute auto-init path share `initSwapBehavior()` in `src/web-components/content-swap/logic.js:42-84`
- A permanent document-level `MutationObserver` powers the attribute form in `src/web-components/content-swap/logic.js:177-224`
- The docs present the attribute form in `site/src/pages/docs/elements/web-components/content-swap.njk:65-68` and the auto-card/body pattern in `site/src/pages/docs/elements/web-components/content-swap.njk:70-75`

Why this is bad:

- The dual-layer architecture may be valid, but right now it is more implicit than intentional.
- Global auto-init plus a permanent observer makes the behavior harder to reason about, test, and tear down.

### 4. Focus movement is unconditional after every swap

Evidence:

- `swapTo()` always calls `moveFocus()` in `src/web-components/content-swap/logic.js:107-117`
- `moveFocus()` focuses the first match among autofocus, swap trigger, button, link, and form controls in `src/web-components/content-swap/logic.js:133-140`

Why this is bad:

- Focus can jump in ways the author did not ask for.
- A trigger on one face may send focus to an unrelated element on the other face.
- This is especially brittle in richer content where the first focusable item is not the correct landing target.

### 5. The real risk areas are not protected by component-specific tests

Evidence:

- I did not find dedicated `content-swap` behavior tests under `tests/components`
- The compendium covers visual examples, but not lifecycle or focus behavior, in `tests/element-visual/compendium/compendium.json:1582-1597`

Why this is bad:

- The fragile parts here are reconnect behavior, activation defaults, and focus handling.
- Visual fixtures alone will not catch those regressions.

## Recommended Refactor Direction

## 1. Preserve the readable no-JS baseline and CSS-driven motion layer

Recommended direction:

- Keep both faces readable without JS
- Keep transitions and card chrome primarily in CSS
- Keep JS focused on state, accessibility, and activation

That is already the strongest philosophical part of the component.

## 2. Decide whether the project really wants both entry points

There are two defensible answers:

- Keep both `<content-swap>` and `[data-swap]`, but document them as two explicit layers with clear ownership
- Or reduce the feature surface to one primary entry point and make the other a thin compatibility layer

The problem is not that both exist. The problem is that the boundary between them is currently too implicit.

## 3. Make activation explicit by default

Recommended direction:

- Prefer explicit `[data-swap]` triggers
- Keep whole-element activation only when it is clearly intended
- Consider making whole-element activation opt-in instead of automatic

That fits VB better than coercing semantic containers into generic buttons.

## 4. Make focus movement conditional, not automatic

Better options:

- Return focus to the triggering control when appropriate
- Only move focus when the author opts in with `autofocus` or a dedicated target
- Avoid forcing focus changes on pointer-driven swaps unless accessibility clearly requires it

## 5. Make initialization and observer behavior fully manageable

Required fixes:

- Add idempotent init for the custom element path
- Track and remove listeners on disconnect where applicable
- If the global observer stays, document it as an intentional repo-level enhancement mechanism

## Suggested Implementation Sequence

1. Add init guards and listener cleanup for `<content-swap>`.
2. Decide whether whole-element activation stays default or becomes opt-in.
3. Rework focus movement so it is conditional and predictable.
4. Clarify or simplify the `[data-swap]` auto-init story.
5. Add tests for reconnect, explicit triggers, and focus behavior.

## Acceptance Criteria

- Reconnecting a `<content-swap>` does not duplicate listeners.
- Complex content is not unexpectedly turned into a button unless the author opts into that model.
- Explicit `[data-swap]` triggers work consistently in both the custom element and attribute forms.
- Focus does not jump unexpectedly after ordinary swaps.
- The no-JS story still exposes both faces as readable content.

## Tests That Should Exist After The Refactor

- A reconnect test for the custom element path.
- A trigger-model test covering explicit trigger buttons versus whole-element activation.
- A focus-behavior test verifying that swap does not hijack focus unexpectedly.
- A test for the `[data-swap]` auto-init path, including dynamically added nodes if that feature remains.

## Do Not Do This

- Do not hide both faces in the no-JS baseline.
- Do not turn the component into a larger generalized flipping framework.
- Do not rely on a permanent global observer without documenting it as a deliberate architectural choice.

## Bottom Line

`content-swap` has a defensible reason to exist in VB, but its activation and lifecycle seams are too implicit right now. The refactor should mostly make those seams explicit and predictable, not make the component more abstract.
