/**
 * Unit tests for src/lib/diff-by-key.js
 *
 * Uses a minimal in-memory fake DOM (FakeNode) so the algorithm can be
 * exercised without jsdom. The real DOM contract used by diffByKey is small:
 * insertBefore, remove, parentElement, children. FakeNode implements those
 * with the same semantics as the spec for these specific operations.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { diffByKey } from '../../src/lib/diff-by-key.js';

class FakeNode {
  /** @param {string} [tag] */
  constructor(tag = 'div') {
    this.tag = tag;
    /** @type {FakeNode | null} */
    this.parentElement = null;
    /** @type {FakeNode[]} */
    this._children = [];
    /** @type {Record<string, string>} */
    this.attrs = {};
  }
  get children() { return this._children; }

  /** @param {FakeNode} node @param {FakeNode | null} ref */
  insertBefore(node, ref) {
    if (node.parentElement && node.parentElement !== this) {
      node.parentElement._children = node.parentElement._children.filter(c => c !== node);
    } else if (node.parentElement === this) {
      this._children = this._children.filter(c => c !== node);
    }
    node.parentElement = this;
    if (ref == null) {
      this._children.push(node);
    } else {
      const idx = this._children.indexOf(ref);
      if (idx === -1) this._children.push(node);
      else this._children.splice(idx, 0, node);
    }
    return node;
  }

  appendChild(node) { return this.insertBefore(node, null); }

  remove() {
    if (this.parentElement) {
      this.parentElement._children = this.parentElement._children.filter(c => c !== this);
      this.parentElement = null;
    }
  }

  /** Snapshot of current child keys for assertions. */
  childKeys() { return this._children.map(c => c.attrs['data-key']); }
}

function setupRender() {
  const renders = [];
  /** @param {{id: string}} item */
  const renderItem = (item) => {
    const node = new FakeNode('item');
    node.attrs['data-key'] = item.id;
    renders.push(item.id);
    return node;
  };
  return { renderItem, renders };
}

describe('diffByKey — basic insertion', () => {
  let container;
  beforeEach(() => { container = new FakeNode('container'); });

  it('renders all items into a single container in order', () => {
    const { renderItem, renders } = setupRender();
    const nodes = new Map();
    const result = diffByKey({
      newItems: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
      nodes,
      keyOf: it => it.id,
      renderItem,
      containerFor: () => container,
    });
    assert.deepEqual(container.childKeys(), ['a', 'b', 'c']);
    assert.deepEqual(result.added, ['a', 'b', 'c']);
    assert.deepEqual(result.removed, []);
    assert.deepEqual(result.moved, []);
    assert.equal(nodes.size, 3);
    assert.deepEqual(renders, ['a', 'b', 'c']);
  });
});

describe('diffByKey — preservation guarantee', () => {
  it('does NOT recreate nodes whose keys remain after a re-diff', () => {
    const container = new FakeNode('container');
    const nodes = new Map();
    const { renderItem: r1, renders: rendersA } = setupRender();

    diffByKey({
      newItems: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
      nodes, keyOf: it => it.id, renderItem: r1, containerFor: () => container,
    });
    const nodeA = nodes.get('a'), nodeB = nodes.get('b'), nodeC = nodes.get('c');

    const { renderItem: r2, renders: rendersB } = setupRender();
    const result = diffByKey({
      newItems: [{ id: 'b' }, { id: 'c' }, { id: 'a' }],
      nodes, keyOf: it => it.id, renderItem: r2, containerFor: () => container,
    });

    // Same identity: never re-rendered.
    assert.equal(nodes.get('a'), nodeA);
    assert.equal(nodes.get('b'), nodeB);
    assert.equal(nodes.get('c'), nodeC);
    assert.deepEqual(rendersB, [], 'renderItem must not be called for existing keys');
    assert.deepEqual(result.added, []);
    assert.deepEqual(container.childKeys(), ['b', 'c', 'a']);
  });

  it('adds new keys without disturbing existing nodes', () => {
    const container = new FakeNode('container');
    const nodes = new Map();
    diffByKey({
      newItems: [{ id: 'a' }, { id: 'b' }],
      nodes, keyOf: it => it.id, renderItem: setupRender().renderItem, containerFor: () => container,
    });
    const nodeA = nodes.get('a'), nodeB = nodes.get('b');

    const { renderItem, renders } = setupRender();
    const result = diffByKey({
      newItems: [{ id: 'a' }, { id: 'x' }, { id: 'b' }],
      nodes, keyOf: it => it.id, renderItem, containerFor: () => container,
    });

    assert.equal(nodes.get('a'), nodeA);
    assert.equal(nodes.get('b'), nodeB);
    assert.deepEqual(renders, ['x']);
    assert.deepEqual(result.added, ['x']);
    assert.deepEqual(container.childKeys(), ['a', 'x', 'b']);
  });
});

describe('diffByKey — removal', () => {
  it('removes nodes whose keys are gone', () => {
    const container = new FakeNode('container');
    const nodes = new Map();
    diffByKey({
      newItems: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
      nodes, keyOf: it => it.id, renderItem: setupRender().renderItem, containerFor: () => container,
    });

    const result = diffByKey({
      newItems: [{ id: 'a' }, { id: 'c' }],
      nodes, keyOf: it => it.id, renderItem: setupRender().renderItem, containerFor: () => container,
    });

    assert.deepEqual(result.removed, ['b']);
    assert.equal(nodes.has('b'), false);
    assert.deepEqual(container.childKeys(), ['a', 'c']);
  });

  it('removes all when newItems is empty', () => {
    const container = new FakeNode('container');
    const nodes = new Map();
    diffByKey({
      newItems: [{ id: 'a' }, { id: 'b' }],
      nodes, keyOf: it => it.id, renderItem: setupRender().renderItem, containerFor: () => container,
    });
    const result = diffByKey({
      newItems: [],
      nodes, keyOf: it => it.id, renderItem: setupRender().renderItem, containerFor: () => container,
    });
    assert.deepEqual(result.removed, ['a', 'b']);
    assert.equal(nodes.size, 0);
    assert.deepEqual(container.childKeys(), []);
  });
});

