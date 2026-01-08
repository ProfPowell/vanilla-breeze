/**
 * dialog-wc: Modal dialog with focus trap, backdrop dismiss, and animations
 *
 * Uses native <dialog> element for accessibility and focus management.
 *
 * @example
 * <dialog-wc id="my-dialog" data-size="m">
 *   <h2>Dialog Title</h2>
 *   <p>Dialog content goes here.</p>
 *   <menu>
 *     <button type="button" data-dialog-close>Cancel</button>
 *     <button type="submit">Confirm</button>
 *   </menu>
 * </dialog-wc>
 *
 * <button data-dialog-open="my-dialog">Open Dialog</button>
 *
 * @attr {string} data-size - Dialog size: 's', 'm' (default), 'l', 'full'
 * @attr {boolean} data-no-backdrop-close - Disable clicking backdrop to close
 * @attr {boolean} data-no-esc-close - Disable ESC key to close
 */
class DialogWc extends HTMLElement {
  #dialog;
  #isOpen = false;

  static get observedAttributes() {
    return ['open'];
  }

  connectedCallback() {
    this.#setup();
    this.#bindTriggers();

    // Check if should open on connect
    if (this.hasAttribute('open')) {
      this.open();
    }
  }

  disconnectedCallback() {
    this.#unbindTriggers();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'open' && this.#dialog) {
      if (newValue !== null) {
        this.open();
      } else {
        this.close();
      }
    }
  }

  #setup() {
    // Create native dialog if not present
    this.#dialog = this.querySelector(':scope > dialog');

    if (!this.#dialog) {
      // Wrap existing content in a dialog
      this.#dialog = document.createElement('dialog');
      this.#dialog.append(...this.childNodes);
      this.append(this.#dialog);
    }

    // Set up ARIA
    this.#dialog.setAttribute('aria-modal', 'true');

    // Find or create close buttons
    this.#dialog.querySelectorAll('[data-dialog-close]').forEach(btn => {
      btn.addEventListener('click', () => this.close());
    });

    // Backdrop click to close
    this.#dialog.addEventListener('click', (e) => {
      if (this.hasAttribute('data-no-backdrop-close')) return;

      // Check if click was on backdrop (dialog element itself, not content)
      if (e.target === this.#dialog) {
        this.close();
      }
    });

    // Handle ESC key via native cancel event
    this.#dialog.addEventListener('cancel', (e) => {
      if (this.hasAttribute('data-no-esc-close')) {
        e.preventDefault();
        return;
      }
      // Let native behavior close it, but sync our state
      this.#handleClose();
    });

    // Handle native close event
    this.#dialog.addEventListener('close', () => {
      this.#handleClose();
    });
  }

  #bindTriggers() {
    // Find buttons that open this dialog
    const id = this.id;
    if (!id) return;

    document.querySelectorAll(`[data-dialog-open="${id}"]`).forEach(trigger => {
      trigger.addEventListener('click', this.#handleTriggerClick);
    });
  }

  #unbindTriggers() {
    const id = this.id;
    if (!id) return;

    document.querySelectorAll(`[data-dialog-open="${id}"]`).forEach(trigger => {
      trigger.removeEventListener('click', this.#handleTriggerClick);
    });
  }

  #handleTriggerClick = (e) => {
    e.preventDefault();
    this.open();
  };

  #handleClose() {
    this.#isOpen = false;
    this.removeAttribute('open');
    this.removeAttribute('data-state');

    this.dispatchEvent(new CustomEvent('dialog-close', {
      bubbles: true,
      detail: { returnValue: this.#dialog.returnValue }
    }));
  }

  /**
   * Open the dialog
   */
  open() {
    if (this.#isOpen) return;

    this.#isOpen = true;
    this.setAttribute('data-state', 'open');
    this.#dialog.showModal();

    // Focus first focusable element or dialog itself
    const focusable = this.#dialog.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable) {
      focusable.focus();
    }

    this.dispatchEvent(new CustomEvent('dialog-open', { bubbles: true }));
  }

  /**
   * Close the dialog
   * @param {string} [returnValue] - Optional return value
   */
  close(returnValue) {
    if (!this.#isOpen) return;

    if (returnValue !== undefined) {
      this.#dialog.returnValue = returnValue;
    }

    this.#dialog.close();
  }

  /**
   * Toggle the dialog open/closed
   */
  toggle() {
    if (this.#isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Check if dialog is currently open
   */
  get isOpen() {
    return this.#isOpen;
  }
}

customElements.define('dialog-wc', DialogWc);

export { DialogWc };
