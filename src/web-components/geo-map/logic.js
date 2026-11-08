import { VBElement } from '../../lib/vb-element.js';
import { adoptStyles } from './styles.js';
import { latLngToWorldPixel, getTileUrl, PROVIDERS } from './tile-math.js';
import { registerComponent } from '../../lib/bundle-registry.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Default UI strings; each is overridable with data-label-<key>. */
const LABELS = {
    'map': 'Map',
    'map-of': 'Map of {name}',
    'activate': 'Activate interactive map',
    'consent': 'Load map',
    'consent-note': 'Loads map images from {host}',
    'zoom-in': 'Zoom in',
    'zoom-out': 'Zoom out',
    'recenter': 'Recenter map',
    'exit': 'Exit map',
    'controls': 'Map controls',
    'instructions': 'Drag or use the arrow keys to pan. Click a point to centre on it. Pinch, scroll, or press plus and minus to zoom. Home recentres. Escape exits.',
    'moved': 'Map centred on {lat}, {lng}, zoom {zoom}',
    'error-coords': 'Map location unavailable',
    'error-tiles': 'Map images failed to load',
};

let instance = 0;

/**
 * Teardrop marker pin built with DOM APIs (no markup interpolation).
 * Fill comes from CSS: --_marker-color (validated marker-color) →
 * --geo-map-marker-color → --color-error.
 * @returns {HTMLElement}
 */
function buildMarker() {
    const wrap = document.createElement('div');
    wrap.setAttribute('part', 'marker');
    wrap.setAttribute('aria-hidden', 'true');
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 36');
    svg.setAttribute('focusable', 'false');
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('class', 'pin');
    path.setAttribute('d', 'M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24s12-15 12-24C24 5.373 18.627 0 12 0z');
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('class', 'dot');
    dot.setAttribute('cx', '12');
    dot.setAttribute('cy', '12');
    dot.setAttribute('r', '5');
    svg.append(path, dot);
    wrap.append(svg);
    return wrap;
}

/**
 * @param {string} tag
 * @param {Record<string, string>} [attrs]
 * @param {string} [text]
 * @returns {HTMLElement}
 */
function el(tag, attrs = {}, text) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    if (text != null) node.textContent = text;
    return node;
}

/**
 * @param {string | null | undefined} value
 * @returns {boolean} True when value is a valid CSS colour.
 */
function isColor(value) {
    if (!value || typeof value !== 'string') return false;
    return typeof CSS !== 'undefined' && CSS.supports('color', value);
}

/**
 * @class GeoMap
 * @augments VBElement
 * @description A zero-dependency map component using OSM / CARTO raster
 * tiles (or your own tile proxy). Renders a static tile view centred on the
 * given coordinates with an optional marker pin and caption slot; an
 * activation step lazy-loads pan / zoom.
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
 * @attr {string} marker-color - Pin fill (any CSS colour; invalid values are ignored)
 * @attr {string} provider - osm | carto-light | carto-dark | carto-auto
 * @attr {string} tile-url - URL template ({z} {x} {y} {s} {r}); overrides provider
 * @attr {string} attribution - Credit text for tile-url sources
 * @attr {string} attribution-href - Link for the attribution credit
 * @attr {string} interactive - click | eager | none
 * @attr {boolean} static-only - Never activate
 * @attr {string} loading - lazy | eager | consent
 * @attr {string} label - Accessible name of the map
 * @attr {string} src - ID of an <address data-lat data-lng> or JSON-LD script
 * @attr {string} place - JSON-LD Place name to match
 */
class GeoMap extends VBElement {
    static get observedAttributes() {
        return ['lat', 'lng', 'zoom', 'marker', 'marker-color', 'provider', 'tile-url', 'interactive',
            'static-only', 'src', 'place', 'label', 'attribution', 'attribution-href', 'loading'];
    }

