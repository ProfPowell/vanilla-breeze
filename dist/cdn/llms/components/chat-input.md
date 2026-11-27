# <chat-input>

Form-associated chat input with auto-growing textarea; submits its form, or fires chat-input:send when standalone

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Form-associated: takes part in form submission and validation.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/chat-input/
- Vanilla Breeze 0.7.4

## Example

```html
<chat-input name="message">
  <textarea data-grow rows="1" data-max-rows="8" aria-label="Message"
            placeholder="Ask anything..."></textarea>
  <footer>
    <button type="submit" class="small" data-send aria-label="Send">
      <icon-wc name="send"></icon-wc>
    </button>
  </footer>
</chat-input>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `name` | string |  | Form field name; required for the value to appear in FormData (no default) |
| `maxlength` | number | `4000` | Character limit; over it the element is invalid (tooLong) and sending is blocked |
| `minlength` | number | `1` | Minimum trimmed length to send |
| `disabled` | boolean |  | Disables the textarea and send button (an ancestor fieldset[disabled] does the same) |
| `autofocus` | boolean |  | Focus textarea on connect |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `data-send` | button | boolean |  | Marks the send button; submits the form or fires chat-input:send |
| `data-grow` | textarea | boolean |  | Auto-resize the textarea (VB textarea-grow utility) |

## Structure

| Child | Description |
| --- | --- |
| `textarea` | The message field; give it an accessible name (aria-label="Message" is added when it has none) |
| `button[data-send]` | Send button |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `chat-input:send` | `{ message }` | Enter or send button when not inside a form; message is trimmed and the input clears afterwards |
| `chat-input:input` | `{ value, length }` | Keystroke, debounced 100ms |
| `chat-input:change` | `{ value, source: 'api' }` | The value property was set to a new value |

## Methods

| Method | Description |
| --- | --- |
| `focus()` | Focus the textarea |
| `reset()` | Clear the value and resize |
| `checkValidity()` | Native constraint validation check |
| `reportValidity()` | Check validity and show the browser message on the textarea |

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `value` | `string` | Current textarea content (get/set; setting fires chat-input:change) |
| `disabled` | `boolean` | Reflects the disabled attribute |
| `form` | `HTMLFormElement \| null` | The associated form (read-only) |
| `name` | `string` | The name attribute (read-only) |
| `validity` | `ValidityState` | Constraint validation state (read-only) |
| `validationMessage` | `string` | Current validation message (read-only) |

## Accessibility

- Pattern: Native form controls
- You provide: A <textarea> with a label (otherwise it is named "Message") and a named send button
- The component manages: `aria-label`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `Enter` | Send the message | Focus in the message field |
| `Escape` | Clear the message field | Focus in the message field |
