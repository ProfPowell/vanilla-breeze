/**
 * emoji-picker: Accessible emoji picker with search, categories, and insertion
 *
 * Provides a trigger button that opens a panel for browsing, searching, and
 * selecting emoji. Can insert directly into a target input/textarea/
 * contenteditable named by `for`, or just fire `emoji-picker:select`.
 *
 * Structure (built once, filtered with `hidden`):
 *   trigger  [aria-haspopup=dialog][aria-expanded][aria-controls]
 *   .picker  [role=dialog][popover=manual]  — top layer, so overflow
 *            containers and dialogs never clip it; positioned below the
 *            trigger (start-aligned, RTL-aware), flipped above when there is
 *            no room, clamped to the viewport
 *     input[type=search][aria-controls=listbox]
 *     .categories [role=toolbar]  — roving tabindex, arrow keys, aria-current
 *                                   synced to the scrolled group
 *     .grid [role=listbox]  > [role=group][aria-label] > button[role=option]
 *                             (one option tabindex=0; arrows follow layout)
 *     .no-results, [role=status] (polite result count)
 *
 * Tab order inside the panel: search → category toolbar → emoji listbox.
 * The picker closes when focus leaves the component, on outside click, on
 * Escape (focus returns to the trigger), and after a selection (focus goes to
 * the `for` target, or back to the trigger when there is none).
 *
 * No-JS fallback: the trigger is hidden until the element is defined. The
 * text field still works — users can use their OS emoji keyboard.
 *
 * @attr {string}  for          - ID of target input/textarea/contenteditable for insertion
 * @attr {number}  recent-limit - Max recent emoji stored (default: 24)
 * @attr {string}  data-label-trigger     - Trigger accessible name when it has no text or aria-label (default "Open emoji picker")
 * @attr {string}  data-label-dialog      - Panel accessible name (default "Emoji picker")
 * @attr {string}  data-label-search      - Search input accessible name (default "Search emoji")
 * @attr {string}  data-label-placeholder - Search input placeholder (default "Search emoji…")
 * @attr {string}  data-label-categories  - Category toolbar accessible name (default "Emoji categories")
 * @attr {string}  data-label-emoji       - Emoji listbox accessible name (default "Emoji")
 * @attr {string}  data-label-recent      - "Recently used" group name
 * @attr {string}  data-label-empty       - Empty search message (default "No emoji found")
 * @attr {string}  data-label-results     - Result-count announcement; "{count}" is replaced (default "{count} emoji found")
 * @attr {string}  data-label-{group}     - Category name, e.g. data-label-smileys, data-label-flags
 *
 * `open` is reflected state only — set by open()/close()/toggle(), not
 * intended as initial markup. `data-upgraded` is set once the panel is built
 * (the emoji data loads asynchronously); `ready` resolves at the same time.
 * open()/close()/toggle() called earlier are queued, never throw.
 *
 * @fires emoji-picker:select - When an emoji is selected. Detail: { shortcode, emoji, name, keywords }
 * @fires emoji-picker:open - When picker opens
 * @fires emoji-picker:close - When picker closes
 *
 * @example
 * <textarea id="msg"></textarea>
 * <emoji-picker for="msg">
 *   <button data-trigger type="button" aria-label="Insert emoji">😀</button>
 * </emoji-picker>
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';
import { supportsPopover } from '../../utils/popover-support.js';

// Deferred evaluation, not a separate download: esbuild inlines this import()
// into every CDN bundle (no code splitting), so the data ships with the
// component chunk and is only *evaluated* on first connect. On the unbundled
// /src graph it is a real lazy fetch.
/** @type {Promise<any> | null} */
let emojiModule = null;
function loadEmojiModule() {
  emojiModule ??= import('../../data/emoji-data.js');
  return emojiModule;
}

const SEARCH_DEBOUNCE = 150;
const RECENT_KEY = 'vb-emoji-recent';
const VIEWPORT_GAP = 8;
/** px slack when deciding whether two cells share a visual row */
const ROW_TOLERANCE = 4;
let uid = 0;

