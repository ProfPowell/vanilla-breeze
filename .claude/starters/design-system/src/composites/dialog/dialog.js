/**
 * Dialog Component
 * Modal dialog with backdrop, focus trap, and accessibility
 *
 * @element {{COMPONENT_PREFIX}}-dialog
 * @attr {boolean} open - Controls dialog visibility
 * @attr {string} label - Accessible label for the dialog
 * @attr {boolean} closable - Shows close button (default: true)
 * @attr {boolean} persistent - Prevents closing on backdrop click
 *
 * @slot - Dialog body content
 * @slot header - Dialog header content
 * @slot footer - Dialog footer content
 *
 * @csspart dialog - The dialog container
 * @csspart backdrop - The backdrop overlay
 * @csspart header - The header section
 * @csspart body - The body section
 * @csspart footer - The footer section
 * @csspart close - The close button
 *
 * @fires open - When dialog opens
 * @fires close - When dialog closes
 */

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      display: contents;
    }

    .backdrop {
      position: fixed;
      inset: 0;
      background-color: rgb(0 0 0 / 0.5);
      z-index: var(--{{COMPONENT_PREFIX}}-z-overlay);
      opacity: 0;
      visibility: hidden;
      transition: opacity var(--{{COMPONENT_PREFIX}}-transition-normal) var(--{{COMPONENT_PREFIX}}-ease-out),
                  visibility var(--{{COMPONENT_PREFIX}}-transition-normal) var(--{{COMPONENT_PREFIX}}-ease-out);
    }

    :host([open]) .backdrop {
      opacity: 1;
      visibility: visible;
    }

    .dialog {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0.95);
      z-index: var(--{{COMPONENT_PREFIX}}-z-modal);
      background-color: var(--{{COMPONENT_PREFIX}}-color-surface);
      border-radius: var(--{{COMPONENT_PREFIX}}-radius-xl);
      box-shadow: var(--{{COMPONENT_PREFIX}}-shadow-xl);
      max-width: min(90vw, 32rem);
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      opacity: 0;
      visibility: hidden;
      transition: opacity var(--{{COMPONENT_PREFIX}}-transition-normal) var(--{{COMPONENT_PREFIX}}-ease-out),
                  visibility var(--{{COMPONENT_PREFIX}}-transition-normal) var(--{{COMPONENT_PREFIX}}-ease-out),
                  transform var(--{{COMPONENT_PREFIX}}-transition-normal) var(--{{COMPONENT_PREFIX}}-ease-out);
    }

    :host([open]) .dialog {
      opacity: 1;
      visibility: visible;
      transform: translate(-50%, -50%) scale(1);
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--{{COMPONENT_PREFIX}}-space-4) var(--{{COMPONENT_PREFIX}}-space-6);
      border-bottom: 1px solid var(--{{COMPONENT_PREFIX}}-color-border);
    }

    .header-content {
      font-size: var(--{{COMPONENT_PREFIX}}-font-size-lg);
      font-weight: var(--{{COMPONENT_PREFIX}}-font-weight-semibold);
    }

    .close-button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2rem;
      height: 2rem;
      padding: 0;
      background: none;
      border: none;
      border-radius: var(--{{COMPONENT_PREFIX}}-radius-md);
      cursor: pointer;
      color: var(--{{COMPONENT_PREFIX}}-color-text-muted);
      transition: var(--{{COMPONENT_PREFIX}}-transition-all);
    }

    .close-button:hover {
      background-color: var(--{{COMPONENT_PREFIX}}-color-gray-100);
      color: var(--{{COMPONENT_PREFIX}}-color-text);
    }

    .close-button:focus-visible {
      outline: none;
      box-shadow: var(--{{COMPONENT_PREFIX}}-focus-ring);
    }

    .close-button svg {
      width: 1.25rem;
      height: 1.25rem;
      stroke: currentColor;
      stroke-width: 2;
      fill: none;
    }

    .body {
      flex: 1;
      padding: var(--{{COMPONENT_PREFIX}}-space-6);
      overflow-y: auto;
    }

    .footer {
      display: flex;
      justify-content: flex-end;
      gap: var(--{{COMPONENT_PREFIX}}-space-3);
      padding: var(--{{COMPONENT_PREFIX}}-space-4) var(--{{COMPONENT_PREFIX}}-space-6);
      border-top: 1px solid var(--{{COMPONENT_PREFIX}}-color-border);
    }

    .footer:empty {
      display: none;
    }

    /* Size variants */
    :host([size="sm"]) .dialog {
      max-width: min(90vw, 24rem);
    }

    :host([size="lg"]) .dialog {
      max-width: min(90vw, 48rem);
    }

    :host([size="xl"]) .dialog {
      max-width: min(90vw, 64rem);
    }

    :host([size="full"]) .dialog {
      max-width: 95vw;
      max-height: 95vh;
      width: 95vw;
      height: 95vh;
    }
  </style>

  <div class="backdrop" part="backdrop"></div>
  <div class="dialog" part="dialog" role="dialog" aria-modal="true">
    <div class="header" part="header">
      <div class="header-content">
        <slot name="header"></slot>
      </div>
      <button class="close-button" part="close" aria-label="Close dialog">
        <svg viewBox="0 0 24 24">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
    <div class="body" part="body">
      <slot></slot>
    </div>
    <div class="footer" part="footer">
      <slot name="footer"></slot>
    </div>
  </div>
