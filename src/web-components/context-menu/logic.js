/**
 * context-menu: Right-click context menu with keyboard navigation
 *
 * Provides a custom right-click menu that opens at cursor position.
 * Shares keyboard navigation patterns with dropdown-wc.
 * Items with data-shortcut get real keyboard shortcut bindings.
 *
 * @example
 * <context-menu>
 *   <div data-trigger>
 *     <p>Right-click anywhere here</p>
 *   </div>
 *   <menu>
 *     <li><button data-shortcut="meta+x">Cut</button></li>
 *     <li><button data-shortcut="meta+c">Copy</button></li>
 *     <li><button>Paste</button></li>
 *     <li role="separator"></li>
 *     <li><button class="danger">Delete</button></li>
 *   </menu>
 * </context-menu>
 */

import { formatHotkey } from '../../utils/hotkey-format.js';
import { bindHotkey } from '../../utils/hotkey-bind.js';

class ContextMenuWc extends HTMLElement {
  #trigger;
  #menu;
  #items = [];
  #activeIndex = -1;
  #isOpen = false;
  #unbindFns = [];

  connectedCallback() {
    this.#setup();
  }

  disconnectedCallback() {
    this.#cleanup();
  }

  #setup() {
    this.#trigger = this.querySelector(':scope > [data-trigger]');
    this.#menu = this.querySelector(':scope > menu, :scope > ul[role="menu"]');
    if (!this.#trigger || !this.#menu) return;

    // ARIA setup
    this.#menu.setAttribute('role', 'menu');
    if (!this.#menu.id) {
      this.#menu.id = `ctx-menu-${crypto.randomUUID().slice(0, 8)}`;
    }

    // Group labels — mark as non-interactive
    this.#menu.querySelectorAll(':scope > li[data-group]').forEach(label => {
      label.setAttribute('role', 'presentation');
      label.classList.add('ctx-group-label');
    });

    // Collect menu items
    this.#items = Array.from(
      this.#menu.querySelectorAll('button, a, [role="menuitem"]')
    ).filter(item => !item.disabled && !item.hasAttribute('data-disabled'));

    this.#items.forEach(item => {
      item.setAttribute('role', 'menuitem');
      item.setAttribute('tabindex', '-1');
      item.addEventListener('click', this.#handleItemClick);

      // Shortcut badges + real bindings
      const shortcut = item.getAttribute('data-shortcut');
      if (shortcut) {
        const kbd = document.createElement('kbd');
        kbd.className = 'ctx-kbd';
        kbd.textContent = formatHotkey(shortcut);
        item.appendChild(kbd);

        // Bind the real keyboard shortcut — clicking the item
        const unbind = bindHotkey(shortcut, () => item.click());
        this.#unbindFns.push(unbind);
      }
    });

    this.#menu.querySelectorAll('li:empty:not([data-group]), [role="separator"], hr').forEach(sep => {
      sep.setAttribute('role', 'separator');
    });

    // Event listeners
    this.#trigger.addEventListener('contextmenu', this.#handleContextMenu);
    this.#menu.addEventListener('keydown', this.#handleMenuKeyDown);
    document.addEventListener('click', this.#handleOutsideClick);
    document.addEventListener('contextmenu', this.#handleOutsideContext);
    document.addEventListener('keydown', this.#handleEscape);
    window.addEventListener('scroll', this.#handleScroll, true);
  }

  #cleanup() {
    if (this.#trigger) {
      this.#trigger.removeEventListener('contextmenu', this.#handleContextMenu);
    }
    if (this.#menu) {
      this.#menu.removeEventListener('keydown', this.#handleMenuKeyDown);
    }
    this.#items.forEach(item => {
      item.removeEventListener('click', this.#handleItemClick);
    });
    this.#unbindFns.forEach(fn => fn());
    this.#unbindFns = [];
    document.removeEventListener('click', this.#handleOutsideClick);
    document.removeEventListener('contextmenu', this.#handleOutsideContext);
    document.removeEventListener('keydown', this.#handleEscape);
    window.removeEventListener('scroll', this.#handleScroll, true);
  }

  #handleContextMenu = (e) => {
    e.preventDefault();
    this.#openAt(e.clientX, e.clientY);
  };

  #openAt(x, y) {
    this.#isOpen = true;
    this.setAttribute('data-open', '');

    // Position at cursor, then adjust for viewport bounds
    const menuRect = this.#menu.getBoundingClientRect();

    // Need to show first to measure
    this.#menu.style.setProperty('--ctx-top', `${y}px`);
    this.#menu.style.setProperty('--ctx-left', `${x}px`);

    // After render, check bounds
    requestAnimationFrame(() => {
      const rect = this.#menu.getBoundingClientRect();
      const adjustedX = (x + rect.width > window.innerWidth)
        ? x - rect.width
        : x;
      const adjustedY = (y + rect.height > window.innerHeight)
        ? y - rect.height
        : y;

      this.#menu.style.setProperty('--ctx-top', `${Math.max(0, adjustedY)}px`);
      this.#menu.style.setProperty('--ctx-left', `${Math.max(0, adjustedX)}px`);
    });

    this.#activeIndex = -1;
    this.#focusItem(0);

    this.dispatchEvent(new CustomEvent('context-menu-open', { bubbles: true }));
  }

  close() {
    if (!this.#isOpen) return;
    this.#isOpen = false;
    this.removeAttribute('data-open');
    this.#activeIndex = -1;
    this.dispatchEvent(new CustomEvent('context-menu-close', { bubbles: true }));
  }

  #handleMenuKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowDown':
      case 'Down':
        e.preventDefault();
        this.#focusItem(this.#activeIndex + 1);
        break;
      case 'ArrowUp':
      case 'Up':
        e.preventDefault();
        this.#focusItem(this.#activeIndex - 1);
        break;
      case 'Home':
        e.preventDefault();
        this.#focusItem(0);
        break;
      case 'End':
        e.preventDefault();
        this.#focusItem(this.#items.length - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (this.#activeIndex >= 0) {
          this.#items[this.#activeIndex].click();
        }
        break;
      case 'Tab':
        this.close();
        break;
    }
  };

  #handleItemClick = () => {
    this.close();
    this.dispatchEvent(new CustomEvent('context-select', {
      bubbles: true,
      detail: { item: this.#items[this.#activeIndex] }
    }));
  };

  #handleOutsideClick = (e) => {
    if (this.#isOpen && !this.#menu.contains(e.target)) {
      this.close();
    }
  };

  #handleOutsideContext = (e) => {
    if (this.#isOpen && !this.#trigger.contains(e.target)) {
      this.close();
    }
  };

  #handleEscape = (e) => {
    if (e.key === 'Escape' && this.#isOpen) {
      e.preventDefault();
      this.close();
    }
  };

  #handleScroll = () => {
    if (this.#isOpen) this.close();
  };

  #focusItem(index) {
    if (this.#items.length === 0) return;
    if (index < 0) index = this.#items.length - 1;
    if (index >= this.#items.length) index = 0;
    this.#activeIndex = index;
    this.#items[index].focus();
  }

  get isOpen() {
    return this.#isOpen;
  }
}

customElements.define('context-menu', ContextMenuWc);

export { ContextMenuWc };
