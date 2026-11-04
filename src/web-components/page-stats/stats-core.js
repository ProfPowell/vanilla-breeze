/**
 * stats-core: shared reading statistics + date formatting for
 * <page-stats> and <page-info>.
 *
 * One reading-speed constant for both components, so "~5 min" in the
 * page-info panel and "5 min read" from page-stats always agree.
 *
 * What is counted: the text of the given roots, skipping script, style,
 * template, noscript, [hidden], [aria-hidden="true"], [inert],
 * [data-signable="false"], [data-stats-ignore] and the derived-metadata
 * components themselves (page-info, page-stats). Code blocks and the
 * content of closed <details> ARE counted: both are content a reader can
 * open and read.
 *
 * Word counting uses Intl.Segmenter (granularity "word", isWordLike) so
 * scripts without spaces between words (Chinese, Japanese, Thai) count
 * correctly. Han/Hiragana/Katakana text is timed by characters per minute
 * (READING_CPM) rather than words per minute.
 */

/** Words per minute (Brysbaert 2019 average for silent non-fiction reading). */
export const READING_WPM = 238;

/** Characters per minute for Chinese/Japanese text. */
export const READING_CPM = 500;

const SKIP_TAGS = new Set([
  'SCRIPT', 'STYLE', 'TEMPLATE', 'NOSCRIPT', 'PAGE-INFO', 'PAGE-STATS'
]);

const CJK = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u;
const CJK_ALL = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/gu;

/** @param {Element} el */
function isSkipped(el) {
  if (SKIP_TAGS.has(el.tagName)) return true;
  if (el.hasAttribute('hidden')) return true;
  if (el.hasAttribute('inert')) return true;
  if (el.getAttribute('aria-hidden') === 'true') return true;
  if (el.getAttribute('data-signable') === 'false') return true;
  if (el.hasAttribute('data-stats-ignore')) return true;
  return false;
}

/**
 * Collect readable text under the given roots. Nested roots are only
 * walked once (outermost wins), so a [data-signable] inside another
 * [data-signable] is not double-counted.
 * @param {Iterable<Element>} roots
 * @returns {string}
 */
export function collectReadableText(roots) {
  const list = [...roots].filter((r) => r && !isSkipped(r));
  const outermost = list.filter((r) => !list.some((o) => o !== r && o.contains(r)));
  const parts = [];
  for (const root of outermost) walk(root, parts);
  return parts.join(' ');
}

/**
 * @param {Node} node
 * @param {string[]} parts
 */
function walk(node, parts) {
  for (const child of node.childNodes) {
    if (child.nodeType === 3) {
      if (child.nodeValue) parts.push(child.nodeValue);
    } else if (child.nodeType === 1 && !isSkipped(/** @type {Element} */ (child))) {
      walk(child, parts);
    }
  }
}

/**
 * Count words in text. CJK characters are tallied separately for timing.
 * @param {string} text
 * @param {string} [lang]
 * @returns {{ words: number, cjkChars: number, cjkWords: number }}
 */
export function countWords(text, lang) {
  let words = 0;
  let cjkChars = 0;
  let cjkWords = 0;
  const Segmenter = /** @type {any} */ (Intl).Segmenter;
  if (typeof Segmenter === 'function') {
    let seg;
    try { seg = new Segmenter(lang || undefined, { granularity: 'word' }); }
    catch { seg = new Segmenter(undefined, { granularity: 'word' }); }
    for (const { segment, isWordLike } of seg.segment(text)) {
      if (!isWordLike) continue;
      words++;
      if (CJK.test(segment)) {
        cjkWords++;
        cjkChars += segment.match(CJK_ALL)?.length ?? 0;
      }
    }
    return { words, cjkChars, cjkWords };
  }
  /* Fallback: whitespace words; each CJK character counts as one word. */
  for (const token of text.split(/\s+/)) {
    if (!token) continue;
    const cjk = token.match(CJK_ALL)?.length ?? 0;
    cjkChars += cjk;
    cjkWords += cjk;
    words += cjk + (token.replace(CJK_ALL, '') ? 1 : 0);
  }
  return { words, cjkChars, cjkWords };
}

