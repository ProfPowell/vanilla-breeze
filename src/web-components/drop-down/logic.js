/**
 * drop-down: Accessible dropdown menu component
 *
 * Provides a trigger button with a dropdown menu. Handles keyboard
 * navigation, focus management, and click-outside-to-close.
 *
 * Progressive enhancement: uses Popover API when available for native
 * top-layer positioning and light-dismiss. Falls back to visibility/z-index.
 *
 * @attr {string} position - Menu position: 'bottom-start' (default), 'bottom-end', 'top-start', 'top-end'
 * @attr {boolean} open - Reflected state only — set by open()/close()/toggle() methods, not intended as initial markup
 * @attr {boolean} no-flip - Disable automatic flip when menu doesn't fit
 * @attr {boolean} hover - Open on hover/focus instead of click (useful for nav menus)
 *
 * @example
 * <drop-down>
 *   <button data-trigger>Options</button>
 *   <menu>
 *     <li><button>Edit</button></li>
 *     <li><button>Duplicate</button></li>
 *     <li role="separator"></li>
 *     <li><button>Delete</button></li>
 *   </menu>
 * </drop-down>
 *
 * @example Hover-activated (for navigation)
 * <drop-down hover>
 *   <a href="/section/" data-trigger>Section</a>
 *   <menu>
 *     <li><a href="/section/page1">Page 1</a></li>
 *     <li><a href="/section/page2">Page 2</a></li>
 *   </menu>
 * </drop-down>
 */

import { supportsPopover } from '../../utils/popover-support.js';
import { VBElement } from '../../lib/vb-element.js';
import { registerComponent } from '../../lib/bundle-registry.js';

class DropDown extends VBElement {
  #trigger;
  #menu;
  #items = [];
  #activeIndex = -1;
  #isOpen = false;
  #hoverMode = false;
  /** @type {ReturnType<typeof setTimeout> | null} */
  #closeTimeout = null;
  #usePopover = false;

