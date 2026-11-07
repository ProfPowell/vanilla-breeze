import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

/**
 * short-cuts: Keyboard shortcuts help overlay
 *
 * Press ? (Shift+/) to open a dialog listing all currently bound keyboard
 * shortcuts. Similar to GitHub's ? or Gmail's shortcut overlay.
 *
 * Sources, in order: the component's own hotkey ("General"), then either
 * the `shortcuts` property (when set, it replaces the registries) or the
 * command registry ([data-command][data-shortcut]) and the data-hotkey
 * action registry ([data-hotkey] elements, grouped by data-hotkey-group,
 * default "Page Actions").
 *
 * WCAG 2.1.4: the ? hotkey is a character-key shortcut, so it can be
 * remapped (hotkey="alt+k") or turned off (hotkey="none"). It also stops
 * firing while the user has character-key shortcuts turned off
 * (settings-panel → Accessibility, <html data-char-shortcuts="off">); the
 * dialog then leaves out every unscoped character-key shortcut, since none
 * of them work. The dialog can always be opened from script or a button
 * via show()/toggle().
 *
 * @attr {string} hotkey             - Key combo that toggles the dialog (default "shift+?"); "none" disables it
 * @attr {string} data-label-title   - Dialog heading (default "Keyboard shortcuts")
 * @attr {string} data-label-general - Group of the component's own shortcut (default "General")
 * @attr {string} data-label-self    - Label of the component's own shortcut (default "Show keyboard shortcuts")
 * @attr {string} data-label-close   - Close button name (default "Close")
 *
 * @fires short-cuts:shortcuts-changed - detail { shortcuts, source }
 *
 * @example
 * <short-cuts></short-cuts>
 *
 * @example Remap or disable the character-key shortcut
 * <short-cuts hotkey="alt+shift+k"></short-cuts>
 * <short-cuts hotkey="none"></short-cuts>
 * // pointer/touch: myButton.addEventListener('click', () => shortCuts.show());
 */

import { isMac, formatHotkey, splitHotkey, describeKey, isCharacterShortcut } from '../../utils/hotkey-format.js';
import { bindHotkey } from '../../utils/hotkey-bind.js';
import { charShortcutsEnabled, CHAR_SHORTCUTS_EVENT } from '../../lib/char-shortcuts.js';

const DEFAULT_HOTKEY = 'shift+?';
const LABELS = {
  title: 'Keyboard shortcuts',
  general: 'General',
  self: 'Show keyboard shortcuts',
  close: 'Close',
};

let seq = 0;

class ShortCuts extends VBElement {
  static get observedAttributes() { return ['hotkey']; }

  /** @type {HTMLDialogElement | null} */
  #dialog = null;
  /** @type {HTMLElement | null} */
  #body = null;
  /** @type {(() => void) | null} */
  #unbindHotkey = null;
  /** @type {Record<string, Array<{ label: string, shortcut: string }>> | null} */
  #shortcuts = null;

