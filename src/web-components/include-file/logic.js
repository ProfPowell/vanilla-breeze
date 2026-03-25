/**
 * include-file: Load trusted HTML fragments from URLs
 *
 * Fetches remote HTML and injects it into the element. Progressive enhancement:
 * any existing content is shown as a fallback until the fetch completes.
 *
 * Trust boundary: this component injects HTML via innerHTML/insertAdjacentHTML.
 * It is designed for loading trusted first-party fragments (partials, includes).
 * Do not use it to load untrusted or user-generated HTML from third-party sources.
 *
 * @attr {string} src - URL to fetch HTML from
 * @attr {string} mode - "replace" (default) replaces children, "append" appends, "prepend" prepends
 * @attr {boolean} lazy - If present, defers loading until element is in viewport (honored on src changes too)
 * @attr {boolean} allow-scripts - If present, re-executes inline scripts in loaded content (TRUSTED sources only)
 *
 * State attributes (set by component):
 * @attr {boolean} data-loading - Present while fetching
 * @attr {boolean} data-loaded - Present after successful load
 * @attr {boolean} data-error - Present if fetch fails
 *
 * @fires include-file:loaded - Dispatched after successful load. Detail: { src, html }
 * @fires include-file:error - Dispatched if fetch fails. Detail: { src, error }
 *
 * @example
 * <include-file src="/partials/header.html">
 *   <p>Loading...</p>
 * </include-file>
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

class IncludeFile extends VBElement {
  #observer;
  #abortController;
  /** @type {string | null} Saved original fallback content (captured once) */
  #fallbackHTML = null;
  #hasLoaded = false;

  setup() {
    // Guard: don't re-fetch on reconnect if already loaded
    if (this.#hasLoaded) return;

    const src = this.getAttribute('src');
    if (!src) return false;

    // Capture fallback content once before first load
    if (this.#fallbackHTML === null) {
      this.#fallbackHTML = this.innerHTML;
    }

    if (this.hasAttribute('lazy')) {
      this.#observeIntersection();
    } else {
      this.#load(src);
    }
  }

  teardown() {
    this.#observer?.disconnect();
    this.#abortController?.abort();
  }

  static get observedAttributes() {
    return ['src'];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'src' && newVal && oldVal !== newVal && this.isConnected) {
      // Honor lazy on src changes too — not just initial connect
      if (this.hasAttribute('lazy') && !this.#isInViewport()) {
        this.#observeIntersection();
      } else {
        this.#load(newVal);
      }
    }
  }

  #isInViewport() {
    const rect = this.getBoundingClientRect();
    return rect.top < window.innerHeight + 200 && rect.bottom > -200;
  }

  #observeIntersection() {
    this.#observer?.disconnect();
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
      const mode = this.getAttribute('mode') || 'replace';

      if (mode === 'replace') {
        this.innerHTML = html;
      } else if (mode === 'append') {
        this.insertAdjacentHTML('beforeend', html);
      } else if (mode === 'prepend') {
        this.insertAdjacentHTML('afterbegin', html);
      }

      // Re-execute inline scripts only when explicitly opted in
      if (this.hasAttribute('allow-scripts')) {
        this.querySelectorAll('script').forEach(oldScript => {
          const newScript = document.createElement('script');
          for (const attr of oldScript.attributes) {
            newScript.setAttribute(attr.name, attr.value);
          }
          newScript.textContent = oldScript.textContent;
          oldScript.replaceWith(newScript);
        });
      } else {
        // Strip scripts entirely when not trusted
        this.querySelectorAll('script').forEach(s => s.remove());
      }

      this.removeAttribute('data-loading');
      this.setAttribute('data-loaded', '');
      this.#hasLoaded = true;

      this.dispatchEvent(new CustomEvent('include-file:loaded', {
        bubbles: true,
        detail: { src, html }
      }));
    } catch (err) {
      if (err.name === 'AbortError') return;

      this.removeAttribute('data-loading');
      this.setAttribute('data-error', '');

      // Restore original fallback on error if available and mode is replace
      const mode = this.getAttribute('mode') || 'replace';
      if (mode === 'replace' && this.#fallbackHTML !== null && !this.#hasLoaded) {
        this.innerHTML = this.#fallbackHTML;
      }

      this.dispatchEvent(new CustomEvent('include-file:error', {
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

registerComponent('include-file', IncludeFile);

export { IncludeFile };
