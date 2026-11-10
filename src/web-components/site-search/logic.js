/**
 * site-search: Site search component powered by Pagefind
 *
 * Opens a native modal <dialog> (showModal: top layer, the page behind is
 * inert, Escape closes) holding a combobox input and a listbox of results.
 * Uses Pagefind for fast client-side search.
 *
 * @attr {boolean} open - Reflected state only — set by open()/close() methods, not intended as initial markup
 * @attr {string} data-pagefind-path - Directory holding pagefind.js (default "/pagefind/")
 * @attr {string} data-base-url - Pagefind baseUrl for result URLs (default: the directory above data-pagefind-path)
 * @attr {string} data-label-* - Override UI strings (dialog, placeholder, input, results, searching, empty, count, count-one, unavailable, error, untitled, navigate, select, close, powered)
 *
 * @example Basic usage
 * <site-search>
 *   <button data-trigger>
 *     <icon-wc name="search"></icon-wc>
 *     Search
 *   </button>
 * </site-search>
 *
 * Keyboard shortcuts:
 * - Cmd/Ctrl+K: Open search (bound once for the page; opens the first visible instance)
 * - Escape: Close search
 * - Up/Down arrows: Navigate results
 * - Enter: Go to the selected result (the first result when none is selected)
 */

import { bindHotkey, getBoundHotkeys } from '../../utils/hotkey-bind.js';
import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

/** Default UI strings — each overridable with data-label-<key>. */
const LABELS = {
  trigger: 'Search',
  dialog: 'Site search',
  placeholder: 'Search documentation...',
  input: 'Search',
  results: 'Search results',
  searching: 'Searching...',
  empty: 'No results found',
  count: '{count} results',
  'count-one': '1 result',
  'count-more': '{count} of {total} results',
  unavailable: 'Search unavailable',
  error: 'Search error. Please try again.',
  untitled: 'Untitled',
  navigate: 'to navigate',
  select: 'to select',
  close: 'to close',
  dismiss: 'Close search',
  powered: 'Powered by',
};

let idCounter = 0;

/* ── Hotkey: one page-level Cmd/Ctrl+K for every instance ─────────── */

/** @type {Set<SiteSearch>} */
const instances = new Set();
/** @type {(() => void) | null} */
let unbindHotkey = null;

/** @param {Element} el */
function isVisible(el) {
  if (typeof el.checkVisibility === 'function') return el.checkVisibility();
  return el.getClientRects().length > 0;
}

function onHotkey() {
  const all = [...instances].filter((el) => el.isConnected);
  const open = all.find((el) => el.isOpen);
  if (open) { open.close(); return; }
  const target = all.find((el) => isVisible(el)) ?? all[0];
  target?.open();
}

/** @param {SiteSearch} el */
function register(el) {
  instances.add(el);
  // Another component (e.g. a command palette) may own the shortcut
  if (!unbindHotkey && !getBoundHotkeys().includes('meta+k')) {
    unbindHotkey = /** @type {() => void} */ (bindHotkey('meta+k', onHotkey, { global: true }));
  }
}

/** @param {SiteSearch} el */
function unregister(el) {
  instances.delete(el);
  if (instances.size === 0 && unbindHotkey) {
    unbindHotkey();
    unbindHotkey = null;
  }
}

/* ── Helpers ───────────────────────────────────────────────────────── */

/**
 * Build an element.
 * @param {string} tag
 * @param {Record<string, string>} [attrs]
 * @param {(Node|string)[]} [children]
 */
function h(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  el.append(...children);
  return el;
}

/**
 * Pagefind excerpts are HTML-escaped text with <mark> around matches.
 * Rebuild them keeping only text and bare <mark> elements: everything else
 * is flattened to its text. Parsed in an inert <template>, inserted as nodes.
 * @param {string} html
 * @returns {DocumentFragment}
 */
