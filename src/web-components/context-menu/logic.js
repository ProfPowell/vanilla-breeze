/**
 * context-menu: Right-click context menu with keyboard navigation
 *
 * Composes <pop-over data-mode="auto"> for the popover surface.
 * pop-over owns the popover attribute, the display:none cascade
 * re-assertion, and native light-dismiss (outside click, Escape).
 * Anchoring is bespoke — the menu opens AT THE CURSOR, not anchored
 * to a DOM element — so context-menu sets the pop-over's inline
 * top/left on contextmenu and re-clamps after first layout.
 *
 * Items with data-shortcut get real, page-wide keyboard shortcut bindings
 * (hotkey-bind calls preventDefault, so never bind clipboard combos).
 *
 * Keyboard: the trigger is made focusable when it is not already, and
 * Shift+F10 / the ContextMenu key open the menu at the trigger. Focus
 * returns to the trigger on close.
 *
 * @example
 * <context-menu>
 *   <p data-trigger>Right-click (or focus and press Shift+F10) here</p>
 *   <menu>
 *     <li><button data-shortcut="f2">Rename</button></li>
 *     <li><button data-shortcut="shift+d">Duplicate</button></li>
 *     <li><button data-disabled>Share</button></li>
 *     <li role="separator"></li>
 *     <li><button class="danger">Delete</button></li>
 *   </menu>
 * </context-menu>
 */

import { formatHotkey, isMac } from '../../utils/hotkey-format.js';
import { bindHotkey } from '../../utils/hotkey-bind.js';
import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';
// Ensure <pop-over> is registered — context-menu composes it for its menu surface.
import '../pop-over/logic.js';

let contextMenuSeq = 0;

/** Natively focusable (or author-managed) triggers keep their tab order. */
const FOCUSABLE = 'a[href], button, input, select, textarea, summary, iframe, [tabindex], [contenteditable]:not([contenteditable="false"])';

/** @param {Element} item */
function isDisabled(item) {
  return item.hasAttribute('data-disabled') || item.getAttribute('aria-disabled') === 'true'
    || !!(/** @type {any} */ (item).disabled);
}

/**
 * hotkey-bind combo ("meta+shift+d") → aria-keyshortcuts value
 * ("Meta+Shift+D" on macOS, "Control+Shift+D" elsewhere).
 * @param {string} combo
 */
function toAriaKeyShortcut(combo) {
  return combo.split('+').map(part => {
    const k = part.trim().toLowerCase();
    if (k === 'meta' || k === 'cmd') return isMac ? 'Meta' : 'Control';
    if (k === 'ctrl') return 'Control';
    if (k === 'alt') return 'Alt';
    if (k === 'shift') return 'Shift';
    return k.length === 1 ? k.toUpperCase() : k.charAt(0).toUpperCase() + k.slice(1);
  }).join('+');
}

/**
 * A contextmenu raised from the keyboard carries no pointer position.
 * @param {MouseEvent & { pointerType?: string, pointerId?: number }} e
 */
function isKeyboardContextMenu(e) {
  return e.pointerType === '' || e.pointerId === -1 || e.button === -1
    || (e.clientX === 0 && e.clientY === 0 && e.buttons === 0);
}

class ContextMenuWc extends VBElement {
  /** @type {HTMLElement} */ #trigger;
  /** @type {HTMLElement} */ #menu;
  /** @type {HTMLElement} */ #popover;
  /** @type {HTMLElement[]} */ #items = [];
  #activeIndex = -1;
  #isOpen = false;
  /** @type {Array<() => void>} */ #unbindFns = [];

