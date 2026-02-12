/**
 * tooltip-wc: Enhanced tooltip with Popover API + interestfor
 *
 * Wraps a trigger element and provides a tooltip on hover/focus.
 * Primary mechanism: sets `interestfor` attribute on trigger, letting
 * the browser (or polyfill) handle hover/focus timing and show/hide.
 * Falls back to JS event listeners when interestfor is unavailable.
 *
 * @attr {string} data-content - Simple text tooltip content
 * @attr {string} data-position - Position: 'top' (default), 'bottom', 'left', 'right'
 * @attr {number} data-delay - Show delay in ms (default: 200)
 * @attr {string} data-variant - Variant: omit for tooltip (default), 'card' for hover card
 *
 * @example Simple text tooltip
 * <tooltip-wc data-content="Save your changes">
 *   <button>Save</button>
 * </tooltip-wc>
 *
 * @example Rich content tooltip (use template for HTML)
 * <tooltip-wc data-position="top">
 *   <button>Hover me</button>
 *   <template data-tooltip>
 *     <strong>Formatted</strong> content with <kbd>Ctrl+S</kbd>
 *   </template>
 * </tooltip-wc>
 *
 * @example Card variant (rich hover card)
 * <tooltip-wc data-variant="card">
 *   <a href="/user/jane" data-trigger>Jane Smith</a>
 *   <div data-content>
 *     <h4>Jane Smith</h4>
 *     <p>Senior Developer</p>
 *   </div>
 * </tooltip-wc>
 */

// Check CSS Anchor Positioning support once
const supportsAnchor = CSS.supports('anchor-name', '--test');

// Check if interestfor is available (native or polyfill)
function hasInterestFor() {
  return 'interestForElement' in HTMLButtonElement.prototype ||
    document.documentElement.hasAttribute('data-interest-polyfill');
}

class TooltipWc extends HTMLElement {
  #trigger;
  #tooltip;
  #showTimer;
  #hideTimer;
  #useJsPositioning = !supportsAnchor;
  #isCard = false;
  #useInterestFor = false;

  connectedCallback() {
    this.#setup();
  }

  disconnectedCallback() {
    this.#cleanup();
  }

  #setup() {
    this.#isCard = this.dataset.variant === 'card';
    this.#useInterestFor = hasInterestFor();

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

    // Get tooltip content: template takes precedence over data-content
    const template = this.querySelector(':scope > template[data-tooltip]');
    const textContent = this.dataset.content;

    if (!template && !textContent) return;

    // Create tooltip element with Popover API
    this.#tooltip = document.createElement('div');
    this.#tooltip.className = 'tooltip';
    this.#tooltip.setAttribute('role', 'tooltip');
    this.#tooltip.setAttribute('popover', 'hint');

    // Use template HTML or plain text from data-content
    if (template) {
      this.#tooltip.innerHTML = template.innerHTML;
    } else {
      this.#tooltip.textContent = textContent;
    }

    this.#tooltip.id = `tooltip-${crypto.randomUUID().slice(0, 8)}`;

