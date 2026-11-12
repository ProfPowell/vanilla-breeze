import './enhance-data-icon.js';
import { styles } from './styles.js';
import { registerComponent } from '../../lib/bundle-registry.js';
import { buildIconUrl, resolveIconSet, resolveIconBase } from '../../lib/icon-url.js';
import { sanitizeSVG } from '../../lib/sanitize-html.js';

/** Default set, also the fallback when another set lacks an icon. */
const FALLBACK_SET = 'lucide';

/**
 * Sets whose `<base>/<set>.json` name manifest is NOT consulted: the default
 * set (always fetched directly) and `custom`, which projects extend by
 * dropping SVGs in without regenerating the manifest.
 */
const NO_MANIFEST = new Set([FALLBACK_SET, 'custom']);

/**
 * Sanitized, dimensionless SVG templates keyed by full URL (base/set/name).
 * Instances clone from here, so each file is fetched, parsed and sanitized once.
 * @type {Map<string, SVGElement>}
 */
const svgCache = new Map();

/**
 * Negative cache: URLs that answered non-OK or with invalid SVG. Never refetched.
 * @type {Set<string>}
 */
const missCache = new Set();

/**
 * In-flight fetches, deduplicated by URL.
 * @type {Map<string, Promise<SVGElement>>}
 */
const inflight = new Map();

/**
 * Per-set name manifests keyed by `<base>/<set>`, loaded once. Resolves to
 * null when the manifest is missing or malformed (then icons are fetched directly).
 * @type {Map<string, Promise<Set<string> | null>>}
 */
const manifests = new Map();

/**
 * @param {string} base
 * @param {string} set
 * @returns {Promise<Set<string> | null>}
 */
function loadManifest(base, set) {
    const key = `${base}/${set}`;
    let p = manifests.get(key);
    if (!p) {
        p = fetch(`${key}.json`)
            .then((r) => (r.ok ? r.json() : null))
            .then((names) => (Array.isArray(names) ? new Set(names.map(String)) : null))
            .catch(() => null);
        manifests.set(key, p);
    }
    return p;
}

/**
 * Parse SVG text into a sanitized, dimensionless `<svg>` element, or null.
 * @param {string} text
 * @returns {SVGElement | null}
 */
function parseSVG(text) {
    if (!text.includes('<svg')) return null;
    const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
    const svg = doc.documentElement;
    if (!svg || svg.localName !== 'svg' || doc.querySelector('parsererror')) return null;
    sanitizeSVG(svg);
    // Remove fixed dimensions so the host's size preset controls sizing
    svg.removeAttribute('width');
    svg.removeAttribute('height');
    return /** @type {SVGElement} */ (/** @type {unknown} */ (document.importNode(svg, true)));
}

/**
 * Single-flight, cached fetch of one icon file.
 * @param {string} url
 * @returns {Promise<SVGElement>} the cached template (clone before inserting)
 */
function fetchIcon(url) {
    const hit = svgCache.get(url);
    if (hit) return Promise.resolve(hit);
    if (missCache.has(url)) return Promise.reject(new Error(`Icon not found: ${url}`));
    let p = inflight.get(url);
    if (!p) {
        p = fetch(url).then(async (response) => {
            if (!response.ok) {
                missCache.add(url);
                throw new Error(`Icon not found: ${url}`);
            }
            const svg = parseSVG(await response.text());
            if (!svg) {
                missCache.add(url);
                throw new Error(`Invalid SVG: ${url}`);
            }
            svgCache.set(url, svg);
            return svg;
        }).finally(() => inflight.delete(url));
        inflight.set(url, p);
    }
    return p;
}

/**
 * Resolve an icon: the requested set (skipping the fetch when its manifest
 * says the name is absent), then the Lucide fallback.
 * @param {string} base
 * @param {string} set
 * @param {string} name
 * @returns {Promise<SVGElement>}
 */
async function resolveIcon(base, set, name) {
    if (set !== FALLBACK_SET) {
        const manifest = NO_MANIFEST.has(set) ? null : await loadManifest(base, set);
        if (!manifest || manifest.has(name)) {
            try {
                return await fetchIcon(buildIconUrl({ basePath: base, set, name }));
            } catch { /* fall back to lucide */ }
        }
    }
    return fetchIcon(buildIconUrl({ basePath: base, set: FALLBACK_SET, name }));
}

/**
 * @class IconWc
 * @augments HTMLElement
 * @description Inline SVG icon. Fetches one SVG file per icon from
 * `<base>/<set>/<name>.svg`, sanitizes it, and renders it in shadow DOM.
 *
 * @example
 * <icon-wc name="menu"></icon-wc>
 * <icon-wc name="arrow-right" size="lg" data-flip-rtl></icon-wc>
 * <icon-wc name="logo" set="custom"></icon-wc>
 *
 * @attr {string} name - Icon name (required, matches filename without .svg)
 * @attr {string} set - Icon set; defaults to the nearest data-icon-set, then lucide
 * @attr {string} size - Icon size: xs, sm, md, lg, xl, 2xl (default: md)
 * @attr {string} label - Accessible label for functional icons
 * @attr {string} base-path - Icon base URL; defaults to <html data-icon-path>, then the icons/ folder beside the loaded bundle
 * @attr {boolean} data-flip-rtl - Mirror the glyph horizontally in RTL contexts
 */
class IconWc extends HTMLElement {
    /** @type {Set<IconWc>} */
    static #instances = new Set();
    /** @type {MutationObserver | null} */
    static #observer = null;

