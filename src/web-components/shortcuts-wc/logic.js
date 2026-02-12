/**
 * shortcuts-wc: Keyboard shortcuts help overlay
 *
 * Press ? to open a dialog listing all currently bound keyboard shortcuts.
 * Similar to GitHub's ? or Gmail's shortcut overlay.
 *
 * Reads from the command registry (registered commands with data-shortcut)
 * and displays them grouped with formatted shortcut badges.
 *
 * @example
 * <shortcuts-wc></shortcuts-wc>
 */

import { formatHotkey } from '../../utils/hotkey-format.js';
import { bindHotkey } from '../../utils/hotkey-bind.js';

class ShortcutsWc extends HTMLElement {
  #dialog;
  #unbindHotkey = null;

  connectedCallback() {
    this.#build();
    this.#unbindHotkey = bindHotkey('shift+?', () => {
      if (this.#dialog.open) {
        this.#dialog.close();
      } else {
        this.#open();
      }
    });
  }

  disconnectedCallback() {
    this.#unbindHotkey?.();
  }

  #build() {
    this.#dialog = document.createElement('dialog');
    this.#dialog.className = 'shortcuts-dialog';
    this.#dialog.addEventListener('click', (e) => {
      if (e.target === this.#dialog) this.#dialog.close();
    });
    this.appendChild(this.#dialog);
  }

  #open() {
    // Build content fresh each time (shortcuts may change dynamically)
    this.#dialog.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'shortcuts-header';
    header.innerHTML = '<h2>Keyboard Shortcuts</h2>';
    this.#dialog.appendChild(header);

    const body = document.createElement('div');
    body.className = 'shortcuts-body';

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

    for (const [groupName, entries] of grouped) {
      const section = document.createElement('div');
      section.className = 'shortcuts-group';

      const groupHeader = document.createElement('div');
      groupHeader.className = 'shortcuts-group-header';
      groupHeader.textContent = groupName;
      section.appendChild(groupHeader);

      for (const entry of entries) {
        const row = document.createElement('div');
        row.className = 'shortcuts-row';

        const label = document.createElement('span');
        label.className = 'shortcuts-label';
        label.textContent = entry.label;

        const badge = document.createElement('kbd');
        badge.className = 'shortcuts-kbd';
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

customElements.define('shortcuts-wc', ShortcutsWc);

export { ShortcutsWc };
