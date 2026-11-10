/**
 * mobile-menu — Responsive breakpoint observer
 *
 * Sets [data-mobile] on the element while the viewport is at or below the
 * configured breakpoint. The author supplies the trigger button and the
 * popover panel; this element only decides when they are shown.
 *
 * Sibling nav / nav-bar / site-tools in the parent <header> are hidden by
 * CSS (`header:has(> mobile-menu[data-mobile])`), not inline styles, so
 * removing the element restores them. A CSS media query covers the default
 * 52rem breakpoint before (or without) JS, so there is no layout shift.
 *
 * A sibling marked [data-mobile-menu] (a notification bell, say) is one
 * element that should exist once: in mobile mode it is moved into the
 * panel, at the [data-mobile-menu-slot] element if the panel has one, and
 * moved back to its place in the header on leaving mobile mode.
 *
 * The panel is a native popover: Esc closes it and focus returns to the
 * trigger. It is NOT modal — no focus trap, no inert page, no scroll lock.
 */

const DEFAULT_BREAKPOINT = '52rem';

class MobileMenu extends HTMLElement {
  static observedAttributes = ['breakpoint'];

  /** @type {MediaQueryList|null} */
  #mql = null;

  /** Moved siblings and the comment nodes holding their places.
   *  @type {Map<Element, Comment>} */
  #moved = new Map();

  connectedCallback() {
    this.#observe();
  }

  disconnectedCallback() {
    this.#unobserve();
    this.#restore();
  }

  attributeChangedCallback() {
    if (this.isConnected) this.#observe();
  }

  #observe() {
    this.#unobserve();
    const bp = this.getAttribute('breakpoint') || DEFAULT_BREAKPOINT;
    this.#mql = matchMedia(`(max-width: ${bp})`);
    this.#mql.addEventListener('change', this.#onBreakpoint);
    this.#onBreakpoint();
  }

  #unobserve() {
    this.#mql?.removeEventListener('change', this.#onBreakpoint);
    this.#mql = null;
  }

  #onBreakpoint = () => {
    const mobile = this.#mql?.matches ?? false;
    this.toggleAttribute('data-mobile', mobile);
    if (mobile) this.#adopt();
    else this.#restore();
    if (!mobile) {
      // Close the panel when switching to desktop
      const panel = /** @type {HTMLElement | null} */ (this.querySelector('[popover]'));
      if (panel?.matches(':popover-open')) panel.hidePopover?.();
    }
  };

  /** Move [data-mobile-menu] siblings into the panel. */
  #adopt() {
    const panel = this.querySelector('[popover]');
    const host = this.parentElement;
    if (!panel || !host) return;
    const slot = panel.querySelector('[data-mobile-menu-slot]') ?? panel;
    for (const el of host.querySelectorAll(':scope > [data-mobile-menu]')) {
      const mark = document.createComment('mobile-menu');
      el.before(mark);
      this.#moved.set(el, mark);
      slot.append(el);
    }
  }

  /** Put moved siblings back where they were. */
  #restore() {
    for (const [el, mark] of this.#moved) {
      if (mark.isConnected) mark.replaceWith(el);
      else mark.remove();
    }
    this.#moved.clear();
  }
}

if (!customElements.get('mobile-menu')) {
  customElements.define('mobile-menu', MobileMenu);
}
