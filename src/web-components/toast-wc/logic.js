/**
 * toast-wc: Toast notification container
 *
 * A container for displaying non-modal notifications. Toasts appear in a
 * fixed position and auto-dismiss after a configurable duration.
 *
 * @attr {string} data-position - Position: 'top-end' (default), 'top-start', 'bottom-end', 'bottom-start', 'top-center', 'bottom-center'
 * @attr {number} data-duration - Default auto-dismiss duration in ms (default: 5000, 0 = no auto-dismiss)
 * @attr {number} data-max - Maximum number of visible toasts (default: 5)
 *
 * @example
 * <toast-wc data-position="bottom-end"></toast-wc>
 *
 * // Show a toast programmatically:
 * document.querySelector('toast-wc').show({
 *   message: 'File saved successfully',
 *   variant: 'success',
 *   duration: 3000
 * });
 */
class ToastWc extends HTMLElement {
  #queue = [];
  #visible = [];

  static get observedAttributes() {
    return ['data-position', 'data-max'];
  }

  connectedCallback() {
    this.setAttribute('role', 'region');
    this.setAttribute('aria-label', 'Notifications');
    this.setAttribute('aria-live', 'polite');
  }

  /**
   * Show a toast notification
   * @param {Object} options - Toast options
   * @param {string} options.message - The message to display
   * @param {string} [options.variant] - Variant: 'info', 'success', 'warning', 'error'
   * @param {number} [options.duration] - Auto-dismiss duration in ms (0 = no auto-dismiss)
   * @param {boolean} [options.dismissible=true] - Whether the toast can be manually dismissed
   * @param {string} [options.action] - Optional action button text
   * @param {Function} [options.onAction] - Callback when action button is clicked
   * @returns {HTMLElement} The toast element
   */
  show(options) {
    const {
      message,
      variant = 'info',
      duration = this.#getDefaultDuration(),
      dismissible = true,
      action,
      onAction
    } = options;

    const toast = this.#createToast({ message, variant, dismissible, action, onAction });

    // Check max visible
    const maxVisible = this.#getMaxVisible();
    if (this.#visible.length >= maxVisible) {
      // Queue the toast
      this.#queue.push({ toast, duration });
    } else {
      this.#showToast(toast, duration);
    }

    return toast;
  }

  #createToast({ message, variant, dismissible, action, onAction }) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('data-variant', variant);

    // Icon based on variant
    const iconMap = {
      info: '&#9432;',      // ⓘ
      success: '&#10003;',  // ✓
      warning: '&#9888;',   // ⚠
      error: '&#10007;'     // ✗
    };

    toast.innerHTML = `
      <span class="icon" aria-hidden="true">${iconMap[variant] || iconMap.info}</span>
      <span class="message">${this.#escapeHtml(message)}</span>
      ${action ? `<button type="button" class="action">${this.#escapeHtml(action)}</button>` : ''}
      ${dismissible ? '<button type="button" class="close" aria-label="Dismiss">&#x2715;</button>' : ''}
    `;

    // Event listeners
    if (dismissible) {
      toast.querySelector('.close').addEventListener('click', () => {
        this.#dismissToast(toast);
      });
    }

    if (action && onAction) {
      toast.querySelector('.action').addEventListener('click', () => {
        onAction();
        this.#dismissToast(toast);
      });
    }

    return toast;
  }

  #showToast(toast, duration) {
    this.appendChild(toast);
    this.#visible.push(toast);

    // Trigger enter animation
    requestAnimationFrame(() => {
      toast.setAttribute('data-state', 'visible');
    });

    // Auto-dismiss
    if (duration > 0) {
      toast._dismissTimer = setTimeout(() => {
        this.#dismissToast(toast);
      }, duration);
    }

    this.dispatchEvent(new CustomEvent('toast-show', {
      bubbles: true,
      detail: { toast }
    }));
  }

  #dismissToast(toast) {
    if (!this.contains(toast)) return;

    // Clear timer if exists
    if (toast._dismissTimer) {
      clearTimeout(toast._dismissTimer);
    }

    // Trigger exit animation
    toast.setAttribute('data-state', 'hiding');

    const handleAnimationEnd = () => {
      toast.removeEventListener('animationend', handleAnimationEnd);
      toast.remove();

      // Remove from visible array
      const index = this.#visible.indexOf(toast);
      if (index > -1) {
        this.#visible.splice(index, 1);
      }

      // Show queued toast if any
      if (this.#queue.length > 0) {
        const { toast: nextToast, duration } = this.#queue.shift();
        this.#showToast(nextToast, duration);
      }

      this.dispatchEvent(new CustomEvent('toast-hide', {
        bubbles: true,
        detail: { toast }
      }));
    };

    toast.addEventListener('animationend', handleAnimationEnd);

    // Fallback for browsers that don't fire animationend
    setTimeout(() => {
      if (this.contains(toast)) {
        handleAnimationEnd();
      }
    }, 300);
  }

  /**
   * Dismiss all visible toasts
   */
  dismissAll() {
    this.#queue = [];
    [...this.#visible].forEach(toast => this.#dismissToast(toast));
  }

  #getDefaultDuration() {
    const attr = this.getAttribute('data-duration');
    return attr !== null ? parseInt(attr, 10) : 5000;
  }

  #getMaxVisible() {
    const attr = this.getAttribute('data-max');
    return attr !== null ? parseInt(attr, 10) : 5;
  }

  #escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

customElements.define('toast-wc', ToastWc);

export { ToastWc };
