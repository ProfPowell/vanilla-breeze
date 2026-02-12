/**
 * textarea-grow-init: Auto-expanding textarea
 *
 * Grows the textarea height to fit its content. Uses CSS field-sizing: content
 * where supported, with a JS measurement fallback for older browsers.
 *
 * @attr {string} data-grow - Enable auto-expanding
 * @attr {number} data-max-rows - Maximum rows before scrolling (default: unlimited)
 *
 * @example
 * <textarea data-grow rows="2" data-max-rows="10"></textarea>
 */

const SELECTOR = 'textarea[data-grow]';
const supportsFieldSizing = CSS.supports('field-sizing', 'content');

/**
 * Enhance a textarea with auto-expanding behavior
 * @param {HTMLTextAreaElement} textarea
 */
function enhanceTextarea(textarea) {
  if (textarea.hasAttribute('data-grow-init')) return;
  textarea.setAttribute('data-grow-init', '');

  const maxRows = parseInt(textarea.dataset.maxRows, 10) || 0;

  // Disable manual resize — auto-grow handles it
  textarea.style.resize = 'none';

  if (supportsFieldSizing) {
    textarea.style.fieldSizing = 'content';
    if (maxRows > 0) {
      textarea.style.maxBlockSize = `${maxRows}lh`;
    }
    return; // CSS handles everything
  }

  // JS fallback: measure scrollHeight on input
  textarea.style.overflow = 'hidden';

  function resize() {
    textarea.style.blockSize = 'auto';
    let target = textarea.scrollHeight;

    if (maxRows > 0) {
      const style = getComputedStyle(textarea);
      const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.2;
      const paddingBlock = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
      const maxHeight = lineHeight * maxRows + paddingBlock;
      if (target > maxHeight) {
        target = maxHeight;
        textarea.style.overflow = 'auto';
      } else {
        textarea.style.overflow = 'hidden';
      }
    }

    textarea.style.blockSize = target + 'px';
  }

  textarea.addEventListener('input', resize);
  // Also resize on programmatic value changes
  textarea.addEventListener('change', resize);
  resize();
}

/**
 * Initialize auto-grow within a root
 * @param {Element|Document} root
 */
function initTextareaGrow(root = document) {
  root.querySelectorAll(SELECTOR).forEach(enhanceTextarea);
}

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initTextareaGrow());
} else {
  initTextareaGrow();
}

// Watch for dynamically added textareas
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      if (node.matches?.(SELECTOR)) enhanceTextarea(node);
      node.querySelectorAll?.(SELECTOR).forEach(enhanceTextarea);
    }
  }
});

observer.observe(document.documentElement, { childList: true, subtree: true });

export { initTextareaGrow };
