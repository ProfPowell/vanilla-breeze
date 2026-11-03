/**
 * glossary-wc: Searchable, categorized, cross-linked glossary
 *
 * Light DOM component that progressively enhances a <dl> definition list
 * into a searchable, categorized glossary with alphabet navigation.
 * Without JS, the <dl> renders normally as a definition list.
 *
 * The authored <dl> stays in place (hidden) while upgraded; its term <div>s
 * are moved into the generated category lists and moved back on teardown, so
 * moving the element (or any re-render) restores and re-renders identically.
 *
 * @attr {string} data-title - Glossary heading
 * @attr {number} data-heading-level - Heading level 1-6 (default 2)
 * @attr {string} src - URL to JSON term data ({ title?, terms: [...] })
 * @attr {boolean} searchable - Enables search input
 * @attr {boolean} compact - Reduced spacing variant
 * @attr {string} data-label-* - UI strings (search, search-placeholder, terms,
 *   alphabet, found-one/-other, all-one/-other, uncategorized, see-also, error)
 *
 * Children use:
 * @attr {string} data-category - Category label (on <div> wrapping dt/dd)
 * @attr {string} data-term-id - Unique term identifier, used as fragment anchor
 *
 * @fires glossary-wc:ready - After a render with { termCount, categories } (not while src is loading)
 * @fires glossary-wc:search - On search input with { query, matchCount }
 * @fires glossary-wc:terms-changed - After .terms assignment with { terms, source: 'property' }
 * @fires glossary-wc:error - When src fails to load with { url, error }
 *
 * @example
 * <glossary-wc data-title="Project Glossary" searchable>
 *   <dl>
 *     <div data-category="Domain" data-term-id="velocity">
 *       <dt>Velocity</dt>
 *       <dd>The amount of work a team can complete in a sprint.</dd>
 *     </div>
 *   </dl>
 * </glossary-wc>
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';
import { sanitizeHTML } from '../../lib/sanitize-html.js';
import { fragmentClick } from '../_shared/fragment-link.js';

const LABELS = /** @type {Record<string, string>} */ ({
  'search': 'Search glossary terms',
  'search-placeholder': 'Search terms…',
  'terms': 'Glossary terms',
  'alphabet': 'Alphabet navigation',
  'found-one': '{count} term found',
  'found-other': '{count} terms found',
  'all-one': 'Showing {count} term',
  'all-other': 'Showing all {count} terms',
  'uncategorized': 'Uncategorized',
  'see-also': 'See also:',
  'error': 'Could not load the glossary terms.',
});

/** Bucket for terms that do not start with a letter (digits, symbols). */
const OTHER = '#';

let uid = 0;

/**
 * @typedef {{ id: string, term: string, definition?: string, definitionHtml?: string,
 *   category?: string, seeAlso?: string[] }} TermInput
 * @typedef {{ id: string, term: string, definition: string, category: string,
 *   seeAlso: string[], el: HTMLElement, letter: string }} Term
 */

/**
 * First user-perceived character of a string.
 * @param {string} str
 * @param {string | undefined} lang
 */
function firstGrapheme(str, lang) {
  const s = str.trim();
  if (!s) return '';
  if (typeof Intl.Segmenter === 'function') {
    try {
      for (const { segment } of new Intl.Segmenter(lang, { granularity: 'grapheme' }).segment(s)) return segment;
    } catch { /* invalid lang */ }
  }
  return String.fromCodePoint(/** @type {number} */ (s.codePointAt(0)));
}

/**
 * Jump-bar bucket candidate for a term: its first grapheme, upper-cased for
 * the language, or OTHER when it does not start with a letter.
 * @param {string} term
 * @param {string | undefined} lang
 */
function letterOf(term, lang) {
  const g = firstGrapheme(term, lang);
  if (!g || !/^\p{L}/u.test(g)) return OTHER;
  try { return g.toLocaleUpperCase(lang); } catch { return g.toUpperCase(); }
}

/**
 * Build the source <dl> the component reads from term records (used by the
 * .terms setter and src mode). Definitions are text; `definitionHtml` is an
 * explicit opt-in that goes through VB's sanitizer.
 * @param {TermInput[]} terms
 * @param {string} seeAlsoLabel
 */
