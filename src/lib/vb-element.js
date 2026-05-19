/**
 * VBElement — Minimal base class for Vanilla Breeze web components
 *
 * Provides:
 * - data-upgraded guard (prevents double initialization on reconnect)
 * - listen() method with automatic cleanup on disconnect
 * - setup()/teardown() lifecycle hooks
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
}

export { VBElement };
