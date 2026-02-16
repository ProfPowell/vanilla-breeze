/**
 * CanvasInteraction — pointer-based drag-to-move and resize for grid blocks.
 *
 * Follows the geo-map/interact.js pattern:
 * constructor(canvas, statusEl) / destroy().
 */

import { BLOCK_SELECTOR } from './serialize.js';

/** Tag set for fast membership checks. */
const BLOCK_TAG_SET = new Set([
  'header', 'main', 'aside', 'footer',
  'section', 'article', 'nav', 'figure', 'form',
]);

export class CanvasInteraction {
  #canvas;
  #statusEl;
  #dragging = false;
  #target = null;
  #mode = 'move'; // 'move' | 'resize'
  #resizeDir = null; // 'e' | 's' | 'se'
  #startCol;
  #startRow;
  #startCspan;
  #startRspan;
  #startX;
  #startY;
  #colWidth;
  #rowHeight;
  #gapPx;
  #cols;
  #dropZone = null;

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

  // --- Shared: cache grid measurements ---

  #cacheGrid() {
    const canvasRect = this.#canvas.getBoundingClientRect();
    const cs = getComputedStyle(this.#canvas);
    const padL = parseFloat(cs.paddingLeft) || 0;
    const padR = parseFloat(cs.paddingRight) || 0;
    this.#cols = parseInt(cs.getPropertyValue('--cols'), 10) || 12;
    this.#gapPx = parseFloat(cs.getPropertyValue('gap')) || parseFloat(cs.getPropertyValue('--gap')) || 16;
    const contentW = canvasRect.width - padL - padR;
    this.#colWidth = (contentW - (this.#cols - 1) * this.#gapPx) / this.#cols;

    const rowPx = parseFloat(cs.getPropertyValue('--row-size')) || 48;
    this.#rowHeight = rowPx + this.#gapPx;
  }

  // --- Drop zone detection ---

