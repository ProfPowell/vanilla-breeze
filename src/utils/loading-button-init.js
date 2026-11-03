/**
 * loading-button-init: Upscale disabled → loading state with spinner
 *
 * Enhances buttons with data-loading to show a spinner, set aria-busy,
 * and prevent double-submit. Auto-activates on form submit for the button
 * that submitted the form — but only once the submission actually proceeds
 * (an invalid form-coordinator submit leaves the button alone; on plain
 * forms the browser never fires submit for an invalid form). Auto-reverts when
 * form-coordinator clears data-submitting (fetch mode) or after a timeout.
 * In data-submit="event" mode, clear it yourself when your handler finishes
 * (`delete btn.dataset.loadingActive`) or let the timeout revert it.
 *
 * The button is NOT set `disabled`: disabling it inside the submit event
 * drops its name/value from the form data (the entry list is built after
 * the event), so a Save/Delete form loses which action was chosen, and it
 * throws focus to <body>. It gets aria-disabled + aria-busy instead, and
 * further activations are swallowed while it is busy.
 *
 * @attr {string}  data-loading         - Enable loading enhancement. Optional value
 *   becomes the loading text (e.g. "Saving..."). Empty = spinner only.
 * @attr {number}  data-loading-timeout - Auto-revert after N ms (default: 10000).
 *
 * @example Auto-activate on form submit
 * <form>
 *   <button type="submit" data-loading="Saving...">Save</button>
 * </form>
 *
 * @example Programmatic trigger
 * button.dataset.loadingActive = '';  // start
 * delete button.dataset.loadingActive; // stop
 */

import { registerInit } from './_init-registry.js';

const SELECTOR = 'button[data-loading]';
const ENHANCED = new WeakSet();
const DEFAULT_TIMEOUT = 10000;

/** Start the loading state on a button */
function activate(btn) {
  if (btn.getAttribute('aria-busy') === 'true') return;

  // Store original content
  btn._vbLoadingOriginal = btn.innerHTML;
  btn._vbLoadingWidth = btn.offsetWidth;

  // Preserve button width to prevent layout shift
  btn.style.minInlineSize = `${btn._vbLoadingWidth}px`;

  // Build loading content. Spinner-only keeps the original label as
  // visually hidden text so the button never loses its accessible name.
  const loadingText = btn.getAttribute('data-loading');
  const spinner = document.createElement('span');
  spinner.className = 'vb-btn-spinner';
  spinner.setAttribute('aria-hidden', 'true');
  const label = document.createElement('span');
  if (loadingText) {
    label.textContent = loadingText;
  } else {
    label.className = 'visually-hidden';
    label.textContent = btn.textContent.trim();
  }
  btn.replaceChildren(spinner, ' ', label);

  // State
  btn.setAttribute('aria-busy', 'true');
  btn.setAttribute('aria-disabled', 'true');
  btn.dataset.loadingActive = '';

  // Safety timeout
  const timeout = parseInt(btn.getAttribute('data-loading-timeout'), 10) || DEFAULT_TIMEOUT;
  btn._vbLoadingTimer = setTimeout(() => deactivate(btn), timeout);
}

/** Stop the loading state on a button */
function deactivate(btn) {
  if (btn.getAttribute('aria-busy') !== 'true') return;

  clearTimeout(btn._vbLoadingTimer);

  // Restore original content
  if (btn._vbLoadingOriginal != null) {
    btn.innerHTML = btn._vbLoadingOriginal;
    delete btn._vbLoadingOriginal;
  }

  btn.style.minInlineSize = '';
  btn.removeAttribute('aria-busy');
  btn.removeAttribute('aria-disabled');
  delete btn.dataset.loadingActive;
}

/** Enhance a single button[data-loading] */
function enhance(btn) {
  if (ENHANCED.has(btn)) return;
  ENHANCED.add(btn);

  // While busy, swallow further activations (keyboard Enter/Space and
  // implicit submission still click; CSS pointer-events covers the mouse).
  btn.addEventListener('click', (e) => {
    if (btn.getAttribute('aria-busy') === 'true') {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }, true);

  // Auto-deactivate when form-coordinator clears data-submitting
  const form = btn.form;
  if (form && btn.type === 'submit') {
    const obs = new MutationObserver(() => {
      if (!form.hasAttribute('data-submitting') && btn.getAttribute('aria-busy') === 'true') {
        deactivate(btn);
      }
    });
    obs.observe(form, { attributes: true, attributeFilter: ['data-submitting'] });
  }

  // Watch for programmatic activation via data-loading-active
  const selfObs = new MutationObserver(() => {
    if (btn.hasAttribute('data-loading-active')) {
      activate(btn);
    } else if (btn.getAttribute('aria-busy') === 'true') {
      deactivate(btn);
    }
  });
  selfObs.observe(btn, { attributes: true, attributeFilter: ['data-loading-active'] });
}

/** The button that submits: the event's submitter, else the default button. */
function submitterOf(form, submitter) {
  if (submitter) return submitter;
  return [...form.elements].find(el =>
    (el instanceof HTMLButtonElement && el.type === 'submit')
    || (el instanceof HTMLInputElement && el.type === 'submit')) ?? null;
}

function maybeActivate(form, submitter) {
  const btn = submitterOf(form, submitter);
  if (btn instanceof HTMLButtonElement && btn.matches(SELECTOR)) {
    enhance(btn);
    activate(btn);
  }
}

// Activate only when a submission actually proceeds.
//  - Plain forms: the browser never fires submit for an invalid form, so any
//    submit event is a real submission — including one an author's handler
//    cancels to send it with fetch (the spinner covers that request; clear
//    it with deactivate() or let the timeout revert it).
//  - form-coordinator forms (form[data-validate], novalidate): the
//    coordinator cancels every native submit and validates itself, so the
//    native submit says nothing. Wait for its vb:beforesubmit, which fires
//    only after validation passes (every data-submit mode), unless cancelled.
//    An invalid submit therefore never starts the spinner.
// Both listeners sit on the document (bubble phase), after form handlers.
document.addEventListener('submit', (e) => {
  const form = /** @type {HTMLFormElement} */ (e.target);
  if (form.matches('[data-validate]')) return;
  maybeActivate(form, /** @type {SubmitEvent} */ (e).submitter);
});

document.addEventListener('vb:beforesubmit', (e) => {
  if (e.defaultPrevented) return;
  const { form, submitter } = /** @type {CustomEvent} */ (e).detail ?? {};
  if (form instanceof HTMLFormElement) maybeActivate(form, submitter);
});

registerInit(SELECTOR, enhance);

export { activate, deactivate };
