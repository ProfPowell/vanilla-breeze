import { styles } from './styles.js';
import { latLngToTile, getTileUrl } from './tile-math.js';

/**
 * Inline SVG marker pin (teardrop shape)
 * @param {string} color - Fill color
 * @returns {string} SVG markup
 */
function markerSvg(color) {
    return `<svg viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24s12-15 12-24C24 5.373 18.627 0 12 0z" fill="${color}"/>
        <circle cx="12" cy="12" r="5" fill="white" opacity="0.9"/>
    </svg>`;
}

/**
 * @class GeoMap
 * @extends HTMLElement
 * @description A zero-dependency map component using OSM tiles.
 * Renders a static tile grid centered on the given coordinates
 * with an optional marker pin and caption slot.
 *
 * @example
 * <geo-map lat="40.7484" lng="-73.9857" zoom="15">
 *   <address>Empire State Building, New York</address>
 * </geo-map>
 *
 * @attr {number} lat - Latitude of map center
 * @attr {number} lng - Longitude of map center
 * @attr {number} zoom - Tile zoom level 1–19 (default: 15)
 * @attr {string} marker - Show pin at center; "false" to hide
 * @attr {string} marker-color - Pin fill color (default: #e74c3c)
 * @attr {string} provider - Tile source: osm, carto-light, carto-dark
 */
class GeoMap extends HTMLElement {
    static get observedAttributes() {
        return ['lat', 'lng', 'zoom', 'marker', 'marker-color', 'provider', 'interactive', 'static-only'];
    }

