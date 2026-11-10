import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';
import { copyText } from '../../utils/copy-init.js';
import { fragmentClick, goToFragment } from '../_shared/fragment-link.js';

/**
 * glossary-index: Interactive glossary with search and scroll-spy
 *
 * Wraps a static glossary page to add live filtering and active letter
 * tracking in the jump nav (aria-current="true"). With `permalinks`, every
 * term with an id also gets a "#" link that follows the fragment and
 * copies the term's URL to the clipboard (for authors who link to terms;
 * most glossaries are linked TO from prose and do not need it).
 *
 * Filtering walks dt/dd groups (several dt sharing one dd, several dd per
 * dt, or <div>-wrapped groups), announces the match count, shows an empty
 * state, and marks jump links to emptied sections aria-disabled.
 *
 * @attr {string} placeholder - Placeholder text for the search input
 * @attr {boolean} permalinks - Add a copy-link "#" beside each term that has an id
 * @attr {string} data-label-filter - Accessible name of the search input (default "Filter glossary terms")
 * @attr {string} data-label-matches-one / data-label-matches-other - Match-count announcement, {count} replaced (any Intl.PluralRules category)
 * @attr {string} data-label-all-one / data-label-all-other - Announcement when the filter is cleared
 * @attr {string} data-label-empty - Visible empty-state message (default "No terms match your filter.")
 * @attr {string} data-label-permalink - Permalink name prefix (default "Copy link to")
 * @attr {string} data-label-copied - Announcement after copying (default "Link copied to clipboard")
 *
 * @fires glossary-index:filter - { query, matchCount } after the filter is applied
 *
 * @example
 * <glossary-index placeholder="Filter terms...">
 *   <h1>Glossary</h1>
 *   <nav class="glossary-jump" aria-label="Jump to letter">
 *     <ol class="inline">
 *       <li><a href="#glossary-a">A</a></li>
 *     </ol>
 *   </nav>
 *   <section class="glossary-section" id="glossary-a">
 *     <h2>A</h2>
 *     <dl>
 *       <dt id="term-api"><dfn>API</dfn></dt>
 *       <dd>A defined interface...</dd>
 *     </dl>
 *   </section>
 * </glossary-index>
 */

const LABELS = /** @type {Record<string, string>} */ ({
  'filter': 'Filter glossary terms',
  'matches-one': '{count} term matches',
  'matches-other': '{count} terms match',
  'all-one': 'Showing {count} term',
  'all-other': 'Showing all {count} terms',
  'empty': 'No terms match your filter.',
  'permalink': 'Copy link to',
  'copied': 'Link copied to clipboard',
});

const SECTIONS = '.glossary-section, section[id^="glossary-"]';
const COPIED_DURATION = 1500;

/**
 * Split a <dl> into term groups: one or more dt followed by one or more dd.
 * A <div> child is its own group (the HTML dl > div grouping form).
 * @param {Element} dl
 * @returns {Array<{ dts: HTMLElement[], dds: HTMLElement[], wrapper: HTMLElement | null }>}
 */
export function termGroups(dl) {
  /** @type {Array<{ dts: HTMLElement[], dds: HTMLElement[], wrapper: HTMLElement | null }>} */
  const groups = [];
  /** @type {{ dts: HTMLElement[], dds: HTMLElement[], wrapper: HTMLElement | null } | null} */
  let current = null;
  for (const child of /** @type {HTMLElement[]} */ ([...dl.children])) {
    if (child.localName === 'div') {
      /** @type {{ dts: HTMLElement[], dds: HTMLElement[], wrapper: HTMLElement | null }} */
      const g = { dts: [], dds: [], wrapper: child };
      for (const c of /** @type {HTMLElement[]} */ ([...child.children])) {
        if (c.localName === 'dt') g.dts.push(c);
        else if (c.localName === 'dd') g.dds.push(c);
      }
      groups.push(g);
      current = null;
    } else if (child.localName === 'dt') {
      if (!current || current.dds.length) {
        current = { dts: [], dds: [], wrapper: null };
        groups.push(current);
      }
      current.dts.push(child);
    } else if (child.localName === 'dd') {
      if (!current) {
        current = { dts: [], dds: [], wrapper: null };
        groups.push(current);
      }
      current.dds.push(child);
    }
  }
  return groups;
}

class GlossaryIndex extends VBElement {
  /** @type {HTMLElement | null} */
  #search = null;
  /** @type {HTMLElement | null} */
  #status = null;
  /** @type {HTMLElement | null} */
  #empty = null;
  /** rAF handle for the scroll-spy; 0 when idle. */
  #spyFrame = 0;
  /** @type {HTMLAnchorElement[]} */
  #permalinks = [];
  /** @type {Map<Element, ReturnType<typeof setTimeout>>} */
  #timers = new Map();
  #query = '';

