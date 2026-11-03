/**
 * form-field-enhancements.js
 *
 * Auto-enhances form-field elements with:
 * - Password show/hide toggle
 * - OTP/PIN multi-input display
 * - Password strength meter + rules checklist (input[data-strength])
 *
 * Every enhancer is idempotent per feature (moving a field re-runs them).
 * Text is localizable with data-label-* on the form-field: show-password,
 * hide-password, digit ("Digit {n} of {total}"), incomplete ("Enter all
 * {total} digits"), strength, strength-weak|fair|good|strong, requirements,
 * rule-length ("At least {n} characters"), rule-uppercase, rule-lowercase,
 * rule-number, rule-special.
 *
 * This module initializes on DOMContentLoaded and observes for
 * dynamically added form-fields.
 */

const EYE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>`;

const EYE_OFF_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/><path d="m2 2 20 20"/></svg>`;

/*
 * Each feature has its own registry: a field can carry both the password
 * toggle and the strength meter, and the MutationObserver re-runs every
 * enhancer when a field is moved. The DOM checks catch clones (which copy
 * the built markup but not the WeakSet membership).
 */
const ENHANCED = {
  password: new WeakSet(),
  otp: new WeakSet(),
  strength: new WeakSet(),
};

let otpSeq = 0;

/**
 * Localizable label: data-label-<key> on the form-field, else the default.
 * @param {Element} formField
 * @param {string} key
 * @param {string} fallback
 */
function labelFor(formField, key, fallback) {
  return formField.getAttribute(`data-label-${key}`) ?? fallback;
}

/**
 * Enhance a form-field containing a password input with a show/hide toggle
 */
function enhancePasswordField(formField) {
  const input = formField.querySelector('input[type="password"]');
  if (!input || ENHANCED.password.has(formField)) return;
  if (input.closest('.password-wrapper') || formField.querySelector('.password-toggle')) return;
  ENHANCED.password.add(formField);

  const showLabel = labelFor(formField, 'show-password', 'Show password');
  const hideLabel = labelFor(formField, 'hide-password', 'Hide password');

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
  toggle.setAttribute('aria-label', showLabel);
  toggle.setAttribute('aria-pressed', 'false');
  toggle.innerHTML = EYE_ICON;
  wrapper.appendChild(toggle);

  // Toggle functionality
  toggle.addEventListener('click', () => {
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    toggle.setAttribute('aria-pressed', String(isPassword));
    toggle.setAttribute('aria-label', isPassword ? hideLabel : showLabel);
    toggle.innerHTML = isPassword ? EYE_OFF_ICON : EYE_ICON;
  });
}

/**
 * Enhance a form-field containing an OTP/PIN input with multi-box UI.
 *
 * The source input stays a real text input — visually hidden, out of the
 * tab order and the accessibility tree — so it still submits the code and
 * enforces required + length (pattern) through native constraint
 * validation. The digits sit in a role="group" named by the field's label
 * and described by its hints; autocomplete="one-time-code" moves to the
 * first digit, which also accepts a whole pasted/autofilled code.
 */
