/**
 * markdown-editor: Side-by-side markdown editor with live preview
 *
 * Composes a <textarea> with a <markdown-viewer> in a split layout.
 * Does not re-bundle the viewer — imports it as a peer component.
 * Emits standard input/change events on the textarea.
 *
 * Progressive enhancement: without JS, the <textarea> is fully usable.
 * The preview pane appears only after the component upgrades.
 *
 * @attr {string}  name        - Form field name (reflected to textarea)
 * @attr {string}  placeholder - Textarea placeholder text
 * @attr {number}  rows        - Textarea rows (default: 10)
 * @attr {boolean} highlight   - Pass through to markdown-viewer for code highlighting
 * @attr {string}  data-theme  - Theme propagated to the preview pane
 * @attr {string}  persist     - localStorage key for split position persistence
 *
 * State attributes (set by component):
 * @attr {boolean} data-editing - Present when textarea is focused
 *
 * @fires markdown-editor:input - Dispatched on each keystroke. Detail: { value }
 * @fires markdown-editor:change - Dispatched on blur after content changed. Detail: { value }
 *
 * @example
 * <markdown-editor name="content" placeholder="Write markdown here...">
 *   <textarea>
 * # Hello world
 *
 * Start editing to see a live preview.
 *   </textarea>
 * </markdown-editor>
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

class MarkdownEditor extends VBElement {
  /** @type {HTMLTextAreaElement|null} */
  #textarea = null;
  /** @type {HTMLElement|null} */
  #viewer = null;
  /** @type {HTMLElement|null} */
  #editorPane = null;
  /** @type {HTMLElement|null} */
  #previewPane = null;
  /** @type {string} Last committed value for change detection */
  #lastValue = '';
  /** @type {ReturnType<typeof setTimeout> | null} Debounce timer for preview updates */
  #debounceTimer = null;

  static get observedAttributes() {
    return ['name', 'placeholder', 'rows'];
  }

  setup() {
    this.#buildDOM();
    this.#bindEvents();
    // Initial preview render
    this.#updatePreview();
  }

  teardown() {
    if (this.#debounceTimer !== null) clearTimeout(this.#debounceTimer);
    this.removeAttribute('data-editing');
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (!this.#textarea || oldVal === newVal) return;
    if (name === 'name') this.#textarea.name = newVal || '';
    if (name === 'placeholder') this.#textarea.placeholder = newVal || '';
    if (name === 'rows') this.#textarea.rows = parseInt(newVal, 10) || 10;
  }

  // ── Public API ──────────────────────────────────────────────

  /** Get the current markdown value. */
  get value() {
    return this.#textarea?.value ?? '';
  }

  /**
   * Set the markdown value and update preview. Idempotent — assigning
   * the current value is a no-op. Emits markdown-editor:change with
   * source: 'api' so consumers can filter their own assignments out
   * of the event stream.
   */
  set value(md) {
    if (!this.#textarea) return;
    const next = md == null ? '' : String(md);
    if (this.#textarea.value === next) return;
    this.#textarea.value = next;
    this.#updatePreview();
    this.dispatchEvent(new CustomEvent('markdown-editor:change', {
      detail: { value: next, source: 'api' },
      bubbles: true,
    }));
  }

  /** The textarea element (for form integration). */
  get textarea() {
    return this.#textarea;
  }

  // ── DOM construction ────────────────────────────────────────

  #buildDOM() {
    // Capture existing textarea if provided (progressive enhancement)
    const existingTextarea = this.querySelector('textarea');
    const initialValue = existingTextarea?.value || '';

    // Build the split layout
    this.#editorPane = document.createElement('section');
    this.#editorPane.className = 'md-editor-pane';
    this.#editorPane.setAttribute('aria-label', 'Markdown source');

    this.#previewPane = document.createElement('section');
    this.#previewPane.className = 'md-preview-pane';
    this.#previewPane.setAttribute('aria-label', 'Rendered preview');
    this.#previewPane.setAttribute('aria-live', 'polite');

    // Create textarea
    this.#textarea = document.createElement('textarea');
    this.#textarea.className = 'md-editor-input';
    this.#textarea.value = initialValue;
    this.#textarea.name = this.getAttribute('name') || '';
    this.#textarea.placeholder = this.getAttribute('placeholder') || 'Write markdown here...';
    this.#textarea.rows = parseInt(this.getAttribute('rows') ?? '', 10) || 10;
    this.#textarea.setAttribute('spellcheck', 'true');

    // Create viewer
    this.#viewer = document.createElement('markdown-viewer');
    if (this.hasAttribute('highlight')) {
      this.#viewer.setAttribute('highlight', '');
    }
    const theme = this.dataset.theme
      ?? /** @type {HTMLElement | null} */ (this.closest('[data-theme]'))?.dataset.theme;
    if (theme) this.#viewer.dataset.theme = theme;

    // Assemble
    this.#editorPane.appendChild(this.#textarea);
    this.#previewPane.appendChild(this.#viewer);

    // Replace existing content
    this.innerHTML = '';
    this.appendChild(this.#editorPane);
    this.appendChild(this.#previewPane);

    this.#lastValue = initialValue;
  }

  // ── Event binding ───────────────────────────────────────────

  #bindEvents() {
    const textarea = this.#textarea;
    if (!textarea) return;

    this.listen(textarea, 'input', () => {
      this.#emit('markdown-editor:input', { value: textarea.value });
      this.#schedulePreview();
    });

    this.listen(textarea, 'focus', () => {
      this.setAttribute('data-editing', '');
    });

    this.listen(textarea, 'blur', () => {
      this.removeAttribute('data-editing');
      if (textarea.value !== this.#lastValue) {
        this.#lastValue = textarea.value;
        this.#emit('markdown-editor:change', { value: textarea.value });
      }
    });

    // Tab key inserts spaces instead of moving focus (opt-in via data-tab-indent)
    if (this.hasAttribute('data-tab-indent')) {
      this.listen(textarea, 'keydown', (/** @type {Event} */ e) => {
        const ke = /** @type {KeyboardEvent} */ (e);
        if (ke.key === 'Tab' && !ke.shiftKey && !ke.ctrlKey && !ke.metaKey) {
          ke.preventDefault();
          const { selectionStart, selectionEnd } = textarea;
          textarea.setRangeText('  ', selectionStart, selectionEnd, 'end');
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
    }
  }

  // ── Preview update ──────────────────────────────────────────

  #schedulePreview() {
    if (this.#debounceTimer !== null) clearTimeout(this.#debounceTimer);
    this.#debounceTimer = setTimeout(() => this.#updatePreview(), 150);
  }

  #updatePreview() {
    if (!this.#viewer) return;

    const md = this.#textarea?.value || '';
    if (!md.trim()) {
      // Clear preview for empty content
      const content = this.#viewer.querySelector('.md-content');
      if (content) content.innerHTML = '';
      return;
    }

    // Feed markdown to viewer via a script slot (hidden, no fallback needed)
    let script = /** @type {HTMLScriptElement | null} */ (this.#viewer.querySelector('script[type="text/markdown"]'));
    if (!script) {
      script = document.createElement('script');
      script.type = 'text/markdown';
      this.#viewer.prepend(script);
    }
    script.textContent = md;

    // Trigger re-render
    this.#viewer.removeAttribute('data-rendered');
    /** @type {any} */ (this.#viewer).render?.();
  }

  // ── Events ──────────────────────────────────────────────────

  #emit(name, detail) {
    this.dispatchEvent(new CustomEvent(name, {
      detail, bubbles: true, composed: true,
    }));
  }
}

registerComponent('markdown-editor', MarkdownEditor);

export { MarkdownEditor };
