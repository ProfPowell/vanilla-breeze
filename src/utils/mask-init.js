/**
 * mask-init: Format inputs as user types via data attributes
 *
 * Enhances text-like inputs (text, tel, search) with data-mask to apply
 * formatting masks. Preset masks for US phone, credit card, US date, SSN and
 * ZIP. Custom masks via data-pattern (# = digit, A = letter, * = letter or
 * digit; any other character is a literal). Letters keep the case typed.
 *
 * A value that does not fill the mask is reported through
 * setCustomValidity, so `required` and form-field validation see an
 * incomplete value as invalid. data-raw-value mirrors the unformatted value
 * for scripts; it is not submitted (the form posts the formatted value).
 *
 * @attr {string} data-mask - Mask type: "phone", "credit-card", "date", "ssn", "zip", "custom"
 * @attr {string} data-pattern - Custom pattern when data-mask="custom"
 * @attr {string} data-mask-message - Validation message for an incomplete value
 *
 * @example Preset mask
 * <input type="tel" data-mask="phone" placeholder="(555) 123-4567">
 *
 * @example Custom mask
 * <input type="text" data-mask="custom" data-pattern="AA-####" placeholder="AB-1234">
 */

import { registerInit, onFormReset } from './_init-registry.js';

const SELECTOR = 'input[data-mask]';

/** Input types whose value and selection API a mask can drive. */
const MASKABLE = new Set(['text', 'tel', 'search']);

const MASKS = {
  phone:         { pattern: '(###) ###-####', accept: /\d/ },
  'credit-card': { pattern: '#### #### #### ####', accept: /\d/ },
  date:          { pattern: '##/##/####', accept: /\d/ },
  ssn:           { pattern: '###-##-####', accept: /\d/ },
  zip:           { pattern: '#####', accept: /\d/ },
};

const TOKEN_REGEX = { '#': /\d/, A: /[a-zA-Z]/, '*': /[a-zA-Z0-9]/ };

/** @type {WeakSet<HTMLInputElement>} */
const wired = new WeakSet();
/** Inputs waiting for a usable data-mask / data-pattern. */
const pending = new WeakSet();

function getMaskConfig(input) {
  const type = input.dataset.mask;
  if (MASKS[type]) return MASKS[type];
  if (type === 'custom' && input.dataset.pattern) {
    const pattern = input.dataset.pattern;
    // Build accept regex from token types present in pattern
    const parts = new Set();
    for (const ch of pattern) {
      if (ch === '#') parts.add('0-9');
      else if (ch === 'A') parts.add('a-zA-Z');
      else if (ch === '*') parts.add('a-zA-Z0-9');
    }
    const accept = parts.size > 0 ? new RegExp(`[${[...parts].join('')}]`) : /./;
    return { pattern, accept };
  }
  return null;
}

function isToken(ch) {
  return ch === '#' || ch === 'A' || ch === '*';
}

function acceptsChar(token, ch) {
  const regex = TOKEN_REGEX[token];
  return regex ? regex.test(ch) : false;
}

/** Number of token slots in a pattern (the length of a complete raw value). */
function tokenCount(pattern) {
  let n = 0;
  for (const ch of pattern) if (isToken(ch)) n++;
  return n;
}

function applyMask(raw, pattern) {
  let result = '';
  let rawIndex = 0;

  for (let i = 0; i < pattern.length && rawIndex < raw.length; i++) {
    const p = pattern[i];
    if (isToken(p)) {
      // Find next raw char that matches this token
      while (rawIndex < raw.length && !acceptsChar(p, raw[rawIndex])) {
        rawIndex++;
      }
      if (rawIndex < raw.length) {
        result += raw[rawIndex];
        rawIndex++;
      }
    } else {
      result += p;
    }
  }

  return result;
}

/**
 * Pull the user's characters out of a (possibly partly formatted) value by
 * walking it against the pattern: a character equal to the literal the
 * pattern expects at that point is the literal, not input. So the "1" in a
 * "+1 ###-####" pattern is never re-read as a typed digit.
 * Characters past the end of the pattern are kept (when accepted) so an
 * insertion in the middle can push the tail along; applyMask trims them.
 *
 * @param {string} value
 * @param {string} pattern
 * @param {RegExp} acceptRegex
 */
function extractRaw(value, pattern, acceptRegex) {
  let raw = '';
  let j = 0;
  for (const ch of value) {
    if (j < pattern.length && !isToken(pattern[j])) {
      if (ch === pattern[j]) { j++; continue; }
      // Literal missing from the value: skip past the run of literals.
      while (j < pattern.length && !isToken(pattern[j])) j++;
    }
    if (j < pattern.length) {
      if (acceptsChar(pattern[j], ch)) { raw += ch; j++; }
    } else if (acceptRegex.test(ch)) {
      raw += ch;
    }
  }
  return raw;
}

