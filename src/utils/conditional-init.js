/**
 * conditional-init: Show/hide fields based on another field's value
 *
 * Toggles visibility of elements based on form field values.
 * Hidden elements get `hidden` + `inert`, and their form controls are
 * disabled (hidden/inert alone do not bar constraint validation, so a
 * hidden required field would block submit). Disabled controls are also
 * left out of the submitted data. Controls the author disabled stay
 * disabled when the section is shown again.
 *
 * @attr {string} data-show-when - Show when condition is met: "fieldname=value"
 * @attr {string} data-hide-when - Hide when condition is met: "fieldname=value"
 *
 * @example
 * <select name="type">
 *   <option value="personal">Personal</option>
 *   <option value="business">Business</option>
 * </select>
 * <fieldset data-show-when="type=business">
 *   <legend>Business Details</legend>
 *   <input name="company" placeholder="Company name">
 * </fieldset>
 */

const SELECTOR = '[data-show-when], [data-hide-when]';

/**
 * Parse a condition string like "fieldname=value" or "fieldname" (truthy check)
 * @param {string} condition
 * @returns {{ name: string, value: string|null }}
 */
function parseCondition(condition) {
  const eq = condition.indexOf('=');
  if (eq === -1) return { name: condition, value: null };
  return { name: condition.slice(0, eq), value: condition.slice(eq + 1) };
}

/**
 * Get the current value of a form field by name
 * @param {string} name
 * @param {HTMLFormElement|Document} scope
 * @returns {string}
 */
function getFieldValue(name, scope) {
  const fields = scope.querySelectorAll(`[name="${CSS.escape(name)}"]`);
  if (!fields.length) return '';

  const first = /** @type {HTMLInputElement} */ (fields[0]);

  // Radio group — find checked
  if (first.type === 'radio') {
    const checked = /** @type {HTMLInputElement|undefined} */ (Array.from(fields).find(f => /** @type {HTMLInputElement} */ (f).checked));
    return checked ? checked.value : '';
  }

  // Checkbox — return "true"/"false"
  if (first.type === 'checkbox') {
    return first.checked ? first.value || 'true' : '';
  }

  return first.value;
}

/**
 * Evaluate whether a condition is met
 * @param {{ name: string, value: string|null }} cond
 * @param {HTMLFormElement|Document} scope
 * @returns {boolean}
 */
function evaluateCondition(cond, scope) {
  const current = getFieldValue(cond.name, scope);
  if (cond.value === null) return current !== '';
  return current === cond.value;
}

/**
 * Update visibility of a conditional element
 * @param {HTMLElement} el
 */
function updateVisibility(el) {
  const scope = el.closest('form') || document;
  let visible;

  if (el.dataset.showWhen) {
    const cond = parseCondition(el.dataset.showWhen);
    visible = evaluateCondition(cond, scope);
  } else if (el.dataset.hideWhen) {
    const cond = parseCondition(el.dataset.hideWhen);
    visible = !evaluateCondition(cond, scope);
  }

  if (visible) {
    el.removeAttribute('hidden');
    el.removeAttribute('inert');
    enableControls(el);
  } else {
    el.setAttribute('hidden', '');
    el.setAttribute('inert', '');
    disableControls(el);
  }
}

const CONTROLS = 'input, select, textarea, button, fieldset';
const MARK = 'data-conditional-disabled';
const HIDDEN_CONDITIONAL = '[data-show-when][hidden], [data-hide-when][hidden]';

/** @param {HTMLElement} el */
function controlsIn(el) {
  const list = /** @type {HTMLInputElement[]} */ ([...el.querySelectorAll(CONTROLS)]);
  if (el.matches(CONTROLS)) list.unshift(/** @type {HTMLInputElement} */ (el));
  return list;
}

/** Disable controls in a hidden section, marking the ones we touched. */
function disableControls(el) {
  for (const ctrl of controlsIn(el)) {
    if (ctrl.disabled || ctrl.hasAttribute('disabled')) continue;
    ctrl.disabled = true;
    ctrl.setAttribute(MARK, '');
  }
}

/** Re-enable only what we disabled, and not inside another hidden section. */
function enableControls(el) {
  for (const ctrl of controlsIn(el)) {
    if (!ctrl.hasAttribute(MARK)) continue;
    if (ctrl.closest(HIDDEN_CONDITIONAL)) continue;
    ctrl.disabled = false;
    ctrl.removeAttribute(MARK);
  }
}

/**
 * Initialize conditional fields within a root
 * @param {Element|Document} root
 */
function initConditionalFields(root = document) {
  const elements = root.querySelectorAll(SELECTOR);
  elements.forEach(el => {
    if (el.hasAttribute('data-conditional-init')) return;
    el.setAttribute('data-conditional-init', '');
    updateVisibility(/** @type {HTMLElement} */ (el));
  });

  // Listen for changes on forms (event delegation)
  const forms = new Set();
  elements.forEach(el => {
    const form = el.closest('form');
    if (form && !form.hasAttribute('data-conditional-listener')) {
      form.setAttribute('data-conditional-listener', '');
      forms.add(form);
    }
  });

  // Also listen at document level for fields outside forms
  const targets = forms.size ? [...forms] : [document];
  targets.forEach(target => {
    target.addEventListener('change', handleChange);
    target.addEventListener('input', handleChange);
  });
}

function handleChange(e) {
  const name = e.target.name;
  if (!name) return;

  const scope = e.target.closest('form') || document;
  const conditionals = scope.querySelectorAll(SELECTOR);
  conditionals.forEach(el => {
    const condition = el.dataset.showWhen || el.dataset.hideWhen || '';
    const parsed = parseCondition(condition);
    if (parsed.name === name) updateVisibility(el);
  });
}

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initConditionalFields());
} else {
  initConditionalFields();
}

// Watch for dynamically added conditional elements
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      const addedEl = /** @type {Element} */ (node);
      if (addedEl.matches(SELECTOR)) {
        if (!addedEl.hasAttribute('data-conditional-init')) {
          addedEl.setAttribute('data-conditional-init', '');
          updateVisibility(/** @type {HTMLElement} */ (addedEl));
        }
      }
      addedEl.querySelectorAll(SELECTOR).forEach(el => {
        if (!el.hasAttribute('data-conditional-init')) {
          el.setAttribute('data-conditional-init', '');
          updateVisibility(/** @type {HTMLElement} */ (el));
        }
      });
    }
  }
});

observer.observe(document.documentElement, { childList: true, subtree: true });

export { initConditionalFields };
