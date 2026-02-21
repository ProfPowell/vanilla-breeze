# `is=""` Attribute (Customized Built-in Elements) Evaluation

> Should VB use `<article is="content-swap">` instead of `<content-swap>` or `[data-swap]`?

## Status: Evaluated, not recommended

## What `is=""` Does

The `is` attribute extends native HTML elements with custom behavior:

```html
<!-- Instead of a new tag: -->
<content-swap>...</content-swap>

<!-- Extend the native element: -->
<article is="content-swap">...</article>
```

The element remains a native `<article>` in the DOM (inherits all article semantics, accessibility, browser behavior) but gains custom JavaScript behavior through `customElements.define('content-swap', ContentSwap, { extends: 'article' })`.

## Philosophical Alignment with VB

Strong fit with VB's HTML-first philosophy:
- Extends native elements rather than replacing them
- Preserves native semantics and accessibility for free
- No `:not(:defined)` progressive enhancement gap — it's always a valid `<article>`
- Works with CSS selectors that target native elements

## The Problem: Safari

Safari (WebKit) **refuses to implement** customized built-in elements. This is a deliberate policy decision, not a technical limitation. Their position: web components should use autonomous custom elements or Shadow DOM.

As of Feb 2026, Safari still does not support `is=""`.

## Polyfill Option

`@ungap/custom-elements` (~3KB gzipped) polyfills `is=""` across all browsers.

**Tension with VB**: VB is a zero-dependency CSS framework. Adding a runtime polyfill for a single component pattern contradicts the project's core principle.

## Comparison: Three Delivery Mechanisms

| Approach | Semantics | Browser support | Dependencies | DX |
|----------|-----------|-----------------|--------------|-----|
| `<content-swap>` | Custom tag | All browsers | None | Simple |
| `[data-swap]` attribute | Native element preserved | All browsers | None | Flexible |
| `<article is="content-swap">` | Native element preserved | Chrome/Firefox only | @ungap polyfill | Complex |

## Decision

**Recommend `data-swap` attribute as the VB-native path.** It achieves the same benefits as `is=""` (native element preserved, no wrapper) without requiring a polyfill.

The `is=""` approach remains a future option if:
1. Safari reverses their position (unlikely)
2. VB adopts a build step that could inline the polyfill
3. A project using VB already has the polyfill for other reasons

For now, VB's dual delivery (`<content-swap>` element + `[data-swap]` attribute) covers all use cases without dependencies.
