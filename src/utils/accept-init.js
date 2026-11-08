/**
 * accept-init: Character filter via data-accept attribute
 *
 * Restricts input to a set of allowed characters without enforcing a
 * rigid format like data-mask. Users can type separators freely — only
 * invalid characters are blocked.
 *
 * Named presets for common use cases. Custom character classes via
 * bracket syntax: data-accept="[0-9a-fA-F]".
 *
 * @attr {string} data-accept - Preset name or custom character class
 *
 * @example Preset
 * <input type="text" data-accept="phone" placeholder="+1 (555) 123-4567">
 *
 * @example Custom character class
 * <input type="text" data-accept="[0-9a-fA-F]" placeholder="Hex value">
 */

import { registerInit, onFormReset } from './_init-registry.js';

const SELECTOR = 'input[data-accept]';

const PRESETS = {
  digits:   { pattern: '[0-9]',         inputmode: 'numeric' },
  alpha:    { pattern: '[a-zA-Z]',      inputmode: 'text' },
  letters:  { pattern: '[\\p{L}\\p{M}]', inputmode: 'text' },
  alphanum: { pattern: '[a-zA-Z0-9]',   inputmode: 'text' },
  phone:    { pattern: '[0-9+()\\- ]',  inputmode: 'tel' },
  date:     { pattern: '[0-9/\\-.]',    inputmode: 'numeric' },
  hex:      { pattern: '[0-9a-fA-F]',   inputmode: 'text' },
  currency: { pattern: '[0-9.,]',       inputmode: 'decimal' },
  cc:       { pattern: '[0-9 \\-]',     inputmode: 'numeric' },
};

/**
 * Resolve the accept value to a regex and inputmode.
 * @param {string} value - Preset name or bracket character class
 * @returns {{ regex: RegExp, inputmode: string } | null}
 */
function resolveAccept(value) {
  if (!value) return null;

  const preset = Object.hasOwn(PRESETS, value) ? PRESETS[value] : null;
  if (preset) return { regex: new RegExp(preset.pattern, 'u'), inputmode: preset.inputmode };

  // Custom character class: must start with [. Unicode mode first (so
  // \p{...} and astral characters work), then legacy mode for classes
  // with escapes that are only valid outside it.
  if (value.startsWith('[')) {
    for (const flags of ['u', '']) {
      try {
        return { regex: new RegExp(value, flags), inputmode: 'text' };
      } catch { /* try the next mode */ }
    }
    console.warn(`[data-accept] Invalid character class: ${value}`);
    return null;
  }

  console.warn(`[data-accept] Unknown preset: ${value}`);
  return null;
}

/**
 * Enhance a single input with character filtering
 * @param {HTMLInputElement} input
 */
/** Inputs whose listeners are wired (a clone copies attributes, not this). */
const wired = new WeakSet();

/**
 * Keep only the characters the regex accepts (code point by code point).
 * @param {string} value
 * @param {RegExp} regex
 */
function filterChars(value, regex) {
  return Array.from(value).filter(ch => regex.test(ch)).join('');
}

function enhance(input) {
  if (wired.has(input)) return;
  wired.add(input);

  // Conflict guard: data-mask wins
  if (input.hasAttribute('data-mask')) {
    console.warn('[data-accept] Conflict: data-mask is also present — deferring to mask.', input);
    return;
  }

  const config = resolveAccept(input.dataset.accept || '');
  if (!config) return;

  const { regex, inputmode } = config;

  // Store pattern source for external consumption
  input.dataset.acceptPattern = regex.source;

  // Auto-set inputmode if not already specified
  if (!input.getAttribute('inputmode')) {
    input.setAttribute('inputmode', inputmode);
  }

  let composing = false;

  input.addEventListener('compositionstart', () => { composing = true; });
  input.addEventListener('compositionend', () => {
    composing = false;
    stripInvalid();
  });

  /**
   * Primary: beforeinput — block invalid chars before they appear.
   * Handles both typed and pasted input.
   */
  input.addEventListener('beforeinput', (e) => {
    if (composing) return;

    const data = e.data;
    if (data == null) return; // deletions, etc.

    // Paste: filter character-by-character
    if (e.inputType === 'insertFromPaste') {
      const filtered = filterChars(data, regex);
      if (filtered === data) return; // all valid, let it through

      e.preventDefault();
      if (!filtered) return; // nothing valid to insert

      // Use execCommand to preserve undo stack
      if (!document.execCommand('insertText', false, filtered)) {
        // Fallback: direct assignment
        insertFiltered(input, filtered);
      }
      return;
    }

    // Single char insert: block if invalid
    if (e.inputType === 'insertText' || e.inputType === 'insertCompositionText') {
      for (const ch of data) {
        if (!regex.test(ch)) {
          e.preventDefault();
          return;
        }
      }
    }
  });

  /**
   * Fallback: input event — strip invalid chars after the fact
   * for browsers where beforeinput isn't cancelable.
   */
  input.addEventListener('input', () => {
    if (composing) return;
    stripInvalid();
  });

  /**
   * Strip invalid characters from the current value, preserving cursor.
   */
  function stripInvalid() {
    const value = input.value;
    const filtered = filterChars(value, regex);
    if (filtered === value) return;

    // Valid text before the cursor (UTF-16 offsets, filtered by code point)
    const cursorBefore = input.selectionStart ?? 0;
    const keptBefore = filterChars(value.slice(0, cursorBefore), regex);

    input.value = filtered;

    // Position the cursor after the kept text
    const newCursor = Math.min(keptBefore.length, filtered.length);
    if (document.activeElement === input) input.setSelectionRange(newCursor, newCursor);
  }

  /** Filter a prefilled or reset-restored value (no cursor to keep). */
  function filterValue() {
    if (!input.value) return;
    const filtered = filterChars(input.value, regex);
    if (filtered !== input.value) input.value = filtered;
  }

  filterValue();
  onFormReset(input, filterValue);
}

/**
 * Insert filtered text with cursor positioning (fallback for execCommand)
 * @param {HTMLInputElement} input
 * @param {string} text
 */
function insertFiltered(input, text) {
  const start = input.selectionStart ?? 0;
  const end = input.selectionEnd ?? 0;
  const before = input.value.slice(0, start);
  const after = input.value.slice(end);
  input.value = before + text + after;
  const newCursor = start + text.length;
  input.setSelectionRange(newCursor, newCursor);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

/**
 * Initialize accept filters within a root element
 * @param {Element|Document} root
 */
function initAcceptInputs(root = document) {
  root.querySelectorAll(SELECTOR).forEach(enhance);
}

registerInit(SELECTOR, enhance);

export { initAcceptInputs };
