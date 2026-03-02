/**
 * emoji-init: Shortcode-to-Unicode text replacement via data attributes
 *
 * Scans text nodes inside [data-emoji] containers for :shortcode: patterns
 * and replaces them with Unicode emoji characters. Pure text replacement —
 * no <span> wrapping.
 *
 * On <input> and <textarea> elements, listens to the `input` event and
 * replaces completed :shortcode: tokens live as the user types, with
 * cursor position preserved.
 *
 * @attr {string} data-emoji - Enables emoji enhancement on container or input
 * @attr {string} data-emoji-scan - "once" (default) or "observe" for live replacement
 * @attr {string} data-emoji-unknown - "keep" (default) or "strip" to remove unresolved markers
 *
 * @example
 * <p data-emoji>Hello :wave: welcome :rocket:</p>
 *
 * @example Observe mode for dynamic content
 * <div data-emoji data-emoji-scan="observe">...</div>
 *
 * @example Live replacement in inputs
 * <textarea data-emoji>Type :smile: and it becomes 😄</textarea>
 */

// Lazy-loaded: emoji data (~31 KB) is only imported when [data-emoji] elements exist
let resolveEmoji = null;

async function loadEmojiData() {
  if (resolveEmoji) return;
  const mod = await import('../data/emoji-data.js');
  resolveEmoji = mod.resolveEmoji;
}

const SELECTOR = '[data-emoji]';
const SHORTCODE_RE = /:([a-z0-9_+-]+):/g;
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'CODE', 'PRE', 'TEXTAREA']);
const INPUT_TAGS = new Set(['INPUT', 'TEXTAREA']);
const DEBOUNCE_MS = 100;

/**
 * Initialize emoji enhancement within a root element
 * @param {Element|Document} root - Root element to search within
 */
async function initEmoji(root = document) {
  const targets = root.querySelectorAll(SELECTOR);
  if (targets.length === 0) return;
  await loadEmojiData();
  targets.forEach(enhanceEmoji);
}

/**
 * Enhance a single element with emoji replacement.
 * Branches to input-specific handling for <input>/<textarea>.
 * @param {Element} el - The container or input element
 */
function enhanceEmoji(el) {
  if (el.hasAttribute('data-emoji-init')) return;
  el.setAttribute('data-emoji-init', '');

  if (INPUT_TAGS.has(el.tagName)) {
    enhanceInput(/** @type {HTMLInputElement|HTMLTextAreaElement} */ (el));
    return;
  }

  const unknownMode = el.getAttribute('data-emoji-unknown') || 'keep';

  processTextNodes(el, unknownMode);

  // Observe mode: watch for dynamic content changes
  if (el.getAttribute('data-emoji-scan') === 'observe') {
    let timer = null;

    const contentObserver = new MutationObserver(() => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        processTextNodes(el, unknownMode);
        timer = null;
      }, DEBOUNCE_MS);
    });

    contentObserver.observe(el, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }
}

/**
 * Enhance an <input> or <textarea> with live emoji replacement.
 * Listens to `input` events and replaces completed :shortcode: tokens
 * in the element's value, preserving cursor position.
 * @param {HTMLInputElement|HTMLTextAreaElement} el
 */
function enhanceInput(el) {
  let composing = false;

  el.addEventListener('compositionstart', () => { composing = true; });
  el.addEventListener('compositionend', () => {
    composing = false;
    replaceInValue(el);
  });

  el.addEventListener('input', () => {
    if (composing) return;
    replaceInValue(el);
  });

  // Process any initial value
  if (el.value && SHORTCODE_RE.test(el.value)) {
    SHORTCODE_RE.lastIndex = 0;
    replaceInValue(el);
  }
}

/**
 * Scan an input's value for completed :shortcode: patterns and replace them.
 * Adjusts cursor position to account for the length difference.
 * @param {HTMLInputElement|HTMLTextAreaElement} el
 */
