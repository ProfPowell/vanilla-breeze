/**
 * data-sortable-init: client-side sorting on any list-shaped container.
 *
 * Two API shapes share one engine:
 *
 *  - **Table mode** — `<table data-sortable>`. Each clickable column header
 *    declares `<th data-sort="key">`. Clicking cycles asc → desc → none → asc.
 *    Row sort-value comes from the corresponding `<td>` in the same column,
 *    via `data-value` if set, then `<time datetime>` for date types,
 *    otherwise `textContent`.
 *
 *  - **List mode** — `<ul data-sortable>` (or any non-table container).
 *    External controls (`<select>` / `<button>`) declare
 *    `data-sort-target="selector"` and an active value (button: `data-sort-by`,
 *    select: the option `value`). Each item declares `data-sort-{key}=value`.
 *    Leading "-" on the value flips direction (e.g. `value="-date"` for newest).
 *
 * Composes with `data-paged`: sort fires a child-list mutation; data-paged
 * re-paginates from page 1.
 *
 * @attr {boolean} data-sortable           opt-in on container
 * @attr {string}  data-sortable-default   initial sort key (e.g. "-date")
 * @attr {string}  data-sort-by            (reflected) current sort key
 * @attr {string}  data-sort-direction     (reflected) "asc" | "desc" | "none"
 * @attr {string}  data-sort                on <th>: column key (table mode)
 * @attr {string}  data-sort-type          on container or <th>: "text"|"number"|"date"
 * @attr {string}  data-sort-target        on external controls: CSS selector
 *
 * @fires sort:change                       { key, direction, total }
 *
 * @example Table — clickable column headers
 *   <table data-sortable>
 *     <thead><tr>
 *       <th data-sort="name">Name</th>
 *       <th data-sort="date" data-sort-type="date">Date</th>
 *     </tr></thead>
 *     <tbody>
 *       <tr><td>Alice</td><td><time datetime="2026-05-01">May 1</time></td></tr>
 *     </tbody>
 *   </table>
 *
 * @example List with external select
 *   <select data-sort-target="#feed">
 *     <option value="name">Name (A-Z)</option>
 *     <option value="-date">Newest first</option>
 *   </select>
 *   <ul id="feed" data-sortable>
 *     <li data-sort-name="Alice" data-sort-date="2026-05-01">...</li>
 *   </ul>
 */

import { registerInit } from './_init-registry.js';
import { parseKey, sortIndices, cycleDirection } from '../lib/data-sortable.js';

const SELECTOR = '[data-sortable]';
const ENHANCED = new WeakSet();

function enhance(host) {
  if (ENHANCED.has(host)) return;
  ENHANCED.add(host);

  const isTable = host.tagName === 'TABLE';

  if (isTable) wireTableHeaders(host);

  // Apply data-sortable-default if present (only if no current sort).
  const initial = host.dataset.sortableDefault;
  if (initial && !host.dataset.sortBy) {
    const parsed = parseKey(initial);
    if (parsed) applySort(host, parsed.key, parsed.direction);
  }
}

/* ---------- table mode ---------- */

function wireTableHeaders(table) {
  const headers = table.querySelectorAll(':scope > thead th[data-sort]');
  headers.forEach((th) => {
    th.setAttribute('role', 'button');
    th.setAttribute('tabindex', '0');
    th.style.cursor = 'pointer';

    const onActivate = () => {
      const key = th.dataset.sort;
      if (!key) return;
      const current = (table.dataset.sortBy === key) ? table.dataset.sortDirection : 'none';
      const next = cycleDirection(current || 'none');
      if (next === 'none') {
        applySort(table, '', 'none');
      } else {
        applySort(table, key, next, th.dataset.sortType);
      }
    };
    th.addEventListener('click', onActivate);
    th.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onActivate();
      }
    });
  });
}

/* ---------- list mode (external controls) ---------- */

function findExternalControls() {
  return document.querySelectorAll('[data-sort-target]');
}

function wireExternalControls() {
  for (const ctrl of findExternalControls()) {
    if (ENHANCED.has(ctrl)) continue;
    ENHANCED.add(ctrl);

    const selector = ctrl.getAttribute('data-sort-target');
    if (!selector) continue;
    const target = document.querySelector(selector);
    if (!target || !target.matches('[data-sortable]')) continue;

    if (ctrl.tagName === 'SELECT') {
      ctrl.addEventListener('change', () => {
        const v = /** @type {HTMLSelectElement} */ (ctrl).value;
        const parsed = parseKey(v);
        if (!parsed) { applySort(target, '', 'none'); return; }
        applySort(target, parsed.key, parsed.direction);
      });
      // Apply initial value if select has one selected.
      const initial = /** @type {HTMLSelectElement} */ (ctrl).value;
      if (initial) {
        const parsed = parseKey(initial);
        if (parsed) applySort(target, parsed.key, parsed.direction);
      }
    } else {
      // Button-style control: data-sort-by gives the key (with optional - prefix).
      ctrl.addEventListener('click', () => {
        const v = ctrl.getAttribute('data-sort-by') || '';
        const parsed = parseKey(v);
        if (!parsed) return;
        applySort(target, parsed.key, parsed.direction);
      });
    }
  }
}

