/**
 * data-paged-init: Upscale `[data-paged]` containers with pagination.
 *
 * Drop `data-paged` on any list-shaped container — native `<ul>`, `<ol>`,
 * `<table>` (paginates `<tbody>` rows), or VB collection (`<card-list>`,
 * `<data-table>`, `<layout-grid>`) — and direct children get sliced into
 * pages with injected `<nav>` controls.
 *
 * Same upscale-attribute model as data-spellcheck / data-accordion /
 * data-responsive: pure attribute, no custom element, auto-attaches via
 * the shared init registry.
 *
 * @attr {boolean} data-paged           - Opt-in
 * @attr {number}  data-paged-size      - Items per page (default 10; 0 disables)
 * @attr {number}  data-paged-page      - Initial 1-based page (default 1)
 * @attr {string}  data-paged-style     - "numbered" | "prev-next" | "load-more" | "infinite"
 *                                        (default "numbered")
 * @attr {number}  data-paged-window    - Numbers around current for "numbered" (default 2)
 * @attr {string}  data-paged-controls  - "before" | "after" | "both" | "none" (default "after").
 *                                        "none" also suppresses the load-more button (drive it
 *                                        from <pager-wc data-style="load-more">); the infinite
 *                                        sentinel is not a control and always renders.
 * @attr {string}  data-paged-url       - Opt-in URL search-param name; uses History API
 * @attr {string}  data-label-nav       - Nav landmark name (default "Pagination")
 * @attr {string}  data-label-prev      - Previous button text (default "Previous")
 * @attr {string}  data-label-next      - Next button text (default "Next")
 * @attr {string}  data-label-page      - Page button name, {page} (default "Page {page}")
 * @attr {string}  data-label-status    - Page status, {page}/{total} (default "Page {page} of {total}")
 * @attr {string}  data-label-load-more - Load-more text, {n} remaining (default "Load more ({n})")
 * @attr {string}  data-label-no-more   - Exhausted load-more text (default "No more")
 * @attr {string}  data-label-showing   - Announced after load-more, {visible}/{total} (default "Showing {visible} of {total}")
 *                                        The data-label-* strings are the same set <pager-wc> reads; they are read
 *                                        from the container or any ancestor (set once on <html lang> / <main>).
 *
 * @fires paged:change                  - { page, size, total, totalPages, visible, style }
 *                                        visible = number of items currently shown
 *
 * @example
 *   <ul data-paged data-paged-size="10">
 *     <li>...</li>
 *   </ul>
 *
 * @example
 *   <card-list data-paged data-paged-size="20" data-paged-style="numbered" data-paged-url="page">
 *     <article>...</article>
 *   </card-list>
 */

import { registerInit } from './_init-registry.js';
import { paginationState } from '../lib/data-paged.js';
import { buildNav, wireNav, replaceNav, fillTemplate } from '../lib/data-paged-controls.js';
import { announce, readLabel } from '../lib/announce.js';
import { getLocale } from '../lib/i18n.js';

const SELECTOR = '[data-paged]';
const STATE = new WeakMap();

/* ---------- entry point: enhance one container ---------- */

function enhance(host) {
  if (STATE.has(host)) return;

  /** @type {{host: any, nav: any, sentinel: any, intersect: any, children: any[], childObserver: MutationObserver | null, visible: number}} */
  const state = {
    host,
    nav: { before: null, after: null },
    sentinel: null,
    intersect: null,
    children: [],            // live cache of paginated children
    childObserver: null,
    visible: 0,              // for load-more / infinite styles, how many pages currently shown
  };
  STATE.set(host, state);

  // Sync initial page from URL if data-paged-url is set.
  const urlParam = host.dataset.pagedUrl;
  if (urlParam) {
    const url = new URL(window.location.href);
    const p = url.searchParams.get(urlParam);
    if (p && !host.hasAttribute('data-paged-page')) {
      host.setAttribute('data-paged-page', p);
    }
    // History pop: re-read and re-render. No param means page 1.
    window.addEventListener('popstate', () => {
      if (!host.isConnected) return;
      const url2 = new URL(window.location.href);
      host.setAttribute('data-paged-page', url2.searchParams.get(urlParam) || '1');
      render(state);
    });
  }

  // Re-paginate when children change.
  state.childObserver = new MutationObserver(() => render(state));
  state.childObserver.observe(host, { childList: true });

  // External-control hooks — pager-wc and other consumers drive
  // navigation by dispatching these events on the host. Same
  // contract for in-place and decoupled controls.
  host.addEventListener('paged:goto',     (e) => goTo(state, /** @type {CustomEvent} */ (e).detail?.page ?? 1));
  host.addEventListener('paged:loadmore', () => loadMore(state));

  render(state);
}