  setup() {
    this.#build();
    this.#bind();
    // The preference toggles at runtime: re-render an open list.
    this.listen(window, CHAR_SHORTCUTS_EVENT, () => { if (this.#dialog?.open) this.#render(); });
  }

  teardown() {
    this.#unbindHotkey?.();
    this.#unbindHotkey = null;
    this.#dialog?.remove();
    this.#dialog = null;
    this.#body = null;
  }

  /**
   * @param {string} name
   * @param {string | null} oldValue
   * @param {string | null} newValue
   */
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'hotkey' && oldValue !== newValue && this.hasAttribute('data-upgraded')) this.#bind();
  }

  // ── Public API ─────────────────────────────────────────────────

  /** Open the dialog (rebuilds the list from the current sources). */
  show() {
    if (!this.#dialog) return;
    this.#render();
    if (!this.#dialog.open) this.#dialog.showModal();
  }

  /** Close the dialog. */
  close() {
    if (this.#dialog?.open) this.#dialog.close();
  }

  /** Open when closed, close when open. */
  toggle() {
    if (this.#dialog?.open) this.close();
    else this.show();
  }

  /**
   * Whether the dialog is open.
   * @returns {boolean}
   */
  get open() {
    return !!this.#dialog?.open;
  }

  /**
   * The active hotkey combo, or null when disabled with hotkey="none".
   * @returns {string | null}
   */
  get hotkey() {
    const value = (this.getAttribute('hotkey') ?? '').trim();
    if (value.toLowerCase() === 'none') return null;
    return value || DEFAULT_HOTKEY;
  }

  // ── Data API (HTML-first / JS-first dual contract) ──────────────

  /**
   * Optional override for the shortcut list. When set, replaces the
   * registry-derived shortcuts shown in the dialog (the component's own
   * hotkey is still listed). Shape: `{ [groupName]: Array<{ label, shortcut }> }`.
   * Reading returns the override, or `null` while the registries are in effect.
   *
   * @returns {Record<string, Array<{ label: string, shortcut: string }>>|null}
   */
  get shortcuts() { return this.#shortcuts; }

  set shortcuts(value) {
    this.#shortcuts = value && typeof value === 'object' ? value : null;
    if (this.#dialog?.open) this.#render();
    this.dispatchEvent(new CustomEvent('short-cuts:shortcuts-changed', {
      detail: { shortcuts: this.#shortcuts, source: 'property' },
      bubbles: true,
    }));
  }

  // ── Internals ──────────────────────────────────────────────────

  /** @param {keyof typeof LABELS} key */
  #label(key) {
    return this.getAttribute(`data-label-${key}`) || LABELS[key];
  }

  #bind() {
    this.#unbindHotkey?.();
    this.#unbindHotkey = null;
    const combo = this.hotkey;
    if (!combo) return;
    this.#unbindHotkey = /** @type {() => void} */ (bindHotkey(combo, () => this.toggle()));
  }

  #build() {
    // Reuse a surviving dialog (teardown removes it, but be safe).
    this.querySelector(':scope > dialog.shortcut-dialog')?.remove();

    const id = `short-cuts-title-${++seq}`;
    const dialog = document.createElement('dialog');
    dialog.className = 'shortcut-dialog';
    dialog.setAttribute('aria-labelledby', id);

    const header = document.createElement('header');
    header.className = 'shortcut-header';
    const h2 = document.createElement('h2');
    h2.id = id;
    h2.textContent = this.#label('title');
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'shortcut-close';
    close.setAttribute('aria-label', this.#label('close'));
    const icon = document.createElement('icon-wc');
    icon.setAttribute('name', 'x');
    icon.setAttribute('size', 'sm');
    icon.setAttribute('aria-hidden', 'true');
    close.appendChild(icon);
    close.addEventListener('click', () => this.close());
    header.append(h2, close);

    const body = document.createElement('section');
    body.className = 'shortcut-body';

    dialog.append(header, body);
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) dialog.close();
    });

    this.#dialog = dialog;
    this.#body = body;
    this.appendChild(dialog);
  }

  /** @returns {Map<string, Array<{ label: string, shortcut: string }>>} */
  #collect() {
    /** @type {Map<string, Array<{ label: string, shortcut: string }>>} */
    const grouped = new Map();

    // Character-key shortcuts that are switched off are not listed.
    const charOff = !charShortcutsEnabled();
    /**
     * @param {string} combo
     * @param {boolean} [scoped]
     */
    const works = (combo, scoped = false) => !(charOff && !scoped && isCharacterShortcut(combo));

    const own = this.hotkey;
    if (own && works(own)) grouped.set(this.#label('general'), [{ label: this.#label('self'), shortcut: own }]);

    /**
     * @param {string} group
     * @param {{ label: string, shortcut: string, scoped?: boolean }} entry
     */
    const add = (group, entry) => {
      if (!entry?.shortcut) return;
      if (!works(String(entry.shortcut), !!entry.scoped)) return;
      const list = grouped.get(group) || [];
      list.push({ label: String(entry.label ?? ''), shortcut: String(entry.shortcut) });
      grouped.set(group, list);
    };

    if (this.#shortcuts) {
      for (const [group, entries] of Object.entries(this.#shortcuts)) {
        if (Array.isArray(entries)) entries.forEach((entry) => add(group, entry));
      }
      return grouped;
    }

    // Command registry: [data-command][data-shortcut]
    const { getRegisteredCommands } = /** @type {any} */ (window).__commandRegistry || {};
    if (getRegisteredCommands) {
      for (const [group, entries] of getRegisteredCommands()) {
        for (const entry of entries) add(group, entry);
      }
    }

    // Hotkey-action registry: [data-hotkey] on non-kbd elements
    const { getHotkeyActions } = /** @type {any} */ (window).__hotkeyActionRegistry || {};
    if (getHotkeyActions) {
      for (const [group, entries] of getHotkeyActions()) {
        for (const entry of entries) add(group, entry);
      }
    }

    return grouped;
  }

  /** A kbd badge with visible platform glyphs and a spoken name. @param {string} combo */
  #badge(combo) {
    const kbd = document.createElement('kbd');
    kbd.className = 'shortcut-kbd';
    const visible = document.createElement('span');
    visible.setAttribute('aria-hidden', 'true');
    visible.textContent = formatHotkey(combo);
    const spoken = document.createElement('span');
    spoken.className = 'visually-hidden';
    spoken.textContent = splitHotkey(combo).map((k) => describeKey(k, isMac).spoken).join(' ');
    kbd.append(visible, spoken);
    return kbd;
  }

  #render() {
    if (!this.#body) return;
    this.#body.replaceChildren();

    for (const [group, entries] of this.#collect()) {
      if (!entries.length) continue;
      const section = document.createElement('section');
      section.className = 'shortcut-group';

      const heading = document.createElement('h3');
      heading.className = 'shortcut-group-header';
      heading.textContent = group;

      const list = document.createElement('dl');
      list.className = 'shortcut-list';
      for (const entry of entries) {
        const row = document.createElement('div');
        row.className = 'shortcut-row';
        const dt = document.createElement('dt');
        dt.className = 'shortcut-label';
        dt.textContent = entry.label;
        const dd = document.createElement('dd');
        dd.appendChild(this.#badge(entry.shortcut));
        row.append(dt, dd);
        list.appendChild(row);
      }

      section.append(heading, list);
      this.#body.appendChild(section);
    }
  }
}

registerComponent('short-cuts', ShortCuts);

export { ShortCuts };
