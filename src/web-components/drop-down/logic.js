/**
 * drop-down: Accessible dropdown menu component
 *
 * Composes <pop-over> for the popover surface: pop-over owns the popover
 * attribute, anchor-name wiring, light-dismiss, position-area/inset
 * fallback, and the display:none cascade re-assertion. drop-down layers
 * keyboard navigation, focus management, hover-grace, ARIA, and the
 * items[] data API on top.
 *
 * @attr {string} position - 'bottom-start' (default) | 'bottom-end' | 'top-start' | 'top-end'
 * @attr {boolean} open - Reflected state — set via open()/close()/toggle(), not initial markup
 * @attr {boolean} no-flip - (reserved — pop-over handles flipping via position-try when supported)
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

import { VBElement } from '../../lib/vb-element.js';
import { registerComponent } from '../../lib/bundle-registry.js';
// Ensure <pop-over> is registered — drop-down composes it for its popover surface.
import '../pop-over/logic.js';

let dropDownSeq = 0;

class DropDown extends VBElement {
  /** @type {HTMLElement} */ #trigger;
  /** @type {HTMLElement} */ #menu;
  /** @type {HTMLElement} */ #popover;
  /** @type {HTMLElement[]} */ #items = [];
  #activeIndex = -1;
  #isOpen = false;
  #hoverMode = false;
  /** @type {ReturnType<typeof setTimeout> | null} */
  #closeTimeout = null;

  setup() {
    // Find trigger
    this.#trigger = this.querySelector(':scope > [data-trigger]')
      || this.querySelector(':scope > button');
    if (!this.#trigger) return false;

    // Find the slotted menu (may already be inside a pop-over from a previous
    // mount; querySelector reaches deeper).
    this.#menu = this.querySelector('menu, ul[role="menu"]');
    if (!this.#menu) return false;

    this.#hoverMode = this.hasAttribute('hover');

    // Compose pop-over: wrap the menu in a <pop-over> that owns popover
    // attribute, anchor positioning, and light-dismiss.
    if (!this.#trigger.id) this.#trigger.id = `dropdown-trigger-${++dropDownSeq}`;
    const existing = /** @type {HTMLElement | null} */ (
      this.querySelector(':scope > pop-over[data-dropdown-host]'));
    if (existing) {
      this.#popover = existing;
    } else {
      /* Configure attributes BEFORE appending — pop-over's setup() runs
         in connectedCallback and reads data-anchor/data-mode/data-position
         eagerly. Setting them post-append would race the upgrade. */
      this.#popover = document.createElement('pop-over');
      this.#popover.setAttribute('data-dropdown-host', '');
      this.#popover.id = `dropdown-${++dropDownSeq}`;
      this.#popover.dataset.mode = this.#hoverMode ? 'manual' : 'auto';
      this.#popover.dataset.position = this.getAttribute('position') || 'bottom-start';
      this.#popover.dataset.anchor = this.#trigger.id;
      // Move the menu into the pop-over before connecting, so it's a
      // single mount rather than menu → orphan → pop-over → reparent.
      this.#popover.appendChild(this.#menu);
      this.appendChild(this.#popover);
    }
    // Reconfigure on re-setup (items setter re-runs setup) — these are
    // idempotent and just reflect possibly-changed host attributes.
    this.#popover.dataset.mode = this.#hoverMode ? 'manual' : 'auto';
    this.#popover.dataset.position = this.getAttribute('position') || 'bottom-start';
    this.#popover.dataset.anchor = this.#trigger.id;
    if (this.#menu.parentElement !== this.#popover) {
      this.#popover.appendChild(this.#menu);
    }

    // ARIA
    this.#trigger.setAttribute('aria-haspopup', 'menu');
    this.#trigger.setAttribute('aria-expanded', 'false');
    if (!this.#menu.id) this.#menu.id = `dropdown-menu-${++dropDownSeq}`;
    this.#trigger.setAttribute('aria-controls', this.#menu.id);
    this.#menu.setAttribute('role', 'menu');

    this.#collectItems();

    if (this.#hoverMode) {
      this.listen(this, 'mouseenter', this.#handleMouseEnter);
      this.listen(this, 'mouseleave', this.#handleMouseLeave);
      this.listen(this.#trigger, 'focus', this.#handleTriggerFocus);
      this.listen(this.#trigger, 'blur', this.#handleTriggerBlur);
    } else {
      this.listen(this.#trigger, 'click', this.#handleTriggerClick);
    }
    this.listen(this.#trigger, 'keydown', this.#handleTriggerKeyDown);
    this.listen(this.#menu, 'keydown', this.#handleMenuKeyDown);

    // Sync internal state whenever pop-over actually opens/closes — covers
    // light-dismiss and Escape from the native popover layer in click mode.
    this.listen(this.#popover, 'pop-over:hide', this.#handlePopoverHide);
    this.listen(this.#popover, 'pop-over:show', this.#handlePopoverShow);

    if (this.#hoverMode) {
      // Manual mode has no native light-dismiss — keep Escape handling.
      this.listen(document, 'keydown', this.#handleEscape);
    }
  }

  teardown() {
    if (this.#closeTimeout) clearTimeout(this.#closeTimeout);
  }

  // ── Data API (HTML-first / JS-first dual contract) ──────────────

  /**
   * The current menu items as a plain data array.
   *   { label, value?, href?, disabled? }   — action item
   *   { separator: true }                    — divider
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

  set items(value) {
    const next = Array.isArray(value) ? value : [];
    let menu = this.querySelector('menu, ul[role="menu"]');
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

    this.#items.forEach((item) => {
      item.setAttribute('role', 'menuitem');
      item.setAttribute('tabindex', '-1');
      // Reset theme button styles (border/shadow leak from unlayered theme rules)
      item.style.cssText += ';border:none;box-shadow:none;transform:none;border-radius:0;';
      item.addEventListener('click', this.#handleItemClick);
    });

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
    if (this.#menu?.contains(e.relatedTarget)) return;
    this.setState('hover-grace-pending', true);
    this.#closeTimeout = setTimeout(() => {
      this.setState('hover-grace-pending', false);
      if (!this.contains(document.activeElement)) this.close();
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
        this.close();
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (this.#activeIndex >= 0) this.#items[this.#activeIndex].click();
        break;
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
    if (!e.defaultPrevented) {
      this.close();
      this.#trigger?.focus();
    }
  };

  /* pop-over event handlers — sync state in BOTH directions so external
     show()/hide() calls AND native light-dismiss converge on the same
     [open] attribute and aria-expanded value. */
  #handlePopoverShow = () => {
    if (this.#isOpen) return;
    this.#isOpen = true;
    this.setAttribute('open', '');
    this.#trigger?.setAttribute('aria-expanded', 'true');
    this.#activeIndex = -1;
    this.dispatchEvent(new CustomEvent('drop-down:open', { bubbles: true }));
  };

  #handlePopoverHide = () => {
    if (!this.#isOpen) return;
    this.#isOpen = false;
    this.removeAttribute('open');
    this.#trigger?.setAttribute('aria-expanded', 'false');
    this.#activeIndex = -1;
    this.dispatchEvent(new CustomEvent('drop-down:close', { bubbles: true }));
  };

  #focusItem(index) {
    if (this.#items.length === 0) return;
    if (index < 0) index = this.#items.length - 1;
    if (index >= this.#items.length) index = 0;
    this.#activeIndex = index;
    this.#items[index].focus();
  }

  open() {
    if (this.#isOpen || !this.#popover) return;
    /** @type {any} */ (this.#popover).show();
  }

  close() {
    if (!this.#isOpen || !this.#popover) return;
    /** @type {any} */ (this.#popover).hide();
  }

  toggle() {
    if (this.#isOpen) this.close();
    else this.open();
  }

  get isOpen() {
    return this.#isOpen;
  }
}

registerComponent('drop-down', DropDown);

export { DropDown };
