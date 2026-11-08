/**
 * color-init: Enhanced color input with swatch and hex display
 *
 * Wraps input[type="color"][data-color] and adds a swatch circle and hex code
 * beside it. The native input stays the one and only control: it sits as a
 * transparent layer over the display, so it receives clicks, focus and the
 * keyboard, and keeps its label. The display is aria-hidden decoration,
 * re-synced on input, change and form reset.
 *
 * Scoped to input[type="color"]; the data-color colour-variant attribute on
 * <layout-badge> and buttons is a different, unrelated attribute.
 *
 * @attr {string} data-color - Enable enhanced color display
 *
 * @example
 * <input type="color" value="#6366f1" data-color>
 */

import { registerInit, onFormReset } from './_init-registry.js';

const SELECTOR = 'input[type="color"][data-color]';

/** @type {WeakSet<HTMLInputElement>} */
const wired = new WeakSet();

/**
 * @param {HTMLInputElement} input
 */
function enhanceColor(input) {
  if (wired.has(input) || !input.parentNode) return;
  if (input.closest('color-picker')) return;
  wired.add(input);
  input.setAttribute('data-color-init', '');

  // Reuse a wrapper cloned along with the input, minus its stale display.
  let wrapper = /** @type {HTMLElement} */ (input.parentElement);
  if (wrapper?.classList.contains('color-wrapper')) {
    wrapper.querySelectorAll(':scope > .color-display').forEach((n) => n.remove());
  } else {
    wrapper = document.createElement('span');
    wrapper.className = 'color-wrapper';
    input.parentNode.insertBefore(wrapper, input);
    wrapper.appendChild(input);
  }

  const display = document.createElement('span');
  display.className = 'color-display';
  display.setAttribute('aria-hidden', 'true');

  const swatch = document.createElement('span');
  swatch.className = 'color-swatch';

  const hex = document.createElement('span');
  hex.className = 'color-hex';

  display.append(swatch, hex);
  wrapper.appendChild(display);

  function update() {
    swatch.style.setProperty('--color-swatch-value', input.value);
    hex.textContent = input.value;
  }

  input.addEventListener('input', update);
  input.addEventListener('change', update);
  onFormReset(input, update);
  update();
}

function initColorInputs(root = document) {
  root.querySelectorAll(SELECTOR).forEach((el) => enhanceColor(/** @type {HTMLInputElement} */ (el)));
}

registerInit(SELECTOR, enhanceColor);

export { initColorInputs };
