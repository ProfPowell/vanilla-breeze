/**
 * tooltip-wc: Enhanced tooltip with Popover API
 *
 * Wraps a trigger element and provides a tooltip on hover/focus.
 * Uses native Popover API for top-layer rendering and CSS Anchor
 * Positioning where available, with JS fallback for older browsers.
 *
 * @attr {string} data-position - Position: 'top' (default), 'bottom', 'left', 'right'
 * @attr {number} data-delay - Show delay in ms (default: 200)
 *
 * @example
 * <tooltip-wc data-position="top">
 *   <button>Hover me</button>
 *   <template data-tooltip>Tooltip content here</template>
 * </tooltip-wc>
 */
class TooltipWc extends HTMLElement {
  #trigger;
  #tooltip;
  #showTimer;
  #hideTimer;

  connectedCallback() {
    this.#setup();
  }

  disconnectedCallback() {
    this.#cleanup();
  }

  #setup() {
    // Find trigger (first non-template child)
    this.#trigger = this.querySelector(':scope > :not(template)');
    if (!this.#trigger) return;

    // Find tooltip template
    const template = this.querySelector(':scope > template[data-tooltip]');
    if (!template) return;

    // Create tooltip element with Popover API
    this.#tooltip = document.createElement('div');
    this.#tooltip.className = 'tooltip';
    this.#tooltip.setAttribute('role', 'tooltip');
    this.#tooltip.setAttribute('popover', 'hint'); // Use Popover API
    this.#tooltip.innerHTML = template.innerHTML;
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

    // Set ARIA relationship on trigger
    this.#trigger.setAttribute('aria-describedby', this.#tooltip.id);

    // Event listeners - just binding, state managed by Popover API
    this.#trigger.addEventListener('mouseenter', this.#scheduleShow);
    this.#trigger.addEventListener('mouseleave', this.#scheduleHide);
    this.#trigger.addEventListener('focus', this.#showImmediate);
    this.#trigger.addEventListener('blur', this.#hideImmediate);

    // Allow hovering over tooltip (keeps it open)
    this.#tooltip.addEventListener('mouseenter', this.#cancelHide);
    this.#tooltip.addEventListener('mouseleave', this.#scheduleHide);

    // Note: Escape key handling is built into Popover API - no manual listener needed
  }

  #cleanup() {
    if (this.#trigger) {
      this.#trigger.removeEventListener('mouseenter', this.#scheduleShow);
      this.#trigger.removeEventListener('mouseleave', this.#scheduleHide);
      this.#trigger.removeEventListener('focus', this.#showImmediate);
      this.#trigger.removeEventListener('blur', this.#hideImmediate);
    }
    if (this.#tooltip) {
      this.#tooltip.removeEventListener('mouseenter', this.#cancelHide);
      this.#tooltip.removeEventListener('mouseleave', this.#scheduleHide);
    }
    clearTimeout(this.#showTimer);
    clearTimeout(this.#hideTimer);
  }

  #scheduleShow = () => {
    clearTimeout(this.#hideTimer);
    const delay = parseInt(this.dataset.delay || '200', 10);
    this.#showTimer = setTimeout(() => this.show(), delay);
  };

  #scheduleHide = () => {
    clearTimeout(this.#showTimer);
    this.#hideTimer = setTimeout(() => this.hide(), 100);
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

  show() {
    if (!this.#tooltip || this.isVisible) return;

    this.#tooltip.showPopover();
    this.#updatePosition();

    this.dispatchEvent(new CustomEvent('tooltip-show', { bubbles: true }));
  }

  hide() {
    if (!this.#tooltip || !this.isVisible) return;

    this.#tooltip.hidePopover();

    this.dispatchEvent(new CustomEvent('tooltip-hide', { bubbles: true }));
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

  get isVisible() {
    return this.#tooltip?.matches(':popover-open') ?? false;
  }
}

customElements.define('tooltip-wc', TooltipWc);

export { TooltipWc };
