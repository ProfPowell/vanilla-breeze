/**
 * mobile-menu — Responsive breakpoint observer
 *
 * Sets [data-mobile] on the element when the viewport is below the
 * configured breakpoint. Also hides sibling nav and site-tools in the
 * parent header when mobile mode is active.
 *
 * Progressive enhancement: without JS, the menu is hidden. With JS,
 * the breakpoint observer activates the toggle + popover behavior.
 */

const DEFAULT_BREAKPOINT = '52rem';

class MobileMenu extends HTMLElement {
  /** @type {MediaQueryList|null} */
  #mql = null;

  connectedCallback() {
    const bp = this.getAttribute('breakpoint') || DEFAULT_BREAKPOINT;
    this.#mql = matchMedia(`(max-width: ${bp})`);
    this.#mql.addEventListener('change', this.#onBreakpoint);
    this.#onBreakpoint();
  }

  disconnectedCallback() {
    this.#mql?.removeEventListener('change', this.#onBreakpoint);
    this.#mql = null;
  }

  #onBreakpoint = (/** @type {Event | undefined} */ _e) => {
    const mobile = this.#mql?.matches ?? false;

    if (mobile) {
      this.setAttribute('data-mobile', '');
    } else {
      this.removeAttribute('data-mobile');
      // Close panel if open when switching to desktop
      const panel = /** @type {HTMLElement | null} */ (this.querySelector('[popover]'));
      if (panel?.matches(':popover-open')) {
        panel.hidePopover?.();
      }
    }

    // Toggle sibling visibility in parent header
    const header = this.closest('header');
    if (header) {
      for (const sibling of header.children) {
        if (sibling === this) continue;
        if (sibling.matches('nav, site-tools')) {
          /** @type {HTMLElement} */ (sibling).style.display = mobile ? 'none' : '';
        }
      }
    }
  };
}

if (!customElements.get('mobile-menu')) {
  customElements.define('mobile-menu', MobileMenu);
}
