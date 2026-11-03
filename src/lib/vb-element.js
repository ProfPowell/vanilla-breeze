/**
 * VBElement — Minimal base class for Vanilla Breeze web components
 *
 * Provides:
 * - data-upgraded guard (dedupes back-to-back connectedCallbacks with no
 *   disconnect between them — NOT a reconnect guard, see the lifecycle note)
 * - listen() method with automatic cleanup on disconnect
 * - setup()/teardown() lifecycle hooks
 *
 * Lifecycle on move / reconnect: disconnectedCallback runs teardown() and
 * REMOVES data-upgraded, so the next connectedCallback runs setup() again.
 * That means setup() must be idempotent across a disconnect+reconnect: the
 * data-upgraded flag only suppresses a *repeated* connect while the element is
 * still connected, it does not survive a disconnect. A setup() that builds DOM
 * without either a teardown() that removes it or an "already built" guard will
 * duplicate that DOM every time the element is moved. The house patterns are
 * star-rating's `if (this.querySelector(...)) return` and the
 * `node?.parentNode === this` early return.
 *
 * Does NOT provide: props reflection, template rendering, reactivity.
 * Components that need observedAttributes/attributeChangedCallback
 * declare them normally alongside setup()/teardown().
 */
class VBElement extends HTMLElement {
  #cleanups = [];
  /** @type {ElementInternals | undefined} */
  #internals;

  connectedCallback() {
    // Suppresses a repeated connect while still connected. It does NOT survive
    // disconnect (see disconnectedCallback), so setup() still re-runs on every
    // reconnect — see the class-level lifecycle note.
    if (this.hasAttribute('data-upgraded')) return;
    if (this.setup() === false) return;
    this.setAttribute('data-upgraded', '');
    // Dispatch :upgraded in a microtask so any sibling component definitions
    // queued in the same synchronous script (e.g. a pack's registerComponent
    // calls) complete before consumers react. Without this, listeners that
    // immediately assign .items can hit a race where downstream components
    // (work-item, etc.) aren't defined yet and the default renderer falls
    // back to a plain element.
    queueMicrotask(() => {
      this.dispatchEvent(new CustomEvent(`${this.localName}:upgraded`, { bubbles: true }));
    });
  }

  disconnectedCallback() {
    for (const fn of this.#cleanups) fn();
    this.#cleanups = [];
    this.removeAttribute('data-upgraded');
    this.teardown();
  }

  /**
   * Track an event listener for automatic cleanup on disconnect.
   * @param {EventTarget} target
   * @param {string} event
   * @param {EventListenerOrEventListenerObject} handler
   * @param {AddEventListenerOptions} [opts]
   */
  listen(target, event, handler, opts) {
    target.addEventListener(event, handler, opts);
    this.#cleanups.push(() => target.removeEventListener(event, handler, opts));
  }

  /**
   * Re-run the lifecycle in place: release listeners, teardown(), then
   * setup() again and restore data-upgraded. For data setters that rebuild
   * children (e.g. accordion-wc's `panels`). Before the element is connected
   * it only resets; connectedCallback will run setup() normally.
   */
  _reinit() {
    for (const fn of this.#cleanups) fn();
    this.#cleanups = [];
    this.teardown();
    this.removeAttribute('data-upgraded');
    if (!this.isConnected) return;
    if (this.setup() !== false) this.setAttribute('data-upgraded', '');
  }

  /**
   * Override in subclass. Return false to abort upgrade.
   * @returns {boolean | void}
   */
  setup() {}

  /** Override in subclass for cleanup beyond event listeners. */
  teardown() {}

  /**
   * Toggle a CustomStateSet entry targetable via the `:state(name)` CSS selector.
   * Use for component-private flags. For author-facing state, keep using
   * data-* / aria-* attributes — see admin/specs/custom-state-set-research.md.
   *
   * Lazily attaches ElementInternals on first call; subclasses that already
   * attached internals (form-associated components) must hand them over via
   * `_adoptInternals(this.attachInternals())` in their constructor to avoid
   * the double-attach throw.
   *
   * @param {string} name
   * @param {boolean} on
   */
  setState(name, on) {
    if (!this.#internals) this.#internals = this.attachInternals();
    const states = this.#internals.states;
    try {
      if (on) states.add(name); else states.delete(name);
    } catch {
      // Legacy --name syntax for older Chromium/WebKit releases
      const legacy = `--${name}`;
      if (on) states.add(legacy); else states.delete(legacy);
    }
  }

  /**
   * Hand pre-attached ElementInternals to the base class. Form-associated
   * subclasses call this in their constructor right after attachInternals().
   * @param {ElementInternals} internals
   */
  _adoptInternals(internals) {
    if (!this.#internals) this.#internals = internals;
  }

  /*
   * Public constraint-validation surface for form-associated subclasses
   * (static formAssociated = true), mirroring native controls so
   * <form-field> and author code can read validity the same way for every
   * VB form control. Non-form-associated elements return undefined / true.
   * Subclasses that need custom behaviour override these.
   */

  /** @returns {ElementInternals | null} */
  #formInternals() {
    const ctor = /** @type {any} */ (this.constructor);
    return ctor.formAssociated && this.#internals ? this.#internals : null;
  }

  /** @returns {ValidityState | undefined} */
  get validity() { return this.#formInternals()?.validity; }

  /** @returns {string} */
  get validationMessage() { return this.#formInternals()?.validationMessage ?? ''; }

  /** @returns {boolean} */
  get willValidate() { return this.#formInternals()?.willValidate ?? false; }

  /** @returns {HTMLFormElement | null} */
  get form() { return this.#formInternals()?.form ?? null; }

  /** @returns {boolean} */
  checkValidity() { return this.#formInternals()?.checkValidity() ?? true; }

  /** @returns {boolean} */
  reportValidity() { return this.#formInternals()?.reportValidity() ?? true; }
}

export { VBElement };
