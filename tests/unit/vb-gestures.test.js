/**
 * Unit tests for vb-gestures module
 *
 * Tests the pure logic and API contracts of gesture functions.
 * Uses a minimal DOM mock since the project doesn't use jsdom.
 *
 * Run with: node --test tests/unit/vb-gestures.test.js
 */

import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';

// --- Minimal DOM mock ---

class MockElement extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50);
    this.attributes = {};
    this.style = {};
    this.children = [];
    this.parentElement = null;
    this.scrollTop = 0;
  }

  addEventListener(type, fn, opts) {
    this.on(type, fn);
  }

  removeEventListener(type, fn) {
    this.off(type, fn);
  }

  dispatchEvent(event) {
    this.emit(event.type, event);
    return true;
  }

  setAttribute(name, value) {
    this.attributes[name] = value;
  }

  removeAttribute(name) {
    delete this.attributes[name];
  }

  hasAttribute(name) {
    return name in this.attributes;
  }

  getAttribute(name) {
    return this.attributes[name] ?? null;
  }

  toggleAttribute(name) {
    if (this.hasAttribute(name)) {
      this.removeAttribute(name);
      return false;
    }
    this.setAttribute(name, '');
    return true;
  }

  setPointerCapture() {}
  releasePointerCapture() {}

  prepend(child) {
    this.children.unshift(child);
    child.parentElement = this;
  }

  remove() {
    if (this.parentElement) {
      const idx = this.parentElement.children.indexOf(this);
      if (idx !== -1) this.parentElement.children.splice(idx, 1);
    }
  }

  querySelectorAll(selector) {
    // Simple selector matching for data-gesture attributes
    const match = selector.match(/\[data-gesture="([^"]+)"\]/);
    if (!match) return [];
    const value = match[1];
    return this.children.filter(c =>
      c.attributes['data-gesture'] === value
    );
  }
}

function createPointerEvent(type, opts = {}) {
  return {
    type,
    isPrimary: opts.isPrimary ?? true,
    clientX: opts.clientX ?? 0,
    clientY: opts.clientY ?? 0,
    pointerId: opts.pointerId ?? 1,
    preventDefault: mock.fn(),
  };
}

// --- Setup global mocks ---

