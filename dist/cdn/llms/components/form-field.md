# <form-field>

Accessible form field: binds its control (native or form-associated custom element), times validation, shows hint/error outputs and wires aria-describedby / aria-invalid

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/form-field/
- Vanilla Breeze 0.7.4

## Example

```html
<form-field>
  <label for="name">Full Name</label>
  <input type="text"
         id="name"
         name="name"
         required
         minlength="2"
         autocomplete="name"
         aria-describedby="name-hint name-error" />
  <output id="name-hint" class="hint" for="name">As it appears on your ID.</output>
  <output id="name-error" class="error" for="name" aria-live="polite">
    Please enter at least 2 characters.
  </output>
</form-field>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `data-valid` | boolean |  | Valid state. Set by the component when a valid field has a value (not for empty optional fields); can be set by hand. |
| `data-invalid` | boolean |  | Invalid state: reveals output.error and the error icon. Set by validate()/setError(); survives moving the field. |
| `data-type` | string |  | Inline label + control layout for checkable controls. No validation icon. |
| `data-no-icon` | boolean |  | Disable the validation status icons. |
| `data-floating-label` | boolean |  | Animated floating label (floating-label-init). A real placeholder keeps the label floated. Adds data-floating-label-ready when enhanced. |
| `data-pending` | boolean |  | Dims the field and blocks pointer input while something is in flight. |
| `data-state` | string |  | Async validation hook: warning border and spinner in the icon slot. |
| `data-message-invalid` | string | `Please check this field.` | Last-resort error message when no data-message-*, authored error text or control message applies. |
| `data-label-show-password` | string | `Show password` | Accessible name of the password toggle while the password is hidden. |
| `data-label-hide-password` | string | `Hide password` | Accessible name of the password toggle while the password is shown. |
| `data-label-digit` | string | `Digit {n} of {total}` | OTP/PIN box name; {n} and {total} are replaced. |
| `data-label-incomplete` | string | `Enter all {total} digits` | OTP/PIN partial-code message (used when the input has no data-message-patternmismatch); {total} is replaced. |
| `data-label-strength` | string | `Password strength` | Accessible name of the password strength meter. |
| `data-label-strength-weak` | string | `Weak` | Strength level text. |
| `data-label-strength-fair` | string | `Fair` | Strength level text. |
| `data-label-strength-good` | string | `Good` | Strength level text. |
| `data-label-strength-strong` | string | `Strong` | Strength level text. |
| `data-label-requirements` | string | `Password requirements` | Accessible name of the password rules checklist. |
| `data-label-rule-length` | string | `At least {n} characters` | Length rule text; {n} is replaced. |
| `data-label-rule-uppercase` | string | `One uppercase letter` | Uppercase rule text. |
| `data-label-rule-lowercase` | string | `One lowercase letter` | Lowercase rule text. |
| `data-label-rule-number` | string | `One number` | Number rule text. |
| `data-label-rule-special` | string | `One special character` | Special-character rule text. |
| `data-label-strength-empty` | string | `No password entered` | Meter value text (aria-valuetext) when the password is empty. |
| `data-label-strength-too-weak` | string | `Choose a stronger password. Meet more of the requirements.` | Validity message when the password is below data-strength-min. |
| `data-label-rule-met` | string | `met` | Visually hidden state text appended to a met rule. |
| `data-label-rule-unmet` | string | `not met` | Visually hidden state text appended to an unmet rule. |
| `data-floating-label-ready` | boolean |  | Set by floating-label-init once the floating label is wired. Do not set by hand. |
| `data-otp-ready` | boolean |  | Set once the OTP/PIN boxes are built (hides the status icon). Do not set by hand. |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `data-message-valuemissing` | input | string |  | Message for valueMissing. Every ValidityState key has one: data-message-badinput, -typemismatch, -patternmismatch, -tooshort, -toolong, -rangeunderflow, -rangeoverflow, -stepmismatch, -customerror. On a custom element (or the field) for custom controls. |
| `data-message-badinput` | input | string |  | Message when the browser can't parse the entry (e.g. letters in type=number). |
| `data-message-customerror` | input | string |  | Message for a custom validity error; without it the custom message itself is shown. |
| `data-type` | input | string |  | Multi-box OTP/PIN entry. The input stays a visually hidden, validatable text input (required + a \d{length} pattern). |
| `data-length` | input | number | `6` | Number of OTP/PIN digits. |
| `data-strength` | input | boolean |  | Password strength meter + rules checklist. |
| `data-rules` | input | string | `length:8` | Comma-separated strength rules: length:N, uppercase, lowercase, number, special. Unicode-aware; unknown rules are skipped with a warning. |
| `data-strength-min` | input | string |  | Minimum strength level; weaker non-empty passwords get a custom validity error. Advisory when absent. |
| `data-count` | textarea | string |  | Character ("") or word ("words") counter, added to aria-describedby; announced only near the limit. |
| `class` | output | string |  | hint: help text, collapses when valid; error: hidden (visibility: hidden) until invalid, authored text is the fallback message. |

## Structure

| Child | Description |
| --- | --- |
| `<label>` | Field label (for= the control id). The required asterisk goes on it when it is the field's only label. |
| `<input> \| <textarea> \| <select> \| form-associated custom element` | The bound control. Radios bind their whole name group. |
| `<output class="hint">` | Help text; listed in aria-describedby. |
| `<output class="error">` | Error message; in aria-describedby only while invalid. |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `form-field:upgraded` |  | Bubbles once the field has bound its control. |

## Methods

| Method | Description |
| --- | --- |
| `validate({ show = true } = {})` | Validate the bound control and show the result immediately (error text, data-invalid/data-valid, aria-invalid, aria-describedby) — no blur needed; the form coordinator calls it on submit. Returns the validity. { show: false } returns validity without touching the UI. |
| `setError(message)` | Show a programmatic (e.g. server) error. Also set as the native control's custom validity so the form won't submit; cleared on the user's next edit. Never clears a custom error set by other code. |
| `clearError()` | Clear the field's own programmatic error and return to the neutral state. |

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `fieldName` | `string` | Human-readable field name (label or legend text, else aria-label, name or id) for error summaries. Read-only. |
| `input` | `HTMLElement \| null` | The bound control: the first form-associated custom element in the field (date-picker, star-rating, combo-box …), else the first native input/textarea/select. Read-only. |

## Accessibility

- Pattern: Native form controls
- You provide: A <label for> for the control, plus <output class="hint"> and <output class="error" aria-live="polite"> elements for the messages
- The component manages: `aria-describedby`, `aria-invalid`
