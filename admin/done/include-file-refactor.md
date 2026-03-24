# Include File Refactor Brief

## Objective

Keep `include-file` aligned with Vanilla Breeze's actual philosophy:

- authored fallback content inside the element is the real baseline
- JavaScript is an enhancement that can replace or extend that fallback with trusted HTML fragments
- the component should stay small and honest about its trust boundary, loading semantics, and failure behavior

The refactor should make that enhancement reliable. It should not turn `include-file` into a larger client-side templating system.

The next implementation should deliver all of the following before any extra polish work:

- Fallback content remains predictable across first load, repeated loads, errors, and reconnects.
- `lazy` remains meaningful even when `src` changes after connect.
- The repo stops validating and testing stale attribute names.
- Docs are explicit that the component is for trusted fragments, not sanitized third-party HTML.

## Files To Read First

- `src/web-components/include-file/logic.js`
- `src/web-components/include-file/static.html`
- `site/src/pages/docs/elements/web-components/include-file.njk`
- `tests/components/include-file.spec.js`
- `src/htmlvalidate/elements.cjs`

Also note:

- I did not find a `tests/element-visual/compendium/compendium.json` entry for `include-file`

## What To Preserve

These parts are conceptually right and should survive the refactor:

- The static fallback is honest about the baseline in `src/web-components/include-file/static.html:12-22`.
- The component keeps fallback content in the light DOM instead of hiding everything behind a separate template system.
- `mode="replace|append|prepend"` is a reasonable, small public API.
- `lazy` as a viewport-triggered enhancement fits the VB model well.

## Current Failures

### 1. The fallback contract only really works for the first load

Evidence:

- The docs say the existing content serves as fallback until fetch completes or fails in `site/src/pages/docs/elements/web-components/include-file.njk:45-46` and `site/src/pages/docs/elements/web-components/include-file.njk:167-170`
- Successful loads overwrite or extend the host in `src/web-components/include-file/logic.js:93-99`
- Error handling only sets state and dispatches an event in `src/web-components/include-file/logic.js:123-132`

Why this is bad:

- If a `replace` load succeeds and a later `src` change fails, the component leaves the previous loaded fragment in place.
- The authored fallback is gone by then, so the documented failure behavior is no longer true.
- In VB terms, the baseline is not being treated as a stable source of truth.

### 2. `lazy` is only honored on initial connect, not on later `src` changes

Evidence:

- `connectedCallback()` routes through `#observeIntersection()` only when `lazy` is present in `src/web-components/include-file/logic.js:30-39`
- `attributeChangedCallback()` always calls `#load(newVal)` immediately when `src` changes in `src/web-components/include-file/logic.js:52-55`

Why this is bad:

- A component authored as lazy stops behaving lazily as soon as its `src` changes after connection.
- That makes the loading model harder to reason about and harder to document.

### 3. Reconnect and repeat-load behavior is not explicitly idempotent

Evidence:

- `connectedCallback()` loads whenever `src` exists in `src/web-components/include-file/logic.js:30-39`
- `disconnectedCallback()` aborts the current request but does not preserve any authored fallback snapshot in `src/web-components/include-file/logic.js:42-46`
- `append` and `prepend` modes extend current DOM in `src/web-components/include-file/logic.js:95-99`

Why this is bad:

- A disconnected and reconnected element can fetch again even when that is not the author's intent.
- In `append` and `prepend` modes, repeated loads can compound content unexpectedly.

### 4. Tooling/tests are already drifting away from the runtime API

Evidence:

- The runtime reads `mode` in `src/web-components/include-file/logic.js:91`
- htmlvalidate also declares `mode` in `src/htmlvalidate/elements.cjs:449-457`
- But the append-mode test uses `data-mode` in `tests/components/include-file.spec.js:133-145`

Why this is bad:

- The test suite is validating behavior through an attribute name the runtime does not read.
- That lowers confidence in refactors because the suite is already speaking two APIs.

### 5. The docs overstate the shipped error UX

Evidence:

- The accessibility section says "Error state shows a message when content fails to load" in `site/src/pages/docs/elements/web-components/include-file.njk:173-178`
- The runtime only sets `data-error` and emits `include-file:error` in `src/web-components/include-file/logic.js:126-132`

Why this is bad:

- The component does not inject any user-facing error message.
- If authors want a visible failure state, they currently have to provide or style it themselves.

### 6. The trust boundary is under-documented

Evidence:

- Remote HTML is injected via `innerHTML` or `insertAdjacentHTML()` in `src/web-components/include-file/logic.js:93-99`
- The docs warn that `allow-scripts` is trusted-only in `site/src/pages/docs/elements/web-components/include-file.njk:81-85`
- But the broader HTML trust model is not spelled out

Why this matters:

- The risky boundary is not only "should scripts re-run."
- The risky boundary is "should this HTML be injected at all."
- This component should likely be framed as a trusted-fragment tool, not a generic remote include primitive.

## Recommended Refactor Direction

## 1. Preserve authored fallback content as an explicit contract

Recommended direction:

- Capture the original fallback content once
- Decide clearly what should happen on later failures:
  fallback restored, previous successful content kept, or author-selectable policy
- Document that policy precisely

The current ambiguity is the real problem.

## 2. Make the loading model consistent

Refactor goal:

- `lazy` means lazy whenever a new `src` is introduced
- repeat loads are intentional
- reconnect does not create surprising duplicate fetches

## 3. Unify the public API across runtime, docs, and tests

Required changes:

- Remove stale `data-mode` assumptions from tests/fixtures
- Keep `mode` as the one real attribute
- Add missing visual/test artifacts if the repo expects them for component coverage

## 4. Be explicit about the trust boundary

Recommended direction:

- Document `include-file` as a trusted HTML-fragment mechanism
- Treat `allow-scripts` as an extra opt-in on top of that
- Do not imply the component sanitizes untrusted remote markup

## Suggested Implementation Sequence

1. Decide and implement the fallback policy for repeated loads and failures.
2. Make `lazy` consistent on `src` changes.
3. Audit repeat-load/reconnect behavior, especially for `append` and `prepend`.
4. Fix test/tooling drift around `mode`.
5. Add explicit docs around trusted fragments and visible failure states.

## Acceptance Criteria

- Fallback behavior is predictable after both first-load failure and later-load failure.
- `lazy` remains effective when `src` changes after connect.
- `append` and `prepend` do not accidentally compound content on reconnect unless the author explicitly reloads.
- Tests and validators use the same attribute names the runtime reads.
- The docs no longer imply a built-in visible error message or sanitization layer that does not exist.

## Tests That Should Exist After The Refactor

- A test for `lazy` + `src` changes after connect.
- A test for repeated `replace` loads with a later failure.
- A reconnect test for `append` and `prepend`.
- A visible/API contract test that catches stale `data-mode` usage.

## Do Not Do This

- Do not turn `include-file` into a client-side rendering engine.
- Do not hide the trust boundary behind softer wording about `allow-scripts`.
- Do not make fallback behavior depend on undocumented incidental DOM state.

## Bottom Line

`include-file` is a valid VB enhancement, but only if the fallback and trust contracts are explicit and stable. The refactor should mostly tighten those contracts, not add more features.
