// @ts-nocheck -- unit test fakes intentionally diverge from DOM types
/**
 * Unit tests for the composable animation slot system.
 *
 * Covers:
 *   1. JS public API (VB.activate / VB.deactivate / VB.onPhaseEnd /
 *      VB.registerKeyframe) is wired correctly.
 *   2. KEYFRAME_PHASE map classifies every published keyframe name.
 *   3. The animationend listener routes through to a
 *      `vb:effect-phase-end` CustomEvent with the right phase.
 *   4. VB.activate() adds `data-effect-active` and emits `vb:phase-change`.
 *
 * Browser-level cross-effect composition (animation property reading 4
 * comma-separated values) is verified in tests/components/ once
 * @playwright/test is wired back into the dev dependencies.
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Install a minimal JSDOM-style browser shim before importing vb.js so the
 * module's top-level `window.matchMedia` / `window.VB =` assignment runs
 * without throwing. Node's built-in test runner doesn't ship a DOM, and we
 * only need the surface vb.js touches at import time.
 */
function installBrowserShim() {
  /** @type {any} */
  globalThis.window = {
    matchMedia: () => ({ matches: false, addEventListener: () => {} }),
  };
  // FakeElement extends Element so vb.js's `instanceof Element` guard passes.
  class FakeElement {
    constructor(tag = 'div') {
      this.tagName = tag.toUpperCase();
      this._attrs = new Map();
      this._evts = new Map();
    }
    get className() { return this._attrs.get('class') || ''; }
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
  const fakeEl = (tag = 'div') => new FakeElement(tag);
  const listeners = new Map();
  globalThis.Node = { ELEMENT_NODE: 1 };
  globalThis.CustomEvent = class CustomEvent {
    constructor(type, init = {}) {
      this.type = type;
      this.detail = init.detail;
      this.bubbles = init.bubbles ?? false;
    }
  };
  globalThis.MutationObserver = class { observe() {} disconnect() {} };

  const docListeners = new Map();
  globalThis.document = {
    documentElement: { hasAttribute: () => false },
    body: {},
    querySelectorAll: () => [],
    addEventListener: (type, fn) => {
      if (!docListeners.has(type)) docListeners.set(type, new Set());
      docListeners.get(type).add(fn);
    },
    removeEventListener: (type, fn) => docListeners.get(type)?.delete(fn),
    _documentDispatch: (event) => docListeners.get(event.type)?.forEach((fn) => fn(event)),
    /** Helper used by tests to inject a fake animationend. */
    _fireAnimationEnd: (target, animationName) => {
      const e = { type: 'animationend', target, animationName };
      docListeners.get('animationend')?.forEach((fn) => fn(e));
    },
  };

  return { fakeEl, listeners };
}

let shim;
let VB;

describe('VB effect slot lifecycle', () => {
  beforeEach(async () => {
    shim = installBrowserShim();
    // Fresh import so the module-level WeakMaps don't bleed between tests.
    const mod = await import(`../../src/lib/vb.js?cache-bust=${Math.random()}`);
    VB = mod.VB;
  });

  afterEach(() => {
    VB.disconnect();
    delete globalThis.window;
    delete globalThis.document;
    delete globalThis.Element;
    delete globalThis.Node;
    delete globalThis.CustomEvent;
    delete globalThis.MutationObserver;
  });

  it('exposes the new public API', () => {
    assert.equal(typeof VB.activate, 'function');
    assert.equal(typeof VB.deactivate, 'function');
    assert.equal(typeof VB.onPhaseEnd, 'function');
    assert.equal(typeof VB.registerKeyframe, 'function');
  });

  it('classifies every shipped keyframe into a slot', () => {
    const expected = {
      entrance: ['vb-fade-in', 'vb-slide-up', 'vb-pop', 'vb-slide-in-ltr', 'vb-slide-in-rtl', 'vb-fade-slide-up', 'vb-shadow-lift'],
      exit: ['vb-fade-out', 'vb-collapse', 'vb-slide-out-ltr', 'vb-slide-out-rtl'],
      attention: ['vb-shake', 'vb-pulse', 'vb-bounce', 'vb-blink'],
      decoration: ['vb-neon-pulse', 'vb-3d-shift', 'vb-outline-glow-pulse', 'vb-rainbow', 'vb-gradient-flow', 'vb-shimmer', 'vb-shimmer-gradient', 'vb-glow', 'vb-float'],
    };
    for (const [phase, names] of Object.entries(expected)) {
      for (const name of names) {
        assert.equal(VB._keyframePhase.get(name), phase, `${name} should be ${phase}`);
      }
    }
  });

  it('registerKeyframe lets external packs extend the map', () => {
    VB.registerKeyframe('vb-my-custom-pop', 'entrance');
    assert.equal(VB._keyframePhase.get('vb-my-custom-pop'), 'entrance');
  });

  it('activate adds data-effect-active and emits vb:phase-change', () => {
    const el = shim.fakeEl('h1');
    el.setAttribute('data-effect', 'pop');

    const phaseChanges = [];
    el.addEventListener('vb:phase-change', (e) => phaseChanges.push(e.detail));

    VB.activate(el);

    assert.equal(el.hasAttribute('data-effect-active'), true);
    assert.deepEqual(phaseChanges, [{ active: true }]);
  });

  it('deactivate removes data-effect-active and emits vb:phase-change(false)', () => {
    const el = shim.fakeEl('h1');
    el.setAttribute('data-effect', 'pop');
    VB.activate(el);

    const phaseChanges = [];
    el.addEventListener('vb:phase-change', (e) => phaseChanges.push(e.detail));

    VB.deactivate(el);
    assert.equal(el.hasAttribute('data-effect-active'), false);
    assert.deepEqual(phaseChanges, [{ active: false }]);

    // No-op when already inactive (avoid spurious double-fires).
    VB.deactivate(el);
    assert.deepEqual(phaseChanges, [{ active: false }]);
  });

  it('animationend → vb:effect-phase-end with classified phase', () => {
    VB.observe(); // wires the delegated animationend listener

    const el = shim.fakeEl('h1');
    el.setAttribute('data-effect', 'pop neon');

    const phaseEnds = [];
    el.addEventListener('vb:effect-phase-end', (e) => phaseEnds.push(e.detail));

    globalThis.document._fireAnimationEnd(el, 'vb-pop');
    globalThis.document._fireAnimationEnd(el, 'vb-neon-pulse');

    assert.deepEqual(phaseEnds, [
      { phase: 'entrance', animationName: 'vb-pop' },
      { phase: 'decoration', animationName: 'vb-neon-pulse' },
    ]);
  });

  it('animationend with an unknown keyframe name does not fire phase-end', () => {
    VB.observe();
    const el = shim.fakeEl('h1');
    el.setAttribute('data-effect', 'pop');
    const fired = [];
    el.addEventListener('vb:effect-phase-end', (e) => fired.push(e.detail));
    globalThis.document._fireAnimationEnd(el, 'some-app-custom-keyframe');
    assert.deepEqual(fired, []);
  });

  it('onPhaseEnd subscribes only to the named phase and returns an unsubscribe', () => {
    VB.observe();
    const el = shim.fakeEl('h1');
    el.setAttribute('data-effect', 'pop neon');

    const entranceEnds = [];
    const unsubscribe = VB.onPhaseEnd(el, 'entrance', (detail) => entranceEnds.push(detail));

    globalThis.document._fireAnimationEnd(el, 'vb-pop');
    globalThis.document._fireAnimationEnd(el, 'vb-neon-pulse'); // wrong phase
    assert.equal(entranceEnds.length, 1);
    assert.equal(entranceEnds[0].phase, 'entrance');

    unsubscribe();
    globalThis.document._fireAnimationEnd(el, 'vb-pop');
    assert.equal(entranceEnds.length, 1); // unchanged
  });

  it('animationend on a non-data-effect element is ignored', () => {
    VB.observe();
    const el = shim.fakeEl('h1'); // no data-effect attribute
    const fired = [];
    el.addEventListener('vb:effect-phase-end', (e) => fired.push(e.detail));
    globalThis.document._fireAnimationEnd(el, 'vb-pop');
    assert.deepEqual(fired, []);
  });
});
