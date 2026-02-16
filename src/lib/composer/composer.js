/**
 * <vb-composer> — App shell and entry point for the grid composer.
 *
 * Single import from the Astro page / demo HTML.
 * Orchestrates canvas, inspector, interaction, and code output.
 */

import { VbCanvas } from './canvas.js';
import { VbInspector } from './inspector.js';
import { CanvasInteraction } from './interaction.js';
import { serialize } from './serialize.js';
import { exportPlacementVars, exportNamedAreas } from './export.js';
import { TEMPLATES } from './templates.js';

class VbComposer extends HTMLElement {
  #interaction = null;
  #canvas = null;
  #outHtml = null;
  #outCss = null;
  #statusEl = null;
  #exportMode = 'vars'; // 'vars' | 'areas'

  connectedCallback() {
    this.#canvas   = this.querySelector('vb-canvas');
    this.#outHtml  = this.querySelector('#out-html');
    this.#outCss   = this.querySelector('#out-css');
    this.#statusEl = this.querySelector('[aria-live]');

    if (!this.#canvas) return;

    // Interaction (drag-to-move)
    this.#interaction = new CanvasInteraction(this.#canvas, this.#statusEl);

    // Wireframe toggle
    const wfToggle = this.querySelector('[data-action="wireframe"]');
    wfToggle?.addEventListener('change', this.#onWireframeToggle);

    // Column overlay toggle
    const colToggle = this.querySelector('[data-action="show-columns"]');
    colToggle?.addEventListener('change', this.#onColumnsToggle);

    // Grid settings (cols, gap, row-size)
    const settingsFieldset = this.querySelector('.grid-settings');
    settingsFieldset?.addEventListener('input', this.#onGridSettingsInput);

    // Template select
    const templateSelect = this.querySelector('[data-action="load-template"]');
    templateSelect?.addEventListener('change', this.#onTemplateSelect);

    // Add-block palette
    this.addEventListener('click', this.#onPaletteClick);

    // Export mode toggle
    const radios = this.querySelectorAll('[name="export-mode"]');
    for (const r of radios) {
      r.addEventListener('change', this.#onExportModeChange);
      if (r.checked) this.#exportMode = r.value;
    }

    // Canvas change → update code output
    this.addEventListener('composer:change', this.#updateOutput);

    // Keyboard shortcuts on the canvas
    this.#canvas.addEventListener('keydown', this.#onCanvasKeydown);

    // Initial output
    this.#updateOutput();
  }

  disconnectedCallback() {
    this.#interaction?.destroy();
    this.removeEventListener('composer:change', this.#updateOutput);
    this.removeEventListener('click', this.#onPaletteClick);
  }

  // --- Wireframe ---

  #onWireframeToggle = (e) => {
    if (e.target.checked) {
      this.#canvas.setAttribute('data-wireframe', '');
    } else {
      this.#canvas.removeAttribute('data-wireframe');
    }
  };

  // --- Column overlay ---

  #onColumnsToggle = (e) => {
    if (e.target.checked) {
      this.#canvas.setAttribute('data-show-columns', '');
    } else {
      this.#canvas.removeAttribute('data-show-columns');
    }
  };

  // --- Grid settings ---

  #onGridSettingsInput = (e) => {
    const input = e.target;
    if (!input.name) return;

    switch (input.name) {
      case 'cols':
        this.#canvas.style.setProperty('--cols', Math.max(1, Math.min(24, +input.value)));
        break;
      case 'gap':
        this.#canvas.style.setProperty('--gap', input.value);
        break;
      case 'row-size':
        this.#canvas.style.setProperty('--row-size', input.value);
        break;
    }
  };

  // --- Template loading ---

  #onTemplateSelect = (e) => {
    const id = e.target.value;
    if (!id || !TEMPLATES[id]) return;

    if (!confirm('Replace current layout with template?')) {
      e.target.value = '';
      return;
    }

    this.#canvas.loadTemplate(TEMPLATES[id]);

    // Sync toolbar grid controls with template values
    const grid = TEMPLATES[id].grid;
    const colsInput = this.querySelector('.grid-settings [name="cols"]');
    const gapInput = this.querySelector('.grid-settings [name="gap"]');
    const rowInput = this.querySelector('.grid-settings [name="row-size"]');
    if (colsInput) colsInput.value = grid.cols;
    if (gapInput) gapInput.value = grid.gap;
    if (rowInput) rowInput.value = grid.rowSize;

    // Reset select to placeholder
    e.target.value = '';
    this.#announce(`Loaded ${TEMPLATES[id].name} template`);
  };

  // --- Add block palette ---

  #onPaletteClick = (e) => {
    const btn = e.target.closest('[data-action="add"]');
    if (!btn) return;

    const tag = btn.dataset.tag;
    if (!tag) return;

    // Find the next free row (below existing blocks)
    const blocks = this.#canvas.querySelectorAll(':scope > *:not(vb-block-handle)');
    let maxRow = 0;
    for (const b of blocks) {
      const r = parseInt(b.style.getPropertyValue('--row'), 10) || 1;
      const rs = parseInt(b.style.getPropertyValue('--rspan'), 10) || 2;
      maxRow = Math.max(maxRow, r + rs);
    }
    const newRow = maxRow > 0 ? maxRow : 1;

    const el = this.#canvas.addBlock(tag, 1, 12, newRow, 2);
    this.#canvas.select(el);
    this.#announce(`Added ${tag} at row ${newRow}`);
  };

  // --- Export mode ---

  #onExportModeChange = (e) => {
    this.#exportMode = e.target.value;
    this.#updateOutput();
  };

  // --- Code output ---

  #updateOutput = () => {
    if (!this.#canvas || !this.#outHtml || !this.#outCss) return;

    const data = serialize(this.#canvas);
    const { html, css } = this.#exportMode === 'areas'
      ? exportNamedAreas(data)
      : exportPlacementVars(data);

    this.#outHtml.textContent = html;
    this.#outCss.textContent = css;
  };

  // --- Keyboard ---

  #onCanvasKeydown = (e) => {
    const block = this.#canvas.selected;
    if (!block) return;

    const cols = parseInt(getComputedStyle(this.#canvas).getPropertyValue('--cols'), 10) || 12;
    const shift = e.shiftKey;
    let handled = true;

    switch (e.key) {
      case 'ArrowLeft':
        if (shift) {
          this.#adjustSpan(block, 'cspan', -1, cols);
        } else {
          this.#adjustPos(block, 'col', -1, cols);
        }
        break;
      case 'ArrowRight':
        if (shift) {
          this.#adjustSpan(block, 'cspan', 1, cols);
        } else {
          this.#adjustPos(block, 'col', 1, cols);
        }
        break;
      case 'ArrowUp':
        if (shift) {
          this.#adjustSpan(block, 'rspan', -1);
        } else {
          this.#adjustPos(block, 'row', -1);
        }
        break;
      case 'ArrowDown':
        if (shift) {
          this.#adjustSpan(block, 'rspan', 1);
        } else {
          this.#adjustPos(block, 'row', 1);
        }
        break;
      case 'Delete':
      case 'Backspace':
        this.#canvas.removeBlock(block);
        this.#announce(`Deleted ${block.localName}`);
        break;
      default:
        handled = false;
    }

    if (handled) e.preventDefault();
  };

  #adjustPos(block, prop, delta, maxCols) {
    const cur = parseInt(block.style.getPropertyValue(`--${prop}`), 10) || 1;
    let newVal = cur + delta;

    if (prop === 'col') {
      const cspan = parseInt(block.style.getPropertyValue('--cspan'), 10) || 12;
      newVal = Math.max(1, Math.min(maxCols - cspan + 1, newVal));
    } else {
      newVal = Math.max(1, newVal);
    }

    block.style.setProperty(`--${prop}`, newVal);
    this.#announce(`${block.localName} ${prop} ${newVal}`);
  }

  #adjustSpan(block, prop, delta, maxCols) {
    const cur = parseInt(block.style.getPropertyValue(`--${prop}`), 10) || 2;
    let newVal = Math.max(1, cur + delta);

    if (prop === 'cspan') {
      const col = parseInt(block.style.getPropertyValue('--col'), 10) || 1;
      newVal = Math.min(newVal, maxCols - col + 1);
    }

    block.style.setProperty(`--${prop}`, newVal);
    this.#announce(`${block.localName} ${prop} ${newVal}`);
  }

  #announce(msg) {
    if (this.#statusEl) {
      this.#statusEl.textContent = msg;
    }
  }
}

if (!customElements.get('vb-composer')) {
  customElements.define('vb-composer', VbComposer);
}

export { VbComposer };
