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
 * @param {string} [locale] - BCP 47 tag for text collation (default: runtime default)
 * @returns {(a: any, b: any) => number}
 */
export function compareBy(type, direction, locale) {
  const sign = direction === 'desc' ? -1 : 1;
  const inner = type === 'text' || !COMPARATORS[type] ? textComparator(locale) : COMPARATORS[type];
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
 * @param {string} [locale] - BCP 47 tag for text collation
 * @returns {number[]}
 */
export function sortIndices(items, project, type, direction, locale) {
  const cmp = compareBy(type, direction, locale);
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

/** @type {Map<string, Intl.Collator>} */
const collators = new Map();

/** @param {string} [locale] */
function textComparator(locale) {
  const key = locale || '';
  let collator = collators.get(key);
  if (!collator) {
    try {
      collator = new Intl.Collator(locale || undefined, { sensitivity: 'base', numeric: true });
    } catch {
      collator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true });
    }
    collators.set(key, collator);
  }
  return (a, b) => collator.compare(String(a), String(b));
}

/**
 * Read a number out of formatted text: "1,234", "$5", "12 %", "1.234,5",
 * "−3". Grouping separators, currency symbols, units and spaces are
 * ignored; when both "," and "." appear, the last one is the decimal
 * separator; a lone "," followed by exactly three digits is grouping.
 * Prefer data-sort-value for anything ambiguous.
 *
 * @param {unknown} v
 * @returns {number}
 */
export function parseSortNumber(v) {
  if (typeof v === 'number') return v;
  let s = String(v ?? '').trim().replace(/[\u2212\u2012\u2013]/g, '-');
  const negative = /^\(.*\)$/.test(s) || /^-|-$/.test(s.replace(/[^\d.,-]/g, ''));
  s = s.replace(/[^\d.,]/g, '');
  if (!s) return NaN;
  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  if (lastComma > -1 && lastDot > -1) {
    const dec = lastComma > lastDot ? ',' : '.';
    const group = dec === ',' ? '.' : ',';
    s = s.split(group).join('').replace(dec, '.');
  } else if (lastComma > -1) {
    const parts = s.split(',');
    const grouping = parts.length > 2 || (parts.length === 2 && parts[1].length === 3);
    s = grouping ? parts.join('') : parts.join('.');
  } else if ((s.match(/\./g) || []).length > 1) {
    s = s.split('.').join('');
  }
  const n = Number(s);
  return negative ? -n : n;
}

const COMPARATORS = {
  number(a, b) {
    const na = parseSortNumber(a);
    const nb = parseSortNumber(b);
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
