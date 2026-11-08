/**
 * conditional-init: Show/hide sections based on other fields' values
 *
 * Hidden sections get `hidden` + `inert`, and their form controls are
 * disabled (hidden/inert alone do not bar constraint validation, so a
 * hidden required field would block submit). Disabled controls are also
 * left out of the submitted data. Controls the author disabled stay
 * disabled when the section is shown again.
 *
 * Conditions use the shared language in lib/form-conditions.js (also used
 * by data-wizard-if): `name`, `!name`, `name=value`, `name!=value`,
 * `name:value`, combined with `&&` / `||`. Checkbox groups and
 * select[multiple] match when any checked/selected value equals the target.
 *
 * One capture-phase document listener serves every form (including forms
 * added later and conditions outside any form). Sections re-evaluate after
 * a form reset.
 *
 * @attr {string} data-show-when - Show when the condition is met
 * @attr {string} data-hide-when - Hide when the condition is met
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

import { registerInit, onFormReset } from './_init-registry.js';
import {
  evaluateCondition, conditionFields, controlName, syncSectionControls,
} from '../lib/form-conditions.js';

const SELECTOR = '[data-show-when], [data-hide-when]';

/** Sections wired by this module (a WeakSet, so clones are re-wired). */
const wired = new WeakSet();
let listening = false;

/** @param {Element} el */
function scopeOf(el) {
  return /** @type {HTMLFormElement|null} */ (el.closest('form')) || document;
}

/**
 * `data-show-when` wins when both attributes are present.
 * @param {HTMLElement} el
 * @returns {{ condition: string, invert: boolean }}
 */
function conditionOf(el) {
  if (el.hasAttribute('data-show-when')) return { condition: el.dataset.showWhen || '', invert: false };
  return { condition: el.dataset.hideWhen || '', invert: true };
}

/**
 * Re-evaluate one section.
 * @param {HTMLElement} el
 */
function updateVisibility(el) {
  const { condition, invert } = conditionOf(el);
  const met = evaluateCondition(condition, scopeOf(el));
  const visible = invert ? !met : met;

  if (visible) {
    el.removeAttribute('hidden');
    el.removeAttribute('inert');
  } else {
    el.setAttribute('hidden', '');
    el.setAttribute('inert', '');
  }
  syncSectionControls(el, visible);
}

/**
 * Re-evaluate every section whose scope is `scope` (and, when `name` is
 * given, whose condition references it).
 * @param {HTMLFormElement|Document} scope
 * @param {string} [name]
 */
function refresh(scope, name) {
  for (const node of document.querySelectorAll(SELECTOR)) {
    const el = /** @type {HTMLElement} */ (node);
    if (!wired.has(el) || scopeOf(el) !== scope) continue;
    if (name && !conditionFields(conditionOf(el).condition).has(name)) continue;
    updateVisibility(el);
  }
}

/** @param {Event} e */
function handleChange(e) {
  const target = /** @type {Element} */ (e.target);
  if (!(target instanceof Element)) return;
  const name = controlName(target);
  if (!name) return;
  // A control associated through form="id" belongs to that form's scope.
  const form = /** @type {any} */ (target).form || target.closest('form');
  refresh(form || document, name);
  // Sections outside any form may reference a field that lives in one.
  if (form) refresh(document, name);
}

function listen() {
  if (listening) return;
  listening = true;
  document.addEventListener('input', handleChange, true);
  document.addEventListener('change', handleChange, true);
  // Sections outside any form: re-read after any form reset.
  document.addEventListener('reset', (event) => {
    setTimeout(() => { if (!event.defaultPrevented) refresh(document); }, 0);
  }, true);
}

/**
 * Wire one conditional section.
 * @param {Element} node
 */
function enhance(node) {
  const el = /** @type {HTMLElement} */ (node);
  if (wired.has(el)) return;
  wired.add(el);
  el.setAttribute('data-conditional-init', '');
  listen();
  updateVisibility(el);
  onFormReset(el, updateVisibility);
}

/**
 * Wire every conditional section inside `root` (also done automatically
 * on load and for inserted nodes).
 * @param {Element|Document} root
 */
function initConditionalFields(root = document) {
  root.querySelectorAll(SELECTOR).forEach(enhance);
}

registerInit(SELECTOR, enhance);

export { initConditionalFields };
