/**
 * x-tooltip: Enhanced tooltip with positioning and arrow
 *
 * Wraps a trigger element and provides a tooltip on hover/focus.
 * Uses CSS anchor positioning where available, with JS fallback.
 *
 * @attr {string} data-position - Position: 'top' (default), 'bottom', 'left', 'right'
 * @attr {number} data-delay - Show delay in ms (default: 200)
 *
 * @example
 * <x-tooltip data-position="top">
 *   <button>Hover me</button>
 *   <template data-tooltip>Tooltip content here</template>
 * </x-tooltip>
 */
class XTooltip extends HTMLElement {
  #trigger;
  #tooltip;
  #showTimer;
  #hideTimer;
  #isVisible = false;

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

    // Create tooltip element
    this.#tooltip = document.createElement('div');
    this.#tooltip.className = 'tooltip';
    this.#tooltip.setAttribute('role', 'tooltip');
    this.#tooltip.innerHTML = template.innerHTML;
    this.#tooltip.id = `tooltip-${crypto.randomUUID().slice(0, 8)}`;

    // Position
    const position = this.getAttribute('data-position') || 'top';
    this.#tooltip.setAttribute('data-position', position);

    // Add arrow
    const arrow = document.createElement('span');
    arrow.className = 'tooltip-arrow';
    arrow.setAttribute('aria-hidden', 'true');
    this.#tooltip.appendChild(arrow);

    // Append tooltip to this element
    this.appendChild(this.#tooltip);

    // Set ARIA on trigger
    this.#trigger.setAttribute('aria-describedby', this.#tooltip.id);

    // Event listeners
    this.#trigger.addEventListener('mouseenter', this.#handleMouseEnter);
    this.#trigger.addEventListener('mouseleave', this.#handleMouseLeave);
    this.#trigger.addEventListener('focus', this.#handleFocus);
    this.#trigger.addEventListener('blur', this.#handleBlur);

    // Close on Escape
    document.addEventListener('keydown', this.#handleKeyDown);
  }

  #cleanup() {
    if (this.#trigger) {
      this.#trigger.removeEventListener('mouseenter', this.#handleMouseEnter);
      this.#trigger.removeEventListener('mouseleave', this.#handleMouseLeave);
      this.#trigger.removeEventListener('focus', this.#handleFocus);
      this.#trigger.removeEventListener('blur', this.#handleBlur);
    }
    document.removeEventListener('keydown', this.#handleKeyDown);
    clearTimeout(this.#showTimer);
    clearTimeout(this.#hideTimer);
  }

  #handleMouseEnter = () => {
    clearTimeout(this.#hideTimer);
    const delay = parseInt(this.getAttribute('data-delay') || '200', 10);
    this.#showTimer = setTimeout(() => this.show(), delay);
  };

  #handleMouseLeave = () => {
    clearTimeout(this.#showTimer);
    this.#hideTimer = setTimeout(() => this.hide(), 100);
  };

  #handleFocus = () => {
    clearTimeout(this.#hideTimer);
    this.show();
  };

  #handleBlur = () => {
    this.hide();
  };

  #handleKeyDown = (e) => {
    if (e.key === 'Escape' && this.#isVisible) {
      this.hide();
    }
  };

  show() {
    if (this.#isVisible || !this.#tooltip) return;

    this.#isVisible = true;
    this.#tooltip.setAttribute('data-state', 'visible');
    this.#positionTooltip();

    this.dispatchEvent(new CustomEvent('tooltip-show', { bubbles: true }));
  }

  hide() {
    if (!this.#isVisible || !this.#tooltip) return;

    this.#isVisible = false;
    this.#tooltip.removeAttribute('data-state');

    this.dispatchEvent(new CustomEvent('tooltip-hide', { bubbles: true }));
  }

  #positionTooltip() {
    if (!this.#trigger || !this.#tooltip) return;

    const triggerRect = this.#trigger.getBoundingClientRect();
    const tooltipRect = this.#tooltip.getBoundingClientRect();
    const position = this.getAttribute('data-position') || 'top';
    const gap = 8; // Space between trigger and tooltip

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

    this.#tooltip.style.setProperty('--tooltip-top', `${top}px`);
    this.#tooltip.style.setProperty('--tooltip-left', `${left}px`);
  }

  get isVisible() {
    return this.#isVisible;
  }
}

customElements.define('x-tooltip', XTooltip);

export { XTooltip };
