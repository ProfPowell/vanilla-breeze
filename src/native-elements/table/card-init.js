/**
 * table card-init: keeps table semantics for `table[data-responsive="card"]`.
 *
 * Card mode re-displays rows and cells as blocks, which drops the implicit
 * table roles in some engines (WebKit in particular). This restores them
 * explicitly — table / rowgroup / row / columnheader / rowheader / cell —
 * and fills a missing `data-label` on each body/footer cell from its column
 * header text, so authors don't have to copy labels by hand. Rows added
 * later (data-table paging, author scripts) are decorated too.
 *
 * Authored `role` and `data-label` values are never overwritten.
 *
 * @attr {string} data-responsive  "card" opts the table in
 * @attr {string} data-label       on td/th: card-mode label (derived when absent)
 */

import { registerInit } from '../../utils/_init-registry.js';

const SELECTOR = 'table[data-responsive="card"]';
const ENHANCED = new WeakSet();

/**
 * @param {Element} el
 * @param {string} role
 */
function setRole(el, role) {
  if (!el.hasAttribute('role')) el.setAttribute('role', role);
}

/**
 * Column header text by column index, from the last thead row
 * (the row closest to the data), expanding colspans.
 * @param {HTMLTableElement} table
 * @returns {string[]}
 */
function columnLabels(table) {
  const rows = table.tHead?.rows;
  if (!rows?.length) return [];
  const labels = [];
  for (const cell of rows[rows.length - 1].cells) {
    const text = (cell.textContent || '').replace(/\s+/g, ' ').trim();
    for (let i = 0; i < cell.colSpan; i++) labels.push(text);
  }
  return labels;
}

/** @param {HTMLTableElement} table */
function decorate(table) {
  setRole(table, 'table');
  const labels = columnLabels(table);

  for (const section of [table.tHead, ...table.tBodies, table.tFoot]) {
    if (!section) continue;
    setRole(section, 'rowgroup');
    const isHead = section === table.tHead;

    for (const row of section.rows) {
      setRole(row, 'row');
      let col = 0;
      for (const cell of row.cells) {
        if (cell.tagName === 'TH') {
          const scope = cell.getAttribute('scope');
          setRole(cell, isHead || scope === 'col' || scope === 'colgroup' ? 'columnheader' : 'rowheader');
        } else {
          setRole(cell, 'cell');
        }
        if (!isHead && !cell.hasAttribute('data-label') && labels[col]) {
          cell.setAttribute('data-label', labels[col]);
        }
        col += cell.colSpan;
      }
    }
  }
}

/** @param {Element} el */
function enhance(el) {
  const table = /** @type {HTMLTableElement} */ (el);
  if (ENHANCED.has(table)) return;
  ENHANCED.add(table);
  decorate(table);
  // Our own writes are attributes, so a childList-only observer never loops.
  new MutationObserver(() => decorate(table))
    .observe(table, { childList: true, subtree: true });
}

registerInit(SELECTOR, enhance);

export { enhance as initTableCard, decorate as decorateCardTable };
