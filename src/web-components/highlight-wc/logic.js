/**
 * highlight-wc — Text highlighting action for selection-menu
 *
 * When inside a <selection-menu>, renders as an icon button. Clicking
 * the icon applies the last-used color. A small color palette toggles
 * open on a second click or long-press.
 *
 * When standalone, wraps content with data-highlights.
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
  #paletteVisible = false;
  #palette = null;

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
    this.#palette = null;
  }

  // --- Selection menu child mode ---

  #setupAsAction() {
    const colors = this.#getColors();

    // Main highlight button — click applies last color
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'highlight-action';
    btn.setAttribute('aria-label', 'Highlight selection');
    const icon = document.createElement('icon-wc');
    icon.setAttribute('name', 'highlighter');
    icon.setAttribute('size', 'sm');
    icon.setAttribute('aria-hidden', 'true');
    btn.appendChild(icon);

    // Click: apply with last color. If already highlighted, toggle palette.
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.#paletteVisible) {
        this.#hidePalette();
        this.#applyHighlight();
      } else {
        this.#showPalette();
      }
    });

    this.appendChild(btn);

    // Color palette — hidden by default, shown on highlighter click
    this.#palette = document.createElement('span');
    this.#palette.className = 'selection-menu-colors';
    this.#palette.setAttribute('role', 'group');
    this.#palette.setAttribute('aria-label', 'Highlight color');
    this.#palette.hidden = true;

    colors.forEach(color => {
      const swatch = document.createElement('button');
      swatch.type = 'button';
      swatch.className = 'selection-menu-color';
      swatch.dataset.color = color;
      swatch.setAttribute('aria-label', `${color} highlight`);
      swatch.setAttribute('aria-pressed', color === this.#lastColor ? 'true' : 'false');
      swatch.style.backgroundColor = `var(--highlight-${color})`;
      swatch.addEventListener('click', (e) => {
        e.stopPropagation();
        this.#lastColor = color;
        this.#palette.querySelectorAll('.selection-menu-color').forEach(s =>
          s.setAttribute('aria-pressed', s.dataset.color === color ? 'true' : 'false')
        );
        this.#hidePalette();
        this.#applyHighlight();
      });
      this.#palette.appendChild(swatch);
    });

    this.appendChild(this.#palette);
  }

  #showPalette() {
    if (!this.#palette) return;
    this.#palette.hidden = false;
    this.#paletteVisible = true;
  }

  #hidePalette() {
    if (!this.#palette) return;
    this.#palette.hidden = true;
    this.#paletteVisible = false;
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
