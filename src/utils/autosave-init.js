/**
 * autosave-init: Form draft persistence
 *
 * Saves form data to localStorage on input, restores on page load.
 * Skips password fields. Clears on submit/reset. Expires after 24 hours.
 *
 * @attr {string} data-autosave - Storage key for this form's draft
 *
 * @example
 * <form data-autosave="contact-form">
 *   <input name="name" placeholder="Name">
 *   <textarea name="message"></textarea>
 *   <button type="submit">Send</button>
 * </form>
 */

const SELECTOR = 'form[data-autosave]';
const DEBOUNCE_MS = 500;
const EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Enhance a form with autosave behavior
 * @param {HTMLFormElement} form
 */
function enhanceForm(form) {
  if (form.hasAttribute('data-autosave-init')) return;
  form.setAttribute('data-autosave-init', '');

  const key = `vb-autosave:${form.dataset.autosave}`;
  let saveTimer;

  /**
   * Collect saveable form data (skip passwords and file inputs)
   * @returns {Record<string, string>}
   */
  function collectData() {
    const data = {};
    const elements = form.elements;
    for (const el of elements) {
      if (!el.name) continue;
      if (el.type === 'password' || el.type === 'file') continue;
      if (el.type === 'checkbox') {
        data[el.name] = el.checked ? 'on' : '';
      } else if (el.type === 'radio') {
        if (el.checked) data[el.name] = el.value;
      } else {
        data[el.name] = el.value;
      }
    }
    return data;
  }

  /**
   * Save form data to localStorage
   */
  function save() {
    const data = collectData();
    const envelope = { data, timestamp: Date.now() };
    try {
      localStorage.setItem(key, JSON.stringify(envelope));
    } catch {
      // Storage full or unavailable
    }
  }

  /**
   * Restore form data from localStorage
   * @returns {boolean} Whether data was restored
   */
  function restore() {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return false;

      const envelope = JSON.parse(raw);
      if (Date.now() - envelope.timestamp > EXPIRY_MS) {
        localStorage.removeItem(key);
        return false;
      }

      const data = envelope.data;
      let restored = false;

      for (const [name, value] of Object.entries(data)) {
        const fields = form.querySelectorAll(`[name="${CSS.escape(name)}"]`);
        fields.forEach(field => {
          if (field.type === 'checkbox') {
            field.checked = value === 'on';
          } else if (field.type === 'radio') {
            field.checked = field.value === value;
          } else {
            field.value = value;
          }
        });
        if (fields.length) restored = true;
      }

      return restored;
    } catch {
      return false;
    }
  }

  /**
   * Clear saved draft
   */
  function clear() {
    localStorage.removeItem(key);
  }

  /**
   * Show a "Draft restored" notification via toast-wc if available
   */
  function notifyRestored() {
    if (customElements.get('toast-wc')) {
      const toast = document.createElement('toast-wc');
      toast.setAttribute('variant', 'info');
      toast.setAttribute('duration', '3000');
      toast.textContent = 'Draft restored';
      document.body.appendChild(toast);
    }
  }

  // Restore on init
  if (restore()) {
    notifyRestored();
    // Trigger input events so other enhancements (count, grow) update
    Array.from(form.elements).forEach(el => {
      if (el.name && el.type !== 'password' && el.type !== 'file') {
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
  }

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
      if (node.matches?.(SELECTOR)) enhanceForm(node);
      node.querySelectorAll?.(SELECTOR).forEach(enhanceForm);
    }
  }
});

observer.observe(document.documentElement, { childList: true, subtree: true });

export { initAutosave };
