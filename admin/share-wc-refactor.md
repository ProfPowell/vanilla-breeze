# Share WC Refactor Brief

## Objective

Keep `share-wc` aligned with Vanilla Breeze's actual philosophy:

- authored share links are the real no-JS baseline
- JavaScript should enhance that baseline with native share, copy-to-clipboard, and token substitution
- the component should remain a thin wrapper over share URLs, not a self-contained share app

The refactor should make the layered story coherent. It should not collapse into a code-first generated-button system that sidelines the authored fallback.

The next implementation should deliver all of the following before any extra polish work:

- One coherent relationship between native share, generated platform buttons, and slotted links.
- Reconnects do not duplicate UI or listeners.
- `tier` stops acting as both a public input and internal output state.
- The JS API is either truly reactive or clearly documented as setup-time only.
- The repo gains the missing validator/fixture/test coverage for the actual component.

## Files To Read First

- `src/web-components/share-wc/logic.js`
- `src/web-components/share-wc/platforms.js`
- `src/web-components/share-wc/styles.css`
- `src/web-components/share-wc/static.html`
- `site/src/pages/docs/elements/web-components/share.njk`
- `tests/unit/share-wc.test.js`

Also note:

- I did not find an htmlvalidate entry for `share-wc`
- I did not find a `tests/element-visual/compendium/compendium.json` entry for `share-wc`
- I did not find dedicated `tests/components` behavior tests for `share-wc`

## What To Preserve

These parts are conceptually right and should survive the refactor:

- The three-tier concept is philosophically strong in `src/web-components/share-wc/logic.js:4-8` and `site/src/pages/docs/elements/web-components/share.njk:77-82`.
- The static fallback is honest about authored share links in `src/web-components/share-wc/static.html:71-94`.
- Keeping platform definitions in `platforms.js` is a good separation of concerns.
- `share-wc` should continue to be light-DOM and friendly to authored slotted links.

## Current Failures

### 1. Setup is not idempotent, and reconnect can duplicate UI

Evidence:

- `connectedCallback()` always resolves meta, detects a tier, and renders or enhances in `src/web-components/share-wc/logic.js:70-86`
- `#renderNative()` appends a new button in `src/web-components/share-wc/logic.js:146-155`
- `#renderPlatforms()` appends a new nav in `src/web-components/share-wc/logic.js:157-185`
- `disconnectedCallback()` only clears timers and the nav click listener in `src/web-components/share-wc/logic.js:88-97`

Why this is bad:

- Reconnecting the element can leave duplicate buttons, duplicate navs, or duplicated listeners on slotted content.
- This is especially damaging in a light-DOM component where authored fallback links should remain predictable.

### 2. The native-share path conflicts with the slotted-link baseline

Evidence:

- The docs say Tier 1 is a single native share button in `site/src/pages/docs/elements/web-components/share.njk:77-82`
- The runtime chooses the native path before it checks for authored children in `src/web-components/share-wc/logic.js:74-82`
- `#renderNative()` appends a button but does not clear or replace existing slotted content in `src/web-components/share-wc/logic.js:146-155`

Why this is bad:

- On a device with Web Share support, authored links can coexist with the generated native button instead of being replaced by one coherent tier.
- That makes the progressive-enhancement story muddier than the docs imply.

### 3. `tier` is treated as both a public input and an internal output state

Evidence:

- The docs present `tier` as an author-controlled attribute in `site/src/pages/docs/elements/web-components/share.njk:160-165`
- The runtime reads it as an override in `src/web-components/share-wc/logic.js:124-133`
- Then it writes the resolved tier back onto the same `tier` attribute in `src/web-components/share-wc/logic.js:84`

Why this is bad:

- A public input attribute is being reused as internal resolved state.
- That blurs the authored contract and can overwrite what the author originally wrote.

### 4. The documented JS API is only partially reactive

Evidence:

- The docs present `url`, `title`, and `text` as get/set properties in `site/src/pages/docs/elements/web-components/share.njk:287-320`
- The runtime setters only update private fields in `src/web-components/share-wc/logic.js:44-68`
- Token substitution for slotted links happens only once in `src/web-components/share-wc/logic.js:201-210`
- There is no observed-attributes or rerender path for `platforms`, `variant`, `size`, `tier`, or slotted href regeneration

