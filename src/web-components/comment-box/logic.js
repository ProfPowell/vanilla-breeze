/**
 * comment-box: Standalone form-associated comment form.
 *
 * Composes <markdown-editor> for the input experience and adds the canonical
 * Submit / Cancel button row. Used standalone for top-level comment forms or
 * as the reply-form template inside <comment-thread>.
 *
 * Presentational with respect to persistence: the component fires
 * `comment-box:submit` (cancellable) and lets the author make the network
 * call. On success, the value is cleared automatically; if the author
 * preventDefault()s, the value is preserved (useful for client-side
 * validation flows).
 *
 * @attr {string}  name             - Form field name (submitted with parent form)
 * @attr {string}  value            - Pre-filled markdown content (e.g. for edit mode)
 * @attr {string}  placeholder      - Editor placeholder text
 * @attr {string}  submit-label     - Submit button label (default "Comment")
 * @attr {string}  cancel-label     - Cancel button label (default "Cancel")
 * @attr {boolean} data-show-cancel - Render the Cancel button
 * @attr {string}  data-min-length  - Validation: minimum character length
 * @attr {string}  data-max-length  - Validation: maximum character length
 * @attr {boolean} required
 * @attr {boolean} disabled
 *
 * @fires comment-box:submit - detail: { value }. Bubbles. Cancellable —
 *        preventDefault() preserves the value (cancel network failure recovery).
 * @fires comment-box:cancel - detail: { value }
 * @fires comment-box:input  - detail: { value, length }. Bubbles, fires on every keystroke.
 *
 * @example Standalone
 *   <comment-box name="comment" placeholder="Add a comment…"></comment-box>
 *
 * @example Edit mode (pre-filled + cancel button)
 *   <comment-box value="…" submit-label="Save" data-show-cancel></comment-box>
 *
 * @example With toolbar slot
 *   <comment-box>
 *     <button slot="toolbar" type="button" data-action="attach">📎</button>
 *   </comment-box>
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';
// Ensure both deps are registered when comment-box is used. markdown-editor
// composes markdown-viewer internally but does not import it itself.
import '../markdown-viewer/logic.js';
import '../markdown-editor/logic.js';

class CommentBox extends VBElement {
  static formAssociated = true;
  static observedAttributes = ['value', 'disabled', 'placeholder', 'submit-label', 'cancel-label', 'data-show-cancel'];

  #internals;
  #editor;       // <markdown-editor>
  #actionsRow;   // .comment-box-actions
  #toolbar;      // .comment-box-toolbar
  #submitBtn;
  #cancelBtn;
  #counter;      // optional length counter shown when data-max-length is set
  #wiredTextarea = null; // last textarea we attached input listeners to (re-wires after editor upgrades)

  constructor() {
    super();
    this.#internals = this.attachInternals();
    this._adoptInternals(this.#internals);
  }

  setup() {
    // Capture toolbar-slot children before we rebuild the DOM.
    const toolbarChildren = [...this.querySelectorAll(':scope > [slot="toolbar"]')];

    // Reuse author-provided <markdown-editor> if present; otherwise create one.
    let existingEditor = this.querySelector(':scope > markdown-editor');
    if (!existingEditor) {
      existingEditor = document.createElement('markdown-editor');
      const ta = document.createElement('textarea');
      if (this.hasAttribute('placeholder')) ta.placeholder = this.getAttribute('placeholder') || '';
      if (this.hasAttribute('value')) ta.value = this.getAttribute('value') || '';
      existingEditor.appendChild(ta);
    }
    this.#editor = existingEditor;

    // Build action row.
    this.#actionsRow = document.createElement('div');
    this.#actionsRow.className = 'comment-box-actions';

    this.#toolbar = document.createElement('div');
    this.#toolbar.className = 'comment-box-toolbar';
    this.#toolbar.setAttribute('role', 'toolbar');
    toolbarChildren.forEach((el) => this.#toolbar.appendChild(el));
    this.#actionsRow.appendChild(this.#toolbar);

    const buttons = document.createElement('div');
    buttons.className = 'comment-box-buttons';

    if (this.hasAttribute('data-show-cancel')) {
      this.#cancelBtn = document.createElement('button');
      this.#cancelBtn.type = 'button';
      this.#cancelBtn.className = 'comment-box-cancel';
      this.#cancelBtn.textContent = this.getAttribute('cancel-label') || 'Cancel';
      buttons.appendChild(this.#cancelBtn);
    }

    this.#submitBtn = document.createElement('button');
    this.#submitBtn.type = 'button';
    this.#submitBtn.className = 'comment-box-submit';
    this.#submitBtn.textContent = this.getAttribute('submit-label') || 'Comment';
    buttons.appendChild(this.#submitBtn);

    this.#actionsRow.appendChild(buttons);

    // Optional length counter when data-max-length is set.
    if (this.hasAttribute('data-max-length')) {
      this.#counter = document.createElement('span');
      this.#counter.className = 'comment-box-counter';
      this.#counter.setAttribute('aria-live', 'polite');
      this.#actionsRow.appendChild(this.#counter);
    }

    // Mount: editor first, then actions.
    this.replaceChildren(this.#editor, this.#actionsRow);

    // Wire button events.
    this.listen(this.#submitBtn, 'click', this.#onSubmit);
    if (this.#cancelBtn) this.listen(this.#cancelBtn, 'click', this.#onCancel);

    // Wire textarea events. markdown-editor REPLACES the original textarea
    // with its own internal one during its setup, so we re-bind to the live
    // textarea once that's available.
    this.#wireTextarea();
    if (!this.#editor.hasAttribute('data-upgraded')) {
      this.listen(this.#editor, 'markdown-editor:upgraded', () => this.#wireTextarea(), { once: true });
    }

    this.#updateDisabled();
    this.#syncFormValue();
    this.#validate();
    this.#refreshCounter();
  }

  /** Currently-live textarea inside the editor. Re-queried on demand because
   *  markdown-editor swaps the textarea during its setup. */
  get #ta() {
    return this.#editor?.textarea ?? this.#editor?.querySelector('textarea') ?? null;
  }

  #wireTextarea() {
    const ta = this.#ta;
    if (!ta || ta === this.#wiredTextarea) return;
    this.#wiredTextarea = ta;
    this.listen(ta, 'input', this.#onInput);
    this.listen(ta, 'keydown', this.#onKeydown);
  }

  attributeChangedCallback(name, _old, next) {
    if (!this.isConnected || !this.#editor) return;
    if (name === 'value') {
      this.value = next ?? '';
    } else if (name === 'placeholder') {
      const ta = this.#ta;
      if (ta) ta.placeholder = next ?? '';
    } else if (name === 'disabled') {
      this.#updateDisabled();
    } else if (name === 'submit-label') {
      this.#submitBtn.textContent = next || 'Comment';
    } else if (name === 'cancel-label') {
      if (this.#cancelBtn) this.#cancelBtn.textContent = next || 'Cancel';
    } else if (name === 'data-show-cancel') {
      // Toggle cancel button visibility. Re-running setup is overkill — just toggle.
      if (this.hasAttribute('data-show-cancel') && !this.#cancelBtn) {
        this.#cancelBtn = document.createElement('button');
        this.#cancelBtn.type = 'button';
        this.#cancelBtn.className = 'comment-box-cancel';
        this.#cancelBtn.textContent = this.getAttribute('cancel-label') || 'Cancel';
        this.#submitBtn.parentNode.insertBefore(this.#cancelBtn, this.#submitBtn);
        this.listen(this.#cancelBtn, 'click', this.#onCancel);
      } else if (!this.hasAttribute('data-show-cancel') && this.#cancelBtn) {
        this.#cancelBtn.remove();
        this.#cancelBtn = null;
      }
    }
  }

  // ── Event handlers ─────────────────────────────────────────────────

  #onInput = () => {
    this.#syncFormValue();
    this.#validate();
    this.#refreshCounter();
    this.dispatchEvent(new CustomEvent('comment-box:input', {
      bubbles: true,
      detail: { value: this.value, length: this.value.length },
    }));
  };

  #onKeydown = (e) => {
    // Cmd/Ctrl+Enter submits — matches GitHub/Slack convention.
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      this.#onSubmit();
    }
  };

  #onSubmit = () => {
    if (this.#disabledOrInvalid()) return;
    const value = this.value;
    const evt = new CustomEvent('comment-box:submit', {
      bubbles: true, cancelable: true, detail: { value },
    });
    const proceed = this.dispatchEvent(evt);
    if (proceed) this.clear();
  };

  #onCancel = () => {
    const value = this.value;
    this.dispatchEvent(new CustomEvent('comment-box:cancel', {
      bubbles: true, detail: { value },
    }));
  };

  // ── Validation & form participation ────────────────────────────────

  #disabledOrInvalid() {
    if (this.hasAttribute('disabled')) return true;
    return !this.#internals.checkValidity();
  }

  #updateDisabled() {
    const disabled = this.hasAttribute('disabled');
    const ta = this.#ta;
    if (ta) ta.disabled = disabled;
    this.#submitBtn.disabled = disabled;
    if (this.#cancelBtn) this.#cancelBtn.disabled = disabled;
  }

  #syncFormValue() {
    this.#internals.setFormValue(this.value);
  }

  #validate() {
    const v = this.value;
    const min = Number(this.getAttribute('data-min-length')) || 0;
    const max = Number(this.getAttribute('data-max-length')) || Infinity;
    const required = this.hasAttribute('required');

    // Anchor for setValidity must be a descendant of the form-associated host.
    // Use the live textarea if available; fall back to the host itself so we
    // never throw NotFoundError if markdown-editor hasn't upgraded yet.
    const anchor = this.#ta && this.contains(this.#ta) ? this.#ta : null;

    if (required && v.length === 0) {
      this.#internals.setValidity({ valueMissing: true }, 'Please add a comment.', anchor || undefined);
      return;
    }
    if (v.length < min) {
      this.#internals.setValidity({ tooShort: true }, `At least ${min} characters required.`, anchor || undefined);
      return;
    }
    if (v.length > max) {
      this.#internals.setValidity({ tooLong: true }, `No more than ${max} characters.`, anchor || undefined);
      return;
    }
    this.#internals.setValidity({});
  }

  #refreshCounter() {
    if (!this.#counter) return;
    const max = Number(this.getAttribute('data-max-length')) || 0;
    const v = this.value.length;
    this.#counter.textContent = max ? `${v} / ${max}` : String(v);
    this.#counter.classList.toggle('is-over', max > 0 && v > max);
  }

  // ── Public API ─────────────────────────────────────────────────────

  get value() { return this.#editor?.value ?? ''; }
  set value(v) {
    if (!this.#editor) return;
    this.#editor.value = v == null ? '' : String(v);
    this.#syncFormValue();
    this.#validate();
    this.#refreshCounter();
  }

  clear() {
    this.value = '';
    this.dispatchEvent(new CustomEvent('comment-box:input', {
      bubbles: true, detail: { value: '', length: 0 },
    }));
  }

  focus() {
    this.#ta?.focus();
  }

  // Form-associated lifecycle
  formResetCallback() { this.value = this.getAttribute('value') ?? ''; }
  formStateRestoreCallback(state) { if (state != null) this.value = state; }

  get form() { return this.#internals.form; }
  get name() { return this.getAttribute('name'); }
  get type() { return this.localName; }
  get validity() { return this.#internals.validity; }
  get validationMessage() { return this.#internals.validationMessage; }
  checkValidity() { return this.#internals.checkValidity(); }
  reportValidity() { return this.#internals.reportValidity(); }
}

registerComponent('comment-box', CommentBox);

export { CommentBox };
