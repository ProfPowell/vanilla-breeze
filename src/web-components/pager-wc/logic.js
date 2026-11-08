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
 * The element listens for `paged:change` (at document level, so a target
 * inserted later is picked up) and re-renders. Buttons dispatch
 * `paged:goto { page }` (or `paged:loadmore`) on the target, which the
 * data-paged engine handles via event listeners registered during enhance().
 *
 * @attr {string}  target      - CSS selector for the [data-paged] container (preferred)
 * @attr {string}  for         - ID of the target container (alternative; HTML-form-style)
 * @attr {string}  data-style  - "numbered" (default) | "prev-next" | "load-more".
 *                               load-more needs a progressive target
 *                               (data-paged-style="load-more"). Infinite is
 *                               intentionally unsupported for decoupled controls.
 * @attr {string}  data-label-nav       - Nav landmark name (default "Pagination")
 * @attr {string}  data-label-prev      - Previous button text (default "Previous")
 * @attr {string}  data-label-next      - Next button text (default "Next")
 * @attr {string}  data-label-page      - Page button name, {page} (default "Page {page}")
 * @attr {string}  data-label-status    - prev-next status, {page}/{total} (default "Page {page} of {total}")
 * @attr {string}  data-label-load-more - Load-more text, {n} remaining (default "Load more ({n})")
 * @attr {string}  data-label-no-more   - Exhausted load-more text (default "No more")
 * @attr {string}  data-label-missing   - Note shown when no target resolves (default "No paginated target found")
 *
 * @fires pager-wc:navigate - { page } — bubbles before the target's data-paged engine
 *                            processes a page navigation (not fired for load-more;
 *                            not cancelable). Use for analytics / scroll-restore.
 *
 * @example Controls in header, items below
 *   <pager-wc target="#feed"></pager-wc>
 *   <ul id="feed" data-paged data-paged-size="10"> ... </ul>
 *
 * @example Top + bottom controls staying in sync
 *   <pager-wc target="#feed" data-label-nav="Results pages, top"></pager-wc>
 *   <ul id="feed" data-paged data-paged-size="20"> ... </ul>
 *   <pager-wc target="#feed" data-label-nav="Results pages, bottom"></pager-wc>
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';
import { paginationState } from '../../lib/data-paged.js';
import { buildNav, wireNav, replaceNav, fillTemplate } from '../../lib/data-paged-controls.js';

const STYLES = ['numbered', 'prev-next', 'load-more'];
const LABEL_ATTRS = [
  'data-label-nav', 'data-label-prev', 'data-label-next', 'data-label-page',
  'data-label-status', 'data-label-load-more', 'data-label-no-more', 'data-label-missing',
];

/**
 * @typedef {{ page: number, size: number, total: number, totalPages: number, visible?: number, style?: string }} PagedDetail
 */

class PagerWC extends VBElement {
  static observedAttributes = ['target', 'for', 'data-style', 'aria-label', ...LABEL_ATTRS];

  /** @type {HTMLElement | null} */
  #target = null;
  /** @type {PagedDetail | null} */
  #last = null;
  #warnedStyle = false;

  setup() {
    // Document-level: catches the target's paged:change even when the
    // target is inserted (and enhanced) after this element.
    this.listen(document, 'paged:change', (e) => this.#onChange(/** @type {CustomEvent} */ (e)));
    this.#target = this.#resolveTarget();
    this.#renderFromTarget();
  }

  teardown() {
    this.#target = null;
    this.#last = null;
  }

  attributeChangedCallback(/** @type {string} */ name, /** @type {string|null} */ oldVal, /** @type {string|null} */ newVal) {
    if (oldVal === newVal || !this.isConnected || !this.hasAttribute('data-upgraded')) return;
    if (name === 'target' || name === 'for') {
      this.#target = this.#resolveTarget();
      this.#last = null;
      this.#renderFromTarget();
    } else if (this.#last) {
      this.#renderFor(this.#last);
    } else {
      this.#renderFromTarget();
    }
  }

  /**
   * @param {CustomEvent} e
   */
  #onChange(e) {
    if (!this.#target || !this.#target.isConnected || e.target !== this.#target) {
      this.#target = this.#resolveTarget();
    }
    if (e.target !== this.#target) return;
    this.#renderFor(e.detail);
  }

  /**
   * Resolve target via `target` (CSS selector) then `for` (id), falling
   * back to the nearest preceding [data-paged] sibling. Only an element
   * carrying [data-paged] counts — anything else has no engine listening.
   *
   * @returns {HTMLElement | null}
   */
  #resolveTarget() {
    /** @type {Element | null} */
    let el = null;
    const sel = this.getAttribute('target');
    const id = this.getAttribute('for');
    if (sel) {
      try { el = document.querySelector(sel); } catch { el = null; }
    } else if (id) {
      el = document.getElementById(id);
    } else {
      let sib = this.previousElementSibling;
      while (sib && !sib.hasAttribute('data-paged')) sib = sib.previousElementSibling;
      el = sib;
    }
    return el && el.hasAttribute('data-paged') ? /** @type {HTMLElement} */ (el) : null;
  }

