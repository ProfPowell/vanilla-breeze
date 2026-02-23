/**
 * emoji-picker: Accessible emoji picker with search, categories, and insertion
 *
 * Provides a trigger button that opens a dropdown panel for browsing, searching,
 * and selecting emoji. Can insert directly into a target input/textarea/contenteditable.
 *
 * @attr {string} for - ID of target input/textarea/contenteditable for insertion
 * @attr {boolean} data-open - Whether picker is open (reflected)
 * @attr {number} recent-limit - Max recent emoji stored (default: 24)
 *
 * @example
 * <textarea id="msg"></textarea>
 * <emoji-picker for="msg">
 *   <button data-trigger type="button">😀</button>
 * </emoji-picker>
 *
 * @fires emoji-picker:select - When an emoji is selected. Detail: { shortcode, emoji, name, keywords }
 * @fires emoji-picker:open - When picker opens
 * @fires emoji-picker:close - When picker closes
 */

import {
  EMOJI_MAP,
  EMOJI_GROUPS,
  EMOJI_GROUP_LABELS,
  EMOJI_GROUP_ICONS,
  getByGroup,
  searchEmoji,
} from '../../data/emoji-data.js';

const COLUMNS = 8;
const SEARCH_DEBOUNCE = 150;
const RECENT_KEY = 'vb-emoji-recent';

class EmojiPicker extends HTMLElement {
  #trigger;
  #picker;
  #searchInput;
  #grid;
  #categoryNav;
  #isOpen = false;
  #gridCells = [];
  #activeGridIndex = -1;
  #searchTimer = null;
  #currentQuery = '';

  connectedCallback() {
    this.#setup();
  }

  disconnectedCallback() {
    this.#cleanup();
  }