describe('diffByKey — multi-container routing (kanban-style)', () => {
  it('routes items into the container chosen by containerFor', () => {
    const todo = new FakeNode('todo');
    const doing = new FakeNode('doing');
    const done = new FakeNode('done');
    const cols = { todo, doing, done };
    const nodes = new Map();
    const { renderItem } = setupRender();

    diffByKey({
      newItems: [
        { id: '1', col: 'todo' },
        { id: '2', col: 'doing' },
        { id: '3', col: 'todo' },
        { id: '4', col: 'done' },
      ],
      nodes, keyOf: it => it.id, renderItem,
      containerFor: (item) => cols[item.col],
    });

    assert.deepEqual(todo.childKeys(), ['1', '3']);
    assert.deepEqual(doing.childKeys(), ['2']);
    assert.deepEqual(done.childKeys(), ['4']);
  });

  it('moves an item to a different container without recreating it (drag-state preservation)', () => {
    const todo = new FakeNode('todo');
    const doing = new FakeNode('doing');
    const cols = { todo, doing };
    const nodes = new Map();

    diffByKey({
      newItems: [{ id: 'task', col: 'todo' }],
      nodes, keyOf: it => it.id, renderItem: setupRender().renderItem,
      containerFor: (item) => cols[item.col],
    });
    const original = nodes.get('task');

    const { renderItem, renders } = setupRender();
    const result = diffByKey({
      newItems: [{ id: 'task', col: 'doing' }],
      nodes, keyOf: it => it.id, renderItem,
      containerFor: (item) => cols[item.col],
    });

    assert.equal(nodes.get('task'), original, 'same node identity across container move');
    assert.deepEqual(renders, [], 'no re-render');
    assert.deepEqual(result.moved, ['task']);
    assert.deepEqual(todo.childKeys(), []);
    assert.deepEqual(doing.childKeys(), ['task']);
  });
});

describe('diffByKey — reordering', () => {
  it('detects intra-container reorder', () => {
    const container = new FakeNode('container');
    const nodes = new Map();
    diffByKey({
      newItems: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
      nodes, keyOf: it => it.id, renderItem: setupRender().renderItem, containerFor: () => container,
    });

    const result = diffByKey({
      newItems: [{ id: 'c' }, { id: 'a' }, { id: 'b' }],
      nodes, keyOf: it => it.id, renderItem: setupRender().renderItem, containerFor: () => container,
    });

    assert.deepEqual(container.childKeys(), ['c', 'a', 'b']);
    // Move set is a subset of {a, b, c}; algorithm reports actual moves.
    assert.equal(result.moved.length > 0, true);
    assert.deepEqual(result.added, []);
    assert.deepEqual(result.removed, []);
  });

  it('reports no moves when order is unchanged', () => {
    const container = new FakeNode('container');
    const nodes = new Map();
    diffByKey({
      newItems: [{ id: 'a' }, { id: 'b' }],
      nodes, keyOf: it => it.id, renderItem: setupRender().renderItem, containerFor: () => container,
    });
    const result = diffByKey({
      newItems: [{ id: 'a' }, { id: 'b' }],
      nodes, keyOf: it => it.id, renderItem: setupRender().renderItem, containerFor: () => container,
    });
    assert.deepEqual(result.moved, []);
    assert.deepEqual(result.added, []);
    assert.deepEqual(result.removed, []);
  });
});

describe('diffByKey — combined add/move/remove', () => {
  it('handles full reconciliation correctly', () => {
    const c1 = new FakeNode('c1');
    const c2 = new FakeNode('c2');
    const cols = { c1, c2 };
    const nodes = new Map();

    diffByKey({
      newItems: [
        { id: 'a', col: 'c1' },
        { id: 'b', col: 'c1' },
        { id: 'c', col: 'c2' },
        { id: 'd', col: 'c2' },
      ],
      nodes, keyOf: it => it.id, renderItem: setupRender().renderItem,
      containerFor: (item) => cols[item.col],
    });
    const nodeA = nodes.get('a');
    const nodeC = nodes.get('c');

    const { renderItem, renders } = setupRender();
    const result = diffByKey({
      newItems: [
        { id: 'c', col: 'c1' },   // moved c2 → c1
        { id: 'a', col: 'c1' },   // stayed in c1, reordered
        { id: 'e', col: 'c1' },   // new
        { id: 'd', col: 'c2' },   // stayed in c2
      ],
      nodes, keyOf: it => it.id, renderItem,
      containerFor: (item) => cols[item.col],
    });

    assert.equal(nodes.get('a'), nodeA, 'a preserved');
    assert.equal(nodes.get('c'), nodeC, 'c preserved across container move');
    assert.deepEqual(renders, ['e'], 'only e re-rendered');
    assert.deepEqual(result.added, ['e']);
    assert.deepEqual(result.removed, ['b']);
    assert.deepEqual(c1.childKeys(), ['c', 'a', 'e']);
    assert.deepEqual(c2.childKeys(), ['d']);
  });
});
