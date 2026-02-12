/**
 * toggle-tags-init: Max-selection enforcement for toggle tag fieldsets
 *
 * CSS handles all visual styling via [data-toggle-tags].
 * This JS only runs when data-max is set to enforce a selection limit.
 *
 * @attr {string} data-toggle-tags - Enable toggle tag styling (CSS-only)
 * @attr {number} data-max - Maximum number of selections allowed
 *
 * @example
 * <fieldset data-toggle-tags data-max="3">
 *   <legend>Pick up to 3</legend>
 *   <label><input type="checkbox" name="skills" value="js"> JavaScript</label>
 *   <label><input type="checkbox" name="skills" value="py"> Python</label>
 * </fieldset>
 */

const SELECTOR = 'fieldset[data-toggle-tags][data-max]';

function enhanceToggleTags(fieldset) {
  if (fieldset.hasAttribute('data-toggle-tags-init')) return;
  fieldset.setAttribute('data-toggle-tags-init', '');

  const max = parseInt(fieldset.dataset.max, 10);
  if (!max || max < 1) return;

  function update() {
    const checkboxes = fieldset.querySelectorAll('input[type="checkbox"]');
    const checked = fieldset.querySelectorAll('input[type="checkbox"]:checked').length;
    checkboxes.forEach(cb => {
      if (!cb.checked) {
        cb.disabled = checked >= max;
      }
    });
  }

  fieldset.addEventListener('change', update);
  update();
}

function initToggleTags(root = document) {
  root.querySelectorAll(SELECTOR).forEach(enhanceToggleTags);
}

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initToggleTags());
} else {
  initToggleTags();
}

// Watch for dynamically added elements
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      if (node.matches?.(SELECTOR)) enhanceToggleTags(node);
      node.querySelectorAll?.(SELECTOR).forEach(enhanceToggleTags);
    }
  }
});

observer.observe(document.documentElement, { childList: true, subtree: true });

export { initToggleTags };
