import { VBElement } from '../../lib/vb-element.js';
import { registerComponent } from '../../lib/bundle-registry.js';
// Ensure <pop-over> is registered — tool-tip composes it for its popover surface.
import '../pop-over/logic.js';

/**
 * tool-tip: Enhanced tooltip with Popover API + interestfor
 *
 * Composes <pop-over> for the popover surface (popover attribute, anchor
 * positioning, light-dismiss, display:none cascade re-assertion) and
 * layers tooltip-specific behavior on top: interestfor wiring, hover/focus
 * delay, ARIA describedby, title attribute hand-off, and centered
 * anchor positioning via the [role="tooltip"][popover] cascade.
 *
 * Variants:
 *   - default: classic text tooltip (popover="hint", center-aligned).
 *   - card:    rich hover card (popover="manual", corner-aligned via
 *              <pop-over data-position>).
 *
 * @attr {string} content - Simple text tooltip content
 * @attr {string} position - 'top' (default), 'bottom', 'left', 'right'
 * @attr {number} delay - Show delay in ms (default: 200)
 * @attr {string} variant - omit for tooltip (default), 'card' for hover card
 *
 * @example Simple text tooltip
 * <tool-tip content="Save your changes">
 *   <button>Save</button>
 * </tool-tip>
 *
 * @example Rich content tooltip (use template for HTML)
 * <tool-tip position="top">
 *   <button>Hover me</button>
 *   <template data-tooltip>
 *     <strong>Formatted</strong> content with <kbd>Ctrl+S</kbd>
 *   </template>
 * </tool-tip>
 *
 * @example Card variant (rich hover card)
 * <tool-tip variant="card">
 *   <a href="/user/jane" data-trigger>Jane Smith</a>
 *   <div data-content>
 *     <h4>Jane Smith</h4>
 *     <p>Senior Developer</p>
 *   </div>
 * </tool-tip>
 */

// Elements that support native interestfor (spec-defined)
const INTERESTFOR_TAGS = new Set(['BUTTON', 'A', 'AREA']);

/**
 * Check if interestfor can be used on a specific trigger element.
 * Native interestfor only works on button/a/area; our polyfill supports any element.
 */
function canUseInterestFor(trigger) {
  if (document.documentElement.hasAttribute('data-interest-polyfill')) return true;
  if ('interestForElement' in HTMLButtonElement.prototype) {
    return INTERESTFOR_TAGS.has(trigger.tagName);
  }
  return false;
}

let toolTipSeq = 0;

class ToolTip extends VBElement {
  /** @type {HTMLElement} */ #trigger;
  /** @type {HTMLElement} */ #popover;
  #showTimer;
  #hideTimer;
  #isCard = false;
  #useInterestFor = false;
  /** @type {string | undefined} */ #savedTitle;

