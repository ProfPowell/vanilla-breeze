/**
 * textarea-count-init: Character/word counter for textareas
 *
 * Shows a live count below the textarea. Uses maxlength for character mode,
 * data-maxwords for word mode. Color shifts at 80% (warning) and 100% (error).
 *
 * @attr {string} data-count - Enable counter. "words" for word mode, empty for character mode.
 * @attr {number} data-maxwords - Max word count (word mode only)
 *
 * @example Character count (uses native maxlength)
 * <textarea maxlength="500" data-count></textarea>
 *
 * @example Word count
 * <textarea data-count="words" data-maxwords="200"></textarea>
 */

const SELECTOR = 'textarea[data-count]';

/**
 * Enhance a textarea with a live counter
 * @param {HTMLTextAreaElement} textarea
 */
function enhanceTextarea(textarea) {
  if (textarea.hasAttribute('data-count-init')) return;
  textarea.setAttribute('data-count-init', '');

  const isWordMode = textarea.dataset.count === 'words';
  const max = isWordMode
    ? parseInt(textarea.dataset.maxwords, 10) || 0
    : textarea.maxLength > 0 ? textarea.maxLength : 0;

  // Create counter element
  const counter = document.createElement('output');
  counter.className = 'textarea-counter';
  counter.setAttribute('aria-live', 'polite');
  counter.setAttribute('aria-atomic', 'true');

  // Insert after textarea (or after form-field's existing outputs)
  const formField = textarea.closest('form-field');
  if (formField) {
    formField.appendChild(counter);
  } else {
    textarea.insertAdjacentElement('afterend', counter);
  }

  function update() {
    const value = textarea.value;
    const current = isWordMode
      ? (value.trim() ? value.trim().split(/\s+/).length : 0)
      : value.length;

    if (max > 0) {
      counter.textContent = `${current} / ${max}`;
      const ratio = current / max;
      counter.dataset.state =
        ratio >= 1 ? 'error' :
        ratio >= 0.8 ? 'warning' : '';
    } else {
      const unit = isWordMode ? (current === 1 ? 'word' : 'words') : (current === 1 ? 'character' : 'characters');
      counter.textContent = `${current} ${unit}`;
      counter.dataset.state = '';
    }
  }

  textarea.addEventListener('input', update);
  update();
}

/**
 * Initialize counters within a root
 * @param {Element|Document} root
 */
function initTextareaCounts(root = document) {
  root.querySelectorAll(SELECTOR).forEach(enhanceTextarea);
}

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initTextareaCounts());
} else {
  initTextareaCounts();
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

export { initTextareaCounts };
