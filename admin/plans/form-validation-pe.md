---
title: Form Validation — Progressive Enhancement Spec
status: draft
category: forms
relates-to: forms-skill, data-attributes-skill, progressive-enhancement-skill
elements: form-field, form
---

# Form Validation — Progressive Enhancement Spec

## Summary

Form validation in VB follows the four-layer PE stack. Each layer is a complete, working experience. The question for every design decision is: **what does it degrade to?**

The Layer 4 web component suppresses browser-native validation UI and takes full ownership of the UX. If JS fails, the browser takes back that ownership cleanly.

---

## The Four Layers

### Layer 1 — Native HTML

The baseline. No CSS, no JS. Works in every browser, every screen reader, every scraper.

- Native validation attributes: `required`, `minlength`, `maxlength`, `pattern`, `type`, `min`, `max`
- Static `<output>` holds a generic hint message (not error-specific yet)
- On submit, the browser shows its native validation bubbles
- Form submits to `action` URL via `method="post"` — no JS required for submission
- `aria-describedby` links the input to the `<output>` for screen readers

```html
<form action="/contact" method="post">
  <form-field>
    <label for="name">Name</label>
    <input type="text"
           id="name"
           name="name"
           required
           minlength="2"
           autocomplete="name"
           aria-describedby="name-msg"
           data-message-valuemissing="Please enter your name"
           data-message-tooshort="Name must be at least 2 characters"/>
    <output id="name-msg" for="name" aria-live="polite">
      At least 2 characters required
    </output>
  </form-field>

  <form-field>
    <label for="email">Email</label>
    <input type="email"
           id="email"
           name="email"
           required
           autocomplete="email"
           aria-describedby="email-msg"
           data-message-valuemissing="Please enter your email address"
           data-message-typemismatch="Please enter a valid email address"/>
    <output id="email-msg" for="email" aria-live="polite">
      We will never share your email
    </output>
  </form-field>

  <button type="submit">Send</button>
</form>
```

**Layer 1 degradation contract:**
- `<form-field>` renders as a block-level unknown element (CSS sets `display: grid`)
- `<output>` renders as inline, is visible always
- Browser shows constraint violation bubbles on submit
- Form reaches the server

---

### Layer 2 — CSS

CSS makes validation states visible without any JavaScript. The key insight: `:user-valid` and `:user-invalid` only fire **after the user has interacted** with a field, so there are no premature red states on page load.

#### State styling via pseudo-classes

```css
/* Input states — driven by browser constraint engine */
form-field:has(input:user-invalid),
form-field:has(textarea:user-invalid),
form-field:has(select:user-invalid) {
  & input, & textarea, & select {
    border-color: var(--form-invalid-color);
  }
  & output {
    color: var(--form-invalid-color);
  }
}

form-field:has(input:user-valid),
form-field:has(textarea:user-valid),
form-field:has(select:user-valid) {
  & input, & textarea, & select {
    border-color: var(--form-valid-color);
  }
}
```

#### State styling via data attributes (set by Layer 4)

CSS must also respond to `data-*` attributes set by the web component. This enables Layer 4 to drive visual state programmatically for cases CSS pseudo-classes cannot handle (e.g. server-returned errors, async validation).

```css
form-field[data-invalid] {
  & input, & textarea, & select {
    border-color: var(--form-invalid-color);
  }
  & output {
    color: var(--form-invalid-color);
    display: block; /* Ensure visible */
  }
}

form-field[data-valid] {
  & input, & textarea, & select {
    border-color: var(--form-valid-color);
  }
}

form-field[data-pending] {
  opacity: 0.7;
  pointer-events: none;
}
```

#### Required indicators

```css
form-field:has(input:required, textarea:required, select:required) {
  & label::after {
    content: " *";
    color: var(--form-invalid-color);
    aria-hidden: true; /* Screen readers use the `required` attribute */
  }
}
```

#### Form-level states (set by Layer 4)

```css
form[data-submitting] button[type="submit"] {
  opacity: 0.7;
  cursor: not-allowed;
  /* Loading spinner via ::after — see token: --form-spinner */
}

form[data-success] {
  & [data-form-fields] { display: none; }
  & [data-form-success] { display: block; }
}

form[data-error] {
  /* Error summary visible */
}
```

**Layer 2 degradation contract:**
- If JS is disabled, `:user-valid`/`:user-invalid` still style the form correctly
- `data-*` state attributes simply won't be set — no broken states, just less granular feedback
- The `<output>` always shows its static message

---

### Layer 3 — Enhanced Static HTML

The `<form-field>` element is defined as a custom element in CSS but is not yet upgraded by JS. Layer 3 adds authored `data-message-*` attributes on inputs — these are inert at this layer but constitute the **data contract** that Layer 4 consumes.