/** Defaults for data-label-* (keys are the dataset suffix) */
const DEFAULT_LABELS = {
  Trigger: 'Open emoji picker',
  Dialog: 'Emoji picker',
  Search: 'Search emoji',
  Placeholder: 'Search emoji…',
  Categories: 'Emoji categories',
  Emoji: 'Emoji',
  Recent: 'Recently used',
  Empty: 'No emoji found',
  Results: '{count} emoji found',
};

/**
 * @typedef {{ shortcode: string, emoji: string, name: string, keywords?: string[], group: string }} EmojiEntry
 * @typedef {{ entry: EmojiEntry, aliases: string[] }} CellData
 */

class EmojiPicker extends VBElement {
  /** @type {HTMLButtonElement | null} */
  #trigger = null;
  /** @type {HTMLElement} */
  #picker;
  /** @type {HTMLInputElement} */
  #searchInput;
  /** @type {HTMLElement} */
  #toolbar;
  /** @type {HTMLElement} */
  #grid;
  /** @type {HTMLElement} */
  #empty;
  /** @type {HTMLElement} */
  #status;
  /** @type {HTMLElement} */
  #recentGroup;
  /** @type {Map<string, HTMLElement>} */
  #groups = new Map();
  /** @type {WeakMap<Element, CellData>} */
  #cells = new WeakMap();
  /** @type {HTMLElement | null} */
  #activeCell = null;

  #isOpen = false;
  #built = false;
  #hostBound = false;
  #selecting = false;
  #builtExtended = -1;
  /** Bumped on every connect/disconnect so a stale data load does nothing */
  #gen = 0;
  /** @type {'open' | null} */
  #pending = null;
  /** @type {Promise<void>} */
  #ready;
  /** @type {() => void} */
  #resolveReady = () => {};
  /** @type {ReturnType<typeof setTimeout> | null} */
  #searchTimer = null;
  #query = '';
  /** @type {any} */
  #data = null;
  /** @type {IntersectionObserver | null} */
  #observer = null;
  /** @type {Set<Element>} */
  #inView = new Set();
  #usePopover = false;

  /* Saved selection state for insertion after picker interaction */
  /** @type {{ start: number, end: number } | null} */
  #savedInputSelection = null;
  /** @type {Range | null} */
  #savedRange = null;

  constructor() {
    super();
    this.#ready = new Promise((resolve) => { this.#resolveReady = resolve; });
  }

  /**
   * Resolves once the panel is built and the methods act immediately.
   * @returns {Promise<void>}
   */
  get ready() {
    return this.#ready;
  }

  get isOpen() {
    return this.#isOpen;
  }

