/**
 * data-toggle-init: click-to-flip-attribute upscale.
 *
 * Drop `data-toggle` on a `<button>` and clicking it flips an attribute
 * (or class) on a target. Catches the recurring "make this thing change
 * state" pattern that today fans out into ad-hoc per-page JS.
 *
 * Three modes auto-detected from the spec + attribute:
 *   - **boolean** — `hidden`, `disabled`, `open`, etc. Toggle presence.
 *   - **aria two-state** — `aria-pressed`, `aria-expanded`, etc. Flip
 *     the string value `"true"` ↔ `"false"`.
 *   - **custom** — anything else (e.g. `data-state`). Cycle between
 *     explicit `data-toggle-on` / `data-toggle-off` values.
 *
 * Plus `class:name` shorthand to toggle a CSS class.
 *
 * Overlap note (see /docs/attributes/data-toggle/):
 *   - Native `popovertarget` opens a `[popover]`. Use it for popovers.
 *   - Native `commandfor` (WICG) invokes a registered command on a
 *     target. Use it when the target advertises commands.
 *   - `data-show-when` / `data-hide-when` toggle on form-field changes.
 *   - This attribute is for the catch-all click-to-flip case where
 *     none of the above apply.
 *
 * @attr {string}  data-toggle           — attribute name to toggle, OR `class:name`
 * @attr {string}  data-toggle-target    — CSS selector for the target (default: self)
 * @attr {string}  data-toggle-on        — "on" value for custom mode (default "true")
 * @attr {string}  data-toggle-off       — "off" value for custom mode (default "false")
 *
 * @fires toggle:change                  — { spec, value, present, target }
 *
 * A11y wiring (automatic):
 *   - Sets `aria-controls` on the button to the target's id (when external).
 *   - Updates `aria-pressed` on the button after each click when the
 *     button is the target itself toggling a boolean attribute.
 *   - When the target has `[popover]` or the toggled attribute looks
 *     like `data-state`-with-on=open, sets `aria-expanded` on the button.
 */

import { registerInit } from './_init-registry.js';
import { parseToggleSpec, nextValue, isBooleanAttr, isAriaTwoState } from '../lib/data-toggle.js';

const SELECTOR = '[data-toggle]';
const ENHANCED = new WeakSet();

function enhance(button) {
  if (ENHANCED.has(button)) return;
  ENHANCED.add(button);

  const spec = parseToggleSpec(button.dataset.toggle);
  if (!spec) return;

  const targetSel = button.dataset.toggleTarget;
  const target = targetSel ? document.querySelector(targetSel) : button;
  if (!target) return;

  const isExternal = target !== button;
  if (isExternal && target.id) button.setAttribute('aria-controls', target.id);

  // Initial aria-pressed for self-toggling boolean attrs.
  if (spec.kind === 'attr' && isBooleanAttr(spec.name) && !isExternal) {
    button.setAttribute('aria-pressed', String(target.hasAttribute(spec.name)));
  }
  // Initial aria-expanded for popover-like targets.
  syncAriaExpanded(button, target, spec);

  button.addEventListener('click', (e) => {
    e.preventDefault();   // safe — buttons inside forms shouldn't submit on toggle

    const opts = {
      on:  button.dataset.toggleOn,
      off: button.dataset.toggleOff,
    };

    let current;
    if (spec.kind === 'class') {
      current = target.classList.contains(spec.name);
    } else if (isBooleanAttr(spec.name)) {
      current = target.hasAttribute(spec.name);
    } else {
      current = target.getAttribute(spec.name);
    }

    const next = nextValue(spec, current, opts);

    // Apply.
    if (spec.kind === 'class') {
      if (next.present) target.classList.add(spec.name);
      else target.classList.remove(spec.name);
    } else if (next.present) {
      target.setAttribute(spec.name, next.value ?? '');
    } else {
      target.removeAttribute(spec.name);
    }

    // a11y reflections.
    if (!isExternal && isBooleanAttr(spec.name)) {
      button.setAttribute('aria-pressed', String(next.present));
    }
    if (!isExternal && isAriaTwoState(spec.name)) {
      // The target IS the button and we just wrote aria-pressed=true/false
      // directly via the toggle — no extra reflection needed.
    }
    syncAriaExpanded(button, target, spec, next);

    button.dispatchEvent(new CustomEvent('toggle:change', {
      bubbles: true,
      detail: {
        spec: spec.kind === 'class' ? `class:${spec.name}` : spec.name,
        value: next.value,
        present: next.present,
        target,
      },
    }));
  });
}

/**
 * Set aria-expanded on the button when the target looks like a disclosure:
 *   - Has `[popover]`
 *   - Or we're toggling `data-state` with on="open" (or similar)
 *
 * `next` is optional — if absent, infers from current state.
 */
function syncAriaExpanded(button, target, spec, next) {
  if (target === button) return;
  const isPopover = target.hasAttribute('popover');
  const looksLikeOpen = spec.kind === 'attr'
    && spec.name.startsWith('data-')
    && (button.dataset.toggleOn || '').toLowerCase() === 'open';

  if (!isPopover && !looksLikeOpen) return;

  let expanded;
  if (next) {
    expanded = isPopover
      ? next.present
      : (next.value === 'open');
  } else {
    expanded = isPopover
      ? target.matches(':popover-open')
      : (target.getAttribute(spec.name) === 'open');
  }
  button.setAttribute('aria-expanded', String(expanded));
}

registerInit(SELECTOR, enhance);

export { enhance as initDataToggle };
