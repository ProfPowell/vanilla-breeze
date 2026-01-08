/**
 * Card Component
 * A container with visual separation and optional header/footer
 *
 * @element {{COMPONENT_PREFIX}}-card
 * @attr {string} variant - Visual style: default, outlined, elevated
 * @attr {boolean} clickable - Makes the card interactive
 * @attr {string} href - Makes the card a link
 *
 * @slot - Main card content
 * @slot header - Card header content
 * @slot footer - Card footer content
 * @slot media - Media content (image/video) at top
 *
 * @csspart card - The card container
 * @csspart header - The header section
 * @csspart body - The body section
 * @csspart footer - The footer section
 * @csspart media - The media section
 *
 * @fires click - When clickable card is clicked
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

    .card {
      display: flex;
      flex-direction: column;
      background-color: var(--{{COMPONENT_PREFIX}}-color-surface);
      border-radius: var(--{{COMPONENT_PREFIX}}-radius-lg);
      overflow: hidden;
      transition: var(--{{COMPONENT_PREFIX}}-transition-all);
    }

    /* Variants */
    .card,
    :host([variant="default"]) .card {
      border: 1px solid var(--{{COMPONENT_PREFIX}}-color-border);
    }

    :host([variant="outlined"]) .card {
      border: 1px solid var(--{{COMPONENT_PREFIX}}-color-border-strong);
      background-color: transparent;
    }

    :host([variant="elevated"]) .card {
      border: none;
      box-shadow: var(--{{COMPONENT_PREFIX}}-shadow-md);
    }

    /* Clickable state */
    :host([clickable]) .card,
    :host([href]) .card {
      cursor: pointer;
    }

    :host([clickable]) .card:hover,
    :host([href]) .card:hover {
      border-color: var(--{{COMPONENT_PREFIX}}-color-primary);
    }

    :host([clickable][variant="elevated"]) .card:hover,
    :host([href][variant="elevated"]) .card:hover {
      box-shadow: var(--{{COMPONENT_PREFIX}}-shadow-lg);
      transform: translateY(-2px);
    }

    :host([clickable]) .card:focus-visible,
    :host([href]) .card:focus-visible {
      outline: none;
      box-shadow: var(--{{COMPONENT_PREFIX}}-focus-ring);
    }

    /* Link wrapper */
    a.card {
      text-decoration: none;
      color: inherit;
    }

    /* Sections */
    .media {
      display: none;
    }

    :host([has-media]) .media {
      display: block;
    }

    ::slotted([slot="media"]) {
      width: 100%;
      height: auto;
      display: block;
    }

    .header {
      display: none;
      padding: var(--{{COMPONENT_PREFIX}}-space-4) var(--{{COMPONENT_PREFIX}}-space-4) 0;
    }

    :host([has-header]) .header {
      display: block;
    }

    .body {
      flex: 1;
      padding: var(--{{COMPONENT_PREFIX}}-space-4);
    }

    :host([has-header]) .body {
      padding-top: var(--{{COMPONENT_PREFIX}}-space-3);
    }

    .footer {
      display: none;
      padding: 0 var(--{{COMPONENT_PREFIX}}-space-4) var(--{{COMPONENT_PREFIX}}-space-4);
      border-top: 1px solid var(--{{COMPONENT_PREFIX}}-color-border);
      margin-top: auto;
    }

    :host([has-footer]) .footer {
      display: block;
      padding-top: var(--{{COMPONENT_PREFIX}}-space-4);
    }

    /* Compact variant */
    :host([compact]) .body {
      padding: var(--{{COMPONENT_PREFIX}}-space-3);
    }

    :host([compact]) .header {
      padding: var(--{{COMPONENT_PREFIX}}-space-3) var(--{{COMPONENT_PREFIX}}-space-3) 0;
    }

    :host([compact]) .footer {
      padding: var(--{{COMPONENT_PREFIX}}-space-3);
    }
  </style>

  <div class="card" part="card" tabindex="-1">
    <div class="media" part="media">
      <slot name="media"></slot>
    </div>
    <div class="header" part="header">
      <slot name="header"></slot>
    </div>
    <div class="body" part="body">
      <slot></slot>
    </div>
    <div class="footer" part="footer">
      <slot name="footer"></slot>
    </div>
  </div>
`;

class DsCard extends HTMLElement {
  static get observedAttributes() {
    return ['href', 'clickable'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this._card = this.shadowRoot.querySelector('.card');

    // Check for slotted content
    this._slots = {
      header: this.shadowRoot.querySelector('slot[name="header"]'),
      footer: this.shadowRoot.querySelector('slot[name="footer"]'),
      media: this.shadowRoot.querySelector('slot[name="media"]')
    };
  }

  connectedCallback() {
    this._updateSlotVisibility();

    // Listen for slot changes
    Object.values(this._slots).forEach(slot => {
      slot.addEventListener('slotchange', () => this._updateSlotVisibility());
    });

    this._updateInteractivity();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    this._updateInteractivity();
  }

  _updateSlotVisibility() {
    this.toggleAttribute('has-header', this._slots.header.assignedNodes().length > 0);
    this.toggleAttribute('has-footer', this._slots.footer.assignedNodes().length > 0);
    this.toggleAttribute('has-media', this._slots.media.assignedNodes().length > 0);
  }

  _updateInteractivity() {
    const href = this.getAttribute('href');
    const isClickable = this.hasAttribute('clickable') || href;

    if (href) {
      // Convert to link
      if (this._card.tagName !== 'A') {
        const link = document.createElement('a');
        link.className = this._card.className;
        link.setAttribute('part', 'card');
        link.innerHTML = this._card.innerHTML;
        this._card.replaceWith(link);
        this._card = link;
      }
      this._card.href = href;
      this._card.tabIndex = 0;
    } else if (isClickable) {
      this._card.tabIndex = 0;
      this._card.setAttribute('role', 'button');
    } else {
      this._card.tabIndex = -1;
      this._card.removeAttribute('role');
    }
  }
}

customElements.define('{{COMPONENT_PREFIX}}-card', DsCard);

export { DsCard };