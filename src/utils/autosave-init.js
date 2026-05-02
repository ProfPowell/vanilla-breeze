/**
 * autosave-init: Form draft persistence
 *
 * Saves form data to localStorage on input, restores on page load.
 * Skips password fields. Clears on submit/reset. Expires after 24 hours.
 *
 * @attr {string} data-autosave - Storage key. When empty, derived from form.method + form.action.
 * @attr {string} data-autosave-retain - Space-separated allowlist of field names to persist.
 *
 * @example
 *   <!-- Explicit key -->
 *   <form data-autosave="contact-form">…</form>
 *
 *   <!-- Auto-derived key from method + action -->
 *   <form action="/contact" method="post" data-autosave>…</form>
 *
 *   <!-- Only persist specific fields -->
 *   <form data-autosave="checkout" data-autosave-retain="name email">…</form>
 */

import { VBStore } from '../lib/vb-store.js';

const SELECTOR = 'form[data-autosave]';
const STORAGE_NS = 'autosave';
const DEBOUNCE_MS = 500;
const EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Resolve the storage key for a form.
 * Explicit `data-autosave="key"` wins. Empty/boolean falls back to method + action.
 * @param {HTMLFormElement} form
 * @returns {string}
 */
function getStorageKey(form) {
  const explicit = form.dataset.autosave;
  if (typeof explicit === 'string' && explicit.trim() !== '') {
    return explicit.trim();
  }
  const method = (form.method || 'get').toLowerCase();
  const action = form.action || (typeof location !== 'undefined' ? location.href : '');
  return `${method} ${action}`;
}

/**
 * Parse `data-autosave-retain` into a Set of allowed field names.
 * Returns null when no allowlist is configured (persist all named fields).
 * @param {HTMLFormElement} form
 * @returns {Set<string>|null}
 */
function getRetainSet(form) {
  const raw = form.dataset.autosaveRetain;
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  return new Set(trimmed.split(/\s+/));
}

/**
 * Enhance a form with autosave behavior
 * @param {HTMLFormElement} form
 */
function enhanceForm(form) {
  if (form.hasAttribute('data-autosave-init')) return;
  form.setAttribute('data-autosave-init', '');

  const key = getStorageKey(form);
  const retain = getRetainSet(form);
  let saveTimer;

  /**
   * Whether a field's name is allowed by the retain allowlist (or no list set).
   * @param {string} name
   */
  function isRetained(name) {
    return retain === null || retain.has(name);
  }

  /**
   * Collect saveable form data (skip passwords and file inputs)
   * @returns {Record<string, string | string[]>}
   */
  function collectData() {
    /** @type {Record<string, string | string[]>} */
    const data = {};
    const elements = form.elements;
    for (const el of elements) {
      const field = /** @type {HTMLInputElement} */ (el);
      if (!field.name) continue;
      if (field.type === 'password' || field.type === 'file') continue;
      if (!isRetained(field.name)) continue;
      if (field.type === 'checkbox') {
        data[field.name] = field.checked ? 'on' : '';
      } else if (field.type === 'radio') {
        if (field.checked) data[field.name] = field.value;
      } else if (field instanceof HTMLSelectElement && field.multiple) {
        data[field.name] = Array.from(field.selectedOptions).map(o => o.value);
      } else {
        data[field.name] = field.value;
      }
    }
    return data;
  }

  /**
   * Save form data through VBStore (timestamp envelope is automatic).
   */
  function save() {
    VBStore.set(STORAGE_NS, key, collectData()).catch(() => { /* ignore */ });
  }

  /**
   * Restore form data from VBStore (24-hour expiry via maxAge).
   * @returns {Promise<boolean>} Whether data was restored
   */
  async function restore() {
    const data = /** @type {Record<string, string | string[]>|null} */ (
      await VBStore.get(STORAGE_NS, key, { maxAge: EXPIRY_MS })
    );
    if (!data) return false;

    let restored = false;
    for (const [name, value] of Object.entries(data)) {
      if (!isRetained(name)) continue;
      const fields = form.querySelectorAll(`[name="${CSS.escape(name)}"]`);
      fields.forEach(f => {
        const field = /** @type {HTMLInputElement} */ (f);
        if (field.type === 'checkbox') {
          field.checked = value === 'on';
        } else if (field.type === 'radio') {
          field.checked = field.value === value;
        } else if (field instanceof HTMLSelectElement && field.multiple) {
          const values = Array.isArray(value) ? value : [value];
          Array.from(field.options).forEach(opt => {
            opt.selected = values.includes(opt.value);
          });
        } else if (typeof value === 'string') {
          field.value = value;
        }
      });
      if (fields.length) restored = true;
    }
    return restored;
  }

  /**
   * Clear saved draft (fire-and-forget)
   */
  function clear() {
    VBStore.remove(STORAGE_NS, key).catch(() => { /* ignore */ });
  }

  /**
   * Show a "Draft restored" notification via toast-msg if available
   */
  function notifyRestored() {
    if (customElements.get('toast-msg')) {
      const toast = document.createElement('toast-msg');
      toast.setAttribute('variant', 'info');
      toast.setAttribute('duration', '3000');
      toast.textContent = 'Draft restored';
      document.body.appendChild(toast);
    }
  }

  // Restore on init (async — wires listeners immediately, restores when ready)
  restore().then((didRestore) => {
    if (!didRestore) return;
    notifyRestored();
    // Trigger input events so other enhancements (count, grow) update
    Array.from(form.elements).forEach(e => {
      const el = /** @type {HTMLInputElement} */ (e);
      if (el.name && el.type !== 'password' && el.type !== 'file') {
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
  });

  // Save on input (debounced)
  form.addEventListener('input', () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, DEBOUNCE_MS);
  });

  form.addEventListener('change', () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, DEBOUNCE_MS);
  });

  // Clear on submit or reset
  form.addEventListener('submit', clear);
  form.addEventListener('reset', () => {
    // Defer clear so the reset completes first
    setTimeout(clear, 0);
  });
}

/**
 * Initialize autosave within a root
 * @param {Element|Document} root
 */
function initAutosave(root = document) {
  root.querySelectorAll(SELECTOR).forEach(enhanceForm);
}

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initAutosave());
} else {
  initAutosave();
}

// Watch for dynamically added forms
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      const el = /** @type {Element} */ (node);
      if (el.matches(SELECTOR)) enhanceForm(/** @type {HTMLFormElement} */ (el));
      el.querySelectorAll(SELECTOR).forEach(enhanceForm);
    }
  }
});

observer.observe(document.documentElement, { childList: true, subtree: true });

export { initAutosave };
