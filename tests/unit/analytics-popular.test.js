// @ts-nocheck -- fake D1/env objects intentionally diverge from Workers types
/**
 * GET /api/analytics/popular feeds <popularity-index>. It aggregates the same
 * page.view rows as /stats topPages, validates window/limit, and never leaks
 * D1 error text to the (public) client.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { onRequestGet, parsePopularQuery, WINDOWS } from '../../functions/api/analytics/popular.js';

function fakeDB({ rows = [], fail = null } = {}) {
  const calls = [];
  return {
    calls,
    prepare(sql) {
      return {
        bind(...args) {
          calls.push({ sql, args });
          return {
            async all() {
              if (fail) throw new Error(fail);
              return { results: rows };
            },
          };
        },
      };
    },
  };
}

const get = (env, qs = '') => onRequestGet({ request: new Request(`https://x.test/api/analytics/popular${qs}`), env });

describe('parsePopularQuery', () => {
  it('defaults to vb-docs, 7d, 10', () => {
    assert.deepEqual(parsePopularQuery(new URLSearchParams()), { site: 'vb-docs', windowKey: '7d', limit: 10 });
  });
  it('accepts the stats window keys and rejects others', () => {
    for (const key of Object.keys(WINDOWS)) {
      assert.equal(parsePopularQuery(new URLSearchParams({ window: key })).windowKey, key);
    }
    assert.equal(parsePopularQuery(new URLSearchParams({ window: '1y' })).windowKey, '7d');
    assert.equal(parsePopularQuery(new URLSearchParams({ window: 'constructor' })).windowKey, '7d');
  });
  it('clamps limit to 1..50', () => {
    assert.equal(parsePopularQuery(new URLSearchParams({ limit: '-3' })).limit, 1);
    assert.equal(parsePopularQuery(new URLSearchParams({ limit: '0' })).limit, 1);
    assert.equal(parsePopularQuery(new URLSearchParams({ limit: '999' })).limit, 50);
    assert.equal(parsePopularQuery(new URLSearchParams({ limit: 'abc' })).limit, 10);
  });
});

describe('GET /api/analytics/popular', () => {
  it('returns { pages: [{ url, views }] } from page.view rows', async () => {
    const DB = fakeDB({ rows: [{ url: '/glossary/', views: 12 }, { url: '/changelog/', views: '7' }] });
    const res = await get({ DB }, '?window=30d&limit=5&site=demo');
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('cache-control'), 'no-store');
    const body = await res.json();
    assert.deepEqual(body, {
      ok: true, site: 'demo', window: '30d',
      pages: [{ url: '/glossary/', views: 12 }, { url: '/changelog/', views: 7 }],
    });
    const [{ sql, args }] = DB.calls;
    assert.match(sql, /event_name = 'page\.view'/);
    assert.match(sql, /GROUP BY path ORDER BY views DESC LIMIT \?3/);
    assert.equal(args[0], 'demo');
    assert.equal(args[2], 5);
    assert.ok(Date.now() - args[1] >= WINDOWS['30d'] - 1000);
  });

  it('accepts the descriptive binding name', async () => {
    const res = await get({ vanilla_breeze_analytics: fakeDB() });
    assert.equal(res.status, 200);
    assert.deepEqual((await res.json()).pages, []);
  });

  it('drops rows whose path is not a same-origin absolute path', async () => {
    const DB = fakeDB({ rows: [{ url: '//evil.example/', views: 9 }, { url: 'javascript:alert(1)', views: 8 }, { url: '/ok/', views: 1 }] });
    const body = await (await get({ DB })).json();
    assert.deepEqual(body.pages, [{ url: '/ok/', views: 1 }]);
  });

  it('503s with a generic body when D1 is not bound', async () => {
    const res = await get({});
    assert.equal(res.status, 503);
    assert.deepEqual(await res.json(), { ok: false, error: 'unavailable' });
  });

  it('503s without leaking the D1 error message', async () => {
    const orig = console.error;
    console.error = () => {};
    try {
      const res = await get({ DB: fakeDB({ fail: 'no such table: hits' }) });
      assert.equal(res.status, 503);
      const text = await res.text();
      assert.ok(!text.includes('no such table'));
    } finally {
      console.error = orig;
    }
  });
});
