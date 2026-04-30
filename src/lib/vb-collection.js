/**
 * VBCollection — Mixin for "keyed list of children" components.
 *
 * Subclass implements:
 *   _renderItem(item) → Element       Build a fresh element for a new key.
 *   _containerFor(item, existingEl)   (Optional) the parent each item lives in.
 *   _postRender({ added, moved, removed, items })  (Optional) refresh placeholders / counts.
 *
 * Subclass declares (optional):
 *   static keyOf = (item) => item.id   Diff key. Default: item.id.
 *
 * Provides:
 *   .items   getter/setter — assignment runs a keyed diff.
 *   _emit(name, detail, source)  — tags events with source for loop avoidance.
 *
 * Formal guarantee: any element whose key is present in both the previous
 * and the next items list is preserved (never removed and recreated). The
 * same DOM node may be moved across containers or reordered, but its
 * identity — and any in-flight drag, focus, or animation state — survives.
 */

import { diffByKey } from './diff-by-key.js';

/**
 * @template {abstract new (...args: any[]) => HTMLElement} TBase
 * @param {TBase} Base
 */
export function VBCollection(Base) {
  return class extends Base {
    static keyOf(item) { return item.id; }

    #items = [];
    /** @type {Map<unknown, Element>} */
    #nodes = new Map();

    get items() { return this.#items; }
    set items(value) {
      const next = value || [];
      const result = diffByKey({
        newItems: next,
        nodes: this.#nodes,
        keyOf: (this.constructor /** @type {any} */).keyOf,
        renderItem: (item) => this._renderItem(item),
        containerFor: (item, existing) => this._containerFor(item, existing),
      });
      this.#items = next;
      this._postRender({ ...result, items: next });
      this._emit('items-changed', { items: next }, 'api');
    }

    /**
     * Subclass hook. Build a fresh element for a new item.
     * Must return Element. Strings/templates are not accepted (see VB-XG5X).
     */
    _renderItem(_item) {
      throw new Error(`${this.constructor.name}: must implement _renderItem(item)`);
    }

    /**
     * Subclass hook. Where this item lives. Default: the element itself.
     * Override to route items into specific child containers (e.g. kanban columns).
     */
    _containerFor(_item, _existingEl) {
      return this;
    }

    /**
     * Subclass hook. Called after every diff. Use to refresh placeholders,
     * counts, WIP markers, empty-state UI.
     */
    _postRender(_diff) {}

    /**
     * Dispatch a tagged event so consumers can avoid feedback loops.
     * @param {string} name  Event suffix (e.g. 'items-changed').
     * @param {object} detail  Custom payload.
     * @param {'api' | 'attribute' | 'drag' | 'internal' | string} [source='api']
     */
    _emit(name, detail, source = 'api') {
      this.dispatchEvent(new CustomEvent(`${this.localName}:${name}`, {
        detail: { ...detail, source },
        bubbles: true,
      }));
    }

    /**
     * Read-only access to the rendered node for a given key.
     * Useful for subclass hooks that want to update an item in place.
     */
    _nodeFor(key) {
      return this.#nodes.get(key) || null;
    }

    /**
     * Seed the collection from existing DOM (HTML-first upgrade path).
     * Subclass calls this once after parsing initial children so the next
     * `.items = ...` assignment diffs against existing rendered nodes
     * instead of recreating them.
     *
     * @param {any[]} items
     * @param {Map<unknown, Element>} nodeMap  key → existing element
     */
    _seedCollection(items, nodeMap) {
      this.#items = items;
      this.#nodes.clear();
      for (const [key, el] of nodeMap) this.#nodes.set(key, el);
    }

    /**
     * Update the in-memory items array without running a diff (e.g. after
     * a drag mutates the DOM). Subclass is expected to keep the DOM and
     * the items array in sync; this method just records the new model.
     *
     * @param {any[]} items
     */
    _setItemsSilently(items) {
      this.#items = items;
    }
  };
}
