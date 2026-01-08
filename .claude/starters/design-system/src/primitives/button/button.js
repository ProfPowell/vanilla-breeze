/**
 * Button Component
 * A customizable button with multiple variants and sizes
 *
 * @element {{COMPONENT_PREFIX}}-button
 * @attr {string} variant - Visual style: primary, secondary, outline, ghost, danger
 * @attr {string} size - Button size: sm, md, lg
 * @attr {boolean} disabled - Disables the button
 * @attr {boolean} loading - Shows loading state
 * @attr {string} type - Button type: button, submit, reset
 *
 * @slot - Button content
 * @slot prefix - Content before the label (icon)
 * @slot suffix - Content after the label (icon)
 *
 * @csspart button - The native button element
 * @csspart label - The label container
 *
 * @fires click - When button is clicked (not disabled/loading)
 */

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      display: inline-block;
    }

    :host([hidden]) {
      display: none;
    }

    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--{{COMPONENT_PREFIX}}-space-2);
      font-family: var(--{{COMPONENT_PREFIX}}-font-sans);
      font-weight: var(--{{COMPONENT_PREFIX}}-font-weight-medium);
      line-height: 1;
      border: 1px solid transparent;
      border-radius: var(--{{COMPONENT_PREFIX}}-radius-md);
      cursor: pointer;
      transition: var(--{{COMPONENT_PREFIX}}-transition-all);
      text-decoration: none;
      white-space: nowrap;
    }

    button:focus-visible {
      outline: none;
      box-shadow: var(--{{COMPONENT_PREFIX}}-focus-ring);
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Sizes */
    :host([size="sm"]) button {
      padding: var(--{{COMPONENT_PREFIX}}-space-1) var(--{{COMPONENT_PREFIX}}-space-3);
      font-size: var(--{{COMPONENT_PREFIX}}-font-size-sm);
      min-height: 2rem;
    }

    button,
    :host([size="md"]) button {
      padding: var(--{{COMPONENT_PREFIX}}-space-2) var(--{{COMPONENT_PREFIX}}-space-4);
      font-size: var(--{{COMPONENT_PREFIX}}-font-size-base);
      min-height: 2.5rem;
    }

    :host([size="lg"]) button {
      padding: var(--{{COMPONENT_PREFIX}}-space-3) var(--{{COMPONENT_PREFIX}}-space-6);
      font-size: var(--{{COMPONENT_PREFIX}}-font-size-lg);
      min-height: 3rem;
    }

    /* Variants */
    button,
    :host([variant="primary"]) button {
      background-color: var(--{{COMPONENT_PREFIX}}-color-primary);
      color: var(--{{COMPONENT_PREFIX}}-color-text-inverse);
      border-color: var(--{{COMPONENT_PREFIX}}-color-primary);
    }

    :host([variant="primary"]) button:hover:not(:disabled) {
      background-color: var(--{{COMPONENT_PREFIX}}-color-primary-dark);
      border-color: var(--{{COMPONENT_PREFIX}}-color-primary-dark);
    }

    :host([variant="secondary"]) button {
      background-color: var(--{{COMPONENT_PREFIX}}-color-gray-100);
      color: var(--{{COMPONENT_PREFIX}}-color-text);
      border-color: var(--{{COMPONENT_PREFIX}}-color-gray-100);
    }

    :host([variant="secondary"]) button:hover:not(:disabled) {
      background-color: var(--{{COMPONENT_PREFIX}}-color-gray-200);
      border-color: var(--{{COMPONENT_PREFIX}}-color-gray-200);
    }

    :host([variant="outline"]) button {
      background-color: transparent;
      color: var(--{{COMPONENT_PREFIX}}-color-primary);
      border-color: var(--{{COMPONENT_PREFIX}}-color-primary);
    }

    :host([variant="outline"]) button:hover:not(:disabled) {
      background-color: var(--{{COMPONENT_PREFIX}}-color-primary);
      color: var(--{{COMPONENT_PREFIX}}-color-text-inverse);
    }

    :host([variant="ghost"]) button {
      background-color: transparent;
      color: var(--{{COMPONENT_PREFIX}}-color-text);
      border-color: transparent;
    }

    :host([variant="ghost"]) button:hover:not(:disabled) {
      background-color: var(--{{COMPONENT_PREFIX}}-color-gray-100);
    }

    :host([variant="danger"]) button {
      background-color: var(--{{COMPONENT_PREFIX}}-color-error);
      color: var(--{{COMPONENT_PREFIX}}-color-text-inverse);
      border-color: var(--{{COMPONENT_PREFIX}}-color-error);
    }

    :host([variant="danger"]) button:hover:not(:disabled) {
      background-color: color-mix(in oklch, var(--{{COMPONENT_PREFIX}}-color-error) 80%, black);
    }

    /* Loading state */
    :host([loading]) button {
      position: relative;
      color: transparent;
      pointer-events: none;
    }

    :host([loading]) button::after {
      content: '';
      position: absolute;
      width: 1em;
      height: 1em;
      border: 2px solid currentColor;
      border-right-color: transparent;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    :host([loading][variant="primary"]) button::after,
    :host([loading][variant="danger"]) button::after {
      border-color: var(--{{COMPONENT_PREFIX}}-color-text-inverse);
      border-right-color: transparent;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Slots */
    ::slotted([slot="prefix"]),
    ::slotted([slot="suffix"]) {
      display: flex;
      align-items: center;
    }
  </style>

  <button part="button">
    <slot name="prefix"></slot>
    <span part="label"><slot></slot></span>
    <slot name="suffix"></slot>
  </button>
`;

class DsButton extends HTMLElement {
  static get observedAttributes() {
    return ['disabled', 'loading', 'type'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this._button = this.shadowRoot.querySelector('button');
  }

  connectedCallback() {
    this._updateType();
    this._updateDisabled();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    switch (name) {
      case 'disabled':
      case 'loading':
        this._updateDisabled();
        break;
      case 'type':
        this._updateType();
        break;
    }
  }

  _updateDisabled() {
    const isDisabled = this.hasAttribute('disabled') || this.hasAttribute('loading');
    this._button.disabled = isDisabled;
    this._button.setAttribute('aria-disabled', String(isDisabled));
  }

  _updateType() {
    this._button.type = this.getAttribute('type') || 'button';
  }

  get disabled() {
    return this.hasAttribute('disabled');
  }

  set disabled(value) {
    if (value) {
      this.setAttribute('disabled', '');
    } else {
      this.removeAttribute('disabled');
    }
  }

  get loading() {
    return this.hasAttribute('loading');
  }

  set loading(value) {
    if (value) {
      this.setAttribute('loading', '');
    } else {
      this.removeAttribute('loading');
    }
  }
}

customElements.define('{{COMPONENT_PREFIX}}-button', DsButton);

export { DsButton };