function buildSourceDl(terms, seeAlsoLabel) {
  const byId = new Map(terms.map((t) => [String(t?.id ?? ''), String(t?.term ?? '')]));
  const dl = document.createElement('dl');
  for (const t of terms) {
    if (!t || typeof t !== 'object') continue;
    const div = document.createElement('div');
    div.setAttribute('data-term-id', String(t.id ?? ''));
    if (t.category) div.setAttribute('data-category', String(t.category));
    const dt = document.createElement('dt');
    dt.textContent = String(t.term ?? '');
    const dd = document.createElement('dd');
    if (typeof t.definitionHtml === 'string' && t.definitionHtml) {
      dd.innerHTML = sanitizeHTML(t.definitionHtml);
    } else {
      dd.textContent = String(t.definition ?? '');
    }
    const see = Array.isArray(t.seeAlso) ? t.seeAlso.map(String).filter(Boolean) : [];
    if (see.length) {
      const span = document.createElement('span');
      span.className = 'gloss-see-also';
      span.append(` ${seeAlsoLabel} `);
      see.forEach((id, i) => {
        if (i) span.append(', ');
        const a = document.createElement('a');
        a.href = `#${encodeURIComponent(id)}`;
        a.textContent = byId.get(id) || id;
        span.append(a);
      });
      span.append('.');
      dd.append(span);
    }
    div.append(dt, dd);
    dl.append(div);
  }
  return dl;
}

class GlossaryWc extends VBElement {
  static get observedAttributes() {
    return ['src', 'data-title', 'data-heading-level', 'searchable', 'lang'];
  }

  #id = `gloss-${++uid}`;

  /** Authored source: the <dl> (hidden while upgraded) and its term divs' original state. */
  /** @type {{ dl: HTMLElement, wasHidden: boolean, items: Array<{ el: HTMLElement, attrs: Record<string, string | null> }> } | null} */
  #source = null;
  /** @type {HTMLElement[]} generated nodes removed on teardown */
  #generated = [];

  /** @type {HTMLInputElement | null} */
  #searchInput = null;
  /** @type {HTMLElement | null} */
  #countBadge = null;
  /** @type {HTMLElement | null} */
  #liveRegion = null;
  /** @type {ReturnType<typeof setTimeout> | null} */
  #debounceTimer = null;

  /** @type {Term[]} */
  #terms = [];
  /** @type {string[]} category keys ('' = uncategorized) in order of appearance */
  #categories = [];
  /** @type {Map<string, { section: HTMLElement, toggle: HTMLElement, list: HTMLElement, count: HTMLElement, els: HTMLElement[] }>} */
  #cats = new Map();
  /** @type {Map<string, HTMLAnchorElement>} */
  #letterLinks = new Map();
  /** User-collapsed categories (survive searches). */
  #collapsed = new Set();
  /** Categories closed by the user during the current search. */
  #closedInSearch = new Set();
  #query = '';

  /** src mode */
  /** @type {string | null} URL being fetched */
  #loading = null;
  /** @type {string | null} URL whose data is applied */
  #loadedUrl = null;
  /** @type {string | null} URL that failed */
  #failedUrl = null;
  /** Heading from the loaded JSON's title (data-title wins). */
  #srcTitle = '';

