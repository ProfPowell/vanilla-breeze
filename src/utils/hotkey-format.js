/**
 * hotkey-format: Shared hotkey formatting and matching utilities
 *
 * Pure functions for parsing, formatting, and matching keyboard shortcuts.
 * Used by hotkey-init.js, command-palette, context-menu, and hotkey-bind.js.
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
  mac: { meta: '\u2318', cmd: '\u2318', alt: '\u2325', option: '\u2325', shift: '\u21E7', ctrl: '\u2303', control: '\u2303' },
  other: { meta: 'Ctrl', cmd: 'Ctrl', alt: 'Alt', option: 'Alt', shift: 'Shift', ctrl: 'Ctrl', control: 'Ctrl' }
};

/**
 * Spoken (screen-reader) names for the modifiers, per platform. The visible
 * Mac glyphs (⌘⌥⇧⌃) are read inconsistently or not at all, so hotkey-init
 * pairs aria-hidden caps with these words.
 */
const SPOKEN = {
  mac: { meta: 'Command', cmd: 'Command', alt: 'Option', option: 'Option', shift: 'Shift', ctrl: 'Control', control: 'Control' },
  other: { meta: 'Control', cmd: 'Control', alt: 'Alt', option: 'Alt', shift: 'Shift', ctrl: 'Control', control: 'Control' }
};

/**
 * Named (non-modifier) keys: visible label and spoken name. Keys not listed
 * here display upper-cased (k → K) and are spoken as written.
 * @type {Record<string, { label: string, spoken: string }>}
 */
const NAMED_KEYS = {
  escape: { label: 'Esc', spoken: 'Escape' },
  esc: { label: 'Esc', spoken: 'Escape' },
  enter: { label: 'Enter', spoken: 'Enter' },
  return: { label: 'Enter', spoken: 'Enter' },
  tab: { label: 'Tab', spoken: 'Tab' },
  space: { label: 'Space', spoken: 'Space' },
  backspace: { label: 'Backspace', spoken: 'Backspace' },
  delete: { label: 'Del', spoken: 'Delete' },
  del: { label: 'Del', spoken: 'Delete' },
  insert: { label: 'Ins', spoken: 'Insert' },
  home: { label: 'Home', spoken: 'Home' },
  end: { label: 'End', spoken: 'End' },
  pageup: { label: 'PgUp', spoken: 'Page up' },
  pagedown: { label: 'PgDn', spoken: 'Page down' },
  arrowup: { label: '\u2191', spoken: 'Up arrow' },
  up: { label: '\u2191', spoken: 'Up arrow' },
  arrowdown: { label: '\u2193', spoken: 'Down arrow' },
  down: { label: '\u2193', spoken: 'Down arrow' },
  arrowleft: { label: '\u2190', spoken: 'Left arrow' },
  left: { label: '\u2190', spoken: 'Left arrow' },
  arrowright: { label: '\u2192', spoken: 'Right arrow' },
  right: { label: '\u2192', spoken: 'Right arrow' },
  '+': { label: '+', spoken: 'Plus' },
  plus: { label: '+', spoken: 'Plus' }
};

/**
 * Split a combo string into lower-cased key names. "+" separates keys; the
 * plus key itself is written "plus" or as a trailing "+" ("ctrl++").
 * @param {string} combo
 * @returns {string[]}
 */
function splitHotkey(combo) {
  const s = String(combo ?? '').trim().toLowerCase();
  return [...s.matchAll(/([^+]+|\+)(?:\+|$)/g)]
    .map((m) => m[1].trim())
    .filter(Boolean)
    .map((k) => (k === 'plus' ? '+' : k));
}

/**
 * Describe one key for display: visible label and spoken name.
 * @param {string} key - Lower-cased key name from splitHotkey()
 * @param {boolean} [mac] - Format for Mac (defaults to the detected platform)
 * @returns {{ label: string, spoken: string, modifier: boolean }}
 */
function describeKey(key, mac = isMac) {
  const symbols = mac ? SYMBOLS.mac : SYMBOLS.other;
  if (key in symbols) {
    return { label: symbols[key], spoken: (mac ? SPOKEN.mac : SPOKEN.other)[key], modifier: true };
  }
  const named = NAMED_KEYS[key];
  if (named) return { ...named, modifier: false };
  const label = key.toUpperCase();
  return { label, spoken: label, modifier: false };
}

/**
 * Format a hotkey combo string for display
 * @param {string} combo - Key combo like "meta+k" or "meta+shift+x"
 * @returns {string} Platform-formatted string like "⌘K" or "Ctrl+K"
 */
function formatHotkey(combo) {
  return splitHotkey(combo).map((k) => describeKey(k).label).join(isMac ? '' : '+');
}

/**
 * Parse a hotkey combo string into a descriptor object
 * @param {string} combo - Key combo like "meta+k" or "ctrl+shift+a"
 * @returns {{ key: string, meta: boolean, ctrl: boolean, shift: boolean, alt: boolean }}
 */
function parseHotkey(combo) {
  const parts = splitHotkey(combo);
  const key = parts.pop() ?? '';
  return {
    key,
    meta: parts.includes('meta') || parts.includes('cmd'),
    ctrl: parts.includes('ctrl') || parts.includes('control'),
    shift: parts.includes('shift'),
    alt: parts.includes('alt') || parts.includes('option')
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

export { isMac, formatHotkey, parseHotkey, matchesHotkey, splitHotkey, describeKey, SYMBOLS, SPOKEN, NAMED_KEYS };
