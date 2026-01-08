/**
 * Dropdown Component
 * A trigger-activated menu with positioning and keyboard navigation
 *
 * @element {{COMPONENT_PREFIX}}-dropdown
 * @attr {string} placement - Menu position: bottom-start, bottom-end, top-start, top-end
 * @attr {boolean} open - Controls dropdown visibility
 *
 * @slot trigger - The trigger element (button)
 * @slot - Menu items
 *
 * @csspart trigger - The trigger container
 * @csspart menu - The dropdown menu
 *
 * @fires open - When dropdown opens
 * @fires close - When dropdown closes
 * @fires select - When an item is selected (detail: { value })
 */

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      display: inline-block;
      position: relative;
    }

    .trigger {
      display: inline-block;
    }

    .menu {
      position: absolute;
      z-index: var(--{{COMPONENT_PREFIX}}-z-dropdown);
      min-width: 12rem;
      padding: var(--{{COMPONENT_PREFIX}}-space-1);
      background-color: var(--{{COMPONENT_PREFIX}}-color-surface);
      border: 1px solid var(--{{COMPONENT_PREFIX}}-color-border);
      border-radius: var(--{{COMPONENT_PREFIX}}-radius-lg);
      box-shadow: var(--{{COMPONENT_PREFIX}}-shadow-lg);
      opacity: 0;
      visibility: hidden;
      transform: translateY(-0.5rem);
      transition: opacity var(--{{COMPONENT_PREFIX}}-transition-fast) var(--{{COMPONENT_PREFIX}}-ease-out),
                  visibility var(--{{COMPONENT_PREFIX}}-transition-fast) var(--{{COMPONENT_PREFIX}}-ease-out),
                  transform var(--{{COMPONENT_PREFIX}}-transition-fast) var(--{{COMPONENT_PREFIX}}-ease-out);
    }

    :host([open]) .menu {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }

    /* Placement */
    :host([placement="bottom-start"]) .menu,
    .menu {
      top: 100%;
      left: 0;
      margin-top: var(--{{COMPONENT_PREFIX}}-space-1);
    }

    :host([placement="bottom-end"]) .menu {
      top: 100%;
      right: 0;
      left: auto;
      margin-top: var(--{{COMPONENT_PREFIX}}-space-1);
    }

    :host([placement="top-start"]) .menu {
      bottom: 100%;
      top: auto;
      left: 0;
      margin-bottom: var(--{{COMPONENT_PREFIX}}-space-1);
      transform: translateY(0.5rem);
    }

    :host([placement="top-end"]) .menu {
      bottom: 100%;
      top: auto;
      right: 0;
      left: auto;
      margin-bottom: var(--{{COMPONENT_PREFIX}}-space-1);
      transform: translateY(0.5rem);
    }

    :host([open][placement="top-start"]) .menu,
    :host([open][placement="top-end"]) .menu {
      transform: translateY(0);
    }

    /* Menu items styling via ::slotted */
    ::slotted([role="menuitem"]),
    ::slotted(button),
    ::slotted(a) {
      display: flex;
      align-items: center;
      gap: var(--{{COMPONENT_PREFIX}}-space-2);
      width: 100%;
      padding: var(--{{COMPONENT_PREFIX}}-space-2) var(--{{COMPONENT_PREFIX}}-space-3);
      font-family: var(--{{COMPONENT_PREFIX}}-font-sans);
      font-size: var(--{{COMPONENT_PREFIX}}-font-size-sm);
      color: var(--{{COMPONENT_PREFIX}}-color-text);
      background: none;
      border: none;
      border-radius: var(--{{COMPONENT_PREFIX}}-radius-md);
      cursor: pointer;
      text-decoration: none;
      text-align: left;
      transition: background-color var(--{{COMPONENT_PREFIX}}-transition-fast);
    }

    ::slotted([role="menuitem"]:hover),
    ::slotted(button:hover),
    ::slotted(a:hover),
    ::slotted([data-focused]) {
      background-color: var(--{{COMPONENT_PREFIX}}-color-gray-100);
    }

    ::slotted([role="menuitem"]:focus-visible),
    ::slotted(button:focus-visible),
    ::slotted(a:focus-visible) {
      outline: none;
      background-color: var(--{{COMPONENT_PREFIX}}-color-gray-100);
    }

    ::slotted([role="menuitem"][disabled]),
    ::slotted(button[disabled]) {
      opacity: 0.5;
      cursor: not-allowed;
    }

    ::slotted([role="separator"]),
    ::slotted(hr) {
      height: 1px;
      margin: var(--{{COMPONENT_PREFIX}}-space-1) 0;
      background-color: var(--{{COMPONENT_PREFIX}}-color-border);
      border: none;
    }

    /* Danger variant */
    ::slotted([data-variant="danger"]) {
      color: var(--{{COMPONENT_PREFIX}}-color-error);
    }

    ::slotted([data-variant="danger"]:hover) {
      background-color: var(--{{COMPONENT_PREFIX}}-color-error-light);
    }
  </style>

  <div class="trigger" part="trigger">
    <slot name="trigger"></slot>
  </div>
  <div class="menu" part="menu" role="menu">
    <slot></slot>
  </div>
