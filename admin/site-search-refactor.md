# Site Search Refactor Brief

## Objective

Keep `site-search` aligned with Vanilla Breeze's actual philosophy:

- a normal search page or GET form is the real no-JS baseline
- `site-search` is an optional enhanced shell over Pagefind for client-side search
- the component should stay honest about being a JavaScript overlay, not claim progressive-enhancement behavior it does not actually perform

The refactor should make that shell reliable and predictable. It should not turn `site-search` into a larger command-palette framework or keep overstating accessibility behavior that is not present.

The next implementation should deliver all of the following before any extra polish work:

- the baseline story matches the runtime
- keyboard contract and docs agree
- focus and overlay behavior are defensible
- lifecycle and multi-instance hotkey behavior are intentional
- tests protect the actual risks instead of only the open visual

## Files To Read First

- `src/web-components/site-search/logic.js`
- `src/web-components/site-search/styles.css`
- `src/web-components/site-search/static.html`
- `site/src/pages/docs/elements/web-components/site-search.njk`
- `src/utils/hotkey-bind.js`
- `src/htmlvalidate/elements.cjs`
- `tests/element-visual/compendium/compendium.json`
- `demos/examples/demos/site-search-basic.html`

## What To Preserve

These parts are conceptually right and should survive the refactor:

- Pagefind is a good fit for fast client-side search in the enhanced layer
- an authored trigger slot is a good extension seam
- keyboard opening and arrow-key navigation are useful enhancements
- a lightweight overlay is a reasonable UI pattern for documentation search

The main problem is not that `site-search` is JS-only. The problem is that the repo still frames it like a form enhancer and documents accessibility features the runtime does not currently deliver.

## Current Failures

### 1. The baseline story in `static.html` is not implemented by the runtime

Evidence:

- The static artifact says it "IS the baseline that `<site-search>` enhances" and describes a standard GET form in `src/web-components/site-search/static.html:81-109`
- Runtime does not enhance authored form markup; it creates its own trigger and generated overlay dialog in `src/web-components/site-search/logic.js:70-135`
- The demo also shows only a trigger, not an authored form being upgraded, in `demos/examples/demos/site-search-basic.html:14-20`

Why this is bad:

- The repo is promising progressive enhancement of a form that the component does not actually perform.
- If the desired architecture is "optional JS overlay plus separate `/search` baseline page," that is fine, but it should be documented as such.

### 2. The documented keyboard contract is not the runtime keyboard contract

Evidence:

- Runtime JSDoc promises `Cmd/Ctrl+K` in `src/web-components/site-search/logic.js:24-28`
- The docs also promise `Cmd+K / Ctrl+K` in `site/src/pages/docs/elements/web-components/site-search.njk:87-90`
- The static fallback hints `Ctrl + K` in `src/web-components/site-search/static.html:128-130`
- The component only binds `meta+k` in `src/web-components/site-search/logic.js:141-149`

Why this is bad:

- The docs over-promise functionality that the runtime does not deliver.
- This is exactly the kind of mismatch that creates churn and "works on my machine" confusion.

### 3. The docs claim focus trapping, but the component does not implement it

Evidence:

- The accessibility section says "Focus is trapped within the dialog when open" in `site/src/pages/docs/elements/web-components/site-search.njk:188-196`
- Runtime only focuses the input on open in `src/web-components/site-search/logic.js:334-338`
- The overlay is a `div[role="dialog"]`, not a native `dialog`, and there is no focus-trap logic in `src/web-components/site-search/logic.js` or `src/web-components/site-search/styles.css:18-51`

Why this is bad:

- The accessibility contract is being described more confidently than the code supports.
- The refactor should either implement focus containment or stop claiming it.

### 4. Hotkey ownership is hidden and brittle with multiple instances

Evidence:

- `site-search` only binds if `meta+k` is not already registered in `src/web-components/site-search/logic.js:141-149`
- `getBoundHotkeys()` simply returns the current global binding list in `src/utils/hotkey-bind.js:79-85`
- The hotkey binder is a singleton with first-match behavior in `src/utils/hotkey-bind.js:20-37` and `src/utils/hotkey-bind.js:53-76`

Why this is bad:

- Only one instance really owns the shortcut, but that rule is implicit.
- If the owning instance disconnects, another existing instance does not automatically become the owner unless something explicitly reconnects/rebinds it.
- That is hidden global behavior and should be intentional if it remains.

### 5. Lifecycle is not reversible enough for an overlay component

Evidence:

