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
 * Callers wire `data-paged-target` buttons to whatever navigates pages,
 * and swap an old nav for a new one with `replaceNav()` so focus and the
 * prev-next live region survive the re-render.
 */

/**
 * @typedef {{
 *   style: 'numbered' | 'prev-next' | 'load-more',
 *   page: number,
 *   totalPages: number,
 *   pageNumbers: Array<number | '…'>,
 *   total: number,
 *   visible: number,
 *   navLabel?: string,
 *   prevLabel?: string,
 *   nextLabel?: string,
 *   pageLabel?: (page: number) => string,
 *   statusLabel?: (page: number, total: number) => string,
 *   loadMoreLabel?: (remaining: number) => string,
 *   noMoreLabel?: string,
 * }} NavArgs
 */

/**
 * Fill a `{name}` template. Unknown names are left as-is.
 * @param {string} template
 * @param {Record<string, string | number>} values
 * @returns {string}
 */
export function fillTemplate(template, values) {
  return template.replace(/\{(\w+)\}/g, (m, k) => (k in values ? String(values[k]) : m));
}

/**
 * @param {NavArgs} args
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

/** @param {string} [label] */
function makeNav(label = 'Pagination') {
  const nav = document.createElement('nav');
  nav.setAttribute('data-paged-nav', '');
  nav.setAttribute('aria-label', label);
  return nav;
}

/** @param {NavArgs} args */
function buildNumberedNav({ page, totalPages, pageNumbers, navLabel, prevLabel = 'Previous', nextLabel = 'Next', pageLabel = (n) => `Page ${n}` }) {
  const nav = makeNav(navLabel);
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
      const item = pageItem(String(n), n, false, n === page, 'page');
      item.firstElementChild?.setAttribute('aria-label', pageLabel(n));
      list.appendChild(item);
    }
  }

  list.appendChild(pageItem(nextLabel, page + 1, page === totalPages, false, 'next'));

  nav.appendChild(list);
  return nav;
}

/** @param {NavArgs} args */
function buildPrevNextNav({ page, totalPages, navLabel, prevLabel = 'Previous', nextLabel = 'Next', statusLabel = (p, t) => `Page ${p} of ${t}` }) {
  const nav = makeNav(navLabel);
  const list = document.createElement('ol');
  list.setAttribute('role', 'list');
  list.appendChild(pageItem(prevLabel, page - 1, page === 1, false, 'prev'));
  const status = document.createElement('li');
  status.setAttribute('data-paged-status', '');
  status.setAttribute('aria-live', 'polite');
  status.textContent = statusLabel(page, totalPages);
  list.appendChild(status);
  list.appendChild(pageItem(nextLabel, page + 1, page === totalPages, false, 'next'));
  nav.appendChild(list);
  return nav;
}

/** @param {NavArgs} args */
function buildLoadMoreNav({ total, visible, navLabel, loadMoreLabel = (n) => `Load more (${n})`, noMoreLabel = 'No more' }) {
  const nav = makeNav(navLabel);
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.setAttribute('data-paged-loadmore', '');
  const remaining = Math.max(0, total - visible);
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

/**
 * Swap `oldNav` for `newNav` in the DOM without dropping the user's place:
 *   - the prev-next status node is carried over (same node, new text), so
 *     the polite live region is persistent and its change is announced;
 *   - if focus was inside `oldNav`, it moves to the equivalent button in
 *     `newNav` (same action + target, else same action, else the current
 *     page, else the first enabled button, else the nav itself).
 *
 * @param {HTMLElement | null} oldNav
 * @param {HTMLElement} newNav
 */
export function replaceNav(oldNav, newNav) {
  if (!oldNav || !oldNav.parentNode) return;
  const active = /** @type {HTMLElement | null} */ (document.activeElement);
  const hadFocus = !!active && oldNav.contains(active);
  const key = hadFocus && active
    ? {
        action: active.getAttribute('data-paged-action'),
        target: active.getAttribute('data-paged-target'),
        loadMore: active.hasAttribute('data-paged-loadmore'),
      }
    : null;

  const oldStatus = oldNav.querySelector('[data-paged-status]');
  const newStatus = newNav.querySelector('[data-paged-status]');
  if (oldStatus && newStatus) {
    if (oldStatus.textContent !== newStatus.textContent) oldStatus.textContent = newStatus.textContent;
    if (newStatus.hasAttribute('aria-live')) oldStatus.setAttribute('aria-live', newStatus.getAttribute('aria-live') || 'polite');
    else oldStatus.removeAttribute('aria-live');
    newStatus.replaceWith(oldStatus);
  }

  oldNav.replaceWith(newNav);
  if (key) restoreFocus(newNav, key);
}

/**
 * @param {HTMLElement} nav
 * @param {{ action: string | null, target: string | null, loadMore: boolean }} key
 */
function restoreFocus(nav, key) {
  const enabled = (/** @type {string} */ sel) =>
    /** @type {HTMLButtonElement | null} */ (nav.querySelector(`${sel}:not([disabled])`));
  const candidates = [];
  if (key.loadMore) candidates.push('button[data-paged-loadmore]');
  if (key.action) {
    candidates.push(`button[data-paged-action="${key.action}"][data-paged-target="${key.target}"]`);
    if (key.action !== 'page') candidates.push(`button[data-paged-action="${key.action}"]`);
  }
  candidates.push('button[aria-current="page"]', 'button');
  for (const sel of candidates) {
    const btn = enabled(sel);
    if (btn) { btn.focus(); return; }
  }
  // Nothing focusable left (e.g. "No more"): keep focus in the region.
  nav.tabIndex = -1;
  nav.focus();
}