  setup() {
    this.#query = '';
    this.listen(this, 'click', this.#onClick);
    this.listen(this, 'click', fragmentClick);
    this.#addSearch();
    if (this.hasAttribute('permalinks')) this.#addPermalinks();
    this.#initScrollSpy();
  }

  teardown() {
    cancelAnimationFrame(this.#spyFrame);
    this.#spyFrame = 0;
    for (const t of this.#timers.values()) clearTimeout(t);
    this.#timers.clear();
    // Undo filtering, then remove everything this component added.
    if (this.#query) this.#filter('', { silent: true });
    this.#search?.remove();
    this.#status?.remove();
    this.#empty?.remove();
    for (const a of this.#permalinks) a.remove();
    for (const link of this.querySelectorAll('.glossary-jump a[aria-current]')) link.removeAttribute('aria-current');
    this.#search = null;
    this.#status = null;
    this.#empty = null;
    this.#permalinks = [];
  }

  /* ── Search ── */

  #addSearch() {
    const search = document.createElement('search');
    search.className = 'glossary-search';
    const input = document.createElement('input');
    input.type = 'search';
    input.placeholder = this.getAttribute('placeholder') || 'Filter terms…';
    input.setAttribute('aria-label', this.#label('filter'));
    search.append(input);
    this.listen(input, 'input', () => this.#filter(input.value));

    const status = document.createElement('p');
    status.className = 'glossary-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.setAttribute('aria-atomic', 'true');

    const empty = document.createElement('p');
    empty.className = 'glossary-empty';
    empty.textContent = this.#label('empty');
    empty.hidden = true;

    // Placement: top of an inner <main>; otherwise just before the jump nav
    // (i.e. after the page heading and lead); otherwise after the first
    // heading; otherwise first.
    const main = this.querySelector('main');
    const jump = this.querySelector('.glossary-jump');
    const heading = this.querySelector(':scope > :is(h1, h2, h3, h4, h5, h6)');
    if (main) main.prepend(search, status);
    else if (jump?.parentElement) jump.before(search, status);
    else if (heading) heading.after(search, status);
    else this.prepend(search, status);

    // Empty state goes after the last section (where the results would be).
    const sections = this.querySelectorAll(SECTIONS);
    const last = sections[sections.length - 1];
    if (last) last.after(empty);
    else status.after(empty);

    this.#search = search;
    this.#status = status;
    this.#empty = empty;
  }

  /**
   * @param {string} raw
   * @param {{ silent?: boolean }} [opts] - silent: no announcement or event (teardown)
   */
  #filter(raw, { silent = false } = {}) {
    const lang = this.#lang();
    const lower = (/** @type {string} */ s) => { try { return s.toLocaleLowerCase(lang); } catch { return s.toLowerCase(); } };
    const q = lower(raw.trim());
    const wasFiltering = this.#query !== '';
    this.#query = q;
    let matchCount = 0;
    let total = 0;
    /** @type {Set<string>} */
    const emptied = new Set();

    for (const sec of /** @type {NodeListOf<HTMLElement>} */ (this.querySelectorAll(SECTIONS))) {
      let hasMatch = false;
      for (const dl of sec.querySelectorAll('dl')) {
        for (const g of termGroups(dl)) {
          if (!g.dts.length) continue;
          total += g.dts.length;
          // Match the term (dfn/dt text without the permalink glyph).
          const text = lower(g.dts.map((dt) => this.#termText(dt)).join(' '));
          const matches = !q || text.includes(q);
          if (g.wrapper) g.wrapper.hidden = !matches;
          for (const el of [...g.dts, ...g.dds]) el.hidden = !matches;
          if (matches) { hasMatch = true; matchCount += g.dts.length; }
        }
      }
      sec.hidden = !hasMatch;
      if (!hasMatch && sec.id) emptied.add(sec.id);
    }

    // Jump links to emptied sections are disabled while filtering.
    for (const link of /** @type {NodeListOf<HTMLAnchorElement>} */ (this.querySelectorAll('.glossary-jump a[href^="#"]'))) {
      const id = decodeURIComponent((link.getAttribute('href') ?? '').slice(1));
      if (emptied.has(id)) {
        if (!link.hasAttribute('aria-disabled')) {
          link.setAttribute('aria-disabled', 'true');
          link.setAttribute('data-glossary-disabled', '');
        }
      } else if (link.hasAttribute('data-glossary-disabled')) {
        link.removeAttribute('aria-disabled');
        link.removeAttribute('data-glossary-disabled');
      }
    }

    if (this.#empty) this.#empty.hidden = !q || matchCount > 0;
    if (silent) return;
    if (this.#status && (q || wasFiltering)) {
      const message = q ? this.#plural('matches', matchCount) : this.#plural('all', total);
      const status = this.#status;
      status.textContent = '';
      requestAnimationFrame(() => { status.textContent = message; });
    }

    this.dispatchEvent(new CustomEvent('glossary-index:filter', {
      bubbles: true,
      detail: { query: q, matchCount },
    }));
  }

  /* ── Permalinks ── */

  #addPermalinks() {
    for (const dt of /** @type {NodeListOf<HTMLElement>} */ (this.querySelectorAll(`:is(${SECTIONS}) dl dt[id]`))) {
      if (dt.querySelector(':scope > .glossary-permalink')) continue;
      const a = document.createElement('a');
      a.className = 'glossary-permalink';
      a.href = `#${encodeURIComponent(dt.id)}`;
      a.setAttribute('aria-label', `${this.#label('permalink')} ${this.#termText(dt)}`);
      const glyph = document.createElement('span');
      glyph.setAttribute('aria-hidden', 'true');
      glyph.textContent = '#';
      a.append(glyph);
      dt.append(a);
      this.#permalinks.push(a);
    }
  }

  /** @param {Element} dt */
  #termText(dt) {
    const dfn = dt.querySelector('dfn');
    if (dfn) return (dfn.textContent ?? '').trim();
    let text = '';
    for (const node of dt.childNodes) {
      if (node instanceof Element && node.classList.contains('glossary-permalink')) continue;
      text += node.textContent ?? '';
    }
    return text.replace(/\s+/g, ' ').trim();
  }

  /** @param {Event} event */
  #onClick = (event) => {
    const e = /** @type {MouseEvent} */ (event);
    const origin = e.target instanceof Element ? e.target : null;
    const link = /** @type {HTMLAnchorElement | null} */ (origin?.closest('a'));
    if (!link || !this.contains(link)) return;
    if (link.getAttribute('aria-disabled') === 'true') {
      e.preventDefault();
      return;
    }
    if (!link.classList.contains('glossary-permalink')) return;
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const dt = /** @type {HTMLElement | null} */ (link.parentElement);
    if (!dt?.id) return;
    e.preventDefault();
    this.#copyLink(dt, link);
  };

  /**
   * @param {HTMLElement} dt
   * @param {HTMLAnchorElement} link
   */
  async #copyLink(dt, link) {
    goToFragment(dt, dt.id);
    // Document URL, never resolved against <base href>.
    const url = new URL(document.URL);
    url.hash = dt.id;
    // No `button`: copyText would put its live region inside the link.
    const ok = await copyText(url.href, { announceMessage: this.#label('copied') });
    if (!ok) return;
    link.dataset.state = 'copied';
    clearTimeout(this.#timers.get(link));
    this.#timers.set(link, setTimeout(() => {
      delete link.dataset.state;
      this.#timers.delete(link);
    }, COPIED_DURATION));
  }

  /* ── Scroll-spy ── */

  /**
   * The current letter is the last section whose top has passed a line a
   * third of the way down the viewport, else the first section. (A band
   * observer skipped short sections: at the top of the page a one-term
   * "A" never entered the band, so "C" was marked.)
   */
  #initScrollSpy() {
    if (!this.querySelector('.glossary-jump a') || !this.querySelector(SECTIONS)) return;
    const queue = () => {
      if (this.#spyFrame) return;
      this.#spyFrame = requestAnimationFrame(() => {
        this.#spyFrame = 0;
        this.#updateSpy();
      });
    };
    this.listen(window, 'scroll', queue, { passive: true });
    this.listen(window, 'resize', queue, { passive: true });
    this.#updateSpy();
  }

  #updateSpy() {
    const sections = /** @type {HTMLElement[]} */ ([...this.querySelectorAll(SECTIONS)]).filter((s) => !s.hidden);
    if (!sections.length) return;
    const line = window.innerHeight / 3;
    let current = sections[0];
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= line) current = section;
      else break;
    }
    for (const link of this.querySelectorAll('.glossary-jump a')) {
      link.setAttribute('aria-current', link.getAttribute('href') === `#${current.id}` ? 'true' : 'false');
    }
  }

  /* ── Labels ── */

  #lang() {
    return this.closest('[lang]')?.getAttribute('lang') || undefined;
  }

  /** @param {string} key */
  #label(key) {
    return this.getAttribute(`data-label-${key}`) ?? LABELS[key] ?? '';
  }

  /**
   * @param {string} key
   * @param {number} n
   */
  #plural(key, n) {
    let category = 'other';
    let count = String(n);
    try {
      category = new Intl.PluralRules(this.#lang()).select(n);
      count = new Intl.NumberFormat(this.#lang()).format(n);
    } catch { /* invalid lang */ }
    const tpl = this.getAttribute(`data-label-${key}-${category}`)
      ?? LABELS[`${key}-${category}`]
      ?? this.#label(`${key}-other`);
    return tpl.replaceAll('{count}', count);
  }
}

registerComponent('glossary-index', GlossaryIndex);

export { GlossaryIndex };
