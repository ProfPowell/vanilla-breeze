# <stepper-wc>

Stepper for values <input type="number"> + data-stepper cannot reach: formatted units, currency, time, token-snap scales, discrete enums. Renders an inner role="spinbutton" that receives the host's label.

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Form-associated: takes part in form submission and validation.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/stepper-wc/
- Vanilla Breeze 0.7.4

## Example

```html
<stepper-wc data-min="0" data-max="64" data-suffix="px" value="12"></stepper-wc>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `value` | string |  | Current value (string). Authored value is the form-reset target; changes are reflected |
| `name` | string |  | Form field name for form participation |
| `data-min` | string |  | Numeric minimum (numeric/formatted modes only) |
| `data-max` | string |  | Numeric maximum (numeric/formatted modes only) |
| `data-step` | string |  | Step increment (default 1) |
| `data-values` | string |  | Token-snap mode: comma-separated list of values |
| `data-options` | string |  | Enum mode: JSON [{value,label}] array or csv shorthand (value==label) |
| `data-format` | string |  | Formatted mode: number \| currency \| percent \| duration \| bytes |
| `data-currency` | string |  | ISO 4217 code, used when data-format="currency" (default USD) |
| `data-suffix` | string |  | Static suffix appended to display, e.g. "px" |
| `data-show-label` | boolean |  | Token mode: display the token name (strips leading --) |
| `data-accelerate` | boolean |  | Enable long-press acceleration on the +/- buttons |
| `data-label-decrease` | string | `Decrease` | Accessible name of the decrease button |
| `data-label-increase` | string | `Increase` | Accessible name of the increase button |
| `aria-label` | string |  | Forwarded to the inner role="spinbutton" (prefer a <label for>) |
| `aria-labelledby` | string |  | Forwarded to the inner role="spinbutton", merged with any <label for> / wrapping <label> |
| `disabled` | boolean |  | Disables stepping and removes the spinbutton from the tab order. A disabled <fieldset> does the same |
| `readonly` | boolean |  | Value cannot change: spinbutton gets aria-readonly, +/- buttons are disabled |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `input` |  | Fires on every value change. Bubbles. |
| `change` |  | Fires when value changes. Bubbles. |

## Methods

| Method | Description |
| --- | --- |
| `recomputeWidth()` | Rebuild the width reserve after changing data-min/-max/-values/-options/-format after upgrade |

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `value` | `string` | Current canonical value (number as string, token, or enum value). Setting it fires input + change |
| `displayText` | `string` | The user-visible formatted text, e.g. "$5.00", "2.05 KB", "Medium" |

## Custom states

| State | Description |
| --- | --- |
| `:state(at-min)` | Value is at the lower bound |
| `:state(at-max)` | Value is at the upper bound |

## Accessibility

- Pattern: Spin button
- You provide: A <label>, aria-labelledby or aria-label for the host; it is forwarded to the spin button
- The component manages: `role="spinbutton"`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, `aria-valuetext`, `aria-label`, `aria-labelledby`, `aria-disabled`, `aria-readonly`, `aria-hidden`, `tabindex`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `ArrowUp` / `ArrowRight` | Increase by one step (ArrowRight and ArrowLeft reversed in right-to-left) | Focus on the value |
| `ArrowDown` / `ArrowLeft` | Decrease by one step | Focus on the value |
| `PageUp` | Increase by ten steps | Focus on the value |
| `PageDown` | Decrease by ten steps | Focus on the value |
| `Home` | Jump to the minimum | Focus on the value |
| `End` | Jump to the maximum | Focus on the value |
