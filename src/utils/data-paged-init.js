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
 * @attr {string}  data-paged-controls  - "before" | "after" | "both" | "none" (default "after")
 * @attr {string}  data-paged-url       - Opt-in URL search-param name; uses History API
 *
 * @fires paged:change                  - { page, size, total, totalPages }
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
import { buildNav, wireNav } from '../lib/data-paged-controls.js';

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
    // History pop: re-read.
    window.addEventListener('popstate', () => {
      const url2 = new URL(window.location.href);
      const p2 = url2.searchParams.get(urlParam);
      if (p2) host.setAttribute('data-paged-page', p2);
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
  if (isProgressive) {
    if (state.visible === 0) state.visible = cfg.size || items.length;
    const end = Math.min(state.visible, items.length);
    items.forEach((el, i) => { el.hidden = i >= end; });
  } else {
    items.forEach((el, i) => { el.hidden = i < sm.start || i >= sm.end; });
  }

  renderControls(state, sm, cfg, isProgressive);

  host.dispatchEvent(new CustomEvent('paged:change', {
    bubbles: true,
    detail: {
      page: sm.page,
      size: cfg.size,
      total: items.length,
      totalPages: sm.totalPages,
    },
  }));
}

function renderControls(state, sm, cfg, isProgressive) {
  // Tear down any existing nav / sentinel.
  state.nav.before?.remove();
  state.nav.after?.remove();
  state.sentinel?.remove();
  state.intersect?.disconnect();
  state.intersect = null;
  state.nav = { before: null, after: null };

  if (cfg.controls === 'none' && !isProgressive) return;

  if (isProgressive) {
    if (cfg.style === 'load-more') {
      const nav = buildNav({
        style: 'load-more',
        page: sm.page,
        totalPages: sm.totalPages,
        pageNumbers: sm.pageNumbers,
        total: state.children.length,
        visible: state.visible,
      });
      placeNav(state, nav, cfg);
    } else {
      // infinite — sentinel is a SIBLING (not a child) so it doesn't
      // trip the host's childObserver and cause a render loop.
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
    return;
  }

  if (sm.totalPages <= 1) return;

  const nav = buildNav({
    style: cfg.style,
    page: sm.page,
    totalPages: sm.totalPages,
    pageNumbers: sm.pageNumbers,
    total: state.children.length,
    visible: state.visible,
  });
  placeNav(state, nav, cfg);
}

function placeNav(state, nav, cfg) {
  const { host } = state;
  const handlers = {
    onNavigate: (page) => goTo(state, page),
    onLoadMore: () => loadMore(state),
  };
  if (cfg.controls === 'before' || cfg.controls === 'both') {
    const before = nav.cloneNode(true);
    wireNav(before, handlers);
    host.parentNode?.insertBefore(before, host);
    state.nav.before = before;
  }
  if (cfg.controls === 'after' || cfg.controls === 'both' || cfg.controls === 'none') {
    // (cfg.controls === 'none' shouldn't reach here for non-progressive)
    wireNav(nav, handlers);
    host.parentNode?.insertBefore(nav, host.nextSibling);
    state.nav.after = nav;
  }
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
}

function loadMore(state) {
  const cfg = readConfig(state.host);
  const step = cfg.size || 10;
  state.visible = Math.min(state.visible + step, state.children.length);
  render(state);
}

/* ---------- registration ---------- */

registerInit(SELECTOR, enhance);

export { enhance as initDataPaged };
