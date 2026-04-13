/**
 * highlight-wc — Web component for Medium-style text annotation
 *
 * Wraps content or targets an element by ID, enabling text selection
 * highlighting with color swatches, private notes, and localStorage
 * persistence.
 *
 * @attr {string} for         - ID of element to annotate (defaults to first child)
 * @attr {string} colors      - Comma-separated color names (default: "yellow,green,blue,pink")
 * @attr {boolean} readonly   - Render stored highlights but disable new ones
 * @attr {string} storage-key - Custom localStorage key suffix
 *
 * @example Wrapping content
 * <highlight-wc>
 *   <article>
 *     <p>Selectable text here...</p>
 *   </article>
 * </highlight-wc>
 *
 * @example Targeting by ID
 * <highlight-wc for="my-article"></highlight-wc>
 * <article id="my-article">
 *   <p>Selectable text here...</p>
 * </article>
 */
import { VBElement } from '../../lib/vb-element.js';
import { registerComponent } from '../../lib/bundle-registry.js';
import { initHighlights } from '../../utils/highlights-init.js';

class HighlightWC extends VBElement {
  /** @type {import('../../utils/highlights-init.js').HighlightController|null} */
  #controller = null;

  setup() {
    const target = this.#resolveTarget();
    if (!target) return false; // defer — target not in DOM yet

    // Apply data-highlights attributes to the target
    const storageKey = this.getAttribute('storage-key') || '';
    target.setAttribute('data-highlights', storageKey);

    if (this.hasAttribute('colors')) {
      target.setAttribute('data-highlights-colors', this.getAttribute('colors'));
    }

    if (this.hasAttribute('readonly')) {
      target.setAttribute('data-highlights-readonly', '');
    }

    // Initialize the highlight controller
    this.#controller = initHighlights(target);
  }

  teardown() {
    this.#controller?.destroy();
    this.#controller = null;
  }

  /** Resolve the target element to annotate */
  #resolveTarget() {
    const forId = this.getAttribute('for');
    if (forId) {
      return document.getElementById(forId);
    }
    // Default: first element child
    return this.firstElementChild;
  }

  // --- Public API (delegated to controller) ---

  /** Get all highlights */
  getHighlights() {
    return this.#controller?.getHighlights() ?? [];
  }

  /** Remove a specific highlight by ID */
  removeHighlight(id) {
    this.#controller?.removeHighlight(id);
  }

  /** Clear all highlights */
  clearAll() {
    this.#controller?.clearAll();
  }

  /** Export highlights as JSON string */
  exportHighlights() {
    return this.#controller?.exportHighlights() ?? '{"version":1,"highlights":[]}';
  }

  /** Import highlights from JSON string */
  importHighlights(json) {
    this.#controller?.importHighlights(json);
  }
}

registerComponent('highlight-wc', HighlightWC);
