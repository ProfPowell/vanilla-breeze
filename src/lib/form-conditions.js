/**
 * form-conditions: one condition language and one field reader for
 * data-show-when / data-hide-when and data-wizard-if.
 *
 * Grammar (both separators work everywhere):
 *
 *   expr  := and ( "||" and )*
 *   and   := term ( "&&" term )*
 *   term  := "!"? name                       truthy / falsy check
 *          | name ( "=" | ":" ) "!"? value   equals / not-equals
 *          | name "!=" value                 not-equals
 *
 * `&&` binds tighter than `||`. Values are compared as strings. A field
 * with several values (checkbox group, select[multiple], a component whose
 * value is an array) matches when ANY of its values equals the target.
 *
 * Fields are read from `form.elements` when a form is given, so controls
 * associated with `form="id"` and form-associated custom elements
 * (combo-box, date-picker, star-rating …) take part; outside a form the
 * whole document is searched by `name`.
 *
 * The module also owns the "hidden section" contract shared by both
 * features: controls inside a hidden conditional section are disabled
 * (barred from validation, left out of the submitted data) and marked
 * with `data-conditional-disabled`; only marked controls are re-enabled,
 * and only when no hidden conditional ancestor remains.
 */

/** Buttons never carry a field value for conditions. */
const BUTTON_TYPES = new Set(['button', 'submit', 'reset', 'image']);

/** Marker on controls this module disabled. */
export const DISABLED_MARK = 'data-conditional-disabled';

/** Every kind of hidden conditional section (show-when and wizard-if). */
export const HIDDEN_SECTION = '[data-show-when][hidden], [data-hide-when][hidden], [data-wizard-step][data-wizard-hidden]';

const NATIVE_CONTROLS = 'input, select, textarea, button, fieldset';

/**
 * Is `el` a form-associated custom element?
 * @param {Element} el
 * @returns {boolean}
 */
export function isFormAssociatedCustom(el) {
  if (!el.localName.includes('-')) return false;
  const ctor = /** @type {any} */ (customElements.get(el.localName));
  return Boolean(ctor?.formAssociated);
}

/**
 * Name of a control: the `name` property for native controls, the
 * attribute for custom elements (which may not reflect it).
 * @param {Element} el
 * @returns {string}
 */
export function controlName(el) {
  const prop = /** @type {any} */ (el).name;
  return (typeof prop === 'string' && prop) || el.getAttribute('name') || '';
}

/**
 * Current values one control contributes (empty array = no value).
 * @param {Element} el
 * @returns {string[]}
 */
export function controlValues(el) {
  if (el instanceof HTMLButtonElement || el instanceof HTMLFieldSetElement || el instanceof HTMLOutputElement) return [];
  if (el instanceof HTMLInputElement) {
    if (BUTTON_TYPES.has(el.type)) return [];
    if (el.type === 'radio' || el.type === 'checkbox') return el.checked ? [el.value || 'on'] : [];
    if (el.type === 'file') return el.files ? [...el.files].map((f) => f.name) : [];
    return el.value === '' ? [] : [el.value];
  }
  if (el instanceof HTMLSelectElement) {
    if (el.multiple) return [...el.selectedOptions].map((o) => o.value);
    return el.value === '' ? [] : [el.value];
  }
  const value = /** @type {any} */ (el).value;
  if (Array.isArray(value)) return value.map(String).filter((v) => v !== '');
  if (value == null || value === '') return [];
  return [String(value)];
}

/**
 * Every control named `name` within `scope`.
 * @param {HTMLFormElement|Document} scope
 * @param {string} name
 * @returns {Element[]}
 */
export function fieldsNamed(scope, name) {
  if (scope instanceof HTMLFormElement) {
    return Array.from(scope.elements).filter((el) => controlName(el) === name);
  }
  return [...scope.querySelectorAll(`[name="${CSS.escape(name)}"]`)];
}

/**
 * All current values of the field `name` (checkbox groups and multi-selects
 * give several).
 * @param {HTMLFormElement|Document} scope
 * @param {string} name
 * @returns {string[]}
 */
export function readField(scope, name) {
  return fieldsNamed(scope, name).flatMap(controlValues);
}

/**
 * @typedef {{ name: string, value: string|null, negate: boolean }} Term
 * @typedef {Term[][]} Condition  OR of AND-groups
 */

/**
 * Parse one term.
 * @param {string} raw
 * @returns {Term}
 */
function parseTerm(raw) {
  const text = raw.trim();
  const sep = text.search(/[=:]/);
  if (sep === -1) {
    const negate = text.startsWith('!');
    return { name: (negate ? text.slice(1) : text).trim(), value: null, negate };
  }
  let name = text.slice(0, sep);
  let value = text.slice(sep + 1);
  let negate = false;
  if (name.startsWith('!')) { negate = true; name = name.slice(1); }
  if (name.endsWith('!')) { negate = !negate; name = name.slice(0, -1); }
  else if (value.startsWith('!')) { negate = !negate; value = value.slice(1); }
  return { name: name.trim(), value: value.trim(), negate };
}

/**
 * Parse a condition string.
 * @param {string} condition
 * @returns {Condition}
 */
export function parseCondition(condition) {
  return String(condition || '')
    .split('||')
    .map((group) => group.split('&&').map(parseTerm).filter((t) => t.name))
    .filter((group) => group.length);
}

/**
 * Field names a condition depends on.
 * @param {string} condition
 * @returns {Set<string>}
 */
export function conditionFields(condition) {
  return new Set(parseCondition(condition).flat().map((t) => t.name));
}

/**
 * @param {Term} term
 * @param {HTMLFormElement|Document} scope
 */
function evaluateTerm(term, scope) {
  const values = readField(scope, term.name);
  const hit = term.value === null ? values.length > 0 : values.includes(term.value);
  return term.negate ? !hit : hit;
}

/**
 * Evaluate a condition against the fields in `scope`. An empty condition
 * is false.
 * @param {string} condition
 * @param {HTMLFormElement|Document} scope
 * @returns {boolean}
 */
export function evaluateCondition(condition, scope) {
  return parseCondition(condition).some((group) => group.every((t) => evaluateTerm(t, scope)));
}

/**
 * Native controls plus form-associated custom elements inside (and
 * including) `section`.
 * @param {Element} section
 * @returns {Element[]}
 */
function controlsIn(section) {
  const list = [section, ...section.querySelectorAll('*')];
  return list.filter((el) => el.matches(NATIVE_CONTROLS) || isFormAssociatedCustom(el));
}

/**
 * Apply the hidden-section contract to `section`. Call after the section's
 * own hidden marker (`hidden` / `data-wizard-hidden`) has been updated.
 *
 * - hidden: disable every enabled control and mark it
 * - shown: re-enable marked controls that sit in no other hidden section
 *
 * Controls the author disabled are never touched. The `disabled` attribute
 * is used (not the property) so form-associated custom elements are covered.
 *
 * @param {Element} section
 * @param {boolean} visible
 */
export function syncSectionControls(section, visible) {
  for (const ctrl of controlsIn(section)) {
    if (visible) {
      if (!ctrl.hasAttribute(DISABLED_MARK)) continue;
      if (ctrl.closest(HIDDEN_SECTION)) continue;
      ctrl.removeAttribute('disabled');
      ctrl.removeAttribute(DISABLED_MARK);
    } else {
      if (ctrl.hasAttribute('disabled')) continue;
      ctrl.setAttribute('disabled', '');
      ctrl.setAttribute(DISABLED_MARK, '');
    }
  }
}
