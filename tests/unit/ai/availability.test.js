// @ts-nocheck -- unit test fakes intentionally diverge from DOM types
/**
 * Unit tests for src/lib/ai/availability.js
 *
 * `checkAvailability` reads from globalThis (Chrome's APIs are exposed there).
 * We stub a fake API onto globalThis between tests so we can exercise each
 * branch without a real browser.
 *
 * Run with: node --test tests/unit/ai/availability.test.js
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { checkAvailability, resolveProvider } from '../../../src/lib/ai/availability.js';

describe('checkAvailability', () => {
  const NAME = '__VBTestAPI__';

  afterEach(() => { delete globalThis[NAME]; });

  it("returns 'unsupported' when the API global is missing", async () => {
    const out = await checkAvailability(NAME);
    assert.deepEqual(out, { state: 'unsupported' });
  });

  it("passes through 'available'", async () => {
    globalThis[NAME] = { availability: async () => 'available' };
    assert.deepEqual(await checkAvailability(NAME), { state: 'available' });
  });

  it("passes through 'downloadable', 'downloading', 'unavailable'", async () => {
    for (const state of ['downloadable', 'downloading', 'unavailable']) {
      globalThis[NAME] = { availability: async () => state };
      assert.deepEqual(await checkAvailability(NAME), { state });
    }
  });

  it("downgrades unknown states to 'unsupported'", async () => {
    globalThis[NAME] = { availability: async () => 'mystery' };
    assert.deepEqual(await checkAvailability(NAME), { state: 'unsupported' });
  });

  it('catches thrown errors and returns unsupported with the error attached', async () => {
    const boom = new Error('nope');
    globalThis[NAME] = { availability: async () => { throw boom; } };
    const out = await checkAvailability(NAME);
    assert.equal(out.state, 'unsupported');
    assert.equal(out.error, boom);
  });
});

describe('resolveProvider', () => {
  it("'available'/'downloadable'/'downloading' → 'local'", () => {
    for (const availability of ['available', 'downloadable', 'downloading']) {
      assert.equal(
        resolveProvider({ availability, endpoint: '/api', fallbackURL: 'https://x' }),
        'local',
      );
    }
  });

  it("'unavailable' falls through to endpoint", () => {
    assert.equal(
      resolveProvider({ availability: 'unavailable', endpoint: '/api' }),
      'endpoint',
    );
  });

  it("'unsupported' falls through to endpoint, then deep-link", () => {
    assert.equal(
      resolveProvider({ availability: 'unsupported', endpoint: '/api' }),
      'endpoint',
    );
    assert.equal(
      resolveProvider({ availability: 'unsupported', fallbackURL: 'https://x/{prompt}' }),
      'deep-link',
    );
  });

  it("returns 'unavailable' when no endpoint or deep-link is configured", () => {
    assert.equal(
      resolveProvider({ availability: 'unsupported' }),
      'unavailable',
    );
    assert.equal(
      resolveProvider({ availability: 'unavailable' }),
      'unavailable',
    );
  });

  it('endpoint wins over fallbackURL when both are present', () => {
    assert.equal(
      resolveProvider({
        availability: 'unsupported',
        endpoint: '/api',
        fallbackURL: 'https://x/{prompt}',
      }),
      'endpoint',
    );
  });
});
