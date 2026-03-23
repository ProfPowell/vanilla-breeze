---
title: reader-view
type: web-component
category: interactive
layer: web-components
cssFile: src/web-components/reader-view/styles.css
jsFile: src/web-components/reader-view/logic.js
jsRequired: true
status: proposed
related:
  - layout-columns
  - article (native element)
  - page-toc
---

# `reader-view` — Specification (Revised)
## Vanilla Breeze — Web Component

An immersive reading shell that wraps long-form content and provides
togglable scroll and paged reading modes. In paged mode, CSS multi-column
layout combined with horizontal overflow produces a Kindle-style page-turn
experience. Without JavaScript the content renders as a normal scrolling
article via `layout-columns`.

This revision incorporates lessons from the `column-reader-demo-2.html`
prototype, aligns with VB web component conventions (shadow DOM,
`data-reader-action` delegation, `vb:` event namespace, try/catch
`localStorage`), and updates references from `layout-prose` to
`layout-columns` per the renamed spec.

---

## Table of Contents

- [Problem Statement](#problem-statement)
- [Four-Layer Stack](#four-layer-stack)
- [Progressive Enhancement Contract](#progressive-enhancement-contract)
- [HTML API](#html-api)
- [Data Attributes](#data-attributes)
- [Slots](#slots)
- [Events](#events)
- [CSS Architecture](#css-architecture)
- [JavaScript Architecture](#javascript-architecture)
- [Page Calculation — Lessons from the Prototype](#page-calculation)
- [Position Anchoring Across Mode Switches](#position-anchoring)
- [Column Resolution Strategy](#column-resolution-strategy)
- [Viewport & Safe Area Handling](#viewport--safe-area-handling)
- [Scroll Snap Correction](#scroll-snap-correction)
- [State Management](#state-management)
- [Keyboard & Touch](#keyboard--touch)
- [Persistence](#persistence)
- [Accessibility](#accessibility)
- [Print Behaviour](#print-behaviour)
- [Theme Interaction](#theme-interaction)
- [compendium.json Entry](#compendiumjson-entry)
- [Build Order](#build-order)
- [Decisions](#decisions)

---

## Problem Statement

Paged reading is a fundamentally interactive experience. It requires:

- A fixed-height viewport container that CSS multi-column can fill
- Horizontal scroll position management mapped to logical page numbers
- A ResizeObserver **and** `visualViewport` listener to recompute page
  count on orientation change, mobile browser toolbar show/hide, and
  on-screen keyboard appearance
- Chrome: mode toggle, font size control, column picker, progress bar,
  page indicator
- Scroll snap correction so free-scrolling in the pager settles on a
  clean page boundary
- Position anchoring so the reader's place is preserved when switching
  between scroll and pages mode, changing font size, or changing columns
- State persistence so mode, font size, and columns survive navigation

None of this is expressible in CSS alone. `layout-columns` provides the
column flow foundation; `reader-view` wraps it with the interactive
chrome and viewport management.

---

## Four-Layer Stack

```
Layer 1 — <article> or any block of semantic HTML
           Readable without any CSS or JS.

Layer 2 — layout-columns CSS
           Measure, column flow, break hygiene, vertical rhythm.
           Readable without JS.

Layer 3 — article[data-prose] / article[data-drop-cap]
           Hyphenation, typographic quality.
           No JS required.

Layer 4 — reader-view web component
           Viewport container, paged mode, chrome, ResizeObserver,
           scroll management, font size, columns, persistence.
```

---

## Progressive Enhancement Contract

**Without JavaScript:**
`reader-view` renders as a block element. Its child `layout-columns`
renders as a normal scrolling article. No chrome appears. The content
is fully readable.

**Without CSS:**
The article renders as unstyled but semantically correct HTML. Headings,
paragraphs, and block elements are in document order.

**With CSS only (no JS):**
`layout-columns` reading defaults apply. If `data-column-count` is
present, multi-column renders, but horizontal navigation does not
work — the user can scroll within the element but has no page controls.

**With JS:**
Full paged reading experience with chrome, page indicator, font control,
column picker, and ResizeObserver-driven recalculation.

The web component MUST NOT remove or replace the child content. It wraps
and enhances. Disconnecting the component or removing its script leaves
the content intact and readable.

---

## HTML API

### Minimal — JS provides chrome

```html
<reader-view>
  <article data-prose>
    <h1>Article Title</h1>
    <p>Content...</p>
  </article>
</reader-view>
```

JS automatically wraps the child content in `layout-columns` if one is
not already present.

### With layout-columns explicitly present

```html
<reader-view data-mode="pages" data-column-count="2">
  <layout-columns data-align="justify">
    <article data-prose data-drop-cap>
      <h1>Article Title</h1>
      <p>Content...</p>
    </article>
  </layout-columns>
</reader-view>
```

When `layout-columns` is present as a direct child, `reader-view` uses
it as-is rather than creating one. This allows explicit typographic and
layout control from markup.

### With custom chrome slot

```html
<reader-view>
  <div slot="chrome">
    <button data-reader-action="toggle-mode">Toggle mode</button>
    <output data-reader-output="page-indicator"></output>
  </div>
  <article data-prose>...</article>
</reader-view>
```

See [Slots](#slots) for the full slotted chrome API.

---

## Data Attributes

### On `<reader-view>`

| Attribute | Values | Default | Description |
|-----------|--------|---------|-------------|
| `data-mode` | `scroll`, `pages` | `scroll` | Reading mode. Reflected from JS state. |
| `data-column-count` | `auto`, `1`, `2`, `3` | `auto` | Column count in pages mode. Passed through to inner `layout-columns`. |
| `data-persist` | `true`, `false` | `true` | Whether mode, font-size, and columns are saved to `localStorage`. |
| `data-storage-key` | any string | `vb-reader` | `localStorage` key prefix. Override when multiple readers appear on one page. |
| `data-col-controls` | `true`, `false` | `true` | Whether the column picker renders in the chrome. |
| `data-font-controls` | `true`, `false` | `true` | Whether A-/A+ buttons render in the chrome. |
| `data-reader-title` | any string | _(auto)_ | Chrome bar title. Falls back to first `<h1>` text, then `document.title`. |

`data-mode` and `data-column-count` are reflected attributes — setting
them in HTML sets the initial state; JS updates them as the user
interacts, making them inspectable in DevTools at any time.

### CSS state selectors (for external styling)

```css
reader-view[data-mode="pages"] { ... }
reader-view[data-column-count="2"] { ... }
reader-view[data-upgraded] { ... }  /* component has initialised */
```

---

## Slots

Light DOM slots allow operators to replace the chrome without forking
the component. The component falls back to its own generated chrome if
no slot content is provided.

### `slot="chrome"` — replace the entire chrome bar

```html
<reader-view>
  <div slot="chrome">
    <!-- Full custom chrome. Component reads data-reader-action
         and data-reader-output attributes to wire up behaviour. -->
  </div>
  <article>...</article>
</reader-view>
```

### Action attributes (on chrome elements)

Any element inside `slot="chrome"` can carry `data-reader-action` to
trigger component behaviour via delegated event handling.

| `data-reader-action` | Trigger | Effect |
|----------------------|---------|--------|
| `toggle-mode` | `click` | Toggles between scroll and pages |
| `set-mode-scroll` | `click` | Sets mode to scroll |
| `set-mode-pages` | `click` | Sets mode to pages |
| `font-increase` | `click` | Increments font size one step |
| `font-decrease` | `click` | Decrements font size one step |
| `set-columns` | `click` | Sets columns from `data-reader-value` |
| `prev-page` | `click` | Goes to previous page (pages mode) |
| `next-page` | `click` | Goes to next page (pages mode) |

### Output attributes (on chrome elements)

| `data-reader-output` | Content |
|----------------------|---------|
| `page-indicator` | `"3 / 12"` current/total |
| `mode-label` | `"Scroll"` or `"Pages"` |
| `column-count` | Current resolved column count as string |

### `data-reader-state` (component-managed, on chrome elements)

The component sets these on relevant chrome elements for CSS styling:

| Attribute | Set on | Values |
|-----------|--------|--------|
| `data-reader-state="active"` | Mode buttons, col buttons | When that option is current |
| `disabled` | Prev/next, font buttons | When at first/last page, or min/max font size |

---

## Events

All events bubble and are composed. Events use the `vb:` namespace
prefix per VB convention.

| Event | `detail` | Fired when |
|-------|----------|------------|
| `vb:reader:mode` | `{ mode: 'scroll' \| 'pages' }` | Mode toggled |
| `vb:reader:page` | `{ page: number, total: number }` | Page changes in pages mode |
| `vb:reader:font` | `{ size: string, index: number }` | Font size changes |

```javascript
document.querySelector('reader-view')
  .addEventListener('vb:reader:page', ({ detail }) => {
    console.log(`Page ${detail.page} of ${detail.total}`);
  });
```

---

## CSS Architecture

```css
@layer web-components {

  reader-view {
    display: block;
    /* Block container in scroll mode. Pages mode takes over via
       attribute selector below. */
  }

  reader-view[data-upgraded] {
    /* Mark: component has initialised, safe to style chrome */
  }

  /* ── Full-viewport shell (pages mode) ──
     position: fixed gives the definite height that height:100%
     children need to resolve against. Grid rows: chrome + progress
     + content.
  ── */
  reader-view[data-mode="pages"] {
    position: fixed;
    inset: 0;
    z-index: var(--z-reader, 10);
    display: grid;
    grid-template-rows: var(--_chrome-h) 2px 1fr;
    background: var(--color-background);
  }

  /* ── Chrome bar ── */
  .reader-chrome {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--size-m);
    padding-inline: max(var(--size-m), env(safe-area-inset-right))
                     max(var(--size-m), env(safe-area-inset-left));
    block-size: var(--_chrome-h, 3.625rem);
    background: var(--color-surface);
    border-block-end: var(--border-width-thin) solid var(--color-border);
    flex-shrink: 0;
  }

  .reader-chrome-title {
    font-size: var(--font-size-xs);
    letter-spacing: var(--letter-spacing-wider, 0.08em);
    text-transform: uppercase;
    color: var(--color-text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-inline-size: 0;
  }

  .reader-controls {
    display: flex;
    align-items: center;
    gap: var(--size-s);
    flex-shrink: 0;
    min-inline-size: 0;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .reader-controls::-webkit-scrollbar { display: none; }

  .reader-control-group {
    display: inline-flex;
    align-items: center;
    gap: var(--size-3xs);
    padding: var(--size-3xs);
    background: var(--color-surface-raised, rgba(255, 255, 255, 0.04));
    border: var(--border-width-thin) solid var(--color-border);
    border-radius: var(--radius-full);
    flex: 0 0 auto;
  }

  .reader-control-label {
    padding-inline: var(--size-xs) var(--size-3xs);
    color: var(--color-text-muted);
    font-size: var(--font-size-2xs, 0.625rem);
    font-weight: var(--font-weight-semibold);
    letter-spacing: var(--letter-spacing-wider, 0.15em);
    text-transform: uppercase;
  }

  /* ── Scroll container ── */
  .reader-scroll {
    overflow-y: auto;
    overflow-x: hidden;
    padding:
      max(var(--size-m), env(safe-area-inset-top))
      max(var(--size-m), env(safe-area-inset-right))
      max(var(--size-m), calc(var(--size-m) + env(safe-area-inset-bottom)))
      max(var(--size-m), env(safe-area-inset-left));
  }

  /* ── Pager container ──
     height: 100% resolves because reader-view[data-mode="pages"]
     is position:fixed with grid-template-rows giving a definite
     height to this grid cell.
  ── */
  .reader-pager {
    display: none;
    position: relative;
    inline-size: 100%;
    block-size: 100%;
    overflow-x: auto;
    overflow-y: hidden;
    overscroll-behavior-x: contain;
    scrollbar-width: none;
    background: var(--color-background);
  }

  .reader-pager::-webkit-scrollbar { display: none; }

  /* ── Inner column surface (pages mode) ──
     height: 100% resolves because .reader-pager has definite height.
     column-fill: auto fills vertically then spills horizontally.
     width/min-width ensure horizontal overflow.
  ── */
  .reader-pager > layout-columns {
    inline-size: 100%;
    min-inline-size: 100%;
    block-size: 100%;
    max-inline-size: none;
    padding-block: var(--_page-pad-top, clamp(1.25rem, 3.6vh, 2.375rem))
                    var(--_page-pad-bottom, clamp(1.75rem, 4.8vh, 3.25rem));
    padding-inline: var(--_page-gutter, clamp(1.5rem, 4vw, 4.5rem));
    column-fill: auto;
  }

  /* Lift max-width on children inside pager so content fills columns */
  .reader-pager > layout-columns > * {
    max-inline-size: none;
  }

  /* ── Progress bar ── */
  .reader-progress {
    background: var(--color-interactive);
    transform-origin: left;
    transform: scaleX(var(--_progress, 0));
    transition: transform var(--motion-duration-normal) var(--motion-ease-out);
    pointer-events: none;
  }

  /* ── Page nav pill ── */
  .reader-page-nav {
    position: absolute;
    inset-block-end: max(var(--size-l), calc(var(--size-m) + env(safe-area-inset-bottom)));
    inset-inline-start: 50%;
    translate: -50% 0;
    display: flex;
    align-items: center;
    gap: var(--size-m);
    background: var(--color-surface);
    border: var(--border-width-thin) solid var(--color-border);
    border-radius: var(--radius-full);
    padding: var(--size-xs) var(--size-m);
    box-shadow: var(--shadow-m);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    z-index: 5;
  }

  /* Hidden in scroll mode */
  reader-view[data-mode="scroll"] .reader-page-nav {
    display: none;
  }

  /* ── Mobile chrome collapse ── */
  @media (max-width: 47.999rem) {
    reader-view .reader-control-label { display: none; }
    reader-view .reader-chrome-kicker { display: none; }
  }

  /* ── Reduced motion ── */
  @media (prefers-reduced-motion: reduce) {
    .reader-progress { transition: none; }
  }
}
```

---

## JavaScript Architecture

`reader-view` follows VB's functional-core / imperative-shell pattern
with shadow DOM (`mode: 'open'`), private fields, and `data-reader-action`
delegation.

```javascript
// src/web-components/reader-view/logic.js

class ReaderView extends HTMLElement {

  // ── Private state ─────────────────────────────────────────────

  #mode       = /** @type {'scroll' | 'pages'} */ ('scroll')
  #page       = /** @type {number} */ (0)
  #totalPages = /** @type {number} */ (1)
  #sizeIdx    = /** @type {number} */ (2)
  #columnMode = /** @type {string} */ ('auto')
  #pageStops  = /** @type {number[]} */ ([0])

  #columns    = /** @type {HTMLElement} */ (null)   // inner layout-columns
  #pager      = /** @type {HTMLElement} */ (null)
  #scroller   = /** @type {HTMLElement} */ (null)
  #ro         = /** @type {ResizeObserver} */ (null)

  #programmaticScroll = false
  #snapTimer          = 0

  static FONT_SIZES = ['0.875rem', '0.9375rem', '1rem', '1.0625rem', '1.125rem', '1.25rem'];
  static SNAP_DELAY  = 90;   // ms debounce before snap correction
  static STORAGE_KEY = 'vb-reader';

  // ── Lifecycle ─────────────────────────────────────────────────

  connectedCallback() {
    this.#restorePersistedState();
    this.#ensureColumnsWrapper();
    this.#buildChrome();
    this.#bindActions();
    this.#setupResizeObserver();
    this.#setupViewportListeners();
    this.#applyMode(this.#mode, false);
    this.setAttribute('data-upgraded', '');
  }

  disconnectedCallback() {
    this.#ro?.disconnect();
    this.removeAttribute('data-upgraded');
    clearTimeout(this.#snapTimer);
    // Remove document-level keyboard listener
    document.removeEventListener('keydown', this.#handleKeydown);
  }

  // ── Columns wrapper ───────────────────────────────────────────

  #ensureColumnsWrapper() {
    this.#columns = this.querySelector(':scope > layout-columns');
    if (this.#columns) return;

    const wrapper = document.createElement('layout-columns');
    const children = [...this.children].filter(
      el => !el.matches('[slot="chrome"], .reader-chrome')
    );
    children.forEach(child => wrapper.appendChild(child));
    this.appendChild(wrapper);
    this.#columns = wrapper;
  }

  // ── Chrome ────────────────────────────────────────────────────

  #buildChrome() {
    if (this.querySelector('[slot="chrome"]')) {
      this.#adoptSlottedChrome();
      return;
    }
    // Inject default chrome into light DOM.
    // (Full implementation in build phase 2.)
  }

  // ── Mode switching ────────────────────────────────────────────

  #applyMode(mode, animate = true) {
    const anchorRatio = this.#getProgressRatio();
    this.#mode = mode;
    this.dataset.mode = mode;

    const isPages = mode === 'pages';
    this.#getPager().style.display = isPages ? 'block' : 'none';
    this.#getScroller().style.display = isPages ? 'none' : '';
    this.#getPageNav().style.display = isPages ? 'flex' : 'none';

    if (isPages) {
      this.#applyColumnCount();
      requestAnimationFrame(() => {
        this.#recalcPages(anchorRatio);
      });
    } else {
      // Restore scroll position from anchor ratio
      requestAnimationFrame(() => {
        const scroller = this.#getScroller();
        const max = scroller.scrollHeight - scroller.clientHeight;
        scroller.scrollTop = max > 0 ? anchorRatio * max : 0;
        this.#updateScrollProgress();
      });
    }

    this.#updateChromeState();
    this.#persistState();
    this.#emit('vb:reader:mode', { mode });
  }

  // ── Column management ─────────────────────────────────────────

  #resolveColumnCount() {
    if (this.#columnMode !== 'auto') return Number(this.#columnMode);
    const width = this.#getPager().clientWidth || window.innerWidth;
    if (width >= 1680) return 3;
    if (width >= 960)  return 2;
    return 1;
  }

  #applyColumnCount() {
    const count = this.#resolveColumnCount();
    this.#columns.style.setProperty('column-count', String(count));
    this.#columns.style.setProperty('column-width', 'auto');
    this.dataset.columnCount = this.#columnMode;
  }

  // ── Page calculation ──────────────────────────────────────────
  // See detailed section below.

  #recalcPages(anchorRatio = this.#getProgressRatio()) {
    if (this.#mode !== 'pages') return;

    const pager = this.#getPager();
    const width = pager.clientWidth || 1;
    const scrollWidth = pager.scrollWidth;
    const maxScroll = Math.max(0, scrollWidth - width);
    const rawPages = scrollWidth / width;
    const estimated = Math.max(1, Math.ceil(rawPages - 0.01));

    // Build page stops array
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
    const behavior = smooth && !this.#prefersReducedMotion()
      ? 'smooth' : 'instant';
    this.#getPager().scrollTo({ left, behavior });
    this.#updateHUD();
    // Release programmatic flag after scroll settles
    setTimeout(() => { this.#programmaticScroll = false; },
      behavior === 'smooth' ? 220 : 0);
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
      const s = this.#getScroller();
      const max = s.scrollHeight - s.clientHeight;
      return max > 0 ? s.scrollTop / max : 0;
    }
    const p = this.#getPager();
    const max = p.scrollWidth - p.clientWidth;
    return max > 0 ? p.scrollLeft / max : 0;
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
    this.#emit('vb:reader:page', {
      page: this.#page + 1,
      total: this.#totalPages
    });
  }

  #updateScrollProgress() {
    if (this.#mode !== 'scroll') return;
    const s = this.#getScroller();
    const max = s.scrollHeight - s.clientHeight;
    const ratio = max > 0 ? s.scrollTop / max : 1;
    this.#setProgress(ratio);
  }

  #setProgress(pct) {
    this.style.setProperty('--_progress', pct);
  }

  // ── Font size ─────────────────────────────────────────────────

  #applyFontSize() {
    this.#columns.style.fontSize = ReaderView.FONT_SIZES[this.#sizeIdx];
    if (this.#mode === 'pages') {
      const ratio = this.#getProgressRatio();
      requestAnimationFrame(() => this.#recalcPages(ratio));
    }
    this.#persistState();
    this.#emit('vb:reader:font', {
      size: ReaderView.FONT_SIZES[this.#sizeIdx],
      index: this.#sizeIdx
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
        case 'font-increase':
          if (this.#sizeIdx < ReaderView.FONT_SIZES.length - 1) {
            this.#sizeIdx++;
            this.#applyFontSize();
          }
          break;
        case 'font-decrease':
          if (this.#sizeIdx > 0) {
            this.#sizeIdx--;
            this.#applyFontSize();
          }
          break;
        case 'set-columns': {
          const ratio = this.#getProgressRatio();
          this.#columnMode = el.dataset.readerValue ?? 'auto';
          this.#applyColumnCount();
          if (this.#mode === 'pages') {
            requestAnimationFrame(() => this.#recalcPages(ratio));
          }
          this.#updateChromeState();
          this.#persistState();
          break;
        }
        case 'prev-page': this.#scrollToPage(this.#page - 1); break;
        case 'next-page': this.#scrollToPage(this.#page + 1); break;
      }
    });

    // Scroll progress tracking
    this.#getScroller().addEventListener('scroll',
      () => this.#updateScrollProgress(), { passive: true });

    // Scroll snap correction on pager
    this.#getPager().addEventListener('scroll', () => {
      if (this.#mode !== 'pages') return;
      const next = this.#findNearestPage(this.#getPager().scrollLeft);
      if (next !== this.#page) {
        this.#page = next;
        this.#updateHUD();
      }
      if (this.#programmaticScroll) return;
      clearTimeout(this.#snapTimer);
      this.#snapTimer = setTimeout(() => {
        this.#scrollToPage(
          this.#findNearestPage(this.#getPager().scrollLeft), false
        );
      }, ReaderView.SNAP_DELAY);
    }, { passive: true });

    // Document-level keyboard
    this.#handleKeydown = this.#handleKeydown.bind(this);
    document.addEventListener('keydown', this.#handleKeydown);
  }

  // ── Keyboard ──────────────────────────────────────────────────

  #handleKeydown(e) {
    if (this.#mode !== 'pages') return;
    if (e.target?.matches('input, textarea, select')) return;

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
          this.#recalcPages(this.#getProgressRatio());
        });
      } else {
        this.#updateScrollProgress();
      }
    });
    this.#ro.observe(this.#getPager());
  }

  // ── Viewport handling ─────────────────────────────────────────

  #setupViewportListeners() {
    if (window.visualViewport) {
      const handler = () => {
        if (this.#mode === 'pages') {
          requestAnimationFrame(() => this.#recalcPages());
        }
      };
      window.visualViewport.addEventListener('resize', handler);
      window.visualViewport.addEventListener('scroll', handler);
    }
  }

  // ── Persistence ───────────────────────────────────────────────

  #persistState() {
    if (this.dataset.persist === 'false') return;
    const key = this.dataset.storageKey ?? ReaderView.STORAGE_KEY;
    try {
      localStorage.setItem(key, JSON.stringify({
        mode: this.#mode,
        sizeIdx: this.#sizeIdx,
        columns: this.#columnMode
      }));
    } catch { /* storage unavailable */ }
  }

  #restorePersistedState() {
    if (this.dataset.persist === 'false') return;
    const key = this.dataset.storageKey ?? ReaderView.STORAGE_KEY;
    try {
      const saved = JSON.parse(localStorage.getItem(key) ?? 'null');
      if (!saved) return;
      this.#mode       = saved.mode    ?? 'scroll';
      this.#sizeIdx    = saved.sizeIdx ?? 2;
      this.#columnMode = saved.columns ?? 'auto';
    } catch { /* parse error */ }
  }

  // ── Helpers ───────────────────────────────────────────────────

  #getPager()    { return this.#pager    ??= this.querySelector('.reader-pager'); }
  #getScroller() { return this.#scroller ??= this.querySelector('.reader-scroll'); }
  #getPageNav()  { return this.querySelector('.reader-page-nav'); }

  #emit(name, detail) {
    this.dispatchEvent(new CustomEvent(name, {
      detail, bubbles: true, composed: true
    }));
  }

  #prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  #updateChromeState() {
    // Set data-reader-state="active" on matching mode/col buttons.
    // (Full implementation in build phase 2.)
  }

  #adoptSlottedChrome() {
    // Wire data-reader-action and data-reader-output on slotted
    // chrome content. (Full implementation in build phase 2.)
  }
}

customElements.define('reader-view', ReaderView);
```

---

## Page Calculation

The original spec used `Math.round(scrollWidth / clientWidth)` to
compute total pages. The prototype reveals this is insufficient.

### Why pageStops matters

`scrollWidth / clientWidth` gives a fractional page count. Simple
rounding can be off-by-one because the last page is often shorter
than a full viewport width. The prototype builds an explicit array
of scroll-left positions — one per page boundary:

```
Page 0: scrollLeft = 0
Page 1: scrollLeft = clientWidth
Page 2: scrollLeft = clientWidth * 2
...
Page N: scrollLeft = maxScroll (scrollWidth - clientWidth)
```

The last entry snaps to `maxScroll` rather than the computed
multiple. This ensures the last page is always reachable and that
`scrollToPage(totalPages - 1)` always lands flush at the end.

The deduplication guard (`stop - previous > 1`) prevents two stops
from landing on nearly the same pixel — which happens when the
content fills an exact number of pages.

### Recalc triggers

Page count must be recomputed when:

1. Mode switches to pages (initial layout)
2. Font size changes (more/less text per column)
3. Column count changes
4. Container resizes (orientation, toolbar, viewport resize)
5. `visualViewport` resize/scroll events (mobile toolbar show/hide)

All recalcs preserve position via `anchorRatio`.

---

## Position Anchoring Across Mode Switches

The prototype's most important UX pattern: when switching between
scroll and pages mode, the reader's position is preserved.

### Algorithm

1. Before switching, compute `anchorRatio` — the progress through
   the content as a 0..1 float (scroll position / max scroll, in
   the current mode).
2. Switch mode. Layout changes.
3. After layout, convert `anchorRatio` back to the new mode's
   coordinate system:
   - **Scroll → pages**: `page = round(anchorRatio * (totalPages - 1))`
   - **Pages → scroll**: `scrollTop = anchorRatio * maxScrollHeight`

This also applies when font size or column count changes: capture
ratio → mutate → restore.

---

## Column Resolution Strategy

The spec originally delegated column count to
`layout-columns[data-column-count="auto"]` using CSS `column-width`.
The prototype reveals that **in pages mode, `column-fill: auto`
combined with `column-width` behaves unreliably** — the browser may
not fill columns as expected when height is constrained.

### Revised approach

In pages mode, `reader-view` resolves `auto` to an explicit count
based on pager width:

| Pager width | Resolved count |
|-------------|----------------|
| < 960px | 1 |
| 960px – 1679px | 2 |
| >= 1680px | 3 |

Then sets `column-count: N; column-width: auto` on the inner
`layout-columns`. This gives deterministic results with
`column-fill: auto`.

In scroll mode (no paging), `layout-columns` handles its own column
behaviour via its CSS `data-column-count` attribute as specced.

---

## Viewport & Safe Area Handling

The prototype demonstrates two critical mobile requirements the
original spec omitted:

### 1. `visualViewport` API

Mobile browsers resize the visual viewport when the toolbar
shows/hides — but this does NOT fire a `window.resize` event and
may not trigger a `ResizeObserver` on elements sized in CSS
viewport units. The prototype adds:

```javascript
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', handler);
  window.visualViewport.addEventListener('scroll', handler);
}
```

Both events trigger `#recalcPages()` to recompute page count with
the new available height.

### 2. `env(safe-area-inset-*)` for notched devices

The prototype uses `max(1rem, env(safe-area-inset-*))` on padding
to ensure content doesn't sit behind notches, Dynamic Island, or
home indicators. This requires `viewport-fit=cover` in the meta
viewport tag.

The `reader-view` CSS uses safe-area-aware padding on:
- `.reader-chrome` padding-inline
- `.reader-scroll` padding (all sides)
- `.reader-page-nav` inset-block-end

---

## Scroll Snap Correction

In pages mode, the pager is a native horizontal scroll container
(`overflow-x: auto`). This gives free inertial scrolling on touch
devices — better than the original spec's manual `touchstart` /
`touchend` swipe detection.

However, native scroll doesn't snap to page boundaries. The
prototype solves this with a debounced snap correction:

1. On pager `scroll` event (passive), update the HUD to show the
   nearest page.
2. If the scroll was programmatic (`#programmaticScroll` flag is
   true), do nothing further.
3. Otherwise, start a 90ms debounce timer. When it fires, snap to
   the nearest page boundary with `scrollTo({ behavior: 'instant' })`.

The `#programmaticScroll` flag prevents the snap handler from
fighting with `#scrollToPage()` — which already scrolls to an
exact page boundary.

### Why not CSS scroll-snap?

`scroll-snap-type: x mandatory` with `scroll-snap-align: start`
would be ideal, but there is no way to place snap points at column
boundaries without injecting sentinel elements — which requires
knowledge of column heights. The JS snap correction is more
reliable until browsers provide better column-aware snap support.

---

## State Management

All mutable state is held in private fields. State changes follow
a strict unidirectional flow:

```
User action (click / key / scroll)
  → action handler
    → state update (#mode, #page, #sizeIdx, #columnMode)
      → DOM update (attribute, scrollTo, style)
        → HUD update (indicator, progress)
          → event dispatch
            → persist
```

The `data-mode` and `data-column-count` attributes on the element
are reflected outputs, not inputs. External code should fire
delegated action clicks or use custom events, not set attributes
directly.

---

## Keyboard & Touch

### Keyboard (pages mode only)

| Key | Action |
|-----|--------|
| `ArrowRight`, `Space`, `PageDown` | Next page |
| `ArrowLeft`, `PageUp` | Previous page |
| `Home` | First page |
| `End` | Last page |

The listener is added on `connectedCallback` and removed on
`disconnectedCallback`. It guards against `this.#mode !== 'pages'`
and against focus in `input`, `textarea`, `select` elements.

### Touch (pages mode)

Touch is handled by the browser's native horizontal scroll on the
pager container. No custom touch handlers are needed. The snap
correction (see above) ensures the scroll settles on a page
boundary after the user lifts their finger.

`overscroll-behavior-x: contain` on the pager prevents the body
from scrolling when the user reaches the first or last page.

### Reduced motion

When `prefers-reduced-motion: reduce` matches:
- `#scrollToPage` uses `behavior: 'instant'`
- Progress bar CSS transition is removed

---

## Persistence

When `data-persist` is not `false`, the component saves to
`localStorage`:

```json
{
  "mode": "pages",
  "sizeIdx": 3,
  "columns": "2"
}
```

The `data-storage-key` attribute allows multiple reader instances on
one page to maintain independent state. Default key: `vb-reader`.

All `localStorage` access is wrapped in `try/catch` — storage can be
unavailable in private browsing, cross-origin iframes, or when
storage quota is exceeded. Per VB convention, storage errors fail
silently.

---

## Accessibility

- The chrome bar is `role="toolbar"` with `aria-label="Reading controls"`.
- Mode buttons are `<button type="button">` with `aria-pressed`
  reflecting whether that mode is currently active.
- Font size buttons have `aria-label="Increase font size"` /
  `"Decrease font size"` and `disabled` attribute when at min/max.
- Column buttons carry `aria-pressed` matching the current column
  state.
- The page indicator is an `<output>` element with
  `aria-live="polite"` so screen reader users hear page changes.
- In pages mode, the pager container has `role="region"` and
  `aria-label="Article pages"`.
- Focus is managed: entering pages mode does not steal focus from
  the current element. Exiting pages mode returns focus to the mode
  toggle button.
- All keyboard shortcuts are documented and guard against capturing
  input from form elements.
- All animations respect `prefers-reduced-motion: reduce`.

---

## Print Behaviour

When the user prints while in pages mode, the horizontal paged
layout is inappropriate. The component should add a print
stylesheet that:

```css
@media print {
  reader-view {
    position: static !important;
    display: block !important;
  }
  .reader-chrome,
  .reader-progress,
  .reader-page-nav { display: none !important; }
  .reader-pager { display: none !important; }
  .reader-scroll {
    display: block !important;
    overflow: visible !important;
  }
}
```

This ensures the scroll mode content prints normally regardless of
which mode is active on screen.

---

## Theme Interaction

`reader-view` uses VB tokens for all visual properties:

- `--color-background`, `--color-surface` — chrome and pager bg
- `--color-border`, `--border-width-thin` — chrome border, page nav
- `--color-interactive` — progress bar
- `--color-text-muted` — chrome labels and title
- `--shadow-m` — page nav shadow
- `--radius-full` — pill buttons
- `--motion-duration-normal`, `--motion-ease-out` — progress animation

Extreme themes will change colours and typography but do not affect
the layout grid or page calculation. The `--z-reader` token can be
overridden per-theme if stacking conflicts arise.

---

## compendium.json Entry

```json
{
  "id": "reader-view",
  "tag": "reader-view",
  "type": "web-component",
  "category": "interactive",
  "cssFile": "src/web-components/reader-view/styles.css",
  "jsRequired": true,
  "variants": [
    {
      "id": "scroll",
      "name": "Scroll Mode",
      "html": "<reader-view data-mode=\"scroll\"><article data-prose><h2>Article Title</h2><p>Long-form content in the default scrolling reading mode. Layout-columns applies measure and rhythm automatically.</p><p>Switch to Pages mode for the paged Kindle-style experience.</p></article></reader-view>",
      "interactive": true
    },
    {
      "id": "pages",
      "name": "Pages Mode",
      "fixtureWidth": "wide",
      "html": "<reader-view data-mode=\"pages\" data-column-count=\"auto\"><article data-prose><h2>Article Title</h2><p>Content flows into columns and pages. Navigate with arrow keys or the prev/next controls. Font size is adjustable. State persists across sessions.</p><p>The browser determines column count based on available width. Single column on narrow screens, multi-column on wide.</p></article></reader-view>",
      "interactive": true
    },
    {
      "id": "two-column",
      "name": "Two Column Pages",
      "fixtureWidth": "wide",
      "html": "<reader-view data-mode=\"pages\" data-column-count=\"2\"><article data-prose><h2>Two-Column Article</h2><p>Explicit two-column paged layout. Each page shows two columns of text. Column rules appear between columns.</p><p>Use when the column count must be fixed regardless of viewport width.</p></article></reader-view>",
      "interactive": true
    },
    {
      "id": "custom-chrome",
      "name": "Custom Chrome",
      "html": "<reader-view>\n  <div slot=\"chrome\">\n    <button data-reader-action=\"set-mode-scroll\" data-reader-state>Scroll</button>\n    <button data-reader-action=\"set-mode-pages\" data-reader-state>Pages</button>\n    <output data-reader-output=\"page-indicator\" aria-live=\"polite\"></output>\n  </div>\n  <article data-prose><h2>Custom Chrome</h2><p>The chrome bar is fully replaced via slot. The component wires data-reader-action and data-reader-output attributes automatically.</p></article>\n</reader-view>",
      "interactive": true
    }
  ]
}
```

---

## Build Order

### Phase 1 — Scroll mode + basic shell

- `src/web-components/reader-view/logic.js`
  - `connectedCallback` / `disconnectedCallback`
  - `#ensureColumnsWrapper` — wraps children in `layout-columns`
  - `#buildChrome` — default chrome with mode toggle and title
  - Scroll mode only: scroller with scroll progress
  - `data-upgraded` attribute lifecycle
- `src/web-components/reader-view/styles.css`
  - `reader-view` base block display
  - `.reader-chrome` grid layout with safe-area padding
  - `.reader-scroll` overflow styles with safe-area padding
  - `.reader-progress` bar (scroll progress only)

**Dependency**: `layout-columns` must be built first (at least
Phase 1 of that spec).

### Phase 2 — Pages mode

- `reader-view[data-mode="pages"]` fixed-viewport CSS
- `.reader-pager` with `overflow-x: auto`, `scrollbar-width: none`,
  `overscroll-behavior-x: contain`
- `#applyMode('pages')` fully wired
- `#recalcPages` with `pageStops` array
- `#scrollToPage` with programmatic scroll guard
- `#findNearestPage` + snap correction on scroll
- `#getProgressRatio` + `#updateHUD`
- ResizeObserver on pager element
- `visualViewport` listeners
- Position anchoring across mode switches

### Phase 3 — Keyboard + chrome controls

- Document-level keydown listener (ArrowLeft/Right, Space,
  PageUp/Down, Home/End) with form-element guard
- Font size A-/A+ buttons with recalc
- Column picker (Auto/1/2/3) with `#resolveColumnCount`
- `data-reader-state="active"` management on chrome buttons
- `data-col-controls` / `data-font-controls` conditional rendering
- `.reader-page-nav` pill with prev/next and page indicator

### Phase 4 — Persistence + slotted chrome + events

- `#persistState` / `#restorePersistedState`
- `data-persist` and `data-storage-key` attribute support
- `#adoptSlottedChrome` — wire `data-reader-action` and
  `data-reader-output` on externally supplied chrome elements
- `vb:reader:mode`, `vb:reader:page`, `vb:reader:font` events
- `data-reader-title` attribute with `<h1>` / `document.title`
  fallback

### Phase 5 — Accessibility + print

- `role="toolbar"` on chrome, `aria-label`
- `aria-pressed` on mode and column buttons
- `disabled` attribute on font buttons at min/max
- `<output aria-live="polite">` for page indicator
- `role="region"` + `aria-label` on pager
- Focus management on mode switch
- `prefers-reduced-motion` — `scrollTo instant`, remove transitions
- `@media print` stylesheet to collapse to scroll mode

### Phase 6 — compendium.json + docs

- Register in `src/web-components/index.js`
- Add entry to compendium with all variants
- Documentation page
- Screenshot fixtures for scroll and pages mode

---

## Decisions

These items were open questions in the original spec. They are now
resolved based on prototype evidence and VB conventions.

1. **`position: fixed` side-effects** — The fixed overlay is correct
   for pages mode. `--z-reader` (default: 10) allows operators to
   resolve stacking conflicts. VB does not have a centralised
   z-index token system — introducing one for this component is
   out of scope. Document the token in the component's docs page.

2. **`scroll-snap` vs. JS snap** — CSS scroll-snap cannot snap to
   column boundaries without sentinel elements. The prototype proves
   that JS snap correction (90ms debounce + `scrollTo instant`)
   works reliably. Revisit if `scroll-snap-align` gains column
   awareness in a future spec.

3. **Title source** — Use `data-reader-title` attribute if present.
   Fall back to first `<h1>` inside the component. Fall back to
   `document.title`. This avoids DOM traversal brittleness while
   keeping the zero-config case simple.

4. **Multiple instances per page** — Two `reader-view` elements both
   going `position: fixed` is wrong UX. Add a module-level
   `Set` tracking active paged instances. When one enters pages mode,
   any other active paged instance reverts to scroll mode.

5. **`column-fill: auto` ownership** — CSS rule
   `.reader-pager > layout-columns { column-fill: auto }` is in
   `@layer web-components`, which is higher than `@layer custom-elements`
   where `layout-columns` lives. No specificity bump needed. This is
   cleaner than inline style via JS. Confirmed by VB layer order.

6. **Touch handling** — The prototype proves that native horizontal
   scroll (`overflow-x: auto`) with JS snap correction is superior to
   manual `touchstart`/`touchend` swipe detection. Native scroll gives
   free inertial physics, rubber-banding, and momentum. The spec's
   original touch swipe code is removed.

7. **Content duplication** — The prototype duplicates innerHTML into
   both scroll and pager articles. This wastes memory and creates DOM
   synchronisation problems (e.g., form state, video playback). The
   revised spec uses a single `layout-columns` element that is moved
   between `.reader-scroll` and `.reader-pager` on mode switch. The
   `anchorRatio` pattern handles position preservation.

8. **Naming** — Renamed from `layout-prose` to `layout-columns`
   throughout. Renamed `data-columns` to `data-column-count`. Renamed
   event prefix to `vb:reader:*`. Renamed storage key to `vb-reader`.
