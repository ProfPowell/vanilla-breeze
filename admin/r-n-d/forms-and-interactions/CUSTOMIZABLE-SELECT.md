---
title: Customizable Select — Planning Document
description: Progressive enhancement of native <select> using appearance base-select, ::picker(select), and <selectedcontent>
status: planning
created: 2026-03-20
layer: native-elements
file: src/native-elements/input/styles.css
related:
  - compendium.json (select entry)
  - combo-box web component
  - CSS-COLOR-MODERNISATION.md
  - BUNDLE-SYSTEM.md
---

# Customizable Select

Enhance Vanilla Breeze's native `<select>` styling to leverage the new `appearance: base-select` platform primitive, enabling fully styled dropdowns with zero JavaScript while preserving the existing fallback for non-supporting browsers.

---

## Problem Statement

The current VB `<select>` uses `appearance: none` plus a background-image SVG chevron. This gives us control over the trigger button's border, padding, and colors, but the dropdown picker remains OS-native and unstyled. Rich content inside `<option>` (images, icons, descriptions) is impossible. Developers who need styled dropdowns must currently escalate to the `combo-box` web component, which requires JavaScript.

The platform now offers a middle path: `appearance: base-select` unlocks full CSS control over the entire `<select>` lifecycle — trigger, picker, options, icon, and checkmark — while retaining native semantics, keyboard navigation, form participation, and accessibility. This is a textbook VB progressive enhancement opportunity.

---

## Browser Support Snapshot (March 2026)

| Engine   | Status | Version |
|----------|--------|---------|
| Chromium | Shipped | Chrome/Edge 135+ |
| Safari   | Not supported | Through 26.3, TP unknown |
| Firefox  | Not supported | Through 150 |
| Samsung  | Shipped | 29+ |
| Global   | ~71% | caniuse |

Customizable select shipped as part of Chrome's 2025 CSS features. It was part of Interop 2025 proposals and the Open UI Community Group spec work, but is **not** a focus area in Interop 2026. Firefox and Safari adoption timelines are unknown. Anchor positioning (a dependency of the picker's positioning model) reached Baseline in 2025 via Interop 2025.

**Implication:** This is a forward-leaning enhancement, not a ship-everywhere feature. The progressive enhancement model is essential — VB must treat `base-select` as a pure upgrade layer, not a requirement.

---

## Architecture: Four-Layer Progressive Enhancement

### Layer 1 — Semantic HTML (no CSS, no JS)

Plain `<select>` with `<option>` elements. Works in every browser since the 1990s. This is what VB already ships.

```html
<label for="country">Country</label>
<select id="country">
  <option value="">Select a country…</option>
  <option value="us">United States</option>
  <option value="uk">United Kingdom</option>
</select>
```

No changes needed.

### Layer 2 — Current VB Styling (CSS, `appearance: none`)

This is the existing VB native-elements layer. Applies to all browsers today:

- `appearance: none` removes OS chrome
- Custom SVG chevron via `background-image`
- VB tokens for border, radius, spacing, focus ring
- `:user-invalid`, `[aria-invalid]` error states

This layer **remains untouched** and continues to serve as the baseline.

### Layer 3 — Customizable Select (CSS, `appearance: base-select`)

Gated behind `@supports (appearance: base-select)`. When the browser supports it, this layer upgrades the select with:

- Full control over the dropdown picker via `::picker(select)`
- Stylable arrow icon via `::picker-icon`
- Stylable checkmark on selected option via `::checkmark`
- `:open` / `:not(:open)` pseudo-class for open state
- Implicit popover behavior (top-layer rendering, light dismiss)
- Implicit anchor positioning (picker positioned relative to trigger)
- VB token integration throughout

```css
@supports (appearance: base-select) {
  select,
  select::picker(select) {
    appearance: base-select;
  }
}
```

### Layer 4 — Rich Content Select (Enhanced HTML + CSS)

For developers who want rich content (images, icons, descriptions) inside options, an enhanced HTML structure using `<button>` and `<selectedcontent>`:

```html
<select>
  <button>
    <selectedcontent></selectedcontent>
  </button>
  <option value="us">
    <img src="/flags/us.svg" alt="" width="20" height="15">
    United States
  </option>
  <option value="uk">
    <img src="/flags/uk.svg" alt="" width="20" height="15">
    United Kingdom
  </option>
</select>
```

In non-supporting browsers, the `<button>` and `<selectedcontent>` are ignored. The `<img>` inside `<option>` is stripped to text-only. The `<select>` works normally — this is the progressive enhancement story that makes the whole approach viable.

---

## CSS Design

### Token Integration

All customizable select styles use existing VB tokens. No new tokens are introduced unless a clear gap emerges during implementation.