  /**
   * Check if the cursor is over a valid drop target for nesting.
   * Returns the target element or null.
   */
  #findDropZone(e) {
    const els = document.elementsFromPoint(e.clientX, e.clientY);
    for (const el of els) {
      // Skip the dragged block itself, its children, and non-block elements
      if (el === this.#target) continue;
      if (this.#target.contains(el)) continue;
      if (!BLOCK_TAG_SET.has(el.localName)) continue;
      if (!this.#canvas.contains(el)) continue;

      // Prevent circular nesting: container must not be a descendant of dragged block
      if (el.contains(this.#target)) continue;

      // Don't nest into self's parent if already nested there
      if (el === this.#target.parentElement) continue;

      return el;
    }
    return null;
  }

  #updateDropZone(e) {
    const zone = this.#findDropZone(e);

    if (zone !== this.#dropZone) {
      this.#dropZone?.removeAttribute('data-drop-zone');
      this.#dropZone = zone;
      this.#dropZone?.setAttribute('data-drop-zone', '');
    }
  }

  #clearDropZone() {
    this.#dropZone?.removeAttribute('data-drop-zone');
    this.#dropZone = null;
  }

  // --- Pointer handlers (arrow functions for stable `this`) ---

  #onPointerDown = (e) => {
    if (e.button !== 0) return;

    // Check if clicking a resize handle
    if (e.target.localName === 'vb-block-handle') {
      const block = e.target.closest(
        ':is(header, main, aside, footer, section, article, nav, figure, form)'
      );
      if (!block || !this.#canvas.contains(block)) return;

      this.#mode = 'resize';
      this.#resizeDir = e.target.dataset.dir;
      this.#target = block;
      block.setPointerCapture(e.pointerId);

      this.#cacheGrid();
      this.#startCol = parseInt(block.style.getPropertyValue('--col'), 10) || 1;
      this.#startRow = parseInt(block.style.getPropertyValue('--row'), 10) || 1;
      this.#startCspan = parseInt(block.style.getPropertyValue('--cspan'), 10) || 12;
      this.#startRspan = parseInt(block.style.getPropertyValue('--rspan'), 10) || 2;
      this.#startX = e.clientX;
      this.#startY = e.clientY;
      this.#dragging = true;

      block.addEventListener('pointermove', this.#onPointerMove);
      block.addEventListener('pointerup', this.#onPointerUp);
      return;
    }

    // Move mode — find block at any depth
    const block = e.target.closest(
      ':is(header, main, aside, footer, section, article, nav, figure, form)'
    );
    if (!block || !this.#canvas.contains(block) || !BLOCK_TAG_SET.has(block.localName)) return;

    this.#mode = 'move';
    this.#dragging = true;
    this.#target = block;
    block.setPointerCapture(e.pointerId);
    block.style.cursor = 'grabbing';

    this.#cacheGrid();
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
    const deltaCols = Math.round(dx / (this.#colWidth + this.#gapPx));
    const deltaRows = Math.round(dy / this.#rowHeight);

    if (this.#mode === 'resize') {
      const dir = this.#resizeDir;
      if (dir === 'e' || dir === 'se') {
        const maxCspan = this.#cols - this.#startCol + 1;
        const newCspan = Math.max(1, Math.min(maxCspan, this.#startCspan + deltaCols));
        this.#target.style.setProperty('--cspan', newCspan);
      }
      if (dir === 's' || dir === 'se') {
        const newRspan = Math.max(1, this.#startRspan + deltaRows);
        this.#target.style.setProperty('--rspan', newRspan);
      }
    } else {
      const cspan = parseInt(this.#target.style.getPropertyValue('--cspan'), 10) || 12;
      const newCol = Math.max(1, Math.min(this.#cols - cspan + 1, this.#startCol + deltaCols));
      const newRow = Math.max(1, this.#startRow + deltaRows);
      this.#target.style.setProperty('--col', newCol);
      this.#target.style.setProperty('--row', newRow);

      // Update drop zone during move
      this.#updateDropZone(e);
    }
  };

  #onPointerUp = (e) => {
    if (!this.#target) return;

    this.#target.releasePointerCapture(e.pointerId);
    this.#target.style.cursor = '';
    this.#target.removeEventListener('pointermove', this.#onPointerMove);
    this.#target.removeEventListener('pointerup', this.#onPointerUp);

    const tag = this.#target.localName;

    if (this.#mode === 'move' && this.#dropZone) {
      // Nest into drop zone
      this.#dropZone.appendChild(this.#target);
      this.#dropZone.setAttribute('data-subgrid', '');
      this.#target.style.setProperty('--col', 1);
      this.#target.style.setProperty('--row', 1);
      // Auto-size nested block to parent's span
      const parentCspan = parseInt(this.#dropZone.style.getPropertyValue('--cspan'), 10) || 12;
      this.#target.style.setProperty('--cspan', parentCspan);
      this.#announce(`Nested ${tag} into ${this.#dropZone.localName}`);
      this.#clearDropZone();
    } else if (this.#mode === 'move') {
      // Check if we should un-nest (block is nested and dragged significantly)
      const isNested = this.#target.parentElement !== this.#canvas;
      if (isNested) {
        const totalMovement = Math.abs(e.clientX - this.#startX) + Math.abs(e.clientY - this.#startY);
        // Un-nest if moved more than 1 grid cell worth of distance
        if (totalMovement > this.#colWidth + this.#gapPx) {
          this.#canvas.appendChild(this.#target);
          this.#announce(`Moved ${tag} to canvas`);
        } else {
          const col = this.#target.style.getPropertyValue('--col');
          const row = this.#target.style.getPropertyValue('--row');
          this.#announce(`${tag} moved to column ${col}, row ${row}`);
        }
      } else {
        const col = this.#target.style.getPropertyValue('--col');
        const row = this.#target.style.getPropertyValue('--row');
        this.#announce(`${tag} moved to column ${col}, row ${row}`);
      }
      this.#clearDropZone();
    } else {
      const cspan = this.#target.style.getPropertyValue('--cspan');
      const rspan = this.#target.style.getPropertyValue('--rspan');
      this.#announce(`${tag} resized to ${cspan} columns, ${rspan} rows`);
    }

    this.#dragging = false;
    this.#target = null;
    this.#mode = 'move';
    this.#resizeDir = null;
  };

  #announce(msg) {
    if (this.#statusEl) {
      this.#statusEl.textContent = msg;
    }
  }
}
