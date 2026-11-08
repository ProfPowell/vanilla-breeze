/**
 * toggle-tags-init: Max-selection enforcement for toggle tag fieldsets
 *
 * CSS handles all visual styling via [data-toggle-tags].
 * This JS only runs when data-max is set to enforce a selection limit.
 *
 * At the limit the remaining unchecked boxes get aria-disabled="true" (not
 * the native `disabled`), so they stay in the tab order and keep their
 * names; a click or Space on one is cancelled and the limit message is
 * announced in a polite status line. Boxes the author disabled are never
 * touched. data-max is re-read when it changes, and the state re-syncs after
 * a form reset.
 *
 * Text is localizable with data-label-limit on the fieldset
 * (default "Limit reached: {max} selected. Uncheck one to choose another.").
 *
 * @attr {string} data-toggle-tags - Enable toggle tag styling (CSS-only)
 * @attr {number} data-max - Maximum number of selections allowed
 *
 * @example
 * <fieldset data-toggle-tags data-max="3">
 *   <legend>Pick up to 3</legend>
 *   <label><input type="checkbox" name="skills" value="js"> JavaScript</label>
 *   <label><input type="checkbox" name="skills" value="py"> Python</label>
 * </fieldset>
 */

import { registerInit, onFormReset } from './_init-registry.js';

const SELECTOR = 'fieldset[data-toggle-tags][data-max]';

/** Fieldsets whose listeners are wired (a clone copies markup, not this). */
const wired = new WeakSet();

/**
 * @param {HTMLFieldSetElement} fieldset
 */
function enhanceToggleTags(fieldset) {
  if (wired.has(fieldset)) return;
  wired.add(fieldset);

  // Reuse a cloned status line; otherwise add one.
  let status = /** @type {HTMLElement|null} */ (fieldset.querySelector(':scope > .toggle-tags-status'));
  if (!status) {
    status = document.createElement('p');
    status.className = 'toggle-tags-status';
    status.setAttribute('role', 'status');
    fieldset.append(status);
  }
  const statusEl = status;

  const boxes = () => /** @type {HTMLInputElement[]} */ (
    Array.from(fieldset.querySelectorAll('input[type="checkbox"]'))
  );

  const maxOf = () => {
    const max = parseInt(fieldset.dataset.max ?? '', 10);
    return max >= 1 ? max : Infinity;
  };

  const limitMessage = () => (fieldset.getAttribute('data-label-limit')
    ?? 'Limit reached: {max} selected. Uncheck one to choose another.')
    .replace('{max}', String(maxOf()));

  function update() {
    const max = maxOf();
    const all = boxes();
    const atLimit = all.filter(cb => cb.checked).length >= max;
    for (const cb of all) {
      // data-max-blocked marks the boxes this module set aria-disabled on;
      // author-set disabled / aria-disabled boxes are left alone.
      const ours = cb.hasAttribute('data-max-blocked');
      if (atLimit && !cb.checked && !cb.disabled) {
        if (!ours && cb.getAttribute('aria-disabled') === 'true') continue;
        cb.setAttribute('aria-disabled', 'true');
        cb.setAttribute('data-max-blocked', '');
      } else if (ours) {
        cb.removeAttribute('aria-disabled');
        cb.removeAttribute('data-max-blocked');
      }
    }
    const text = atLimit ? limitMessage() : '';
    if (statusEl.textContent !== text) statusEl.textContent = text;
  }

  // Cancel the toggle on a blocked box (click covers mouse, label and Space).
  fieldset.addEventListener('click', (e) => {
    const cb = /** @type {HTMLElement} */ (e.target);
    if (!(cb instanceof HTMLInputElement) || !cb.hasAttribute('data-max-blocked')) return;
    e.preventDefault();
    // Re-announce: clear, then set on the next frame.
    statusEl.textContent = '';
    requestAnimationFrame(() => { statusEl.textContent = limitMessage(); });
  });

  fieldset.addEventListener('change', update);
  new MutationObserver(update).observe(fieldset, { attributes: true, attributeFilter: ['data-max'] });
  onFormReset(fieldset, update);
  update();
}

/**
 * @param {Element|Document} root
 */
function initToggleTags(root = document) {
  root.querySelectorAll(SELECTOR).forEach(el => enhanceToggleTags(/** @type {HTMLFieldSetElement} */ (el)));
}

registerInit(SELECTOR, enhanceToggleTags);

export { initToggleTags };
