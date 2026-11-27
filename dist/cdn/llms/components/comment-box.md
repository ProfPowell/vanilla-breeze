# <comment-box>

Form-associated comment form composing <markdown-editor> + Submit / Cancel buttons. Used standalone or as the reply-form template inside <comment-thread>. Presentational with respect to persistence.

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/comment-box/
- Vanilla Breeze 0.7.4

## Example

```html
<comment-box name="comment" placeholder="Add a comment…"></comment-box>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `name` | string |  | Form field name (submitted with parent form). Stays on the host; the inner textarea is not named, so the value submits once. |
| `value` | string |  | Pre-filled markdown content (e.g. for edit mode) |
| `placeholder` | string |  | Editor placeholder text (forwarded to the inner <markdown-editor>) |
| `label` | string | `Comment` | Accessible name for the editor textarea. Falls back to an associated <label>'s text, then "Comment". |
| `submit-label` | string |  | Submit button label (default "Comment") |
| `cancel-label` | string |  | Cancel button label (default "Cancel") |
| `data-show-cancel` | boolean |  | Render the Cancel button |
| `data-min-length` | number |  | Minimum character length for validation |
| `data-max-length` | number |  | Maximum character length for validation; also shows a counter that announces only near or over the limit |
| `required` | boolean |  | Requires a non-empty value; a blocked submit reports the validation message |
| `disabled` | boolean |  | Disables the editor and buttons (a disabled ancestor <fieldset> does the same) |
| `aria-busy` | string |  | "true" while a comment-box:submit waitUntil() promise is pending |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `slot` | * | `toolbar` |  | slot="toolbar" children move into the tool group left of the buttons (kept across reconnects) |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `comment-box:submit` | `{ value, waitUntil(promise) }` | Bubbles, cancelable, dispatched synchronously. Do nothing: the value clears. waitUntil(promise): the box is busy until it settles; resolve clears, reject keeps the value. preventDefault() (during the handler, not after an await): the value is kept and nothing else happens. An invalid value does not fire this; it reports the validation message instead. |
| `comment-box:cancel` | `{ value }` | Cancel button clicked, or Escape pressed while the Cancel button is shown |
| `comment-box:input` | `{ value, length }` | Fires on every keystroke and after clear() |

## Methods

| Method | Description |
| --- | --- |
| `clear()` | Clear the value and emit comment-box:input |
| `focus()` | Focus the editor textarea |
| `checkValidity()` | Standard form-associated validity check |
| `reportValidity()` | Check validity and show the message |

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `value` | `string` | Get/set the current markdown content |
| `busy` | `boolean` | Read-only. True while a submit waitUntil() promise is pending |
| `form` | `HTMLFormElement \| null` | The associated form |
| `name` | `string \| null` | The name attribute |
| `validity` | `ValidityState` | Current validity |
| `validationMessage` | `string` | Current validation message |

## Accessibility

- Pattern: Native form controls
- You provide: A label attribute or an associated <label> (otherwise the field is named "Comment")
- The component manages: `role="group"`, `role="status"`, `aria-label`, `aria-busy`, `aria-disabled`, `aria-hidden`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `Ctrl+Enter` / `Meta+Enter` | Submit the comment | Focus in the comment field |
| `Escape` | Cancel, as the Cancel button does | data-show-cancel is set and focus is in the comment field or on its buttons |
