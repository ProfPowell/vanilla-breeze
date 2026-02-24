# The Vanilla Breeze "Upscale" Engine: Technical Roadmap

This document provides a deep dive into the "Markup-First" strategy for upscaling native HTML elements. Instead of replacing tags with Web Components, we use a single, lightweight global script to "hydrate" native elements with advanced behaviors based on `data-vb-*` attributes.

---

## 1. The Core Architecture: "The Observer"
To avoid manual initialization, the library uses a single `MutationObserver` that watches for any element with a `data-vb-*` attribute being added to the DOM.

```javascript
// Conceptual "Upscale" Engine
const vbUpscales = {
  'accordion': (el) => initAccordion(el),
  'dialog-backdrop': (el) => initDialogBackdrop(el),
  // ...
};

const observer = new MutationObserver((mutations) => {
  mutations.forEach(m => m.addedNodes.forEach(node => {
    if (node.nodeType !== 1) return;
    Object.keys(vbUpscales).forEach(key => {
      if (node.hasAttribute(`data-vb-${key}`)) vbUpscales[key](node);
    });
  }));
});
```

---

## 2. Advanced Element Upscaling

### A. The "Fluid" Table (`<table>`)
**The Problem:** Tables are notoriously difficult to make responsive without breaking semantics.
- **`data-vb-table="stack"`**: On mobile, the table automatically "stacks" (converting rows to cards) by pulling headers from `<thead>` and injecting them as pseudo-content (`::before`) for each cell.
- **`data-vb-sortable`**: Adds zero-config sorting logic. It detects data types (Date, Number, String) automatically using the `Intl` API.

### B. The "Smart" Textarea (`<textarea>`)
**The Problem:** Fixed-height textareas are poor UX.
- **`data-vb-auto-grow`**: Automatically adjusts the height as the user types, using a hidden ghost element to calculate `scrollHeight` without causing layout thrashing.
- **`data-vb-max-length="counter"`**: Automatically finds a sibling `<output>` or `<span>` and updates the remaining character count, adding `aria-live="polite"` for screen readers.

### C. The "Premium" Form Control (`<input>`)
- **`data-vb-password-toggle`**: Automatically injects a toggle button (eye icon) into the input container that switches the `type` between `password` and `text`.
- **`data-vb-clearable`**: Adds a "clear" (X) button that only appears when the input has a value, improving mobile usability.

### D. The Accessible Disclosure (`<details>`)
- **`data-vb-exclusive`**: When applied to a container, it ensures only one `<details>` remains open (Accordion behavior).
- **`data-vb-focus-ring`**: Injects a custom, high-contrast focus ring that respects the user's `forced-colors` mode (High Contrast Mode) on Windows.

---

## 3. Global Utility Upscales

These attributes can be applied to **any** element to grant it "superpowers."

| Attribute | Behavior | Implementation |
| :--- | :--- | :--- |
| `data-vb-copy` | Click to copy content | Uses `navigator.clipboard`. Updates `aria-label` to "Copied!" for 2 seconds. |
| `data-vb-tooltip` | Native-feel tooltip | Uses the `popover` API (where supported) for top-layer rendering. |
| `data-vb-skeleton` | Loading state | Replaces text content with an animated CSS gradient until a `loading="false"` signal is received. |
| `data-vb-intersect` | Lifecycle hook | Fires a `vb:intersect` event when the element enters/leaves the viewport. |

---

## 4. Accessibility (A11y) First
Upscaling must never break the "Native Contract."
1. **No Role-Stealing:** We never change the `role` of an element. A `button` remains a `button`.
2. **Keyboard Parity:** If we add a "clear" button to an input, it must be reachable via `Tab` and triggers via `Enter/Space`.
3. **State Reflection:** If an element is "loading," we set `aria-busy="true"`. If it's disabled, we use both the `disabled` attribute and `aria-disabled="true"`.

---

## 5. Performance Strategy
- **Event Delegation:** Instead of attaching listeners to every button, we attach one listener to `document.body` for common actions (like `data-vb-copy`).
- **Idle Execution:** Non-critical upscaling (like character counters) is initialized using `requestIdleCallback`.
- **Zero Dependencies:** All logic uses native Web APIs. No `jQuery`, no `Lodash`, no `FloatingUI`.

---

## Conclusion: The "Vanilla" Payoff
This strategy allows a developer to build a "modern, interactive application" using only HTML and a 5KB script. It eliminates the "Component Tax" (learning a new framework's syntax) while providing the "Component Benefit" (rich, reusable behavior).
