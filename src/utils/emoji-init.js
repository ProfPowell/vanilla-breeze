/**
 * emoji-init: Shortcode-to-Unicode text replacement via data attributes
 *
 * Scans text nodes inside [data-emoji] containers for :shortcode: tokens and
 * replaces them with Unicode emoji characters. Pure text replacement — no
 * <span> wrapping, no innerHTML. The `alt`, `title` and `aria-label`
 * attributes inside the container are converted too, so the accessible name
 * matches the visible text.
 *
 * A token only counts when its opening colon is not glued to a letter,
 * digit or underscore, so times and ratios ("10:30:45", "a:b:c") are never
 * touched. Text inside code, pre, kbd, samp, var, script, style, textarea,
 * <code-block>, contenteditable or [data-emoji-skip] is skipped at any depth.
 *
 * On <input> and <textarea>, a token is replaced when the user types its
 * closing colon (pasted text: every token). While the field has focus the replacement goes through
 * execCommand('insertText'), which keeps it on the undo stack (Ctrl+Z brings
 * the shortcode back); where that is unavailable it falls back to
 * setRangeText(), which does not.
 *
 * Enhanced elements are tracked in a WeakMap, not an attribute, so clones
 * are enhanced on their own and removing data-emoji stops the work.
 *
 * @attr {string} data-emoji - Enables emoji enhancement on container or input
 * @attr {string} data-emoji-scan - "once" (default) or "observe" for live replacement
 * @attr {string} data-emoji-unknown - "keep" (default) or "strip" to remove whole unresolved tokens
 * @attr {boolean} data-emoji-skip - On a descendant: leave its text alone
 *
 * @example
 * <p data-emoji>Hello :wave: welcome :rocket:</p>
 *
 * @example Observe mode for dynamic content
 * <article data-emoji data-emoji-scan="observe">...</article>
 *
 * @example Live replacement in inputs
 * <textarea data-emoji>Type :smile: and it becomes 😄</textarea>
 */

import { registerInit } from './_init-registry.js';

// Deferred evaluation, not a separate download: esbuild inlines this
// import() into every CDN bundle (no code splitting), so the data ships with
// the bundle and is only *evaluated* once a [data-emoji] element exists. On
// the unbundled /src graph it is a real lazy fetch.
/** @type {((code: string) => ({ emoji: string } | null)) | null} */
let resolveEmoji = null;

async function loadEmojiData() {
  if (resolveEmoji) return;
  const mod = await import('../data/emoji-data.js');
  resolveEmoji = /** @type {any} */ (mod.resolveEmoji);
}

const SELECTOR = '[data-emoji]';
/** Opening colon must not follow a letter, digit or underscore. */
const SHORTCODE_RE = /(?<![\p{L}\p{N}_]):([a-z0-9_+-]+):/gu;
/** Only tokens that contain a letter are shortcode-shaped enough to strip. */
const STRIPPABLE_RE = /[a-z]/;
const SKIP_SELECTOR = 'script,style,code,pre,kbd,samp,var,textarea,code-block,[data-emoji-skip]';
const NAME_ATTRS = ['alt', 'title', 'aria-label'];
const INPUT_TAGS = new Set(['INPUT', 'TEXTAREA']);
const DEBOUNCE_MS = 100;
/** Input types that bring in a block of text: replace every token in it. */
const WHOLE_VALUE_INPUTS = new Set(['insertFromPaste', 'insertFromDrop', 'insertReplacementText', 'insertFromYank']);

/** @type {WeakMap<Element, () => void>} enhanced element → teardown */
const enhanced = new WeakMap();

/**
 * Replace the shortcodes in a string.
 * @param {string} text
 * @param {'keep'|'strip'} unknownMode
 * @returns {string} the new text (same string when nothing changed)
 */
export function replaceShortcodeText(text, unknownMode = 'keep') {
  if (!resolveEmoji || !text.includes(':')) return text;
  const resolve = resolveEmoji;
  return text.replace(SHORTCODE_RE, (token, code) => {
    const entry = resolve(code);
    if (entry) return entry.emoji;
    if (unknownMode === 'strip' && STRIPPABLE_RE.test(code)) return '';
    return token;
  });
}

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
 * @param {Element} el
 * @returns {'keep'|'strip'}
 */