function setupGlobals() {
  const navObj = { vibrate: mock.fn(() => true) };
  Object.defineProperty(globalThis, 'navigator', {
    value: navObj,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(globalThis, 'document', {
    value: {
      createElement: () => new MockElement(),
      querySelectorAll: () => [],
    },
    writable: true,
    configurable: true,
  });
  globalThis.CustomEvent = class CustomEvent {
    constructor(type, init = {}) {
      this.type = type;
      this.bubbles = init.bubbles ?? false;
      this.detail = init.detail ?? null;
    }
  };
}

function clearGlobals() {
  delete globalThis.CustomEvent;
}

// --- Tests ---

describe('vb-gestures', () => {
  // We need fresh module imports for each describe block since the module
  // auto-initializes on load. Use dynamic imports.

  describe('haptic', () => {
    beforeEach(setupGlobals);
    afterEach(clearGlobals);

    it('tap vibrates at 8ms', async () => {
      const { haptic } = await import(`../../src/lib/vb-gestures.js?t=${Date.now()}_tap`);
      haptic.tap();
      const calls = globalThis.navigator.vibrate.mock.calls;
      assert.equal(calls.length > 0, true);
      assert.equal(calls[calls.length - 1].arguments[0], 8);
    });

    it('confirm vibrates with double-pulse pattern', async () => {
      const { haptic } = await import(`../../src/lib/vb-gestures.js?t=${Date.now()}_confirm`);
      haptic.confirm();
      const calls = globalThis.navigator.vibrate.mock.calls;
      assert.deepEqual(calls[calls.length - 1].arguments[0], [8, 40, 8]);
    });

    it('error vibrates with heavy pattern', async () => {
      const { haptic } = await import(`../../src/lib/vb-gestures.js?t=${Date.now()}_error`);
      haptic.error();
      const calls = globalThis.navigator.vibrate.mock.calls;
      assert.deepEqual(calls[calls.length - 1].arguments[0], [30, 60, 30]);
    });

    it('dismiss vibrates at 15ms', async () => {
      const { haptic } = await import(`../../src/lib/vb-gestures.js?t=${Date.now()}_dismiss`);
      haptic.dismiss();
      const calls = globalThis.navigator.vibrate.mock.calls;
      assert.equal(calls[calls.length - 1].arguments[0], 15);
    });

    it('no-ops when navigator.vibrate is unavailable', async () => {
      Object.defineProperty(globalThis, 'navigator', {
        value: {},
        writable: true,
        configurable: true,
      });
      const { haptic } = await import(`../../src/lib/vb-gestures.js?t=${Date.now()}_noop`);
      // Should not throw
      haptic.tap();
      haptic.confirm();
      haptic.error();
      haptic.dismiss();
    });
  });

  describe('addSwipeListener', () => {
    beforeEach(setupGlobals);
    afterEach(clearGlobals);

    it('dispatches swipe-right on rightward swipe', async () => {
      const { addSwipeListener } = await import(`../../src/lib/vb-gestures.js?t=${Date.now()}_sr`);
      const el = new MockElement();
      const cleanup = addSwipeListener(el, { threshold: 30, timeout: 1000 });

      let fired = null;
      el.addEventListener('swipe-right', (e) => { fired = e; });

      el.emit('pointerdown', createPointerEvent('pointerdown', { clientX: 10, clientY: 50 }));
      el.emit('pointerup', createPointerEvent('pointerup', { clientX: 100, clientY: 55 }));

      assert.notEqual(fired, null);
      assert.equal(fired.detail.distance, 90);
      cleanup();
    });

    it('dispatches swipe-left on leftward swipe', async () => {
      const { addSwipeListener } = await import(`../../src/lib/vb-gestures.js?t=${Date.now()}_sl`);
      const el = new MockElement();
      const cleanup = addSwipeListener(el, { threshold: 30, timeout: 1000 });

      let direction = null;
      el.addEventListener('swipe-left', () => { direction = 'left'; });

      el.emit('pointerdown', createPointerEvent('pointerdown', { clientX: 100, clientY: 50 }));
      el.emit('pointerup', createPointerEvent('pointerup', { clientX: 10, clientY: 55 }));

      assert.equal(direction, 'left');
      cleanup();
    });

    it('dispatches swipe-up on upward swipe', async () => {
      const { addSwipeListener } = await import(`../../src/lib/vb-gestures.js?t=${Date.now()}_su`);
      const el = new MockElement();
      const cleanup = addSwipeListener(el, { threshold: 30, timeout: 1000 });

      let direction = null;
      el.addEventListener('swipe-up', () => { direction = 'up'; });

      el.emit('pointerdown', createPointerEvent('pointerdown', { clientX: 50, clientY: 100 }));
      el.emit('pointerup', createPointerEvent('pointerup', { clientX: 55, clientY: 10 }));

      assert.equal(direction, 'up');
      cleanup();
    });

    it('dispatches swipe-down on downward swipe', async () => {
      const { addSwipeListener } = await import(`../../src/lib/vb-gestures.js?t=${Date.now()}_sd`);
      const el = new MockElement();
      const cleanup = addSwipeListener(el, { threshold: 30, timeout: 1000 });

      let direction = null;
      el.addEventListener('swipe-down', () => { direction = 'down'; });

      el.emit('pointerdown', createPointerEvent('pointerdown', { clientX: 50, clientY: 10 }));
      el.emit('pointerup', createPointerEvent('pointerup', { clientX: 55, clientY: 100 }));

      assert.equal(direction, 'down');
      cleanup();
    });

    it('does not fire on short swipe', async () => {
      const { addSwipeListener } = await import(`../../src/lib/vb-gestures.js?t=${Date.now()}_short`);
      const el = new MockElement();
      const cleanup = addSwipeListener(el, { threshold: 50, timeout: 1000 });

      let fired = false;
      el.addEventListener('swipe-left', () => { fired = true; });
      el.addEventListener('swipe-right', () => { fired = true; });

      el.emit('pointerdown', createPointerEvent('pointerdown', { clientX: 50, clientY: 50 }));
      el.emit('pointerup', createPointerEvent('pointerup', { clientX: 70, clientY: 55 }));

      assert.equal(fired, false);
      cleanup();
    });

    it('does not fire on diagonal swipe beyond restraint', async () => {
      const { addSwipeListener } = await import(`../../src/lib/vb-gestures.js?t=${Date.now()}_diag`);
      const el = new MockElement();
      const cleanup = addSwipeListener(el, { threshold: 30, restraint: 50, timeout: 1000 });

      let fired = false;
      el.addEventListener('swipe-right', () => { fired = true; });

      el.emit('pointerdown', createPointerEvent('pointerdown', { clientX: 10, clientY: 10 }));
      el.emit('pointerup', createPointerEvent('pointerup', { clientX: 100, clientY: 100 }));

      assert.equal(fired, false);
      cleanup();
    });

    it('ignores non-primary pointers', async () => {
      const { addSwipeListener } = await import(`../../src/lib/vb-gestures.js?t=${Date.now()}_nonp`);
      const el = new MockElement();
      const cleanup = addSwipeListener(el);

      let fired = false;
      el.addEventListener('swipe-right', () => { fired = true; });

      // Non-primary down, primary up — should not register
      el.emit('pointerdown', createPointerEvent('pointerdown', { isPrimary: false, clientX: 0, clientY: 50 }));
      el.emit('pointerup', createPointerEvent('pointerup', { isPrimary: true, clientX: 200, clientY: 50 }));

      assert.equal(fired, false);
      cleanup();
    });

    it('cleanup removes listeners', async () => {
      const { addSwipeListener } = await import(`../../src/lib/vb-gestures.js?t=${Date.now()}_clean`);
      const el = new MockElement();
      const cleanup = addSwipeListener(el, { threshold: 30, timeout: 1000 });

      let count = 0;
      el.addEventListener('swipe-right', () => { count++; });

      cleanup();

      el.emit('pointerdown', createPointerEvent('pointerdown', { clientX: 10, clientY: 50 }));
      el.emit('pointerup', createPointerEvent('pointerup', { clientX: 100, clientY: 55 }));

      assert.equal(count, 0);
    });
  });

  describe('makeSwipeable', () => {
    beforeEach(setupGlobals);
    afterEach(clearGlobals);

    it('sets data-swiping during drag', async () => {
      const { makeSwipeable } = await import(`../../src/lib/vb-gestures.js?t=${Date.now()}_swp1`);
      const el = new MockElement();
      const cleanup = makeSwipeable(el);

      el.emit('pointerdown', createPointerEvent('pointerdown', { clientX: 100 }));
      assert.equal(el.hasAttribute('data-swiping'), true);

      el.emit('pointerup', createPointerEvent('pointerup', { clientX: 110 }));
      assert.equal(el.hasAttribute('data-swiping'), false);

      cleanup();
    });

    it('dispatches swipe-dismiss when threshold exceeded', async () => {
      const { makeSwipeable } = await import(`../../src/lib/vb-gestures.js?t=${Date.now()}_swp2`);
      const el = new MockElement();
      const cleanup = makeSwipeable(el, { threshold: 50, removeOnDismiss: false });

      let dismissed = null;
      el.addEventListener('swipe-dismiss', (e) => { dismissed = e; });

      el.emit('pointerdown', createPointerEvent('pointerdown', { clientX: 0 }));
      el.emit('pointermove', createPointerEvent('pointermove', { clientX: 60 }));
      el.emit('pointerup', createPointerEvent('pointerup', { clientX: 60 }));

      assert.notEqual(dismissed, null);
      assert.equal(dismissed.detail.direction, 'right');
      assert.equal(el.hasAttribute('data-dismissed'), true);

      cleanup();
    });

    it('snaps back when below threshold', async () => {
      const { makeSwipeable } = await import(`../../src/lib/vb-gestures.js?t=${Date.now()}_swp3`);
      const el = new MockElement();
      const cleanup = makeSwipeable(el, { threshold: 100 });

      let dismissed = false;
      el.addEventListener('swipe-dismiss', () => { dismissed = true; });

      el.emit('pointerdown', createPointerEvent('pointerdown', { clientX: 0 }));
      el.emit('pointermove', createPointerEvent('pointermove', { clientX: 30 }));
      el.emit('pointerup', createPointerEvent('pointerup', { clientX: 30 }));

      assert.equal(dismissed, false);
      assert.equal(el.hasAttribute('data-dismissed'), false);

      cleanup();
    });

    it('handles pointercancel gracefully', async () => {
      const { makeSwipeable } = await import(`../../src/lib/vb-gestures.js?t=${Date.now()}_swp4`);
      const el = new MockElement();
      const cleanup = makeSwipeable(el);

      el.emit('pointerdown', createPointerEvent('pointerdown', { clientX: 0 }));
      assert.equal(el.hasAttribute('data-swiping'), true);

      el.emit('pointercancel', createPointerEvent('pointercancel'));
      assert.equal(el.hasAttribute('data-swiping'), false);

      cleanup();
    });

    it('ignores events on already-dismissed elements', async () => {
      const { makeSwipeable } = await import(`../../src/lib/vb-gestures.js?t=${Date.now()}_swp5`);
      const el = new MockElement();
      el.setAttribute('data-dismissed', '');
      const cleanup = makeSwipeable(el);

      el.emit('pointerdown', createPointerEvent('pointerdown', { clientX: 0 }));
      assert.equal(el.hasAttribute('data-swiping'), false);

      cleanup();
    });

    it('updates transform during drag', async () => {
      const { makeSwipeable } = await import(`../../src/lib/vb-gestures.js?t=${Date.now()}_swp6`);
      const el = new MockElement();
      const cleanup = makeSwipeable(el, { threshold: 100 });

      el.emit('pointerdown', createPointerEvent('pointerdown', { clientX: 0 }));
      el.emit('pointermove', createPointerEvent('pointermove', { clientX: 40 }));

      assert.equal(el.style.transform, 'translateX(40px)');

      el.emit('pointerup', createPointerEvent('pointerup', { clientX: 40 }));
      cleanup();
    });
  });

  describe('addLongPress', () => {
    beforeEach(setupGlobals);
    afterEach(clearGlobals);

    it('fires callback after duration', async () => {
      const { addLongPress } = await import(`../../src/lib/vb-gestures.js?t=${Date.now()}_lp1`);
      const el = new MockElement();

      let pressed = false;
      const cleanup = addLongPress(el, () => { pressed = true; }, {
        duration: 50,
        hapticFeedback: false,
        blockContextMenu: false,
      });

      el.emit('pointerdown', createPointerEvent('pointerdown'));
      await new Promise(r => setTimeout(r, 80));

      assert.equal(pressed, true);
      cleanup();
    });

    it('cancels on pointerup before duration', async () => {
      const { addLongPress } = await import(`../../src/lib/vb-gestures.js?t=${Date.now()}_lp2`);
      const el = new MockElement();

      let pressed = false;
      const cleanup = addLongPress(el, () => { pressed = true; }, {
        duration: 100,
        hapticFeedback: false,
        blockContextMenu: false,
      });

      el.emit('pointerdown', createPointerEvent('pointerdown'));
      el.emit('pointerup', createPointerEvent('pointerup'));
      await new Promise(r => setTimeout(r, 150));

      assert.equal(pressed, false);
      cleanup();
    });

    it('cancels on pointermove', async () => {
      const { addLongPress } = await import(`../../src/lib/vb-gestures.js?t=${Date.now()}_lp3`);
      const el = new MockElement();

      let pressed = false;
      const cleanup = addLongPress(el, () => { pressed = true; }, {
        duration: 50,
        hapticFeedback: false,
        blockContextMenu: false,
      });

      el.emit('pointerdown', createPointerEvent('pointerdown'));
      el.emit('pointermove', createPointerEvent('pointermove', { clientX: 100 }));
      await new Promise(r => setTimeout(r, 80));

      assert.equal(pressed, false);
      cleanup();
    });

    it('cancels on pointercancel', async () => {
      const { addLongPress } = await import(`../../src/lib/vb-gestures.js?t=${Date.now()}_lp4`);
      const el = new MockElement();

      let pressed = false;
      const cleanup = addLongPress(el, () => { pressed = true; }, {
        duration: 50,
        hapticFeedback: false,
        blockContextMenu: false,
      });

      el.emit('pointerdown', createPointerEvent('pointerdown'));
      el.emit('pointercancel', createPointerEvent('pointercancel'));
      await new Promise(r => setTimeout(r, 80));

      assert.equal(pressed, false);
      cleanup();
    });

    it('blocks context menu when configured', async () => {
      const { addLongPress } = await import(`../../src/lib/vb-gestures.js?t=${Date.now()}_lp5`);
      const el = new MockElement();
      const cleanup = addLongPress(el, () => {}, { blockContextMenu: true });

      let prevented = false;
      const event = {
        type: 'contextmenu',
        preventDefault: () => { prevented = true; },
      };
      el.emit('contextmenu', event);

      assert.equal(prevented, true);
      cleanup();
    });

    it('triggers haptic feedback when configured', async () => {
      const { addLongPress } = await import(`../../src/lib/vb-gestures.js?t=${Date.now()}_lp6`);
      const el = new MockElement();

      const cleanup = addLongPress(el, () => {}, {
        duration: 30,
        hapticFeedback: true,
        blockContextMenu: false,
      });

      el.emit('pointerdown', createPointerEvent('pointerdown'));
      await new Promise(r => setTimeout(r, 60));

      const calls = globalThis.navigator.vibrate.mock.calls;
      assert.equal(calls.length > 0, true);
      // haptic.tap() → 8ms
      assert.equal(calls[calls.length - 1].arguments[0], 8);

      cleanup();
    });

    it('cleanup removes listeners and cancels timer', async () => {
      const { addLongPress } = await import(`../../src/lib/vb-gestures.js?t=${Date.now()}_lp7`);
      const el = new MockElement();

      let pressed = false;
      const cleanup = addLongPress(el, () => { pressed = true; }, {
        duration: 50,
        hapticFeedback: false,
      });

      cleanup();

      el.emit('pointerdown', createPointerEvent('pointerdown'));
      await new Promise(r => setTimeout(r, 80));

      assert.equal(pressed, false);
    });
  });

  describe('initGestures', () => {
    beforeEach(setupGlobals);
    afterEach(clearGlobals);

    it('initializes swipe listeners from data-gesture="swipe"', async () => {
      const { initGestures } = await import(`../../src/lib/vb-gestures.js?t=${Date.now()}_ig1`);

      const root = new MockElement();
      const child = new MockElement();
      child.setAttribute('data-gesture', 'swipe');
      root.children.push(child);

      const cleanup = initGestures(root);

      let swiped = false;
      child.addEventListener('swipe-right', () => { swiped = true; });

      child.emit('pointerdown', createPointerEvent('pointerdown', { clientX: 10, clientY: 50 }));
      child.emit('pointerup', createPointerEvent('pointerup', { clientX: 100, clientY: 55 }));

      assert.equal(swiped, true);
      cleanup();
    });

    it('initializes dismiss from data-gesture="dismiss"', async () => {
      const { initGestures } = await import(`../../src/lib/vb-gestures.js?t=${Date.now()}_ig2`);

      const root = new MockElement();
      const child = new MockElement();
      child.setAttribute('data-gesture', 'dismiss');
      root.children.push(child);

      const cleanup = initGestures(root);

      child.emit('pointerdown', createPointerEvent('pointerdown', { clientX: 0 }));
      assert.equal(child.hasAttribute('data-swiping'), true);

      child.emit('pointerup', createPointerEvent('pointerup', { clientX: 5 }));
      cleanup();
    });

    it('returns cleanup that removes all gestures', async () => {
      const { initGestures } = await import(`../../src/lib/vb-gestures.js?t=${Date.now()}_ig3`);

      const root = new MockElement();
      const child = new MockElement();
      child.setAttribute('data-gesture', 'swipe');
      root.children.push(child);

      const cleanup = initGestures(root);
      cleanup();

      let swiped = false;
      child.addEventListener('swipe-right', () => { swiped = true; });

      child.emit('pointerdown', createPointerEvent('pointerdown', { clientX: 10, clientY: 50 }));
      child.emit('pointerup', createPointerEvent('pointerup', { clientX: 100, clientY: 55 }));

      assert.equal(swiped, false);
    });
  });
});
