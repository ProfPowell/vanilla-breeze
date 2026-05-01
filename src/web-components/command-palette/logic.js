/**
 * command-palette: Command palette / Cmd+K launcher
 *
 * Searchable, keyboard-navigable list of commands in a modal dialog.
 * Supports groups, keyboard shortcuts, and fuzzy filtering.
 * When discover is set, also shows commands from [data-command] elements.
 *
 * @attr {string} hotkey - Global keyboard shortcut to open (default: "meta+k")
 * @attr {string} placeholder - Search input placeholder text
 * @attr {boolean} discover - When present, auto-populate from [data-command] registry
 *
 * @example
 * <command-palette hotkey="meta+k" discover>
 *   <command-group label="Navigation">
 *     <command-item value="home">Go Home</command-item>
 *     <command-item value="settings">Settings</command-item>
 *   </command-group>
 * </command-palette>
 */

import { formatHotkey } from '../../utils/hotkey-format.js';
import { bindHotkey } from '../../utils/hotkey-bind.js';
import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

class CommandPalette extends VBElement {
  #dialog;
  #input;
  #list;
  #items = [];
  #activeIndex = -1;
  #groups = [];
  /** @type {(() => void) | null} */
  #unbindHotkey = null;
  #discoveredHeaders = [];

  setup() {
    this.#build();
    this.#registerHotkey();
    if (this.hasAttribute('discover')) {
      this.#listenForRegistryChanges();
    }
  }

  teardown() {
    this.#unbindHotkey?.();
  }

  // ── Data API (HTML-first / JS-first dual contract) ──────────────

  /**
   * The current commands as a plain data array. Each entry:
   * `{ value, label, hotkey?, group?, icon? }`. Reading reflects either
   * the parsed <command-group>/<command-item> children or what was last
   * assigned via the setter.
   */
  get commands() {
    const result = [];
    for (const group of this.#groups) {
      const groupLabel = group.getAttribute('label') || '';
      for (const item of group.querySelectorAll('command-item')) {
        result.push({
          value: item.getAttribute('value') || '',
          label: item.textContent.trim(),
          hotkey: item.getAttribute('data-hotkey') || undefined,
          group: groupLabel || undefined,
        });
      }
    }
    return result;
  }

  /**
   * Replace the command set and re-render. Each entry needs `value`
   * (the dispatch identifier) and `label` (display text). Optional
   * `hotkey` (e.g. "ctrl+k"), `group` (string used to bucket commands
   * into <command-group>s), and `icon` (HTML string rendered in the
   * icon slot).
   *
   * Commands with the same `group` are placed into one <command-group>;
   * commands without a group go into a default unlabeled group.
   *
   * Emits command-palette:commands-changed { commands, source: 'property' }.
   */
  set commands(value) {
    const next = Array.isArray(value) ? value : [];

    // Group by .group field (preserving first-seen order).
    const buckets = new Map();
    for (const cmd of next) {
      const key = cmd.group || '';
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(cmd);
    }

    // Remove existing <command-group> children (and any orphan
    // <command-item>s); leave the dialog/listbox chrome alone — it
    // lives outside the light-DOM children.
    for (const child of [...this.children]) {
      if (child.tagName === 'COMMAND-GROUP' || child.tagName === 'COMMAND-ITEM') {
        child.remove();
      }
    }

    // Rebuild groups + items from data.
    for (const [groupLabel, cmds] of buckets) {
      const group = document.createElement('command-group');
      if (groupLabel) group.setAttribute('label', groupLabel);
      for (const cmd of cmds) {
        const item = document.createElement('command-item');
        if (cmd.value) item.setAttribute('value', cmd.value);
        if (cmd.hotkey) item.setAttribute('data-hotkey', cmd.hotkey);
        if (cmd.icon) {
          const iconWrap = document.createElement('span');
          iconWrap.setAttribute('slot', 'icon');
          iconWrap.innerHTML = cmd.icon;
          item.appendChild(iconWrap);
        }
        item.appendChild(document.createTextNode(cmd.label || cmd.value || ''));
        group.appendChild(item);
      }
      this.appendChild(group);
    }

    // Re-run setup so the dialog rebuilds against the new children.
    this.teardown();
    this.removeAttribute('data-upgraded');
    this.setup();

    this.dispatchEvent(new CustomEvent('command-palette:commands-changed', {
      detail: { commands: next, source: 'property' },
      bubbles: true,
    }));
  }

