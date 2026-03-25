/**
 * reader-view — Immersive reading shell with scroll and paged modes.
 *
 * In paged mode, CSS multi-column layout combined with horizontal overflow
 * produces a Kindle-style page-turn experience. Without JavaScript the
 * content renders as a normal scrolling article via layout-columns.
 */

import { VBElement } from '../../lib/vb-element.js';

/** @type {Set<ReaderView>} */
const activePagedInstances = new Set();

class ReaderView extends VBElement {

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

  #programmaticScroll = false
  #snapTimer = 0
  #built = false
  #boundKeydown = /** @type {((e: KeyboardEvent) => void) | null} */ (null)
  #viewportHandler = /** @type {(() => void) | null} */ (null)

  static FONT_SIZES = ['0.875rem', '0.9375rem', '1rem', '1.0625rem', '1.125rem', '1.25rem']
  static SNAP_DELAY = 90
  static STORAGE_KEY = 'vb-reader'

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
    this.#applyMode(this.#mode, false);
    this.setAttribute('upgraded', '');
  }

  teardown() {
    this.#ro?.disconnect();
    this.#ro = null;
    this.removeAttribute('upgraded');
    clearTimeout(this.#snapTimer);
    activePagedInstances.delete(this);
  }

  // ── Initial attributes ─────────────────────────────────────────

  #readInitialAttributes() {
    const mode = this.getAttribute('mode');
    if (mode === 'scroll' || mode === 'pages') this.#mode = mode;

    const cols = this.getAttribute('columns');
    if (cols) this.#columnMode = cols;
  }

  // ── DOM construction ──────────────────────────────────────────

  #buildDOM() {
    // Check for slotted chrome
    const slottedChrome = this.querySelector('[slot="chrome"]');

    // Collect non-chrome children before we start modifying DOM
    const contentChildren = [...this.children].filter(
      el => !el.matches('[slot="chrome"]')
    );

    // Build chrome
    const chrome = document.createElement('header');
    chrome.className = 'reader-chrome';

    if (slottedChrome) {
      chrome.appendChild(slottedChrome);
    } else {
      chrome.innerHTML = this.#defaultChromeHTML();
    }

    // Build scroll container
    const scroller = document.createElement('div');
    scroller.className = 'reader-scroll';

    // Build pager container
    const pager = document.createElement('div');
    pager.className = 'reader-pager';
    pager.setAttribute('role', 'region');
    pager.setAttribute('aria-label', 'Article pages');

    // Build progress bar
    const progress = document.createElement('div');
    progress.className = 'reader-progress';
    progress.setAttribute('aria-hidden', 'true');

    // Build page nav
    const pageNav = document.createElement('nav');
    pageNav.className = 'reader-page-nav';
    pageNav.setAttribute('aria-label', 'Page navigation');
    pageNav.innerHTML = `
      <button class="reader-nav-btn" data-reader-action="prev-page" type="button" aria-label="Previous page">\u2190</button>
      <output class="reader-page-indicator" data-reader-output="page-indicator" aria-live="polite">1 / 1</output>
      <button class="reader-nav-btn" data-reader-action="next-page" type="button" aria-label="Next page">\u2192</button>
    `;

    // Move content children into the scroller
    contentChildren.forEach(child => scroller.appendChild(child));

    // Clear and rebuild
    this.textContent = '';
    this.appendChild(chrome);
    this.appendChild(progress);

    // Wrap scroller and pager in a container for the grid row
    const book = document.createElement('main');
    book.className = 'reader-book';
    book.style.position = 'relative';
    book.style.minHeight = '0';
    book.style.overflow = 'hidden';
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

    let html = `
      <div class="reader-chrome-copy">
        <span class="reader-chrome-kicker">Reader</span>
        <span class="reader-chrome-title">${this.#escapeHTML(title)}</span>
      </div>
      <div class="reader-controls" role="toolbar" aria-label="Reading controls">
        <div class="reader-control-group" aria-label="Reading mode">
          <span class="reader-control-label">Mode</span>
          <button class="reader-seg-btn" data-reader-action="set-mode-scroll" data-reader-state="active" type="button" aria-pressed="true">Scroll</button>
          <button class="reader-seg-btn" data-reader-action="set-mode-pages" type="button" aria-pressed="false">Pages</button>
        </div>`;

    if (showFonts) {
      html += `
        <div class="reader-control-group" aria-label="Font size">
          <span class="reader-control-label">Type</span>
          <button class="reader-icon-btn" data-reader-action="font-decrease" type="button" aria-label="Decrease font size">A\u2212</button>
          <button class="reader-icon-btn" data-reader-action="font-increase" type="button" aria-label="Increase font size">A+</button>
        </div>`;
    }

    if (showCols) {
      html += `
        <div class="reader-control-group" aria-label="Page columns">
          <span class="reader-control-label">Cols</span>
          <button class="reader-seg-btn" data-reader-action="set-columns" data-reader-value="auto" data-reader-state="active" type="button">Auto</button>
          <button class="reader-seg-btn" data-reader-action="set-columns" data-reader-value="1" type="button">1</button>
          <button class="reader-seg-btn" data-reader-action="set-columns" data-reader-value="2" type="button">2</button>
          <button class="reader-seg-btn" data-reader-action="set-columns" data-reader-value="3" type="button">3</button>
        </div>`;
    }

    html += `</div>`;
    return html;
  }

  #resolveTitle() {
    if (this.getAttribute('reader-title')) return this.getAttribute('reader-title');
    const h1 = this.querySelector('h1');
    if (h1) return h1.textContent.trim();
    return document.title || 'Reader';
  }

  // ── Columns wrapper ───────────────────────────────────────────

  #ensureColumnsWrapper() {
    // Check inside scroller for existing layout-columns
    this.#columns = this.#scroller.querySelector(':scope > layout-columns');
    if (this.#columns) return;

    const wrapper = document.createElement('layout-columns');
    const children = [...this.#scroller.children];
    children.forEach(child => wrapper.appendChild(child));
    this.#scroller.appendChild(wrapper);
    this.#columns = wrapper;
  }

  // ── Mode switching ────────────────────────────────────────────

  #applyMode(mode, animate = true) {
    const anchorRatio = this.#getProgressRatio();
    this.#mode = mode;
    this.setAttribute('mode', mode);

    const isPages = mode === 'pages';

    if (isPages) {
      // Enforce single active paged instance
      for (const other of activePagedInstances) {
        if (other !== this) other.#applyMode('scroll', false);
      }
      activePagedInstances.add(this);

      // Move columns into pager
      this.#pager.appendChild(this.#columns);
      this.#pager.style.display = 'block';
      this.#scroller.style.display = 'none';
      this.#pageNav.style.display = 'flex';

      this.#applyColumnCount();
      this.#applyFontSizeToColumns();
      requestAnimationFrame(() => {
        this.#recalcPages(anchorRatio);
      });
    } else {
      activePagedInstances.delete(this);

      // Move columns back into scroller
      this.#scroller.appendChild(this.#columns);
      this.#pager.style.display = 'none';
      this.#scroller.style.display = '';
      this.#pageNav.style.display = 'none';

      // Reset pager overrides on columns
      this.#columns.style.removeProperty('column-count');
      this.#columns.style.removeProperty('column-width');

      requestAnimationFrame(() => {
        const max = this.#scroller.scrollHeight - this.#scroller.clientHeight;
        this.#scroller.scrollTop = max > 0 ? anchorRatio * max : 0;
        this.#updateScrollProgress();
      });
    }

    this.#updateChromeState();
    this.#persistState();
    this.#emit('reader-view:mode', { mode });
  }

  // ── Column management ─────────────────────────────────────────

  #resolveColumnCount() {
    if (this.#columnMode !== 'auto') return Number(this.#columnMode);
    const width = this.#pager?.clientWidth || window.innerWidth;
    if (width >= 1680) return 3;
    if (width >= 960)  return 2;
    return 1;
  }

  #applyColumnCount() {
    const count = this.#resolveColumnCount();
    this.#columns.style.setProperty('column-count', String(count));
    this.#columns.style.setProperty('column-width', 'auto');
    this.setAttribute('columns', this.#columnMode);
  }

  // ── Page calculation ──────────────────────────────────────────

  #recalcPages(anchorRatio = this.#getProgressRatio()) {
    if (this.#mode !== 'pages') return;

    const pager = this.#pager;
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

    this.#totalPages = Math.max(1, this.#pageStops.length);
    this.#page = this.#totalPages > 1
      ? Math.min(
          Math.round(anchorRatio * (this.#totalPages - 1)),
          this.#totalPages - 1
        )
      : 0;
    this.#scrollToPage(this.#page, false);
  }

  #scrollToPage(n, smooth = true) {
    this.#page = Math.max(0, Math.min(n, this.#totalPages - 1));
    const left = this.#pageStops[this.#page] ?? 0;
    this.#programmaticScroll = true;
    const useSmoothScroll = smooth && !this.#prefersReducedMotion();
    this.#pager.scrollTo({
      left,
      behavior: useSmoothScroll ? 'smooth' : 'instant'
    });
    this.#updateHUD();
    setTimeout(() => { this.#programmaticScroll = false; },
      useSmoothScroll ? 220 : 0);
  }

  #findNearestPage(scrollLeft) {
    let nearest = 0;
    let minDist = Infinity;
    this.#pageStops.forEach((stop, i) => {
      const dist = Math.abs(stop - scrollLeft);
      if (dist < minDist) { minDist = dist; nearest = i; }
    });
    return nearest;
  }

  // ── HUD / progress ────────────────────────────────────────────

  #getProgressRatio() {
    if (this.#mode === 'scroll') {
      if (!this.#scroller) return 0;
      const max = this.#scroller.scrollHeight - this.#scroller.clientHeight;
      return max > 0 ? this.#scroller.scrollTop / max : 0;
    }
    if (!this.#pager) return 0;
    const max = this.#pager.scrollWidth - this.#pager.clientWidth;
    return max > 0 ? this.#pager.scrollLeft / max : 0;
  }

  #updateHUD() {
    const pct = this.#totalPages > 1
      ? this.#page / (this.#totalPages - 1) : 1;
    this.#setProgress(pct);

    this.querySelectorAll('[data-reader-output="page-indicator"]')
      .forEach(el => {
        el.textContent = `${this.#page + 1} / ${this.#totalPages}`;
      });
    this.querySelectorAll('[data-reader-action="prev-page"]')
      .forEach(btn => { btn.toggleAttribute('disabled', this.#page === 0); });
    this.querySelectorAll('[data-reader-action="next-page"]')
      .forEach(btn => {
        btn.toggleAttribute('disabled', this.#page === this.#totalPages - 1);
      });

    this.#emit('reader-view:page', {
      page: this.#page + 1,
      total: this.#totalPages
    });
  }

  #updateScrollProgress() {
    if (this.#mode !== 'scroll' || !this.#scroller) return;
    const max = this.#scroller.scrollHeight - this.#scroller.clientHeight;
    const ratio = max > 0 ? this.#scroller.scrollTop / max : 1;
    this.#setProgress(ratio);
  }

  #setProgress(pct) {
    this.style.setProperty('--_progress', String(pct));
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
    this.addEventListener('click', e => {
      const el = e.target.closest('[data-reader-action]');
      if (!el) return;
      const action = el.dataset.readerAction;
      switch (action) {
        case 'toggle-mode':
          this.#applyMode(this.#mode === 'scroll' ? 'pages' : 'scroll');
          break;
        case 'set-mode-scroll': this.#applyMode('scroll'); break;
        case 'set-mode-pages':  this.#applyMode('pages');  break;
        case 'font-increase': this.#changeFontSize(1); break;
        case 'font-decrease': this.#changeFontSize(-1); break;
        case 'set-columns': {
          const ratio = this.#getProgressRatio();
          this.#columnMode = el.dataset.readerValue ?? 'auto';
          this.#applyColumnCount();
          this.#updateChromeState();
          if (this.#mode === 'pages') {
            requestAnimationFrame(() => this.#recalcPages(ratio));
          }
          this.#persistState();
          break;
        }
        case 'prev-page': this.#scrollToPage(this.#page - 1); break;
        case 'next-page': this.#scrollToPage(this.#page + 1); break;
      }
    });

    // Scroll progress
    this.#scroller.addEventListener('scroll',
      () => this.#updateScrollProgress(), { passive: true });

    // Pager scroll snap correction
    this.#pager.addEventListener('scroll', () => {
      if (this.#mode !== 'pages') return;
      const next = this.#findNearestPage(this.#pager.scrollLeft);
      if (next !== this.#page) {
        this.#page = next;
        this.#updateHUD();
      }
      if (this.#programmaticScroll) return;
      clearTimeout(this.#snapTimer);
      this.#snapTimer = setTimeout(() => {
        this.#scrollToPage(
          this.#findNearestPage(this.#pager.scrollLeft), false
        );
      }, ReaderView.SNAP_DELAY);
    }, { passive: true });

    // Keyboard
    this.#boundKeydown = this.#handleKeydown.bind(this);
  }

  // ── Keyboard ──────────────────────────────────────────────────

  #handleKeydown(e) {
    if (this.#mode !== 'pages') return;
    // Skip all interactive controls — don't hijack buttons, links, editable content
    if (e.target?.matches?.('input, textarea, select, button, a, [contenteditable]')) return;

    switch (e.key) {
      case 'ArrowRight': case 'PageDown': case ' ':
        e.preventDefault();
        this.#scrollToPage(this.#page + 1);
        break;
      case 'ArrowLeft': case 'PageUp':
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
      if (this.#mode === 'pages') {
        requestAnimationFrame(() => {
          this.#applyColumnCount();
          this.#recalcPages(this.#getProgressRatio());
        });
      } else {
        this.#updateScrollProgress();
      }
    });
    this.#ro.observe(this.#pager);
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

  #persistState() {
    if (this.getAttribute('persist') === 'false') return;
    const key = this.getAttribute('storage-key') || ReaderView.STORAGE_KEY;
    try {
      localStorage.setItem(key, JSON.stringify({
        mode: this.#mode,
        sizeIdx: this.#sizeIdx,
        columns: this.#columnMode
      }));
    } catch { /* storage unavailable */ }
  }

  #restorePersistedState() {
    if (this.getAttribute('persist') === 'false') return;
    const key = this.getAttribute('storage-key') || ReaderView.STORAGE_KEY;
    try {
      const saved = JSON.parse(localStorage.getItem(key) ?? 'null');
      if (!saved) return;
      if (saved.mode === 'scroll' || saved.mode === 'pages') {
        this.#mode = saved.mode;
      }
      if (typeof saved.sizeIdx === 'number' &&
          saved.sizeIdx >= 0 &&
          saved.sizeIdx < ReaderView.FONT_SIZES.length) {
        this.#sizeIdx = saved.sizeIdx;
      }
      if (saved.columns) {
        this.#columnMode = saved.columns;
      }
    } catch { /* parse error */ }
  }

  // ── Chrome state ──────────────────────────────────────────────

  #updateChromeState() {
    // Mode buttons
    this.querySelectorAll('[data-reader-action="set-mode-scroll"]')
      .forEach(btn => {
        const active = this.#mode === 'scroll';
        btn.setAttribute('data-reader-state', active ? 'active' : '');
        btn.setAttribute('aria-pressed', String(active));
      });
    this.querySelectorAll('[data-reader-action="set-mode-pages"]')
      .forEach(btn => {
        const active = this.#mode === 'pages';
        btn.setAttribute('data-reader-state', active ? 'active' : '');
        btn.setAttribute('aria-pressed', String(active));
      });

    // Column buttons
    this.querySelectorAll('[data-reader-action="set-columns"]')
      .forEach(btn => {
        const active = btn.dataset.readerValue === this.#columnMode;
        btn.setAttribute('data-reader-state', active ? 'active' : '');
      });

    // Font buttons
    this.#updateFontButtons();

    // Mode label outputs
    this.querySelectorAll('[data-reader-output="mode-label"]')
      .forEach(el => {
        el.textContent = this.#mode === 'scroll' ? 'Scroll' : 'Pages';
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

  #escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

customElements.define('reader-view', ReaderView);