    /** @type {import('./interact.js').MapInteraction|null} */
    #interaction = null;
    #preconnected = false;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    get lat() {
        return parseFloat(this.getAttribute('lat'));
    }

    get lng() {
        return parseFloat(this.getAttribute('lng'));
    }

    get zoom() {
        const z = parseInt(this.getAttribute('zoom'), 10);
        return (z >= 1 && z <= 19) ? z : 15;
    }

    get showMarker() {
        return this.getAttribute('marker') !== 'false';
    }

    get markerColor() {
        return this.getAttribute('marker-color') || '#e74c3c';
    }

    get provider() {
        return this.getAttribute('provider') || 'osm';
    }

    get interactive() {
        const val = this.getAttribute('interactive');
        if (val === 'eager' || val === 'none') return val;
        return 'click';
    }

    get staticOnly() {
        return this.hasAttribute('static-only');
    }

    connectedCallback() {
        this.render();
        this.loadTiles();
        this.#wireActivation();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue && this.isConnected) {
            // If interactive mode is active and a core attr changed, deactivate first
            if (this.#interaction) {
                this.#deactivate();
            }
            this.render();
            this.loadTiles();
            this.#wireActivation();
        }
    }

    disconnectedCallback() {
        if (this.#interaction) {
            this.#interaction.destroy();
            this.#interaction = null;
        }
    }

    /**
     * Build the shadow DOM structure
     */
    render() {
        const lat = this.lat;
        const lng = this.lng;
        const hasCoords = !isNaN(lat) && !isNaN(lng);

        // Check if there's slotted content
        const hasSlottedContent = this.children.length > 0;
        if (hasSlottedContent) {
            this.setAttribute('data-has-caption', '');
        } else {
            this.removeAttribute('data-has-caption');
        }

        const ariaLabel = hasCoords
            ? `Map of ${lat.toFixed(4)}, ${lng.toFixed(4)}`
            : 'Map';

        const markerHtml = this.showMarker && hasCoords
            ? `<div part="marker" aria-hidden="true">${markerSvg(this.markerColor)}</div>`
            : '';

        const showActivate = hasCoords && this.interactive !== 'none' && !this.staticOnly;
        const activateHtml = showActivate
            ? `<button part="activate" aria-label="Activate interactive map" tabindex="0">Click to interact</button>`
            : '';

        this.shadowRoot.innerHTML = `
            <style>${styles}</style>
            <div part="container">
                <div part="tiles" role="img" aria-label="${ariaLabel}"></div>
                ${markerHtml}
                ${activateHtml}
                <div part="caption"><slot></slot></div>
                <div part="attribution">
                    <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">&copy; OpenStreetMap</a>
                </div>
            </div>
        `;
    }

    /**
     * Calculate tile positions and load tile images
     */
    loadTiles() {
        const lat = this.lat;
        const lng = this.lng;

        if (isNaN(lat) || isNaN(lng)) {
            this.handleError('Missing or invalid lat/lng coordinates');
            return;
        }

        const zoom = this.zoom;
        const provider = this.provider;
        const { tileX, tileY, pixelX, pixelY } = latLngToTile(lat, lng, zoom);

        const tilesEl = this.shadowRoot.querySelector('[part="tiles"]');
        if (!tilesEl) return;

        // Clear existing tiles
        tilesEl.innerHTML = '';

        // Calculate offset to center the target point in the component
        // The 3×3 grid is 768×768. We want pixelX,pixelY of the center tile
        // to appear at the center of the component.
        const el = this;
        const w = el.offsetWidth || 400;
        const h = el.offsetHeight || 300;

        // Center tile is at grid position (1,1), so its top-left in the grid is (256, 256)
        // The target pixel within that tile is (pixelX, pixelY)
        // We want that point at (w/2, h/2)
        const offsetX = Math.round(w / 2 - 256 - pixelX);
        const offsetY = Math.round(h / 2 - 256 - pixelY);

        tilesEl.style.transform = `translate(${offsetX}px, ${offsetY}px)`;

        let loadCount = 0;
        let errorCount = 0;
        const totalTiles = 9;

        // Build 3×3 grid around center tile
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const tx = tileX + dx;
                const ty = tileY + dy;
                const url = getTileUrl(provider, zoom, tx, ty);

                const img = document.createElement('img');
                img.src = url;
                img.alt = '';
                img.loading = 'lazy';
                img.draggable = false;

                img.addEventListener('load', () => {
                    loadCount++;
                    if (loadCount + errorCount === totalTiles) {
                        this.dispatchEvent(new CustomEvent('geo-map:ready', {
                            bubbles: true,
                            detail: { lat, lng, zoom }
                        }));
                    }
                });

                img.addEventListener('error', () => {
                    errorCount++;
                    if (errorCount === totalTiles) {
                        this.handleError('Failed to load map tiles');
                    } else if (loadCount + errorCount === totalTiles) {
                        this.dispatchEvent(new CustomEvent('geo-map:ready', {
                            bubbles: true,
                            detail: { lat, lng, zoom }
                        }));
                    }
                });

                tilesEl.appendChild(img);
            }
        }
    }

    /**
     * Wire up the activate button with hover preconnect and click/eager activation.
     */
    #wireActivation() {
        const btn = this.shadowRoot.querySelector('[part="activate"]');
        if (!btn) return;

        btn.addEventListener('mouseenter', () => this.#preconnect(), { once: true });
        btn.addEventListener('focus', () => this.#preconnect(), { once: true });
        btn.addEventListener('click', () => this.#activate());

        if (this.interactive === 'eager') {
            // Activate on next frame so tiles render first
            requestAnimationFrame(() => this.#activate());
        }
    }

    /**
     * Inject a preconnect link for the tile server on hover/focus.
     */
    #preconnect() {
        if (this.#preconnected) return;
        this.#preconnected = true;

        const provider = this.provider;
        let origin;
        if (provider === 'carto-light' || provider === 'carto-dark') {
            origin = 'https://basemaps.cartocdn.com';
        } else {
            origin = 'https://tile.openstreetmap.org';
        }

        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = origin;
        link.crossOrigin = '';
        document.head.appendChild(link);
    }

    /**
     * Activate interactive mode — lazy-load interact.js and hand off control.
     */
    async #activate() {
        if (this.#interaction) return;
        const lat = this.lat;
        const lng = this.lng;
        if (isNaN(lat) || isNaN(lng)) return;

        const { MapInteraction } = await import('./interact.js');

        // Make the host focusable for keyboard events
        if (!this.hasAttribute('tabindex')) {
            this.setAttribute('tabindex', '0');
        }
        this.focus();

        this.setAttribute('data-interactive-active', '');
        this.#interaction = new MapInteraction({
            shadow: this.shadowRoot,
            host: this,
            lat,
            lng,
            zoom: this.zoom,
            provider: this.provider,
            onDeactivate: () => this.#deactivate(),
        });

        this.dispatchEvent(new CustomEvent('geo-map:activate', {
            bubbles: true,
            detail: { lat, lng, zoom: this.zoom }
        }));
    }

    /**
     * Deactivate interactive mode — destroy interaction, re-render static view.
     */
    #deactivate() {
        if (!this.#interaction) return;
        this.#interaction.destroy();
        this.#interaction = null;
        this.removeAttribute('data-interactive-active');

        // Re-render static view
        this.render();
        this.loadTiles();
        this.#wireActivation();
    }

    /**
     * Handle error state
     * @param {string} message
     */
    handleError(message) {
        const container = this.shadowRoot.querySelector('[part="container"]');
        if (container) {
            container.setAttribute('data-state', 'error');
            container.setAttribute('data-error', message);
        }
        this.dispatchEvent(new CustomEvent('geo-map:error', {
            bubbles: true,
            detail: { message }
        }));
    }
}

customElements.define('geo-map', GeoMap);

export { GeoMap };
