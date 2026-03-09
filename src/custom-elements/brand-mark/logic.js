/**
 * brand-mark — Progressive enhancement for image logo support.
 *
 * Without JS: <brand-mark src="logo.svg">Acme</brand-mark> renders as text only.
 * With JS: An <img> is injected from the src attribute.
 *
 * Attributes:
 *   src      — URL to logo image (SVG preferred)
 *   alt      — Alt text for image (defaults to text content)
 *   wordmark — Boolean; show text alongside image
 *   height   — Explicit pixel height for the image
 */
class BrandMark extends HTMLElement {
  static observedAttributes = ['src', 'alt', 'wordmark', 'height'];

  connectedCallback() {
    // Cache original text before any render can wipe it
    if (!this._originalText) {
      this._originalText = this._readTextContent();
    }
    this._render();
  }

  attributeChangedCallback() {
    if (this.isConnected) this._render();
  }

  _render() {
    const src = this.getAttribute('src');
    if (!src) {
      // No src — restore text-only mode if we previously rendered an image
      if (this._originalText && this.querySelector('img')) {
        this.replaceChildren(document.createTextNode(this._originalText));
        this.removeAttribute('aria-label');
      }
      return;
    }

    const brandName = this._originalText || this.getAttribute('alt') || '';
    const showWordmark = this.hasAttribute('wordmark');
    const height = this.getAttribute('height');

    // Avoid re-rendering if already correct
    const existing = this.querySelector('img');
    const existingSpan = this.querySelector('.brand-mark-wordmark');
    if (existing?.getAttribute('src') === src) {
      // Image matches — just check wordmark state
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
  _readTextContent() {
    let text = '';
    for (const node of this.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent;
      } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName !== 'IMG') {
        text += node.textContent;
      }
    }
    return text.trim();
  }
}

customElements.define('brand-mark', BrandMark);
