import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

/**
 * page-tour: Progressive-enhancement guided page tour
 *
 * Renders as an in-page step list without JS; enhances to an
 * interactive spotlight overlay with the web component.
 *
 * @element page-tour
 * @attr {string} data-title - Tour name for the card's accessible name (default "Page Tour")
 * @attr {'auto'|'manual'|'button'} data-trigger - How tour starts
 * @attr {'passive'|'active'|'forced'} data-mode - Skip behaviour (forced = no skipping)
 * @attr {'none'|'session'|'local'} data-persist - Progress persistence
 * @attr {string} data-persist-key - Storage key (defaults to page path)
 * @attr {number} data-step - Current step index (0-based), reflects state
 * @attr {number} data-spotlight-padding - px padding around the spotlight (overrides --tour-spotlight-padding)
 * @attr {string} data-label-step - Step counter template; {n} and {total} are replaced (default "Step {n} of {total}")
 * @attr {string} data-label-skip - Skip button text (default "Skip tour")
 * @attr {string} data-label-close - Skip button text on the last step (default "Close")
 * @attr {string} data-label-prev - Previous button text (default "Previous")
 * @attr {string} data-label-next - Next button text (default "Next")
 * @attr {string} data-label-finish - Next button text on the last step (default "Finish")
 * @attr {string} data-label-nav - Accessible name of the card's button group (default "Tour navigation")
 * @attr {string} data-label-ready - Announced when a required action completes (default "Done. Next is available.")
 * @fires tour:start
 * @fires tour:step
 * @fires tour:action
 * @fires tour:complete
 * @fires tour:skip
 *
 * @example Passive informational tour
 * <page-tour data-title="Getting Started" data-trigger="auto">
 *   <tour-step data-target="#header">
 *     <h3>Header</h3>
 *     <p>The main navigation lives here.</p>
 *   </tour-step>
 * </page-tour>
 */

// Feature detection (module-level, evaluated once)
const supportsAnchor = CSS.supports('anchor-name', '--x') && CSS.supports('position-area', 'bottom');
const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const ANCHOR_NAME = '--tour-target';
const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
const EDITABLE = 'input, textarea, select, [contenteditable]:not([contenteditable="false"])';

/** @type {Record<string, string>} */
const DEFAULT_LABELS = {
  title: 'Page Tour',
  step: 'Step {n} of {total}',
  skip: 'Skip tour',
  close: 'Close',
  prev: 'Previous',
  next: 'Next',
  finish: 'Finish',
  nav: 'Tour navigation',
  ready: 'Done. Next is available.',
};

let uid = 0;

/**
 * @element tour-step
 * Passive data element — exposes getters for the parent component.
 */
class TourStep extends HTMLElement {
  get target() { return this.dataset.target ?? ''; }
  get placement() { return this.dataset.placement ?? 'auto'; }
  get action() { return this.dataset.action ?? 'none'; }
  get actionHint() { return this.dataset.actionHint ?? null; }
  get skippable() { return this.dataset.skippable !== 'false'; }
  get scrollBehavior() { return this.dataset.scroll ?? 'smooth'; }
}

/**
 * Resolve a step's target, tolerating invalid selectors.
 * @param {TourStep | undefined} step
 * @returns {HTMLElement | null}
 */
function targetOf(step) {
  if (!step?.target) return null;
  try {
    return /** @type {HTMLElement | null} */ (document.querySelector(step.target));
  } catch {
    return null;
  }
}

/**
 * @template {keyof HTMLElementTagNameMap} K
 * @param {K} tag
 * @param {string} [className]
 * @param {string} [text]
 * @returns {HTMLElementTagNameMap[K]}
 */
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

