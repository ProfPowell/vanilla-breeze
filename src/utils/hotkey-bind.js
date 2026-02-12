/**
 * hotkey-bind: Centralized keyboard shortcut binding
 *
 * Singleton that manages one document keydown listener instead of
 * N per-component listeners. First-match-wins for conflict resolution.
 *
 * @example
 * import { bindHotkey, getBoundHotkeys } from './hotkey-bind.js';
 *
 * const unbind = bindHotkey('meta+k', () => openPalette(), { global: true });
 * // later: unbind();
 *
 * getBoundHotkeys() // ['meta+k', 'meta+x', ...]
 */

import { parseHotkey, matchesHotkey } from './hotkey-format.js';

const INPUT_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

/** @type {Array<{ combo: string, descriptor: object, callback: Function, global: boolean }>} */
const bindings = [];
let listenerAttached = false;

function handleKeyDown(event) {
  const inInput = INPUT_TAGS.has(event.target.tagName) ||
    event.target.isContentEditable;

  for (const binding of bindings) {
    // Skip non-global bindings when typing in an input
    if (inInput && !binding.global) continue;

    if (matchesHotkey(event, binding.descriptor)) {
      event.preventDefault();
      binding.callback(event);
      return; // first-match-wins
    }
  }
}

function ensureListener() {
  if (listenerAttached) return;
  document.addEventListener('keydown', handleKeyDown);
  listenerAttached = true;
}

/**
 * Bind a keyboard shortcut to a callback
 * @param {string} combo - Key combo like "meta+k" or "meta+shift+t"
 * @param {Function} callback - Handler function
 * @param {{ global?: boolean }} [options] - Options. global: true fires even in inputs.
 * @returns {Function} Unbind function for cleanup
 */
function bindHotkey(combo, callback, options = {}) {
  ensureListener();

  const descriptor = parseHotkey(combo);
  const entry = {
    combo,
    descriptor,
    callback,
    global: options.global === true
  };

  // Warn on duplicate combo in dev
  const existing = bindings.find(b => b.combo === combo);
  if (existing) {
    console.warn(`[hotkey-bind] Shortcut "${combo}" already bound. Last-connected-wins.`);
  }

  // Prepend so last-connected-wins (first-match in array = most recent)
  bindings.unshift(entry);

  return function unbind() {
    const index = bindings.indexOf(entry);
    if (index !== -1) bindings.splice(index, 1);
  };
}

/**
 * Get all currently bound hotkey combo strings
 * @returns {string[]}
 */
function getBoundHotkeys() {
  return bindings.map(b => b.combo);
}

export { bindHotkey, getBoundHotkeys };
