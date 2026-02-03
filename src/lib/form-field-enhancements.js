/**
 * form-field-enhancements.js
 *
 * Auto-enhances form-field elements with:
 * - Password show/hide toggle
 *
 * This module initializes on DOMContentLoaded and observes for
 * dynamically added form-fields.
 */

const EYE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>`;

const EYE_OFF_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/><path d="m2 2 20 20"/></svg>`;

/**
 * Enhance a form-field containing a password input with a show/hide toggle
 */
function enhancePasswordField(formField) {
  const input = formField.querySelector('input[type="password"]');
  if (!input || formField.dataset.enhanced === 'password') return;

  // Mark as enhanced to prevent double-processing
  formField.dataset.enhanced = 'password';

  // Create wrapper for input + toggle
  const wrapper = document.createElement('div');
  wrapper.className = 'password-wrapper';

  // Move input into wrapper
  input.parentNode.insertBefore(wrapper, input);
  wrapper.appendChild(input);

  // Create toggle button
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'password-toggle';
  toggle.setAttribute('aria-label', 'Show password');
  toggle.setAttribute('aria-pressed', 'false');
  toggle.innerHTML = EYE_ICON;
  wrapper.appendChild(toggle);

  // Toggle functionality
  toggle.addEventListener('click', () => {
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    toggle.setAttribute('aria-pressed', String(isPassword));
    toggle.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
    toggle.innerHTML = isPassword ? EYE_OFF_ICON : EYE_ICON;
  });
}

/**
 * Find and enhance all password form-fields
 */
function enhanceAllPasswordFields() {
  const fields = document.querySelectorAll('form-field:has(input[type="password"])');
  fields.forEach(enhancePasswordField);
}

/**
 * Initialize form-field enhancements
 */
export function initFormFieldEnhancements() {
  // Enhance existing fields
  enhanceAllPasswordFields();

  // Observe for dynamically added form-fields
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;

        // Check if the added node is a form-field with password
        if (node.matches?.('form-field:has(input[type="password"])')) {
          enhancePasswordField(node);
        }

        // Check children
        const children = node.querySelectorAll?.('form-field:has(input[type="password"])');
        children?.forEach(enhancePasswordField);
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}
