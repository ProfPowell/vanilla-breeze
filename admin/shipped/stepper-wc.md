---
title: stepper-wc Component Plan
description: Scoped spec for `<stepper-wc>` — a stepper for values that `<input type="number">` and `data-stepper` cannot represent (formatted units, currency, time, token-snap scales, discrete enums).
tags:
  - web-components
  - specification
  - forms
  - vanilla-breeze
date: 2026-05-13
status: draft
---

# stepper-wc Component Plan

## Why this exists (and why it is NOT another number input)

VB already has two stepper-tier primitives. This component must not duplicate either.

| Tier | What it is | Use when |
|------|------------|----------|
| `<input type="number">` | Native HTML element. Spinner buttons, arrow-key step, min/max/step, form validation, numeric mobile keyboard. | Plain numeric value, default UA UI is acceptable. |
| `<input type="number" data-stepper>` | VB upscale. Wraps the native input with custom +/- buttons, hides native spinners, decimal-aware step math, min/max clamping with disabled-at-bounds, fires `input` + `change`. See `src/utils/number-init.js`. | Plain numeric value, you want VB-styled buttons and consistent cross-browser UI. |
| `<stepper-wc>` (this plan) | A stepper for values that `<input type="number">` **cannot represent**: formatted units, currency, time, token-snap scales, discrete enums. | The value is not a plain number, OR needs formatting/snapping that breaks the native input. |

**Decision rule for authors:** if `<input type="number" data-stepper>` works, use it. Reach for `<stepper-wc>` only when you hit one of the four cases below.

## Scope (in)

Four use cases this component must support. Cases outside this list are explicitly out-of-scope and should stay on `data-stepper`.

### 1. Formatted-unit steppers

Values that need a suffix or formatting the native input rejects:

```html
<stepper-wc data-min="0" data-max="100" data-step="1" data-suffix="px" value="12"></stepper-wc>
<stepper-wc data-min="0" data-max="100" data-step="5" data-suffix="%" value="50"></stepper-wc>
<stepper-wc data-format="currency" data-currency="USD" data-min="0" data-step="0.5" value="5.00"></stepper-wc>
<stepper-wc data-format="duration" data-step="300" data-min="0" data-max="3600" value="900"></stepper-wc>
<!-- duration: seconds; renders "15:00" -->
```

Formatters: `number` (default), `currency`, `percent`, `duration`, `bytes`. Use `Intl.NumberFormat` for currency/percent/number; custom code for duration/bytes. Locale via document `lang` attribute.

### 2. Token-snap steppers

Step through a named design-system scale instead of arithmetic. Internal value is the underlying number/string; displayed label is the token name.

```html
<stepper-wc data-values="0,4,8,12,16,24,32,48,64" data-suffix="px" value="16"></stepper-wc>
<!-- +/- snaps to next/previous token, even from off-scale starts -->

<stepper-wc data-values="--size-0,--size-1,--size-2,--size-3,--size-4" data-show-label value="--size-2"></stepper-wc>
<!-- value is the token name; label shows "size-2" or resolved value -->
```

`data-values` accepts a comma-separated list. Snap semantics: from any current value, +1 advances to the next-greater entry; from off-scale starts, the first step rounds to the nearest entry.

### 3. Discrete enum steppers

Step through a labeled list. Value is the underlying token; display is the human label.

```html
<stepper-wc data-options='[{"value":"s","label":"Small"},{"value":"m","label":"Medium"},{"value":"l","label":"Large"},{"value":"xl","label":"X-Large"}]' value="m"></stepper-wc>

<stepper-wc data-options="low,medium,high,critical" value="medium"></stepper-wc>
<!-- shorthand: when label == value -->
```

`data-options` accepts JSON array of `{value, label}` objects, OR a comma-separated string for the value==label case.

### 4. Long-press acceleration

For any of the above, holding the +/- button ramps:

- 0–500ms: step once
- 500ms–1500ms: step every 100ms (1× step)
- 1500ms+: step every 50ms (5× step)

Opt-in via `data-accelerate` attribute. Off by default — data-stepper users who upgrade shouldn't get surprise acceleration.

