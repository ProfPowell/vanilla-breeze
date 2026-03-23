# Emoji Picker Refactor Brief

## Objective

Keep `emoji-picker` aligned with Vanilla Breeze's actual philosophy:

- the baseline text field should remain useful without the component
- OS emoji keyboards and `data-emoji` style enhancements remain valid alternatives
- the web component is an optional JavaScript convenience layer for browsing, discovery, and insertion

The refactor should make that convenience layer reliable and clearly documented. It should not turn `emoji-picker` into a much heavier interaction system than the repo needs.

The next implementation should deliver all of the following before any extra polish work:

- The picker can connect, disconnect, and reconnect without duplicating DOM or listeners.
- Insertion behavior is reliable for the targets the docs claim to support.
- Open / close behavior is deliberate and documented.
- The popup remains usable in ordinary constrained layouts.
- Docs, validators, and fallback material describe the same progressive-enhancement story.

## Files To Read First

- `src/web-components/emoji-picker/logic.js`
- `src/web-components/emoji-picker/styles.css`
- `src/web-components/emoji-picker/static.html`
- `demos/examples/demos/emoji-basic.html`
- `site/src/pages/docs/elements/web-components/emoji-picker.njk`
- `src/htmlvalidate/elements.cjs`
- `tests/element-visual/compendium/compendium.json`

## What To Preserve

These parts are conceptually right and should survive the refactor:

- The underlying text field is the true baseline, not the picker.
- The component should remain optional and lightweight relative to the rest of the editing experience.
- A custom trigger supplied by the author is a good pattern.
- The relationship with OS emoji input and `data-emoji` is a strength, not a weakness.

## Current Failures

### 1. Setup is not idempotent, and async connect makes that worse

Evidence:

- `connectedCallback()` awaits emoji data and then always calls `#setup()` in `src/web-components/emoji-picker/logic.js:53-57`
- `#setup()` always wires trigger and document listeners in `src/web-components/emoji-picker/logic.js:64-90`
- `#buildPicker()` always creates and appends a new `.picker` node in `src/web-components/emoji-picker/logic.js:99-147`
- `#cleanup()` removes listeners in `src/web-components/emoji-picker/logic.js:92-97`, but does not remove the picker DOM or guard against duplicate setup

Why this is bad:

- Reconnects can duplicate the panel and duplicate global listeners.
- Because setup happens after an async import, fast reconnect paths are especially risky.

### 2. The `open` contract is underspecified across code and docs

Evidence:

- The docs list `open` as an attribute in `site/src/pages/docs/elements/web-components/emoji-picker.njk:79-84`
- The runtime has no `observedAttributes` or `attributeChangedCallback`
- `connectedCallback()` does not honor initial markup like `<emoji-picker open>` in `src/web-components/emoji-picker/logic.js:53-57`
- The attribute is only written by `open()` / `close()` in `src/web-components/emoji-picker/logic.js:424-453`

Why this is bad:

- The repo currently documents `open` like public API, but the runtime mostly treats it as reflected internal state.
- This should be resolved one way or the other.
- The problem is inconsistency, not the lack of maximal framework-style reactivity.

### 3. Contenteditable insertion is likely wrong because selection is not preserved

Evidence:

- Opening the picker focuses the search input in `src/web-components/emoji-picker/logic.js:437-440`
- The contenteditable insertion path later does `target.focus()` and uses the current `window.getSelection()` in `src/web-components/emoji-picker/logic.js:387-395`

Why this is bad:

- Once the picker opens and focus moves into it, the original contenteditable caret / range is usually gone.
- The docs claim contenteditable insertion support in `site/src/pages/docs/elements/web-components/emoji-picker.njk:45-46` and `site/src/pages/docs/elements/web-components/emoji-picker.njk:74-77`, so this is a real contract issue.

### 4. Post-select behavior is accidental rather than intentional

Evidence:

- `#handleEmojiClick()` inserts emoji and dispatches `emoji-picker:select`, but does not close the picker in `src/web-components/emoji-picker/logic.js:329-351`

Why this is bad:

- Staying open might be desirable for multiple insertions.
- Closing might be desirable for quick message composition.
- The problem is not which choice was made; the problem is that the current behavior appears undocumented and accidental.

### 5. The popup layout is rigid and easy to break in constrained containers

Evidence:

- The panel is absolutely positioned with fixed `inline-size: 20rem` and `max-block-size: 24rem` in `src/web-components/emoji-picker/styles.css:8-23`
- There is no viewport-fit or collision handling

Why this is bad:

- The picker can clip in narrow layouts or constrained containers.
- A lightweight component still needs a clear layout contract.

### 6. The accessibility model is mixed and underspecified

Evidence:

- The panel uses `role="dialog"` in `src/web-components/emoji-picker/logic.js:100-103`
- Category tabs use `role="tab"` in `src/web-components/emoji-picker/logic.js:116-133`
- The grid uses `role="grid"` and cells use `role="gridcell"` in `src/web-components/emoji-picker/logic.js:136-140` and `src/web-components/emoji-picker/logic.js:202-213`
- Category selection is updated on click, but not synced to scroll position in `src/web-components/emoji-picker/logic.js:258-277`