  #setup() {
    // Find or create trigger
    this.#trigger = this.querySelector(':scope > [data-trigger]');
    if (!this.#trigger) {
      this.#trigger = this.querySelector(':scope > button');
    }
    if (!this.#trigger) {
      this.#trigger = document.createElement('button');
      this.#trigger.type = 'button';
      this.#trigger.textContent = '😀';
      this.#trigger.setAttribute('data-trigger', '');
      this.prepend(this.#trigger);
    }

    // ARIA on trigger
    this.#trigger.setAttribute('aria-haspopup', 'dialog');
    this.#trigger.setAttribute('aria-expanded', 'false');
    this.#trigger.setAttribute('aria-label', this.#trigger.getAttribute('aria-label') || 'Open emoji picker');

    // Build picker panel
    this.#buildPicker();

    // Event listeners
    this.#trigger.addEventListener('click', this.#handleTriggerClick);
    document.addEventListener('click', this.#handleOutsideClick);
    document.addEventListener('keydown', this.#handleGlobalKeyDown);
  }

  #cleanup() {
    if (this.#searchTimer) clearTimeout(this.#searchTimer);
    this.#trigger?.removeEventListener('click', this.#handleTriggerClick);
    document.removeEventListener('click', this.#handleOutsideClick);
    document.removeEventListener('keydown', this.#handleGlobalKeyDown);
  }

  #buildPicker() {
    this.#picker = document.createElement('div');
    this.#picker.classList.add('picker');
    this.#picker.setAttribute('role', 'dialog');
    this.#picker.setAttribute('aria-label', 'Emoji picker');
    this.#picker.hidden = true;

    // Search input
    this.#searchInput = document.createElement('input');
    this.#searchInput.type = 'search';
    this.#searchInput.placeholder = 'Search emoji\u2026';
    this.#searchInput.setAttribute('aria-label', 'Search emoji');
    this.#searchInput.addEventListener('input', this.#handleSearchInput);
    this.#searchInput.addEventListener('keydown', this.#handleSearchKeyDown);
    this.#picker.appendChild(this.#searchInput);

    // Category tabs
    this.#categoryNav = document.createElement('nav');
    this.#categoryNav.classList.add('categories');
    this.#categoryNav.setAttribute('role', 'tablist');
    this.#categoryNav.setAttribute('aria-label', 'Emoji categories');

    for (const group of EMOJI_GROUPS) {
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-selected', group === EMOJI_GROUPS[0] ? 'true' : 'false');
      tab.setAttribute('data-group', group);
      tab.setAttribute('aria-label', EMOJI_GROUP_LABELS[group]);
      tab.title = EMOJI_GROUP_LABELS[group];
      tab.textContent = EMOJI_GROUP_ICONS[group];
      tab.addEventListener('click', this.#handleCategoryClick);
      this.#categoryNav.appendChild(tab);
    }
    this.#picker.appendChild(this.#categoryNav);

    // Grid
    this.#grid = document.createElement('div');
    this.#grid.classList.add('grid');
    this.#grid.setAttribute('role', 'grid');
    this.#grid.setAttribute('aria-label', 'Emoji');
    this.#grid.addEventListener('keydown', this.#handleGridKeyDown);
    this.#picker.appendChild(this.#grid);

    this.appendChild(this.#picker);

    // Render full grid
    this.#renderGrid();
  }

  #renderGrid(entries = null) {
    this.#grid.innerHTML = '';
    this.#gridCells = [];
    this.#activeGridIndex = -1;

    const recents = this.#getRecents();

    // Recents section
    if (!this.#currentQuery && recents.length > 0) {
      const heading = document.createElement('div');
      heading.classList.add('group-label');
      heading.textContent = 'Recently Used';
      heading.setAttribute('data-group-heading', 'recent');
      this.#grid.appendChild(heading);

      for (const shortcode of recents) {
        const entry = EMOJI_MAP.get(shortcode);
        if (entry) this.#addCell(entry);
      }
    }

    const list = entries || null;

    if (list) {
      // Search results — flat list
      if (list.length === 0) {
        const empty = document.createElement('div');
        empty.classList.add('no-results');
        empty.textContent = 'No emoji found';
        this.#grid.appendChild(empty);
      } else {
        for (const entry of list) {
          this.#addCell(entry);
        }
      }
    } else {
      // Full grid by group
      for (const group of EMOJI_GROUPS) {
        const heading = document.createElement('div');
        heading.classList.add('group-label');
        heading.textContent = EMOJI_GROUP_LABELS[group];
        heading.setAttribute('data-group-heading', group);
        this.#grid.appendChild(heading);

        const groupEntries = getByGroup(group);
        for (const entry of groupEntries) {
          this.#addCell(entry);
        }
      }
    }
  }

  #addCell(entry) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('role', 'gridcell');
    btn.setAttribute('tabindex', '-1');
    btn.setAttribute('data-shortcode', entry.shortcode);
    btn.title = `${entry.name} :${entry.shortcode}:`;
    btn.textContent = entry.emoji;
    btn.addEventListener('click', this.#handleEmojiClick);
    this.#grid.appendChild(btn);
    this.#gridCells.push(btn);
  }

  // ── Event handlers ─────────────────────────────────────────────────

  #handleTriggerClick = (e) => {
    e.stopPropagation();
    this.toggle();
  };

  #handleOutsideClick = (e) => {
    if (this.#isOpen && !this.contains(e.target)) {
      this.close();
    }
  };

  #handleGlobalKeyDown = (e) => {
    if (e.key === 'Escape' && this.#isOpen) {
      e.preventDefault();
      this.close();
      this.#trigger?.focus();
    }
  };

  #handleSearchInput = () => {
    if (this.#searchTimer) clearTimeout(this.#searchTimer);
    this.#searchTimer = setTimeout(() => {
      this.#currentQuery = this.#searchInput.value.trim();
      if (this.#currentQuery) {
        const results = searchEmoji(this.#currentQuery);
        this.#renderGrid(results);
      } else {
        this.#renderGrid();
      }
    }, SEARCH_DEBOUNCE);
  };

