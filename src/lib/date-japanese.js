/**
 * date-japanese.js — Japanese date parsing.
 *
 * Intl.DateTimeFormat renders Japanese era dates but cannot parse them, and
 * no browser API does. This module covers the input direction only; use Intl
 * with a `-u-ca-japanese` locale for output.
 *
 * Dates are constructed in local time to match date-picker's fromISO/toISO.
 */

/** Gregorian start date of each Japanese era, newest first. */
export const ERAS = [
  { ja: '令和', latin: 'R', start: [2019, 5, 1] },
  { ja: '平成', latin: 'H', start: [1989, 1, 8] },
  { ja: '昭和', latin: 'S', start: [1926, 12, 25] },
  { ja: '大正', latin: 'T', start: [1912, 7, 30] },
  { ja: '明治', latin: 'M', start: [1868, 10, 23] },
];

const ERA_RE = new RegExp(
  `^(?:(${ERAS.map(e => e.ja).join('|')})|(${ERAS.map(e => e.latin).join('|')}))`
  + String.raw`\s*(元|\d{1,2})年?[/.\-]?\s*(\d{1,2})月?[/.\-]?\s*(\d{1,2})日?$`,
  'i',
);

const CJK_NUMERIC_RE = /^(\d{4})年(\d{1,2})月(\d{1,2})日?$/;

/**
 * Fold full-width digits to ASCII and strip whitespace.
 * @param {string} text
 * @returns {string}
 */
function normalize(text) {
  return text.trim()
    .replace(/[０-９]/g, c => String(c.charCodeAt(0) - 0xFF10))
    .replace(/\s+/g, '');
}

/**
 * Local Date, or null when the components overflow (e.g. 2月30日).
 * @param {number} year
 * @param {number} month - 1-based
 * @param {number} day
 * @returns {Date|null}
 */
function makeDate(year, month, day) {
  const d = new Date(2000, month - 1, day);
  // setFullYear: the Date constructor maps years 0–99 to 1900–1999.
  d.setFullYear(year);
  return d.getMonth() === month - 1 && d.getDate() === day ? d : null;
}

/**
 * Parse a Japanese era date. Accepts 令和8年10月21日, 令和元年5月1日, R8/10/21,
 * R1.5.1, 令和8/10/21 and full-width digits. Rejects dates outside the era
 * they name.
 * @param {string} text
 * @returns {Date|null}
 */
export function parseWareki(text) {
  const m = normalize(text).match(ERA_RE);
  if (!m) return null;

  const era = m[1]
    ? ERAS.find(e => e.ja === m[1])
    : ERAS.find(e => e.latin.toUpperCase() === m[2].toUpperCase());
  if (!era) return null;

  const eraYear = m[3] === '元' ? 1 : Number(m[3]);
  if (eraYear < 1) return null;

  const date = makeDate(era.start[0] + eraYear - 1, Number(m[4]), Number(m[5]));
  if (!date) return null;

  // Must fall on or after this era's start, and before the next era's.
  if (date < new Date(era.start[0], era.start[1] - 1, era.start[2])) return null;
  const i = ERAS.indexOf(era);
  if (i > 0) {
    const n = ERAS[i - 1].start;
    if (date >= new Date(n[0], n[1] - 1, n[2])) return null;
  }
  return date;
}

/**
 * Parse the CJK numeric date form ("2026年10月21日").
 * @param {string} text
 * @returns {Date|null}
 */
export function parseCJKNumeric(text) {
  const m = normalize(text).match(CJK_NUMERIC_RE);
  return m ? makeDate(Number(m[1]), Number(m[2]), Number(m[3])) : null;
}
