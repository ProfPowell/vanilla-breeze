// @ts-nocheck -- fake KV/env objects intentionally diverge from Workers types
/**
 * /go/notify/messages merges the newest changelog releases (feed-data.js,
 * regenerated from CHANGELOG.md on every build) with hand-written KV
 * messages, newest first. Before, the panel showed only KV messages, so
 * the site's bell sat on an April "Welcome" note through several releases.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { listMessages, patchMessage } from '../../functions/_lib/go/notify.js';
import bundledFeed from '../../functions/_lib/go/feed-data.js';

function fakeEnv(messages = []) {
  const store = new Map();
  store.set('index:msgs', JSON.stringify(messages.map((m) => m.id)));
  for (const m of messages) store.set(`msg:${m.id}`, JSON.stringify(m));
  return {
    VB_KV: {
      async get(key, type) {
        const v = store.get(key);
        if (v == null) return null;
        return type === 'json' ? JSON.parse(v) : v;
      },
      async put(key, value) { store.set(key, value); },
      async delete(key) { store.delete(key); },
    },
  };
}

const list = async (env, qs = '') => (await listMessages(new Request(`https://x.test/go/notify/messages${qs}`), env)).json();

describe('/go/notify/messages', () => {
  it('serves the newest releases even when KV is empty', async () => {
    const body = await list(fakeEnv());
    const latest = bundledFeed.items[0];
    assert.equal(body.items[0].id, `release-${latest.id}`);
    assert.equal(body.items[0].url, latest.url);
    assert.ok(body.items.length >= 1 && body.items.length <= 3);
    assert.equal(body.unread, body.items.length);
  });

  it('sorts KV messages and releases together, newest first', async () => {
    const env = fakeEnv([
      { id: 'old', type: 'update', title: 'Old', body: '', date: '2020-01-01T00:00:00Z', read: false, dismissed: false },
      { id: 'future', type: 'alert', title: 'Maintenance', body: '', date: '2999-01-01T00:00:00Z', read: false, dismissed: false },
    ]);
    const body = await list(env);
    assert.equal(body.items[0].id, 'future');
    assert.equal(body.items.at(-1).id, 'old');
    const dates = body.items.map((m) => Date.parse(m.date));
    assert.deepEqual(dates, [...dates].sort((a, b) => b - a));
  });

  it('a KV message with a release id overrides the generated one', async () => {
    const id = `release-${bundledFeed.items[0].id}`;
    const env = fakeEnv([{ id, type: 'update', title: 'Custom', body: '', date: bundledFeed.items[0].date, read: false, dismissed: true }]);
    const body = await list(env);
    assert.ok(!body.items.some((m) => m.id === id), 'dismissed KV override hides the release');
  });

  it('PATCH on a release acknowledges without storing global read state', async () => {
    const env = fakeEnv();
    const id = `release-${bundledFeed.items[0].id}`;
    const res = await patchMessage(new Request('https://x.test', { method: 'PATCH', body: JSON.stringify({ read: true }) }), env, id);
    assert.equal(res.status, 200);
    assert.equal(await env.VB_KV.get(`msg:${id}`), null);
    assert.equal((await list(env)).items[0].read, false);
  });
});
