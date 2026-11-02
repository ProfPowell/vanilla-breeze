import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

/**
 * chat-input: Form-associated chat input with auto-growing textarea
 *
 * Light DOM, FormAssociated web component. Reuses VB's textarea[data-grow]
 * auto-init for auto-resizing. Handles Enter to send, Shift+Enter for
 * newline, Escape to clear. Enter is ignored while an IME composition is
 * active so CJK and other composed input never sends mid-word.
 *
 * Two send paths:
 * - Inside a <form>: Enter and the [data-send] button submit the form
 *   (requestSubmit, so constraint validation and the submit event run).
 *   The value travels in FormData under the host's `name`. The input clears
 *   after the submit event unless a listener called preventDefault() —
 *   then the page owns the outcome (call form.reset() or .reset()).
 * - Standalone: dispatches `chat-input:send` and clears.
 *
 * Accessible name: label the textarea (aria-label, aria-labelledby or a
 * <label>). When it has none, chat-input sets aria-label="Message".
 *
 * @attr {string} name - Form field name (required for FormData; no default)
 * @attr {number} maxlength - Character limit (default: 4000); blocks sending when exceeded
 * @attr {number} minlength - Minimum trimmed length to send (default: 1)
 * @attr {boolean} disabled - Disables input and controls
 * @attr {boolean} autofocus - Focus textarea on connect
 *
 * @fires chat-input:send - Standalone send. detail: { message }
 * @fires chat-input:input - Debounced keystroke. detail: { value, length }
 * @fires chat-input:change - Value set via the property. detail: { value, source: 'api' }
 *
 * @example
 * <chat-input name="message">
 *   <textarea data-grow rows="1" data-max-rows="8" aria-label="Message"
 *             placeholder="Ask anything..."></textarea>
 *   <footer>
 *     <button type="submit" class="small" data-send aria-label="Send">
 *       <icon-wc name="send"></icon-wc>
 *     </button>
 *   </footer>
 * </chat-input>
 */

class ChatInput extends VBElement {
  static formAssociated = true;

  #internals;
  /** @type {HTMLTextAreaElement | null} */
  #textarea = null;
  /** @type {HTMLButtonElement | null} */
  #sendBtn = null;
  #debounceTimer;
  /** Disabled by an ancestor <fieldset disabled> (formDisabledCallback). */
  #formDisabled = false;

