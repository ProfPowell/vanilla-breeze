/**
 * switch-init: Enhance checkbox switches with ARIA role
 *
 * Adds role="switch" to checkboxes with data-switch for screen readers.
 * Visual styling is CSS-only via input[data-switch].
 *
 * @attr {string} data-switch - Marks checkbox as a toggle switch. Optional size: "sm" or "lg".
 *
 * @example
 * <label><input type="checkbox" data-switch name="notifications"> Enable notifications</label>
 */

const SELECTOR = 'input[type="checkbox"][data-switch]';

/**
 * Enhance a single checkbox with switch role
 * @param {HTMLInputElement} input
 */
function enhanceSwitch(input) {
  if (input.hasAttribute('data-switch-init')) return;
  input.setAttribute('data-switch-init', '');
  input.setAttribute('role', 'switch');
}

/**
 * Initialize all switches within a root
 * @param {Element|Document} root
 */
function initSwitches(root = document) {
  root.querySelectorAll(SELECTOR).forEach(enhanceSwitch);
}

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initSwitches());
} else {
  initSwitches();
}

// Watch for dynamically added switches
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      if (node.matches?.(SELECTOR)) enhanceSwitch(node);
      node.querySelectorAll?.(SELECTOR).forEach(enhanceSwitch);
    }
  }
});

observer.observe(document.documentElement, { childList: true, subtree: true });

export { initSwitches };
