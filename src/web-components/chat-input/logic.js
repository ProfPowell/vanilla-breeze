/**
 * chat-input: Form-associated chat input with auto-growing textarea
 *
 * Light DOM, FormAssociated web component. Reuses VB's textarea[data-grow]
 * auto-init for auto-resizing. Handles Enter to submit, Shift+Enter for
 * newline, Escape to clear.
 *
 * @attr {string} name - Form field name (default: "message")
 * @attr {number} maxlength - Character limit (default: 4000)
 * @attr {number} minlength - Minimum length to send (default: 1)
 * @attr {boolean} disabled - Disables input and controls
 * @attr {boolean} autofocus - Focus textarea on connect
 *
 * @example
 * <chat-input name="message">
 *   <textarea data-grow rows="1" data-max-rows="8"
 *             placeholder="Ask anything..."></textarea>
 *   <footer>
 *     <button type="submit" class="small" data-send aria-label="Send">
 *       <icon-wc name="send"></icon-wc>
 *     </button>
 *   </footer>
 * </chat-input>
 */

class ChatInput extends HTMLElement {
  static formAssociated = true;

  #internals;
  #textarea;
  #sendBtn;
  #debounceTimer;

  constructor() {
    super();
    this.#internals = this.attachInternals();
  }

  connectedCallback() {
    this.#textarea = this.querySelector(':scope > textarea, :scope textarea[data-grow]');
    this.#sendBtn = this.querySelector('[data-send]');

    if (!this.#textarea) return;

    // Bind events
    this.#textarea.addEventListener('keydown', this.#handleKeyDown);
    this.#textarea.addEventListener('input', this.#handleInput);

    if (this.#sendBtn) {
      this.#sendBtn.addEventListener('click', this.#handleSend);
    }

    // Sync initial form value
    this.#syncFormValue();
    this.#validate();

    // Autofocus
    if (this.hasAttribute('autofocus')) {
      requestAnimationFrame(() => this.#textarea.focus());
    }
  }

  disconnectedCallback() {
    if (this.#textarea) {
      this.#textarea.removeEventListener('keydown', this.#handleKeyDown);
      this.#textarea.removeEventListener('input', this.#handleInput);
    }
    if (this.#sendBtn) {
      this.#sendBtn.removeEventListener('click', this.#handleSend);
    }
    clearTimeout(this.#debounceTimer);
  }

  // --- Event handlers ---

  #handleKeyDown = (e) => {
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

  #handleSend = (e) => {
    e.preventDefault();
    this.#submit();
  };

  #submit() {
    const message = this.value.trim();
    const minlength = parseInt(this.getAttribute('minlength') ?? '1', 10) || 1;

    if (message.length < minlength) return;
    if (this.disabled) return;

    this.dispatchEvent(new CustomEvent('chat-input:send', {
      bubbles: true,
      detail: {
        message,
        from: null,
        model: null,
      },
    }));

    this.reset();
  }

  // --- Form integration ---

  #syncFormValue() {
    const val = this.value;
    if (val) {
      this.#internals.setFormValue(val);
    } else {
      this.#internals.setFormValue(null);
    }
  }

  #validate() {
    const val = this.value;
    const maxlength = parseInt(this.getAttribute('maxlength') ?? '4000', 10) || 4000;

    if (val.length > maxlength) {
      this.#internals.setValidity(
        { tooLong: true },
        `Message exceeds ${maxlength} characters`,
        this.#textarea,
      );
    } else {
      this.#internals.setValidity({});
    }
  }

  formResetCallback() {
    this.reset();
  }

  formStateRestoreCallback(state) {
    if (!state || !this.#textarea) return;
    this.#textarea.value = state;
    this.#syncFormValue();
    this.#validate();
  }

  // --- Public API ---

  get value() {
    return this.#textarea?.value ?? '';
  }

  set value(val) {
    if (!this.#textarea) return;
    this.#textarea.value = val;
    // Trigger resize if data-grow is present
    this.#textarea.dispatchEvent(new Event('input', { bubbles: true }));
    this.#syncFormValue();
    this.#validate();
  }

  get disabled() {
    return this.hasAttribute('disabled');
  }

  set disabled(val) {
    if (val) {
      this.setAttribute('disabled', '');
      if (this.#textarea) this.#textarea.disabled = true;
      if (this.#sendBtn) this.#sendBtn.disabled = true;
    } else {
      this.removeAttribute('disabled');
      if (this.#textarea) this.#textarea.disabled = false;
      if (this.#sendBtn) this.#sendBtn.disabled = false;
    }
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

  attributeChangedCallback(name, _oldValue, newValue) {
    if (name === 'disabled') {
      const isDisabled = newValue !== null;
      if (this.#textarea) this.#textarea.disabled = isDisabled;
      if (this.#sendBtn) this.#sendBtn.disabled = isDisabled;
    }
  }
}

customElements.define('chat-input', ChatInput);

export { ChatInput };
