/**
 * textarea-grow-init: Auto-expanding textarea
 *
 * Grows the textarea height to fit its content. CSS does the work where
 * field-sizing: content is supported (form-enhancements.css); this module
 * passes rows / data-max-rows to CSS as custom properties and runs a JS
 * measurement fallback for browsers without field-sizing.
 *
 * Re-measures on input, on change, and after the owning form resets. Script
 * that sets `.value` should dispatch an input event afterwards
 * (`ta.dispatchEvent(new Event('input', { bubbles: true }))`) — the same
 * event also refreshes a data-count counter. With field-sizing support the
 * height follows programmatic values on its own.
 *
 * @attr {string} data-grow - Enable auto-expanding
 * @attr {number} data-max-rows - Maximum rows before scrolling (default: unlimited)
 *
 * @example
 * <textarea data-grow rows="2" data-max-rows="10"></textarea>
 */

import { registerInit, onFormReset } from './_init-registry.js';

const SELECTOR = 'textarea[data-grow]';
const supportsFieldSizing = CSS.supports('field-sizing', 'content');

/** @type {WeakSet<HTMLTextAreaElement>} */
const wired = new WeakSet();

/**
 * Enhance a textarea with auto-expanding behavior
 * @param {HTMLTextAreaElement} textarea
 */
function enhanceTextarea(textarea) {
  // The attribute flag is cloned with the element; `wired` is the real guard
  // so a cloned textarea still gets its own listeners.
  if (wired.has(textarea)) return;
  wired.add(textarea);

  const maxRows = parseInt(textarea.dataset.maxRows ?? '0', 10) || 0;

  // Hand rows / max rows to CSS (min-block-size and max-block-size rules).
  if (textarea.hasAttribute('rows')) {
    textarea.style.setProperty('--grow-rows', String(textarea.rows));
  }
  if (maxRows > 0) {
    textarea.style.setProperty('--grow-max-rows', String(maxRows));
  }

  if (supportsFieldSizing) {
    textarea.setAttribute('data-grow-init', '');
    return; // CSS handles sizing and scrolling past the max
  }

  // JS fallback: measure scrollHeight. Overflow is hidden while the content
  // fits (no flashing scrollbar) and becomes auto once the max is reached.
  textarea.setAttribute('data-grow-init', 'fallback');

  function resize() {
    textarea.style.blockSize = 'auto';
    const style = getComputedStyle(textarea);
    const borderBlock = parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
    let target = textarea.scrollHeight + borderBlock;

    if (maxRows > 0) {
      const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.2;
      const paddingBlock = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
      const maxHeight = lineHeight * maxRows + paddingBlock + borderBlock;
      if (target > maxHeight) {
        target = maxHeight;
        textarea.style.overflowY = 'auto';
      } else {
        textarea.style.overflowY = 'hidden';
      }
    }

    textarea.style.blockSize = target + 'px';
  }

  textarea.addEventListener('input', resize);
  textarea.addEventListener('change', resize);
  // Form reset restores the default value without an input event.
  onFormReset(textarea, resize);
  resize();
}

/**
 * Initialize auto-grow within a root
 * @param {Element|Document} root
 */
function initTextareaGrow(root = document) {
  root.querySelectorAll(SELECTOR).forEach(enhanceTextarea);
}

registerInit(SELECTOR, enhanceTextarea);

export { initTextareaGrow };
