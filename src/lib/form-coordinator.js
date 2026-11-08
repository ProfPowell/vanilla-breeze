/**
 * Form Coordinator — Vanilla Breeze
 *
 * Orchestrates form-level validation, submission, and error summary for
 * forms that opt in via `data-validate`. Works with the FormField web
 * component for field-level validation timing.
 *
 * Submit modes (via `data-submit` attribute on <form>):
 *   - absent / "native": validate then submit natively (requestSubmit with
 *     the original submitter, so its name/value/formaction/formmethod apply)
 *   - "event": validate then dispatch cancelable `vb:submit` with FormData
 *   - "fetch": validate then send via fetch with loading/success/error states
 *     (honours the submitter's formaction, formmethod and formenctype; not
 *     formtarget: the response is handled in the page)
 *
 * A submitter with `formnovalidate` skips validation in every mode.
 *
 * Error summary supports two authored patterns:
 *   - <section data-form-summary role="alert" tabindex="-1" hidden>
 *       <h2 data-summary-heading>...</h2> <ul data-summary-list></ul>
 *     </section>
 *   - Legacy: <output class="error-summary" role="alert" tabindex="-1">
 *
 * Form-level text overrides (all optional, for i18n):
 *   data-label-summary[-one|-other|...]  "Please fix {count} errors:" (Intl.PluralRules)
 *   data-label-group                     fallback legend for fieldset entries
 *   data-message-min-checked             "Select at least {min}"
 *   data-message-max-checked             "Select no more than {max}"
 *   data-message-invalid-selection       fallback fieldset message
 *   data-message-match                   "Values do not match"
 *   data-message-network                 network error text
 */

const VALIDITY_KEYS = [
  'valueMissing', 'typeMismatch', 'patternMismatch', 'tooShort', 'tooLong',
  'rangeUnderflow', 'rangeOverflow', 'stepMismatch', 'badInput',
];

const DEFAULTS = {
  'data-label-group': 'Group',
  'data-message-min-checked': 'Select at least {min}',
  'data-message-max-checked': 'Select no more than {max}',
  'data-message-invalid-selection': 'Invalid selection',
  'data-message-match': 'Values do not match',
  'data-message-network': 'Something went wrong. Please try again.',
};

/** Forms whose next submit event must pass through untouched (native mode). */
const BYPASS = new WeakSet();
/** Bare controls the coordinator marked aria-invalid. */
const MARKED = new WeakSet();
let uid = 0;

// ── Text helpers ─────────────────────────────────────────────────────

/**
 * Resolve an overridable string: element attribute, then form attribute,
 * then the built-in default. `{name}` placeholders are filled from vars.
 * @param {HTMLFormElement} form
 * @param {Element|null} el
 * @param {string} attr
 * @param {Record<string, string|number>} [vars]
 */
