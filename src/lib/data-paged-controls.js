/**
 * data-paged-controls: shared DOM builders for the pagination nav strip.
 *
 * Used by both:
 *   - src/utils/data-paged-init.js (the in-place upscale on any container)
 *   - src/web-components/pager-wc/   (the standalone element targeting a container)
 *
 * Keeping this in one place means the two surfaces render identical
 * controls — same markup, same a11y, same data-* hooks for styling.
 *
 * The builders return a freshly-constructed <nav> with no event wiring.
 * Callers wire `data-paged-target` buttons to whatever navigates pages.
 */

/**
 * @param {{
 *   style: 'numbered' | 'prev-next' | 'load-more',
 *   page: number,
 *   totalPages: number,
 *   pageNumbers: Array<number | '…'>,
 *   total: number,
 *   visible: number,
 *   prevLabel?: string,
 *   nextLabel?: string,
 *   loadMoreLabel?: (remaining: number) => string,
 *   noMoreLabel?: string,
 * }} args
 * @returns {HTMLElement}
 */
export function buildNav(args) {
  switch (args.style) {
    case 'load-more': return buildLoadMoreNav(args);
    case 'prev-next': return buildPrevNextNav(args);
    case 'numbered':
    default:          return buildNumberedNav(args);
  }
}

function makeNav() {
  const nav = document.createElement('nav');
  nav.setAttribute('data-paged-nav', '');
  nav.setAttribute('aria-label', 'Pagination');
  return nav;
}

function buildNumberedNav({ page, totalPages, pageNumbers, prevLabel = 'Previous', nextLabel = 'Next' }) {
  const nav = makeNav();
  const list = document.createElement('ol');
  list.setAttribute('role', 'list');

  list.appendChild(pageItem(prevLabel, page - 1, page === 1, false, 'prev'));

  for (const n of pageNumbers) {
    if (n === '…') {
      const li = document.createElement('li');
      li.textContent = '…';
      li.setAttribute('aria-hidden', 'true');
      li.setAttribute('data-paged-ellipsis', '');
      list.appendChild(li);
    } else {
      list.appendChild(pageItem(String(n), n, false, n === page, 'page'));
    }
  }

  list.appendChild(pageItem(nextLabel, page + 1, page === totalPages, false, 'next'));

  nav.appendChild(list);
  return nav;
}

function buildPrevNextNav({ page, totalPages, prevLabel = 'Previous', nextLabel = 'Next' }) {
  const nav = makeNav();
  const list = document.createElement('ol');
  list.setAttribute('role', 'list');
  list.appendChild(pageItem(prevLabel, page - 1, page === 1, false, 'prev'));
  const status = document.createElement('li');
  status.setAttribute('data-paged-status', '');
  status.setAttribute('aria-live', 'polite');
  status.textContent = `Page ${page} of ${totalPages}`;
  list.appendChild(status);
  list.appendChild(pageItem(nextLabel, page + 1, page === totalPages, false, 'next'));
  nav.appendChild(list);
  return nav;
}

function buildLoadMoreNav({ total, visible, loadMoreLabel = (n) => `Load more (${n})`, noMoreLabel = 'No more' }) {
  const nav = makeNav();
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.setAttribute('data-paged-loadmore', '');
  const remaining = total - visible;
  btn.textContent = remaining > 0 ? loadMoreLabel(remaining) : noMoreLabel;
  btn.disabled = remaining <= 0;
  nav.appendChild(btn);
  return nav;
}

/**
 * Build a single navigable list item with a button targeting a 1-based page.
 * @param {string} label
 * @param {number} page          target page
 * @param {boolean} disabled
 * @param {boolean} current      sets aria-current="page"
 * @param {'prev'|'next'|'page'} kind
 */
function pageItem(label, page, disabled, current, kind) {
  const li = document.createElement('li');
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.setAttribute('data-paged-action', kind);
  btn.dataset.pagedTarget = String(page);
  btn.textContent = label;
  if (current) btn.setAttribute('aria-current', 'page');
  if (disabled) btn.disabled = true;
  li.appendChild(btn);
  return li;
}

/**
 * Wire every `[data-paged-target]` button (and any `[data-paged-loadmore]`)
 * inside `nav` to call `onNavigate(page)` / `onLoadMore()`.
 *
 * @param {HTMLElement} nav
 * @param {{ onNavigate?: (page: number) => void, onLoadMore?: () => void }} handlers
 */
export function wireNav(nav, { onNavigate, onLoadMore }) {
  if (onNavigate) {
    nav.querySelectorAll('button[data-paged-target]').forEach((btn) => {
      btn.addEventListener('click', () => onNavigate(parseInt(/** @type {HTMLElement} */ (btn).dataset.pagedTarget || '1', 10)));
    });
  }
  if (onLoadMore) {
    nav.querySelectorAll('button[data-paged-loadmore]').forEach((btn) => {
      btn.addEventListener('click', () => onLoadMore());
    });
  }
}
