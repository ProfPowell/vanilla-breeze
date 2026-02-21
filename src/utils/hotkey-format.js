/**
 * hotkey-format: Shared hotkey formatting and matching utilities
 *
 * Pure functions for parsing, formatting, and matching keyboard shortcuts.
 * Used by hotkey-init.js, command-wc, context-menu, and hotkey-bind.js.
 *
 * @example
 * import { formatHotkey, parseHotkey, matchesHotkey } from './hotkey-format.js';
 *
 * formatHotkey('meta+k')       // "⌘K" on Mac, "Ctrl+K" on others
 * parseHotkey('meta+shift+x')  // { key: 'x', meta: true, shift: true, ... }
 * matchesHotkey(event, parsed) // true if event matches the parsed descriptor
 */

const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform ?? '');

const SYMBOLS = {
  mac: { meta: '\u2318', cmd: '\u2318', alt: '\u2325', shift: '\u21E7', ctrl: '\u2303' },
  other: { meta: 'Ctrl', cmd: 'Ctrl', alt: 'Alt', shift: 'Shift', ctrl: 'Ctrl' }
};

/**
 * Format a hotkey combo string for display
 * @param {string} combo - Key combo like "meta+k" or "meta+shift+x"
 * @returns {string} Platform-formatted string like "⌘K" or "Ctrl+K"
 */
function formatHotkey(combo) {
  const map = isMac ? SYMBOLS.mac : SYMBOLS.other;
  return combo.split('+').map(k => {
    const key = k.trim().toLowerCase();
    return map[key] ?? key.toUpperCase();
  }).join(isMac ? '' : '+');
}

/**
 * Parse a hotkey combo string into a descriptor object
 * @param {string} combo - Key combo like "meta+k" or "ctrl+shift+a"
 * @returns {{ key: string, meta: boolean, ctrl: boolean, shift: boolean, alt: boolean }}
 */
function parseHotkey(combo) {
  const parts = combo.toLowerCase().split('+').map(k => k.trim());
  const key = parts.pop();
  return {
    key,
    meta: parts.includes('meta') || parts.includes('cmd'),
    ctrl: parts.includes('ctrl'),
    shift: parts.includes('shift'),
    alt: parts.includes('alt')
  };
}

/**
 * Test if a KeyboardEvent matches a parsed hotkey descriptor.
 * "meta" matches Cmd on Mac, Ctrl on others.
 * @param {KeyboardEvent} event
 * @param {{ key: string, meta: boolean, ctrl: boolean, shift: boolean, alt: boolean }} descriptor
 * @returns {boolean}
 */
function matchesHotkey(event, descriptor) {
  if (event.key.toLowerCase() !== descriptor.key) return false;

  // Build expected modifier state from descriptor
  // "meta" means metaKey on Mac, ctrlKey on non-Mac
  let expectMeta, expectCtrl;
  if (isMac) {
    expectMeta = descriptor.meta;
    expectCtrl = descriptor.ctrl;
  } else {
    // On non-Mac, "meta" maps to Ctrl key
    expectMeta = false;
    expectCtrl = descriptor.meta || descriptor.ctrl;
  }

  if (expectMeta !== event.metaKey) return false;
  if (expectCtrl !== event.ctrlKey) return false;
  if (descriptor.shift !== event.shiftKey) return false;
  if (descriptor.alt !== event.altKey) return false;

  return true;
}

export { isMac, formatHotkey, parseHotkey, matchesHotkey, SYMBOLS };