  setup() {
    const trigger = /** @type {HTMLElement | null} */ (this.querySelector(':scope > [data-trigger]'));
    const menu = /** @type {HTMLElement | null} */ (this.querySelector('menu, ul[role="menu"]'));
    if (!trigger || !menu) return false;
    this.#trigger = trigger;
    this.#menu = menu;

    /* Compose pop-over: wrap the menu in an auto-mode pop-over so the
       browser handles outside-click / Escape dismissal in the top layer.
       Set attributes BEFORE connecting — pop-over's setup() reads
       data-mode eagerly in connectedCallback. */
    const existing = /** @type {HTMLElement | null} */ (
      this.querySelector(':scope > pop-over[data-context-menu-host]'));
    if (existing) {
      this.#popover = existing;
    } else {
      this.#popover = document.createElement('pop-over');
      this.#popover.setAttribute('data-context-menu-host', '');
      this.#popover.id = `ctx-menu-${++contextMenuSeq}`;
      this.#popover.dataset.mode = 'auto';
      // Anchor is the cursor, not a DOM element; intentionally no data-anchor.
      this.#popover.appendChild(this.#menu);
      this.appendChild(this.#popover);
    }
    if (this.#menu.parentElement !== this.#popover) {
      this.#popover.appendChild(this.#menu);
    }

    // ARIA
    this.#menu.setAttribute('role', 'menu');
    if (!this.#menu.id) this.#menu.id = `ctx-menu-list-${++contextMenuSeq}`;
    this.#trigger.setAttribute('aria-haspopup', 'menu');
    this.#trigger.setAttribute('aria-expanded', 'false');
    this.#trigger.setAttribute('aria-controls', this.#menu.id);
    // Keyboard reachability: a <p>/<section> trigger is not focusable, and
    // Shift+F10 / the ContextMenu key only reach a focused element.
    if (!this.#trigger.matches(FOCUSABLE)) {
      this.#trigger.setAttribute('tabindex', '0');
    }

    this.#menu.querySelectorAll(':scope > li:empty:not([data-group]), :scope > [role="separator"], :scope > hr').forEach(sep => {
      sep.setAttribute('role', 'separator');
    });

    this.#wrapGroups();

    // Collect menu items. Natively disabled controls cannot take focus, so
    // they stay out of the roving order; data-disabled items stay IN it
    // (APG: disabled menu items remain focusable) but cannot be activated.
    const candidates = /** @type {HTMLElement[]} */ (
      Array.from(this.#menu.querySelectorAll('button, a, [role="menuitem"]')));
    candidates.forEach(item => {
      item.setAttribute('role', 'menuitem');
      item.setAttribute('tabindex', '-1');
    });
    this.#items = candidates.filter(item => !(/** @type {any} */ (item)).disabled);

    this.#menu.querySelectorAll('li').forEach(li => {
      if (li.querySelector(':scope > :is(button, a, [role="menuitem"])')) li.setAttribute('role', 'none');
    });

    this.#items.forEach(item => {
      if (item.hasAttribute('data-disabled')) item.setAttribute('aria-disabled', 'true');
      this.listen(item, 'click', this.#handleItemClick);

      // Shortcut badges + real bindings
      const shortcut = item.getAttribute('data-shortcut');
      if (shortcut) {
        if (!item.querySelector(':scope > .ctx-kbd')) {
          const kbd = document.createElement('kbd');
          kbd.className = 'ctx-kbd';
          kbd.setAttribute('aria-hidden', 'true');
          kbd.textContent = formatHotkey(shortcut);
          item.appendChild(kbd);
        }
        item.setAttribute('aria-keyshortcuts', toAriaKeyShortcut(shortcut));

        const unbind = bindHotkey(shortcut, () => {
          if (!isDisabled(item)) item.click();
        });
        this.#unbindFns.push(/** @type {() => void} */ (unbind));
      }
    });

