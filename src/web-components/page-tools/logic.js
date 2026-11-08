/**
 * page-tools: Configurable toolbar for page-level utilities
 *
 * Aggregates per-page tools (print, share, reading stats, etc.) into a
 * cohesive toolbar with configurable positioning. On small viewports,
 * collapses to a floating action button (FAB) with a native popover panel.
 *
 * Auto-discovers children as tools — any direct child element counts.
 * No registry or allow-list needed.
 *
 * @attr {string} data-position    - Positioning: 'sticky' (default), 'fixed', 'inline'
 * @attr {string} data-orientation - Direction: 'auto' (default), 'vertical', 'horizontal'
 * @attr {string} data-gap         - Gap token: 's' (default)
 * @attr {string} data-fab-icon    - Icon name for FAB (default: 'ellipsis-vertical')
 * @attr {string} data-fab-label   - Accessible label for FAB (default: 'Page tools')
 * @attr {string} data-breakpoint  - Collapse width (default: '48rem')
 *
 * @example Sticky sidebar
 * <page-tools data-position="sticky">
 *   <print-page></print-page>
 *   <share-wc variant="icon" size="s"></share-wc>
 * </page-tools>
 *
 * @example Inline horizontal
 * <page-tools data-position="inline">
 *   <page-stats data-for="article-content"></page-stats>
 *   <print-page></print-page>
 * </page-tools>
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

let idCounter = 0;

/** Controls that take part in the toolbar's roving tabindex. */
const ITEM_SELECTOR = 'button, a[href], input, select, textarea, [tabindex]';
/** Controls that need the arrow keys for themselves. */
const OWNS_ARROWS = 'input:not([type="checkbox"]):not([type="radio"]):not([type="button"]), select, textarea, [contenteditable]';

class PageTools extends VBElement {

  static get observedAttributes() {
    return ['data-orientation', 'data-position'];
  }

  /** @type {HTMLButtonElement | null} */
  #fab = null;
  /** @type {HTMLElement | null} */
  #popover = null;
  /** @type {MediaQueryList | null} */
  #mql = null;
  #collapsed = false;
  /** @type {MutationObserver | null} */
  #observer = null;
  /** Focus was inside the popover when it started to close. */
  #focusWasInside = false;
  #rovingRaf = 0;
  /** @type {Element | null} */
  #current = null;

  setup() {
    /* Toolbar semantics */
    if (!this.hasAttribute('role')) this.setAttribute('role', 'toolbar');
    if (!this.getAttribute('aria-label')) this.setAttribute('aria-label', 'Page tools');

    /* Resolve auto orientation */
    this.#resolveOrientation();

    /* Create FAB + popover infrastructure (hidden until needed) */
    this.#createCollapse();

    /* Watch breakpoint */
    const bp = this.dataset.breakpoint || '48rem';
    this.#mql = matchMedia(`(max-width: ${bp})`);
    this.#handleBreakpoint(this.#mql);
    this.listen(this.#mql, 'change', (e) => this.#handleBreakpoint(e));

    /* Toolbar keyboard pattern (roving tabindex) */
    this.listen(this, 'keydown', this.#onKeydown);
    this.listen(this, 'focusin', this.#onFocusin);

    /* Watch for child mutations (tools added, or tools rendering their controls) */
    this.#observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'childList' && m.target === this && this.#collapsed) this.#syncPopover();
      }
      this.#scheduleRoving();
    });
    this.#observer.observe(this, { childList: true, subtree: true });
    this.#scheduleRoving();
  }

  teardown() {
    this.#observer?.disconnect();
    this.#observer = null;
    cancelAnimationFrame(this.#rovingRaf);
    this.#rovingRaf = 0;
    /* Restore tools from popover if collapsed */
    if (this.#collapsed) this.#expand();
    this.#fab?.remove();
    this.#popover?.remove();
    this.#fab = null;
    this.#popover = null;
    this.#current = null;
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue || !this.hasAttribute('data-upgraded')) return;
    this.#resolveOrientation();
  }

  /**
   * Tools = direct children that are not internal infrastructure
   * (when collapsed, the tools live inside the popover panel).
   *
   * @returns {Element[]} The tool child elements.
   */
  get tools() {
    const host = this.#collapsed && this.#popover ? this.#popover : this;
    return Array.from(host.children).filter(
      el => !el.hasAttribute('data-page-tools-internal')
    );
  }

  /* ── Orientation ── */

  #resolveOrientation() {
    const orientation = this.dataset.orientation || 'auto';
    const position = this.dataset.position || 'sticky';
    const resolved = orientation === 'horizontal' || orientation === 'vertical'
      ? orientation
      : (position === 'inline' ? 'horizontal' : 'vertical');
    this.setAttribute('data-resolved-orientation', resolved);
    this.#syncAriaOrientation();
  }

