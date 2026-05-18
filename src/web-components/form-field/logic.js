/**
 * FormField — Accessible form field web component
 *
 * Owns field-level validation timing (blur-first, then eager re-validate
 * after first error) and exposes a public API for the form coordinator.
 *
 * Markup pattern:
 *   <form-field>
 *     <label for="name">Name</label>
 *     <input id="name" required
 *            aria-describedby="name-msg"
 *            data-message-valuemissing="Please enter your name" />
 *     <output id="name-msg" class="error" for="name" aria-live="polite"></output>
 *   </form-field>
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

// ValidityState keys in priority order
const VALIDITY_KEYS = [
  'valueMissing',
  'typeMismatch',
  'patternMismatch',
  'tooShort',
  'tooLong',
  'rangeUnderflow',
  'rangeOverflow',
  'stepMismatch',
  'customError',
];

class FormField extends VBElement {
  /** @type {HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null} */
  #input = null;
  /** @type {HTMLOutputElement | null} */
  #output = null;
  #hasBeenInvalid = false;

  setup() {
    this.#input = this.querySelector('input, textarea, select');
    // Target the error output — prefer output.error, fall back to first non-hint output
    this.#output = /** @type {HTMLOutputElement | null} */ (
      this.querySelector('output.error') ?? this.querySelector('output:not(.hint)')
    );

    if (!this.#input) return false;

    this.listen(this.#input, 'blur', () => this.validate());
    this.listen(this.#input, 'input', () => {
      // Only re-validate eagerly after the first error has been shown
      if (this.#hasBeenInvalid) this.validate();
    });
    return true;
  }

  teardown() {
    this.#input = null;
    this.#output = null;
    this.#hasBeenInvalid = false;
  }

  /**
   * Validate the controlled input and update visual state.
   * @returns {boolean} Whether the field is valid
   */
  validate() {
    const input = this.#input;
    if (!input) return true;

    // Reset custom validity so native checks re-run
    // (only if not set by setError — check for customError flag)
    if (!input.validity.customError) {
      input.setCustomValidity('');
    }

    const valid = input.checkValidity();

    if (valid) {
      // Only show positive "valid" state if the field has a value —
      // empty optional fields are neutral (no checkmark, no error)
      this.#setState(input.value ? 'valid' : null);
      input.removeAttribute('aria-invalid');
      if (this.#output) this.#output.textContent = '';
    } else {
      this.#hasBeenInvalid = true;
      this.#setState('invalid');
      input.setAttribute('aria-invalid', 'true');
      this.#updateMessage(input.validity);
    }

    return valid;
  }

  /**
   * Set a programmatic error (e.g. from server validation).
   * @param {string} message - The error message to display
   */
  setError(message) {
    if (!this.#input) return;
    this.#input.setCustomValidity(message);
    this.#hasBeenInvalid = true;
    this.#setState('invalid');
    this.#input.setAttribute('aria-invalid', 'true');
    if (this.#output) this.#output.textContent = message;
  }

  /** Clear a programmatic error and reset state. */
  clearError() {
    if (!this.#input) return;
    this.#input.setCustomValidity('');
    this.#setState(null);
    this.#input.removeAttribute('aria-invalid');
    this.#hasBeenInvalid = false;
    if (this.#output) this.#output.textContent = '';
  }

  /** Human-readable field name for error summaries. */
  get fieldName() {
    return this.querySelector('label')?.textContent?.trim()
      ?? this.#input?.getAttribute('aria-label')
      ?? this.#input?.name
      ?? this.#input?.id
      ?? 'Field';
  }

  /** The controlled input element. */
  get input() {
    return this.#input;
  }

  #setState(state) {
    delete this.dataset.valid;
    delete this.dataset.invalid;
    if (state) this.dataset[state] = '';
  }

  #updateMessage(validity) {
    if (!this.#output) return;
    const input = this.#input;
    if (!input || !this.#output) return;

    for (const key of VALIDITY_KEYS) {
      if (!validity[key]) continue;
      // data-message-valuemissing, data-message-typemismatch, etc.
      const attr = `data-message-${key.toLowerCase()}`;
      const msg = input.getAttribute(attr) ?? input.validationMessage;
      this.#output.textContent = msg;
      return;
    }
  }
}

registerComponent('form-field', FormField);

export { FormField };
