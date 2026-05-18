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
import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';
// Ensure <pop-over> is registered — context-menu composes it for its menu surface.
import '../pop-over/logic.js';

let contextMenuSeq = 0;

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
    this.#trigger?.setAttribute('aria-expanded', 'false');
    this.#menu.setAttribute('role', 'menu');
    if (!this.#menu.id) this.#menu.id = `ctx-menu-list-${++contextMenuSeq}`;

    // Group labels — mark as non-interactive
    this.#menu.querySelectorAll(':scope > li[data-group]').forEach(label => {
      label.setAttribute('role', 'presentation');
      label.classList.add('ctx-group-label');
    });

    // Collect menu items
    this.#items = /** @type {HTMLElement[]} */ (
      Array.from(this.#menu.querySelectorAll('button, a, [role="menuitem"]'))
    ).filter(item => !(/** @type {any} */ (item)).disabled && !item.hasAttribute('data-disabled'));

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

        const unbind = bindHotkey(shortcut, () => item.click());
        this.#unbindFns.push(/** @type {() => void} */ (unbind));
      }
    });

    this.#menu.querySelectorAll('li:empty:not([data-group]), [role="separator"], hr').forEach(sep => {
      sep.setAttribute('role', 'separator');
    });

    this.listen(this.#trigger, 'contextmenu', this.#handleContextMenu);
    this.listen(this.#menu, 'keydown', this.#handleMenuKeyDown);
    this.listen(window, 'scroll', this.#handleScroll, { capture: true });

    // Sync state when pop-over dismisses natively (outside click / Escape).
    this.listen(this.#popover, 'pop-over:hide', this.#handlePopoverHide);
    return true;
  }

  teardown() {
    this.#unbindFns.forEach(fn => fn());
    this.#unbindFns = [];
  }

  // ── Data API (HTML-first / JS-first dual contract) ──────────────

  get items() {
    if (!this.#menu) return [];
    const result = [];
    for (const li of this.#menu.querySelectorAll(':scope > li')) {
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
      result.push({
        label: action.textContent.trim().replace(/\s+/g, ' '),
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
        if (entry.disabled) {
          if (action.tagName === 'BUTTON') /** @type {HTMLButtonElement} */ (action).disabled = true;
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

    this.dispatchEvent(new CustomEvent('context-menu:items-changed', {
      detail: { items: next, source: 'property' },
      bubbles: true,
    }));
  }

  #handleContextMenu = (e) => {
    e.preventDefault();
    this.#openAt(e.clientX, e.clientY);
  };

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
    this.#isOpen = false;
    this.removeAttribute('data-open');
    this.#trigger?.setAttribute('aria-expanded', 'false');
    this.#activeIndex = -1;

    /** @type {any} */ (this.#popover)?.hide();

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
        if (this.#activeIndex >= 0) this.#items[this.#activeIndex].click();
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

  #handlePopoverHide = () => {
    if (!this.#isOpen) return;
    this.#isOpen = false;
    this.removeAttribute('data-open');
    this.#trigger?.setAttribute('aria-expanded', 'false');
    this.#activeIndex = -1;
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
