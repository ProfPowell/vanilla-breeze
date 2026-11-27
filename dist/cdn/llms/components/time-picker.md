# <time-picker>

Form-associated time input with combobox text entry and a spinbutton popup

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/time-picker/
- Vanilla Breeze 0.7.4

## Example

```html
<form-field>
  <label for="meeting">Meeting time</label>
  <time-picker name="meeting" data-format="24h">
    <input type="time" id="meeting" value="14:30">
  </time-picker>
</form-field>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `name` | string |  | Form field name. A name on the inner input (the no-JS path) moves here on upgrade so exactly one value submits; the host's own name wins if both are set. |
| `data-format` | `12h`, `24h` |  | Force a 12- or 24-hour display. Default: the hour cycle of the nearest [lang] (else the browser locale). |
| `disabled` | boolean |  | Disables the text input and clock button, closes the popup and drops the value from submission. Observed at runtime; a disabled ancestor fieldset has the same effect. A disabled on the inner input moves here on upgrade. |
| `required` | boolean |  | Makes a time required (valueMissing while empty). Observed at runtime; a required on the inner input works too. |
| `data-label-input` | string | `Time` | Accessible name for the text input when neither a <label> nor an aria-label/aria-labelledby is present. |
| `data-label-placeholder` | string | `Type a time…` | Placeholder for the text input. |
| `data-label-toggle` | string | `Toggle time spinners` | Accessible name for the clock button. |
| `data-label-dialog` | string | `Choose time` | Accessible name for the spinner popup (role=dialog). |
| `data-label-hours` | string | `Hours` | Accessible name of the hours spinbutton. |
| `data-label-minutes` | string | `Minutes` | Accessible name of the minutes spinbutton. |
| `data-label-seconds` | string | `Seconds` | Accessible name of the seconds spinbutton. |
| `data-label-period` | string | `AM/PM` | Prefix of the AM/PM button's accessible name ("AM/PM: PM"). The AM/PM text itself comes from Intl. |
| `data-label-empty` | string | `Not set` | Spinbutton value text while no time is set. |
| `data-label-required` | string | `Please select a time` | Validation message when required and empty. A data-message-valuemissing on the inner input wins. |
| `data-label-range-underflow` | string | `Choose a time at or after {time}` | Validation message when before min; {time} is the formatted min. A data-message-rangeunderflow on the inner input wins. |
| `data-label-range-overflow` | string | `Choose a time at or before {time}` | Validation message when after max; {time} is the formatted max. A data-message-rangeoverflow on the inner input wins. |
| `data-label-step-mismatch` | string | `Choose a valid time. The nearest are {lower} and {upper}` | Validation message when off the step grid; {lower}/{upper} are the nearest valid times. A data-message-stepmismatch on the inner input wins. |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `value` | input | string |  | Initial time (HH:MM[:SS]). The value attribute is the form-reset target; omit it for an empty field. |
| `min` | input | string |  | Earliest valid time. Spinners stay at or after it; a typed earlier time is kept and flagged rangeUnderflow. A min later than max is an overnight range. |
| `max` | input | string |  | Latest valid time. Spinners stay at or before it; a typed later time is kept and flagged rangeOverflow. |
| `step` | input | string |  | Step in seconds (default 60; 'any' disables step checks), counted from min. Spinners snap to it; typed off-step times are flagged stepMismatch. Under 60 (or not a whole minute) shows a seconds spinner; whole hours (3600, 7200…) step the hours spinner and make minutes read-only. |
| `name` | input | string |  | Submission name for the no-JS fallback. Moved to the host on upgrade. |

## Structure

| Child | Description |
| --- | --- |
| `<input type="time">` | Required. Supplies value/min/max/step and is the no-JS fallback. Its <label for> (or a <label for> on the host, or an aria-label) names the generated combobox. |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `time-picker:change` | `{ value, hours, minutes, seconds, source: 'pointer' \| 'keyboard' \| 'api' }` | Fired when the value changes (not on form reset/restore, not when a commit leaves it unchanged). value is 'HH:MM' or 'HH:MM:SS', '' when cleared (hours/minutes/seconds are then null). source is 'api' for .value assignments, 'pointer' for spinner/AM-PM clicks, 'keyboard' for typed commits and spinner keys. |

## Methods

| Method | Description |
| --- | --- |
| `checkValidity()` | Run constraint validation without showing UI |
| `reportValidity()` | Run constraint validation and show the browser message, anchored on the text input |

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `value` | `string` | Get or set the time as 'HH:MM' (or 'HH:MM:SS' when seconds are shown). '' when unset; assigning '' or null clears; malformed values are ignored. |
| `form` | `HTMLFormElement \| null` | The associated form |
| `validity` | `ValidityState` | Current validity, owned by the host: valueMissing, rangeUnderflow, rangeOverflow (both for a value outside an overnight range), stepMismatch. Anchored on the text input. |
| `validationMessage` | `string` | Current validation message |
| `willValidate` | `boolean` | Whether the element is a candidate for constraint validation |

## Accessibility

- Pattern: Combobox with a dialog popup of spin buttons
- You provide: A child <input type="time"> with a <label>; the label is forwarded to the generated text input
- The component manages: `role="combobox"`, `role="dialog"`, `role="spinbutton"`, `aria-haspopup`, `aria-expanded`, `aria-controls`, `aria-modal`, `aria-label`, `aria-labelledby`, `aria-describedby`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, `aria-valuetext`, `aria-readonly`, `aria-required`, `aria-invalid`, `aria-hidden`, `tabindex`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `ArrowDown` | Open the panel and focus its first segment | Focus in the text input |
| `Enter` | Commit the typed time and close the panel | Focus in the text input |
| `Escape` | Close the panel and restore the displayed value | Focus in the text input |
| `ArrowUp` | Increase the unit by one step | Focus on an hours, minutes or seconds spin button |
| `ArrowDown` | Decrease the unit by one step | Focus on an hours, minutes or seconds spin button |
| `PageUp` | Increase minutes or seconds by 10 (or the next multiple of the step at or above 10), hours by one step; other units do not change | Focus on an hours, minutes or seconds spin button |
| `PageDown` | Decrease minutes or seconds by 10 (or the next multiple of the step at or above 10), hours by one step; other units do not change | Focus on an hours, minutes or seconds spin button |
| `Home` | Set the unit to its minimum | Focus on an hours, minutes or seconds spin button |
| `End` | Set the unit to its maximum | Focus on an hours, minutes or seconds spin button |
| `0` / `1` / `2` / `3` / `4` / `5` / `6` / `7` / `8` / `9` | Type the unit's value directly | Focus on an hours, minutes or seconds spin button |
| `ArrowRight` | Move to the next segment (reversed in right-to-left) | Focus on a spin button or the AM/PM button |
| `ArrowLeft` | Move to the previous segment (reversed in right-to-left) | Focus on a spin button or the AM/PM button |
| `Escape` | Close the panel and return focus to the text input | Focus on a spin button or the AM/PM button |
