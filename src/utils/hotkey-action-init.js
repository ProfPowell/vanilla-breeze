/**
 * hotkey-action-init: Declarative keyboard shortcut binding via data attributes
 *
 * Upscales the native accesskey attribute. Scans non-<kbd> elements with
 * data-hotkey and binds keyboard shortcuts that trigger actions on the element.
 * Auto-registers with the command registry so shortcuts appear in the
 * shortcuts dialog (short-cuts component).
 *
 * Lifecycle: a binding is dropped when its element leaves the document,
 * re-made when data-hotkey* attributes change, and skipped while the element
 * is hidden, inert or disabled. Bound elements get aria-keyshortcuts (unless
 * the author set one).
 *
 * WCAG 2.1.4: unscoped single-character shortcuts ("/", "?", "j") stop
 * firing when the user turns character-key shortcuts off (settings-panel,
 * or <html data-char-shortcuts="off">). Scope them with data-hotkey-scope
 * to keep them active only while focus is inside a region.
 *
 * @attr {string} data-hotkey        - Key combo to bind (e.g. "meta+s", "ctrl+shift+p", "?", "esc")
 * @attr {string} data-hotkey-action - Action type: "click" (default), "focus", "submit", "toggle"
 * @attr {string} data-hotkey-label  - Description for the shortcuts dialog (defaults to the accessible name, without <kbd> hints)
 * @attr {string} data-hotkey-group  - Group name in shortcuts dialog (default: "Page Actions")
 * @attr {boolean} data-hotkey-global - If present, fires even when user is typing in an input
 * @attr {string} data-hotkey-scope  - CSS selector of a region (nearest matching ancestor, else first match);
 *                                     the shortcut fires only while focus is inside it. Empty = the element itself.
 *
 * @example
 * <button data-hotkey="meta+s" data-hotkey-label="Save document">Save</button>
 * <input data-hotkey="/" data-hotkey-action="focus" data-hotkey-label="Search">
 * <details data-hotkey="meta+i" data-hotkey-action="toggle">Info panel</details>
 */

import { registerInit } from './_init-registry.js';
import { bindHotkey } from './hotkey-bind.js';
import { toAriaKeyShortcuts, isCharacterShortcut } from './hotkey-format.js';

// Non-<kbd> elements with data-hotkey — <kbd> is handled by hotkey-init.js for display
const SELECTOR = '[data-hotkey]:not(kbd)';
const WATCHED = ['data-hotkey', 'data-hotkey-action', 'data-hotkey-label', 'data-hotkey-group', 'data-hotkey-global', 'data-hotkey-scope'];

/**
 * @typedef {{ combo: string, label: string, group: string, scoped: boolean, character: boolean, unbind: Function, ownsAria: boolean }} Entry
 */

/** @type {Map<Element, Entry>} */
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

/**
 * Text of `el` without <kbd> shortcut hints or hidden helper text.
 * @param {Element} el
 */
function visibleText(el) {
  const copy = /** @type {Element} */ (el.cloneNode(true));
  copy.querySelectorAll('kbd, [aria-hidden="true"], .visually-hidden').forEach((n) => n.remove());
  return (copy.textContent || '').replace(/\s+/g, ' ').trim();
}

/**
 * The label shown in the shortcuts dialog.
 * @param {HTMLElement} el
 */
function labelFor(el) {
  const explicit = el.getAttribute('data-hotkey-label') || el.getAttribute('aria-label');
  if (explicit) return explicit.trim();
  const labelledby = el.getAttribute('aria-labelledby');
  if (labelledby) {
    const text = labelledby.split(/\s+/).map((id) => document.getElementById(id)?.textContent?.trim()).filter(Boolean).join(' ');
    if (text) return text;
  }
  const labels = /** @type {any} */ (el).labels;
  if (labels?.length) return visibleText(labels[0]);
  if (el.tagName === 'DETAILS') {
    const summary = el.querySelector(':scope > summary');
    if (summary) return visibleText(summary);
  }
  return visibleText(el) || el.getAttribute('placeholder') || el.getAttribute('title') || '';
}

/**
 * Hidden, inert or disabled targets don't fire and aren't listed.
 * @param {Element} el
 */
function isAvailable(el) {
  if (!el.isConnected) return false;
  // "toggle" may show/hide the element itself: only its ancestors count.
  const from = el.getAttribute('data-hotkey-action') === 'toggle' ? el.parentElement : el;
  if (from?.closest('[hidden], [inert]')) return false;
  if (/** @type {any} */ (el).disabled === true || el.matches(':disabled')) return false;
  return true;
}

