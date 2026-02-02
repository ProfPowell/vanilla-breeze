/**
 * Form Validation Utilities
 *
 * Suppresses browser's default validation bubble UI while preserving
 * the Constraint Validation API for CSS :user-valid/:user-invalid styling.
 */

/**
 * Suppress browser validation bubbles on a form or globally.
 * The CSS validation (border colors, error messages) still works because
 * :user-valid/:user-invalid are based on the Constraint Validation API.
 *
 * @param {HTMLFormElement|Document} target - Form element or document for global
 */
export function suppressValidationBubble(target = document) {
  target.addEventListener('invalid', (event) => {
    // Prevent the browser's default validation bubble
    event.preventDefault();
  }, true); // Use capture phase to intercept before bubbling
}

/**
 * Initialize form validation behavior globally.
 * Call this once on page load.
 */
export function initFormValidation() {
  suppressValidationBubble(document);
}