  setup() {
    this.#isCard = this.getAttribute('variant') === 'card';
    if (this.#isCard) this.#setupCard();
    else this.#setupTooltip();
  }

  // --- Regular tooltip setup ---
  #setupTooltip() {
    // Find trigger (first non-template child)
    this.#trigger = this.querySelector(':scope > :not(template)');
    if (!this.#trigger) return;

    this.#useInterestFor = canUseInterestFor(this.#trigger);

    // Content priority: template > data-content > title on trigger
    const template = this.querySelector(':scope > template[data-tooltip]');
    const dataContent = this.getAttribute('content');
    const titleContent = this.#trigger.getAttribute('title');

    if (!template && !dataContent && !titleContent) return;

    // Remove title to prevent native double-tooltip; restore on teardown.
    if (titleContent) {
      this.#savedTitle = titleContent;
      this.#trigger.removeAttribute('title');
    }

    const position = this.getAttribute('position') || 'top';
    if (!this.#trigger.id) this.#trigger.id = `tooltip-trigger-${++toolTipSeq}`;

    /* Compose <pop-over> as the popover surface. pop-over owns:
       - popover attribute (mode=hint)
       - anchor-name wiring on the trigger
       - display:none cascade re-assertion (popover_display_gotcha)
       - JS-driven positioning fallback when anchor-positioning is unavailable
       tool-tip's responsibility: tooltip-specific role/visual classes and
       the data-tooltip-position hook the native tooltip cascade uses for
       center alignment. */
    const tip = document.createElement('pop-over');
    tip.className = 'tooltip';
    tip.setAttribute('role', 'tooltip');
    tip.dataset.mode = 'hint';
    tip.dataset.anchor = this.#trigger.id;
    tip.dataset.tooltipPosition = position;
    tip.id = `tooltip-${++toolTipSeq}`;

    // Content
    if (template) tip.innerHTML = template.innerHTML;
    else tip.textContent = dataContent || titleContent;

    // Arrow
    const arrow = document.createElement('span');
    arrow.className = 'tooltip-arrow';
    arrow.setAttribute('aria-hidden', 'true');
    tip.appendChild(arrow);

    this.appendChild(tip);
    this.#popover = tip;

    if (this.#useInterestFor) {
      this.#trigger.setAttribute('interestfor', tip.id);
      // ARIA — polyfill only sets describedby at setup; assert it ourselves
      if (!this.#trigger.hasAttribute('aria-describedby')) {
        this.#trigger.setAttribute('aria-describedby', tip.id);
      }
    } else {
      // JS-fallback hover/focus listeners
      this.#trigger.setAttribute('aria-describedby', tip.id);
      this.listen(this.#trigger, 'mouseenter', this.#scheduleShow);
      this.listen(this.#trigger, 'mouseleave', this.#scheduleHide);
      this.listen(this.#trigger, 'focus', this.#showImmediate);
      this.listen(this.#trigger, 'blur', this.#hideImmediate);
      this.listen(tip, 'mouseenter', this.#cancelHide);
      this.listen(tip, 'mouseleave', this.#scheduleHide);
    }

    // Re-emit pop-over's show/hide under tool-tip's namespace
    this.listen(tip, 'pop-over:show', () => {
      this.dispatchEvent(new CustomEvent('tool-tip:show', { bubbles: true }));
    });
    this.listen(tip, 'pop-over:hide', () => {
      this.dispatchEvent(new CustomEvent('tool-tip:hide', { bubbles: true }));
    });
  }

  // --- Card variant setup ---
  #setupCard() {
    this.#trigger = this.querySelector(':scope > [data-trigger]');
    const content = this.querySelector(':scope > [data-content]');
    if (!this.#trigger || !content) return;

    this.#useInterestFor = canUseInterestFor(this.#trigger);
    if (!this.#trigger.id) this.#trigger.id = `tooltip-trigger-${++toolTipSeq}`;

    /* Cards need explicit show/hide (interactive content), so mode=manual.
       Corner-aligned via pop-over's data-position (defaults to bottom). */
    const card = document.createElement('pop-over');
    card.className = 'hover-card';
    card.dataset.mode = 'manual';
    card.dataset.anchor = this.#trigger.id;
    card.dataset.position = this.getAttribute('position') || 'bottom';
    card.id = `hc-${++toolTipSeq}`;

    // Move content into the card
    card.appendChild(content);
    content.removeAttribute('data-content');
    /** @type {HTMLElement} */ (content).hidden = false;

    this.appendChild(card);
    this.#popover = card;

    if (this.#useInterestFor) {
      this.#trigger.setAttribute('interestfor', card.id);
    } else {
      this.listen(this.#trigger, 'mouseenter', this.#scheduleShow);
      this.listen(this.#trigger, 'mouseleave', this.#scheduleHide);
      this.listen(this.#trigger, 'focus', this.#showImmediate);
      this.listen(this.#trigger, 'blur', this.#scheduleHide);
      this.listen(card, 'mouseenter', this.#cancelHide);
      this.listen(card, 'mouseleave', this.#scheduleHide);
      this.listen(document, 'keydown', this.#handleEscape);
    }

    this.listen(card, 'pop-over:show', () => {
      this.dispatchEvent(new CustomEvent('tool-tip:show', { bubbles: true }));
    });
    this.listen(card, 'pop-over:hide', () => {
      this.dispatchEvent(new CustomEvent('tool-tip:hide', { bubbles: true }));
    });
  }

  teardown() {
    if (this.#trigger) {
      if (this.#useInterestFor) this.#trigger.removeAttribute('interestfor');
      if (this.#savedTitle) {
        this.#trigger.setAttribute('title', this.#savedTitle);
        this.#savedTitle = undefined;
      }
    }
    if (this.#popover) {
      this.#popover.remove();
      this.#popover = null;
    }
    clearTimeout(this.#showTimer);
    clearTimeout(this.#hideTimer);
  }

  #scheduleShow = () => {
    clearTimeout(this.#hideTimer);
    const defaultDelay = this.#isCard ? 300 : 200;
    const delay = parseInt(this.getAttribute('delay') || String(defaultDelay), 10);
    this.setState('show-pending', true);
    this.#showTimer = setTimeout(() => {
      this.setState('show-pending', false);
      this.show();
    }, delay);
  };

  #scheduleHide = () => {
    clearTimeout(this.#showTimer);
    this.setState('show-pending', false);
    const hideDelay = this.#isCard ? 200 : 100;
    this.#hideTimer = setTimeout(() => this.hide(), hideDelay);
  };

  #showImmediate = () => {
    clearTimeout(this.#hideTimer);
    this.show();
  };

  #hideImmediate = () => {
    clearTimeout(this.#showTimer);
    this.setState('show-pending', false);
    this.hide();
  };

  #cancelHide = () => {
    clearTimeout(this.#hideTimer);
  };

  #handleEscape = (e) => {
    if (e.key === 'Escape' && this.isVisible) this.hide();
  };

  show() {
    if (!this.#popover || this.isVisible) return;
    // Prefer pop-over's imperative API; falls back to showPopover().
    if (typeof /** @type {any} */ (this.#popover).show === 'function') {
      /** @type {any} */ (this.#popover).show();
    } else {
      /** @type {any} */ (this.#popover).showPopover();
    }
  }

  hide() {
    if (!this.#popover || !this.isVisible) return;
    if (typeof /** @type {any} */ (this.#popover).hide === 'function') {
      /** @type {any} */ (this.#popover).hide();
    } else {
      /** @type {any} */ (this.#popover).hidePopover();
    }
  }

  get isVisible() {
    return this.#popover?.matches(':popover-open') ?? false;
  }
}

registerComponent('tool-tip', ToolTip);

export { ToolTip };
