/**
 * comment-box: Standalone form-associated comment form.
 *
 * Composes <markdown-editor> for the input experience and adds the canonical
 * Submit / Cancel button row. Used standalone for top-level comment forms or
 * as the reply-form template inside <comment-thread>.
 *
 * Presentational with respect to persistence: the component fires
 * `comment-box:submit` and lets the author make the network call. The
 * submit contract (dispatch is synchronous, so decide during the handler):
 *
 *   - Do nothing → the value clears right after the event.
 *   - Call `e.detail.waitUntil(promise)` → the box goes busy (aria-busy,
 *     Submit aria-disabled, editor read-only) until the promise settles.
 *     Resolve → the value clears. Reject → the value is kept for a retry.
 *   - Call `e.preventDefault()` synchronously → the value is kept and the
 *     box does nothing more; call `clear()` yourself when appropriate.
 *
 * `preventDefault()` after an `await` is too late — the event has finished
 * dispatching. Use waitUntil() for async work.
 *
 * @attr {string}  name             - Form field name (submitted with parent form)
 * @attr {string}  value            - Pre-filled markdown content (e.g. for edit mode)
 * @attr {string}  placeholder      - Editor placeholder text
 * @attr {string}  label            - Accessible name for the editor (default: an
 *                                    associated <label>'s text, else "Comment")
 * @attr {string}  submit-label     - Submit button label (default "Comment")
 * @attr {string}  cancel-label     - Cancel button label (default "Cancel")
 * @attr {boolean} data-show-cancel - Render the Cancel button
 * @attr {string}  data-min-length  - Validation: minimum character length
 * @attr {string}  data-max-length  - Validation: maximum character length
 * @attr {boolean} required
 * @attr {boolean} disabled
 *
 * @fires comment-box:submit - detail: { value, waitUntil(promise) }. Bubbles,
 *        cancelable. See the submit contract above.
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

/** Remaining-character threshold at which the counter starts announcing. */
const announceThreshold = (/** @type {number} */ max) => Math.max(10, Math.ceil(max * 0.1));

class CommentBox extends VBElement {
  static formAssociated = true;
  static observedAttributes = ['value', 'disabled', 'placeholder', 'label', 'submit-label', 'cancel-label', 'data-show-cancel'];

  #internals;
  /** @type {any} */
  #editor = null;       // <markdown-editor>
  /** @type {HTMLElement | null} */
  #actionsRow = null;   // .comment-box-actions
  /** @type {HTMLElement | null} */
  #toolbar = null;      // .comment-box-toolbar
  /** @type {HTMLButtonElement | null} */
  #submitBtn = null;
  /** @type {HTMLButtonElement | null} */
  #cancelBtn = null;
  /** @type {HTMLElement | null} */
  #counter = null;      // visible length counter (data-max-length)
  /** @type {HTMLElement | null} */
  #counterStatus = null; // visually-hidden live region, only speaks near/over the limit
  /** @type {HTMLTextAreaElement | null} */
  #wiredTextarea = null; // last textarea we attached input listeners to (re-wires after editor upgrades)
  #busy = false;
  #formDisabled = false;