## Scope (out)

- **Plain numeric stepping** — that's `data-stepper`. Doc page must redirect authors back to it.
- **Vertical orientation, large/compact size variants** — should be added to `data-stepper` first via `data-stepper-orient` / `data-stepper-size` if demand exists, not duplicated here. (Filed as separate follow-up bead if needed.)
- **Touch-drag scrubbing** (iOS-style spin wheel) — defer; specialized interaction, not core to "step a value."
- **Two-handle range steppers** (min + max) — that's `<input type="range">` territory or a future `range-stepper`.
- **Async validation** — form-field handles this; stepper-wc fires `input` + `change` and lets form-field do the rest.

## HTML API

```html
<stepper-wc
  value="..."           <!-- current value; reflected -->
  data-min="..."        <!-- numeric/formatted modes only -->
  data-max="..."
  data-step="..."       <!-- default 1 -->
  data-values="..."     <!-- token-snap mode: comma-separated -->
  data-options="..."    <!-- enum mode: JSON or csv -->
  data-format="..."     <!-- number | currency | percent | duration | bytes -->
  data-currency="USD"   <!-- ISO 4217, for data-format=currency -->
  data-suffix="..."     <!-- static suffix, e.g. "px" -->
  data-show-label       <!-- in token-snap, show token name not resolved value -->
  data-accelerate       <!-- enable long-press acceleration -->
  name="..."            <!-- when used inside a form (ElementInternals) -->
  disabled
  readonly
></stepper-wc>
```

### Modes (mutually exclusive — component picks the first match)

1. `data-options` present → **enum mode**
2. `data-values` present → **token-snap mode**
3. `data-format` present OR `data-suffix` present → **formatted-unit mode**
4. Otherwise → **numeric mode** (and authors should be warned via console: "use `data-stepper` instead")

### Events

- `input` — fires on every value change (button or programmatic). `event.target.value` is the new value.
- `change` — fires when value commits.

Both bubble. Matches the contract `data-stepper` already uses, so form-field doesn't care which one it's wrapping.

### Form participation

Uses `ElementInternals` + `formAssociated = true` so the value submits with the form under `name`. No hidden input shim.

## Composition

- **Inside `<form-field>`**: works the same as any input. form-field handles label, helper text, error.
- **Inside `<data-table>` cells**: future — flagged as a candidate cell editor type when data-table cell editing lands. Out of scope for v1.
- **Pairs with `spacing-specimen` / `token-specimen`**: a stepper-wc in token-snap mode is the natural authoring control for a spacing-specimen demo.

## CSS architecture

- Use existing `data-stepper` CSS hooks where possible — same button visual, same disabled state, same focus ring.
- Layer: `@layer components`.
- Tokens: `--space-*`, `--color-action-*`, `--radius-*` — same as form inputs.
- Display value uses `text-align: center`, `tabular-nums`, sized via input typography tokens.
- Disabled state: full component, not just buttons.
- `:state(at-min)`, `:state(at-max)` for hooks (per `vanilla-breeze-myxo` convention investigation — use :state() for computed flags, not data-*).

## Accessibility

- Role: `spinbutton` on the inner display element.
- `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-valuetext` (formatted display) all maintained.
- Buttons: `aria-label="Decrease"` / `aria-label="Increase"`, `tabindex="-1"` (matches data-stepper — keyboard users tab to the spinbutton, not the buttons).
- Keyboard on spinbutton: ArrowUp / ArrowDown step; PageUp / PageDown step by 10× (or skip to next/previous block of 5 in token/enum modes); Home / End jump to min / max (or first / last in token/enum modes).
- Touch targets: minimum 44×44 CSS px on the +/- buttons (CSS, not JS).
- Long-press acceleration respects `prefers-reduced-motion` only insofar as it doesn't animate; the acceleration itself remains (it's an input affordance, not motion).

## File structure

```
src/web-components/stepper-wc/
├── api.json
├── logic.js       — component class, mode dispatch, formatters
├── styles.css     — reuses data-stepper CSS variables where possible
└── README.md      — internal notes (kept brief; canonical docs live in /site)
```

