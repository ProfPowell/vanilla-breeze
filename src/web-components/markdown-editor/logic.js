/**
 * markdown-editor: Side-by-side markdown editor with live preview
 *
 * Composes the author's <textarea> with a <markdown-viewer> in a split
 * layout. The textarea is ADOPTED, not replaced: it is moved into the editor
 * pane with every attribute intact (id + <label for>, aria-*, name,
 * required, minlength/maxlength, readonly, dir, form, placeholder), so form
 * submission, constraint validation and form.reset() are the native
 * textarea's own. Put `name` (and `required` etc.) on the <textarea> — that
 * is what submits, with or without JavaScript. A textarea is only created
 * when none is authored.
 *
 * The structure is built once. Reconnecting (moving the element) keeps the
 * same textarea and viewer objects — only listeners are re-bound — so a
 * cached `.textarea`, caret, scroll and undo history survive.
 *
 * Preview: the markdown is handed to <markdown-viewer> via its `.markdown`
 * property; the viewer parses it and sanitises the result (its default).
 * The preview is not a live region — it would re-read the whole document
 * on every debounced keystroke.
 *
 * @attr {string}  placeholder        - Textarea placeholder (overrides the textarea's own)
 * @attr {number}  rows               - Textarea rows (overrides the textarea's own; default 10)
 * @attr {boolean} highlight          - Pass through to markdown-viewer for code highlighting
 * @attr {boolean} data-tab-indent    - Tab inserts two spaces; Escape then Tab moves focus
 * @attr {boolean} data-auto-mermaid  - Upgrade mermaid fences in the preview to <diagram-wc>
 * @attr {string}  data-theme         - Theme propagated to the preview pane
 * @attr {string}  data-label-source  - Name of the source pane (default "Markdown source")
 * @attr {string}  data-label-preview - Name of the preview pane (default "Rendered preview")
 * @attr {string}  data-label-tab-hint - Tab-indent hint read with the textarea
 *
 * State attributes (set by component):
 * @attr {boolean} data-editing - Present when textarea is focused
 *
 * @fires markdown-editor:input - Each keystroke. Detail: { value }
 * @fires markdown-editor:change - On blur after the content changed (source "user"),
 *   or when `.value` is assigned (source "api"). Detail: { value, source }
 *
 * @example
 * <label for="body">Body</label>
 * <markdown-editor>
 *   <textarea id="body" name="body" required># Hello world</textarea>
 * </markdown-editor>
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';
// The preview pane is a <markdown-viewer>; register it with the editor so the
// editor works on its own (and .markdown is the real accessor, not an own
// property shadowing it on an un-upgraded element).
import '../markdown-viewer/logic.js';

const LABELS = {
  source: 'Markdown source',
  preview: 'Rendered preview',
  tabHint: 'Tab inserts spaces. Press Escape, then Tab, to move focus.',
};

let uid = 0;

class MarkdownEditor extends VBElement {
  /** @type {HTMLTextAreaElement|null} */
  #textarea = null;
  /** @type {any} <markdown-viewer> */
  #viewer = null;
  /** @type {HTMLElement|null} */
  #editorPane = null;
  /** @type {HTMLElement|null} */
  #previewPane = null;
  /** @type {HTMLElement|null} */
  #tabHint = null;
  /** @type {string} Last committed value for change detection */
  #lastValue = '';
  /** @type {string|null} Value assigned before the structure was built */
  #pendingValue = null;
  /** @type {ReturnType<typeof setTimeout> | null} Debounce timer for preview updates */
  #debounceTimer = null;
  /** Escape was pressed: the next Tab moves focus instead of indenting. */
  #tabReleased = false;
  /** @type {{ placeholder: string|null, rows: string|null }} the textarea's own values */
  #authored = { placeholder: null, rows: null };

  static get observedAttributes() {
    return ['placeholder', 'rows', 'highlight', 'data-label-source', 'data-label-preview'];
  }

  setup() {
    if (!this.#isBuilt()) this.#buildDOM();
    this.#bindEvents();
    this.#updatePreview();
  }

  teardown() {
    if (this.#debounceTimer !== null) clearTimeout(this.#debounceTimer);
    this.#debounceTimer = null;
    this.#tabReleased = false;
    this.removeAttribute('data-editing');
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (!this.#textarea || oldVal === newVal) return;
    if (name === 'placeholder') {
      this.#setOrRemove(this.#textarea, 'placeholder', newVal ?? this.#authored.placeholder);
    } else if (name === 'rows') {
      this.#applyRows();
    } else if (name === 'highlight') {
      this.#viewer?.toggleAttribute('highlight', newVal != null);
    } else {
      this.#applyPaneLabels();
    }
  }

  // ── Public API ──────────────────────────────────────────────

  /**
   * The current markdown value (the textarea's value).
   *
   * @returns {string} The markdown source.
   */
  get value() {
    return this.#textarea?.value ?? this.#pendingValue ?? '';
  }

  /**
   * Set the markdown value and update the preview at once. Assigning the
   * current value is a no-op. Emits markdown-editor:change with
   * source: 'api' so consumers can filter their own assignments out of the
   * event stream; the next blur does not repeat it.
   */
  set value(md) {
    const next = md == null ? '' : String(md);
    if (!this.#textarea) {
      this.#pendingValue = next;
      return;
    }
    if (this.#textarea.value === next) return;
    this.#textarea.value = next;
    this.#lastValue = next;
    this.#updatePreview();
    this.#emit('markdown-editor:change', { value: next, source: 'api' });
  }

  /**
   * The textarea element — the author's own when one was provided. Stable
   * across reconnects.
   *
   * @returns {HTMLTextAreaElement|null} The backing <textarea>, or null before upgrade.
   */
  get textarea() {
    return this.#textarea;
  }

  // ── DOM construction ────────────────────────────────────────

  #isBuilt() {
    return !!(this.#textarea && this.#editorPane?.parentNode === this
      && this.#previewPane?.parentNode === this && this.#editorPane.contains(this.#textarea));
  }

  #buildDOM() {
    // Adopt the authored textarea (progressive enhancement). Everything else
    // the author put inside (e.g. a <label>) moves into the source pane with it.
    let textarea = this.#textarea && this.contains(this.#textarea)
      ? this.#textarea
      : this.querySelector('textarea');
    const authoredNodes = [...this.childNodes];

    if (!textarea) {
      textarea = document.createElement('textarea');
      authoredNodes.push(textarea);
    }
    this.#textarea = textarea;
    this.#authored = {
      placeholder: textarea.getAttribute('placeholder'),
      rows: textarea.getAttribute('rows'),
    };

    if (this.hasAttribute('placeholder')) textarea.placeholder = this.getAttribute('placeholder') ?? '';
    this.#applyRows();
    if (!textarea.hasAttribute('dir')) textarea.dir = 'auto';
    if (!textarea.hasAttribute('spellcheck')) textarea.spellcheck = true;

    this.#editorPane = document.createElement('section');
    this.#editorPane.className = 'md-editor-pane';
    this.#editorPane.append(...authoredNodes);

    this.#previewPane = document.createElement('section');
    this.#previewPane.className = 'md-preview-pane';

    this.#viewer = document.createElement('markdown-viewer');
    // Same base direction as the source: the textarea's explicit dir, else
    // "auto" (resolved from the rendered text).
    const dir = textarea.getAttribute('dir');
    if (dir && dir !== 'auto') this.#previewPane.dir = dir;
    this.#viewer.dir = dir || 'auto';
    if (this.hasAttribute('highlight')) this.#viewer.setAttribute('highlight', '');
    const theme = this.dataset.theme
      ?? /** @type {HTMLElement | null} */ (this.closest('[data-theme]'))?.dataset.theme;
    if (theme) this.#viewer.dataset.theme = theme;
    this.#previewPane.append(this.#viewer);

    if (this.hasAttribute('data-tab-indent')) {
      this.#tabHint = document.createElement('span');
      this.#tabHint.className = 'visually-hidden';
      this.#tabHint.id = `md-editor-tab-hint-${++uid}`;
      this.#tabHint.textContent = this.dataset.labelTabHint || LABELS.tabHint;
      this.#editorPane.append(this.#tabHint);
      const described = textarea.getAttribute('aria-describedby');
      textarea.setAttribute('aria-describedby', described ? `${described} ${this.#tabHint.id}` : this.#tabHint.id);
    }

    this.replaceChildren(this.#editorPane, this.#previewPane);
    this.#applyPaneLabels();

    // Fall back to the pane name only when nothing else names the textarea.
    if (!textarea.hasAttribute('aria-label') && !textarea.hasAttribute('aria-labelledby')
      && !textarea.labels?.length && !textarea.title) {
      textarea.setAttribute('aria-label', this.#label('source'));
    }

    if (this.#pendingValue != null) {
      textarea.value = this.#pendingValue;
      this.#pendingValue = null;
    }
    this.#lastValue = textarea.value;
  }

  #applyRows() {
    if (!this.#textarea) return;
    const rows = this.getAttribute('rows') ?? this.#authored.rows;
    this.#textarea.rows = parseInt(rows ?? '', 10) || 10;
  }

  #applyPaneLabels() {
    this.#editorPane?.setAttribute('aria-label', this.#label('source'));
    this.#previewPane?.setAttribute('aria-label', this.#label('preview'));
  }

  /** @param {'source'|'preview'} key */
  #label(key) {
    const own = key === 'source' ? this.dataset.labelSource : this.dataset.labelPreview;
    return own || LABELS[key];
  }

  /**
   * @param {Element} el
   * @param {string} attr
   * @param {string|null} value
   */
  #setOrRemove(el, attr, value) {
    if (value == null) el.removeAttribute(attr);
    else el.setAttribute(attr, value);
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
      this.#tabReleased = false;
      if (textarea.value !== this.#lastValue) {
        this.#lastValue = textarea.value;
        this.#emit('markdown-editor:change', { value: textarea.value, source: 'user' });
      }
    });

    // form.reset() restores the textarea natively (its defaultValue is the
    // authored text). The reset event fires before the reset happens, so
    // resync the preview once it has.
    this.listen(this.getRootNode(), 'reset', (/** @type {Event} */ e) => {
      if (!textarea.form || e.target !== textarea.form) return;
      queueMicrotask(() => {
        this.#lastValue = textarea.value;
        this.#updatePreview();
      });
    }, { capture: true });

    // Tab inserts spaces instead of moving focus (opt-in). Escape releases
    // the next Tab so keyboard users can always leave (WCAG 2.1.2); Shift+Tab
    // is never captured.
    if (this.hasAttribute('data-tab-indent')) {
      this.listen(textarea, 'keydown', (/** @type {Event} */ e) => {
        const ke = /** @type {KeyboardEvent} */ (e);
        if (ke.key === 'Escape') {
          this.#tabReleased = true;
          return;
        }
        if (ke.key !== 'Tab' || ke.shiftKey || ke.ctrlKey || ke.metaKey || ke.altKey) {
          if (!['Shift', 'Control', 'Alt', 'Meta'].includes(ke.key)) this.#tabReleased = false;
          return;
        }
        if (this.#tabReleased || textarea.readOnly || textarea.disabled) {
          this.#tabReleased = false;
          return;
        }
        ke.preventDefault();
        // execCommand keeps the edit on the native undo stack and fires input.
        if (!document.execCommand('insertText', false, '  ')) {
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
    if (this.#debounceTimer !== null) clearTimeout(this.#debounceTimer);
    this.#debounceTimer = null;
    if (!this.#viewer) return;
    // markdown-viewer parses and sanitises (on by default); the editor never
    // writes HTML itself.
    this.#viewer.markdown = this.#textarea?.value ?? '';
  }

  // ── Events ──────────────────────────────────────────────────

  /**
   * @param {string} name
   * @param {object} detail
   */
  #emit(name, detail) {
    this.dispatchEvent(new CustomEvent(name, {
      detail, bubbles: true, composed: true,
    }));
  }
}

registerComponent('markdown-editor', MarkdownEditor);

export { MarkdownEditor };
