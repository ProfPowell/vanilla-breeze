# Consent Banner Refactor Brief

## Objective

Keep `consent-banner` aligned with Vanilla Breeze's actual philosophy:

- the authored `dialog` content is the real source of truth
- the component should remain a thin behavior layer over that dialog: open/close, persistence, and trigger wiring
- the component should be honest about being a JavaScript convenience layer, not a full compliance system by itself

The refactor should make that shell reliable. It should not turn `consent-banner` into a much larger policy engine or obscure the fact that consent/legal requirements may need a broader server or product decision outside this component.

The next implementation should deliver all of the following before any extra polish work:

- one coherent attribute API across runtime, demos, docs, and generated examples
- reopen behavior works when the author follows the documented pattern
- position styling and position logic agree
- the repo is honest about the no-JS story
- tooling and tests exercise the actual shipped contract

## Files To Read First

- `src/web-components/consent-banner/logic.js`
- `src/web-components/consent-banner/styles.css`
- `site/src/pages/docs/elements/web-components/consent-banner.njk`
- `demos/snippets/demos/consent-banner-simple.html`
- `demos/snippets/demos/consent-banner-granular.html`
- `demos/snippets/demos/consent-banner-positions.html`
- `tests/components/consent-banner.spec.js`

Also note:

- I did not find `src/web-components/consent-banner/static.html`
- I did not find an htmlvalidate entry for `consent-banner`
- I did not find a compendium entry for `consent-banner`

## What To Preserve

These parts are conceptually right and should survive the refactor:

- the author controls the actual consent copy and checkbox structure inside a native `dialog`
- the accept/reject/save behavior driven by `button[value]` is a good thin-wrapper pattern
- using `dialog.show()` for non-modal top/bottom and `dialog.showModal()` for center is a sensible model
- a document-level "Manage Cookies" reopen hook is acceptable as long as the contract is clear and reliable

The main problem is not that `consent-banner` is a wrapper over authored dialog content. The problem is that the wrapper contract is only partially enforced across runtime, demos, styles, and tests.

## Current Failures

### 1. The attribute contract is split, and the demos can drive the wrong API

Evidence:

- Runtime reads plain attributes `persist`, `position`, `trigger`, and `expires` in `src/web-components/consent-banner/logic.js:13-16`, `src/web-components/consent-banner/logic.js:60-67`, `src/web-components/consent-banner/logic.js:74-80`, and `src/web-components/consent-banner/logic.js:97-104`
- The docs now describe the same plain-attribute API in `site/src/pages/docs/elements/web-components/consent-banner.njk:22-23`, `site/src/pages/docs/elements/web-components/consent-banner.njk:55`, `site/src/pages/docs/elements/web-components/consent-banner.njk:65`, and `site/src/pages/docs/elements/web-components/consent-banner.njk:247-283`
- But the dynamic positions demo still creates banners with `dataset.persist` and `dataset.position` in `demos/snippets/demos/consent-banner-positions.html:30-35`

Why this is bad:

- The repo is still generating example markup that the runtime does not read.
- That makes it harder to trust demos, and it encourages another round of accidental API drift.

### 2. Reopen behavior only works if the trigger attribute is wired consistently everywhere

Evidence:

- Connect-time trigger registration depends on `getAttribute('trigger')` in `src/web-components/consent-banner/logic.js:74-76`
- Stored-consent behavior hides vs removes based on the same plain `trigger` attribute in `src/web-components/consent-banner/logic.js:78-85`
- Close behavior also branches on plain `trigger` in `src/web-components/consent-banner/logic.js:110-119`
- Trigger-click handling reads the same plain `trigger` in `src/web-components/consent-banner/logic.js:155-176`
- The granular authored demo now uses the plain attribute correctly in `demos/snippets/demos/consent-banner-granular.html:22`

Why this is bad:

- The runtime is coherent here now, but one demo path is still manufacturing the wrong attribute form.
- Because reopen is the most important long-lived behavior in this component, the repo cannot afford even one major example still emitting a stale contract.

### 3. The component has a tooling/documentation gap compared with the rest of the repo

Evidence:

- There is no `static.html` artifact for `consent-banner`
- I did not find htmlvalidate metadata for `consent-banner`
- I did not find a visual compendium entry for `consent-banner`
- The docs explicitly discuss the no-JS story in `site/src/pages/docs/elements/web-components/consent-banner.njk:366-367`

Why this is bad:

- The component has more repo-contract ambiguity than the other reviewed web components.
- That makes it easier for the philosophy and the implementation to drift apart again.

### 4. The current no-JS story is philosophically incomplete unless it is documented very carefully

Evidence:

- CSS hides the element until upgrade in `src/web-components/consent-banner/styles.css:3-6`
- The docs say that without JavaScript the banner never appears and no consent is required, calling that a safe progressive-enhancement default in `site/src/pages/docs/elements/web-components/consent-banner.njk:366-367`

Why this is bad:

- For a JS-only demo component, that may be an acceptable product choice.
- But for a real consent/compliance story, "banner hidden when JS is absent" is not a complete answer by itself.
- The component should be framed honestly as an enhancement layer, not as the entire consent strategy.

This is not a demand for server-side implementation in this component. It is a demand for clearer scope.

### 5. The existing test suite is useful, but it is not enough if the demo contract drifts

Evidence:

- There is component behavior coverage in `tests/components/consent-banner.spec.js:16-178`
- The tests depend on demo pages such as `demos/snippets/demos/consent-banner-simple.html` and `demos/snippets/demos/consent-banner-granular.html`
- One of the demos used by this ecosystem still emits stale `data-*` attributes in `demos/snippets/demos/consent-banner-positions.html:30-35`

Why this is bad:

- The presence of tests can create false confidence when the authored fixtures are no longer aligned.
- For this component, the demo contract is part of the behavior surface.

## Recommended Refactor Direction

## 1. Keep the authored `dialog` as the component's center of gravity

Recommended direction:

- preserve authored copy and checkboxes
- preserve button-value-driven behavior
- preserve the thin wrapper model

Do not rewrite this into a component that generates all consent markup internally.

## 2. Enforce one attribute API everywhere

The runtime and docs now lean toward:

- `persist`
- `position`
- `trigger`
- `expires`

Use that same API in:

- demos
- any future compendium entry
- htmlvalidate metadata if added
- any generated fixtures

## 3. Be explicit about scope

The docs should say clearly:

- this is a client-side consent UI helper built around `dialog`
- it stores a local decision in browser storage
- if a project needs a broader no-JS or legal/compliance workflow, that lives outside this component

That is more VB-aligned than overstating what the component alone guarantees.

## 4. Fill the repo-contract gaps

At minimum:

- add htmlvalidate metadata
- add a compendium entry for visual coverage
- decide whether `consent-banner` should have a `static.html` artifact or whether the docs should explicitly explain why it does not

## Suggested Implementation Sequence

1. Fix the remaining stale `data-*` demo path in `consent-banner-positions.html`.
2. Add htmlvalidate metadata and a visual compendium entry.
3. Tighten the docs around the JS-only scope and no-JS story.
4. Re-run and extend behavior coverage around reopen behavior and position variants.

## Acceptance Criteria

Claude should not call the refactor done until all of these are true:

- All authored examples use the same plain-attribute API the runtime actually reads.
- Reopen behavior works when the author uses the documented `trigger` pattern.
- Position demos exercise the real `position` attribute, not a stale `data-position` shadow API.
- The docs honestly describe the JS-only scope of the component.
- The repo has the usual validator/fixture support expected for a maintained web component.

## Tests That Should Exist After The Refactor

At minimum add or keep automated coverage for:

- first-load open behavior
- accept/reject/save persistence
- reopen via `trigger`
- top, bottom, and center position variants
- expiry behavior
- the "stored consent + trigger present" path where the element should remain hidden rather than removed

## Do Not Do This

- Do not replace the authored `dialog` with generated internal markup.
- Do not keep multiple attribute APIs alive.
- Do not describe the component as a complete compliance solution if its real behavior is "JS-only localStorage banner."
- Do not rely on tests alone while demos still emit stale contract shapes.

## Bottom Line

The right refactor for `consent-banner` is to keep it thin and authored-markup-first, then tighten the repo contract around it: one attribute API, one honest scope statement, and tooling that actually reflects the shipped behavior.
