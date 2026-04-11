/**
 * glossary-wc: Searchable, categorized, cross-linked glossary
 *
 * Light DOM component that progressively enhances a <dl> definition list
 * into a searchable, categorized glossary with alphabet navigation.
 * Without JS, the <dl> renders normally as a definition list.
 *
 * @attr {string} title - Glossary heading
 * @attr {string} src - URL to JSON term data
 * @attr {boolean} searchable - Enables search input
 * @attr {boolean} compact - Reduced spacing variant
 *
 * Children use:
 * @attr {string} data-category - Category label (on <div> wrapping dt/dd)
 * @attr {string} data-term-id - Unique term identifier, used as fragment anchor
 *
 * @fires glossary-wc:ready - After setup with { termCount, categories }
 * @fires glossary-wc:search - On search input with { query, matchCount }
 *
 * @example
 * <glossary-wc title="Project Glossary" searchable>
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
import { esc } from '../_ux-base.js';

class GlossaryWc extends VBElement {
  static get observedAttributes() { return ['src', 'compact', 'title', 'searchable']; }

  static #instanceCount = 0;

  /** @type {HTMLInputElement | null} */
  #searchInput = null;
  /** @type {HTMLElement | null} */
  #jumpBar = null;
  /** @type {HTMLElement | null} */
  #countBadge = null;
  /** @type {HTMLElement | null} */
  #liveRegion = null;
  /** @type {HTMLElement | null} */
  #categoriesContainer = null;
  /** @type {string} */
  #instanceId = '';
  /** @type {ReturnType<typeof setTimeout> | null} */
  #debounceTimer = null;

  /** @type {Array<{ id: string, term: string, definition: string, category: string, el: HTMLElement }>} */
  #terms = [];
  /** @type {string[]} */
  #categories = [];
  /** @type {Map<string, HTMLElement>} */
  #categoryHeaders = new Map();
  /** @type {Map<string, HTMLElement[]>} */
  #categoryTermEls = new Map();

  setup() {
    this.#instanceId = `gloss-${++GlossaryWc.#instanceCount}`;

    // 1. Snapshot <div> children inside the <dl>
    const dl = this.querySelector(':scope > dl');
    if (!dl) return false;

    const termDivs = /** @type {HTMLElement[]} */ ([
      ...dl.querySelectorAll(':scope > div[data-term-id]')
    ]);

    if (termDivs.length === 0) return false;

    // 2. Parse terms from the HTML
    this.#terms = termDivs.map(div => {
      const id = div.getAttribute('data-term-id') || '';
      const category = div.getAttribute('data-category') || 'Uncategorized';
      const dt = div.querySelector('dt');
      const dd = div.querySelector('dd');
      const term = dt ? dt.textContent.trim() : '';
      const definition = dd ? dd.textContent.trim() : '';

      // Set the id on the div for fragment anchors
      div.id = id;

      return { id, term, definition, category, el: div };
    });

    // 3. Collect unique categories (preserve order of first appearance)
    const seen = new Set();
    this.#categories = [];
    for (const t of this.#terms) {
      if (!seen.has(t.category)) {
        seen.add(t.category);
        this.#categories.push(t.category);
      }
    }

    // 4. Remove the original <dl> — children already captured
    dl.remove();

    // 5. Build enhanced DOM
    this.#buildDOM();

    // 6. Handle src attribute for data mode
    const src = this.getAttribute('src');
    if (src) {
      this._loadSrc(src);
      return;
    }

    // 7. Dispatch ready event
    this.dispatchEvent(new CustomEvent('glossary-wc:ready', {
      bubbles: true,
      detail: {
        termCount: this.#terms.length,
        categories: [...this.#categories],
      },
    }));
  }

  teardown() {
    if (this.#debounceTimer) clearTimeout(this.#debounceTimer);

    // Remove generated elements
    const heading = this.querySelector('.gloss-title');
    if (heading) heading.remove();

    if (this.#searchInput?.parentElement) this.#searchInput.parentElement.remove();
    if (this.#jumpBar) this.#jumpBar.remove();
    if (this.#categoriesContainer) this.#categoriesContainer.remove();
    if (this.#liveRegion) this.#liveRegion.remove();

    this.#searchInput = null;
    this.#jumpBar = null;
    this.#countBadge = null;
    this.#liveRegion = null;
    this.#categoriesContainer = null;
    this.#terms = [];
    this.#categories = [];
    this.#categoryHeaders = new Map();
    this.#categoryTermEls = new Map();
  }

  // ── Build ────────────────────────────────────────────

  #buildDOM() {
    // Title
    const title = this.getAttribute('title');
    if (title) {
      const heading = document.createElement('h2');
      heading.className = 'gloss-title';
      heading.textContent = title;

      // Term count badge
      this.#countBadge = document.createElement('output');
      this.#countBadge.className = 'gloss-count';
      this.#countBadge.textContent = String(this.#terms.length);
      heading.appendChild(this.#countBadge);

      this.appendChild(heading);
    }

    // Search input
    if (this.hasAttribute('searchable')) {
      const searchContainer = document.createElement('div');
      searchContainer.className = 'gloss-search';

      const input = document.createElement('input');
      input.type = 'search';
      input.className = 'gloss-search-input';
      input.setAttribute('placeholder', 'Search terms\u2026');
      input.setAttribute('aria-label', 'Search glossary terms');

      searchContainer.appendChild(input);
      this.appendChild(searchContainer);

      this.#searchInput = input;
      this.listen(input, 'input', this.#handleSearch);
    }

    // Jump bar (A-Z)
    this.#buildJumpBar();

    // Categories container
    this.#categoriesContainer = document.createElement('div');
    this.#categoriesContainer.className = 'gloss-categories';
    this.#categoriesContainer.setAttribute('role', 'region');
    this.#categoriesContainer.setAttribute('aria-label', 'Glossary terms');
    this.appendChild(this.#categoriesContainer);

    // Build category sections
    for (const cat of this.#categories) {
      const catTerms = this.#terms.filter(t => t.category === cat);
      this.#buildCategorySection(cat, catTerms);
    }

    // Live region for search announcements
    this.#liveRegion = document.createElement('div');
    this.#liveRegion.className = 'gloss-live-region';
    this.#liveRegion.setAttribute('role', 'status');
    this.#liveRegion.setAttribute('aria-live', 'polite');
    this.#liveRegion.setAttribute('aria-atomic', 'true');
    this.appendChild(this.#liveRegion);
  }

  #buildJumpBar() {
    this.#jumpBar = document.createElement('nav');
    this.#jumpBar.className = 'gloss-jump-bar';
    this.#jumpBar.setAttribute('aria-label', 'Alphabet navigation');

    // Collect first letters of all terms
    const letters = new Set();
    for (const t of this.#terms) {
      const first = t.term.charAt(0).toUpperCase();
      if (/[A-Z]/.test(first)) letters.add(first);
    }

    for (let code = 65; code <= 90; code++) {
      const letter = String.fromCharCode(code);
      const btn = document.createElement('a');
      btn.textContent = letter;
      btn.className = 'gloss-jump-letter';

      if (letters.has(letter)) {
        btn.href = `#${this.#instanceId}-letter-${letter}`;
        btn.setAttribute('data-active', '');
      } else {
        btn.setAttribute('aria-disabled', 'true');
        btn.setAttribute('tabindex', '-1');
      }

      this.#jumpBar.appendChild(btn);
    }

    this.appendChild(this.#jumpBar);
  }

  /**
   * Build a collapsible category section.
   * @param {string} category
   * @param {Array<{ id: string, term: string, definition: string, category: string, el: HTMLElement }>} terms
   */
  #buildCategorySection(category, terms) {
    const section = document.createElement('section');
    section.className = 'gloss-category';
    section.setAttribute('data-category', category);

    // Category header (collapsible)
    const header = document.createElement('header');
    header.className = 'gloss-category-header';

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'gloss-category-toggle';
    toggle.setAttribute('aria-expanded', 'true');
    toggle.innerHTML = `<span class="gloss-category-label">${esc(category)}</span><output class="gloss-category-count">${terms.length}</output><span class="gloss-chevron" aria-hidden="true"></span>`;

    header.appendChild(toggle);
    section.appendChild(header);

    this.#categoryHeaders.set(category, toggle);

    // Terms list as a <dl>
    const dl = document.createElement('dl');
    dl.className = 'gloss-term-list';

    // Sort terms alphabetically within category
    const sorted = [...terms].sort((a, b) => a.term.localeCompare(b.term));

    const termEls = [];
    let currentLetter = '';

    for (const t of sorted) {
      const first = t.term.charAt(0).toUpperCase();

      // Insert letter anchor if this is a new letter
      if (/[A-Z]/.test(first) && first !== currentLetter) {
        currentLetter = first;
        const anchor = document.createElement('span');
        anchor.id = `${this.#instanceId}-letter-${first}`;
        anchor.className = 'gloss-letter-anchor';
        dl.appendChild(anchor);
      }

      // Re-use the original div with dt/dd
      t.el.className = 'gloss-term';
      t.el.id = t.id;
      dl.appendChild(t.el);
      termEls.push(t.el);
    }

    this.#categoryTermEls.set(category, termEls);

    section.appendChild(dl);
    this.#categoriesContainer.appendChild(section);

    // Toggle handler
    this.listen(toggle, 'click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      dl.hidden = expanded;
    });
  }

  // ── Search ──────────────────────────────────────────

  /** @param {Event} e */
  #handleSearch = (e) => {
    if (this.#debounceTimer) clearTimeout(this.#debounceTimer);

    this.#debounceTimer = setTimeout(() => {
      const query = /** @type {HTMLInputElement} */ (e.target).value.toLowerCase().trim();
      this.#applySearch(query);
    }, 150);
  };

  /**
   * @param {string} query
   */
  #applySearch(query) {
    let matchCount = 0;

    for (const t of this.#terms) {
      const matches = query === ''
        || t.term.toLowerCase().includes(query)
        || t.definition.toLowerCase().includes(query);

      if (matches) {
        t.el.removeAttribute('hidden');
        matchCount++;
      } else {
        t.el.setAttribute('hidden', '');
      }
    }

    // Show/hide categories based on whether they have visible terms
    for (const cat of this.#categories) {
      const termEls = this.#categoryTermEls.get(cat) || [];
      const section = termEls[0]?.closest('.gloss-category');
      if (!section) continue;

      const hasVisible = termEls.some(el => !el.hasAttribute('hidden'));
      if (hasVisible) {
        section.removeAttribute('hidden');
        // Update count
        const visibleCount = termEls.filter(el => !el.hasAttribute('hidden')).length;
        const countEl = section.querySelector('.gloss-category-count');
        if (countEl) countEl.textContent = String(visibleCount);
      } else {
        section.setAttribute('hidden', '');
      }
    }

    // Update total count badge
    if (this.#countBadge) {
      this.#countBadge.textContent = query === ''
        ? String(this.#terms.length)
        : `${matchCount} / ${this.#terms.length}`;
    }

    // Announce
    if (query !== '' && this.#liveRegion) {
      this.#liveRegion.textContent = '';
      requestAnimationFrame(() => {
        if (this.#liveRegion) {
          this.#liveRegion.textContent = `${matchCount} term${matchCount !== 1 ? 's' : ''} found`;
        }
      });
    }

    // Dispatch event
    this.dispatchEvent(new CustomEvent('glossary-wc:search', {
      bubbles: true,
      detail: { query, matchCount },
    }));
  }

  // ── Attribute changes ──────────────────────────────

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue || !this.isConnected) return;
    if (name === 'src') this._loadSrc(newValue);
  }

  // ── JSON loading ───────────────────────────────────

  async _loadSrc(url) {
    if (!url) return;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // Clear existing children
      while (this.firstChild) this.firstChild.remove();

      // Create <dl> from JSON terms
      const dl = document.createElement('dl');

      for (const item of (data.terms || [])) {
        const div = document.createElement('div');
        div.setAttribute('data-term-id', item.id || '');
        div.setAttribute('data-category', item.category || 'Uncategorized');

        const dt = document.createElement('dt');
        dt.textContent = item.term || '';

        const dd = document.createElement('dd');
        // Build definition with optional see-also links
        let defText = item.definition || '';
        if (item.seeAlso && item.seeAlso.length > 0) {
          const links = item.seeAlso
            .map(id => `<a href="#${esc(id)}">${esc(this.#titleCase(id))}</a>`)
            .join(', ');
          defText += ` See also: ${links}.`;
        }
        dd.innerHTML = defText;

        div.appendChild(dt);
        div.appendChild(dd);
        dl.appendChild(div);
      }

      this.appendChild(dl);

      // Set title from JSON if present and not already set
      if (data.title && !this.getAttribute('title')) {
        this.setAttribute('title', data.title);
      }

      // Tear down old state and re-run setup
      this.teardown();
      this.removeAttribute('data-upgraded');
      this.setup();
    } catch (err) {
      console.warn(`[glossary-wc] Failed to load src="${url}":`, err);
    }
  }

  // ── Helpers ────────────────────────────────────────

  /**
   * Convert a hyphenated id to Title Case.
   * @param {string} str
   * @returns {string}
   */
  #titleCase(str) {
    return str
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }
}

registerComponent('glossary-wc', GlossaryWc);
export { GlossaryWc };
