---
title: reader-view
type: web-component
category: interactive
layer: web-components
cssFile: src/web-components/reader-view/styles.css
jsFile: src/web-components/reader-view/index.js
jsRequired: true
status: proposed
related:
  - layout-prose
  - article (native element)
  - page-toc
---

# `reader-view` — Specification
## Vanilla Breeze — Web Component

An immersive reading shell that wraps long-form content and provides
togglable scroll and paged reading modes. In paged mode, CSS multi-column
layout combined with horizontal overflow produces a Kindle-style page-turn
experience. Without JavaScript the content renders as a normal scrolling
article via `layout-prose`.

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
- [State Management](#state-management)
- [Keyboard & Touch](#keyboard--touch)
- [Persistence](#persistence)
- [Accessibility](#accessibility)
- [compendium.json Entry](#compendiumjson-entry)
- [Build Order](#build-order)
- [Open Questions](#open-questions)

---

## Problem Statement

Paged reading is a fundamentally interactive experience. It requires:

- A fixed-height viewport container that CSS multi-column can fill
- Horizontal scroll position management mapped to logical page numbers
- A ResizeObserver to recompute page count on orientation change and
  mobile browser toolbar show/hide
- Chrome: mode toggle, font size control, progress bar, page indicator
- State persistence so the user's mode and font size survive navigation

None of this is expressible in CSS alone. `layout-prose` provides the
typographic foundation; `reader-view` wraps it with the interactive
chrome and viewport management.

---

## Four-Layer Stack

```
Layer 1 — <article> or any block of semantic HTML
           Readable without any CSS or JS.

Layer 2 — layout-prose CSS
           Measure, line-height, hyphens, font defaults.
           Readable without JS.

Layer 3 — layout-prose[data-columns] CSS
           Multi-column layout via CSS attribute selectors.
           No JS required; columns render but pages are not navigable.

Layer 4 — reader-view web component
           Viewport container, paged mode, chrome, ResizeObserver,
           scroll management, font size, persistence.
```

---

## Progressive Enhancement Contract

**Without JavaScript:**
`reader-view` renders as a block element. Its child `layout-prose`
renders as a normal scrolling article. No chrome appears. The content
is fully readable.

**Without CSS:**
The article renders as unstyled but semantically correct HTML. Headings,
paragraphs, and block elements are in document order.

**With CSS only (no JS):**
`layout-prose` reading defaults apply. If `data-columns` is present,
multi-column renders, but horizontal navigation does not work — the
user can scroll within the element but has no page controls.

**With JS:**
Full paged reading experience with chrome, page indicator, font control,
and ResizeObserver-driven recalculation.

The web component MUST NOT remove or replace the child content. It wraps
and enhances. Disconnecting the component or removing its script leaves
the content intact and readable.

---

## HTML API

### Minimal — JS provides chrome

```html
<reader-view>
  <article>
    <h1>Article Title</h1>
    <p>Content...</p>
  </article>
</reader-view>
```

JS automatically wraps the child content in `layout-prose` if one is
not already present.

### With layout-prose explicitly present

```html
<reader-view data-mode="pages" data-columns="2">
  <layout-prose data-align="justify">
    <article>
      <h1>Article Title</h1>
      <p>Content...</p>
    </article>
  </layout-prose>
</reader-view>
```

When `layout-prose` is present as a direct child, `reader-view` uses
it as-is rather than creating one. This allows explicit typographic
control from markup.

### With custom chrome slot

```html
<reader-view>
  <div slot="chrome">
    <button data-reader-action="toggle-mode">Toggle mode</button>
    <span data-reader-output="page-indicator"></span>
  </div>
  <article>...</article>
</reader-view>
```

See [Slots](#slots) for the full slotted chrome API.

---

## Data Attributes

### On `<reader-view>`

| Attribute | Values | Default | Description |
|-----------|--------|---------|-------------|
| `data-mode` | `scroll`, `pages` | `scroll` | Reading mode. Reflected from JS state. |
| `data-columns` | `auto`, `1`, `2`, `3` | `auto` | Column count in pages mode. Passed through to inner `layout-prose`. |
| `data-persist` | `true`, `false` | `true` | Whether mode and font-size are saved to `localStorage`. |
| `data-storage-key` | any string | `vb-reader-view` | `localStorage` key prefix. Override when multiple readers appear on one page. |
| `data-col-controls` | `true`, `false` | `true` | Whether the column picker renders in the chrome. |
| `data-font-controls` | `true`, `false` | `true` | Whether A−/A+ buttons render in the chrome. |

`data-mode` and `data-columns` are reflected attributes — setting them
in HTML sets the initial state; JS updates them as the user interacts,
making them inspectable in DevTools at any time.

### CSS state selectors (for external styling)

```css
/* Style something when reader is in pages mode */
reader-view[data-mode="pages"] { ... }

/* Style when two columns are active */
reader-view[data-columns="2"] { ... }
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
| `column-count` | Current column count as string |

### `data-reader-state` (component-managed, on chrome elements)

The component sets these on relevant chrome elements for CSS styling:

| Attribute | Set on | Values |
|-----------|--------|--------|
| `data-reader-state="active"` | Mode buttons, col buttons | When that option is current |
| `data-reader-state="disabled"` | Prev/next buttons | When at first/last page |

---

## Events

All events bubble and are composed (cross Shadow DOM boundaries if used
in that context, though `reader-view` uses Light DOM).

| Event | `detail` | Fired when |
|-------|----------|------------|
| `reader-mode-change` | `{ mode: 'scroll' \| 'pages' }` | Mode toggled |
| `reader-page-change` | `{ page: number, total: number }` | Page changes in pages mode |
| `reader-font-change` | `{ size: string, index: number }` | Font size changes |

```javascript
document.querySelector('reader-view')
  .addEventListener('reader-page-change', ({ detail }) => {
    console.log(`Page ${detail.page} of ${detail.total}`);
  });
```

---

## CSS Architecture

```css
@layer web-components {

  reader-view {
    display: block;
    /* No height here. reader-view is an inline container by default.
       reader-view[data-mode="pages"] enters full-viewport mode via JS
       by adding a class — see JS Architecture. */
  }

  /* ── Full-viewport shell (pages mode) ──
     Applied by JS when entering pages mode.
     position: fixed gives the definite height that height:100% children
     need to resolve against — this is the critical CSS/layout insight.
  ── */
  reader-view[data-mode="pages"] {
    position: fixed;
    inset: 0;
    z-index: var(--z-reader, 10);
    display: grid;
    grid-template-rows: auto 1fr;  /* chrome row + content row */
    background: var(--color-background);
  }

  /* ── Chrome bar ── */
  .reader-chrome {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-inline: var(--size-m);
    block-size: var(--reader-chrome-height, 3.25rem);
    background: var(--color-surface);
    border-block-end: 1px solid var(--color-border);
    gap: var(--size-s);
    flex-shrink: 0;
  }

  .reader-chrome-title {
    font-size: var(--font-size-xs);
    letter-spacing: var(--letter-spacing-wider);
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
  }

  /* ── Scroll container ── */
  .reader-scroll {
    overflow-y: auto;
    overflow-x: hidden;
    /* In pages mode this is display:none — pager takes over */
  }

  /* ── Pager container ──
     height: 100% resolves because reader-view[data-mode="pages"]
     is position:fixed, giving a definite height.
  ── */
  .reader-pager {
    display: none;   /* shown by JS in pages mode */
    width: 100%;
    height: 100%;    /* resolves against fixed parent */
    overflow-x: auto;
    overflow-y: hidden;
    background: var(--color-background);
  }

  /* ── Inner prose surface (pages mode) ──
     height: 100% resolves because .reader-pager has definite height.
     column-fill: auto fills vertically then spills horizontally.
     width: max-content grows to fit all columns (set by JS when
     multi-column is active; 100% for single column).
  ── */
  .reader-pager > layout-prose {
    height: 100%;
    column-fill: auto;
  }

  /* ── Progress bar ── */
  .reader-progress {
    position: absolute;
    inset-block-start: var(--reader-chrome-height, 3.25rem);
    inset-inline: 0;
    block-size: 2px;
    background: var(--color-interactive);
    transform-origin: left;
    transform: scaleX(var(--_progress, 0));
    transition: transform var(--motion-duration-normal) var(--motion-ease-out);
    pointer-events: none;
  }

  /* ── Page nav ── */
  .reader-page-nav {
    position: absolute;
    inset-block-end: var(--size-l);
    inset-inline-start: 50%;
    translate: -50% 0;
    display: flex;
    align-items: center;
    gap: var(--size-m);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-full);
    padding: var(--size-xs) var(--size-m);
    box-shadow: var(--shadow-m);
  }

  /* Hidden in scroll mode */
  reader-view[data-mode="scroll"] .reader-page-nav {
    display: none;
  }

  /* ── Reduced motion ── */
  @media (prefers-reduced-motion: reduce) {
    .reader-progress { transition: none; }
  }

}
```

---

## JavaScript Architecture

`reader-view` follows VB's functional-core / imperative-shell pattern.

```javascript
// src/web-components/reader-view/index.js

class ReaderView extends HTMLElement {

  // ── Private state ─────────────────────────────────────────────────

  #mode       = 'scroll';   // 'scroll' | 'pages'
  #page       = 0;          // current zero-indexed page
  #totalPages = 1;
  #sizeIdx    = 2;          // index into FONT_SIZES
  #prose      = null;       // reference to inner layout-prose
  #pager      = null;       // reference to .reader-pager
  #ro         = null;       // ResizeObserver

  static FONT_SIZES = ['0.82rem', '0.9rem', '1rem', '1.08rem', '1.16rem', '1.25rem'];

  // ── Lifecycle ─────────────────────────────────────────────────────

  connectedCallback() {
    this.#restorePersistedState();
    this.#buildChrome();
    this.#ensureProseWrapper();
    this.#bindActions();
    this.#setupResizeObserver();
    this.#applyMode(this.#mode, false);  // false = no animation on init
  }

  disconnectedCallback() {
    this.#ro?.disconnect();
  }

  // ── Chrome ────────────────────────────────────────────────────────

  #buildChrome() {
    // If slot="chrome" is present, use that instead of generating chrome.
    if (this.querySelector('[slot="chrome"]')) {
      this.#adoptSlottedChrome();
      return;
    }
    // Otherwise inject default chrome markup into Light DOM.
    // (Full implementation omitted — see build phase 2.)
  }

  // ── Prose wrapper ─────────────────────────────────────────────────

  #ensureProseWrapper() {
    // If a layout-prose is already a direct child, use it.
    this.#prose = this.querySelector(':scope > layout-prose');
    if (this.#prose) return;

    // Otherwise wrap all non-chrome children in one.
    const prose = document.createElement('layout-prose');
    const children = [...this.children].filter(
      el => !el.matches('[slot="chrome"], .reader-chrome')
    );
    children.forEach(child => prose.appendChild(child));
    this.appendChild(prose);
    this.#prose = prose;
  }

  // ── Mode switching ────────────────────────────────────────────────

  #applyMode(mode, animate = true) {
    this.#mode = mode;
    this.dataset.mode = mode;   // reflects to attribute for CSS

    const isPages = mode === 'pages';

    this.#getPager().style.display = isPages ? 'block' : 'none';
    this.#getScroller().style.display = isPages ? 'none' : '';

    if (isPages) {
      // Single column: width:100% so text wraps. Multi-column: width:max-content.
      this.#applyColumnWidth();
      requestAnimationFrame(() => {
        this.#recalcPages();
        this.#scrollToPage(0, false);
      });
    } else {
      this.#setProgress(0);
    }

    this.#updateChromeState();
    this.#persistState();
    this.#emit('reader-mode-change', { mode });
  }

  // ── Column management ─────────────────────────────────────────────

  #applyColumnWidth() {
    const cols = this.dataset.columns ?? 'auto';
    if (cols === '1' || cols === 'auto') {
      this.#prose.style.width = '100%';
    } else {
      this.#prose.style.width = 'max-content';
    }
    // Pass column value through to layout-prose
    if (cols === 'auto') {
      delete this.#prose.dataset.columns;
    } else {
      this.#prose.dataset.columns = cols;
    }
  }

  // ── Page calculation ──────────────────────────────────────────────

  #recalcPages() {
    if (this.#mode !== 'pages') return;
    const pager = this.#getPager();
    const vw = pager.clientWidth;
    const sw = this.#prose.scrollWidth;
    this.#totalPages = vw > 0 ? Math.max(1, Math.round(sw / vw)) : 1;
    this.#page = Math.min(this.#page, this.#totalPages - 1);
    this.#updateHUD();
  }

  #scrollToPage(n, smooth = true) {
    this.#page = Math.max(0, Math.min(n, this.#totalPages - 1));
    const pager = this.#getPager();
    const maxScroll = pager.scrollWidth - pager.clientWidth;
    const left = this.#totalPages > 1
      ? (this.#page / (this.#totalPages - 1)) * maxScroll
      : 0;
    pager.scrollTo({ left, behavior: smooth ? 'smooth' : 'instant' });
    this.#updateHUD();
    this.#emit('reader-page-change', {
      page: this.#page + 1,
      total: this.#totalPages
    });
  }

  // ── HUD / progress ────────────────────────────────────────────────

  #updateHUD() {
    const pct = this.#totalPages > 1
      ? this.#page / (this.#totalPages - 1)
      : 1;
    this.#setProgress(pct);
    // Update data-reader-output="page-indicator" elements
    this.querySelectorAll('[data-reader-output="page-indicator"]')
      .forEach(el => { el.textContent = `${this.#page + 1} / ${this.#totalPages}`; });
    // Update prev/next disabled state
    this.querySelectorAll('[data-reader-action="prev-page"]')
      .forEach(btn => { btn.toggleAttribute('disabled', this.#page === 0); });
    this.querySelectorAll('[data-reader-action="next-page"]')
      .forEach(btn => { btn.toggleAttribute('disabled', this.#page === this.#totalPages - 1); });
  }

  #setProgress(pct) {
    this.style.setProperty('--_progress', pct);
  }

  // ── Font size ─────────────────────────────────────────────────────

  #applyFontSize() {
    this.#prose.style.fontSize = ReaderView.FONT_SIZES[this.#sizeIdx];
    if (this.#mode === 'pages') requestAnimationFrame(() => this.#recalcPages());
    this.#emit('reader-font-change', {
      size: ReaderView.FONT_SIZES[this.#sizeIdx],
      index: this.#sizeIdx
    });
  }

  // ── Event delegation ──────────────────────────────────────────────

  #bindActions() {
    this.addEventListener('click', e => {
      const action = e.target.closest('[data-reader-action]')?.dataset.readerAction;
      if (!action) return;
      switch (action) {
        case 'toggle-mode':
          this.#applyMode(this.#mode === 'scroll' ? 'pages' : 'scroll'); break;
        case 'set-mode-scroll': this.#applyMode('scroll'); break;
        case 'set-mode-pages':  this.#applyMode('pages');  break;
        case 'font-increase':
          if (this.#sizeIdx < ReaderView.FONT_SIZES.length - 1)
            { this.#sizeIdx++; this.#applyFontSize(); } break;
        case 'font-decrease':
          if (this.#sizeIdx > 0)
            { this.#sizeIdx--; this.#applyFontSize(); } break;
        case 'set-columns':
          this.dataset.columns = e.target.closest('[data-reader-action]').dataset.readerValue;
          this.#applyColumnWidth();
          requestAnimationFrame(() => this.#recalcPages()); break;
        case 'prev-page': this.#scrollToPage(this.#page - 1); break;
        case 'next-page': this.#scrollToPage(this.#page + 1); break;
      }
    });
  }

  // ── ResizeObserver ────────────────────────────────────────────────

  #setupResizeObserver() {
    // Watch the pager element — fires on orientation change AND
    // mobile browser toolbar show/hide, which window resize misses.
    this.#ro = new ResizeObserver(() => {
      if (this.#mode === 'pages') {
        requestAnimationFrame(() => {
          this.#recalcPages();
          this.#scrollToPage(this.#page, false);
        });
      }
    });
    this.#ro.observe(this.#getPager());
  }

  // ── Keyboard & touch ──────────────────────────────────────────────
  // See dedicated section below

  // ── Persistence ───────────────────────────────────────────────────

  #persistState() {
    if (this.dataset.persist === 'false') return;
    const key = this.dataset.storageKey ?? 'vb-reader-view';
    try {
      localStorage.setItem(key, JSON.stringify({
        mode: this.#mode,
        sizeIdx: this.#sizeIdx,
        columns: this.dataset.columns ?? 'auto'
      }));
    } catch { /* storage unavailable — silent fail */ }
  }

  #restorePersistedState() {
    if (this.dataset.persist === 'false') return;
    const key = this.dataset.storageKey ?? 'vb-reader-view';
    try {
      const saved = JSON.parse(localStorage.getItem(key) ?? 'null');
      if (!saved) return;
      this.#mode    = saved.mode    ?? 'scroll';
      this.#sizeIdx = saved.sizeIdx ?? 2;
      if (saved.columns) this.dataset.columns = saved.columns;
    } catch { /* parse error — use defaults */ }
  }

  // ── Helpers ───────────────────────────────────────────────────────

  #getPager()    { return this.#pager    ??= this.querySelector('.reader-pager'); }
  #getScroller() { return this.querySelector('.reader-scroll'); }

  #emit(name, detail) {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  #updateChromeState() {
    // Set data-reader-state="active" on matching mode/col buttons.
    // (Full implementation in build phase 2.)
  }

  #adoptSlottedChrome() {
    // Wire data-reader-action and data-reader-output attributes
    // on slotted chrome content. (Full implementation in build phase 2.)
  }
}

customElements.define('reader-view', ReaderView);
```

---

## State Management

All mutable state is held in private fields. State changes follow a
strict unidirectional flow:

```
User action (click / key / touch)
  → action handler
    → state update (#mode, #page, #sizeIdx)
      → DOM update (attribute, scrollTo, style)
        → HUD update (indicator, progress)
          → event dispatch
            → persist
```

The `data-mode` attribute on the element is a reflected output of `#mode`,
not an input. External code that wants to change mode should call the
public API (or fire a delegated action click) rather than setting the
attribute directly. If attribute-driven mutation is needed in a future
phase, `observedAttributes` + `attributeChangedCallback` can be added
without breaking the internal state model.

---

## Keyboard & Touch

### Keyboard (pages mode only)

| Key | Action |
|-----|--------|
| `ArrowRight`, `Space` | Next page |
| `ArrowLeft` | Previous page |
| `ArrowDown` | Next page (for users who think vertically) |
| `ArrowUp` | Previous page |

The component adds the listener on `connectedCallback` and removes it
on `disconnectedCallback`. The listener checks `this.#mode === 'pages'`
before acting, so it is inert in scroll mode.

### Touch swipe (pages mode only)

```javascript
// Minimum swipe distance: 44px (minimum touch target size)
let tx0 = 0;
pager.addEventListener('touchstart', e => {
  tx0 = e.touches[0].clientX;
}, { passive: true });
pager.addEventListener('touchend', e => {
  const dx = tx0 - e.changedTouches[0].clientX;
  if (Math.abs(dx) > 44)
    this.#scrollToPage(this.#page + (dx > 0 ? 1 : -1));
});
```

Passive touch listeners are used throughout to avoid blocking scroll
performance.

---

## Persistence

When `data-persist` is not `false`, the component saves to `localStorage`:

```json
{
  "mode": "pages",
  "sizeIdx": 3,
  "columns": "2"
}
```

The `data-storage-key` attribute allows multiple reader instances on
one page to maintain independent state. Default key: `vb-reader-view`.

All `localStorage` access is wrapped in `try/catch` — storage can be
unavailable in private browsing, cross-origin iframes, or when storage
quota is exceeded.

---

## Accessibility

- The chrome is `<div role="toolbar">` with `aria-label="Reading controls"`.
- Mode buttons are `<button type="button">` with `aria-pressed` reflecting
  whether that mode is currently active.
- Font size buttons have `aria-label="Increase font size"` /
  `"Decrease font size"` and `aria-disabled` when at the min/max step.
- The page indicator is a `<output>` element with `aria-live="polite"` so
  screen reader users hear page changes without them being intrusive.
- In pages mode, the component adds `role="region"` and
  `aria-label="Article pages"` to the pager container.
- All animations respect `prefers-reduced-motion: reduce` — progress bar
  transition is removed; `scrollTo` uses `behavior: 'instant'`.

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
      "html": "<reader-view data-mode=\"scroll\"><article><h2>Article Title</h2><p>Long-form content in the default scrolling reading mode. Full typographic defaults from layout-prose apply automatically.</p><p>Switch to Pages mode for the paged Kindle-style experience.</p></article></reader-view>",
      "interactive": true
    },
    {
      "id": "pages",
      "name": "Pages Mode",
      "fixtureWidth": "wide",
      "html": "<reader-view data-mode=\"pages\" data-columns=\"auto\"><article><h2>Article Title</h2><p>Content flows into columns and pages. Navigate with arrow keys or the prev/next controls. Font size is adjustable. State persists across sessions.</p></article></reader-view>",
      "interactive": true
    },
    {
      "id": "custom-chrome",
      "name": "Custom Chrome",
      "html": "<reader-view>\n  <div slot=\"chrome\">\n    <button data-reader-action=\"set-mode-scroll\" data-reader-state>Scroll</button>\n    <button data-reader-action=\"set-mode-pages\" data-reader-state>Pages</button>\n    <output data-reader-output=\"page-indicator\" aria-live=\"polite\"></output>\n  </div>\n  <article><h2>Custom Chrome</h2><p>The chrome bar is fully replaced via slot. The component wires data-reader-action and data-reader-output attributes automatically.</p></article>\n</reader-view>",
      "interactive": true
    }
  ]
}
```

---

## Build Order

### Phase 1 — Scroll mode only
- `src/web-components/reader-view/index.js`
  - `connectedCallback` / `disconnectedCallback`
  - `#ensureProseWrapper` — wraps children in `layout-prose` if needed
  - `#buildChrome` — default chrome with mode toggle and title
  - Scroll mode only: no pager, no ResizeObserver, no page nav
  - `#bindActions` wired for `toggle-mode` / `set-mode-*`