  setup() {
    if (this.#hostBound) return false;
    this.#hostBound = true;
    this.#ensureTrigger();

    // One delegated listener per event type on the host. The trigger works
    // before the data has loaded: a click then queues the open.
    this.listen(this, 'click', this.#handleClick);
    this.listen(this, 'keydown', this.#handleKeyDown);
    this.listen(this, 'focusout', this.#handleFocusOut);
    this.listen(this, 'focusin', this.#handleFocusIn);

    const gen = ++this.#gen;
    loadEmojiModule().then((data) => {
      if (gen !== this.#gen || !this.isConnected) return;
      this.#data = data;
      if (!this.#built) this.#build();
      this.listen(document, 'click', this.#handleOutsideClick);
      this.listen(document, data.EXTENDED_EVENT, this.#handleExtended);
      this.setAttribute('data-upgraded', '');
      this.#resolveReady();
      queueMicrotask(() => {
        this.dispatchEvent(new CustomEvent('emoji-picker:upgraded', { bubbles: true }));
      });
      const pending = this.#pending;
      this.#pending = null;
      if (pending === 'open') this.open();
    }).catch((err) => {
      console.error('[emoji-picker] failed to load emoji data', err);
    });

    // data-upgraded is set above, after the build — not by VBElement now.
    return false;
  }

  teardown() {
    this.#gen++;
    this.#hostBound = false;
    this.#pending = null;
    if (this.#searchTimer) {
      clearTimeout(this.#searchTimer);
      this.#searchTimer = null;
      this.setState('search-pending', false);
    }
    if (this.#isOpen) this.close();
  }

  // ── Build ──────────────────────────────────────────────────────────

  /**
   * Author-overridable UI string from a data-label-* attribute.
   * @param {string} key  dataset key suffix, e.g. 'Empty' for data-label-empty
   * @param {string} [fallback]
   */
  #label(key, fallback) {
    return this.dataset[`label${key}`] || fallback || DEFAULT_LABELS[key] || '';
  }

  /** @param {string} group */
  #groupLabel(group) {
    if (group === 'recent') return this.#label('Recent');
    const key = group.charAt(0).toUpperCase() + group.slice(1);
    return this.#label(key, this.#data.EMOJI_GROUP_LABELS[group] || group);
  }

  #ensureTrigger() {
    let trigger = /** @type {HTMLButtonElement | null} */ (
      this.querySelector(':scope > [data-trigger]') || this.querySelector(':scope > button'));

    if (!trigger) {
      trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.textContent = '😀';
      trigger.setAttribute('data-trigger', '');
      this.prepend(trigger);
    }
    this.#trigger = trigger;

    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-expanded', String(this.#isOpen));
    // Only name it when it has no name of its own: a visible text label must
    // stay the accessible name (label-in-name), an emoji glyph alone must not.
    if (!trigger.hasAttribute('aria-label') && !/\p{L}/u.test(trigger.textContent || '')) {
      trigger.setAttribute('aria-label', this.#label('Trigger'));
    }
  }

  #build() {
    const base = `emoji-picker-${++uid}`;

    this.#picker = document.createElement('div');
    this.#picker.className = 'picker';
    this.#picker.id = `${base}-panel`;
    this.#picker.setAttribute('role', 'dialog');
    this.#picker.setAttribute('aria-label', this.#label('Dialog'));
    this.#picker.hidden = true;
    this.#usePopover = supportsPopover;
    if (this.#usePopover) this.#picker.setAttribute('popover', 'manual');
    this.#trigger?.setAttribute('aria-controls', this.#picker.id);

    this.#searchInput = document.createElement('input');
    this.#searchInput.type = 'search';
    this.#searchInput.placeholder = this.#label('Placeholder');
    this.#searchInput.autocomplete = 'off';
    this.#searchInput.spellcheck = false;
    this.#searchInput.setAttribute('aria-label', this.#label('Search'));
    this.#searchInput.setAttribute('aria-controls', `${base}-listbox`);
    this.#searchInput.addEventListener('input', this.#handleSearchInput);

    this.#toolbar = document.createElement('div');
    this.#toolbar.className = 'categories';
    this.#toolbar.setAttribute('role', 'toolbar');
    this.#toolbar.setAttribute('aria-label', this.#label('Categories'));
    this.#data.EMOJI_GROUPS.forEach((group, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.group = group;
      btn.tabIndex = i === 0 ? 0 : -1;
      btn.setAttribute('aria-label', this.#groupLabel(group));
      btn.title = this.#groupLabel(group);
      btn.textContent = this.#data.EMOJI_GROUP_ICONS[group];
      this.#toolbar.appendChild(btn);
    });

    this.#grid = document.createElement('div');
    this.#grid.className = 'grid';
    this.#grid.id = `${base}-listbox`;
    this.#grid.setAttribute('role', 'listbox');
    this.#grid.setAttribute('aria-label', this.#label('Emoji'));

    this.#recentGroup = this.#makeGroup('recent');
    this.#grid.appendChild(this.#recentGroup);
    for (const group of this.#data.EMOJI_GROUPS) {
      const el = this.#makeGroup(group);
      this.#groups.set(group, el);
      this.#grid.appendChild(el);
    }

    this.#empty = document.createElement('p');
    this.#empty.className = 'no-results';
    this.#empty.textContent = this.#label('Empty');
    this.#empty.hidden = true;

    this.#status = document.createElement('p');
    this.#status.className = 'status';
    this.#status.setAttribute('role', 'status');

    this.#picker.append(this.#searchInput, this.#toolbar, this.#grid, this.#empty, this.#status);
    this.appendChild(this.#picker);

    this.#renderGroups();
    this.#built = true;
  }

  /** @param {string} group */
  #makeGroup(group) {
    const el = document.createElement('div');
    el.className = 'group';
    el.dataset.group = group;
    el.setAttribute('role', 'group');
    el.setAttribute('aria-label', this.#groupLabel(group));
    return el;
  }

  /**
   * The visible heading of a group. It is aria-hidden: listbox groups may
   * only own options, and the group already carries the name.
   * @param {string} group
   */
  #makeHeading(group) {
    const h = document.createElement('span');
    h.className = 'group-label';
    h.setAttribute('aria-hidden', 'true');
    h.textContent = this.#groupLabel(group);
    return h;
  }

  /** @param {EmojiEntry} entry */
  #makeCell(entry) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('role', 'option');
    btn.tabIndex = -1;
    btn.dataset.shortcode = entry.shortcode;
    btn.setAttribute('aria-label', entry.name);
    btn.title = `:${entry.shortcode}:`;
    btn.textContent = entry.emoji;
    return btn;
  }

  /**
   * (Re)fill the category groups — once at build, again only if the extended
   * set arrived since. Glyphs are de-duplicated (gemoji lists one glyph under
   * several shortcodes); the extra shortcodes stay searchable as aliases.
   */
  #renderGroups() {
    /** @type {Map<string, CellData>} */
    const byGlyph = new Map();
    for (const group of this.#data.EMOJI_GROUPS) {
      const el = /** @type {HTMLElement} */ (this.#groups.get(group));
      const nodes = [this.#makeHeading(group)];
      for (const entry of this.#data.getByGroup(group)) {
        const seen = byGlyph.get(entry.emoji);
        if (seen) { seen.aliases.push(entry.shortcode); continue; }
        const cell = this.#makeCell(entry);
        /** @type {CellData} */
        const data = { entry, aliases: [] };
        byGlyph.set(entry.emoji, data);
        this.#cells.set(cell, data);
        nodes.push(cell);
      }
      el.replaceChildren(...nodes);
    }
    this.#builtExtended = this.#data.extendedCount();
    this.#activeCell = null;
  }

  #renderRecents() {
    const nodes = [];
    for (const shortcode of this.#getRecents()) {
      const entry = this.#data.resolveEmoji(shortcode);
      if (!entry) continue;
      const cell = this.#makeCell(entry);
      this.#cells.set(cell, { entry, aliases: [] });
      nodes.push(cell);
    }
    if (nodes.length) nodes.unshift(this.#makeHeading('recent'));
    this.#recentGroup.replaceChildren(...nodes);
    this.#activeCell = null;
  }

  // ── Filtering ──────────────────────────────────────────────────────

  /**
   * @param {CellData} data
   * @param {string} q lower-cased query
   */
  #matches(data, q) {
    const { entry, aliases } = data;
    return entry.shortcode.includes(q)
      || entry.name.toLowerCase().includes(q)
      || (entry.keywords?.some((k) => k.includes(q)) ?? false)
      || aliases.some((a) => a.includes(q));
  }

  #applyFilter() {
    const q = this.#query.toLowerCase();
    let count = 0;

    this.#recentGroup.hidden = Boolean(q) || this.#recentGroup.childElementCount === 0;

    for (const el of this.#groups.values()) {
      let any = false;
      for (const cell of el.querySelectorAll('[role="option"]')) {
        const data = this.#cells.get(cell);
        const match = !q || (data ? this.#matches(data, q) : false);
        /** @type {HTMLElement} */ (cell).hidden = !match;
        if (match) { any = true; count++; }
      }
      el.hidden = !any;
    }

    this.#empty.hidden = count > 0;
    this.#status.textContent = q
      ? (count > 0 ? this.#label('Results').replace('{count}', String(count)) : this.#label('Empty'))
      : '';

    if (!this.#activeCell || !this.#isVisibleCell(this.#activeCell)) {
      this.#setActiveCell(this.#visibleCells()[0] ?? null, false);
    }
  }

  // ── Roving focus ───────────────────────────────────────────────────

  /** @param {Element} cell */
  #isVisibleCell(cell) {
    return cell.isConnected && !(/** @type {HTMLElement} */ (cell)).hidden
      && !(/** @type {HTMLElement} */ (cell.parentElement)).hidden;
  }

  /** @returns {HTMLElement[]} */
  #visibleCells() {
    return /** @type {HTMLElement[]} */ ([...this.#grid.querySelectorAll('[role="option"]')])
      .filter((c) => this.#isVisibleCell(c));
  }

  /**
   * @param {HTMLElement | null} cell
   * @param {boolean} focus
   */
  #setActiveCell(cell, focus) {
    if (this.#activeCell && this.#activeCell !== cell) this.#activeCell.tabIndex = -1;
    this.#activeCell = cell;
    if (!cell) return;
    cell.tabIndex = 0;
    if (focus) {
      cell.focus({ preventScroll: true });
      cell.scrollIntoView({ block: 'nearest' });
    }
  }

  /**
   * @param {HTMLElement | undefined} btn
   * @param {boolean} focus
   */
  #setToolbarActive(btn, focus) {
    if (!btn) return;
    for (const b of /** @type {NodeListOf<HTMLElement>} */ (this.#toolbar.querySelectorAll('button'))) {
      b.tabIndex = b === btn ? 0 : -1;
    }
    if (focus) btn.focus();
  }

  /** @param {string | undefined} group */
  #setCurrentGroup(group) {
    /** @type {HTMLElement | undefined} */
    let current;
    for (const b of /** @type {NodeListOf<HTMLElement>} */ (this.#toolbar.querySelectorAll('button'))) {
      if (b.dataset.group === group) { b.setAttribute('aria-current', 'true'); current = b; }
      else b.removeAttribute('aria-current');
    }
    // Tab into the toolbar lands on the current category, unless the user is
    // already moving within it.
    if (current && !this.#toolbar.contains(document.activeElement)) {
      this.#setToolbarActive(current, false);
    }
  }

  #observeGroups() {
    this.#observer?.disconnect();
    this.#inView.clear();
    if (typeof IntersectionObserver === 'undefined') return;
    // The "current" category is the first group overlapping the top quarter
    // of the scrolling listbox.
    this.#observer = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) this.#inView.add(e.target);
        else this.#inView.delete(e.target);
      }
      const first = [...this.#grid.children].find((g) => this.#inView.has(g));
      this.#setCurrentGroup(/** @type {HTMLElement | undefined} */ (first)?.dataset.group);
    }, { root: this.#grid, rootMargin: '-2px 0px -75% 0px' });
    for (const g of this.#grid.children) this.#observer.observe(g);
  }

  #isRtl() {
    return getComputedStyle(this).direction === 'rtl';
  }

  /**
   * The cell in the next/previous visual row closest to `cell` horizontally.
   * Computed from layout, so group headings, short groups, Recently used and
   * any column count are handled.
   * @param {HTMLElement[]} cells visible cells, in document (= visual) order
   * @param {number} index
   * @param {1 | -1} dir
   */
  #verticalNeighbour(cells, index, dir) {
    const r = cells[index].getBoundingClientRect();
    const cx = r.left + r.width / 2;
    /** @type {number | null} */
    let rowTop = null;
    /** @type {HTMLElement | null} */
    let best = null;
    let bestDist = Infinity;
    for (let i = index + dir; i >= 0 && i < cells.length; i += dir) {
      const cr = cells[i].getBoundingClientRect();
      if (rowTop === null) {
        if (Math.abs(cr.top - r.top) <= ROW_TOLERANCE) continue; // same row
        rowTop = cr.top;
      } else if (Math.abs(cr.top - rowTop) > ROW_TOLERANCE) {
        break; // past the target row
      }
      const dist = Math.abs(cr.left + cr.width / 2 - cx);
      if (dist < bestDist) { bestDist = dist; best = cells[i]; }
    }
    return best;
  }

  /**
   * @param {HTMLElement} cell
   * @param {string} key
   * @returns {boolean} handled
   */
  #moveInGrid(cell, key) {
    const cells = this.#visibleCells();
    const i = cells.indexOf(cell);
    if (i < 0) return false;
    const rtl = this.#isRtl();
    /** @type {HTMLElement | null | undefined} */
    let target = null;

    switch (key) {
      case 'ArrowRight': target = cells[rtl ? i - 1 : i + 1]; break;
      case 'ArrowLeft': target = cells[rtl ? i + 1 : i - 1]; break;
      case 'ArrowDown': target = this.#verticalNeighbour(cells, i, 1); break;
      case 'ArrowUp':
        target = this.#verticalNeighbour(cells, i, -1);
        if (!target) { this.#searchInput.focus(); return true; }
        break;
      case 'Home': target = cells[0]; break;
      case 'End': target = cells[cells.length - 1]; break;
      case 'PageDown': {
        const next = cells.slice(i + 1).find((c) => c.parentElement !== cell.parentElement);
        target = next ?? cells[cells.length - 1];
        break;
      }
      case 'PageUp': {
        const firstInGroup = cells.find((c) => c.parentElement === cell.parentElement);
        if (firstInGroup && firstInGroup !== cell) {
          target = firstInGroup;
        } else {
          const prevGroup = cells[i - 1]?.parentElement;
          target = prevGroup ? cells.find((c) => c.parentElement === prevGroup) : cells[0];
        }
        break;
      }
      default:
        return false;
    }
    if (target) this.#setActiveCell(target, true);
    return true;
  }

  /**
   * @param {HTMLElement} btn
   * @param {string} key
   */
  #moveInToolbar(btn, key) {
    const btns = /** @type {HTMLElement[]} */ ([...this.#toolbar.querySelectorAll('button')]);
    const i = btns.indexOf(btn);
    const rtl = this.#isRtl();
    let next = -1;
    if (key === 'ArrowRight') next = rtl ? i - 1 : i + 1;
    else if (key === 'ArrowLeft') next = rtl ? i + 1 : i - 1;
    else if (key === 'Home') next = 0;
    else if (key === 'End') next = btns.length - 1;
    else return false;
    next = (next + btns.length) % btns.length;
    this.#setToolbarActive(btns[next], true);
    return true;
  }

  // ── Selection preservation ────────────────────────────────────────

  #target() {
    const id = this.getAttribute('for');
    return id ? document.getElementById(id) : null;
  }

  #saveTargetSelection() {
    const target = this.#target();
    this.#savedInputSelection = null;
    this.#savedRange = null;
    if (!target) return;

    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      // selectionStart is null (or throws) on email/number inputs
      let start = null;
      let end = null;
      try { start = target.selectionStart; end = target.selectionEnd; } catch { /* unsupported type */ }
      if (start !== null && end !== null) this.#savedInputSelection = { start, end };
    } else if (target.isContentEditable) {
      // Only a selection inside the target counts — a selection elsewhere on
      // the page must never be replaced on insert.
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        if (target.contains(range.commonAncestorContainer)) this.#savedRange = range.cloneRange();
      }
    }
  }

  // ── Event handlers ─────────────────────────────────────────────────

  /** @param {MouseEvent} e */
  #handleClick = (e) => {
    const btn = /** @type {Element} */ (e.target).closest?.('button');
    if (!btn || !this.contains(btn)) return;

    if (btn === this.#trigger) {
      this.toggle();
      return;
    }
    if (!this.#built) return;
    if (btn.parentElement === this.#toolbar) {
      this.#jumpToGroup(/** @type {HTMLElement} */ (btn));
    } else if (btn.getAttribute('role') === 'option') {
      this.#select(/** @type {HTMLElement} */ (btn));
    }
  };

  /** @param {MouseEvent} e */
  #handleOutsideClick = (e) => {
    if (this.#isOpen && !this.contains(/** @type {Node} */ (e.target))) {
      this.close();
    }
  };

  /** @param {FocusEvent} e */
  #handleFocusOut = (e) => {
    if (!this.#isOpen || this.#selecting) return;
    const to = /** @type {Node | null} */ (e.relatedTarget);
    // null = focus went nowhere (window blur, click on inert space); the
    // outside-click handler covers real clicks elsewhere.
    if (to && !this.contains(to)) this.close();
  };

  /** @param {FocusEvent} e */
  #handleFocusIn = (e) => {
    // Keep the roving tab stop on whichever option last had focus
    const t = /** @type {HTMLElement} */ (e.target);
    if (t.getAttribute?.('role') === 'option' && t !== this.#activeCell) this.#setActiveCell(t, false);
  };

  /** @param {KeyboardEvent} e */
  #handleKeyDown = (e) => {
    if (!this.#isOpen) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      this.close();
      this.#trigger?.focus();
      return;
    }
    const t = /** @type {HTMLElement} */ (e.target);
    if (e.altKey || e.metaKey) return;
    let handled = false;
    if (t === this.#searchInput) {
      if (e.key === 'ArrowDown') {
        const cell = this.#activeCell && this.#isVisibleCell(this.#activeCell)
          ? this.#activeCell : this.#visibleCells()[0];
        if (cell) this.#setActiveCell(cell, true);
        handled = true;
      }
    } else if (t.parentElement === this.#toolbar) {
      handled = this.#moveInToolbar(t, e.key);
    } else if (t.getAttribute('role') === 'option') {
      handled = this.#moveInGrid(t, e.key);
    }
    if (handled) e.preventDefault();
  };

  #handleSearchInput = () => {
    if (this.#searchTimer) clearTimeout(this.#searchTimer);
    this.setState('search-pending', true);
    this.#searchTimer = setTimeout(() => {
      this.#searchTimer = null;
      this.setState('search-pending', false);
      this.#query = this.#searchInput.value.trim();
      this.#applyFilter();
      this.#grid.scrollTop = 0;
    }, SEARCH_DEBOUNCE);
  };

