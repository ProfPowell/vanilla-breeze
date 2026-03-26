import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

/**
 * page-tour: Progressive-enhancement guided page tour
 *
 * Renders as an in-page step list without JS; enhances to an
 * interactive spotlight overlay with the web component.
 *
 * @element page-tour
 * @attr {string} data-title - Tour name for aria-label and heading
 * @attr {'auto'|'manual'|'button'} data-trigger - How tour starts
 * @attr {'passive'|'active'|'forced'} data-mode - Interaction mode
 * @attr {'none'|'session'|'local'} data-persist - Progress persistence
 * @attr {string} data-persist-key - Storage key (defaults to page path)
 * @attr {number} data-step - Current step index (0-based), reflects state
 * @attr {number} data-spotlight-padding - px padding around spotlight rect
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
const supportsAnchor = CSS.supports('anchor-name', '--x');
const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * @element tour-step
 * Passive data element — exposes getters for the parent component.
 */
class TourStep extends HTMLElement {
  get target() { return this.dataset.target; }
  get placement() { return this.dataset.placement ?? 'auto'; }
  get action() { return this.dataset.action ?? 'none'; }
  get actionHint() { return this.dataset.actionHint ?? null; }
  get skippable() { return this.dataset.skippable !== 'false'; }
  get scrollBehavior() { return this.dataset.scroll ?? 'smooth'; }
}

class PageTour extends VBElement {
  #steps = [];
  #currentStep = 0;
  #active = false;
  #backdrop = null;
  #spotlight = null;
  #card = null;
  #announcer = null;
  #returnFocus = null;
  #resizeObserver = null;
  #actionController = null;
  #rafId = null;

  /** @type {PageTour|null} */
  static #activeTour = null;

  static observedAttributes = ['data-step'];

