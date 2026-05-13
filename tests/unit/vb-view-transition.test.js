/**
 * Unit tests for src/lib/vb-view-transition.js
 *
 * The helper has three branches that determine whether
 * document.startViewTransition is used:
 *   1. host not connected → plain swap
 *   2. startViewTransition missing → plain swap
 *   3. prefers-reduced-motion → plain swap
 *
 * All three need to still call swap synchronously so the DOM mutation is
 * never skipped. The view-transition-name pinning is exercised in the
 * playwright component tests under tests/components/.
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { viewTransitionSwap } from '../../src/lib/vb-view-transition.js';

/** Build a minimal `document` + `matchMedia` shim and stash any prior globals. */
function withFakeBrowser({ vt = false, reduced = false } = {}) {
  const prior = {
    document: globalThis.document,
    matchMedia: globalThis.matchMedia,
  };

  const fakeDoc = {};
  if (vt) {
    fakeDoc.startViewTransition = (cb) => {
      cb();
      return { finished: Promise.resolve() };
    };
  }
  globalThis.document = fakeDoc;
  globalThis.matchMedia = () => ({ matches: reduced });

  return () => {
    globalThis.document = prior.document;
    globalThis.matchMedia = prior.matchMedia;
  };
}

function fakeHost({ connected = true } = {}) {
  const host = {
    isConnected: connected,
    style: { viewTransitionName: '' },
  };
  return host;
}

describe('viewTransitionSwap', () => {
  let restore;
  afterEach(() => { restore?.(); restore = null; });

  it('falls back to a plain swap when the host is not connected', () => {
    restore = withFakeBrowser({ vt: true });
    const host = fakeHost({ connected: false });
    let ran = false;
    const tx = viewTransitionSwap(host, () => { ran = true; });
    assert.equal(ran, true);
    assert.equal(tx, null);
    assert.equal(host.style.viewTransitionName, '');
  });

  it('falls back when startViewTransition is unavailable', () => {
    restore = withFakeBrowser({ vt: false });
    const host = fakeHost();
    let ran = false;
    const tx = viewTransitionSwap(host, () => { ran = true; });
    assert.equal(ran, true);
    assert.equal(tx, null);
    assert.equal(host.style.viewTransitionName, '');
  });

  it('falls back when prefers-reduced-motion is set', () => {
    restore = withFakeBrowser({ vt: true, reduced: true });
    const host = fakeHost();
    let ran = false;
    const tx = viewTransitionSwap(host, () => { ran = true; });
    assert.equal(ran, true);
    assert.equal(tx, null);
    assert.equal(host.style.viewTransitionName, '');
  });

  it('pins a unique view-transition-name and clears it after the transition finishes', async () => {
    restore = withFakeBrowser({ vt: true });
    const host = fakeHost();
    let observedDuring = '';
    const tx = viewTransitionSwap(host, () => {
      observedDuring = host.style.viewTransitionName;
    }, 'test-vt');
    assert.notEqual(tx, null);
    assert.match(observedDuring, /^test-vt-\d+$/);
    await tx.finished;
    // finally callback queues a microtask; flush.
    await Promise.resolve();
    assert.equal(host.style.viewTransitionName, '');
  });

  it('assigns unique names across consecutive calls', () => {
    restore = withFakeBrowser({ vt: true });
    const host = fakeHost();
    const seen = new Set();
    for (let i = 0; i < 3; i++) {
      viewTransitionSwap(host, () => { seen.add(host.style.viewTransitionName); }, 'a');
    }
    assert.equal(seen.size, 3);
  });
});