/* ---------- per-container: read attrs, slice children, render controls ---------- */

function readConfig(host) {
  return {
    size:     parseInt(host.dataset.pagedSize || '10', 10) || 0,
    page:     parseInt(host.dataset.pagedPage || '1', 10) || 1,
    style:    host.dataset.pagedStyle || 'numbered',
    window:   parseInt(host.dataset.pagedWindow || '2', 10) || 2,
    controls: host.dataset.pagedControls || 'after',
    urlParam: host.dataset.pagedUrl || '',
  };
}

/**
 * The "items" are direct children, EXCEPT the injected nav nodes and
 * (for tables) we paginate `<tbody>` rows instead of the host's direct
 * children. Returns an array of elements to slice.
 */
function getItems(host) {
  if (host.tagName === 'TABLE') {
    const tbody = host.querySelector(':scope > tbody');
    if (tbody) return Array.from(tbody.children);
  }
  return Array.from(host.children).filter(
    (n) => !n.matches('nav[data-paged-nav], div[data-paged-sentinel]')
  );
}

function render(state) {
  const { host } = state;
  const cfg = readConfig(host);
  const items = getItems(host);
  state.children = items;

  const sm = paginationState({
    total: items.length,
    size:  cfg.size,
    page:  cfg.page,
    window: cfg.window,
  });

  // For load-more / infinite, "visible" is a sliding upper bound that
  // grows monotonically with explicit user / sentinel actions.
  const isProgressive = cfg.style === 'load-more' || cfg.style === 'infinite';
  let shown;
  if (isProgressive) {
    if (state.visible === 0) state.visible = cfg.size || items.length;
    const end = Math.min(state.visible, items.length);
    items.forEach((el, i) => { el.hidden = i >= end; });
    shown = end;
  } else {
    items.forEach((el, i) => { el.hidden = i < sm.start || i >= sm.end; });
    shown = Math.max(0, sm.end - sm.start);
  }

  renderControls(state, sm, cfg, isProgressive);

  host.dispatchEvent(new CustomEvent('paged:change', {
    bubbles: true,
    detail: {
      page: sm.page,
      size: cfg.size,
      total: items.length,
      totalPages: sm.totalPages,
      visible: shown,
      style: cfg.style,
    },
  }));
}

/**
 * Nav strings: data-label-* on the host or an ancestor, numbers formatted
 * for the host's language. Same keys as <pager-wc>.
 * @param {HTMLElement} host
 */
function navLabels(host) {
  const nf = new Intl.NumberFormat(getLocale(host));
  const label = (/** @type {string} */ name, /** @type {string} */ fallback) => readLabel(host, name, fallback);
  return {
    navLabel: label('nav', 'Pagination'),
    prevLabel: label('prev', 'Previous'),
    nextLabel: label('next', 'Next'),
    pageLabel: (/** @type {number} */ n) => fillTemplate(label('page', 'Page {page}'), { page: nf.format(n) }),
    statusLabel: (/** @type {number} */ p, /** @type {number} */ t) => fillTemplate(label('status', 'Page {page} of {total}'), { page: nf.format(p), total: nf.format(t) }),
    loadMoreLabel: (/** @type {number} */ n) => fillTemplate(label('load-more', 'Load more ({n})'), { n: nf.format(n) }),
    noMoreLabel: label('no-more', 'No more'),
  };
}