  #handleSearchKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (this.#gridCells.length > 0) {
        this.#focusGridCell(0);
      }
    }
  };

  #handleCategoryClick = (e) => {
    const group = e.currentTarget.getAttribute('data-group');

    // Update active tab
    for (const tab of this.#categoryNav.querySelectorAll('[role="tab"]')) {
      tab.setAttribute('aria-selected', tab === e.currentTarget ? 'true' : 'false');
    }

    // Clear search if active
    if (this.#currentQuery) {
      this.#searchInput.value = '';
      this.#currentQuery = '';
      this.#renderGrid();
    }

    // Scroll to group heading
    const heading = this.#grid.querySelector(`[data-group-heading="${group}"]`);
    if (heading) {
      heading.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }
  };

  #handleGridKeyDown = (e) => {
    const total = this.#gridCells.length;
    if (total === 0) return;

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        this.#focusGridCell(this.#activeGridIndex + 1);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        this.#focusGridCell(this.#activeGridIndex - 1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        this.#focusGridCell(this.#activeGridIndex + COLUMNS);
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (this.#activeGridIndex < COLUMNS) {
          // Move focus back to search
          this.#searchInput.focus();
          this.#activeGridIndex = -1;
        } else {
          this.#focusGridCell(this.#activeGridIndex - COLUMNS);
        }
        break;
      case 'Home':
        e.preventDefault();
        this.#focusGridCell(0);
        break;
      case 'End':
        e.preventDefault();
        this.#focusGridCell(total - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (this.#activeGridIndex >= 0) {
          this.#gridCells[this.#activeGridIndex].click();
        }
        break;
      case 'Tab':
        // Close picker on Tab out
        this.close();
        break;
    }
  };

  #handleEmojiClick = (e) => {
    const shortcode = e.currentTarget.getAttribute('data-shortcode');
    const entry = EMOJI_MAP.get(shortcode);
    if (!entry) return;

    // Save to recents
    this.#addRecent(shortcode);

    // Insert into target
    this.#insertEmoji(entry);

    // Dispatch event
    this.dispatchEvent(new CustomEvent('emoji-picker:select', {
      bubbles: true,
      detail: {
        shortcode: entry.shortcode,
        emoji: entry.emoji,
        name: entry.name,
        keywords: entry.keywords,
      }
    }));

  };

  // ── Grid navigation ────────────────────────────────────────────────

  #focusGridCell(index) {
    const total = this.#gridCells.length;
    if (total === 0) return;

    // Clamp
    if (index < 0) index = 0;
    if (index >= total) index = total - 1;

    this.#activeGridIndex = index;
    this.#gridCells[index].focus();
  }

  // ── Insertion ──────────────────────────────────────────────────────

  #insertEmoji(entry) {
    const targetId = this.getAttribute('for');
    if (!targetId) return;

    const target = document.getElementById(targetId);
    if (!target) return;

    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      const start = target.selectionStart ?? target.value.length;
      const end = target.selectionEnd ?? start;
      const before = target.value.slice(0, start);
      const after = target.value.slice(end);
      target.value = before + entry.emoji + after;
      const newPos = start + entry.emoji.length;
      target.setSelectionRange(newPos, newPos);
      target.dispatchEvent(new Event('input', { bubbles: true }));
      target.focus();
    } else if (target.isContentEditable) {
      target.focus();
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(entry.emoji));
        range.collapse(false);
      }
    }
  }

  // ── Recents ────────────────────────────────────────────────────────

  #getRecents() {
    try {
      return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    } catch {
      return [];
    }
  }

  #addRecent(shortcode) {
    const limit = parseInt(this.getAttribute('recent-limit'), 10) || 24;
    let recents = this.#getRecents();
    recents = recents.filter(s => s !== shortcode);
    recents.unshift(shortcode);
    if (recents.length > limit) recents.length = limit;
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(recents));
    } catch {
      // localStorage may be unavailable
    }
  }

  // ── Open/Close ─────────────────────────────────────────────────────

  open() {
    if (this.#isOpen) return;

    this.#isOpen = true;
    this.setAttribute('data-open', '');
    this.#trigger?.setAttribute('aria-expanded', 'true');
    this.#picker.hidden = false;

    // Reset search
    this.#searchInput.value = '';
    this.#currentQuery = '';
    this.#renderGrid();

    // Focus search input
    requestAnimationFrame(() => {
      this.#searchInput.focus();
    });

    this.dispatchEvent(new CustomEvent('emoji-picker:open', { bubbles: true }));
  }

  close() {
    if (!this.#isOpen) return;

    this.#isOpen = false;
    this.removeAttribute('data-open');
    this.#trigger?.setAttribute('aria-expanded', 'false');
    this.#picker.hidden = true;

    this.dispatchEvent(new CustomEvent('emoji-picker:close', { bubbles: true }));
  }

  toggle() {
    if (this.#isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  get isOpen() {
    return this.#isOpen;
  }
}

customElements.define('emoji-picker', EmojiPicker);

export { EmojiPicker };
