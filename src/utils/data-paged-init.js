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

const SELECTOR = '[data-paged]';
const STATE = new WeakMap();

/* ---------- entry point: enhance one container ---------- */

function enhance(host) {
  if (STATE.has(host)) return;

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
      const nav = buildLoadMoreNav(state, sm, cfg);
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

  const nav = cfg.style === 'prev-next' ? buildPrevNextNav(state, sm, cfg) : buildNumberedNav(state, sm, cfg);
  placeNav(state, nav, cfg);
}

function placeNav(state, nav, cfg) {
  const { host } = state;
  if (cfg.controls === 'before' || cfg.controls === 'both') {
    const before = nav.cloneNode(true);
    wireNav(before, state);
    host.parentNode?.insertBefore(before, host);
    state.nav.before = before;
  }
  if (cfg.controls === 'after' || cfg.controls === 'both' || cfg.controls === 'none') {
    // (cfg.controls === 'none' shouldn't reach here for non-progressive)
    wireNav(nav, state);
    host.parentNode?.insertBefore(nav, host.nextSibling);
    state.nav.after = nav;
  }
}

/* ---------- control builders ---------- */

function makeNav() {
  const nav = document.createElement('nav');
  nav.setAttribute('data-paged-nav', '');
  nav.setAttribute('aria-label', 'Pagination');
  return nav;
}

function buildNumberedNav(state, sm, cfg) {
  const nav = makeNav();
  const list = document.createElement('ol');
  list.setAttribute('role', 'list');

  list.appendChild(makePageItem('Previous', sm.page - 1, sm.page === 1, false, 'prev'));

  for (const n of sm.pageNumbers) {
    if (n === '…') {
      const li = document.createElement('li');
      li.textContent = '…';
      li.setAttribute('aria-hidden', 'true');
      li.setAttribute('data-paged-ellipsis', '');
      list.appendChild(li);
    } else {
      list.appendChild(makePageItem(String(n), n, false, n === sm.page, 'page'));
    }
  }

  list.appendChild(makePageItem('Next', sm.page + 1, sm.page === sm.totalPages, false, 'next'));

  nav.appendChild(list);
  return nav;
}

function buildPrevNextNav(state, sm, cfg) {
  const nav = makeNav();
  const list = document.createElement('ol');
  list.setAttribute('role', 'list');
  list.appendChild(makePageItem('Previous', sm.page - 1, sm.page === 1, false, 'prev'));
  const status = document.createElement('li');
  status.setAttribute('data-paged-status', '');
  status.setAttribute('aria-live', 'polite');
  status.textContent = `Page ${sm.page} of ${sm.totalPages}`;
  list.appendChild(status);
  list.appendChild(makePageItem('Next', sm.page + 1, sm.page === sm.totalPages, false, 'next'));
  nav.appendChild(list);
  return nav;
}

function buildLoadMoreNav(state, sm, cfg) {
  const nav = makeNav();
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.setAttribute('data-paged-loadmore', '');
  const remaining = state.children.length - state.visible;
  btn.textContent = remaining > 0 ? `Load more (${remaining})` : 'No more';
  btn.disabled = remaining <= 0;
  btn.addEventListener('click', () => loadMore(state));
  nav.appendChild(btn);
  return nav;
}

function makePageItem(label, page, disabled, current, kind) {
  const li = document.createElement('li');
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.setAttribute('data-paged-action', kind);
  btn.dataset.pagedTarget = String(page);
  btn.textContent = label;
  if (current) {
    btn.setAttribute('aria-current', 'page');
  }
  if (disabled) btn.disabled = true;
  li.appendChild(btn);
  return li;
}

function wireNav(nav, state) {
  nav.querySelectorAll('button[data-paged-target]').forEach((btn) => {
    btn.addEventListener('click', () => goTo(state, parseInt(btn.dataset.pagedTarget || '1', 10)));
  });
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