| Part | Token mapping |
|------|--------------|
| Trigger button | `--color-surface`, `--color-border`, `--radius-m`, `--size-touch-min` |
| Picker dropdown | `--color-surface`, `--shadow-m`, `--radius-m`, `--color-border` |
| Options | `--font-size-sm`, `--color-text`, `--size-xs`/`--size-m` padding |
| Hover state | `--color-surface-alt` |
| Selected option | `--color-interactive`, `font-weight: 500` |
| Checkmark | `--color-interactive` |
| Picker icon | `currentColor`, transition on `:open` |
| Focus ring | Existing `--color-interactive` focus pattern |

### Layer Placement

The customizable select styles sit in the `native-elements` CSS layer, inside the existing `select` rule block in `src/native-elements/input/styles.css`. The `@supports` block nests cleanly:

```css
@layer native-elements {

  /* Layer 2: Existing VB select (unchanged) */
  select {
    appearance: none;
    padding-inline-end: var(--size-xl);
    background-image: url("data:image/svg+xml,...");
    /* ... existing styles ... */
  }

  /* Layer 3: Customizable select upgrade */
  @supports (appearance: base-select) {
    select,
    select::picker(select) {
      appearance: base-select;
    }

    select {
      /* Remove the old SVG chevron hack — ::picker-icon replaces it */
      background-image: none;
      padding-inline-end: var(--size-s);
    }

    select::picker-icon {
      color: var(--color-text-muted);
      transition: rotate var(--duration-fast) var(--ease-default);
    }

    select:open::picker-icon {
      rotate: 180deg;
    }

    select::picker(select) {
      background: var(--color-surface);
      border: var(--border-width-thin) solid var(--color-border);
      border-radius: var(--radius-m);
      box-shadow: var(--shadow-m);
      padding-block: var(--size-2xs);
    }

    select option {
      padding: var(--size-xs) var(--size-m);
      border-radius: var(--radius-s);
      transition: background-color var(--duration-fast) var(--ease-default);
    }

    select option:hover {
      background: var(--color-surface-alt);
    }

    select option:checked {
      font-weight: 500;
      color: var(--color-interactive);
    }

    select option::checkmark {
      color: var(--color-interactive);
    }

    /* Animate picker open/close via popover states */
    select::picker(select) {
      opacity: 0;
      transform: translateY(-0.25rem);
      transition:
        opacity var(--motion-enter-duration) var(--ease-out),
        transform var(--motion-enter-duration) var(--ease-out);
    }

    select:open::picker(select) {
      opacity: 1;
      transform: translateY(0);
    }

    @starting-style {
      select:open::picker(select) {
        opacity: 0;
        transform: translateY(-0.25rem);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      select::picker-icon {
        transition: none;
      }
      select::picker(select) {
        transition: none;
      }
    }
  }

  /* Layer 4: Rich content styles (only meaningful when base-select active) */
  @supports (appearance: base-select) {
    select button {
      display: flex;
      align-items: center;
      gap: var(--size-xs);
    }

    select option {
      display: flex;
      align-items: center;
      gap: var(--size-xs);
    }

    select option img {
      inline-size: 1.25em;
      block-size: auto;
      border-radius: var(--radius-s);
      flex-shrink: 0;
    }

    /* Hide detail content in the closed button if desired */
    selectedcontent .detail {
      display: none;
    }
  }
}
```

### Key Design Decisions

1. **No new custom element.** This stays in `native-elements`. The `<select>` is the element. No wrapper, no web component.

2. **Layer 2 styles are not removed.** The `appearance: none` + SVG chevron path remains for non-supporting browsers. The `@supports` block overrides cleanly.

3. **Animations use the same patterns as `drop-down` and `combo-box`.** Fade + translateY with `@starting-style`, respecting `prefers-reduced-motion`.

4. **The `::checkmark` is styled, not hidden.** VB's default is to show a checkmark in the brand interactive color. Developers can hide it with `select option::checkmark { display: none; }` if they prefer a highlighted-row approach.

5. **Anchor positioning is left at browser defaults.** The UA stylesheet handles the picker's position relative to the trigger. VB does not override `position-area` or `position-try-fallbacks` unless a variant demands it.

---

## Relationship to `combo-box`

The `combo-box` web component serves use cases that customizable `<select>` does not cover:

| Capability | Customizable `<select>` | `combo-box` |
|-----------|------------------------|-------------|
| Styled dropdown | Yes | Yes |
| Rich content in options | Yes | Yes |
| Type-to-filter / search | No | Yes |
| Multi-select with tags | No | Yes |
| Async/dynamic options | No | Yes |
| Works without JS | Yes | No |
| Full progressive enhancement | Yes | Partial |

**Guidance:** Use native `<select>` (which now upgrades itself in supporting browsers) for standard single-select dropdowns. Use `combo-box` when you need filtering, multi-select, or dynamic data.