    /**
     * One document-level observer re-resolves instances when data-icon-set
     * (on <html> or any ancestor) or <html data-icon-path> changes.
     */
    static #initObserver() {
        if (IconWc.#observer) return;
        IconWc.#observer = new MutationObserver((records) => {
            const root = document.documentElement;
            for (const rec of records) {
                const target = /** @type {Element} */ (rec.target);
                for (const inst of IconWc.#instances) {
                    if (target === root || target.contains(inst)) inst.#update();
                }
            }
        });
        IconWc.#observer.observe(document.documentElement, {
            subtree: true,
            attributes: true,
            attributeFilter: ['data-icon-set', 'data-icon-path'],
        });
    }

    static get observedAttributes() {
        return ['name', 'set', 'label', 'base-path'];
    }

    /** Load token: bumped per request so stale fetch results are dropped. */
    #token = 0;
    /** Key (`base|set|name`) of the SVG currently rendered. */
    #shownKey = '';
    /** Key of the request in flight. */
    #pendingKey = '';
    /** Key that last failed (misses are negative-cached; don't re-warn). */
    #failedKey = '';
    /** @type {(() => void) | null} */
    #onThemeChange = null;

    constructor() {
        super();
        const root = this.attachShadow({ mode: 'open' });
        root.innerHTML = `<style>${styles}</style><slot></slot>`;
    }

    /** @returns {string} The icon name */
    get name() {
        return this.getAttribute('name') || '';
    }

    /** @returns {string} `set` attribute, else nearest data-icon-set (self, ancestor, <html>), else lucide */
    get set() {
        return this.getAttribute('set') || resolveIconSet(this);
    }

    /** @returns {string} The size preset */
    get size() {
        return this.getAttribute('size') || 'md';
    }

    /** @returns {string|null} Accessible label */
    get label() {
        return this.getAttribute('label');
    }

    /** @returns {string} `base-path` attribute, else <html data-icon-path>, else icons/ beside the loaded bundle */
    get basePath() {
        return this.getAttribute('base-path') || resolveIconBase();
    }

    /** @returns {string} URL of the requested icon (before any Lucide fallback) */
    get iconPath() {
        return buildIconUrl({ basePath: this.basePath, set: this.set, name: this.name });
    }

    connectedCallback() {
        IconWc.#instances.add(this);
        IconWc.#initObserver();
        this.#update();

        // Force SVG repaint when theme changes (shadow DOM may not re-resolve currentColor)
        this.#onThemeChange = () => {
            const svg = this.#svg();
            if (svg) {
                svg.style.stroke = 'none';
                requestAnimationFrame(() => { svg.style.stroke = ''; });
            }
        };
        window.addEventListener('vb:theme-change', this.#onThemeChange);
        this.setAttribute('data-upgraded', '');
    }

    disconnectedCallback() {
        this.removeAttribute('data-upgraded');
        IconWc.#instances.delete(this);
        if (this.#onThemeChange) {
            window.removeEventListener('vb:theme-change', this.#onThemeChange);
            this.#onThemeChange = null;
        }
    }

    /**
     * @param {string} name
     * @param {string|null} oldValue
     * @param {string|null} newValue
     */
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue || !this.isConnected) return;
        if (name === 'label') this.#applyA11y();
        else this.#update();
    }

    /** @returns {SVGElement | null} */
    #svg() {
        return this.shadowRoot?.querySelector('svg') ?? null;
    }

    /** Load the icon unless the wanted one is already shown or in flight. */
    #update() {
        const name = this.name;
        const key = `${this.basePath}|${this.set}|${name}`;
        // Already rendered (e.g. reconnect), loading, or known-missing: nothing to do
        if (key === this.#shownKey) { this.#applyA11y(); return; }
        if (key === this.#pendingKey || key === this.#failedKey) return;
        const token = ++this.#token;
        this.#pendingKey = key;
        this.#failedKey = '';
        if (!name) {
            this.#pendingKey = '';
            this.#setError('No icon name specified', key);
            return;
        }
        const base = this.basePath;
        const set = this.set;
        resolveIcon(base, set, name).then(
            (template) => {
                if (token !== this.#token) return; // stale: name/set changed mid-fetch
                this.#pendingKey = '';
                this.#display(/** @type {SVGElement} */ (template.cloneNode(true)), key);
            },
            (error) => {
                if (token !== this.#token) return;
                this.#pendingKey = '';
                this.#setError(error.message, key);
            },
        );
    }

    /**
     * Swap the rendered SVG in place (no shadow-root rebuild, no flash).
     * @param {SVGElement} svg
     * @param {string} key
     */
    #display(svg, key) {
        const root = /** @type {ShadowRoot} */ (this.shadowRoot);
        const current = this.#svg() || root.querySelector('slot');
        if (current) current.replaceWith(svg);
        else root.append(svg);
        this.#shownKey = key;
        this.removeAttribute('data-error');
        this.#applyA11y();
    }

    /** Sync role/aria-label/aria-hidden with `label`, in both directions. */
    #applyA11y() {
        const svg = this.#svg();
        if (!svg) return;
        const label = this.label;
        if (label) {
            svg.setAttribute('role', 'img');
            svg.setAttribute('aria-label', label);
            svg.removeAttribute('aria-hidden');
        } else {
            svg.removeAttribute('role');
            svg.removeAttribute('aria-label');
            svg.setAttribute('aria-hidden', 'true');
        }
    }

    /**
     * @param {string} message
     * @param {string} key
     */
    #setError(message, key) {
        this.#failedKey = key;
        this.setAttribute('data-error', 'true');
        console.warn(`icon-wc: ${message}`);
        // Drop any stale glyph; restore the slot so light-DOM fallback content shows
        const svg = this.#svg();
        if (svg) svg.replaceWith(document.createElement('slot'));
        this.#shownKey = '';
    }
}

registerComponent('icon-wc', IconWc);

export { IconWc };
