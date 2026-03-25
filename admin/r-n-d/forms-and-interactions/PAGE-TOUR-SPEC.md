---
title: Page Tour & Orientation System
description: Specification for an in-page guided tour web component following Vanilla Breeze progressive enhancement principles
status: draft
version: 0.1.0
date: 2026-03-24
tags:
  - web-component
  - progressive-enhancement
  - ux
  - accessibility
cross-references:
  - BUNDLE-SYSTEM.md
  - overview.md
  - web-components/tooltip-wc
  - web-components/page-toc
---

# Page Tour & Orientation System

A guided orientation mechanism that highlights page elements sequentially, explains
them to the user, and optionally requires interaction before advancing. Follows the
Vanilla Breeze four-layer progressive enhancement stack — the tour content is
readable and useful without CSS or JavaScript.

---

## Table of Contents

- [Problem Statement](#problem-statement)
- [Architecture Overview](#architecture-overview)
- [Layer 1 — HTML Structure](#layer-1--html-structure)
- [Layer 2 — CSS Styling](#layer-2--css-styling)
- [Layer 3 — Enhanced Static Structure](#layer-3--enhanced-static-structure)
- [Layer 4 — Web Component](#layer-4--web-component)
- [Tour Modes](#tour-modes)
- [Data Attribute API](#data-attribute-api)
- [JavaScript API](#javascript-api)
- [Events](#events)
- [CSS Tokens & Custom Properties](#css-tokens--custom-properties)
- [Accessibility](#accessibility)
- [Positioning Strategy](#positioning-strategy)
- [State Persistence](#state-persistence)
- [compendium.json Entry](#compendiumjson-entry)
- [Phased Build Order](#phased-build-order)
- [Open Questions](#open-questions)

---

## Problem Statement

Users arriving at unfamiliar interfaces — dashboards, admin panels, complex docs
sites, onboarding flows — need orientation. The standard solution is a JavaScript
tour library (Shepherd, Intro.js, Driver.js) that adds a runtime dependency, has no
no-JS story, and typically authors tour steps entirely in JS config objects — content
that is invisible to search engines, screen readers without JS, and users with
reduced-motion or low-bandwidth constraints.

Vanilla Breeze can do better:

- Tour step **content lives in HTML** — readable as an in-page guide if JS fails
- **CSS-only** mode shows a styled step list without interaction
- **JS enhancement** adds the spotlight overlay, popover card, and focus management
- **Zero production dependencies** — positioning via CSS Anchor Positioning API

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 1 — HTML                                                 │
│  <page-tour> wrapping <tour-step> elements. Steps render as     │
│  a plain ordered list with headings, descriptions, and anchor   │
│  links to the targeted elements. Fully readable without CSS/JS. │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 2 — CSS                                                  │
│  Steps styled as a contained guide card. Trigger button shown.  │
│  No interactivity — the list remains in document flow.          │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 3 — ENHANCED STATIC STRUCTURE (no JS required for this)  │
│  <details>/<summary> pattern to collapse the step list behind   │
│  a disclosure widget. Acceptable without the web component.     │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 4 — WEB COMPONENT (<page-tour>)                          │
│  Spotlight overlay, positioned popover card via CSS Anchor      │
│  Positioning API, step sequencing, keyboard nav, focus trap,    │
│  action-gating, aria-live announcements, progress persistence.  │
└─────────────────────────────────────────────────────────────────┘
```

### Degradation contract

| Environment              | Experience                                           |
|--------------------------|------------------------------------------------------|
| No CSS, no JS            | Ordered list of steps with headings and anchor links |
| CSS, no JS               | Styled guide card; `<details>` collapses the list    |
| JS, no CSS               | Tour logic works; spotlight may be unstyled          |
| Full (CSS + JS)          | Interactive overlay tour with spotlight and popover  |
| `prefers-reduced-motion` | Transitions disabled; spotlight jumps instantly      |

---

## Layer 1 — HTML Structure

The minimal, dependency-free markup. This is what must work without any enhancement.

```html
<page-tour
  data-title="Getting Started"
  data-trigger="auto"
  data-persist="session"
>
  <tour-step data-target="#site-header">
    <h3>Header & Navigation</h3>
    <p>
      The header contains the main navigation. Use it to move between sections.
      <a href="#site-header">Jump to header</a>
    </p>
  </tour-step>

  <tour-step data-target="#search-input">
    <h3>Search</h3>
    <p>
      Search across all content from here.
      <a href="#search-input">Jump to search</a>
    </p>
  </tour-step>

  <tour-step
    data-target="#theme-picker"
    data-action="click"
    data-placement="bottom"
  >
    <h3>Theme Picker</h3>
    <p>
      Click the theme picker to change the visual style of the site.
      Try it now — the tour will continue once you do.
      <a href="#theme-picker">Jump to theme picker</a>
    </p>
  </tour-step>
</page-tour>
```

### Structural rules

- `<page-tour>` is the host element. It is always present in the source HTML.
- `<tour-step>` children contain the step content authored as standard HTML.
- Each `<tour-step>` **must** contain a heading (`<h3>` by default, configurable).
- The anchor link inside each step (`<a href="#target">`) provides a no-JS navigation path.
- `<page-tour>` renders its children as an `<ol>` when the web component is not defined.
  The fallback is achieved with CSS on the undefined element selector.

### Fallback rendering (no JS, `page-tour` not defined)

```css
/* In the custom-elements layer */
page-tour:not(:defined) {
  display: block;
}

page-tour:not(:defined) tour-step {
  display: block;
  /* Styled as a bordered step card in Layer 2 */
}
```

---

## Layer 2 — CSS Styling

Located in `src/web-components/page-tour/page-tour.css`.

### No-JS presentation

When `page-tour` is not defined (no JS or custom elements not registered), the
steps render as stacked cards in document flow — an in-page "Start Here" guide.

```css
@layer web-components {
  /* Undefined element fallback */
  page-tour:not(:defined) {
    display: block;
    border: var(--border-width-thin) solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--size-m);
    background: var(--color-surface-raised);
    max-width: var(--measure-narrow);
  }

  page-tour:not(:defined)::before {
    content: attr(data-title);
    display: block;
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    margin-block-end: var(--size-s);
  }

  tour-step:not(:defined) {
    display: block;
    padding: var(--size-s);
    border-block-start: var(--border-width-thin) solid var(--color-border);
    counter-increment: tour-step;
  }

  tour-step:not(:defined)::before {
    content: counter(tour-step) ". ";
    font-weight: var(--font-weight-semibold);
    color: var(--color-primary);
  }

  page-tour:not(:defined) {
    counter-reset: tour-step;
  }
}
```

### Active tour overlay

```css
@layer web-components {
  /* Backdrop/overlay when tour is active */
  [data-tour-active] .page-tour-backdrop {
    position: fixed;
    inset: 0;
    background: oklch(0% 0 0 / 0.5);
    z-index: var(--z-overlay);
    transition: opacity var(--duration-normal) var(--ease-out);
  }

  /* Spotlight "hole" cut around the target element */
  .page-tour-spotlight {
    position: fixed;
    z-index: calc(var(--z-overlay) + 1);
    pointer-events: none;
    border-radius: var(--radius-m);
    box-shadow:
      0 0 0 4px var(--color-primary),
      0 0 0 9999px oklch(0% 0 0 / 0.5);
    transition:
      top var(--duration-normal) var(--ease-out),
      left var(--duration-normal) var(--ease-out),
      width var(--duration-normal) var(--ease-out),
      height var(--duration-normal) var(--ease-out);
  }

  @media (prefers-reduced-motion: reduce) {
    .page-tour-spotlight {
      transition: none;
    }
  }

  /* Tour popover card */
  .page-tour-card {
    position: fixed;
    z-index: calc(var(--z-overlay) + 2);
    background: var(--color-surface);
    border: var(--border-width-thin) solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--size-m);
    box-shadow: var(--shadow-lg);
    max-width: 22rem;
    min-width: 16rem;

    /* CSS Anchor Positioning — target set by JS */
    position-try-fallbacks: flip-block, flip-inline, flip-block flip-inline;
  }

  .page-tour-card[popover] {
    margin: 0; /* Reset UA popover margin */
  }

  /* Progress indicator */
  .page-tour-progress {
    display: flex;
    gap: var(--size-2xs);
    align-items: center;
    margin-block-end: var(--size-s);
  }

  .page-tour-pip {
    width: var(--size-2xs);
    height: var(--size-2xs);
    border-radius: var(--radius-full);
    background: var(--color-border);
    transition: background var(--duration-fast) var(--ease-out);
  }

  .page-tour-pip[data-active] {
    background: var(--color-primary);
    width: var(--size-s);
  }

  /* Action-gated next button — disabled until action completes */
  .page-tour-next[data-waiting] {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Action hint shown inside step when waiting for interaction */
  .page-tour-action-hint {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin-block-start: var(--size-xs);
    display: flex;
    align-items: center;
    gap: var(--size-2xs);
  }

  .page-tour-action-hint::before {
    content: "→";
    color: var(--color-primary);
  }
}
```

---

## Layer 3 — Enhanced Static Structure

The `<details>`/`<summary>` pattern collapses the step list behind a toggle — usable
without the web component JS. This is the Layer 3 "enhanced static HTML" in the
four-layer stack.

Authors can include this structure, and the web component will either use it as a
scaffold or replace it when active.

```html
<page-tour data-title="Getting Started" data-trigger="manual">
  <details class="page-tour-guide" open>
    <summary class="page-tour-summary">
      <span>Getting Started Tour</span>
      <span class="page-tour-count">3 steps</span>
    </summary>
    <ol class="page-tour-list">
      <li>
        <tour-step data-target="#site-header">
          <h3>Header & Navigation</h3>
          <p>The header contains the main navigation...</p>
          <a href="#site-header">Jump to header ↓</a>
        </tour-step>
      </li>
      <!-- more steps -->
    </ol>
    <button class="page-tour-start-btn" type="button">
      Start Tour
    </button>
  </details>
</page-tour>
```

The `<details>` layer works independently: users can read steps and follow anchor
links with no JS. The web component enhances this into the interactive overlay
experience.

---

## Layer 4 — Web Component

### File location

```
src/web-components/page-tour/
  page-tour.css     # Styles (imported in web-components layer)
  page-tour.js      # Component class
  tour-step.js      # Child element class (lightweight)
  index.js          # Barrel — exports both, registers both
```

### Class structure

```javascript
/**
 * @element page-tour
 * @attr {string} data-title - Tour name, shown in card header
 * @attr {'auto'|'manual'|'button'} data-trigger - How tour starts
 * @attr {'passive'|'active'|'forced'} data-mode - Interaction mode
 * @attr {'none'|'session'|'local'} data-persist - Progress persistence
 * @attr {string} data-persist-key - Storage key (defaults to page path)
 * @attr {number} data-step - Current step index (0-based), reflects state
 * @fires tour:start
 * @fires tour:step
 * @fires tour:action
 * @fires tour:complete
 * @fires tour:skip
 */
class PageTour extends HTMLElement {
  #steps = [];
  #currentStep = 0;
  #active = false;
  #backdrop = null;
  #spotlight = null;
  #card = null;
  #resizeObserver = null;
  #intersectionObserver = null;
  #actionController = null; // AbortController for step action listener

  static observedAttributes = ['data-step'];

  connectedCallback() { /* ... */ }
  disconnectedCallback() { /* ... */ }
  attributeChangedCallback(name, old, next) { /* ... */ }

  // Public API
  start(stepIndex = 0) { /* ... */ }
  stop() { /* ... */ }
  next() { /* ... */ }
  prev() { /* ... */ }
  goto(index) { /* ... */ }
  skip() { /* ... */ }

  // Private
  #buildOverlay() { /* ... */ }
  #positionSpotlight(target) { /* ... */ }
  #positionCard(target, placement) { /* ... */ }
  #gateOnAction(step) { /* ... */ }
  #announce(text) { /* ... */ }
  #persist() { /* ... */ }
  #restore() { /* returns saved step index or 0 */ }
  #dispatch(name, detail) { /* ... */ }
}
```

```javascript
/**
 * @element tour-step
 * @attr {string} data-target - CSS selector for the element to highlight
 * @attr {'top'|'bottom'|'left'|'right'|'auto'} data-placement - Popover placement
 * @attr {'none'|'click'|'focus'|'input'|'custom'} data-action - Required action
 * @attr {string} data-action-hint - Text shown while waiting for action
 * @attr {boolean} data-skippable - false to prevent skipping this step
 */
class TourStep extends HTMLElement {
  // Passive element — exposes getters for parent component
  get target() { return this.dataset.target; }
  get placement() { return this.dataset.placement ?? 'auto'; }
  get action() { return this.dataset.action ?? 'none'; }
  get actionHint() { return this.dataset.actionHint ?? null; }
  get skippable() { return this.dataset.skippable !== 'false'; }
}
```

### Overlay construction

The web component constructs three DOM nodes when `start()` is called and removes
them on `stop()`. They are appended to `<body>` to ensure correct stacking context.

```javascript
#buildOverlay() {
  // 1. Backdrop (click to skip, if skippable)
  this.#backdrop = document.createElement('div');
  this.#backdrop.className = 'page-tour-backdrop';
  this.#backdrop.setAttribute('aria-hidden', 'true');

  // 2. Spotlight box — animated rect that tracks the target
  this.#spotlight = document.createElement('div');
  this.#spotlight.className = 'page-tour-spotlight';
  this.#spotlight.setAttribute('aria-hidden', 'true');

  // 3. Popover card — uses native Popover API
  this.#card = document.createElement('div');
  this.#card.className = 'page-tour-card';
  this.#card.setAttribute('popover', 'manual');
  this.#card.setAttribute('role', 'dialog');
  this.#card.setAttribute('aria-modal', 'true');
  this.#card.setAttribute('aria-label', this.dataset.title ?? 'Page Tour');

  document.body.append(this.#backdrop, this.#spotlight, this.#card);
  this.#card.showPopover();
}
```

### Positioning via CSS Anchor Positioning API

CSS Anchor Positioning (`anchor-name`, `position-anchor`, `anchor()`) is used to
attach the card to the highlighted target. This is the native approach — no
third-party positioning library required.

```javascript
#positionCard(targetEl, placement) {
  // Give the target a unique anchor name for this tour step
  const anchorName = '--tour-target';
  targetEl.style.anchorName = anchorName;

  this.#card.style.positionAnchor = anchorName;

  const placements = {
    bottom: { top: 'anchor(bottom)', left: 'anchor(left)' },
    top:    { bottom: 'anchor(top)', left: 'anchor(left)' },
    right:  { top: 'anchor(top)', left: 'anchor(right)' },
    left:   { top: 'anchor(top)', right: 'anchor(left)' },
  };

  const pos = placements[placement] ?? placements.bottom;
  Object.assign(this.#card.style, {
    top: pos.top ?? 'auto',
    bottom: pos.bottom ?? 'auto',
    left: pos.left ?? 'auto',
    right: pos.right ?? 'auto',
  });
}
```

> **Fallback for browsers without CSS Anchor Positioning:** Use
> `getBoundingClientRect()` + `position: fixed` with computed pixel values.
> Feature-detect with `CSS.supports('anchor-name', '--x')`. See
> [Open Questions](#open-questions).

### Spotlight positioning

```javascript
#positionSpotlight(targetEl) {
  const padding = 8; // px breathing room
  const rect = targetEl.getBoundingClientRect();
  Object.assign(this.#spotlight.style, {
    top:    `${rect.top - padding}px`,
    left:   `${rect.left - padding}px`,
    width:  `${rect.width + padding * 2}px`,
    height: `${rect.height + padding * 2}px`,
  });
}
```

A `ResizeObserver` on the target element and a scroll listener on `window` keep the
spotlight in sync if layout shifts occur during the tour.

### Card inner structure (generated)

```javascript
#renderCard(step, index) {
  const total = this.#steps.length;
  const isLast = index === total - 1;
  const isFirst = index === 0;
  const mode = this.dataset.mode ?? 'passive';
  const skippable = mode !== 'forced';

  this.#card.innerHTML = /* html */`
    <div class="page-tour-progress" aria-hidden="true">
      ${this.#steps.map((_, i) => `
        <span class="page-tour-pip" ${i === index ? 'data-active' : ''}></span>
      `).join('')}
    </div>
    <p class="page-tour-meta">
      <span class="page-tour-step-count">Step ${index + 1} of ${total}</span>
    </p>
    <div class="page-tour-content">
      ${step.innerHTML}
    </div>
    ${step.action !== 'none' && step.actionHint ? `
      <p class="page-tour-action-hint">${step.actionHint}</p>
    ` : ''}
    <footer class="page-tour-footer">
      ${skippable ? `
        <button type="button" class="page-tour-skip ghost" data-action="skip">
          ${isLast ? 'Close' : 'Skip tour'}
        </button>
      ` : ''}
      <div class="page-tour-nav">
        ${!isFirst ? `
          <button type="button" class="page-tour-prev secondary" data-action="prev">
            Previous
          </button>
        ` : ''}
        <button
          type="button"
          class="page-tour-next"
          data-action="next"
          ${step.action !== 'none' ? 'data-waiting' : ''}
        >
          ${isLast ? 'Finish' : 'Next'}
        </button>
      </div>
    </footer>
  `;
}
```

### Step navigation and focus management

On each step transition:

1. Remove `anchorName` from the previous target element.
2. Call `#positionSpotlight(newTarget)` and `#positionCard(newTarget, placement)`.
3. Scroll the target into view if not visible: `newTarget.scrollIntoView({ block: 'nearest', behavior: 'smooth' })`.
4. Move focus to the card's heading or the "Next" button.
5. If `data-action` is set, call `#gateOnAction(step)`.
6. Update `data-step` attribute to reflect current index.
7. Dispatch `tour:step` event.

### Action gating

```javascript
#gateOnAction(step) {
  const targetEl = document.querySelector(step.target);
  const nextBtn = this.#card.querySelector('[data-action="next"]');
  const ac = new AbortController();
  this.#actionController = ac;

  const actionMap = {
    click:  'click',
    focus:  'focus',
    input:  'input',
    change: 'change',
  };

  const eventName = actionMap[step.action];
  if (!eventName) return; // 'custom' — author dispatches tour:action manually

  targetEl.addEventListener(eventName, () => {
    nextBtn.removeAttribute('data-waiting');
    nextBtn.focus();
    this.#dispatch('tour:action', { step: this.#currentStep, action: step.action });
    ac.abort();
  }, { signal: ac.signal, once: true });
}
```

For `data-action="custom"`, the author fires `tourEl.dispatchEvent(new Event('tour:action'))` from their own code.

### Keyboard navigation

| Key        | Behaviour                                            |
|------------|------------------------------------------------------|
| `Escape`   | Skip tour (if skippable); no-op if forced mode       |
| `Tab`      | Focus cycles within the card (focus trap)            |
| `→` / `↓` | Next step (if Next is not waiting)                   |
| `←` / `↑` | Previous step                                        |
| `End`      | Jump to last step                                    |
| `Home`     | Jump to first step                                   |

### Auto-trigger logic

```javascript
// data-trigger="auto" — starts after a short delay on connectedCallback
if (this.dataset.trigger === 'auto') {
  const savedStep = this.#restore();
  if (savedStep === null || savedStep < this.#steps.length) {
    setTimeout(() => this.start(savedStep ?? 0), 400);
  }
}
```

---

## Tour Modes

Set via `data-mode` on `<page-tour>`.

| Mode      | Skip allowed | Action gate | Use case                                   |
|-----------|:------------:|:-----------:|--------------------------------------------|
| `passive` | ✓            | Optional    | Informational tours, docs sites            |
| `active`  | ✓            | Required    | Onboarding that validates user can do task |
| `forced`  | ✗            | Required    | Compliance flows, mandatory training       |

In `forced` mode:
- The `data-skippable` attribute on individual steps is ignored.
- `Escape` key is a no-op.
- Clicking the backdrop is a no-op.
- The "Skip tour" button is not rendered.

---

## Data Attribute API

### `<page-tour>` attributes

| Attribute          | Type                            | Default     | Description                                 |
|--------------------|---------------------------------|-------------|---------------------------------------------|
| `data-title`       | `string`                        | `"Tour"`    | Tour name for aria-label and heading        |
| `data-trigger`     | `auto \| manual \| button`      | `manual`    | How the tour is initiated                   |
| `data-mode`        | `passive \| active \| forced`   | `passive`   | Skip and action-gate behaviour              |
| `data-persist`     | `none \| session \| local`      | `session`   | Where to store progress                     |
| `data-persist-key` | `string`                        | page path   | Storage key override                        |
| `data-step`        | `number` (reflects state)       | `0`         | Current step index; set by component        |
| `data-active`      | boolean (reflects state)        | absent      | Present while tour is running               |
| `data-complete`    | boolean (reflects state)        | absent      | Present after tour finishes or is skipped   |
| `data-spotlight-padding` | `number`                  | `8`         | px padding around the spotlight rect        |

### `<tour-step>` attributes

| Attribute           | Type                                          | Default       | Description                              |
|---------------------|-----------------------------------------------|---------------|------------------------------------------|
| `data-target`       | CSS selector                                  | **required**  | Element to highlight                     |
| `data-placement`    | `top \| bottom \| left \| right \| auto`      | `auto`        | Preferred card placement                 |
| `data-action`       | `none \| click \| focus \| input \| custom`   | `none`        | Required user action before Next         |
| `data-action-hint`  | `string`                                      | —             | Instructional text shown while waiting   |
| `data-skippable`    | `true \| false`                               | `true`        | Whether this step can be skipped         |
| `data-scroll`       | `auto \| smooth \| none`                      | `smooth`      | Scroll-into-view behaviour               |

---

## JavaScript API

All methods are on the `<page-tour>` element instance.

```javascript
const tour = document.querySelector('page-tour');

// Start the tour, optionally at a given step
tour.start(0);

// Navigate
tour.next();
tour.prev();
tour.goto(2); // 0-based index

// End the tour
tour.skip();  // Marks as skipped, fires tour:skip
tour.stop();  // Stops silently, no event
```

### Programmatic step completion (for `data-action="custom"`)

```javascript
// Author signals that the required action has been performed
document.querySelector('page-tour').dispatchEvent(
  new CustomEvent('tour:action', { bubbles: false })
);
```

---

## Events

All events bubble and are cancelable unless noted.

| Event           | Detail                                         | Notes                                  |
|-----------------|------------------------------------------------|----------------------------------------|
| `tour:start`    | `{ step: 0 }`                                  | Fired once when tour begins            |
| `tour:step`     | `{ step: n, target: el, direction: 'next'|'prev' }` | Fired on each step change         |
| `tour:action`   | `{ step: n, action: 'click'|... }`             | Fired when required action completes   |
| `tour:complete` | `{ steps: n }`                                 | Fired when last step is finished       |
| `tour:skip`     | `{ step: n }`                                  | Fired when user skips; not cancelable  |

```javascript
document.querySelector('page-tour').addEventListener('tour:complete', (e) => {
  analytics.track('tour_completed', { steps: e.detail.steps });
});
```

---

## CSS Tokens & Custom Properties

The component exposes custom properties for theming without overriding internals.

| Property                        | Default                        | Purpose                           |
|---------------------------------|--------------------------------|-----------------------------------|
| `--tour-backdrop-color`         | `oklch(0% 0 0 / 0.5)`         | Overlay background color          |
| `--tour-spotlight-ring`         | `var(--color-primary)`        | Spotlight outline color           |
| `--tour-spotlight-padding`      | `8px`                          | Space around highlighted element  |
| `--tour-spotlight-radius`       | `var(--radius-m)`             | Spotlight corner radius           |
| `--tour-card-max-width`         | `22rem`                        | Maximum card width                |
| `--tour-card-min-width`         | `16rem`                        | Minimum card width                |
| `--tour-card-offset`            | `var(--size-s)`               | Gap between spotlight and card    |
| `--tour-transition-duration`    | `var(--duration-normal)`      | Spotlight/card move animation     |
| `--tour-z-index`                | `var(--z-overlay)`            | Base z-index for overlay layers   |
| `--tour-pip-size`               | `var(--size-2xs)`             | Progress indicator pip size       |
| `--tour-pip-active-width`       | `var(--size-s)`               | Active pip elongated width        |

---

## Accessibility

### ARIA structure

The popover card uses `role="dialog"` with `aria-modal="true"` and an `aria-label`
from `data-title`. The step content is rendered inside the dialog.

A visually-hidden `aria-live="polite"` region announces step transitions to screen
readers without moving focus unexpectedly:

```html
<!-- Appended to body by the component; aria-hidden except for announcements -->
<div aria-live="polite" aria-atomic="true" class="sr-only" id="page-tour-announcer"></div>
```

On each step: `announcer.textContent = `Step ${n} of ${total}: ${stepHeading}`;`

### Focus management

1. On `start()`: save `document.activeElement` as `#returnFocus`.
2. On each step: focus the card's first heading element.
3. Focus is trapped within the card (Tab/Shift+Tab cycle through card focusables only).
4. On `stop()` / `skip()` / `complete()`: restore focus to `#returnFocus`.

### `inert` attribute

The component does **not** apply `inert` to the document body — this would prevent
users from interacting with `data-action` targets. Instead, the focus trap is
implemented manually via keydown interception on the card.

### Reduced motion

When `prefers-reduced-motion: reduce`:
- Spotlight transitions are disabled (`transition: none`).
- The card appears without animation.
- Scroll behaviour changes from `smooth` to `instant`.

### Colour contrast

The spotlight ring (`--tour-spotlight-ring`) defaults to `--color-primary`, which
meets WCAG AA against the darkened backdrop by design. The card uses standard
surface/text tokens.

---

## Positioning Strategy

### Primary: CSS Anchor Positioning API

CSS Anchor Positioning (`anchor-name`, `position-anchor`, `anchor()`, `position-try-fallbacks`)
is the preferred mechanism. It is supported in Chrome 125+, Edge 125+, Safari 18+,
Firefox 132+.

Advantages over JS positioning:
- No layout thrash — browser handles geometry
- Automatic `position-try-fallbacks` for viewport edge cases
- Works across scroll containers

### Fallback: `getBoundingClientRect()` + `position: fixed`

Feature detected at component init:

```javascript
const supportsAnchorPositioning = CSS.supports('anchor-name', '--x');

if (!supportsAnchorPositioning) {
  this.#useRectPositioning = true;
}
```

In rect mode, the component calculates pixel positions from `getBoundingClientRect()`
and applies them as inline styles on the card. A `ResizeObserver` on `document.body`
and a scroll listener re-calculate on every layout change.

---

## State Persistence

Progress is stored so users do not restart a tour after a page reload.

| `data-persist` value | Storage              | Key                                    |
|----------------------|----------------------|----------------------------------------|
| `none`               | No storage           | —                                      |
| `session`            | `sessionStorage`     | `vb-tour-{data-persist-key}`           |
| `local`              | `localStorage`       | `vb-tour-{data-persist-key}`           |

Default key is `window.location.pathname`.

Stored value:

```json
{ "step": 2, "complete": false, "skipped": false }
```

On `start()`:
- If stored `complete: true` or `skipped: true` and `data-trigger="auto"`, the tour
  does not auto-start.
- If stored `step: n`, `start(n)` is called to resume.

To reset a tour programmatically:

```javascript
tour.reset(); // Clears storage, sets data-step="0", removes data-complete/data-skipped
```

---

## compendium.json Entry

```json
{
  "id": "page-tour",
  "type": "web-component",
  "element": "page-tour",
  "childElements": ["tour-step"],
  "category": "navigation",
  "description": "Progressive-enhancement guided tour. Renders as an in-page step list without JS; enhances to an interactive spotlight overlay with the web component.",
  "layer": "web-components",
  "files": {
    "css": "src/web-components/page-tour/page-tour.css",
    "js": "src/web-components/page-tour/index.js"
  },
  "dataAttributes": {
    "page-tour": [
      "data-title", "data-trigger", "data-mode", "data-persist",
      "data-persist-key", "data-step", "data-active", "data-complete"
    ],
    "tour-step": [
      "data-target", "data-placement", "data-action", "data-action-hint",
      "data-skippable", "data-scroll"
    ]
  },
  "events": ["tour:start", "tour:step", "tour:action", "tour:complete", "tour:skip"],
  "cssProperties": [
    "--tour-backdrop-color", "--tour-spotlight-ring", "--tour-spotlight-padding",
    "--tour-card-max-width", "--tour-transition-duration"
  ],
  "a11y": {
    "roles": ["dialog"],
    "ariaAttributes": ["aria-modal", "aria-label", "aria-live"],
    "keyboard": ["Tab", "Escape", "ArrowRight", "ArrowLeft", "Home", "End"]
  },
  "peerDependencies": [],
  "status": "planned"
}
```

---

## Phased Build Order

### Phase 1 — Structure & CSS (no JS)

- [ ] Define `<tour-step>` as a custom element with no JS (CSS-only custom element)
- [ ] Write `:not(:defined)` fallback styles for both elements
- [ ] Style the static step list (in-page guide card)
- [ ] Style the `<details>` Layer 3 pattern
- [ ] Write the start-button variant (Layer 3 static HTML)
- [ ] Add tokens to CSS layer

### Phase 2 — Web Component: Core

- [ ] Implement `TourStep` class with attribute getters
- [ ] Implement `PageTour.connectedCallback()` — discover `<tour-step>` children
- [ ] Implement `start()` / `stop()` / overlay construction
- [ ] Implement spotlight rect positioning (fallback, no anchor positioning yet)
- [ ] Implement card render with static content
- [ ] Implement `next()` / `prev()` / `goto()`
- [ ] Implement focus trap and keyboard navigation
- [ ] Implement `aria-live` announcer

### Phase 3 — Advanced Behaviour

- [ ] Add CSS Anchor Positioning with rect fallback detection
- [ ] Implement `#gateOnAction()` for `click`, `focus`, `input`, `custom`
- [ ] Implement `data-mode="forced"` (no skip)
- [ ] Implement `data-trigger="auto"` with delay
- [ ] Implement `data-trigger="button"` (external button wires to `tour.start()`)
- [ ] Implement state persistence (`sessionStorage` / `localStorage`)
- [ ] Implement `reset()` method

### Phase 4 — Polish & Docs

- [ ] Add `prefers-reduced-motion` handling
- [ ] Add `ResizeObserver` + scroll listener for live spotlight sync
- [ ] Add `tour:*` events throughout
- [ ] Write docs page with live demo
- [ ] Add `compendium.json` entry
- [ ] Add four example variants to docs:
  - Passive tour (informational)
  - Active tour (action-gated)
  - Forced tour (no skip)
  - Manual trigger (button-initiated)

---

## Open Questions

1. **CSS Anchor Positioning browser support floor.** Firefox 132+ support landed
   late 2024. Should the fallback rect-based positioning be the default and anchor
   positioning be the progressive enhancement? Or is 2025+ browser support
   sufficient to make anchor positioning the primary path?

2. **`<tour-step>` as a named slot vs. child element query.** The current design
   uses `querySelectorAll('tour-step')` inside the parent. An alternative is Light
   DOM named slots if `<page-tour>` uses Shadow DOM — but that conflicts with VB's
   Light DOM preference for token cascade. Child query is the correct choice;
   documenting the rationale here.

3. **Multi-page tours.** A tour step could target an element on a *different page*
   (`data-target-href="/settings" data-target="#save-btn"`). The component would
   navigate to the page and resume at the correct step via storage. This is out of
   scope for Phase 1 but the storage schema supports it with a `page` field.

4. **`data-trigger="button"` wiring.** Options: (a) `data-tour="tour-id"` on any
   button triggers the named tour; (b) authors call `tour.start()` directly. Option
   (a) is more declarative and on-brand. Needs a selector strategy if multiple tours
   exist on a page.

5. **Multiple tours per page.** The spec does not prevent this — each `<page-tour>`
   element is independent. However, two active tours simultaneously would conflict
   on the backdrop and z-index. A singleton pattern or document-level mutex may
   be needed.

6. **Spotlight shape variants.** The current design uses a rectangular `box-shadow`
   spotlight. Some tour libraries use a SVG mask or `clip-path` for a circular or
   custom-shaped spotlight. Worth offering `data-spotlight="rect|circle|none"` on
   `<tour-step>`.

7. **`data-action="custom"` discoverability.** Authors must dispatch `tour:action`
   manually. Consider whether a `data-action-selector` + `data-action-event` pair
   is more declarative and better for the no-JS authoring story.
