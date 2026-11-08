/**
 * switch-init: Enhance checkbox switches with ARIA role
 *
 * Adds role="switch" to checkboxes with data-switch for screen readers.
 * Visual styling is CSS-only via input[data-switch] (no JavaScript needed
 * for the look); only the role comes from here. Author role="switch" in the
 * markup for no-JS parity — an authored role is left alone.
 *
 * @attr {string} data-switch - Marks checkbox as a toggle switch. Optional size: "s" or "l".
 *
 * @example
 * <label><input type="checkbox" data-switch name="notifications"> Enable notifications</label>
 */

import { registerInit } from './_init-registry.js';

const SELECTOR = 'input[type="checkbox"][data-switch]';

/**
 * Enhance a single checkbox with switch role. Idempotent: the role is the
 * whole enhancement, so clones and re-insertions just re-assert it.
 * @param {HTMLInputElement} input
 */
function enhanceSwitch(input) {
  if (!input.hasAttribute('role')) input.setAttribute('role', 'switch');
  input.setAttribute('data-switch-init', '');
}

/**
 * Initialize all switches within a root
 * @param {Element|Document} root
 */
function initSwitches(root = document) {
  root.querySelectorAll(SELECTOR).forEach((el) => enhanceSwitch(/** @type {HTMLInputElement} */ (el)));
}

registerInit(SELECTOR, enhanceSwitch);

export { initSwitches };
