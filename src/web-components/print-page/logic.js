/**
 * print-page: Print button with optional raw-mode toggle
 *
 * A progressive enhancement wrapper around window.print(). Renders a print
 * button and an optional toggle to disable VB's print optimizations.
 *
 * @attr {boolean} data-raw-toggle - If present, shows a checkbox to disable VB print styles
 * @attr {string} data-label - Custom button label (default: "Print this page")
 *
 * @example
 * <print-page>Print this page</print-page>
 *
 * @example
 * <!-- With raw-mode toggle -->
 * <print-page data-raw-toggle>Print this page</print-page>
 */

class PrintPage extends HTMLElement {
  #button;
  #checkbox;

  connectedCallback() {
    const label = this.dataset.label || this.textContent.trim() || 'Print this page';
    const showRawToggle = this.hasAttribute('data-raw-toggle');

    this.innerHTML = '';
    this.setAttribute('role', 'group');

    // Print button
    this.#button = document.createElement('button');
    this.#button.type = 'button';
    this.#button.textContent = label;
    this.#button.addEventListener('click', () => this.#print());
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
  }

  #print() {
    const useRaw = this.#checkbox?.checked;

    if (useRaw) {
      document.documentElement.setAttribute('data-print-raw', '');
    }

    window.print();

    // Clean up after print dialog closes
    if (useRaw) {
      // Use both afterprint and a timeout fallback
      const cleanup = () => {
        document.documentElement.removeAttribute('data-print-raw');
        window.removeEventListener('afterprint', cleanup);
      };
      window.addEventListener('afterprint', cleanup, { once: true });
    }
  }
}

customElements.define('print-page', PrintPage);

export { PrintPage };
