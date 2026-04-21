/**
 * newsletter-form-init: Wire newsletter signup forms through VBService.
 *
 * Add `data-vb-newsletter-form` to a form to intercept its submit and
 * call the appropriate /go/newsletter/* endpoint via VBService:
 *
 *   data-vb-newsletter-form              → POST /go/newsletter/subscribe
 *   data-vb-newsletter-form="subscribe"  → POST /go/newsletter/subscribe
 *   data-vb-newsletter-form="unsubscribe"→ POST /go/newsletter/unsubscribe
 *   data-vb-newsletter-form="preferences"→ load on focus/blur of the email
 *                                          field; submit posts subscribe +
 *                                          unsubscribe deltas in one go.
 *
 * The `email` field is required (named `email`). Lists come from either:
 *   1. Checkbox inputs named `lists` (each value is a list id), OR
 *   2. A `data-vb-newsletter-lists` attribute with comma-separated ids
 *      (used when there's a single hidden default list, e.g. just the
 *      "release-notes" list with no UI).
 *
 * Without JS the form falls back to its native `action` so the same
 * markup also works as a server-side post.
 *
 * Status output: any `[data-vb-newsletter-status]` element inside the
 * form receives the success/error message + a `data-state` attribute
 * for CSS hooks.
 *
 * Events:
 *   vb-newsletter-form:submitting      { mode }
 *   vb-newsletter-form:success         { mode, lists, response }
 *   vb-newsletter-form:error           { mode, error, status?, body? }
 *   vb-newsletter-form:preferences     { email, subscriptions, available }
 *
 * Spec: /docs/concepts/service-contracts/ §/go/newsletter
 */

import { VBService, VBServiceError } from '../lib/vb-service.js';

const SELECTOR = 'form[data-vb-newsletter-form]';
const SUBMITTING = 'data-vb-newsletter-submitting';
const VALID_MODES = ['subscribe', 'unsubscribe', 'preferences'];

function getMode(form) {
  const raw = (form.getAttribute('data-vb-newsletter-form') || 'subscribe').trim();
  return VALID_MODES.includes(raw) ? raw : 'subscribe';
}