function replaceInValue(el) {
  const value = el.value;
  SHORTCODE_RE.lastIndex = 0;

  let match;
  let result = '';
  let lastIndex = 0;
  let cursorOffset = 0;
  const cursor = el.selectionStart ?? value.length;
  let hasReplacement = false;

  while ((match = SHORTCODE_RE.exec(value)) !== null) {
    const fullMatch = match[0];
    const shortcode = match[1];
    const entry = resolveEmoji(shortcode);

    // Add text before this match
    result += value.slice(lastIndex, match.index);

    if (entry) {
      result += entry.emoji;
      hasReplacement = true;

      // Adjust cursor if it was at or after the end of this shortcode
      const matchEnd = match.index + fullMatch.length;
      if (cursor >= matchEnd) {
        cursorOffset += fullMatch.length - entry.emoji.length;
      } else if (cursor > match.index) {
        // Cursor was inside the shortcode — place it after the emoji
        cursorOffset += cursor - match.index - entry.emoji.length;
      }
    } else {
      // Unknown shortcode — keep as-is in inputs (never strip while typing)
      result += fullMatch;
    }

    lastIndex = match.index + fullMatch.length;
  }

  if (!hasReplacement) return;

  result += value.slice(lastIndex);
  el.value = result;

  const newCursor = Math.max(0, cursor - cursorOffset);
  el.setSelectionRange(newCursor, newCursor);
}

/**
 * Walk text nodes and replace :shortcode: with emoji
 * @param {Element} container
 * @param {string} unknownMode - "keep" or "strip"
 */
function processTextNodes(container, unknownMode) {
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        // Skip nodes inside elements that shouldn't be processed
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (SKIP_TAGS.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
        if (parent.isContentEditable) return NodeFilter.FILTER_REJECT;
        // Skip already-processed text (nodes we've just created)
        if (parent.hasAttribute('data-emoji-processed')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  // Collect nodes first (modifying DOM during walk is unsafe)
  const textNodes = [];
  while (walker.nextNode()) {
    if (SHORTCODE_RE.test(walker.currentNode.textContent ?? '')) {
      textNodes.push(walker.currentNode);
    }
    SHORTCODE_RE.lastIndex = 0;
  }

  for (const node of textNodes) {
    replaceShortcodes(/** @type {Text} */ (node), unknownMode);
  }
}

/**
 * Replace :shortcode: patterns in a single text node
 * @param {Text} textNode
 * @param {string} unknownMode
 */
function replaceShortcodes(textNode, unknownMode) {
  const text = textNode.textContent;
  SHORTCODE_RE.lastIndex = 0;

  let match;
  let lastIndex = 0;
  const parts = [];
  let hasReplacement = false;

  while ((match = SHORTCODE_RE.exec(text)) !== null) {
    const shortcode = match[1];
    const entry = resolveEmoji(shortcode);

    // Add text before this match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (entry) {
      parts.push(entry.emoji);
      hasReplacement = true;
    } else if (unknownMode === 'strip') {
      // Remove the markers entirely
      hasReplacement = true;
    } else {
      // Keep the original :shortcode: text
      parts.push(match[0]);
    }

    lastIndex = match.index + match[0].length;
  }

  if (!hasReplacement) return;

  // Add remaining text after last match
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  // Replace the text node content
  textNode.textContent = parts.join('');
}

// Auto-init on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initEmoji());
} else {
  initEmoji();
}

// Watch for dynamically added [data-emoji] containers
const observer = new MutationObserver((mutations) => {
  const pending = [];
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;

      const el = /** @type {Element} */ (node);
      if (el.matches(SELECTOR)) pending.push(el);
      el.querySelectorAll(SELECTOR).forEach(child => pending.push(child));
    }
  }
  if (pending.length === 0) return;
  loadEmojiData().then(() => pending.forEach(enhanceEmoji));
});

observer.observe(document.documentElement, { childList: true, subtree: true });

export { initEmoji };