/* ---------- core sort + apply ---------- */

/**
 * Project a sort-value out of a row / item for the named key.
 *
 * Table cells: prefer data-value, then <time datetime> when type=date,
 * otherwise textContent.
 *
 * List items: prefer data-sort-{key}, then a child element matching
 * [data-sort-{key}-value] (rare), otherwise data-value, otherwise textContent.
 * @param item
 * @param key
 * @param type
 * @param opts
 */
function projectValue(item, key, type, opts = {}) {
  if (opts.isTable) {
    const colIndex = opts.colIndex;
    const cell = item.children[colIndex];
    if (!cell) return '';
    if (cell.dataset.value != null) return cell.dataset.value;
    if (type === 'date') {
      const t = cell.querySelector('time[datetime]');
      if (t) return t.getAttribute('datetime') || '';
    }
    return (cell.textContent || '').trim();
  }
  // List item
  const direct = item.dataset[`sort${capitalize(key)}`];
  if (direct != null) return direct;
  if (item.dataset.value != null) return item.dataset.value;
  return (item.textContent || '').trim();
}

function capitalize(s) {
  if (!s) return '';
  return s[0].toUpperCase() + s.slice(1);
}

function getItems(host) {
  if (host.tagName === 'TABLE') {
    const tbody = host.querySelector(':scope > tbody');
    return tbody ? Array.from(tbody.children) : [];
  }
  return Array.from(host.children);
}

function getColIndex(table, key) {
  const headers = Array.from(table.querySelectorAll(':scope > thead th'));
  return headers.findIndex((th) => th.dataset.sort === key);
}

/**
 * Apply a sort to a host container. Reorders DOM nodes in place and
 * reflects state attributes (data-sort-by, data-sort-direction) on the
 * host. Updates aria-sort on table headers.
 * @param host
 * @param key
 * @param direction
 * @param typeHint
 */
function applySort(host, key, direction, typeHint) {
  const isTable = host.tagName === 'TABLE';
  const items = getItems(host);

  if (direction === 'none' || !key) {
    host.removeAttribute('data-sort-by');
    host.dataset.sortDirection = 'none';
    if (isTable) updateAriaSort(host, '', 'none');
    host.dispatchEvent(new CustomEvent('sort:change', {
      bubbles: true,
      detail: { key: '', direction: 'none', total: items.length },
    }));
    return;
  }

  const type = resolveType(host, key, typeHint);
  const colIndex = isTable ? getColIndex(host, key) : -1;

  const order = sortIndices(
    items,
    (it) => projectValue(it, key, type, { isTable, colIndex }),
    type,
    direction,
  );

  const parent = isTable ? host.querySelector(':scope > tbody') : host;
  if (!parent) return;
  // Re-insert in order. appendChild moves nodes — no clone needed.
  for (const i of order) parent.appendChild(items[i]);

  host.dataset.sortBy = key;
  host.dataset.sortDirection = direction;

  if (isTable) updateAriaSort(host, key, direction);

  // If the host is also data-paged, reset to page 1 — the sort changed
  // the item order, so the user's previous "page 2" no longer means
  // anything coherent. Append (a different mutation) preserves position.
  if (host.hasAttribute('data-paged')) {
    host.dispatchEvent(new CustomEvent('paged:goto', { detail: { page: 1 } }));
  }

  host.dispatchEvent(new CustomEvent('sort:change', {
    bubbles: true,
    detail: { key, direction, total: items.length },
  }));
}

function resolveType(host, key, hint) {
  if (hint === 'text' || hint === 'number' || hint === 'date') return hint;
  if (host.tagName === 'TABLE') {
    const th = host.querySelector(`:scope > thead th[data-sort="${escSel(key)}"]`);
    const t = th?.dataset.sortType;
    if (t === 'text' || t === 'number' || t === 'date') return t;
  }
  const containerType = host.dataset.sortType;
  if (containerType === 'text' || containerType === 'number' || containerType === 'date') return containerType;
  return 'text';
}

function escSel(s) {
  return String(s).replace(/["\\]/g, '\\$&');
}

function updateAriaSort(table, activeKey, direction) {
  const headers = table.querySelectorAll(':scope > thead th[data-sort]');
  headers.forEach((th) => {
    if (th.dataset.sort === activeKey && direction !== 'none') {
      th.setAttribute('aria-sort', direction === 'asc' ? 'ascending' : 'descending');
    } else {
      th.setAttribute('aria-sort', 'none');
    }
  });
}

/* ---------- registration ---------- */

registerInit(SELECTOR, enhance);
// External controls must be wired AFTER both the control and its target are
// in the DOM. Run on initial registration + watch for new controls.
if (typeof document !== 'undefined') {
  if (document.readyState !== 'loading') {
    wireExternalControls();
  } else {
    document.addEventListener('DOMContentLoaded', wireExternalControls);
  }
  // Re-scan for late-added controls when the registry observes new nodes.
  registerInit('[data-sort-target]', () => wireExternalControls());
}

export { enhance as initDataSortable };
