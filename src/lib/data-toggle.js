/**
 * data-toggle: pure attribute-flip logic.
 *
 * No DOM. The DOM-side init in src/utils/data-toggle-init.js consumes
 * these to implement the click-to-flip behavior.
 *
 * Three modes (auto-detected from the spec + attribute name):
 *
 *  1. **boolean**       — standard boolean HTML attrs (`hidden`, `disabled`,
 *                         `open`, `checked`, `readonly`). Toggle presence:
 *                         absent ↔ present.
 *  2. **aria two-state** — `aria-pressed`, `aria-expanded`, `aria-selected`,
 *                          `aria-checked`. Always present; flip the string
 *                          value `"true"` ↔ `"false"`.
 *  3. **custom**         — anything else (e.g. `data-state`). Cycle between
 *                          two explicit values supplied via
 *                          `data-toggle-on` / `data-toggle-off`. Defaults
 *                          `"true"` / `"false"`.
 *
 * Plus a `class:name` shorthand that toggles a CSS class instead of an
 * attribute (because classList toggle is the most common ad-hoc use of
 * the same shape).
 */

const BOOLEAN_ATTRS = new Set([
  'hidden', 'disabled', 'open', 'checked', 'readonly',
  'required', 'multiple', 'selected', 'autofocus', 'autoplay',
  'controls', 'defer', 'inert', 'loop', 'muted', 'nomodule',
  'novalidate', 'playsinline', 'reversed',
]);

const ARIA_TWO_STATE = new Set([
  'aria-pressed', 'aria-expanded', 'aria-selected', 'aria-checked',
]);

/**
 * @param {string|null|undefined} raw
 * @returns {{ kind: 'attr'|'class', name: string } | null}
 */
export function parseToggleSpec(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  if (!s) return null;
  if (s.startsWith('class:')) {
    const name = s.slice(6).trim();
    return name ? { kind: 'class', name } : null;
  }
  return { kind: 'attr', name: s };
}

export function isBooleanAttr(name) {
  return BOOLEAN_ATTRS.has(String(name).toLowerCase());
}

export function isAriaTwoState(name) {
  return ARIA_TWO_STATE.has(String(name).toLowerCase());
}

/**
 * Compute the next state for a toggle.
 *
 * @param {{ kind: 'attr'|'class', name: string }} spec
 * @param {boolean | string | null} current
 *   - For boolean / class modes: `true` if currently present.
 *   - For aria two-state / custom modes: the current string value (or null).
 * @param {{ on?: string, off?: string }} opts
 * @returns {{ present: boolean, value?: string }}
 *   - `present: false` → caller should remove the attribute / class.
 *   - `present: true, value` → caller should setAttribute(name, value).
 *   - `present: true` (no `value`) → boolean attr / class addition.
 */
export function nextValue(spec, current, opts) {
  if (spec.kind === 'class') {
    return current ? { present: false } : { present: true };
  }
  if (isBooleanAttr(spec.name)) {
    return current ? { present: false } : { present: true, value: '' };
  }
  if (isAriaTwoState(spec.name)) {
    const isOn = current === 'true' || current === true;
    return { present: true, value: isOn ? 'false' : 'true' };
  }
  // Custom on/off cycle.
  const on = opts.on ?? 'true';
  const off = opts.off ?? 'false';
  // Start at `on` when current is anything other than `on` (unset, off, weird).
  const next = current === on ? off : on;
  return { present: true, value: next };
}
