/**
 * html-include-wc: Load HTML fragments from URLs
 *
 * Fetches remote HTML and injects it into the element. Progressive enhancement:
 * any existing content is shown as a fallback until the fetch completes.
 *
 * @attr {string} src - URL to fetch HTML from
 * @attr {string} data-mode - "replace" (default) replaces children, "append" appends, "prepend" prepends
 * @attr {boolean} data-loading - Added while loading, removed when done
 * @attr {boolean} data-loaded - Added after successful load
 * @attr {boolean} data-error - Added if fetch fails
 * @attr {boolean} data-lazy - If present, defers loading until element is in viewport
 *
 * @fires html-include-load - Dispatched after successful load
 * @fires html-include-error - Dispatched if fetch fails
 *
 * @example
 * <html-include-wc src="/partials/header.html">
 *   <p>Loading...</p>
 * </html-include-wc>
 */

class HtmlIncludeWc extends HTMLElement {
  #observer;
  #abortController;

  connectedCallback() {
    const src = this.getAttribute('src');
    if (!src) return;

    if (this.hasAttribute('data-lazy')) {
      this.#observeIntersection();
    } else {
      this.#load(src);
    }
  }

  disconnectedCallback() {
    this.#observer?.disconnect();
    this.#abortController?.abort();
  }

  static get observedAttributes() {
    return ['src'];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'src' && newVal && oldVal !== newVal && this.isConnected) {
      this.#load(newVal);
    }
  }

  #observeIntersection() {
    this.#observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          this.#observer.disconnect();
          const src = this.getAttribute('src');
          if (src) this.#load(src);
        }
      }
    }, { rootMargin: '200px' });

    this.#observer.observe(this);
  }

  async #load(src) {
    // Abort any previous request
    this.#abortController?.abort();
    this.#abortController = new AbortController();

    this.setAttribute('data-loading', '');
    this.removeAttribute('data-loaded');
    this.removeAttribute('data-error');

    try {
      const response = await fetch(src, {
        signal: this.#abortController.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const mode = this.dataset.mode || 'replace';

      if (mode === 'replace') {
        this.innerHTML = html;
      } else if (mode === 'append') {
        this.insertAdjacentHTML('beforeend', html);
      } else if (mode === 'prepend') {
        this.insertAdjacentHTML('afterbegin', html);
      }

      // Run any inline scripts in the loaded content
      this.querySelectorAll('script').forEach(oldScript => {
        const newScript = document.createElement('script');
        for (const attr of oldScript.attributes) {
          newScript.setAttribute(attr.name, attr.value);
        }
        newScript.textContent = oldScript.textContent;
        oldScript.replaceWith(newScript);
      });

      this.removeAttribute('data-loading');
      this.setAttribute('data-loaded', '');

      this.dispatchEvent(new CustomEvent('html-include-load', {
        bubbles: true,
        detail: { src, html }
      }));
    } catch (err) {
      if (err.name === 'AbortError') return;

      this.removeAttribute('data-loading');
      this.setAttribute('data-error', '');

      this.dispatchEvent(new CustomEvent('html-include-error', {
        bubbles: true,
        detail: { src, error: err.message }
      }));
    }
  }

  /** Reload the content from the current src */
  reload() {
    const src = this.getAttribute('src');
    if (src) this.#load(src);
  }
}

customElements.define('html-include-wc', HtmlIncludeWc);

export { HtmlIncludeWc };
