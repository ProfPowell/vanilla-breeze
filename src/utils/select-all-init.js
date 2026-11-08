/**
 * select-all-init: Master checkbox for bulk selection
 *
 * Enhances a checkbox with data-select-all to control a group of related
 * checkboxes. Supports indeterminate state when some items are selected.
 *
 * Scope: the nearest ancestor that is [data-select-all-scope], <table>,
 * <form> or <fieldset> (else the document). Targets are the enabled
 * matches of the selector inside the scope: disabled checkboxes are never
 * toggled and do not count toward the total.
 *
 * The master re-syncs when a target changes, after a form reset, when
 * targets are added, removed or enabled/disabled inside the scope, and
 * when data-select-all itself changes. State lives in a WeakMap, so a
 * cloned master is enhanced on its own.
 *
 * @attr {string} data-select-all - CSS selector for the target checkboxes
 * @attr {boolean} data-select-all-scope - On an ancestor: limits the search for targets and the count element
 * @attr {string} data-selected-count - On a separate element in the scope: shows the number selected (locale-formatted)
 *
 * @fires select-all:change - detail { checked, total, selected }
 *
 * @example
 * <input type="checkbox" data-select-all=".item-checkbox" aria-label="Select all">
 * <input type="checkbox" class="item-checkbox" value="1">
 * <input type="checkbox" class="item-checkbox" value="2">
 * <input type="checkbox" class="item-checkbox" value="3">
 * <output data-selected-count>0</output>
 */

import { registerInit, onFormReset } from './_init-registry.js';
import { getLocale } from '../lib/i18n.js';

const SELECTOR = '[data-select-all]';
const SCOPE_SELECTOR = '[data-select-all-scope], table, form, fieldset';

/** @type {WeakMap<HTMLInputElement, { sync: () => void }>} */
const STATE = new WeakMap();

/**
 * Initialize select-all checkboxes within a root element
 * @param {Element|Document} root - Root element to search within
 */
function initSelectAll(root = document) {
  root.querySelectorAll(SELECTOR).forEach((el) => enhance(/** @type {HTMLInputElement} */ (el)));
}

/** @param {HTMLInputElement} master */
function getScope(master) {
  return master.closest(SCOPE_SELECTOR) || document;
}

/**
 * Enabled target checkboxes for `master`.
 * @param {HTMLInputElement} master
 * @returns {HTMLInputElement[]}
 */
function getTargets(master) {
  const selector = master.dataset.selectAll ?? '';
  if (!selector) return [];
  let found;
  try { found = getScope(master).querySelectorAll(selector); } catch { return []; }
  return /** @type {HTMLInputElement[]} */ ([...found])
    .filter((cb) => cb !== master && !cb.disabled && !cb.matches(':disabled'));
}

/**
 * Enhance a single select-all checkbox
 * @param {HTMLInputElement} master - The master checkbox element
 */
function enhance(master) {
  if (STATE.has(master)) return;
  if (!(master instanceof HTMLInputElement) || master.type !== 'checkbox') return;
  // Legacy processed flag copied by cloneNode from older markup.
  master.removeAttribute('data-select-all-init');

  let bulkUpdating = false;
  let lastSignature = '';
  // Everything is torn down when the master leaves the document; a later
  // re-insertion is enhanced afresh by the init registry.
  const ac = new AbortController();
  const { signal } = ac;

  function sync() {
    if (signal.aborted) return;
    if (!master.isConnected) {
      ac.abort();
      observer.disconnect();
      STATE.delete(master);
      return;
    }
    const targets = getTargets(master);
    const total = targets.length;
    const selected = targets.filter((cb) => cb.checked);
    const checked = selected.length;

    master.checked = total > 0 && checked === total;
    master.indeterminate = checked > 0 && checked < total;

    const countEl = getScope(master).querySelector('[data-selected-count]');
    if (countEl) {
      const text = new Intl.NumberFormat(getLocale(countEl)).format(checked);
      if (countEl instanceof HTMLOutputElement) countEl.value = text;
      else countEl.textContent = text;
    }

    // Only announce real changes (the observer may re-sync with no change).
    const signature = targets.map((cb) => (cb.checked ? '1' : '0')).join('');
    if (signature === lastSignature) return;
    lastSignature = signature;
    master.dispatchEvent(new CustomEvent('select-all:change', {
      bubbles: true,
      detail: { checked, total, selected },
    }));
  }

  STATE.set(master, { sync });

  master.addEventListener('change', () => {
    bulkUpdating = true;
    const isChecked = master.checked;
    for (const cb of getTargets(master)) {
      if (cb.checked === isChecked) continue;
      cb.checked = isChecked;
      cb.dispatchEvent(new Event('change', { bubbles: true }));
    }
    bulkUpdating = false;
    sync();
  }, { signal });

  // Delegated on the scope: targets added later are covered too.
  const scope = getScope(master);
  scope.addEventListener('change', (e) => {
    if (bulkUpdating || e.target === master) return;
    const selector = master.dataset.selectAll;
    if (selector && /** @type {Element} */ (e.target).matches?.(selector)) sync();
  }, { signal });

  onFormReset(master, sync);

  // Rows added/removed/filtered, targets enabled/disabled, selector changed.
  let queued = false;
  const observer = new MutationObserver(() => {
    if (queued) return;
    queued = true;
    queueMicrotask(() => { queued = false; sync(); });
  });
  const observeRoot = scope === document ? document.body : /** @type {Element} */ (scope);
  if (observeRoot) {
    observer.observe(observeRoot, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled', 'hidden'] });
  }
  observer.observe(master, { attributes: true, attributeFilter: ['data-select-all'] });

  sync();
}

registerInit(SELECTOR, enhance);

export { initSelectAll };
