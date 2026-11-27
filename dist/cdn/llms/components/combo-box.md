# <combo-box>

Autocomplete combobox with filtering, keyboard navigation, and native form association

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/combobox/
- Vanilla Breeze 0.7.4

## Example

```html
<label for="country">Country</label>
<combo-box>
  <input type="text" id="country" name="country" placeholder="Search countries...">
  <ul>
    <li data-value="us">United States</li>
    <li data-value="gb">United Kingdom</li>
    <li data-value="ca">Canada</li>
    <li data-value="au">Australia</li>
  </ul>
</combo-box>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `name` | string |  | Form field name. A name on the inner input (the no-JS path) moves here on upgrade so exactly one value submits. |
| `required` | boolean |  | Require a selection for form validation |
| `disabled` | boolean |  | Disables the input and tag remove buttons, closes the listbox and drops the value from submission. A disabled ancestor fieldset has the same effect. |
| `filter` | `contains`, `startsWith` | `contains` | How typing filters the options |
| `value` | string |  | Selected value (single mode) |
| `placeholder` | string |  | Input placeholder text |
| `multiple` | boolean |  | Enable multi-select tag mode |
| `max` | number |  | Maximum number of tags (multi mode) |
| `custom` | boolean |  | Allow typed entries via Enter/comma (multi mode) |
| `open` | boolean |  | Reflected when the listbox is open |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `data-value` | li | string |  | Option value identifier placed on each <li> in the options list |
| `name` | input | string |  | Submission name for the no-JS fallback (submits the typed text). Moved to the host on upgrade (the host's own name wins if both are set). |

## Structure

| Child | Description |
| --- | --- |
| `<input type="text">` | Text input for filtering and display. Give it an id and point a <label for> at it — the id and labels are preserved and name the combobox. |
| `<ul> or <ol>` | Options list container |
| `<li data-value>` | Individual option — one per selectable choice |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `combo-box:change` | `{ value, label, source } \| { values[], labels[], source }` | Fired when selection changes. source is 'api' for .value assignments, 'internal' for user picks. Re-choosing the current option closes the list without firing. |
| `combo-box:open` |  | Fired when the listbox opens |
| `combo-box:close` |  | Fired when the listbox closes |

## Accessibility

- Pattern: Combobox
- You provide: A text input with a <label>, and a list of options
- The component manages: `role="combobox"`, `role="listbox"`, `role="option"`, `aria-expanded`, `aria-autocomplete`, `aria-controls`, `aria-activedescendant`, `aria-selected`, `aria-multiselectable`, `aria-invalid`, `aria-live`, `aria-atomic`, `aria-label`, `hidden`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `ArrowDown` | Open the list if closed and move to the next option, wrapping to the first |  |
| `ArrowUp` | Open the list if closed and move to the previous option, wrapping to the last |  |
| `Home` | Move to the first option | List open |
| `End` | Move to the last option | List open |
| `Enter` | Select the active option; in multiple mode with custom values, add the typed text as a tag. With no active option and nothing to add, Enter submits the form |  |
| `, ` | Add the typed text as a tag | Multiple mode with custom values |
| `Backspace` | Remove the last tag | Multiple mode, input empty |
| `Escape` | Close the list and keep focus in the input | List open |
| `Tab` | Close the list and move focus on | List open |
