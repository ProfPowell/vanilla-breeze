/**
 * Unit tests for src/lib/vb-store.js
 *
 * The default backend relies on `localStorage`, which Node doesn't ship.
 * We install an in-memory backend via VBStore.configure() for each test so
 * the public API is exercised without touching the real browser storage.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { VBStore } from '../../src/lib/vb-store.js';

/** Create a fresh in-memory backend that matches the Backend contract. */
function memoryBackend() {
  const store = new Map();
  return {
    async getRaw(key) {
      return store.has(key) ? store.get(key) : null;
    },
    async setRaw(key, value) {
      store.set(key, value);
    },
    async removeRaw(key) {
      store.delete(key);
    },
    async keys(prefix) {
      return [...store.keys()].filter((k) => k.startsWith(prefix));
    },
    // Test helpers
    _raw: store,
  };
}

let backend;

beforeEach(() => {
  backend = memoryBackend();
  VBStore.configure({ backend });
});

describe('VBStore.set / get', () => {
  it('round-trips a value under namespace:key', async () => {
    await VBStore.set('notifications', 'dismissed-v3', { by: 'user' });
    assert.deepEqual(await VBStore.get('notifications', 'dismissed-v3'), { by: 'user' });
  });

  it('returns null for missing keys', async () => {
    assert.equal(await VBStore.get('notifications', 'never-set'), null);
  });

  it('returns null for unparseable envelopes', async () => {
    await backend.setRaw('vb:notifications:broken', '{not valid json');
    assert.equal(await VBStore.get('notifications', 'broken'), null);
  });

  it('returns null when stored blob is missing the timestamp envelope', async () => {
    await backend.setRaw('vb:notifications:no-env', JSON.stringify({ data: 'raw' }));
    assert.equal(await VBStore.get('notifications', 'no-env'), null);
  });

  it('rejects empty namespace or key', async () => {
    await assert.rejects(() => VBStore.set('', 'x', 1), /namespace/);
    await assert.rejects(() => VBStore.set('ns', '', 1), /key/);
    await assert.rejects(() => VBStore.get('', 'x'), /namespace/);
  });

  it('stamps a timestamp on every write', async () => {
    const t0 = Date.now();
    await VBStore.set('notifications', 'x', 'hi');
    const raw = await backend.getRaw('vb:notifications:x');
    const env = JSON.parse(raw);
    assert.ok(env.timestamp >= t0);
    assert.equal(env.data, 'hi');
  });
});

describe('VBStore.get with maxAge', () => {
  it('returns the value when within maxAge', async () => {
    await VBStore.set('consent', 'banner', 'ok');
    assert.equal(await VBStore.get('consent', 'banner', { maxAge: 60_000 }), 'ok');
  });

  it('returns null when older than maxAge', async () => {
    const envelope = { data: 'ok', timestamp: Date.now() - 10 * 86_400_000 };
    await backend.setRaw('vb:consent:banner', JSON.stringify(envelope));
    assert.equal(await VBStore.get('consent', 'banner', { maxAge: 86_400_000 }), null);
  });

  it('ignores maxAge when option is unset', async () => {
    const envelope = { data: 'ok', timestamp: 1 };
    await backend.setRaw('vb:consent:banner', JSON.stringify(envelope));
    assert.equal(await VBStore.get('consent', 'banner'), 'ok');
  });
});

describe('VBStore.remove', () => {
  it('deletes a single key without touching siblings', async () => {
    await VBStore.set('notifications', 'a', 1);
    await VBStore.set('notifications', 'b', 2);
    await VBStore.remove('notifications', 'a');
    assert.equal(await VBStore.get('notifications', 'a'), null);
    assert.equal(await VBStore.get('notifications', 'b'), 2);
  });
});

describe('VBStore.list', () => {
  it('returns entries scoped to a single namespace', async () => {
    await VBStore.set('notifications', 'a', 1);
    await VBStore.set('notifications', 'b', 2);
    await VBStore.set('highlights', 'c', 3);
    const entries = await VBStore.list('notifications');
    assert.equal(entries.length, 2);
    const byKey = Object.fromEntries(entries.map((e) => [e.key, e.data]));
    assert.deepEqual(byKey, { a: 1, b: 2 });
  });

  it('skips unparseable entries in its namespace', async () => {
    await VBStore.set('notifications', 'good', 1);
    await backend.setRaw('vb:notifications:bad', 'not-json');
    const entries = await VBStore.list('notifications');
    assert.equal(entries.length, 1);
    assert.equal(entries[0].key, 'good');
  });
});

describe('VBStore.clear', () => {
  it('removes all entries under a namespace without touching other namespaces', async () => {
    await VBStore.set('notifications', 'a', 1);
    await VBStore.set('highlights', 'b', 2);
    await VBStore.clear('notifications');
    assert.equal(await VBStore.get('notifications', 'a'), null);
    assert.equal(await VBStore.get('highlights', 'b'), 2);
  });
});

describe('VBStore.clearAll', () => {
  it('removes all vb: keys and nothing else', async () => {
    await VBStore.set('notifications', 'a', 1);
    await VBStore.set('highlights', 'b', 2);
    await backend.setRaw('consent-banner', JSON.stringify({ kept: true }));
    await backend.setRaw('some-other-app', '42');

    await VBStore.clearAll();

    assert.equal(await VBStore.get('notifications', 'a'), null);
    assert.equal(await VBStore.get('highlights', 'b'), null);
    assert.equal(await backend.getRaw('consent-banner'), JSON.stringify({ kept: true }));
    assert.equal(await backend.getRaw('some-other-app'), '42');
  });
});

describe('VBStore.setMany', () => {
  it('writes multiple entries in the same namespace', async () => {
    await VBStore.setMany('highlights', [
      ['page-1', { count: 3 }],
      ['page-2', { count: 5 }],
    ]);
    assert.deepEqual(await VBStore.get('highlights', 'page-1'), { count: 3 });
    assert.deepEqual(await VBStore.get('highlights', 'page-2'), { count: 5 });
  });
});
