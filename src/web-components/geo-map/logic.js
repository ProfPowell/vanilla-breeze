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
 * @augments HTMLElement
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
        return ['lat', 'lng', 'zoom', 'marker', 'marker-color', 'provider', 'interactive', 'static-only', 'src', 'place'];
    }

    /** @type {import('./interact.js').MapInteraction|null} */
    #interaction = null;
    #preconnected = false;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    get lat() {
        return parseFloat(this.getAttribute('lat') ?? '');
    }

    get lng() {
        return parseFloat(this.getAttribute('lng') ?? '');
    }

    get zoom() {
        const z = parseInt(this.getAttribute('zoom') ?? '', 10);
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

    /**
     * Resolve coordinates from 6 sources in priority order.
     * @returns {{ lat: number, lng: number } | null}
     */
    #resolveCoordinates() {
        // 1. Explicit lat/lng attributes
        const attrLat = parseFloat(this.getAttribute('lat') ?? '');
        const attrLng = parseFloat(this.getAttribute('lng') ?? '');
        if (!isNaN(attrLat) && !isNaN(attrLng)) return { lat: attrLat, lng: attrLng };

        // 2–3. src ID reference (address or JSON-LD)
        const srcId = this.getAttribute('src');
        if (srcId) {
            const fromSrc = this.#resolveFromSrc(srcId);
            if (fromSrc) return fromSrc;
        }

        // 4. Slotted <address data-lat data-lng>
        const addr = /** @type {HTMLElement | null} */ (this.querySelector('address[data-lat][data-lng]'));
        if (addr) {
            const lat = parseFloat(addr.dataset.lat ?? '');
            const lng = parseFloat(addr.dataset.lng ?? '');
            if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
        }

        // 5. place attr → scan all JSON-LD scripts
        const placeName = this.getAttribute('place');
        if (placeName) {
            const fromLd = this.#resolveFromJsonLd(placeName);
            if (fromLd) return fromLd;
        }

        // 6. <meta name="geo.position"> fallback
        const meta = document.querySelector('meta[name="geo.position"]');
        if (meta) {
            const content = meta.getAttribute('content') || '';
            const parts = content.split(';');
            if (parts.length === 2) {
                const lat = parseFloat(parts[0]);
                const lng = parseFloat(parts[1]);
                if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
            }
        }

        return null;
    }

    /**
     * Resolve from a src ID — checks for address[data-lat/lng] or JSON-LD script.
     * @param {string} id
     * @returns {{ lat: number, lng: number } | null}
     */
    #resolveFromSrc(id) {
        const el = document.getElementById(id);
        if (!el) return null;

        // Address element with data attributes
        if (el.tagName === 'ADDRESS' && el.dataset.lat && el.dataset.lng) {
            const lat = parseFloat(el.dataset.lat);
            const lng = parseFloat(el.dataset.lng);
            if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
        }

        // JSON-LD script element
        if (el.tagName === 'SCRIPT' && /** @type {HTMLScriptElement} */ (el).type === 'application/ld+json') {
            return this.#parseJsonLdGeo(/** @type {HTMLScriptElement} */ (el));
        }

        return null;
    }

    /**
     * Scan all JSON-LD scripts for a matching place name, extract geo.
     * @param {string} placeName
     * @returns {{ lat: number, lng: number } | null}
     */
    #resolveFromJsonLd(placeName) {
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        for (const script of scripts) {
            try {
                const data = JSON.parse(script.textContent);
                if (data.name === placeName) {
                    const geo = data.geo;
                    if (geo) {
                        const lat = parseFloat(geo.latitude);
                        const lng = parseFloat(geo.longitude);
                        if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
                    }
                }
            } catch { /* malformed JSON — skip */ }
        }
        return null;
    }

    /**
     * Parse a single JSON-LD script element for geo coordinates.
     * @param {HTMLScriptElement} scriptEl
     * @returns {{ lat: number, lng: number } | null}
     */
    #parseJsonLdGeo(scriptEl) {
        try {
            const data = JSON.parse(scriptEl.textContent);
            const geo = data.geo;
            if (geo) {
                const lat = parseFloat(geo.latitude);
                const lng = parseFloat(geo.longitude);
                if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
            }
        } catch { /* malformed JSON — skip */ }
        return null;
    }

    connectedCallback() {
        this.render();
        this.loadTiles();
        this.#wireActivation();
        this.setAttribute('data-upgraded', '');
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
        this.removeAttribute('data-upgraded');
        if (this.#interaction) {
            this.#interaction.destroy();
            this.#interaction = null;
        }
    }

    /**
     * Build the shadow DOM structure
     */
    render() {
        const coords = this.#resolveCoordinates();
        const lat = coords?.lat ?? NaN;
        const lng = coords?.lng ?? NaN;
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
            ? `<div part="overlay"><button part="activate" aria-label="Activate interactive map" tabindex="0">Click to interact</button></div>`
            : '';

        /** @type {ShadowRoot} */ (this.shadowRoot).innerHTML = `
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
        const coords = this.#resolveCoordinates();
        const lat = coords?.lat ?? NaN;
        const lng = coords?.lng ?? NaN;

        if (isNaN(lat) || isNaN(lng)) {
            this.handleError('Missing or invalid lat/lng coordinates');
            return;
        }

        const zoom = this.zoom;
        const provider = this.provider;
        const { tileX, tileY, pixelX, pixelY } = latLngToTile(lat, lng, zoom);

        const tilesEl = /** @type {ShadowRoot} */ (this.shadowRoot).querySelector('[part="tiles"]');
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

        /** @type {HTMLElement} */ (tilesEl).style.transform = `translate(${offsetX}px, ${offsetY}px)`;

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
        const overlay = /** @type {ShadowRoot} */ (this.shadowRoot).querySelector('[part="overlay"]');
        if (!overlay) return;

        const btn = overlay.querySelector('[part="activate"]');

        overlay.addEventListener('mouseenter', () => this.#preconnect(), { once: true });
        if (btn) btn.addEventListener('focus', () => this.#preconnect(), { once: true });
        if (btn) btn.addEventListener('click', () => this.#activate());

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
        const coords = this.#resolveCoordinates();
        const lat = coords?.lat ?? NaN;
        const lng = coords?.lng ?? NaN;
        if (isNaN(lat) || isNaN(lng)) return;

        const { MapInteraction } = await import('./interact.js');

        // Make the host focusable for keyboard events
        if (!this.hasAttribute('tabindex')) {
            this.setAttribute('tabindex', '0');
        }
        this.focus();

        this.setAttribute('data-interactive-active', '');
        this.#interaction = new MapInteraction({
            shadow: /** @type {ShadowRoot} */ (this.shadowRoot),
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
        const container = /** @type {ShadowRoot} */ (this.shadowRoot).querySelector('[part="container"]');
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