    /** @type {import('./interact.js').MapInteraction|null} */
    #interaction = null;
    /** @type {Promise<void> | null} */
    #activating = null;
    #renderGen = 0;
    #batching = false;
    #consented = false;
    /** Set after the user exits so eager mode does not re-activate. */
    #userExited = false;
    #preconnected = false;
    #readyFired = false;
    #uid = `geo-map-${++instance}`;

    /** @type {{ lat: number, lng: number } | null} */
    #center = null;
    #name = '';
    /** @type {Map<string, HTMLImageElement>} */
    #tileImgs = new Map();
    #lastSize = '';

    /** @type {ResizeObserver | null} */
    #ro = null;
    #resizeFrame = 0;
    /** @type {MutationObserver | null} */
    #modeObserver = null;
    /** @type {MediaQueryList | null} */
    #darkQuery = null;
    #onSchemeChange = () => this.#maybeRefreshAuto();
    #announceTimer = 0;
    #resolvedProvider = 'osm';

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

    /**
     * The marker-color attribute when it is a valid CSS colour, else ''
     * (the pin then uses --geo-map-marker-color / the theme token).
     * @returns {string}
     */
    get markerColor() {
        const v = this.getAttribute('marker-color');
        return isColor(v) ? /** @type {string} */ (v) : '';
    }

    get provider() {
        const p = this.getAttribute('provider');
        return p && (p in PROVIDERS || p === 'carto-auto') ? p : 'osm';
    }

    /**
     * URL template for first-party tile proxying. When set, `provider`
     * is ignored.
     * @returns {string}
     */
    get tileUrl() {
        return this.getAttribute('tile-url') || '';
    }

    get interactive() {
        const val = this.getAttribute('interactive');
        if (val === 'eager' || val === 'none') return val;
        return 'click';
    }

    get staticOnly() {
        return this.hasAttribute('static-only');
    }

    get loading() {
        const v = this.getAttribute('loading');
        return v === 'eager' || v === 'consent' ? v : 'lazy';
    }

    /**
     * True while interactive (pan / zoom) mode is active.
     * @returns {boolean}
     */
    get active() {
        return this.#interaction !== null;
    }