The key author responsibility: **every validation constraint should have a corresponding `data-message-*` attribute** authored in the HTML. This is the machine-readable contract between markup and the enhancement layer.

#### ValidityState message attribute mapping

| `ValidityState` key | `data-*` attribute | When triggered |
|---|---|---|
| `valueMissing` | `data-message-valuemissing` | `required` field is empty |
| `typeMismatch` | `data-message-typemismatch` | `type="email"` / `type="url"` format wrong |
| `patternMismatch` | `data-message-patternmismatch` | `pattern` regex fails |
| `tooShort` | `data-message-tooshort` | Below `minlength` |
| `tooLong` | `data-message-toolong` | Above `maxlength` |
| `rangeUnderflow` | `data-message-rangeunderflow` | Below `min` |
| `rangeOverflow` | `data-message-rangeoverflow` | Above `max` |
| `stepMismatch` | `data-message-stepmismatch` | Not on `step` interval |
| `customError` | *(not authored; set programmatically)* | `setCustomValidity()` called |

If a `data-message-*` attribute is absent for a triggered state, Layer 4 falls back to the browser's built-in `validationMessage` string. This is an acceptable fallback — it means the error will be shown, just in the browser's locale string rather than your authored copy.

**Layer 3 deliverable:**
- Fully authored HTML with all `data-message-*` attributes for every constrained field
- Static `<output>` text should be the most-likely error message (usually `data-message-valuemissing`) so Layer 1/2 experience is helpful
- A `<div data-form-success hidden>` and optionally `<div id="[form-id]-summary" data-form-summary hidden>` authored in the markup as upgrade slots for Layer 4

```html
<!-- Layer 3 HTML: complete authored structure -->
<form action="/contact" method="post" id="contact-form">

  <!-- Error summary slot — Layer 4 populates and un-hides this -->
  <div id="contact-form-summary"
       data-form-summary
       role="alert"
       tabindex="-1"
       hidden>
    <h2>There are problems with your submission</h2>
    <ul data-summary-list></ul>
  </div>

  <form-field>
    <label for="email">Email</label>
    <input type="email"
           id="email"
           name="email"
           required
           autocomplete="email"
           aria-describedby="email-msg"
           data-message-valuemissing="Please enter your email address"
           data-message-typemismatch="Please enter a valid email address"/>
    <output id="email-msg" for="email" aria-live="polite">
      We will never share your email
    </output>
  </form-field>

  <!-- Success message slot — Layer 4 swaps in this -->
  <div data-form-success hidden>
    <p>Thank you — we will be in touch shortly.</p>
  </div>

  <button type="submit">Send</button>
</form>
```

---

### Layer 4 — `<form-field>` Web Component

When the custom element upgrades, it takes ownership of:

1. Suppressing browser validation UI (`novalidate` on the parent `<form>`)
2. Validation timing (blur / eager-re-validate / submit)
3. Dynamic `<output>` message content from `data-message-*` attributes
4. `data-valid`/`data-invalid` state on itself
5. `aria-invalid` on the controlled input

The `<form-field>` does NOT own form-level concerns (error summary, submit handling, async). Those belong to the `<form>` enhancement — see below.

#### Validation timing strategy

```
first touch  →  blur event  →  validate() → show error if invalid
after error  →  input event →  validate() → clear error as user fixes it
on submit    →  (driven by form) validate() → report to form
```

This pattern is the industry standard for minimising user frustration:
- Never show errors before the user has touched the field
- Recover eagerly once an error has been shown
- Always re-validate everything on submit

#### `form-field` component responsibilities

