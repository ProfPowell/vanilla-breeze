/**
 * range-init: Range slider with value bubble and datalist labels
 *
 * Shows a floating bubble with the current value as the user drags.
 * Renders datalist option labels as tick marks below the slider.
 *
 * @attr {string} data-range - Enable range enhancement
 * @attr {string} data-bubble - Show floating value bubble
 * @attr {string} data-prefix - Value prefix (e.g., "$")
 * @attr {string} data-suffix - Value suffix (e.g., "%")
 * @attr {string} data-markers - Show tick marks at each step
 *
 * @example
 * <input type="range" min="0" max="100" data-range data-bubble>
 *
 * @example With datalist labels
 * <input type="range" min="0" max="1000" step="100" list="prices" data-range data-bubble data-prefix="$">
 * <datalist id="prices">
 *   <option value="0" label="$0">
 *   <option value="500" label="$500">
 *   <option value="1000" label="$1000">
 * </datalist>
 */

const SELECTOR = 'input[type="range"][data-range]';

/**
 * Enhance a range input
 * @param {HTMLInputElement} input
 */
function enhanceRange(input) {
  if (input.hasAttribute('data-range-init')) return;
  input.setAttribute('data-range-init', '');

  const prefix = input.dataset.prefix || '';
  const suffix = input.dataset.suffix || '';
  const showBubble = input.hasAttribute('data-bubble');

  // Create wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'range-wrapper';
  input.parentNode.insertBefore(wrapper, input);
  wrapper.appendChild(input);

  // Update CSS custom property for track fill
  function updateTrackFill() {
    const min = parseFloat(input.min) || 0;
    const max = parseFloat(input.max) || 100;
    const val = parseFloat(input.value);
    const pct = ((val - min) / (max - min)) * 100;
    wrapper.style.setProperty('--range-pct', `${pct}%`);
  }

  // Value bubble
  let bubble;
  if (showBubble) {
    bubble = document.createElement('output');
    bubble.className = 'range-bubble';
    bubble.setAttribute('for', input.id || '');
    wrapper.appendChild(bubble);
  }

  function updateBubble() {
    if (!bubble) return;
    bubble.textContent = `${prefix}${input.value}${suffix}`;
    const min = parseFloat(input.min) || 0;
    const max = parseFloat(input.max) || 100;
    const pct = ((parseFloat(input.value) - min) / (max - min)) * 100;
    bubble.style.insetInlineStart = `${pct}%`;
  }

  // Tick markers
  if (input.hasAttribute('data-markers')) {
    const min = parseFloat(input.min) || 0;
    const max = parseFloat(input.max) || 100;
    const step = parseFloat(input.step) || 1;
    const markers = document.createElement('div');
    markers.className = 'range-markers';
    const count = Math.round((max - min) / step);
    for (let i = 0; i <= count; i++) {
      markers.appendChild(document.createElement('span'));
    }
    wrapper.appendChild(markers);
  }

  // Datalist labels
  const listId = input.getAttribute('list');
  if (listId) {
    const datalist = document.getElementById(listId);
    if (datalist) {
      const labels = document.createElement('div');
      labels.className = 'range-labels';
      const min = parseFloat(input.min) || 0;
      const max = parseFloat(input.max) || 100;

      Array.from(datalist.options).forEach(option => {
        const span = document.createElement('span');
        span.textContent = option.label || option.value;
        const pct = ((parseFloat(option.value) - min) / (max - min)) * 100;
        span.style.insetInlineStart = `${pct}%`;
        labels.appendChild(span);
      });

      wrapper.appendChild(labels);
    }
  }

  function update() {
    updateTrackFill();
    updateBubble();
  }

  input.addEventListener('input', update);
  update();
}

/**
 * Initialize range enhancements within a root
 * @param {Element|Document} root
 */
function initRangeSliders(root = document) {
  root.querySelectorAll(SELECTOR).forEach(enhanceRange);
}

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initRangeSliders());
} else {
  initRangeSliders();
}

// Watch for dynamically added ranges
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      if (node.matches?.(SELECTOR)) enhanceRange(node);
      node.querySelectorAll?.(SELECTOR).forEach(enhanceRange);
    }
  }
});

observer.observe(document.documentElement, { childList: true, subtree: true });

export { initRangeSliders };
