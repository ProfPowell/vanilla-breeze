/**
 * site-search: Site search component powered by Pagefind
 *
 * Provides a search interface with keyboard shortcuts, result highlighting,
 * and keyboard navigation. Uses Pagefind for fast client-side search.
 *
 * @attr {boolean} open - Reflected state only — set by open()/close() methods, not intended as initial markup
 *
 * @example Basic usage
 * <site-search>
 *   <button data-trigger>
 *     <icon-wc name="search"></icon-wc>
 *     Search
 *   </button>
 * </site-search>
 *
 * @example Icon-only trigger
 * <site-search>
 *   <button data-trigger aria-label="Search">
 *     <icon-wc name="search"></icon-wc>
 *   </button>
 * </site-search>
 *
 * Keyboard shortcuts:
 * - Cmd/Ctrl+K: Open search
 * - Escape: Close search
 * - Up/Down arrows: Navigate results
 * - Enter: Go to selected result
 */

import { bindHotkey, getBoundHotkeys } from '../../utils/hotkey-bind.js';
import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

class SiteSearch extends VBElement {
  static #DEBOUNCE_MS = 150;
  static #MAX_RESULTS = 8;

  /** @type {HTMLElement} */
  #trigger = /** @type {*} */ (null);
  /** @type {HTMLElement} */
  #dialog = /** @type {*} */ (null);
  /** @type {HTMLInputElement} */
  #input = /** @type {*} */ (null);
  /** @type {HTMLElement} */
  #resultsList = /** @type {*} */ (null);
  /** @type {any[]} */
  #results = [];
  #activeIndex = -1;
  #isOpen = false;
  /** @type {any} */
  #pagefind = null;
  /** @type {ReturnType<typeof setTimeout> | null} */
  #debounceTimer = null;
  /** @type {(() => void) | null} */
  #unbindHotkey = null;

  setup() {
    this.#render();
    this.#bindEvents();
  }

  teardown() {
    if (this.#isOpen) {
      document.body.style.overflow = '';
      this.removeAttribute('open');
      this.#isOpen = false;
    }
    this.#unbindHotkey?.();
    this.#clearDebounce();
  }

  // ── Data API (HTML-first / JS-first dual contract) ──────────────