```js
class FormField extends HTMLElement {
  #input = null;
  #output = null;
  #hasBeenInvalid = false;

  connectedCallback() {
    this.#input = this.querySelector('input, textarea, select');
    this.#output = this.querySelector('output');

    if (!this.#input) return;

    // Defer novalidate to form enhancement layer
    this.#input.addEventListener('blur', () => this.#onBlur());
    this.#input.addEventListener('input', () => this.#onInput());
  }

  #onBlur() {
    this.validate();
  }

  #onInput() {
    // Only re-validate eagerly after the first error has been shown
    if (this.#hasBeenInvalid) {
      this.validate();
    }
  }

  validate() {
    const input = this.#input;
    const valid = input.checkValidity();

    if (valid) {
      this.#setState('valid');
      input.removeAttribute('aria-invalid');
    } else {
      this.#hasBeenInvalid = true;
      this.#setState('invalid');
      input.setAttribute('aria-invalid', 'true');
      this.#updateMessage(input.validity);
    }

    return valid;
  }

  // Called by form enhancement for server-returned errors
  setError(message) {
    this.#input.setCustomValidity(message);
    this.#hasBeenInvalid = true;
    this.#setState('invalid');
    this.#input.setAttribute('aria-invalid', 'true');
    if (this.#output) this.#output.textContent = message;
  }

  clearError() {
    this.#input.setCustomValidity('');
    this.#setState(null);
    this.#input.removeAttribute('aria-invalid');
    this.#hasBeenInvalid = false;
  }

  get fieldName() {
    return this.querySelector('label')?.textContent.trim() ?? this.#input?.name ?? 'Field';
  }

  #setState(state) {
    delete this.dataset.valid;
    delete this.dataset.invalid;
    if (state) this.dataset[state] = '';
  }

  #updateMessage(validity) {
    if (!this.#output) return;
    const input = this.#input;

    // Walk ValidityState keys in priority order
    const keys = [
      'valueMissing', 'typeMismatch', 'patternMismatch',
      'tooShort', 'tooLong', 'rangeUnderflow', 'rangeOverflow',
      'stepMismatch', 'customError'
    ];

    for (const key of keys) {
      if (validity[key]) {
        const attr = `data-message-${key.toLowerCase()}`;
        const msg = input.getAttribute(attr) ?? input.validationMessage;
        this.#output.textContent = msg;
        return;
      }
    }
  }
}

customElements.define('form-field', FormField);
```

---

## Form-Level Enhancement

`<form-field>` handles field-level concerns. The form as a whole needs a coordinator for:
- Preventing submission when invalid
- Building and focusing the error summary
- Async fetch submission
- Loading/success/error states

This is handled by a **form initialiser** that runs on `DOMContentLoaded` and enhances any `<form>` that has `<form-field>` children. It does not require a custom element on `<form>` (which would need `is=` — no Safari support).

```js
// form-enhancement.js — runs once, enhances all vb forms
function enhanceForm(form) {
  // Take ownership of validation UI
  form.setAttribute('novalidate', '');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const fields = [...form.querySelectorAll('form-field')];
    const results = fields.map(f => ({ field: f, valid: f.validate() }));
    const invalid = results.filter(r => !r.valid);

    if (invalid.length > 0) {
      showErrorSummary(form, invalid);
      return;
    }

    await submitForm(form);
  });
}

function showErrorSummary(form, invalidFields) {
  const summary = form.querySelector('[data-form-summary]');
  if (!summary) return;

  const list = summary.querySelector('[data-summary-list]');
  if (list) {
    list.innerHTML = '';
    for (const { field } of invalidFields) {
      const input = field.querySelector('input, textarea, select');
      const label = field.fieldName;
      const msg = field.querySelector('output')?.textContent ?? 'Invalid';
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = `#${input?.id}`;
      a.textContent = `${label}: ${msg}`;
      li.appendChild(a);
      list.appendChild(li);
    }
  }

  summary.hidden = false;
  form.dataset.error = '';
  summary.focus();
}

async function submitForm(form) {
  const submitBtn = form.querySelector('[type="submit"]');

  form.dataset.submitting = '';
  if (submitBtn) submitBtn.disabled = true;

  try {
    const data = new FormData(form);
    const response = await fetch(form.action, {
      method: form.method || 'post',
      body: data,
    });

    if (!response.ok) {
      // Attempt to read server validation errors (JSON: { errors: { fieldName: message } })
      const contentType = response.headers.get('content-type') ?? '';
      if (contentType.includes('application/json')) {
        const body = await response.json();
        if (body.errors) {
          mapServerErrors(form, body.errors);
          return;
        }
      }
      throw new Error(`Server error: ${response.status}`);
    }

    // Success
    delete form.dataset.submitting;
    delete form.dataset.error;
    form.dataset.success = '';

    const successEl = form.querySelector('[data-form-success]');
    if (successEl) {
      successEl.hidden = false;
      successEl.focus();
    }

  } catch (err) {
    // Network or unexpected server error
    delete form.dataset.submitting;
    form.dataset.error = 'network';
    if (submitBtn) submitBtn.disabled = false;
    // Show a form-level error — see form[data-error="network"] CSS contract
  }
}

function mapServerErrors(form, errors) {
  // errors: { email: "Already registered", name: "Too long" }
  delete form.dataset.submitting;
  form.dataset.error = '';

  const fields = [...form.querySelectorAll('form-field')];
  const invalidFields = [];

  for (const field of fields) {
    const input = field.querySelector('input, textarea, select');
    if (!input) continue;
    const msg = errors[input.name];
    if (msg) {
      field.setError(msg);
      invalidFields.push({ field });
    }
  }

  if (invalidFields.length > 0) {
    showErrorSummary(form, invalidFields);
  }

  // Clear custom validity on next input so resubmission works
  fields.forEach(f => {
    f.querySelector('input, textarea, select')
     ?.addEventListener('input', () => f.clearError(), { once: true });
  });
}

