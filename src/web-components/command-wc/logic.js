/**
 * command-wc: Command palette / Cmd+K launcher
 *
 * Searchable, keyboard-navigable list of commands in a modal dialog.
 * Supports groups, keyboard shortcuts, and fuzzy filtering.
 *
 * @attr {string} data-hotkey - Global keyboard shortcut to open (default: "meta+k")
 * @attr {string} data-placeholder - Search input placeholder text
 *
 * @example
 * <command-wc data-hotkey="meta+k">
 *   <command-group label="Navigation">
 *     <command-item value="home">Go Home</command-item>
 *     <command-item value="settings">Settings</command-item>
 *   </command-group>
 *   <command-group label="Actions">
 *     <command-item value="theme">Toggle Dark Mode</command-item>
 *   </command-group>
 * </command-wc>
 */
class CommandWc extends HTMLElement {
  #dialog;
  #input;
  #list;
  #items = [];
  #activeIndex = -1;
  #groups = [];

  connectedCallback() {
    this.#build();
    this.#registerHotkey();
  }

  disconnectedCallback() {
    document.removeEventListener('keydown', this.#handleGlobalKeyDown);
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
          badge.textContent = this.#formatHotkey(hotkey);
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
    document.addEventListener('keydown', this.#handleGlobalKeyDown);
  }

  #handleGlobalKeyDown = (e) => {
    const hotkey = this.dataset.hotkey || 'meta+k';
    const parts = hotkey.toLowerCase().split('+');
    const key = parts.pop();
    const needsMeta = parts.includes('meta');
    const needsCtrl = parts.includes('ctrl');
    const needsShift = parts.includes('shift');
    const needsAlt = parts.includes('alt');

    const metaOrCtrl = needsMeta ? (e.metaKey || e.ctrlKey) : true;
    const ctrl = needsCtrl ? e.ctrlKey : true;
    const shift = needsShift ? e.shiftKey : !e.shiftKey;
    const alt = needsAlt ? e.altKey : !e.altKey;

    if (metaOrCtrl && ctrl && shift && alt && e.key.toLowerCase() === key) {
      e.preventDefault();
      if (this.#dialog.open) {
        this.close();
      } else {
        this.open();
      }
    }
  };

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

  #formatHotkey(str) {
    const isMac = /Mac|iPhone|iPad/.test(navigator.platform);
    return str.split('+').map(k => {
      const key = k.trim().toLowerCase();
      if (isMac) {
        if (key === 'meta' || key === 'cmd') return '\u2318';
        if (key === 'alt') return '\u2325';
        if (key === 'shift') return '\u21E7';
        if (key === 'ctrl') return '\u2303';
      } else {
        if (key === 'meta' || key === 'cmd') return 'Ctrl';
        if (key === 'alt') return 'Alt';
        if (key === 'shift') return 'Shift';
        if (key === 'ctrl') return 'Ctrl';
      }
      return key.toUpperCase();
    }).join(isMac ? '' : '+');
  }

  open() {
    if (this.#dialog.open) return;
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