  #build() {
    // Create dialog shell
    this.#dialog = document.createElement('dialog');
    this.#dialog.className = 'command-dialog';
    this.#dialog.addEventListener('click', (e) => {
      if (e.target === this.#dialog) this.close();
    });

    // Search input
    const searchWrap = document.createElement('div');
    searchWrap.className = 'command-search';

    this.#input = document.createElement('input');
    this.#input.type = 'search';
    this.#input.placeholder = this.getAttribute('placeholder') || 'Type a command...';
    this.#input.setAttribute('aria-label', 'Search commands');
    this.#input.autocomplete = 'off';
    this.#input.addEventListener('input', this.#handleInput);
    this.#input.addEventListener('keydown', this.#handleKeyDown);

    searchWrap.appendChild(this.#input);

    // Command list
    this.#list = document.createElement('div');
    this.#list.className = 'command-list';
    this.#list.setAttribute('role', 'listbox');

    // Parse command-group and command-item children
    this.#groups = Array.from(this.querySelectorAll('command-group'));
    this.#groups.forEach(group => {
      const header = document.createElement('div');
      header.className = 'command-group-header';
      header.textContent = group.getAttribute('label') || '';
      header.setAttribute('role', 'presentation');

      const items = Array.from(group.querySelectorAll('command-item'));
      this.#list.appendChild(header);

      items.forEach(item => {
        const btn = document.createElement('button');
        btn.className = 'command-option';
        btn.setAttribute('role', 'option');
        btn.dataset.value = item.getAttribute('value') || '';
        btn.dataset.searchText = item.textContent.toLowerCase().trim();

        // Icon slot
        const icon = item.querySelector('[slot="icon"]');
        if (icon) {
          const iconWrap = document.createElement('span');
          iconWrap.className = 'command-icon';
          iconWrap.appendChild(icon.cloneNode(true));
          btn.appendChild(iconWrap);
        }

        // Label
        const label = document.createElement('span');
        label.className = 'command-label';
        label.textContent = item.textContent.trim();
        btn.appendChild(label);

        // Hotkey badge
        const hotkey = item.getAttribute('data-hotkey');
        if (hotkey) {
          const badge = document.createElement('kbd');
          badge.className = 'command-kbd';
          badge.textContent = formatHotkey(hotkey);
          btn.appendChild(badge);
        }

        btn.addEventListener('click', () => {
          this.#select(btn.dataset.value);
        });

        this.#list.appendChild(btn);
        this.#items.push({ btn, header, group });
      });
    });

    // Empty state
    const empty = document.createElement('div');
    empty.className = 'command-empty';
    empty.textContent = 'No results found.';
    empty.hidden = true;
    this.#list.appendChild(empty);

    this.#dialog.appendChild(searchWrap);
    this.#dialog.appendChild(this.#list);
    this.appendChild(this.#dialog);
  }

  #registerHotkey() {
    const combo = this.getAttribute('hotkey') || 'meta+k';
    this.#unbindHotkey = /** @type {() => void} */ (bindHotkey(combo, () => {
      if (this.#dialog.open) {
        this.close();
      } else {
        this.open();
      }
    }, { global: true }));
  }

  #handleInput = () => {
    const query = this.#input.value.toLowerCase().trim();
    let visibleCount = 0;
    const visibleHeaders = new Set();

    this.#items.forEach(({ btn, header }) => {
      const match = !query || btn.dataset.searchText.includes(query);
      btn.hidden = !match;
      if (match) {
        visibleCount++;
        visibleHeaders.add(header);
      }
    });

    // Show/hide group headers
    this.#list.querySelectorAll('.command-group-header').forEach(h => {
      h.hidden = !visibleHeaders.has(h);
    });

    // Empty state
    const empty = this.#list.querySelector('.command-empty');
    if (empty) empty.hidden = visibleCount > 0;

    // Reset active index and highlight first visible
    this.#activeIndex = -1;
    if (visibleCount > 0) {
      this.#focusItem(0);
    }
  };

  #handleKeyDown = (e) => {
    const visibleItems = this.#getVisibleItems();

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.#focusItem(this.#activeIndex + 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.#focusItem(this.#activeIndex - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (this.#activeIndex >= 0 && visibleItems[this.#activeIndex]) {
          visibleItems[this.#activeIndex].btn.click();
        }
        break;
      case 'Escape':
        e.preventDefault();
        this.close();
        break;
    }
  };

  #getVisibleItems() {
    return this.#items.filter(({ btn }) => !btn.hidden);
  }

  #focusItem(index) {
    const visible = this.#getVisibleItems();
    if (visible.length === 0) return;

    // Remove previous active
    visible.forEach(({ btn }) => btn.removeAttribute('data-active'));

    if (index < 0) index = visible.length - 1;
    if (index >= visible.length) index = 0;

    this.#activeIndex = index;
    const { btn } = visible[index];
    btn.setAttribute('data-active', '');
    btn.scrollIntoView({ block: 'nearest' });
  }

  #select(value) {
    this.close();
    this.dispatchEvent(new CustomEvent('command-palette:select', {
      bubbles: true,
      detail: { value }
    }));
  }

  #listenForRegistryChanges() {
    this.listen(document, 'vb:command-registry-change', this.#handleRegistryChange);
  }

  #handleRegistryChange = () => {
    // Registry changed — if dialog is open, refresh discovered items
    if (this.#dialog?.open) {
      this.#populateDiscovered();
      this.#handleInput();
    }
  };

  #populateDiscovered() {
    if (!this.hasAttribute('discover')) return;

    // Lazy-import to avoid circular dependency at module load time
    const { getRegisteredCommands, scanAutoDiscoverable } = window.__commandRegistry || {};
    if (!getRegisteredCommands) return;

    // Remove previously added discovered items and headers
    this.#items = this.#items.filter(item => !item.discovered);
    this.#discoveredHeaders.forEach(h => h.remove());
    this.#discoveredHeaders = [];

    const empty = this.#list.querySelector('.command-empty');
    const grouped = getRegisteredCommands();

    for (const [groupName, entries] of grouped) {
      const header = document.createElement('div');
      header.className = 'command-group-header';
      header.textContent = groupName;
      header.setAttribute('role', 'presentation');
      this.#list.insertBefore(header, empty);
      this.#discoveredHeaders.push(header);

      for (const entry of entries) {
        // Skip if the element is inside this command-palette (avoid duplicating declarative items)
        if (this.contains(entry.element)) continue;

        const btn = this.#createOptionButton(entry.label, entry.icon, entry.shortcut);
        btn.dataset.value = `__discovered:${entry.label}`;

        btn.addEventListener('click', () => {
          this.close();
          /** @type {HTMLElement} */ (entry.element).click();
        });

        this.#list.insertBefore(btn, empty);
        this.#items.push({ btn, header, group: null, discovered: true });
      }
    }

    // Auto-discovery: nav links + headings (only when discover="auto")
    if (this.getAttribute('discover') === 'auto' && scanAutoDiscoverable) {
      const autoItems = scanAutoDiscoverable();
      const autoGroups = new Map();

      for (const item of autoItems) {
        const list = autoGroups.get(item.group) || [];
        list.push(item);
        autoGroups.set(item.group, list);
      }

      for (const [groupName, entries] of autoGroups) {
        const header = document.createElement('div');
        header.className = 'command-group-header';
        header.textContent = groupName;
        header.setAttribute('role', 'presentation');
        this.#list.insertBefore(header, empty);
        this.#discoveredHeaders.push(header);

        for (const entry of entries) {
          if (this.contains(entry.element)) continue;

          const btn = this.#createOptionButton(entry.label, entry.icon, entry.shortcut);
          btn.dataset.value = `__auto:${entry.label}`;
          btn.dataset.auto = '';

          btn.addEventListener('click', () => {
            this.close();
            if (entry.action) {
              entry.action();
            } else {
              /** @type {HTMLElement} */ (entry.element).click();
            }
          });

          this.#list.insertBefore(btn, empty);
          this.#items.push({ btn, header, group: null, discovered: true });
        }
      }
    }
  }

  #createOptionButton(labelText, icon, shortcut) {
    const btn = document.createElement('button');
    btn.className = 'command-option';
    btn.setAttribute('role', 'option');
    btn.dataset.searchText = labelText.toLowerCase();

    if (icon) {
      const iconWrap = document.createElement('span');
      iconWrap.className = 'command-icon';
      const iconEl = document.createElement('icon-wc');
      iconEl.setAttribute('name', icon);
      iconWrap.appendChild(iconEl);
      btn.appendChild(iconWrap);
    }

    const label = document.createElement('span');
    label.className = 'command-label';
    label.textContent = labelText;
    btn.appendChild(label);

    if (shortcut) {
      const badge = document.createElement('kbd');
      badge.className = 'command-kbd';
      badge.textContent = formatHotkey(shortcut);
      btn.appendChild(badge);
    }

    return btn;
  }

  open() {
    if (this.#dialog.open) return;
    // Refresh discovered commands each time we open
    this.#populateDiscovered();
    this.#dialog.showModal();
    this.#input.value = '';
    this.#handleInput(); // Reset filter
    this.#input.focus();
    this.dispatchEvent(new CustomEvent('command-palette:open', { bubbles: true }));
  }

  close() {
    if (!this.#dialog.open) return;
    this.#dialog.close();
    this.dispatchEvent(new CustomEvent('command-palette:close', { bubbles: true }));
  }

  get isOpen() {
    return this.#dialog?.open ?? false;
  }
}

// Define custom elements (group and item are just containers for parsing)
class CommandGroup extends HTMLElement {}
class CommandItem extends HTMLElement {}

registerComponent('command-palette', CommandPalette);
registerComponent('command-group', CommandGroup);
registerComponent('command-item', CommandItem);

export { CommandPalette };
