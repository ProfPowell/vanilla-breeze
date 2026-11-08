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
 * Key aliases accepted in combo strings, mapped to the lower-cased
 * KeyboardEvent.key value they match.
 * @type {Record<string, string>}
 */
const KEY_ALIASES = {
  esc: 'escape',
  return: 'enter',
  del: 'delete',
  ins: 'insert',
  up: 'arrowup',
  down: 'arrowdown',
  left: 'arrowleft',
  right: 'arrowright',
  space: ' ',
  spacebar: ' ',
  plus: '+',
  pgup: 'pageup',
  pgdn: 'pagedown',
};

/**
 * Normalise one key name from a combo string to the lower-cased
 * KeyboardEvent.key value it matches ("esc" → "escape", "space" → " ").
 * @param {string} key
 * @returns {string}
 */
function normalizeKey(key) {
  const k = String(key ?? '').toLowerCase();
  return KEY_ALIASES[k] ?? k;
}

/**
 * Parse a hotkey combo string into a descriptor object
 * @param {string} combo - Key combo like "meta+k" or "ctrl+shift+a"
 * @returns {{ key: string, meta: boolean, ctrl: boolean, shift: boolean, alt: boolean }}
 */
function parseHotkey(combo) {
  const parts = splitHotkey(combo);
  const key = normalizeKey(parts.pop() ?? '');
  return {
    key,
    meta: parts.includes('meta') || parts.includes('cmd'),
    ctrl: parts.includes('ctrl') || parts.includes('control'),
    shift: parts.includes('shift'),
    alt: parts.includes('alt') || parts.includes('option')
  };
}

/**
 * Printable non-alphanumeric keys ("?", "/", "+", "!") are typed with or
 * without Shift depending on the keyboard layout, so their Shift state is
 * not compared ("?" and "shift+?" both match Shift+/ on a US layout).
 * @param {string} key - normalised key
 */
function shiftAgnostic(key) {
  return key.length === 1 && !/[a-z0-9 ]/.test(key);
}

/**
 * Test if a KeyboardEvent matches a parsed hotkey descriptor.
 * "meta" matches Cmd on Mac, Ctrl on others. Letters and digits also match
 * by physical key (event.code) when Alt or Shift changed the character
 * (Mac Option+K types "˚"; Shift+1 types "!").
 * @param {KeyboardEvent} event
 * @param {{ key: string, meta: boolean, ctrl: boolean, shift: boolean, alt: boolean }} descriptor
 * @returns {boolean}
 */
function matchesHotkey(event, descriptor) {
  const key = event.key === 'Spacebar' ? ' ' : String(event.key ?? '').toLowerCase();
  let keyMatches = key === descriptor.key;
  if (!keyMatches && (event.altKey || event.shiftKey) && /^[a-z0-9]$/.test(descriptor.key)) {
    const code = /\d/.test(descriptor.key) ? `Digit${descriptor.key}` : `Key${descriptor.key.toUpperCase()}`;
    keyMatches = event.code === code;
  }
  if (!keyMatches) return false;

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
  if (!shiftAgnostic(descriptor.key) && descriptor.shift !== event.shiftKey) return false;
  if (descriptor.alt !== event.altKey) return false;

  return true;
}

/**
 * Is this a character-key shortcut (WCAG 2.1.4)? True when the combo uses
 * a single printable key with no Ctrl, Cmd/Meta or Alt (Shift allowed).
 * @param {string | { key: string, meta: boolean, ctrl: boolean, alt: boolean }} combo
 * @returns {boolean}
 */
function isCharacterShortcut(combo) {
  const d = typeof combo === 'string' ? parseHotkey(combo) : combo;
  return !d.meta && !d.ctrl && !d.alt && d.key.length === 1;
}

/**
 * Do two combos name the same shortcut on this platform? ("meta+k" and
 * "cmd+k" do everywhere; "meta+k" and "ctrl+k" do off Mac.)
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
function sameHotkey(a, b) {
  const x = parseHotkey(a);
  const y = parseHotkey(b);
  const ctrlX = isMac ? x.ctrl : x.ctrl || x.meta;
  const ctrlY = isMac ? y.ctrl : y.ctrl || y.meta;
  const metaX = isMac && x.meta;
  const metaY = isMac && y.meta;
  const shiftMatters = !shiftAgnostic(x.key);
  return x.key === y.key && ctrlX === ctrlY && metaX === metaY && x.alt === y.alt
    && (!shiftMatters || x.shift === y.shift);
}

/** aria-keyshortcuts names for normalised named keys. */
const ARIA_KEYS = {
  ' ': 'Space', '+': 'Plus', escape: 'Escape', enter: 'Enter', tab: 'Tab',
  backspace: 'Backspace', delete: 'Delete', insert: 'Insert', home: 'Home', end: 'End',
  pageup: 'PageUp', pagedown: 'PageDown', arrowup: 'ArrowUp', arrowdown: 'ArrowDown',
  arrowleft: 'ArrowLeft', arrowright: 'ArrowRight',
};

/**
 * Format a combo as an aria-keyshortcuts value ("Control+Shift+P",
 * "Meta+K" on Mac for "meta+k", "Shift+?", "Space").
 * @param {string} combo
 * @param {boolean} [mac] - defaults to the detected platform
 * @returns {string}
 */
function toAriaKeyShortcuts(combo, mac = isMac) {
  const d = parseHotkey(combo);
  const mods = [];
  if (d.alt) mods.push('Alt');
  if (d.ctrl || (d.meta && !mac)) mods.push('Control');
  if (d.meta && mac) mods.push('Meta');
  // "?" needs Shift on most layouts; say so when the author wrote it.
  if (d.shift) mods.push('Shift');
  let key = ARIA_KEYS[d.key];
  if (!key) key = /^f\d{1,2}$/.test(d.key) ? d.key.toUpperCase() : d.key.length === 1 ? d.key.toUpperCase() : d.key[0].toUpperCase() + d.key.slice(1);
  return [...mods, key].join('+');
}

export {
  isMac, formatHotkey, parseHotkey, matchesHotkey, splitHotkey, describeKey, normalizeKey,
  isCharacterShortcut, sameHotkey, toAriaKeyShortcuts, SYMBOLS, SPOKEN, NAMED_KEYS, KEY_ALIASES,
};
