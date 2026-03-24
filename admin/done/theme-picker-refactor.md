# Theme Picker Refactor Brief

## Objective

Keep `theme-picker` aligned with Vanilla Breeze's actual philosophy:

- the site's readable default rendering is the baseline, not the picker UI itself
- `ThemeManager` should remain the primary source of truth for theme state
- `theme-picker` is an optional interface for appearance preferences, not a server-form enhancement unless the repo intentionally decides to build that

The refactor should make the picker honest and reliable. It should not keep drifting into a bigger, partially overlapping settings system with multiple hidden state stores.

The next implementation should deliver all of the following before any extra polish work:

- the baseline story is explicit and true
- runtime, CSS, docs, validators, and fixtures agree on the public API
- multiple picker instances stay in sync
- popover positioning remains attached while open
- connect, disconnect, and reconnect do not duplicate DOM or listeners

## Files To Read First

- `src/web-components/theme-picker/logic.js`
- `src/web-components/theme-picker/styles.css`
- `src/web-components/theme-picker/static.html`
- `site/src/pages/docs/elements/web-components/theme-picker.njk`
- `src/lib/theme-manager.js`
- `src/htmlvalidate/elements.cjs`
- `tests/element-visual/compendium/compendium.json`
- `demos/examples/demos/theme-picker-popover.html`
- `demos/examples/demos/theme-picker-inline.html`

## What To Preserve

These parts are conceptually right and should survive the refactor:

- a lightweight authored trigger is a good enhancement seam
- `ThemeManager` is the right owner for mode/brand/fluid persistence and system-mode resolution
- the inline variant is a useful settings-page pattern
- the picker's visuals are CSS-first, not a pile of inline JS styling

The biggest philosophical issue is not that `theme-picker` is JS-generated. It is that the repo still tells a form-enhancement story in one place and a JS-only settings-panel story everywhere else.

## Current Failures

### 1. The baseline story is not true to the runtime

Evidence:

- The static artifact says it "IS the baseline that `<theme-picker>` enhances" and describes a standard form submitting to the server in `src/web-components/theme-picker/static.html:79-109`
- Runtime does not enhance authored form controls; it generates its own panel in `src/web-components/theme-picker/logic.js:90-126`
- The docs page presents the component as a direct web component UI, not as a form enhancer, in `site/src/pages/docs/elements/web-components/theme-picker.njk:91-102`

Why this is bad:

- The repo is describing two different architectural stories.
- If the picker is meant to be a JS-only preference UI, that is acceptable in VB as long as the baseline is framed as "the site still works without the picker."
- If it is meant to enhance a real form, the runtime does not currently do that.

### 2. The public API is split across runtime, docs, CSS, htmlvalidate, and fixtures

Evidence:

- Runtime reads plain `variant`, `compact`, and `open` in `src/web-components/theme-picker/logic.js:8-10`, `src/web-components/theme-picker/logic.js:65-66`, `src/web-components/theme-picker/logic.js:662`, and `src/web-components/theme-picker/logic.js:731`
- CSS also keys off plain `variant` and `open` in `src/web-components/theme-picker/styles.css:13-18` and `src/web-components/theme-picker/styles.css:28-29`
- The docs examples use plain `variant` and `compact` in `site/src/pages/docs/elements/web-components/theme-picker.njk:19-23`
- But the docs attributes table still documents `data-variant` and `data-open` in `site/src/pages/docs/elements/web-components/theme-picker.njk:163-179`
- htmlvalidate also still expects `data-variant` and `data-open` in `src/htmlvalidate/elements.cjs:565-571`
- The compendium fixture still renders `data-variant="inline"` in `tests/element-visual/compendium/compendium.json:4152-4158`

Why this is bad:

- The repo is validating and snapshotting a different API than the runtime actually uses.
- That undermines the maintenance loop immediately.

### 3. State ownership is split across `ThemeManager` and ad hoc picker-owned stores

Evidence:

- Mode, brand, and fluid come from `ThemeManager` in `src/web-components/theme-picker/logic.js:153-155`, `src/web-components/theme-picker/logic.js:292-294`, `src/web-components/theme-picker/logic.js:432-472`, and `src/lib/theme-manager.js:28-156`
- Extension state is stored separately under `vb-extensions` in `src/web-components/theme-picker/logic.js:44-46`, `src/web-components/theme-picker/logic.js:487-540`
- Accessibility-theme state is stored separately under `vb-a11y-themes` in `src/web-components/theme-picker/logic.js:48-49`, `src/web-components/theme-picker/logic.js:547-607`
- Accessibility themes also mutate `documentElement.dataset.theme` directly in `src/web-components/theme-picker/logic.js:568-590`

Why this is bad:

- `theme-picker` is no longer just a UI over `ThemeManager`; it is also its own preference coordinator.
- That may be acceptable, but it needs a clearer shared-state model than "ThemeManager for some things, local component helpers for others."

### 4. Multiple instances do not fully stay in sync

Evidence:

- The picker listens for `theme-change` in `src/web-components/theme-picker/logic.js:71-72` and only syncs mode/brand/fluid in `src/web-components/theme-picker/logic.js:630-656`
- Extension changes emit `extensions-change` in `src/web-components/theme-picker/logic.js:537-540`, but the picker does not listen for that event
- Accessibility-theme changes do not emit a corresponding cross-instance event; they only save/apply locally in `src/web-components/theme-picker/logic.js:593-607`

Why this is bad:

- Two pickers on the same page can disagree about extensions and accessibility toggles.
- That is a real state-coherency bug in a global settings component.

### 5. Popover positioning is one-shot

Evidence:

- Open state positions the panel once in `src/web-components/theme-picker/logic.js:658-675`
- Position math lives in `src/web-components/theme-picker/logic.js:677-724`
- The panel is ordinary absolutely positioned DOM in `src/web-components/theme-picker/styles.css:43-74`
- There are no scroll, resize, `ResizeObserver`, or `visualViewport` listeners updating the panel while it remains open

Why this is bad:

- The popover can detach from its trigger when the page or viewport changes.
- This is the same class of anchored-popup bug that has already shown up elsewhere in the repo.

### 6. Lifecycle is not idempotent

Evidence:

- `connectedCallback()` always calls `#render()` and `#bindEvents()` in `src/web-components/theme-picker/logic.js:64-79`
- `#render()` always appends a new `.panel` in `src/web-components/theme-picker/logic.js:113-126`
- `disconnectedCallback()` removes global listeners but does not tear down generated DOM or per-input listeners in `src/web-components/theme-picker/logic.js:82-88` and `src/web-components/theme-picker/logic.js:361-410`

Why this is bad:

- Reconnect can duplicate internal DOM and listeners.
- That is a straight lifecycle bug, independent of styling or philosophy.

### 7. `open` is currently reflected state, not a coherent external API

Evidence:

- Runtime sets and removes `open` internally in `src/web-components/theme-picker/logic.js:661-663` and `src/web-components/theme-picker/logic.js:729-732`
- There is no observed-attribute path reacting to external `open` changes
- The docs/htmlvalidate still describe a different reflected attribute anyway in `site/src/pages/docs/elements/web-components/theme-picker.njk:175-178` and `src/htmlvalidate/elements.cjs:568-570`

Why this is bad:

- The repo should either present `open` as internal reflected state only, or intentionally support declarative control.
- The current middle ground is muddy.

## Recommended Refactor Direction

## 1. Decide on the honest baseline story

Pick one and document it clearly:

- `theme-picker` is a JS-only appearance UI, while the site itself still renders fine without it
- or `theme-picker` truly enhances an authored form baseline

Given the current runtime, the first story is the honest one.

## 2. Unify the public attribute API

Given runtime and CSS, the real API today is:

- `variant`
- `compact`
- `open` as reflected state

Bring docs, htmlvalidate, and compendium onto that same contract.

## 3. Tighten global state ownership

Recommended direction:

- keep `ThemeManager` as the main appearance-state owner
- either move extensions/a11y into a shared state owner too, or create an explicit shared preferences module/event contract

The goal is not "more abstraction." The goal is one coherent source of truth.

## 4. Make multi-instance sync explicit

Required fixes:

- syncing mode/brand/fluid is not enough
- extension and accessibility toggles must update sibling picker instances too

## 5. Fix positioning and lifecycle before adding more features

The next iteration should prioritize:

- anchored popover reliability while open
- idempotent connect/disconnect/reconnect

Those are higher value than more theme categories or control variants.

## Suggested Implementation Sequence

1. Align docs, htmlvalidate, and compendium with the real plain-attribute API.
2. Decide and document the honest baseline story.
3. Consolidate global preference ownership for extensions/a11y.
4. Add cross-instance sync for all settings, not just `theme-change`.
5. Add open-state repositioning on scroll/resize/viewport change.
6. Make render/bind lifecycle idempotent.

## Acceptance Criteria

Claude should not call the refactor done until all of these are true:

- The docs, validator metadata, fixtures, runtime, and CSS all describe the same attribute API.
- The baseline story in `static.html` matches what the component actually does.
- Two picker instances stay in sync for mode, brand, fluid, accessibility themes, and extensions.
- Reconnecting a picker does not append duplicate panels or duplicate listeners.
- An open popover stays visually attached to its trigger while the viewport changes.
- `open` is either clearly internal reflected state or intentionally supported as an external control.

## Tests That Should Exist After The Refactor

At minimum add automated coverage for:

- popover open/close behavior
- inline variant rendering
- reconnect behavior
- scroll/resize positioning while open
- two pickers on one page staying in sync
- extension and accessibility toggle synchronization
- API/fixture contract alignment for `variant` and `compact`

## Do Not Do This

- Do not keep pretending the component enhances a server form unless the runtime actually does that.
- Do not leave `ThemeManager` as only a partial source of truth.
- Do not keep different attribute names alive in runtime vs docs vs tooling.
- Do not add more settings categories before lifecycle and positioning are stable.

## Bottom Line

The right refactor for `theme-picker` is to admit what it really is, then make that architecture solid: a JS appearance UI over a coherent shared state model, not a half-form-enhancer and half-settings-engine at the same time.
