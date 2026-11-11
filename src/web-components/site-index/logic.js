import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';
import { fragmentClick } from '../_shared/fragment-link.js';

/**
 * site-index: Interactive site keyword index
 *
 * Enhances a hand-authored keyword index with one filter box, an A-Z jump
 * strip, a term count per letter and an optional display limit.
 *
 * The index is an explicit `<nav data-index>`, else the host's direct-child
 * `<nav>` that holds `<section>`s — no particular aria-label is required, so
 * authors can localise it freely.
 *
 * @attr {string}  placeholder - Search input placeholder (default "Filter index…")
 * @attr {string}  letters     - Jump nav mode: "entries" (default) | "all" | "none"
 * @attr {string}  filter      - What the filter matches: "all" (default: terms and page titles) | "topic" (terms only)
 * @attr {number}  limit       - Max entries per letter before "Show more" toggle
 * @attr {string}  src         - URL to load index data from (optional)
 * @attr {string}  data-label-* - UI string overrides (see LABELS)
 *
 * @example
 * <site-index letters="all" limit="5">
 *   <nav aria-label="Site index">
 *     <section id="index-a"><h2>A</h2><ul>...</ul></section>
 *   </nav>
 * </site-index>
 */

/** Default UI strings — each overridable with data-label-<key>. */
const LABELS = {
  controls: 'Filter the index',
  jump: 'Jump to letter',
  terms: '{count} terms',
  'terms-one': '1 term',
  more: 'Show {count} more',
  less: 'Show less',
  matches: '{count} terms match',
  'matches-one': '1 term matches',
  'no-matches': 'No matches',
};

const BASE_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

/**
 * Only http(s), relative and fragment hrefs from `src` JSON become links.
 * @param {unknown} href
 * @returns {string|null}
 */
function safeHref(href) {
  if (typeof href !== 'string' || !href.trim()) return null;
  try {
    const u = new URL(href, document.baseURI);
    return u.protocol === 'http:' || u.protocol === 'https:' ? href : null;
  } catch {
    return null;
  }
}

class SiteIndex extends VBElement {
  /** @type {IntersectionObserver|null} */
  #observer = null;
  /** @type {HTMLInputElement|null} */
  #searchInput = null;
  /** @type {HTMLOutputElement|null} */
  #status = null;

  setup() {
    // Jump-nav letters are relative "#index-x" hrefs (the scroll-spy compares
    // them verbatim); keep them on the page under <base href>.
    this.listen(this, 'click', fragmentClick);
    const src = this.getAttribute('src');
    if (src) {
      this.#loadFromSrc(src).then(() => { if (this.isConnected) this.#enhance(); });
    } else {
      this.#enhance();
    }
  }

  teardown() {
    this.#observer?.disconnect();
    this.#observer = null;
  }