    /**
     * @param {string} key
     * @param {Record<string, string | number>} [vars]
     * @returns {string}
     */
    #label(key, vars = {}) {
        const raw = this.getAttribute(`data-label-${key}`) ?? LABELS[/** @type {keyof typeof LABELS} */ (key)] ?? '';
        return raw.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
    }

    get #canInteract() {
        return this.interactive !== 'none' && !this.staticOnly;
    }

    get #consentPending() {
        return this.loading === 'consent' && !this.#consented;
    }

    /** Provider after resolving carto-auto against data-mode / prefers-color-scheme. */
    #resolveProvider() {
        const p = this.provider;
        if (p !== 'carto-auto') return p;
        const mode = this.closest('[data-mode]')?.getAttribute('data-mode');
        if (mode === 'dark') return 'carto-dark';
        if (mode === 'light') return 'carto-light';
        return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'carto-dark' : 'carto-light';
    }

    /** Origin tiles are fetched from (for preconnect and the consent note). */
    #tileOrigin() {
        if (this.tileUrl) {
            try {
                return new URL(this.tileUrl.replace(/\{s\}/g, 'a'), location.href).origin;
            } catch { return ''; }
        }
        return (PROVIDERS[/** @type {keyof typeof PROVIDERS} */ (this.#resolvedProvider)] ?? PROVIDERS.osm).origin;
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

    /**
     * Accessible name: label attr → slotted <address> text → src address
     * text / JSON-LD name → place → "Map".
     * @returns {string}
     */
    #resolveName() {
        const clean = (/** @type {string | null | undefined} */ t) => (t || '').replace(/\s+/g, ' ').trim();
        const label = clean(this.getAttribute('label'));
        if (label) return label;
        let name = clean(this.querySelector('address')?.textContent);
        const srcId = this.getAttribute('src');
        if (!name && srcId) {
            const ref = document.getElementById(srcId);
            if (ref?.tagName === 'ADDRESS') name = clean(ref.textContent);
            else if (ref?.tagName === 'SCRIPT') {
                try { name = clean(JSON.parse(ref.textContent || '').name); } catch { /* malformed */ }
            }
        }
        if (!name) name = clean(this.getAttribute('place'));
        return name ? this.#label('map-of', { name }) : this.#label('map');
    }

    // ── Lifecycle ──────────────────────────────────────────────────

    setup() {
        this.#renderGen++;
        this.#resolvedProvider = this.#resolveProvider();
        this.render();
        this.#watchSize();
        this.#watchMode();
        this.#layout();
        if (this.interactive === 'eager' && !this.#userExited && this.#canInteract && !this.#consentPending && this.#center) {
            const gen = this.#renderGen;
            requestAnimationFrame(() => {
                if (gen === this.#renderGen) this.#activate({ focus: false });
            });
        }
    }

    /**
     * @param {string} name
     * @param {string | null} oldValue
     * @param {string | null} newValue
     */
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue || this.#batching) return;
        // Before the first upgrade connectedCallback renders everything once.
        if (!this.isConnected || !this.hasAttribute('data-upgraded')) return;
        this._reinit();
    }

    teardown() {
        this.#renderGen++;
        this.#activating = null;
        if (this.#interaction) {
            this.#interaction.destroy();
            this.#interaction = null;
            this.setState('active', false);
        }
        this.#ro?.disconnect();
        this.#ro = null;
        cancelAnimationFrame(this.#resizeFrame);
        this.#modeObserver?.disconnect();
        this.#modeObserver = null;
        this.#darkQuery?.removeEventListener('change', this.#onSchemeChange);
        this.#darkQuery = null;
        clearTimeout(this.#announceTimer);
    }

    #watchSize() {
        if (typeof ResizeObserver !== 'function') return;
        this.#ro = new ResizeObserver(() => {
            cancelAnimationFrame(this.#resizeFrame);
            this.#resizeFrame = requestAnimationFrame(() => this.#layout());
        });
        this.#ro.observe(this);
    }

    #watchMode() {
        if (this.provider !== 'carto-auto' || this.tileUrl) return;
        this.#modeObserver = new MutationObserver(() => this.#maybeRefreshAuto());
        this.#modeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-mode'] });
        this.#darkQuery = window.matchMedia?.('(prefers-color-scheme: dark)') ?? null;
        this.#darkQuery?.addEventListener('change', this.#onSchemeChange);
    }

    #maybeRefreshAuto() {
        if (this.#resolveProvider() !== this.#resolvedProvider) this._reinit();
    }

    // ── Data API (HTML-first / JS-first dual contract) ──────────────

    /**
     * Current map state.
     * @returns {{ lat?: number, lng?: number, zoom: number, marker: boolean, markerColor: string }}
     */
    get data() {
        return {
            lat: isNaN(this.lat) ? undefined : this.lat,
            lng: isNaN(this.lng) ? undefined : this.lng,
            zoom: this.zoom,
            marker: this.showMarker,
            markerColor: this.markerColor,
        };
    }

    /**
     * Set map state in one call: writes the attributes as one batch and
     * re-renders once. Assigning the current state is a no-op. An invalid
     * markerColor is ignored; '' / null clears it.
     * Emits geo-map:data-changed { data, source: 'property' }.
     */
    set data(value) {
        if (!value || typeof value !== 'object') return;
        const cur = this.data;
        const next = { ...cur };
        if (value.lat != null && !isNaN(Number(value.lat))) next.lat = Number(value.lat);
        if (value.lng != null && !isNaN(Number(value.lng))) next.lng = Number(value.lng);
        if (value.zoom != null && !isNaN(Number(value.zoom))) next.zoom = Number(value.zoom);
        if (value.marker != null) next.marker = Boolean(value.marker);
        if ('markerColor' in value) {
            if (isColor(value.markerColor)) next.markerColor = value.markerColor;
            else if (!value.markerColor) next.markerColor = '';
        }
        if (next.lat === cur.lat && next.lng === cur.lng && next.zoom === cur.zoom &&
            next.marker === cur.marker && next.markerColor === cur.markerColor) return;

        this.#batching = true;
        try {
            if (next.lat !== cur.lat) this.setAttribute('lat', String(next.lat));
            if (next.lng !== cur.lng) this.setAttribute('lng', String(next.lng));
            if (next.zoom !== cur.zoom) this.setAttribute('zoom', String(next.zoom));
            if (next.marker !== cur.marker) this.setAttribute('marker', next.marker ? 'true' : 'false');
            if (next.markerColor !== cur.markerColor) {
                if (next.markerColor) this.setAttribute('marker-color', next.markerColor);
                else this.removeAttribute('marker-color');
            }
        } finally {
            this.#batching = false;
        }
        if (this.hasAttribute('data-upgraded')) this._reinit();
        this.dispatchEvent(new CustomEvent('geo-map:data-changed', {
            detail: { data: this.data, source: 'property' },
            bubbles: true, composed: true,
        }));
    }

    /**
     * The marker as a single-element array `[{ lat, lng, color }]` when
     * coordinates resolve, else `[]`. Single-point today.
     * @returns {Array<{ lat: number, lng: number, color: string }>}
     */
    get markers() {
        const c = this.#resolveCoordinates();
        if (!c) return [];
        return [{ lat: c.lat, lng: c.lng, color: this.markerColor }];
    }

    // ── Rendering ───────────────────────────────────────────────────

    /** Build the shadow DOM (DOM APIs only — nothing is parsed as markup). */
    render() {
        const root = /** @type {ShadowRoot} */ (this.shadowRoot);
        const fallbackStyle = adoptStyles(root);
        this.removeAttribute('data-ready');
        this.#readyFired = false;
        this.#tileImgs = new Map();
        this.#lastSize = '';
        this.#center = this.#resolveCoordinates();
        this.#name = this.#resolveName();
        const hasCoords = this.#center !== null;
        const consentPending = hasCoords && this.#consentPending;

        const container = el('div', { part: 'container' });
        const viewport = el('div', { part: 'viewport', role: 'img', 'aria-label': this.#name });
        viewport.append(el('div', { part: 'tiles' }));
        if (this.showMarker && hasCoords) {
            const marker = buildMarker();
            if (this.markerColor) marker.style.setProperty('--_marker-color', this.markerColor);
            viewport.append(marker);
        }
        container.append(viewport);

        if (consentPending) {
            container.setAttribute('data-consent', '');
            const overlay = el('div', { part: 'overlay' });
            const btn = el('button', { part: 'activate', type: 'button' }, this.#label('consent'));
            const host = this.#tileOrigin().replace(/^https?:\/\//, '');
            const note = el('p', { part: 'consent-note' }, this.#label('consent-note', { host }));
            overlay.append(btn, note);
            overlay.addEventListener('click', () => this.#consent());
            const warm = () => this.#preconnect();
            overlay.addEventListener('pointerenter', warm, { once: true });
            btn.addEventListener('focus', warm, { once: true });
            container.append(overlay);
        } else if (hasCoords && this.#canInteract) {
            const overlay = el('div', { part: 'overlay' });
            overlay.append(el('button', { part: 'activate', type: 'button' }, this.#label('activate')));
            overlay.addEventListener('click', () => this.#activate({ focus: true }));
            container.append(overlay);
        }

        if (hasCoords && this.#canInteract) {
            const controls = el('div', { part: 'controls', role: 'group', 'aria-label': this.#label('controls') });
            /** @type {Array<[string, string, string, () => void]>} */
            const defs = [
                ['zoom-in', '+', this.#label('zoom-in'), () => this.#interaction?.zoomBy(1)],
                ['zoom-out', '−', this.#label('zoom-out'), () => this.#interaction?.zoomBy(-1)],
                ['recenter', '⌖', this.#label('recenter'), () => this.#interaction?.recenter()],
                ['exit', '✕', this.#label('exit'), () => this.#deactivate()],
            ];
            for (const [part, glyph, name, fn] of defs) {
                const b = el('button', { part: `control ${part}`, type: 'button', 'aria-label': name, title: name }, glyph);
                b.addEventListener('click', fn);
                controls.append(b);
            }
            container.append(controls);
        }

        const caption = el('div', { part: 'caption' });
        const slot = /** @type {HTMLSlotElement} */ (el('slot'));
        caption.append(slot);
        container.append(caption);
        const syncCaption = () => {
            const filled = slot.assignedNodes().some((n) => n.nodeType === 1 || (n.textContent || '').trim());
            container.toggleAttribute('data-caption', filled);
        };
        slot.addEventListener('slotchange', syncCaption);
        container.toggleAttribute('data-caption', [...this.childNodes].some((n) =>
            (n.nodeType === 1 && !/** @type {Element} */ (n).hasAttribute('slot')) ||
            (n.nodeType === 3 && (n.textContent || '').trim())));

        container.append(this.#buildAttribution());
        container.append(el('p', { part: 'instructions', id: `${this.#uid}-help`, hidden: '' }, this.#label('instructions')));
        container.append(el('p', { part: 'status', role: 'status', 'aria-live': 'polite' }));

        root.replaceChildren(...(fallbackStyle ? [fallbackStyle] : []), container);

        if (!hasCoords) this.handleError('Missing or invalid lat/lng coordinates', this.#label('error-coords'));
    }

    /** Provider credit, or the attribution attribute for tile-url, inside a named slot. */
    #buildAttribution() {
        const wrap = el('div', { part: 'attribution' });
        const slot = /** @type {HTMLSlotElement} */ (el('slot', { name: 'attribution' }));
        /** @type {Array<{ text: string, href?: string }>} */
        let credits;
        if (this.tileUrl) {
            const text = (this.getAttribute('attribution') || '').trim();
            const href = this.getAttribute('attribution-href') || '';
            credits = text ? [{ text, href }] : [];
        } else {
            credits = (PROVIDERS[/** @type {keyof typeof PROVIDERS} */ (this.#resolvedProvider)] ?? PROVIDERS.osm).credits;
        }
        credits.forEach((c, i) => {
            if (i) slot.append(document.createTextNode(' '));
            let safeHref = '';
            if (c.href) {
                try {
                    const u = new URL(c.href, location.href);
                    if (u.protocol === 'https:' || u.protocol === 'http:') safeHref = u.href;
                } catch { /* invalid URL → plain text */ }
            }
            slot.append(safeHref
                ? el('a', { href: safeHref, target: '_blank', rel: 'noopener noreferrer' }, c.text)
                : el('span', {}, c.text));
        });
        const sync = () => {
            wrap.hidden = credits.length === 0 && slot.assignedNodes().length === 0;
        };
        slot.addEventListener('slotchange', sync);
        wrap.hidden = credits.length === 0 && !this.querySelector(':scope > [slot="attribution"]');
        wrap.append(slot);
        return wrap;
    }

    #parts() {
        const root = /** @type {ShadowRoot} */ (this.shadowRoot);
        return {
            container: /** @type {HTMLElement | null} */ (root.querySelector('[part="container"]')),
            viewport: /** @type {HTMLElement | null} */ (root.querySelector('[part="viewport"]')),
            tiles: /** @type {HTMLElement | null} */ (root.querySelector('[part="tiles"]')),
            marker: /** @type {HTMLElement | null} */ (root.querySelector('[part="marker"]')),
            status: /** @type {HTMLElement | null} */ (root.querySelector('[part="status"]')),
        };
    }

    /**
     * (Re)lay out the static tile view to cover the current box. Runs on
     * setup and (debounced) on every resize; skipped while hidden (0×0)
     * and re-run when it becomes visible. Hands off to the interaction
     * when interactive mode is active.
     */
    #layout() {
        const w = this.clientWidth;
        const h = this.clientHeight;
        if (this.#interaction) {
            this.#interaction.resize(w, h);
            return;
        }
        if (!this.#center || this.#consentPending || !w || !h) return;
        const size = `${w}x${h}`;
        if (size === this.#lastSize) return;
        this.#lastSize = size;
        this.loadTiles(w, h);
    }

    /**
     * Place the tiles needed to cover a w×h box centred on the map centre.
     * Existing tiles are reused; tiles no longer needed are removed.
     * @param {number} [w]
     * @param {number} [h]
     */
    loadTiles(w = this.clientWidth, h = this.clientHeight) {
        const { tiles } = this.#parts();
        if (!tiles || !this.#center || !w || !h) return;
        const zoom = this.zoom;
        const { lat, lng } = this.#center;
        const center = latLngToWorldPixel(lat, lng, zoom);
        const maxTile = Math.pow(2, zoom);
        const left = center.x - w / 2;
        const top = center.y - h / 2;
        const x0 = Math.floor(left / 256);
        const x1 = Math.floor((left + w - 1) / 256);
        const y0 = Math.max(0, Math.floor(top / 256));
        const y1 = Math.min(maxTile - 1, Math.floor((top + h - 1) / 256));

        // Tiles are positioned relative to tile (x0, y0); the layer is shifted
        tiles.style.transform = `translate(${Math.round(x0 * 256 - left)}px, ${Math.round(y0 * 256 - top)}px)`;

        const keep = new Set();
        for (let ty = y0; ty <= y1; ty++) {
            for (let tx = x0; tx <= x1; tx++) {
                const key = `${tx}/${ty}`;
                keep.add(key);
                let img = this.#tileImgs.get(key);
                if (!img) {
                    const wrapped = ((tx % maxTile) + maxTile) % maxTile;
                    img = document.createElement('img');
                    img.alt = '';
                    img.loading = this.loading === 'eager' ? 'eager' : 'lazy';
                    img.decoding = 'async';
                    img.draggable = false;
                    img.addEventListener('load', () => this.#checkReady());
                    img.addEventListener('error', () => this.#checkReady());
                    img.src = getTileUrl(this.#resolvedProvider, zoom, wrapped, ty, this.tileUrl);
                    this.#tileImgs.set(key, img);
                    tiles.append(img);
                }
                img.style.left = `${(tx - x0) * 256}px`;
                img.style.top = `${(ty - y0) * 256}px`;
            }
        }
        for (const [key, img] of this.#tileImgs) {
            if (!keep.has(key)) {
                img.remove();
                this.#tileImgs.delete(key);
            }
        }
        this.#checkReady();
    }

    #checkReady() {
        if (this.#readyFired || this.#interaction || !this.#center || this.#tileImgs.size === 0) return;
        const imgs = [...this.#tileImgs.values()];
        if (!imgs.every((i) => i.complete)) return;
        this.#readyFired = true;
        if (imgs.every((i) => i.naturalWidth === 0)) {
            this.handleError('Failed to load map tiles', this.#label('error-tiles'));
            return;
        }
        this.setAttribute('data-ready', '');
        this.dispatchEvent(new CustomEvent('geo-map:ready', {
            bubbles: true,
            detail: { lat: this.#center.lat, lng: this.#center.lng, zoom: this.zoom },
        }));
    }

    // ── Consent / activation ────────────────────────────────────────

    /** The user agreed to load third-party tiles. */
    #consent() {
        this.#consented = true;
        this._reinit();
        if (this.#canInteract) this.#activate({ focus: true });
    }

    /**
     * Warm the tile origin while the user hovers / focuses the consent
     * button (tiles have not been requested yet, so it actually helps).
     * Same-origin tile URLs are skipped.
     */
    #preconnect() {
        if (this.#preconnected) return;
        this.#preconnected = true;
        const origin = this.#tileOrigin();
        if (!origin || origin === location.origin) return;
        if (document.head.querySelector(`link[rel~="preconnect" i][href="${CSS.escape(origin)}"]`)) return;
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = origin;
        // No crossorigin: tiles load as plain no-cors <img>, and a CORS-mode
        // preconnect opens a connection those fetches cannot reuse.
        document.head.appendChild(link);
    }

    /**
     * Activate interactive mode — lazy-load interact.js and hand off.
     * Concurrent calls share one pending promise; a disconnect or
     * re-render during the import cancels it.
     * @param {{ focus?: boolean }} [opts]
     * @returns {Promise<void>}
     */
    #activate({ focus = true } = {}) {
        if (this.#interaction) return Promise.resolve();
        if (this.#activating) return this.#activating;
        if (!this.#center || !this.#canInteract || this.#consentPending) return Promise.resolve();
        const gen = this.#renderGen;
        const p = (async () => {
            const { MapInteraction } = await import('./interact.js');
            if (!this.isConnected || gen !== this.#renderGen || this.#interaction || !this.#center) return;
            const { container, viewport, tiles, marker } = this.#parts();
            if (!container || !viewport || !tiles) return;

            for (const img of this.#tileImgs.values()) img.remove();
            this.#tileImgs.clear();

            container.setAttribute('data-active', '');
            viewport.setAttribute('role', 'region');
            viewport.setAttribute('aria-roledescription', 'map');
            viewport.setAttribute('aria-describedby', `${this.#uid}-help`);
            viewport.setAttribute('tabindex', '0');
            this.setState('active', true);

            const { lat, lng } = this.#center;
            this.#interaction = new MapInteraction({
                host: this,
                viewport,
                tiles,
                marker,
                lat,
                lng,
                zoom: this.zoom,
                provider: this.#resolvedProvider,
                tileUrl: this.tileUrl,
                width: this.clientWidth,
                height: this.clientHeight,
                onDeactivate: () => this.#deactivate(),
                onMove: (d) => this.#announce(d),
            });
            if (focus) viewport.focus({ preventScroll: true });

            this.dispatchEvent(new CustomEvent('geo-map:activate', {
                bubbles: true,
                detail: { lat, lng, zoom: this.zoom },
            }));
        })();
        this.#activating = p;
        p.finally(() => { if (this.#activating === p) this.#activating = null; });
        return p;
    }

    /**
     * Debounced polite announcement of the new centre / zoom.
     * @param {{ lat: number, lng: number, zoom: number }} d
     */
    #announce(d) {
        clearTimeout(this.#announceTimer);
        this.#announceTimer = window.setTimeout(() => {
            const { status } = this.#parts();
            if (status) status.textContent = this.#label('moved', { lat: d.lat.toFixed(4), lng: d.lng.toFixed(4), zoom: d.zoom });
        }, 400);
    }

    /** Leave interactive mode and return to the static view. */
    #deactivate() {
        if (!this.#interaction) return;
        const hadFocus = !!this.shadowRoot?.activeElement;
        this.#userExited = true;
        this._reinit();
        if (hadFocus) {
            /** @type {HTMLElement | null | undefined} */ (this.shadowRoot?.querySelector('[part="activate"]'))?.focus();
        }
    }

    /**
     * Error state: shown in the map surface, reported as geo-map:error.
     * @param {string} message - Event detail message (stable, English)
     * @param {string} [display] - Localised on-screen text
     */
    handleError(message, display = message) {
        const { container } = this.#parts();
        if (container) {
            container.setAttribute('data-state', 'error');
            container.setAttribute('data-error', display);
        }
        this.dispatchEvent(new CustomEvent('geo-map:error', {
            bubbles: true,
            detail: { message },
        }));
    }
}

registerComponent('geo-map', GeoMap);

export { GeoMap };
