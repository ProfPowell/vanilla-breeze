/**
 * Keyed list diff with move-not-recreate semantics.
 *
 * Reconciles a `nodes` map (key → Element) against `newItems` so that
 * each key in `newItems` ends up rendered in its target container at
 * its target index. Existing nodes are moved rather than recreated;
 * only new keys cause renderItem() to fire.
 *
 * Formal guarantee: a node whose key appears in both the current map
 * and `newItems` is never removed. It may be moved (different parent
 * or different position within the same parent), but the underlying
 * DOM node identity is preserved — so in-flight drag state, focus,
 * and CSS animations survive.
 *
 * The DOM operations used are minimal: `Node.insertBefore`, `Element.remove`,
 * and reads of `parentElement` / `children`. Subclasses are responsible for
 * removing non-managed children (placeholders, etc.) before the diff if
 * they want clean indexing.
 *
 * @template T
 * @param {object} opts
 * @param {T[]} opts.newItems
 * @param {Map<unknown, Element>} opts.nodes  Mutated in place.
 * @param {(item: T) => unknown} opts.keyOf
 * @param {(item: T) => Element} opts.renderItem  Called only for new keys.
 * @param {(item: T, existingEl: Element | null) => Element} opts.containerFor
 * @returns {{ added: unknown[], moved: unknown[], removed: unknown[] }}
 */
export function diffByKey({ newItems, nodes, keyOf, renderItem, containerFor }) {
  const added = [];
  const moved = [];
  const removed = [];

  // 1. Compute new key set for membership checks.
  const newKeys = new Set();
  for (const item of newItems) newKeys.add(keyOf(item));

  // 2. Remove nodes whose keys are gone. (No node with a still-live key is
  //    ever removed — that's the formal preservation guarantee.)
  for (const [key, el] of [...nodes]) {
    if (!newKeys.has(key)) {
      el.remove();
      nodes.delete(key);
      removed.push(key);
    }
  }

  // 3. Resolve each item's target container. Group entries per container
  //    so we can reconcile each container's order in one pass.
  /** @type {Map<Element, Array<{ item: T, key: unknown, existing: Element | null }>>} */
  const byContainer = new Map();
  for (const item of newItems) {
    const key = keyOf(item);
    const existing = nodes.get(key) || null;
    const container = containerFor(item, existing);
    if (!byContainer.has(container)) byContainer.set(container, []);
    byContainer.get(container).push({ item, key, existing });
  }

  // 4. For each container, place each entry at its target index.
  //    insertBefore is a no-op when the node is already at that position,
  //    and a move (preserving identity) when it isn't.
  for (const [container, entries] of byContainer) {
    for (let i = 0; i < entries.length; i++) {
      const { item, key, existing } = entries[i];
      let el = existing;
      if (!el) {
        el = renderItem(item);
        nodes.set(key, el);
        added.push(key);
      } else if (el.parentElement !== container) {
        moved.push(key);
      } else {
        // Same container: detect intra-container reorder.
        if (container.children[i] !== el) moved.push(key);
      }

      const target = container.children[i];
      if (target !== el) {
        container.insertBefore(el, target || null);
      }
    }
  }

  return { added, moved, removed };
}
