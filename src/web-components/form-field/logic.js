/**
 * FormField — Accessible form field web component
 *
 * Owns field-level validation timing (validate when focus leaves the field,
 * then eagerly re-validate on every edit once an error has been shown) and
 * exposes a public API for the form coordinator.
 *
 * Markup pattern:
 *   <form-field>
 *     <label for="name">Name</label>
 *     <input id="name" required
 *            data-message-valuemissing="Please enter your name" />
 *     <output class="hint" for="name">As it appears on your ID.</output>
 *     <output class="error" for="name" aria-live="polite"></output>
 *   </form-field>
 *
 * The bound control is the first form-associated custom element inside the
 * field (date-picker, star-rating, combo-box …) or, failing that, the first
 * native input / textarea / select. Radio controls bind their whole group
 * (every radio sharing the name in the same form).
 *
 * ARIA wiring done here: aria-describedby on the control lists the hint
 * output(s) and the textarea counter, then the error output while the field
 * is invalid (author ids are kept); aria-invalid mirrors the state. Ids are
 * generated for outputs that lack one. aria-errormessage is not used —
 * screen-reader support is still too uneven to rely on.
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

// ValidityState keys in priority order
const VALIDITY_KEYS = [
  'valueMissing',
  'badInput',
  'typeMismatch',
  'patternMismatch',
  'tooShort',
  'tooLong',
  'rangeUnderflow',
  'rangeOverflow',
  'stepMismatch',
  'customError',
];

const NATIVE_CONTROL = 'input:not([type="hidden"]):not(.otp-digit), textarea, select';
const DESCRIPTION_OUTPUTS = 'output.hint, output.textarea-counter';
const DEFAULT_MESSAGE = 'Please check this field.';

let fieldSeq = 0;

/** @param {Element} el */
function isFormAssociated(el) {
  if (!el.localName.includes('-')) return false;
  const ctor = /** @type {any} */ (customElements.get(el.localName));
  return Boolean(ctor?.formAssociated);
}

/** @param {Element} el */
function isNative(el) {
  return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement;
}

class FormField extends VBElement {
  /** The bound control: a native input/textarea/select or a form-associated custom element.
   *  @type {any} */
  #control = null;
  /** Every radio in the bound control's group (empty for non-radios).
   *  @type {HTMLInputElement[]} */
  #radios = [];
  /** @type {HTMLOutputElement | null} */
  #output = null;
  /** Survives reconnects, like data-invalid / aria-invalid do. */
  #hasBeenInvalid = false;
  /** Message set by setError() — the only custom validity this field clears. */
  #customMessage = '';
  /** Text authored inside the error output (the no-JS message). Captured once.
   *  @type {string | undefined} */
  #authoredError;
  #uid = `ff-${++fieldSeq}`;

  setup() {
    this.#watchUndefinedChildren();

    this.#control = this.#findControl();
    // Target the error output — prefer output.error, fall back to the first
    // output that is neither a hint nor the textarea counter.
    this.#output = /** @type {HTMLOutputElement | null} */ (
      this.querySelector('output.error')
        ?? this.querySelector('output:not(.hint):not(.textarea-counter)')
    );

