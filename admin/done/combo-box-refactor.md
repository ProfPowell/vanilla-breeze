# Combo Box Refactor Brief

## Objective

Keep `combo-box` aligned with Vanilla Breeze's actual philosophy:

- the authored `input + ul/ol` markup is the real starting point
- the light-DOM list is the visible no-JS baseline the docs currently describe
- JavaScript upgrades that baseline with filtering, keyboard navigation, form association, and multi-select behavior

The refactor should make that enhancement reliable. It should not turn `combo-box` into a more abstract popup system than the repo needs.

The next implementation should deliver all of the following before any extra polish work:

- The list surface is opaque and theme-correct.
- The popup stays attached to its anchor while the page or any scroll container moves.
- Single-select and multi-select use one coherent anchored-popup model.
- The authored light DOM remains predictable across connect, disconnect, and reconnect.
- Docs, validators, demos, and fixtures describe the same baseline and enhancement story.

## Files To Read First

- `src/web-components/combo-box/logic.js`
- `src/web-components/combo-box/styles.css`
- `demos/examples/demos/combobox-basic.html`
- `site/src/pages/docs/elements/web-components/combobox.njk`
- `src/web-components/combo-box/static.html`
- `src/htmlvalidate/elements.cjs`
- `tests/element-visual/compendium/compendium.json`

## What To Preserve

These parts are conceptually right and should survive the refactor:

- The component uses authored light DOM instead of hiding everything in a separate internal tree.
- The basic no-JS idea of "plain input plus visible list" fits VB's progressive-enhancement model.
- `ElementInternals` is the right mechanism for form participation.
- Multi-select can still be a richer JS-only enhancement as long as the repo is honest about that distinction.

The main problem is not that the component is light-DOM or progressive-enhancement based. The problem is that it has drifted into two popup systems and several conflicting repo contracts.

## Current Failures

### 1. Popup surface styles are split across two conflicting systems

Evidence:

- Base listbox styling lives in `src/web-components/combo-box/styles.css:47-77`
- Popover styling overrides it again in `src/web-components/combo-box/styles.css:196-210`

Why this is bad:

- The base listbox rule sets the menu surface, border, shadow, `max-block-size`, and `overflow-y: auto`.
- The later popover rule wipes parts of that contract out with `border: none` and `overflow: visible`.
- The component is trying to style the same node both as a normal anchored dropdown and as a fixed top-layer popover.

This is the visual root of the transparent / detached menu failures.

### 2. The popup positioning model is fighting the light-DOM enhancement model

Evidence:

- `#setup()` enables Popover API when available in `src/web-components/combo-box/logic.js:91-95`
- `#open()` calls `#positionListbox()` once in `src/web-components/combo-box/logic.js:544-555`
- `#positionListbox()` uses `getBoundingClientRect()` once in `src/web-components/combo-box/logic.js:577-583`
- There are no `scroll`, `resize`, or `ResizeObserver` hooks to keep the popup aligned

Why this is bad:

- The menu becomes detached from its field when the page or a scroll container moves.
- The component started from a simple host-relative light-DOM dropdown, then partially switched to a viewport-coordinate popover model.
- That split is the architectural bug.

### 3. Multi-select mode positions the popup against the wrong visible element

Evidence:

- Multi mode wraps the input in `.tags-input-area` at `src/web-components/combo-box/logic.js:97-110`
- Positioning still uses `this.#input.getBoundingClientRect()` at `src/web-components/combo-box/logic.js:577-583`

Why this is bad:

- In multi mode the visible control is the tags container, not the shrinking inner input.
- Once tags are added, the popup can stop lining up with the thing users actually see.

### 4. Setup is not idempotent, and the authored DOM contract degrades on reconnect

Evidence:

- `connectedCallback()` always calls `#setup()` in `src/web-components/combo-box/logic.js:72-75`
- `#setup()` only looks for a direct child input via `:scope > input` in `src/web-components/combo-box/logic.js:82-85`
- Multi mode moves that input out of direct-child position in `src/web-components/combo-box/logic.js:97-103`
- `disconnectedCallback()` removes listeners but does not restore the DOM in `src/web-components/combo-box/logic.js:77-80` and `src/web-components/combo-box/logic.js:170-183`

Why this is bad:

- A multi-select combo-box that disconnects and reconnects can fail to set itself up again because the authored input is no longer where setup expects it.
- This is a lifecycle bug in a light-DOM enhancement component.

### 5. Single-select clearing leaves stale selected state behind

Evidence:

- When the user types after selecting an option, `#handleInput()` clears only `#selectedValue` and `#selectedLabel` in `src/web-components/combo-box/logic.js:295-304`
- It does not clear the host `value` attribute or reset `aria-selected` on the previously selected option
- Full reset paths do clear those pieces in `src/web-components/combo-box/logic.js:502-525`, `src/web-components/combo-box/logic.js:658-689`, and `src/web-components/combo-box/logic.js:706-717`

Why this is bad:

- Form value, visible input text, and ARIA selection state can drift apart.
- That undermines both accessibility and form correctness.

### 6. The repo tells multiple incompatible baseline stories

Evidence:

- Docs describe the progressive-enhancement baseline as "plain text input above a visible, scrollable list" in `site/src/pages/docs/elements/web-components/combobox.njk:320-323`
- CSS fallback also implements that visible-list baseline in `src/web-components/combo-box/styles.css:20-39`
- Demos use the same `input + ul` authored markup in `demos/examples/demos/combobox-basic.html:52-66` and throughout the file
- `static.html` instead claims the no-JS fallback is `<input> + <datalist>` and `<select multiple>` in `src/web-components/combo-box/static.html:12-29` and `src/web-components/combo-box/static.html:35-69`

Why this is bad:

- The repo is not describing one coherent progressive-enhancement story.
- A native `<datalist>` / `<select multiple>` example may be a valid alternative pattern, but it is not the same as the shipped authored markup and should not be presented as though it were.

### 7. The public attribute API is split across runtime and tooling

Evidence:

- The live component logic expects plain attributes like `multiple`, `filter`, `max`, and `custom` in `src/web-components/combo-box/logic.js:68-70`, `src/web-components/combo-box/logic.js:280-282`, `src/web-components/combo-box/logic.js:351`, `src/web-components/combo-box/logic.js:365`, and `src/web-components/combo-box/logic.js:435`
- The docs and demos mostly use the plain attributes correctly
- htmlvalidate still advertises `data-required`, `data-filter`, `data-value`, `data-placeholder`, `data-multiple`, `data-max`, and `data-allow-custom` in `src/htmlvalidate/elements.cjs:294-306`
- The visual compendium fixtures also use the `data-*` variant API in `tests/element-visual/compendium/compendium.json:1536-1543`

Why this is bad:

- Tooling and fixtures are validating/testing a different API than the one the runtime actually reads.
- That makes it harder to trust visual or validator feedback.

### 8. The previous brief leaned a little too hard toward popup-architecture abstraction

Evidence:

- The earlier review was correct about the popup split, but it read a bit like a generic popup-system redesign

Why this matters:

- In VB, the cleaner answer is probably not a bigger positioning framework.
- The cleaner answer is likely to return to one simple anchored light-DOM model and make that model solid.

### 9. Test coverage is not protecting the real risk areas

Evidence:

- I did not find component-specific behavior tests for popup anchoring, scrolling, or open-state positioning
- The visual fixture layer is using the wrong attribute API for combo-box

Why this is bad:

- The bug you reported, "menu detaches when page scrolls," is exactly the kind of regression that needs a browser test.

## Recommended Refactor Direction

## 1. Preserve the light-DOM authored pattern and pick one popup model

Recommended direction:

- Preserve authored `input + ul/ol` markup
- Preserve the host-relative anchored dropdown model
- Remove the current hybrid of absolute dropdown styling plus fixed-position popover coordinates

