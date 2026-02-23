## Revised Upgrade Plan

Having seen the actual implementation, my earlier design needs significant correction. Here's an honest assessment of what already exists and what actually needs to be built.

---

### What You Already Have (and Nailed)

You're further along than my generic design assumed, and in some ways your approach is *superior* to what I proposed:

**`:user-valid` / `:user-invalid` CSS-only validation** is the right call. No JS needed for the basic case — browsers handle interaction timing automatically. My `[data-dirty]` tracking was solving a problem you already solved better with a native pseudo-class.

**`<output>` for messages** is semantically more correct than the `<span class="vb-field-error">` I proposed. The `for` attribute, the native ARIA semantics, the `.hint` / `.error` class distinction — this is cleaner than what I wrote.

**`<form-field>` already exists** as a well-designed custom element with icon states, password toggle, OTP enhancement, and checkbox/radio variants. I shouldn't have designed `<vb-field>` from scratch.

**Progressive enhancement is real** — everything works without JS, JS only adds enhancements. That's the correct order.

---

### The Actual Gaps (Revised)

What `:user-valid`/`:user-invalid` genuinely can't handle:

1. **Custom error message text** — browsers show their own strings, you can't override declaratively
2. **Cross-field validation** — `match` and `min-field` require knowing another field's value
3. **Async validation** — server round-trips are inherently JS
4. **Error summary** — a linked list of all failures on submit, needed for long forms and WCAG
5. **Checkbox group min/max checked** — fieldset-level constraint doesn't exist natively
6. **Submit-time forced validation** — `:user-invalid` requires prior interaction; on form submit you need to force-show all errors

---

### The Right Upgrade: Layering ON `<form-field>`

The JS layer should respect what's already there rather than replace it.

```html
<!-- No changes to existing HTML authoring patterns -->
<!-- Just add data-message-* and data-match for the new capabilities -->

<form data-validate>

  <form-error-summary></form-error-summary>

  <form-field>
    <label for="username">Username</label>
    <input type="text" id="username" name="username"
      required minlength="3"
      data-message-required="Username is required"
      data-message-minlength="Must be at least 3 characters"
      data-validate-async="/api/check-username"
      aria-describedby="username-msg" />
    <output id="username-msg" class="hint" for="username">
      3–20 characters
    </output>
  </form-field>

  <form-field>
    <label for="password">Password</label>
    <input type="password" id="password" name="password"
      required minlength="8"
      data-message-required="Password is required"
      data-message-minlength="At least 8 characters"
      aria-describedby="password-msg" />
    <output id="password-msg" class="hint" for="password">
      At least 8 characters
    </output>
  </form-field>

  <form-field>
    <label for="confirm">Confirm Password</label>
    <input type="password" id="confirm" name="confirm"
      required
      data-match="password"
      data-message-match="Passwords do not match"
      aria-describedby="confirm-msg" />
    <output id="confirm-msg" for="confirm"></output>
  </form-field>

  <fieldset
    data-min-checked="1" data-max-checked="3"
    data-message-min-checked="Select at least one"
    data-message-max-checked="Select no more than 3">
    <legend>Interests</legend>
    <form-field data-type="checkbox">
      <label><input type="checkbox" name="interests" value="music"> Music</label>
    </form-field>
    <form-field data-type="checkbox">
      <label><input type="checkbox" name="interests" value="sport"> Sport</label>
    </form-field>
    <output id="interests-msg" for="interests" aria-live="polite"></output>
  </fieldset>

  <button type="submit">Create Account</button>
</form>
```

---

### `form-validator.js` (Respects Existing `<form-field>`)