class PageTour extends VBElement {
  /** @type {TourStep[]} */
  #steps = [];
  #currentStep = 0;
  #active = false;
  /** @type {HTMLElement | null} */
  #backdrop = null;
  /** @type {HTMLElement | null} */
  #spotlight = null;
  /** @type {HTMLElement | null} */
  #card = null;
  /** @type {HTMLElement | null} */
  #announcer = null;
  /** @type {Element | null} */
  #returnFocus = null;
  /** The current step's target (the only element layout sync reads). @type {HTMLElement | null} */
  #currentTarget = null;
  /** Anchor name the current target had before the tour claimed it. */
  #savedAnchorName = '';
  /** @type {ResizeObserver | null} */
  #resizeObserver = null;
  /** Lives for the whole active tour (document keydown). @type {AbortController | null} */
  #tourController = null;
  /** Lives for one step (scroll/resize sync). @type {AbortController | null} */
  #layoutController = null;
  /** Lives for one step's action gate. @type {AbortController | null} */
  #actionController = null;
  /** @type {number | null} */
  #rafId = null;
  /** @type {ReturnType<typeof setTimeout> | null} */
  #settleTimer = null;
  /** @type {ReturnType<typeof setTimeout> | null} */
  #autoTimer = null;

  /** @type {PageTour|null} */
  static #activeTour = null;

  static observedAttributes = ['data-step'];

  setup() {
    this.#steps = /** @type {TourStep[]} */ ([...this.querySelectorAll('tour-step')]);
    if (this.#steps.length === 0) return false;

    // Wire the Layer 3 start button if present
    const startBtn = this.querySelector('.page-tour-start-btn');
    if (startBtn) {
      this.listen(startBtn, 'click', (e) => { e.preventDefault(); this.start(); });
    }

    // Wire external data-tour="id" buttons
    if (this.id) {
      this.listen(document, 'click', (e) => {
        const target = /** @type {Element | null} */ (e.target);
        const trigger = target?.closest?.(`[data-tour="${CSS.escape(this.id)}"]`);
        if (trigger) { e.preventDefault(); this.start(); }
      });
    }

    // Auto-trigger
    if (this.dataset.trigger === 'auto') {
      const saved = this.#restore();
      if (saved?.complete || saved?.skipped) {
        this.setAttribute('data-complete', '');
      } else {
        this.#autoTimer = setTimeout(() => {
          this.#autoTimer = null;
          if (this.isConnected) this.start(saved?.step ?? 0);
        }, 400);
      }
    }