  setup() {
    this.#steps = [...this.querySelectorAll('tour-step')];
    if (this.#steps.length === 0) return false;

    // Wire the Layer 3 start button if present
    const startBtn = this.querySelector('.page-tour-start-btn');
    if (startBtn) {
      this.listen(startBtn, 'click', (e) => { e.preventDefault(); this.start(); });
    }

    // Wire external data-tour="id" buttons
    if (this.id) {
      this.listen(document, 'click', (e) => {
        const trigger = e.target.closest(`[data-tour="${this.id}"]`);
        if (trigger) { e.preventDefault(); this.start(); }
      });
    }

    // Auto-trigger
    if (this.dataset.trigger === 'auto') {
      const saved = this.#restore();
      if (saved?.complete || saved?.skipped) {
        this.setAttribute('data-complete', '');
      } else {
        setTimeout(() => this.start(saved?.step ?? 0), 400);
      }
    }
  }

  teardown() {
    if (this.#active) this.stop();
  }

  attributeChangedCallback(name, old, next) {
    if (name === 'data-step' && this.#active && old !== null) {
      const idx = parseInt(next, 10);
      if (!Number.isNaN(idx) && idx !== this.#currentStep) {
        this.#goToStep(idx);
      }
    }
  }

  // -----------------------------------------------------------
  // Public API
  // -----------------------------------------------------------

  start(stepIndex = 0) {
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

    this.#dispatch('tour:start', { step: stepIndex });
    this.#goToStep(stepIndex);
  }

  stop() {
    this.#teardown();
    this.#active = false;
    this.removeAttribute('data-active');

    if (PageTour.#activeTour === this) {
      PageTour.#activeTour = null;
    }
  }

  next() {
    if (!this.#active) return;
    // Block if action-gated and still waiting
    const nextBtn = this.#card?.querySelector('[data-action="next"]');
    if (nextBtn?.hasAttribute('data-waiting')) return;

    if (this.#currentStep < this.#steps.length - 1) {
      this.#goToStep(this.#currentStep + 1, 'next');
    } else {
      this.#complete();
    }
  }

  prev() {
    if (!this.#active) return;
    if (this.#currentStep > 0) {
      this.#goToStep(this.#currentStep - 1, 'prev');
    }
  }

  goto(index) {
    if (!this.#active) return;
    if (index >= 0 && index < this.#steps.length) {
      this.#goToStep(index);
    }
  }

  skip() {
    if (!this.#active) return;
    const mode = this.dataset.mode ?? 'passive';
    if (mode === 'forced') return;

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
  // Overlay construction
  // -----------------------------------------------------------

  #buildOverlay() {
    // Backdrop
    this.#backdrop = document.createElement('div');
    this.#backdrop.className = 'page-tour-backdrop';
    this.#backdrop.setAttribute('aria-hidden', 'true');
    this.#backdrop.addEventListener('click', () => {
      const mode = this.dataset.mode ?? 'passive';
      if (mode !== 'forced') this.skip();
    });

    // Spotlight
    this.#spotlight = document.createElement('div');
    this.#spotlight.className = 'page-tour-spotlight';
    this.#spotlight.setAttribute('aria-hidden', 'true');

    // Card (popover)
    this.#card = document.createElement('div');
    this.#card.className = 'page-tour-card';
    this.#card.setAttribute('popover', 'manual');
    this.#card.setAttribute('role', 'dialog');
    this.#card.setAttribute('aria-modal', 'true');
    this.#card.setAttribute('aria-label', this.dataset.title ?? 'Page Tour');
    this.#card.addEventListener('keydown', (e) => this.#handleKeydown(e));
    this.#card.addEventListener('click', (e) => this.#handleCardClick(e));

    // Announcer (screen reader)
    this.#announcer = document.createElement('div');
    this.#announcer.setAttribute('aria-live', 'polite');
    this.#announcer.setAttribute('aria-atomic', 'true');
    this.#announcer.className = 'sr-only';
    this.#announcer.id = `page-tour-announcer-${crypto.randomUUID().slice(0, 8)}`;

    this.append(this.#backdrop, this.#spotlight, this.#card, this.#announcer);
    this.#card.showPopover();

    // Fade in backdrop on next frame
    requestAnimationFrame(() => {
      this.#backdrop?.setAttribute('data-visible', '');
    });
  }

  // -----------------------------------------------------------
  // Positioning
  // -----------------------------------------------------------

  #positionSpotlight(targetEl) {
    const padding = parseInt(this.dataset.spotlightPadding, 10) || 8;
    const rect = targetEl.getBoundingClientRect();
    Object.assign(this.#spotlight.style, {
      top: `${rect.top - padding}px`,
      left: `${rect.left - padding}px`,
      width: `${rect.width + padding * 2}px`,
      height: `${rect.height + padding * 2}px`,
    });
  }

  #positionCard(targetEl, placement) {
    if (!this.#card) return;

    // If CSS Anchor Positioning is supported, use it
    if (supportsAnchor) {
      this.#positionCardAnchor(targetEl, placement);
      return;
    }

    this.#positionCardRect(targetEl, placement);
  }

  #positionCardAnchor(targetEl, placement) {
    const anchorName = '--tour-target';
    targetEl.style.anchorName = anchorName;
    this.#card.style.positionAnchor = anchorName;
    this.#card.style.position = 'fixed';

    // Reset inline rect positioning
    this.#card.style.top = '';
    this.#card.style.left = '';
    this.#card.style.bottom = '';
    this.#card.style.right = '';

    const offset = 'var(--tour-card-offset, 0.75rem)';
    const resolved = placement === 'auto' ? this.#autoPlacement(targetEl) : placement;

    switch (resolved) {
      case 'bottom':
        this.#card.style.top = `anchor(bottom)`;
        this.#card.style.left = `anchor(center)`;
        this.#card.style.translate = '0 calc(' + offset + ')';
        break;
      case 'top':
        this.#card.style.bottom = `anchor(top)`;
        this.#card.style.left = `anchor(center)`;
        this.#card.style.translate = '0 calc(-1 * ' + offset + ')';
        break;
      case 'right':
        this.#card.style.left = `anchor(right)`;
        this.#card.style.top = `anchor(center)`;
        this.#card.style.translate = offset + ' 0';
        break;
      case 'left':
        this.#card.style.right = `anchor(left)`;
        this.#card.style.top = `anchor(center)`;
        this.#card.style.translate = 'calc(-1 * ' + offset + ') 0';
        break;
    }
  }

  #positionCardRect(targetEl, placement) {
    const rect = targetEl.getBoundingClientRect();
    const gap = 12;
    const viewPad = 8;
    const resolved = placement === 'auto' ? this.#autoPlacement(targetEl) : placement;

    // Render card offscreen first to measure it
    this.#card.style.position = 'fixed';
    this.#card.style.visibility = 'hidden';
    this.#card.style.top = '0';
    this.#card.style.left = '0';
    this.#card.style.translate = '';
    const cardRect = this.#card.getBoundingClientRect();
    this.#card.style.visibility = '';

    let top, left;
    const spotlightPad = parseInt(this.dataset.spotlightPadding, 10) || 8;

    switch (resolved) {
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

    Object.assign(this.#card.style, {
      top: `${top}px`,
      left: `${left}px`,
      translate: '',
    });
  }

  #autoPlacement(targetEl) {
    const rect = targetEl.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const spaceBelow = vh - rect.bottom;
    const spaceAbove = rect.top;
    const spaceRight = vw - rect.right;
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

  #renderCard(step, index) {
    const total = this.#steps.length;
    const isLast = index === total - 1;
    const isFirst = index === 0;
    const mode = this.dataset.mode ?? 'passive';
    const skippable = mode !== 'forced';
    const isGated = step.action !== 'none';

    this.#card.innerHTML = /* html */`
      <div class="page-tour-progress" aria-hidden="true">
        ${this.#steps.map((_, i) => `
          <span class="page-tour-pip" ${i === index ? 'data-active' : ''} ${i < index ? 'data-visited' : ''}></span>
        `).join('')}
      </div>
      <p class="page-tour-meta">
        <span class="page-tour-step-count">Step ${index + 1} of ${total}</span>
      </p>
      <div class="page-tour-content">
        ${step.innerHTML}
      </div>
      ${isGated && step.actionHint ? `
        <p class="page-tour-action-hint">${step.actionHint}</p>
      ` : ''}
      <footer class="page-tour-footer">
        ${skippable ? `
          <button type="button" class="page-tour-skip" data-action="skip">
            ${isLast ? 'Close' : 'Skip tour'}
          </button>
        ` : ''}
        <nav class="page-tour-nav" aria-label="Tour navigation">
          ${!isFirst ? `
            <button type="button" class="page-tour-prev" data-action="prev">
              Previous
            </button>
          ` : ''}
          <button
            type="button"
            class="page-tour-next"
            data-action="next"
            ${isGated ? 'data-waiting' : ''}
          >
            ${isLast ? 'Finish' : 'Next'}
          </button>
        </nav>
      </footer>
    `;
  }

  // -----------------------------------------------------------
  // Step navigation
  // -----------------------------------------------------------

  #goToStep(index, direction = 'next') {
    // Abort any pending action gate
    this.#actionController?.abort();
    this.#actionController = null;

    // Clean up previous step's target (anchor name + raised state)
    if (this.#currentStep !== index) {
      const prevStep = this.#steps[this.#currentStep];
      const prevTarget = prevStep ? document.querySelector(prevStep.target) : null;
      if (prevTarget) {
        if (supportsAnchor) prevTarget.style.anchorName = '';
        prevTarget.removeAttribute('data-tour-target');
      }
    }

    // Stop layout sync for previous step
    this.#stopLayoutSync();

    this.#currentStep = index;
    const step = this.#steps[index];
    const targetEl = document.querySelector(step.target);

    if (!targetEl) {
      // Target not found — skip to next valid step
      console.warn(`[page-tour] Target "${step.target}" not found, skipping step ${index}`);
      if (direction === 'next' && index < this.#steps.length - 1) {
        this.#goToStep(index + 1, 'next');
      } else if (direction === 'prev' && index > 0) {
        this.#goToStep(index - 1, 'prev');
      }
      return;
    }

    // Raise the target element above the backdrop so it's clickable
    targetEl.setAttribute('data-tour-target', '');

    // Scroll target into view
    const scrollBehavior = prefersReducedMotion() ? 'instant' : step.scrollBehavior;
    if (step.scrollBehavior !== 'none') {
      targetEl.scrollIntoView({ block: 'nearest', behavior: scrollBehavior });
    }

    // Position overlay elements (slight delay for scroll to settle)
    const positionAll = () => {
      this.#positionSpotlight(targetEl);
      this.#positionCard(targetEl, step.placement);
    };

    // Position immediately, then re-position after scroll settles
    positionAll();
    setTimeout(positionAll, prefersReducedMotion() ? 0 : 300);

    // Render card content
    this.#renderCard(step, index);

    // Focus management — focus card immediately (so keydown stays captured),
    // then refine to heading or Next button on next frame
    if (!this.#card.hasAttribute('tabindex')) {
      this.#card.setAttribute('tabindex', '-1');
    }
    this.#card.focus();
    requestAnimationFrame(() => {
      const heading = this.#card?.querySelector('.page-tour-content h3, .page-tour-content h2, .page-tour-content h4');
      if (heading) {
        if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
        heading.focus();
      } else {
        this.#card?.querySelector('[data-action="next"]')?.focus();
      }
    });

    // Announce to screen readers
    const heading = step.querySelector('h3, h2, h4');
    const headingText = heading?.textContent ?? `Step ${index + 1}`;
    this.#announce(`Step ${index + 1} of ${this.#steps.length}: ${headingText}`);

    // Update reflected attribute
    this.dataset.step = String(index);

    // Action gating
    if (step.action !== 'none') {
      this.#gateOnAction(step);
    }

    // Start layout sync
    this.#startLayoutSync(targetEl);

    // Persist progress
    this.#persistState({ step: index });

    // Dispatch step event
    if (this.#active) {
      this.#dispatch('tour:step', { step: index, target: targetEl, direction });
    }
  }