  constructor() {
    super();
    this.#internals = this.attachInternals();
    this._adoptInternals(this.#internals);
  }

  setup() {
    this.#textarea = this.querySelector(':scope > textarea, :scope textarea[data-grow]');
    this.#sendBtn = this.querySelector('[data-send]');

    if (!this.#textarea) return false;

    this.#ensureLabel();

    // Bind events
    this.listen(this.#textarea, 'keydown', this.#handleKeyDown);
    this.listen(this.#textarea, 'input', this.#handleInput);

    if (this.#sendBtn) {
      this.listen(this.#sendBtn, 'click', this.#handleSend);
    }

    if (this.form) {
      this.listen(this.form, 'submit', this.#handleFormSubmit);
    }

    // attributeChangedCallback for a parse-time `disabled` runs before
    // setup() has found the children — sync now.
    this.#syncDisabled();

    // Sync initial form value
    this.#syncFormValue();
    this.#validate();

    // Autofocus
    if (this.hasAttribute('autofocus')) {
      requestAnimationFrame(() => this.#textarea?.focus());
    }
    return true;
  }

  teardown() {
    clearTimeout(this.#debounceTimer);
  }

  /** Fallback accessible name when the author supplied none. */
  #ensureLabel() {
    const ta = this.#textarea;
    if (!ta) return;
    if (ta.hasAttribute('aria-label') || ta.hasAttribute('aria-labelledby')) return;
    if (ta.labels && ta.labels.length) return;
    if (ta.hasAttribute('title')) return;
    ta.setAttribute('aria-label', 'Message');
  }

  // --- Event handlers ---

  /** @param {KeyboardEvent} e */
  #handleKeyDown = (e) => {
    // IME composition: Enter/Escape commit or cancel the composition.
    if (e.isComposing || e.keyCode === 229) return;

    switch (e.key) {
      case 'Enter':
        if (!e.shiftKey) {
          e.preventDefault();
          this.#submit();
        }
        break;
      case 'Escape':
        e.preventDefault();
        this.reset();
        break;
    }
  };

  #handleInput = () => {
    this.#syncFormValue();
    this.#validate();

    // Debounced input event
    clearTimeout(this.#debounceTimer);
    this.#debounceTimer = setTimeout(() => {
      this.dispatchEvent(new CustomEvent('chat-input:input', {
        bubbles: true,
        detail: {
          value: this.value,
          length: this.value.length,
        },
      }));
    }, 100);
  };

  /** @param {MouseEvent} e */
  #handleSend = (e) => {
    const btn = this.#sendBtn;
    // A native submit button inside this element's form submits on its own
    // (with interactive validation); only intervene when sending is blocked.
    const nativeSubmit = !!this.form && btn?.type === 'submit' && btn.form === this.form;
    if (nativeSubmit && this.#canSend()) return;
    e.preventDefault();
    this.#submit();
  };

  /** @param {SubmitEvent} e */
  #handleFormSubmit = (e) => {
    // Runs after every submit listener and after the entry list is built,
    // so FormData built in a submit handler still sees the message.
    setTimeout(() => {
      if (!e.defaultPrevented) this.reset();
    }, 0);
  };

  /** Length, disabled and validity gate shared by both send paths. */
  #canSend({ report = false } = {}) {
    if (this.matches(':disabled')) return false;
    const message = this.value.trim();
    const minlength = parseInt(this.getAttribute('minlength') ?? '1', 10) || 1;
    if (message.length < minlength) return false;
    if (!this.#internals.validity.valid) {
      if (report) this.#internals.reportValidity();
      return false;
    }
    return true;
  }

  #submit() {
    if (!this.#canSend({ report: true })) return;

    const form = this.form;
    if (form) {
      const btn = this.#sendBtn;
      const submitter = btn?.type === 'submit' && btn.form === form ? btn : null;
      form.requestSubmit(submitter);
      return;
    }

    this.dispatchEvent(new CustomEvent('chat-input:send', {
      bubbles: true,
      detail: { message: this.value.trim() },
    }));

    this.reset();
  }

  // --- Form integration ---

  #syncFormValue() {
    const val = this.value;
    this.#internals.setFormValue(val || null);
  }

  #validate() {
    const val = this.value;
    const maxlength = parseInt(this.getAttribute('maxlength') ?? '4000', 10) || 4000;

    if (val.length > maxlength && this.#textarea) {
      this.#internals.setValidity(
        { tooLong: true },
        `Message exceeds ${maxlength} characters`,
        this.#textarea,
      );
    } else {
      this.#internals.setValidity({});
    }
  }

  #syncDisabled() {
    const off = this.hasAttribute('disabled') || this.#formDisabled;
    if (this.#textarea) this.#textarea.disabled = off;
    if (this.#sendBtn) this.#sendBtn.disabled = off;
  }

  /** @param {boolean} disabled */
  formDisabledCallback(disabled) {
    this.#formDisabled = disabled;
    this.#syncDisabled();
  }

  formResetCallback() {
    this.reset();
  }

  /** @param {string | null} state */
  formStateRestoreCallback(state) {
    if (!state || !this.#textarea) return;
    this.#textarea.value = state;
    this.#syncFormValue();
    this.#validate();
  }

  // --- Public API ---

  /** @returns {HTMLFormElement | null} The associated form, if any. */
  get form() {
    return this.#internals.form;
  }

  get name() {
    return this.getAttribute('name') ?? '';
  }

  get validity() {
    return this.#internals.validity;
  }

  get validationMessage() {
    return this.#internals.validationMessage;
  }

  checkValidity() {
    return this.#internals.checkValidity();
  }

  reportValidity() {
    return this.#internals.reportValidity();
  }

  get value() {
    return this.#textarea?.value ?? '';
  }

  /**
   * Set the input value. Idempotent — assigning the current value is a
   * no-op (no event re-fire, no resize thrash). Emits chat-input:change
   * with `source: 'api'` so reactive consumers can filter their own
   * assignments out of the event stream.
   */
  set value(val) {
    if (!this.#textarea) return;
    const next = val == null ? '' : String(val);
    if (this.#textarea.value === next) return;
    this.#textarea.value = next;
    // Trigger resize if data-grow is present
    this.#textarea.dispatchEvent(new Event('input', { bubbles: true }));
    this.#syncFormValue();
    this.#validate();
    this.dispatchEvent(new CustomEvent('chat-input:change', {
      bubbles: true,
      detail: { value: next, source: 'api' },
    }));
  }

  get disabled() {
    return this.hasAttribute('disabled');
  }

  set disabled(val) {
    this.toggleAttribute('disabled', !!val);
  }

  focus() {
    this.#textarea?.focus();
  }

  reset() {
    if (!this.#textarea) return;
    this.#textarea.value = '';
    // Trigger resize for data-grow
    this.#textarea.dispatchEvent(new Event('input', { bubbles: true }));
    this.#syncFormValue();
    this.#validate();
  }

  static get observedAttributes() {
    return ['disabled'];
  }

  attributeChangedCallback(name) {
    if (name === 'disabled') this.#syncDisabled();
  }
}

registerComponent('chat-input', ChatInput);

export { ChatInput };
