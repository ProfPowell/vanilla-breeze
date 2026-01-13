/**
 * dropdown-wc: Accessible dropdown menu component
 *
 * Provides a trigger button with a dropdown menu. Handles keyboard
 * navigation, focus management, and click-outside-to-close.
 *
 * @attr {string} data-position - Menu position: 'bottom-start' (default), 'bottom-end', 'top-start', 'top-end'
 * @attr {boolean} data-open - Whether menu is open (reflected)
 * @attr {boolean} data-no-flip - Disable automatic flip when menu doesn't fit
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
 */
class DropdownWc extends HTMLElement {
  #trigger;
  #menu;
  #items = [];
  #activeIndex = -1;
  #isOpen = false;

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
    this.#trigger.addEventListener('click', this.#handleTriggerClick);
    this.#trigger.addEventListener('keydown', this.#handleTriggerKeyDown);
    this.#menu.addEventListener('keydown', this.#handleMenuKeyDown);
    document.addEventListener('click', this.#handleOutsideClick);
    document.addEventListener('keydown', this.#handleEscape);
  }

  #cleanup() {
    if (this.#trigger) {
      this.#trigger.removeEventListener('click', this.#handleTriggerClick);
      this.#trigger.removeEventListener('keydown', this.#handleTriggerKeyDown);
    }
    if (this.#menu) {
      this.#menu.removeEventListener('keydown', this.#handleMenuKeyDown);
    }
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

    this.dispatchEvent(new CustomEvent('dropdown-open', { bubbles: true }));
  }

  close() {
    if (!this.#isOpen || !this.#menu) return;

    this.#isOpen = false;
    this.removeAttribute('data-open');
    this.#trigger?.setAttribute('aria-expanded', 'false');
    this.#activeIndex = -1;

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

    let top, left;
    const gap = 4;

    // Vertical position
    if (position.startsWith('top')) {
      top = -menuRect.height - gap;
      // Flip to bottom if not enough space above (unless noFlip)
      if (!noFlip && triggerRect.top + top < 0) {
        top = triggerRect.height + gap;
      }
    } else {
      top = triggerRect.height + gap;
      // Flip to top if not enough space below (unless noFlip)
      if (!noFlip && triggerRect.bottom + menuRect.height + gap > viewportHeight) {
        top = -menuRect.height - gap;
      }
    }

    // Horizontal position
    if (position.endsWith('end')) {
      left = triggerRect.width - menuRect.width;
      // Shift if overflows left
      if (triggerRect.left + left < 0) {
        left = 0;
      }
    } else {
      left = 0;
      // Shift if overflows right
      if (triggerRect.left + menuRect.width > viewportWidth) {
        left = triggerRect.width - menuRect.width;
      }
    }

    this.#menu.style.setProperty('--dropdown-top', `${top}px`);
    this.#menu.style.setProperty('--dropdown-left', `${left}px`);
  }

  get isOpen() {
    return this.#isOpen;
  }
}

customElements.define('dropdown-wc', DropdownWc);

export { DropdownWc };