  // -----------------------------------------------------------
  // Action gating
  // -----------------------------------------------------------

  #gateOnAction(step) {
    const targetEl = document.querySelector(step.target);
    if (!targetEl) return;

    const nextBtn = this.#card?.querySelector('[data-action="next"]');
    const ac = new AbortController();
    this.#actionController = ac;

    const actionMap = {
      click: 'click',
      focus: 'focus',
      input: 'input',
      change: 'change',
    };

    const eventName = actionMap[step.action];

    if (eventName) {
      targetEl.addEventListener(eventName, () => {
        nextBtn?.removeAttribute('data-waiting');
        // Remove action hint
        this.#card?.querySelector('.page-tour-action-hint')?.remove();
        nextBtn?.focus();
        this.#dispatch('tour:action', { step: this.#currentStep, action: step.action });
        ac.abort();
      }, { signal: ac.signal, once: true });
    } else if (step.action === 'custom') {
      // Author dispatches tour:action on the <page-tour> element
      this.addEventListener('tour:action', () => {
        nextBtn?.removeAttribute('data-waiting');
        this.#card?.querySelector('.page-tour-action-hint')?.remove();
        nextBtn?.focus();
        ac.abort();
      }, { signal: ac.signal, once: true });
    }
  }

  // -----------------------------------------------------------
  // Keyboard navigation
  // -----------------------------------------------------------

  #handleKeydown(e) {
    const mode = this.dataset.mode ?? 'passive';
    const step = this.#steps[this.#currentStep];
    const isGated = step?.action !== 'none';
    const nextBtn = this.#card?.querySelector('[data-action="next"]');
    const isWaiting = nextBtn?.hasAttribute('data-waiting');

    switch (e.key) {
      case 'Escape':
        if (mode !== 'forced') {
          e.preventDefault();
          this.skip();
        }
        break;

      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        if (!(isGated && isWaiting)) this.next();
        break;

      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        this.prev();
        break;

      case 'Home':
        e.preventDefault();
        this.goto(0);
        break;

      case 'End':
        e.preventDefault();
        this.goto(this.#steps.length - 1);
        break;

      case 'Tab':
        this.#handleTabTrap(e, isGated && isWaiting);
        break;
    }
  }

  #handleTabTrap(e, isActionGated) {
    const focusables = [...this.#card.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )].filter(el => !el.disabled && el.offsetParent !== null);

    // When action-gated, include the target element in the focus set
    let targetFocusables = [];
    if (isActionGated) {
      const step = this.#steps[this.#currentStep];
      const targetEl = document.querySelector(step.target);
      if (targetEl) {
        const tf = targetEl.matches('input, select, textarea, button, [href], [tabindex]')
          ? [targetEl]
          : [...targetEl.querySelectorAll(
              'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            )];
        targetFocusables = tf.filter(el => !el.disabled && el.offsetParent !== null);
      }
    }

    const allFocusables = [...focusables, ...targetFocusables];
    if (allFocusables.length === 0) return;

    const first = allFocusables[0];
    const last = allFocusables[allFocusables.length - 1];
    const active = document.activeElement;

    if (e.shiftKey) {
      if (active === first || !allFocusables.includes(active)) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (active === last || !allFocusables.includes(active)) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  // -----------------------------------------------------------
  // Card click delegation
  // -----------------------------------------------------------

  #handleCardClick(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;
    switch (action) {
      case 'next': this.next(); break;
      case 'prev': this.prev(); break;
      case 'skip': this.skip(); break;
    }
  }

  // -----------------------------------------------------------
  // Layout sync (ResizeObserver + scroll)
  // -----------------------------------------------------------

  #startLayoutSync(targetEl) {
    // ResizeObserver on target
    this.#resizeObserver = new ResizeObserver(() => {
      this.#scheduleReposition(targetEl);
    });
    this.#resizeObserver.observe(targetEl);

    // Scroll listener
    this.listen(window, 'scroll', () => this.#scheduleReposition(targetEl), { passive: true });
  }

  #stopLayoutSync() {
    if (this.#resizeObserver) {
      this.#resizeObserver.disconnect();
      this.#resizeObserver = null;
    }
    if (this.#rafId) {
      cancelAnimationFrame(this.#rafId);
      this.#rafId = null;
    }
  }

  #scheduleReposition(targetEl) {
    if (this.#rafId) return;
    this.#rafId = requestAnimationFrame(() => {
      this.#rafId = null;
      if (!this.#active) return;
      this.#positionSpotlight(targetEl);
      const step = this.#steps[this.#currentStep];
      if (!supportsAnchor) {
        this.#positionCardRect(targetEl, step.placement);
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
    // Abort action gate
    this.#actionController?.abort();
    this.#actionController = null;

    // Stop layout sync
    this.#stopLayoutSync();

    // Clean up current target (anchor name + raised state)
    const step = this.#steps[this.#currentStep];
    const targetEl = step ? document.querySelector(step.target) : null;
    if (targetEl) {
      if (supportsAnchor) targetEl.style.anchorName = '';
      targetEl.removeAttribute('data-tour-target');
    }

    // Remove overlay elements
    this.#backdrop?.remove();
    this.#spotlight?.remove();
    this.#card?.hidePopover?.();
    this.#card?.remove();
    this.#announcer?.remove();

    this.#backdrop = null;
    this.#spotlight = null;
    this.#card = null;
    this.#announcer = null;

    // Restore focus
    if (this.#returnFocus && typeof this.#returnFocus.focus === 'function') {
      this.#returnFocus.focus();
      this.#returnFocus = null;
    }
  }

  // -----------------------------------------------------------
  // Screen reader announcements
  // -----------------------------------------------------------

  #announce(text) {
    if (this.#announcer) {
      this.#announcer.textContent = '';
      // Clear then set on next frame for aria-live to re-announce
      requestAnimationFrame(() => {
        if (this.#announcer) this.#announcer.textContent = text;
      });
    }
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
      current = JSON.parse(storage.getItem(key)) ?? {};
    } catch { /* empty */ }
    storage.setItem(key, JSON.stringify({ ...current, ...patch }));
  }

  #restore() {
    const storage = this.#getStorage();
    if (!storage) return null;
    try {
      return JSON.parse(storage.getItem(this.#getStorageKey()));
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