/** @param {HTMLElement} el */
function resolveScope(el) {
  if (!el.hasAttribute('data-hotkey-scope')) return null;
  const selector = el.getAttribute('data-hotkey-scope')?.trim();
  if (!selector) return el;
  try {
    return el.closest(selector) || document.querySelector(selector) || el;
  } catch {
    return el;
  }
}

function announceChange(action, el) {
  document.dispatchEvent(new CustomEvent('vb:command-registry-change', {
    detail: { action, element: el }
  }));
}

/**
 * @param {Element} el
 * @param {{ notify?: boolean }} [options] - notify: dispatch vb:command-registry-change
 */
function unbindElement(el, { notify = true } = {}) {
  const entry = registry.get(el);
  if (!entry) return;
  entry.unbind();
  registry.delete(el);
  if (entry.ownsAria) el.removeAttribute('aria-keyshortcuts');
  if (notify) announceChange('remove', el);
}

/**
 * Enhance a single element with data-hotkey binding
 * @param {HTMLElement} el
 */
function enhance(el) {
  if (registry.has(el) || el.tagName === 'KBD' || !el.isConnected) return;

  const combo = el.getAttribute('data-hotkey')?.trim();
  if (!combo) return;

  const actionName = el.getAttribute('data-hotkey-action') || 'click';
  const action = ACTIONS[actionName] || ACTIONS.click;
  const isGlobal = el.hasAttribute('data-hotkey-global');
  const scope = resolveScope(el);
  const group = el.getAttribute('data-hotkey-group') || 'Page Actions';

  const unbind = bindHotkey(combo, () => {
    if (!el.isConnected) { unbindElement(el); return; }
    action(el);
  }, {
    global: isGlobal,
    scope,
    enabled: () => {
      if (!el.isConnected) { queueMicrotask(() => unbindElement(el)); return false; }
      return isAvailable(el);
    },
  });

  // The author's aria-keyshortcuts wins (it may list several combos).
  // (A clone carries the value we generated: still ours.)
  const aria = toAriaKeyShortcuts(combo);
  const ownsAria = !el.hasAttribute('aria-keyshortcuts') || el.getAttribute('aria-keyshortcuts') === aria;
  if (ownsAria) el.setAttribute('aria-keyshortcuts', aria);

  registry.set(el, {
    combo,
    label: labelFor(el) || combo,
    group,
    scoped: !!scope,
    character: isCharacterShortcut(combo),
    unbind,
    ownsAria,
  });

  // Dispatch event so short-cuts / command-palette can pick it up
  announceChange('add', el);
}

/** Drop bindings whose elements left the document. */
function sweep() {
  for (const el of [...registry.keys()]) {
    if (!el.isConnected) unbindElement(el);
  }
}

/**
 * Get all hotkey-action bindings grouped by group name.
 * Compatible with the command registry format used by short-cuts.
 * Entries carry `scoped` and `character` so the dialog can leave out
 * shortcuts that are switched off.
 * @returns {Map<string, Array<{ label: string, shortcut: string, element: Element, scoped: boolean, character: boolean }>>}
 */
function getHotkeyActions() {
  const grouped = new Map();
  for (const [el, entry] of registry) {
    if (!isAvailable(el)) continue;
    const list = grouped.get(entry.group) || [];
    list.push({ label: entry.label, shortcut: entry.combo, element: el, scoped: entry.scoped, character: entry.character });
    grouped.set(entry.group, list);
  }
  return grouped;
}

// Expose on window for short-cuts component integration
if (typeof window !== 'undefined') {
  /** @type {any} */ (window).__hotkeyActionRegistry = { getHotkeyActions };
}

registerInit(SELECTOR, enhance);

// Removals unbind; attribute edits rebind.
if (typeof document !== 'undefined') {
  new MutationObserver((mutations) => {
    let removed = false;
    /** @type {Set<HTMLElement>} */
    const changed = new Set();
    for (const m of mutations) {
      if (m.type === 'childList' && m.removedNodes.length) removed = true;
      if (m.type === 'attributes') changed.add(/** @type {HTMLElement} */ (m.target));
    }
    if (removed) sweep();
    for (const el of changed) {
      if (el.tagName === 'KBD') continue;
      unbindElement(el, { notify: false });
      if (el.hasAttribute('data-hotkey')) enhance(el);
      else announceChange('remove', el);
    }
  }).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: WATCHED });
}

export { getHotkeyActions };