  setup() {
    // Find trigger
    this.#trigger = this.querySelector(':scope > [data-trigger]');
    if (!this.#trigger) {
      this.#trigger = this.querySelector(':scope > button');
    }
    if (!this.#trigger) return false;

    // Find menu
    this.#menu = this.querySelector(':scope > menu, :scope > ul[role="menu"]');
    if (!this.#menu) return false;

    // Check for hover mode
    this.#hoverMode = this.hasAttribute('hover');

    // Progressive enhancement: use Popover API when available (not for hover mode)
    this.#usePopover = supportsPopover && !this.#hoverMode;
    if (this.#usePopover) {
      this.#menu.setAttribute('popover', 'auto');
    }

    // Set up ARIA
    this.#trigger.setAttribute('aria-haspopup', 'menu');
    this.#trigger.setAttribute('aria-expanded', 'false');

    if (!this.#menu.id) {
      this.#menu.id = `dropdown-menu-${crypto.randomUUID().slice(0, 8)}`;
    }
    this.#trigger.setAttribute('aria-controls', this.#menu.id);
    this.#menu.setAttribute('role', 'menu');

    // Collect menu items (buttons or links, not separators)
    this.#collectItems();

    // Event listeners
    if (this.#hoverMode) {
      // Hover mode: open on hover/focus, click navigates (for link triggers)
      this.listen(this, 'mouseenter', this.#handleMouseEnter);
      this.listen(this, 'mouseleave', this.#handleMouseLeave);
      this.listen(this.#trigger, 'focus', this.#handleTriggerFocus);
      this.listen(this.#trigger, 'blur', this.#handleTriggerBlur);
    } else {
      // Click mode: toggle on click
      this.listen(this.#trigger, 'click', this.#handleTriggerClick);
    }
    this.listen(this.#trigger, 'keydown', this.#handleTriggerKeyDown);
    this.listen(this.#menu, 'keydown', this.#handleMenuKeyDown);

    if (this.#usePopover) {
      // Sync internal state when popover is dismissed natively (light-dismiss, Escape)
      this.listen(this.#menu, 'toggle', this.#handlePopoverToggle);
    } else {
      // Legacy: manual outside-click and Escape handling
      this.listen(document, 'click', this.#handleOutsideClick);
      this.listen(document, 'keydown', this.#handleEscape);
    }
  }

  teardown() {
    if (this.#closeTimeout) {
      clearTimeout(this.#closeTimeout);
    }
  }

  // ── Data API (HTML-first / JS-first dual contract) ──────────────

  /**
   * The current menu items as a plain data array. Each entry is one of:
   *   { label, value?, href?, disabled? }   — action item
   *   { separator: true }                    — divider
   * Reads from the live <menu>/<ul> children.
   */
  get items() {
    if (!this.#menu) return [];
    const result = [];
    for (const li of this.#menu.querySelectorAll(':scope > li')) {
      if (li.matches('[role="separator"]') || li.querySelector('hr')) {
        result.push({ separator: true });
        continue;
      }
      const action = li.querySelector('button, a, [role="menuitem"]');
      if (!action) continue;
      result.push({
        label: action.textContent.trim().replace(/\s+/g, ' '),
        value: action.getAttribute('data-value') || undefined,
        href: action.tagName === 'A' ? action.getAttribute('href') : undefined,
        disabled: action.disabled || action.hasAttribute('data-disabled') || undefined,
      });
    }
    return result;
  }

  /**
   * Replace the menu items and re-render. Each entry can be an action
   * (`{ label, value?, href?, disabled? }`) or a separator
   * (`{ separator: true }`). Auto-creates the <menu> shell if none
   * exists. The trigger button is preserved.
   *
   * Emits drop-down:items-changed { items, source: 'property' }.
   */
  set items(value) {
    const next = Array.isArray(value) ? value : [];
    let menu = this.querySelector(':scope > menu, :scope > ul[role="menu"]');
    if (!menu) {
      menu = document.createElement('menu');
      this.appendChild(menu);
    }
    while (menu.firstChild) menu.firstChild.remove();

    for (const entry of next) {
      const li = document.createElement('li');
      if (entry.separator) {
        li.setAttribute('role', 'separator');
      } else {
        const action = entry.href
          ? document.createElement('a')
          : document.createElement('button');
        if (entry.href) action.setAttribute('href', entry.href);
        if (entry.value) action.setAttribute('data-value', entry.value);
        if (entry.disabled) {
          if (action.tagName === 'BUTTON') action.disabled = true;
          else action.setAttribute('data-disabled', '');
        }
        action.textContent = entry.label || '';
        li.appendChild(action);
      }
      menu.appendChild(li);
    }

    this.teardown();
    this.removeAttribute('data-upgraded');
    this.setup();

    this.dispatchEvent(new CustomEvent('drop-down:items-changed', {
      detail: { items: next, source: 'property' },
      bubbles: true,
    }));
  }

  #collectItems() {
    this.#items = Array.from(
      this.#menu.querySelectorAll('button, a, [role="menuitem"]')
    ).filter(item => !item.disabled && !item.closest('[role="separator"]'));

    // Set role on items
    this.#items.forEach((item, index) => {
      item.setAttribute('role', 'menuitem');
      item.setAttribute('tabindex', '-1');
      // Reset theme button styles (border/shadow leak from unlayered theme rules)
      item.style.cssText += ';border:none;box-shadow:none;transform:none;border-radius:0;';
      item.addEventListener('click', this.#handleItemClick);
    });

    // Set role on separators
    this.#menu.querySelectorAll('li:empty, [role="separator"], hr').forEach(sep => {
      sep.setAttribute('role', 'separator');
    });
  }

  #handleTriggerClick = (e) => {
    e.stopPropagation();
    this.toggle();
  };

  // Hover mode handlers
  #handleMouseEnter = () => {
    if (this.#closeTimeout) {
      clearTimeout(this.#closeTimeout);
      this.#closeTimeout = null;
      this.setState('hover-grace-pending', false);
    }
    this.open();
  };

  #handleMouseLeave = () => {
    // Small delay to allow moving between trigger and menu
    this.setState('hover-grace-pending', true);
    this.#closeTimeout = setTimeout(() => {
      this.setState('hover-grace-pending', false);
      this.close();
    }, 100);
  };

  #handleTriggerFocus = () => {
    if (this.#closeTimeout) {
      clearTimeout(this.#closeTimeout);
      this.#closeTimeout = null;
      this.setState('hover-grace-pending', false);
    }
    this.open();
  };

  #handleTriggerBlur = (e) => {
    // Don't close if focus moved into the menu
    if (this.#menu?.contains(e.relatedTarget)) {
      return;
    }
    // Small delay to check if focus is moving into menu
    this.setState('hover-grace-pending', true);
    this.#closeTimeout = setTimeout(() => {
      this.setState('hover-grace-pending', false);
      if (!this.contains(document.activeElement)) {
        this.close();
      }
    }, 100);
  };

  #handleTriggerKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowDown':
      case 'Down':
        e.preventDefault();
        this.open();
        this.#focusItem(0);
        break;
      case 'ArrowUp':
      case 'Up':
        e.preventDefault();
        this.open();
        this.#focusItem(this.#items.length - 1);
        break;
    }
  };

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
      case 'Tab':
        // Close and let focus move naturally
        this.close();
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (this.#activeIndex >= 0) {
          this.#items[this.#activeIndex].click();
        }
        break;
    }
  };

  #handleOutsideClick = (e) => {
    if (this.#isOpen && !this.contains(e.target)) {
      this.close();
    }
  };

  #handleEscape = (e) => {
    if (e.key === 'Escape' && this.#isOpen) {
      e.preventDefault();
      this.close();
      this.#trigger?.focus();
    }
  };

  #handlePopoverToggle = (e) => {
    // Sync internal state when popover is dismissed natively (light-dismiss)
    if (e.newState === 'closed' && this.#isOpen) {
      this.#isOpen = false;
      this.removeAttribute('open');
      this.#trigger?.setAttribute('aria-expanded', 'false');
      this.#activeIndex = -1;
      this.dispatchEvent(new CustomEvent('drop-down:close', { bubbles: true }));
    }
  };

  #handleItemClick = (e) => {
    // Close menu after item click (unless item prevents default)
    if (!e.defaultPrevented) {
      this.close();
      this.#trigger?.focus();
    }
  };

  #focusItem(index) {
    if (this.#items.length === 0) return;

    // Wrap around
    if (index < 0) index = this.#items.length - 1;
    if (index >= this.#items.length) index = 0;

    this.#activeIndex = index;
    this.#items[index].focus();
  }

  open() {
    if (this.#isOpen || !this.#menu) return;

    this.#isOpen = true;
    this.setAttribute('open', '');
    this.#trigger?.setAttribute('aria-expanded', 'true');
    this.#activeIndex = -1;

    // Position menu
    this.#positionMenu();

    // Show via Popover API if available
    if (this.#usePopover) {
      try { this.#menu.showPopover(); } catch { /* already open */ }
    }

    this.dispatchEvent(new CustomEvent('drop-down:open', { bubbles: true }));
  }

  close() {
    if (!this.#isOpen || !this.#menu) return;

    this.#isOpen = false;
    this.removeAttribute('open');
    this.#trigger?.setAttribute('aria-expanded', 'false');
    this.#activeIndex = -1;

    // Hide via Popover API if available
    if (this.#usePopover) {
      try { this.#menu.hidePopover(); } catch { /* already closed */ }
    }

    this.dispatchEvent(new CustomEvent('drop-down:close', { bubbles: true }));
  }

  toggle() {
    if (this.#isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  #positionMenu() {
    if (!this.#trigger || !this.#menu) return;

    const position = this.getAttribute('position') || 'bottom-start';
    const noFlip = this.hasAttribute('no-flip');
    const triggerRect = this.#trigger.getBoundingClientRect();
    const menuRect = this.#menu.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const gap = 4;

    if (this.#usePopover) {
      // Popover: position with fixed viewport coordinates (top-layer)
      let top, left;

      if (position.startsWith('top')) {
        top = triggerRect.top - menuRect.height - gap;
        if (!noFlip && top < 0) {
          top = triggerRect.bottom + gap;
        }
      } else {
        top = triggerRect.bottom + gap;
        if (!noFlip && top + menuRect.height > viewportHeight) {
          top = triggerRect.top - menuRect.height - gap;
        }
      }

      if (position.endsWith('end')) {
        left = triggerRect.right - menuRect.width;
        if (left < 0) left = triggerRect.left;
      } else {
        left = triggerRect.left;
        if (left + menuRect.width > viewportWidth) {
          left = triggerRect.right - menuRect.width;
        }
      }

      this.#menu.style.setProperty('--dropdown-top', `${Math.max(0, top)}px`);
      this.#menu.style.setProperty('--dropdown-left', `${Math.max(0, left)}px`);
    } else {
      // Legacy: position relative to trigger
      let top, left;

      if (position.startsWith('top')) {
        top = -menuRect.height - gap;
        if (!noFlip && triggerRect.top + top < 0) {
          top = triggerRect.height + gap;
        }
      } else {
        top = triggerRect.height + gap;
        if (!noFlip && triggerRect.bottom + menuRect.height + gap > viewportHeight) {
          top = -menuRect.height - gap;
        }
      }

      if (position.endsWith('end')) {
        left = triggerRect.width - menuRect.width;
        if (triggerRect.left + left < 0) left = 0;
      } else {
        left = 0;
        if (triggerRect.left + menuRect.width > viewportWidth) {
          left = triggerRect.width - menuRect.width;
        }
      }

      this.#menu.style.setProperty('--dropdown-top', `${top}px`);
      this.#menu.style.setProperty('--dropdown-left', `${left}px`);
    }
  }

  get isOpen() {
    return this.#isOpen;
  }
}

registerComponent('drop-down', DropDown);

export { DropDown };
