# Tab Set Refactor Brief

## Objective

Keep `tab-set` aligned with Vanilla Breeze's actual philosophy:

- authored `<details>` content is the real baseline
- without JS, the content remains an exclusive-open disclosure group or accordion-like stack
- with JS, the component upgrades that baseline into a tab-like visual surface with keyboard focus movement and optional transitions

The refactor should make that enhancement honest and reliable. It should not keep pretending to ship a full ARIA tabs widget if the runtime is intentionally preserving native `<details>` semantics instead.

The next implementation should deliver all of the following before any extra polish work:

- One coherent semantics story across runtime, docs, CSS, and tests.
- Reconnects do not duplicate listeners.
- The active-tab state source is clear and used consistently.
- The repo stops describing ARIA tab semantics that the code does not actually apply.

## Files To Read First

- `src/web-components/tab-set/logic.js`
- `src/web-components/tab-set/styles.css`
- `src/web-components/tab-set/static.html`
- `site/src/pages/docs/elements/web-components/tabs.njk`
- `tests/components/tabs.spec.js`
- `src/htmlvalidate/elements.cjs`
- `tests/element-visual/compendium/compendium.json`

## What To Preserve

These parts are conceptually right and should survive the refactor:

- The zero-JS baseline is honest in `src/web-components/tab-set/static.html:71-101`.
- The runtime intentionally leans on native `<details>` instead of replacing everything with custom hidden panels.
- CSS Grid reordering and `display: contents` are a reasonable way to create the visual tabs surface while preserving authored markup.
- Ensuring one panel is open by default is a useful enhancement.
- Optional View Transition support can remain as a richer layer.

## Current Failures

### 1. The repo describes a full ARIA tabs widget, but the runtime intentionally does not ship one

Evidence:

- The docs say the component adds "keyboard navigation and ARIA semantics" in `site/src/pages/docs/elements/web-components/tabs.njk:4` and `site/src/pages/docs/elements/web-components/tabs.njk:91-94`
- The docs explicitly claim `role="tablist"`, `role="tab"`, `role="tabpanel"`, and `aria-selected` in `site/src/pages/docs/elements/web-components/tabs.njk:163-169`
- The runtime comments explicitly say there are no ARIA role overrides in `src/web-components/tab-set/logic.js:73-75`
- The runtime only sets `aria-controls`, `aria-labelledby`, and `tabindex` in `src/web-components/tab-set/logic.js:76-81`

Why this is bad:

- The component is currently halfway between a details-based disclosure enhancement and a formal ARIA tabs widget.
- That is a repo-contract problem, not just a wording problem.
- Users, demos, and tests cannot tell which model they are supposed to rely on.

### 2. The active-tab styling story is internally inconsistent

Evidence:

- The docs show active tab styling based on `summary[aria-selected="true"]` in `site/src/pages/docs/elements/web-components/tabs.njk:66-84`
- The runtime never sets `aria-selected` in `src/web-components/tab-set/logic.js:62-125`
- The shipped CSS actually styles the active tab via `details[open] > summary` in `src/web-components/tab-set/styles.css:65-69`

Why this is bad:

- Docs, examples, and runtime are describing different sources of truth for the active state.
- The project needs one clear answer: either `open` drives the UI, or ARIA tab state does.

### 3. Setup is not idempotent, and teardown is effectively missing

Evidence:

- `connectedCallback()` always re-runs setup in `src/web-components/tab-set/logic.js:12-22`
- `disconnectedCallback()` only removes `data-upgraded` in `src/web-components/tab-set/logic.js:24-26`
- `#setup()` adds click, keydown, and toggle listeners in `src/web-components/tab-set/logic.js:62-95`

Why this is bad:

- Reconnecting the element can stack listeners on the same summaries and details.
- That creates hard-to-debug duplicate tab changes and repeated keyboard handling.

### 4. The current test suite mostly verifies the native baseline, not the enhancement contract

Evidence:

- The tests cover count, default open state, click switching, exclusive behavior, and focusability in `tests/components/tabs.spec.js:14-62`
- I did not find tests that verify the docs/runtime semantics contract, reconnect behavior, or arrow-key navigation details

Why this is bad:

- The fragile parts here are the semantics story, roving focus behavior, and lifecycle.
- Basic `<details>` behavior can keep passing while the actual enhancement layer drifts.

## Recommended Refactor Direction

## 1. Pick one honest model and document it clearly

There are two defensible options:

- Keep the current details-based model and update docs/CSS/examples/tests to describe it honestly
- Or implement a true ARIA tabs widget end-to-end and stop relying on the current implicit-details semantics

Given VB's HTML-first posture, the more defensible default is:

- keep the native `<details>` baseline
- keep the visual tabs treatment
- stop claiming a full ARIA tabs role model unless the runtime really adopts it

## 2. Use one active-state source consistently

Recommended direction:

- If the component stays details-based, let `details[open]` remain the one active-state source
- Update docs and examples to style against the real source of truth
- Do not document `aria-selected` unless the runtime actually manages it

## 3. Make lifecycle fully idempotent

Required fixes:

- Add a setup/build guard
- Track listener teardown
- Ensure reconnect restores behavior exactly once

## 4. Preserve the baseline while narrowing the claims

What should stay true after the refactor:

- Without JS, the content still works as a disclosure group
- With JS, users get horizontal tab presentation and arrow-key movement
- The docs no longer overpromise a different pattern than the one the runtime ships

## 5. Strengthen test coverage around the real contract

Add tests for:

- ArrowLeft / ArrowRight / Home / End behavior
- Reconnect without duplicated events or listeners
- Whatever semantics model the refactor chooses
- Visual active-state contract matching runtime state

## Suggested Implementation Sequence

1. Decide whether `tab-set` stays details-based or becomes a true ARIA tabs widget.
2. Align runtime comments, docs, and styling examples to that decision.
3. Add idempotent setup/teardown.
4. Add tests for keyboard navigation and reconnect behavior.
5. Update compendium and docs examples so they reflect the chosen model exactly.

## Acceptance Criteria

- The docs describe the same semantics model the runtime actually ships.
- Reconnecting a `tab-set` does not duplicate listeners or events.
- Keyboard navigation behaves consistently with the documented model.
- The active tab styling is driven by the same state the runtime manages.
- No example relies on `aria-selected` unless the runtime truly supports it.

## Tests That Should Exist After The Refactor

- Arrow navigation test for Left, Right, Home, and End.
- Reconnect test verifying one change event per real tab switch.
- A docs-contract test for the chosen semantics model.
- A style-state test or DOM-state assertion that confirms the active-tab source of truth.

## Do Not Do This

- Do not keep the current halfway state where docs claim ARIA tabs and runtime intentionally does not implement them.
- Do not throw away the `<details>` baseline just to look more like a framework tab widget.
- Do not add `role="tab"` semantics piecemeal without the full keyboard and state contract.

## Bottom Line

`tab-set` already has a credible VB baseline. The main refactor job is to make the semantics story honest, make lifecycle safe, and stop letting docs and runtime describe two different components.
