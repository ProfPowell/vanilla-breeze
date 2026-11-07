/**
 * char-shortcuts: the site-wide "character-key shortcuts" preference
 * (WCAG 2.1.4 Character Key Shortcuts).
 *
 * A character-key shortcut is one that uses only a letter, digit,
 * punctuation or symbol key, optionally with Shift ("/", "?", "j",
 * "shift+?"). Speech-input users trigger them by accident, so users can
 * turn them all off. When off:
 *
 * - <html data-char-shortcuts="off"> is set (authors may also set it in
 *   markup to opt the whole page out);
 * - hotkey-bind skips every unscoped character-key binding: data-hotkey
 *   actions, <short-cuts>'s own ? key and any component using bindHotkey().
 *   Shortcuts with Ctrl / Cmd / Alt, and shortcuts scoped to a focused
 *   region (data-hotkey-scope, "active only on focus"), keep working.
 *
 * Stored with the other VB preferences in VBStore's `vb:settings:extensions`
 * as `charShortcuts: false` (settings-panel → Accessibility). This module
 * restores the stored choice synchronously on import, before any binding
 * can fire.
 *
 * @example
 * import { charShortcutsEnabled, setCharShortcutsEnabled } from './char-shortcuts.js';
 * if (!charShortcutsEnabled()) …
 * setCharShortcutsEnabled(false); // page-only; settings-panel also persists it
 */

export const CHAR_SHORTCUTS_ATTR = 'data-char-shortcuts';
export const CHAR_SHORTCUTS_EVENT = 'vb:char-shortcuts-change';
const STORAGE_KEY = 'vb:settings:extensions';

/** @returns {boolean} false when the user (or page) turned character-key shortcuts off */
export function charShortcutsEnabled() {
  if (typeof document === 'undefined') return true;
  return document.documentElement.getAttribute(CHAR_SHORTCUTS_ATTR) !== 'off';
}

/**
 * Turn character-key shortcuts on or off for this page (no persistence;
 * settings-panel writes the stored preference).
 * @param {boolean} on
 */
export function setCharShortcutsEnabled(on) {
  const root = document.documentElement;
  const was = charShortcutsEnabled();
  if (on) root.removeAttribute(CHAR_SHORTCUTS_ATTR);
  else root.setAttribute(CHAR_SHORTCUTS_ATTR, 'off');
  if (was !== !!on) {
    window.dispatchEvent(new CustomEvent(CHAR_SHORTCUTS_EVENT, { detail: { enabled: !!on } }));
  }
}

/**
 * The stored preference, read synchronously: true / false, or null when the
 * user never chose.
 * @returns {boolean | null}
 */
export function storedCharShortcuts() {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw)?.data?.charShortcuts;
    return typeof value === 'boolean' ? value : null;
  } catch {
    return null;
  }
}

/**
 * The page's own setting before any stored preference was applied: false
 * when the markup opts out with <html data-char-shortcuts="off">. Resetting
 * preferences returns here. Once a choice is stored the authored value can
 * no longer be told apart (a boot script may already have applied the
 * stored one), so it is then taken as on, the default.
 * @type {boolean}
 */
let authored = true;

/** @returns {boolean} the page's authored setting (what "reset" restores) */
export function authoredCharShortcuts() {
  return authored;
}

// Restore before any shortcut can fire. An explicit user choice beats the
// authored value.
if (typeof document !== 'undefined') {
  const stored = storedCharShortcuts();
  if (stored === null) authored = charShortcutsEnabled();
  if (stored === false) document.documentElement.setAttribute(CHAR_SHORTCUTS_ATTR, 'off');
  else if (stored === true) document.documentElement.removeAttribute(CHAR_SHORTCUTS_ATTR);
}
