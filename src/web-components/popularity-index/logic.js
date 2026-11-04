import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

/**
 * popularity-index: Aggregated "most-visited" lens.
 *
 * Fetches `{ pages: [{ url, title?, views }] }` (or a bare array) from
 * `analytics-src` — by default VB's `/api/analytics/popular` Pages Function,
 * which aggregates page.view hits in D1. Titles missing from the payload are
 * filled from a pages.json record (`data-meta-src`, else `data-lens-src`),
 * which also supplies the provenance chip. Only `title` and `provenance` are
 * read from that record.
 *
 * State is reflected as `data-state="loading|ready|empty|unavailable"`
 * (`aria-busy="true"` while loading) so sites can hide the panel when there
 * is nothing to show: `popularity-index[data-state="unavailable"] { display: none }`.
 * Internal error detail is never rendered; it goes to `data-error` and the
 * console.
 *
 * @attr {string} analytics-src       Popularity endpoint (default "/api/analytics/popular")
 * @attr {string} data-meta-src       Optional pages.json URL for title/provenance enrichment
 * @attr {string} data-lens-src       Shared lens pages.json URL; metadata fallback
 * @attr {number} limit               Max entries shown (default 10, min 1)
 * @attr {string} window              Time window forwarded as ?window= ("24h", "7d", "30d")
 * @attr {number} data-heading-level  Heading level 1–6 (default 2); 0 renders no heading
 * @attr {string} data-label-heading      Heading text (default "Most visited")
 * @attr {string} data-label-view         Singular count noun (default "view")
 * @attr {string} data-label-views        Plural count noun (default "views")
 * @attr {string} data-label-unavailable  Message when the endpoint fails
 * @attr {string} data-label-empty        Message when there is no data yet
 *
 * @fires popularity-index:state - { state } after each load settles
 *
 * @example
 *   <popularity-index limit="10" window="7d"></popularity-index>
 */

const DEFAULT_ENDPOINT = '/api/analytics/popular';
const DEFAULT_LIMIT = 10;

const DEFAULT_LABELS = {
  heading: 'Most visited',
  view: 'view',
  views: 'views',
  unavailable: 'Popularity data is unavailable right now.',
  empty: 'Not enough data yet to surface most-visited pages.',
};

class PopularityIndex extends VBElement {
  static observedAttributes = [
    'analytics-src', 'window', 'limit', 'data-meta-src', 'data-lens-src',
    'data-heading-level',
  ];

  /** @type {AbortController | null} */
  #controller = null;
  #generation = 0;

  setup() {
    this.#scheduleLoad();
  }

  teardown() {
    this.#generation++;
    this.#controller?.abort();
    this.#controller = null;
  }

  attributeChangedCallback(_name, oldVal, newVal) {
    if (oldVal === newVal || !this.hasAttribute('data-upgraded')) return;
    this.#scheduleLoad();
  }

  /** Coalesce attribute bursts (and content-lens's forward + _reinit) into one fetch. */
  #scheduleLoad() {
    const gen = ++this.#generation;
    this.#controller?.abort();
    this.#controller = null;
    queueMicrotask(() => {
      if (gen !== this.#generation || !this.isConnected) return;
      this.#load(gen).catch(() => { /* rendered as unavailable */ });
    });
  }

  async #load(gen) {
    const controller = new AbortController();
    this.#controller = controller;
    const { signal } = controller;
    const current = () => gen === this.#generation && !signal.aborted;

    this.#setState('loading');
    this.#render(this.#heading());

    const endpoint = this.getAttribute('analytics-src') || DEFAULT_ENDPOINT;
    const url = new URL(endpoint, document.baseURI);
    const win = this.getAttribute('window');
    if (win) url.searchParams.set('window', win);

    const metaSrc = this.getAttribute('data-meta-src') || this.getAttribute('data-lens-src');

