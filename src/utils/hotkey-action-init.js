/**
 * hotkey-action-init: Declarative keyboard shortcut binding via data attributes
 *
 * Upscales the native accesskey attribute. Scans non-<kbd> elements with
 * data-hotkey and binds keyboard shortcuts that trigger actions on the element.
 * Auto-registers with the command registry so shortcuts appear in the
 * shortcuts dialog (short-cuts component).
 *
 * @attr {string} data-hotkey        - Key combo to bind (e.g. "meta+s", "ctrl+shift+p")
 * @attr {string} data-hotkey-action - Action type: "click" (default), "focus", "submit", "toggle"
 * @attr {string} data-hotkey-label  - Description for the shortcuts dialog (defaults to textContent)
 * @attr {string} data-hotkey-group  - Group name in shortcuts dialog (default: "Page Actions")
 * @attr {boolean} data-hotkey-global - If present, fires even when user is typing in an input
 *
 * @example
 * <button data-hotkey="meta+s" data-hotkey-label="Save document">Save</button>
 * <input data-hotkey="/" data-hotkey-action="focus" data-hotkey-label="Search">
 * <details data-hotkey="meta+i" data-hotkey-action="toggle">Info panel</details>
 */

import { registerInit } from './_init-registry.js';
import { bindHotkey } from './hotkey-bind.js';

// Non-<kbd> elements with data-hotkey — <kbd> is handled by hotkey-init.js for display
const SELECTOR = '[data-hotkey]:not(kbd)';
const ENHANCED = new WeakSet();

/** @type {Map<Element, { combo: string, label: string, group: string, unbind: Function }>} */
const registry = new Map();

const ACTIONS = {
  click(el) { el.click(); },
  focus(el) { el.focus(); },
  submit(el) {
    const form = el.closest('form') || (el.tagName === 'FORM' ? el : null);
    if (form) form.requestSubmit();
  },
  toggle(el) {
    // <details> open/close, or toggle a boolean attribute
    if ('open' in el) {
      el.open = !el.open;
    } else if (el.hasAttribute('hidden')) {
      el.removeAttribute('hidden');
    } else {
      el.setAttribute('hidden', '');
    }
  },
};

/** Enhance a single element with data-hotkey binding */
function enhance(el) {
  if (ENHANCED.has(el)) return;
  ENHANCED.add(el);

  const combo = el.getAttribute('data-hotkey');
  if (!combo) return;

  const actionName = el.getAttribute('data-hotkey-action') || 'click';
  const action = ACTIONS[actionName] || ACTIONS.click;
  const isGlobal = el.hasAttribute('data-hotkey-global');
  const label = el.getAttribute('data-hotkey-label') || el.textContent?.trim() || combo;
  const group = el.getAttribute('data-hotkey-group') || 'Page Actions';

  const unbind = bindHotkey(combo, () => action(el), { global: isGlobal });

  registry.set(el, { combo, label, group, unbind });

  // Dispatch event so short-cuts / command-palette can pick it up
  document.dispatchEvent(new CustomEvent('vb:command-registry-change', {
    detail: { action: 'add', element: el }
  }));
}

/**
 * Get all hotkey-action bindings grouped by group name.
 * Compatible with the command registry format used by short-cuts.
 * @returns {Map<string, Array<{ label: string, shortcut: string, element: Element }>>}
 */
function getHotkeyActions() {
  const grouped = new Map();
  for (const [el, entry] of registry) {
    const he = /** @type {HTMLElement} */ (el);
    if (he.hidden || he.closest('[hidden]')) continue;
    const list = grouped.get(entry.group) || [];
    list.push({ label: entry.label, shortcut: entry.combo, element: el });
    grouped.set(entry.group, list);
  }
  return grouped;
}

// Expose on window for short-cuts component integration
if (typeof window !== 'undefined') {
  /** @type {any} */ (window).__hotkeyActionRegistry = { getHotkeyActions };
}

registerInit(SELECTOR, enhance);

export { getHotkeyActions };
