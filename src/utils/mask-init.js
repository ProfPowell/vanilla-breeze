/**
 * mask-init: Format inputs as user types via data attributes
 *
 * Enhances text inputs with data-mask to apply formatting masks.
 * Preset masks for phone, credit card, date, SSN, and zip.
 * Custom masks via data-pattern (# = digit, A = letter, * = any).
 *
 * @attr {string} data-mask - Mask type: "phone", "credit-card", "date", "ssn", "zip", "custom"
 * @attr {string} data-pattern - Custom pattern when data-mask="custom"
 *
 * @example Preset mask
 * <input type="text" data-mask="phone" placeholder="(555) 123-4567">
 *
 * @example Custom mask
 * <input type="text" data-mask="custom" data-pattern="AA-####" placeholder="AB-1234">
 */

const SELECTOR = 'input[data-mask]';

const MASKS = {
  phone:         { pattern: '(###) ###-####', accept: /\d/ },
  'credit-card': { pattern: '#### #### #### ####', accept: /\d/ },
  date:          { pattern: '##/##/####', accept: /\d/ },
  ssn:           { pattern: '###-##-####', accept: /\d/ },
  zip:           { pattern: '#####', accept: /\d/ },
};

const TOKEN_REGEX = { '#': /\d/, A: /[a-zA-Z]/, '*': /[a-zA-Z0-9]/ };

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

function extractRaw(value, acceptRegex) {
  return value.split('').filter(ch => acceptRegex.test(ch)).join('');
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
  if (input.hasAttribute('data-mask-init')) return;
  input.setAttribute('data-mask-init', '');

  const config = getMaskConfig(input);
  if (!config) return;

  const { pattern } = config;
  const acceptRegex = config.accept;

  // Auto-set inputmode for digit-only masks
  if (isAllDigits(pattern) && !input.getAttribute('inputmode')) {
    input.setAttribute('inputmode', 'numeric');
  }

  // Auto-set maxlength from pattern length
  if (!input.getAttribute('maxlength')) {
    input.setAttribute('maxlength', String(pattern.length));
  }

  let composing = false;

  input.addEventListener('compositionstart', () => { composing = true; });
  input.addEventListener('compositionend', () => { composing = false; handleFormat(); });

  function handleFormat() {
    if (composing) return;

    // Count accepted chars before cursor in old value
    const cursorBefore = input.selectionStart ?? 0;
    let acceptedBeforeCursor = 0;
    for (let i = 0; i < cursorBefore && i < input.value.length; i++) {
      if (acceptRegex.test(input.value[i])) acceptedBeforeCursor++;
    }

    const raw = extractRaw(input.value, acceptRegex);
    const formatted = applyMask(raw, pattern);

    input.value = formatted;
    input.dataset.rawValue = raw;

    // Reposition cursor: find position after Nth accepted char
    let counted = 0;
    let newCursor = formatted.length;
    for (let i = 0; i < formatted.length; i++) {
      if (i < pattern.length && isToken(pattern[i])) {
        counted++;
        if (counted === acceptedBeforeCursor) {
          newCursor = i + 1;
          // Skip past trailing literal chars so cursor lands at next token
          while (newCursor < pattern.length && !isToken(pattern[newCursor])) {
            newCursor++;
          }
          break;
        }
      }
    }

    input.setSelectionRange(newCursor, newCursor);
  }

  input.addEventListener('input', handleFormat);

  // Format initial value if present
  if (input.value) {
    const raw = extractRaw(input.value, acceptRegex);
    input.value = applyMask(raw, pattern);
    input.dataset.rawValue = raw;
  }
}

/**
 * Initialize mask inputs within a root element
 * @param {Element|Document} root
 */
function initMaskInputs(root = document) {
  root.querySelectorAll(SELECTOR).forEach(enhanceInput);
}

// Auto-init on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initMaskInputs());
} else {
  initMaskInputs();
}

// Watch for dynamically added mask inputs
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      if (node.matches?.(SELECTOR)) enhanceInput(node);
      node.querySelectorAll?.(SELECTOR).forEach(enhanceInput);
    }
  }
});

observer.observe(document.documentElement, { childList: true, subtree: true });

export { initMaskInputs };
