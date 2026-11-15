/**
 * highlight-anchor: where a stored highlight sits in the current text.
 *
 * A highlight is stored as text offsets plus the quoted words and a little
 * of the text on either side. Offsets alone break as soon as text above the
 * highlight is edited, so when they no longer hold the quote is searched for
 * and the surrounding context picks between several occurrences.
 *
 * Pure string logic (no DOM), used by highlights-init.js.
 */

/** Characters of context kept on each side of a highlight. */
export const CONTEXT_LENGTH = 32;

/** @param {string} s */
const squash = (s) => s.replace(/\s+/g, '');

/** @param {string} s */
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * @param {string} a
 * @param {string} b
 * @returns {number} length of the longest common ending
 */
function commonEnd(a, b) {
  let n = 0;
  while (n < a.length && n < b.length && a[a.length - 1 - n] === b[b.length - 1 - n]) n++;
  return n;
}

/**
 * @param {string} a
 * @param {string} b
 * @returns {number} length of the longest common beginning
 */
function commonStart(a, b) {
  let n = 0;
  while (n < a.length && n < b.length && a[n] === b[n]) n++;
  return n;
}

/**
 * The context to store with a highlight at [start, end).
 * @param {string} text
 * @param {number} start
 * @param {number} end
 * @returns {{ prefix: string, suffix: string }}
 */
export function contextAround(text, start, end) {
  return {
    prefix: text.slice(Math.max(0, start - CONTEXT_LENGTH), start),
    suffix: text.slice(end, end + CONTEXT_LENGTH),
  };
}

/**
 * Find a stored highlight in the current text.
 *
 * The stored offsets win when the quote is still there. Otherwise every
 * occurrence of the quote is a candidate: the one whose surroundings best
 * match the stored prefix/suffix is chosen, and among equals the one nearest
 * the old position. Whitespace is compared loosely, because the quote comes
 * from the selection (which adds line breaks between blocks) and the text
 * from textContent (which does not).
 *
 * @param {string} text - current text of the article
 * @param {{ startOffset: number, endOffset: number, text: string, prefix?: string, suffix?: string }} rec
 * @returns {{ start: number, end: number } | null} null when the quote is not in the text
 */
export function locateHighlight(text, rec) {
  const quote = squash(rec.text ?? '');
  if (!quote) return null;

  if (rec.endOffset <= text.length
    && squash(text.slice(rec.startOffset, rec.endOffset)) === quote) {
    return { start: rec.startOffset, end: rec.endOffset };
  }

  const pattern = new RegExp(rec.text.trim().split(/\s+/).map(escapeRe).join('\\s*'), 'g');
  const prefix = rec.prefix ?? '';
  const suffix = rec.suffix ?? '';
  /** @type {{ start: number, end: number } | null} */
  let best = null;
  let bestScore = -1;
  let bestDistance = Infinity;
  for (const match of text.matchAll(pattern)) {
    const start = match.index;
    const end = start + match[0].length;
    const around = contextAround(text, start, end);
    const score = commonEnd(around.prefix, prefix) + commonStart(around.suffix, suffix);
    const distance = Math.abs(start - rec.startOffset);
    if (score > bestScore || (score === bestScore && distance < bestDistance)) {
      best = { start, end };
      bestScore = score;
      bestDistance = distance;
    }
  }
  return best;
}
