/**
 * drop-down: Accessible dropdown menu component
 *
 * Composes <pop-over> for the popover surface: pop-over owns the popover
 * attribute, anchor-name wiring, light-dismiss, position-area/inset
 * fallback, and the display:none cascade re-assertion. drop-down layers
 * keyboard navigation, focus management, hover-grace, ARIA, and the
 * items[] data API on top.
 *
 * Two interaction models:
 *  - Action menu (default): APG menu button. The trigger gets
 *    aria-haspopup="menu" + aria-expanded, the list is role="menu" with
 *    roving-focus role="menuitem" rows, arrow/Home/End/typeahead keys.
 *  - Navigation (`hover`): APG disclosure navigation. No menu roles — the
 *    list stays a list of links in the normal Tab order. A <button
 *    aria-expanded> toggles it (generated next to the trigger when the
 *    trigger is a link, so the link still navigates and touch users can
 *    still reach the submenu). Opens on mouse hover or toggle activation,
 *    never on mere focus.
 *
 * @attr {string} position - 'bottom-start' (default) | 'bottom-end' | 'top-start' | 'top-end'
 * @attr {boolean} open - Reflected state — set via open()/close()/toggle(), not initial markup
 * @attr {boolean} no-flip - Keep the requested position; don't flip when the menu overflows the viewport
 * @attr {boolean} hover - Navigation disclosure: link list + toggle button, opens on hover or toggle click
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
 * @example Navigation disclosure (link trigger gets a sibling toggle button)
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

const ITEM = 'button, a, [role="menuitem"]';
const MENU = 'menu, ul[role="menu"]';
const TYPEAHEAD_RESET_MS = 500;

/** @param {Element} item */
function isDisabled(item) {
  return item.hasAttribute('data-disabled') || item.getAttribute('aria-disabled') === 'true'
    || !!(/** @type {any} */ (item).disabled);
}

class DropDown extends VBElement {
  /** @type {HTMLElement} */ #trigger;
  /** The element carrying aria-expanded: the trigger, or the nav toggle button. */
  /** @type {HTMLElement} */ #expander;
  /** @type {HTMLElement} */ #menu;
  /** @type {HTMLElement} */ #popover;
  /** @type {HTMLElement[]} */ #items = [];
  #activeIndex = -1;
  #isOpen = false;
  #navMode = false;
  /** @type {ReturnType<typeof setTimeout> | null} */
  #closeTimeout = null;
  #typeahead = '';
  /** Open state when the pointer went down on the trigger (see #handleTriggerClick). */
  #openAtPointerDown = false;
  /** Navigation mode: the menu is open only because the mouse hovers it. */
  #openedByHover = false;
  /** @type {ReturnType<typeof setTimeout> | null} */
  #typeaheadTimer = null;