function enhanceOtpField(formField) {
  const found = /** @type {HTMLInputElement | null} */ (
    formField.querySelector('input[data-type="otp"], input[data-type="pin"]'));
  if (!found || ENHANCED.otp.has(formField) || formField.querySelector('.otp-wrapper')) return;
  const input = found;
  ENHANCED.otp.add(formField);
  formField.setAttribute('data-otp-ready', '');

  const length = Math.max(1, parseInt(input.dataset.length || '6', 10) || 6);
  const uid = input.id || `otp-${++otpSeq}`;

  // Source input: validatable but hidden
  input.classList.add('otp-source');
  input.tabIndex = -1;
  input.setAttribute('aria-hidden', 'true');
  if (!input.hasAttribute('pattern')) input.pattern = `\\d{${length}}`;
  input.maxLength = length;
  const autocomplete = input.getAttribute('autocomplete')
    || (input.dataset.type === 'otp' ? 'one-time-code' : 'off');
  input.setAttribute('autocomplete', 'off');
  if (!input.hasAttribute('data-message-patternmismatch')) {
    input.setAttribute('data-message-patternmismatch',
      labelFor(formField, 'incomplete', 'Enter all {total} digits').replace('{total}', String(length)));
  }

  // Group semantics: label names it, hints describe it
  const label = (input.id && formField.querySelector(`label[for="${CSS.escape(input.id)}"]`))
    || formField.querySelector('label');
  const wrapper = document.createElement('div');
  wrapper.className = 'otp-wrapper';
  wrapper.setAttribute('role', 'group');
  if (label) {
    if (!label.id) label.id = `${uid}-label`;
    wrapper.setAttribute('aria-labelledby', label.id);
  }
  const hintIds = [...formField.querySelectorAll('output.hint')].map((hint, i) => {
    if (!hint.id) hint.id = `${uid}-hint${i ? `-${i}` : ''}`;
    return hint.id;
  });
  const described = [...new Set([...(input.getAttribute('aria-describedby') ?? '').split(/\s+/), ...hintIds])]
    .filter(Boolean);
  if (described.length) wrapper.setAttribute('aria-describedby', described.join(' '));

  // Insert wrapper after the source input
  input.after(wrapper);

  const digitLabel = labelFor(formField, 'digit', 'Digit {n} of {total}');
  /** @type {HTMLInputElement[]} */
  const digitInputs = [];

  // Create individual digit inputs
  for (let i = 0; i < length; i++) {
    const digit = document.createElement('input');
    digit.type = 'text';
    digit.inputMode = 'numeric';
    digit.pattern = '[0-9]';
    digit.className = 'otp-digit';
    digit.setAttribute('autocomplete', i === 0 ? autocomplete : 'off');
    digit.setAttribute('aria-label',
      digitLabel.replace('{n}', String(i + 1)).replace('{total}', String(length)));
    digitInputs.push(digit);
    wrapper.appendChild(digit);
  }

  // Seed from an existing value
  const initial = input.value.replace(/\D/g, '').slice(0, length);
  [...initial].forEach((d, i) => { digitInputs[i].value = d; });

  // Update source input value
  function updateSourceInput() {
    input.value = digitInputs.map(d => d.value).join('');
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  /** Spread a run of digits from `start` (paste, autofill, fast typing). */
  function fill(start, text) {
    const digits = text.replace(/\D/g, '').slice(0, length - start).split('');
    digits.forEach((d, i) => { digitInputs[start + i].value = d; });
    const nextEmpty = digitInputs.findIndex(inp => !inp.value);
    if (nextEmpty !== -1) digitInputs[nextEmpty].focus();
    else digitInputs[Math.min(start + Math.max(digits.length, 1) - 1, length - 1)].focus();
    updateSourceInput();
  }

  // Setup event listeners
  digitInputs.forEach((digit, index) => {
    digit.addEventListener('input', () => {
      const value = digit.value;
      if (value.length > 1) {
        digit.value = '';
        fill(index, value);
        return;
      }

      // Only allow digits
      if (value && !/^\d$/.test(value)) {
        digit.value = '';
        return;
      }

      // Move to next input on digit entry
      if (value && index < digitInputs.length - 1) {
        digitInputs[index + 1].focus();
      }

      updateSourceInput();
    });

    digit.addEventListener('keydown', (e) => {
      // Move to previous input on backspace when empty
      if (e.key === 'Backspace' && !digit.value && index > 0) {
        digitInputs[index - 1].focus();
      }

      // Arrow key navigation (visual order follows the writing direction)
      const rtl = getComputedStyle(wrapper).direction === 'rtl';
      const prevKey = rtl ? 'ArrowRight' : 'ArrowLeft';
      const nextKey = rtl ? 'ArrowLeft' : 'ArrowRight';
      if (e.key === prevKey && index > 0) {
        e.preventDefault();
        digitInputs[index - 1].focus();
      }
      if (e.key === nextKey && index < digitInputs.length - 1) {
        e.preventDefault();
        digitInputs[index + 1].focus();
      }
    });

    digit.addEventListener('paste', (e) => {
      e.preventDefault();
      const paste = (e.clipboardData || /** @type {any} */ (window).clipboardData)?.getData('text') ?? '';
      fill(0, paste);
    });

    // Select all on focus for easy replacement
    digit.addEventListener('focus', () => {
      digit.select();
    });
  });

  // Label clicks, form-level "focus first invalid" and reportValidity land
  // on the hidden source input: hand focus to the first empty digit.
  input.addEventListener('focus', () => {
    (digitInputs.find(d => !d.value) ?? digitInputs[length - 1]).focus();
  });

  // Form reset restores the source value; mirror it into the digits
  input.form?.addEventListener('reset', () => {
    queueMicrotask(() => {
      const v = input.value.replace(/\D/g, '');
      digitInputs.forEach((d, i) => { d.value = v[i] ?? ''; });
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
  if (!input || ENHANCED.strength.has(formField) || formField.querySelector('.strength-meter')) return;
  ENHANCED.strength.add(formField);

  const rulesStr = input.dataset.rules || 'length:8';
  const rules = parseRules(rulesStr, formField);
  const levels = {
    weak: labelFor(formField, 'strength-weak', 'Weak'),
    fair: labelFor(formField, 'strength-fair', 'Fair'),
    good: labelFor(formField, 'strength-good', 'Good'),
    strong: labelFor(formField, 'strength-strong', 'Strong'),
  };

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
  meter.setAttribute('aria-label', labelFor(formField, 'strength', 'Password strength'));

  const label = document.createElement('span');
  label.className = 'strength-label';
  label.textContent = '';

  meterWrap.appendChild(meter);
  meterWrap.appendChild(label);

  // Create rules checklist
  const checklist = document.createElement('ul');
  checklist.className = 'strength-rules';
  checklist.setAttribute('aria-label', labelFor(formField, 'requirements', 'Password requirements'));

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
      const li = /** @type {HTMLElement} */ (checklist.children[i]);
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
    const level = value.length === 0 ? ''
      : ratio < 0.4 ? 'weak'
      : ratio < 0.75 ? 'fair'
      : ratio < 1 ? 'good'
      : 'strong';
    label.textContent = level ? levels[level] : '';
    meterWrap.dataset.level = level;
  });
}

/**
 * Parse rules string into structured rules
 * @param {string} str - e.g. "length:8,uppercase,lowercase,number,special"
 * @param {Element} formField - source of data-label-rule-* overrides
 * @returns {Array<{type: string, param?: number, label: string}>}
 */
function parseRules(str, formField) {
  return str.split(',').map(r => {
    const [type, param] = r.trim().split(':');
    switch (type) {
      case 'length': {
        const n = parseInt(param) || 8;
        return { type, param: n, label: labelFor(formField, 'rule-length', 'At least {n} characters').replace('{n}', String(n)) };
      }
      case 'uppercase': return { type, label: labelFor(formField, 'rule-uppercase', 'One uppercase letter') };
      case 'lowercase': return { type, label: labelFor(formField, 'rule-lowercase', 'One lowercase letter') };
      case 'number': return { type, label: labelFor(formField, 'rule-number', 'One number') };
      case 'special': return { type, label: labelFor(formField, 'rule-special', 'One special character') };
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

        const el = /** @type {Element} */ (node);

        // Check if the added node is a form-field with password
        if (el.matches?.('form-field:has(input[type="password"])')) {
          enhancePasswordField(el);
        }

        // Check if the added node is a form-field with OTP/PIN
        if (el.matches?.('form-field:has(input[data-type="otp"])') ||
            el.matches?.('form-field:has(input[data-type="pin"])')) {
          enhanceOtpField(el);
        }

        // Check if the added node is a form-field with strength
        if (el.matches?.('form-field:has(input[data-strength])')) {
          enhancePasswordStrength(el);
        }

        // Check children for password fields
        const passwordChildren = el.querySelectorAll?.('form-field:has(input[type="password"])');
        passwordChildren?.forEach(enhancePasswordField);

        // Check children for OTP/PIN fields
        const otpChildren = el.querySelectorAll?.('form-field:has(input[data-type="otp"]), form-field:has(input[data-type="pin"])');
        otpChildren?.forEach(enhanceOtpField);

        // Check children for strength fields
        const strengthChildren = el.querySelectorAll?.('form-field:has(input[data-strength])');
        strengthChildren?.forEach(enhancePasswordStrength);
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}
