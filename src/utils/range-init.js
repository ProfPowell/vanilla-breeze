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

import { registerInit } from './_init-registry.js';

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
  if (!input.parentNode) return;
  input.parentNode.insertBefore(wrapper, input);
  wrapper.appendChild(input);

  // Track fill and bubble position are pure CSS driven by these two custom
  // properties: --range-pct for the gradient, --range-frac (0–1) for the
  // bubble. Nothing is measured, so the result never depends on when layout,
  // theme stylesheets or fonts settle (vanilla-breeze-tn0j).
  function updateTrackFill() {
    const min = parseFloat(input.min) || 0;
    const max = parseFloat(input.max) || 100;
    const frac = (parseFloat(input.value) - min) / (max - min);
    wrapper.style.setProperty('--range-pct', `${frac * 100}%`);
    wrapper.style.setProperty('--range-frac', String(frac));
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

      // Positioned in CSS from --range-frac, like the bubble: no layout
      // read, so labels are placed synchronously and track resizes.
      Array.from(/** @type {HTMLDataListElement} */ (datalist).options).forEach(option => {
        const span = document.createElement('span');
        span.textContent = option.label || option.value;
        span.style.setProperty('--range-frac', String((parseFloat(option.value) - min) / (max - min)));
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

registerInit(SELECTOR, enhanceRange);

export { initRangeSliders };
