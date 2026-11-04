import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';
import {
  STORAGE_KEY,
  PAUSE_KEY,
  SHOW_ANCHORS_KEY,
  CHANGE_EVENT,
  read,
  write,
  isPaused,
  isShowingAnchors,
  setPaused,
  setShowAnchors,
  currentUrl,
  trackCurrent,
} from '../../utils/recently-visited-init.js';

/**
 * recently-visited: Device-local reader history lens.
 *
 * Renders the reader's local visit history (localStorage key
 * `vb:recently-visited`). Recording is done by the opt-in tracker in
 * src/utils/recently-visited-init.js: pages are recorded when they carry
 * `<meta name="vb:track-history" content="on">` or contain this element, and
 * never under `<html data-vb-no-track>` or `<meta name="vb:no-track-history">`.
 *
 * Reader sovereignty controls (Pause / Anchors / Clear) live in the header.
 * They are built once and updated in place, so focus stays put when they are
 * used; toggles keep a static label and carry state in aria-pressed.
 *
 * @attr {number}  limit               Max page groups rendered (default 25)
 * @attr {boolean} include-current     Also list the page the reader is on
 * @attr {number}  data-heading-level  Heading level 1–6 (default 2); 0 renders no heading
 * @attr {string}  data-label-heading    Heading text (default "Recently visited")
 * @attr {string}  data-label-explainer  Privacy note under the heading
 * @attr {string}  data-label-pause      Pause toggle label (default "Pause tracking")
 * @attr {string}  data-label-anchors    Anchor toggle label (default "Show anchor visits")
 * @attr {string}  data-label-clear      Clear button label (default "Clear history")
 * @attr {string}  data-label-empty      Message when there is no history
 * @attr {string}  data-label-anchor-one   Count noun when Intl.PluralRules selects "one" (default "anchor")
 * @attr {string}  data-label-anchor-other Count noun otherwise (default "anchors")
 *
 * @fires recently-visited:clear          - after the reader clears the history
 * @fires recently-visited:pause-toggle   - { paused }
 * @fires recently-visited:anchors-toggle - { showAnchors }
 *
 * @example
 *   <recently-visited limit="20"></recently-visited>
 */

const DEFAULT_LIMIT = 25;
const REFRESH_MS = 60_000;

const DEFAULT_LABELS = {
  heading: 'Recently visited',
  explainer: 'Stored on this device only. Never sent to a server.',
  pause: 'Pause tracking',
  anchors: 'Show anchor visits',
  clear: 'Clear history',
  empty: 'No recently visited pages yet.',
  'anchor-one': 'anchor',
  'anchor-other': 'anchors',
};

const WATCHED_KEYS = new Set([STORAGE_KEY, PAUSE_KEY, SHOW_ANCHORS_KEY]);

class RecentlyVisited extends VBElement {
  static observedAttributes = [
    'limit', 'include-current', 'data-heading-level',
    ...Object.keys(DEFAULT_LABELS).map((k) => `data-label-${k}`),
  ];

  /** @type {HTMLElement | null} */
  #body = null;
  /** @type {ReturnType<typeof setInterval> | undefined} */
  #timer;

