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
 * Enhance a form-field with password strength indicator and rules checklist
 */
function enhancePasswordStrength(formField) {
  const input = formField.querySelector('input[data-strength]');
  if (!input || formField.dataset.enhanced === 'strength') return;

  formField.dataset.enhanced = 'strength';

  const rulesStr = input.dataset.rules || 'length:8';
  const rules = parseRules(rulesStr);

  // Create strength meter (native <meter> inherits VB meter CSS)
  const meterWrap = document.createElement('div');
  meterWrap.className = 'strength-meter';

  const meter = document.createElement('meter');
  meter.min = 0;
  meter.max = rules.length;
  meter.low = Math.ceil(rules.length * 0.4);
  meter.high = Math.ceil(rules.length * 0.75);
  meter.optimum = rules.length;
  meter.value = 0;
  meter.className = 'xs';

  const label = document.createElement('span');
  label.className = 'strength-label';
  label.textContent = '';

  meterWrap.appendChild(meter);
  meterWrap.appendChild(label);

  // Create rules checklist
  const checklist = document.createElement('ul');
  checklist.className = 'strength-rules';
  checklist.setAttribute('aria-label', 'Password requirements');

  rules.forEach(rule => {
    const li = document.createElement('li');
    li.dataset.rule = rule.type;
    li.textContent = rule.label;
    checklist.appendChild(li);
  });

  // Insert after password wrapper or input
  const wrapper = formField.querySelector('.password-wrapper') || input;
  wrapper.insertAdjacentElement('afterend', meterWrap);
  meterWrap.insertAdjacentElement('afterend', checklist);

  // Evaluate on input
  input.addEventListener('input', () => {
    const value = input.value;
    let passed = 0;

    rules.forEach((rule, i) => {
      const met = evaluateRule(rule, value);
      const li = checklist.children[i];
      li.dataset.met = met ? '' : undefined;
      if (met) {
        li.setAttribute('data-met', '');
        passed++;
      } else {
        li.removeAttribute('data-met');
      }
    });

    meter.value = passed;

    // Strength label
    const ratio = passed / rules.length;
    if (value.length === 0) {
      label.textContent = '';
      meterWrap.dataset.level = '';
    } else if (ratio < 0.4) {
      label.textContent = 'Weak';
      meterWrap.dataset.level = 'weak';
    } else if (ratio < 0.75) {
      label.textContent = 'Fair';
      meterWrap.dataset.level = 'fair';
    } else if (ratio < 1) {
      label.textContent = 'Good';
      meterWrap.dataset.level = 'good';
    } else {
      label.textContent = 'Strong';
      meterWrap.dataset.level = 'strong';
    }
  });
}

/**
 * Parse rules string into structured rules
 * @param {string} str - e.g. "length:8,uppercase,lowercase,number,special"
 * @returns {Array<{type: string, param?: number, label: string}>}
 */
function parseRules(str) {
  return str.split(',').map(r => {
    const [type, param] = r.trim().split(':');
    switch (type) {
      case 'length': return { type, param: parseInt(param) || 8, label: `At least ${param || 8} characters` };
      case 'uppercase': return { type, label: 'One uppercase letter' };
      case 'lowercase': return { type, label: 'One lowercase letter' };
      case 'number': return { type, label: 'One number' };
      case 'special': return { type, label: 'One special character' };
      default: return { type, label: type };
    }
  });
}

/**
 * Evaluate a single rule against a password value
 * @param {{type: string, param?: number}} rule
 * @param {string} value
 * @returns {boolean}
 */
function evaluateRule(rule, value) {
  switch (rule.type) {
    case 'length': return value.length >= (rule.param || 8);
    case 'uppercase': return /[A-Z]/.test(value);
    case 'lowercase': return /[a-z]/.test(value);
    case 'number': return /\d/.test(value);
    case 'special': return /[^A-Za-z0-9]/.test(value);
    default: return false;
  }
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
 * Find and enhance all password strength form-fields
 */
function enhanceAllStrengthFields() {
  const fields = document.querySelectorAll('form-field:has(input[data-strength])');
  fields.forEach(enhancePasswordStrength);
}

/**
 * Initialize form-field enhancements
 */
export function initFormFieldEnhancements() {
  // Enhance existing fields
  enhanceAllPasswordFields();
  enhanceAllOtpFields();
  enhanceAllStrengthFields();

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

        // Check if the added node is a form-field with strength
        if (node.matches?.('form-field:has(input[data-strength])')) {
          enhancePasswordStrength(node);
        }

        // Check children for password fields
        const passwordChildren = node.querySelectorAll?.('form-field:has(input[type="password"])');
        passwordChildren?.forEach(enhancePasswordField);

        // Check children for OTP/PIN fields
        const otpChildren = node.querySelectorAll?.('form-field:has(input[data-type="otp"]), form-field:has(input[data-type="pin"])');
        otpChildren?.forEach(enhanceOtpField);

        // Check children for strength fields
        const strengthChildren = node.querySelectorAll?.('form-field:has(input[data-strength])');
        strengthChildren?.forEach(enhancePasswordStrength);
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}