  setup() {
    this.#query = '';
    this.#collapsed = new Set();
    this.#closedInSearch = new Set();

    const src = this.getAttribute('src');
    const fetching = !!src && src !== this.#loadedUrl && src !== this.#failedUrl;
    if (fetching) this.#load(/** @type {string} */ (src));
    if (src) this.setAttribute('data-state', fetching ? 'loading' : (src === this.#failedUrl ? 'error' : 'ready'));
    else this.removeAttribute('data-state');

    const dl = /** @type {HTMLElement | null} */ (this.querySelector(':scope > dl'));
    const termDivs = dl
      ? /** @type {HTMLElement[]} */ ([...dl.querySelectorAll(':scope > div[data-term-id]')])
      : [];

    const failed = !!src && src === this.#failedUrl;
    if (termDivs.length === 0) {
      // Nothing to enhance. In src mode stay upgraded (loading / error state).
      if (failed) this.#renderError(null);
      return fetching || failed;
    }

    // Order matters: expand collapsed targets before fragment navigation.
    this.listen(this, 'click', this.#onClick);
    this.listen(this, 'click', fragmentClick);

    const lang = this.#lang();
    const uncategorized = this.#label('uncategorized');

    // Snapshot the authored state so teardown can put everything back.
    this.#source = {
      dl: /** @type {HTMLElement} */ (dl),
      wasHidden: /** @type {HTMLElement} */ (dl).hidden,
      items: termDivs.map((el) => ({
        el,
        attrs: Object.fromEntries(['id', 'class', 'hidden', 'data-letter'].map((a) => [a, el.getAttribute(a)])),
      })),
    };

    let n = 0;
    this.#terms = termDivs.map((div) => {
      const id = div.getAttribute('data-term-id') || `${this.#id}-term-${++n}`;
      const dt = div.querySelector('dt');
      const dd = /** @type {HTMLElement | null} */ (div.querySelector('dd'));
      const term = dt ? (dt.textContent ?? '').trim() : '';
      let definition = '';
      /** @type {string[]} */
      let seeAlso = [];
      if (dd) {
        const clone = /** @type {HTMLElement} */ (dd.cloneNode(true));
        const see = clone.querySelector('.gloss-see-also');
        if (see) {
          seeAlso = [...see.querySelectorAll('a[href^="#"]')]
            .map((a) => decodeURIComponent((a.getAttribute('href') ?? '').slice(1)));
          see.remove();
        }
        definition = (clone.textContent ?? '').replace(/\s+/g, ' ').trim();
      }
      div.id = id;
      return {
        id, term, definition, seeAlso,
        category: div.getAttribute('data-category') || '',
        el: div,
        letter: letterOf(term, lang),
      };
    });

    // Group first letters with the language's collation at base strength:
    // accent-insensitive where the language treats accents as variants
    // (É → E in English) but distinct where they are letters (Å in Swedish).
    const base = this.#collator({ sensitivity: 'base' });
    /** @type {string[]} */
    const letters = [];
    for (const t of this.#terms) {
      if (t.letter === OTHER) continue;
      const i = letters.findIndex((l) => base.compare(l, t.letter) === 0);
      if (i === -1) letters.push(t.letter);
      // Prefer the unaccented form as the bucket label.
      else if (letters[i].normalize('NFD') !== letters[i] && t.letter.normalize('NFD') === t.letter) letters[i] = t.letter;
    }
    for (const t of this.#terms) {
      if (t.letter === OTHER) continue;
      t.letter = letters.find((l) => base.compare(l, t.letter) === 0) ?? t.letter;
    }
    letters.sort((a, b) => base.compare(a, b));
    if (this.#terms.some((t) => t.letter === OTHER)) letters.unshift(OTHER);

    const seen = new Set();
    this.#categories = [];
    for (const t of this.#terms) {
      if (!seen.has(t.category)) {
        seen.add(t.category);
        this.#categories.push(t.category);
      }
    }

    // Build the enhanced DOM in place of the (now hidden) authored list.
    const dlEl = /** @type {HTMLElement} */ (dl);
    dlEl.hidden = true;
    const heading = this.#buildHeading();
    const search = this.hasAttribute('searchable') ? this.#buildSearch() : null;
    const jump = this.#buildJumpBar(letters);
    const container = document.createElement('div');
    container.className = 'gloss-categories';
    container.id = `${this.#id}-categories`;
    container.setAttribute('role', 'region');
    container.setAttribute('aria-label', this.#label('terms'));
    const sort = this.#collator({ numeric: true });
    for (const cat of this.#categories) {
      const catTerms = this.#terms.filter((t) => t.category === cat).sort((a, b) => sort.compare(a.term, b.term));
      container.append(this.#buildCategorySection(cat, cat || uncategorized, catTerms));
    }
    const nodes = /** @type {HTMLElement[]} */ ([heading, search, jump, container].filter(Boolean));
    dlEl.before(...nodes);
    this.#generated.push(...nodes);

    if (failed) this.#renderError(dlEl);

    this.#liveRegion = document.createElement('div');
    this.#liveRegion.className = 'gloss-live-region';
    this.#liveRegion.setAttribute('role', 'status');
    this.#liveRegion.setAttribute('aria-live', 'polite');
    this.#liveRegion.setAttribute('aria-atomic', 'true');
    this.append(this.#liveRegion);
    this.#generated.push(this.#liveRegion);

    this.#syncLetters();

    if (!fetching) {
      this.dispatchEvent(new CustomEvent('glossary-wc:ready', {
        bubbles: true,
        detail: {
          termCount: this.#terms.length,
          categories: this.#categories.map((c) => c || uncategorized),
        },
      }));
    }
    return true;
  }

  teardown() {
    if (this.#debounceTimer) clearTimeout(this.#debounceTimer);
    this.#debounceTimer = null;

    // Put the authored term divs back into the authored <dl>, in order,
    // with their original attributes, then drop the generated chrome.
    const source = this.#source;
    if (source) {
      for (const { el, attrs } of source.items) {
        for (const [name, value] of Object.entries(attrs)) {
          if (value === null) el.removeAttribute(name);
          else el.setAttribute(name, value);
        }
        source.dl.append(el);
      }
      source.dl.hidden = source.wasHidden;
    }
    for (const node of this.#generated) node.remove();

    this.#source = null;
    this.#generated = [];
    this.#searchInput = null;
    this.#countBadge = null;
    this.#liveRegion = null;
    this.#terms = [];
    this.#categories = [];
    this.#cats = new Map();
    this.#letterLinks = new Map();
  }

  // ── Data API (HTML-first / JS-first dual contract) ──────────────

  /**
   * Read the glossary terms as a plain data array. Each entry:
   * `{ id, term, definition, category, seeAlso? }` (definition is text).
   *
   * @returns {any[]} Term records.
   */
  get terms() {
    return this.#terms.map((t) => ({
      id: t.id,
      term: t.term,
      definition: t.definition,
      category: t.category || this.#label('uncategorized'),
      ...(t.seeAlso.length ? { seeAlso: [...t.seeAlso] } : {}),
    }));
  }

  /**
   * Replace the glossary contents and re-render. Each entry needs `id`,
   * `term` and `definition` (text); optional `category` (default
   * Uncategorized), `seeAlso` (term ids) and `definitionHtml` (sanitized
   * HTML, used instead of `definition`). The entries are written into the
   * source <dl>, so they survive moves and re-renders.
   * Emits glossary-wc:terms-changed { terms, source: 'property' }.
   *
   * @param {TermInput[]} value
   */
  set terms(value) {
    const next = Array.isArray(value) ? value : [];
    // Restore the authored state first so the old <dl> holds its terms.
    if (this.#source) this.teardown();
    const fresh = buildSourceDl(next, this.#label('see-also'));
    const old = this.querySelector(':scope > dl');
    if (old) old.replaceWith(fresh);
    else this.append(fresh);

    this._reinit();

    this.dispatchEvent(new CustomEvent('glossary-wc:terms-changed', {
      detail: { terms: next, source: 'property' },
      bubbles: true,
    }));
  }

  // ── Build ────────────────────────────────────────────

  #buildHeading() {
    const title = this.dataset.title || (this.getAttribute('src') === this.#loadedUrl ? this.#srcTitle : '');
    if (!title) return null;
    const level = Math.min(6, Math.max(1, parseInt(this.dataset.headingLevel || '2', 10) || 2));
    const heading = document.createElement(`h${level}`);
    heading.className = 'gloss-title';
    heading.append(title);
    // Visual count only — the heading's name stays the title.
    this.#countBadge = document.createElement('span');
    this.#countBadge.className = 'gloss-count';
    this.#countBadge.setAttribute('aria-hidden', 'true');
    this.#countBadge.textContent = this.#number(this.#terms.length);
    heading.append(' ', this.#countBadge);
    return heading;
  }

  #buildSearch() {
    const search = document.createElement('search');
    search.className = 'gloss-search';
    const input = document.createElement('input');
    input.type = 'search';
    input.className = 'gloss-search-input';
    input.setAttribute('placeholder', this.#label('search-placeholder'));
    input.setAttribute('aria-label', this.#label('search'));
    input.setAttribute('aria-controls', `${this.#id}-categories`);
    search.append(input);
    this.#searchInput = input;
    this.listen(input, 'input', this.#handleSearch);
    return search;
  }

  /** @param {string[]} letters */
  #buildJumpBar(letters) {
    const nav = document.createElement('nav');
    nav.className = 'gloss-jump-bar';
    nav.setAttribute('aria-label', this.#label('alphabet'));
    for (const letter of letters) {
      const a = document.createElement('a');
      a.className = 'gloss-jump-letter';
      a.textContent = letter;
      a.dataset.letter = letter;
      nav.append(a);
      this.#letterLinks.set(letter, a);
    }
    return nav;
  }

  /**
   * Build a collapsible category section.
   * @param {string} key
   * @param {string} label
   * @param {Term[]} terms
   */
  #buildCategorySection(key, label, terms) {
    const n = this.#cats.size + 1;
    const section = document.createElement('section');
    section.className = 'gloss-category';
    if (key) section.setAttribute('data-category', key);

    const header = document.createElement('header');
    header.className = 'gloss-category-header';

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'gloss-category-toggle';
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-controls', `${this.#id}-cat-${n}`);
    const labelEl = document.createElement('span');
    labelEl.className = 'gloss-category-label';
    labelEl.textContent = label;
    const count = document.createElement('span');
    count.className = 'gloss-category-count';
    count.setAttribute('aria-hidden', 'true');
    count.textContent = this.#number(terms.length);
    const chevron = document.createElement('span');
    chevron.className = 'gloss-chevron';
    chevron.setAttribute('aria-hidden', 'true');
    toggle.append(labelEl, count, chevron);
    header.append(toggle);
    section.append(header);

    const list = document.createElement('dl');
    list.className = 'gloss-term-list';
    list.id = `${this.#id}-cat-${n}`;
    for (const t of terms) {
      t.el.classList.add('gloss-term');
      t.el.dataset.letter = t.letter;
      list.append(t.el);
    }
    section.append(list);

    this.#cats.set(key, { section, toggle, list, count, els: terms.map((t) => t.el) });

    this.listen(toggle, 'click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      if (open) {
        this.#collapsed.delete(key);
        this.#closedInSearch.delete(key);
      } else {
        this.#collapsed.add(key);
        if (this.#query) this.#closedInSearch.add(key);
      }
      this.#syncCategory(key);
    });
    return section;
  }

  /** @param {HTMLElement | null} before */
  #renderError(before) {
    const p = document.createElement('p');
    p.className = 'gloss-error';
    p.setAttribute('role', 'alert');
    p.textContent = this.#label('error');
    if (before) before.before(p);
    else this.append(p);
    this.#generated.push(p);
  }

  // ── State sync ──────────────────────────────────────

  /** @param {string} key */
  #syncCategory(key) {
    const cat = this.#cats.get(key);
    if (!cat) return;
    const visible = cat.els.filter((el) => !el.hidden).length;
    cat.section.hidden = visible === 0;
    cat.count.textContent = this.#number(visible);
    // Searching reveals matches in collapsed categories unless the user
    // closes the category again during this search.
    const open = this.#query
      ? !this.#closedInSearch.has(key)
      : !this.#collapsed.has(key);
    cat.list.hidden = !open;
    cat.toggle.setAttribute('aria-expanded', String(open));
  }

  /** Point each letter at its first visible term; disable letters with none. */
  #syncLetters() {
    const order = this.#renderOrder();
    for (const [letter, a] of this.#letterLinks) {
      const first = order.find((t) => t.letter === letter && !t.el.hidden);
      if (first) {
        a.href = `#${encodeURIComponent(first.id)}`;
        a.setAttribute('data-active', '');
        a.removeAttribute('aria-disabled');
        a.removeAttribute('role');
      } else {
        // No visible term for this letter (filtered out): a disabled link.
        a.removeAttribute('href');
        a.removeAttribute('data-active');
        a.setAttribute('role', 'link');
        a.setAttribute('aria-disabled', 'true');
      }
    }
  }

  /** Terms in rendered (category, then collation) order. */
  #renderOrder() {
    const byEl = new Map(this.#terms.map((t) => [t.el, t]));
    return [...this.#cats.values()].flatMap((c) => c.els)
      .map((el) => /** @type {Term} */ (byEl.get(el)));
  }

  // ── Events ──────────────────────────────────────────

  /** @param {Event} event */
  #onClick = (event) => {
    const origin = event.target instanceof Element ? event.target : null;
    const link = /** @type {HTMLAnchorElement | null} */ (origin?.closest('a'));
    if (!link || !this.contains(link)) return;
    if (link.getAttribute('aria-disabled') === 'true') {
      event.preventDefault();
      return;
    }
    const href = link.getAttribute('href');
    if (!href?.startsWith('#')) return;
    let id = href.slice(1);
    try { id = decodeURIComponent(id); } catch { /* keep raw */ }
    const target = document.getElementById(id);
    if (!target || !this.contains(target)) return;
    // Expand the category holding the target before navigating to it.
    for (const [key, cat] of this.#cats) {
      if (cat.list.contains(target) && cat.list.hidden) {
        this.#collapsed.delete(key);
        this.#closedInSearch.delete(key);
        this.#syncCategory(key);
      }
    }
  };

  /** @param {Event} e */
  #handleSearch = (e) => {
    if (this.#debounceTimer) clearTimeout(this.#debounceTimer);
    const input = /** @type {HTMLInputElement} */ (e.target);
    this.#debounceTimer = setTimeout(() => this.#applySearch(input.value), 150);
  };

  /** @param {string} raw */
  #applySearch(raw) {
    const lang = this.#lang();
    const lower = (/** @type {string} */ s) => { try { return s.toLocaleLowerCase(lang); } catch { return s.toLowerCase(); } };
    const query = lower(raw.trim());
    const changed = query !== this.#query;
    this.#query = query;
    if (changed) this.#closedInSearch = new Set();

    let matchCount = 0;
    for (const t of this.#terms) {
      const matches = query === ''
        || lower(t.term).includes(query)
        || lower(t.definition).includes(query);
      t.el.hidden = !matches;
      if (matches) matchCount++;
    }
    for (const key of this.#categories) this.#syncCategory(key);
    this.#syncLetters();

    if (this.#countBadge) {
      this.#countBadge.textContent = query === ''
        ? this.#number(this.#terms.length)
        : `${this.#number(matchCount)} / ${this.#number(this.#terms.length)}`;
    }

    // Announce results, and the restored full list when the search is cleared.
    const message = query === ''
      ? this.#plural('all', this.#terms.length)
      : this.#plural('found', matchCount);
    const live = this.#liveRegion;
    if (live) {
      live.textContent = '';
      requestAnimationFrame(() => { live.textContent = message; });
    }

    this.dispatchEvent(new CustomEvent('glossary-wc:search', {
      bubbles: true,
      detail: { query, matchCount },
    }));
  }

  // ── Attribute changes ──────────────────────────────

  /**
   * @param {string} name
   * @param {string | null} oldValue
   * @param {string | null} newValue
   */
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue || !this.isConnected) return;
    if (name === 'src' || this.hasAttribute('data-upgraded')) this._reinit();
  }

  // ── JSON loading ───────────────────────────────────

  /** @param {string} url */
  async #load(url) {
    if (this.#loading === url) return;
    this.#loading = url;
    /** @type {any} */
    let data;
    /** @type {unknown} */
    let error = null;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      data = await res.json();
      if (!data || !Array.isArray(data.terms)) throw new Error('Expected { terms: [...] }');
    } catch (err) {
      error = err;
    }
    if (this.#loading !== url) return;
    this.#loading = null;
    // Superseded by a newer src (or src removed) while in flight.
    if (this.getAttribute('src') !== url) return;

    if (error) {
      console.warn(`[glossary-wc] Failed to load src="${url}":`, error);
      this.#failedUrl = url;
      this.dispatchEvent(new CustomEvent('glossary-wc:error', {
        bubbles: true,
        detail: { url, error },
      }));
      // Re-render: keeps any fallback <dl>, adds the error message.
      this._reinit();
      return;
    }

    this.#loadedUrl = url;
    this.#failedUrl = null;
    // Restore the fallback (if rendered) so it can be swapped out cleanly.
    if (this.#source) this.teardown();
    const fresh = buildSourceDl(data.terms, this.#label('see-also'));
    const old = this.querySelector(':scope > dl');
    if (old) old.replaceWith(fresh);
    else this.append(fresh);
    this.#srcTitle = data.title ? String(data.title) : '';
    this._reinit();
  }

  // ── Helpers ────────────────────────────────────────

  #lang() {
    return this.closest('[lang]')?.getAttribute('lang') || undefined;
  }

  /** @param {Intl.CollatorOptions} opts */
  #collator(opts) {
    try { return new Intl.Collator(this.#lang(), opts); } catch { return new Intl.Collator(undefined, opts); }
  }

  /** @param {number} n */
  #number(n) {
    try { return new Intl.NumberFormat(this.#lang()).format(n); } catch { return String(n); }
  }

  /** @param {string} key */
  #label(key) {
    return this.getAttribute(`data-label-${key}`) ?? LABELS[key] ?? '';
  }

  /**
   * @param {string} key - 'found' | 'all'
   * @param {number} n
   */
  #plural(key, n) {
    let category = 'other';
    try { category = new Intl.PluralRules(this.#lang()).select(n); } catch { /* invalid lang */ }
    const tpl = this.getAttribute(`data-label-${key}-${category}`)
      ?? LABELS[`${key}-${category}`]
      ?? this.#label(`${key}-other`);
    return tpl.replaceAll('{count}', this.#number(n));
  }
}

registerComponent('glossary-wc', GlossaryWc);
export { GlossaryWc };
