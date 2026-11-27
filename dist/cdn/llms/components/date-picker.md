# <date-picker>

Form-associated calendar date picker with combobox text entry

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/date-picker/
- Vanilla Breeze 0.7.4

## Example

```html
<form-field>
  <label for="event">Event date</label>
  <date-picker>
    <input type="date" id="event" name="event" value="2026-04-15">
  </date-picker>
</form-field>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `name` | string |  | Form field name. A name on the inner input (the no-JS path) moves here on upgrade so exactly one value submits; the host's own name wins if both are set. |
| `disabled` | boolean |  | Disables the text input and calendar button, closes the calendar and drops the value from submission. A disabled ancestor fieldset has the same effect. A disabled on the inner input moves here on upgrade. |
| `required` | boolean |  | Makes a date required (valueMissing). Observed at runtime; a required on the inner input works too. |
| `data-disabled-dates` | string |  | Comma-separated ISO dates to disable (optionally with reason: "2026-04-05:booked"). Disabled days stay keyboard-focusable but cannot be selected. |
| `data-highlight-dates` | string |  | Comma-separated ISO dates to highlight (optionally with category: "2026-12-25:holiday"). Highlighted days remain selectable. |
| `data-label-toggle` | string | `Toggle calendar` | Accessible name for the calendar icon button (default "Toggle calendar"). |
| `data-label-dialog` | string | `Choose date` | Accessible name for the calendar popup (default "Choose date"). |
| `data-label-prev` | string | `Previous month` | Accessible name for the previous-month button (default "Previous month"). |
| `data-label-next` | string | `Next month` | Accessible name for the next-month button (default "Next month"). |
| `data-label-year` | string | `Year` | Accessible name for the year select (default "Year"). |
| `data-label-placeholder` | string | `Type a date…` | Placeholder for the text input (default "Type a date…"). |
| `data-label-required` | string | `Please select a date` | Validation message when required and empty (default "Please select a date"). |
| `data-label-range-underflow` | string | `Choose a date on or after {date}` | Validation message when the value is before min; {date} is replaced by the formatted min. A data-message-rangeunderflow on the inner input wins. |
| `data-label-range-overflow` | string | `Choose a date on or before {date}` | Validation message when the value is after max; {date} is replaced by the formatted max. A data-message-rangeoverflow on the inner input wins. |
| `data-label-input` | string | `Date` | Accessible name for the text input when neither a <label> nor an aria-label/aria-labelledby is present (default "Date"). |
| `open` | boolean |  | Reflected while the calendar is open |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `value` | input | string |  | Initial date (ISO). The value attribute is the form-reset target. |
| `min` | input | string |  | Earliest selectable date (ISO) |
| `max` | input | string |  | Latest selectable date (ISO) |
| `name` | input | string |  | Submission name for the no-JS fallback. Moved to the host on upgrade. |

## Structure

| Child | Description |
| --- | --- |
| `<input type="date">` | Required. Supplies value/min/max and is the no-JS fallback. Its <label for> (or a <label for> on the host, or an aria-label) names the generated combobox. |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `date-picker:change` | `{ value, date, source: 'pointer' \| 'keyboard' \| 'api' }` | Fired when the selected date changes (not on form reset/restore). value is the ISO string ('' when cleared), date a Date or null. source is 'api' for .value assignments, 'pointer' for grid clicks, 'keyboard' for grid Enter/Space and typed commits. |
| `date-picker:open` |  | Fired when the calendar opens |
| `date-picker:close` |  | Fired when the calendar closes |

## Methods

| Method | Description |
| --- | --- |
| `checkValidity()` | Run constraint validation without showing UI |
| `reportValidity()` | Run constraint validation and show the browser message, anchored on the text input |

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `value` | `string` | Get or set the selected date as an ISO string (YYYY-MM-DD). Assigning '' or null clears; malformed or impossible dates (2026-02-31) are ignored. |
| `min` | `string` | Get or set the earliest selectable date (ISO). Updates the calendar and validity immediately; a current value before it is kept and flagged rangeUnderflow. |
| `max` | `string` | Get or set the latest selectable date (ISO). Updates the calendar and validity immediately; a current value after it is kept and flagged rangeOverflow. |
| `form` | `HTMLFormElement \| null` | The associated form |
| `validity` | `ValidityState` | Current validity, owned by the host: valueMissing (required and empty), rangeUnderflow (before min), rangeOverflow (after max). Anchored on the text input. |
| `validationMessage` | `string` | Current validation message |
| `willValidate` | `boolean` | Whether the element is a candidate for constraint validation |

## Accessibility

- Pattern: Combobox
- You provide: An <input type="date"> with a <label for> (or an aria-label); the label is passed to the generated combobox
- The component manages: `role="combobox"`, `role="dialog"`, `role="grid"`, `aria-haspopup`, `aria-expanded`, `aria-controls`, `aria-modal`, `aria-label`, `aria-labelledby`, `aria-describedby`, `aria-selected`, `aria-current`, `aria-disabled`, `aria-required`, `aria-invalid`, `aria-hidden`, `aria-live`, `aria-atomic`, `tabindex`, `hidden`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `ArrowDown` | Open the calendar and focus the selected or current day | Focus on the text input |
| `Enter` | Commit the typed date, or clear the value when the input is empty | Focus on the text input |
| `Escape` | Close the calendar and restore the displayed value | Focus on the text input |
| `Tab` | Close the calendar and move on | Focus on the text input |
| `Tab` / `Shift+Tab` | Move through the previous month button, the year select, the next month button and the day grid, wrapping within the calendar | Focus in the calendar |
| `ArrowRight` | Move to the next day (reversed in right-to-left) | Focus in the day grid |
| `ArrowLeft` | Move to the previous day (reversed in right-to-left) | Focus in the day grid |
| `ArrowDown` | Move to the same weekday in the next week | Focus in the day grid |
| `ArrowUp` | Move to the same weekday in the previous week | Focus in the day grid |
| `Home` | Move to the first day of the week | Focus in the day grid |
| `End` | Move to the last day of the week | Focus in the day grid |
| `PageDown` | Move to the same day in the next month | Focus in the day grid |
| `PageUp` | Move to the same day in the previous month | Focus in the day grid |
| `Shift+PageDown` | Move to the same day in the next year | Focus in the day grid |
| `Shift+PageUp` | Move to the same day in the previous year | Focus in the day grid |
| `Enter` / `Space` | Select the focused day, close the calendar and return focus to the text input | Focus in the day grid |
| `Escape` | Close the calendar and return focus to the text input | Focus in the calendar |