// Auto-enhance any form containing form-field elements
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('form:has(form-field)').forEach(enhanceForm);
});
```

---

## CSS Contracts for Form-Level States

The form enhancer sets these attributes — CSS must handle them:

| Attribute | Element | Meaning |
|---|---|---|
| `data-submitting` | `<form>` | Fetch in flight |
| `data-success` | `<form>` | Submission accepted |
| `data-error` | `<form>` | Submit failed (generic or field errors visible) |
| `data-error="network"` | `<form>` | Network/server error |

```css
/* Submit pending */
form[data-submitting] {
  & [type="submit"] {
    opacity: 0.6;
    cursor: wait;
    &::after {
      content: "";
      /* Spinner animation — see animation tokens */
    }
  }
}

/* Success: hide fields, show success message */
form[data-success] {
  & :not([data-form-success]) {
    display: none;
  }
  & [data-form-success] {
    display: block;
  }
}

/* Network error: show a form-level message */
form[data-error="network"] {
  &::before {
    content: attr(data-error-message, "Something went wrong. Please try again.");
    display: block;
    color: var(--form-invalid-color);
    padding: var(--space-sm);
    border: 1px solid var(--form-invalid-color);
    border-radius: var(--radius-sm);
  }
}

/* Error summary */
[data-form-summary]:not([hidden]) {
  border: 2px solid var(--form-invalid-color);
  padding: var(--space-md);
  margin-block-end: var(--space-lg);

  & h2 {
    margin-block-start: 0;
    color: var(--form-invalid-color);
  }
}
```

---

## Degradation Table

| Layer | Validation UI | Message Content | Submit Path |
|---|---|---|---|
| 1 — HTML only | Browser native bubbles | Static `<output>` text | Native form submit |
| 2 — CSS added | `:user-valid`/`:user-invalid` colours + static message | Static `<output>` text | Native form submit |
| 3 — HTML enhanced | Same as Layer 2 | `data-message-*` authored but inert | Native form submit |
| 4 — JS + component | Dynamic `<output>` messages, error summary, `aria-invalid` | `data-message-*` read dynamically | Fetch with loading/success states |

---

## Server Error Response Contract

For Layer 4 async handling, the server must return a predictable shape on `4xx` validation failure:

```json
HTTP 422 Unprocessable Entity
Content-Type: application/json

{
  "errors": {
    "email": "This email address is already registered",
    "name": "Name cannot contain special characters"
  }
}
```

Keys are the `name` attribute values of the form inputs. This mirrors the HTML5 validation model — the same field names, the same single-message-per-field convention.

---

## Accessibility Requirements

- [ ] Error summary receives focus on submit failure (`tabindex="-1"`, `.focus()`)
- [ ] Error summary uses `role="alert"` so screen readers announce it
- [ ] Each error in the summary is an `<a>` that moves focus to the offending input
- [ ] Invalid inputs have `aria-invalid="true"` (set by Layer 4, absent in Layers 1–3)
- [ ] `<output>` has `aria-live="polite"` — screen readers announce message changes
- [ ] `aria-describedby` links input to `<output>` at all layers
- [ ] Submit button is not `disabled` during loading (use `aria-disabled` + `pointer-events: none`) — disabled removes it from tab order

---

## Open Questions

1. **Character counter**: `<textarea maxlength>` — should `<form-field>` render a live character counter? This is a CSS-only near-miss (can show remaining count via custom property but not dynamic text). Layer 4 likely owns this. Candidate: `data-char-count` on `<form-field>`.

2. **Async field validation** (e.g. username availability): Pattern is `data-validate-url` on the input — `<form-field>` debounces `input` events and hits the endpoint. Sets `setCustomValidity()` on response. Needs a `data-pending` state distinct from invalid.

3. **Multi-step forms**: The error summary and submit coordination assume a single-page form. Multi-step forms (fieldset-per-step) need a step-level coordinator. Defer to a `<form-step>` element design.

4. **`novalidate` conflict**: What if the author has already set `novalidate` on the form (meaning they handle validation elsewhere)? The form enhancer should detect and skip those forms. Possible: only enhance `form:has(form-field):not([data-no-enhance])`.

5. **Network error message**: Currently hardcoded in CSS `content: attr(data-error-message, "…")`. Better to author it in HTML as a `<p data-form-error-network hidden>` slot, consistent with the success message slot pattern.