    this.listen(this.#trigger, 'contextmenu', this.#handleContextMenu);
    this.listen(this.#trigger, 'keydown', this.#handleTriggerKeyDown);
    this.listen(this.#menu, 'keydown', this.#handleMenuKeyDown);
    // Capture phase: a disabled item's own click listeners never run.
    this.listen(this.#menu, 'click', this.#blockDisabledClick, { capture: true });
    this.listen(window, 'scroll', this.#handleScroll, { capture: true });

    // Sync state when pop-over dismisses natively (outside click / Escape).
    this.listen(this.#popover, 'pop-over:hide', this.#handlePopoverHide);
    return true;
  }

  teardown() {
    this.#unbindFns.forEach(fn => fn());
    this.#unbindFns = [];
    if (this.#isOpen) {
      this.#isOpen = false;
      this.removeAttribute('data-open');
      /** @type {any} */ (this.#popover)?.hide?.();
    }
    this.#activeIndex = -1;
    this.#items = [];
    // Generated badges are rebuilt by setup(); dropping them here keeps
    // reconnects and .items assignments from stacking duplicates.
    this.#menu?.querySelectorAll('.ctx-kbd').forEach(kbd => kbd.remove());
    this.#unwrapGroups();
  }

  /**
   * role="group" needs the items it labels as descendants, but authors write
   * a flat list (<li data-group> label, then sibling items). Wrap each run of
   * items after a label in <li role="group" aria-labelledby><ul role="none">,
   * keeping the label as the group's first (aria-hidden) row. A run ends at
   * the next label or separator. teardown() restores the authored list.
   */
  #wrapGroups() {
    const menu = this.#menu;
    for (const label of /** @type {HTMLElement[]} */ (Array.from(menu.querySelectorAll(':scope > li[data-group]')))) {
      if (!label.id) label.id = `ctx-group-${++contextMenuSeq}`;
      label.classList.add('ctx-group-label');
      label.setAttribute('aria-hidden', 'true');

      const wrapper = document.createElement('li');
      wrapper.setAttribute('role', 'group');
      wrapper.setAttribute('aria-labelledby', label.id);
      wrapper.setAttribute('data-ctx-group', '');
      const list = document.createElement('ul');
      list.setAttribute('role', 'none');
      wrapper.appendChild(list);
      menu.insertBefore(wrapper, label);

      list.appendChild(label);
      let next = wrapper.nextElementSibling;
      while (next && !next.hasAttribute('data-group') && next.getAttribute('role') !== 'separator') {
        const move = next;
        next = next.nextElementSibling;
        list.appendChild(move);
      }
    }
  }

  #unwrapGroups() {
    const menu = this.#menu;
    if (!menu) return;
    for (const wrapper of Array.from(menu.querySelectorAll(':scope > li[data-ctx-group]'))) {
      const list = wrapper.querySelector(':scope > ul');
      if (list) {
        for (const child of Array.from(list.children)) menu.insertBefore(child, wrapper);
      }
      wrapper.remove();
    }
  }

  // ── Data API (HTML-first / JS-first dual contract) ──────────────

  get items() {
    if (!this.#menu) return [];
    const result = [];
    const rows = this.#menu.querySelectorAll(
      ':scope > li:not([data-ctx-group]), :scope > li[data-ctx-group] > ul > li');
    for (const li of rows) {
      if (li.hasAttribute('data-group')) {
        result.push({ group: li.textContent.trim() });
        continue;
      }
      if (li.matches(':empty, [role="separator"]') || li.querySelector('hr')) {
        result.push({ separator: true });
        continue;
      }
      const action = li.querySelector('button, a, [role="menuitem"]');
      if (!action) continue;
      const labelText = Array.from(action.childNodes)
        .filter(n => !(n instanceof Element && n.classList.contains('ctx-kbd')))
        .map(n => n.textContent).join('');
      result.push({
        label: labelText.trim().replace(/\s+/g, ' '),
        value: action.getAttribute('data-value') || undefined,
        href: action.tagName === 'A' ? action.getAttribute('href') : undefined,
        shortcut: action.getAttribute('data-shortcut') || undefined,
        disabled: /** @type {any} */ (action).disabled || action.hasAttribute('data-disabled') || undefined,
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
      } else if (entry.group != null) {
        li.setAttribute('data-group', '');
        li.textContent = entry.group;
      } else {
        const action = entry.href
          ? document.createElement('a')
          : document.createElement('button');
        if (entry.href) action.setAttribute('href', entry.href);
        if (entry.value) action.setAttribute('data-value', entry.value);
        if (entry.shortcut) action.setAttribute('data-shortcut', entry.shortcut);
        // data-disabled (not native disabled) keeps the item focusable and
        // announced as disabled, per the APG menu pattern.
        if (entry.disabled) action.setAttribute('data-disabled', '');
        if (action.tagName === 'BUTTON') action.setAttribute('type', 'button');
        action.textContent = entry.label || '';
        li.appendChild(action);
      }
      menu.appendChild(li);
    }

    this._reinit();

    this.dispatchEvent(new CustomEvent('context-menu:items-changed', {
      detail: { items: next, source: 'property' },
      bubbles: true,
    }));
  }

  #handleContextMenu = (e) => {
    e.preventDefault();
    // Keyboard-originated contextmenu (Shift+F10 / ContextMenu key on a
    // focused trigger) has no pointer position: Chromium reports
    // pointerType "" / pointerId -1, others report 0,0. Open at the trigger.
    if (isKeyboardContextMenu(e)) {
      if (!this.#isOpen) this.#openAtTrigger();
      return;
    }
    // On macOS the contextmenu event fires on pointerDOWN. Opening the
    // auto-mode popover mid-gesture lets the same gesture's pointerup
    // light-dismiss it the instant it opens — so while the triggering
    // button is still held, defer show() until the gesture ends.
    // (Windows fires contextmenu after release: it opens immediately.)
    if (e.buttons !== 0) {
      this.listen(window, 'pointerup', () => {
        setTimeout(() => this.#openAt(e.clientX, e.clientY), 0);
      }, { once: true, capture: true });
    } else {
      this.#openAt(e.clientX, e.clientY);
    }
  };

  /* Not every platform turns Shift+F10 / the ContextMenu key into a
     contextmenu event (macOS has no menu key; headless browsers never
     synthesize one), so handle the keys directly on the focused trigger. */
  #handleTriggerKeyDown = (e) => {
    if (e.target !== this.#trigger) return;
    if (e.key === 'ContextMenu' || (e.key === 'F10' && e.shiftKey)) {
      e.preventDefault();
      if (!this.#isOpen) this.#openAtTrigger();
    }
  };

  #openAtTrigger() {
    const rect = this.#trigger.getBoundingClientRect();
    this.#openAt(rect.left, rect.bottom);
  }

  #openAt(x, y) {
    this.#isOpen = true;
    this.setAttribute('data-open', '');
    this.#trigger?.setAttribute('aria-expanded', 'true');

    // Initial position at cursor (bottom-right of cursor by default).
    this.#popover.style.top = `${y}px`;
    this.#popover.style.left = `${x}px`;

    /** @type {any} */ (this.#popover).show();

    // After render, clamp to viewport edges.
    requestAnimationFrame(() => {
      const rect = this.#popover.getBoundingClientRect();
      const adjustedX = (x + rect.width > window.innerWidth)
        ? x - rect.width
        : x;
      const adjustedY = (y + rect.height > window.innerHeight)
        ? y - rect.height
        : y;

      this.#popover.style.top = `${Math.max(0, adjustedY)}px`;
      this.#popover.style.left = `${Math.max(0, adjustedX)}px`;
    });

    this.#activeIndex = -1;
    this.#focusItem(0);

    this.dispatchEvent(new CustomEvent('context-menu:open', { bubbles: true }));
  }

  close() {
    if (!this.#isOpen) return;
    const restoreFocus = this.#focusIsInMenu();
    this.#isOpen = false;
    this.removeAttribute('data-open');
    this.#trigger?.setAttribute('aria-expanded', 'false');
    this.#activeIndex = -1;

    /** @type {any} */ (this.#popover)?.hide();
    if (restoreFocus) this.#restoreFocus();

    this.dispatchEvent(new CustomEvent('context-menu:close', { bubbles: true }));
  }

  /** Focus is still on a menu item (or was dropped to <body> by the hide). */
  #focusIsInMenu() {
    const active = document.activeElement;
    return !active || active === document.body || !!this.#popover?.contains(active);
  }

  #restoreFocus() {
    if (this.#trigger?.isConnected) this.#trigger.focus({ preventScroll: true });
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
      case ' ': {
        e.preventDefault();
        const item = this.#items[this.#activeIndex];
        if (item && !isDisabled(item)) item.click();
        break;
      }
      case 'Tab':
        this.close();
        break;
    }
  };

  #blockDisabledClick = (e) => {
    const item = /** @type {Element} */ (e.target).closest?.('button, a, [role="menuitem"]');
    if (item && this.#menu.contains(item) && isDisabled(item)) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  #handleItemClick = (e) => {
    // Capture the activated item BEFORE close() resets #activeIndex — a
    // pointer click or a bound shortcut need not match the roving index.
    const item = /** @type {HTMLElement} */ (e.currentTarget);
    if (isDisabled(item)) return;
    this.close();
    this.dispatchEvent(new CustomEvent('context-menu:select', {
      bubbles: true,
      detail: { item, value: item.getAttribute('data-value') || undefined }
    }));
  };

  #handlePopoverHide = () => {
    if (!this.#isOpen) return;
    this.#isOpen = false;
    this.removeAttribute('data-open');
    this.#trigger?.setAttribute('aria-expanded', 'false');
    this.#activeIndex = -1;
    // Escape (native light-dismiss) leaves focus on a hidden item or <body>;
    // an outside click has already moved focus where the user clicked.
    if (this.#focusIsInMenu()) this.#restoreFocus();
    this.dispatchEvent(new CustomEvent('context-menu:close', { bubbles: true }));
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