  /** Compute current state from the target's attributes + children. */
  #renderFromTarget() {
    const t = this.#target;
    if (!t) { this.#renderMissing(); return; }
    const size = parseInt(t.dataset.pagedSize || '10', 10) || 0;
    const page = parseInt(t.dataset.pagedPage || '1', 10) || 1;
    const items = t.tagName === 'TABLE'
      ? Array.from(t.querySelector(':scope > tbody')?.children || [])
      : Array.from(t.children).filter(
          (n) => !(/** @type {Element} */ (n).matches('nav[data-paged-nav], div[data-paged-sentinel]'))
        );
    const total = items.length;
    const totalPages = size > 0 ? Math.max(1, Math.ceil(total / size)) : 1;
    // Engine already ran → trust the hidden flags; otherwise one page.
    const enhanced = items.some((n) => /** @type {HTMLElement} */ (n).hidden);
    const visible = enhanced
      ? items.filter((n) => !(/** @type {HTMLElement} */ (n).hidden)).length
      : Math.min(size || total, total);
    this.#renderFor({ page, size, total, totalPages, visible, style: t.dataset.pagedStyle || 'numbered' });
  }

  /** @returns {'numbered' | 'prev-next' | 'load-more'} */
  #style() {
    const s = this.getAttribute('data-style') || 'numbered';
    return /** @type {any} */ (STYLES.includes(s) ? s : 'numbered');
  }

  /**
   * @param {string} name
   * @param {string} fallback
   */
  #label(name, fallback) {
    return this.getAttribute(`data-label-${name}`) || fallback;
  }

  /**
   * @param {PagedDetail} detail
   */
  #renderFor(detail) {
    this.#last = detail;
    const style = this.#style();
    const target = this.#target;
    if (!target) { this.#renderMissing(); return; }

    if (style === 'load-more' && !this.#warnedStyle && !/^(load-more|infinite)$/.test(target.dataset.pagedStyle || '')) {
      this.#warnedStyle = true;
      console.warn('[pager-wc] data-style="load-more" needs a progressive target: set data-paged-style="load-more" on', target);
    }

    const sm = paginationState({
      total: detail.total,
      size: detail.size,
      page: detail.page,
      window: parseInt(target.dataset.pagedWindow || '2', 10) || 2,
    });
    const visible = typeof detail.visible === 'number'
      ? detail.visible
      : Math.min(detail.page * detail.size, detail.total);

    const old = /** @type {HTMLElement | null} */ (this.querySelector(':scope > nav[data-paged-nav]'));
    this.querySelector(':scope > [data-pager-missing]')?.remove();

    if (style !== 'load-more' && sm.totalPages <= 1) {
      old?.remove();
      return;
    }

    const nav = buildNav({
      style,
      page: sm.page,
      totalPages: sm.totalPages,
      pageNumbers: sm.pageNumbers,
      total: detail.total,
      visible,
      navLabel: this.#label('nav', this.getAttribute('aria-label') || 'Pagination'),
      prevLabel: this.#label('prev', 'Previous'),
      nextLabel: this.#label('next', 'Next'),
      pageLabel: (n) => fillTemplate(this.#label('page', 'Page {page}'), { page: n }),
      statusLabel: (p, t) => fillTemplate(this.#label('status', 'Page {page} of {total}'), { page: p, total: t }),
      loadMoreLabel: (n) => fillTemplate(this.#label('load-more', 'Load more ({n})'), { n }),
      noMoreLabel: this.#label('no-more', 'No more'),
    });
    wireNav(nav, {
      onNavigate: (page) => this.#dispatch(page),
      onLoadMore: () => this.#dispatchLoadMore(),
    });
    if (old) replaceNav(old, nav);
    else this.appendChild(nav);
  }

  #renderMissing() {
    this.querySelector(':scope > nav[data-paged-nav]')?.remove();
    let note = this.querySelector(':scope > [data-pager-missing]');
    if (!note) {
      note = document.createElement('p');
      note.setAttribute('data-pager-missing', '');
      this.appendChild(note);
    }
    note.textContent = this.#label('missing', 'No paginated target found');
  }

  /** Re-resolve if the bound target went away (lazy resolution). */
  #liveTarget() {
    if (!this.#target?.isConnected) this.#target = this.#resolveTarget();
    return this.#target;
  }

  /**
   * @param {number} page
   */
  #dispatch(page) {
    const target = this.#liveTarget();
    if (!target) return;
    this.dispatchEvent(new CustomEvent('pager-wc:navigate', { bubbles: true, detail: { page } }));
    target.dispatchEvent(new CustomEvent('paged:goto', { detail: { page } }));
  }

  #dispatchLoadMore() {
    this.#liveTarget()?.dispatchEvent(new CustomEvent('paged:loadmore'));
  }
}

registerComponent('pager-wc', PagerWC);

export { PagerWC };
