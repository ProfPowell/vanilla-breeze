/**
 * bread-crumb: Hierarchical navigation trail.
 *
 * Canonical markup wraps the component in a <nav> so the landmark exists
 * without JavaScript:
 *
 *   <nav aria-label="Breadcrumb">
 *     <bread-crumb>
 *       <ol>…</ol>
 *     </bread-crumb>
 *   </nav>
 *
 * Two modes:
 * 1. HTML-first — wrap an existing <ol><li>...</li></ol>. The component
 *    sets aria-current="page" on the last crumb and emits a BreadcrumbList
 *    JSON-LD <script>. When it is NOT inside a navigation landmark it
 *    applies role="navigation" + aria-label="Breadcrumb" as a fallback
 *    (never a nested/duplicate landmark).
 * 2. Auto-from-pathname — set data-from-pathname and the component
 *    builds the <ol> from window.location.pathname. Override segment
 *    labels via the .labels property; data-current-label always wins for
 *    the final crumb.
 *
 * data-collapsed hides every crumb except the first, the parent
 * (second-to-last) and the current page. With JS an ellipsis <button>
 * (aria-expanded) after the first crumb reveals the hidden crumbs.
 *
 * @attr {boolean} data-from-pathname  - Auto-build from location.pathname.
 * @attr {string}  data-current-label  - Label for the final crumb.
 * @attr {string}  data-separator      - chevron|arrow|dot|pipe (CSS var).
 * @attr {boolean} data-collapsed      - Hide middle items behind a toggle.
 * @attr {string}  data-jsonld         - 'on' (default) | 'off'.
 *
 * @property {Record<string, string>} labels
 *   Map of pathname-segment → display label. Keys can be a full
 *   pathname ('/docs/elements/') or a single segment ('elements').
 *
 * @fires bread-crumb:upgraded - After setup completes.
 * @fires bread-crumb:toggle   - When the collapse toggle expands/collapses. detail: { expanded }
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

const HOME_LABEL = 'Home';
const TOGGLE_LABEL = 'Show full path';
/** Crumbs, excluding the injected collapse toggle item. */
const CRUMBS = ':scope > ol > li:not([data-crumb-toggle])';
/** Collapse hides crumbs only when there are more than first + parent + current. */
const MIN_COLLAPSIBLE = 4;

/**
 * decodeURIComponent that tolerates malformed escape sequences.
 * @param {string} seg
 */
function safeDecode(seg) {
  try {
    return decodeURIComponent(seg);
  } catch {
    return seg;
  }
}

class BreadCrumb extends VBElement {
  /** @type {Record<string, string>} */
  #labels = {};
  /** True when role/aria-label were added by this component (not the author). */
  #ownsRole = false;
  #ownsLabel = false;

  static get observedAttributes() {
    return ['data-collapsed'];
  }

  setup() {
    this.#syncLandmark();

    if (this.hasAttribute('data-from-pathname')) {
      this.#renderFromPathname();
    } else {
      this.#adoptExistingMarkup();
    }

    this.#syncCurrentAria();
    this.#syncToggle();
    this.#emitJsonLd();

    this.listen(this, 'click', (e) => {
      const target = /** @type {Element | null} */ (e.target instanceof Element ? e.target : null);
      const button = target?.closest('[data-crumb-toggle] > button');
      if (!button || !this.contains(button)) return;
      const expanded = button.getAttribute('aria-expanded') !== 'true';
      button.setAttribute('aria-expanded', String(expanded));
      this.dispatchEvent(new CustomEvent('bread-crumb:toggle', {
        bubbles: true,
        detail: { expanded },
      }));
    });
  }

