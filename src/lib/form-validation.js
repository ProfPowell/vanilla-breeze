/**
 * Form Validation Utilities
 *
 * Suppresses browser's default validation bubble UI while preserving
 * the Constraint Validation API for CSS :user-valid/:user-invalid styling.
 *
 * When a form has `data-validate`, layers on:
 * - Custom error messages via data-message-* attributes
 * - Cross-field validation via data-match
 * - Checkbox group constraints via data-min-checked / data-max-checked
 * - Error summary via <output class="error-summary">
 * - Submit-time forced validation (triggers :user-invalid on untouched fields)
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

// ── Constraint → data-message-* mapping ──────────────────────────────

const VALIDITY_MAP = [
  ['valueMissing',    'messageRequired'],
  ['typeMismatch',    'messageType'],
  ['tooShort',        'messageMinlength'],
  ['tooLong',         'messageMaxlength'],
  ['rangeUnderflow',  'messageMin'],
  ['rangeOverflow',   'messageMax'],
  ['patternMismatch', 'messagePattern'],
];

// ── Field helpers ────────────────────────────────────────────────────

function getFields(form) {
  return [...form.querySelectorAll('input, select, textarea')]
    .filter(f => f.type !== 'submit' && f.type !== 'button' && f.type !== 'hidden');
}

function getLabelText(field) {
  return field.labels?.[0]?.textContent?.trim()
    ?? field.getAttribute('aria-label')
    ?? field.name
    ?? field.id;
}

/**
 * Find the <output class="error"> associated with a field.
 * First checks aria-describedby for an output with .error,
 * then falls back to the next sibling output.error within form-field.
 */
function findErrorOutput(field) {
  const ids = field.getAttribute('aria-describedby')?.split(/\s+/) ?? [];
  for (const id of ids) {
    const el = document.getElementById(id);
    if (el?.tagName === 'OUTPUT' && el.classList.contains('error')) return el;
  }
  // Fallback: sibling output.error inside form-field
  const formField = field.closest('form-field');
  return formField?.querySelector('output.error') ?? null;
}

// ── Custom message application ───────────────────────────────────────

function applyCustomMessage(field) {
  // Reset custom validity so native checks re-run
  field.setCustomValidity('');

  if (field.validity.valid) {
    updateFieldOutput(field, '');
    return;
  }

  const d = field.dataset;
  let msg = null;

  for (const [prop, key] of VALIDITY_MAP) {
    if (field.validity[prop] && d[key]) {
      msg = d[key];
      break;
    }
  }

  if (msg) field.setCustomValidity(msg);

  updateFieldOutput(field, msg ?? field.validationMessage);
}

function updateFieldOutput(field, message) {
  const output = findErrorOutput(field);
  if (output) output.textContent = message;
}

// ── Cross-field: data-match ──────────────────────────────────────────

function checkMatch(field, form) {
  const targetId = field.dataset.match;
  if (!targetId) return;

  const target = form.querySelector(`#${CSS.escape(targetId)}`)
    ?? form.querySelector(`[name="${CSS.escape(targetId)}"]`);
  if (!target) return;

  field.setCustomValidity('');

  if (field.value && target.value && field.value !== target.value) {
    const msg = field.dataset.messageMatch ?? 'Values do not match';
    field.setCustomValidity(msg);
    updateFieldOutput(field, msg);
  } else if (field.validity.valid) {
    updateFieldOutput(field, '');
  }
}

// ── Checkbox group: data-min-checked / data-max-checked ──────────────

function checkFieldset(fieldset) {
  const boxes = [...fieldset.querySelectorAll('input[type="checkbox"]')];
  const count = boxes.filter(b => b.checked).length;
  const min = parseInt(fieldset.dataset.minChecked ?? '0', 10);
  const max = parseInt(fieldset.dataset.maxChecked ?? '999', 10);
  const output = fieldset.querySelector('output');

  let msg = null;
  if (count < min) msg = fieldset.dataset.messageMinChecked ?? `Select at least ${min}`;
  if (count > max) msg = fieldset.dataset.messageMaxChecked ?? `Select no more than ${max}`;

  if (output) output.textContent = msg ?? '';

  if (msg) {
    fieldset.dataset.invalid = '';
  } else {
    delete fieldset.dataset.invalid;
  }

  return !msg;
}

// ── Error summary ────────────────────────────────────────────────────

function updateSummary(form, summaryOutput) {
  if (!summaryOutput) return;

  const errors = [];

  for (const field of getFields(form)) {
    if (field.validity.valid) continue;
    errors.push({
      id: field.id || field.name,
      label: getLabelText(field),
      message: field.validationMessage,
    });
  }

  // Fieldset group errors
  for (const fs of form.querySelectorAll('fieldset[data-invalid]')) {
    const output = fs.querySelector('output');
    errors.push({
      id: fs.id || '',
      label: fs.querySelector('legend')?.textContent?.trim() ?? 'Group',
      message: output?.textContent || 'Invalid selection',
    });
  }

  if (errors.length === 0) {
    summaryOutput.innerHTML = '';
    return;
  }

  const count = errors.length;
  const links = errors
    .map(e => {
      const href = e.id ? `#${e.id}` : '#';
      return `<li><a href="${href}">${e.label}: ${e.message}</a></li>`;
    })
    .join('\n      ');

  summaryOutput.innerHTML =
    `<p>Please fix ${count} error${count === 1 ? '' : 's'}:</p>\n` +
    `    <ul>\n      ${links}\n    </ul>`;
}