Plus:

```
site/src/pages/docs/elements/custom-elements/stepper-wc/index.html
  — usage docs with the 4 modes
site/src/pages/docs/concepts/numeric-inputs/index.html  (NEW)
  — decision guide: input type=number → data-stepper → stepper-wc
```

## Docs cross-referencing requirement

Both doc pages must clearly point authors at the right tier. **No copying spec content between them — link, don't duplicate.**

1. **`/docs/concepts/numeric-inputs/`** (new, the canonical decision guide)
   - Lead with a decision table (the one at the top of this plan).
   - "When to use `<input type="number">`" — link to MDN.
   - "When to use `data-stepper`" — link to the attribute reference in `admin/syntax.md` and the attribute doc page once one exists.
   - "When to use `<stepper-wc>`" — link to the component doc.

2. **`/docs/elements/custom-elements/stepper-wc/`** (component reference)
   - First section above the demos: "Not a number input? See `data-stepper` — it's probably what you want." Link out.
   - At the bottom: "See also: `<input type="number">` (MDN), `data-stepper` (attribute reference), `numeric-inputs` (decision guide)."

3. **`data-stepper` attribute reference** (currently a row in `admin/syntax.md`)
   - When this attribute gets its own attribute-doc page in the upscale-attribute series, that page must link back to `<stepper-wc>` and to the numeric-inputs decision guide. Note in the bead.

4. **`admin/future-wc.md`** Interaction table row for `stepper-wc` — update on ship (mark Shipped, link the doc page).

## Implementation checklist

- [ ] Scaffold `src/web-components/stepper-wc/` (logic.js, styles.css, api.json, README.md)
- [ ] Implement numeric mode + warning console message
- [ ] Implement formatted-unit mode (suffix, currency, percent, duration, bytes)
- [ ] Implement token-snap mode (data-values, snap semantics)
- [ ] Implement enum mode (data-options, JSON + csv shorthand)
- [ ] Implement long-press acceleration (data-accelerate)
- [ ] ElementInternals form participation (formAssociated, formData)
- [ ] ARIA spinbutton wiring (valuenow/min/max/text)
- [ ] Keyboard: Arrow/Page/Home/End
- [ ] `:state(at-min)` / `:state(at-max)` (per `myxo` convention)
- [ ] Register in `src/web-components/index.js` and `index.css`
- [ ] Demo file for new-component scaffold (4 demos: one per mode)
- [ ] Component doc page (`site/src/pages/docs/elements/custom-elements/stepper-wc/index.html`)
- [ ] **Decision-guide doc page** (`site/src/pages/docs/concepts/numeric-inputs/index.html`) — cross-references `<input type="number">`, `data-stepper`, `<stepper-wc>`
- [ ] Update `admin/syntax.md` `data-stepper` row to point at the decision guide
- [ ] Update `admin/future-wc.md` Interaction table row → Shipped
- [ ] Add component to `webComponents.js`, `elements.js`, and `navigation.json` under Interaction
- [ ] Sidebar / api registry regen (`npm run` build tasks)
- [ ] Visual regression: confirm `data-stepper` styling unchanged (we reuse its CSS hooks)

## Open questions

- Should formatted-unit mode allow free typing into the display? v1 says no (read-only display, button-only mutation) — simpler. Reconsider if author feedback wants type-to-jump.
- Token-snap mode with CSS custom properties as values (`--size-1`) — should the component resolve them to computed px at read time? v1: no, value stays as the token string; consumers can resolve via `getComputedStyle` if needed.
- Locale for duration/bytes formatting — v1 follows document `lang`. Override via `data-locale`? Defer until requested.

## References

- `src/utils/number-init.js` — current data-stepper implementation
- `src/web-components/form-field/` — form-field integration target
- `admin/syntax.md` — attribute catalog (data-stepper row, line ~1545)
- `admin/future-wc.md` — wishlist entry, Interaction section
- Bead `vanilla-breeze-myxo` — CustomStateSet convention work, informs `:state()` use here
- MDN: [`<input type="number">`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/number)
- MDN: [`Intl.NumberFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat)
