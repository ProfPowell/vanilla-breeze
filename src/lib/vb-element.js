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

  /** Override in subclass. Return false to abort upgrade. */
  setup() {}

  /** Override in subclass for cleanup beyond event listeners. */
  teardown() {}
}

export { VBElement };
