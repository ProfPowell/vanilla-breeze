/**
 * bread-crumb: Hierarchical navigation trail.
 *
 * Two modes:
 * 1. HTML-first — wrap an existing <ol><li>...</li></ol>. Component
 *    applies role="navigation" + aria-label="Breadcrumb" if absent,
 *    sets aria-current="page" on the last crumb, and emits a
 *    BreadcrumbList JSON-LD <script>.
 * 2. Auto-from-pathname — set data-from-pathname and the component
 *    builds the <ol> from window.location.pathname. Override segment
 *    labels via the .labels property; override the final crumb label
 *    via data-current-label.
 *
 * @attr {boolean} data-from-pathname  - Auto-build from location.pathname.
 * @attr {string}  data-current-label  - Label for the final crumb.
 * @attr {string}  data-separator      - chevron|arrow|dot|pipe (CSS var).
 * @attr {boolean} data-collapsed      - Hide middle items.
 * @attr {string}  data-jsonld         - 'on' (default) | 'off'.
 *
 * @prop {Object<string,string>} labels
 *   Map of pathname-segment → display label. Keys can be a full
 *   pathname ('/docs/elements/') or a single segment ('elements').
 *
 * @example HTML-first
 * <bread-crumb>
 *   <ol>
 *     <li><a href="/docs/">Docs</a></li>
 *     <li><a href="/docs/elements/">Elements</a></li>
 *     <li><span aria-current="page">Bread Crumb</span></li>
 *   </ol>
 * </bread-crumb>
 *
 * @example Auto from pathname
 * <bread-crumb data-from-pathname data-current-label="My Page"></bread-crumb>
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

const HOME_LABEL = 'Home';

class BreadCrumb extends VBElement {
  #labels = {};

  setup() {
    if (!this.hasAttribute('role')) this.setAttribute('role', 'navigation');
    if (!this.hasAttribute('aria-label')) this.setAttribute('aria-label', 'Breadcrumb');

    if (this.hasAttribute('data-from-pathname')) {
      this.#renderFromPathname();
    } else {
      this.#adoptExistingMarkup();
    }

    this.#syncCurrentAria();
    this.#emitJsonLd();
  }

  /** Map of segment → label overrides. */
  get labels() {
    return { ...this.#labels };
  }
  set labels(value) {
    if (!value || typeof value !== 'object') return;
    this.#labels = { ...value };
    if (this.hasAttribute('data-from-pathname')) {
      this.#renderFromPathname();
      this.#syncCurrentAria();
      this.#emitJsonLd();
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

    let acc = '';
    segments.forEach((seg, i) => {
      acc += `/${seg}`;
      const isLast = i === segments.length - 1;
      const li = document.createElement('li');
      const fullPath = `${acc}/`;
      const label =
        this.#labels[fullPath] ||
        this.#labels[acc] ||
        this.#labels[seg] ||
        (isLast && this.dataset.currentLabel) ||
        this.#titleCase(seg);

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

  #titleCase(slug) {
    return slug
      .replace(/[-_]+/g, ' ')
      .replace(/\w\S*/g, t => t[0].toUpperCase() + t.slice(1));
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
    const items = this.querySelectorAll(':scope > ol > li');
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

  // ── JSON-LD ──────────────────────────────────────────────────────────

  #emitJsonLd() {
    if (this.dataset.jsonld === 'off') return;

    const items = Array.from(this.querySelectorAll(':scope > ol > li'));
    if (items.length === 0) return;

    const list = items.map((li, i) => {
      const link = li.querySelector('a, span');
      const name = link?.textContent?.trim() || '';
      const href = link?.getAttribute('href');
      const item = href ? new URL(href, window.location.origin).href : undefined;
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
