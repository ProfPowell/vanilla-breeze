/**
 * brand-mark — Web component for brand/logo display with dark/light switching.
 *
 * Progressive enhancement: without JS, text content always renders.
 * With JS: injects <img> from src, auto-switches between src and src-dark
 * based on color mode, and supports responsive compact logos.
 *
 * Attributes:
 *   src         — URL to logo image (light mode or default)
 *   src-dark    — URL to dark-mode logo (auto-switches with color mode)
 *   src-compact — URL to compact/icon logo for narrow contexts
 *   alt         — Alt text for image (defaults to text content)
 *   wordmark    — Boolean; show text alongside image
 *   height      — Explicit pixel height for the image
 */
import { VBElement } from '../../lib/vb-element.js';
import { registerComponent } from '../../lib/bundle-registry.js';

class BrandMark extends VBElement {
  static observedAttributes = ['src', 'src-dark', 'src-compact', 'alt', 'wordmark', 'height'];

  /** @type {string} */
  #originalText = '';
  /** @type {MediaQueryList|null} */
  #darkMql = null;
  /** @type {MutationObserver|null} */
  #modeObserver = null;

  setup() {
    // Cache original text before any render
    this.#originalText = this.#readTextContent();

    // Observe dark mode changes if src-dark is provided
    if (this.hasAttribute('src-dark')) {
      this.#watchColorMode();
    }

    this.#render();
  }

  teardown() {
    this.#darkMql?.removeEventListener('change', this.#onModeChange);
    this.#darkMql = null;
    this.#modeObserver?.disconnect();
    this.#modeObserver = null;
  }

  attributeChangedCallback(_name, oldVal, newVal) {
    if (oldVal === newVal) return;
    if (!this.isConnected || !this.hasAttribute('data-upgraded')) return;

    // Start/stop color mode watching if src-dark changes
    if (_name === 'src-dark') {
      if (newVal) this.#watchColorMode();
      else {
        this.#darkMql?.removeEventListener('change', this.#onModeChange);
        this.#modeObserver?.disconnect();
      }
    }

    this.#render();
  }

  /** Determine if dark mode is active */
  #isDark() {
    // Explicit data-mode on root takes priority
    const mode = document.documentElement.getAttribute('data-mode');
    if (mode === 'dark') return true;
    if (mode === 'light') return false;
    // Fall back to system preference
    return this.#darkMql?.matches ?? false;
  }

  /** Watch for color mode changes */
  #watchColorMode() {
    // System preference
    if (!this.#darkMql) {
      this.#darkMql = matchMedia('(prefers-color-scheme: dark)');
      this.#darkMql.addEventListener('change', this.#onModeChange);
    }

    // data-mode attribute changes on <html>
    if (!this.#modeObserver) {
      this.#modeObserver = new MutationObserver(this.#onModeChange);
      this.#modeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-mode'],
      });
    }
  }

  /** @type {EventListener} */
  #onModeChange = () => {
    if (this.isConnected) this.#render();
  };

  #render() {
    const srcLight = this.getAttribute('src');
    const srcDark = this.getAttribute('src-dark');

    // Resolve current src based on color mode
    const src = (srcDark && this.#isDark()) ? srcDark : srcLight;

    if (!src) {
      // No src — restore text-only mode
      if (this.#originalText && this.querySelector('img')) {
        this.replaceChildren(document.createTextNode(this.#originalText));
        this.removeAttribute('aria-label');
      }
      return;
    }

    const brandName = this.#originalText || this.getAttribute('alt') || '';
    const showWordmark = this.hasAttribute('wordmark');
    const height = this.getAttribute('height');

    // Avoid re-rendering if already correct
    const existing = this.querySelector('img');
    if (existing?.getAttribute('src') === src) {
      // Image matches — just check wordmark state
      const existingSpan = this.querySelector('.brand-mark-wordmark');
      if (showWordmark && !existingSpan) {
        const span = document.createElement('span');
        span.className = 'brand-mark-wordmark';
        span.textContent = brandName;
        this.appendChild(span);
      } else if (!showWordmark && existingSpan) {
        existingSpan.remove();
      }
      return;
    }

    const img = document.createElement('img');
    img.src = src;
    img.alt = showWordmark ? '' : brandName;
    img.decoding = 'async';
    if (height) img.height = parseInt(height, 10);

    if (showWordmark) {
      const span = document.createElement('span');
      span.className = 'brand-mark-wordmark';
      span.textContent = brandName;
      this.replaceChildren(img, span);
    } else {
      this.replaceChildren(img);
      if (!this.getAttribute('alt')) {
        this.setAttribute('aria-label', brandName);
      }
    }
  }

  /** Read text content from child nodes, ignoring img elements */
  #readTextContent() {
    let text = '';
    for (const node of this.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent;
      } else if (node.nodeType === Node.ELEMENT_NODE && /** @type {Element} */ (node).tagName !== 'IMG') {
        text += node.textContent;
      }
    }
    return text.trim();
  }
}

registerComponent('brand-mark', BrandMark);
