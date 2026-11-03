/**
 * drag-surface: Accessible drag-and-drop reorder surface
 *
 * Wraps the native HTML Drag and Drop API with keyboard accessibility,
 * optional single-pointer move controls (WCAG 2.5.7), live region
 * announcements, and clean custom events. Supports single-surface reorder
 * and cross-surface transfer via shared group attributes.
 *
 * @attr {string} group - Transfer group; items move between surfaces sharing a group
 * @attr {string} orientation - "horizontal" switches to inline-axis arrows and drop maths (direction-aware)
 * @attr {boolean} disabled - Disables dragging, dropping, keyboard reorder and move controls
 * @attr {boolean} data-move-controls - Renders per-item Move buttons (single-pointer alternative to dragging)
 *
 * Children use:
 * @attr {boolean} draggable="true" - Marks an element as draggable
 * @attr {string} data-id - Stable identifier for the item
 * @attr {string} data-sort-order - Numeric position (managed automatically)
 * @attr {boolean} data-drag-handle - If present on a descendant, only that element initiates drag
 *
 * @fires drag-surface:reorder - When items within this surface are reordered
 * @fires drag-surface:transfer - When an item moves between surfaces
 * @fires drag-surface:reorder-start - When a drag/keyboard reorder begins
 * @fires drag-surface:reorder-end - When a drag/keyboard reorder ends
 *
 * @example
 * <drag-surface data-layout="stack" data-layout-gap="xs">
 *   <article draggable="true" data-id="a">Item A</article>
 *   <article draggable="true" data-id="b">Item B</article>
 *   <article draggable="true" data-id="c">Item C</article>
 * </drag-surface>
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

const CONTROLS_ATTR = 'data-drag-surface-controls';
const LIVE_ATTR = 'data-drag-surface-live';

class DragSurface extends VBElement {
  static observedAttributes = ['disabled', 'data-move-controls', 'orientation', 'group', 'aria-label'];

  /** @type {HTMLElement | null} */
  #liveRegion = null;
  /** @type {HTMLElement | null} — item currently grabbed for keyboard reorder */
  #grabbed = null;
  /** @type {number | null} */
  #keyboardOriginalIndex = null;
  /** @type {EventTarget | null} */
  #lastPointerTarget = null;
  /** @type {MutationObserver | null} */
  #observer = null;

  setup() {
    this.setAttribute('role', 'list');
    DragSurface.#instances.add(this);
    this.#createLiveRegion();
    this.#setupDragListeners();
    this.#setupKeyboardListeners();
    this.listen(this, 'click', this.#onControlClick.bind(this));
    this.#ensureChildRoles();
    this.#syncDisabled();
    this.#observer = new MutationObserver(() => this.#onChildrenChanged());
    this.#observer.observe(this, { childList: true });
    DragSurface.#refreshAllControls();
  }

  teardown() {
    this.#observer?.disconnect();
    this.#observer = null;

    if (this.#liveRegion) {
      this.#liveRegion.remove();
      this.#liveRegion = null;
    }

    if (this.#grabbed) this.#setGrabbed(this.#grabbed, false);
    this.#grabbed = null;
    this.#keyboardOriginalIndex = null;
    this.removeAttribute('data-reorder-mode');
    this.removeAttribute('data-drag-over');
    this.#clearDropIndicators();
    this.#removeControls();

    DragSurface.#instances.delete(this);
    if (DragSurface.#activeDrag?.source === this) {
      DragSurface.#activeDrag = null;
    }
    DragSurface.#refreshAllControls();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue || !this.hasAttribute('data-upgraded')) return;
    if (name === 'disabled') this.#syncDisabled();
    DragSurface.#refreshAllControls();
  }

  // --- Public API ---

  get draggableChildren() {
    return [.../** @type {NodeListOf<HTMLElement>} */ (this.querySelectorAll(':scope > [draggable="true"]'))];
  }

  get group() {
    return this.getAttribute('group') || null;
  }

  get orientation() {
    return this.getAttribute('orientation') === 'horizontal' ? 'horizontal' : 'vertical';
  }

  get disabled() {
    return this.hasAttribute('disabled');
  }

  set disabled(value) {
    this.toggleAttribute('disabled', Boolean(value));
  }

  get sortedOrder() {
    return this.draggableChildren.map(el => el.dataset.id);
  }

  // --- Child Setup ---

  #ensureChildRoles() {
    for (const child of this.draggableChildren) {
      if (!child.getAttribute('role')) child.setAttribute('role', 'listitem');
      if (!child.hasAttribute('tabindex')) child.setAttribute('tabindex', '0');
    }
  }

  #onChildrenChanged() {
    this.#ensureChildRoles();
    // A grabbed item removed by someone else ends the keyboard grab here.
    if (this.#grabbed && this.#grabbed.parentElement !== this) {
      this.#setGrabbed(this.#grabbed, false);
      this.#grabbed = null;
      this.#keyboardOriginalIndex = null;
      this.removeAttribute('data-reorder-mode');
    }
    DragSurface.#refreshAllControls();
  }

  #syncDisabled() {
    if (this.disabled) {
      this.setAttribute('aria-disabled', 'true');
      if (this.#grabbed) this.#cancelGrab();
    } else {
      this.removeAttribute('aria-disabled');
    }
  }

  // --- Live Region ---

  /* Lives beside the surface (not inside role=list, which may only own
     listitems) and inside the same subtree, so it stays non-inert when the
     surface sits in a modal dialog. Hidden by component CSS. */
  #createLiveRegion() {
    const region = document.createElement('span');
    region.setAttribute(LIVE_ATTR, '');
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    this.after(region);
    this.#liveRegion = region;
  }

  #announce(message) {
    const region = this.#liveRegion;
    if (!region) return;
    // Clear then set to ensure screen readers re-announce
    region.textContent = '';
    requestAnimationFrame(() => {
      region.textContent = message;
    });
  }

  // --- Drag Events ---

  #setupDragListeners() {
    this.listen(this, 'pointerdown', (e) => { this.#lastPointerTarget = e.target; });
    this.listen(this, 'dragstart', this.#onDragStart.bind(this));
    this.listen(this, 'dragover', this.#onDragOver.bind(this));
    this.listen(this, 'dragleave', this.#onDragLeave.bind(this));
    this.listen(this, 'drop', this.#onDrop.bind(this));
    this.listen(this, 'dragend', this.#onDragEnd.bind(this));
  }

  #onDragStart(e) {
    const item = e.target.closest('[draggable="true"]');
    if (!item || item.parentElement !== this) return;
    if (this.disabled) {
      e.preventDefault();
      return;
    }

    // Handle drag-handle constraint — check the original pointerdown target,
    // not e.target (which is always the draggable element in dragstart)
    const handle = item.querySelector('[data-drag-handle]');
    if (handle && !handle.contains(this.#lastPointerTarget)) {
      e.preventDefault();
      return;
    }

    item.setAttribute('data-dragging', '');

    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item.dataset.id || '');
    e.dataTransfer.setData('application/x-drag-surface-group', this.group || '');

    // Store reference globally for cross-surface transfers
    const originalIndex = this.#indexOf(item);
    DragSurface.#activeDrag = { item, source: this, originalIndex };

    this.dispatchEvent(new CustomEvent('drag-surface:reorder-start', { bubbles: true }));
  }

  /**
   * @param {DragSurface} source
   * @returns {boolean}
   */
  #accepts(source) {
    if (this.disabled) return false;
    // Only accept items from same group (or both ungrouped)
    if (this.group || source.group) return this.group === source.group;
    return source === this;
  }

  #onDragOver(e) {
    const activeDrag = DragSurface.#activeDrag;
    if (!activeDrag || !this.#accepts(activeDrag.source)) return;

    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    this.setAttribute('data-drag-over', '');
    this.#updateDropIndicator(e.clientX, e.clientY);
  }

  #onDragLeave(e) {
    // Only remove if we're actually leaving the surface
    if (e.relatedTarget && !this.contains(e.relatedTarget)) {
      this.removeAttribute('data-drag-over');
      this.#clearDropIndicators();
    }
  }

  #onDrop(e) {
    const activeDrag = DragSurface.#activeDrag;
    if (!activeDrag || !this.#accepts(activeDrag.source)) return;
    e.preventDefault();

    const { item, source, originalIndex } = activeDrag;
    const dropIndex = this.#calculateDropIndex(e.clientX, e.clientY);
    DragSurface.#clearAllDragState();

    if (source === this) {
      this.#insertAtIndex(item, dropIndex);
      this.#updateSortOrders();
      this.#flashDrop(item);
      this.#dispatchReorder(item, originalIndex);
    } else {
      this.#insertAtIndex(item, dropIndex);
      this.#updateSortOrders();
      source.#updateSortOrders();
      this.#flashDrop(item);
      this.#dispatchTransfer(item, source);
    }
  }

  #onDragEnd() {
    const activeDrag = DragSurface.#activeDrag;
    DragSurface.#clearAllDragState();
    DragSurface.#activeDrag = null;
    // dragend bubbles from wherever the item now lives; report it on the source
    (activeDrag?.source ?? this).dispatchEvent(
      new CustomEvent('drag-surface:reorder-end', { bubbles: true })
    );
  }

  static #clearAllDragState() {
    DragSurface.#activeDrag?.item.removeAttribute('data-dragging');
    for (const surface of DragSurface.#instances) {
      surface.removeAttribute('data-drag-over');
      surface.#clearDropIndicators();
    }
  }

  // --- Keyboard Reorder ---

  #setupKeyboardListeners() {
    this.listen(this, 'keydown', this.#onKeyDown.bind(this));
    this.listen(this, 'focusout', this.#onFocusOut.bind(this));
  }

  /** The element keyboard reorder listens on: the item itself or its focusable handle. */
  #keyItemFor(target) {
    const item = target.closest('[draggable="true"]');
    if (!item || item.parentElement !== this) return null;
    if (target === item) return item;
    const handle = item.querySelector('[data-drag-handle]');
    if (handle && handle === target) return item;
    return null;
  }

  #onKeyDown(e) {
    const item = this.#keyItemFor(e.target);
    if (!item || this.disabled) return;
    if (e.altKey || e.ctrlKey || e.metaKey) return;

    const focusTarget = /** @type {HTMLElement} */ (e.target);
    const isGrabbed = this.#grabbed === item;
    const isHorizontal = this.orientation === 'horizontal';
    const rtl = this.#isRtl();
    const prevKey = isHorizontal ? (rtl ? 'ArrowRight' : 'ArrowLeft') : 'ArrowUp';
    const nextKey = isHorizontal ? (rtl ? 'ArrowLeft' : 'ArrowRight') : 'ArrowDown';

    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (isGrabbed) this.#dropGrab(item);
      else this.#startGrab(item);
      return;
    }

    if (e.key === prevKey || e.key === nextKey) {
      e.preventDefault();
      const children = this.draggableChildren;
      const currentIndex = children.indexOf(item);
      const newIndex = e.key === prevKey
        ? Math.max(0, currentIndex - 1)
        : Math.min(children.length - 1, currentIndex + 1);
      if (newIndex === currentIndex) return;

      if (!isGrabbed) {
        // Roving focus between items
        children[newIndex].focus();
        return;
      }
      this.#insertAtIndex(item, newIndex);
      focusTarget.focus();
      this.#announce(`Position ${newIndex + 1} of ${children.length}`);
      return;
    }

    // Perpendicular arrows = cross-surface transfer (physical: the surface
    // that is visually in the arrow's direction)
    const transferPrev = isHorizontal ? 'ArrowUp' : 'ArrowLeft';
    const transferNext = isHorizontal ? 'ArrowDown' : 'ArrowRight';

    if (isGrabbed && (e.key === transferPrev || e.key === transferNext)) {
      e.preventDefault();
      const target = this.#findAdjacentSurface(e.key === transferNext ? 1 : -1);
      if (!target) return;

      this.#grabbed = null;
      this.#keyboardOriginalIndex = null;
      this.removeAttribute('data-reorder-mode');

      this.#transferTo(target, item);
      focusTarget.focus();

      // Hand the grab to the target: Escape now returns the item to where it
      // landed, and a drop reports that index as oldIndex. The transfer
      // itself is committed.
      target.#grabbed = item;
      target.#keyboardOriginalIndex = target.#indexOf(item);
      target.setAttribute('data-reorder-mode', '');
      target.#announce(`Moved to ${target.#surfaceLabel()}`);
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      if (isGrabbed) this.#cancelGrab();
      else item.blur();
    }
  }

  #onFocusOut() {
    // Deferred: moving a node can blur it before we re-focus it.
    setTimeout(() => {
      const item = this.#grabbed;
      if (item && !item.contains(document.activeElement)) this.#cancelGrab();
    }, 0);
  }

  #startGrab(item) {
    if (this.#grabbed && this.#grabbed !== item) this.#cancelGrab();
    this.#keyboardOriginalIndex = this.#indexOf(item);
    this.#grabbed = item;
    this.#setGrabbed(item, true);
    this.setAttribute('data-reorder-mode', '');

    const count = this.draggableChildren.length;
    this.#announce(
      `${this.#itemLabel(item)}, grabbed. Position ${this.#keyboardOriginalIndex + 1} of ${count}. Use arrow keys to move, Enter to drop, Escape to cancel.`
    );
    this.dispatchEvent(new CustomEvent('drag-surface:reorder-start', { bubbles: true }));
  }

  #dropGrab(item) {
    const oldIndex = this.#keyboardOriginalIndex;
    this.#grabbed = null;
    this.#keyboardOriginalIndex = null;
    this.#setGrabbed(item, false);
    this.removeAttribute('data-reorder-mode');
    this.#updateSortOrders();
    this.#flashDrop(item);

    const newIndex = this.#indexOf(item);
    this.#announce(
      `${this.#itemLabel(item)}, dropped at position ${newIndex + 1} of ${this.draggableChildren.length}`
    );
    this.#dispatchReorder(item, oldIndex);
    this.dispatchEvent(new CustomEvent('drag-surface:reorder-end', { bubbles: true }));
  }

  #cancelGrab() {
    const item = this.#grabbed;
    if (!item) return;
    const originalIndex = this.#keyboardOriginalIndex;
    this.#grabbed = null;
    this.#keyboardOriginalIndex = null;
    this.#setGrabbed(item, false);
    this.removeAttribute('data-reorder-mode');

    if (originalIndex != null && item.parentElement === this && this.#indexOf(item) !== originalIndex) {
      const hadFocus = item.contains(document.activeElement) ? document.activeElement : null;
      this.#insertAtIndex(item, originalIndex);
      /** @type {HTMLElement | null} */ (hadFocus)?.focus();
    }

    this.#announce('Reorder cancelled');
    this.dispatchEvent(new CustomEvent('drag-surface:reorder-end', { bubbles: true }));
  }

  /* Grab state: data-grabbed for CSS, aria-pressed on a button handle, and a
     transient aria-description on the item (aria-grabbed is deprecated). */
  #setGrabbed(item, on) {
    item.toggleAttribute('data-grabbed', on);
    const handle = item.querySelector('[data-drag-handle]');
    if (handle && (handle.localName === 'button' || handle.getAttribute('role') === 'button')) {
      handle.setAttribute('aria-pressed', String(on));
    }
    if (on) {
      if (!item.hasAttribute('aria-description')) {
        item.setAttribute('aria-description', 'Grabbed');
        item.setAttribute('data-drag-surface-description', '');
      }
    } else if (item.hasAttribute('data-drag-surface-description')) {
      item.removeAttribute('aria-description');
      item.removeAttribute('data-drag-surface-description');
    }
  }

  // --- Move controls (single-pointer alternative, WCAG 2.5.7) ---

  static #refreshAllControls() {
    for (const surface of DragSurface.#instances) surface.#refreshControls();
  }

  #removeControls() {
    for (const el of this.querySelectorAll(`:scope > [draggable="true"] > [${CONTROLS_ATTR}]`)) {
      el.remove();
    }
  }

  #refreshControls() {
    if (!this.isConnected) return;
    if (!this.hasAttribute('data-move-controls')) {
      // Items transferred in from a surface that renders controls lose them
      this.#removeControls();
      return;
    }
    const children = this.draggableChildren;
    const isHorizontal = this.orientation === 'horizontal';
    const rtl = this.#isRtl();
    const disabled = this.disabled;
    const prevSurface = this.#findAdjacentSurface(-1);
    const nextSurface = this.#findAdjacentSurface(1);

    const prevWord = isHorizontal ? (rtl ? 'right' : 'left') : 'up';
    const nextWord = isHorizontal ? (rtl ? 'left' : 'right') : 'down';
    const glyph = { up: '↑', down: '↓', left: '←', right: '→' };
    // Transfer buttons point physically at the adjacent surface
    const toPrevGlyph = isHorizontal ? glyph.up : glyph.left;
    const toNextGlyph = isHorizontal ? glyph.down : glyph.right;

    children.forEach((item, i) => {
      let box = item.querySelector(`:scope > [${CONTROLS_ATTR}]`);
      if (!box) {
        box = document.createElement('span');
        box.setAttribute(CONTROLS_ATTR, '');
        for (const move of ['prev', 'next', 'to-prev', 'to-next']) {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'ghost small';
          btn.dataset.move = move;
          box.append(btn);
        }
        item.append(box);
      }
      const label = this.#itemLabel(item);
      const set = (move, text, name, isDisabled, hidden = false) => {
        const btn = /** @type {HTMLButtonElement} */ (box.querySelector(`[data-move="${move}"]`));
        if (btn.textContent !== text) btn.textContent = text;
        btn.setAttribute('aria-label', name);
        btn.setAttribute('aria-disabled', String(isDisabled));
        btn.hidden = hidden;
      };
      set('prev', glyph[prevWord], `Move ${label} ${prevWord}`, disabled || i === 0);
      set('next', glyph[nextWord], `Move ${label} ${nextWord}`, disabled || i === children.length - 1);
      set('to-prev', toPrevGlyph, prevSurface ? `Move ${label} to ${prevSurface.#surfaceLabel()}` : '', disabled, !prevSurface);
      set('to-next', toNextGlyph, nextSurface ? `Move ${label} to ${nextSurface.#surfaceLabel()}` : '', disabled, !nextSurface);
    });
  }

  #onControlClick(e) {
    const btn = /** @type {HTMLElement | null} */ (e.target.closest(`[${CONTROLS_ATTR}] > button[data-move]`));
    if (!btn) return;
    const item = btn.closest('[draggable="true"]');
    if (!item || item.parentElement !== this) return;
    e.preventDefault();
    if (this.disabled || btn.getAttribute('aria-disabled') === 'true') return;

    // A pointer move commits any in-progress keyboard grab as-is
    if (this.#grabbed) {
      this.#setGrabbed(this.#grabbed, false);
      this.#grabbed = null;
      this.#keyboardOriginalIndex = null;
      this.removeAttribute('data-reorder-mode');
    }

    const move = btn.dataset.move;
    /** @type {DragSurface} */
    let home = this;
    if (move === 'prev' || move === 'next') {
      const oldIndex = this.#indexOf(item);
      const newIndex = oldIndex + (move === 'prev' ? -1 : 1);
      if (newIndex < 0 || newIndex >= this.draggableChildren.length) return;
      this.#insertAtIndex(item, newIndex);
      this.#updateSortOrders();
      this.#flashDrop(item);
      this.#announce(`${this.#itemLabel(item)}, moved to position ${newIndex + 1} of ${this.draggableChildren.length}`);
      this.#dispatchReorder(item, oldIndex);
    } else {
      const target = this.#findAdjacentSurface(move === 'to-next' ? 1 : -1);
      if (!target) return;
      this.#transferTo(target, item);
      target.#announce(`${target.#itemLabel(item)}, moved to ${target.#surfaceLabel()}`);
      home = target;
    }

    // Keep focus on the control the user pressed (moving a node drops focus);
    // aria-disabled (not disabled) keeps it focusable at the list ends.
    DragSurface.#refreshAllControls();
    const again = /** @type {HTMLElement | null} */ (item.querySelector(`[${CONTROLS_ATTR}] > [data-move="${move}"]`));
    if (again && !again.hidden) again.focus();
    else if (home.isConnected) /** @type {HTMLElement} */ (item).focus();
  }

  // --- Shared move helpers ---

  /** Append item to target and fire drag-surface:transfer on the target. */
  #transferTo(target, item) {
    target.appendChild(item);
    target.#updateSortOrders();
    this.#updateSortOrders();
    target.#flashDrop(item);
    target.#dispatchTransfer(item, this);
  }

  #dispatchReorder(item, oldIndex) {
    this.dispatchEvent(new CustomEvent('drag-surface:reorder', {
      bubbles: true,
      detail: {
        item,
        itemId: item.dataset.id,
        oldIndex,
        newIndex: this.#indexOf(item),
        order: this.sortedOrder,
      }
    }));
  }

  /**
   * @param {HTMLElement} item
   * @param {DragSurface} source
   */
  #dispatchTransfer(item, source) {
    this.dispatchEvent(new CustomEvent('drag-surface:transfer', {
      bubbles: true,
      detail: {
        item,
        itemId: item.dataset.id,
        fromSurface: source,
        toSurface: this,
        newIndex: this.#indexOf(item),
        fromOrder: source.sortedOrder,
        toOrder: this.sortedOrder,
      }
    }));
  }

  // --- Visual Feedback ---

  #flashDrop(item) {
    item.setAttribute('data-just-dropped', '');
    item.addEventListener('animationend', () => {
      item.removeAttribute('data-just-dropped');
    }, { once: true });
    // Fallback removal if animation doesn't fire (reduced motion)
    setTimeout(() => item.removeAttribute('data-just-dropped'), 500);
  }

  // --- Cross-Surface ---

  /**
   * The grouped surface visually before (-1) or after (+1) this one along the
   * transfer axis: physical left/right for vertical surfaces, top/bottom for
   * horizontal ones — matching the perpendicular arrow keys. Disabled
   * surfaces are skipped.
   * @returns {DragSurface | null}
   */
  #findAdjacentSurface(direction) {
    if (!this.group) return null;
    const all = [...DragSurface.#instances].filter(
      s => s === this || (s.group === this.group && s.isConnected && !s.disabled)
    );
    if (all.length < 2) return null;

    const horizontal = this.orientation === 'horizontal';
    const rects = new Map(all.map(s => [s, s.getBoundingClientRect()]));
    all.sort((a, b) => {
      const ar = /** @type {DOMRect} */ (rects.get(a));
      const br = /** @type {DOMRect} */ (rects.get(b));
      return horizontal
        ? (ar.top - br.top || ar.left - br.left)
        : (ar.left - br.left || ar.top - br.top);
    });

    return all[all.indexOf(this) + direction] || null;
  }

  // --- Helpers ---

  #isRtl() {
    return getComputedStyle(this).direction === 'rtl';
  }

  #surfaceLabel() {
    const label = this.getAttribute('aria-label');
    if (label) return label;
    const ids = this.getAttribute('aria-labelledby');
    if (ids) {
      const text = ids.split(/\s+/)
        .map(id => document.getElementById(id)?.textContent.trim())
        .filter(Boolean).join(' ');
      if (text) return text;
    }
    return 'another list';
  }

  #itemLabel(item) {
    const aria = item.getAttribute('aria-label');
    if (aria) return aria;
    const clone = /** @type {HTMLElement} */ (item.cloneNode(true));
    for (const el of clone.querySelectorAll(`[${CONTROLS_ATTR}], [aria-hidden="true"], [data-drag-handle]:not(:has(*))`)) {
      el.remove();
    }
    const text = clone.textContent.replace(/\s+/g, ' ').trim().slice(0, 40);
    return text || item.dataset.id || 'Item';
  }

  #indexOf(item) {
    return this.draggableChildren.indexOf(item);
  }

  #insertAtIndex(item, index) {
    const children = this.draggableChildren.filter(c => c !== item);
    const reference = children[index] || null;
    if (reference) {
      this.insertBefore(item, reference);
    } else {
      this.appendChild(item);
    }
  }

  #updateSortOrders() {
    this.draggableChildren.forEach((/** @type {HTMLElement} */ child, i) => {
      child.dataset.sortOrder = String(i + 1);
    });
  }

  /**
   * Index among the non-dragged children before which a drop at (x, y)
   * lands, plus that child. Horizontal surfaces honour the computed
   * direction: in RTL the inline start is on the right.
   * @returns {{ index: number, children: HTMLElement[] }}
   */
  #dropPosition(clientX, clientY) {
    const isHorizontal = this.orientation === 'horizontal';
    const rtl = isHorizontal && this.#isRtl();
    const children = this.draggableChildren.filter(c => !c.hasAttribute('data-dragging'));
    for (let i = 0; i < children.length; i++) {
      const rect = children[i].getBoundingClientRect();
      let before;
      if (!isHorizontal) before = clientY < rect.top + rect.height / 2;
      else if (rtl) before = clientX > rect.left + rect.width / 2;
      else before = clientX < rect.left + rect.width / 2;
      if (before) return { index: i, children };
    }
    return { index: children.length, children };
  }

  #calculateDropIndex(clientX, clientY) {
    return this.#dropPosition(clientX, clientY).index;
  }

  #updateDropIndicator(clientX, clientY) {
    this.#clearDropIndicators();
    const { index, children } = this.#dropPosition(clientX, clientY);
    if (index < children.length) {
      children[index].setAttribute('data-drop-target', 'before');
    } else if (children.length > 0) {
      children[children.length - 1].setAttribute('data-drop-target', 'after');
    }
  }

  #clearDropIndicators() {
    for (const el of this.querySelectorAll('[data-drop-target]')) {
      el.removeAttribute('data-drop-target');
    }
  }

  /** @type {Set<DragSurface>} */
  static #instances = new Set();

  /** @type {{ item: HTMLElement; source: DragSurface; originalIndex: number } | null} */
  static #activeDrag = null;
}

registerComponent('drag-surface', DragSurface);
export { DragSurface };