/**
 * Reading time in whole minutes (minimum 1). CJK characters are timed at
 * `cpm`; all other word-like segments at `wpm`.
 * @param {{ words: number, cjkChars: number, cjkWords: number }} counts
 * @param {number} [wpm]
 * @param {number} [cpm]
 * @returns {number}
 */
export function readingMinutes({ words, cjkChars, cjkWords }, wpm = READING_WPM, cpm = READING_CPM) {
  /* CJK word segments are timed by their characters instead. */
  const otherWords = Math.max(0, words - cjkWords);
  return Math.max(1, Math.ceil(otherWords / wpm + cjkChars / cpm));
}

/**
 * Locale for formatting: closest [lang] of the element, then <html lang>.
 * Returns undefined (runtime default) when nothing usable is declared.
 * @param {Element} [el]
 * @returns {string | undefined}
 */
export function resolveLang(el) {
  const raw = el?.closest?.('[lang]')?.getAttribute('lang') || document.documentElement.lang || '';
  if (!raw) return undefined;
  try { return Intl.getCanonicalLocales(raw)[0]; } catch { return undefined; }
}

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Parse an ISO date/datetime. Date-only values are flagged so they are
 * formatted in UTC (no off-by-one day in negative-offset time zones).
 * @param {string | null | undefined} value
 * @returns {{ date: Date, dateOnly: boolean } | null}
 */
export function parseDateValue(value) {
  if (!value) return null;
  const v = String(value).trim();
  const date = new Date(v);
  if (Number.isNaN(date.getTime())) return null;
  return { date, dateOnly: DATE_ONLY.test(v) };
}

/**
 * Absolute date string, e.g. "15 March 2026" (locale-dependent).
 * @param {{ date: Date, dateOnly: boolean }} parsed
 * @param {string} [lang]
 * @returns {string}
 */
export function absoluteDate({ date, dateOnly }, lang) {
  const opts = /** @type {Intl.DateTimeFormatOptions} */ (
    dateOnly ? { dateStyle: 'long', timeZone: 'UTC' } : { dateStyle: 'long' }
  );
  return new Intl.DateTimeFormat(lang, opts).format(date);
}

/**
 * Relative time via Intl.RelativeTimeFormat ("3 days ago", "yesterday",
 * "in 2 weeks"). Handles past and future dates.
 * @param {{ date: Date, dateOnly: boolean }} parsed
 * @param {string} [lang]
 * @param {number} [now]
 * @returns {string}
 */
export function relativeTime({ date, dateOnly }, lang, now = Date.now()) {
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });
  let diffSec = (date.getTime() - now) / 1000;
  if (dateOnly) {
    /* Compare calendar days: today's UTC date vs the declared date. */
    const today = new Date(now);
    const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    const days = Math.round((date.getTime() - todayUtc) / 86400000);
    if (Math.abs(days) < 1) return rtf.format(0, 'day');
    diffSec = days * 86400;
  }
  const abs = Math.abs(diffSec);
  /** @type {[number, Intl.RelativeTimeFormatUnit][]} */
  const steps = [
    [60, 'second'], [3600, 'minute'], [86400, 'hour'],
    [86400 * 7, 'day'], [86400 * 30, 'week'], [86400 * 365, 'month']
  ];
  const sizes = { second: 1, minute: 60, hour: 3600, day: 86400, week: 604800, month: 2592000, year: 31536000 };
  if (abs < 45) return rtf.format(0, 'second');
  for (const [limit, unit] of steps) {
    if (abs < limit) return rtf.format(Math.round(diffSec / sizes[unit]), unit);
  }
  return rtf.format(Math.round(diffSec / sizes.year), 'year');
}
