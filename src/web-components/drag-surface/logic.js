/**
 * drag-surface: Accessible drag-and-drop reorder surface
 *
 * Wraps the native HTML Drag and Drop API with keyboard accessibility,
 * live region announcements, and clean custom events. Supports single-surface
 * reorder and cross-surface transfer via shared data-group attributes.
 *
 * @attr {string} data-group - Transfer group; items move between surfaces sharing a group
 * @attr {string} data-orientation - "horizontal" switches to Left/Right arrows and clientX
 * @attr {boolean} data-drag-disabled - Temporarily disables all dragging
 *
 * Children use:
 * @attr {boolean} draggable="true" - Marks an element as draggable
 * @attr {string} data-id - Stable identifier for the item
 * @attr {string} data-sort-order - Numeric position (managed automatically)
 * @attr {boolean} data-drag-handle - If present on a descendant, only that element initiates drag
 *
 * @fires items-reordered - When items within this surface are reordered
 * @fires item-transferred - When an item moves between surfaces
 * @fires reorder-start - When a drag/keyboard reorder begins
 * @fires reorder-end - When a drag/keyboard reorder ends
 *
 * @example
 * <drag-surface data-layout="stack" data-layout-gap="xs">
 *   <article class="card" draggable="true" data-id="a">Item A</article>
 *   <article class="card" draggable="true" data-id="b">Item B</article>
 *   <article class="card" draggable="true" data-id="c">Item C</article>
 * </drag-surface>
 */
class DragSurface extends HTMLElement {
  #liveRegion = null;
  #keyboardOriginalIndex = null;
  #reducedMotion = false;
  #lastPointerTarget = null;

  connectedCallback() {
    this.setAttribute('role', 'list');
    this.#reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.#createLiveRegion();
    this.#setupDragListeners();
    this.#setupKeyboardListeners();
    this.#ensureChildRoles();
  }

  disconnectedCallback() {
    // Clean up static reference if this surface owns the active drag
    if (DragSurface.#activeDrag?.source === this) {
      DragSurface.#activeDrag = null;
    }
  }

  // --- Public API ---

  get draggableChildren() {
    return [...this.querySelectorAll(':scope > [draggable="true"]')];
  }

  get group() {
    return this.dataset.group || null;
  }

  get orientation() {
    return this.dataset.orientation || 'vertical';
  }

  get sortedOrder() {
    return this.draggableChildren.map(el => el.dataset.id);
  }

  // --- Child Setup ---

