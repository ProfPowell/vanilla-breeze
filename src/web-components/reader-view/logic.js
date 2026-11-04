/**
 * reader-view — Immersive reading shell with scroll and paged modes.
 *
 * In paged mode, CSS multi-column layout combined with horizontal overflow
 * produces a Kindle-style page-turn experience. Without JavaScript the
 * content renders as a normal scrolling article via layout-columns.
 *
 * Pages mode is a full-viewport overlay: while it is active the rest of the
 * page is made `inert`, the document scroll is locked (CSS, via :has()),
 * focus moves into the pager, and Escape returns to scroll mode with focus
 * restored to the mode toggle.
 *
 * Persistence: font size and columns persist per page + instance by default
 * (key `vb-reader:<pathname>[#id]`). The mode is only restored when the
 * author opts in with `data-remember-mode`, so one reader's choice can never
 * open another page as a fullscreen overlay.
 */

import { VBElement } from '../../lib/vb-element.js';

/** @type {Set<ReaderView>} */
const activePagedInstances = new Set();

/** Default English strings; each is overridable with data-label-<name>. */
const LABELS = {
  'kicker': 'Reader',
  'controls': 'Reading controls',
  'mode-group': 'Reading mode',
  'mode': 'Mode',
  'scroll': 'Scroll',
  'pages': 'Pages',
  'font-group': 'Font size',
  'type': 'Type',
  'font-decrease': 'Decrease font size',
  'font-increase': 'Increase font size',
  'columns-group': 'Page columns',
  'cols': 'Cols',
  'auto': 'Auto',
  'column-auto': 'Auto columns',
  'column-1': '1 column',
  'column-2': '2 columns',
  'column-3': '3 columns',
  'pages-region': 'Article pages',
  'page-nav': 'Page navigation',
  'prev': 'Previous page',
  'next': 'Next page',
  'page-indicator': '{page} / {total}',
};

class ReaderView extends VBElement {

  static get observedAttributes() { return ['mode', 'columns']; }

  // ── Private state ─────────────────────────────────────────────

  #mode       = /** @type {'scroll' | 'pages'} */ ('scroll')
  #page       = /** @type {number} */ (0)
  #totalPages = /** @type {number} */ (1)
  #sizeIdx    = /** @type {number} */ (2)
  #columnMode = /** @type {string} */ ('auto')
  #pageStops  = /** @type {number[]} */ ([0])

  #columns    = /** @type {HTMLElement | null} */ (null)
  #pager      = /** @type {HTMLElement | null} */ (null)
  #scroller   = /** @type {HTMLElement | null} */ (null)
  #pageNav    = /** @type {HTMLElement | null} */ (null)
  #ro         = /** @type {ResizeObserver | null} */ (null)

  /** Elements this instance made inert while in pages mode. */
  #inerted    = /** @type {Element[]} */ ([])

  #programmaticScroll = false
  #scrollTarget = 0
  /** @type {ReturnType<typeof setTimeout> | null} */
  #programmaticTimer = null
  /** @type {ReturnType<typeof setTimeout> | null} */
  #snapTimer = null
  #built = false
  #boundKeydown = /** @type {((e: KeyboardEvent) => void) | null} */ (null)
  #viewportHandler = /** @type {(() => void) | null} */ (null)

  static FONT_SIZES = ['0.875rem', '0.9375rem', '1rem', '1.0625rem', '1.125rem', '1.25rem']
  static SNAP_DELAY = 90
  static STORAGE_PREFIX = 'vb-reader'

  // ── Lifecycle ─────────────────────────────────────────────────

  setup() {
    if (!this.#built) {
      // Persistence fills in where markup is silent; authored attrs win
      this.#restorePersistedState();
      this.#readInitialAttributes(); // overrides persisted values when explicit
      this.#buildDOM();
      this.#ensureColumnsWrapper();
      this.#bindActions();
      this.#built = true;
    }
    // Always re-establish observers/listeners on reconnect
    this.#setupResizeObserver();
    this.#setupViewportListeners();
    this.#applyMode(this.#mode, { initial: true });
  }

