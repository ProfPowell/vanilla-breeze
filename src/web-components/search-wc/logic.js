/**
 * search-wc: Site search component powered by Pagefind
 *
 * Provides a search interface with keyboard shortcuts, result highlighting,
 * and keyboard navigation. Uses Pagefind for fast client-side search.
 *
 * @attr {boolean} data-open - Whether search dialog is open (reflected)
 *
 * @example Basic usage
 * <search-wc>
 *   <button data-trigger>
 *     <x-icon name="search"></x-icon>
 *     Search
 *   </button>
 * </search-wc>
 *
 * @example Icon-only trigger
 * <search-wc>
 *   <button data-trigger aria-label="Search">
 *     <x-icon name="search"></x-icon>
 *   </button>
 * </search-wc>
 *
 * Keyboard shortcuts:
 * - Cmd/Ctrl+K: Open search
 * - Escape: Close search
 * - Up/Down arrows: Navigate results
 * - Enter: Go to selected result
 */

import { bindHotkey } from '../../utils/hotkey-bind.js';

class SearchWc extends HTMLElement {
  static #DEBOUNCE_MS = 150;
  static #MAX_RESULTS = 8;

  #trigger;
  #dialog;
  #input;
  #resultsList;
  #results = [];
  #activeIndex = -1;
  #isOpen = false;
  #pagefind = null;
  #debounceTimer = null;
  #unbindHotkey = null;

  connectedCallback() {
    this.#render();
    this.#bindEvents();
  }

  disconnectedCallback() {
    this.#unbindHotkey?.();
    document.removeEventListener('keydown', this.#handleEscape);
    this.#clearDebounce();
  }

  #render() {
    // Find or create trigger
    this.#trigger = this.querySelector(':scope > [data-trigger]');
    if (!this.#trigger) {
      this.#trigger = this.querySelector(':scope > button');
    }
    if (!this.#trigger) {
      this.#trigger = document.createElement('button');
      this.#trigger.setAttribute('data-trigger', '');
      this.#trigger.innerHTML = `
        <x-icon name="search" label="Search"></x-icon>
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
          <x-icon name="search" class="icon"></x-icon>
          <input
            type="search"
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
    this.#input = this.#dialog.querySelector('.input');
    this.#resultsList = this.#dialog.querySelector('.results');
  }

  #bindEvents() {
    // Trigger click
    this.#trigger.addEventListener('click', this.#handleTriggerClick);

    // Global keyboard shortcut (Cmd/Ctrl+K) via centralized hotkey-bind
    this.#unbindHotkey = bindHotkey('meta+k', () => {
      if (this.#isOpen) {
        this.close();
      } else {
        this.open();
      }
    }, { global: true });

    // Escape to close (not a global hotkey — only when open)
    document.addEventListener('keydown', this.#handleEscape);

    // Dialog events
    this.#dialog.querySelector('.backdrop').addEventListener('click', () => this.close());
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
    }, SearchWc.#DEBOUNCE_MS);
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
      // Use Function constructor to create a dynamic import that bypasses Vite
      // This is necessary because Vite blocks imports from public/ during dev
      const importPagefind = new Function('return import("/pagefind/pagefind.js")');
      this.#pagefind = await importPagefind();
      await this.#pagefind.options({
        excerptLength: 20
      });
    } catch (error) {
      console.warn('Pagefind not available. Run `npm run search:dev` to build the search index.');
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
        search.results.slice(0, SearchWc.#MAX_RESULTS).map(r => r.data())
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
        Run <code>npx pagefind --site dist</code> after building.
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
    if (prevActive) prevActive.removeAttribute('data-active');

    // Set new active
    this.#activeIndex = index;
    const resultEl = this.#resultsList.querySelector(`[data-result-index="${index}"]`);
    if (resultEl) {
      resultEl.setAttribute('data-active', '');
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
    this.setAttribute('data-open', '');
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

    this.dispatchEvent(new CustomEvent('search-wc-open', { bubbles: true }));
  }

  close() {
    if (!this.#isOpen) return;

    this.#isOpen = false;
    this.removeAttribute('data-open');
    this.#trigger?.setAttribute('aria-expanded', 'false');

    // Restore body scroll
    document.body.style.overflow = '';

    // Clear state
    this.#clearDebounce();
    this.#input.value = '';
    this.#results = [];
    this.#activeIndex = -1;
    this.#resultsList.innerHTML = '';

    // Return focus to trigger
    this.#trigger?.focus();

    this.dispatchEvent(new CustomEvent('search-wc-close', { bubbles: true }));
  }

  get isOpen() {
    return this.#isOpen;
  }
}

customElements.define('search-wc', SearchWc);

export { SearchWc };
