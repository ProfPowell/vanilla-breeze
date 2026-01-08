/**
 * Icon Component
 * SVG icon display using Lucide icons or custom SVG
 *
 * @element {{COMPONENT_PREFIX}}-icon
 * @attr {string} name - Lucide icon name (e.g., "check", "x", "menu")
 * @attr {string} size - Icon size: xs, sm, md, lg, xl or custom value
 * @attr {string} color - Icon color (CSS color value)
 * @attr {string} stroke-width - Stroke width (default: 2)
 * @attr {string} label - Accessible label (sets aria-label)
 *
 * @slot - Custom SVG content (overrides name)
 *
 * @csspart svg - The SVG element
 */

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      vertical-align: middle;
    }

    :host([hidden]) {
      display: none;
    }

    svg {
      width: var(--icon-size, 1.5rem);
      height: var(--icon-size, 1.5rem);
      stroke: var(--icon-color, currentColor);
      stroke-width: var(--icon-stroke-width, 2);
      stroke-linecap: round;
      stroke-linejoin: round;
      fill: none;
    }

    /* Preset sizes */
    :host([size="xs"]) {
      --icon-size: 0.875rem;
    }

    :host([size="sm"]) {
      --icon-size: 1rem;
    }

    :host([size="md"]) {
      --icon-size: 1.25rem;
    }

    :host([size="lg"]) {
      --icon-size: 1.5rem;
    }

    :host([size="xl"]) {
      --icon-size: 2rem;
    }

    :host([size="2xl"]) {
      --icon-size: 2.5rem;
    }

    /* Spin animation for loading icons */
    :host([spin]) svg {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>

  <svg part="svg" viewBox="0 0 24 24" aria-hidden="true">
    <slot></slot>
  </svg>
`;

// Common Lucide icon paths
const ICON_PATHS = {
  check: '<polyline points="20 6 9 17 4 12"></polyline>',
  x: '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>',
  minus: '<line x1="5" y1="12" x2="19" y2="12"></line>',
  menu: '<line x1="4" y1="12" x2="20" y2="12"></line><line x1="4" y1="6" x2="20" y2="6"></line><line x1="4" y1="18" x2="20" y2="18"></line>',
  search: '<circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>',
  settings: '<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>',
  home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>',
  mail: '<rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>',
  calendar: '<rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect><line x1="16" x2="16" y1="2" y2="6"></line><line x1="8" x2="8" y1="2" y2="6"></line><line x1="3" x2="21" y1="10" y2="10"></line>',
  clock: '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>',
  star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>',
  heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>',
  alert: '<circle cx="12" cy="12" r="10"></circle><line x1="12" x2="12" y1="8" y2="12"></line><line x1="12" x2="12.01" y1="16" y2="16"></line>',
  info: '<circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path>',
  warning: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path>',
  'chevron-down': '<path d="m6 9 6 6 6-6"></path>',
  'chevron-up': '<path d="m18 15-6-6-6 6"></path>',
  'chevron-left': '<path d="m15 18-6-6 6-6"></path>',
  'chevron-right': '<path d="m9 18 6-6-6-6"></path>',
  'arrow-left': '<path d="m12 19-7-7 7-7"></path><path d="M19 12H5"></path>',
  'arrow-right': '<path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path>',
  'external-link': '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" x2="21" y1="14" y2="3"></line>',
  copy: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>',
  trash: '<path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>',
  edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>',
  loader: '<line x1="12" x2="12" y1="2" y2="6"></line><line x1="12" x2="12" y1="18" y2="22"></line><line x1="4.93" x2="7.76" y1="4.93" y2="7.76"></line><line x1="16.24" x2="19.07" y1="16.24" y2="19.07"></line><line x1="2" x2="6" y1="12" y2="12"></line><line x1="18" x2="22" y1="12" y2="12"></line><line x1="4.93" x2="7.76" y1="19.07" y2="16.24"></line><line x1="16.24" x2="19.07" y1="7.76" y2="4.93"></line>'
};

class DsIcon extends HTMLElement {
  static get observedAttributes() {
    return ['name', 'size', 'color', 'stroke-width', 'label'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this._svg = this.shadowRoot.querySelector('svg');
    this._slot = this.shadowRoot.querySelector('slot');
  }

  connectedCallback() {
    this._updateIcon();
    this._updateAccessibility();

    // Listen for custom SVG slot changes
    this._slot.addEventListener('slotchange', () => {
      const hasCustomSvg = this._slot.assignedNodes().length > 0;
      if (hasCustomSvg) {
        // Custom SVG provided via slot
        this._svg.innerHTML = '';
      } else {
        this._updateIcon();
      }
    });
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    switch (name) {
      case 'name':
        this._updateIcon();
        break;
      case 'size':
        this._updateSize();
        break;
      case 'color':
        this._updateColor();
        break;
      case 'stroke-width':
        this._updateStrokeWidth();
        break;
      case 'label':
        this._updateAccessibility();
        break;
    }
  }

  _updateIcon() {
    const name = this.getAttribute('name');
    if (name && ICON_PATHS[name]) {
      this._svg.innerHTML = `<slot></slot>${ICON_PATHS[name]}`;
    }
  }

  _updateSize() {
    const size = this.getAttribute('size');
    if (size && !['xs', 'sm', 'md', 'lg', 'xl', '2xl'].includes(size)) {
      this._svg.style.setProperty('--icon-size', size);
    } else {
      this._svg.style.removeProperty('--icon-size');
    }
  }

  _updateColor() {
    const color = this.getAttribute('color');
    if (color) {
      this._svg.style.setProperty('--icon-color', color);
    } else {
      this._svg.style.removeProperty('--icon-color');
    }
  }

  _updateStrokeWidth() {
    const strokeWidth = this.getAttribute('stroke-width');
    if (strokeWidth) {
      this._svg.style.setProperty('--icon-stroke-width', strokeWidth);
    } else {
      this._svg.style.removeProperty('--icon-stroke-width');
    }
  }

  _updateAccessibility() {
    const label = this.getAttribute('label');
    if (label) {
      this._svg.setAttribute('aria-label', label);
      this._svg.setAttribute('role', 'img');
      this._svg.removeAttribute('aria-hidden');
    } else {
      this._svg.removeAttribute('aria-label');
      this._svg.removeAttribute('role');
      this._svg.setAttribute('aria-hidden', 'true');
    }
  }
}

customElements.define('{{COMPONENT_PREFIX}}-icon', DsIcon);

export { DsIcon, ICON_PATHS };