/**
 * Form Coordinator — Vanilla Breeze
 *
 * Orchestrates form-level validation, submission, and error summary for
 * forms that opt in via `data-validate`. Works with the FormField web
 * component for field-level validation timing.
 *
 * Submit modes (via `data-submit` attribute on <form>):
 *   - absent / "native": validate then submit natively via action/method
 *   - "event": validate then dispatch cancelable `vb:submit` with FormData
 *   - "fetch": validate then POST via fetch with loading/success/error states
 *
 * Error summary supports two authored patterns:
 *   - New: <div data-form-summary role="alert" tabindex="-1" hidden>
 *            <h2>...</h2> <ul data-summary-list></ul>
 *          </div>
 *   - Legacy: <output class="error-summary" role="alert" tabindex="-1">
 */

// ── Field helpers ────────────────────────────────────────────────────

function getFields(form) {
  return [...form.querySelectorAll('input, select, textarea')]
    .filter(f => f.type !== 'submit' && f.type !== 'button' && f.type !== 'hidden');
}

function getFormFields(form) {
  return [...form.querySelectorAll('form-field[data-upgraded]')];
}

function getLabelText(field) {
  return field.labels?.[0]?.textContent?.trim()
    ?? field.getAttribute('aria-label')
    ?? field.name
    ?? field.id;
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
    const output = findErrorOutput(field);
    if (output) output.textContent = msg;
  } else if (field.validity.valid) {
    const output = findErrorOutput(field);
    if (output) output.textContent = '';
  }
}

function findErrorOutput(field) {
  const ids = field.getAttribute('aria-describedby')?.split(/\s+/) ?? [];
  for (const id of ids) {
    const el = document.getElementById(id);
    if (el?.tagName === 'OUTPUT' && el.classList.contains('error')) return el;
  }
  const formField = field.closest('form-field');
  return formField?.querySelector('output.error') ?? null;
}

// ── Checkbox group: data-min-checked / data-max-checked ──────────────

function checkFieldset(fieldset) {
  const boxes = [...fieldset.querySelectorAll('input[type="checkbox"]')];
  const count = boxes.filter(b => b.checked).length;
  const min = parseInt(fieldset.dataset.minChecked ?? '0', 10);
  const max = parseInt(fieldset.dataset.maxChecked ?? '999', 10);
  const output = fieldset.querySelector(':scope > output');

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

function findSummary(form) {
  // New pattern: <div data-form-summary>
  const authored = form.querySelector('[data-form-summary]');
  if (authored) return { el: authored, type: 'authored' };

  // Legacy pattern: <output class="error-summary">
  const legacy = form.querySelector('output.error-summary');
  if (legacy) return { el: legacy, type: 'legacy' };

  return null;
}

function updateSummary(form, summary, { focus = false } = {}) {
  if (!summary) return;

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
    const output = fs.querySelector(':scope > output');
    errors.push({
      id: fs.id || '',
      label: fs.querySelector('legend')?.textContent?.trim() ?? 'Group',
      message: output?.textContent || 'Invalid selection',
    });
  }

  if (errors.length === 0) {
    clearSummary(summary);
    return;
  }

  if (summary.type === 'authored') {
    const list = summary.el.querySelector('[data-summary-list]');
    if (list) {
      list.innerHTML = '';
      for (const e of errors) {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = e.id ? `#${e.id}` : '#';
        a.textContent = `${e.label}: ${e.message}`;
        li.appendChild(a);
        list.appendChild(li);
      }
    }
    summary.el.hidden = false;
  } else {
    // Legacy innerHTML approach
    const count = errors.length;
    const links = errors
      .map(e => {
        const href = e.id ? `#${e.id}` : '#';
        return `<li><a href="${href}">${e.label}: ${e.message}</a></li>`;
      })
      .join('\n      ');

    summary.el.innerHTML =
      `<p>Please fix ${count} error${count === 1 ? '' : 's'}:</p>\n` +
      `    <ul>\n      ${links}\n    </ul>`;
  }

  if (focus) summary.el.focus();
}

function clearSummary(summary) {
  if (!summary) return;
  if (summary.type === 'authored') {
    const list = summary.el.querySelector('[data-summary-list]');
    if (list) list.innerHTML = '';
    summary.el.hidden = true;
  } else {
    summary.el.innerHTML = '';
  }
}