  /**
   * @param {keyof typeof LABELS} key
   * @param {number} [count]
   */
  #label(key, count) {
    const text = this.getAttribute(`data-label-${key}`) ?? LABELS[key];
    return count == null ? text : text.replace('{count}', String(count));
  }

  get #lang() {
    return this.closest('[lang]')?.getAttribute('lang') || document.documentElement.lang || undefined;
  }

  /**
   * The index nav: an explicit `nav[data-index]`, else the direct-child nav
   * that holds sections.
   * @returns {HTMLElement|null}
   */
  #indexNav() {
    return this.querySelector('nav[data-index]')
      ?? this.querySelector(':scope > nav:has(> section)');
  }

  /** @returns {HTMLElement[]} */
  #sections() {
    const nav = this.#indexNav();
    return nav ? /** @type {HTMLElement[]} */ ([...nav.querySelectorAll(':scope > section')]) : [];
  }

  /** Letter for a section: from its id ("index-é" → "É"), locale-aware. */
  #letterOf(/** @type {Element} */ section) {
    const raw = section.id?.replace(/^index-/, '');
    if (!raw) return '';
    let decoded = raw;
    try { decoded = decodeURIComponent(raw); } catch { /* keep raw */ }
    return decoded.toLocaleUpperCase(this.#lang);
  }

  #enhance() {
    this.#addCounts();
    this.#buildControls();

    const letters = this.getAttribute('letters') || 'entries';
    if (letters !== 'none') {
      this.#buildJumpNav(letters === 'all');
    }

    this.#applyDisplayLimit();
    if (this.#searchInput?.value) this.#filter(this.#searchInput.value);
  }

  /* ── Entry counts ── */

  /** @param {number} n */
  #termsLabel(n) {
    return n === 1 ? this.#label('terms-one') : this.#label('terms', n);
  }

  /** Terms under a letter. @param {Element} section */
  #termCount(section) {
    return section.querySelectorAll(':scope > ul > li').length;
  }

  /**
   * Each letter heading says how many terms it holds. The references are
   * listed under every term, so a count per term would only repeat them.
   */
  #addCounts() {
    for (const section of this.#sections()) {
      const count = this.#termCount(section);
      const h2 = section.querySelector('h2');
      // Reconnect guard: setup() re-runs, the badge moved back with the host.
      if (!h2 || !count || h2.querySelector('.index-count')) continue;
      const badge = document.createElement('span');
      badge.className = 'index-count';
      badge.textContent = this.#termsLabel(count);
      h2.append(' ', badge);
    }
  }

  /* ── Controls bar ── */

  #buildControls() {
    // Reconnect guard: setup() re-runs on every reconnect, but the controls
    // (and their listeners, which are not listen()-tracked) moved back with
    // the host — building again would stack a second controls bar.
    if (this.querySelector(':scope > [data-index-controls]')) return;

    // A search landmark of form controls — not a navigation landmark
    const controls = document.createElement('search');
    controls.setAttribute('data-index-controls', '');
    controls.setAttribute('aria-label', this.#label('controls'));

    /* Search input */
    const label = this.getAttribute('placeholder') || 'Filter index…';
    const input = document.createElement('input');
    input.type = 'search';
    input.placeholder = label;
    input.setAttribute('aria-label', label);
    input.setAttribute('data-index-search', '');
    input.addEventListener('input', () => this.#filter(input.value));
    this.#searchInput = input;
    controls.append(input);

    /* Live result count */
    const status = document.createElement('output');
    status.setAttribute('role', 'status');
    status.setAttribute('data-index-status', '');
    this.#status = status;
    controls.append(status);

    /* Insert before the index nav */
    const nav = this.#indexNav();
    if (nav) {
      nav.before(controls);
    } else {
      this.prepend(controls);
    }
  }

  /* ── Jump nav ── */

  /** @param {boolean} showAll */
  #buildJumpNav(showAll) {
    const existing = this.querySelector(':scope > .index-jump');
    if (existing) existing.remove();

    /** @type {Map<string, string>} letter → section id */
    const present = new Map();
    for (const s of this.#sections()) {
      const letter = this.#letterOf(s);
      if (letter) present.set(letter, s.id);
    }

    if (present.size === 0) return;

    const collator = new Intl.Collator(this.#lang, { sensitivity: 'base' });
    const letters = showAll
      ? [...new Set([...BASE_LETTERS, ...present.keys()])]
      : [...present.keys()];
    letters.sort((a, b) => collator.compare(a, b) || a.localeCompare(b));

    const jumpNav = document.createElement('nav');
    jumpNav.className = 'index-jump';
    jumpNav.setAttribute('aria-label', this.#label('jump'));

    const ol = document.createElement('ol');
    ol.className = 'inline';

    for (const letter of letters) {
      const li = document.createElement('li');
      const id = present.get(letter);

      if (id) {
        const a = document.createElement('a');
        a.setAttribute('href', `#${id}`);
        a.textContent = letter;
        // A hover hint only: the letter stays the link's name, the heading it
        // jumps to carries the same count as text.
        const section = this.querySelector(`#${CSS.escape(id)}`);
        if (section) a.title = this.#termsLabel(this.#termCount(section));
        li.append(a);
      } else {
        const span = document.createElement('span');
        span.textContent = letter;
        span.setAttribute('aria-disabled', 'true');
        li.append(span);
      }

      ol.append(li);
    }

    jumpNav.append(ol);

    const controls = this.querySelector(':scope > [data-index-controls]');
    const indexNav = this.#indexNav();
    if (controls) {
      controls.after(jumpNav);
    } else if (indexNav) {
      indexNav.before(jumpNav);
    } else {
      this.prepend(jumpNav);
    }

    this.#initScrollSpy(jumpNav);
  }

  /* ── Scroll-spy ── */

  /** @param {HTMLElement} jumpNav */
  #initScrollSpy(jumpNav) {
    const links = jumpNav.querySelectorAll('a');
    if (!links.length) return;

    const sections = this.#sections();
    if (!sections.length) return;

    this.#observer?.disconnect();
    this.#observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            for (const link of links) {
              const isActive = link.getAttribute('href') === `#${id}`;
              link.setAttribute('aria-current', isActive ? 'true' : 'false');
            }
          }
        }
      },
      { rootMargin: '-20% 0px -60% 0px' }
    );

    for (const section of sections) {
      this.#observer.observe(section);
    }
  }

  /* ── Display limit / expand-collapse ── */

  #applyDisplayLimit() {
    const limitStr = this.getAttribute('limit');
    if (!limitStr) return;

    const limit = parseInt(limitStr, 10);
    if (!limit || limit < 1) return;

    for (const section of this.#sections()) {
      const items = [...section.querySelectorAll(':scope > ul > li')];
      if (items.length <= limit) continue;
      // Reconnect guard — see #buildControls.
      if (section.querySelector(':scope > [data-index-expand]')) continue;

      const overflow = /** @type {HTMLElement[]} */ (items.slice(limit));
      for (const item of overflow) {
        item.hidden = true;
        item.setAttribute('data-index-overflow', '');
      }

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('data-index-expand', '');
      btn.setAttribute('aria-expanded', 'false');
      btn.textContent = this.#label('more', overflow.length);

      btn.addEventListener('click', () => {
        const expand = btn.getAttribute('aria-expanded') !== 'true';
        for (const item of overflow) item.hidden = !expand;
        btn.setAttribute('aria-expanded', String(expand));
        btn.textContent = expand ? this.#label('less') : this.#label('more', overflow.length);
      });

      const ul = section.querySelector(':scope > ul');
      if (ul) ul.after(btn);
    }
  }

  /* ── Search / filter ── */

  /** @param {string} query */
  #filter(query) {
    const lang = this.#lang;
    const q = query.toLocaleLowerCase(lang).trim();
    const scope = this.getAttribute('filter') === 'topic' ? 'topic' : 'all';
    let total = 0;

    for (const section of this.#sections()) {
      const items = /** @type {NodeListOf<HTMLElement>} */ (section.querySelectorAll(':scope > ul > li'));
      const expandBtn = section.querySelector(':scope > [data-index-expand]');
      const expanded = expandBtn?.getAttribute('aria-expanded') === 'true';
      let hasMatch = false;
      let matched = 0;

      for (const item of items) {
        const termText = item.querySelector('.index-term')?.textContent?.toLocaleLowerCase(lang) || '';
        let matches = !q || termText.includes(q);

        if (!matches && scope === 'all') {
          for (const ref of item.querySelectorAll('.index-refs a')) {
            if ((ref.textContent || '').toLocaleLowerCase(lang).includes(q)) {
              matches = true;
              break;
            }
          }
        }

        if (matches) { hasMatch = true; matched++; total++; }
        // With no query the display limit applies again; with a query every
        // match shows, overflow included
        const overflowHidden = !q && item.hasAttribute('data-index-overflow') && !expanded;
        item.hidden = !matches || overflowHidden;
      }

      section.hidden = !hasMatch;
      // The heading and its jump letter count what is showing: the matches
      // while a filter is on, every term otherwise.
      this.#showCount(section, q ? matched : this.#termCount(section));
      // "Show N more" makes no sense while a filter decides what shows
      if (expandBtn) /** @type {HTMLElement} */ (expandBtn).hidden = !!q;
    }

    if (this.#status) {
      this.#status.textContent = !q ? ''
        : total === 0 ? this.#label('no-matches')
        : total === 1 ? this.#label('matches-one')
        : this.#label('matches', total);
    }

    this.#updateJumpNavState();
  }

  /**
   * @param {Element} section
   * @param {number} count
   */
  #showCount(section, count) {
    const text = this.#termsLabel(count);
    const badge = section.querySelector('h2 > .index-count');
    if (badge && badge.textContent !== text) badge.textContent = text;
    if (!section.id) return;
    const link = this.querySelector(`:scope > .index-jump a[href="#${CSS.escape(section.id)}"]`);
    if (link) link.setAttribute('title', text);
  }

  #updateJumpNavState() {
    const jumpNav = this.querySelector(':scope > .index-jump');
    if (!jumpNav) return;

    for (const section of this.#sections()) {
      if (!section.id) continue;
      const link = /** @type {HTMLElement | null} */ (
        [...jumpNav.querySelectorAll('a')].find((a) => a.getAttribute('href') === `#${section.id}`) ?? null);
      if (!link) continue;
      // Styled by `.index-jump [aria-disabled="true"]` — no inline style
      if (section.hidden) {
        link.setAttribute('aria-disabled', 'true');
        link.setAttribute('tabindex', '-1');
      } else {
        link.removeAttribute('aria-disabled');
        link.removeAttribute('tabindex');
      }
    }
  }

  /* ── Data-driven rendering ── */

  /** @param {string} url */
  async #loadFromSrc(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      this.#renderFromData(data);
    } catch {
      /* Network error — fall back to static HTML */
    }
  }

  /**
   * Build the index nav from `[{ term, refs: [{ href, label, type? }] }]`.
   * Every string goes in as text; only http(s)/relative/fragment hrefs link.
   * @param {unknown} data
   */
  #renderFromData(data) {
    if (!Array.isArray(data)) return;
    const lang = this.#lang;

    /** @type {Map<string, any[]>} */
    const grouped = new Map();
    for (const entry of data) {
      if (!entry || typeof entry !== 'object') continue;
      const term = String(entry.term ?? '');
      const first = [...term.trim()][0];
      const letter = first ? first.toLocaleUpperCase(lang) : '#';
      if (!grouped.has(letter)) grouped.set(letter, []);
      grouped.get(letter)?.push(entry);
    }

    const existing = this.#indexNav();
    const nav = document.createElement('nav');
    nav.setAttribute('data-index', '');
    nav.setAttribute('aria-label', existing?.getAttribute('aria-label') || 'Site index');

    const collator = new Intl.Collator(lang, { sensitivity: 'base' });
    const letters = [...grouped.keys()].sort((a, b) => collator.compare(a, b) || a.localeCompare(b));

    for (const letter of letters) {
      const section = document.createElement('section');
      section.id = `index-${letter.toLocaleLowerCase(lang)}`;
      const h2 = document.createElement('h2');
      h2.textContent = letter;
      section.append(h2);

      const ul = document.createElement('ul');
      for (const entry of grouped.get(letter) ?? []) {
        const li = document.createElement('li');
        const term = document.createElement('span');
        term.className = 'index-term';
        term.textContent = String(entry.term ?? '');
        li.append(term);

        if (Array.isArray(entry.refs) && entry.refs.length) {
          const refs = document.createElement('ul');
          refs.className = 'index-refs';
          for (const r of entry.refs) {
            if (!r || typeof r !== 'object') continue;
            const refLi = document.createElement('li');
            const href = safeHref(r.href);
            const label = String(r.label ?? r.href ?? '');
            if (href) {
              const a = document.createElement('a');
              a.setAttribute('href', href);
              a.textContent = label;
              refLi.append(a);
            } else {
              refLi.append(label);
            }
            if (r.type) {
              const small = document.createElement('small');
              small.textContent = String(r.type);
              refLi.append(' ', small);
            }
            refs.append(refLi);
          }
          li.append(refs);
        }
        ul.append(li);
      }
      section.append(ul);
      nav.append(section);
    }

    if (existing) {
      existing.replaceWith(nav);
    } else {
      this.append(nav);
    }
  }
}

registerComponent('site-index', SiteIndex);

export { SiteIndex };