  /** The menu owned by this drop-down (never a nested drop-down's menu). */
  #findMenu() {
    return /** @type {HTMLElement | null} */ (this.querySelector(
      `:scope > :is(${MENU}), :scope > pop-over[data-dropdown-host] > :is(${MENU})`));
  }

  setup() {
    // Find trigger
    const trigger = /** @type {HTMLElement | null} */ (
      this.querySelector(':scope > [data-trigger]')
      || this.querySelector(':scope > button:not([data-dropdown-toggle])')
    );
    if (!trigger) return false;
    this.#trigger = trigger;

    const menu = this.#findMenu();
    if (!menu) return false;
    this.#menu = menu;

    this.#navMode = this.hasAttribute('hover');

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
      this.#popover.dataset.mode = this.#navMode ? 'manual' : 'auto';
      this.#popover.dataset.position = this.getAttribute('position') || 'bottom-start';
      this.#popover.dataset.anchor = this.#trigger.id;
      // Move the menu into the pop-over before connecting, so it's a
      // single mount rather than menu → orphan → pop-over → reparent.
      this.#popover.appendChild(this.#menu);
      this.appendChild(this.#popover);
    }
    // Reconfigure on re-setup (items setter re-runs setup) — these are
    // idempotent and just reflect possibly-changed host attributes.
    this.#popover.dataset.mode = this.#navMode ? 'manual' : 'auto';
    this.#popover.dataset.position = this.getAttribute('position') || 'bottom-start';
    this.#popover.dataset.anchor = this.#trigger.id;
    if (this.#menu.parentElement !== this.#popover) {
      this.#popover.appendChild(this.#menu);
    }

    if (!this.#menu.id) this.#menu.id = `dropdown-menu-${++dropDownSeq}`;

    if (this.#navMode) this.#setupNavigation();
    else this.#setupMenu();

    // Disabled rows stay focusable (aria-disabled) but never activate.
    // Capture phase so the item's own click listeners never run either.
    this.listen(this.#menu, 'click', this.#blockDisabledClick, { capture: true });
    this.listen(this.#menu, 'click', this.#handleItemClick);

    // Sync internal state whenever pop-over actually opens/closes — covers
    // light-dismiss and Escape from the native popover layer in click mode.
    // pop-over's events bubble, so a nested drop-down's popover would reach
    // this listener too: the handlers check e.target.
    this.listen(this.#popover, 'pop-over:hide', this.#handlePopoverHide);
    this.listen(this.#popover, 'pop-over:show', this.#handlePopoverShow);
    return true;
  }

  /** APG menu button: menu roles, roving focus, typeahead. */
  #setupMenu() {
    this.#expander = this.#trigger;
    this.querySelector(':scope > button[data-dropdown-toggle]')?.remove();

    this.#trigger.setAttribute('aria-haspopup', 'menu');
    this.#trigger.setAttribute('aria-expanded', 'false');
    this.#trigger.setAttribute('aria-controls', this.#menu.id);
    this.#menu.setAttribute('role', 'menu');

    this.#collectItems();

    this.listen(this.#trigger, 'pointerdown', this.#handleTriggerPointerDown);
    this.listen(this.#trigger, 'click', this.#handleTriggerClick);
    this.listen(this.#trigger, 'keydown', this.#handleTriggerKeyDown);
    this.listen(this.#menu, 'keydown', this.#handleMenuKeyDown);
  }

  /** APG disclosure navigation: no menu roles, a real toggle button. */
  #setupNavigation() {
    /** @type {HTMLElement | null} */
    let toggle = this.#trigger;
    if (this.#trigger.localName === 'a') {
      toggle = /** @type {HTMLElement | null} */ (
        this.querySelector(':scope > button[data-dropdown-toggle]'));
      if (!toggle) {
        toggle = document.createElement('button');
        toggle.setAttribute('type', 'button');
        toggle.setAttribute('data-dropdown-toggle', '');
        this.#trigger.after(toggle);
      }
      if (!toggle.hasAttribute('aria-label') && !toggle.textContent.trim()) {
        const label = this.#trigger.textContent.trim().replace(/\s+/g, ' ');
        toggle.setAttribute('aria-label', `${label} submenu`);
      }
      // The link is a plain link: it navigates, it doesn't own the popup.
      this.#trigger.removeAttribute('aria-haspopup');
      this.#trigger.removeAttribute('aria-expanded');
      this.#trigger.removeAttribute('aria-controls');
    }
    if (!toggle) return;
    this.#expander = toggle;
    toggle.removeAttribute('aria-haspopup');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', this.#menu.id);

    // Strip menu semantics a previous action-mode setup may have left.
    this.#menu.removeAttribute('role');
    this.#menu.querySelectorAll(':scope > li[role="none"]').forEach(li => li.removeAttribute('role'));
    this.#items = this.#ownedItems();
    this.#items.forEach(item => {
      if (item.getAttribute('role') === 'menuitem') item.removeAttribute('role');
      if (item.getAttribute('tabindex') === '-1') item.removeAttribute('tabindex');
      if (item.hasAttribute('data-disabled')) item.setAttribute('aria-disabled', 'true');
    });
    this.#markSeparators();

    this.listen(toggle, 'click', this.#handleToggleClick);
    this.listen(this, 'pointerenter', this.#handlePointerEnter);
    this.listen(this, 'pointerleave', this.#handlePointerLeave);
    this.listen(this, 'focusout', this.#handleFocusOut);
    // Manual popover: no native light-dismiss — handle Escape and outside
    // pointer presses ourselves.
    this.listen(document, 'keydown', this.#handleEscape);
    this.listen(document, 'pointerdown', this.#handleOutsidePointer);
  }

  teardown() {
    if (this.#closeTimeout) clearTimeout(this.#closeTimeout);
    this.#closeTimeout = null;
    if (this.#typeaheadTimer) clearTimeout(this.#typeaheadTimer);
    this.#typeaheadTimer = null;
    this.#typeahead = '';
    // Removing an open popover hides it without a beforetoggle event, so
    // pop-over:hide never reaches us — reset the mirrored state here or a
    // reconnect would think it's still open (open() no-op, close() no-op).
    // On an in-place re-init (items setter) the popover is still open:
    // hide it (the listeners are already released, so no stale sync).
    if (this.#isOpen) /** @type {any} */ (this.#popover)?.hide?.();
    this.#isOpen = false;
    this.#openedByHover = false;
    this.#activeIndex = -1;
    this.removeAttribute('open');
    this.#expander?.setAttribute('aria-expanded', 'false');
  }

  // ── Data API (HTML-first / JS-first dual contract) ──────────────

  /**
   * The current menu items as a plain data array.
   *   { label, value?, href?, disabled? }   — action item
   *   { separator: true }                    — divider
   *
   * @returns {any[]} Menu item records.
   */
  get items() {
    const menu = this.#menu || this.#findMenu();
    if (!menu) return [];
    const result = [];
    for (const li of menu.querySelectorAll(':scope > li')) {
      if (li.matches('[role="separator"]') || li.querySelector(':scope > hr')) {
        result.push({ separator: true });
        continue;
      }
      const action = li.querySelector(ITEM);
      if (!action) continue;
      result.push({
        label: action.textContent.trim().replace(/\s+/g, ' '),
        value: action.getAttribute('data-value') || undefined,
        href: action.tagName === 'A' ? action.getAttribute('href') : undefined,
        disabled: isDisabled(action) || undefined,
      });
    }
    return result;
  }

  set items(value) {
    const next = Array.isArray(value) ? value : [];
    let menu = this.#menu || this.#findMenu();
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
        else action.setAttribute('type', 'button');
        if (entry.value) action.setAttribute('data-value', entry.value);
        if (entry.disabled) {
          // APG: disabled menu items stay focusable — never native disabled.
          action.setAttribute('data-disabled', '');
          action.setAttribute('aria-disabled', 'true');
        }
        action.textContent = entry.label || '';
        li.appendChild(action);
      }
      menu.appendChild(li);
    }

    this._reinit();

    this.dispatchEvent(new CustomEvent('drop-down:items-changed', {
      detail: { items: next, source: 'property' },
      bubbles: true,
    }));
  }

  /** Items whose nearest menu is this one — excludes nested drop-downs' rows. */
  #ownedItems() {
    return /** @type {HTMLElement[]} */ (Array.from(this.#menu.querySelectorAll(ITEM)))
      .filter(item => item.closest(MENU) === this.#menu && !item.closest('[role="separator"]'));
  }

  #markSeparators() {
    this.#menu.querySelectorAll(':scope > li:empty, :scope > [role="separator"], :scope > hr').forEach(sep => {
      sep.setAttribute('role', 'separator');
    });
  }

  #collectItems() {
    // Natively disabled controls cannot take focus, so they stay out of the
    // roving order; data-disabled / aria-disabled rows stay IN it (APG:
    // disabled menu items remain focusable) but cannot be activated.
    const candidates = this.#ownedItems();
    candidates.forEach(item => {
      item.setAttribute('role', 'menuitem');
      item.setAttribute('tabindex', '-1');
      if (item.hasAttribute('data-disabled')) item.setAttribute('aria-disabled', 'true');
    });
    this.#items = candidates.filter(item => !(/** @type {any} */ (item)).disabled);

    this.#menu.querySelectorAll(':scope > li').forEach(li => {
      if (li.querySelector(`:scope > :is(${ITEM})`)) li.setAttribute('role', 'none');
    });
    this.#markSeparators();
  }

  // ── Action menu handlers ──────────────────────────────────────────

  #handleTriggerPointerDown = () => {
    this.#openAtPointerDown = this.#isOpen;
  };

  #handleTriggerClick = (e) => {
    // The trigger isn't a popovertarget invoker, so pressing it while open
    // light-dismisses the popover before this click lands — without this
    // check the click would immediately reopen it.
    const wasOpen = this.#openAtPointerDown;
    this.#openAtPointerDown = false;
    if (e.detail !== 0 && wasOpen && !this.#isOpen) return;
    // detail === 0 → keyboard (Enter/Space) or programmatic activation:
    // APG menu button opens and moves focus to the first item.
    if (e.detail === 0 && !this.#isOpen) {
      this.open();
      this.#focusItem(0);
      return;
    }
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
    // Keys from a nested drop-down's menu bubble through ours; a nested
    // trigger (one of our rows) handles its own keys first.
    if (e.defaultPrevented) return;
    const target = /** @type {Element} */ (e.target);
    if (target.closest?.(MENU) !== this.#menu) return;

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
      case 'Escape':
        e.preventDefault();
        this.close();
        this.#expander?.focus();
        break;
      case 'Tab':
        this.close();
        break;
      case 'Enter':
      case ' ': {
        e.preventDefault();
        const item = this.#items[this.#activeIndex];
        if (item && !isDisabled(item)) item.click();
        break;
      }
      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          this.#handleTypeahead(e.key);
        }
    }
  };

  /** Move focus to the next item whose label starts with the typed prefix. */
  #handleTypeahead(char) {
    if (this.#typeaheadTimer) clearTimeout(this.#typeaheadTimer);
    this.#typeaheadTimer = setTimeout(() => { this.#typeahead = ''; }, TYPEAHEAD_RESET_MS);
    this.#typeahead += char.toLowerCase();

    // Repeating one character cycles through items starting with it.
    const buffer = this.#typeahead;
    const prefix = [...buffer].every(c => c === buffer[0]) ? buffer[0] : buffer;
    const count = this.#items.length;
    // A multi-character prefix may still match the current item.
    const startOffset = prefix.length > 1 ? 0 : 1;
    for (let i = 0; i < count; i++) {
      const index = (this.#activeIndex + startOffset + i + count) % count;
      const label = this.#items[index].textContent.trim().toLowerCase();
      if (label.startsWith(prefix)) {
        this.#focusItem(index);
        return;
      }
    }
  }

  // ── Shared handlers ────────────────────────────────────────────────

  #blockDisabledClick = (e) => {
    const item = /** @type {Element} */ (e.target).closest?.(ITEM);
    if (item && this.#items.includes(/** @type {HTMLElement} */ (item)) && isDisabled(item)) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  #handleItemClick = (e) => {
    const item = /** @type {HTMLElement | null} */ (/** @type {Element} */ (e.target).closest?.(ITEM));
    if (!item || !this.#items.includes(item)) return;
    // A row that triggers a nested drop-down opens it — not a selection.
    if (item.closest('drop-down') !== this) return;
    if (e.defaultPrevented) return;
    this.dispatchEvent(new CustomEvent('drop-down:select', {
      bubbles: true,
      detail: { item, value: item.getAttribute('data-value') || undefined },
    }));
    this.close();
    this.#expander?.focus();
  };

  // ── Navigation disclosure handlers ─────────────────────────────────

  #handleToggleClick = (e) => {
    this.#cancelGrace();
    // Moving the mouse onto the toggle already opened the menu by hover;
    // the click that follows pins it open rather than closing it.
    if (e.detail !== 0 && this.#openedByHover && this.#isOpen) {
      this.#openedByHover = false;
      return;
    }
    this.toggle();
  };

  #cancelGrace() {
    if (this.#closeTimeout) {
      clearTimeout(this.#closeTimeout);
      this.#closeTimeout = null;
      this.setState('hover-grace-pending', false);
    }
  }

  /* Mouse only: a touch tap fires pointerenter too, which would open the
     menu and let the toggle's click immediately close it again. */
  #handlePointerEnter = (e) => {
    if (e.pointerType !== 'mouse') return;
    this.#cancelGrace();
    if (!this.#isOpen) {
      this.open();
      this.#openedByHover = true;
    }
  };

  #handlePointerLeave = (e) => {
    if (e.pointerType !== 'mouse' || !this.#isOpen) return;
    // Keyboard users who opened it and are still inside keep it open.
    if (this.contains(document.activeElement) && document.activeElement !== this.#expander
      && document.activeElement !== this.#trigger) return;
    this.setState('hover-grace-pending', true);
    this.#closeTimeout = setTimeout(() => {
      this.#closeTimeout = null;
      this.setState('hover-grace-pending', false);
      this.close();
    }, 100);
  };

  #handleFocusOut = (e) => {
    const next = /** @type {Node | null} */ (e.relatedTarget);
    if (next && this.contains(next)) return;
    if (!next && this.matches(':hover')) return;
    this.close();
  };

  #handleEscape = (e) => {
    if (e.key !== 'Escape' || !this.#isOpen) return;
    const focusInside = this.contains(document.activeElement);
    // A nested open drop-down closes first (its own handler runs too).
    e.preventDefault();
    this.close();
    if (focusInside) this.#expander?.focus();
  };

  #handleOutsidePointer = (e) => {
    if (!this.#isOpen) return;
    const path = e.composedPath();
    if (!path.includes(this)) this.close();
  };

  /* pop-over event handlers — sync state in BOTH directions so external
     show()/hide() calls AND native light-dismiss converge on the same
     [open] attribute and aria-expanded value. */
  #handlePopoverShow = (e) => {
    if (e.target !== this.#popover || this.#isOpen) return;
    this.#isOpen = true;
    this.setAttribute('open', '');
    this.#expander?.setAttribute('aria-expanded', 'true');
    this.#activeIndex = -1;
    this.dispatchEvent(new CustomEvent('drop-down:open', { bubbles: true }));
  };

  #handlePopoverHide = (e) => {
    if (e.target !== this.#popover || !this.#isOpen) return;
    this.#isOpen = false;
    this.#openedByHover = false;
    this.removeAttribute('open');
    this.#expander?.setAttribute('aria-expanded', 'false');
    this.#activeIndex = -1;
    // Native Escape / light-dismiss would otherwise drop focus on <body>.
    if (this.#menu?.contains(document.activeElement)) this.#expander?.focus();
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