    return true;
  }

  teardown() {
    if (this.#autoTimer) {
      clearTimeout(this.#autoTimer);
      this.#autoTimer = null;
    }
    if (this.#active) this.stop();
  }

  attributeChangedCallback(name, old, next) {
    if (name === 'data-step' && this.#active && old !== null) {
      const idx = parseInt(next, 10);
      if (!Number.isNaN(idx) && idx !== this.#currentStep) {
        this.goto(idx);
      }
    }
  }

  // -----------------------------------------------------------
  // Public API
  // -----------------------------------------------------------

  start(stepIndex = 0) {
    const requested = Math.min(Math.max(0, Number(stepIndex) || 0), this.#steps.length - 1);

    // Already running: just move to the requested step (no second overlay)
    if (this.#active) {
      this.goto(requested);
      return;
    }

    // Resolve the first step whose target exists (forward, then backward)
    let index = this.#findStep(requested, 1, true);
    if (index === -1) index = this.#findStep(requested - 1, -1, true);
    if (index === -1) {
      console.warn('[page-tour] No step target found on the page; tour not started');
      return;
    }

    // Mutex — only one tour active at a time
    if (PageTour.#activeTour && PageTour.#activeTour !== this) {
      PageTour.#activeTour.stop();
    }

    this.#returnFocus = document.activeElement;
    this.#active = true;
    PageTour.#activeTour = this;

    this.#buildOverlay();
    this.setAttribute('data-active', '');
    this.removeAttribute('data-complete');

    this.#dispatch('tour:start', { step: index });
    this.#goToStep(index, 'next');
  }

  stop() {
    if (!this.#active) return;
    this.#teardown();
    this.#active = false;
    this.removeAttribute('data-active');

    if (PageTour.#activeTour === this) {
      PageTour.#activeTour = null;
    }
  }

  next() {
    if (!this.#active || this.#isWaiting()) return;
    const index = this.#findStep(this.#currentStep + 1, 1, true);
    if (index === -1) this.#complete();
    else this.#goToStep(index, 'next');
  }

  prev() {
    if (!this.#active) return;
    const index = this.#findStep(this.#currentStep - 1, -1, true);
    if (index !== -1) this.#goToStep(index, 'prev');
  }

  goto(index) {
    if (!this.#active) return;
    const n = Number(index);
    if (!Number.isInteger(n) || n < 0 || n >= this.#steps.length) return;
    const direction = n >= this.#currentStep ? 'next' : 'prev';
    const sign = direction === 'next' ? 1 : -1;
    let resolved = this.#findStep(n, sign, true);
    if (resolved === -1) resolved = this.#findStep(n - sign, sign === 1 ? -1 : 1, true);
    if (resolved === -1 || resolved === this.#currentStep) return;
    this.#goToStep(resolved, direction);
  }

  skip() {
    if (!this.#active) return;
    if (!this.#isSkippable(this.#steps[this.#currentStep])) return;

    this.#dispatch('tour:skip', { step: this.#currentStep });
    this.#persistState({ skipped: true });
    this.stop();
    this.setAttribute('data-complete', '');
  }

  reset() {
    this.#clearStorage();
    this.removeAttribute('data-complete');
    this.dataset.step = '0';
  }

  // -----------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------

  /** @param {string} key */
  #label(key) {
    const own = key === 'title' ? this.dataset.title : this.getAttribute(`data-label-${key}`);
    return own ?? DEFAULT_LABELS[key];
  }

  /** @param {TourStep | undefined} step */
  #isSkippable(step) {
    return (this.dataset.mode ?? 'passive') !== 'forced' && (step?.skippable ?? true);
  }

  #isWaiting() {
    return !!this.#card?.querySelector('.page-tour-next[data-waiting]');
  }

  /**
   * First step index at or beyond `from` (walking `dir`) whose target exists.
   * @param {number} from
   * @param {1|-1} dir
   * @param {boolean} [warn]
   */
  #findStep(from, dir, warn = false) {
    for (let i = from; i >= 0 && i < this.#steps.length; i += dir) {
      if (targetOf(this.#steps[i])) return i;
      if (warn) console.warn(`[page-tour] Target "${this.#steps[i].target}" not found, skipping step ${i}`);
    }
    return -1;
  }

  // -----------------------------------------------------------
  // Overlay construction
  // -----------------------------------------------------------

  #buildOverlay() {
    // Backdrop
    this.#backdrop = el('div', 'page-tour-backdrop');
    this.#backdrop.setAttribute('aria-hidden', 'true');
    this.#backdrop.addEventListener('click', () => this.skip());

    // Spotlight
    this.#spotlight = el('div', 'page-tour-spotlight');
    this.#spotlight.setAttribute('aria-hidden', 'true');

    // Card (popover)
    this.#card = el('div', 'page-tour-card');
    this.#card.setAttribute('popover', 'manual');
    this.#card.setAttribute('role', 'dialog');
    this.#card.setAttribute('aria-label', this.#label('title'));
    this.#card.setAttribute('tabindex', '-1');
    this.#card.toggleAttribute('data-anchored', supportsAnchor);
    this.#card.addEventListener('click', (e) => this.#handleCardClick(e));

    // data-spotlight-padding overrides the --tour-spotlight-padding token
    const pad = parseFloat(this.dataset.spotlightPadding ?? '');
    if (Number.isFinite(pad) && pad >= 0) {
      for (const node of [this.#spotlight, this.#card]) {
        node.style.setProperty('--tour-spotlight-padding', `${pad}px`);
      }
    }

    // Announcer (screen reader)
    this.#announcer = el('div', 'visually-hidden');
    this.#announcer.setAttribute('aria-live', 'polite');
    this.#announcer.setAttribute('aria-atomic', 'true');
    this.#announcer.id = `page-tour-announcer-${++uid}`;

    this.append(this.#backdrop, this.#spotlight, this.#card, this.#announcer);
    this.#card.showPopover();

    // Keyboard works wherever focus is while the tour runs (card or target)
    this.#tourController = new AbortController();
    document.addEventListener('keydown', (e) => this.#handleKeydown(e), { signal: this.#tourController.signal });

    // Fade in backdrop on next frame
    requestAnimationFrame(() => {
      this.#backdrop?.setAttribute('data-state-visible', '');
    });
  }

  // -----------------------------------------------------------
  // Target raise / release
  // -----------------------------------------------------------

  /** @param {HTMLElement} targetEl */
  #claimTarget(targetEl) {
    this.#currentTarget = targetEl;
    // Only static targets need position: relative for z-index to apply;
    // sticky/fixed/absolute targets keep their own positioning.
    const raised = getComputedStyle(targetEl).position === 'static';
    targetEl.setAttribute('data-tour-target', raised ? 'raised' : '');
    if (supportsAnchor) {
      this.#savedAnchorName = targetEl.style.getPropertyValue('anchor-name');
      targetEl.style.setProperty('anchor-name', ANCHOR_NAME);
    }
  }

  #releaseTarget() {
    const t = this.#currentTarget;
    if (!t) return;
    t.removeAttribute('data-tour-target');
    if (supportsAnchor) {
      if (this.#savedAnchorName) t.style.setProperty('anchor-name', this.#savedAnchorName);
      else t.style.removeProperty('anchor-name');
      if (!t.getAttribute('style')) t.removeAttribute('style');
    }
    this.#savedAnchorName = '';
    this.#currentTarget = null;
  }

  // -----------------------------------------------------------
  // Positioning
  // -----------------------------------------------------------

  /** @param {HTMLElement} targetEl */
  #positionSpotlight(targetEl) {
    if (!this.#spotlight) return;
    // Padding comes from CSS (--tour-spotlight-padding); the inline box is the target rect
    const rect = targetEl.getBoundingClientRect();
    Object.assign(this.#spotlight.style, {
      top: `${rect.top}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
    });
  }

  /**
   * Physical side for the card, honouring logical placements and direction.
   * @param {HTMLElement} targetEl
   * @param {string} placement
   * @returns {'top'|'bottom'|'left'|'right'}
   */
  #resolveSide(targetEl, placement) {
    const rtl = getComputedStyle(this).direction === 'rtl';
    switch (placement) {
      case 'top':
      case 'bottom':
        return placement;
      case 'inline-start':
        return rtl ? 'right' : 'left';
      case 'inline-end':
        return rtl ? 'left' : 'right';
      default:
        return this.#autoPlacement(targetEl);
    }
  }

  /**
   * @param {HTMLElement} targetEl
   * @param {string} placement
   */
  #positionCard(targetEl, placement) {
    if (!this.#card) return;
    const side = this.#resolveSide(targetEl, placement);
    this.#card.dataset.side = side;
    // Anchor positioning: CSS (position-area + try fallbacks) does the work
    if (!supportsAnchor) this.#positionCardRect(targetEl, side);
  }

  /**
   * @param {HTMLElement} targetEl
   * @param {'top'|'bottom'|'left'|'right'} side
   */
  #positionCardRect(targetEl, side) {
    const card = this.#card;
    if (!card) return;
    const rect = targetEl.getBoundingClientRect();
    const gap = 12;
    const viewPad = 8;
    const spotlightPad = this.#spotlight ? parseFloat(getComputedStyle(this.#spotlight).paddingTop) || 0 : 0;

    // Measure the card at the origin first
    card.style.visibility = 'hidden';
    card.style.top = '0';
    card.style.left = '0';
    const cardRect = card.getBoundingClientRect();
    card.style.visibility = '';

    let top = 0, left = 0;
    switch (side) {
      case 'bottom':
        top = rect.bottom + spotlightPad + gap;
        left = rect.left + (rect.width - cardRect.width) / 2;
        break;
      case 'top':
        top = rect.top - spotlightPad - gap - cardRect.height;
        left = rect.left + (rect.width - cardRect.width) / 2;
        break;
      case 'right':
        top = rect.top + (rect.height - cardRect.height) / 2;
        left = rect.right + spotlightPad + gap;
        break;
      case 'left':
        top = rect.top + (rect.height - cardRect.height) / 2;
        left = rect.left - spotlightPad - gap - cardRect.width;
        break;
    }

    // Clamp to viewport
    left = Math.max(viewPad, Math.min(left, window.innerWidth - cardRect.width - viewPad));
    top = Math.max(viewPad, Math.min(top, window.innerHeight - cardRect.height - viewPad));

    card.style.top = `${top}px`;
    card.style.left = `${left}px`;
  }

  /**
   * @param {HTMLElement} targetEl
   * @returns {'top'|'bottom'|'left'|'right'}
   */
  #autoPlacement(targetEl) {
    const rect = targetEl.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const spaceRight = window.innerWidth - rect.right;
    const spaceLeft = rect.left;

    const max = Math.max(spaceBelow, spaceAbove, spaceRight, spaceLeft);
    if (max === spaceBelow) return 'bottom';
    if (max === spaceAbove) return 'top';
    if (max === spaceRight) return 'right';
    return 'left';
  }

  // -----------------------------------------------------------
  // Card rendering
  // -----------------------------------------------------------

  /**
   * @param {TourStep} step
   * @param {number} index
   */
  #renderCard(step, index) {
    const card = this.#card;
    if (!card) return;
    const total = this.#steps.length;
    const hasNext = this.#findStep(index + 1, 1) !== -1;
    const hasPrev = this.#findStep(index - 1, -1) !== -1;
    const isGated = step.action !== 'none';

    // Progress pips
    const progress = el('div', 'page-tour-progress');
    progress.setAttribute('aria-hidden', 'true');
    this.#steps.forEach((_, i) => {
      const pip = el('span', 'page-tour-pip');
      if (i === index) pip.setAttribute('data-active', '');
      if (i < index) pip.setAttribute('data-visited', '');
      progress.append(pip);
    });

    // Step counter
    const meta = el('p', 'page-tour-meta');
    meta.append(el('span', 'page-tour-step-count',
      this.#label('step').replace('{n}', String(index + 1)).replace('{total}', String(total))));

    // Step content (cloned from the authored <tour-step>)
    const content = el('div', 'page-tour-content');
    for (const node of step.childNodes) content.append(node.cloneNode(true));

    // Footer
    const footer = el('footer', 'page-tour-footer');
    if (this.#isSkippable(step)) {
      const skip = el('button', 'page-tour-skip', this.#label(hasNext ? 'skip' : 'close'));
      skip.type = 'button';
      skip.dataset.action = 'skip';
      footer.append(skip);
    }
    const nav = el('nav', 'page-tour-nav');
    nav.setAttribute('aria-label', this.#label('nav'));
    if (hasPrev) {
      const prev = el('button', 'page-tour-prev', this.#label('prev'));
      prev.type = 'button';
      prev.dataset.action = 'prev';
      nav.append(prev);
    }
    const next = el('button', 'page-tour-next', this.#label(hasNext ? 'next' : 'finish'));
    next.type = 'button';
    next.dataset.action = 'next';
    nav.append(next);
    footer.append(nav);

    /** @type {HTMLElement[]} */
    const parts = [progress, meta, content];

    if (isGated) {
      // aria-disabled (not disabled) keeps the button focusable and discoverable
      next.setAttribute('data-waiting', '');
      next.setAttribute('aria-disabled', 'true');
      if (step.actionHint) {
        const hint = el('p', 'page-tour-action-hint', step.actionHint);
        hint.id = `${this.#announcer?.id ?? 'page-tour'}-hint`;
        next.setAttribute('aria-describedby', hint.id);
        parts.push(hint);
      }
    }

    parts.push(footer);
    card.replaceChildren(...parts);

    // A gated step needs the user to operate the target outside the card,
    // so the card must not claim to be modal (AT would hide the target).
    if (isGated) card.removeAttribute('aria-modal');
    else card.setAttribute('aria-modal', 'true');
  }

  // -----------------------------------------------------------
  // Step navigation (index must have a live target)
  // -----------------------------------------------------------

  /**
   * @param {number} index
   * @param {'next'|'prev'} [direction]
   */
  #goToStep(index, direction = 'next') {
    const step = this.#steps[index];
    const targetEl = targetOf(step);
    if (!step || !targetEl) return;

    // Release the previous step: action gate, layout sync, raised target
    this.#actionController?.abort();
    this.#actionController = null;
    this.#stopLayoutSync();
    this.#releaseTarget();

    this.#currentStep = index;
    this.#claimTarget(targetEl);

    // Scroll target into view
    if (step.scrollBehavior !== 'none') {
      const behavior = /** @type {ScrollBehavior} */ (prefersReducedMotion() ? 'instant' : step.scrollBehavior);
      targetEl.scrollIntoView({ block: 'nearest', behavior });
    }

    // Render card content, then position (rect fallback measures the card)
    this.#renderCard(step, index);
    this.#positionSpotlight(targetEl);
    this.#positionCard(targetEl, step.placement);

    // Focus management — focus card immediately (so keydown stays captured),
    // then refine to heading or Next button on next frame
    const card = this.#card;
    card?.focus();
    requestAnimationFrame(() => {
      if (this.#card !== card || this.#currentStep !== index) return;
      const heading = /** @type {HTMLElement | null} */ (card?.querySelector('.page-tour-content :is(h2, h3, h4)') ?? null);
      if (heading) {
        if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
        heading.focus();
      } else {
        /** @type {HTMLElement | null} */ (card?.querySelector('.page-tour-next') ?? null)?.focus();
      }
    });

    // Announce to screen readers
    const heading = step.querySelector('h2, h3, h4');
    const count = this.#label('step').replace('{n}', String(index + 1)).replace('{total}', String(this.#steps.length));
    this.#announce(heading?.textContent ? `${count}: ${heading.textContent.trim()}` : count);

    // Update reflected attribute (after #currentStep, so the observer is a no-op)
    this.dataset.step = String(index);

    // Action gating
    if (step.action !== 'none') this.#gateOnAction(step, targetEl);

    // Keep spotlight (and fallback card) in sync with the current target
    this.#startLayoutSync(targetEl);

    // Persist progress
    this.#persistState({ step: index });

    this.#dispatch('tour:step', { step: index, target: targetEl, direction });
  }

  // -----------------------------------------------------------
  // Action gating
  // -----------------------------------------------------------

  /**
   * @param {TourStep} step
   * @param {HTMLElement} targetEl
   */
  #gateOnAction(step, targetEl) {
    const ac = new AbortController();
    this.#actionController = ac;

    /** @type {Record<string, string>} */
    const actionMap = { click: 'click', focus: 'focus', input: 'input', change: 'change' };
    const eventName = actionMap[step.action];

    if (eventName) {
      targetEl.addEventListener(eventName, () => {
        ac.abort();
        this.#releaseGate();
        this.#dispatch('tour:action', { step: this.#currentStep, action: step.action });
      }, { signal: ac.signal });
    } else if (step.action === 'custom') {
      // Author dispatches tour:action on the <page-tour> element
      this.addEventListener('tour:action', () => {
        ac.abort();
        this.#releaseGate();
      }, { signal: ac.signal });
    }
  }

  /** Enable Next and announce it — never move focus (the user may still be typing). */
  #releaseGate() {
    const next = this.#card?.querySelector('.page-tour-next');
    if (!next) return;
    next.removeAttribute('data-waiting');
    next.removeAttribute('aria-disabled');
    next.removeAttribute('aria-describedby');
    this.#card?.querySelector('.page-tour-action-hint')?.remove();
    this.#announce(this.#label('ready'));
  }

  // -----------------------------------------------------------
  // Keyboard navigation (document-level while active)
  // -----------------------------------------------------------

  /** @param {KeyboardEvent} e */
  #handleKeydown(e) {
    if (!this.#active || e.defaultPrevented) return;
    const origin = /** @type {Element | null} */ (e.target instanceof Element ? e.target : null);
    // Leave caret/selection keys alone inside fields (e.g. a gated input target)
    const inField = !!origin?.closest(EDITABLE);
    const modified = e.altKey || e.ctrlKey || e.metaKey;

    switch (e.key) {
      case 'Escape':
        if (this.#isSkippable(this.#steps[this.#currentStep])) {
          e.preventDefault();
          this.skip();
        }
        break;

      case 'ArrowRight':
      case 'ArrowDown':
        if (inField || modified) return;
        e.preventDefault();
        this.next();
        break;

      case 'ArrowLeft':
      case 'ArrowUp':
        if (inField || modified) return;
        e.preventDefault();
        this.prev();
        break;

      case 'Home':
        if (inField || modified) return;
        e.preventDefault();
        this.goto(0);
        break;

      case 'End':
        if (inField || modified) return;
        e.preventDefault();
        this.goto(this.#steps.length - 1);
        break;

      case 'Tab':
        this.#handleTabTrap(e);
        break;
    }
  }

  /** @param {KeyboardEvent} e */
  #handleTabTrap(e) {
    if (!this.#card) return;
    /** @param {HTMLElement} node */
    const usable = (node) => !(/** @type {HTMLButtonElement} */ (node)).disabled
      && (node.checkVisibility?.() ?? true);

    const cardFocusables = /** @type {HTMLElement[]} */ ([...this.#card.querySelectorAll(FOCUSABLE)]).filter(usable);

    // Relaxed trap: a gated step's target joins the focus cycle so the user can operate it
    /** @type {HTMLElement[]} */
    let targetFocusables = [];
    const step = this.#steps[this.#currentStep];
    const targetEl = this.#currentTarget;
    if (step && step.action !== 'none' && targetEl) {
      const tf = /** @type {HTMLElement[]} */ (targetEl.matches(FOCUSABLE)
        ? [targetEl]
        : [...targetEl.querySelectorAll(FOCUSABLE)]);
      targetFocusables = tf.filter(usable);
    }

    const all = [...cardFocusables, ...targetFocusables];
    if (all.length === 0) return;

    const first = all[0];
    const last = all[all.length - 1];
    const active = /** @type {HTMLElement | null} */ (document.activeElement);
    const outside = !active || !all.includes(active);
    const idx = outside ? -1 : all.indexOf(active);

    e.preventDefault();
    if (e.shiftKey) {
      (outside || active === first ? last : all[idx - 1]).focus();
    } else {
      (outside || active === last ? first : all[idx + 1]).focus();
    }
  }

  // -----------------------------------------------------------
  // Card click delegation
  // -----------------------------------------------------------

  /** @param {MouseEvent} e */
  #handleCardClick(e) {
    const btn = /** @type {HTMLElement | null} */ (/** @type {Element} */ (e.target).closest?.('[data-action]') ?? null);
    if (!btn) return;

    switch (btn.dataset.action) {
      case 'next': this.next(); break;
      case 'prev': this.prev(); break;
      case 'skip': this.skip(); break;
    }
  }

  // -----------------------------------------------------------
  // Layout sync (ResizeObserver + scroll/resize), one per step
  // -----------------------------------------------------------

  /** @param {HTMLElement} targetEl */
  #startLayoutSync(targetEl) {
    const ac = new AbortController();
    this.#layoutController = ac;
    const reposition = () => this.#scheduleReposition();

    // Capture catches scrolling in nested scroll containers too
    document.addEventListener('scroll', reposition, { capture: true, passive: true, signal: ac.signal });
    window.addEventListener('resize', reposition, { passive: true, signal: ac.signal });

    this.#resizeObserver = new ResizeObserver(reposition);
    this.#resizeObserver.observe(targetEl);

    // Re-position once a smooth scrollIntoView has settled
    this.#settleTimer = setTimeout(reposition, prefersReducedMotion() ? 0 : 300);
  }

  #stopLayoutSync() {
    this.#layoutController?.abort();
    this.#layoutController = null;
    this.#resizeObserver?.disconnect();
    this.#resizeObserver = null;
    if (this.#settleTimer) {
      clearTimeout(this.#settleTimer);
      this.#settleTimer = null;
    }
    if (this.#rafId) {
      cancelAnimationFrame(this.#rafId);
      this.#rafId = null;
    }
  }

  #scheduleReposition() {
    if (this.#rafId) return;
    this.#rafId = requestAnimationFrame(() => {
      this.#rafId = null;
      const targetEl = this.#currentTarget;
      if (!this.#active || !targetEl) return;
      this.#positionSpotlight(targetEl);
      if (!supportsAnchor) {
        this.#positionCard(targetEl, this.#steps[this.#currentStep].placement);
      }
    });
  }

  // -----------------------------------------------------------
  // Completion
  // -----------------------------------------------------------

  #complete() {
    this.#dispatch('tour:complete', { steps: this.#steps.length });
    this.#persistState({ complete: true });
    this.stop();
    this.setAttribute('data-complete', '');
  }

  // -----------------------------------------------------------
  // Teardown
  // -----------------------------------------------------------

  #teardown() {
    this.#tourController?.abort();
    this.#tourController = null;
    this.#actionController?.abort();
    this.#actionController = null;
    this.#stopLayoutSync();
    this.#releaseTarget();

    // Only restore focus when it is still on the tour (or nowhere)
    const focused = document.activeElement;
    const focusOnTour = !focused || focused === document.body || !!this.#card?.contains(focused);

    // Remove overlay elements
    this.#backdrop?.remove();
    this.#spotlight?.remove();
    if (this.#card?.matches(':popover-open')) this.#card.hidePopover();
    this.#card?.remove();
    this.#announcer?.remove();

    this.#backdrop = null;
    this.#spotlight = null;
    this.#card = null;
    this.#announcer = null;

    const returnFocus = /** @type {HTMLElement | null} */ (this.#returnFocus);
    this.#returnFocus = null;
    if (focusOnTour && returnFocus?.isConnected && typeof returnFocus.focus === 'function') {
      returnFocus.focus();
    }
  }

  // -----------------------------------------------------------
  // Screen reader announcements
  // -----------------------------------------------------------

  /** @param {string} text */
  #announce(text) {
    const announcer = this.#announcer;
    if (!announcer) return;
    announcer.textContent = '';
    // Clear then set on next frame for aria-live to re-announce
    requestAnimationFrame(() => {
      if (this.#announcer === announcer) announcer.textContent = text;
    });
  }

  // -----------------------------------------------------------
  // Events
  // -----------------------------------------------------------

  #dispatch(name, detail) {
    const cancelable = name !== 'tour:skip';
    this.dispatchEvent(new CustomEvent(name, { bubbles: true, cancelable, detail }));
  }

  // -----------------------------------------------------------
  // Persistence
  // -----------------------------------------------------------

  #getStorage() {
    const persist = this.dataset.persist ?? 'session';
    if (persist === 'session') return sessionStorage;
    if (persist === 'local') return localStorage;
    return null;
  }

  #getStorageKey() {
    return `vb-tour-${this.dataset.persistKey ?? window.location.pathname}`;
  }

  #persistState(patch) {
    const storage = this.#getStorage();
    if (!storage) return;
    const key = this.#getStorageKey();
    let current = {};
    try {
      current = JSON.parse(storage.getItem(key) ?? 'null') ?? {};
    } catch { /* empty */ }
    storage.setItem(key, JSON.stringify({ ...current, ...patch }));
  }

  #restore() {
    const storage = this.#getStorage();
    if (!storage) return null;
    try {
      return JSON.parse(storage.getItem(this.#getStorageKey()) ?? 'null');
    } catch {
      return null;
    }
  }

  #clearStorage() {
    const storage = this.#getStorage();
    if (!storage) return;
    storage.removeItem(this.#getStorageKey());
  }
}

registerComponent('page-tour', PageTour);
registerComponent('tour-step', TourStep);

export { PageTour, TourStep };
