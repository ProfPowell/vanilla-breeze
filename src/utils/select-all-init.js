/**
 * select-all-init: Master checkbox for bulk selection
 *
 * Enhances a checkbox with data-select-all to control a group of related
 * checkboxes. Supports indeterminate state when some items are selected.
 *
 * @attr {string} data-select-all - CSS selector for the target checkboxes
 * @attr {string} data-selected-count - On a separate element, displays the count of selected items
 *
 * @example
 * <input type="checkbox" data-select-all=".item-checkbox" aria-label="Select all">
 * <input type="checkbox" class="item-checkbox" value="1">
 * <input type="checkbox" class="item-checkbox" value="2">
 * <input type="checkbox" class="item-checkbox" value="3">
 * <span data-selected-count></span>
 */

const SELECTOR = '[data-select-all]';

/**
 * Initialize select-all checkboxes within a root element
 * @param {Element|Document} root - Root element to search within
 */
function initSelectAll(root = document) {
  root.querySelectorAll(SELECTOR).forEach(enhance);
}

/**
 * Enhance a single select-all checkbox
 * @param {HTMLInputElement} master - The master checkbox element
 */
function enhance(master) {
  if (master.hasAttribute('data-select-all-init')) return;
  master.setAttribute('data-select-all-init', '');

  const targetSelector = master.dataset.selectAll;
  if (!targetSelector) return;

  /** @returns {NodeListOf<HTMLInputElement>} */
  function getTargets() {
    const scope = master.closest('[data-select-all-scope]') || master.closest('table, form, fieldset') || document;
    return scope.querySelectorAll(targetSelector);
  }

  function syncState() {
    const targets = getTargets();
    const total = targets.length;
    let checked = 0;

    targets.forEach(cb => {
      if (cb.checked) checked++;
    });

    if (checked === 0) {
      master.checked = false;
      master.indeterminate = false;
    } else if (checked === total) {
      master.checked = true;
      master.indeterminate = false;
    } else {
      master.checked = false;
      master.indeterminate = true;
    }

    // Update any count displays
    const scope = master.closest('[data-select-all-scope]') || master.closest('table, form, fieldset') || document;
    const countEl = scope.querySelector('[data-selected-count]');
    if (countEl) {
      countEl.textContent = checked;
    }

    // Dispatch event
    master.dispatchEvent(new CustomEvent('select-all-change', {
      bubbles: true,
      detail: { checked, total, selected: [...targets].filter(cb => cb.checked) }
    }));
  }

  // Guard to prevent re-entrant syncState during bulk toggle
  let bulkUpdating = false;

  // Master checkbox toggles all targets
  master.addEventListener('change', () => {
    bulkUpdating = true;
    const isChecked = master.checked;
    const targets = getTargets();
    targets.forEach(cb => {
      cb.checked = isChecked;
      // Dispatch change event on each target for any listeners
      cb.dispatchEvent(new Event('change', { bubbles: true }));
    });
    bulkUpdating = false;
    master.indeterminate = false;
    syncState();
  });

  // Listen for changes on targets (event delegation on the scope)
  const scope = master.closest('[data-select-all-scope]') || master.closest('table, form, fieldset') || document;
  scope.addEventListener('change', (e) => {
    if (bulkUpdating) return;
    if (e.target === master) return;
    if (e.target.matches?.(targetSelector)) {
      syncState();
    }
  });

  // Initial sync
  syncState();
}

// Auto-init on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initSelectAll());
} else {
  initSelectAll();
}

// Watch for dynamically added select-all checkboxes
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      if (node.matches?.(SELECTOR)) enhance(node);
      node.querySelectorAll?.(SELECTOR).forEach(enhance);
    }
  }
});

observer.observe(document.documentElement, { childList: true, subtree: true });

export { initSelectAll };

