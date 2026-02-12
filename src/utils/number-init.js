/**
 * number-init: Custom +/- stepper buttons for number inputs
 *
 * Wraps input[type="number"][data-stepper] with decrement/increment buttons.
 * Hides native spinners via CSS. Respects min/max/step attributes.
 *
 * @attr {string} data-stepper - Enable stepper enhancement
 *
 * @example
 * <input type="number" min="0" max="50" step="1" value="0" data-stepper>
 */

const SELECTOR = 'input[type="number"][data-stepper]';

const MINUS_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
const PLUS_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;

function enhanceNumber(input) {
  if (input.hasAttribute('data-stepper-init')) return;
  input.setAttribute('data-stepper-init', '');

  const wrapper = document.createElement('div');
  wrapper.className = 'number-wrapper';
  input.parentNode.insertBefore(wrapper, input);

  const decBtn = document.createElement('button');
  decBtn.type = 'button';
  decBtn.className = 'number-dec';
  decBtn.innerHTML = MINUS_SVG;
  decBtn.setAttribute('aria-label', 'Decrease');
  decBtn.tabIndex = -1;

  const incBtn = document.createElement('button');
  incBtn.type = 'button';
  incBtn.className = 'number-inc';
  incBtn.innerHTML = PLUS_SVG;
  incBtn.setAttribute('aria-label', 'Increase');
  incBtn.tabIndex = -1;

  wrapper.appendChild(decBtn);
  wrapper.appendChild(input);
  wrapper.appendChild(incBtn);

  function step(direction) {
    const min = input.min !== '' ? parseFloat(input.min) : -Infinity;
    const max = input.max !== '' ? parseFloat(input.max) : Infinity;
    const stepVal = parseFloat(input.step) || 1;
    const current = parseFloat(input.value) || 0;
    const decimals = (stepVal.toString().split('.')[1] || '').length;
    const next = parseFloat((current + stepVal * direction).toFixed(decimals));
    const clamped = Math.min(Math.max(next, min), max);
    input.value = clamped;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    updateButtons();
  }

  function updateButtons() {
    const min = input.min !== '' ? parseFloat(input.min) : -Infinity;
    const max = input.max !== '' ? parseFloat(input.max) : Infinity;
    const val = parseFloat(input.value) || 0;
    decBtn.disabled = val <= min;
    incBtn.disabled = val >= max;
  }

  decBtn.addEventListener('click', () => step(-1));
  incBtn.addEventListener('click', () => step(1));
  input.addEventListener('input', updateButtons);
  updateButtons();
}

function initNumberSteppers(root = document) {
  root.querySelectorAll(SELECTOR).forEach(enhanceNumber);
}

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initNumberSteppers());
} else {
  initNumberSteppers();
}

// Watch for dynamically added elements
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      if (node.matches?.(SELECTOR)) enhanceNumber(node);
      node.querySelectorAll?.(SELECTOR).forEach(enhanceNumber);
    }
  }
});

observer.observe(document.documentElement, { childList: true, subtree: true });

export { initNumberSteppers };
