/**
 * _persist-filter: which form controls may be written to client storage
 *
 * Shared by data-autosave and data-wizard-persist. A control is persistable
 * unless it is one of:
 *   - type="password" | "hidden" | "file"
 *   - a button: <button>, input[type=submit|button|reset|image]
 *   - not a value control: <fieldset>, <output>, <object>
 *   - autocomplete="off"
 *   - autocomplete naming a secret: cc-number, cc-csc, cc-exp, cc-exp-month,
 *     cc-exp-year, one-time-code, new-password, current-password (the token
 *     can sit anywhere in the list, e.g. "billing cc-number")
 *   - marked data-autosave-ignore, or inside a [data-autosave-ignore] container
 *
 * Duck-typed (localName / type / getAttribute / closest) so it also accepts
 * form-associated custom elements and plain objects in unit tests.
 *
 * @example
 * import { isPersistable } from './_persist-filter.js';
 * for (const el of form.elements) if (el.name && isPersistable(el)) save(el);
 */

const SKIP_TYPES = new Set(['password', 'hidden', 'file', 'submit', 'button', 'reset', 'image']);
const SKIP_TAGS = new Set(['button', 'fieldset', 'output', 'object']);
const SECRET_TOKENS = new Set([
  'cc-number', 'cc-csc', 'cc-exp', 'cc-exp-month', 'cc-exp-year',
  'one-time-code', 'new-password', 'current-password',
]);

/**
 * @param {Element | null | undefined} control
 * @returns {boolean}
 */
export function isPersistable(control) {
  if (!control) return false;
  const el = /** @type {any} */ (control);
  const tag = String(el.localName ?? el.tagName ?? '').toLowerCase();
  if (SKIP_TAGS.has(tag)) return false;

  const type = tag === 'input'
    ? String(el.type ?? el.getAttribute?.('type') ?? 'text').toLowerCase()
    : '';
  if (SKIP_TYPES.has(type)) return false;

  const autocomplete = String(el.getAttribute?.('autocomplete') ?? '').trim().toLowerCase();
  if (autocomplete === 'off') return false;
  if (autocomplete && autocomplete.split(/\s+/).some((t) => SECRET_TOKENS.has(t))) return false;

  if (el.hasAttribute?.('data-autosave-ignore')) return false;
  if (el.closest?.('[data-autosave-ignore]')) return false;

  return true;
}
