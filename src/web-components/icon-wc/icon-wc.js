import { styles } from './styles.js';

/**
 * SVG icon cache to avoid refetching
 * @type {Map<string, string>}
 */
const iconCache = new Map();

/**
 * @class IconWc
 * @extends HTMLElement
 * @description A lightweight icon component that loads SVG icons from local files
 *
 * @example
 * <icon-wc name="menu"></icon-wc>
 * <icon-wc name="arrow-right" size="lg"></icon-wc>
 * <icon-wc name="logo" set="custom"></icon-wc>
 *
 * @attr {string} name - Icon name (required, matches filename without .svg)
 * @attr {string} set - Icon set directory (default: "lucide", or "custom")
 * @attr {string} size - Icon size: xs, sm, md, lg, xl, 2xl (default: md)
 * @attr {string} label - Accessible label for functional icons
 */
class IconWc extends HTMLElement {
    static #instances = new Set();
    static #globalObserver = null;

    static #initGlobalObserver() {
        if (IconWc.#globalObserver) return;
        IconWc.#globalObserver = new MutationObserver((mutations) => {
            for (const m of mutations) {
                if (m.attributeName === 'data-icon-set') {
                    for (const inst of IconWc.#instances) {
                        if (!inst.hasAttribute('set')) {
                            inst.render();
                            inst.loadIcon();
                        }
                    }
                }
            }
        });
        IconWc.#globalObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-icon-set']
        });
    }

    /**
     * @static
     * @returns {string[]} List of attributes to observe for changes
     */
    static get observedAttributes() {
        return ['name', 'set', 'size', 'label'];
    }

    /**
     * @constructor
     */
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    /**
     * @readonly
     * @returns {string} The icon name
     */
    get name() {
        return this.getAttribute('name') || '';
    }

    /**
     * @readonly
     * @returns {string} The icon set — reads from attribute, then global data-icon-set, then defaults to lucide
     */
    get set() {
        return this.getAttribute('set') ||
               document.documentElement.dataset.iconSet ||
               'lucide';
    }

    /**
     * @readonly
     * @returns {string} The icon size
     */
    get size() {
        return this.getAttribute('size') || 'md';
    }

    /**
     * @readonly
     * @returns {string|null} Accessible label for the icon
     */
    get label() {
        return this.getAttribute('label');
    }

    /**
     * @readonly
     * @returns {string} The base path for icons
     */
    get basePath() {
        // Look for data-icon-path on document or component
        return this.getAttribute('base-path') ||
               document.documentElement.dataset.iconPath ||
               '/src/icons';
    }

    /**
     * @readonly
     * @returns {string} Full path to the icon SVG file
     */
    get iconPath() {
        return `${this.basePath}/${this.set}/${this.name}.svg`;
    }

    /**
     * @private
     * @description Renders the component's shadow DOM with styles
     */
    render() {
        this.shadowRoot.innerHTML = `
            <style>${styles}</style>
            <slot></slot>
        `;
    }

    /**
     * @private
     * @description Loads and displays the SVG icon
     */
    async loadIcon() {
        if (!this.name) {
            this.setError('No icon name specified');
            return;
        }

        const cacheKey = `${this.set}/${this.name}`;

        // Check cache first
        if (iconCache.has(cacheKey)) {
            this.displayIcon(iconCache.get(cacheKey));
            return;
        }

        try {
            const response = await fetch(this.iconPath);

            if (!response.ok) {
                throw new Error(`Icon not found: ${this.name}`);
            }

            const svgText = await response.text();

            // Validate it's actually SVG
            if (!svgText.includes('<svg')) {
                throw new Error(`Invalid SVG: ${this.name}`);
            }

            // Cache the SVG
            iconCache.set(cacheKey, svgText);

            this.displayIcon(svgText);
        } catch (error) {
            this.setError(error.message);
        }
    }

    /**
     * @private
     * @param {string} svgText - The SVG markup to display
     */
    displayIcon(svgText) {
        // Parse and clean up the SVG
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgText, 'image/svg+xml');
        const svg = doc.querySelector('svg');

        if (!svg) {
            this.setError('Invalid SVG content');
            return;
        }

        // Remove fixed dimensions to allow CSS sizing
        svg.removeAttribute('width');
        svg.removeAttribute('height');

        // Set accessibility attributes
        if (this.label) {
            svg.setAttribute('role', 'img');
            svg.setAttribute('aria-label', this.label);
        } else {
            svg.setAttribute('aria-hidden', 'true');
        }

        // Clear error state
        this.removeAttribute('data-error');

        // Insert the SVG
        const slot = this.shadowRoot.querySelector('slot');
        if (slot) {
            slot.replaceWith(svg);
        }
    }

    /**
     * @private
     * @param {string} message - Error message
     */
    setError(message) {
        this.setAttribute('data-error', 'true');
        console.warn(`icon-wc: ${message}`);

        // Show fallback or hide
        const slot = this.shadowRoot.querySelector('slot');
        if (slot) {
            slot.textContent = '';
        }
    }

    /**
     * @description Lifecycle callback when element is added to DOM
     */
    connectedCallback() {
        IconWc.#instances.add(this);
        IconWc.#initGlobalObserver();
        this.render();
        this.loadIcon();

        // Force SVG repaint when theme changes (shadow DOM may not re-resolve currentColor)
        this._onThemeChange = () => {
            const svg = this.shadowRoot?.querySelector('svg');
            if (svg) {
                svg.style.stroke = 'none';
                requestAnimationFrame(() => { svg.style.stroke = ''; });
            }
        };
        window.addEventListener('theme-change', this._onThemeChange);
    }

    /**
     * @description Lifecycle callback when element is removed from DOM
     */
    disconnectedCallback() {
        IconWc.#instances.delete(this);
        if (this._onThemeChange) {
            window.removeEventListener('theme-change', this._onThemeChange);
        }
    }

    /**
     * @description Lifecycle callback when observed attributes change
     * @param {string} name - Attribute name
     * @param {string} oldValue - Previous value
     * @param {string} newValue - New value
     */
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue && this.isConnected) {
            if (name === 'name' || name === 'set') {
                this.render();
                this.loadIcon();
            } else if (name === 'label') {
                const svg = this.shadowRoot.querySelector('svg');
                if (svg) {
                    if (newValue) {
                        svg.setAttribute('role', 'img');
                        svg.setAttribute('aria-label', newValue);
                    } else {
                        svg.removeAttribute('role');
                        svg.setAttribute('aria-hidden', 'true');
                    }
                }
            }
        }
    }
}

customElements.define('icon-wc', IconWc);

export { IconWc };