  setup() {
    /* This element's presence opts the page in; record it before rendering
       (the tracker dedupes, so a reconnect or a second instance is a no-op). */
    trackCurrent();
    this.#build();
    this.#update();

    this.listen(this, 'click', (e) => this.#onClick(/** @type {MouseEvent} */ (e)));
    this.listen(window, 'storage', (e) => {
      const { key } = /** @type {StorageEvent} */ (e);
      if (key === null || WATCHED_KEYS.has(key)) this.#update();
    });
    this.listen(window, CHANGE_EVENT, () => this.#update());
    this.#timer = setInterval(() => this.#refreshTimes(), REFRESH_MS);
  }

  teardown() {
    clearInterval(this.#timer);
    this.#timer = undefined;
    this.#body = null;
  }

  attributeChangedCallback(_name, oldVal, newVal) {
    if (oldVal === newVal || !this.hasAttribute('data-upgraded')) return;
    this.#build();
    this.#update();
  }

  // ── Data API (read-only — content is derived from localStorage) ──────

  /**
   * The stored visit history, most recent first: `{ url, hash, title,
   * hashTitle, ts }` records (ts in epoch ms). Expired (30-day TTL),
   * malformed and off-origin records are already filtered out. There is no
   * setter — the tracker owns writes.
   *
   * @returns {Array<{ url: string, hash: string, title: string, hashTitle: string, ts: number }>}
   */
  get entries() {
    return read();
  }

  // ── Structure (built once per setup / attribute change) ──────────────

  #build() {
    const header = document.createElement('header');
    header.className = 'recently-visited-header';
    const heading = this.#heading();
    if (heading) header.append(heading);

    const menu = document.createElement('menu');
    menu.className = 'recently-visited-actions';
    menu.append(
      this.#control('pause', 'pause'),
      this.#control('anchors', 'hash'),
      this.#control('clear', 'trash-2'),
    );
    header.append(menu);

    const explainer = document.createElement('p');
    explainer.className = 'recently-visited-explainer';
    const small = document.createElement('small');
    small.textContent = this.#label('explainer');
    explainer.append(small);

    this.#body = document.createElement('section');
    this.#body.className = 'recently-visited-body';

    this.replaceChildren(header, explainer, this.#body);
  }

  #heading() {
    const raw = this.getAttribute('data-heading-level');
    const n = raw == null || raw === '' ? 2 : Number.parseInt(raw, 10);
    if (n === 0) return null;
    const level = Number.isFinite(n) ? Math.min(6, Math.max(1, n)) : 2;
    const h = document.createElement(`h${level}`);
    h.className = 'recently-visited-heading';
    h.textContent = this.#label('heading');
    return h;
  }

  /**
   * @param {'pause' | 'anchors' | 'clear'} action
   * @param {string} icon
   */
  #control(action, icon) {
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'icon-button';
    button.setAttribute(`data-recently-visited-${action}`, '');
    const label = this.#label(action);
    button.setAttribute('aria-label', label);
    button.title = label;
    const iconEl = document.createElement('icon-wc');
    iconEl.setAttribute('name', icon);
    iconEl.setAttribute('size', 'sm');
    button.append(iconEl);
    li.append(button);
    return li;
  }

  // ── State + list (updated in place) ──────────────────────────────────

  #update() {
    if (!this.#body) return;
    const entries = read();
    const paused = isPaused();
    const showAnchors = isShowingAnchors();

    this.querySelector('[data-recently-visited-pause]')?.setAttribute('aria-pressed', String(paused));
    this.querySelector('[data-recently-visited-anchors]')?.setAttribute('aria-pressed', String(showAnchors));
    /* aria-disabled (not disabled) so a focused Clear keeps focus once the
       history is empty. */
    this.querySelector('[data-recently-visited-clear]')?.setAttribute('aria-disabled', String(entries.length === 0));

    /* Remember which link had focus so a re-render (another tab, a hash
       change) does not drop the reader back to <body>. */
    const active = document.activeElement;
    const focusedHref = active instanceof HTMLAnchorElement && this.#body.contains(active)
      ? active.getAttribute('href')
      : null;
    const openUrls = new Set(
      [...this.#body.querySelectorAll('details[open]')].map((d) => d.getAttribute('data-url')),
    );

    const exclude = this.hasAttribute('include-current') ? null : currentUrl();
    const groups = groupByUrl(entries)
      .filter((g) => g.url !== exclude)
      .slice(0, this.#limit());

    if (groups.length === 0) {
      const p = document.createElement('p');
      p.className = 'recently-visited-empty';
      p.textContent = this.#label('empty');
      this.#body.replaceChildren(p);
    } else {
      this.#body.replaceChildren(this.#list(groups, showAnchors, openUrls));
    }

    if (focusedHref !== null) {
      const match = [...this.#body.querySelectorAll('a')].find((a) => a.getAttribute('href') === focusedHref);
      match?.focus();
    }
  }

  /**
   * @param {ReturnType<typeof groupByUrl>} groups
   * @param {boolean} showAnchors
   * @param {Set<string | null>} openUrls
   */
  #list(groups, showAnchors, openUrls) {
    const locale = this.#locale();
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    const plural = new Intl.PluralRules(locale);
    const num = new Intl.NumberFormat(locale);

    const ol = document.createElement('ol');
    ol.className = 'recently-visited-list';
    for (const g of groups) {
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.href = g.url;
      link.textContent = g.title || g.url;

      if (showAnchors && g.anchors.length > 0) {
        /* Page with anchor sub-visits — a <details> per page. */
        li.className = 'has-anchors';
        const details = document.createElement('details');
        details.setAttribute('data-url', g.url);
        if (openUrls.has(g.url)) details.open = true;
        const summary = document.createElement('summary');
        const meta = document.createElement('small');
        const count = g.anchors.length;
        const noun = this.#label(plural.select(count) === 'one' ? 'anchor-one' : 'anchor-other');
        meta.append(`${num.format(count)} ${noun} · `, timeEl(g.ts, rtf));
        summary.append(link, meta);

        const ul = document.createElement('ul');
        ul.className = 'recently-visited-anchors';
        for (const a of g.anchors) {
          const ali = document.createElement('li');
          const alink = document.createElement('a');
          alink.href = g.url + a.hash;
          alink.textContent = a.hashTitle;
          const asmall = document.createElement('small');
          asmall.append(timeEl(a.ts, rtf));
          ali.append(alink, asmall);
          ul.append(ali);
        }
        details.append(summary, ul);
        li.append(details);
      } else {
        const small = document.createElement('small');
        small.append(timeEl(g.ts, rtf));
        li.append(link, small);
      }
      ol.append(li);
    }
    return ol;
  }

  #refreshTimes() {
    const rtf = new Intl.RelativeTimeFormat(this.#locale(), { numeric: 'auto' });
    for (const t of this.querySelectorAll('time[datetime]')) {
      t.textContent = relativeTime(Date.parse(t.getAttribute('datetime') || ''), rtf);
    }
  }

  // ── Actions ──────────────────────────────────────────────────────────

  /** @param {MouseEvent} e */
  #onClick(e) {
    const target = /** @type {Element} */ (e.target);
    const button = target.closest?.('button');
    if (!button || !this.contains(button)) return;

    if (button.hasAttribute('data-recently-visited-clear')) {
      if (button.getAttribute('aria-disabled') === 'true') return;
      write([]);
      this.dispatchEvent(new CustomEvent('recently-visited:clear', { bubbles: true }));
    } else if (button.hasAttribute('data-recently-visited-pause')) {
      const paused = !isPaused();
      setPaused(paused);
      this.dispatchEvent(new CustomEvent('recently-visited:pause-toggle', {
        bubbles: true,
        detail: { paused },
      }));
    } else if (button.hasAttribute('data-recently-visited-anchors')) {
      const showAnchors = !isShowingAnchors();
      setShowAnchors(showAnchors);
      this.dispatchEvent(new CustomEvent('recently-visited:anchors-toggle', {
        bubbles: true,
        detail: { showAnchors },
      }));
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────────

  #limit() {
    const n = Number.parseInt(this.getAttribute('limit') ?? '', 10);
    return Number.isFinite(n) && n > 0 ? n : DEFAULT_LIMIT;
  }

  /** @param {keyof typeof DEFAULT_LABELS} key */
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
 * Group flat entries into per-URL records: page-level info (url, most recent
 * title and ts) plus the anchor visits. Sorted most recent first.
 * @param {ReturnType<typeof read>} entries
 */
function groupByUrl(entries) {
  /** @type {Map<string, { url: string, title: string, ts: number, anchors: Array<{ hash: string, hashTitle: string, ts: number }> }>} */
  const groups = new Map();
  for (const e of entries) {
    let g = groups.get(e.url);
    if (!g) {
      g = { url: e.url, title: e.title, ts: e.ts, anchors: [] };
      groups.set(e.url, g);
    }
    if (e.ts > g.ts) {
      g.ts = e.ts;
      if (e.title) g.title = e.title;
    } else if (!g.title && e.title) {
      g.title = e.title;
    }
    if (e.hash) {
      g.anchors.push({ hash: e.hash, hashTitle: e.hashTitle || e.hash.slice(1), ts: e.ts });
    }
  }
  for (const g of groups.values()) g.anchors.sort((a, b) => b.ts - a.ts);
  return [...groups.values()].sort((a, b) => b.ts - a.ts);
}

/**
 * @param {number} ts
 * @param {Intl.RelativeTimeFormat} rtf
 */
function timeEl(ts, rtf) {
  const t = document.createElement('time');
  t.dateTime = new Date(ts).toISOString();
  t.textContent = relativeTime(ts, rtf);
  return t;
}

/**
 * @param {number} ts
 * @param {Intl.RelativeTimeFormat} rtf
 */
function relativeTime(ts, rtf) {
  if (!Number.isFinite(ts)) return '';
  const secs = Math.max(0, (Date.now() - ts) / 1000);
  if (secs < 60) return rtf.format(0, 'second');
  if (secs < 3600) return rtf.format(-Math.floor(secs / 60), 'minute');
  if (secs < 86_400) return rtf.format(-Math.floor(secs / 3600), 'hour');
  return rtf.format(-Math.floor(secs / 86_400), 'day');
}

registerComponent('recently-visited', RecentlyVisited);

export { RecentlyVisited };
