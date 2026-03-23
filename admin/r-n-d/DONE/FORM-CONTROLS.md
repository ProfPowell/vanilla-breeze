---
title: "Form Controls — CSS appearance Normalisation"
description: >
  Specification for Vanilla Breeze's approach to stripping browser-native
  form widget chrome via the CSS appearance property and replacing it with
  a fully token-driven layer.
status: draft
version: 0.1.0
created: 2026-03-18
updated: 2026-03-18
relates-to:
  - BUNDLE-SYSTEM.md
  - CSS-COLOR-MODERNISATION.md
  - llm-theme-reference.css
layer: 2–4          # CSS normalisation → static HTML → web component
---

# Form Controls — CSS `appearance` Normalisation

Vanilla Breeze normalises every styleable native form control by removing
browser-imposed widget chrome via `appearance: none` and its pseudo-element
equivalents, then governing the result entirely with design tokens. No element
is replaced with a custom widget; all controls remain native HTML, remain
keyboard-navigable, and remain accessible.

## Table of Contents

- [Principles](#principles)
- [Token Contract](#token-contract)
- [Control Specifications](#control-specifications)
  - [Checkbox](#checkbox)
  - [Radio](#radio)
  - [Select](#select)
  - [Text-type Inputs](#text-type-inputs)
  - [Range Slider](#range-slider)
  - [Progress](#progress)
  - [Meter](#meter)
  - [File Input](#file-input)
  - [Color Input](#color-input)
- [Focus Ring System](#focus-ring-system)
- [Disabled State](#disabled-state)
- [Theme Variant Tokens](#theme-variant-tokens)
- [Layer Architecture](#layer-architecture)
- [Browser Support & Known Gaps](#browser-support--known-gaps)
- [Build Order](#build-order)
- [Open Questions](#open-questions)

---

## Principles

1. **Wrap, never replace.** Every styled control is the real native element.
   If CSS is unavailable the browser's default renders; if JS is unavailable
   Layer 3 (static CSS styling) still applies.

2. **`appearance: none` is Layer 2.** The strip belongs in the CSS
   normalisation layer, not inside a web component. Web components (Layer 4)
   only enhance interaction.

3. **Pseudo-elements over wrappers.** Where the spec exposes pseudo-elements
   (`::before`, `::after`, `::-webkit-*`, `::-moz-*`) VB uses them rather
   than injecting extra DOM nodes.

4. **Token-first.** Every dimension, colour, and shape decision is a CSS
   custom property. `appearance: none` is the lock; tokens are the key. A
   theme can restyle every control by overriding tokens, never by touching
   selectors.

5. **`data-*` attributes drive variants.** States and semantic variants
   (`data-variant="success"`, `data-state="loading"`) follow the same
   pattern as every other VB component.

6. **Progressive enhancement is honest.** Where a feature genuinely requires
   JS (range fill gradient), the base CSS-only state is still useful, just
   less polished. This is documented, not hidden.

---

## Token Contract

All form-control tokens are defined in `:root` and cascade from the existing
colour, shape, and motion tokens in `llm-theme-reference.css`. Themes override
the tokens below; they do not rewrite selectors.

### Input tokens

```css
:root {
  /* Geometry */
  --input-height:          2.5rem;
  --input-padding-inline:  var(--size-m);
  --input-bg:              var(--color-surface);
  --input-border:          var(--color-border);
  --input-border-focus:    var(--color-border-focus);   /* = --color-primary */
  --input-radius:          var(--radius-m);
  --input-text:            var(--color-text);
  --input-placeholder:     var(--color-text-subtle);
}
```

### Control (checkbox / radio) tokens

```css
:root {
  --control-size:             1.125rem;
  --control-border:           var(--color-border-strong);
  --control-checked-bg:       var(--color-primary);
  --control-checked-border:   var(--color-primary);
  --control-radius-check:     var(--radius-s);    /* checkbox */
  --control-radius-radio:     var(--radius-full); /* radio */
}
```

### Select token

```css
:root {
  /* Inline SVG data-URI; themes recolour by replacing the URI */
  --select-chevron: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' …");
}
```

### Range tokens

```css
:root {
  --range-track-h:      0.375rem;
  --range-track-bg:     var(--color-border);
  --range-track-fill:   var(--color-primary);   /* overridable inline */
  --range-thumb-size:   1.25rem;
  --range-thumb-bg:     var(--color-surface);
  --range-thumb-border: var(--color-primary);
}
```

### Progress / Meter tokens

```css
:root {
  --progress-h:          0.625rem;
  --progress-track-bg:   var(--color-surface-sunken);
  --progress-fill:       var(--color-primary);

  --meter-h:             0.625rem;
  /* Meter fill colours are derived from status tokens — see §Meter */
}
```

---

## Control Specifications

### Checkbox

**Element:** `<input type="checkbox">`
**Selector:** `.vb-checkbox` (Layer 3 static class) or `vb-checkbox` custom element
(Layer 4, wrapping the input)

#### What `appearance: none` removes

- OS-drawn box, border, fill, tick graphic, inset shadow.

#### CSS strategy

Use `::after` with `clip-path` to draw the tick. No SVG assets required.

```css
.vb-checkbox {
  appearance: none;
  -webkit-appearance: none;
  width:  var(--control-size);
  height: var(--control-size);
  border: var(--border-width-medium) solid var(--control-border);
  border-radius: var(--control-radius-check);
  background: var(--input-bg);
  cursor: pointer;
  position: relative;
  transition:
    background   var(--duration-fast) var(--ease-3),
    border-color var(--duration-fast) var(--ease-3);
}

.vb-checkbox:checked {
  background:    var(--control-checked-bg);
  border-color:  var(--control-checked-border);
}

/* Clip-path checkmark — zero asset dependency */
.vb-checkbox:checked::after {
  content: "";
  display: block;
  position: absolute;
  inset: 0;
  background: var(--color-text-on-primary);
  clip-path: polygon(14% 50%, 8% 60%, 38% 86%, 94% 20%, 86% 12%, 38% 70%);
}

/* Indeterminate dash */
.vb-checkbox:indeterminate {
  background:   var(--control-checked-bg);
  border-color: var(--control-checked-border);
}
.vb-checkbox:indeterminate::after {
  content: "";
  display: block;
  position: absolute;
  top: 50%; left: 15%; right: 15%;
  height: 2px;
  margin-block-start: -1px;
  background: var(--color-text-on-primary);
  border-radius: 1px;
}
```

#### States

| State | CSS selector | Notes |
|---|---|---|
| Unchecked | `.vb-checkbox` | Default |
| Checked | `.vb-checkbox:checked` | tick via `::after` clip-path |
| Indeterminate | `.vb-checkbox:indeterminate` | dash via `::after`; set via JS `el.indeterminate = true` |
| Hover | `.vb-checkbox:hover` | border tints to `--color-primary` |
| Focus | `.vb-checkbox:focus-visible` | focus ring (see §Focus Ring) |
| Disabled | `.vb-checkbox:disabled` | `opacity: 0.4; cursor: not-allowed` |

#### Theme overrides

Themes change geometry via `--control-radius-check` (square → rounded →
pill). The tick clip-path scales correctly with `--control-size`.

---

### Radio

**Element:** `<input type="radio">`
**Selector:** `.vb-radio`

#### What `appearance: none` removes

- OS-drawn circle, inset border, fill, dot.

#### CSS strategy

Identical pattern to checkbox; border-radius is `--control-radius-radio`
(`var(--radius-full)`). The selected state renders an inner dot via
`::after` with `inset: 3px`.

```css
.vb-radio {
  appearance: none;
  -webkit-appearance: none;
  width:  var(--control-size);
  height: var(--control-size);
  border: var(--border-width-medium) solid var(--control-border);
  border-radius: var(--control-radius-radio);
  background: var(--input-bg);
  cursor: pointer;
  position: relative;
  transition:
    background   var(--duration-fast) var(--ease-3),
    border-color var(--duration-fast) var(--ease-3);
}

.vb-radio:checked {
  background:   var(--control-checked-bg);
  border-color: var(--control-checked-border);
}

.vb-radio:checked::after {
  content: "";
  display: block;
  position: absolute;
  inset: 3px;                            /* inner dot */
  background: var(--color-text-on-primary);
  border-radius: 50%;
}
```

#### States

Same matrix as checkbox minus `indeterminate`.

---

### Select

**Element:** `<select>`
**Selector:** `.vb-select`

#### What `appearance: none` removes

- OS-styled dropdown arrow (chevron or triangle), border bevel, background
  gradient, system font override.

#### CSS strategy

The custom chevron is injected as an inline SVG data-URI via the CSS
`background` shorthand. No wrapper element, no pseudo-elements.

```css
.vb-select {
  appearance: none;
  -webkit-appearance: none;
  height: var(--input-height);
  padding-inline: var(--input-padding-inline);
  padding-inline-end: calc(var(--input-padding-inline) + 1.25rem);
  background:
    var(--select-chevron) right var(--input-padding-inline) center / 1rem 1rem no-repeat,
    var(--input-bg);
  border: var(--border-width-thin) solid var(--input-border);
  border-radius: var(--input-radius);
  color: var(--input-text);
  font: inherit;
  cursor: pointer;
}
```

#### Chevron token

`--select-chevron` is a URL-encoded inline SVG. Themes that change their
primary colour must provide a matching recoloured data-URI — there is no
CSS filter path that reliably recolours a data-URI across browsers.

> **Implementation note:** Consider generating the chevron token in 11ty
> at build time from the theme's `--color-text-muted` OKLCH value so themes
> never have to hand-craft data-URIs. See [Open Questions](#open-questions).

#### OS picker behaviour

The native `<option>` list still opens via the OS picker on mobile.
This is intentional — do not replace with a custom listbox unless there is
a documented need for option groups, icons, or search.

---

### Text-type Inputs

**Elements:** `<input type="text|email|password|url|tel|number|search|date|time">`
**Selector:** `.vb-input`

#### What gets stripped — pseudo-element targets

For `number`:

```css
.vb-input[type="number"]::-webkit-inner-spin-button,
.vb-input[type="number"]::-webkit-outer-spin-button {
  appearance: none;
}
.vb-input[type="number"] {
  -moz-appearance: textfield;  /* Firefox */
}
```

For `search`:

```css
.vb-input[type="search"]::-webkit-search-decoration,
.vb-input[type="search"]::-webkit-search-cancel-button,
.vb-input[type="search"]::-webkit-search-results-button,
.vb-input[type="search"]::-webkit-search-results-decoration {
  appearance: none;
}
```

> **Rationale:** `appearance: none` is applied to the pseudo-elements, not
> the input itself. This removes the OS chrome (spinners, cancel icons)
> while leaving the input semantically intact. VB's own icon/action system
> can provide these affordances if needed.

#### Base styles

```css
.vb-input {
  appearance: none;
  -webkit-appearance: none;
  height: var(--input-height);
  padding-inline: var(--input-padding-inline);
  background: var(--input-bg);
  border: var(--border-width-thin) solid var(--input-border);
  border-radius: var(--input-radius);
  color: var(--input-text);
  font: inherit;
  transition:
    border-color var(--duration-fast) var(--ease-3),
    box-shadow   var(--duration-fast) var(--ease-3);
}

.vb-input::placeholder {
  color: var(--input-placeholder);
}
```

#### Textarea

```css
textarea.vb-input {
  height: auto;
  min-height: calc(var(--input-height) * 2.5);
  padding-block: var(--size-s);
  resize: vertical;    /* remove OS resize grip; allow vertical only */
}
```

---

### Range Slider

**Element:** `<input type="range">`
**Selector:** `.vb-range`

#### What `appearance: none` removes

- OS track, OS thumb (knob), OS tick marks, OS fill colour.

#### CSS strategy

Track styling uses a background gradient where the fill / unfilled split is
driven by a `--_pct` custom property. The gradient cannot self-compute its
split without knowing the current value — this is the known progressive
enhancement boundary.

```css
.vb-range {
  appearance: none;
  -webkit-appearance: none;
  width: 100%;
  height: var(--range-track-h);
  border-radius: var(--radius-full);
  cursor: pointer;
  background: linear-gradient(
    to right,
    var(--range-track-fill) 0%,
    var(--range-track-fill) var(--_pct, 50%),
    var(--range-track-bg)   var(--_pct, 50%),
    var(--range-track-bg)   100%
  );
}
```

**WebKit thumb:**

```css
.vb-range::-webkit-slider-thumb {
  appearance: none;
  width:  var(--range-thumb-size);
  height: var(--range-thumb-size);
  border-radius: 50%;
  background: var(--range-thumb-bg);
  border: var(--border-width-medium) solid var(--range-thumb-border);
  box-shadow: var(--shadow-sm);
  margin-block-start: calc((var(--range-thumb-size) - var(--range-track-h)) / -2);
  transition: transform var(--duration-fast) var(--ease-3),
              box-shadow var(--duration-fast) var(--ease-3);
}

.vb-range::-webkit-slider-thumb:hover {
  transform: scale(1.15);
  box-shadow: 0 0 0 4px color-mix(in oklab, var(--color-primary) 15%, transparent);
}
```

**Firefox track + thumb:**

```css
.vb-range::-moz-range-track {
  appearance: none;
  height: var(--range-track-h);
  background: var(--range-track-bg);
  border-radius: var(--radius-full);
}

.vb-range::-moz-range-thumb {
  appearance: none;
  width:  var(--range-thumb-size);
  height: var(--range-thumb-size);
  border-radius: 50%;
  background: var(--range-thumb-bg);
  border: var(--border-width-medium) solid var(--range-thumb-border);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
}
```

> **Note:** Firefox does not expose a fill pseudo-element. The gradient
> background technique does not apply to Firefox via `-moz-range-track`.
> The track will show in `--range-track-bg` only; the fill colour is lost
> in Firefox at Layer 2–3. Layer 4 JS can address this via a background
> re-paint on the element itself.

#### Layer 4 JS — fill sync

```js
// vb-range web component or standalone utility
function syncRangeFill(input) {
  const pct = ((input.value - input.min) / (input.max - input.min)) * 100;
  input.style.setProperty('--_pct', pct + '%');
}

document.querySelectorAll('.vb-range').forEach(el => {
  el.addEventListener('input', () => syncRangeFill(el));
  syncRangeFill(el); // initialise
});
```

#### Variant via inline token

`--range-track-fill` can be overridden inline for semantic coloured ranges:

```html
<input type="range" class="vb-range" style="--range-track-fill: var(--color-success)">
```

---

### Progress

**Element:** `<progress>`
**Selector:** `.vb-progress`
**Data attributes:** `data-variant`, `data-state`

#### What `appearance: none` removes

- OS gradient fill, OS track background, OS border/shadow, OS animation for
  indeterminate state.

#### CSS strategy

Cross-browser requires both Chromium pseudo-elements and a Firefox fallback.

```css
.vb-progress {
  appearance: none;
  -webkit-appearance: none;
  display: block;
  width: 100%;
  height: var(--progress-h);
  border: none;
  border-radius: var(--radius-full);
  overflow: hidden;
  background: var(--progress-track-bg);
}

/* Chromium */
.vb-progress::-webkit-progress-bar {
  background: var(--progress-track-bg);
  border-radius: var(--radius-full);
}

.vb-progress::-webkit-progress-value {
  background: var(--progress-fill);
  border-radius: var(--radius-full);
  transition: width var(--duration-slow) var(--ease-3);
}

/* Firefox */
.vb-progress::-moz-progress-bar {
  background: var(--progress-fill);
  border-radius: var(--radius-full);
}
```

#### Variants

```css
.vb-progress[data-variant="success"] { --progress-fill: var(--color-success); }
.vb-progress[data-variant="warning"] { --progress-fill: var(--color-warning); }
.vb-progress[data-variant="error"]   { --progress-fill: var(--color-error);   }
```

#### Indeterminate / loading state

The native `<progress>` element without a `value` attribute renders an
indeterminate animation by default. After `appearance: none` this is lost.
VB replaces it with a CSS animation.

```css
@keyframes vb-progress-indeterminate {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(400%); }
}

.vb-progress:not([value]),
.vb-progress[data-state="loading"] {
  position: relative;
  background: var(--progress-track-bg);
  overflow: hidden;
}

.vb-progress:not([value])::before,
.vb-progress[data-state="loading"]::before {
  content: "";
  position: absolute;
  inset-block: 0;
  width: 25%;
  background: var(--progress-fill);
  border-radius: var(--radius-full);
  animation: vb-progress-indeterminate 1.5s var(--ease-3) infinite;
}
```

> **Accessibility:** A `<progress>` without `value` is announced as
> "busy" by most screen readers. Always pair with `aria-label` or
> `aria-labelledby`. For live update regions wrap in `aria-live="polite"`.

---

### Meter

**Element:** `<meter>`
**Selector:** `.vb-meter`

#### What `appearance: none` removes

- OS gradient track, OS semantic coloring (green/yellow/red auto-switch
  based on `low`, `high`, `optimum` attributes).

#### CSS strategy — Chromium

Chromium exposes three pseudo-elements mapping to the semantic zones:

```css
.vb-meter {
  appearance: none;
  -webkit-appearance: none;
  display: block;
  width: 100%;
  height: var(--meter-h);
  border: none;
  border-radius: var(--radius-full);
  overflow: hidden;
  background: var(--progress-track-bg);
}

.vb-meter::-webkit-meter-bar {
  background: var(--progress-track-bg);
  border: none;
  border-radius: var(--radius-full);
}

.vb-meter::-webkit-meter-optimum-value      { background: var(--color-success); }
.vb-meter::-webkit-meter-suboptimum-value   { background: var(--color-warning); }
.vb-meter::-webkit-meter-even-less-good-value { background: var(--color-error); }
```

#### Firefox limitation

Firefox exposes only `::-moz-meter-bar` — there is no pseudo-element split
for the three semantic zones. All fill states map to a single colour.

```css
.vb-meter::-moz-meter-bar { background: var(--color-success); }
```

> **Decision:** Accept the Firefox parity gap. The semantic meaning of the
> `low`/`high`/`optimum` attributes is preserved in the DOM and readable by
> AT regardless of visual treatment. Document the limitation in the component
> reference page.

---

### File Input

**Element:** `<input type="file">`
**Pattern:** visually-hidden input + styled `<label>`

#### Why `appearance: none` is insufficient

File inputs consist of two UA-internal parts (a button and a text area).
`appearance: none` does not reliably expose both to full CSS control
across browsers. The `::file-selector-button` pseudo-element styles only the
button portion. The overall layout and text remain UA-controlled.

#### VB pattern

```html
<input type="file" class="vb-file" id="file-upload" aria-label="Upload document">
<label for="file-upload" class="vb-file-label">
  <!-- icon slot -->
  <span aria-hidden="true">📎</span>
  <span>Choose file…</span>
</label>
```

```css
/* Visually hidden — still in the a11y tree, still focusable */
.vb-file {
  width: 0.1px;
  height: 0.1px;
  opacity: 0;
  overflow: hidden;
  position: absolute;
  z-index: -1;
}

/* Styled trigger */
.vb-file-label {
  display: inline-flex;
  align-items: center;
  gap: var(--size-xs);
  height: var(--input-height);
  padding-inline: var(--input-padding-inline);
  background: var(--color-surface-raised);
  border: var(--border-width-thin) solid var(--input-border);
  border-radius: var(--input-radius);
  font: inherit;
  font-size: var(--font-size-sm);
  color: var(--color-text);
  cursor: pointer;
  transition:
    background   var(--duration-fast) var(--ease-3),
    border-color var(--duration-fast) var(--ease-3);
}

/* Focus ring proxied from input to label */
.vb-file:focus-visible + .vb-file-label {
  outline: var(--focus-ring-width) solid var(--focus-ring-color);
  outline-offset: var(--focus-ring-offset);
}

.vb-file-label:hover {
  background:    var(--color-surface-sunken);
  border-color:  var(--color-border-strong);
}
```

#### Progressive enhancement

- **No CSS:** Input renders natively as-is. Fully functional.
- **CSS only:** Label styled; input visually hidden; click triggers file
  picker normally.
- **JS:** Layer 4 component can intercept `change` to display the selected
  filename, show preview thumbnails, or manage multi-file state.

#### Drag-and-drop zone

A `<label>` wrapping a file input can also act as a drop target by listening
for `dragover`/`drop` on it. This is a Layer 4 enhancement — do not couple
it to the CSS layer.

---

### Color Input

**Element:** `<input type="color">`
**Selector:** `.vb-color`

#### What `appearance: none` removes

- OS border, OS background chrome around the swatch.
- Does **not** affect the OS color picker popup — that remains native.

#### Pseudo-elements

```css
.vb-color {
  appearance: none;
  -webkit-appearance: none;
  width:  var(--input-height);
  height: var(--input-height);
  padding: 3px;              /* inset gap between border and swatch */
  background: var(--input-bg);
  border: var(--border-width-thin) solid var(--input-border);
  border-radius: var(--input-radius);
  cursor: pointer;
}

.vb-color::-webkit-color-swatch-wrapper { padding: 0; }

.vb-color::-webkit-color-swatch {
  border: none;
  border-radius: calc(var(--input-radius) - 2px);
}

.vb-color::-moz-color-swatch {
  border: none;
  border-radius: calc(var(--input-radius) - 2px);
}
```

---

## Focus Ring System

All VB form controls share a single focus ring implementation driven by three
tokens. The ring uses `outline` (not `box-shadow`) so it respects
`forced-colors` mode.

```css
/* Applied to every styled control */
.vb-checkbox:focus-visible,
.vb-radio:focus-visible,
.vb-select:focus-visible,
.vb-input:focus-visible,
.vb-range:focus-visible,
.vb-color:focus-visible {
  outline: var(--focus-ring-width) solid var(--focus-ring-color);
  outline-offset: var(--focus-ring-offset);
}

/* Tokens */
:root {
  --focus-ring-width:  2px;
  --focus-ring-offset: 2px;
  --focus-ring-color:  var(--color-primary);
}
```

> **Forced colors / Windows High Contrast:** `outline` is preserved in
> forced-colors mode. `box-shadow`-based rings are not. Always use `outline`
> for focus indicators.

---

## Disabled State

All controls receive a shared disabled treatment:

```css
.vb-checkbox:disabled,
.vb-radio:disabled,
.vb-select:disabled,
.vb-input:disabled,
.vb-range:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
```

Do not add `pointer-events: none` — that would prevent the `cursor` from
rendering and would also break tooltip triggers on disabled controls.

---

## Theme Variant Tokens

Extreme themes override the form control tokens in their theme block. The
following shows a `brutalist` override as a pattern:

```css
:root[data-theme~="brutalist"] {
  --input-radius:           0;
  --control-radius-check:   0;
  --control-radius-radio:   0;
  --border-width-medium:    3px;
  --input-border:           var(--color-text);
  --control-border:         var(--color-text);
  --focus-ring-width:       3px;
  --focus-ring-offset:      0px;
  /* Chevron must be regenerated with a dark stroke for light brutalist bg */
  --select-chevron: url("…black stroke SVG…");
}
```

---

## Layer Architecture

| Layer | Responsibility | File |
|---|---|---|
| 1 — HTML | Correct semantic element, correct type attribute | Author markup |
| 2 — CSS normalise | `appearance: none`, pseudo-element resets, token defaults | `forms.css` |
| 3 — CSS static | Class-based styling (`.vb-checkbox`, `.vb-select`, etc.) | `forms.css` |
| 4 — Web component | Range fill sync, file name display, indeterminate management | `vb-range.js`, `vb-file.js` |

`forms.css` sits in the `bundle-components` CSS layer and is imported after
`bundle-theme` and `bundle-effects`, so token overrides cascade correctly.

---

## Browser Support & Known Gaps

| Control | Gap | Impact | Mitigation |
|---|---|---|---|
| `<input type="range">` | Firefox has no fill pseudo-element | Track fill colour lost in Firefox (Layer 2–3) | Layer 4 JS re-paints background on input event |
| `<meter>` | Firefox exposes only `::-moz-meter-bar` — no semantic zone split | All states same colour in Firefox | Accepted; semantic AT behaviour unaffected |
| `<input type="file">` | `appearance: none` unreliable cross-browser | Cannot fully style native button+text | Label-wrap pattern; no visual loss |
| `<select>` | `<option>` styling is near-impossible cross-browser | Option items use OS rendering | Accepted; custom listbox is a Layer 4 opt-in (future spec) |
| `--select-chevron` | Data-URI requires manual recolouring per theme | Themes must provide own chevron token | Consider build-time generation (see Open Questions) |

---

## Build Order

Implement in this sequence. Each phase is independently shippable.

### Phase 1 — Core controls (checkbox, radio, select, text inputs)

These are the highest-frequency controls. No JS dependency.

- [ ] Define all tokens in `:root` (form controls section in `llm-theme-reference.css`)
- [ ] Write `.vb-checkbox` with `:checked`, `:indeterminate`, `:disabled` states
- [ ] Write `.vb-radio` with `:checked`, `:disabled` states
- [ ] Write `.vb-select` with chevron token, `:disabled` state
- [ ] Write `.vb-input` base with number/search pseudo-element resets
- [ ] Write `textarea.vb-input` extension
- [ ] Add focus ring system (shared block)
- [ ] Test in Chrome, Firefox, Safari

### Phase 2 — Progress and meter

- [ ] Write `.vb-progress` with Chromium + Firefox pseudo-elements
- [ ] Write `@keyframes vb-progress-indeterminate` and `:not([value])` state
- [ ] Write `data-variant` overrides (success, warning, error)
- [ ] Write `.vb-meter` with Chromium pseudo-elements
- [ ] Document Firefox meter limitation in component reference

### Phase 3 — Range slider

- [ ] Write `.vb-range` track + thumb pseudo-elements (WebKit + Firefox)
- [ ] Implement `syncRangeFill()` utility in `vb-core.js`
- [ ] Define `--_pct` as internal (double-dash, single underscore convention)
- [ ] Test fill gradient in Chrome; document Firefox limitation

### Phase 4 — File and color inputs

- [ ] Write `.vb-file` + `.vb-file-label` pattern
- [ ] Write `:focus-visible + .vb-file-label` focus proxy
- [ ] Write `.vb-color` with `::-(webkit|moz)-color-swatch` pseudo-elements
- [ ] Create Layer 4 `vb-file.js` for filename display (out of scope for this phase — stub only)

### Phase 5 — Theme integration

- [ ] Add `brutalist` token overrides as canonical reference
- [ ] Add `terminal` token overrides (all radii 0, green primary)
- [ ] Regenerate `--select-chevron` data-URIs for non-default themes
- [ ] Update `compendium.json` with all new control entries
- [ ] Update `llms-compact.txt` with form controls section

---

## Open Questions

1. **Chevron generation.** Should `--select-chevron` be generated at 11ty
   build time from the theme's `--color-text-muted` value so themes never
   hand-craft data-URIs? Requires either a PostCSS plugin or a Nunjucks
   shortcode that URL-encodes an SVG template. Evaluate effort vs. manual
   approach.

2. **Custom listbox.** When is a custom `<listbox>` (replacing `<select>`)
   justified? Triggers: option icons, option descriptions, search-within,
   option groups with headers. Needs a separate spec and is explicitly out
   of scope here.

3. **`vb-core.js` utilities.** `syncRangeFill` belongs in a shared
   headless utility layer. Does this accelerate the `vb-core.js` extraction
   decision? The range is the first concrete candidate function.

4. **Date / time inputs.** `<input type="date|time|datetime-local">` have
   significant `appearance` variation across browsers and are candidates for
   the date-picker system (covered in the date/time picker spec). Should
   `.vb-input` normalise them here at minimum (reset OS chrome) before the
   full picker is built?

5. **`::file-selector-button`.** Chrome 89+ supports
   `::file-selector-button` as a standard pseudo-element. Should VB offer a
   partial file-button style (styling just the button, not the text area) as
   a simpler alternative to the full label-wrap pattern for cases where
   the filename display is acceptable in OS styling?

6. **`forced-colors` explicit overrides.** Should VB add an explicit
   `@media (forced-colors: active)` block restoring semantic colours that
   Windows High Contrast strips? Or is the `outline`-based focus ring
   sufficient to meet WCAG 2.1 §1.4.11?

---

*Spec owned by the VB core team. Implementation tracked in the project board.*