  teardown() {
    this.#ro?.disconnect();
    this.#ro = null;
    if (this.#snapTimer !== null) clearTimeout(this.#snapTimer);
    if (this.#programmaticTimer !== null) clearTimeout(this.#programmaticTimer);
    this.#programmaticScroll = false;
    activePagedInstances.delete(this);
    this.#releaseInert();
  }

  /**
   * @param {string} name
   * @param {string | null} _old
   * @param {string | null} value
   */
  attributeChangedCallback(name, _old, value) {
    if (!this.#built) return; // initial attributes are read in setup()
    if (name === 'mode') {
      const next = value === 'pages' ? 'pages' : 'scroll';
      if (next === this.#mode && value === next) return;
      if (!this.isConnected) { this.#mode = next; return; }
      this.#applyMode(next);
    } else if (name === 'columns') {
      const next = value || 'auto';
      if (next === this.#columnMode) return;
      this.#setColumns(next);
    }
  }

  // ── Initial attributes ─────────────────────────────────────────

  #readInitialAttributes() {
    const mode = this.getAttribute('mode');
    if (mode === 'scroll' || mode === 'pages') this.#mode = mode;

    const cols = this.getAttribute('columns');
    if (cols) this.#columnMode = cols;
  }

  // ── Labels ────────────────────────────────────────────────────

  /** @param {keyof typeof LABELS} name */
  #label(name) {
    return this.getAttribute(`data-label-${name}`) ?? LABELS[name];
  }

  // ── DOM construction ──────────────────────────────────────────

  #buildDOM() {
    // Check for slotted chrome
    const slottedChrome = this.querySelector(':scope > [slot="chrome"]');

    // Collect non-chrome children before we start modifying DOM
    const contentChildren = [...this.children].filter(el => el !== slottedChrome);

    // Build chrome
    // A plain element: a <header> here would become a page-level banner
    // landmark whenever the reader isn't inside a sectioning element.
    const chrome = document.createElement('div');
    chrome.className = 'reader-chrome';

    if (slottedChrome) {
      chrome.appendChild(slottedChrome);
    } else {
      chrome.innerHTML = this.#defaultChromeHTML();
    }

    // Build scroll container
    const scroller = document.createElement('div');
    scroller.className = 'reader-scroll';

    // Build pager container (focus target while in pages mode)
    const pager = document.createElement('div');
    pager.className = 'reader-pager';
    pager.setAttribute('role', 'region');
    pager.setAttribute('aria-label', this.#label('pages-region'));
    pager.tabIndex = -1;

    // Build progress bar
    const progress = document.createElement('div');
    progress.className = 'reader-progress';
    progress.setAttribute('aria-hidden', 'true');

    // Build page nav
    const pageNav = document.createElement('nav');
    pageNav.className = 'reader-page-nav';
    pageNav.setAttribute('aria-label', this.#label('page-nav'));
    pageNav.innerHTML = `
      <button class="reader-nav-btn" data-reader-action="prev-page" type="button" aria-label="${this.#attr(this.#label('prev'))}"><span aria-hidden="true">←</span></button>
      <output class="reader-page-indicator" data-reader-output="page-indicator" aria-live="polite"></output>
      <button class="reader-nav-btn" data-reader-action="next-page" type="button" aria-label="${this.#attr(this.#label('next'))}"><span aria-hidden="true">→</span></button>
    `;

    // Move content children into the scroller
    contentChildren.forEach(child => scroller.appendChild(child));

    // Clear and rebuild
    this.textContent = '';
    this.appendChild(chrome);
    this.appendChild(progress);

    // Wrap scroller and pager in a container for the grid row. A plain
    // element, not <main>: the reader usually sits inside the page's main.
    const book = document.createElement('div');
    book.className = 'reader-book';
    book.appendChild(scroller);
    book.appendChild(pager);
    book.appendChild(pageNav);
    this.appendChild(book);

    this.#scroller = scroller;
    this.#pager = pager;
    this.#pageNav = pageNav;
  }

  #defaultChromeHTML() {
    const title = this.#resolveTitle();
    const showFonts = this.getAttribute('font-controls') !== 'false';
    const showCols = this.getAttribute('col-controls') !== 'false';
    const L = (/** @type {keyof typeof LABELS} */ n) => this.#attr(this.#label(n));

    let html = `
      <div class="reader-chrome-copy">
        <span class="reader-chrome-kicker">${L('kicker')}</span>
        <span class="reader-chrome-title">${this.#attr(title)}</span>
      </div>
      <div class="reader-controls" role="group" aria-label="${L('controls')}">
        <div class="reader-control-group" role="group" aria-label="${L('mode-group')}">
          <span class="reader-control-label" aria-hidden="true">${L('mode')}</span>
          <button class="reader-seg-btn" data-reader-action="set-mode-scroll" type="button" aria-pressed="true">${L('scroll')}</button>
          <button class="reader-seg-btn" data-reader-action="set-mode-pages" type="button" aria-pressed="false">${L('pages')}</button>
        </div>`;

    if (showFonts) {
      html += `
        <div class="reader-control-group" role="group" aria-label="${L('font-group')}">
          <span class="reader-control-label" aria-hidden="true">${L('type')}</span>
          <button class="reader-icon-btn" data-reader-action="font-decrease" type="button" aria-label="${L('font-decrease')}">A−</button>
          <button class="reader-icon-btn" data-reader-action="font-increase" type="button" aria-label="${L('font-increase')}">A+</button>
        </div>`;
    }

    if (showCols) {
      html += `
        <div class="reader-control-group" role="group" aria-label="${L('columns-group')}">
          <span class="reader-control-label" aria-hidden="true">${L('cols')}</span>
          <button class="reader-seg-btn" data-reader-action="set-columns" data-reader-value="auto" type="button" aria-pressed="false" aria-label="${L('column-auto')}">${L('auto')}</button>
          <button class="reader-seg-btn" data-reader-action="set-columns" data-reader-value="1" type="button" aria-pressed="false" aria-label="${L('column-1')}">1</button>
          <button class="reader-seg-btn" data-reader-action="set-columns" data-reader-value="2" type="button" aria-pressed="false" aria-label="${L('column-2')}">2</button>
          <button class="reader-seg-btn" data-reader-action="set-columns" data-reader-value="3" type="button" aria-pressed="false" aria-label="${L('column-3')}">3</button>
        </div>`;
    }

    html += `</div>`;
    return html;
  }

  #resolveTitle() {
    if (this.getAttribute('reader-title')) return this.getAttribute('reader-title');
    const h1 = this.querySelector('h1');
    if (h1) return h1.textContent.trim();
    return document.title || this.#label('kicker');
  }

  // ── Columns wrapper ───────────────────────────────────────────

  #ensureColumnsWrapper() {
    const scroller = this.#scroller;
    if (!scroller) return;
    // Check inside scroller for existing layout-columns
    this.#columns = /** @type {HTMLElement | null} */ (scroller.querySelector(':scope > layout-columns'));
    if (this.#columns) return;

    const wrapper = /** @type {HTMLElement} */ (document.createElement('layout-columns'));
    const children = [...scroller.children];
    children.forEach(child => wrapper.appendChild(child));
    scroller.appendChild(wrapper);
    this.#columns = wrapper;
  }

  // ── Mode switching ────────────────────────────────────────────

  /**
   * @param {'scroll' | 'pages'} mode
   * @param {{ initial?: boolean, restoreFocus?: boolean }} [opts]
   *   initial: setup-time apply (no focus moves, no window scroll).
   *   restoreFocus: on exit, return focus to the mode toggle.
   */
  #applyMode(mode, { initial = false, restoreFocus = false } = {}) {
    const previous = this.#mode;
    const wasPages = activePagedInstances.has(this);
    // Re-selecting the active mode is a no-op
    if (!initial && mode === previous && wasPages === (mode === 'pages')) return;
    const anchorRatio = this.#getProgressRatio(wasPages ? 'pages' : 'scroll');
    this.#mode = mode;
    if (this.getAttribute('mode') !== mode) this.setAttribute('mode', mode);

    const isPages = mode === 'pages';
    const scroller = this.#scroller;
    const pager = this.#pager;
    const columns = this.#columns;
    const pageNav = this.#pageNav;
    if (!scroller || !pager || !columns || !pageNav) return;

    if (isPages) {
      // Enforce single active paged instance
      for (const other of activePagedInstances) {
        if (other !== this) other.#applyMode('scroll', { initial: true });
      }
      activePagedInstances.add(this);

      // Move columns into pager
      pager.appendChild(columns);

      this.#applyColumnCount();
      this.#applyFontSizeToColumns();
      this.#applyInert();
      if (!initial && !wasPages) pager.focus({ preventScroll: true });
      requestAnimationFrame(() => {
        this.#recalcPages(anchorRatio);
      });
    } else {
      activePagedInstances.delete(this);
      this.#releaseInert();

      // Move columns back into scroller
      scroller.appendChild(columns);

      // Reset pager overrides on columns
      columns.style.removeProperty('column-count');
      columns.style.removeProperty('column-width');

      if (wasPages && !initial) {
        // Focus inside the (now hidden) pager or nav, or on <body>, would be lost
        const active = document.activeElement;
        const focusLost = !active || active === document.body
          || pager.contains(active) || pageNav.contains(active);
        if (restoreFocus || focusLost) this.#modeToggle()?.focus({ preventScroll: true });

        // Keep the reader's place: map the page ratio onto the window scroll
        requestAnimationFrame(() => {
          const rect = scroller.getBoundingClientRect();
          const span = rect.height - window.innerHeight;
          const top = window.scrollY + rect.top + (span > 0 ? anchorRatio * span : 0);
          window.scrollTo({ top, behavior: 'instant' });
        });
      }
    }

    this.#updateChromeState();
    // Setup-time applies never write: they would overwrite the saved state
    if (!initial) this.#persistState();
    if (!initial || previous !== mode) this.#emit('reader-view:mode', { mode });
  }

  /** The control that toggles into pages mode (focus return target). */
  #modeToggle() {
    return /** @type {HTMLElement | null} */ (
      this.querySelector('[data-reader-action="set-mode-pages"], [data-reader-action="toggle-mode"]')
      ?? this.querySelector('[data-reader-action="set-mode-scroll"]')
    );
  }

  // ── Inert background (pages mode) ─────────────────────────────

  #applyInert() {
    if (this.#inerted.length) return;
    /** @type {Element} */
    let node = this;
    while (node.parentElement && node !== document.body) {
      const parent = node.parentElement;
      for (const sibling of parent.children) {
        if (sibling === node) continue;
        if (sibling.matches('script, style, template, link, meta')) continue;
        if (/** @type {HTMLElement} */ (sibling).inert) continue;
        /** @type {HTMLElement} */ (sibling).inert = true;
        this.#inerted.push(sibling);
      }
      node = parent;
    }
  }

  #releaseInert() {
    for (const el of this.#inerted) /** @type {HTMLElement} */ (el).inert = false;
    this.#inerted = [];
  }

  // ── Column management ─────────────────────────────────────────

  /** @param {string} value */
  #setColumns(value) {
    const ratio = this.#getProgressRatio();
    this.#columnMode = value;
    this.#applyColumnCount();
    this.#updateChromeState();
    if (this.#mode === 'pages') {
      requestAnimationFrame(() => this.#recalcPages(ratio));
    }
    this.#persistState();
  }

  #resolveColumnCount() {
    if (this.#columnMode !== 'auto') return Number(this.#columnMode) || 1;
    const width = this.#pager?.clientWidth || window.innerWidth;
    if (width >= 1680) return 3;
    if (width >= 960)  return 2;
    return 1;
  }

  #applyColumnCount() {
    if (this.getAttribute('columns') !== this.#columnMode) {
      this.setAttribute('columns', this.#columnMode);
    }
    if (!this.#columns || this.#mode !== 'pages') return;
    const count = this.#resolveColumnCount();
    this.#columns.style.setProperty('column-count', String(count));
    this.#columns.style.setProperty('column-width', 'auto');
  }

  // ── Page calculation ──────────────────────────────────────────

  /** +1 for LTR, -1 for RTL (scrollLeft runs 0 → -max in RTL). */
  #dirSign() {
    return this.#pager && getComputedStyle(this.#pager).direction === 'rtl' ? -1 : 1;
  }

  /** Distance scrolled from the inline-start edge, always ≥ 0. */
  #scrollPos() {
    return Math.abs(this.#pager?.scrollLeft ?? 0);
  }

  #recalcPages(anchorRatio = this.#getProgressRatio()) {
    if (this.#mode !== 'pages') return;

    const pager = this.#pager;
    if (!pager) return;
    const width = pager.clientWidth || 1;
    const scrollWidth = pager.scrollWidth;
    const maxScroll = Math.max(0, scrollWidth - width);
    const rawPages = scrollWidth / width;
    const estimated = Math.max(1, Math.ceil(rawPages - 0.01));

    this.#pageStops = [];
    for (let i = 0; i < estimated; i++) {
      const stop = i === estimated - 1
        ? maxScroll
        : Math.min(i * width, maxScroll);
      if (!this.#pageStops.length ||
          stop - this.#pageStops[this.#pageStops.length - 1] > 1) {
        this.#pageStops.push(stop);
      }
    }

    const previousTotal = this.#totalPages;
    this.#totalPages = Math.max(1, this.#pageStops.length);
    this.#page = this.#totalPages > 1
      ? Math.min(
          Math.round(anchorRatio * (this.#totalPages - 1)),
          this.#totalPages - 1
        )
      : 0;
    this.#scrollToPage(this.#page, false, previousTotal !== this.#totalPages);
  }

  #scrollToPage(n, smooth = true, force = false) {
    const before = force ? -1 : this.#page;
    this.#page = Math.max(0, Math.min(n, this.#totalPages - 1));
    const left = (this.#pageStops[this.#page] ?? 0) * this.#dirSign();
    const useSmoothScroll = smooth && !this.#prefersReducedMotion();
    const pager = this.#pager;
    const target = Math.abs(left);
    // Programmatic scrolls are ignored by the snap/HUD listener until they
    // land (scrollend), so a page turn is never undone mid-animation.
    if (pager && Math.abs(this.#scrollPos() - target) > 1) {
      this.#programmaticScroll = true;
      this.#scrollTarget = target;
      if (this.#programmaticTimer !== null) clearTimeout(this.#programmaticTimer);
      this.#programmaticTimer = setTimeout(() => { this.#programmaticScroll = false; },
        useSmoothScroll ? 1000 : 50);
      pager.scrollTo({ left, behavior: useSmoothScroll ? 'smooth' : 'instant' });
    }
    this.#updateHUD(before !== this.#page);
  }

  #findNearestPage(pos) {
    let nearest = 0;
    let minDist = Infinity;
    this.#pageStops.forEach((stop, i) => {
      const dist = Math.abs(stop - pos);
      if (dist < minDist) { minDist = dist; nearest = i; }
    });
    return nearest;
  }

  // ── HUD / progress ────────────────────────────────────────────

  /**
   * Reading position as 0..1. Scroll mode reads the scroller's position
   * within the viewport (the document scrolls, not the scroller).
   * @param {'scroll' | 'pages'} [mode]
   */
  #getProgressRatio(mode = this.#mode) {
    if (mode === 'scroll') {
      if (!this.#scroller) return 0;
      const rect = this.#scroller.getBoundingClientRect();
      const span = rect.height - window.innerHeight;
      if (span <= 0) return 0;
      return Math.min(1, Math.max(0, -rect.top / span));
    }
    if (!this.#pager) return 0;
    const max = this.#pager.scrollWidth - this.#pager.clientWidth;
    return max > 0 ? this.#scrollPos() / max : 0;
  }

  #updateHUD(changed = true) {
    const pct = this.#totalPages > 1
      ? this.#page / (this.#totalPages - 1) : 1;
    this.style.setProperty('--_progress', String(pct));

    const text = this.#label('page-indicator')
      .replace('{page}', String(this.#page + 1))
      .replace('{total}', String(this.#totalPages));
    this.querySelectorAll('[data-reader-output="page-indicator"]')
      .forEach(el => { if (el.textContent !== text) el.textContent = text; });
    this.querySelectorAll('[data-reader-action="prev-page"]')
      .forEach(btn => { btn.toggleAttribute('disabled', this.#page === 0); });
    this.querySelectorAll('[data-reader-action="next-page"]')
      .forEach(btn => {
        btn.toggleAttribute('disabled', this.#page === this.#totalPages - 1);
      });

    if (changed) {
      this.#emit('reader-view:page', {
        page: this.#page + 1,
        total: this.#totalPages
      });
    }
  }

  // ── Font size ─────────────────────────────────────────────────

  #applyFontSizeToColumns() {
    if (!this.#columns) return;
    this.#columns.style.fontSize = ReaderView.FONT_SIZES[this.#sizeIdx];
  }

  #changeFontSize(delta) {
    const next = this.#sizeIdx + delta;
    if (next < 0 || next >= ReaderView.FONT_SIZES.length) return;
    this.#sizeIdx = next;
    const ratio = this.#getProgressRatio();
    this.#applyFontSizeToColumns();
    this.#updateFontButtons();
    if (this.#mode === 'pages') {
      requestAnimationFrame(() => this.#recalcPages(ratio));
    }
    this.#persistState();
    this.#emit('reader-view:font', {
      size: ReaderView.FONT_SIZES[this.#sizeIdx],
      index: this.#sizeIdx
    });
  }

  #updateFontButtons() {
    this.querySelectorAll('[data-reader-action="font-decrease"]')
      .forEach(btn => { btn.toggleAttribute('disabled', this.#sizeIdx === 0); });
    this.querySelectorAll('[data-reader-action="font-increase"]')
      .forEach(btn => {
        btn.toggleAttribute('disabled', this.#sizeIdx === ReaderView.FONT_SIZES.length - 1);
      });
  }

  // ── Event delegation ──────────────────────────────────────────

  #bindActions() {
    // Listeners on the host and on persistent internal nodes survive
    // disconnect/reconnect, so they are bound once (behind #built).
    this.addEventListener('click', e => {
      const target = /** @type {Element | null} */ (e.target);
      const el = /** @type {HTMLElement | null} */ (target?.closest('[data-reader-action]'));
      if (!el || !this.contains(el)) return;
      const action = el.dataset.readerAction;
      switch (action) {
        case 'toggle-mode':
          this.#applyMode(this.#mode === 'scroll' ? 'pages' : 'scroll', { restoreFocus: true });
          break;
        case 'set-mode-scroll': this.#applyMode('scroll'); break;
        case 'set-mode-pages':  this.#applyMode('pages');  break;
        case 'font-increase': this.#changeFontSize(1); break;
        case 'font-decrease': this.#changeFontSize(-1); break;
        case 'set-columns': this.#setColumns(el.dataset.readerValue ?? 'auto'); break;
        case 'prev-page': this.#scrollToPage(this.#page - 1); break;
        case 'next-page': this.#scrollToPage(this.#page + 1); break;
      }
    });

    // Pager: track user scrolling (swipe/trackpad) and snap to a page stop
    const pager = this.#pager;
    const snap = () => {
      if (this.#mode !== 'pages' || this.#programmaticScroll) return;
      this.#scrollToPage(this.#findNearestPage(this.#scrollPos()), false);
    };
    pager?.addEventListener('scroll', () => {
      if (this.#mode !== 'pages' || this.#programmaticScroll) return;
      const next = this.#findNearestPage(this.#scrollPos());
      if (next !== this.#page) {
        this.#page = next;
        this.#updateHUD();
      }
      if (this.#snapTimer !== null) clearTimeout(this.#snapTimer);
      this.#snapTimer = setTimeout(snap, ReaderView.SNAP_DELAY);
    }, { passive: true });
    pager?.addEventListener('scrollend', () => {
      if (this.#programmaticScroll) {
        // An interrupted earlier animation also ends; wait for the target
        if (Math.abs(this.#scrollPos() - this.#scrollTarget) > 1) return;
        this.#programmaticScroll = false;
        if (this.#programmaticTimer !== null) clearTimeout(this.#programmaticTimer);
        return;
      }
      if (this.#snapTimer !== null) clearTimeout(this.#snapTimer);
      snap();
    });

    // Keyboard (document-level listener added per connect)
    this.#boundKeydown = this.#handleKeydown.bind(this);
  }

  // ── Keyboard ──────────────────────────────────────────────────

  /** @param {KeyboardEvent} e */
  #handleKeydown(e) {
    if (this.#mode !== 'pages' || e.defaultPrevented) return;
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const target = /** @type {Element | null} */ (e.target);
    // Never hijack text entry
    if (target?.matches?.('input, textarea, select, [contenteditable]:not([contenteditable="false"])')) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      this.#applyMode('scroll', { restoreFocus: true });
      return;
    }

    // Space activates a focused button/link/summary; leave it alone there
    const onControl = !!target?.matches?.('button, a[href], summary, [role="button"]');
    const rtl = this.#dirSign() < 0;
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
    const back = rtl ? 'ArrowRight' : 'ArrowLeft';

    switch (e.key) {
      case ' ':
        if (onControl) return;
        e.preventDefault();
        this.#scrollToPage(e.shiftKey ? this.#page - 1 : this.#page + 1);
        break;
      case forward: case 'PageDown':
        e.preventDefault();
        this.#scrollToPage(this.#page + 1);
        break;
      case back: case 'PageUp':
        e.preventDefault();
        this.#scrollToPage(this.#page - 1);
        break;
      case 'Home':
        e.preventDefault();
        this.#scrollToPage(0, false);
        break;
      case 'End':
        e.preventDefault();
        this.#scrollToPage(this.#totalPages - 1, false);
        break;
    }
  }

  // ── ResizeObserver ────────────────────────────────────────────

  #setupResizeObserver() {
    this.#ro = new ResizeObserver(() => {
      if (this.#mode !== 'pages') return;
      requestAnimationFrame(() => {
        this.#applyColumnCount();
        this.#recalcPages(this.#getProgressRatio());
      });
    });
    if (this.#pager) this.#ro.observe(this.#pager);
  }

  // ── Viewport ──────────────────────────────────────────────────

  #setupViewportListeners() {
    // Keyboard (document-level, auto-cleaned by VBElement)
    if (this.#boundKeydown) {
      this.listen(document, 'keydown', this.#boundKeydown);
    }

    if (!window.visualViewport) return;
    this.#viewportHandler = () => {
      if (this.#mode === 'pages') {
        requestAnimationFrame(() => this.#recalcPages());
      }
    };
    this.listen(window.visualViewport, 'resize', this.#viewportHandler);
    this.listen(window.visualViewport, 'scroll', this.#viewportHandler);
  }

  // ── Persistence ───────────────────────────────────────────────

  /** Per page + instance unless the author sets storage-key. */
  #storageKey() {
    const explicit = this.getAttribute('storage-key');
    if (explicit) return explicit;
    const id = this.id ? `#${this.id}` : '';
    return `${ReaderView.STORAGE_PREFIX}:${location.pathname}${id}`;
  }

  #persistState() {
    if (this.getAttribute('persist') === 'false') return;
    try {
      localStorage.setItem(this.#storageKey(), JSON.stringify({
        mode: this.#mode,
        sizeIdx: this.#sizeIdx,
        columns: this.#columnMode
      }));
    } catch { /* storage unavailable */ }
  }

  #restorePersistedState() {
    if (this.getAttribute('persist') === 'false') return;
    try {
      const saved = JSON.parse(localStorage.getItem(this.#storageKey()) ?? 'null');
      if (!saved) return;
      // The mode (a fullscreen overlay) is only restored on explicit opt-in
      if (this.hasAttribute('data-remember-mode') &&
          (saved.mode === 'scroll' || saved.mode === 'pages')) {
        this.#mode = saved.mode;
      }
      if (typeof saved.sizeIdx === 'number' &&
          saved.sizeIdx >= 0 &&
          saved.sizeIdx < ReaderView.FONT_SIZES.length) {
        this.#sizeIdx = saved.sizeIdx;
      }
      if (typeof saved.columns === 'string' && /^(auto|[1-3])$/.test(saved.columns)) {
        this.#columnMode = saved.columns;
      }
    } catch { /* parse error */ }
  }

  // ── Chrome state ──────────────────────────────────────────────

  #updateChromeState() {
    /**
     * @param {Element} btn
     * @param {boolean} active
     */
    const press = (btn, active) => {
      btn.setAttribute('data-reader-state', active ? 'active' : '');
      btn.setAttribute('aria-pressed', String(active));
    };

    // Mode buttons
    this.querySelectorAll('[data-reader-action="set-mode-scroll"]')
      .forEach(btn => press(btn, this.#mode === 'scroll'));
    this.querySelectorAll('[data-reader-action="set-mode-pages"]')
      .forEach(btn => press(btn, this.#mode === 'pages'));
    this.querySelectorAll('[data-reader-action="toggle-mode"]')
      .forEach(btn => btn.setAttribute('aria-pressed', String(this.#mode === 'pages')));

    // Column buttons
    this.querySelectorAll('[data-reader-action="set-columns"]')
      .forEach(btn => press(btn, (/** @type {HTMLElement} */ (btn).dataset.readerValue ?? 'auto') === this.#columnMode));

    // Font buttons
    this.#updateFontButtons();

    // Mode label outputs
    this.querySelectorAll('[data-reader-output="mode-label"]')
      .forEach(el => {
        el.textContent = this.#label(this.#mode === 'scroll' ? 'scroll' : 'pages');
      });
  }

  // ── Helpers ───────────────────────────────────────────────────

  #emit(name, detail) {
    this.dispatchEvent(new CustomEvent(name, {
      detail, bubbles: true, composed: true
    }));
  }

  #prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /** Escape text for element content and double-quoted attribute values. */
  #attr(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

customElements.define('reader-view', ReaderView);
