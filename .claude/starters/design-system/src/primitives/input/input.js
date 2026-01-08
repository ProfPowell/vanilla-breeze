/**
 * Input Component
 * A text input with label, validation, and error states
 *
 * @element {{COMPONENT_PREFIX}}-input
 * @attr {string} label - Input label text
 * @attr {string} type - Input type: text, email, password, number, tel, url
 * @attr {string} name - Input name for forms
 * @attr {string} value - Input value
 * @attr {string} placeholder - Placeholder text
 * @attr {string} hint - Helper text below input
 * @attr {string} error - Error message (shows error state)
 * @attr {boolean} required - Makes input required
 * @attr {boolean} disabled - Disables the input
 * @attr {boolean} readonly - Makes input readonly
 *
 * @csspart label - The label element
 * @csspart input - The native input element
 * @csspart hint - The hint/error message
 *
 * @fires input - When value changes
 * @fires change - When value is committed
 */

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      display: block;
    }

    :host([hidden]) {
      display: none;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: var(--{{COMPONENT_PREFIX}}-space-1);
    }

    label {
      display: block;
      font-size: var(--{{COMPONENT_PREFIX}}-font-size-sm);
      font-weight: var(--{{COMPONENT_PREFIX}}-font-weight-medium);
      color: var(--{{COMPONENT_PREFIX}}-color-text);
    }

    .required-marker {
      color: var(--{{COMPONENT_PREFIX}}-color-error);
      margin-inline-start: var(--{{COMPONENT_PREFIX}}-space-1);
    }

    input {
      width: 100%;
      padding: var(--{{COMPONENT_PREFIX}}-space-2) var(--{{COMPONENT_PREFIX}}-space-3);
      font-family: var(--{{COMPONENT_PREFIX}}-font-sans);
      font-size: var(--{{COMPONENT_PREFIX}}-font-size-base);
      line-height: var(--{{COMPONENT_PREFIX}}-line-height-normal);
      color: var(--{{COMPONENT_PREFIX}}-color-text);
      background-color: var(--{{COMPONENT_PREFIX}}-color-surface);
      border: 1px solid var(--{{COMPONENT_PREFIX}}-color-border);
      border-radius: var(--{{COMPONENT_PREFIX}}-radius-md);
      transition: var(--{{COMPONENT_PREFIX}}-transition-all);
    }

    input::placeholder {
      color: var(--{{COMPONENT_PREFIX}}-color-text-subtle);
    }

    input:hover:not(:disabled) {
      border-color: var(--{{COMPONENT_PREFIX}}-color-border-strong);
    }

    input:focus {
      outline: none;
      border-color: var(--{{COMPONENT_PREFIX}}-color-border-focus);
      box-shadow: var(--{{COMPONENT_PREFIX}}-focus-ring);
    }

    input:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      background-color: var(--{{COMPONENT_PREFIX}}-color-gray-100);
    }

    /* Error state */
    :host([error]) input {
      border-color: var(--{{COMPONENT_PREFIX}}-color-error);
    }

    :host([error]) input:focus {
      box-shadow: 0 0 0 var(--{{COMPONENT_PREFIX}}-focus-ring-offset) var(--{{COMPONENT_PREFIX}}-color-background),
                  0 0 0 calc(var(--{{COMPONENT_PREFIX}}-focus-ring-offset) + var(--{{COMPONENT_PREFIX}}-focus-ring-width)) var(--{{COMPONENT_PREFIX}}-color-error);
    }

    :host([error]) label {
      color: var(--{{COMPONENT_PREFIX}}-color-error);
    }

    .hint {
      font-size: var(--{{COMPONENT_PREFIX}}-font-size-sm);
      color: var(--{{COMPONENT_PREFIX}}-color-text-muted);
    }

    :host([error]) .hint {
      color: var(--{{COMPONENT_PREFIX}}-color-error);
    }

    /* Sizes */
    :host([size="sm"]) input {
      padding: var(--{{COMPONENT_PREFIX}}-space-1) var(--{{COMPONENT_PREFIX}}-space-2);
      font-size: var(--{{COMPONENT_PREFIX}}-font-size-sm);
    }

    :host([size="lg"]) input {
      padding: var(--{{COMPONENT_PREFIX}}-space-3) var(--{{COMPONENT_PREFIX}}-space-4);
      font-size: var(--{{COMPONENT_PREFIX}}-font-size-lg);
    }
  </style>

  <div class="field">
    <label part="label">
      <span class="label-text"></span>
      <span class="required-marker" aria-hidden="true" hidden>*</span>
    </label>
    <input part="input" />
    <span class="hint" part="hint" hidden></span>
  </div>