  #handleExtended = () => {
    if (!this.#isOpen) return; // open() rebuilds when the count changed
    this.#renderGroups();
    this.#applyFilter();
    this.#observeGroups();
  };

  /** @param {HTMLElement} btn */
  #jumpToGroup(btn) {
    const group = btn.dataset.group || '';
    if (this.#query) {
      if (this.#searchTimer) { clearTimeout(this.#searchTimer); this.#searchTimer = null; }
      this.setState('search-pending', false);
      this.#searchInput.value = '';
      this.#query = '';
      this.#applyFilter();
    }
    this.#setToolbarActive(btn, false);
    this.#setCurrentGroup(group);
    const el = this.#groups.get(group);
    if (!el) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.#grid.scrollTo({ top: el.offsetTop, behavior: reduce ? 'auto' : 'smooth' });
    // Tab from the toolbar now lands in this category
    const first = /** @type {HTMLElement | null} */ (el.querySelector('[role="option"]:not([hidden])'));
    if (first) this.#setActiveCell(first, false);
  }

  /** @param {HTMLElement} cell */
  #select(cell) {
    const data = this.#cells.get(cell);
    if (!data) return;
    const { entry } = data;
    this.#setActiveCell(cell, false);

    this.#selecting = true;
    try {
      this.#addRecent(entry.shortcode);
      const inserted = this.#insertEmoji(entry.emoji);

      this.dispatchEvent(new CustomEvent('emoji-picker:select', {
        bubbles: true,
        detail: {
          shortcode: entry.shortcode,
          emoji: entry.emoji,
          name: entry.name,
          keywords: entry.keywords,
        }
      }));

      // Close after selection — deliberate choice for quick composition flows.
      // Focus stays in the target the emoji went into, else returns to the trigger.
      this.close();
      if (!inserted) this.#trigger?.focus();
    } finally {
      this.#selecting = false;
    }
  }

  // ── Insertion ──────────────────────────────────────────────────────

  /**
   * Insert into the `for` target as a user edit: execCommand('insertText')
   * keeps the browser undo stack and fires a native InputEvent; the fallback
   * uses setRangeText + a synthetic InputEvent of the same shape.
   * @param {string} text
   * @returns {boolean} whether there was a target to insert into
   */
  #insertEmoji(text) {
    const target = this.#target();
    if (!target) return false;

    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      target.focus();
      const sel = this.#savedInputSelection;
      if (sel) {
        try { target.setSelectionRange(sel.start, sel.end); } catch { /* email/number */ }
      }
      if (!this.#execInsert(text)) {
        const len = target.value.length;
        try {
          target.setRangeText(text, sel?.start ?? len, sel?.end ?? len, 'end');
        } catch {
          target.value += text; // types without selection support
        }
        target.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
      }
      try {
        const pos = target.selectionEnd;
        this.#savedInputSelection = pos === null ? null : { start: pos, end: pos };
      } catch {
        this.#savedInputSelection = null;
      }
      return true;
    }

    if (target.isContentEditable) {
      target.focus();
      const sel = window.getSelection();
      if (!sel) return true;
      let range = this.#savedRange;
      if (!range || !target.contains(range.commonAncestorContainer)) {
        // No (valid) caret in the target: insert at its end
        range = document.createRange();
        range.selectNodeContents(target);
        range.collapse(false);
      }
      sel.removeAllRanges();
      sel.addRange(range);
      if (!this.#execInsert(text)) {
        const r = sel.getRangeAt(0);
        r.deleteContents();
        const node = document.createTextNode(text);
        r.insertNode(node);
        r.setStartAfter(node);
        r.collapse(true);
        sel.removeAllRanges();
        sel.addRange(r);
        target.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
      }
      this.#savedRange = sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
      return true;
    }
    return false;
  }

  /** @param {string} text */
  #execInsert(text) {
    try {
      // Deprecated but still the only API that records an undoable edit.
      return document.execCommand('insertText', false, text);
    } catch {
      return false;
    }
  }

  // ── Recents ────────────────────────────────────────────────────────

  /** @returns {string[]} */
  #getRecents() {
    try {
      const list = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }

  /** @param {string} shortcode */
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

  // ── Positioning ────────────────────────────────────────────────────

  /**
   * Place the fixed (top-layer) panel in physical viewport coordinates:
   * below the trigger, aligned to its start edge (right edge in RTL),
   * flipped above when there is no room below, clamped to the viewport.
   */
  #position() {
    if (!this.#usePopover || !this.#isOpen || !this.#trigger) return;
    const rect = this.#trigger.getBoundingClientRect();
    const w = this.#picker.offsetWidth;
    const h = this.#picker.offsetHeight;
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;

    let left = this.#isRtl() ? rect.right - w : rect.left;
    left = Math.max(VIEWPORT_GAP, Math.min(left, vw - w - VIEWPORT_GAP));

    let top = rect.bottom + 4;
    if (top + h > vh - VIEWPORT_GAP && rect.top - h - 4 >= VIEWPORT_GAP) {
      top = rect.top - h - 4;
    }
    top = Math.max(VIEWPORT_GAP, Math.min(top, vh - h - VIEWPORT_GAP));

    this.#picker.style.setProperty('--picker-top', `${Math.round(top)}px`);
    this.#picker.style.setProperty('--picker-left', `${Math.round(left)}px`);
  }

  /** @param {Event} e */
  #onReposition = (e) => {
    // Scrolling the emoji list itself does not move the panel
    if (e.type === 'scroll' && this.#picker.contains(/** @type {Node} */ (e.target))) return;
    this.#position();
  };

  // ── Open/Close ─────────────────────────────────────────────────────

  open() {
    if (!this.#built) { this.#pending = 'open'; return; }
    if (this.#isOpen || !this.isConnected) return;

    // Preserve target selection before moving focus to picker
    this.#saveTargetSelection();

    if (this.#data.extendedCount() !== this.#builtExtended) this.#renderGroups();
    this.#renderRecents();
    this.#searchInput.value = '';
    this.#query = '';
    this.#applyFilter();

    this.#isOpen = true;
    this.setAttribute('open', '');
    this.#trigger?.setAttribute('aria-expanded', 'true');
    this.#picker.hidden = false;
    if (this.#usePopover) {
      try { this.#picker.showPopover(); } catch { /* already open */ }
      this.#position();
      window.addEventListener('scroll', this.#onReposition, { capture: true, passive: true });
      window.addEventListener('resize', this.#onReposition, { passive: true });
    }
    this.#grid.scrollTop = 0;
    this.#observeGroups();
    this.#searchInput.focus();

    this.dispatchEvent(new CustomEvent('emoji-picker:open', { bubbles: true }));
  }

  close() {
    if (!this.#built) { this.#pending = null; return; }
    if (!this.#isOpen) return;

    this.#isOpen = false;
    this.removeAttribute('open');
    this.#trigger?.setAttribute('aria-expanded', 'false');
    if (this.#usePopover) {
      try { this.#picker.hidePopover(); } catch { /* already closed */ }
      window.removeEventListener('scroll', this.#onReposition, { capture: true });
      window.removeEventListener('resize', this.#onReposition);
    }
    this.#picker.hidden = true;
    this.#observer?.disconnect();
    this.#observer = null;

    this.dispatchEvent(new CustomEvent('emoji-picker:close', { bubbles: true }));
  }

  toggle() {
    if (!this.#built) {
      this.#pending = this.#pending === 'open' ? null : 'open';
      return;
    }
    if (this.#isOpen) this.close();
    else this.open();
  }
}

registerComponent('emoji-picker', EmojiPicker);

export { EmojiPicker };