Over time, as `base-select` browser support grows, some current `combo-box` usage may be replaceable with styled `<select>`. But `combo-box` remains necessary for its JS-dependent features.

---

## Compendium Updates

Add new variants to the existing `select` entry in `compendium.json`:

```json
{
  "id": "select-rich",
  "name": "Rich Content (base-select)",
  "requiresSupport": "appearance: base-select",
  "html": "<label for=\"ev-sel-rich\">Team Member</label><select id=\"ev-sel-rich\"><button><selectedcontent></selectedcontent></button><option value=\"alice\"><img src=\"/avatars/alice.svg\" alt=\"\" width=\"20\" height=\"20\"> Alice Chen</option><option value=\"bob\"><img src=\"/avatars/bob.svg\" alt=\"\" width=\"20\" height=\"20\"> Bob Park</option></select>"
}
```

---

## Documentation Plan

The existing select documentation page gets a new section:

1. **Customizable Select** — Explain the `base-select` upgrade, show before/after.
2. **Rich Content** — Demonstrate `<button>` + `<selectedcontent>` + images in options.
3. **Styling Guide** — Pseudo-element reference (`::picker`, `::picker-icon`, `::checkmark`).
4. **Choosing Select vs Combo Box** — Decision guide for when to use which.
5. **Browser Support** — Feature detection pattern, fallback behavior.

Include a `@supports` detection snippet for documentation consumers:

```css
@supports (appearance: base-select) {
  /* customizable select styles active */
}
```

```js
const supportsBaseSelect = CSS.supports('appearance', 'base-select');
```

---

## Build Order

### Phase 1 — Core Styling (Layers 2→3 upgrade)

1. Add `@supports (appearance: base-select)` block to `src/native-elements/input/styles.css`
2. Style `::picker(select)` with VB tokens
3. Style `::picker-icon` with rotation transition
4. Style `option` hover/checked/checkmark states
5. Add open/close animation with `@starting-style`
6. Add `prefers-reduced-motion` guard
7. Verify Layer 2 fallback is untouched in non-supporting browsers

### Phase 2 — Rich Content Support (Layer 4)

1. Add flexbox layout rules for `select button`, `select option`
2. Add `selectedcontent` descendant hiding rules
3. Add `select option img` sizing/rounding defaults
4. Test with placeholder avatar/flag images

### Phase 3 — Theme Compatibility

1. Verify all 10 bundled themes render correctly with customizable select
2. Check dark mode rendering (picker inherits surface tokens correctly)
3. Check extreme themes (brutalist, terminal, vaporwave) for any edge cases
4. Verify brand themes (hue-only overrides) cascade through the picker

### Phase 4 — Documentation and Compendium

1. Add `select-rich` variant to `compendium.json`
2. Update select documentation page with new sections
3. Add select vs combo-box decision guide
4. Screenshot automation for both supported and fallback states

---

## Open Questions

1. **`<optgroup>` styling.** The spec supports `<optgroup>` inside customizable `<select>`. How should VB style group labels? Should they get a separator line, bold label, or indented children? Needs design exploration.

2. **`selectedcontentelement` attribute.** The spec mentions a follow-up attribute that allows `<selectedcontent>` to exist outside the `<select>` for split-button patterns. This is not yet shipped. Monitor for future VB split-button support.

3. **Mobile behavior.** `base-select` explicitly opts out of native mobile OS pickers (e.g., iOS scroll wheel). This is a conscious tradeoff — the styled picker is consistent across platforms but loses the native mobile interaction pattern. Document this tradeoff clearly.

4. **Framework SSR warnings.** Some JS frameworks may not recognize `<button>` or `<selectedcontent>` inside `<select>` and could produce hydration errors. VB itself is framework-agnostic, but the integration docs should flag this.

5. **Timing.** Safari and Firefox support is unknown. Should VB ship this now as a forward-leaning enhancement (consistent with the date-picker Cally approach), or wait for broader support? Recommendation: ship it. The `@supports` gate makes it risk-free, and early adopters on Chromium get immediate benefit.

---

## References

- [MDN: Customizable select elements](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Customizable_select)
- [MDN: `::picker(select)`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/::picker)
- [MDN: `::picker-icon`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/::picker-icon)
- [MDN: `<selectedcontent>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/selectedcontent)
- [Chrome blog: A Customizable Select](https://developer.chrome.com/blog/a-customizable-select)
- [Open UI: Customizable Select Explainer](https://open-ui.org/components/customizableselect/)
- [Can I Use: `appearance: base-select`](https://caniuse.com/mdn-css_properties_appearance_base-select)
- [CSS-Tricks: `::picker()`](https://css-tricks.com/almanac/pseudo-selectors/p/picker/)
