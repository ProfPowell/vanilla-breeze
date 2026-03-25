/**
 * context-menu: Right-click context menu with keyboard navigation
 *
 * Provides a custom right-click menu that opens at cursor position.
 * Shares keyboard navigation patterns with drop-down.
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
import { supportsPopover } from '../../utils/popover-support.js';
import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

class ContextMenuWc extends VBElement {
  #trigger;
  #menu;
  #items = [];
  #activeIndex = -1;
  #isOpen = false;
  #unbindFns = [];
  #usePopover = false;

  setup() {
    this.#trigger = this.querySelector(':scope > [data-trigger]');
    this.#menu = this.querySelector(':scope > menu, :scope > ul[role="menu"]');
    if (!this.#trigger || !this.#menu) return false;

    // Progressive enhancement: use Popover API when available
    this.#usePopover = supportsPopover;
    if (this.#usePopover) {
      this.#menu.setAttribute('popover', 'auto');
    }

    // ARIA setup
    this.#trigger?.setAttribute('aria-expanded', 'false');
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
      // Reset theme button styles (border/shadow leak from unlayered theme rules)
      item.style.cssText += ';border:none;box-shadow:none;transform:none;border-radius:0;';
      this.listen(item, 'click', this.#handleItemClick);

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
    this.listen(this.#trigger, 'contextmenu', this.#handleContextMenu);
    this.listen(this.#menu, 'keydown', this.#handleMenuKeyDown);
    this.listen(window, 'scroll', this.#handleScroll, { capture: true });

    if (this.#usePopover) {
      this.listen(this.#menu, 'toggle', this.#handlePopoverToggle);
    } else {
      this.listen(document, 'click', this.#handleOutsideClick);
      this.listen(document, 'contextmenu', this.#handleOutsideContext);
      this.listen(document, 'keydown', this.#handleEscape);
    }
  }

  teardown() {
    this.#unbindFns.forEach(fn => fn());
    this.#unbindFns = [];
  }

  #handleContextMenu = (e) => {
    e.preventDefault();
    this.#openAt(e.clientX, e.clientY);
  };

  #openAt(x, y) {
    this.#isOpen = true;
    this.setAttribute('data-open', '');
    this.#trigger?.setAttribute('aria-expanded', 'true');

    // Position at cursor
    this.#menu.style.setProperty('--ctx-top', `${y}px`);
    this.#menu.style.setProperty('--ctx-left', `${x}px`);

    // Show via Popover API if available
    if (this.#usePopover) {
      try { this.#menu.showPopover(); } catch { /* already open */ }
    }

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

    this.dispatchEvent(new CustomEvent('context-menu:open', { bubbles: true }));
  }

  close() {
    if (!this.#isOpen) return;
    this.#isOpen = false;
    this.removeAttribute('data-open');
    this.#trigger?.setAttribute('aria-expanded', 'false');
    this.#activeIndex = -1;

    if (this.#usePopover) {
      try { this.#menu.hidePopover(); } catch { /* already closed */ }
    }

    this.dispatchEvent(new CustomEvent('context-menu:close', { bubbles: true }));
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
    this.dispatchEvent(new CustomEvent('context-menu:select', {
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

  #handlePopoverToggle = (e) => {
    if (e.newState === 'closed' && this.#isOpen) {
      this.#isOpen = false;
      this.removeAttribute('data-open');
      this.#activeIndex = -1;
      this.dispatchEvent(new CustomEvent('context-menu:close', { bubbles: true }));
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

registerComponent('context-menu', ContextMenuWc);

export { ContextMenuWc };