- `src/web-components/reader-view/styles.css`
  - `reader-view` base block display
  - `.reader-chrome` layout
  - `.reader-scroll` overflow styles
  - `.reader-progress` bar (scroll progress only)

### Phase 2 — Pages mode
- `#applyMode('pages')` fully wired
- `.reader-pager` shown/hidden correctly
- `#recalcPages` and `#scrollToPage` with corrected scroll math
- ResizeObserver on pager element
- `#updateHUD` — page indicator, prev/next disabled state
- `data-reader-state="active"` on chrome buttons
- Keyboard navigation (`ArrowLeft`/`ArrowRight`/`Space`)
- Touch swipe on pager

### Phase 3 — Font size & column controls
- `data-font-controls` / `data-col-controls` rendering
- `#applyFontSize` with post-resize recalc
- `#applyColumnWidth` wired to `set-columns` action
- `data-columns` reflected attribute updating `layout-prose`

### Phase 4 — Persistence & slotted chrome
- `#persistState` / `#restorePersistedState`
- `data-persist` and `data-storage-key` attribute support
- `#adoptSlottedChrome` — wire `data-reader-action` and
  `data-reader-output` on externally supplied chrome elements
- `reader-mode-change`, `reader-page-change`, `reader-font-change` events

### Phase 5 — Accessibility pass
- `role="toolbar"` on chrome, `aria-label`
- `aria-pressed` on mode buttons
- `aria-disabled` on font buttons at min/max
- `<output aria-live="polite">` for page indicator
- `role="region"` + `aria-label` on pager
- `prefers-reduced-motion` — `scrollTo instant`, remove transitions

