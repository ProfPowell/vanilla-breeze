/**
 * copy-wc: Copy to clipboard button
 *
 * Wraps a button to copy text to the clipboard on click.
 * Reads text from data-value attribute or from a target element's textContent.
 * Provides visual and screen reader feedback on success.
 *
 * @attr {string} data-value - Static text to copy
 * @attr {string} data-target - CSS selector for element whose textContent to copy
 *
 * @example Static text
 * <copy-wc data-value="npm install vanilla-breeze"><button>Copy</button></copy-wc>
 *
 * @example Target element
 * <copy-wc data-target="#code-block"><button>Copy</button></copy-wc>
 */
class CopyWc extends HTMLElement {
  #button;
  #resetTimer;

  connectedCallback() {
    this.#button = this.querySelector('button');
    if (!this.#button) return;

    this.#button.addEventListener('click', this.#handleClick);
  }

  disconnectedCallback() {
    this.#button?.removeEventListener('click', this.#handleClick);
    clearTimeout(this.#resetTimer);
  }

  #handleClick = async () => {
    const text = this.#getText();
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);

      // Visual feedback
      this.dataset.state = 'copied';
      clearTimeout(this.#resetTimer);
      this.#resetTimer = setTimeout(() => {
        delete this.dataset.state;
      }, 1500);

      // Screen reader announcement
      this.#announce('Copied to clipboard');

      this.dispatchEvent(new CustomEvent('copy', {
        bubbles: true,
        detail: { text }
      }));
    } catch {
      // Clipboard API unavailable or denied
    }
  };

  #getText() {
    if (this.dataset.value) return this.dataset.value;

    if (this.dataset.target) {
      const target = document.querySelector(this.dataset.target);
      return target?.textContent ?? '';
    }

    return '';
  }

  #announce(message) {
    const el = document.createElement('div');
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.className = 'sr-only';
    el.textContent = message;
    this.appendChild(el);
    setTimeout(() => el.remove(), 1000);
  }
}

customElements.define('copy-wc', CopyWc);
export { CopyWc };