Why this fits VB better:

- It keeps the enhancement close to the authored HTML structure.
- It matches the current docs and CSS fallback story.
- It removes the detached-on-scroll bug by construction.

If Popover API support returns later, it should be an intentional optional layer, not a partial override of the baseline model.

## 2. Keep the DOM contract predictable

Refactor goal:

- Host contains one stable input/control area
- Host contains one stable listbox
- Multi mode wraps the input once
- Reconnect does not mutate authored DOM a second time

Implementation guidance:

- Add a setup guard
- Stop relying on `:scope > input` after the first upgrade
- Introduce a single anchor getter for single and multi mode

## 3. Separate popup surface styling from popup placement

Refactor goal:

- One rule set defines menu appearance:
  background, border, radius, shadow, scroll behavior
- One rule set defines placement:
  inset, width, gap, stacking

Do not let the popover path wipe out the surface contract.

## 4. Align the fallback story with the authored markup story

Choose and document one clear narrative:

- the shipped authored baseline is `input + visible list`
- richer JS behavior upgrades that baseline
- multi-select may have a different conceptual no-JS alternative, but it should be documented honestly as an alternative, not as the same fallback

This point matters more here than inventing more API surface.

## 5. Unify the public API across runtime and tooling

Given the runtime code and docs, the real API today is:

- `required`
- `filter`
- `value`
- `placeholder`
- `multiple`
- `max`
- `custom`

That API should be reflected consistently in:

- component logic
- docs
- demos
- htmlvalidate metadata
- visual fixture compendium

## 6. Fix state synchronization before styling polish

Before doing any surface redesign, fix these logic issues:

- typing after a single-select choice must clear internal value, host value state, and previous `aria-selected`
- reset and reconnect paths must leave DOM and state coherent
- multi mode must anchor against the visible control, not the inner input

## Suggested Implementation Sequence

1. Align the fallback story and attribute API across code, docs, compendium, and htmlvalidate.
2. Remove the current hybrid popover path and return to one anchored popup model.
3. Make setup / cleanup idempotent, especially in multi mode.
4. Fix stale single-select clearing behavior.
5. Rebuild popup CSS so there is exactly one surface contract.
6. Add browser tests for scroll anchoring, resize anchoring, and multi-mode popup width.
7. Only then adjust visual design polish.

## Acceptance Criteria

Claude should not call the refactor done until all of these are true:

- Opening the menu gives an opaque surface with visible border/shadow in light and dark themes.
- Scrolling the page while the menu is open does not detach the menu from the field.
- Scrolling a nested overflow container while the menu is open does not detach the menu.
- Resizing the viewport while the menu is open keeps the menu aligned and width-matched.
- Multi-select menu width matches the visible tags control, not the shrinking inner input.
- Typing after a single-select choice clears all stale selected state.
- Disconnecting and reconnecting a multi-select combo-box does not break it.
- Docs, demos, htmlvalidate metadata, and visual fixtures all describe the same real baseline and attribute API.

## Tests That Should Exist After The Refactor

At minimum add automated coverage for:

- Open menu on page scroll
- Open menu inside a scrollable container
- Open menu after window resize
- Single-select: select option, type again, verify stale selection is cleared
- Multi-select: add tags, verify popup remains aligned to tags container
- Reconnect test for `multiple`
- Visual/open-state test for menu surface in at least one light theme and one dark theme

## Do Not Do This

- Do not keep adding CSS exceptions on top of both absolute and popover modes.
- Do not replace the light-DOM authored pattern with a bigger internal popup system.
- Do not keep contradictory fallback stories across docs and static examples.
- Do not keep the `data-*` API in fixtures while the runtime reads plain attributes.

## Bottom Line

The right refactor for `combo-box` is not to make it more abstract.

The right refactor is:

- preserve the authored light-DOM baseline
- keep one simple anchored popup model
- fix lifecycle and state drift bugs
- make the repo describe the same enhancement contract the component actually ships