    // Position
    const position = this.dataset.position || 'top';
    this.#tooltip.dataset.position = position;

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
        this.#tooltip.addEventListener('toggle', this.#handleToggle);
      }
    } else {
      // Fallback: JS event listeners
      this.#trigger.setAttribute('aria-describedby', this.#tooltip.id);
      this.#trigger.addEventListener('mouseenter', this.#scheduleShow);
      this.#trigger.addEventListener('mouseleave', this.#scheduleHide);
      this.#trigger.addEventListener('focus', this.#showImmediate);
      this.#trigger.addEventListener('blur', this.#hideImmediate);
      this.#tooltip.addEventListener('mouseenter', this.#cancelHide);
      this.#tooltip.addEventListener('mouseleave', this.#scheduleHide);
    }
  }

  // --- Card variant setup ---
  #setupCard() {
    this.#trigger = this.querySelector(':scope > [data-trigger]');
    const content = this.querySelector(':scope > [data-content]');
    if (!this.#trigger || !content) return;

    // Create card popover (manual — cards may contain interactive content)
    this.#tooltip = document.createElement('div');
    this.#tooltip.className = 'hover-card';
    this.#tooltip.setAttribute('popover', 'manual');
    this.#tooltip.id = `hc-${crypto.randomUUID().slice(0, 8)}`;

    // Move content into the card
    this.#tooltip.appendChild(content);
    content.removeAttribute('data-content');
    content.hidden = false;

    this.appendChild(this.#tooltip);

    // Primary path: use interestfor (polyfill supports manual popovers)
    if (this.#useInterestFor) {
      this.#trigger.setAttribute('interestfor', this.#tooltip.id);

      // Position card on show
      this.#tooltip.addEventListener('toggle', this.#handleToggle);
    } else {
      // Fallback: JS event listeners
      this.#trigger.addEventListener('mouseenter', this.#scheduleShow);
      this.#trigger.addEventListener('mouseleave', this.#scheduleHide);
      this.#trigger.addEventListener('focus', this.#showImmediate);
      this.#trigger.addEventListener('blur', this.#scheduleHide);
      this.#tooltip.addEventListener('mouseenter', this.#cancelHide);
      this.#tooltip.addEventListener('mouseleave', this.#scheduleHide);
      document.addEventListener('keydown', this.#handleEscape);
    }
  }

  #cleanup() {
    if (this.#trigger) {
      if (this.#useInterestFor) {
        this.#trigger.removeAttribute('interestfor');
      } else {
        this.#trigger.removeEventListener('mouseenter', this.#scheduleShow);
        this.#trigger.removeEventListener('mouseleave', this.#scheduleHide);
        this.#trigger.removeEventListener('focus', this.#showImmediate);
        this.#trigger.removeEventListener('blur', this.#hideImmediate);
      }
    }
    if (this.#tooltip) {
      this.#tooltip.removeEventListener('mouseenter', this.#cancelHide);
      this.#tooltip.removeEventListener('mouseleave', this.#scheduleHide);
      this.#tooltip.removeEventListener('toggle', this.#handleToggle);
    }
    if (this.#isCard && !this.#useInterestFor) {
      document.removeEventListener('keydown', this.#handleEscape);
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
      const eventName = this.#isCard ? 'hover-card-show' : 'tooltip-show';
      this.dispatchEvent(new CustomEvent(eventName, { bubbles: true }));
    } else {
      const eventName = this.#isCard ? 'hover-card-hide' : 'tooltip-hide';
      this.dispatchEvent(new CustomEvent(eventName, { bubbles: true }));
    }
  };

  #scheduleShow = () => {
    clearTimeout(this.#hideTimer);
    const defaultDelay = this.#isCard ? 300 : 200;
    const delay = parseInt(this.dataset.delay || String(defaultDelay), 10);
    this.#showTimer = setTimeout(() => this.show(), delay);
  };

  #scheduleHide = () => {
    clearTimeout(this.#showTimer);
    const hideDelay = this.#isCard ? 200 : 100;
    this.#hideTimer = setTimeout(() => this.hide(), hideDelay);
  };

  #showImmediate = () => {
    clearTimeout(this.#hideTimer);
    this.show();
  };

  #hideImmediate = () => {
    clearTimeout(this.#showTimer);
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

    const eventName = this.#isCard ? 'hover-card-show' : 'tooltip-show';
    this.dispatchEvent(new CustomEvent(eventName, { bubbles: true }));
  }

  hide() {
    if (!this.#tooltip || !this.isVisible) return;

    this.#tooltip.hidePopover();

    const eventName = this.#isCard ? 'hover-card-hide' : 'tooltip-hide';
    this.dispatchEvent(new CustomEvent(eventName, { bubbles: true }));
  }

  /**
   * Position the tooltip relative to the trigger using JavaScript.
   * Uses fixed positioning to work correctly with top-layer popovers.
   */
  #updatePosition() {
    if (!this.#trigger || !this.#tooltip) return;

    const triggerRect = this.#trigger.getBoundingClientRect();
    const tooltipRect = this.#tooltip.getBoundingClientRect();
    const position = this.dataset.position || 'top';
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
    const preferred = this.dataset.position || 'bottom';
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

customElements.define('tooltip-wc', TooltipWc);

export { TooltipWc };
