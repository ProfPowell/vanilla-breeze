/**
 * data-paged: pure pagination math.
 *
 * No DOM. The DOM-side init script in src/utils/data-paged-init.js
 * consumes these helpers to slice children, render controls, and
 * expose state via events.
 *
 * Conventions:
 * - Pages are 1-based (user-facing). Slices are 0-based (Array.slice).
 * - size = 0 disables paging (one page covers everything).
 * - total = 0 returns 0 totalPages and an empty number strip.
 */

/**
 * @param {number} page          1-based page index
 * @param {number} totalPages    inclusive upper bound
 * @returns {number} clamped 1-based page (always ≥ 1)
 */
export function clampPage(page, totalPages) {
  const n = Number(page);
  if (!Number.isFinite(n)) return 1;
  if (totalPages <= 0) return 1;
  return Math.min(Math.max(1, Math.floor(n)), totalPages);
}

/**
 * @param {{ page: number, size: number }} args
 * @returns {{ start: number, end: number }} 0-based half-open range
 */
export function pageSlice({ page, size }) {
  const start = (page - 1) * size;
  return { start, end: start + size };
}

/**
 * Render the windowed page-number strip with ellipsis markers.
 * Produces an array like [1, '…', 5, 6, 7, '…', 12] for current=6 / total=12 / window=1.
 *
 * @param {number} current   1-based current page
 * @param {number} totalPages
 * @param {number} window    Pages shown around `current` on each side
 * @returns {Array<number | '…'>}
 */
export function pageNumbers(current, totalPages, window = 2) {
  if (totalPages <= 0) return [];
  if (totalPages === 1) return [1];

  const left  = Math.max(2, current - window);
  const right = Math.min(totalPages - 1, current + window);

  /** @type {Array<number | '…'>} */
  const out = [1];
  if (left > 2) out.push('…');
  for (let i = left; i <= right; i++) out.push(i);
  if (right < totalPages - 1) out.push('…');
  out.push(totalPages);
  return out;
}

/**
 * @param {{ total: number, size: number, page: number, window?: number }} args
 * @returns {{
 *   page: number,
 *   totalPages: number,
 *   start: number,
 *   end: number,
 *   pageNumbers: Array<number | '…'>
 * }}
 */
export function paginationState({ total, size, page, window = 2 }) {
  // size=0 disables paging — one page covering everything.
  if (size <= 0) {
    return {
      page: total > 0 ? 1 : 1,
      totalPages: total > 0 ? 1 : 0,
      start: 0,
      end: total,
      pageNumbers: total > 0 ? [1] : [],
    };
  }
  const totalPages = total > 0 ? Math.ceil(total / size) : 0;
  const clamped = clampPage(page, totalPages);
  const slice = pageSlice({ page: clamped, size });
  const end = Math.min(slice.end, total);
  return {
    page: clamped,
    totalPages,
    start: slice.start,
    end,
    pageNumbers: pageNumbers(clamped, totalPages, window),
  };
}