function markOnlyFragment(html) {
  const out = document.createDocumentFragment();
  if (!html || typeof html !== 'string') return out;
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  /**
   * @param {Node} src
   * @param {Node} dest
   */
  const walk = (src, dest) => {
    for (const node of src.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        dest.appendChild(document.createTextNode(node.textContent ?? ''));
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (/** @type {Element} */ (node).localName === 'mark') {
          const mark = document.createElement('mark');
          walk(node, mark);
          dest.appendChild(mark);
        } else {
          walk(node, dest);
        }
      }
    }
  };
  walk(tpl.content, out);
  return out;
}

/**
 * Resolve a result URL; only same-origin http(s) URLs are allowed.
 * @param {unknown} url
 * @returns {string|null}
 */
function safeUrl(url) {
  if (typeof url !== 'string' || !url) return null;
  try {
    const u = new URL(url, document.baseURI);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    if (u.origin !== location.origin) return null;
    return u.href;
  } catch {
    return null;
  }
}

class SiteSearch extends VBElement {
  static #DEBOUNCE_MS = 150;
  static #MAX_RESULTS = 8;

  /** @type {HTMLElement} */
  #trigger = /** @type {*} */ (null);
  /** @type {HTMLDialogElement} */
  #dialog = /** @type {*} */ (null);
  /** @type {HTMLInputElement} */
  #input = /** @type {*} */ (null);
  /** @type {HTMLElement} */
  #resultsList = /** @type {*} */ (null);
  /** @type {HTMLElement} */
  #status = /** @type {*} */ (null);
  /** @type {any[]} */
  #results = [];
  #activeIndex = -1;
  #isOpen = false;
  #searchSeq = 0;
  #uid = '';
  /** @type {any} */
  #pagefind = null;
  #pagefindFailed = false;
  /** @type {ReturnType<typeof setTimeout> | null} */
  #debounceTimer = null;

  setup() {
    if (!this.#uid) this.#uid = `site-search-${++idCounter}`;
    this.#render();
    this.#bindEvents();
    register(this);
  }

  teardown() {
    unregister(this);
    if (this.#isOpen) {
      document.body.style.overflow = '';
      this.removeAttribute('open');
      this.#trigger?.setAttribute('aria-expanded', 'false');
      this.#isOpen = false;
    }
    this.#clearDebounce();
    this.#searchSeq++;
    this.#results = [];
    this.#activeIndex = -1;
    // Remove the rendered dialog so a reconnect's setup() doesn't stack a
    // second one (the trigger is find-or-create and safely reused)
    this.#dialog?.remove();
    this.#dialog = /** @type {*} */ (null);
  }

  /** @param {keyof typeof LABELS} key */
  #label(key) {
    const attr = `data-label-${key}`;
    return this.getAttribute(attr) ?? LABELS[key];
  }

  // ── Data API (HTML-first / JS-first dual contract) ──────────────

