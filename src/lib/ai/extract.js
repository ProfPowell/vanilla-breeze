/**
 * Page-text extraction for AI page-tool components.
 *
 * Both `<ai-summary>` and `<ai-chat>` need to read a region of the page,
 * minus their own UI shells, with whitespace normalised so the model sees
 * a clean prose blob.
 */

const DEFAULT_STRIP = 'ai-chat, ai-summary, .ai-chat-shell, .ais-ui';

/**
 * Extract normalised text from a target.
 *
 * @param {Element | string | null | undefined} target
 *   Element, CSS selector, or nullish (returns '').
 * @param {object} [options]
 * @param {string} [options.stripSelectors]
 *   CSS selectors for nodes to remove from the clone before reading text.
 *   Defaults to AI component shells so a context selector that wraps the
 *   chat itself doesn't read its own UI back into the prompt.
 * @returns {string} Trimmed, single-spaced text content.
 */
export function extractContextText(target, { stripSelectors = DEFAULT_STRIP } = {}) {
  if (target == null) return '';

  let el;
  if (typeof target === 'string') {
    if (typeof document === 'undefined') return '';
    try { el = document.querySelector(target); }
    catch { return ''; }
  } else if (typeof target === 'object' && typeof target.cloneNode === 'function') {
    el = target;
  }
  if (!el) return '';

  const clone = /** @type {Element} */ (el.cloneNode(true));
  if (stripSelectors && typeof clone.querySelectorAll === 'function') {
    clone.querySelectorAll(stripSelectors).forEach(n => n.remove());
  }
  return (clone.textContent || '').trim().replace(/\s+/g, ' ');
}
