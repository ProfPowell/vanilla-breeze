/**
 * highlight-wc — Text highlighting action for selection-menu
 *
 * When inside a <selection-menu>, renders as an icon button with a
 * color palette popover that drops below the toolbar on click.
 * When standalone, wraps content with data-highlights.
 *
 * @attr {string} for         - ID of element to annotate (standalone mode)
 * @attr {string} colors      - Comma-separated color names
 * @attr {boolean} readonly   - Disable new highlights
 * @attr {string} storage-key - Custom localStorage key suffix
 */
import { VBElement } from '../../lib/vb-element.js';
import { registerComponent } from '../../lib/bundle-registry.js';
import { initHighlights } from '../../utils/highlights-init.js';

const DEFAULT_COLORS = ['yellow', 'green', 'blue', 'pink'];

class HighlightWC extends VBElement {
  #controller = null;
  #lastColor = 'yellow';
  #inSelectionMenu = false;
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
    this.#palette?.remove();
    this.#palette = null;
  }

  // --- Selection menu child mode ---

  #setupAsAction() {
    const colors = this.#getColors();

    // Icon button
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Highlight selection');
    const icon = document.createElement('icon-wc');
    icon.setAttribute('name', 'highlighter');
    icon.setAttribute('size', 'sm');
    icon.setAttribute('aria-hidden', 'true');
    btn.appendChild(icon);
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.#togglePalette();
    });
    this.appendChild(btn);

    // Color palette — absolute dropdown BELOW the toolbar
    this.#palette = document.createElement('div');
    this.#palette.className = 'highlight-color-dropdown';
    this.#palette.setAttribute('role', 'group');
    this.#palette.setAttribute('aria-label', 'Highlight color');
    this.#palette.hidden = true;

    colors.forEach(color => {
      const swatch = document.createElement('button');
      swatch.type = 'button';
      swatch.className = 'highlight-color-swatch';
      swatch.dataset.color = color;
      swatch.setAttribute('aria-label', `${color}`);
      swatch.setAttribute('aria-pressed', color === this.#lastColor ? 'true' : 'false');
      swatch.style.backgroundColor = `var(--highlight-${color})`;
      swatch.addEventListener('click', (e) => {
        e.stopPropagation();
        this.#lastColor = color;
        this.#palette.querySelectorAll('.highlight-color-swatch').forEach(s =>
          s.setAttribute('aria-pressed', s.dataset.color === color ? 'true' : 'false')
        );
        this.#palette.hidden = true;
        this.#applyHighlight();
      });
      this.#palette.appendChild(swatch);
    });

    this.appendChild(this.#palette);
  }

  #togglePalette() {
    if (!this.#palette) return;
    this.#palette.hidden = !this.#palette.hidden;
  }

  #applyHighlight() {
    const menu = this.closest('selection-menu');
    if (!menu) return;
    const sel = menu.getSelection();
    if (!sel) return;

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