function unknownModeOf(el) {
  return el.getAttribute('data-emoji-unknown') === 'strip' ? 'strip' : 'keep';
}

/**
 * Enhance a single element with emoji replacement.
 * Branches to input-specific handling for <input>/<textarea>.
 * @param {Element} el - The container or input element
 */
function enhanceEmoji(el) {
  if (enhanced.has(el) || !el.hasAttribute('data-emoji')) return;
  // Pre-WeakMap markup or a clone of it may still carry the old flag.
  el.removeAttribute('data-emoji-init');

  if (INPUT_TAGS.has(el.tagName)) {
    enhanced.set(el, enhanceInput(/** @type {HTMLInputElement|HTMLTextAreaElement} */ (el)));
    return;
  }

  processContainer(el);

  if (el.getAttribute('data-emoji-scan') !== 'observe') {
    enhanced.set(el, () => {});
    return;
  }

  /** @type {ReturnType<typeof setTimeout> | null} */
  let timer = null;
  const contentObserver = new MutationObserver(() => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      processContainer(el);
    }, DEBOUNCE_MS);
  });
  contentObserver.observe(el, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: NAME_ATTRS,
  });
  enhanced.set(el, () => {
    contentObserver.disconnect();
    if (timer) clearTimeout(timer);
  });
}

/**
 * Stop enhancing an element whose data-emoji was removed.
 * Text already replaced stays replaced.
 * @param {Element} el
 */
function unenhance(el) {
  const teardown = enhanced.get(el);
  if (!teardown) return;
  teardown();
  enhanced.delete(el);
}

/**
 * Enhance an <input> or <textarea> with live emoji replacement.
 * @param {HTMLInputElement|HTMLTextAreaElement} el
 * @returns {() => void} teardown
 */
function enhanceInput(el) {
  let composing = false;
  let replacing = false;

  const onStart = () => { composing = true; };
  const onEnd = () => {
    composing = false;
    run(true);
  };
  const onInput = (/** @type {Event} */ event) => {
    const { isComposing, inputType } = /** @type {InputEvent} */ (event);
    // Undo/redo must be allowed to bring a shortcode back.
    if (composing || isComposing || inputType === 'historyUndo' || inputType === 'historyRedo') return;
    // Typing replaces only the token the caret just closed, so a shortcode
    // brought back by undo (or typed earlier and kept) is not re-replaced on
    // the next keystroke. Pasted or dropped text is replaced throughout.
    // A synthetic `new Event('input')` (no inputType) also rescans everything.
    run(Boolean(inputType) && !WHOLE_VALUE_INPUTS.has(inputType));
  };
  function run(atCaretOnly = false) {
    if (replacing) return;
    replacing = true;
    try {
      replaceInValue(el, atCaretOnly);
    } finally {
      replacing = false;
    }
  }

  el.addEventListener('compositionstart', onStart);
  el.addEventListener('compositionend', onEnd);
  el.addEventListener('input', onInput);

  // Process any initial value
  if (el.value) run();

  return () => {
    el.removeEventListener('compositionstart', onStart);
    el.removeEventListener('compositionend', onEnd);
    el.removeEventListener('input', onInput);
  };
}

/**
 * Scan an input's value for completed :shortcode: tokens and replace them,
 * last to first so earlier offsets stay valid. Unknown tokens are always
 * kept in inputs (stripping text while typing would be jarring).
 * @param {HTMLInputElement|HTMLTextAreaElement} el
 * @param {boolean} [atCaretOnly] - only the token that ends at the caret
 */