Why this is bad:

- The component currently mixes several ARIA patterns without making it clear which interaction model is authoritative.
- The fix does not need to be "add more ARIA." It needs to be "pick one coherent model and document it."

### 7. The repo contract is split across runtime, docs, validator metadata, and fallback material

Evidence:

- htmlvalidate still documents `data-open` instead of `open` in `src/htmlvalidate/elements.cjs:391-398`
- Docs say the no-JS story is "trigger button remains visible but non-functional" in `site/src/pages/docs/elements/web-components/emoji-picker.njk:201-204`
- `static.html` instead presents a textarea plus OS emoji-keyboard guidance, not the custom-element trigger pattern, in `src/web-components/emoji-picker/static.html:79-107` and `src/web-components/emoji-picker/static.html:109-127`

Why this is bad:

- VB's progressive-enhancement story here should be simple:
- the text field still works
- OS emoji input still works
- the picker is optional enhancement

Right now the repo describes that story inconsistently.

### 8. The previous brief leaned a little too hard toward framework-style control APIs

Evidence:

- The earlier review treated a fully reactive `open` API as the default target

Why this matters:

- That may be the right outcome, but it is not mandatory on philosophical grounds.
- A simpler outcome is also valid:
- document `open` as reflected state only, and keep public control method-based

What matters is that the repo chooses and stays consistent.

### 9. I did not find component-specific behavior tests

Evidence:

- `rg` over `tests` only turned up the compendium entry for `emoji-picker`

Why this is bad:

- This component's main risks are lifecycle, insertion, and focus behavior.
- Static visual fixtures will not catch those failures.

## Recommended Refactor Direction

## 1. Keep the component optional and lightweight, but make setup idempotent

Refactor goal:

- Create the trigger / panel structure once
- Reuse it on reconnect
- Guard async setup so duplicate connects cannot append a second picker

## 2. Choose a clear `open` contract and implement that contract fully

Two valid directions:

- `open` is public API:
  then initial markup, attribute changes, methods, and reflected state should all agree
- `open` is reflected state only:
  then docs and validators should stop presenting it as a user-controlled attribute

Do not keep the current ambiguous middle state.

## 3. Preserve insertion ranges explicitly

Implementation guidance:

- For inputs / textareas, preserve selection start / end when focus leaves
- For contenteditable, store a `Range` before opening and restore it before insertion
- If contenteditable support remains documented, it needs to work through the real open-search-select flow

## 4. Make post-select behavior deliberate

Choose and document the default:

- close on select
- stay open on select

Either is defensible. The important thing is that it is intentional and tested.

## 5. Tighten the popup layout contract without overengineering it

At minimum:

- constrain width against viewport size
- handle ordinary narrow layouts intentionally
- document any remaining overflow-container limitations

This component does not need a giant positioning engine, but it does need a less brittle layout story.

## 6. Pick one accessible interaction model and finish it

Recommended direction:

- treat it as an anchored picker panel with managed focus
- keep the keyboard model simple and deliberate
- make panel, tabs, grid navigation, and open / close semantics internally consistent

Do not keep layering partial patterns on top of each other.

## Suggested Implementation Sequence

1. Make lifecycle / setup idempotent.
2. Decide what `open` means and align code, docs, and validators around that choice.
3. Fix selection preservation for inputs, textareas, and contenteditable.
4. Decide and implement the post-select behavior.
5. Tighten popup layout constraints for narrow / constrained contexts.
6. Clarify the accessibility model.
7. Add browser tests for focus, insertion, and lifecycle behavior.

## Acceptance Criteria

Claude should not call the refactor done until all of these are true:

- Reconnecting the component does not duplicate the picker DOM or global listeners.
- The documented `open` contract matches the runtime contract.
- Selecting an emoji inserts at the expected caret position for all documented target types.
- Post-select behavior is explicit and documented.
- Outside click and `Escape` close behavior remain correct.
- The picker remains usable in ordinary narrow viewports, or its constraints are intentionally documented.
- Docs, htmlvalidate metadata, static fallback, and demos all describe the same baseline and enhancement story.

## Tests That Should Exist After The Refactor

At minimum add automated coverage for:

- Reconnect / disconnect behavior
- Input insertion at caret
- Textarea insertion replacing a selection
- Contenteditable insertion with preserved range, if that support remains documented
- Close on outside click and `Escape`
- Post-select behavior
- A narrow-viewport visual / interaction check

Conditional on the chosen contract:

- if `open` remains public API, test initial `open` markup and attribute / method control
- if `open` is demoted to reflected state only, update docs / validator coverage instead

## Do Not Do This

- Do not patch this only by changing popup colors or width.
- Do not turn it into a much heavier modal-style system unless the product actually needs that.
- Do not keep ambiguous docs around `open` and no-JS behavior.
- Do not keep claiming contenteditable support without explicit range preservation.

## Bottom Line

The right refactor for `emoji-picker` is not "add more architecture."

The right refactor is:

- preserve the native text-entry baseline
- keep the picker as optional enhancement
- fix lifecycle and insertion correctness
- make the repo describe the same enhancement contract the component actually ships
