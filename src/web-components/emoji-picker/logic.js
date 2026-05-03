/**
 * emoji-picker: Accessible emoji picker with search, categories, and insertion
 *
 * Provides a trigger button that opens a dropdown panel for browsing, searching,
 * and selecting emoji. Can insert directly into a target input/textarea/contenteditable.
 *
 * No-JS fallback: the trigger button remains visible but non-functional.
 * The underlying text field still works — users can use OS emoji keyboards.
 * The picker is an optional enhancement.
 *
 * @attr {string}  for          - ID of target input/textarea/contenteditable for insertion
 * @attr {number}  recent-limit - Max recent emoji stored (default: 24)
 *
 * `open` is reflected state only — set by open()/close()/toggle() methods,
 * not intended as initial markup. Use the JS API for programmatic control.
 *
 * @fires emoji-picker:select - When an emoji is selected. Detail: { shortcode, emoji, name, keywords }
 * @fires emoji-picker:open - When picker opens
 * @fires emoji-picker:close - When picker closes
 *
 * @example
 * <textarea id="msg"></textarea>
 * <emoji-picker for="msg">
 *   <button data-trigger type="button">😀</button>
 * </emoji-picker>
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

// Lazy-loaded: emoji data is only imported when picker is first connected
let emojiModule = null;

async function loadEmojiModule() {
  if (emojiModule) return emojiModule;
  emojiModule = await import('../../data/emoji-data.js');
  return emojiModule;
}

const COLUMNS = 8;
const SEARCH_DEBOUNCE = 150;
const RECENT_KEY = 'vb-emoji-recent';

class EmojiPicker extends VBElement {
  #trigger;
  #picker;
  #searchInput;
  #grid;
  #categoryNav;
  #isOpen = false;
  /** @type {HTMLButtonElement[]} */
  #gridCells = [];
  #activeGridIndex = -1;
  /** @type {ReturnType<typeof setTimeout> | null} */
  #searchTimer = null;
  #currentQuery = '';
  /** @type {any} */
  #emojiData = null;
  #setupDone = false;

  /* Saved selection state for insertion after picker interaction */
  /** @type {{ start: number, end: number } | null} */
  #savedInputSelection = null;
  /** @type {Range | null} */
  #savedRange = null;

  async setup() {
    this.#emojiData = await loadEmojiModule();

    if (!this.#setupDone) {
      this.#build();
      this.#setupDone = true;
    }

    // Bind global listeners (removed on disconnect)
    if (this.#trigger) this.listen(this.#trigger, 'click', this.#handleTriggerClick);
    this.listen(document, 'click', this.#handleOutsideClick);
    this.listen(document, 'keydown', this.#handleGlobalKeyDown);
  }

  teardown() {
    if (this.#searchTimer) {
      clearTimeout(this.#searchTimer);
      this.setState('search-pending', false);
    }
  }

  #build() {
    // Find or create trigger
    this.#trigger = this.querySelector(':scope > [data-trigger]')
      || this.querySelector(':scope > button');

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
    this.#trigger.setAttribute('aria-label',
      this.#trigger.getAttribute('aria-label') || 'Open emoji picker');

    // Build picker panel
    this.#buildPicker();
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

    for (const group of this.#emojiData.EMOJI_GROUPS) {
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-selected',
        group === this.#emojiData.EMOJI_GROUPS[0] ? 'true' : 'false');
      tab.setAttribute('data-group', group);
      tab.setAttribute('aria-label', this.#emojiData.EMOJI_GROUP_LABELS[group]);
      tab.title = this.#emojiData.EMOJI_GROUP_LABELS[group];
      tab.textContent = this.#emojiData.EMOJI_GROUP_ICONS[group];
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

  /** @param {any[] | null} [entries] */
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
        const entry = this.#emojiData.EMOJI_MAP.get(shortcode);
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
      for (const group of this.#emojiData.EMOJI_GROUPS) {
        const heading = document.createElement('div');
        heading.classList.add('group-label');
        heading.textContent = this.#emojiData.EMOJI_GROUP_LABELS[group];
        heading.setAttribute('data-group-heading', group);
        this.#grid.appendChild(heading);

        const groupEntries = this.#emojiData.getByGroup(group);
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

  // ── Selection preservation ────────────────────────────────────────

  #saveTargetSelection() {
    const targetId = this.getAttribute('for');
    if (!targetId) return;

    const target = document.getElementById(targetId);
    if (!target) return;

    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      const input = /** @type {HTMLInputElement} */ (target);
      this.#savedInputSelection = {
        start: input.selectionStart ?? input.value.length,
        end: input.selectionEnd ?? input.value.length
      };
      this.#savedRange = null;
    } else if (target.isContentEditable) {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        this.#savedRange = sel.getRangeAt(0).cloneRange();
      }
      this.#savedInputSelection = null;
    }
  }

  // ── Event handlers ─────────────────────────────────────────────────

  #handleTriggerClick = (e) => {
    e.stopPropagation();
    this.toggle();
  };

  #handleOutsideClick = (e) => {
    if (this.#isOpen && !this.contains(/** @type {Node} */ (e.target))) {
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
    this.setState('search-pending', true);
    this.#searchTimer = setTimeout(() => {
      this.setState('search-pending', false);
      this.#currentQuery = this.#searchInput.value.trim();
      if (this.#currentQuery) {
        const results = this.#emojiData.searchEmoji(this.#currentQuery);
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
      tab.setAttribute('aria-selected',
        tab === e.currentTarget ? 'true' : 'false');
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
        this.close();
        break;
    }
  };

  #handleEmojiClick = (e) => {
    const shortcode = e.currentTarget.getAttribute('data-shortcode');
    const entry = this.#emojiData.EMOJI_MAP.get(shortcode);
    if (!entry) return;

    this.#addRecent(shortcode);
    this.#insertEmoji(entry);

    this.dispatchEvent(new CustomEvent('emoji-picker:select', {
      bubbles: true,
      detail: {
        shortcode: entry.shortcode,
        emoji: entry.emoji,
        name: entry.name,
        keywords: entry.keywords,
      }
    }));

    // Close after selection — deliberate choice for quick composition flows
    this.close();
    this.#refocusTarget();
  };

  // ── Grid navigation ────────────────────────────────────────────────

  #focusGridCell(index) {
    const total = this.#gridCells.length;
    if (total === 0) return;

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
      const input = /** @type {HTMLInputElement} */ (target);
      // Use saved selection (preserved before picker opened)
      const start = this.#savedInputSelection?.start ?? input.value.length;
      const end = this.#savedInputSelection?.end ?? start;
      const before = input.value.slice(0, start);
      const after = input.value.slice(end);
      input.value = before + entry.emoji + after;
      const newPos = start + entry.emoji.length;
      input.setSelectionRange(newPos, newPos);
      // Update saved selection for next insertion
      this.#savedInputSelection = { start: newPos, end: newPos };
      target.dispatchEvent(new Event('input', { bubbles: true }));
    } else if (target.isContentEditable) {
      target.focus();
      const sel = window.getSelection();
      if (sel && this.#savedRange) {
        // Restore saved range from before picker opened
        sel.removeAllRanges();
        sel.addRange(this.#savedRange);
        const range = sel.getRangeAt(0);
        range.deleteContents();
        const textNode = document.createTextNode(entry.emoji);
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        // Update saved range for next insertion
        this.#savedRange = range.cloneRange();
      } else if (sel) {
        // Fallback: append at end
        const range = document.createRange();
        range.selectNodeContents(target);
        range.collapse(false);
        const textNode = document.createTextNode(entry.emoji);
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
  }

  #refocusTarget() {
    const targetId = this.getAttribute('for');
    if (!targetId) return;
    const target = document.getElementById(targetId);
    if (target) target.focus();
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
    const limit = parseInt(this.getAttribute('recent-limit') ?? '24', 10) || 24;
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

    // Preserve target selection before moving focus to picker
    this.#saveTargetSelection();

    this.#isOpen = true;
    this.setAttribute('open', '');
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
    this.removeAttribute('open');
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

registerComponent('emoji-picker', EmojiPicker);

export { EmojiPicker };
