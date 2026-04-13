/**
 * highlight-wc — Text highlighting action for selection-menu
 *
 * When inside a <selection-menu>, renders as an icon button with a
 * color palette dropdown. When standalone, wraps content with
 * data-highlights.
 *
 * @attr {string} for         - ID of element to annotate (standalone mode)
 * @attr {string} colors      - Comma-separated color names (default: "yellow,green,blue,pink")
 * @attr {boolean} readonly   - Disable new highlights
 * @attr {string} storage-key - Custom localStorage key suffix
 */
import { VBElement } from '../../lib/vb-element.js';
import { registerComponent } from '../../lib/bundle-registry.js';
import { initHighlights } from '../../utils/highlights-init.js';

const DEFAULT_COLORS = ['yellow', 'green', 'blue', 'pink'];

class HighlightWC extends VBElement {
  /** @type {import('../../utils/highlights-init.js').HighlightController|null} */
  #controller = null;
  #lastColor = 'yellow';
  #inSelectionMenu = false;

  setup() {
    this.#inSelectionMenu = !!this.closest('selection-menu');

    if (this.#inSelectionMenu) {
      this.#setupAsAction();
    } else {
      this.#setupStandalone();
    }
  }

  teardown() {
    this.#controller?.destroy();
    this.#controller = null;
  }

  // --- Selection menu child mode ---

  #setupAsAction() {
    const colors = this.#getColors();

    // Main highlight button
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Highlight selection');
    btn.innerHTML = `<icon-wc name="highlighter" size="sm" aria-hidden="true"></icon-wc>`;
    btn.addEventListener('click', () => this.#applyHighlight());
    this.appendChild(btn);

    // Color palette (inline, small circles)
    const palette = document.createElement('span');
    palette.className = 'selection-menu-colors';
    palette.setAttribute('role', 'group');
    palette.setAttribute('aria-label', 'Highlight color');

    colors.forEach(color => {
      const swatch = document.createElement('button');
      swatch.type = 'button';
      swatch.className = 'selection-menu-color';
      swatch.dataset.color = color;
      swatch.setAttribute('aria-label', `${color} highlight`);
      swatch.setAttribute('aria-pressed', color === this.#lastColor ? 'true' : 'false');
      swatch.style.backgroundColor = `var(--highlight-${color})`;
      swatch.addEventListener('click', () => {
        this.#lastColor = color;
        palette.querySelectorAll('.selection-menu-color').forEach(s =>
          s.setAttribute('aria-pressed', s.dataset.color === color ? 'true' : 'false')
        );
        this.#applyHighlight();
      });
      palette.appendChild(swatch);
    });

    this.appendChild(palette);
  }

  #applyHighlight() {
    const menu = this.closest('selection-menu');
    if (!menu) return;

    const sel = menu.getSelection();
    if (!sel) return;

    // Ensure target has highlights initialized
    const target = sel.target;
    if (!target.hasAttribute('data-highlights-init')) {
      const storageKey = this.getAttribute('storage-key') || '';
      target.setAttribute('data-highlights', storageKey);
      if (this.hasAttribute('colors')) {
        target.setAttribute('data-highlights-colors', this.getAttribute('colors'));
      }
      this.#controller = initHighlights(target);
    } else if (!this.#controller) {
      this.#controller = initHighlights(target);
    }

    // Create the highlight
    this.#controller._createFromSelection(this.#lastColor);
    menu.dismiss();
  }

  // --- Standalone mode ---

  #setupStandalone() {
    const target = this.#resolveTarget();
    if (!target) return false;

    const storageKey = this.getAttribute('storage-key') || '';
    target.setAttribute('data-highlights', storageKey);

    if (this.hasAttribute('colors')) {
      target.setAttribute('data-highlights-colors', this.getAttribute('colors'));
    }
    if (this.hasAttribute('readonly')) {
      target.setAttribute('data-highlights-readonly', '');
    }

    this.#controller = initHighlights(target);
  }

  #resolveTarget() {
    const forId = this.getAttribute('for');
    if (forId) return document.getElementById(forId);
    return this.firstElementChild;
  }

  #getColors() {
    const attr = this.getAttribute('colors');
    return attr ? attr.split(',').map(c => c.trim()).filter(Boolean) : [...DEFAULT_COLORS];
  }

  // --- Public API ---
  getHighlights() { return this.#controller?.getHighlights() ?? []; }
  removeHighlight(id) { this.#controller?.removeHighlight(id); }
  clearAll() { this.#controller?.clearAll(); }
  exportHighlights() { return this.#controller?.exportHighlights() ?? '{"version":1,"highlights":[]}'; }
  importHighlights(json) { this.#controller?.importHighlights(json); }
}

registerComponent('highlight-wc', HighlightWC);
