/**
 * dropdown-wc: Accessible dropdown menu component
 *
 * Provides a trigger button with a dropdown menu. Handles keyboard
 * navigation, focus management, and click-outside-to-close.
 *
 * Progressive enhancement: uses Popover API when available for native
 * top-layer positioning and light-dismiss. Falls back to visibility/z-index.
 *
 * @attr {string} data-position - Menu position: 'bottom-start' (default), 'bottom-end', 'top-start', 'top-end'
 * @attr {boolean} data-open - Whether menu is open (reflected)
 * @attr {boolean} data-no-flip - Disable automatic flip when menu doesn't fit
 * @attr {boolean} data-hover - Open on hover/focus instead of click (useful for nav menus)
 *
 * @example
 * <dropdown-wc>
 *   <button data-trigger>Options</button>
 *   <menu>
 *     <li><button>Edit</button></li>
 *     <li><button>Duplicate</button></li>
 *     <li role="separator"></li>
 *     <li><button>Delete</button></li>
 *   </menu>
 * </dropdown-wc>
 *
 * @example Hover-activated (for navigation)
 * <dropdown-wc data-hover>
 *   <a href="/section/" data-trigger>Section</a>
 *   <menu>
 *     <li><a href="/section/page1">Page 1</a></li>
 *     <li><a href="/section/page2">Page 2</a></li>
 *   </menu>
 * </dropdown-wc>
 */

import { supportsPopover } from '../../utils/popover-support.js';

class DropdownWc extends HTMLElement {
  #trigger;
  #menu;
  #items = [];
  #activeIndex = -1;
  #isOpen = false;
  #hoverMode = false;
  #closeTimeout = null;
  #usePopover = false;

  connectedCallback() {
    this.#setup();
  }

  disconnectedCallback() {
    this.#cleanup();
  }

  #setup() {
    // Find trigger
    this.#trigger = this.querySelector(':scope > [data-trigger]');
    if (!this.#trigger) {
      this.#trigger = this.querySelector(':scope > button');
    }
    if (!this.#trigger) return;

    // Find menu
    this.#menu = this.querySelector(':scope > menu, :scope > ul[role="menu"]');
    if (!this.#menu) return;

    // Check for hover mode
    this.#hoverMode = this.hasAttribute('data-hover');

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
      this.addEventListener('mouseenter', this.#handleMouseEnter);
      this.addEventListener('mouseleave', this.#handleMouseLeave);
      this.#trigger.addEventListener('focus', this.#handleTriggerFocus);
      this.#trigger.addEventListener('blur', this.#handleTriggerBlur);
    } else {
      // Click mode: toggle on click
      this.#trigger.addEventListener('click', this.#handleTriggerClick);
    }
    this.#trigger.addEventListener('keydown', this.#handleTriggerKeyDown);
    this.#menu.addEventListener('keydown', this.#handleMenuKeyDown);

    if (this.#usePopover) {
      // Sync internal state when popover is dismissed natively (light-dismiss, Escape)
      this.#menu.addEventListener('toggle', this.#handlePopoverToggle);
    } else {
      // Legacy: manual outside-click and Escape handling
      document.addEventListener('click', this.#handleOutsideClick);
      document.addEventListener('keydown', this.#handleEscape);
    }
  }

  #cleanup() {
    if (this.#closeTimeout) {
      clearTimeout(this.#closeTimeout);
    }
    if (this.#trigger) {
      this.#trigger.removeEventListener('click', this.#handleTriggerClick);
      this.#trigger.removeEventListener('keydown', this.#handleTriggerKeyDown);
      this.#trigger.removeEventListener('focus', this.#handleTriggerFocus);
      this.#trigger.removeEventListener('blur', this.#handleTriggerBlur);
    }
    if (this.#menu) {
      this.#menu.removeEventListener('keydown', this.#handleMenuKeyDown);
      this.#menu.removeEventListener('toggle', this.#handlePopoverToggle);
    }
    this.removeEventListener('mouseenter', this.#handleMouseEnter);
    this.removeEventListener('mouseleave', this.#handleMouseLeave);
    document.removeEventListener('click', this.#handleOutsideClick);
    document.removeEventListener('keydown', this.#handleEscape);
  }

  #collectItems() {
    this.#items = Array.from(
      this.#menu.querySelectorAll('button, a, [role="menuitem"]')
    ).filter(item => !item.disabled && !item.closest('[role="separator"]'));

    // Set role on items
    this.#items.forEach((item, index) => {
      item.setAttribute('role', 'menuitem');
      item.setAttribute('tabindex', '-1');
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
    }
    this.open();
  };

  #handleMouseLeave = () => {
    // Small delay to allow moving between trigger and menu
    this.#closeTimeout = setTimeout(() => {
      this.close();
    }, 100);
  };

  #handleTriggerFocus = () => {
    if (this.#closeTimeout) {
      clearTimeout(this.#closeTimeout);
      this.#closeTimeout = null;
    }
    this.open();
  };

  #handleTriggerBlur = (e) => {
    // Don't close if focus moved into the menu
    if (this.#menu?.contains(e.relatedTarget)) {
      return;
    }
    // Small delay to check if focus is moving into menu
    this.#closeTimeout = setTimeout(() => {
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
      this.removeAttribute('data-open');
      this.#trigger?.setAttribute('aria-expanded', 'false');
      this.#activeIndex = -1;
      this.dispatchEvent(new CustomEvent('dropdown-close', { bubbles: true }));
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
    this.setAttribute('data-open', '');
    this.#trigger?.setAttribute('aria-expanded', 'true');
    this.#activeIndex = -1;

    // Position menu
    this.#positionMenu();

    // Show via Popover API if available
    if (this.#usePopover) {
      try { this.#menu.showPopover(); } catch { /* already open */ }
    }

    this.dispatchEvent(new CustomEvent('dropdown-open', { bubbles: true }));
  }

  close() {
    if (!this.#isOpen || !this.#menu) return;

    this.#isOpen = false;
    this.removeAttribute('data-open');
    this.#trigger?.setAttribute('aria-expanded', 'false');
    this.#activeIndex = -1;

    // Hide via Popover API if available
    if (this.#usePopover) {
      try { this.#menu.hidePopover(); } catch { /* already closed */ }
    }

    this.dispatchEvent(new CustomEvent('dropdown-close', { bubbles: true }));
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

    const position = this.getAttribute('data-position') || 'bottom-start';
    const noFlip = this.hasAttribute('data-no-flip');
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

customElements.define('dropdown-wc', DropdownWc);

export { DropdownWc };