### Phase 6 — compendium.json + docs
- Add entry with all variants
- Documentation page at `docs/elements/web-components/reader-view/`
- Screenshots for scroll and pages mode fixtures

---

## Open Questions

1. **`position: fixed` side-effects** — When entering pages mode,
   `reader-view` goes `position: fixed; inset: 0` which takes it out
   of document flow and covers the page. This is correct UX but may
   conflict with fixed headers, modals, or other `position: fixed`
   elements. A `--z-reader` custom property with a documented default
   value allows operators to resolve stacking conflicts. Should VB
   provide a named z-index token for this in the token layer?

2. **`scroll-snap` as an alternative to JS page management** — CSS
   `scroll-snap-type: x mandatory` on the pager with
   `scroll-snap-align: start` on column boundaries could provide snap
   behaviour without JS scroll management. The problem: there is no
   reliable way to snap to column boundaries without injecting sentinel
   elements between each column, which requires knowledge of column
   heights. JS `scrollTo` with `behavior: 'smooth'` is more reliable
   for now. Worth revisiting as browsers improve.

3. **Title source** — The default chrome bar shows the article title.
   The component needs to find this. Candidates: `<h1>` inside the
   article, `<title>` element, `data-reader-title` attribute on the
   component. `data-reader-title` is explicit and avoids DOM traversal
   brittleness. Should fall back to `document.title`.

4. **Multiple instances per page** — Two `reader-view` elements on one
   page will both go `position: fixed; inset: 0` in pages mode. This is
   probably wrong UX. Should the component prevent entering pages mode
   if another instance is already active? A module-level Set tracking
   active paged instances would handle this.

5. **`column-fill: auto` ownership** — As noted in `LAYOUT-PROSE-SPEC.md`,
   `layout-prose` defaults to `column-fill: balance`. `reader-view` needs
   `column-fill: auto` on its inner prose when in pages mode. Current
   approach: `reader-view` sets this inline via JS on the `layout-prose`
   element. A CSS-only alternative is a descendant rule:
   `.reader-pager > layout-prose { column-fill: auto }`.
   The CSS approach is cleaner. Confirm this doesn't require a specificity
   bump above the `layout-prose` defaults in `@layer custom-elements`.
