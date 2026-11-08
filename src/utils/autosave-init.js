/**
 * autosave-init: Form draft persistence
 *
 * Saves form data through VBStore (localStorage key `vb:autosave:{key}`,
 * envelope `{ data, timestamp }`) on input, restores it on page load, and
 * deletes drafts older than 24 hours instead of restoring them. Clears on
 * submit and reset.
 *
 * Never stored, never restored (shared filter, src/utils/_persist-filter.js):
 * password/hidden/file inputs, buttons, autocomplete="off", secret
 * autocomplete tokens (cc-number, cc-csc, cc-exp*, one-time-code,
 * new-password, current-password) and anything marked data-autosave-ignore
 * (or inside a [data-autosave-ignore] container). Restore also skips
 * readonly and disabled controls.
 *
 * @attr {string} data-autosave - Storage key. When empty, derived from form.method + form.action.
 * @attr {string} data-autosave-retain - Space-separated allowlist of field names to persist.
 * @attr {string} data-label-restored - Announcement after a draft is restored (default "Draft restored").
 * @attr {boolean} data-autosave-ignore - On a control or container: never persist it.
 *
 * @fires autosave:restore - On the form after a draft was applied. detail: { key, fields } (restored field names).
 *
 * @example
 *   <form data-autosave="contact-form">…</form>
 *   <form action="/contact" method="post" data-autosave>…</form>
 *   <form data-autosave="checkout" data-autosave-retain="name email">…</form>
 */

import { VBStore } from '../lib/vb-store.js';
import { registerInit } from './_init-registry.js';
import { isPersistable } from './_persist-filter.js';

const SELECTOR = 'form[data-autosave]';
const STORAGE_NS = 'autosave';
const DEBOUNCE_MS = 500;
const EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

/** Forms actually wired by this module (the attribute flag survives cloning). */
/** @type {WeakSet<HTMLFormElement>} */
const wired = new WeakSet();

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
  if (wired.has(form)) return;
  wired.add(form);
  form.setAttribute('data-autosave-init', '');

  const key = getStorageKey(form);
  const retain = getRetainSet(form);
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let saveTimer;

  /**
   * Named, persistable controls the allowlist accepts.
   * @returns {any[]}
   */
  function fields() {
    return Array.from(form.elements).filter((el) => {
      const name = /** @type {any} */ (el).name;
      return name && (retain === null || retain.has(name)) && isPersistable(el);
    });
  }

  /**
   * Collect saveable form data. Checkboxes are stored per name as an array
   * of checked values, so a group sharing one name round-trips.
   * @returns {Record<string, string | string[]>}
   */
  function collectData() {
    /** @type {Record<string, string | string[]>} */
    const data = {};
    for (const field of fields()) {
      if (field.disabled) continue; // not submitted, and restore skips it
      const { name } = field;
      if (field.type === 'checkbox') {
        const list = /** @type {string[]} */ (Array.isArray(data[name]) ? data[name] : (data[name] = []));
        if (field.checked) list.push(field.value);
      } else if (field.type === 'radio') {
        if (field.checked) data[name] = field.value;
      } else if (field instanceof HTMLSelectElement && field.multiple) {
        data[name] = Array.from(field.selectedOptions).map((o) => o.value);
      } else if (typeof field.value === 'string') {
        data[name] = field.value;
      }
    }
    return data;
  }

  function save() {
    saveTimer = undefined;
    VBStore.set(STORAGE_NS, key, collectData()).catch(() => { /* ignore */ });
  }

  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, DEBOUNCE_MS);
  }

  function cancelSave() {
    clearTimeout(saveTimer);
    saveTimer = undefined;
  }

  /**
   * Apply the stored draft. Writable, persistable controls only.
   * @returns {Promise<any[]>} The controls that were written
   */
  async function restore() {
    const data = /** @type {Record<string, string | string[]>|null} */ (
      await VBStore.get(STORAGE_NS, key, { maxAge: EXPIRY_MS })
    );
    if (!data || typeof data !== 'object') {
      // Missing, unreadable or older than 24h: make sure nothing lingers.
      VBStore.remove(STORAGE_NS, key).catch(() => { /* ignore */ });
      return [];
    }

    const touched = [];
    for (const field of fields()) {
      if (!Object.hasOwn(data, field.name)) continue;
      if (field.disabled || field.readOnly) continue;
      const value = data[field.name];
      const values = Array.isArray(value) ? value : [value];
      if (field.type === 'checkbox') {
        field.checked = values.includes(field.value);
      } else if (field.type === 'radio') {
        field.checked = field.value === value;
      } else if (field instanceof HTMLSelectElement && field.multiple) {
        for (const opt of field.options) opt.selected = values.includes(opt.value);
      } else if (typeof value === 'string') {
        field.value = value;
      } else {
        continue;
      }
      touched.push(field);
    }
    return touched;
  }

  function clear() {
    cancelSave();
    VBStore.remove(STORAGE_NS, key).catch(() => { /* ignore */ });
  }

  /**
   * Announce the restore: through the page's <toast-msg> stack when that
   * component is registered, otherwise through a polite status region
   * appended to the form so screen-reader users still learn that fields
   * were pre-filled.
   */
  function notifyRestored() {
    const message = form.dataset.labelRestored || 'Draft restored';
    if (customElements.get('toast-msg')) {
      let host = /** @type {any} */ (document.querySelector('toast-msg'));
      if (!host) {
        host = document.createElement('toast-msg');
        document.body.appendChild(host);
      }
      if (typeof host.show === 'function') {
        host.show({ message, variant: 'info', duration: 3000, source: 'autosave' });
        return;
      }
    }
    let status = /** @type {HTMLElement|null} */ (form.querySelector(':scope > [data-autosave-status]'));
    if (!status) {
      status = document.createElement('span');
      status.className = 'visually-hidden';
      status.setAttribute('role', 'status');
      status.setAttribute('data-autosave-status', '');
      form.append(status);
    }
    status.textContent = '';
    const region = status;
    requestAnimationFrame(() => { region.textContent = message; });
  }

  // Restore on init (async: listeners are wired immediately)
  restore().then((touched) => {
    if (!touched.length) return;
    notifyRestored();
    // Let other enhancements (count, grow, show-when) catch up.
    for (const el of touched) {
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
    // The events above schedule a save of the same data; it is harmless but
    // unnecessary.
    cancelSave();
    form.dispatchEvent(new CustomEvent('autosave:restore', {
      bubbles: true,
      detail: { key, fields: [...new Set(touched.map((el) => el.name))] },
    }));
  });

  form.addEventListener('input', scheduleSave);
  form.addEventListener('change', scheduleSave);

  // Submit: drop the draft and any pending save, so a debounced save cannot
  // write the sent data back (fetch submits keep the page alive).
  form.addEventListener('submit', clear);

  // Reset: cancel the pending save now; drop the draft once the reset has
  // actually happened (a cancelled reset keeps it).
  form.addEventListener('reset', (event) => {
    cancelSave();
    setTimeout(() => {
      if (!event.defaultPrevented) clear();
    }, 0);
  });
}

/**
 * Initialize autosave within a root
 * @param {Element|Document} root
 */
function initAutosave(root = document) {
  root.querySelectorAll(SELECTOR).forEach((form) => enhanceForm(/** @type {HTMLFormElement} */ (form)));
}

registerInit(SELECTOR, enhanceForm);

export { initAutosave };
