/**
 * Icon Web Component
 * Loads SVG icons from the Lucide icon library
 *
 * @example
 * <x-icon name="menu"></x-icon>
 * <x-icon name="home" size="lg" label="Home"></x-icon>
 */

const ICON_CACHE = new Map();

class XIcon extends HTMLElement {
  static get observedAttributes() {
    return ['name', 'size', 'label', 'set', 'base-path'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  get basePath() {
    return this.getAttribute('base-path') || '/assets/icons';
  }

  get iconSet() {
    return this.getAttribute('set') || 'lucide';
  }

  get iconName() {
    return this.getAttribute('name');
  }

  get size() {
    return this.getAttribute('size') || 'md';
  }

  get label() {
    return this.getAttribute('label');
  }

  async render() {
    if (!this.iconName) return;

    const sizes = {
      xs: '0.75rem',
      sm: '1rem',
      md: '1.25rem',
      lg: '1.5rem',
      xl: '2rem',
      '2xl': '2.5rem'
    };

    const size = sizes[this.size] || sizes.md;
    const iconPath = `${this.basePath}/${this.iconSet}/${this.iconName}.svg`;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: ${size};
          height: ${size};
        }
        svg {
          width: 100%;
          height: 100%;
          stroke: currentColor;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
          fill: none;
        }
      </style>
      <span aria-hidden="true"></span>
    `;

    if (this.label) {
      this.setAttribute('role', 'img');
      this.setAttribute('aria-label', this.label);
    } else {
      this.setAttribute('aria-hidden', 'true');
    }

    try {
      const svg = await this.loadIcon(iconPath);
      this.shadowRoot.querySelector('span').innerHTML = svg;
    } catch (error) {
      console.warn(`Icon "${this.iconName}" not found at ${iconPath}`);
    }
  }

  async loadIcon(path) {
    if (ICON_CACHE.has(path)) {
      return ICON_CACHE.get(path);
    }

    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to load icon: ${path}`);
    }

    const svg = await response.text();
    ICON_CACHE.set(path, svg);
    return svg;
  }
}

customElements.define('x-icon', XIcon);

export { XIcon };
