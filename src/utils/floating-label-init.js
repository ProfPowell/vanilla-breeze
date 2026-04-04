/**
 * floating-label-init: Upscale placeholder → animated floating label
 *
 * Enhances form-field elements with data-floating-label so the label
 * starts inside the input and animates above on focus or when filled.
 * The animation is CSS-driven via :focus-within and :placeholder-shown.
 * JS only provides the minimal glue: ensures a transparent placeholder
 * exists so the CSS selector works, and marks the field as enhanced.
 *
 * @attr {boolean} data-floating-label - Enable floating label on a form-field
 *
 * @example
 * <form-field data-floating-label>
 *   <label for="email">Email address</label>
 *   <input type="email" id="email">
 * </form-field>
 */

import { registerInit } from './_init-registry.js';

const SELECTOR = 'form-field[data-floating-label]';
const ENHANCED = new WeakSet();

/** Enhance a single form-field[data-floating-label] */
function enhance(field) {
  if (ENHANCED.has(field)) return;
  ENHANCED.add(field);

  const input = field.querySelector('input, textarea, select');
  if (!input) return;

  // Ensure a placeholder exists so :placeholder-shown works in CSS.
  // Use a single space — invisible but activates the pseudo-class.
  if (!input.hasAttribute('placeholder')) {
    input.setAttribute('placeholder', ' ');
  }

  field.setAttribute('data-floating-label-ready', '');
}

registerInit(SELECTOR, enhance);

export { enhance as initFloatingLabels };