    // Start both requests together; enrichment is optional and never blocks.
    const pagesP = fetch(url, { credentials: 'omit', signal }).then((res) => {
      if (!res.ok) throw new Error(`status ${res.status}`);
      return res.json();
    });
    const metaP = metaSrc
      ? fetch(new URL(metaSrc, document.baseURI), { credentials: 'omit', signal })
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => null)
      : Promise.resolve(null);

    let payload;
    try {
      payload = await pagesP;
    } catch (err) {
      if (!current()) return;
      const msg = err instanceof Error ? err.message : String(err);
      this.setAttribute('data-error', msg);
      console.warn('[popularity-index] endpoint unavailable:', msg);
      this.#settle('unavailable', this.#message('unavailable'));
      return;
    }

    const meta = await metaP;
    if (!current()) return;

    const raw = Array.isArray(payload?.pages) ? payload.pages : (Array.isArray(payload) ? payload : []);
    const metaList = Array.isArray(meta) ? meta : (Array.isArray(meta?.pages) ? meta.pages : []);
    const metaIndex = new Map(metaList.filter((p) => p && typeof p.url === 'string').map((p) => [p.url, p]));

    const items = [];
    for (const p of raw) {
      if (!p || typeof p.url !== 'string') continue;
      const href = safeHref(p.url);
      if (!href) continue;
      items.push({ p, href, meta: metaIndex.get(p.url) || {} });
      if (items.length >= this.#limit()) break;
    }

    if (!items.length) {
      this.#settle('empty', this.#message('empty'));
      return;
    }
    this.#settle('ready', this.#list(items));
  }

  // ── Rendering (DOM APIs only — payload text never touches innerHTML) ──

  #settle(state, body) {
    if (state !== 'unavailable') this.removeAttribute('data-error');
    this.#render(this.#heading(), body);
    this.#setState(state);
    this.dispatchEvent(new CustomEvent('popularity-index:state', { bubbles: true, detail: { state } }));
  }

  #setState(state) {
    this.setAttribute('data-state', state);
    if (state === 'loading') this.setAttribute('aria-busy', 'true');
    else this.removeAttribute('aria-busy');
  }

  /** @param {...(Node | null)} nodes */
  #render(...nodes) {
    this.replaceChildren(...nodes.filter((n) => n !== null));
  }

  #heading() {
    const raw = this.getAttribute('data-heading-level');
    const n = raw == null || raw === '' ? 2 : Number.parseInt(raw, 10);
    if (n === 0) return null;
    const level = Number.isFinite(n) ? Math.min(6, Math.max(1, n)) : 2;
    const h = document.createElement(`h${level}`);
    h.className = 'popularity-heading';
    h.textContent = this.#label('heading');
    return h;
  }

  #message(key) {
    const p = document.createElement('p');
    p.className = 'popularity-empty';
    p.textContent = this.#label(key);
    return p;
  }

  #list(items) {
    const locale = this.#locale();
    const compact = new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 });
    const plural = new Intl.PluralRules(locale);

    const ol = document.createElement('ol');
    ol.className = 'popularity-list';
    for (const { p, href, meta } of items) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = href;
      a.textContent = String(p.title || meta.title || p.url);

      const views = Math.max(0, Number(p.views ?? p.count ?? 0) || 0);
      const small = document.createElement('small');
      const noun = plural.select(views) === 'one' ? this.#label('view') : this.#label('views');
      small.append(`${compact.format(views)} ${noun}`);

      if (typeof meta.provenance === 'string' && meta.provenance) {
        const chip = document.createElement('span');
        chip.className = 'popularity-prov';
        chip.dataset.provenance = meta.provenance;
        chip.textContent = meta.provenance;
        small.append(' · ', chip);
      }
      li.append(a, small);
      ol.append(li);
    }
    return ol;
  }

  #limit() {
    const n = Number.parseInt(this.getAttribute('limit') ?? '', 10);
    return Number.isFinite(n) ? Math.max(1, n) : DEFAULT_LIMIT;
  }

  #label(key) {
    return this.getAttribute(`data-label-${key}`) || DEFAULT_LABELS[key];
  }

  #locale() {
    const lang = this.closest('[lang]')?.getAttribute('lang') || undefined;
    try {
      return Intl.getCanonicalLocales(lang)[0];
    } catch {
      return undefined;
    }
  }
}

/**
 * Allow http(s) URLs and same-origin paths. Rejects javascript:/data: and
 * scheme-relative (`//host`, `/\host`) links that would leave the site.
 * @param {string} raw
 * @returns {string | null}
 */
function safeHref(raw) {
  const value = raw.trim();
  if (!value) return null;
  let url;
  try {
    url = new URL(value, location.href);
  } catch {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(value);
  if (!hasScheme && url.origin !== location.origin) return null;
  return hasScheme ? url.href : value;
}

registerComponent('popularity-index', PopularityIndex);

export { PopularityIndex, safeHref };
