# Split Surface Refactor Brief

## Objective

Keep `split-surface` aligned with Vanilla Breeze's actual philosophy:

- the baseline is still ordinary two-panel content that remains readable without JS
- the splitter story is explicitly layered: `data-splitter` as the lighter enhancement, `split-surface` as the fuller component
- the shared divider behavior and styling should feel like one coherent repo contract across both layers

The refactor should make that layered story honest and robust. It should not turn the splitter into a larger layout framework or pretend features exist that the runtime does not actually implement.

The next implementation should deliver all of the following before any extra polish work:

- `split-surface` reconnects without corrupting its own DOM.
- Numeric attributes accept the ranges the docs promise, including `0` where documented.
- The layered `data-splitter`/`split-surface` contract uses one consistent attribute vocabulary.
- Docs stop promising triple-pane behavior unless it really exists.
- Tests cover lifecycle, persistence precedence, and edge values.

## Files To Read First

- `src/web-components/split-surface/logic.js`
- `src/web-components/split-surface/styles.css`
- `src/web-components/split-surface/static.html`
- `src/utils/splitter-init.js`
- `site/src/pages/docs/elements/web-components/splitter.njk`
- `site/src/pages/docs/attributes/data-splitter.njk`
- `demos/examples/demos/split-surface-basic.html`
- `src/htmlvalidate/elements.cjs`
- `tests/element-visual/compendium/compendium.json`

Also note:

- I did not find dedicated `tests/components` behavior tests for `split-surface`

## What To Preserve

These parts are conceptually right and should survive the refactor:

- The static fallback keeps both panels readable in `src/web-components/split-surface/static.html:12-20`.
- Sharing divider styles between `data-splitter` and `split-surface` is the right repo-level idea in `src/web-components/split-surface/styles.css:33-88`.
- The two-layer story is worth preserving if it stays honest.
- `role="separator"` plus keyboard resizing is the correct enhancement surface.

## Current Failures

### 1. `split-surface` reconnect is structurally broken

Evidence:

- The component uses `children[0]` and `children[1]` as the two panels in `src/web-components/split-surface/logic.js:67-72`
- It injects a divider between them in `src/web-components/split-surface/logic.js:78-88`
- `disconnectedCallback()` removes listeners but does not remove the divider in `src/web-components/split-surface/logic.js:102-109`

Why this is bad:

- After the first upgrade, the divider becomes one of the host children.
- On reconnect, `children[1]` can now be the old divider, so the component starts treating its own generated node as panel content.
- This is the most important structural bug in the component.

### 2. The numeric attribute parsing does not honor documented `0` values

Evidence:

- `position` falls back through `Number(...) || 50` in `src/web-components/split-surface/logic.js:61-64` and `src/web-components/split-surface/logic.js:74-76`
- `min` and `max` use `Number(...) || 10` and `Number(...) || 90` in `src/web-components/split-surface/logic.js:35-40`
- The docs describe these as `0-100` style numeric inputs in `site/src/pages/docs/elements/web-components/splitter.njk:152-157`

Why this is bad:

- `position="0"` cannot be represented even though the docs say the range includes 0.
- `min="0"` is also impossible.
- This is a real contract bug, not a style preference.

### 3. Persistence currently overrides explicit markup without a clearly documented rule

Evidence:

- The component reads persisted state before the authored `position` wins in `src/web-components/split-surface/logic.js:74-76`
- The docs describe `position` as the initial split position in `site/src/pages/docs/elements/web-components/splitter.njk:152-156`

Why this is bad:

- In a VB codebase, explicit markup usually deserves to be the clearest source of truth.
- Persistence can still be valid, but the precedence should be intentional and documented.

### 4. The docs overclaim feature surface, especially around triple-pane layouts

Evidence:

- The `data-splitter` docs send users to `split-surface` for "persistence, collapse, and triple-pane layouts" in `site/src/pages/docs/attributes/data-splitter.njk:98` and `site/src/pages/docs/attributes/data-splitter.njk:287`
- The runtime only ever uses the first two children in `src/web-components/split-surface/logic.js:67-72`

