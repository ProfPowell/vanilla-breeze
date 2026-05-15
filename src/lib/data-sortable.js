/**
 * data-sortable: pure sorting helpers.
 *
 * No DOM. The DOM-side init in src/utils/data-sortable-init.js consumes
 * these to reorder children by named keys.
 *
 * Conventions:
 * - "asc" = ascending (A→Z, 0→9, earlier→later)
 * - "desc" = descending
 * - "none" = no sort applied (leave order alone)
 * - Keys may carry direction prefix: "-date" → desc, "+date" / "date" → asc
 * - Empty / nullish values always sort to the end regardless of direction
 *   (so "no value" is treated as "no opinion, put it last")
 */

/**
 * Parse a key string with optional direction prefix.
 *
 * @param {string|null|undefined} raw
 * @returns {{ key: string, direction: 'asc'|'desc' } | null}
 */
export function parseKey(raw) {
  if (!raw) return null;
  const s = String(raw);
  if (s.startsWith('-')) return { key: s.slice(1), direction: 'desc' };
  if (s.startsWith('+')) return { key: s.slice(1), direction: 'asc' };
  return { key: s, direction: 'asc' };
}

/**
 * Build a comparator for the given type and direction.
 *
 * @param {'text'|'number'|'date'} type
 * @param {'asc'|'desc'} direction
 * @returns {(a: any, b: any) => number}
 */
export function compareBy(type, direction) {
  const sign = direction === 'desc' ? -1 : 1;
  const inner = COMPARATORS[type] || COMPARATORS.text;
  return (a, b) => {
    // Empty-as-end: empties always trail non-empties.
    const aEmpty = isEmpty(a);
    const bEmpty = isEmpty(b);
    if (aEmpty && bEmpty) return 0;
    if (aEmpty) return 1;
    if (bEmpty) return -1;
    return sign * inner(a, b);
  };
}

/**
 * Return the array of source-indices in the order they should appear
 * after sorting by the projected key. Stable.
 *
 * @template T
 * @param {ArrayLike<T>} items
 * @param {(item: T) => any} project
 * @param {'text'|'number'|'date'} type
 * @param {'asc'|'desc'} direction
 * @returns {number[]}
 */
export function sortIndices(items, project, type, direction) {
  const cmp = compareBy(type, direction);
  const indices = Array.from({ length: items.length }, (_, i) => i);
  indices.sort((i, j) => {
    const result = cmp(project(items[i]), project(items[j]));
    return result === 0 ? i - j : result;   // stable tiebreak
  });
  return indices;
}

/**
 * Cycle a sort direction: asc → desc → none → asc → ...
 * Anything unknown / falsy starts fresh at asc.
 *
 * @param {string | undefined} current
 * @returns {'asc'|'desc'|'none'}
 */
export function cycleDirection(current) {
  if (current === 'asc')  return 'desc';
  if (current === 'desc') return 'none';
  return 'asc';
}

/* ---------- internals ---------- */

const COMPARATORS = {
  text(a, b) {
    return String(a).localeCompare(String(b), undefined, { sensitivity: 'base', numeric: true });
  },
  number(a, b) {
    const na = Number(a);
    const nb = Number(b);
    if (Number.isNaN(na) && Number.isNaN(nb)) return 0;
    if (Number.isNaN(na)) return 1;
    if (Number.isNaN(nb)) return -1;
    return na < nb ? -1 : na > nb ? 1 : 0;
  },
  date(a, b) {
    const ta = parseDate(a);
    const tb = parseDate(b);
    if (Number.isNaN(ta) && Number.isNaN(tb)) return 0;
    if (Number.isNaN(ta)) return 1;
    if (Number.isNaN(tb)) return -1;
    return ta < tb ? -1 : ta > tb ? 1 : 0;
  },
};

function parseDate(v) {
  if (v instanceof Date) return v.getTime();
  return Date.parse(String(v));
}

function isEmpty(v) {
  return v == null || v === '';
}