  #ensureChildRoles() {
    for (const child of this.draggableChildren) {
      if (!child.getAttribute('role')) child.setAttribute('role', 'listitem');
      if (!child.hasAttribute('tabindex')) child.setAttribute('tabindex', '0');
      if (!child.hasAttribute('aria-grabbed')) child.setAttribute('aria-grabbed', 'false');
    }
  }

  // --- Live Region ---

  #createLiveRegion() {
    this.#liveRegion = document.createElement('div');
    this.#liveRegion.setAttribute('role', 'status');
    this.#liveRegion.setAttribute('aria-live', 'polite');
    this.#liveRegion.setAttribute('aria-atomic', 'true');
    this.#liveRegion.style.cssText =
      'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);';
    this.prepend(this.#liveRegion);
  }

  #announce(message) {
    if (!this.#liveRegion) return;
    // Clear then set to ensure screen readers re-announce
    this.#liveRegion.textContent = '';
    requestAnimationFrame(() => {
      this.#liveRegion.textContent = message;
    });
  }

  // --- Drag Events ---

  #setupDragListeners() {
    this.addEventListener('pointerdown', (e) => { this.#lastPointerTarget = e.target; });
    this.addEventListener('dragstart', this.#onDragStart.bind(this));
    this.addEventListener('dragover', this.#onDragOver.bind(this));
    this.addEventListener('dragleave', this.#onDragLeave.bind(this));
    this.addEventListener('drop', this.#onDrop.bind(this));
    this.addEventListener('dragend', this.#onDragEnd.bind(this));
  }

  #onDragStart(e) {
    const item = e.target.closest('[draggable="true"]');
    if (!item || item.parentElement !== this || this.hasAttribute('data-drag-disabled')) return;

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

    this.dispatchEvent(new CustomEvent('reorder-start', { bubbles: true }));
  }

  #onDragOver(e) {
    const activeDrag = DragSurface.#activeDrag;
    if (!activeDrag) return;

    // Only accept items from same group (or both ungrouped)
    if (this.group || activeDrag.source.group) {
      if (this.group !== activeDrag.source.group) return;
    }

    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    this.setAttribute('data-drag-over', '');

    // Calculate drop position and show indicator
    const pos = this.orientation === 'horizontal' ? e.clientX : e.clientY;
    this.#updateDropIndicator(pos);
  }

  #onDragLeave(e) {
    // Only remove if we're actually leaving the surface
    if (e.relatedTarget && !this.contains(e.relatedTarget)) {
      this.removeAttribute('data-drag-over');
      this.#clearDropIndicators();
    }
  }

  #onDrop(e) {
    e.preventDefault();
    this.removeAttribute('data-drag-over');
    this.#clearDropIndicators();

    const activeDrag = DragSurface.#activeDrag;
    if (!activeDrag) return;

    const { item, source, originalIndex } = activeDrag;
    const pos = this.orientation === 'horizontal' ? e.clientX : e.clientY;
    const dropIndex = this.#calculateDropIndex(pos);

    if (source === this) {
      // Reorder within same surface
      this.#insertAtIndex(item, dropIndex);
      this.#updateSortOrders();
      const newIndex = this.#indexOf(item);
      this.#flashDrop(item);
      this.dispatchEvent(new CustomEvent('items-reordered', {
        bubbles: true,
        detail: {
          item,
          itemId: item.dataset.id,
          oldIndex: originalIndex,
          newIndex,
          order: this.sortedOrder,
        }
      }));
    } else {
      // Transfer between surfaces
      this.#insertAtIndex(item, dropIndex);
      this.#updateSortOrders();
      source.#updateSortOrders();
      this.#flashDrop(item);

      this.dispatchEvent(new CustomEvent('item-transferred', {
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
  }

  #onDragEnd() {
    const activeDrag = DragSurface.#activeDrag;
    if (activeDrag?.item) {
      activeDrag.item.removeAttribute('data-dragging');
    }
    this.removeAttribute('data-drag-over');
    this.#clearDropIndicators();
    DragSurface.#activeDrag = null;
    this.dispatchEvent(new CustomEvent('reorder-end', { bubbles: true }));
  }

  // --- Keyboard Reorder ---

  #setupKeyboardListeners() {
    this.addEventListener('keydown', this.#onKeyDown.bind(this));
  }

  #onKeyDown(e) {
    const item = e.target.closest('[draggable="true"]');
    if (!item || item.parentElement !== this || this.hasAttribute('data-drag-disabled')) return;

    const isGrabbed = item.getAttribute('aria-grabbed') === 'true';
    const isHorizontal = this.orientation === 'horizontal';
    const prevKey = isHorizontal ? 'ArrowLeft' : 'ArrowUp';
    const nextKey = isHorizontal ? 'ArrowRight' : 'ArrowDown';

    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (isGrabbed) {
        // Drop
        item.setAttribute('aria-grabbed', 'false');
        this.removeAttribute('data-reorder-mode');
        this.#updateSortOrders();
        this.#flashDrop(item);

        const newIndex = this.#indexOf(item);
        const children = this.draggableChildren;
        this.#announce(
          `${this.#itemLabel(item)}, dropped at position ${newIndex + 1} of ${children.length}`
        );

        this.dispatchEvent(new CustomEvent('items-reordered', {
          bubbles: true,
          detail: {
            item,
            itemId: item.dataset.id,
            oldIndex: this.#keyboardOriginalIndex,
            newIndex,
            order: this.sortedOrder,
          }
        }));
        this.dispatchEvent(new CustomEvent('reorder-end', { bubbles: true }));
        this.#keyboardOriginalIndex = null;
      } else {
        // Grab
        this.#keyboardOriginalIndex = this.#indexOf(item);
        item.setAttribute('aria-grabbed', 'true');
        this.setAttribute('data-reorder-mode', '');

        const children = this.draggableChildren;
        this.#announce(
          `${this.#itemLabel(item)}, grabbed. Position ${this.#keyboardOriginalIndex + 1} of ${children.length}. Use arrow keys to move, Enter to drop, Escape to cancel.`
        );
        this.dispatchEvent(new CustomEvent('reorder-start', { bubbles: true }));
      }
      return;
    }

    // Arrow navigation between items (not grabbed)
    if (!isGrabbed && (e.key === prevKey || e.key === nextKey)) {
      e.preventDefault();
      const children = this.draggableChildren;
      const currentIndex = children.indexOf(item);
      const newIndex = e.key === prevKey
        ? Math.max(0, currentIndex - 1)
        : Math.min(children.length - 1, currentIndex + 1);
      if (newIndex !== currentIndex) {
        children[newIndex].focus();
      }
      return;
    }

    // Reorder grabbed item
    if (isGrabbed && (e.key === prevKey || e.key === nextKey)) {
      e.preventDefault();
      const children = this.draggableChildren;
      const currentIndex = children.indexOf(item);
      const newIndex = e.key === prevKey
        ? Math.max(0, currentIndex - 1)
        : Math.min(children.length - 1, currentIndex + 1);

      if (newIndex !== currentIndex) {
        this.#insertAtIndex(item, newIndex);
        item.focus();
        this.#announce(`Position ${newIndex + 1} of ${children.length}`);
      }
      return;
    }

    // Perpendicular arrows = cross-surface transfer
    const transferPrev = isHorizontal ? 'ArrowUp' : 'ArrowLeft';
    const transferNext = isHorizontal ? 'ArrowDown' : 'ArrowRight';

    if (isGrabbed && (e.key === transferPrev || e.key === transferNext)) {
      e.preventDefault();
      if (!this.group) return;
      const direction = e.key === transferNext ? 1 : -1;
      const target = this.#findAdjacentSurface(direction);
      if (!target) return;

      // Transfer item
      target.appendChild(item);
      target.#updateSortOrders();
      this.#updateSortOrders();
      target.#flashDrop(item);
      item.focus();

      // Announce
      const label = target.getAttribute('aria-label') || 'next surface';
      target.#announce(`Moved to ${label}`);

      // Dispatch transfer event
      target.dispatchEvent(new CustomEvent('item-transferred', {
        bubbles: true,
        detail: {
          item,
          itemId: item.dataset.id,
          fromSurface: this,
          toSurface: target,
          newIndex: target.draggableChildren.indexOf(item),
          fromOrder: this.sortedOrder,
          toOrder: target.sortedOrder,
        }
      }));

      // Hand off reorder mode to the target surface
      this.removeAttribute('data-reorder-mode');
      target.setAttribute('data-reorder-mode', '');
      this.#keyboardOriginalIndex = null;
      // Cross-surface transfer is committed immediately — Escape won't undo it
      return;
    }

    if (isGrabbed && e.key === 'Escape') {
      e.preventDefault();
      item.setAttribute('aria-grabbed', 'false');
      this.removeAttribute('data-reorder-mode');

      // Restore original position
      if (this.#keyboardOriginalIndex != null) {
        this.#insertAtIndex(item, this.#keyboardOriginalIndex);
        item.focus();
      }

      this.#announce('Reorder cancelled');
      this.dispatchEvent(new CustomEvent('reorder-end', { bubbles: true }));
      this.#keyboardOriginalIndex = null;
      return;
    }

    // Escape when not grabbed — leave the surface
    if (!isGrabbed && e.key === 'Escape') {
      e.preventDefault();
      item.blur();
    }
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

  #findAdjacentSurface(direction) {
    if (!this.group) return null;
    const all = [...document.querySelectorAll(`drag-surface[data-group="${this.group}"]`)];
    if (all.length < 2) return null;

    // Sort by visual position (left-to-right, top-to-bottom)
    all.sort((a, b) => {
      const ar = a.getBoundingClientRect();
      const br = b.getBoundingClientRect();
      return ar.left - br.left || ar.top - br.top;
    });

    const index = all.indexOf(this);
    const target = all[index + direction];
    return target || null;
  }

  // --- Helpers ---

  #itemLabel(item) {
    return item.dataset.id || item.textContent.trim().slice(0, 40);
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
    this.draggableChildren.forEach((child, i) => {
      child.dataset.sortOrder = String(i + 1);
    });
  }

  #calculateDropIndex(clientPos) {
    const isHorizontal = this.orientation === 'horizontal';
    const children = this.draggableChildren.filter(
      c => !c.hasAttribute('data-dragging')
    );
    for (let i = 0; i < children.length; i++) {
      const rect = children[i].getBoundingClientRect();
      const mid = isHorizontal
        ? rect.left + rect.width / 2
        : rect.top + rect.height / 2;
      if (clientPos < mid) return i;
    }
    return children.length;
  }

  #updateDropIndicator(clientPos) {
    this.#clearDropIndicators();
    const isHorizontal = this.orientation === 'horizontal';
    const children = this.draggableChildren.filter(
      c => !c.hasAttribute('data-dragging')
    );
    for (let i = 0; i < children.length; i++) {
      const rect = children[i].getBoundingClientRect();
      const mid = isHorizontal
        ? rect.left + rect.width / 2
        : rect.top + rect.height / 2;
      if (clientPos < mid) {
        children[i].setAttribute('data-drop-target', 'before');
        return;
      }
    }
    if (children.length > 0) {
      children[children.length - 1].setAttribute('data-drop-target', 'after');
    }
  }

  #clearDropIndicators() {
    for (const el of this.querySelectorAll('[data-drop-target]')) {
      el.removeAttribute('data-drop-target');
    }
  }

  static #activeDrag = null;
}

customElements.define('drag-surface', DragSurface);
export { DragSurface };
