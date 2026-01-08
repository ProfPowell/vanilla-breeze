/**
 * Quantity Input Component
 *
 * Numeric input with increment/decrement buttons.
 * Form-associated custom element for form participation.
 */

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      display: inline-flex;
    }

    .quantity {
      display: inline-flex;
      align-items: center;
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: var(--radius-md, 0.375rem);
      overflow: hidden;
    }

    .quantity__btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      padding: 0;
      background: var(--color-surface, white);
      border: none;
      cursor: pointer;
      font-size: 18px;
      color: var(--color-text, #111827);
      transition: background-color 0.2s ease;
    }

    .quantity__btn:hover:not(:disabled) {
      background: var(--color-surface-alt, #f3f4f6);
    }

    .quantity__btn:focus-visible {
      outline: 2px solid var(--color-primary, #1e40af);
      outline-offset: -2px;
    }

    .quantity__btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .quantity__input {
      width: 50px;
      height: 40px;
      padding: 0;
      border: none;
      border-left: 1px solid var(--color-border, #e5e7eb);
      border-right: 1px solid var(--color-border, #e5e7eb);
      text-align: center;
      font-size: var(--text-base, 1rem);
      font-weight: 500;
      -moz-appearance: textfield;
    }

    .quantity__input::-webkit-outer-spin-button,
    .quantity__input::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    .quantity__input:focus {
      outline: none;
      box-shadow: inset 0 0 0 2px var(--color-primary, #1e40af);
    }

    :host([disabled]) .quantity {
      opacity: 0.5;
    }

    :host([disabled]) .quantity__btn,
    :host([disabled]) .quantity__input {
      cursor: not-allowed;
      pointer-events: none;
    }

    @media (prefers-reduced-motion: reduce) {
      .quantity__btn {
        transition: none;
      }
    }
  </style>

  <div class="quantity">
    <button type="button" class="quantity__btn quantity__btn--decrement" aria-label="Decrease quantity">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path d="M5 12h14"></path>
      </svg>
    </button>
    <input
      type="number"
      class="quantity__input"
      inputmode="numeric"
      aria-label="Quantity"
    />
    <button type="button" class="quantity__btn quantity__btn--increment" aria-label="Increase quantity">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path d="M12 5v14M5 12h14"></path>
      </svg>
    </button>
  </div>
`;

class QuantityInput extends HTMLElement {
  static formAssociated = true;

  static get observedAttributes() {
    return ['value', 'min', 'max', 'step', 'disabled', 'name'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this._internals = this.attachInternals?.();
    this._input = this.shadowRoot.querySelector('.quantity__input');
    this._decrementBtn = this.shadowRoot.querySelector('.quantity__btn--decrement');
    this._incrementBtn = this.shadowRoot.querySelector('.quantity__btn--increment');
  }

  connectedCallback() {
    this._decrementBtn.addEventListener('click', this._decrement.bind(this));
    this._incrementBtn.addEventListener('click', this._increment.bind(this));
    this._input.addEventListener('change', this._handleChange.bind(this));
    this._input.addEventListener('input', this._handleInput.bind(this));

    this._syncFromAttributes();
    this._updateButtons();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    switch (name) {
      case 'value':
        this._input.value = newValue;
        this._updateFormValue();
        this._updateButtons();
        break;
      case 'min':
        this._input.min = newValue;
        this._updateButtons();
        break;
      case 'max':
        this._input.max = newValue;
        this._updateButtons();
        break;
      case 'step':
        this._input.step = newValue;
        break;
      case 'disabled':
        const isDisabled = newValue !== null;
        this._input.disabled = isDisabled;
        this._decrementBtn.disabled = isDisabled;
        this._incrementBtn.disabled = isDisabled;
        break;
      case 'name':
        // Name is used for form association
        break;
    }
  }

  _syncFromAttributes() {
    this._input.value = this.getAttribute('value') || '1';
    this._input.min = this.getAttribute('min') || '1';
    this._input.max = this.getAttribute('max') || '99';
    this._input.step = this.getAttribute('step') || '1';

    if (this.hasAttribute('disabled')) {
      this._input.disabled = true;
      this._decrementBtn.disabled = true;
      this._incrementBtn.disabled = true;
    }

    this._updateFormValue();
  }

  _increment() {
    const max = parseInt(this._input.max, 10) || 99;
    const step = parseInt(this._input.step, 10) || 1;
    const current = parseInt(this._input.value, 10) || 0;
    const newValue = Math.min(current + step, max);

    this._input.value = newValue;
    this._dispatchChange();
  }

  _decrement() {
    const min = parseInt(this._input.min, 10) || 1;
    const step = parseInt(this._input.step, 10) || 1;
    const current = parseInt(this._input.value, 10) || 0;
    const newValue = Math.max(current - step, min);

    this._input.value = newValue;
    this._dispatchChange();
  }

  _handleChange() {
    this._clampValue();
    this._dispatchChange();
  }

  _handleInput() {
    this._updateFormValue();
  }

  _clampValue() {
    const min = parseInt(this._input.min, 10) || 1;
    const max = parseInt(this._input.max, 10) || 99;
    let value = parseInt(this._input.value, 10);

    if (isNaN(value)) {
      value = min;
    } else {
      value = Math.max(min, Math.min(value, max));
    }

    this._input.value = value;
  }

  _updateButtons() {
    const value = parseInt(this._input.value, 10) || 0;
    const min = parseInt(this._input.min, 10) || 1;
    const max = parseInt(this._input.max, 10) || 99;

    this._decrementBtn.disabled = value <= min || this.hasAttribute('disabled');
    this._incrementBtn.disabled = value >= max || this.hasAttribute('disabled');
  }

  _updateFormValue() {
    if (this._internals) {
      this._internals.setFormValue(this._input.value);
    }
  }

  _dispatchChange() {
    this._updateFormValue();
    this._updateButtons();
    this.setAttribute('value', this._input.value);

    this.dispatchEvent(new CustomEvent('change', {
      bubbles: true,
      detail: { value: parseInt(this._input.value, 10) },
    }));
  }

  // Form-associated custom element callbacks
  get value() {
    return this._input.value;
  }

  set value(v) {
    this._input.value = v;
    this._updateFormValue();
    this._updateButtons();
  }

  get form() {
    return this._internals?.form;
  }

  get name() {
    return this.getAttribute('name');
  }

  get type() {
    return 'number';
  }

  get validity() {
    return this._internals?.validity;
  }

  get validationMessage() {
    return this._internals?.validationMessage;
  }

  get willValidate() {
    return this._internals?.willValidate;
  }

  checkValidity() {
    return this._internals?.checkValidity();
  }

  reportValidity() {
    return this._internals?.reportValidity();
  }
}

customElements.define('quantity-input', QuantityInput);