/** Caret index just after the Nth user character (N = 0: first token slot). */
function caretFor(n, formatted, pattern) {
  let counted = 0;
  let pos = 0;
  if (n > 0) {
    for (let i = 0; i < formatted.length; i++) {
      if (isToken(pattern[i])) {
        counted++;
        if (counted === n) { pos = i + 1; break; }
      }
    }
    if (counted < n) pos = formatted.length;
  }
  // Skip trailing literals so the caret lands on the next token slot.
  while (pos < pattern.length && pos < formatted.length && !isToken(pattern[pos])) pos++;
  return pos;
}

function isAllDigits(pattern) {
  for (const ch of pattern) {
    if (isToken(ch) && ch !== '#') return false;
  }
  return true;
}

/**
 * Enhance a single input with mask behavior
 * @param {HTMLInputElement} input
 */
function enhanceInput(input) {
  if (wired.has(input)) return;
  if (!MASKABLE.has(input.type)) return;

  const config = getMaskConfig(input);
  if (!config) {
    // Unknown preset / custom without a pattern: try again when the
    // attributes are fixed instead of marking the input done.
    input.removeAttribute('data-mask-init');
    if (!pending.has(input)) {
      pending.add(input);
      const retry = new MutationObserver(() => {
        if (!getMaskConfig(input)) return;
        retry.disconnect();
        pending.delete(input);
        enhanceInput(input);
      });
      retry.observe(input, { attributes: true, attributeFilter: ['data-mask', 'data-pattern', 'type'] });
    }
    return;
  }

  wired.add(input);
  input.setAttribute('data-mask-init', '');

  const { pattern } = config;
  const acceptRegex = config.accept;
  const slots = tokenCount(pattern);

  // Auto-set inputmode for digit-only masks
  if (isAllDigits(pattern) && !input.getAttribute('inputmode')) {
    input.setAttribute('inputmode', 'numeric');
  }

  // Auto-set maxlength from pattern length
  if (!input.getAttribute('maxlength')) {
    input.setAttribute('maxlength', String(pattern.length));
  }

  let composing = false;
  /** Value and edit type captured just before each edit. */
  let before = null;
  let inputType = '';
  /** The incomplete-value message we set, so we never clear someone else's. */
  let ownMessage = '';

  function validate() {
    const raw = input.dataset.rawValue || '';
    const incomplete = raw.length > 0 && raw.length < slots;
    if (incomplete) {
      const hint = input.getAttribute('placeholder');
      ownMessage = input.dataset.maskMessage
        || (hint ? `Enter the complete value, like ${hint}.` : 'Enter the complete value.');
      input.setCustomValidity(ownMessage);
    } else if (ownMessage && input.validationMessage === ownMessage) {
      input.setCustomValidity('');
      ownMessage = '';
    }
  }

  /** Format the whole current value (init, reset, programmatic). */
  function formatAll() {
    const raw = extractRaw(input.value, pattern, acceptRegex).slice(0, slots);
    const formatted = applyMask(raw, pattern);
    // Only write when it changes: a .value write marks the control dirty.
    if (input.value !== formatted) input.value = formatted;
    input.dataset.rawValue = raw;
    validate();
  }

  input.addEventListener('compositionstart', () => { composing = true; });
  input.addEventListener('compositionend', () => { composing = false; handleFormat(); });
  input.addEventListener('beforeinput', (e) => {
    before = input.value;
    inputType = /** @type {InputEvent} */ (e).inputType || '';
  });

  function handleFormat() {
    if (composing) return;

    // User characters before the caret, read with the same pattern walk.
    const cursor = input.selectionStart ?? input.value.length;
    let rawBefore = extractRaw(input.value.slice(0, cursor), pattern, acceptRegex).length;
    let raw = extractRaw(input.value, pattern, acceptRegex);

    // Backspace / Delete over a literal only: the reformat would put it
    // straight back and the caret would stall. Remove the neighbouring
    // user character instead, as the user meant.
    const oldRaw = before != null ? extractRaw(before, pattern, acceptRegex) : null;
    if (oldRaw != null && raw === oldRaw && before !== input.value) {
      if (inputType === 'deleteContentBackward' && rawBefore > 0) {
        raw = raw.slice(0, rawBefore - 1) + raw.slice(rawBefore);
        rawBefore--;
      } else if (inputType === 'deleteContentForward' && rawBefore < raw.length) {
        raw = raw.slice(0, rawBefore) + raw.slice(rawBefore + 1);
      }
    }
    before = null;
    inputType = '';

    raw = raw.slice(0, slots);
    const formatted = applyMask(raw, pattern);

    input.value = formatted;
    input.dataset.rawValue = raw;
    validate();

    const pos = caretFor(Math.min(rawBefore, raw.length), formatted, pattern);
    if (document.activeElement === input) input.setSelectionRange(pos, pos);
  }

  input.addEventListener('input', handleFormat);
  // Reset restores the authored default, which may be unformatted.
  onFormReset(input, formatAll);

  formatAll();
}

/**
 * Initialize mask inputs within a root element
 * @param {Element|Document} root
 */
function initMaskInputs(root = document) {
  root.querySelectorAll(SELECTOR).forEach((el) => enhanceInput(/** @type {HTMLInputElement} */ (el)));
}

registerInit(SELECTOR, enhanceInput);

export { initMaskInputs };