- `connectedCallback()` always renders and binds in `src/web-components/site-search/logic.js:57-60`
- `#render()` always appends a new `.dialog` in `src/web-components/site-search/logic.js:89-135`
- `disconnectedCallback()` unbinds the global hotkey and escape listener but does not close the overlay or restore `body.style.overflow` in `src/web-components/site-search/logic.js:63-68`
- Body scroll lock is applied in `src/web-components/site-search/logic.js:331-333` and cleared only in `src/web-components/site-search/logic.js:353-355`

Why this is bad:

- A disconnect while open can leave the page scroll-locked.
- Reconnect can duplicate generated DOM and listeners.

### 6. Overlay management is manual and fragile

Evidence:

- The open state is an ordinary fixed-position `div` in `src/web-components/site-search/styles.css:18-51`
- The component manually toggles `document.body.style.overflow` in `src/web-components/site-search/logic.js:331-355`
- Close resets overflow to the empty string in `src/web-components/site-search/logic.js:353-355`

Why this is bad:

- The component does not preserve a prior inline overflow value.
- It also does not coordinate with any other overlay component that may have a reason to lock scrolling.
- This is manageable, but only if it is treated as a real overlay-system seam.

### 7. The result-navigation semantics are mostly visual

Evidence:

- Results use `role="listbox"` and `role="option"` in `src/web-components/site-search/logic.js:112-116` and `src/web-components/site-search/logic.js:267-278`
- Active result state is tracked with `data-active` only in `src/web-components/site-search/logic.js:297-307` and styled visually in `src/web-components/site-search/styles.css:103-119`
- There is no `aria-activedescendant` or equivalent state reflected on the input

Why this is bad:

- The UI is keyboard-navigable visually, but the accessibility state is under-specified relative to the pattern being claimed.

### 8. The current test surface is too thin

Evidence:

- The compendium only covers an already-open empty dialog in `tests/element-visual/compendium/compendium.json:3760-3774`
- I did not find component behavior tests for `site-search`

Why this is bad:

- The important risks are hotkeys, focus behavior, overlay cleanup, no-Pagefind handling, and multi-instance behavior.
- A single visual fixture does not protect those.

## Recommended Refactor Direction

## 1. Decide on the honest baseline story

Pick one and document it clearly:

- `site-search` is a JS overlay over a separate real search page/form baseline
- or `site-search` actually enhances authored form markup

Given the current runtime, the first story is the honest one.

## 2. Make the keyboard contract true

Required fixes:

- either implement both `Cmd+K` and `Ctrl+K`, or document only what is actually bound
- make singleton hotkey ownership deliberate and documented

## 3. Make the accessibility contract true

Required decision:

- either implement focus containment and stronger active-result semantics
- or stop claiming those features in docs

## 4. Treat overlay cleanup as a first-class concern

Refactor goal:

- open/close/disconnect should always leave scroll state coherent
- reconnect should not duplicate generated DOM
- background interaction rules should be explicit

This can still remain lightweight. It just cannot remain accidental.

## 5. Add real behavior tests before further UI expansion

The component is already good enough visually to justify behavior-first testing now.

## Suggested Implementation Sequence

1. Fix the baseline story in docs/static documentation.
2. Align hotkeys with the documented contract.
3. Decide and implement focus behavior honestly.
4. Make open/close/disconnect overlay cleanup robust.
5. Make lifecycle idempotent and document multi-instance shortcut ownership.
6. Add behavior tests for search, focus, cleanup, and multi-instance behavior.

## Acceptance Criteria

Claude should not call the refactor done until all of these are true:

- The docs describe the same baseline story the runtime actually implements.
- Keyboard shortcuts behave as documented on the supported platforms.
- Focus behavior is either correctly implemented or no longer overstated.
- Disconnecting an open `site-search` does not leave body scroll locked.
- Reconnecting the component does not append duplicate overlay DOM.
- Multiple instances have an intentional and documented hotkey ownership rule.
- Search-result navigation exposes accessible state, not just visual state.

## Tests That Should Exist After The Refactor

At minimum add automated coverage for:

- opening via trigger
- opening via keyboard shortcut
- closing via Escape and backdrop click
- no-Pagefind fallback rendering
- body scroll restoration after close and after disconnect
- multiple instances and hotkey ownership
- keyboard navigation of results
- focus behavior while the overlay is open

## Do Not Do This

- Do not keep claiming that `<site-search>` enhances a search form unless it really does.
- Do not keep accessibility language in the docs that the runtime does not support.
- Do not rely on a single visual fixture as proof of component correctness.
- Do not grow the feature set before fixing lifecycle and overlay cleanup.

## Bottom Line

The right refactor for `site-search` is to make the component honest and dependable: a JS search overlay over a separate baseline, with a real keyboard/focus contract and cleanup that survives the normal lifecycle edges.
