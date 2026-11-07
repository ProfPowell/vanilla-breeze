/**
 * range-init: Range slider with value bubble and datalist labels
 *
 * Shows a floating bubble with the current value as the user drags.
 * Renders datalist option labels as tick marks below the slider.
 *
 * The bubble, markers and label row are visual only (aria-hidden). What a
 * screen reader hears comes from aria-valuetext on the input: the matching
 * datalist label, else prefix + locale-formatted value + suffix.
 *
 * @attr {string} data-range - Enable range enhancement
 * @attr {string} data-bubble - Show floating value bubble
 * @attr {string} data-prefix - Value prefix (e.g., "$"), used in bubble and aria-valuetext
 * @attr {string} data-suffix - Value suffix (e.g., "%"), used in bubble and aria-valuetext
 * @attr {string} data-markers - Show tick marks at each step (skipped above 100 steps)
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

import { registerInit, onFormReset } from './_init-registry.js';
import { getLocale } from '../lib/i18n.js';

const SELECTOR = 'input[type="range"][data-range]';

/** Above this many steps data-markers draws nothing (a 0–1000 step-1 slider would be 1001 spans). */
const MAX_MARKERS = 100;

/** @type {WeakSet<HTMLInputElement>} */
const wired = new WeakSet();

/**
 * Parse a numeric attribute, falling back only when it is absent or not a
 * number — `max="0"` is a real maximum (ranges like -100..0).
 * @param {string} raw
 * @param {number} fallback
 */
function num(raw, fallback) {
  if (raw === '' || raw == null) return fallback;
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : fallback;
}

/** @param {HTMLInputElement} input */
function bounds(input) {
  const min = num(input.min, 0);
  let max = num(input.max, 100);
  if (max < min) max = min; // HTML: a max below min clamps to min
  return { min, max };
}

/** Fraction 0–1 of `value` across the input's range. */
function fraction(value, min, max) {
  if (max === min) return 0;
  return Math.min(1, Math.max(0, (value - min) / (max - min)));
}

/** Decimal places a step or value needs, so 0.5 steps show "2.5" not "3". */
function decimals(str) {
  const s = String(str);
  const i = s.indexOf('.');
  return i === -1 ? 0 : s.length - i - 1;
}

/**
 * Enhance a range input
 * @param {HTMLInputElement} input
 */
function enhanceRange(input) {
  if (wired.has(input) || !input.parentNode) return;
  wired.add(input);
  input.setAttribute('data-range-init', '');

  const showBubble = input.hasAttribute('data-bubble');

  // Reuse a wrapper copied along with the input (cloneNode of an enhanced
  // slider), dropping its stale generated parts; otherwise create one.
  let wrapper = /** @type {HTMLElement} */ (input.parentElement);
  if (wrapper?.classList.contains('range-wrapper')) {
    wrapper.querySelectorAll(':scope > .range-bubble, :scope > .range-markers, :scope > .range-labels')
      .forEach((n) => n.remove());
  } else {
    wrapper = document.createElement('div');
    wrapper.className = 'range-wrapper';
    input.parentNode.insertBefore(wrapper, input);
    wrapper.appendChild(input);
  }

  // Authored aria-valuetext wins; only manage the one we write.
  const ownValuetext = !input.hasAttribute('aria-valuetext');

  // Value bubble — visual only; aria-valuetext carries the same text, so an
  // exposed <output> (implicit role=status) would announce it twice.
  /** @type {HTMLOutputElement|undefined} */
  let bubble;
  if (showBubble) {
    bubble = document.createElement('output');
    bubble.className = 'range-bubble';
    bubble.setAttribute('aria-hidden', 'true');
    if (input.id) bubble.htmlFor.add(input.id);
    wrapper.appendChild(bubble);
  }

  // Tick markers
  if (input.hasAttribute('data-markers')) {
    const { min, max } = bounds(input);
    const step = num(input.step, 1) || 1;
    const count = Math.round((max - min) / step);
    if (count > 0 && count <= MAX_MARKERS) {
      const markers = document.createElement('div');
      markers.className = 'range-markers';
      markers.setAttribute('aria-hidden', 'true');
      for (let i = 0; i <= count; i++) {
        markers.appendChild(document.createElement('span'));
      }
      wrapper.appendChild(markers);
    }
  }

  // Datalist labels — sighted-only echo of the options; the matching label
  // reaches screen readers through aria-valuetext instead.
  const listId = input.getAttribute('list');
  const datalist = listId ? document.getElementById(listId) : null;
  if (datalist instanceof HTMLDataListElement) {
    const labels = document.createElement('div');
    labels.className = 'range-labels';
    labels.setAttribute('aria-hidden', 'true');
    const { min, max } = bounds(input);

    // Positioned in CSS from --range-frac, like the bubble: no layout
    // read, so labels are placed synchronously and track resizes.
    Array.from(datalist.options).forEach((option) => {
      const span = document.createElement('span');
      span.textContent = option.label || option.value;
      span.style.setProperty('--range-frac', String(fraction(parseFloat(option.value), min, max)));
      labels.appendChild(span);
    });

    wrapper.appendChild(labels);
  }

  /** Text for the current value: datalist label, else prefix + Intl number + suffix. */
  function valueText() {
    const value = input.value;
    if (datalist instanceof HTMLDataListElement) {
      const match = Array.from(datalist.options).find(
        (o) => o.label && parseFloat(o.value) === parseFloat(value));
      if (match) return match.label;
    }
    const prefix = input.dataset.prefix || '';
    const suffix = input.dataset.suffix || '';
    const digits = Math.max(decimals(input.step === 'any' ? '' : input.step), decimals(value));
    let formatted = value;
    try {
      formatted = new Intl.NumberFormat(getLocale(input), {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      }).format(parseFloat(value));
    } catch { /* invalid locale — keep the raw value */ }
    return `${prefix}${formatted}${suffix}`;
  }

  // Track fill and bubble position are pure CSS driven by these two custom
  // properties: --range-pct for the gradient, --range-frac (0–1) for the
  // bubble. Nothing is measured, so the result never depends on when layout,
  // theme stylesheets or fonts settle (vanilla-breeze-tn0j).
  function update() {
    const { min, max } = bounds(input);
    const frac = fraction(parseFloat(input.value), min, max);
    wrapper.style.setProperty('--range-pct', `${frac * 100}%`);
    wrapper.style.setProperty('--range-frac', String(frac));

    const text = valueText();
    if (bubble) bubble.textContent = text;
    if (ownValuetext) {
      if (text !== input.value) input.setAttribute('aria-valuetext', text);
      else input.removeAttribute('aria-valuetext');
    }
  }

  input.addEventListener('input', update);
  // `change` covers scripts that set .value and dispatch change; a form
  // reset restores the default without firing either.
  input.addEventListener('change', update);
  onFormReset(input, update);
  update();
}

/**
 * Initialize range enhancements within a root
 * @param {Element|Document} root
 */
function initRangeSliders(root = document) {
  root.querySelectorAll(SELECTOR).forEach((el) => enhanceRange(/** @type {HTMLInputElement} */ (el)));
}

registerInit(SELECTOR, enhanceRange);

export { initRangeSliders };
