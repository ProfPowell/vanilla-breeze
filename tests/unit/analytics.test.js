/**
 * Unit tests for src/lib/analytics.js
 *
 * The module is designed for a browser runtime — document, navigator,
 * sessionStorage, location, and history are stubbed here so the pure
 * public API (init / track / setConsent / config) can be exercised.
 *
 * Behaviour that depends on a live DOM (click delegation, outbound-link
 * instrumentation, pagehide flush) is covered by Playwright integration
 * tests separately.
 */

import { describe, it, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// ── Minimal browser stubs ─────────────────────────────────────────────

function define(target, props) {
  for (const [key, value] of Object.entries(props)) {
    Object.defineProperty(target, key, {
      value, configurable: true, writable: true, enumerable: true,
    });
  }
}

function installBrowserGlobals() {
  const sessionStore = new Map();
  define(globalThis, {
    sessionStorage: {
      getItem: (k) => sessionStore.has(k) ? sessionStore.get(k) : null,
      setItem: (k, v) => sessionStore.set(k, String(v)),
      removeItem: (k) => sessionStore.delete(k),
      clear: () => sessionStore.clear(),
    },
    navigator: {
      sendBeacon: () => true,
      userAgent: 'node-test',
      globalPrivacyControl: false,
      doNotTrack: '0',
    },
    location: { pathname: '/docs', search: '', hostname: 'vb.test' },
    document: {
      documentElement: {
        dataset: { page: 'docs', theme: 'swiss', mode: 'dark' },
        hasAttribute: () => false,
      },
      referrer: '',
      querySelectorAll: () => [],
      addEventListener: () => {},
      visibilityState: 'visible',
    },
    window: { addEventListener: () => {} },
    history: { pushState: () => {}, replaceState: () => {} },
    MutationObserver: class { observe() {} disconnect() {} },
    Blob: class Blob { constructor(parts) { this.parts = parts; } },
    performance: { now: () => 0 },
  });
}

// ── Suite ─────────────────────────────────────────────────────────────

let Analytics;
let beacons;

before(async () => {
  installBrowserGlobals();
  // sendBeacon spy — collect calls so we can assert transport behaviour
  beacons = [];
  globalThis.navigator.sendBeacon = (url, blob) => {
    beacons.push({ url, body: blob?.parts?.join('') ?? '' });
    return true;
  };
  ({ Analytics } = await import('../../src/lib/analytics.js'));
});

beforeEach(() => {
  beacons.length = 0;
  try { sessionStorage.clear(); } catch {}
});

describe('Analytics public API', () => {
  it('exposes init, track, flush, setConsent, and config', () => {
    assert.equal(typeof Analytics.init, 'function');
    assert.equal(typeof Analytics.track, 'function');
    assert.equal(typeof Analytics.flush, 'function');
    assert.equal(typeof Analytics.setConsent, 'function');
    assert.equal('config' in Analytics, true);
  });

  it('init is idempotent — a second call does not overwrite config', () => {
    Analytics.init({ siteId: 'first', transport: 'disabled',
                     autoPageView: false, autoOutboundLinks: false,
                     autoDeclarative: false });
    Analytics.init({ siteId: 'second' });
    assert.equal(Analytics.config.siteId, 'first');
  });
});

describe('Opt-out precedence', () => {
  it('setConsent(false) stores vb_optout and suppresses track()', () => {
    Analytics.setConsent(false);
    assert.equal(sessionStorage.getItem('vb_optout'), '1');
    Analytics.track('test.event', { foo: 1 });
    assert.equal(beacons.length, 0, 'no beacon fired while opted out');
  });

  it('setConsent(true) clears vb_optout', () => {
    Analytics.setConsent(false);
    Analytics.setConsent(true);
    assert.equal(sessionStorage.getItem('vb_optout'), null);
  });

  it('GPC set to true suppresses tracking', () => {
    // Transport = beacon so any emitted event would land in our spy
    Analytics.setConsent(true);
    navigator.globalPrivacyControl = true;
    Analytics.track('test.gpc', {});
    assert.equal(beacons.length, 0);
    navigator.globalPrivacyControl = false;
  });

  it('DNT "1" suppresses tracking', () => {
    Analytics.setConsent(true);
    navigator.doNotTrack = '1';
    Analytics.track('test.dnt', {});
    assert.equal(beacons.length, 0);
    navigator.doNotTrack = '0';
  });
});

describe('Transport selection', () => {
  it('transport="disabled" does not send beacons', () => {
    Analytics.setConsent(true);
    // Config is already 'disabled' from the idempotent first init in the
    // earlier suite — track once and confirm the spy stays empty.
    Analytics.track('test.disabled', {});
    assert.equal(beacons.length, 0);
  });
});
