/**
 * form-field-enhancements.js
 *
 * Auto-enhances form-field elements with:
 * - Password show/hide toggle
 * - OTP/PIN multi-input display
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
 * Enhance a form-field containing an OTP/PIN input with multi-box UI
 */
function enhanceOtpField(formField) {
  const input = formField.querySelector('input[data-type="otp"], input[data-type="pin"]');
  if (!input || formField.dataset.enhanced === 'otp') return;

  // Mark as enhanced to prevent double-processing
  formField.dataset.enhanced = 'otp';

  const length = parseInt(input.dataset.length || '6', 10);

  // Hide the original input but keep it for form submission
  input.type = 'hidden';
  input.removeAttribute('inputmode');
  input.removeAttribute('pattern');

  // Create wrapper for digit inputs
  const wrapper = document.createElement('div');
  wrapper.className = 'otp-wrapper';

  // Insert wrapper after hidden input
  input.parentNode.insertBefore(wrapper, input.nextSibling);

  const digitInputs = [];

  // Create individual digit inputs
  for (let i = 0; i < length; i++) {
    const digit = document.createElement('input');
    digit.type = 'text';
    digit.inputMode = 'numeric';
    digit.maxLength = 1;
    digit.pattern = '[0-9]';
    digit.className = 'otp-digit';
    digit.setAttribute('aria-label', `Digit ${i + 1} of ${length}`);
    digitInputs.push(digit);
    wrapper.appendChild(digit);
  }

  // Update hidden input value
  function updateHiddenInput() {
    input.value = digitInputs.map(d => d.value).join('');
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  // Setup event listeners
  digitInputs.forEach((digit, index) => {
    // Handle input
    digit.addEventListener('input', (e) => {
      const value = e.target.value;

      // Only allow digits
      if (value && !/^\d$/.test(value)) {
        e.target.value = '';
        return;
      }

      // Move to next input on digit entry
      if (value && index < digitInputs.length - 1) {
        digitInputs[index + 1].focus();
      }

      updateHiddenInput();
    });

    // Handle keydown
    digit.addEventListener('keydown', (e) => {
      // Move to previous input on backspace when empty
      if (e.key === 'Backspace' && !e.target.value && index > 0) {
        digitInputs[index - 1].focus();
      }

      // Arrow key navigation
      if (e.key === 'ArrowLeft' && index > 0) {
        e.preventDefault();
        digitInputs[index - 1].focus();
      }
      if (e.key === 'ArrowRight' && index < digitInputs.length - 1) {
        e.preventDefault();
        digitInputs[index + 1].focus();
      }
    });

    // Handle paste
    digit.addEventListener('paste', (e) => {
      e.preventDefault();
      const paste = (e.clipboardData || window.clipboardData).getData('text');
      const digits = paste.replace(/\D/g, '').slice(0, length).split('');

      digits.forEach((d, i) => {
        if (digitInputs[i]) {
          digitInputs[i].value = d;
        }
      });

      // Focus the next empty input or the last one
      const nextEmpty = digitInputs.findIndex(inp => !inp.value);
      if (nextEmpty !== -1) {
        digitInputs[nextEmpty].focus();
      } else if (digits.length > 0) {
        digitInputs[Math.min(digits.length - 1, length - 1)].focus();
      }

      updateHiddenInput();
    });

    // Select all on focus for easy replacement
    digit.addEventListener('focus', () => {
      digit.select();
    });
  });

  // Focus first digit when clicking the form-field
  formField.addEventListener('click', (e) => {
    if (e.target === formField) {
      digitInputs[0].focus();
    }
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
 * Find and enhance all OTP/PIN form-fields
 */
function enhanceAllOtpFields() {
  const fields = document.querySelectorAll('form-field:has(input[data-type="otp"]), form-field:has(input[data-type="pin"])');
  fields.forEach(enhanceOtpField);
}

/**
 * Initialize form-field enhancements
 */
export function initFormFieldEnhancements() {
  // Enhance existing fields
  enhanceAllPasswordFields();
  enhanceAllOtpFields();

  // Observe for dynamically added form-fields
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;

        // Check if the added node is a form-field with password
        if (node.matches?.('form-field:has(input[type="password"])')) {
          enhancePasswordField(node);
        }

        // Check if the added node is a form-field with OTP/PIN
        if (node.matches?.('form-field:has(input[data-type="otp"])') ||
            node.matches?.('form-field:has(input[data-type="pin"])')) {
          enhanceOtpField(node);
        }

        // Check children for password fields
        const passwordChildren = node.querySelectorAll?.('form-field:has(input[type="password"])');
        passwordChildren?.forEach(enhancePasswordField);

        // Check children for OTP/PIN fields
        const otpChildren = node.querySelectorAll?.('form-field:has(input[data-type="otp"]), form-field:has(input[data-type="pin"])');
        otpChildren?.forEach(enhanceOtpField);
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}
