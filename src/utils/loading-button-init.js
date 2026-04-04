/**
 * loading-button-init: Upscale disabled → loading state with spinner
 *
 * Enhances buttons with data-loading to show a spinner, set aria-busy,
 * and prevent double-submit. Auto-activates on form submit for submit
 * buttons. Auto-reverts when the form completes or after a timeout.
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

  // Build loading content
  const loadingText = btn.getAttribute('data-loading');
  const spinner = '<span class="vb-btn-spinner" aria-hidden="true"></span>';
  btn.innerHTML = loadingText ? `${spinner} ${loadingText}` : spinner;

  // State
  btn.setAttribute('aria-busy', 'true');
  btn.disabled = true;
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
  btn.disabled = false;
  delete btn.dataset.loadingActive;
}

/** Enhance a single button[data-loading] */
function enhance(btn) {
  if (ENHANCED.has(btn)) return;
  ENHANCED.add(btn);

  // Auto-activate on ancestor form submit (for submit buttons)
  const form = btn.closest('form');
  if (form && (btn.type === 'submit' || !btn.type)) {
    form.addEventListener('submit', () => activate(btn));

    // Auto-deactivate when form-coordinator clears data-submitting
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

registerInit(SELECTOR, enhance);

export { activate, deactivate };
