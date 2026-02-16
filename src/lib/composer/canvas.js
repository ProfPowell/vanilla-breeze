/**
 * <vb-canvas> — Grid surface for the composer.
 *
 * Renders a CSS Grid, manages block selection, injects wireframe
 * labels, and dispatches composer:change / composer:select events.
 */

import { BLOCK_SELECTOR } from './serialize.js';

// Minimal handle element — behaviour comes from CSS + interaction module
if (!customElements.get('vb-block-handle')) {
  customElements.define('vb-block-handle', class extends HTMLElement {});
}

class VbCanvas extends HTMLElement {
  #observer = null;
  #rafPending = false;
  #selected = null;

  connectedCallback() {
    this.addEventListener('click', this.#onClick);
    this.addEventListener('keydown', this.#onKeydown);

    // Observe attribute + child mutations to fire composer:change
    this.#observer = new MutationObserver(() => this.#scheduleChange());
    this.#observer.observe(this, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'data-subgrid'],
    });

    // Set up blocks already in the DOM
    this.#prepareBlocks();
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.#onClick);
    this.removeEventListener('keydown', this.#onKeydown);
    this.#observer?.disconnect();
  }

  /** The currently selected block element, or null. */
  get selected() { return this.#selected; }

  /** Select a block programmatically. */
  select(el) {
    if (this.#selected === el) return;
    this.#selected?.removeAttribute('data-selected');
    this.#selected = el;
    if (el) {
      el.setAttribute('data-selected', '');
      el.focus();
    }
    this.dispatchEvent(new CustomEvent('composer:select', {
      bubbles: true,
      detail: { block: el },
    }));
  }

  /** Deselect any selected block. */
  deselect() { this.select(null); }

  /** Prepare every semantic block (label + tabindex). */
  #prepareBlocks() {
    for (const block of this.querySelectorAll(BLOCK_SELECTOR)) {
      this.#prepareBlock(block);
    }
  }

  #prepareBlock(el) {
    el.setAttribute('tabindex', '0');
    if (!el.hasAttribute('data-vb-label')) {
      el.setAttribute('data-vb-label', el.localName);
    }
  }

  /** Add a new block to the canvas. */
  addBlock(tag, col = 1, cspan = 12, row = 1, rspan = 2) {
    const el = document.createElement(tag);
    el.style.setProperty('--col', col);
    el.style.setProperty('--cspan', cspan);
    el.style.setProperty('--row', row);
    el.style.setProperty('--rspan', rspan);
    this.#prepareBlock(el);
    this.appendChild(el);
    return el;
  }

  /** Remove a block from the canvas. */
  removeBlock(el) {
    if (this.#selected === el) this.deselect();
    el.remove();
  }

  // --- Events ---

  #onClick = (e) => {
    const block = e.target.closest(BLOCK_SELECTOR.replace(':scope > ', ''));
    if (block && block.parentElement === this) {
      this.select(block);
    } else if (e.target === this) {
      this.deselect();
    }
  };

  #onKeydown = (e) => {
    if (e.key === 'Escape') {
      this.deselect();
    }
  };

  #scheduleChange() {
    if (this.#rafPending) return;
    this.#rafPending = true;
    requestAnimationFrame(() => {
      this.#rafPending = false;
      this.dispatchEvent(new CustomEvent('composer:change', { bubbles: true }));
    });
  }
}

if (!customElements.get('vb-canvas')) {
  customElements.define('vb-canvas', VbCanvas);
}

export { VbCanvas };
