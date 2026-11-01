/**
 * VBStore / VBService are public (vanilla-breeze-4qta): window.VB.store,
 * window.VB.service, and named exports from the entry bundles.
 *
 * Autoloaded component chunks each bundle their own copy of these modules,
 * so state must be shared through globalThis: a site's
 * VB.service.configure() has to reach notification-wc's private copy.
 * Loading a module URL with a different query string gives a separate
 * module instance, the same situation as two bundles.
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';

const svcUrl = new URL('../../src/lib/vb-service.js', import.meta.url).href;
const storeUrl = new URL('../../src/lib/vb-store.js', import.meta.url).href;

/** @type {any} */
const G = globalThis;

after(() => { delete G.window; });

test('two copies of vb-service share one configuration', async () => {
  const a = await import(`${svcUrl}?copy=a`);
  const b = await import(`${svcUrl}?copy=b`);
  assert.notEqual(a.VBService, b.VBService, 'separate module instances');
  a.VBService._reset();
  a.VBService.configure({ baseUrl: '/api', services: { ai: 'https://ai.example/v1/' } });
  assert.equal(b.VBService.resolve('notify'), '/api/notify');
  assert.equal(b.VBService.resolve('ai'), 'https://ai.example/v1');
  b.VBService._reset();
  assert.equal(a.VBService.resolve('notify'), '/go/notify');
});

test('two copies of vb-store share one backend', async () => {
  const mem = new Map();
  const backend = {
    async getRaw(k) { return mem.get(k) ?? null; },
    async setRaw(k, v) { mem.set(k, v); },
    async removeRaw(k) { mem.delete(k); },
    async keys(prefix) { return [...mem.keys()].filter((k) => k.startsWith(prefix)); },
  };
  const a = await import(`${storeUrl}?copy=a`);
  const b = await import(`${storeUrl}?copy=b`);
  a.VBStore.configure({ backend });
  await a.VBStore.set('ns', 'k', { v: 1 });
  assert.deepEqual(await b.VBStore.get('ns', 'k'), { v: 1 });
  b.VBStore.configure({ backend: null });
});

test('modules attach to window.VB without clobbering it', async () => {
  G.window = { VB: { existing: true } };
  const svc = await import(`${svcUrl}?copy=window`);
  const store = await import(`${storeUrl}?copy=window`);
  assert.equal(G.window.VB.existing, true);
  assert.equal(G.window.VB.service, svc.VBService);
  assert.equal(G.window.VB.ServiceError, svc.VBServiceError);
  assert.equal(G.window.VB.store, store.VBStore);
});
