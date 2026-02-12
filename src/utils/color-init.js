/**
 * color-init: Enhanced color input with swatch and hex display
 *
 * Wraps input[type="color"][data-color] with a styled button showing
 * a color swatch circle and hex code. Clicking opens the native picker.
 *
 * @attr {string} data-color - Enable enhanced color display
 *
 * @example
 * <input type="color" value="#6366f1" data-color>
 */

const SELECTOR = 'input[type="color"][data-color]';

function enhanceColor(input) {
  if (input.hasAttribute('data-color-init')) return;
  input.setAttribute('data-color-init', '');

  const wrapper = document.createElement('div');
  wrapper.className = 'color-wrapper';
  input.parentNode.insertBefore(wrapper, input);

  // Hide native input but keep it in DOM for the picker
  wrapper.appendChild(input);

  const display = document.createElement('button');
  display.type = 'button';
  display.className = 'color-display';

  const swatch = document.createElement('span');
  swatch.className = 'color-swatch';

  const hex = document.createElement('span');
  hex.className = 'color-hex';

  display.appendChild(swatch);
  display.appendChild(hex);
  wrapper.appendChild(display);

  function update() {
    swatch.style.background = input.value;
    hex.textContent = input.value;
  }

  display.addEventListener('click', () => input.click());
  input.addEventListener('input', update);
  update();
}

function initColorInputs(root = document) {
  root.querySelectorAll(SELECTOR).forEach(enhanceColor);
}

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initColorInputs());
} else {
  initColorInputs();
}

// Watch for dynamically added elements
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      if (node.matches?.(SELECTOR)) enhanceColor(node);
      node.querySelectorAll?.(SELECTOR).forEach(enhanceColor);
    }
  }
});

observer.observe(document.documentElement, { childList: true, subtree: true });

export { initColorInputs };
