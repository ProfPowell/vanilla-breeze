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

/** Tag set for fast membership checks. */
const BLOCK_TAG_SET = new Set([
  'header', 'main', 'aside', 'footer',
  'section', 'article', 'nav', 'figure', 'form',
]);

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
    if (!el.querySelector('vb-block-handle')) {
      el.insertAdjacentHTML('beforeend',
        '<vb-block-handle data-dir="e"></vb-block-handle>' +
        '<vb-block-handle data-dir="s"></vb-block-handle>' +
        '<vb-block-handle data-dir="se"></vb-block-handle>'
      );
    }
  }

  /**
   * Add a new block to the canvas or to a parent subgrid container.
   * @param {string} tag - HTML tag name
   * @param {number} col - Starting column
   * @param {number} cspan - Column span
   * @param {number} row - Starting row
   * @param {number} rspan - Row span
   * @param {HTMLElement} [parent] - Optional parent element for nesting
   * @returns {HTMLElement} The created element
   */
  addBlock(tag, col = 1, cspan = 12, row = 1, rspan = 2, parent) {
    const el = document.createElement(tag);
    el.style.setProperty('--col', col);
    el.style.setProperty('--cspan', cspan);
    el.style.setProperty('--row', row);
    el.style.setProperty('--rspan', rspan);
    this.#prepareBlock(el);
    (parent || this).appendChild(el);
    return el;
  }

  /**
   * Remove a block from the canvas.
   * If the block is a subgrid parent, reparent its children to the canvas.
   */
  removeBlock(el) {
    if (this.#selected === el) this.deselect();

    // Reparent nested children back to canvas
    if (el.hasAttribute('data-subgrid')) {
      const children = [...el.querySelectorAll(BLOCK_SELECTOR)];
      for (const child of children) {
        this.appendChild(child);
      }
    }

    el.remove();
  }

  /**
   * Load a template — clear canvas, set grid props, recursively create blocks.
   * @param {{ grid: object, blocks: object[] }} template
   */
  loadTemplate(template) {
    // Clear existing blocks
    const existing = [...this.querySelectorAll(BLOCK_SELECTOR)];
    for (const el of existing) el.remove();

    // Set grid properties
    const { grid, blocks } = template;
    if (grid.cols) this.style.setProperty('--cols', grid.cols);
    if (grid.gap) this.style.setProperty('--gap', grid.gap);
    if (grid.rowSize) this.style.setProperty('--row-size', grid.rowSize);
    if (grid.maxWidth) this.style.setProperty('--max-w', grid.maxWidth);

    // Recursively create blocks
    const createBlocks = (blockList, parent) => {
      for (const b of blockList) {
        const el = this.addBlock(b.tag, b.col, b.cspan, b.row, b.rspan, parent);
        if (b.subgrid) el.setAttribute('data-subgrid', '');
        if (b.children?.length) {
          el.setAttribute('data-subgrid', '');
          createBlocks(b.children, el);
        }
      }
    };
    createBlocks(blocks);

    this.deselect();
  }

  // --- Events ---

  #onClick = (e) => {
    // Find the closest block at any depth
    const block = e.target.closest(
      ':is(header, main, aside, footer, section, article, nav, figure, form)'
    );
    if (block && this.contains(block) && BLOCK_TAG_SET.has(block.localName)) {
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
