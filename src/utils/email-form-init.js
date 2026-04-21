/**
 * email-form-init: Submit any form through VBService('email').
 *
 * Add `data-vb-email-form="<template-name>"` to a form to intercept its
 * submit and POST `{ to, template, data }` to /go/email via VBService.
 * The template name maps to the renderer registered server-side
 * (see /docs/concepts/service-contracts/ §/go/email §Templates).
 *
 * Recipient address is read from `data-vb-email-to` on the form.
 *
 * Progressive enhancement: without JS the form falls back to its
 * native `action` (typically a server-side handler). With JS the
 * submission goes through /go/email instead.
 *
 * @example
 *   <form action="/contact" method="POST"
 *         data-vb-email-form="contact-form"
 *         data-vb-email-to="hello@example.com">
 *     <input name="name" required>
 *     <input name="email" type="email" required>
 *     <textarea name="message" required></textarea>
 *     <button type="submit">Send</button>
 *   </form>
 *
 * Events fired on the form:
 *   vb-email-form:submitting  before the request goes out
 *   vb-email-form:success     { id }            on 2xx
 *   vb-email-form:error       { error }         on failure
 */

import { VBService, VBServiceError } from '../lib/vb-service.js';

const SELECTOR = 'form[data-vb-email-form]';
const SUBMITTING = 'data-vb-email-submitting';

function collectData(form) {
  const data = {};
  for (const el of form.elements) {
    const field = /** @type {HTMLInputElement} */ (el);
    if (!field.name) continue;
    if (field.type === 'password' || field.type === 'file') continue;
    if (field.type === 'checkbox') {
      data[field.name] = field.checked;
    } else if (field.type === 'radio') {
      if (field.checked) data[field.name] = field.value;
    } else {
      data[field.name] = field.value;
    }
  }
  return data;
}

async function handleSubmit(event) {
  const form = /** @type {HTMLFormElement} */ (event.currentTarget);
  const template = form.getAttribute('data-vb-email-form');
  const to = form.getAttribute('data-vb-email-to');

  if (!template) return; // markup error — fall through to native submit
  // `to` may legitimately be empty when the backend determines the
  // recipient itself (e.g. contact-form routes to a configured inbox).

  event.preventDefault();
  if (form.hasAttribute(SUBMITTING)) return; // double-click guard
  form.setAttribute(SUBMITTING, '');

  // Disable the submit button while in flight.
  const submitBtn = /** @type {HTMLButtonElement|null} */ (
    form.querySelector('button[type="submit"], button:not([type])')
  );
  const originalLabel = submitBtn?.textContent;
  if (submitBtn) {
    submitBtn.disabled = true;
    if (form.dataset.vbEmailLoadingLabel) {
      submitBtn.textContent = form.dataset.vbEmailLoadingLabel;
    }
  }

  form.dispatchEvent(new CustomEvent('vb-email-form:submitting', {
    bubbles: true, composed: true, detail: { template },
  }));

  const data = collectData(form);
  // Common pattern: the form has a `subject` field that should be lifted
  // to top-level for the email subject line. The shared template renderers
  // already look for it inside `data` — no remapping needed. We just pass
  // `data` through.

  try {
    const email = new VBService('email');
    const response = await email.post('/', { to: to || data.to || data.email, template, data });
    form.dispatchEvent(new CustomEvent('vb-email-form:success', {
      bubbles: true, composed: true, detail: { id: response?.id },
    }));
    // Reset on success unless the form opted out.
    if (!form.hasAttribute('data-vb-email-no-reset')) form.reset();
    showStatus(form, 'success');
  } catch (err) {
    const detail = { error: err };
    if (err instanceof VBServiceError) {
      detail.status = err.status;
      detail.body = err.body;
    }
    form.dispatchEvent(new CustomEvent('vb-email-form:error', {
      bubbles: true, composed: true, detail,
    }));
    showStatus(form, 'error');
  } finally {
    form.removeAttribute(SUBMITTING);
    if (submitBtn) {
      submitBtn.disabled = false;
      if (originalLabel) submitBtn.textContent = originalLabel;
    }
  }
}

/** Show a status message inside [data-vb-email-status] if present. */
function showStatus(form, kind) {
  const target = /** @type {HTMLElement|null} */ (form.querySelector('[data-vb-email-status]'));
  if (!target) return;
  const successMsg = form.dataset.vbEmailSuccess || 'Sent. Thank you.';
  const errorMsg = form.dataset.vbEmailError || 'Sorry, the message could not be sent. Try again.';
  target.dataset.state = kind;
  target.textContent = kind === 'success' ? successMsg : errorMsg;
}

function enhance(form) {
  if (form.hasAttribute('data-vb-email-form-init')) return;
  form.setAttribute('data-vb-email-form-init', '');
  form.addEventListener('submit', handleSubmit);
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

export { initAll as initEmailForm };