    if (!this.#control) return false;

    // The authored error text is the no-JS message. With JS it becomes the
    // fallback message and the output stays empty until the field is invalid,
    // so a collapsed output never announces a stale error.
    if (this.#output && this.#authoredError === undefined) {
      this.#authoredError = this.#output.textContent?.trim() ?? '';
      if (!this.hasAttribute('data-invalid')) this.#output.textContent = '';
    }

    const control = this.#control;
    this.#radios = [];
    if (control instanceof HTMLInputElement && control.type === 'radio') {
      this.#radios = this.#radioGroup(control);
    }

    const sources = this.#radios.length ? this.#radios : [control];
    for (const source of sources) {
      this.listen(source, 'input', this.#onEdit);
      this.listen(source, 'change', this.#onEdit);
      this.listen(source, 'invalid', this.#onInvalid);
    }
    if (!isNative(control)) {
      this.listen(control, `${control.localName}:change`, this.#onEdit);
    }

    // Validate when focus leaves the field (not when it moves between the
    // field's own parts: password toggle, OTP digits, combobox popup …).
    this.listen(this, 'focusout', (e) => {
      const next = /** @type {FocusEvent} */ (e).relatedTarget;
      if (next instanceof Node && this.contains(next)) return;
      this.validate();
    });

    // A form reset returns the field to neutral: without this an emptied
    // field kept data-valid (the green tick) or a stale error. The reset
    // event fires before the values change and can still be cancelled, so
    // act after the dispatch.
    const form = /** @type {any} */ (control).form ?? this.closest('form');
    if (form instanceof HTMLFormElement) {
      this.listen(form, 'reset', (e) => {
        setTimeout(() => { if (!e.defaultPrevented && this.isConnected) this.clearError(); });
      });
    }

    this.#syncAria(this.hasAttribute('data-invalid'));
    return true;
  }

  teardown() {
    // #hasBeenInvalid, data-invalid and aria-invalid all survive a move:
    // the field keeps its state and stays in eager re-validation mode.
    this.#control = null;
    this.#radios = [];
    this.#output = null;
  }

  /**
   * Validate the bound control and update visual + ARIA state.
   * Shows the error immediately (no blur needed) — this is what the form
   * coordinator calls on submit.
   * @param {{ show?: boolean }} [options] - show: false checks silently without touching the UI
   * @returns {boolean} Whether the field is valid
   */
  validate({ show = true } = {}) {
    if (!this.#control) return true;
    const { valid, message } = this.#evaluate();
    if (!show) return valid;

    if (valid) {
      // Only show a positive "valid" state if the field has a value —
      // empty optional fields are neutral (no checkmark, no error).
      this.#setState(this.#hasValue() ? 'valid' : null);
      this.#setMessage('');
    } else {
      this.#hasBeenInvalid = true;
      this.#setState('invalid');
      this.#setMessage(message);
    }
    this.#syncAria(!valid);
    return valid;
  }

  /**
   * Set a programmatic error (e.g. from server validation). The message is
   * also set as the native control's custom validity, so the form will not
   * submit; it is cleared on the user's next edit (or by clearError()).
   * @param {string} message - The error message to display
   */
  setError(message) {
    if (!this.#control) return;
    this.#customMessage = message;
    const native = this.#nativeTarget();
    if (native) native.setCustomValidity(message);
    this.validate();
  }

  /** Clear a programmatic error and reset the field to neutral. */
  clearError() {
    if (!this.#control) return;
    this.#clearOwnError();
    this.#hasBeenInvalid = false;
    this.#setState(null);
    this.#setMessage('');
    this.#syncAria(false);
  }

  /**
   * Human-readable field name for error summaries.
   *
   * @returns {string} The field's label text, or a fallback.
   */
  get fieldName() {
    const text = this.querySelector('label, legend')?.textContent?.trim();
    return text
      || this.#control?.getAttribute?.('aria-label')
      || this.#control?.getAttribute?.('name')
      || this.#control?.id
      || 'Field';
  }

  /**
   * The bound control: the native input/textarea/select, or the
   * form-associated custom element (date-picker, star-rating, combo-box …).
   *
   * @returns {HTMLElement|null} The bound control, or null before upgrade.
   */
  get input() {
    return this.#control;
  }

  // ── internals ─────────────────────────────────────────────────────

  #onEdit = () => {
    // A server/programmatic error only describes the value it was set for.
    if (this.#customMessage) this.#clearOwnError();
    if (this.#hasBeenInvalid) this.validate();
  };

  #validating = false;
  #onInvalid = () => {
    // Native submit (or anyone calling checkValidity) found the control
    // invalid: show the field's own error too.
    if (this.#validating) return;
    this.#validating = true;
    try { this.validate(); } finally { this.#validating = false; }
  };

  #findControl() {
    for (const el of this.querySelectorAll('*')) {
      if (isFormAssociated(el)) return el;
    }
    return this.querySelector(NATIVE_CONTROL);
  }

  /** Custom elements that upgrade after this field may be its real control. */
  #watchUndefinedChildren() {
    for (const el of this.querySelectorAll(':not(:defined)')) {
      if (!el.localName.includes('-')) continue;
      customElements.whenDefined(el.localName).then(() => {
        if (!this.isConnected || !this.contains(el) || this.#control === el) return;
        if (isFormAssociated(el)) this._reinit();
      });
    }
  }

  /** @param {HTMLInputElement} radio */
  #radioGroup(radio) {
    if (!radio.name) return [radio];
    const pool = radio.form
      ? [...radio.form.elements]
      : [.../** @type {Document | ShadowRoot} */ (radio.getRootNode()).querySelectorAll('input[type="radio"]')]
        .filter(r => !(/** @type {HTMLInputElement} */ (r)).form);
    return /** @type {HTMLInputElement[]} */ (pool.filter(el =>
      el instanceof HTMLInputElement && el.type === 'radio' && el.name === radio.name));
  }

  /** The native element whose custom validity setError() may own. */
  #nativeTarget() {
    const c = this.#control;
    return c && isNative(c) ? c : null;
  }

  #clearOwnError() {
    const native = this.#nativeTarget();
    // Only clear a custom error this field set — a sibling script's
    // (data-match, date-picker's mirror …) is left alone.
    if (native && native.validity.customError && native.validationMessage === this.#customMessage) {
      native.setCustomValidity('');
    }
    this.#customMessage = '';
  }

  #evaluate() {
    const c = this.#control;
    if (this.#customMessage) return { valid: false, message: this.#customMessage };

    /** @type {ValidityState | undefined} */
    const validity = c.validity;
    if (validity) {
      return validity.valid
        ? { valid: true, message: '' }
        : { valid: false, message: this.#messageFor(validity) };
    }
    // Form-associated element without a public validity getter: its
    // ElementInternals validity still drives :invalid.
    const invalid = c.matches(':invalid');
    return { valid: !invalid, message: invalid ? this.#messageFor(null) : '' };
  }

  /**
   * data-message-<key> (on the control, or the field for custom elements) →
   * the control's own message for custom errors / custom elements → the
   * authored output text → the browser's validationMessage.
   * @param {ValidityState | null} validity
   */
  #messageFor(validity) {
    const c = this.#control;
    const native = isNative(c);
    const attr = (key) => c.getAttribute(`data-message-${key.toLowerCase()}`)
      ?? (native ? null : this.getAttribute(`data-message-${key.toLowerCase()}`));

    if (validity) {
      for (const key of VALIDITY_KEYS) {
        if (!validity[key]) continue;
        const custom = attr(key);
        if (custom) return custom;
        if ((key === 'customError' || !native) && c.validationMessage) return c.validationMessage;
        break;
      }
    } else if (!this.#hasValue()) {
      const custom = attr('valueMissing');
      if (custom) return custom;
    }
    return this.#authoredError
      || c.validationMessage
      || this.getAttribute('data-message-invalid')
      || DEFAULT_MESSAGE;
  }

  #hasValue() {
    const c = this.#control;
    if (this.#radios.length) return this.#radios.some(r => r.checked);
    if (c instanceof HTMLInputElement && c.type === 'checkbox') return c.checked;
    const value = c.value;
    if (Array.isArray(value)) return value.length > 0;
    // Custom elements with a numeric value (star-rating) use 0 for "none".
    if (!isNative(c) && value === 0) return false;
    return value != null && String(value) !== '';
  }

  /** Elements that carry aria-describedby / aria-invalid for the control. */
  #ariaTargets() {
    const c = this.#control;
    const group = this.querySelector('.otp-wrapper[role="group"]');
    if (group) return [group];
    if (this.#radios.length) return this.#radios.filter(r => this.contains(r));
    if (!isNative(c)) {
      const inner = c.querySelector('[role="combobox"], fieldset, input:not([type="hidden"]):not([aria-hidden="true"]), textarea, select');
      return [inner ?? c];
    }
    return [c];
  }

  /** @param {boolean} invalid */
  #syncAria(invalid) {
    const hints = [...this.querySelectorAll(DESCRIPTION_OUTPUTS)];
    hints.forEach((el, i) => { if (!el.id) el.id = `${this.#uid}-hint${i ? `-${i}` : ''}`; });
    const error = this.#output;
    if (error && !error.id) error.id = `${this.#uid}-error`;

    const managed = new Set([...hints.map(h => h.id), ...(error ? [error.id] : [])]);
    const ours = [...hints.map(h => h.id), ...(invalid && error ? [error.id] : [])];

    for (const target of this.#ariaTargets()) {
      const authored = (target.getAttribute('aria-describedby') ?? '')
        .split(/\s+/).filter(id => id && !managed.has(id));
      const ids = [...new Set([...authored, ...ours])];
      if (ids.length) target.setAttribute('aria-describedby', ids.join(' '));
      else target.removeAttribute('aria-describedby');

      if (invalid) target.setAttribute('aria-invalid', 'true');
      else target.removeAttribute('aria-invalid');
    }
  }

  #setState(state) {
    delete this.dataset.valid;
    delete this.dataset.invalid;
    if (state) this.dataset[state] = '';
  }

  /** @param {string} message */
  #setMessage(message) {
    if (this.#output) this.#output.textContent = message;
  }
}

registerComponent('form-field', FormField);

export { FormField };