```js
export class FormValidator {
  #form;
  #asyncTimers = new Map();

  constructor(form) {
    this.#form = form;
    this.#form.setAttribute('novalidate', '');
    this.#init();
  }

  #init() {
    // Field-level: only handle things CSS can't
    for (const field of this.#fields()) {
      // Custom messages override browser defaults on any validity change
      field.addEventListener('input', () => this.#applyCustomMessage(field));
      field.addEventListener('blur',  () => this.#applyCustomMessage(field));

      // Cross-field constraints need re-check when target changes
      if (field.dataset.match || field.dataset.minField || field.dataset.maxField) {
        field.addEventListener('blur', () => this.#checkCrossField(field));
      }

      // Async — only on blur to avoid hammering the server
      if (field.dataset.validateAsync) {
        field.addEventListener('blur', () => this.#runAsync(field));
      }
    }

    // Checkbox group constraints
    for (const fs of this.#form.querySelectorAll('fieldset[data-min-checked], fieldset[data-max-checked]')) {
      fs.addEventListener('change', () => this.#checkFieldset(fs));
    }

    this.#form.addEventListener('submit', async (e) => {
      e.preventDefault();
      this.#forceUserInvalid(); // expose all errors
      const valid = await this.#validateAll();
      if (valid) {
        this.#form.dispatchEvent(new CustomEvent('vb:submit', { bubbles: true, detail: new FormData(this.#form) }));
      } else {
        this.#form.querySelector('form-error-summary')?.update(this.#form);
        this.#form.querySelector('form-error-summary')?.focus();
      }
    });
  }

  // CSS handles display; we only need to set the right message text
  #applyCustomMessage(field) {
    field.setCustomValidity(''); // reset so native validity re-runs
    if (field.validity.valid) return;

    const d = field.dataset;
    const msg =
      (field.validity.valueMissing    && d.messageRequired)  ||
      (field.validity.typeMismatch    && d.messageType)      ||
      (field.validity.tooShort        && d.messageMinlength) ||
      (field.validity.tooLong         && d.messageMaxlength) ||
      (field.validity.rangeUnderflow  && d.messageMin)       ||
      (field.validity.rangeOverflow   && d.messageMax)       ||
      (field.validity.patternMismatch && d.messagePattern)   ||
      null;

    if (msg) field.setCustomValidity(msg);

    // Push message into associated <output>
    this.#updateOutput(field, msg ?? field.validationMessage);
  }

  #checkCrossField(field) {
    const d = field.dataset;
    field.setCustomValidity('');

    if (d.match) {
      const target = this.#form.querySelector(`#${d.match}, [name="${d.match}"]`);
      if (target && field.value !== target.value) {
        const msg = d.messageMatch ?? 'Values do not match';
        field.setCustomValidity(msg);
        this.#updateOutput(field, msg);
        return;
      }
    }

    if (d.minField) {
      const target = this.#form.querySelector(`#${d.minField}, [name="${d.minField}"]`);
      if (target && field.value && target.value && field.value < target.value) {
        const msg = d.messageMinField ?? 'Value is too early/low';
        field.setCustomValidity(msg);
        this.#updateOutput(field, msg);
        return;
      }
    }

    if (d.maxField) {
      const target = this.#form.querySelector(`#${d.maxField}, [name="${d.maxField}"]`);
      if (target && field.value && target.value && field.value > target.value) {
        const msg = d.messageMaxField ?? 'Value is too late/high';
        field.setCustomValidity(msg);
        this.#updateOutput(field, msg);
        return;
      }
    }

    field.setCustomValidity('');
    this.#updateOutput(field, '');
  }

  async #runAsync(field) {
    if (!field.validity.valid || !field.value) return;

    const debounce = parseInt(field.dataset.validateAsyncDebounce ?? 400);
    const key = field.name || field.id;
    clearTimeout(this.#asyncTimers.get(key));

    // Use <form-field>'s data-state for the spinner CSS hook
    field.closest('form-field')?.setAttribute('data-state', 'validating');

    return new Promise(resolve => {
      const timer = setTimeout(async () => {
        try {
          const res = await fetch(field.dataset.validateAsync, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: field.name, value: field.value })
          });
          const data = await res.json();
          if (!data.valid) {
            const msg = data.message ?? field.dataset.messageAsync ?? 'Already taken';
            field.setCustomValidity(msg);
            this.#updateOutput(field, msg);
          }
          resolve(data.valid);
        } catch {
          resolve(true); // fail open
        } finally {
          field.closest('form-field')?.removeAttribute('data-state');
        }
      }, debounce);

      this.#asyncTimers.set(key, timer);
    });
  }

  #checkFieldset(fieldset) {
    const boxes = [...fieldset.querySelectorAll('input[type="checkbox"]')];
    const count = boxes.filter(b => b.checked).length;
    const min = parseInt(fieldset.dataset.minChecked ?? 0);
    const max = parseInt(fieldset.dataset.maxChecked ?? Infinity);
    const output = fieldset.querySelector('output');

    let msg = null;
    if (count < min) msg = fieldset.dataset.messageMinChecked ?? `Select at least ${min}`;
    if (count > max) msg = fieldset.dataset.messageMaxChecked ?? `Select no more than ${max}`;

    if (output) output.textContent = msg ?? '';
    fieldset.dataset.invalid = msg ? '' : null;
    if (msg === null) delete fieldset.dataset.invalid;
    return !msg;
  }

  // Force all fields to show errors (for submit attempt)
  // Works by dispatching a synthetic blur — :user-invalid then activates
  #forceUserInvalid() {
    for (const field of this.#fields()) {
      // The cleanest approach: force the field dirty via checkValidity
      // then let CSS :user-invalid take over
      field.dispatchEvent(new Event('blur', { bubbles: true }));
    }
  }

  async #validateAll() {
    let valid = true;
    for (const field of this.#fields()) {
      this.#applyCustomMessage(field);
      this.#checkCrossField(field);
      if (!field.validity.valid) valid = false;
    }
    for (const fs of this.#form.querySelectorAll('fieldset[data-min-checked], fieldset[data-max-checked]')) {
      if (!this.#checkFieldset(fs)) valid = false;
    }
    // Await any pending async validations
    const asyncFields = this.#fields().filter(f => f.dataset.validateAsync && f.value);
    const asyncResults = await Promise.all(asyncFields.map(f => this.#runAsync(f)));
    if (asyncResults.some(r => r === false)) valid = false;
    return valid;
  }

  // Push message text into the field's associated <output>
  // Respects existing .hint / .error class distinction
  #updateOutput(field, message) {
    const outputId = field.getAttribute('aria-describedby')?.split(' ')
      .find(id => document.getElementById(id)?.tagName === 'OUTPUT');
    if (!outputId) return;
    const output = document.getElementById(outputId);
    if (!output) return;
    // Only replace if it's an .error output or has no class (validation message output)
    if (!output.classList.contains('hint')) {
      output.textContent = message;
    }
  }

  #fields() {
    return [...this.#form.querySelectorAll('input, select, textarea')]
      .filter(f => f.type !== 'submit' && f.type !== 'button' && f.type !== 'hidden');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  for (const form of document.querySelectorAll('form[data-validate]')) {
    new FormValidator(form);
  }
});
```

---

### `form-error-summary.js` (New Web Component)

```js
class FormErrorSummary extends HTMLElement {
  connectedCallback() {
    this.setAttribute('role', 'alert');
    this.setAttribute('aria-live', 'assertive');
    this.setAttribute('tabindex', '-1');
    this.hidden = true;
  }

