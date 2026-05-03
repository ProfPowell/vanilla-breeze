import { VBElement } from '../../lib/vb-element.js';
import { registerComponent } from '../../lib/bundle-registry.js';

/**
 * tool-tip: Enhanced tooltip with Popover API + interestfor
 *
 * Wraps a trigger element and provides a tooltip on hover/focus.
 * Primary mechanism: sets `interestfor` attribute on trigger, letting
 * the browser (or polyfill) handle hover/focus timing and show/hide.
 * Falls back to JS event listeners when interestfor is unavailable.
 *
 * @attr {string} content - Simple text tooltip content
 * @attr {string} position - Position: 'top' (default), 'bottom', 'left', 'right'
 * @attr {number} delay - Show delay in ms (default: 200)
 * @attr {string} variant - Variant: omit for tooltip (default), 'card' for hover card
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

// Check CSS Anchor Positioning support once
const supportsAnchor = CSS.supports('anchor-name', '--test');

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

class ToolTip extends VBElement {
  #trigger;
  #tooltip;
  #showTimer;
  #hideTimer;
  #useJsPositioning = !supportsAnchor;
  #isCard = false;
  #useInterestFor = false;
  #savedTitle;

  setup() {
    this.#isCard = this.getAttribute('variant') === 'card';

    if (this.#isCard) {
      this.#setupCard();
    } else {
      this.#setupTooltip();
    }
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

    // Remove title to prevent native double-tooltip
    if (titleContent) {
      this.#savedTitle = titleContent;
      this.#trigger.removeAttribute('title');
    }

    // Create tooltip element with Popover API
    this.#tooltip = document.createElement('div');
    this.#tooltip.className = 'tooltip';
    this.#tooltip.setAttribute('role', 'tooltip');
    this.#tooltip.setAttribute('popover', 'hint');

    // Use content in priority order
    if (template) {
      this.#tooltip.innerHTML = template.innerHTML;
    } else {
      this.#tooltip.textContent = dataContent || titleContent;
    }

    this.#tooltip.id = `tooltip-${crypto.randomUUID().slice(0, 8)}`;

    // Position
    const position = this.getAttribute('position') || 'top';
    this.#tooltip.dataset.tooltipPosition = position;

    // Add arrow
    const arrow = document.createElement('span');
    arrow.className = 'tooltip-arrow';
    arrow.setAttribute('aria-hidden', 'true');
    this.#tooltip.appendChild(arrow);

    // Append tooltip to this element
    this.appendChild(this.#tooltip);

    // Set up CSS Anchor Positioning if supported
    if (supportsAnchor) {
      const anchorName = `--tooltip-anchor-${this.#tooltip.id}`;
      this.#trigger.style.anchorName = anchorName;
      this.#tooltip.style.positionAnchor = anchorName;
      this.#tooltip.setAttribute('data-anchor', '');
    }

    // Primary path: use interestfor attribute
    if (this.#useInterestFor) {
      this.#trigger.setAttribute('interestfor', this.#tooltip.id);
      // ARIA is handled by the polyfill/browser, but we still set describedby
      // for screen readers since polyfill only sets it on setup
      if (!this.#trigger.hasAttribute('aria-describedby')) {
        this.#trigger.setAttribute('aria-describedby', this.#tooltip.id);
      }

      // Position on show for JS fallback positioning
      if (this.#useJsPositioning) {
        this.listen(this.#tooltip, 'toggle', this.#handleToggle);
      }
    } else {
      // Fallback: JS event listeners
      this.#trigger.setAttribute('aria-describedby', this.#tooltip.id);
      this.listen(this.#trigger, 'mouseenter', this.#scheduleShow);
      this.listen(this.#trigger, 'mouseleave', this.#scheduleHide);
      this.listen(this.#trigger, 'focus', this.#showImmediate);
      this.listen(this.#trigger, 'blur', this.#hideImmediate);
      this.listen(this.#tooltip, 'mouseenter', this.#cancelHide);
      this.listen(this.#tooltip, 'mouseleave', this.#scheduleHide);
    }
  }

  // --- Card variant setup ---
  #setupCard() {
    this.#trigger = this.querySelector(':scope > [data-trigger]');
    const content = this.querySelector(':scope > [data-content]');
    if (!this.#trigger || !content) return;

    this.#useInterestFor = canUseInterestFor(this.#trigger);

    // Create card popover (manual — cards may contain interactive content)
    this.#tooltip = document.createElement('div');
    this.#tooltip.className = 'hover-card';
    this.#tooltip.setAttribute('popover', 'manual');
    this.#tooltip.id = `hc-${crypto.randomUUID().slice(0, 8)}`;

    // Move content into the card
    this.#tooltip.appendChild(content);
    content.removeAttribute('data-content');
    /** @type {HTMLElement} */ (content).hidden = false;

    this.appendChild(this.#tooltip);

    // Primary path: use interestfor (polyfill supports manual popovers)
    if (this.#useInterestFor) {
      this.#trigger.setAttribute('interestfor', this.#tooltip.id);

      // Position card on show
      this.listen(this.#tooltip, 'toggle', this.#handleToggle);
    } else {
      // Fallback: JS event listeners
      this.listen(this.#trigger, 'mouseenter', this.#scheduleShow);
      this.listen(this.#trigger, 'mouseleave', this.#scheduleHide);
      this.listen(this.#trigger, 'focus', this.#showImmediate);
      this.listen(this.#trigger, 'blur', this.#scheduleHide);
      this.listen(this.#tooltip, 'mouseenter', this.#cancelHide);
      this.listen(this.#tooltip, 'mouseleave', this.#scheduleHide);
      this.listen(document, 'keydown', this.#handleEscape);
    }
  }

  teardown() {
    if (this.#trigger) {
      if (this.#useInterestFor) {
        this.#trigger.removeAttribute('interestfor');
      }
      // Restore saved title on trigger
      if (this.#savedTitle) {
        this.#trigger.setAttribute('title', this.#savedTitle);
        this.#savedTitle = undefined;
      }
    }
    if (this.#tooltip) {
      // Remove generated popover to prevent duplication on reconnect
      this.#tooltip.remove();
      this.#tooltip = null;
    }
    clearTimeout(this.#showTimer);
    clearTimeout(this.#hideTimer);
  }

  #handleToggle = (e) => {
    if (e.newState === 'open') {
      if (this.#isCard) {
        this.#positionCard();
      } else if (this.#useJsPositioning) {
        this.#updatePosition();
      }
      this.dispatchEvent(new CustomEvent('tool-tip:show', { bubbles: true }));
    } else {
      this.dispatchEvent(new CustomEvent('tool-tip:hide', { bubbles: true }));
    }
  };

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
    if (e.key === 'Escape' && this.isVisible) {
      this.hide();
    }
  };

  show() {
    if (!this.#tooltip || this.isVisible) return;

    this.#tooltip.showPopover();

    if (this.#isCard) {
      this.#positionCard();
    } else if (this.#useJsPositioning) {
      this.#updatePosition();
    }

    this.dispatchEvent(new CustomEvent('tool-tip:show', { bubbles: true }));
  }

  hide() {
    if (!this.#tooltip || !this.isVisible) return;

    this.#tooltip.hidePopover();

    this.dispatchEvent(new CustomEvent('tool-tip:hide', { bubbles: true }));
  }

  /**
   * Position the tooltip relative to the trigger using JavaScript.
   * Uses fixed positioning to work correctly with top-layer popovers.
   */
  #updatePosition() {
    if (!this.#trigger || !this.#tooltip) return;

    const triggerRect = this.#trigger.getBoundingClientRect();
    const tooltipRect = this.#tooltip.getBoundingClientRect();
    const position = this.getAttribute('position') || 'top';
    const gap = 8;

    let top, left;

    switch (position) {
      case 'bottom':
        top = triggerRect.bottom + gap;
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.left - tooltipRect.width - gap;
        break;
      case 'right':
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.right + gap;
        break;
      case 'top':
      default:
        top = triggerRect.top - tooltipRect.height - gap;
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
        break;
    }

    // Keep within viewport
    const padding = 8;
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding));
    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipRect.height - padding));

    this.#tooltip.style.top = `${top}px`;
    this.#tooltip.style.left = `${left}px`;
  }

  /**
   * Position the card variant relative to the trigger.
   * Center-aligned horizontally with top/bottom viewport flip.
   */
  #positionCard() {
    if (!this.#trigger || !this.#tooltip) return;

    const triggerRect = this.#trigger.getBoundingClientRect();
    const cardRect = this.#tooltip.getBoundingClientRect();
    const preferred = this.getAttribute('position') || 'bottom';
    const gap = 8;
    const padding = 8;

    let top, left;

    // Horizontal: center-align with trigger
    left = triggerRect.left + (triggerRect.width - cardRect.width) / 2;
    left = Math.max(padding, Math.min(left, window.innerWidth - cardRect.width - padding));

    // Vertical: preferred position with flip
    if (preferred === 'top') {
      top = triggerRect.top - cardRect.height - gap;
      if (top < padding) {
        top = triggerRect.bottom + gap;
      }
    } else {
      top = triggerRect.bottom + gap;
      if (top + cardRect.height > window.innerHeight - padding) {
        top = triggerRect.top - cardRect.height - gap;
      }
    }

    this.#tooltip.style.position = 'fixed';
    this.#tooltip.style.top = `${top}px`;
    this.#tooltip.style.left = `${left}px`;
  }

  get isVisible() {
    return this.#tooltip?.matches(':popover-open') ?? false;
  }
}

registerComponent('tool-tip', ToolTip);

export { ToolTip };
