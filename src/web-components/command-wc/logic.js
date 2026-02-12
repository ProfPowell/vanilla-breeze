/**
 * command-wc: Command palette / Cmd+K launcher
 *
 * Searchable, keyboard-navigable list of commands in a modal dialog.
 * Supports groups, keyboard shortcuts, and fuzzy filtering.
 * When data-discover is set, also shows commands from [data-command] elements.
 *
 * @attr {string} data-hotkey - Global keyboard shortcut to open (default: "meta+k")
 * @attr {string} data-placeholder - Search input placeholder text
 * @attr {boolean} data-discover - When present, auto-populate from [data-command] registry
 *
 * @example
 * <command-wc data-hotkey="meta+k" data-discover>
 *   <command-group label="Navigation">
 *     <command-item value="home">Go Home</command-item>
 *     <command-item value="settings">Settings</command-item>
 *   </command-group>
 * </command-wc>
 */

import { formatHotkey } from '../../utils/hotkey-format.js';
import { bindHotkey } from '../../utils/hotkey-bind.js';

class CommandWc extends HTMLElement {
  #dialog;
  #input;
  #list;
  #items = [];
  #activeIndex = -1;
  #groups = [];
  #unbindHotkey = null;
  #discoveredHeaders = [];

  connectedCallback() {
    this.#build();
    this.#registerHotkey();
    if (this.hasAttribute('data-discover')) {
      this.#listenForRegistryChanges();
    }
  }

  disconnectedCallback() {
    this.#unbindHotkey?.();
    document.removeEventListener('command-registry-change', this.#handleRegistryChange);
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
    this.#input.placeholder = this.dataset.placeholder || 'Type a command...';
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
    const combo = this.dataset.hotkey || 'meta+k';
    this.#unbindHotkey = bindHotkey(combo, () => {
      if (this.#dialog.open) {
        this.close();
      } else {
        this.open();
      }
    }, { global: true });
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
    this.dispatchEvent(new CustomEvent('command-select', {
      bubbles: true,
      detail: { value }
    }));
  }

  #listenForRegistryChanges() {
    document.addEventListener('command-registry-change', this.#handleRegistryChange);
  }

  #handleRegistryChange = () => {
    // Registry changed — if dialog is open, refresh discovered items
    if (this.#dialog?.open) {
      this.#populateDiscovered();
      this.#handleInput();
    }
  };

  #populateDiscovered() {
    if (!this.hasAttribute('data-discover')) return;

    // Lazy-import to avoid circular dependency at module load time
    // command-init.js imports hotkey-bind.js; command-wc imports hotkey-bind.js
    // but command-wc only needs getRegisteredCommands at runtime, not at parse time
    const { getRegisteredCommands } = window.__commandRegistry || {};
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
        // Skip if the element is inside this command-wc (avoid duplicating declarative items)
        if (this.contains(entry.element)) continue;

        const btn = document.createElement('button');
        btn.className = 'command-option';
        btn.setAttribute('role', 'option');
        btn.dataset.value = `__discovered:${entry.label}`;
        btn.dataset.searchText = entry.label.toLowerCase();

        // Icon
        if (entry.icon) {
          const iconWrap = document.createElement('span');
          iconWrap.className = 'command-icon';
          const iconEl = document.createElement('icon-wc');
          iconEl.setAttribute('name', entry.icon);
          iconWrap.appendChild(iconEl);
          btn.appendChild(iconWrap);
        }

        // Label
        const label = document.createElement('span');
        label.className = 'command-label';
        label.textContent = entry.label;
        btn.appendChild(label);

        // Shortcut badge
        if (entry.shortcut) {
          const badge = document.createElement('kbd');
          badge.className = 'command-kbd';
          badge.textContent = formatHotkey(entry.shortcut);
          btn.appendChild(badge);
        }

        // Click = click the original element (palette is a proxy)
        btn.addEventListener('click', () => {
          this.close();
          entry.element.click();
        });

        this.#list.insertBefore(btn, empty);
        this.#items.push({ btn, header, group: null, discovered: true });
      }
    }
  }

  open() {
    if (this.#dialog.open) return;
    // Refresh discovered commands each time we open
    this.#populateDiscovered();
    this.#dialog.showModal();
    this.#input.value = '';
    this.#handleInput(); // Reset filter
    this.#input.focus();
    this.dispatchEvent(new CustomEvent('command-open', { bubbles: true }));
  }

  close() {
    if (!this.#dialog.open) return;
    this.#dialog.close();
    this.dispatchEvent(new CustomEvent('command-close', { bubbles: true }));
  }

  get isOpen() {
    return this.#dialog?.open ?? false;
  }
}

// Define custom elements (group and item are just containers for parsing)
class CommandGroup extends HTMLElement {}
class CommandItem extends HTMLElement {}

customElements.define('command-wc', CommandWc);
customElements.define('command-group', CommandGroup);
customElements.define('command-item', CommandItem);

export { CommandWc };