  /**
   * Read the current search query string.
   *
   * @returns {string} The query string.
   */
  get value() { return this.#input?.value ?? ''; }

  /**
   * Set the search query string. Idempotent; triggers the same
   * debounce + pagefind path as user input. Emits site-search:change
   * with source: 'api'.
   */
  set value(val) {
    if (!this.#input) return;
    const next = val == null ? '' : String(val);
    if (this.#input.value === next) return;
    this.#input.value = next;
    this.#input.dispatchEvent(new Event('input', { bubbles: true }));
    this.dispatchEvent(new CustomEvent('site-search:change', {
      detail: { value: next, source: 'api' },
      bubbles: true,
    }));
  }

  /**
   * Read the current results as a plain array. Reflects whatever
   * pagefind / the underlying search produced.
   *
   * @returns {any[]} A copy of the result records.
   */
  get results() { return [...this.#results]; }

  #render() {
    // Find or create trigger
    this.#trigger = /** @type {HTMLElement} */ (this.querySelector(':scope > [data-trigger]'));
    if (!this.#trigger) {
      this.#trigger = /** @type {HTMLElement} */ (this.querySelector(':scope > button'));
    }
    if (!this.#trigger) {
      this.#trigger = h('button', { type: 'button', 'data-trigger': '' }, [
        h('icon-wc', { name: 'search', label: this.#label('trigger') }),
      ]);
      this.prepend(this.#trigger);
    }

    const dialogId = `${this.#uid}-dialog`;
    const listId = `${this.#uid}-results`;

    // Set up ARIA for trigger
    this.#trigger.setAttribute('aria-haspopup', 'dialog');
    this.#trigger.setAttribute('aria-expanded', 'false');
    this.#trigger.setAttribute('aria-controls', dialogId);

    this.#input = /** @type {HTMLInputElement} */ (h('input', {
      type: 'search',
      name: 'search',
      class: 'input',
      placeholder: this.#label('placeholder'),
      autocomplete: 'off',
      autocorrect: 'off',
      autocapitalize: 'off',
      spellcheck: 'false',
      role: 'combobox',
      'aria-label': this.#label('input'),
      'aria-autocomplete': 'list',
      'aria-controls': listId,
      'aria-expanded': 'false',
    }));

    this.#resultsList = h('div', {
      class: 'results',
      id: listId,
      role: 'listbox',
      'aria-label': this.#label('results'),
    });

    // Not `status`: that is the global status-dot class (a ● before the text).
    this.#status = h('p', { class: 'search-status', role: 'status' });

    const kbd = (/** @type {string} */ t) => h('kbd', {}, [t]);

    this.#dialog = /** @type {HTMLDialogElement} */ (h('dialog', {
      class: 'dialog',
      id: dialogId,
      'aria-label': this.#label('dialog'),
    }, [
      // The input, status and results sit in a search landmark
      h('search', { class: 'search' }, [
        h('div', { class: 'input-wrapper' }, [
          h('icon-wc', { name: 'search', class: 'icon' }),
          this.#input,
          // A real button: on a touch screen there is no Esc key to press
          h('button', { type: 'button', class: 'shortcut', 'aria-label': this.#label('dismiss') }, [
            h('kbd', {}, ['Esc']),
            h('icon-wc', { name: 'x', size: 'sm' }),
          ]),
        ]),
        this.#status,
        this.#resultsList,
      ]),
      h('div', { class: 'footer' }, [
        h('span', { class: 'hint' }, [
          kbd('↑'), kbd('↓'), ` ${this.#label('navigate')} `,
          kbd('↵'), ` ${this.#label('select')} `,
          kbd('esc'), ` ${this.#label('close')}`,
        ]),
        h('span', { class: 'powered' }, [
          `${this.#label('powered')} `,
          h('a', { href: 'https://pagefind.app', target: '_blank', rel: 'noopener' }, ['Pagefind']),
        ]),
      ]),
    ]));

    this.appendChild(this.#dialog);
  }

  #bindEvents() {
    // The trigger survives reconnects, so its listener goes through listen()
    this.listen(this.#trigger, 'click', this.#handleTriggerClick);

    // Fresh dialog nodes every setup(): plain listeners are dropped with them
    this.#dialog.addEventListener('close', this.#handleDialogClose);
    this.#dialog.addEventListener('click', this.#handleDialogClick);
    this.#input.addEventListener('input', this.#handleInput);
    this.#input.addEventListener('keydown', this.#handleInputKeyDown);
    this.#resultsList.addEventListener('click', this.#handleResultClick);
  }

  #handleTriggerClick = (/** @type {Event} */ e) => {
    e.stopPropagation();
    this.open();
  };

  /** Native close (Escape / cancel, or dialog.close()) → sync state. */
  #handleDialogClose = () => {
    if (this.#isOpen && !this.#dialog?.open) this.#finishClose();
  };

  /** Clicks on the ::backdrop target the dialog itself, outside its box. */
  #handleDialogClick = (/** @type {MouseEvent} */ e) => {
    if (/** @type {Element} */ (e.target).closest?.('.shortcut')) { this.close(); return; }
    if (e.target !== this.#dialog) return;
    const r = this.#dialog.getBoundingClientRect();
    const inside = e.clientX >= r.left && e.clientX <= r.right
      && e.clientY >= r.top && e.clientY <= r.bottom;
    if (!inside) this.close();
  };

  #handleInput = () => {
    this.#clearDebounce();
    this.setState('input-debounce-pending', true);
    this.#debounceTimer = setTimeout(() => {
      this.#debounceTimer = null;
      this.setState('input-debounce-pending', false);
      this.#search(this.#input.value);
    }, SiteSearch.#DEBOUNCE_MS);
  };

  #handleInputKeyDown = (/** @type {KeyboardEvent} */ e) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.#focusResult(this.#activeIndex + 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.#focusResult(this.#activeIndex - 1);
        break;
      case 'Escape':
        // A type=search input would swallow the first Escape to clear itself
        e.preventDefault();
        this.close();
        break;
      case 'Enter': {
        e.preventDefault();
        const index = this.#activeIndex >= 0 ? this.#activeIndex : 0;
        const href = this.#resultsList.querySelector(`[data-result-index="${index}"]`)?.getAttribute('href');
        if (href) {
          this.close();
          window.location.assign(href);
        }
        break;
      }
    }
  };

  /**
   * Results are real links: let the anchor navigate (so Cmd/Ctrl/Shift and
   * middle clicks open new tabs as usual). A plain click also closes the
   * dialog — after the click's default action has started.
   */
  #handleResultClick = (/** @type {MouseEvent} */ e) => {
    const target = /** @type {Element} */ (e.target);
    if (!target.closest('[data-result-index]')) return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    setTimeout(() => this.close(), 0);
  };

  get #pagefindPath() {
    const raw = this.getAttribute('data-pagefind-path') || '/pagefind/';
    return raw.endsWith('/') ? raw : `${raw}/`;
  }

  async #initPagefind() {
    if (this.#pagefind || this.#pagefindFailed) return;

    const dir = new URL(this.#pagefindPath, document.baseURI);
    const baseUrl = this.getAttribute('data-base-url')
      ?? new URL('..', dir).pathname;

    try {
      // @ts-ignore — Pagefind is generated at build time; path won't resolve in TS
      const mod = await import(/* @vite-ignore */ new URL('pagefind.js', dir).href);
      await mod.options({ excerptLength: 20, baseUrl });
      this.#pagefind = mod;
    } catch {
      this.#pagefindFailed = true;
      // Developer hint stays in the console; users see a neutral status
      console.warn(`[site-search] Pagefind not found at ${dir.pathname}pagefind.js. Run \`npm run search:index\` after building, or set data-pagefind-path.`);
    }
  }

  /** @param {string} text */
  #setStatus(text) {
    if (this.#status) this.#status.textContent = text;
  }

  /** @param {string} query */
  async #search(query) {
    const seq = ++this.#searchSeq;

    if (!query.trim()) {
      this.#renderResults([]);
      return;
    }

    this.#setStatus(this.#label('searching'));
    await this.#initPagefind();
    if (seq !== this.#searchSeq) return;

    if (!this.#pagefind) {
      this.#results = [];
      this.#renderResults([]);
      this.#setStatus(this.#label('unavailable'));
      return;
    }

    try {
      const search = await this.#pagefind.search(query);
      const results = await Promise.all(
        (search?.results ?? []).slice(0, SiteSearch.#MAX_RESULTS).map((/** @type {any} */ r) => r.data())
      );
      if (seq !== this.#searchSeq) return;
      this.#results = results;
      this.#renderResults(results, search?.results?.length ?? results.length);
    } catch (error) {
      if (seq !== this.#searchSeq) return;
      console.error('[site-search] Search error:', error);
      this.#results = [];
      this.#renderResults([]);
      this.#setStatus(this.#label('error'));
    }
  }

  /**
   * @param {any[]} results - the results to list (at most MAX_RESULTS)
   * @param {number} [total] - how many the index matched in all
   */
  #renderResults(results, total = results.length) {
    this.#activeIndex = -1;
    this.#input.removeAttribute('aria-activedescendant');

    const items = [];
    for (const result of results) {
      const href = safeUrl(result?.url);
      if (!href) continue;
      const title = h('span', { class: 'result-title' });
      title.textContent = String(result.meta?.title || this.#label('untitled'));
      const excerpt = h('span', { class: 'result-excerpt' });
      excerpt.append(markOnlyFragment(result.excerpt || ''));
      items.push(h('a', {
        id: `${this.#uid}-result-${items.length}`,
        href,
        class: 'result',
        role: 'option',
        'aria-selected': 'false',
        'data-result-index': String(items.length),
        tabindex: '-1',
      }, [title, excerpt]));
    }

    this.#resultsList.replaceChildren(...items);
    this.#input.setAttribute('aria-expanded', items.length ? 'true' : 'false');

    if (!this.#input.value.trim()) {
      this.#setStatus('');
    } else if (items.length === 0) {
      this.#setStatus(this.#label('empty'));
    } else {
      // The list is capped: say so rather than report the cap as the count.
      const capped = total > SiteSearch.#MAX_RESULTS && total > items.length;
      const text = capped ? this.#label('count-more')
        : items.length === 1 ? this.#label('count-one') : this.#label('count');
      this.#setStatus(text.replace('{count}', String(items.length)).replace('{total}', String(total)));
    }
  }

  /** @param {number} index */
  #focusResult(index) {
    const options = this.#resultsList.querySelectorAll('[data-result-index]');
    if (options.length === 0) return;

    // Wrap around
    if (index < 0) index = options.length - 1;
    if (index >= options.length) index = 0;

    for (const opt of options) {
      opt.removeAttribute('data-active');
      opt.setAttribute('aria-selected', 'false');
    }

    this.#activeIndex = index;
    const resultEl = options[index];
    resultEl.setAttribute('data-active', '');
    resultEl.setAttribute('aria-selected', 'true');
    this.#input.setAttribute('aria-activedescendant', resultEl.id);
    resultEl.scrollIntoView({ block: 'nearest' });
  }

  #clearDebounce() {
    if (this.#debounceTimer) {
      clearTimeout(this.#debounceTimer);
      this.#debounceTimer = null;
    }
    this.setState('input-debounce-pending', false);
  }

  open() {
    if (this.#isOpen || !this.#dialog) return;

    this.#isOpen = true;
    this.setAttribute('open', '');
    this.#trigger?.setAttribute('aria-expanded', 'true');

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    // Native modal: top layer, the rest of the page is inert, Escape closes
    if (!this.#dialog.open) {
      try { this.#dialog.showModal(); } catch { this.#dialog.setAttribute('open', ''); }
    }
    this.#input.focus();
    this.#input.select();

    // Initialize pagefind in background
    this.#initPagefind();

    this.dispatchEvent(new CustomEvent('site-search:open', { bubbles: true }));
  }

  close() {
    if (!this.#isOpen) return;
    if (this.#dialog?.open) this.#dialog.close(); // fires 'close' → #finishClose
    if (this.#isOpen) this.#finishClose();
  }

  #finishClose() {
    this.#isOpen = false;
    this.removeAttribute('open');
    this.#trigger?.setAttribute('aria-expanded', 'false');

    // Restore body scroll
    document.body.style.overflow = '';

    // Clear state
    this.#clearDebounce();
    this.#searchSeq++;
    this.#results = [];
    this.#activeIndex = -1;
    if (this.#input) {
      this.#input.value = '';
      this.#input.removeAttribute('aria-activedescendant');
      this.#input.setAttribute('aria-expanded', 'false');
    }
    this.#resultsList?.replaceChildren();
    this.#setStatus('');

    // Return focus to trigger
    this.#trigger?.focus();

    this.dispatchEvent(new CustomEvent('site-search:close', { bubbles: true }));
  }

  get isOpen() {
    return this.#isOpen;
  }
}

registerComponent('site-search', SiteSearch);

export { SiteSearch };
