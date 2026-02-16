/**
 * CanvasInteraction — pointer-based drag-to-move for grid blocks.
 *
 * Follows the geo-map/interact.js pattern:
 * constructor(canvas, statusEl) / destroy().
 */

import { BLOCK_SELECTOR } from './serialize.js';

export class CanvasInteraction {
  #canvas;
  #statusEl;
  #dragging = false;
  #target = null;
  #startCol;
  #startRow;
  #startX;
  #startY;
  #colWidth;
  #rowHeight;

  /**
   * @param {HTMLElement} canvas  - The vb-canvas element
   * @param {HTMLElement} statusEl - aria-live region for announcements
   */
  constructor(canvas, statusEl) {
    this.#canvas = canvas;
    this.#statusEl = statusEl;
    this.#canvas.addEventListener('pointerdown', this.#onPointerDown);
  }

  destroy() {
    this.#canvas.removeEventListener('pointerdown', this.#onPointerDown);
    // Clean up in case we're mid-drag
    if (this.#target) {
      this.#target.removeEventListener('pointermove', this.#onPointerMove);
      this.#target.removeEventListener('pointerup', this.#onPointerUp);
    }
  }

  // --- Pointer handlers (arrow functions for stable `this`) ---

  #onPointerDown = (e) => {
    if (e.button !== 0) return;

    // Don't drag on handles (future resize) or non-block targets
    if (e.target.localName === 'vb-block-handle') return;

    const selectorNoScope = BLOCK_SELECTOR.replace(':scope > ', '');
    const block = e.target.closest(selectorNoScope);
    if (!block || block.parentElement !== this.#canvas) return;

    this.#dragging = true;
    this.#target = block;
    block.setPointerCapture(e.pointerId);
    block.style.cursor = 'grabbing';

    // Cache grid measurements
    const canvasRect = this.#canvas.getBoundingClientRect();
    const cs = getComputedStyle(this.#canvas);
    const padL = parseFloat(cs.paddingLeft) || 0;
    const padR = parseFloat(cs.paddingRight) || 0;
    const cols = parseInt(cs.getPropertyValue('--cols'), 10) || 12;
    const gapPx = parseFloat(cs.getPropertyValue('gap')) || parseFloat(cs.getPropertyValue('--gap')) || 16;
    const contentW = canvasRect.width - padL - padR;
    this.#colWidth = (contentW - (cols - 1) * gapPx) / cols;

    const padT = parseFloat(cs.paddingTop) || 0;
    const rowPx = parseFloat(cs.getPropertyValue('--row-size')) || 48;
    this.#rowHeight = rowPx + gapPx;

    this.#startCol = parseInt(block.style.getPropertyValue('--col'), 10) || 1;
    this.#startRow = parseInt(block.style.getPropertyValue('--row'), 10) || 1;
    this.#startX = e.clientX;
    this.#startY = e.clientY;

    block.addEventListener('pointermove', this.#onPointerMove);
    block.addEventListener('pointerup', this.#onPointerUp);
  };

  #onPointerMove = (e) => {
    if (!this.#dragging) return;

    const dx = e.clientX - this.#startX;
    const dy = e.clientY - this.#startY;
    const deltaCols = Math.round(dx / (this.#colWidth + (parseFloat(getComputedStyle(this.#canvas).getPropertyValue('gap')) || 16)));
    const deltaRows = Math.round(dy / this.#rowHeight);

    const cs = getComputedStyle(this.#canvas);
    const cols = parseInt(cs.getPropertyValue('--cols'), 10) || 12;
    const cspan = parseInt(this.#target.style.getPropertyValue('--cspan'), 10) || 12;
    const rspan = parseInt(this.#target.style.getPropertyValue('--rspan'), 10) || 2;

    const newCol = Math.max(1, Math.min(cols - cspan + 1, this.#startCol + deltaCols));
    const newRow = Math.max(1, this.#startRow + deltaRows);

    this.#target.style.setProperty('--col', newCol);
    this.#target.style.setProperty('--row', newRow);
  };

  #onPointerUp = (e) => {
    if (!this.#target) return;

    this.#target.releasePointerCapture(e.pointerId);
    this.#target.style.cursor = '';
    this.#target.removeEventListener('pointermove', this.#onPointerMove);
    this.#target.removeEventListener('pointerup', this.#onPointerUp);

    // Announce the move
    const tag = this.#target.localName;
    const col = this.#target.style.getPropertyValue('--col');
    const row = this.#target.style.getPropertyValue('--row');
    this.#announce(`${tag} moved to column ${col}, row ${row}`);

    this.#dragging = false;
    this.#target = null;
  };

  #announce(msg) {
    if (this.#statusEl) {
      this.#statusEl.textContent = msg;
    }
  }
}
