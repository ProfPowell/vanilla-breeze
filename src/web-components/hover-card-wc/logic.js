/**
 * hover-card-wc: Rich content preview on hover
 *
 * Shows structured content (user profiles, link previews, product cards)
 * on hover with a delay. Uses Popover API for top-layer rendering.
 *
 * @attr {string} data-position - Preferred position: 'bottom' (default), 'top'
 * @attr {number} data-delay - Show delay in ms (default: 300)
 *
 * @example
 * <hover-card-wc>
 *   <a href="/user/jane" data-trigger>Jane Smith</a>
 *   <div data-content>
 *     <img src="/avatars/jane.jpg" alt="" />
 *     <h4>Jane Smith</h4>
 *     <p>Senior Developer</p>
 *   </div>
 * </hover-card-wc>
 */
class HoverCardWc extends HTMLElement {
  #trigger;
  #card;
  #showTimer;
  #hideTimer;

  connectedCallback() {
    this.#setup();
  }

  disconnectedCallback() {
    this.#cleanup();
  }

  #setup() {
    this.#trigger = this.querySelector(':scope > [data-trigger]');
    const content = this.querySelector(':scope > [data-content]');
    if (!this.#trigger || !content) return;

    // Create card popover
    this.#card = document.createElement('div');
    this.#card.className = 'hover-card';
    this.#card.setAttribute('popover', 'manual');
    this.#card.id = `hc-${crypto.randomUUID().slice(0, 8)}`;

    // Move content into the card
    this.#card.appendChild(content);
    content.removeAttribute('data-content');
    content.hidden = false;

    this.appendChild(this.#card);

    // Event listeners
    this.#trigger.addEventListener('mouseenter', this.#scheduleShow);
    this.#trigger.addEventListener('mouseleave', this.#scheduleHide);
    this.#trigger.addEventListener('focus', this.#showImmediate);
    this.#trigger.addEventListener('blur', this.#scheduleHide);

    this.#card.addEventListener('mouseenter', this.#cancelHide);
    this.#card.addEventListener('mouseleave', this.#scheduleHide);

    document.addEventListener('keydown', this.#handleEscape);
  }

  #cleanup() {
    if (this.#trigger) {
      this.#trigger.removeEventListener('mouseenter', this.#scheduleShow);
      this.#trigger.removeEventListener('mouseleave', this.#scheduleHide);
      this.#trigger.removeEventListener('focus', this.#showImmediate);
      this.#trigger.removeEventListener('blur', this.#scheduleHide);
    }
    if (this.#card) {
      this.#card.removeEventListener('mouseenter', this.#cancelHide);
      this.#card.removeEventListener('mouseleave', this.#scheduleHide);
    }
    document.removeEventListener('keydown', this.#handleEscape);
    clearTimeout(this.#showTimer);
    clearTimeout(this.#hideTimer);
  }

  #scheduleShow = () => {
    clearTimeout(this.#hideTimer);
    const delay = parseInt(this.dataset.delay || '300', 10);
    this.#showTimer = setTimeout(() => this.show(), delay);
  };

  #scheduleHide = () => {
    clearTimeout(this.#showTimer);
    this.#hideTimer = setTimeout(() => this.hide(), 200);
  };

  #showImmediate = () => {
    clearTimeout(this.#hideTimer);
    this.show();
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
    if (!this.#card || this.isVisible) return;
    this.#card.showPopover();
    this.#position();
    this.dispatchEvent(new CustomEvent('hover-card-show', { bubbles: true }));
  }

  hide() {
    if (!this.#card || !this.isVisible) return;
    this.#card.hidePopover();
    this.dispatchEvent(new CustomEvent('hover-card-hide', { bubbles: true }));
  }

  #position() {
    if (!this.#trigger || !this.#card) return;

    const triggerRect = this.#trigger.getBoundingClientRect();
    const cardRect = this.#card.getBoundingClientRect();
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

    this.#card.style.position = 'fixed';
    this.#card.style.top = `${top}px`;
    this.#card.style.left = `${left}px`;
  }

  get isVisible() {
    return this.#card?.matches(':popover-open') ?? false;
  }
}

customElements.define('hover-card-wc', HoverCardWc);

export { HoverCardWc };