  constructor() {
    super();
    this.#internals = this.attachInternals();
    this._adoptInternals(this.#internals);
  }

  setup() {
    // Register both editor deps on first use. Dynamic imports keep the bare
    // 'marked' specifier (markdown-viewer's dependency) out of main.js's
    // static module graph — pages without an importmap for it must still
    // load. Until the modules land, the editor degrades to its textarea.
    // markdown-editor composes markdown-viewer but does not import it itself.
    import('../markdown-viewer/logic.js').catch(() => console.warn('[VB] comment-box: markdown-viewer failed to load (missing importmap for "marked"?)'));
    import('../markdown-editor/logic.js').catch(() => console.warn('[VB] comment-box: markdown-editor failed to load'));

    // Capture toolbar-slot children before we rebuild the DOM. On a
    // reconnect they already live inside our previous toolbar.
    const toolbarChildren = [
      ...this.querySelectorAll(':scope > [slot="toolbar"]'),
      ...this.querySelectorAll(':scope > .comment-box-actions > .comment-box-toolbar > *'),
    ];

    // Reuse author-provided <markdown-editor> if present; otherwise create one.
    let existingEditor = this.querySelector(':scope > markdown-editor');
    if (!existingEditor) {
      existingEditor = document.createElement('markdown-editor');
      const ta = document.createElement('textarea');
      if (this.hasAttribute('value')) ta.value = this.getAttribute('value') || '';
      existingEditor.appendChild(ta);
    }
    this.#editor = existingEditor;
    // markdown-editor builds its own textarea from ITS placeholder attribute.
    // `name` deliberately stays on the host: the host is form-associated, so
    // naming the inner textarea too would submit the value twice.
    if (this.hasAttribute('placeholder')) this.#editor.setAttribute('placeholder', this.getAttribute('placeholder') || '');

    // Build action row.
    this.#actionsRow = document.createElement('div');
    this.#actionsRow.className = 'comment-box-actions';

    this.#toolbar = document.createElement('div');
    this.#toolbar.className = 'comment-box-toolbar';
    toolbarChildren.forEach((el) => this.#toolbar?.appendChild(el));
    // No arrow-key roving here, so no role="toolbar"; a labelled group only
    // when there is something in it.
    if (toolbarChildren.length) {
      this.#toolbar.setAttribute('role', 'group');
      this.#toolbar.setAttribute('aria-label', 'Comment tools');
    }
    this.#actionsRow.appendChild(this.#toolbar);

    const buttons = document.createElement('div');
    buttons.className = 'comment-box-buttons';

    this.#cancelBtn = null;
    if (this.hasAttribute('data-show-cancel')) {
      this.#cancelBtn = this.#makeCancel();
      buttons.appendChild(this.#cancelBtn);
    }

    this.#submitBtn = document.createElement('button');
    this.#submitBtn.type = 'button';
    this.#submitBtn.className = 'comment-box-submit';
    this.#submitBtn.textContent = this.getAttribute('submit-label') || 'Comment';
    buttons.appendChild(this.#submitBtn);

    this.#actionsRow.appendChild(buttons);

    // Optional length counter when data-max-length is set. The visible count
    // is silent; a separate status region speaks only near / over the limit.
    this.#counter = null;
    this.#counterStatus = null;
    if (this.hasAttribute('data-max-length')) {
      this.#counter = document.createElement('span');
      this.#counter.className = 'comment-box-counter';
      this.#counter.setAttribute('aria-hidden', 'true');
      this.#actionsRow.appendChild(this.#counter);
      this.#counterStatus = document.createElement('span');
      this.#counterStatus.className = 'comment-box-status visually-hidden';
      this.#counterStatus.setAttribute('role', 'status');
      this.#actionsRow.appendChild(this.#counterStatus);
    }

    // Mount: editor first, then actions.
    this.replaceChildren(this.#editor, this.#actionsRow);

    // Wire button events.
    this.listen(this.#submitBtn, 'click', this.#onSubmit);
    if (this.#cancelBtn) this.listen(this.#cancelBtn, 'click', this.#onCancel);

    // Wire textarea events. markdown-editor REPLACES the original textarea
    // with its own internal one during its setup (and again when it is
    // reconnected), so we re-bind to the live textarea once that's available.
    this.#wireTextarea();
    this.listen(this.#editor, 'markdown-editor:upgraded', () => this.#wireTextarea());

    this.#updateDisabled();
    this.#syncFormValue();
    this.#validate();
    this.#refreshCounter();
  }

  teardown() {
    // Listeners were released by VBElement; forget the textarea so the next
    // setup() re-binds even when markdown-editor keeps the same node.
    this.#wiredTextarea = null;
  }

  /** Currently-live textarea inside the editor. Re-queried on demand because
   *  markdown-editor swaps the textarea during its setup. */
  get #ta() {
    return this.#editor?.textarea ?? this.#editor?.querySelector('textarea') ?? null;
  }

  #makeCancel() {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'comment-box-cancel';
    btn.textContent = this.getAttribute('cancel-label') || 'Cancel';
    return btn;
  }

  #wireTextarea() {
    const ta = this.#ta;
    if (!ta) return;
    this.#applyLabel(ta);
    this.#updateDisabled();
    this.#validate();
    if (ta === this.#wiredTextarea) return;
    this.#wiredTextarea = ta;
    this.listen(ta, 'input', this.#onInput);
    this.listen(ta, 'keydown', this.#onKeydown);
  }

  /** Accessible name for the editor textarea. */
  #applyLabel(ta = this.#ta) {
    if (!ta) return;
    const assoc = /** @type {HTMLLabelElement | undefined} */ (this.#internals.labels?.[0]);
    const name = this.getAttribute('label') || assoc?.textContent?.trim() || 'Comment';
    ta.setAttribute('aria-label', name);
  }

  attributeChangedCallback(name, _old, next) {
    if (!this.isConnected || !this.#editor) return;
    if (name === 'value') {
      this.value = next ?? '';
    } else if (name === 'placeholder') {
      if (next == null) this.#editor.removeAttribute('placeholder');
      else this.#editor.setAttribute('placeholder', next);
    } else if (name === 'label') {
      this.#applyLabel();
    } else if (name === 'disabled') {
      this.#updateDisabled();
    } else if (name === 'submit-label') {
      if (this.#submitBtn) this.#submitBtn.textContent = next || 'Comment';
    } else if (name === 'cancel-label') {
      if (this.#cancelBtn) this.#cancelBtn.textContent = next || 'Cancel';
    } else if (name === 'data-show-cancel') {
      // Toggle cancel button visibility. Re-running setup is overkill — just toggle.
      if (this.hasAttribute('data-show-cancel') && !this.#cancelBtn && this.#submitBtn) {
        this.#cancelBtn = this.#makeCancel();
        this.#submitBtn.before(this.#cancelBtn);
        this.listen(this.#cancelBtn, 'click', this.#onCancel);
        this.#updateDisabled();
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
    if (this.#busy || this.#isDisabled()) return;
    // validity.valid, not checkValidity(): that would fire a second `invalid`.
    if (!this.#internals.validity.valid) {
      // Say why instead of silently ignoring the click.
      this.#internals.reportValidity();
      this.#ta?.focus();
      return;
    }
    const value = this.value;
    /** @type {Promise<unknown>[]} */
    const pending = [];
    let dispatching = true;
    const evt = new CustomEvent('comment-box:submit', {
      bubbles: true,
      cancelable: true,
      detail: {
        value,
        /** @param {Promise<unknown>} promise */
        waitUntil(promise) {
          if (!dispatching) throw new DOMException('waitUntil() must be called while comment-box:submit is dispatching', 'InvalidStateError');
          pending.push(Promise.resolve(promise));
        },
      },
    });
    const proceed = this.dispatchEvent(evt);
    dispatching = false;
    if (!proceed) return;
    if (!pending.length) {
      this.clear();
      return;
    }
    this.#setBusy(true);
    Promise.all(pending).then(
      () => { this.#setBusy(false); this.clear(); },
      () => { this.#setBusy(false); this.#ta?.focus(); },
    );
  };

  #onCancel = () => {
    const value = this.value;
    this.dispatchEvent(new CustomEvent('comment-box:cancel', {
      bubbles: true, detail: { value },
    }));
  };

  // ── Validation & form participation ────────────────────────────────

  #isDisabled() {
    return this.hasAttribute('disabled') || this.#formDisabled;
  }

  #setBusy(on) {
    this.#busy = on;
    if (on) this.setAttribute('aria-busy', 'true');
    else this.removeAttribute('aria-busy');
    this.#updateDisabled();
  }

  #updateDisabled() {
    const disabled = this.#isDisabled();
    const ta = this.#ta;
    if (ta) {
      ta.disabled = disabled;
      ta.readOnly = this.#busy;
    }
    if (this.#submitBtn) {
      this.#submitBtn.disabled = disabled;
      // Busy keeps the button focusable (focus stays put) but inert.
      if (this.#busy) this.#submitBtn.setAttribute('aria-disabled', 'true');
      else this.#submitBtn.removeAttribute('aria-disabled');
    }
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
    if (!this.#counterStatus) return;
    const remaining = max - v;
    let msg = '';
    if (max && remaining < 0) msg = `${-remaining} characters over the limit`;
    else if (max && remaining <= announceThreshold(max)) msg = `${remaining} characters remaining`;
    if (this.#counterStatus.textContent !== msg) this.#counterStatus.textContent = msg;
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

  /**
   * Whether a comment-box:submit waitUntil() promise is pending.
   * @returns {boolean}
   */
  get busy() { return this.#busy; }

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
  formDisabledCallback(disabled) {
    this.#formDisabled = disabled;
    this.#updateDisabled();
  }

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