  /**
   * @param {string} name
   * @param {string | null} oldValue
   * @param {string | null} newValue
   */
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue || !this.hasAttribute('data-upgraded')) return;
    if (name === 'data-collapsed') this.#syncToggle();
  }

  /** Map of segment → label overrides. */
  get labels() {
    return { ...this.#labels };
  }
  set labels(value) {
    if (!value || typeof value !== 'object') return;
    this.#labels = { ...value };
    if (this.isConnected && this.hasAttribute('data-from-pathname')) {
      this.#renderFromPathname();
      this.#syncCurrentAria();
      this.#syncToggle();
      this.#emitJsonLd();
    }
  }

  // ── Landmark ─────────────────────────────────────────────────────────

  /**
   * Fallback landmark only. Inside an author <nav> (the documented
   * canonical markup) a second navigation role would nest a duplicate
   * landmark, so any role we previously added is removed instead.
   */
  #syncLandmark() {
    const insideNav = !!this.parentElement?.closest('nav, [role="navigation"]');
    if (insideNav) {
      if (this.#ownsRole) this.removeAttribute('role');
      if (this.#ownsLabel) this.removeAttribute('aria-label');
      this.#ownsRole = false;
      this.#ownsLabel = false;
      return;
    }
    if (!this.hasAttribute('role')) {
      this.setAttribute('role', 'navigation');
      this.#ownsRole = true;
    }
    if (!this.hasAttribute('aria-label') && !this.hasAttribute('aria-labelledby')) {
      this.setAttribute('aria-label', 'Breadcrumb');
      this.#ownsLabel = true;
    }
  }

  // ── Auto-render ──────────────────────────────────────────────────────

  #renderFromPathname() {
    const path = window.location.pathname;
    const segments = path.split('/').filter(Boolean);
    const ol = document.createElement('ol');

    /* Always include Home */
    const home = document.createElement('li');
    const homeLink = document.createElement('a');
    homeLink.href = '/';
    homeLink.textContent = this.#labels['/'] || this.#labels.home || HOME_LABEL;
    home.appendChild(homeLink);
    ol.appendChild(home);

    const currentLabel = this.dataset.currentLabel;
    let acc = '';
    segments.forEach((seg, i) => {
      acc += `/${seg}`;
      const isLast = i === segments.length - 1;
      const li = document.createElement('li');
      const fullPath = `${acc}/`;
      const decoded = safeDecode(seg);
      const label =
        (isLast && currentLabel) ||
        this.#labels[fullPath] ||
        this.#labels[acc] ||
        this.#labels[safeDecode(fullPath)] ||
        this.#labels[decoded] ||
        this.#labels[seg] ||
        this.#titleCase(decoded);

      if (isLast) {
        const span = document.createElement('span');
        span.setAttribute('aria-current', 'page');
        span.textContent = label;
        li.appendChild(span);
      } else {
        const a = document.createElement('a');
        a.href = fullPath;
        a.textContent = label;
        li.appendChild(a);
      }
      ol.appendChild(li);
    });

    /* Replace any existing <ol> we previously rendered */
    const existing = this.querySelector(':scope > ol');
    if (existing) existing.replaceWith(ol);
    else this.prepend(ol);
  }

  /** @param {string} slug */
  #titleCase(slug) {
    return slug
      .replace(/[-_]+/g, ' ')
      .replace(/\S+/g, t => t[0].toUpperCase() + t.slice(1));
  }

  // ── HTML-first adoption ──────────────────────────────────────────────

  #adoptExistingMarkup() {
    /* If author wrote a flat list of <a>s without a wrapping <ol>,
       upgrade them into a proper ordered list. */
    const ol = this.querySelector(':scope > ol');
    if (ol) return;

    const anchors = Array.from(this.querySelectorAll(':scope > a, :scope > span'));
    if (anchors.length === 0) return;
    const newOl = document.createElement('ol');
    anchors.forEach(node => {
      const li = document.createElement('li');
      li.appendChild(node);
      newOl.appendChild(li);
    });
    this.prepend(newOl);
  }

  // ── ARIA ─────────────────────────────────────────────────────────────

  #syncCurrentAria() {
    const items = this.querySelectorAll(CRUMBS);
    if (items.length === 0) return;
    items.forEach((li, i) => {
      const isLast = i === items.length - 1;
      const link = li.querySelector('a, span');
      if (!link) return;
      if (isLast) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  // ── Collapse toggle ──────────────────────────────────────────────────

  /**
   * data-collapsed hides the middle crumbs with CSS; this injects a real
   * button (as its own <li>, after the first crumb) so the hidden crumbs
   * stay reachable. Removed again when collapse no longer applies.
   */
  #syncToggle() {
    const ol = this.querySelector(':scope > ol');
    const existing = ol?.querySelector(':scope > li[data-crumb-toggle]');
    const crumbs = this.querySelectorAll(CRUMBS);
    const wanted = !!ol && this.hasAttribute('data-collapsed') && crumbs.length >= MIN_COLLAPSIBLE;

    if (!wanted) {
      existing?.remove();
      return;
    }

    const li = existing || document.createElement('li');
    if (!existing) {
      li.setAttribute('data-crumb-toggle', '');
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-expanded', 'false');
      button.setAttribute('aria-label', TOGGLE_LABEL);
      button.textContent = '…';
      li.appendChild(button);
    }
    /* Keep it directly after the first crumb */
    if (crumbs[0].nextElementSibling !== li) crumbs[0].after(li);
  }

  // ── JSON-LD ──────────────────────────────────────────────────────────

  #emitJsonLd() {
    if (this.dataset.jsonld === 'off') return;

    const items = Array.from(this.querySelectorAll(CRUMBS));
    if (items.length === 0) return;

    const list = items.map((li, i) => {
      const link = li.querySelector('a, span');
      const name = link?.textContent?.trim() || '';
      /* The anchor's resolved .href honours <base> and the document URL,
         so relative hrefs (e.g. "../") resolve correctly. */
      const item = link instanceof HTMLAnchorElement && link.hasAttribute('href')
        ? link.href
        : undefined;
      return {
        '@type': 'ListItem',
        position: i + 1,
        name,
        ...(item ? { item } : {}),
      };
    });

    const payload = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: list,
    };

    let script = /** @type {HTMLScriptElement | null} */ (this.querySelector(':scope > script[type="application/ld+json"]'));
    if (!script) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      this.appendChild(script);
    }
    script.textContent = JSON.stringify(payload);
  }
}

registerComponent('bread-crumb', BreadCrumb);