`;

class DsInput extends HTMLElement {
  static get observedAttributes() {
    return ['label', 'type', 'name', 'value', 'placeholder', 'hint', 'error', 'required', 'disabled', 'readonly'];
  }

  static formAssociated = true;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this._input = this.shadowRoot.querySelector('input');
    this._label = this.shadowRoot.querySelector('label');
    this._labelText = this.shadowRoot.querySelector('.label-text');
    this._requiredMarker = this.shadowRoot.querySelector('.required-marker');
    this._hint = this.shadowRoot.querySelector('.hint');

    this._internals = this.attachInternals?.();

    // Event forwarding
    this._input.addEventListener('input', (e) => {
      this._internals?.setFormValue(this._input.value);
      this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    });

    this._input.addEventListener('change', (e) => {
      this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    });
  }

  connectedCallback() {
    // Generate unique ID if not set
    if (!this._input.id) {
      this._input.id = `input-${Math.random().toString(36).substring(2, 9)}`;
    }
    this._label.setAttribute('for', this._input.id);
    this._updateFromAttributes();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    this._updateFromAttributes();
  }

  _updateFromAttributes() {
    // Label
    const label = this.getAttribute('label');
    if (label) {
      this._labelText.textContent = label;
      this._label.hidden = false;
    } else {
      this._label.hidden = true;
    }

    // Input attributes
    this._input.type = this.getAttribute('type') || 'text';
    this._input.name = this.getAttribute('name') || '';
    this._input.value = this.getAttribute('value') || '';
    this._input.placeholder = this.getAttribute('placeholder') || '';
    this._input.disabled = this.hasAttribute('disabled');
    this._input.readOnly = this.hasAttribute('readonly');
    this._input.required = this.hasAttribute('required');

    // Required marker
    this._requiredMarker.hidden = !this.hasAttribute('required');

    // Hint/error
    const error = this.getAttribute('error');
    const hint = this.getAttribute('hint');

    if (error) {
      this._hint.textContent = error;
      this._hint.hidden = false;
      this._input.setAttribute('aria-invalid', 'true');
      this._input.setAttribute('aria-describedby', this._hint.id || (this._hint.id = `hint-${this._input.id}`));
    } else if (hint) {
      this._hint.textContent = hint;
      this._hint.hidden = false;
      this._input.removeAttribute('aria-invalid');
      this._input.setAttribute('aria-describedby', this._hint.id || (this._hint.id = `hint-${this._input.id}`));
    } else {
      this._hint.hidden = true;
      this._input.removeAttribute('aria-invalid');
      this._input.removeAttribute('aria-describedby');
    }
  }

  // Form participation
  get form() { return this._internals?.form; }
  get name() { return this.getAttribute('name'); }
  get type() { return this._input.type; }

  get value() {
    return this._input.value;
  }

  set value(val) {
    this._input.value = val;
    this._internals?.setFormValue(val);
  }

  get validity() { return this._input.validity; }
  get validationMessage() { return this._input.validationMessage; }
  get willValidate() { return this._input.willValidate; }

  checkValidity() { return this._input.checkValidity(); }
  reportValidity() { return this._input.reportValidity(); }
  setCustomValidity(msg) { this._input.setCustomValidity(msg); }

  focus() { this._input.focus(); }
  blur() { this._input.blur(); }
  select() { this._input.select(); }
}

customElements.define('{{COMPONENT_PREFIX}}-input', DsInput);

export { DsInput };