function bindSummaryLinks(summaryOutput) {
  summaryOutput.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    e.preventDefault();
    const id = link.getAttribute('href').slice(1);
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.focus();
    }
  });
}

// ── Force :user-invalid on submit ────────────────────────────────────

function forceUserInvalid(form) {
  for (const field of getFields(form)) {
    // Focus + blur triggers the browser's user-interaction tracking
    // which makes :user-invalid activate for untouched invalid fields
    field.focus({ preventScroll: true });
    field.blur();
  }
}

// ── Form enhancement ─────────────────────────────────────────────────

function enhanceValidatedForm(form) {
  // Suppress browser UI but keep the Constraint Validation API
  form.setAttribute('novalidate', '');

  const mode = form.dataset.validate; // "", "summary", or "both"
  const summaryOutput = form.querySelector('output.error-summary');

  if (summaryOutput) {
    bindSummaryLinks(summaryOutput);
  }

  // Field-level: input/blur for custom messages
  for (const field of getFields(form)) {
    if (hasCustomMessages(field)) {
      field.addEventListener('input', () => applyCustomMessage(field));
      field.addEventListener('blur', () => applyCustomMessage(field));
    }

    if (field.dataset.match) {
      field.addEventListener('input', () => checkMatch(field, form));
      field.addEventListener('blur', () => checkMatch(field, form));

      // Also re-check when the target field changes
      const targetId = field.dataset.match;
      const target = form.querySelector(`#${CSS.escape(targetId)}`)
        ?? form.querySelector(`[name="${CSS.escape(targetId)}"]`);
      if (target) {
        target.addEventListener('input', () => checkMatch(field, form));
      }
    }
  }

  // Fieldset checkbox group constraints
  for (const fs of form.querySelectorAll('fieldset[data-min-checked], fieldset[data-max-checked]')) {
    fs.addEventListener('change', () => {
      checkFieldset(fs);
      if (summaryOutput) updateSummary(form, summaryOutput);
    });
  }

  // Submit handler
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Apply custom messages and cross-field checks
    for (const field of getFields(form)) {
      if (hasCustomMessages(field)) applyCustomMessage(field);
      if (field.dataset.match) checkMatch(field, form);
    }

    // Check fieldsets
    for (const fs of form.querySelectorAll('fieldset[data-min-checked], fieldset[data-max-checked]')) {
      checkFieldset(fs);
    }

    // Force :user-invalid on untouched fields
    forceUserInvalid(form);

    const valid = form.checkValidity()
      && ![...form.querySelectorAll('fieldset[data-invalid]')].length;

    if (valid) {
      // Dispatch custom event — authors handle actual submission
      form.dispatchEvent(new CustomEvent('vb:submit', {
        bubbles: true,
        detail: new FormData(form),
      }));

      // Clear summary
      if (summaryOutput) summaryOutput.innerHTML = '';
    } else {
      // Update and focus summary
      if (summaryOutput && mode !== '') {
        updateSummary(form, summaryOutput);
        summaryOutput.focus();
      }
    }
  });

  // Live clearing: when user fixes errors, update summary
  if (summaryOutput) {
    form.addEventListener('input', () => {
      // Re-check after a tick so validity state has updated
      requestAnimationFrame(() => {
        for (const field of getFields(form)) {
          if (hasCustomMessages(field)) applyCustomMessage(field);
          if (field.dataset.match) checkMatch(field, form);
        }
        updateSummary(form, summaryOutput);
      });
    });
  }
}

function hasCustomMessages(field) {
  const d = field.dataset;
  return d.messageRequired || d.messageType || d.messageMinlength
    || d.messageMaxlength || d.messageMin || d.messageMax || d.messagePattern;
}

// ── Init ─────────────────────────────────────────────────────────────

/**
 * Initialize form validation behavior globally.
 * Call this once on page load.
 */
export function initFormValidation() {
  suppressValidationBubble(document);

  // Enhance all forms with data-validate
  for (const form of document.querySelectorAll('form[data-validate]')) {
    enhanceValidatedForm(form);
  }

  // Observe for dynamically added forms
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        const el = /** @type {Element} */ (node);
        if (el.matches?.('form[data-validate]')) {
          enhanceValidatedForm(/** @type {HTMLFormElement} */ (el));
        }
        el.querySelectorAll?.('form[data-validate]').forEach(f => enhanceValidatedForm(/** @type {HTMLFormElement} */ (f)));
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}
