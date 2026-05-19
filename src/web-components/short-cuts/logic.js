import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

/**
 * short-cuts: Keyboard shortcuts help overlay
 *
 * Press ? to open a dialog listing all currently bound keyboard shortcuts.
 * Similar to GitHub's ? or Gmail's shortcut overlay.
 *
 * Reads from the command registry (registered commands with data-shortcut)
 * and displays them grouped with formatted shortcut badges.
 *
 * @example
 * <short-cuts></short-cuts>
 */

import { formatHotkey } from '../../utils/hotkey-format.js';
import { bindHotkey } from '../../utils/hotkey-bind.js';

class ShortCuts extends VBElement {
  #dialog;
  /** @type {(() => void) | null} */
  #unbindHotkey = null;

  setup() {
    this.#build();
    this.#unbindHotkey = /** @type {() => void} */ (bindHotkey('shift+?', () => {
      if (this.#dialog.open) {
        this.#dialog.close();
      } else {
        this.#open();
      }
    }));
  }

  teardown() {
    this.#unbindHotkey?.();
    this.#unbindHotkey = null;
    this.#dialog?.remove();
    this.#dialog = null;
  }

  // ── Data API (HTML-first / JS-first dual contract) ──────────────

  /**
   * Optional override for the shortcut list. When set, replaces the
   * command-registry-derived shortcuts shown in the dialog.
   * Shape: `{ [groupName]: Array<{ label, shortcut }> }`.
   *
   * Reading returns the override or `null` if the registry default is
   * in effect.
   */
  get shortcuts() { return this.__shortcuts || null; }

  set shortcuts(value) {
    this.__shortcuts = value && typeof value === 'object' ? value : null;
    this.dispatchEvent(new CustomEvent('short-cuts:shortcuts-changed', {
      detail: { shortcuts: this.__shortcuts, source: 'property' },
      bubbles: true,
    }));
  }

  #build() {
    this.#dialog = document.createElement('dialog');
    this.#dialog.className = 'shortcut-dialog';
    this.#dialog.addEventListener('click', (e) => {
      if (e.target === this.#dialog) this.#dialog.close();
    });
    this.appendChild(this.#dialog);
  }

  #open() {
    // Build content fresh each time (shortcuts may change dynamically)
    this.#dialog.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'shortcut-header';
    header.innerHTML = '<h2>Keyboard Shortcuts</h2>';
    this.#dialog.appendChild(header);

    const body = document.createElement('div');
    body.className = 'shortcut-body';

    // Gather shortcuts from the command registry
    const { getRegisteredCommands } = window.__commandRegistry || {};
    const grouped = new Map();

    // Always include ? itself
    grouped.set('General', [
      { label: 'Show keyboard shortcuts', shortcut: 'shift+?' }
    ]);

    if (getRegisteredCommands) {
      for (const [groupName, entries] of getRegisteredCommands()) {
        for (const entry of entries) {
          if (!entry.shortcut) continue;
          const list = grouped.get(groupName) || [];
          list.push({ label: entry.label, shortcut: entry.shortcut });
          grouped.set(groupName, list);
        }
      }
    }

    // Also gather from hotkey-action registry
    const { getHotkeyActions } = /** @type {any} */ (window).__hotkeyActionRegistry || {};
    if (getHotkeyActions) {
      for (const [groupName, entries] of getHotkeyActions()) {
        const list = grouped.get(groupName) || [];
        for (const entry of entries) {
          list.push({ label: entry.label, shortcut: entry.shortcut });
        }
        grouped.set(groupName, list);
      }
    }

    for (const [groupName, entries] of grouped) {
      const section = document.createElement('div');
      section.className = 'shortcut-group';

      const groupHeader = document.createElement('div');
      groupHeader.className = 'shortcut-group-header';
      groupHeader.textContent = groupName;
      section.appendChild(groupHeader);

      for (const entry of entries) {
        const row = document.createElement('div');
        row.className = 'shortcut-row';

        const label = document.createElement('span');
        label.className = 'shortcut-label';
        label.textContent = entry.label;

        const badge = document.createElement('kbd');
        badge.className = 'shortcut-kbd';
        badge.textContent = formatHotkey(entry.shortcut);

        row.appendChild(label);
        row.appendChild(badge);
        section.appendChild(row);
      }

      body.appendChild(section);
    }

    this.#dialog.appendChild(body);
    this.#dialog.showModal();
  }
}

registerComponent('short-cuts', ShortCuts);

export { ShortCuts };