`;

class DsDropdown extends HTMLElement {
  static get observedAttributes() {
    return ['open'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this._trigger = this.shadowRoot.querySelector('.trigger');
    this._menu = this.shadowRoot.querySelector('.menu');
    this._menuSlot = this.shadowRoot.querySelector('slot:not([name])');
    this._focusedIndex = -1;

    this._handleTriggerClick = this._handleTriggerClick.bind(this);
    this._handleKeydown = this._handleKeydown.bind(this);
    this._handleOutsideClick = this._handleOutsideClick.bind(this);
  }

  connectedCallback() {
    this._trigger.addEventListener('click', this._handleTriggerClick);
    this.addEventListener('keydown', this._handleKeydown);

    // Set up menu items
    this._menuSlot.addEventListener('slotchange', () => {
      this._getMenuItems().forEach((item, index) => {
        item.setAttribute('role', 'menuitem');
        item.setAttribute('tabindex', '-1');
        item.addEventListener('click', (e) => this._handleItemClick(e, item));
      });
    });
  }

  disconnectedCallback() {
    document.removeEventListener('click', this._handleOutsideClick);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'open') {
      this._handleOpenChange();
    }
  }

  _handleTriggerClick(e) {
    e.stopPropagation();
    this.toggle();
  }

  _handleOpenChange() {
    const triggerButton = this._trigger.querySelector('slot')
      .assignedElements()[0];

    if (this.open) {
      document.addEventListener('click', this._handleOutsideClick);
      triggerButton?.setAttribute('aria-expanded', 'true');
      this._focusedIndex = -1;
      this.dispatchEvent(new CustomEvent('open', { bubbles: true }));
    } else {
      document.removeEventListener('click', this._handleOutsideClick);
      triggerButton?.setAttribute('aria-expanded', 'false');
      this._clearFocus();
      this.dispatchEvent(new CustomEvent('close', { bubbles: true }));
    }
  }

  _handleOutsideClick(e) {
    if (!this.contains(e.target)) {
      this.close();
    }
  }

  _handleKeydown(e) {
    const items = this._getMenuItems();

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        this.close();
        this._trigger.querySelector('slot').assignedElements()[0]?.focus();
        break;

      case 'ArrowDown':
        e.preventDefault();
        if (!this.open) {
          this.show();
        } else {
          this._focusItem(this._focusedIndex + 1, items);
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (this.open) {
          this._focusItem(this._focusedIndex - 1, items);
        }
        break;

      case 'Home':
        if (this.open) {
          e.preventDefault();
          this._focusItem(0, items);
        }
        break;

      case 'End':
        if (this.open) {
          e.preventDefault();
          this._focusItem(items.length - 1, items);
        }
        break;

      case 'Enter':
      case ' ':
        if (this.open && this._focusedIndex >= 0) {
          e.preventDefault();
          items[this._focusedIndex]?.click();
        } else if (!this.open) {
          e.preventDefault();
          this.show();
        }
        break;

      case 'Tab':
        this.close();
        break;
    }
  }

  _handleItemClick(e, item) {
    if (item.hasAttribute('disabled')) {
      e.preventDefault();
      return;
    }

    this.dispatchEvent(new CustomEvent('select', {
      bubbles: true,
      detail: { value: item.dataset.value || item.textContent.trim() }
    }));

    this.close();
  }

  _getMenuItems() {
    return this._menuSlot.assignedElements()
      .filter(el => el.matches('[role="menuitem"], button, a') && !el.matches('[role="separator"], hr'));
  }

  _focusItem(index, items) {
    if (items.length === 0) return;

    // Wrap around
    if (index < 0) index = items.length - 1;
    if (index >= items.length) index = 0;

    // Skip disabled items
    let attempts = 0;
    while (items[index]?.hasAttribute('disabled') && attempts < items.length) {
      index = (index + 1) % items.length;
      attempts++;
    }

    this._clearFocus();
    this._focusedIndex = index;
    items[index]?.setAttribute('data-focused', '');
    items[index]?.focus();
  }

  _clearFocus() {
    this._getMenuItems().forEach(item => {
      item.removeAttribute('data-focused');
    });
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

customElements.define('{{COMPONENT_PREFIX}}-dropdown', DsDropdown);

export { DsDropdown };