  update(form) {
    const errors = [];

    for (const field of form.querySelectorAll('input, select, textarea')) {
      if (field.type === 'submit' || !field.validity || field.validity.valid) continue;
      errors.push({
        anchor: `#${field.id || field.name}`,
        label: field.labels?.[0]?.textContent?.trim() ?? field.name,
        message: field.validationMessage
      });
    }

    for (const fs of form.querySelectorAll('fieldset[data-invalid]')) {
      errors.push({
        anchor: `#${fs.id || ''}`,
        label: fs.querySelector('legend')?.textContent?.trim() ?? 'Group',
        message: fs.dataset.validationMessage ?? 'Invalid selection'
      });
    }

    this.hidden = errors.length === 0;
    if (!errors.length) return;

    this.innerHTML = `
      <p class="form-error-summary-heading">${this.getAttribute('heading') ?? 'Please fix these errors:'}</p>
      <ul>
        ${errors.map(e => `<li><a href="${e.anchor}">${e.label}: ${e.message}</a></li>`).join('')}
      </ul>
    `;
  }

  focus() { super.focus(); }
}

customElements.define('form-error-summary', FormErrorSummary);
```

---

### CSS additions to `form-field`

```css
/* Async validating state — hooks into existing form-field data-state pattern */
form-field[data-state="validating"] input {
  border-color: var(--color-warning, oklch(75% 0.15 80));
}