Why this is bad:

- The repo is promising a larger layout model than the runtime actually ships.
- That weakens trust in both layers of the splitter story.

### 5. The layered attribute contract is drifting across docs, demos, and runtime

Evidence:

- `splitter-init` reads `data-min` and `data-max` from the first child in `src/utils/splitter-init.js:35-36`
- The `data-splitter` docs correctly describe `data-min` and `data-max` in `site/src/pages/docs/attributes/data-splitter.njk:118-149`
- But the layer-2 constraints example on the split-surface page uses `data-layout-min` / `data-layout-max` in `site/src/pages/docs/elements/web-components/splitter.njk:22-25`
- The demo uses `data-layout-min` / `data-layout-max` on the `split-surface` host in `demos/examples/demos/split-surface-basic.html:104-118`

Why this is bad:

- The repo is teaching multiple incompatible attribute stories for what should be a small, clear layout primitive.

### 6. The two layers have different lifecycle and enhancement models, but the docs flatten them together

Evidence:

- `data-splitter` uses a global auto-init plus `MutationObserver` in `src/utils/splitter-init.js:116-134`
- `split-surface` is a custom element with its own DOM mutation path in `src/web-components/split-surface/logic.js:67-109`
- The docs present them as a tidy layered story in `site/src/pages/docs/elements/web-components/splitter.njk:85-145`

Why this matters:

- The layered story is a good idea, but the two implementations are not actually interchangeable.
- The refactor should make the differences explicit rather than relying on marketing symmetry.

## Recommended Refactor Direction

## 1. Preserve the two-layer splitter story, but make it honest

Recommended direction:

- Keep `data-splitter` as the lighter enhancement
- Keep `split-surface` as the richer layer
- Stop describing them as more symmetrical than they really are

## 2. Make `split-surface` fully idempotent

Required changes:

- Detect and reuse or clean up an existing divider
- Keep generated nodes out of the authored-child selection path
- Reconnect must not corrupt the panel contract

## 3. Fix numeric parsing to honor the documented range

Refactor goal:

- Accept `0` where the docs say `0` is valid
- Validate/clamp explicitly instead of relying on `||` fallbacks

## 4. Choose and document a clear precedence rule for persistence

Most defensible VB default:

- explicit markup wins
- persistence fills in only when markup is silent

Any clear rule can work. The current implicit rule is the problem.

## 5. Unify the attribute vocabulary across both layers

At minimum:

- decide whether constraints are `min/max`, `data-min/data-max`, or something else
- make docs, demos, and runtime all say the same thing

## 6. Remove or implement the overclaimed features

Especially:

- triple-pane support
- any other richer layout claims that only exist in docs prose

## Suggested Implementation Sequence

1. Fix `split-surface` reconnect/idempotency.
2. Fix numeric parsing for `position`, `min`, and `max`.
3. Decide persistence precedence and document it.
4. Align the attribute vocabulary across `splitter-init`, `split-surface`, docs, and demos.
5. Remove or implement triple-pane claims.
6. Add behavior tests.

## Acceptance Criteria

- Reconnecting `split-surface` does not insert duplicate dividers or misidentify the second panel.
- `position="0"` and `min="0"` behave as documented.
- Persistence precedence is explicit and matches the docs.
- Docs and demos use the same attribute names the runtime reads.
- The docs do not claim triple-pane support unless the runtime actually has it.

## Tests That Should Exist After The Refactor

- A reconnect test for `split-surface`.
- A parsing test for `position="0"` and `min="0"`.
- A persistence-precedence test.
- A docs-contract test or fixture for the correct constraint attributes.
- A behavior test for `data-splitter` and `split-surface` staying in sync on shared event semantics.

## Do Not Do This

- Do not turn the splitter into a larger docking/window-management system.
- Do not keep the layered story if the layers keep drifting in contract and semantics.
- Do not leave the current reconnect bug in place while adding more features.

## Bottom Line

The splitter story is worth keeping, but the repo has drifted between its two layers and the web component itself is not lifecycle-safe. The refactor should fix those contracts first.
