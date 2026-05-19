/**
 * pager-wc: standalone pagination controls element targeting any [data-paged] container.
 *
 * The element form of the data-paged primitive — same shape as the
 * <layout-grid> / data-layout-* symmetry across the framework. Authors
 * pick the surface that fits the markup; both feed the same engine.
 *
 * Use cases pager-wc unlocks (that data-paged alone can't):
 *   - Controls in a header with items below
 *   - Controls in a footer with items above
 *   - Two pager-wc instances pointing at the same target (top + bottom),
 *     kept in sync automatically
 *   - Pagination in a sidebar driving the main content column
 *
 * The element listens for `paged:change` on the target and re-renders.
 * Buttons dispatch `paged:goto { page }` (or `paged:loadmore`) on the
 * target, which the data-paged engine handles via event listeners
 * registered during enhance().
 *
 * @attr {string}  target  - CSS selector for the [data-paged] container (preferred)
 * @attr {string}  for     - ID of the target container (alternative; HTML-form-style)
 * @attr {string}  style   - "numbered" (default) | "prev-next" | "load-more".
 *                           Infinite-style is intentionally unsupported — a sentinel
 *                           pattern doesn't make sense for decoupled controls.
 *
 * @fires pager-wc:navigate - { page } — bubbles before the target's data-paged engine
 *                            processes the navigation. Use for analytics / scroll-restore.
 *
 * @example Controls in header, items below
 *   <pager-wc target="#feed"></pager-wc>
 *   <ul id="feed" data-paged data-paged-size="10"> ... </ul>
 *
 * @example Top + bottom controls staying in sync
 *   <pager-wc target="#feed"></pager-wc>
 *   <ul id="feed" data-paged data-paged-size="20"> ... </ul>
 *   <pager-wc target="#feed"></pager-wc>
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';
import { paginationState } from '../../lib/data-paged.js';
import { buildNav, wireNav } from '../../lib/data-paged-controls.js';

class PagerWC extends VBElement {
  static observedAttributes = ['target', 'for', 'style'];

  /** @type {HTMLElement | null} */
  #target = null;
  /** @type {(() => void) | null} */
  #unsubscribe = null;

  setup() {
    this.#bind();
  }

  teardown() {
    this.#unsubscribe?.();
    this.#unsubscribe = null;
  }

  attributeChangedCallback() {
    if (!this.isConnected || !this.hasAttribute('data-upgraded')) return;
    this.#unsubscribe?.();
    this.#unsubscribe = null;
    this.#bind();
  }

  /** Locate the target [data-paged] container and subscribe to its updates. */
  #bind() {
    this.#target = this.#resolveTarget();
    if (!this.#target) {
      this.#renderMissing();
      return;
    }
    const onChange = (/** @type {Event} */ e) => this.#renderFor(/** @type {CustomEvent} */ (e).detail);
    this.#target.addEventListener('paged:change', onChange);
    this.#unsubscribe = () => this.#target?.removeEventListener('paged:change', onChange);

    // Initial render — synthesize a paged:change-equivalent state from
    // the target's current attributes. The engine fires paged:change on
    // its initial render, but if the engine has already run before we
    // mounted, we need to compute state ourselves to avoid an empty
    // first render.
    this.#renderFromTarget();
  }

  /**
   * Resolve target via `target` (CSS selector) then `for` (id), falling
   * back to the previous sibling if neither is set (a common pattern:
   * <ul data-paged>...</ul><pager-wc>).
   *
   * @returns {HTMLElement | null}
   */
  #resolveTarget() {
    const sel = this.getAttribute('target');
    if (sel) {
      try { return /** @type {HTMLElement | null} */ (document.querySelector(sel)); } catch { return null; }
    }
    const id = this.getAttribute('for');
    if (id) return /** @type {HTMLElement | null} */ (document.getElementById(id));
    // Implicit: nearest preceding sibling with [data-paged].
    let sib = this.previousElementSibling;
    while (sib) {
      if (sib.hasAttribute('data-paged')) return /** @type {HTMLElement} */ (sib);
      sib = sib.previousElementSibling;
    }
    return null;
  }

  /** Compute current state from the target's attributes + child count. */
  #renderFromTarget() {
    if (!this.#target) return;
    const t = this.#target;
    const size = parseInt(t.dataset.pagedSize || '10', 10) || 10;
    const page = parseInt(t.dataset.pagedPage || '1', 10) || 1;
    // Item count: <table> uses tbody.children, otherwise direct children
    // sans nav/sentinel siblings (which are placed outside the host anyway).
    const items = t.tagName === 'TABLE'
      ? Array.from(t.querySelector(':scope > tbody')?.children || [])
      : Array.from(t.children).filter(
          (n) => !(/** @type {Element} */ (n).matches('nav[data-paged-nav], div[data-paged-sentinel]'))
        );
    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / size));
    this.#renderFor({ page, size, total, totalPages });
  }

  /**
   * Render controls for an explicit pagination state.
   * @param {{page:number,size:number,total:number,totalPages:number}} detail
   */
  #renderFor(detail) {
    const style = this.getAttribute('style') || 'numbered';
    const window = parseInt(this.#target?.dataset.pagedWindow || '2', 10) || 2;
    const sm = paginationState({
      total: detail.total,
      size: detail.size,
      page: detail.page,
      window,
    });

    // For load-more we don't have a 'visible' counter from the engine;
    // approximate from page * size, capped at total. This matches what
    // the in-place data-paged-init does internally.
    const visible = Math.min(detail.page * detail.size, detail.total);

    this.replaceChildren();
    if (style !== 'load-more' && sm.totalPages <= 1) return;

    const nav = buildNav({
      style: /** @type {'numbered' | 'prev-next' | 'load-more'} */ (style),
      page: sm.page,
      totalPages: sm.totalPages,
      pageNumbers: sm.pageNumbers,
      total: detail.total,
      visible,
    });
    wireNav(nav, {
      onNavigate: (page) => this.#dispatch(page),
      onLoadMore: () => this.#dispatchLoadMore(),
    });
    this.appendChild(nav);
  }

  #renderMissing() {
    this.replaceChildren();
    const note = document.createElement('p');
    note.setAttribute('data-pager-missing', '');
    note.setAttribute('aria-live', 'polite');
    note.textContent = 'No paginated target found';
    this.appendChild(note);
  }

  /** @param {number} page */
  #dispatch(page) {
    if (!this.#target) return;
    this.dispatchEvent(new CustomEvent('pager-wc:navigate', { bubbles: true, detail: { page } }));
    this.#target.dispatchEvent(new CustomEvent('paged:goto', { detail: { page } }));
  }

  #dispatchLoadMore() {
    if (!this.#target) return;
    this.#target.dispatchEvent(new CustomEvent('paged:loadmore'));
  }
}

registerComponent('pager-wc', PagerWC);

export { PagerWC };