`;

class DsDialog extends HTMLElement {
  static get observedAttributes() {
    return ['open', 'label', 'closable', 'persistent'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this._dialog = this.shadowRoot.querySelector('.dialog');
    this._backdrop = this.shadowRoot.querySelector('.backdrop');
    this._closeButton = this.shadowRoot.querySelector('.close-button');
    this._previousActiveElement = null;

    this._handleKeydown = this._handleKeydown.bind(this);
    this._handleBackdropClick = this._handleBackdropClick.bind(this);
  }

  connectedCallback() {
    this._closeButton.addEventListener('click', () => this.close());
    this._backdrop.addEventListener('click', this._handleBackdropClick);
    this._updateLabel();
    this._updateClosable();
  }

  disconnectedCallback() {
    document.removeEventListener('keydown', this._handleKeydown);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    switch (name) {
      case 'open':
        this._handleOpenChange();
        break;
      case 'label':
        this._updateLabel();
        break;
      case 'closable':
        this._updateClosable();
        break;
    }
  }

  _handleOpenChange() {
    if (this.open) {
      this._previousActiveElement = document.activeElement;
      document.addEventListener('keydown', this._handleKeydown);
      document.body.style.overflow = 'hidden';

      // Focus first focusable element or dialog
      requestAnimationFrame(() => {
        const focusable = this._getFocusableElements()[0];
        if (focusable) {
          focusable.focus();
        } else {
          this._dialog.focus();
        }
      });

      this.dispatchEvent(new CustomEvent('open', { bubbles: true }));
    } else {
      document.removeEventListener('keydown', this._handleKeydown);
      document.body.style.overflow = '';

      if (this._previousActiveElement) {
        this._previousActiveElement.focus();
        this._previousActiveElement = null;
      }

      this.dispatchEvent(new CustomEvent('close', { bubbles: true }));
    }
  }

  _handleKeydown(e) {
    if (e.key === 'Escape' && !this.hasAttribute('persistent')) {
      e.preventDefault();
      this.close();
    }

    if (e.key === 'Tab') {
      this._trapFocus(e);
    }
  }

  _handleBackdropClick(e) {
    if (e.target === this._backdrop && !this.hasAttribute('persistent')) {
      this.close();
    }
  }

  _trapFocus(e) {
    const focusable = this._getFocusableElements();
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  _getFocusableElements() {
    const selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    return [...this.querySelectorAll(selector), ...this.shadowRoot.querySelectorAll(selector)]
      .filter(el => !el.disabled && el.offsetParent !== null);
  }

  _updateLabel() {
    const label = this.getAttribute('label');
    if (label) {
      this._dialog.setAttribute('aria-label', label);
    } else {
      this._dialog.removeAttribute('aria-label');
    }
  }

  _updateClosable() {
    const closable = this.getAttribute('closable') !== 'false';
    this._closeButton.hidden = !closable;
  }

  get open() {
    return this.hasAttribute('open');
  }

  set open(value) {
    if (value) {
      this.setAttribute('open', '');
    } else {
      this.removeAttribute('open');
    }
  }

  show() {
    this.open = true;
  }

  close() {
    this.open = false;
  }

  toggle() {
    this.open = !this.open;
  }
}

customElements.define('{{COMPONENT_PREFIX}}-dialog', DsDialog);

export { DsDialog };