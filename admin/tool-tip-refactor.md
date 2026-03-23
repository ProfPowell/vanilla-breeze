# Tool Tip Refactor Brief

## Objective

Keep `tool-tip` aligned with Vanilla Breeze's actual philosophy:

- the real baseline is still native tooltip/description behavior through `title` or other simple markup
- the repo already has a broader tooltip enhancement system via `[data-tooltip]` and `src/utils/tooltip-init.js`
- `<tool-tip>` should remain a convenience wrapper and hover-card layer, not an accidental second tooltip platform

The refactor should make those layers compose cleanly. It should not collapse everything into one heavier, more self-contained widget.

The next implementation should deliver all of the following before any extra polish work:

- the wrapper's contract is clearly separated from the broader tooltip-init system
- connect, disconnect, and reconnect do not destroy the authored fallback story
- positioning remains attached while the tooltip or card is open
- emitted events are not duplicated
- docs, demos, and tests describe one coherent layered model

## Files To Read First

- `src/web-components/tool-tip/logic.js`
- `src/web-components/tool-tip/styles.css`
- `src/web-components/tool-tip/static.html`
- `src/utils/tooltip-init.js`
- `src/native-elements/tooltip/styles.css`
- `site/src/pages/docs/elements/web-components/tooltip.njk`
- `tests/components/tooltip.spec.js`
- `tests/element-visual/compendium/compendium.json`
- `demos/examples/demos/tooltip-basic.html`
- `demos/examples/demos/tooltip-delay.html`
- `demos/examples/demos/tooltip-title-fallback.html`

## What To Preserve

These parts are conceptually right and should survive the refactor:

- the title-first fallback in `src/web-components/tool-tip/static.html:12-27`
- the use of Popover API and `interestfor` where available
- the existence of both a generic tooltip-init path and a wrapper component path
- the card variant as the richer Layer 3 case for previews and interactive hover content

The main problem is not that there are layers. The problem is that the wrapper currently mutates authored content in ways it cannot reliably reverse, while the docs/tests blur which layer is under discussion.

## Current Failures

### 1. The repo is telling two different tooltip stories without clean boundaries

Evidence:

- The wrapper component has its own logic in `src/web-components/tool-tip/logic.js`
- The repo also has a generic tooltip initializer in `src/utils/tooltip-init.js:1-248`
- The component docs page leads with `[data-tooltip]` examples and init-script language in `site/src/pages/docs/elements/web-components/tooltip.njk:11-55`, `site/src/pages/docs/elements/web-components/tooltip.njk:150-220`, and only later gets to `<tool-tip>` examples in `site/src/pages/docs/elements/web-components/tooltip.njk:57-127`
- The tooltip tests accept either `[data-tooltip]` or `<tool-tip>` as the subject under test in `tests/components/tooltip.spec.js:18-21` and `tests/components/tooltip.spec.js:40-50`

Why this is bad:

- A refactor can easily optimize the wrong layer because the repo does not clearly say what belongs to tooltip-init vs what belongs to the wrapper component.
- The current test file does not actually protect the wrapper contract in isolation.

### 2. The wrapper is not reversible or idempotent

Evidence:

- `connectedCallback()` always calls `#setup()` in `src/web-components/tool-tip/logic.js:66-68`
- Tooltip setup removes `title` from the trigger in `src/web-components/tool-tip/logic.js:101-103`
- Tooltip setup appends a generated popover to the host in `src/web-components/tool-tip/logic.js:104-130`
- Card setup moves authored `[data-content]` into a generated hover card and strips the marker attribute in `src/web-components/tool-tip/logic.js:167-184`
- `disconnectedCallback()` only calls `#cleanup()`, which removes listeners but does not restore moved content, restore `title`, or remove generated popovers in `src/web-components/tool-tip/logic.js:71-74` and `src/web-components/tool-tip/logic.js:204-225`

Why this is bad:

- A title-based tooltip can lose its native fallback after disconnect.
- A card tooltip can fail to reconnect because the authored `[data-content]` node has already been moved and de-labeled.
- This is exactly the kind of light-DOM lifecycle bug that breaks progressive enhancement over time.

### 3. Open-state positioning is only computed once

Evidence:

- Regular tooltip JS fallback positions once in `#updatePosition()` at `src/web-components/tool-tip/logic.js:299-340`
- Card positioning is also one-shot in `#positionCard()` at `src/web-components/tool-tip/logic.js:346-376`
- Positioning happens on open/toggle in `src/web-components/tool-tip/logic.js:227-233`, `src/web-components/tool-tip/logic.js:278-284`, and `src/web-components/tool-tip/logic.js:190-191`
- There are no scroll, resize, `ResizeObserver`, or `visualViewport` listeners keeping the open surface attached

Why this is bad:

- An open tooltip or hover card can detach when the page or a scroll container moves.
- That is especially noticeable for richer hover-card content, which is more likely to stay open long enough for the user to scroll.

### 4. Event dispatch can duplicate in some paths

Evidence:

- `#handleToggle()` dispatches show/hide events in `src/web-components/tool-tip/logic.js:227-239`
- `show()` and `hide()` also dispatch show/hide events directly in `src/web-components/tool-tip/logic.js:275-297`
- Modern-interestfor paths attach `toggle` listeners in `src/web-components/tool-tip/logic.js:149-152` and `src/web-components/tool-tip/logic.js:186-191`

Why this is bad:

- Programmatic `show()` / `hide()` can generate duplicate wrapper events when the toggle listener is also active.
- That makes the event contract unreliable for consumers.

### 5. The wrapper API and the wrapper docs are not the same thing

Evidence:

- Runtime wrapper attributes are `content`, `position`, `delay`, and `variant` in `src/web-components/tool-tip/logic.js:11-14`, `src/web-components/tool-tip/logic.js:96`, `src/web-components/tool-tip/logic.js:120`, and `src/web-components/tool-tip/logic.js:245`
- htmlvalidate documents that plain-attribute API in `src/htmlvalidate/elements.cjs:586-594`
- The static fallback still describes `data-variant="card"` in `src/web-components/tool-tip/static.html:17-23`
- The main docs page spends far more energy on `data-tooltip` and `data-tooltip-position` than on the wrapper's actual attribute surface in `site/src/pages/docs/elements/web-components/tooltip.njk:11-55` and `site/src/pages/docs/elements/web-components/tooltip.njk:185-220`

Why this is bad:

- The wrapper's own API remains hard to reason about because the page is doing double duty as a tooltip-system overview.
- That makes future churn more likely.

### 6. The current tests barely protect real behavior

Evidence:

- The behavior test checks that there is some trigger, that no popover is visible by default, and that hover does not crash in `tests/components/tooltip.spec.js:14-52`
- It does not isolate `<tool-tip>` from `[data-tooltip]`
- It does not cover reconnects, card mode, delayed show/hide, or open-state repositioning

Why this is bad:

- The main risks in the wrapper are lifecycle and positioning seams, not simple existence.

## Recommended Refactor Direction

## 1. Treat tooltip-init and `<tool-tip>` as related but separate layers

Recommended direction:

- keep `[data-tooltip]` discovery as the broad, low-friction tooltip system
- keep `<tool-tip>` as a wrapper convenience for authored rich content and hover cards
- make the docs explicit about which layer each example belongs to

That is more VB-aligned than trying to make one layer silently stand in for the other.

## 2. Make the wrapper reversible

Required fixes:

- preserve or restore original `title` when appropriate
- avoid destructive movement of authored card content, or restore it on teardown
- guard setup so reconnect does not append duplicate tooltip nodes

If a wrapper mutates authored light DOM, it must also be able to undo that mutation.

## 3. Share logic where the systems are already the same

Pragmatic direction:

- regular tooltip positioning and interestfor/JS fallback behavior are already duplicated between `tool-tip` and `tooltip-init`
- extract or reuse the shared helper path where possible

This is not an argument for a giant abstraction. It is an argument for removing copy-pasted seams that are already drifting.

## 4. Reposition while open

Refactor goal:

- if a tooltip or card is open and the viewport/anchor moves, keep it attached
- keep the implementation lightweight: only observe while open

## 5. Fix the event contract before adding new API surface

The wrapper should emit:

- one open event per actual open
- one close event per actual close

That is more important than adding extra attributes or state reflection.

## Suggested Implementation Sequence

1. Clarify docs so tooltip-init and `<tool-tip>` are separated conceptually.
2. Make setup/cleanup reversible and idempotent.
3. Consolidate shared tooltip helper logic with `tooltip-init` where appropriate.
4. Add open-state repositioning on scroll/resize/viewport change.
5. Remove duplicate event dispatch paths.
6. Rewrite tests to isolate wrapper behavior from generic `[data-tooltip]` behavior.

## Acceptance Criteria

Claude should not call the refactor done until all of these are true:

- Disconnecting and reconnecting a title-based tooltip preserves or restores the native fallback correctly.
- Card variant reconnects do not lose their authored content source.
- Open tooltips and cards stay attached if the viewport or page scroll position changes.
- `tool-tip:show` / `tool-tip:hide` and hover-card events fire exactly once per transition.
- The docs clearly distinguish the generic tooltip-init path from the wrapper path.
- Tests cover wrapper behavior directly, not just the broader tooltip system.

## Tests That Should Exist After The Refactor

At minimum add automated coverage for:

- title-based wrapper tooltip
- template-based wrapper tooltip
- card variant
- delayed show/hide
- reconnect after disconnect
- scroll/resize repositioning while open
- event emission counts
- generic `[data-tooltip]` behavior separately from wrapper behavior

## Do Not Do This

- Do not delete the broader `[data-tooltip]` enhancement path just to simplify the wrapper.
- Do not rewrite the wrapper as a shadow-DOM-only tooltip system that abandons the current baseline story.
- Do not keep destructive DOM mutation without a matching restore path.
- Do not keep tests that say "either system is fine" when the file is supposed to protect `tool-tip`.

## Bottom Line

The right refactor for `tool-tip` is to respect the repo's layered tooltip model, then make the wrapper a disciplined layer within it: reversible, positioned correctly, and documented separately from the generic tooltip-init path.
