/**
 * command-palette: Command palette / Cmd+K launcher
 *
 * Searchable, keyboard-navigable list of commands in a modal dialog.
 * Supports groups, keyboard shortcuts, and fuzzy filtering.
 * When discover is set, also shows commands from [data-command] elements.
 *
 * @attr {string} hotkey - Global keyboard shortcut to open (default: "meta+k")
 * @attr {string} placeholder - Search input placeholder text
 * @attr {string} label - Accessible name of the dialog (default: "Command palette")
 * @attr {boolean|"auto"} discover - When present, auto-populate from [data-command] registry;
 *   "auto" also scans nav links and headings
 *
 * A command-item's data-hotkey is shown as a badge AND bound page-wide while
 * the palette is connected: pressing it dispatches command-palette:select
 * without opening the palette.
 *
 * A11y: combobox + listbox pattern — focus stays in the search input, the
 * active option is exposed with aria-activedescendant / aria-selected.
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

let paletteSeq = 0;

class CommandPalette extends VBElement {
  /** @type {HTMLDialogElement | null} */
  #dialog = null;
  /** @type {HTMLInputElement} */
  #input;
  /** @type {HTMLElement} */
  #list;
  /** @type {Array<{ btn: HTMLButtonElement, group: HTMLElement, source: Element | null, discovered?: boolean }>} */
  #items = [];
  #activeIndex = -1;
  /** @type {Element[]} */
  #groups = [];
  /** @type {Array<() => void>} */
  #unbindFns = [];
  /** @type {HTMLElement[]} */
  #discoveredGroups = [];
  #idBase = '';
  #optionSeq = 0;

  setup() {
    this.#idBase = `cmdp-${++paletteSeq}`;
    this.#optionSeq = 0;
    this.#build();
    this.#registerHotkeys();
    if (this.hasAttribute('discover')) {
      this.#listenForRegistryChanges();
    }
  }

  teardown() {
    this.#unbindFns.forEach(fn => fn());
    this.#unbindFns = [];
    // setup() builds a fresh dialog on every connect / data change; drop the
    // old one so reconnects and .commands assignments never stack dialogs.
    this.#dialog?.remove();
    this.#dialog = null;
    this.#items = [];
    this.#groups = [];
    this.#discoveredGroups = [];
    this.#activeIndex = -1;
  }

  // ── Data API (HTML-first / JS-first dual contract) ──────────────

  /**
   * The current commands as a plain data array. Each entry:
   * `{ value, label, hotkey?, group?, icon? }`. Reading reflects either
   * the parsed <command-group>/<command-item> children or what was last
   * assigned via the setter.
   *
   * @returns {Array<{ value: string, label: string, hotkey?: string, group?: string, icon?: string }>} Command records.
   */
  get commands() {
    const result = [];
    // Read the light-DOM source (not #groups) so this works while disconnected.
    for (const group of this.querySelectorAll('command-group')) {
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

    // Re-run the lifecycle so the dialog rebuilds against the new children
    // (listeners released first; only re-binds while connected).
    this._reinit();

    this.dispatchEvent(new CustomEvent('command-palette:commands-changed', {
      detail: { commands: next, source: 'property' },
      bubbles: true,
    }));
  }

  #build() {
    // Create dialog shell
    this.#dialog = document.createElement('dialog');
    this.#dialog.className = 'command-dialog';
    this.#dialog.setAttribute('aria-label', this.getAttribute('label') || 'Command palette');
    this.#dialog.addEventListener('click', (e) => {
      if (e.target === this.#dialog) this.close();
    });
    // One close event for every way the dialog closes: close(), a selection,
    // Escape (native cancel), or a backdrop click.
    this.#dialog.addEventListener('close', () => {
      this.#input?.setAttribute('aria-expanded', 'false');
      this.#input?.removeAttribute('aria-activedescendant');
      this.dispatchEvent(new CustomEvent('command-palette:close', { bubbles: true }));
    });

    // Search input
    const searchWrap = document.createElement('div');
    searchWrap.className = 'command-search';

    // Command list
    this.#list = document.createElement('div');
    this.#list.className = 'command-list';
    this.#list.id = `${this.#idBase}-list`;
    this.#list.setAttribute('role', 'listbox');
    this.#list.setAttribute('aria-label', 'Commands');

    this.#input = document.createElement('input');
    this.#input.type = 'search';
    this.#input.placeholder = this.getAttribute('placeholder') || 'Type a command...';
    this.#input.setAttribute('aria-label', 'Search commands');
    this.#input.autocomplete = 'off';
    // Combobox + listbox: focus stays in the input, the active option is
    // announced through aria-activedescendant (see #focusItem).
    this.#input.setAttribute('role', 'combobox');
    this.#input.setAttribute('aria-autocomplete', 'list');
    this.#input.setAttribute('aria-controls', this.#list.id);
    this.#input.setAttribute('aria-expanded', 'false');
    this.#input.addEventListener('input', this.#handleInput);
    this.#input.addEventListener('keydown', this.#handleKeyDown);

    searchWrap.appendChild(this.#input);

    // Parse command-group and command-item children
    this.#groups = Array.from(this.querySelectorAll('command-group'));
    this.#groups.forEach(source => {
      const group = this.#createGroup(source.getAttribute('label') || '');
      this.#list.appendChild(group);

      source.querySelectorAll('command-item').forEach(item => {
        const icon = item.querySelector('[slot="icon"]');
        const btn = this.#createOptionButton(
          item.textContent.trim(),
          icon ? icon.cloneNode(true) : null,
          item.getAttribute('data-hotkey'));
        btn.dataset.value = item.getAttribute('value') || '';

        btn.addEventListener('click', () => {
          this.#select(btn.dataset.value);
        });

        group.appendChild(btn);
        this.#items.push({ btn, group, source: item });
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

  /**
   * A listbox group: role="group" named by its (aria-hidden) header, so
   * options are announced with their group and the header is not an option.
   * @param {string} labelText
   */
  #createGroup(labelText) {
    const group = document.createElement('div');
    group.className = 'command-group';
    group.setAttribute('role', 'group');
    const header = document.createElement('div');
    header.className = 'command-group-header';
    header.id = `${this.#idBase}-g${++this.#optionSeq}`;
    // Names the group via aria-labelledby; hidden from the tree itself so
    // the listbox only exposes options.
    header.setAttribute('aria-hidden', 'true');
    header.textContent = labelText;
    if (labelText) group.setAttribute('aria-labelledby', header.id);
    else header.hidden = true;
    group.appendChild(header);
    return group;
  }

  #registerHotkeys() {
    const combo = this.getAttribute('hotkey') || 'meta+k';
    this.#unbindFns.push(/** @type {() => void} */ (bindHotkey(combo, () => {
      if (this.#dialog?.open) {
        this.close();
      } else {
        this.open();
      }
    }, { global: true })));

    // data-hotkey on a declared command runs it directly (no palette).
    // Not global: never fires while typing, including in the palette input.
    for (const { btn, source } of this.#items) {
      const hotkey = source?.getAttribute('data-hotkey');
      if (!hotkey || hotkey.toLowerCase() === combo.toLowerCase()) continue;
      const value = btn.dataset.value;
      this.#unbindFns.push(/** @type {() => void} */ (bindHotkey(hotkey, () => this.#select(value))));
    }
  }

  #handleInput = () => {
    const query = this.#input.value.toLowerCase().trim();
    let visibleCount = 0;
    const visibleGroups = new Set();

    this.#items.forEach(({ btn, group }) => {
      const match = !query || (btn.dataset.searchText ?? '').includes(query);
      btn.hidden = !match;
      if (match) {
        visibleCount++;
        visibleGroups.add(group);
      }
    });

    // Show/hide whole groups (header included)
    this.#list.querySelectorAll(':scope > .command-group').forEach(g => {
      /** @type {HTMLElement} */ (g).hidden = !visibleGroups.has(/** @type {HTMLElement} */ (g));
    });

    // Empty state
    const empty = /** @type {HTMLElement | null} */ (this.#list.querySelector('.command-empty'));
    if (empty) empty.hidden = visibleCount > 0;

    // Reset active index and highlight first visible
    this.#activeIndex = -1;
    this.#items.forEach(({ btn }) => {
      btn.removeAttribute('data-active');
      btn.setAttribute('aria-selected', 'false');
    });
    this.#input.removeAttribute('aria-activedescendant');
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
    visible.forEach(({ btn }) => {
      btn.removeAttribute('data-active');
      btn.setAttribute('aria-selected', 'false');
    });

    if (index < 0) index = visible.length - 1;
    if (index >= visible.length) index = 0;

    this.#activeIndex = index;
    const { btn } = visible[index];
    btn.setAttribute('data-active', '');
    btn.setAttribute('aria-selected', 'true');
    this.#input.setAttribute('aria-activedescendant', btn.id);
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

    // Remove previously added discovered items and groups
    this.#items = this.#items.filter(item => !item.discovered);
    this.#discoveredGroups.forEach(g => g.remove());
    this.#discoveredGroups = [];

    const empty = this.#list.querySelector('.command-empty');
    const grouped = getRegisteredCommands();

    for (const [groupName, entries] of grouped) {
      const group = this.#createGroup(groupName);
      this.#list.insertBefore(group, empty);
      this.#discoveredGroups.push(group);

      for (const entry of entries) {
        // Skip if the element is inside this command-palette (avoid duplicating declarative items)
        if (this.contains(entry.element)) continue;

        const btn = this.#createOptionButton(entry.label, entry.icon, entry.shortcut);
        btn.dataset.value = `__discovered:${entry.label}`;

        btn.addEventListener('click', () => {
          this.close();
          /** @type {HTMLElement} */ (entry.element).click();
        });

        group.appendChild(btn);
        this.#items.push({ btn, group, source: null, discovered: true });
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
        const group = this.#createGroup(groupName);
        this.#list.insertBefore(group, empty);
        this.#discoveredGroups.push(group);

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

          group.appendChild(btn);
          this.#items.push({ btn, group, source: null, discovered: true });
        }
      }
    }
  }

  /**
   * @param {string} labelText
   * @param {Node | string | null | undefined} icon - cloned slot content, or an icon-wc name
   * @param {string | null | undefined} shortcut
   */
  #createOptionButton(labelText, icon, shortcut) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'command-option';
    btn.id = `${this.#idBase}-opt-${++this.#optionSeq}`;
    btn.setAttribute('role', 'option');
    btn.setAttribute('aria-selected', 'false');
    // Options are never Tab stops: focus stays in the combobox input.
    btn.tabIndex = -1;
    btn.dataset.searchText = labelText.toLowerCase();

    if (icon) {
      const iconWrap = document.createElement('span');
      iconWrap.className = 'command-icon';
      if (typeof icon === 'string') {
        const iconEl = document.createElement('icon-wc');
        iconEl.setAttribute('name', icon);
        iconWrap.appendChild(iconEl);
      } else {
        iconWrap.appendChild(icon);
      }
      btn.appendChild(iconWrap);
    }

    const label = document.createElement('span');
    label.className = 'command-label';
    label.textContent = labelText;
    btn.appendChild(label);

    if (shortcut) {
      const badge = document.createElement('kbd');
      badge.className = 'command-kbd';
      badge.setAttribute('aria-hidden', 'true');
      badge.textContent = formatHotkey(shortcut);
      btn.appendChild(badge);
      btn.setAttribute('aria-keyshortcuts', shortcut);
    }

    return btn;
  }

  open() {
    if (!this.#dialog || this.#dialog.open) return;
    // Refresh discovered commands each time we open
    this.#populateDiscovered();
    this.#dialog.showModal();
    this.#input.setAttribute('aria-expanded', 'true');
    this.#input.value = '';
    this.#handleInput(); // Reset filter
    this.#input.focus();
    this.dispatchEvent(new CustomEvent('command-palette:open', { bubbles: true }));
  }

  /** Close the palette. command-palette:close fires from the dialog's close event. */
  close() {
    if (!this.#dialog?.open) return;
    this.#dialog.close();
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