  /** Read the current search query string. */
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
   */
  get results() { return [...this.#results]; }

  #render() {
    // Find or create trigger
    this.#trigger = /** @type {HTMLElement} */ (this.querySelector(':scope > [data-trigger]'));
    if (!this.#trigger) {
      this.#trigger = /** @type {HTMLElement} */ (this.querySelector(':scope > button'));
    }
    if (!this.#trigger) {
      this.#trigger = document.createElement('button');
      this.#trigger.setAttribute('data-trigger', '');
      this.#trigger.innerHTML = `
        <icon-wc name="search" label="Search"></icon-wc>
      `;
      this.prepend(this.#trigger);
    }

    // Set up ARIA for trigger
    this.#trigger.setAttribute('aria-haspopup', 'dialog');
    this.#trigger.setAttribute('aria-expanded', 'false');

    // Create dialog
    this.#dialog = document.createElement('div');
    this.#dialog.className = 'dialog';
    this.#dialog.setAttribute('role', 'dialog');
    this.#dialog.setAttribute('aria-label', 'Site search');
    this.#dialog.id = `search-dialog-${crypto.randomUUID().slice(0, 8)}`;
    this.#trigger.setAttribute('aria-controls', this.#dialog.id);

    this.#dialog.innerHTML = `
      <div class="backdrop"></div>
      <div class="panel">
        <div class="input-wrapper">
          <icon-wc name="search" class="icon"></icon-wc>
          <input
            type="search"
            name="search"
            class="input"
            placeholder="Search documentation..."
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
            aria-label="Search"
            aria-autocomplete="list"
          />
          <kbd class="shortcut">Esc</kbd>
        </div>
        <div class="results" role="listbox" aria-label="Search results"></div>
        <div class="footer">
          <span class="hint">
            <kbd>↑</kbd><kbd>↓</kbd> to navigate
            <kbd>↵</kbd> to select
            <kbd>esc</kbd> to close
          </span>
          <span class="powered">
            Powered by <a href="https://pagefind.app" target="_blank" rel="noopener">Pagefind</a>
          </span>
        </div>
      </div>
    `;

    this.appendChild(this.#dialog);

    // Cache references
    this.#input = /** @type {HTMLInputElement} */ (this.#dialog.querySelector('.input'));
    this.#resultsList = /** @type {HTMLElement} */ (this.#dialog.querySelector('.results'));
  }

  #bindEvents() {
    // Trigger click
    this.#trigger.addEventListener('click', this.#handleTriggerClick);

    // Global keyboard shortcut (Cmd/Ctrl+K) — skip if another instance already bound
    if (!getBoundHotkeys().includes('meta+k')) {
      this.#unbindHotkey = /** @type {() => void} */ (bindHotkey('meta+k', () => {
        if (this.#isOpen) {
          this.close();
        } else {
          this.open();
        }
      }, { global: true }));
    }

    // Escape to close (not a global hotkey — only when open)
    this.listen(document, 'keydown', this.#handleEscape);

    // Dialog events
    this.#dialog.querySelector('.backdrop')?.addEventListener('click', () => this.close());
    this.#input.addEventListener('input', this.#handleInput);
    this.#input.addEventListener('keydown', this.#handleInputKeyDown);
    this.#resultsList.addEventListener('click', this.#handleResultClick);
  }

  #handleTriggerClick = (e) => {
    e.stopPropagation();
    this.open();
  };

  #handleEscape = (e) => {
    if (e.key === 'Escape' && this.#isOpen) {
      e.preventDefault();
      this.close();
    }
  };

  #handleInput = () => {
    this.#clearDebounce();
    this.#debounceTimer = setTimeout(() => {
      this.#search(this.#input.value);
    }, SiteSearch.#DEBOUNCE_MS);
  };

  #handleInputKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.#focusResult(this.#activeIndex + 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.#focusResult(this.#activeIndex - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (this.#activeIndex >= 0 && this.#results[this.#activeIndex]) {
          this.#navigateToResult(this.#results[this.#activeIndex]);
        }
        break;
    }
  };

  #handleResultClick = (e) => {
    const resultEl = e.target.closest('[data-result-index]');
    if (resultEl) {
      const index = parseInt(resultEl.dataset.resultIndex, 10);
      if (this.#results[index]) {
        this.#navigateToResult(this.#results[index]);
      }
    }
  };

  async #initPagefind() {
    if (this.#pagefind) return;

    try {
      // Dynamic import with @vite-ignore to prevent Vite from rewriting the path
      // @ts-ignore — Pagefind is generated at build time; path won't resolve in TS
      this.#pagefind = await import(/* @vite-ignore */ '/pagefind/pagefind.js');
      await this.#pagefind.options({
        excerptLength: 20
      });
    } catch (error) {
      console.warn('Pagefind not available. Run `npm run search:index` to build the search index.');
      this.#pagefind = null;
    }
  }

  async #search(query) {
    if (!query.trim()) {
      this.#renderResults([]);
      return;
    }

    await this.#initPagefind();

    if (!this.#pagefind) {
      this.#renderNoPagefind();
      return;
    }

    try {
      this.#resultsList.innerHTML = '<div class="loading">Searching...</div>';

      const search = await this.#pagefind.search(query);
      const results = await Promise.all(
        search.results.slice(0, SiteSearch.#MAX_RESULTS).map(r => r.data())
      );

      this.#results = results;
      this.#renderResults(results);
    } catch (error) {
      console.error('Search error:', error);
      this.#resultsList.innerHTML = '<div class="error">Search error. Please try again.</div>';
    }
  }

  #renderResults(results) {
    this.#activeIndex = -1;

    if (results.length === 0) {
      if (this.#input.value.trim()) {
        this.#resultsList.innerHTML = '<div class="empty">No results found</div>';
      } else {
        this.#resultsList.innerHTML = '';
      }
      return;
    }

    this.#resultsList.innerHTML = results.map((result, index) => `
      <a
        id="search-result-${index}"
        href="${result.url}"
        class="result"
        role="option"
        data-result-index="${index}"
        tabindex="-1"
      >
        <span class="result-title">${result.meta?.title || 'Untitled'}</span>
        <span class="result-excerpt">${result.excerpt || ''}</span>
      </a>
    `).join('');
  }

  #renderNoPagefind() {
    this.#resultsList.innerHTML = `
      <div class="error">
        Search index not found.<br>
        Run <code>npm run search:index</code> after building.
      </div>
    `;
  }

  #focusResult(index) {
    if (this.#results.length === 0) return;

    // Wrap around
    if (index < 0) index = this.#results.length - 1;
    if (index >= this.#results.length) index = 0;

    // Remove previous active
    const prevActive = this.#resultsList.querySelector('[data-active]');
    if (prevActive) {
      prevActive.removeAttribute('data-active');
    }
    this.#input?.removeAttribute('aria-activedescendant');

    // Set new active
    this.#activeIndex = index;
    const resultEl = this.#resultsList.querySelector(`[data-result-index="${index}"]`);
    if (resultEl) {
      resultEl.setAttribute('data-active', '');
      this.#input?.setAttribute('aria-activedescendant', resultEl.id);
      resultEl.scrollIntoView({ block: 'nearest' });
    }
  }

  #navigateToResult(result) {
    if (result.url) {
      this.close();
      window.location.href = result.url;
    }
  }

  #clearDebounce() {
    if (this.#debounceTimer) {
      clearTimeout(this.#debounceTimer);
      this.#debounceTimer = null;
    }
  }

  open() {
    if (this.#isOpen) return;

    this.#isOpen = true;
    this.setAttribute('open', '');
    this.#trigger?.setAttribute('aria-expanded', 'true');

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    // Focus input
    requestAnimationFrame(() => {
      this.#input?.focus();
      this.#input?.select();
    });

    // Initialize pagefind in background
    this.#initPagefind();

    this.dispatchEvent(new CustomEvent('site-search:open', { bubbles: true }));
  }

  close() {
    if (!this.#isOpen) return;

    this.#isOpen = false;
    this.removeAttribute('open');
    this.#trigger?.setAttribute('aria-expanded', 'false');

    // Restore body scroll
    document.body.style.overflow = '';

    // Clear state
    this.#clearDebounce();
    this.#input.value = '';
    this.#input?.removeAttribute('aria-activedescendant');
    this.#results = [];
    this.#activeIndex = -1;
    this.#resultsList.innerHTML = '';

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
