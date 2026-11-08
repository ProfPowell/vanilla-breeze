/**
 * hotkey-bind: Centralized keyboard shortcut binding
 *
 * Singleton that manages one document keydown listener instead of
 * N per-component listeners. Last-bound-wins for conflict resolution.
 *
 * Skipped keystrokes: auto-repeat (a held key fires once), IME composition,
 * events a component already handled (defaultPrevented), and — unless the
 * binding is `global` — keys typed into form fields or contenteditable.
 *
 * WCAG 2.1.4: unscoped character-key shortcuts (a single printable key,
 * Shift allowed) do not fire while the user has turned them off
 * (<html data-char-shortcuts="off">, settings-panel → Accessibility).
 * A binding with a `scope` element is active only while focus is inside
 * that element, so it stays on ("active only on focus" exception).
 *
 * @example
 * import { bindHotkey, getBoundHotkeys } from './hotkey-bind.js';
 *
 * const unbind = bindHotkey('meta+k', () => openPalette(), { global: true });
 * // later: unbind();
 *
 * getBoundHotkeys() // ['meta+k', 'meta+x', ...]
 */

import { parseHotkey, matchesHotkey, isCharacterShortcut, sameHotkey } from './hotkey-format.js';
import { charShortcutsEnabled } from '../lib/char-shortcuts.js';

const INPUT_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

/**
 * @typedef {{
 *   combo: string,
 *   descriptor: ReturnType<typeof parseHotkey>,
 *   callback: Function,
 *   global: boolean,
 *   scope: Element | null,
 *   enabled: (() => boolean) | null,
 *   character: boolean,
 * }} Binding
 */

/** @type {Binding[]} */
const bindings = [];
let listenerAttached = false;

/** @param {EventTarget | null} target */
function isTypingTarget(target) {
  const el = /** @type {HTMLElement | null} */ (target);
  if (!el || !el.tagName) return false;
  return INPUT_TAGS.has(el.tagName) || el.isContentEditable;
}

/** @param {KeyboardEvent} event */
function handleKeyDown(event) {
  if (event.repeat || event.isComposing || event.defaultPrevented) return;
  const inInput = isTypingTarget(event.target);
  const charOff = !charShortcutsEnabled();
  const active = document.activeElement;

  for (const binding of bindings) {
    // Skip non-global bindings when typing in an input
    if (inInput && !binding.global) continue;
    if (binding.scope && !(binding.scope.isConnected && binding.scope.contains(active))) continue;
    if (charOff && binding.character && !binding.scope) continue;
    if (binding.enabled && !binding.enabled()) continue;

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
 * @param {{ global?: boolean, scope?: Element | null, enabled?: () => boolean }} [options]
 *   global: fires even in form fields. scope: fires only while focus is inside
 *   this element. enabled: checked on every keystroke; false skips the binding
 *   (so a later binding of the same combo can match).
 * @returns {Function} Unbind function for cleanup
 */
function bindHotkey(combo, callback, options = {}) {
  ensureListener();

  const descriptor = parseHotkey(combo);
  /** @type {Binding} */
  const entry = {
    combo,
    descriptor,
    callback,
    global: options.global === true,
    scope: options.scope ?? null,
    enabled: typeof options.enabled === 'function' ? options.enabled : null,
    character: isCharacterShortcut(descriptor),
  };

  // Warn on a duplicate in dev (normalised: "meta+k" vs "cmd+k", "?" vs "shift+?").
  const existing = bindings.find(b => !b.scope && !entry.scope && sameHotkey(b.combo, combo));
  if (existing) {
    console.warn(`[hotkey-bind] Shortcut "${combo}" is already bound as "${existing.combo}". Last-bound wins.`);
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
