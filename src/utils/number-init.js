/**
 * number-init: Custom +/- stepper buttons for number inputs
 *
 * Wraps input[type="number"][data-stepper] with decrement/increment buttons.
 * Hides native spinners via CSS. Steps with the native stepUp()/stepDown(),
 * so min, max, step and the step base (min, else value) behave exactly like
 * the arrow keys. The buttons follow the input's disabled / readonly state
 * and re-sync after a form reset.
 *
 * @attr {string} data-stepper - Enable stepper enhancement
 * @attr {string} data-label-decrease - Decrease button name (default "Decrease")
 * @attr {string} data-label-increase - Increase button name (default "Increase")
 *
 * @example
 * <input type="number" min="0" max="50" step="1" value="0" data-stepper>
 */

import { registerInit, onFormReset } from './_init-registry.js';

const SELECTOR = 'input[type="number"][data-stepper]';

const MINUS_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
const PLUS_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;

/** @type {WeakSet<HTMLInputElement>} */
const wired = new WeakSet();

/**
 * @param {string} className
 * @param {string} svg
 */
function makeButton(className, svg) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = className;
  btn.innerHTML = svg;
  btn.tabIndex = -1;
  return btn;
}

/**
 * Manual step for step="any", where stepUp()/stepDown() throw.
 * @param {HTMLInputElement} input
 * @param {number} direction
 */
function stepAny(input, direction) {
  const min = input.min !== '' ? parseFloat(input.min) : -Infinity;
  const max = input.max !== '' ? parseFloat(input.max) : Infinity;
  const current = parseFloat(input.value) || 0;
  input.value = String(Math.min(Math.max(current + direction, min), max));
}

/**
 * @param {HTMLInputElement} input
 */
function enhanceNumber(input) {
  if (wired.has(input) || !input.parentNode) return;
  wired.add(input);
  input.setAttribute('data-stepper-init', '');

  // Reuse a wrapper cloned along with the input, minus its stale buttons.
  let wrapper = /** @type {HTMLElement} */ (input.parentElement);
  if (wrapper?.classList.contains('number-wrapper')) {
    wrapper.querySelectorAll(':scope > .number-dec, :scope > .number-inc').forEach((b) => b.remove());
  } else {
    wrapper = document.createElement('div');
    wrapper.className = 'number-wrapper';
    input.parentNode.insertBefore(wrapper, input);
  }

  const decBtn = makeButton('number-dec', MINUS_SVG);
  const incBtn = makeButton('number-inc', PLUS_SVG);

  wrapper.appendChild(decBtn);
  wrapper.appendChild(input);
  wrapper.appendChild(incBtn);

  function labels() {
    decBtn.setAttribute('aria-label', input.dataset.labelDecrease || 'Decrease');
    incBtn.setAttribute('aria-label', input.dataset.labelIncrease || 'Increase');
  }

  /** Disabled, readonly, or inside a disabled fieldset. */
  function locked() {
    return input.disabled || input.readOnly || input.matches(':disabled');
  }

  /** @param {number} direction */
  function step(direction) {
    if (locked()) return;
    const before = input.value;
    try {
      if (direction > 0) input.stepUp(); else input.stepDown();
    } catch {
      stepAny(input, direction);
    }
    if (input.value !== before) {
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
    updateButtons();
  }

  function updateButtons() {
    const min = input.min !== '' ? parseFloat(input.min) : -Infinity;
    const max = input.max !== '' ? parseFloat(input.max) : Infinity;
    const val = parseFloat(input.value);
    const off = locked();
    decBtn.disabled = off || (Number.isFinite(val) && val <= min);
    incBtn.disabled = off || (Number.isFinite(val) && val >= max);
  }

  decBtn.addEventListener('click', () => step(-1));
  incBtn.addEventListener('click', () => step(1));
  input.addEventListener('input', updateButtons);
  input.addEventListener('change', updateButtons);
  onFormReset(input, updateButtons);

  // disabled / readonly / bounds / labels can change after init.
  new MutationObserver(() => { labels(); updateButtons(); }).observe(input, {
    attributes: true,
    attributeFilter: ['disabled', 'readonly', 'min', 'max', 'step',
      'data-label-decrease', 'data-label-increase'],
  });

  labels();
  updateButtons();
}

function initNumberSteppers(root = document) {
  root.querySelectorAll(SELECTOR).forEach((el) => enhanceNumber(/** @type {HTMLInputElement} */ (el)));
}

registerInit(SELECTOR, enhanceNumber);

export { initNumberSteppers };