function text(form, el, attr, vars = {}) {
  const tpl = el?.getAttribute(attr) ?? form.getAttribute(attr) ?? DEFAULTS[attr] ?? '';
  return tpl.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

function summaryHeading(form, count) {
  const lang = form.closest('[lang]')?.getAttribute('lang') || undefined;
  let category = 'other';
  try { category = new Intl.PluralRules(lang).select(count); } catch { /* bad lang tag */ }
  const tpl = form.getAttribute(`data-label-summary-${category}`)
    ?? form.getAttribute('data-label-summary')
    ?? (count === 1 ? 'Please fix {count} error:' : 'Please fix {count} errors:');
  return tpl.replaceAll('{count}', String(count));
}

// ── Field helpers ────────────────────────────────────────────────────

/** Validatable controls in tree order (form="" association included). */
function getControls(form) {
  return /** @type {HTMLInputElement[]} */ ([...form.elements])
    .filter(el => /** @type {any} */ (el).willValidate && !('honeypot' in /** @type {HTMLElement} */ (el).dataset));
}

/** Text inputs that carry a data-match constraint. */
function getMatchFields(form) {
  return getControls(form).filter(f => f.dataset.match);
}

function getFormFields(form) {
  return /** @type {any[]} */ ([...form.querySelectorAll('form-field[data-upgraded]')]);
}

/** The upgraded form-field that owns this control, if any. */
function owningFormField(el) {
  const ff = /** @type {any} */ (el.closest('form-field[data-upgraded]'));
  return ff && ff.input === el ? ff : null;
}

function ensureId(el) {
  if (!el.id) el.id = `vb-field-${++uid}`;
  return el.id;
}

function isFocusable(el) {
  return !el.disabled && !el.closest('[inert], [hidden]') && el.getClientRects().length > 0;
}

function getLabelText(form, field) {
  if (field.type === 'radio') {
    const legend = field.closest('fieldset')?.querySelector(':scope > legend')?.textContent?.trim();
    if (legend) return legend;
  }
  const ff = owningFormField(field);
  if (ff?.fieldName) return ff.fieldName;
  return field.labels?.[0]?.textContent?.trim()
    || field.getAttribute('aria-label')
    || field.name
    || field.id
    || text(form, null, 'data-label-group');
}

/**
 * The message the user sees for a control: form-field's resolved message,
 * then the rendered output.error, then data-message-*, then the browser's.
 */
function getMessage(field) {
  const ff = owningFormField(field);
  if (ff && typeof ff.errorMessage === 'string' && ff.errorMessage) return ff.errorMessage;
  const rendered = findErrorOutput(field)?.textContent?.trim();
  if (rendered) return rendered;
  for (const key of VALIDITY_KEYS) {
    if (!field.validity[key]) continue;
    const msg = field.getAttribute(`data-message-${key.toLowerCase()}`);
    if (msg) return msg;
    break;
  }
  return field.validationMessage;
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

/** First focusable control inside a container (fieldset group target). */
function firstControl(container) {
  return /** @type {HTMLElement|null} */ (
    container.querySelector('input:not([type="hidden"]), select, textarea, button')
  );
}

// ── Cross-field: data-match ──────────────────────────────────────────

function findMatchTarget(field, form) {
  const targetId = field.dataset.match;
  if (!targetId) return null;
  return form.querySelector(`#${CSS.escape(targetId)}`)
    ?? form.querySelector(`[name="${CSS.escape(targetId)}"]`);
}

function checkMatch(field, form) {
  const target = findMatchTarget(field, form);
  if (!target) return;

  field.setCustomValidity('');

  if (field.value && target.value && field.value !== target.value) {
    const msg = text(form, field, 'data-message-match');
    field.setCustomValidity(msg);
    const output = findErrorOutput(field);
    if (output) output.textContent = msg;
  } else if (field.validity.valid) {
    const output = findErrorOutput(field);
    if (output) output.textContent = '';
  }
}

// ── Checkbox group: data-min-checked / data-max-checked ──────────────

function checkFieldset(form, fieldset) {
  const boxes = [...fieldset.querySelectorAll('input[type="checkbox"]')];
  const count = boxes.filter(b => b.checked).length;
  const min = parseInt(fieldset.dataset.minChecked ?? '0', 10);
  const max = parseInt(fieldset.dataset.maxChecked ?? '999', 10);
  const output = fieldset.querySelector(':scope > output');

  let msg = null;
  if (count < min) msg = text(form, fieldset, 'data-message-min-checked', { min, max });
  if (count > max) msg = text(form, fieldset, 'data-message-max-checked', { min, max });

  if (output) output.textContent = msg ?? '';

  if (msg) {
    fieldset.dataset.invalid = '';
  } else {
    delete fieldset.dataset.invalid;
  }

  return !msg;
}

function groupFieldsets(form) {
  return [...form.querySelectorAll('fieldset[data-min-checked], fieldset[data-max-checked]')];
}

// ── Error collection ─────────────────────────────────────────────────

/**
 * Every current error as { target, text }, in document order. Radio groups
 * yield one entry linking the group's first radio; fieldset groups link
 * their first control.
 */
function collectErrors(form) {
  /** @type {{ target: HTMLElement, label: string, message: string }[]} */
  const errors = [];
  const seenRadio = new Set();

  for (const field of getControls(form)) {
    if (field.validity.valid) continue;
    let target = field;
    if (field.type === 'radio' && field.name) {
      if (seenRadio.has(field.name)) continue;
      seenRadio.add(field.name);
      target = /** @type {HTMLInputElement} */ (
        getControls(form).find(c => c.type === 'radio' && c.name === field.name) ?? field
      );
    }
    errors.push({ target, label: getLabelText(form, field), message: getMessage(field) });
  }

  for (const fs of form.querySelectorAll('fieldset[data-invalid]')) {
    const target = firstControl(fs);
    if (!target) continue;
    const output = fs.querySelector(':scope > output');
    errors.push({
      target,
      label: fs.querySelector(':scope > legend')?.textContent?.trim() || text(form, fs, 'data-label-group'),
      message: output?.textContent?.trim() || text(form, fs, 'data-message-invalid-selection'),
    });
  }

  errors.sort((a, b) =>
    a.target.compareDocumentPosition(b.target) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
  return errors;
}

function firstInvalidControl(form) {
  return collectErrors(form).map(e => e.target).find(isFocusable) ?? null;
}

// ── Error summary ────────────────────────────────────────────────────

function findSummary(form) {
  const authored = form.querySelector('[data-form-summary]');
  if (authored) return { el: /** @type {HTMLElement} */ (authored), type: 'authored', signature: '', active: false };

  const legacy = form.querySelector('output.error-summary');
  if (legacy) return { el: /** @type {HTMLElement} */ (legacy), type: 'legacy', signature: '', active: false };

  return null;
}

function buildLinks(errors) {
  return errors.map(e => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = `#${ensureId(e.target)}`;
    a.textContent = `${e.label}: ${e.message}`;
    li.append(a);
    return li;
  });
}

/**
 * Render the summary. Skips the DOM write when the error set is unchanged
 * so the live region is not re-announced.
 */
function updateSummary(form, summary, { focus = false } = {}) {
  if (!summary) return;

  const errors = collectErrors(form);

  if (errors.length === 0) {
    clearSummary(summary);
    return;
  }

  summary.active = true;
  const signature = errors.map(e => `${ensureId(e.target)}\u0000${e.label}\u0000${e.message}`).join('\u0001');
  const changed = signature !== summary.signature;
  summary.signature = signature;

  if (summary.type === 'authored') {
    if (changed) {
      summary.el.querySelector('[data-summary-list]')?.replaceChildren(...buildLinks(errors));
      const heading = summary.el.querySelector('[data-summary-heading]');
      if (heading) heading.textContent = summaryHeading(form, errors.length);
    }
    if (summary.el.hidden || !summary.el.hasAttribute('data-state-visible')) {
      summary.el.hidden = false;
      void summary.el.offsetHeight; // start the expand transition from the collapsed state
      summary.el.dataset.stateVisible = '';
    }
  } else if (changed) {
    const p = document.createElement('p');
    p.textContent = summaryHeading(form, errors.length);
    const ul = document.createElement('ul');
    ul.append(...buildLinks(errors));
    summary.el.replaceChildren(p, ul);
  }

  if (focus) summary.el.focus();
}

function transitionMs(el) {
  const cs = getComputedStyle(el);
  const list = (v) => v.split(',').map(s => parseFloat(s) * (s.trim().endsWith('ms') ? 1 : 1000) || 0);
  const d = list(cs.transitionDuration);
  const delay = list(cs.transitionDelay);
  return Math.max(0, ...d.map((v, i) => v + (delay[i] ?? delay[0] ?? 0)));
}

function clearSummary(summary) {
  if (!summary) return;
  summary.active = false;
  summary.signature = '';
  if (summary.type === 'authored') {
    const el = summary.el;
    delete el.dataset.stateVisible;
    const done = () => {
      if (el.hasAttribute('data-state-visible')) return; // re-shown meanwhile
      el.hidden = true;
      el.querySelector('[data-summary-list]')?.replaceChildren();
    };
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ms = reduce ? 0 : transitionMs(el);
    if (ms === 0) done();
    else setTimeout(done, ms + 50);
  } else {
    summary.el.replaceChildren();
  }
}

function bindSummaryLinks(summary) {
  if (!summary) return;
  summary.el.addEventListener('click', (e) => {
    const link = /** @type {Element} */ (e.target).closest('a[href^="#"]');
    if (!link) return;
    e.preventDefault();
    const target = document.getElementById((link.getAttribute('href') ?? '#').slice(1));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.focus();
    }
  });
}

// ── Bare controls (no form-field): aria-invalid on submit ────────────

function markBareControls(form) {
  for (const field of getControls(form)) {
    if (owningFormField(field)) continue;
    if (!field.validity.valid) {
      field.setAttribute('aria-invalid', 'true');
      MARKED.add(field);
    } else if (MARKED.has(field)) {
      field.removeAttribute('aria-invalid');
      MARKED.delete(field);
    }
  }
}

function unmarkIfValid(e) {
  const field = /** @type {HTMLInputElement} */ (e.target);
  if (!MARKED.has(field)) return;
  const group = field.type === 'radio' && field.form && field.name
    ? getControls(field.form).filter(c => c.type === 'radio' && c.name === field.name)
    : [field];
  for (const f of group) {
    if (MARKED.has(f) && f.validity.valid) {
      f.removeAttribute('aria-invalid');
      MARKED.delete(f);
    }
  }
}

// ── Form-level status elements ───────────────────────────────────────

function getErrorElement(form) {
  let el = /** @type {HTMLElement|null} */ (form.querySelector('[data-form-error]'));
  if (!el) {
    el = document.createElement('p');
    el.setAttribute('data-form-error', '');
    el.hidden = true;
    form.prepend(el);
  }
  if (!el.hasAttribute('role')) el.setAttribute('role', 'alert');
  return el;
}

function showNetworkError(form) {
  form.dataset.error = 'network';
  const el = getErrorElement(form);
  if (!el.textContent.trim() || el.hasAttribute('data-vb-generated')) {
    el.textContent = text(form, null, 'data-message-network');
    el.setAttribute('data-vb-generated', '');
  }
  el.hidden = false;
}

function resetStatus(form) {
  if (form.hasAttribute('data-success')) {
    delete form.dataset.success;
    const successEl = /** @type {HTMLElement|null} */ (form.querySelector('[data-form-success]'));
    if (successEl) successEl.hidden = true;
  }
  delete form.dataset.error;
  const errorEl = /** @type {HTMLElement|null} */ (form.querySelector('[data-form-error]'));
  if (errorEl) errorEl.hidden = true;
}

function showSuccess(form) {
  form.dataset.success = '';
  const successEl = /** @type {HTMLElement|null} */ (form.querySelector('[data-form-success]'));
  if (!successEl) return;
  successEl.hidden = false;
  if (!successEl.hasAttribute('tabindex')) successEl.tabIndex = -1;
  if (!successEl.hasAttribute('role')) successEl.setAttribute('role', 'status');
  successEl.focus();
}

// ── Submission ───────────────────────────────────────────────────────

/** The spec's default button: first submit button in tree order. */
function defaultButton(form) {
  return /** @type {HTMLElement|null} */ ([...form.elements].find(el =>
    (el instanceof HTMLButtonElement && el.type === 'submit')
    || (el instanceof HTMLInputElement && (el.type === 'submit' || el.type === 'image'))) ?? null);
}

function formData(form, submitter) {
  try {
    return submitter ? new FormData(form, submitter) : new FormData(form);
  } catch {
    return new FormData(form);
  }
}

/**
 * The authored encoding: the submitter's formenctype, else the form's
 * enctype attribute. Neither authored means multipart (fetch mode's
 * default, so file inputs keep working), not the native urlencoded.
 * @param {HTMLFormElement} form
 * @param {HTMLElement|null} submitter
 */
function enctype(form, submitter) {
  if (submitter?.hasAttribute('formenctype')) return /** @type {HTMLButtonElement} */ (submitter).formEnctype;
  return form.hasAttribute('enctype') ? form.enctype : 'multipart/form-data';
}

/**
 * Fetch body for an encoding. urlencoded and text/plain send a file's name,
 * as native submission does; fetch sets the matching Content-Type.
 * @param {FormData} data
 * @param {string} type
 * @returns {FormData|URLSearchParams|string}
 */
function encodeBody(data, type) {
  if (type === 'multipart/form-data') return data;
  const pairs = [...data].map(([k, v]) => [k, typeof v === 'string' ? v : v.name]);
  if (type === 'text/plain') {
    return pairs.map(([k, v]) => `${k}=${v}\r\n`).join('');
  }
  return new URLSearchParams(pairs);
}

async function fetchSubmit(form, submitter) {
  const button = submitter ?? defaultButton(form);
  const rawMethod = (submitter?.getAttribute('formmethod') || form.getAttribute('method') || 'post').toLowerCase();
  const method = rawMethod === 'get' ? 'GET' : 'POST';
  const action = submitter?.hasAttribute('formaction')
    ? /** @type {HTMLButtonElement} */ (submitter).formAction
    : form.action;

  form.dataset.submitting = '';
  if (button) button.setAttribute('aria-disabled', 'true');

  const finish = () => {
    delete form.dataset.submitting;
    if (button && button.getAttribute('aria-busy') !== 'true') button.removeAttribute('aria-disabled');
  };

  try {
    const data = formData(form, submitter);
    let response;
    if (method === 'GET') {
      const url = new URL(action, document.baseURI);
      url.search = '';
      for (const [k, v] of data) {
        if (typeof v === 'string') url.searchParams.append(k, v);
      }
      response = await fetch(url, { method });
    } else {
      response = await fetch(action, { method, body: encodeBody(data, enctype(form, submitter)) });
    }

    finish();

    if (!response.ok) {
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

    showSuccess(form);
  } catch {
    finish();
    showNetworkError(form);
  }
}

function mapServerErrors(form, errors) {
  form.dataset.error = '';

  const formFields = getFormFields(form);
  let any = false;

  for (const formField of formFields) {
    const input = formField.input ?? formField.querySelector('input, textarea, select');
    if (!input) continue;
    const msg = errors[input.name];
    if (msg) {
      formField.setError(String(msg));
      any = true;
    }
  }

  if (any) {
    const summary = /** @type {any} */ (form)._vbSummary;
    if (summary) updateSummary(form, summary, { focus: true });
    else firstInvalidControl(form)?.focus();
  }

  // Clear custom validity on next input so resubmission works
  for (const formField of formFields) {
    const input = formField.input ?? formField.querySelector('input, textarea, select');
    input?.addEventListener('input', () => formField.clearError(), { once: true });
  }
}

function submitNatively(form, submitter) {
  // The submission algorithm is not re-entrant while submit events are
  // firing, so requestSubmit() has to wait for the current dispatch to end.
  setTimeout(() => {
    if (!form.isConnected) return;
    const button = submitter?.isConnected && /** @type {any} */ (submitter).form === form ? submitter : null;
    BYPASS.add(form);
    try {
      if (button) form.requestSubmit(button);
      else form.requestSubmit();
    } catch {
      BYPASS.delete(form);
      form.submit();
    }
    BYPASS.delete(form);
  });
}

// ── Form enhancement ─────────────────────────────────────────────────

function enhanceForm(form) {
  if (form.hasAttribute('data-vb-enhanced')) return;

  form.setAttribute('novalidate', '');
  form.setAttribute('data-vb-enhanced', '');

  const summary = findSummary(form);
  /** @type {any} */ (form)._vbSummary = summary;
  if (summary) bindSummaryLinks(summary);

  for (const field of getMatchFields(form)) {
    field.addEventListener('input', () => checkMatch(field, form));
    field.addEventListener('blur', () => checkMatch(field, form));
    findMatchTarget(field, form)?.addEventListener('input', () => checkMatch(field, form));
  }

  for (const fs of groupFieldsets(form)) {
    fs.addEventListener('change', () => checkFieldset(form, fs));
  }

  form.addEventListener('input', unmarkIfValid);
  form.addEventListener('change', unmarkIfValid);

  form.addEventListener('submit', (e) => {
    // Second pass from our own requestSubmit(): let the browser submit.
    if (BYPASS.has(form)) {
      BYPASS.delete(form);
      return;
    }
    e.preventDefault();

    const submitter = /** @type {HTMLElement|null} */ (/** @type {SubmitEvent} */ (e).submitter ?? null);
    resetStatus(form);

    // formnovalidate on the submitter skips validation, as it does natively
    // (the form itself carries novalidate, so the browser can't do it).
    const skip = !!submitter?.hasAttribute('formnovalidate');

    if (!skip) {
      for (const ff of getFormFields(form)) ff.validate();
      for (const field of getMatchFields(form)) checkMatch(field, form);
      for (const fs of groupFieldsets(form)) checkFieldset(form, fs);
      markBareControls(form);
    }

    const valid = skip || (form.checkValidity() && !form.querySelector('fieldset[data-invalid]'));

    if (!valid) {
      if (summary) {
        updateSummary(form, summary, { focus: true });
      } else {
        const first = firstInvalidControl(form);
        if (first) {
          first.scrollIntoView({ behavior: 'smooth', block: 'center' });
          first.focus();
        }
      }
      return;
    }

    clearSummary(summary);

    // Bot protection / loading-state hook — fires before submission
    const beforeEvent = new CustomEvent('vb:beforesubmit', {
      bubbles: true,
      cancelable: true,
      detail: { form, submitter },
    });
    form.dispatchEvent(beforeEvent);
    if (beforeEvent.defaultPrevented) return;

    const submitMode = form.dataset.submit ?? 'native';

    if (submitMode === 'fetch') {
      fetchSubmit(form, submitter);
    } else if (submitMode === 'event') {
      form.dispatchEvent(new CustomEvent('vb:submit', {
        bubbles: true,
        cancelable: true,
        detail: formData(form, submitter),
      }));
    } else {
      submitNatively(form, submitter);
    }
  });

  // Once the summary has been shown, keep it current on blur/change only —
  // never per keystroke — and only rewrite it when the error set changes.
  if (summary) {
    const refresh = () => requestAnimationFrame(() => {
      if (summary.active) updateSummary(form, summary);
    });
    form.addEventListener('focusout', refresh);
    form.addEventListener('change', refresh);
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
