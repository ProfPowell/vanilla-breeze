// @ts-nocheck -- unit test fakes intentionally diverge from DOM types
/**
 * Unit tests for new trigger handlers (intersect, media, event) and
 * stagger modes (reverse, random, grid).
 */

import { describe, it, before, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

function installBrowserShim() {
  globalThis.window = {
    _mqListeners: new Map(),
    matchMedia: (q) => {
      const entry = globalThis.window._mqListeners.get(q) || {
        matches: false,
        listeners: new Set(),
      };
      globalThis.window._mqListeners.set(q, entry);
      return {
        get matches() { return entry.matches; },
        set matches(v) { entry.matches = v; },
        addEventListener: (_t, fn) => entry.listeners.add(fn),
        removeEventListener: (_t, fn) => entry.listeners.delete(fn),
      };
    },
  };
  class FakeElement {
    constructor(tag = 'div') {
      this.tagName = tag.toUpperCase();
      this._attrs = new Map();
      this._evts = new Map();
      this.style = {
        _props: new Map(),
        setProperty(name, value) { this._props.set(name, value); },
        getPropertyValue(name) { return this._props.get(name) || ''; },
      };
      this.offsetWidth = 0; // accessed for reflow nudge
    }
    get className() { return this._attrs.get('class') || ''; }
    get id() { return this._attrs.get('id') || ''; }
    hasAttribute(n) { return this._attrs.has(n); }
    getAttribute(n) { return this._attrs.has(n) ? this._attrs.get(n) : null; }
    setAttribute(n, v) { this._attrs.set(n, String(v)); }
    removeAttribute(n) { this._attrs.delete(n); }
    addEventListener(type, fn) {
      if (!this._evts.has(type)) this._evts.set(type, new Set());
      this._evts.get(type).add(fn);
    }
    removeEventListener(type, fn) { this._evts.get(type)?.delete(fn); }
    dispatchEvent(event) {
      this._evts.get(event.type)?.forEach((fn) => fn(event));
      return true;
    }
    querySelectorAll() { return []; }
  }
  globalThis.Element = FakeElement;
  globalThis.Node = { ELEMENT_NODE: 1 };
  globalThis.CustomEvent = class CustomEvent {
    constructor(type, init = {}) {
      this.type = type;
      this.detail = init.detail;
      this.bubbles = init.bubbles ?? false;
    }
  };
  globalThis.Event = class Event {
    constructor(type) { this.type = type; }
  };
  globalThis.MutationObserver = class { observe() {} disconnect() {} };

  // IntersectionObserver shim: store registered callbacks so tests can fire entries.
  const ioInstances = [];
  globalThis.IntersectionObserver = class IntersectionObserver {
    constructor(cb, opts) {
      this.cb = cb;
      this.opts = opts;
      this.observed = [];
      ioInstances.push(this);
    }
    observe(el) { this.observed.push(el); }
    disconnect() { this.observed = []; }
    /** Helper: simulate intersection for the first observed element. */
    _fireEntry(isIntersecting) {
      this.cb([{ isIntersecting, target: this.observed[0] }]);
    }
  };
  globalThis._ioInstances = ioInstances;

  const docListeners = new Map();
  globalThis.document = {
    documentElement: { hasAttribute: () => false },
    body: {},
    querySelectorAll: () => [],
    addEventListener: (t, fn) => {
      if (!docListeners.has(t)) docListeners.set(t, new Set());
      docListeners.get(t).add(fn);
    },
    removeEventListener: (t, fn) => docListeners.get(t)?.delete(fn),
  };
  return { FakeElement };
}

let VB;
let triggers;

describe('VB new triggers', () => {
  // Load once — vb-triggers.js registers handlers as a module side-effect on
  // first import, and cache-busting the parent vb.js while the side-effecting
  // file imports the cached vb.js would split the map. Shim is reset per test.
  before(async () => {
    installBrowserShim();
    const mod = await import('../../src/lib/vb.js');
    VB = mod.VB;
    await import('../../src/lib/vb-triggers.js');
    triggers = VB._triggers;
  });
  beforeEach(() => {
    // Reset the browser shim and IntersectionObserver instance list per test.
    installBrowserShim();
  });
  afterEach(() => {
    VB.disconnect();
  });

  it('registers intersect / media / event triggers', () => {
    assert.equal(typeof triggers.get('intersect'), 'function');
    assert.equal(typeof triggers.get('media'), 'function');
    assert.equal(typeof triggers.get('event'), 'function');
  });

  it('intersect:once activates on first entry, then disconnects', () => {
    const el = new globalThis.Element('div');
    el.setAttribute('data-effect', 'fade-in');
    const fired = [];
    triggers.get('intersect')(el, () => fired.push('a'), 'once');
    const io = globalThis._ioInstances.at(-1);
    io._fireEntry(true);
    assert.deepEqual(fired, ['a']);
    // After firing once, disconnect is called — observed list cleared.
    assert.equal(io.observed.length, 0);
  });

  it('intersect:toggle re-fires on enter and deactivates on leave', () => {
    const el = new globalThis.Element('div');
    el.setAttribute('data-effect', 'fade-in');
    const events = [];
    el.addEventListener('vb:phase-change', (e) => events.push(e.detail.active));
    triggers.get('intersect')(el, () => VB.activate(el), 'toggle');
    const io = globalThis._ioInstances.at(-1);

    io._fireEntry(true);
    io._fireEntry(false);
    io._fireEntry(true);

    assert.deepEqual(events, [true, false, true]);
  });

  it('media trigger activates when the query matches initially', () => {
    const el = new globalThis.Element('div');
    el.setAttribute('data-effect', 'neon');
    const fired = [];

    // Pre-seed the matchMedia entry as matching.
    globalThis.window._mqListeners.set('(prefers-color-scheme: dark)', {
      matches: true,
      listeners: new Set(),
    });

    triggers.get('media')(el, () => fired.push('on'), '(prefers-color-scheme: dark)');
    assert.deepEqual(fired, ['on']);
  });

  it('media trigger flips on `change` event', () => {
    const el = new globalThis.Element('div');
    el.setAttribute('data-effect', 'fade-in');
    el.addEventListener('vb:phase-change', () => {});

    globalThis.window._mqListeners.set('(min-width: 60rem)', {
      matches: false,
      listeners: new Set(),
    });

    let activations = 0;
    triggers.get('media')(el, () => { VB.activate(el); activations++; }, '(min-width: 60rem)');
    assert.equal(activations, 0); // didn't match initially

    // Flip the query, fire change.
    const entry = globalThis.window._mqListeners.get('(min-width: 60rem)');
    entry.matches = true;
    entry.listeners.forEach((fn) => fn({}));
    assert.equal(activations, 1);
  });

  it('event trigger activates on a named custom event', () => {
    const el = new globalThis.Element('div');
    el.setAttribute('data-effect', 'pop');
    const fired = [];
    triggers.get('event')(el, () => fired.push('go'), 'order-confirmed');
    el.dispatchEvent(new globalThis.Event('order-confirmed'));
    assert.deepEqual(fired, ['go']);
  });

  it('vt trigger activates on vb:vt-update-done', () => {
    const el = new globalThis.Element('div');
    el.setAttribute('data-effect', 'pop');
    el.setAttribute('data-trigger', 'vt');
    const fired = [];
    triggers.get('vt')(el, () => fired.push('go'));
    el.dispatchEvent(new globalThis.CustomEvent('vb:vt-update-done', { bubbles: true }));
    assert.deepEqual(fired, ['go']);
  });
});

describe('VB.swap → vb:vt-update-done dispatch', () => {
  before(async () => {
    installBrowserShim();
    const mod = await import('../../src/lib/vb.js');
    VB = mod.VB;
  });
  beforeEach(() => {
    installBrowserShim();
  });

  it('falls back to plain update() when startViewTransition is missing, and still fires vt-done', async () => {
    const el = new globalThis.Element('div');
    el.setAttribute('data-trigger', 'vt');
    const fired = [];
    el.addEventListener('vb:vt-update-done', () => fired.push('done'));
    // _dispatchVtDone queries on document.body — point it at our element.
    globalThis.document.body = { querySelectorAll: (sel) => sel.includes('data-trigger') ? [el] : [] };

    let updateCalled = false;
    VB.swap(() => { updateCalled = true; });
    assert.equal(updateCalled, true);

    await new Promise((r) => queueMicrotask(r));
    assert.deepEqual(fired, ['done']);
  });

  it('dispatches vt-done after document.startViewTransition.updateCallbackDone', async () => {
    let resolveUpdate;
    const updateCallbackDone = new Promise((r) => { resolveUpdate = r; });
    globalThis.document.startViewTransition = (cb) => {
      cb();
      return { updateCallbackDone, finished: new Promise(() => {}) };
    };

    const el = new globalThis.Element('div');
    el.setAttribute('data-trigger', 'vt');
    const fired = [];
    el.addEventListener('vb:vt-update-done', () => fired.push('done'));
    globalThis.document.body = { querySelectorAll: (sel) => sel.includes('data-trigger') ? [el] : [] };

    VB.swap(() => {});
    assert.deepEqual(fired, []); // not yet — VT still pending

    resolveUpdate();
    await updateCallbackDone;
    await new Promise((r) => queueMicrotask(r));
    assert.deepEqual(fired, ['done']);
  });
});

describe('VB stagger modes', () => {
  before(async () => {
    installBrowserShim();
    const mod = await import('../../src/lib/vb.js');
    VB = mod.VB;
  });
  beforeEach(() => {
    installBrowserShim();
    // The grid mode reads computed grid positions — provide them.
    globalThis.getComputedStyle = (el) => ({
      gridRowStart: el._gridRow ?? 'auto',
      gridColumnStart: el._gridCol ?? 'auto',
    });
  });
  afterEach(() => {
    delete globalThis.getComputedStyle;
  });

  /** Build a parent with `n` fake children that each capture their style props. */
  function parentWith(n, opts = {}) {
    const parent = new globalThis.Element('div');
    if (opts.id) parent.setAttribute('id', opts.id);
    if (opts.mode !== undefined) parent.setAttribute('data-stagger', opts.mode);
    parent.children = Array.from({ length: n }, () => new globalThis.Element('div'));
    return parent;
  }

  it('default mode keeps DOM order', () => {
    const p = parentWith(4, { mode: '' });
    VB._processStagger(p);
    assert.deepEqual(
      p.children.map((c) => c.style.getPropertyValue('--vb-stagger-index')),
      ['0', '1', '2', '3'],
    );
  });

  it('reverse mode flips the order', () => {
    const p = parentWith(4, { mode: 'reverse' });
    VB._processStagger(p);
    assert.deepEqual(
      p.children.map((c) => c.style.getPropertyValue('--vb-stagger-index')),
      ['3', '2', '1', '0'],
    );
  });

  it('random mode produces a deterministic shuffle per element id', () => {
    const p1 = parentWith(6, { mode: 'random', id: 'stable-id' });
    const p2 = parentWith(6, { mode: 'random', id: 'stable-id' });
    VB._processStagger(p1);
    VB._processStagger(p2);
    const a = p1.children.map((c) => c.style.getPropertyValue('--vb-stagger-index'));
    const b = p2.children.map((c) => c.style.getPropertyValue('--vb-stagger-index'));
    assert.deepEqual(a, b, 'same id should produce same shuffle');
    // Each index should appear exactly once.
    const sorted = [...a].sort();
    assert.deepEqual(sorted, ['0', '1', '2', '3', '4', '5']);
  });

  it('different ids produce different random orders', () => {
    const p1 = parentWith(8, { mode: 'random', id: 'one' });
    const p2 = parentWith(8, { mode: 'random', id: 'twoooo' });
    VB._processStagger(p1);
    VB._processStagger(p2);
    const a = p1.children.map((c) => c.style.getPropertyValue('--vb-stagger-index')).join(',');
    const b = p2.children.map((c) => c.style.getPropertyValue('--vb-stagger-index')).join(',');
    assert.notEqual(a, b);
  });

  it('grid mode orders by Manhattan distance from top-left', () => {
    const p = parentWith(4, { mode: 'grid' });
    // Lay out the children in a 2x2 grid:
    //   (1,1) -> dist 0
    //   (1,2) -> dist 1
    //   (2,1) -> dist 1
    //   (2,2) -> dist 2
    p.children[0]._gridRow = '2'; p.children[0]._gridCol = '2'; // dist 2
    p.children[1]._gridRow = '1'; p.children[1]._gridCol = '1'; // dist 0
    p.children[2]._gridRow = '2'; p.children[2]._gridCol = '1'; // dist 1
    p.children[3]._gridRow = '1'; p.children[3]._gridCol = '2'; // dist 1

    VB._processStagger(p);

    const got = p.children.map((c) => Number(c.style.getPropertyValue('--vb-stagger-index')));
    // Child 1 (dist 0) → rank 0
    // Children 2 and 3 (dist 1) → ranks 1, 2 (stable sort)
    // Child 0 (dist 2) → rank 3
    assert.equal(got[1], 0);
    assert.equal(got[0], 3);
    assert.ok(new Set([got[2], got[3]]).has(1));
    assert.ok(new Set([got[2], got[3]]).has(2));
  });
});
