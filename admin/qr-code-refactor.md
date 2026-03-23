# QR Code Refactor Brief

## Objective

Keep `qr-code` aligned with Vanilla Breeze's actual philosophy:

- the human-readable URL or text is the real baseline
- the QR image is an enhancement layered on top of that baseline
- the component should stay small, dependency-free, and easy to reason about

The refactor should make that enhancement honest and durable. It should not turn `qr-code` into an image-only widget that discards the underlying action or text contract.

The next implementation should deliver all of the following before any extra polish work:

- The readable/actionable baseline survives the upgrade in some form.
- The documented attribute surface matches the reactive surface.
- Text-content-as-source remains stable across reconnects.
- The component gets behavior tests, not only visual fixtures.

## Files To Read First

- `src/web-components/qr-code/logic.js`
- `src/web-components/qr-code/styles.css`
- `src/web-components/qr-code/static.html`
- `site/src/pages/docs/elements/web-components/qr-code.njk`
- `src/htmlvalidate/elements.cjs`
- `tests/element-visual/compendium/compendium.json`

Also note:

- I did not find dedicated `tests/components` behavior tests for `qr-code`

## What To Preserve

These parts are conceptually right and should survive the refactor:

- The static fallback is strong: the end-user action can remain a normal link in `src/web-components/qr-code/static.html:13-24`.
- The built-in encoder is a good fit for VB's low-dependency posture.
- Using `value` or authored text content as input is a simple and understandable API.
- Rendering to canvas is fine as the enhancement layer.

## Current Failures

### 1. The upgrade removes the real readable/actionable baseline

Evidence:

- The static fallback explicitly presents the URL as a clickable link in `src/web-components/qr-code/static.html:13-24`
- The docs say the text content remains a readable fallback in `site/src/pages/docs/elements/web-components/qr-code.njk:160-168`
- The runtime clears the element text and appends only the canvas in `src/web-components/qr-code/logic.js:94-96`

Why this is bad:

- After upgrade, the user no longer has the original visible URL or link.
- The QR code becomes a visual endpoint rather than an enhancement of the underlying content.
- That is not a great fit for VB's "HTML-first, preserve the baseline" posture.

### 2. The documented attribute surface is only partially reactive

Evidence:

- The docs list `size`, `color`, `background`, and `error-correction` as component attributes in `site/src/pages/docs/elements/web-components/qr-code.njk:76-99`
- `observedAttributes` only includes `value` and `size` in `src/web-components/qr-code/logic.js:43-45`
- `attributeChangedCallback()` does not observe or respond to `color`, `background`, or `error-correction` changes in `src/web-components/qr-code/logic.js:47-57`

Why this is bad:

- The public API looks broader than the runtime actually supports reactively.
- Authors can reasonably expect documented attributes to matter after initial render.

### 3. Text-content source is destroyed during upgrade, which makes reconnect semantics fragile

Evidence:

- The component falls back to `this.textContent.trim()` as source in `src/web-components/qr-code/logic.js:23-24`
- Rendering erases that authored text in `src/web-components/qr-code/logic.js:94-96`
- `disconnectedCallback()` does not restore any authored source in `src/web-components/qr-code/logic.js:39-41`

Why this is bad:

- If `value` is omitted and the component relies on authored text content, the source is consumed and removed during upgrade.
- That weakens the light-DOM contract and makes reconnect/update behavior harder to reason about.

### 4. The docs overstate the accessibility baseline after upgrade

Evidence:

- The accessibility section says "The original text serves as a fallback for non-visual users" in `site/src/pages/docs/elements/web-components/qr-code.njk:165-169`
- In practice, the upgraded component leaves only the canvas with `role="img"` and `aria-label` in `src/web-components/qr-code/logic.js:32-33` and `src/web-components/qr-code/logic.js:94-96`

Why this is bad:

- The runtime does provide an image label.
- But it does not preserve the original text node, link, or other fallback text after upgrade.
- The docs should not imply both are present when only one is.

### 5. Behavior coverage is missing for the real seams

Evidence:

- I found htmlvalidate metadata and compendium fixtures for `qr-code`
- I did not find component behavior tests for fallback preservation, attribute updates, or export behavior

Why this is bad:

- The fragile areas here are upgrade semantics and reactive attribute behavior.
- Visual fixtures alone will not catch those regressions.

## Recommended Refactor Direction

## 1. Preserve the human-readable baseline during enhancement

Recommended direction:

- Keep the QR canvas
- Also keep the encoded text or URL available in a predictable way:
  visible caption, sibling link, or documented assistive-only text

The point is not to avoid the QR image. The point is to avoid replacing the underlying action with only an image.

## 2. Make the source of truth stable

Refactor goal:

- If `value` is present, it is the durable source
- If authored text content is allowed as source, capture it before mutating the DOM
- Reconnect should not depend on text content that the component already erased

## 3. Align the reactive contract with the documented contract

Choose one:

- Observe and re-render for all documented visual attributes
- Or explicitly document some attributes as initialization-only

The current half-state is the problem.

## 4. Tighten the docs around post-upgrade accessibility

The docs should describe what is actually present after upgrade:

- canvas with an accessible name
- plus whatever preserved readable baseline the refactor chooses

## Suggested Implementation Sequence

1. Decide how the readable/actionable baseline remains available after upgrade.
2. Capture source content explicitly before the first render.
3. Align `observedAttributes` with the documented public API.
4. Update docs to describe the actual post-upgrade accessibility contract.
5. Add component behavior tests.

## Acceptance Criteria

- Upgraded `qr-code` still exposes the encoded value in a human-readable/actionable way.
- Text-content-as-source works reliably across reconnects.
- Changing any documented reactive attribute behaves predictably or is clearly documented as init-only.
- Docs no longer claim the original text remains if it does not.

## Tests That Should Exist After The Refactor

- A test for value-from-text-content behavior across reconnect.
- A test for `color`, `background`, and `error-correction` updates if they remain documented as reactive.
- A test that the upgraded component still exposes the encoded URL/text baseline.
- A `toDataURL()` behavior test.

## Do Not Do This

- Do not turn the component into an image-only black box.
- Do not add a bigger QR feature surface before fixing the baseline contract.
- Do not keep documentation that implies the fallback text survives when the runtime deletes it.

## Bottom Line

`qr-code` is philosophically close to correct, but the enhancement currently eats the baseline. The refactor should preserve the readable content contract and align the reactive API with the docs.