function replaceInValue(el, atCaretOnly = false) {
  if (!resolveEmoji) return;
  const value = el.value;
  const caret = el.selectionStart;
  /** @type {{ start: number, end: number, emoji: string }[]} */
  const hits = [];
  for (const match of value.matchAll(SHORTCODE_RE)) {
    const start = match.index ?? 0;
    const end = start + match[0].length;
    if (atCaretOnly && caret !== null && end !== caret) continue;
    const entry = resolveEmoji(match[1]);
    if (entry) hits.push({ start, end, emoji: entry.emoji });
  }
  if (hits.length === 0) return;

  // Types without a text selection (email, number…) can only be rewritten.
  if (el.selectionStart === null) {
    el.value = replaceShortcodeText(value, 'keep');
    return;
  }

  let cursor = el.selectionStart ?? value.length;
  const useUndo = document.activeElement === el && typeof document.execCommand === 'function';

  for (let i = hits.length - 1; i >= 0; i--) {
    const { start, end, emoji } = hits[i];
    if (cursor >= end) cursor -= (end - start) - emoji.length;
    else if (cursor > start) cursor = start + emoji.length;

    let done = false;
    if (useUndo) {
      el.setSelectionRange(start, end);
      try {
        done = document.execCommand('insertText', false, emoji) && el.value.slice(start, start + emoji.length) === emoji;
      } catch {
        done = false;
      }
    }
    if (!done) el.setRangeText(emoji, start, end);
  }

  el.setSelectionRange(cursor, cursor);
}

/**
 * Should this node be left alone? Searches only between the node and the
 * container, so a container placed inside <pre> on purpose still works.
 * @param {Element} parent
 * @param {Element} container
 */
function isSkipped(parent, container) {
  if (/** @type {HTMLElement} */ (parent).isContentEditable) return true;
  const skip = parent.closest(SKIP_SELECTOR);
  return Boolean(skip && skip !== container && container.contains(skip));
}

/**
 * Replace shortcodes in the container's text nodes and name attributes.
 * @param {Element} container
 */
function processContainer(container) {
  if (!resolveEmoji) return;
  const mode = unknownModeOf(container);

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || isSkipped(parent, container)) return NodeFilter.FILTER_REJECT;
      return (node.textContent ?? '').includes(':') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
    },
  });

  // Collect first: modifying the DOM during the walk is unsafe.
  /** @type {Text[]} */
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(/** @type {Text} */ (walker.currentNode));

  for (const node of textNodes) {
    const text = node.textContent ?? '';
    const next = replaceShortcodeText(text, mode);
    if (next !== text) node.textContent = next;
  }

  const selector = NAME_ATTRS.map((a) => `[${a}*=":"]`).join(',');
  const named = [container, ...container.querySelectorAll(selector)];
  for (const el of named) {
    if (el !== container && isSkipped(el, container)) continue;
    for (const attr of NAME_ATTRS) {
      const value = el.getAttribute(attr);
      if (!value) continue;
      const next = replaceShortcodeText(value, mode);
      if (next !== value) el.setAttribute(attr, next);
    }
  }
}

// The extended set can arrive after containers were already scanned (it is a
// separate opt-in module and load order is free). resolveEmoji() merges it
// lazily from the shared registry, so a rescan of enhanced containers is all
// that is needed. Inputs resolve on their next input event.
document.addEventListener('vb:emoji-extended', () => {
  if (!resolveEmoji) return;
  for (const el of document.querySelectorAll(SELECTOR)) {
    if (!enhanced.has(el) || INPUT_TAGS.has(el.tagName)) continue;
    processContainer(el);
  }
});

/**
 * Async wrapper for the registry — loads emoji data before enhancing.
 * @param {Element} el
 */
function enhanceAsync(el) {
  loadEmojiData().then(() => enhanceEmoji(el));
}

registerInit(SELECTOR, enhanceAsync);

// The shared registry only sees inserted nodes. Watch the attribute itself
// so data-emoji added to (or removed from) an existing element takes effect.
new MutationObserver((mutations) => {
  for (const { target } of mutations) {
    const el = /** @type {Element} */ (target);
    if (el.hasAttribute('data-emoji')) enhanceAsync(el);
    else unenhance(el);
  }
}).observe(document.documentElement, {
  attributes: true,
  attributeFilter: ['data-emoji'],
  subtree: true,
});

export { initEmoji };