form-field[data-state="validating"]::after {
  content: '';
  position: absolute;
  inset-inline-end: var(--size-m);
  inset-block-start: 50%;
  width: 1rem;
  height: 1rem;
  border: 2px solid var(--color-warning, oklch(75% 0.15 80));
  border-top-color: transparent;
  border-radius: 50%;
  animation: vb-spin 0.6s linear infinite;
  translate: 0 -50%;
}

@keyframes vb-spin { to { rotate: 1turn; } }

/* Error summary */
form-error-summary {
  display: block;
  padding: var(--size-m);
  border: 2px solid var(--color-error);
  border-radius: var(--radius-m);
  background: oklch(from var(--color-error) l c h / 0.06);
  margin-block-end: var(--size-l);
}

form-error-summary:focus { outline: 3px solid var(--color-error); outline-offset: 2px; }
form-error-summary .form-error-summary-heading { font-weight: var(--font-weight-medium); margin: 0 0 var(--size-xs); }
form-error-summary ul { margin: 0; padding-inline-start: var(--size-m); }
form-error-summary a { color: var(--color-error); }

/* Fieldset group error state */
fieldset[data-invalid] { border-color: var(--color-error); }
fieldset output { font-size: var(--font-size-sm); color: var(--color-error); display: block; margin-block-start: var(--size-xs); }
```

---

### Revised Comparison

| Feature | What Exists | Gap | Solution |
|---|---|---|---|
| Basic validation states | ✅ CSS-only `:user-valid`/`:user-invalid` | — | Nothing needed |
| Validation timing | ✅ `:user-*` handles it natively | — | Nothing needed |
| Custom error text | ❌ Browser default strings | Need custom messages | `data-message-*` + `setCustomValidity` |
| Error in `<output>` | ✅ `.hint`/`.error` pattern | — | JS writes to existing `<output>` |
| Password show/hide | ✅ Auto-enhanced | — | Nothing needed |
| OTP/PIN | ✅ `data-type="otp"` | — | Nothing needed |
| Cross-field validation | ❌ | `data-match`, `data-min-field` | New in `FormValidator` |
| Async validation | ❌ | `data-validate-async` | New in `FormValidator` |
| Async spinner | ❌ | `data-state="validating"` | Hooks into existing `form-field` |
| Error summary | ❌ | `<form-error-summary>` | New web component |
| Checkbox group limits | ❌ | `data-min-checked` on fieldset | New in `FormValidator` |
| Submit-time forced errors | ❌ | Force blur events on all fields | `#forceUserInvalid()` |

The fundamental shift from my first design: **the CSS layer owns basic validation display, JS only handles what CSS structurally cannot.** The `<form-field>` element is already right — don't rebuild it, extend it.


Note from Me:  I am not sure we need a <form-error-summary> component.  We could use a native component of come sort or do details or some other structure even an <output> for the whole form itself?  As we plan the upgrade of the Vanilla Breeze form validation story consider my thoughts.  Use what we have versus make new ideas unless we must do so.