Why this is bad:

- Generated button clicks may pick up updated private fields.
- But slotted links do not get refreshed after setup, and the rest of the surface is not truly reactive.
- The public contract looks stronger than the runtime actually is.

### 5. The docs overstate the icon-only accessibility implementation

Evidence:

- The docs say labels remain in the DOM for `icon` variant and are visually hidden in `site/src/pages/docs/elements/web-components/share.njk:323-333`
- The stylesheet uses `display: none` on `.share-label` in `src/web-components/share-wc/styles.css:80-87`

Why this is bad:

- The runtime still has explicit `aria-label`s, so the component is not inaccessible.
- But the docs are describing a different implementation than the one that ships.

### 6. Copy-state timing is global to the whole component

Evidence:

- The component stores one shared `#copyTimer` in `src/web-components/share-wc/logic.js:39-40`
- Copy reset uses that single timer in `src/web-components/share-wc/logic.js:319-325`

Why this is bad:

- If more than one copy button exists or slotted content creates multiple copy affordances, one click can strand another button in the copied state.
- The state model is too global for the light-DOM flexibility the component advertises.

### 7. Repo-contract coverage is incomplete

Evidence:

- I found unit tests for URL builders in `tests/unit/share-wc.test.js`
- I did not find htmlvalidate metadata, compendium coverage, or component behavior tests for the actual custom element

Why this is bad:

- The fragile seams are in upgrade behavior, slotted content, copy behavior, and tier selection.
- URL-builder unit tests do not protect any of those.

## Recommended Refactor Direction

## 1. Preserve authored share links as the baseline

Recommended direction:

- Treat slotted anchors as the strongest no-JS contract
- Generate UI only when the author has not provided it
- Make native share an enhancement layer over that authored baseline, not a competing render path

## 2. Separate public inputs from resolved runtime state

Refactor goal:

- Keep `tier` as an input if it remains public
- Use a different internal/reflected state marker such as `data-tier-resolved` if needed

The component should not rewrite its own public API attribute to store internal state.

## 3. Decide what "reactive" actually means here

Two defensible choices:

- Make the component rerender/update when public inputs change
- Or document the API as setup-time with explicit `refresh()`-style semantics

The current half-reactive contract is the problem.

## 4. Make copy state local to the clicked control

Required fix:

- Track copy feedback per button
- Do not let one component-level timer control all copy buttons

## 5. Fill the repo-contract gaps

At minimum:

- add htmlvalidate metadata
- add compendium coverage
- add behavior tests for tier selection, slotted enhancement, reconnect, and copy feedback

## Suggested Implementation Sequence

1. Decide the authoritative render model for native vs slotted vs generated platform UI.
2. Add idempotent setup/teardown.
3. Split public `tier` input from resolved state.
4. Clarify or implement real reactivity for the public API.
5. Localize copy-state timers.
6. Add missing repo artifacts and behavior tests.

## Acceptance Criteria

- Reconnecting `share-wc` does not duplicate buttons, nav wrappers, or listeners.
- Slotted fallback links remain the baseline rather than being half-overridden by the native path.
- `tier` remains a coherent public input.
- The docs describe the actual icon-only implementation.
- Multiple copy buttons do not leave stale copied state behind.

## Tests That Should Exist After The Refactor

- A reconnect test for generated and slotted modes.
- A native-tier test verifying one coherent rendered surface.
- A slotted-link token-refresh test if the API remains reactive.
- A multi-copy-button state test.
- A behavior test for `tier="platforms"`, auto tiering, and native-only mode.

## Do Not Do This

- Do not throw away the authored-link baseline in favor of generated-only UI.
- Do not make `share-wc` a larger share framework than the repo needs.
- Do not keep using a public attribute as an internal state scratchpad.

## Bottom Line

`share-wc` has the right philosophy on paper. The refactor needs to make the actual render/lifecycle contract match that philosophy, then add the missing repo-level coverage around it.