function bindSummaryLinks(summary) {
  if (!summary) return;
  summary.el.addEventListener('click', (e) => {
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
    field.focus({ preventScroll: true });
    field.blur();
  }
}

// ── Fetch submission cycle ───────────────────────────────────────────

async function fetchSubmit(form) {
  const submitBtn = form.querySelector('[type="submit"]');

  form.dataset.submitting = '';
  delete form.dataset.error;
  if (submitBtn) submitBtn.setAttribute('aria-disabled', 'true');

  try {
    const data = new FormData(form);
    const response = await fetch(form.action, {
      method: form.method || 'post',
      body: data,
    });

    delete form.dataset.submitting;
    if (submitBtn) submitBtn.removeAttribute('aria-disabled');

    if (!response.ok) {
      // Attempt to read server validation errors
      const contentType = response.headers.get('content-type') ?? '';
      if (contentType.includes('application/json')) {
        const body = await response.json();
        if (body.errors) {
          mapServerErrors(form, body.errors);
          return;
        }
      }
      throw new Error(`Server error: ${response.status}`);
    }

    // Success
    form.dataset.success = '';

    const successEl = form.querySelector('[data-form-success]');
    if (successEl) {
      successEl.hidden = false;
      successEl.focus();
    }
  } catch {
    // Network or unexpected server error
    delete form.dataset.submitting;
    if (submitBtn) submitBtn.removeAttribute('aria-disabled');
    form.dataset.error = 'network';
  }
}

function mapServerErrors(form, errors) {
  form.dataset.error = '';

  const formFields = getFormFields(form);
  const invalidFields = [];

  for (const formField of formFields) {
    const input = formField.querySelector('input, textarea, select');
    if (!input) continue;
    const msg = errors[input.name];
    if (msg) {
      formField.setError(msg);
      invalidFields.push(formField);
    }
  }

  if (invalidFields.length > 0) {
    const summary = findSummary(form);
    updateSummary(form, summary, { focus: true });
  }

  // Clear custom validity on next input so resubmission works
  for (const formField of formFields) {
    const input = formField.querySelector('input, textarea, select');
    input?.addEventListener('input', () => formField.clearError(), { once: true });
  }
}

// ── Form enhancement ─────────────────────────────────────────────────

function enhanceForm(form) {
  // Idempotent guard
  if (form.hasAttribute('data-vb-enhanced')) return;

  // Take ownership of validation UI
  form.setAttribute('novalidate', '');
  form.setAttribute('data-vb-enhanced', '');

  const summary = findSummary(form);
  if (summary) bindSummaryLinks(summary);

  // Cross-field match listeners
  for (const field of getFields(form)) {
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
      if (summary) updateSummary(form, summary);
    });
  }

  // Submit handler
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Validate all form-field components
    const formFields = getFormFields(form);
    for (const ff of formFields) {
      ff.validate();
    }

    // Cross-field checks
    for (const field of getFields(form)) {
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

    if (!valid) {
      if (summary) {
        updateSummary(form, summary, { focus: true });
      } else {
        // Focus the first invalid field
        const firstInvalid = form.querySelector(':invalid');
        if (firstInvalid) {
          firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
          firstInvalid.focus();
        }
      }
      return;
    }

    // Valid — clear summary and handle submission
    clearSummary(summary);

    const submitMode = form.dataset.submit ?? 'native';

    if (submitMode === 'fetch') {
      fetchSubmit(form);
    } else if (submitMode === 'event') {
      const event = new CustomEvent('vb:submit', {
        bubbles: true,
        cancelable: true,
        detail: new FormData(form),
      });
      form.dispatchEvent(event);
    } else {
      // Native submit
      form.submit();
    }
  });

  // Live clearing: when user fixes errors, update summary
  if (summary) {
    form.addEventListener('input', () => {
      requestAnimationFrame(() => {
        for (const field of getFields(form)) {
          if (field.dataset.match) checkMatch(field, form);
        }
        updateSummary(form, summary);
      });
    });
  }
}

// ── Init ─────────────────────────────────────────────────────────────

/**
 * Initialize form coordination globally.
 * Enhances all forms with `data-validate` and observes for dynamic additions.
 */
export function initFormCoordinator() {
  for (const form of document.querySelectorAll('form[data-validate]')) {
    enhanceForm(/** @type {HTMLFormElement} */ (form));
  }

  // Observe for dynamically added forms
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        const el = /** @type {Element} */ (node);
        if (el.matches?.('form[data-validate]')) {
          enhanceForm(/** @type {HTMLFormElement} */ (el));
        }
        el.querySelectorAll?.('form[data-validate]').forEach(f =>
          enhanceForm(/** @type {HTMLFormElement} */ (f))
        );
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}
