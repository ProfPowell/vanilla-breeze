# Reader View Refactor Brief

## Objective

Keep `reader-view` aligned with Vanilla Breeze's actual philosophy:

- long-form content must remain readable as normal document content without JavaScript
- `layout-columns` remains the inner reading surface, not something `reader-view` should replace
- the web component is an optional shell that adds chrome, paged mode, controls, and persistence

The refactor should make that shell reliable and predictable. It should not turn `reader-view` into a much larger app-like state system than the repo needs.

The next implementation should deliver all of the following before any extra polish work:

- Authored markup remains the source of truth unless the component explicitly documents otherwise.
- Reconnects do not break resize, viewport, or keyboard behavior.
- Keyboard shortcuts do not hijack unrelated focused controls.
- Persistence and multi-instance behavior are intentional and documented.
- Docs and tooling describe the same enhancement contract the code actually ships.

## Files To Read First

- `src/web-components/reader-view/logic.js`
- `src/web-components/reader-view/styles.css`
- `site/src/pages/docs/elements/web-components/reader-view.njk`
- `site/src/pages/docs/elements/custom-elements/layout-columns.njk`
- `demos/examples/demos/reader-view.html`
- `tests/element-visual/compendium/compendium.json`

Also note:

- I did not find `src/web-components/reader-view/static.html`
- I did not find an htmlvalidate entry for `reader-view`

## What To Preserve

These parts are conceptually right and should survive the refactor:

- Without JS, the article content still renders in source order as normal readable content.
- `layout-columns` is the correct inner surface for paged reading.
- Scroll mode as the default baseline is sensible.
- A replaceable chrome via `slot="chrome"` is a good extension point.
- Pages mode can remain an immersive fixed shell, as long as its tradeoffs are explicit.

## Current Failures

### 1. Persisted state currently overrides authored markup, and the default key is global

Evidence:

- `connectedCallback()` reads attributes and then restores persisted state in `src/web-components/reader-view/logic.js:41-45`
- Initial attributes are read in `src/web-components/reader-view/logic.js:73-79`
- Persisted state is restored afterward in `src/web-components/reader-view/logic.js:544-560`
- The default storage key is global: `vb-reader` in `src/web-components/reader-view/logic.js:37`
- The docs document `storage-key` in the attributes table at `site/src/pages/docs/elements/web-components/reader-view.njk:80-83`
- But the best-practices section incorrectly says `data-storage-key` at `site/src/pages/docs/elements/web-components/reader-view.njk:221-223`

Why this is bad:

- Explicit markup like `mode="pages"` or `columns="2"` can be silently overridden by saved state from a previous reader instance.
- Different reader instances and demos can affect each other through the shared default key.
- This weakens the authored HTML contract, which should matter a lot in VB.

This is the most important structural issue in the component.

### 2. Reconnect lifecycle is incomplete because teardown removes behavior that build guards never restore

Evidence:

- Build/setup only happens when `#built` is false in `src/web-components/reader-view/logic.js:41-50`
- `disconnectedCallback()` disconnects the ResizeObserver and removes document and visualViewport listeners in `src/web-components/reader-view/logic.js:56-67`
- On reconnect, `connectedCallback()` does not re-run `#setupResizeObserver()` or `#setupViewportListeners()` because `#built` stays true

Why this is bad:

- A disconnected and reconnected `reader-view` can lose resize handling, viewport handling, and document-level keyboard behavior.
- This is a real lifecycle bug in a component that is meant to be a shell around ordinary content.

### 3. Keyboard shortcuts are attached too broadly at the document level

Evidence:

- `#bindActions()` attaches a document-level `keydown` listener in `src/web-components/reader-view/logic.js:471-472`
- `#handleKeydown()` only skips `input`, `textarea`, and `select` in `src/web-components/reader-view/logic.js:477-479`
- It pages on `Space`, `PageDown`, arrows, `Home`, and `End` in `src/web-components/reader-view/logic.js:481-497`

Why this is bad:

- Keyboard paging can hijack interaction when focus is on buttons, links, custom chrome, or contenteditable regions.
- In pages mode, `Space` on a toolbar button or custom control can turn the page unexpectedly.
- This is an accessibility and UX bug, not a preference issue.

### 4. Pages mode has hidden global cross-instance behavior

Evidence:

- `activePagedInstances` is global in `src/web-components/reader-view/logic.js:9`
- Entering pages mode forces all other active paged instances back to scroll in `src/web-components/reader-view/logic.js:223-227`
- Pages mode takes over the viewport with `position: fixed; inset: 0` in `src/web-components/reader-view/styles.css:13-20`

Why this is bad:

- The one-pages-mode-at-a-time rule may be reasonable given the fixed fullscreen shell.
- But it is currently implicit global behavior rather than a clearly documented constraint.
- Combined with the global persistence key, multiple readers on one page become especially surprising.

### 5. Repo contract gaps make the enhancement story harder to trust

Evidence:

- There is no `src/web-components/reader-view/static.html`
- I did not find an htmlvalidate entry for `reader-view`
- The docs say the component "degrades gracefully at every layer" in `site/src/pages/docs/elements/web-components/reader-view.njk:108-115`
- The compendium only covers two interactive variants in `tests/element-visual/compendium/compendium.json:4503-4522`

Why this is bad:

- The runtime fallback is probably fine because the host just renders its article content.
- But the lack of the usual static/tooling artifacts means the enhancement contract is less explicit than it should be.

### 6. The compendium fixtures are exposed to the persistence-precedence problem

Evidence:

- The compendium renders explicit `mode="scroll"` and `mode="pages"` variants in `tests/element-visual/compendium/compendium.json:4511-4520`
- The component restores persisted state after reading authored attributes in `src/web-components/reader-view/logic.js:41-45` and `src/web-components/reader-view/logic.js:544-560`

Why this is bad:

- Visual or interactive fixtures can become stateful in ways the fixture markup does not declare.
- That is exactly the opposite of what test fixtures should be.

### 7. The previous refactor style would risk over-engineering this component

Evidence:

- `reader-view` is a shell over content, not a fully abstract reading engine

Why this matters:

- The right fix is not to build a larger state framework.
- The right fix is to make authored attributes, persistence, lifecycle, and keyboard scope predictable.

### 8. I did not find component-specific behavior tests beyond the compendium entry

Evidence:

- `rg` over `tests` only turned up the compendium entry for `reader-view`

Why this is bad:

- The main risks here are persistence, reconnect behavior, and keyboard scope.
- Static visual variants will not catch those regressions.

## Recommended Refactor Direction

## 1. Preserve the plain-article baseline and `layout-columns` inner surface

Recommended direction:

- Keep article content readable without JS
- Keep `layout-columns` as the paged surface
- Keep `reader-view` focused on shell concerns:
  mode switching, chrome, page nav, font controls, persistence

Do not rewrite this into a component that owns the whole reading model from scratch.

## 2. Make authored attributes and persistence play by clear rules

This is the central contract decision.

Pick one of these and document it clearly:

- explicit attributes win over saved state
- saved state wins only when no explicit attribute is present
- persistence is opt-in rather than default

Any of those can work. The current ambiguous behavior is the problem.

Given VB's HTML-first posture, the most defensible default is:

- explicit authored attributes win
- persistence fills in only where markup is silent

## 3. Make reconnect behavior fully reversible

Required fixes:

- Re-establish ResizeObserver on reconnect
- Re-establish visualViewport listeners on reconnect
- Re-establish document-level keyboard handling on reconnect, if that pattern remains

If teardown removes behavior, reconnect must restore it.

## 4. Narrow keyboard scope to the active reader interaction context

Recommended direction:

- Only handle paging shortcuts when pages mode is active and the event is truly in reader context
- Ignore buttons, links, editable content, and custom chrome controls
- If document-level listeners remain, guard them much more tightly

The goal is not more keyboard power. The goal is fewer accidental steals.

## 5. Document or redesign multi-instance behavior explicitly

If the fixed fullscreen shell means only one paged reader can exist at a time, say so clearly in docs and tests.

If that constraint is too surprising, then the architecture needs adjustment.

Do not leave this as hidden global coordination.

## 6. Fill the repo-contract gaps

At minimum:

- fix the `storage-key` vs `data-storage-key` docs mismatch
- decide whether `reader-view` needs a `static.html` artifact
- add htmlvalidate metadata if the project expects it for web components
- make fixtures opt out of persistence or use isolated keys

## Suggested Implementation Sequence

1. Decide and implement clear precedence between authored attributes and persisted state.
2. Fix reconnect lifecycle so removed observers/listeners come back.
3. Narrow keyboard scope to the real reader interaction context.
4. Decide and document the multi-instance pages-mode rule.
5. Fix docs/tooling gaps around `storage-key`, static artifacts, and fixture isolation.
6. Add behavior tests for persistence, reconnects, and keyboard safety.

## Acceptance Criteria

Claude should not call the refactor done until all of these are true:

- Without JS, article content is still readable in normal source order.
- Explicit `mode` / `columns` markup is not unexpectedly overridden by unrelated saved state.
- Multiple readers on one page do not fight over one default persistence slot in surprising ways, or that behavior is explicitly constrained and documented.
- Reconnecting a built `reader-view` restores resize, viewport, and keyboard behavior.
- Paging shortcuts do not hijack toolbar buttons, links, or editable controls.
- Docs describe the real `storage-key` attribute name and the real persistence behavior.
- Fixtures and tests are isolated from localStorage bleed.

## Tests That Should Exist After The Refactor

At minimum add automated coverage for:

- Explicit attributes vs saved-state precedence
- Reconnect / disconnect behavior
- Keyboard paging while focus is on chrome buttons
- Keyboard paging while focus is in editable content
- Multiple reader instances with distinct storage keys
- Multiple reader instances under the default key behavior, if that behavior remains
- Pages-mode fixture behavior with persistence disabled or isolated

## Do Not Do This

- Do not turn `reader-view` into a much larger reading-app framework.
- Do not let persisted state silently beat authored markup unless that rule is deliberate and documented.
- Do not keep document-level keyboard shortcuts broad enough to hijack unrelated controls.
- Do not leave the multi-instance fullscreen behavior undocumented.

## Bottom Line

The right refactor for `reader-view` is not to make it more powerful.

The right refactor is:

- preserve the plain-article baseline
- preserve `layout-columns` as the reading surface
- make persistence, lifecycle, and keyboard scope predictable
- make the repo describe the same shell contract the component actually ships