/** Collect list ids from checkboxes named `lists`, plus any data-* defaults. */
function collectLists(form) {
  const fromCheckboxes = [...form.querySelectorAll('input[type="checkbox"][name="lists"]')]
    .filter(cb => cb.checked)
    .map(cb => cb.value);
  if (fromCheckboxes.length) return fromCheckboxes;

  const defaults = (form.getAttribute('data-vb-newsletter-lists') || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  return defaults;
}

function emailField(form) {
  return /** @type {HTMLInputElement|null} */ (form.querySelector('input[name="email"]'));
}

function showStatus(form, kind, msg) {
  const target = /** @type {HTMLElement|null} */ (form.querySelector('[data-vb-newsletter-status]'));
  if (!target) return;
  target.dataset.state = kind;
  target.textContent = msg;
}

function statusMessage(form, mode, kind) {
  if (kind === 'error') {
    return form.dataset.vbNewsletterError || 'Sorry, that did not work. Try again.';
  }
  if (mode === 'unsubscribe') {
    return form.dataset.vbNewsletterUnsubscribed || 'Unsubscribed.';
  }
  if (mode === 'preferences') {
    return form.dataset.vbNewsletterSaved || 'Preferences saved.';
  }
  return form.dataset.vbNewsletterSubscribed || 'Subscribed. Check your inbox.';
}

function setSubmitState(form, busy) {
  const submitBtn = /** @type {HTMLButtonElement|null} */ (
    form.querySelector('button[type="submit"], button:not([type])')
  );
  if (!submitBtn) return undefined;
  if (busy) {
    submitBtn.dataset.vbNewsletterPrevLabel = submitBtn.textContent || '';
    submitBtn.disabled = true;
    if (form.dataset.vbNewsletterLoadingLabel) {
      submitBtn.textContent = form.dataset.vbNewsletterLoadingLabel;
    }
  } else {
    submitBtn.disabled = false;
    if (submitBtn.dataset.vbNewsletterPrevLabel != null) {
      submitBtn.textContent = submitBtn.dataset.vbNewsletterPrevLabel;
      delete submitBtn.dataset.vbNewsletterPrevLabel;
    }
  }
}

async function callNewsletter(method, path, body) {
  const svc = new VBService('newsletter');
  if (method === 'POST') return svc.post(path, body);
  if (method === 'GET') return svc.get(path, body);
  throw new Error(`unsupported method ${method}`);
}

/** subscribe + unsubscribe share the same body shape and dispatch path. */
async function dispatchSubscribe(form, mode, email, lists) {
  if (!lists.length && mode !== 'preferences') {
    throw new Error('No lists selected.');
  }
  const path = mode === 'unsubscribe' ? '/unsubscribe' : '/subscribe';
  return callNewsletter('POST', path, { email, lists });
}

async function loadPreferences(form, email) {
  if (!email) return;
  try {
    const response = /** @type {{subscriptions: string[], available: string[]}|null} */ (
      await callNewsletter('GET', '/preferences', { email })
    );
    if (!response) return;
    const subs = new Set(response.subscriptions || []);
    for (const cb of form.querySelectorAll('input[type="checkbox"][name="lists"]')) {
      const input = /** @type {HTMLInputElement} */ (cb);
      input.checked = subs.has(input.value);
    }
    form.dispatchEvent(new CustomEvent('vb-newsletter-form:preferences', {
      bubbles: true, composed: true,
      detail: { email, subscriptions: response.subscriptions, available: response.available },
    }));
  } catch (err) {
    if (err instanceof VBServiceError && err.status === 404) return; // no record yet — fine
    console.warn('[newsletter-form] preferences fetch failed', err);
  }
}

/**
 * Preferences mode submits a *delta*: subscribe to anything newly checked
 * and unsubscribe from anything newly unchecked. We compare against the
 * snapshot taken on load (stored on the form via dataset).
 */
function snapshotChecked(form) {
  return new Set(
    [...form.querySelectorAll('input[type="checkbox"][name="lists"]')]
      .filter(cb => /** @type {HTMLInputElement} */ (cb).checked)
      .map(cb => /** @type {HTMLInputElement} */ (cb).value),
  );
}

async function submitPreferencesDelta(form, email) {
  const snapshot = form.__vbNewsletterSnapshot ?? new Set();
  const current = snapshotChecked(form);
  const subscribe = [...current].filter(id => !snapshot.has(id));
  const unsubscribe = [...snapshot].filter(id => !current.has(id));

  const responses = {};
  if (subscribe.length) {
    responses.subscribe = await callNewsletter('POST', '/subscribe', { email, lists: subscribe });
  }
  if (unsubscribe.length) {
    responses.unsubscribe = await callNewsletter('POST', '/unsubscribe', { email, lists: unsubscribe });
  }
  form.__vbNewsletterSnapshot = snapshotChecked(form);
  return responses;
}

async function handleSubmit(event) {
  const form = /** @type {HTMLFormElement} */ (event.currentTarget);
  const mode = getMode(form);
  const email = emailField(form)?.value?.trim();

  event.preventDefault();
  if (!email) {
    showStatus(form, 'error', 'Email is required.');
    return;
  }
  if (form.hasAttribute(SUBMITTING)) return;
  form.setAttribute(SUBMITTING, '');
  setSubmitState(form, true);

  form.dispatchEvent(new CustomEvent('vb-newsletter-form:submitting', {
    bubbles: true, composed: true, detail: { mode },
  }));

  try {
    let response;
    if (mode === 'preferences') {
      response = await submitPreferencesDelta(form, email);
    } else {
      const lists = collectLists(form);
      response = await dispatchSubscribe(form, mode, email, lists);
    }
    form.dispatchEvent(new CustomEvent('vb-newsletter-form:success', {
      bubbles: true, composed: true,
      detail: { mode, lists: collectLists(form), response },
    }));
    showStatus(form, 'success', statusMessage(form, mode, 'success'));
    if (mode === 'subscribe' && !form.hasAttribute('data-vb-newsletter-no-reset')) {
      form.reset();
    }
  } catch (err) {
    const detail = { mode, error: err };
    if (err instanceof VBServiceError) {
      detail.status = err.status;
      detail.body = err.body;
    }
    form.dispatchEvent(new CustomEvent('vb-newsletter-form:error', {
      bubbles: true, composed: true, detail,
    }));
    const msg = err instanceof Error && err.message === 'No lists selected.'
      ? 'Pick at least one list.'
      : statusMessage(form, mode, 'error');
    showStatus(form, 'error', msg);
  } finally {
    form.removeAttribute(SUBMITTING);
    setSubmitState(form, false);
  }
}

function enhance(form) {
  if (form.hasAttribute('data-vb-newsletter-form-init')) return;
  form.setAttribute('data-vb-newsletter-form-init', '');
  form.addEventListener('submit', handleSubmit);

  // Preferences mode: load existing subscriptions when the email field
  // commits (blur). Snapshot the checkbox state so submit can compute a
  // delta.
  if (getMode(form) === 'preferences') {
    const email = emailField(form);
    if (email) {
      const onCommit = async () => {
        const value = email.value.trim();
        if (!value) return;
        await loadPreferences(form, value);
        form.__vbNewsletterSnapshot = snapshotChecked(form);
      };
      email.addEventListener('change', onCommit);
      email.addEventListener('blur', onCommit);
    }
  }
}

function initAll(root = document) {
  for (const form of root.querySelectorAll(SELECTOR)) {
    enhance(/** @type {HTMLFormElement} */ (form));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initAll());
} else {
  initAll();
}

const observer = new MutationObserver((mutations) => {
  for (const m of mutations) {
    for (const node of m.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      const el = /** @type {Element} */ (node);
      if (el.matches?.(SELECTOR)) enhance(/** @type {HTMLFormElement} */ (el));
      el.querySelectorAll?.(SELECTOR).forEach(f => enhance(/** @type {HTMLFormElement} */ (f)));
    }
  }
});
observer.observe(document.documentElement, { childList: true, subtree: true });

export { initAll as initNewsletterForm };