function renderControls(state, sm, cfg, isProgressive) {
  // The infinite sentinel is rebuilt every render; navs are swapped in
  // place (replaceNav) so focus and the prev-next live region survive.
  state.sentinel?.remove();
  state.sentinel = null;
  state.intersect?.disconnect();
  state.intersect = null;

  /** @type {HTMLElement | null} */
  let nav = null;
  if (cfg.controls !== 'none') {
    if (cfg.style === 'load-more') {
      nav = buildNav({
        style: 'load-more',
        page: sm.page,
        totalPages: sm.totalPages,
        pageNumbers: sm.pageNumbers,
        total: state.children.length,
        visible: state.visible,
        ...navLabels(state.host),
      });
    } else if (!isProgressive && sm.totalPages > 1) {
      nav = buildNav({
        style: cfg.style,
        page: sm.page,
        totalPages: sm.totalPages,
        pageNumbers: sm.pageNumbers,
        total: state.children.length,
        visible: state.visible,
        ...navLabels(state.host),
      });
    }
  }

  if (cfg.style === 'infinite') {
    // Sentinel is a SIBLING (not a child) so it doesn't trip the host's
    // childObserver and cause a render loop.
    const sentinel = document.createElement('div');
    sentinel.setAttribute('data-paged-sentinel', '');
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.style.cssText = 'block-size:1px;inline-size:100%';
    state.host.parentNode?.insertBefore(sentinel, state.host.nextSibling);
    state.sentinel = sentinel;
    state.intersect = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) loadMore(state);
      }
    }, { rootMargin: '200px' });
    state.intersect.observe(sentinel);
  }

  placeNav(state, nav, cfg);
}

function placeNav(state, nav, cfg) {
  const { host } = state;
  const handlers = {
    onNavigate: (page) => goTo(state, page),
    onLoadMore: () => loadMore(state),
  };
  const wantBefore = !!nav && (cfg.controls === 'before' || cfg.controls === 'both');
  const wantAfter  = !!nav && (cfg.controls === 'after' || cfg.controls === 'both');

  /** @type {HTMLElement | null} */
  let before = null;
  if (wantBefore) {
    before = /** @type {HTMLElement} */ (wantAfter ? nav.cloneNode(true) : nav);
    // Only one copy carries the polite live region when both render.
    if (wantAfter) before.querySelector('[data-paged-status]')?.removeAttribute('aria-live');
    wireNav(before, handlers);
  }
  const after = wantAfter ? nav : null;
  if (after) wireNav(after, handlers);

  state.nav.before = swapSlot(state.nav.before, before, (n) => host.parentNode?.insertBefore(n, host));
  state.nav.after  = swapSlot(state.nav.after, after, (n) => host.parentNode?.insertBefore(n, host.nextSibling));
}

/**
 * @param {HTMLElement | null} oldNav
 * @param {HTMLElement | null} newNav
 * @param {(n: HTMLElement) => void} insert
 */
function swapSlot(oldNav, newNav, insert) {
  if (oldNav?.isConnected && newNav) { replaceNav(oldNav, newNav); return newNav; }
  oldNav?.remove();
  if (newNav) insert(newNav);
  return newNav;
}

/* ---------- transitions ---------- */

function goTo(state, page) {
  const { host } = state;
  const cfg = readConfig(host);
  const items = getItems(host);
  const sm = paginationState({ total: items.length, size: cfg.size, page, window: cfg.window });
  if (sm.page === cfg.page) return;
  host.setAttribute('data-paged-page', String(sm.page));
  if (cfg.urlParam) {
    const url = new URL(window.location.href);
    url.searchParams.set(cfg.urlParam, String(sm.page));
    window.history.pushState({}, '', url);
  }
  render(state);
  // prev-next carries its own live status; numbered pages are announced here.
  if (cfg.style !== 'prev-next') {
    announce(navLabels(host).statusLabel(sm.page, sm.totalPages));
  }
}

function loadMore(state) {
  const cfg = readConfig(state.host);
  const step = cfg.size || 10;
  const before = state.visible;
  state.visible = Math.min(state.visible + step, state.children.length);
  render(state);
  if (state.visible > before) {
    const nf = new Intl.NumberFormat(getLocale(state.host));
    announce(readLabel(state.host, 'showing', 'Showing {visible} of {total}', {
      visible: nf.format(state.visible),
      total: nf.format(state.children.length),
    }));
  }
}

/* ---------- registration ---------- */

registerInit(SELECTOR, enhance);

export { enhance as initDataPaged };
