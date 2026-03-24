import { registerComponent } from '../../lib/bundle-registry.js';

/**
 * print-page: Print button with optional raw-mode toggle
 *
 * A progressive enhancement wrapper around window.print(). Renders a print
 * button and an optional toggle to disable VB's print optimizations.
 *
 * @attr {boolean} raw-toggle - If present, shows a checkbox to disable VB print styles
 * @attr {string} label - Custom button label (default: "Print this page")
 *
 * @example
 * <print-page>Print this page</print-page>
 *
 * @example
 * <!-- With raw-mode toggle -->
 * <print-page raw-toggle>Print this page</print-page>
 */

class PrintPage extends HTMLElement {
  #button;
  #checkbox;
  /** @type {string | null} Saved authored label (captured once) */
  #savedLabel = null;

  connectedCallback() {
    // Guard: don't double-setup on reconnect
    if (this.hasAttribute('data-upgraded')) return;

    // Capture authored label once before clearing DOM
    if (this.#savedLabel === null) {
      this.#savedLabel = this.getAttribute('label') || this.textContent.trim() || 'Print this page';
    }

    const label = this.#savedLabel;
    const showRawToggle = this.hasAttribute('raw-toggle');

    this.innerHTML = '';

    // Only apply role="group" when multiple controls are present
    if (showRawToggle) {
      this.setAttribute('role', 'group');
    }

    // Print button
    this.#button = document.createElement('button');
    this.#button.type = 'button';
    this.#button.textContent = label;
    this.#button.addEventListener('click', this.#handlePrint);
    this.append(this.#button);

    // Optional: raw-mode toggle
    if (showRawToggle) {
      const toggle = document.createElement('label');
      this.#checkbox = document.createElement('input');
      this.#checkbox.type = 'checkbox';
      const span = document.createElement('span');
      span.textContent = 'Print without VB styles';
      toggle.append(this.#checkbox, span);
      this.append(toggle);
    }
    this.setAttribute('data-upgraded', '');
  }

  disconnectedCallback() {
    if (this.#button) {
      this.#button.removeEventListener('click', this.#handlePrint);
    }
    this.removeAttribute('data-upgraded');
  }

  #handlePrint = () => {
    const useRaw = this.#checkbox?.checked;

    if (useRaw) {
      document.documentElement.setAttribute('data-print-raw', '');
    }

    window.print();

    // Clean up after print dialog closes
    if (useRaw) {
      const cleanup = () => {
        document.documentElement.removeAttribute('data-print-raw');
        window.removeEventListener('afterprint', cleanup);
        clearTimeout(fallbackTimer);
      };

      // afterprint is the primary cleanup path
      window.addEventListener('afterprint', cleanup, { once: true });

      // Timeout fallback — some browsers don't fire afterprint reliably
      const fallbackTimer = setTimeout(cleanup, 5000);
    }
  };
}

registerComponent('print-page', PrintPage);

export { PrintPage };