  /** The direction arrow keys move in: the popover panel is always a column. */
  #keyOrientation() {
    return this.#collapsed ? 'vertical' : (this.dataset.resolvedOrientation || 'vertical');
  }

  #syncAriaOrientation() {
    this.setAttribute('aria-orientation', this.#keyOrientation());
  }

  /* ── Roving tabindex ── */

  /** @returns {HTMLElement[]} Visible, enabled tool controls in DOM order. */
  #items() {
    return /** @type {HTMLElement[]} */ (Array.from(this.querySelectorAll(ITEM_SELECTOR))).filter(el =>
      !el.closest('[data-page-tools-internal]:not(.page-tools-popover)') &&
      !el.matches(':disabled') &&
      !el.closest('[inert]') &&
      el.checkVisibility()
    );
  }

  #scheduleRoving() {
    if (this.#rovingRaf) return;
    this.#rovingRaf = requestAnimationFrame(() => {
      this.#rovingRaf = 0;
      this.#applyRoving();
    });
  }

  /** @param {Element | null} [preferred] */
  #applyRoving(preferred = null) {
    const items = this.#items();
    if (!items.length) return;
    const current = [preferred, this.#current].find(el => el && items.includes(/** @type {HTMLElement} */ (el))) || items[0];
    this.#current = current;
    for (const item of items) item.tabIndex = item === current ? 0 : -1;
  }

  /** @param {FocusEvent} e */
  #onFocusin = (e) => {
    const target = /** @type {Element} */ (e.target);
    if (target === this.#fab) return;
    if (this.#items().includes(/** @type {HTMLElement} */ (target))) this.#applyRoving(target);
  };

  /** @param {KeyboardEvent} e */
  #onKeydown = (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const target = /** @type {HTMLElement} */ (e.target);
    if (target === this.#fab || target.matches(OWNS_ARROWS)) return;
    const items = this.#items();
    const index = items.indexOf(target);
    if (index === -1) return;

    const horizontal = this.#keyOrientation() === 'horizontal';
    const rtl = getComputedStyle(this).direction === 'rtl';
    const prevKey = horizontal ? (rtl ? 'ArrowRight' : 'ArrowLeft') : 'ArrowUp';
    const nextKey = horizontal ? (rtl ? 'ArrowLeft' : 'ArrowRight') : 'ArrowDown';

    let next = -1;
    if (e.key === nextKey) next = (index + 1) % items.length;
    else if (e.key === prevKey) next = (index - 1 + items.length) % items.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = items.length - 1;
    if (next === -1) return;

    e.preventDefault();
    this.#applyRoving(items[next]);
    items[next].focus();
  };

  /* ── FAB + Popover ── */

  #createCollapse() {
    const id = `pt-${++idCounter}`;
    const iconName = this.dataset.fabIcon || 'ellipsis-vertical';
    const label = this.dataset.fabLabel || 'Page tools';

    /* FAB trigger */
    this.#fab = document.createElement('button');
    this.#fab.type = 'button';
    this.#fab.className = 'page-tools-fab';
    this.#fab.setAttribute('data-page-tools-internal', '');
    this.#fab.setAttribute('popovertarget', id);
    this.#fab.setAttribute('aria-label', label);
    this.#fab.hidden = true;
    const icon = document.createElement('icon-wc');
    icon.setAttribute('name', iconName);
    icon.setAttribute('size', 'md');
    icon.setAttribute('aria-hidden', 'true');
    this.#fab.appendChild(icon);

    /* Popover panel — hidden by the popover attribute until opened */
    this.#popover = document.createElement('section');
    this.#popover.className = 'page-tools-popover';
    this.#popover.setAttribute('data-page-tools-internal', '');
    this.#popover.id = id;
    this.#popover.setAttribute('popover', '');
    this.#popover.setAttribute('aria-label', label);

    this.appendChild(this.#fab);
    this.appendChild(this.#popover);

    /* Return focus to the FAB only when the close took focus with it
       (Escape, or a close while a tool was focused) — never on a light
       dismiss that moved focus elsewhere, nor on the resize-driven hide. */
    this.listen(this.#popover, 'beforetoggle', (e) => {
      if (/** @type {ToggleEvent} */ (e).newState === 'closed') {
        this.#focusWasInside = !!this.#popover?.contains(document.activeElement);
      }
    });
    this.listen(this.#popover, 'toggle', (e) => {
      const ev = /** @type {ToggleEvent} */ (e);
      if (ev.newState === 'open') {
        this.#applyRoving();
        return;
      }
      const restore = this.#focusWasInside && this.#collapsed;
      this.#focusWasInside = false;
      if (!restore) return;
      const active = document.activeElement;
      if (!active || active === document.body || this.#popover?.contains(active)) this.#fab?.focus();
    });
  }

  #handleBreakpoint(mql) {
    const matches = mql.matches ?? mql;
    if (matches) {
      this.#collapse();
    } else {
      this.#expand();
    }
  }

  #collapse() {
    if (this.#collapsed) return;
    if (!this.#fab || !this.#popover) return;

    /* Move tools into popover */
    const tools = this.tools;
    for (const tool of tools) {
      this.#popover.appendChild(tool);
    }

    this.#collapsed = true;
    this.#fab.hidden = false;
    this.setAttribute('data-collapsed', '');
    this.#syncAriaOrientation();
  }

  #expand() {
    if (!this.#collapsed) return;
    if (!this.#fab || !this.#popover) return;
    this.#collapsed = false;

    /* Close popover if open */
    if (this.#popover.matches(':popover-open')) {
      this.#popover.hidePopover?.();
    }

    /* Move tools back before FAB */
    const tools = Array.from(this.#popover.children);
    for (const tool of tools) {
      this.insertBefore(tool, this.#fab);
    }

    this.#fab.hidden = true;
    this.removeAttribute('data-collapsed');
    this.#syncAriaOrientation();
    this.#scheduleRoving();
  }

  #syncPopover() {
    /* If collapsed, ensure new non-internal children go into popover */
    if (!this.#popover) return;
    const stray = Array.from(this.children).filter(
      el => !el.hasAttribute('data-page-tools-internal')
    );
    for (const tool of stray) {
      this.#popover.appendChild(tool);
    }
  }
}

registerComponent('page-tools', PageTools);

export { PageTools };
