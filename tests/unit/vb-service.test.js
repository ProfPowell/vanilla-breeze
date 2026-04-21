/**
 * Unit tests for src/lib/vb-service.js
 *
 * Uses a global fetch stub per-test so we can assert on method, URL,
 * headers, and body without a network.
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { VBService, VBServiceError } from '../../src/lib/vb-service.js';

/** @type {Array<{ url: string, init: RequestInit }>} */
let calls;
/** @type {typeof fetch | undefined} */
let realFetch;
/** Response shape for the next fetch call. */
let nextResponse;

/** Minimal Response stub with json()/text()/headers.get(). */
function makeResponse({ status = 200, body = null, contentType = 'application/json' } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get(name) { return name.toLowerCase() === 'content-type' ? contentType : null; },
    },
    async json() { return typeof body === 'string' ? JSON.parse(body) : body; },
    async text() { return typeof body === 'string' ? body : JSON.stringify(body); },
  };
}

beforeEach(() => {
  calls = [];
  nextResponse = makeResponse({ body: { ok: true } });
  realFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), init });
    return nextResponse;
  };
  VBService._reset();
});

afterEach(() => {
  globalThis.fetch = realFetch;
  VBService._reset();
});

describe('VBService.resolve', () => {
  it('defaults to /go/{role} without configure', () => {
    assert.equal(VBService.resolve('notify'), '/go/notify');
  });

  it('respects baseUrl override', () => {
    VBService.configure({ baseUrl: '/api' });
    assert.equal(VBService.resolve('notify'), '/api/notify');
  });

  it('per-service override wins over baseUrl', () => {
    VBService.configure({
      baseUrl: '/api',
      services: { ai: 'https://api.openai.com/v1' },
    });
    assert.equal(VBService.resolve('ai'), 'https://api.openai.com/v1');
    assert.equal(VBService.resolve('notify'), '/api/notify');
  });

  it('strips trailing slashes', () => {
    VBService.configure({ baseUrl: '/api/' });
    assert.equal(VBService.resolve('notify'), '/api/notify');
  });

  it('rejects empty role', () => {
    assert.throws(() => VBService.resolve(''), /role/);
  });
});

describe('VBService.configure', () => {
  it('merges headers across calls', () => {
    VBService.configure({ headers: { 'X-A': '1' } });
    VBService.configure({ headers: { 'X-B': '2' } });
    VBService.configure({ baseUrl: '/api' });
    // Verify indirectly via a request.
    const svc = new VBService('notify');
    return svc.get('/').then(() => {
      const headers = /** @type {Record<string, string>} */ (calls[0].init.headers);
      assert.equal(headers['X-A'], '1');
      assert.equal(headers['X-B'], '2');
    });
  });
});

describe('CRUD verbs', () => {
  it('GET hits the resolved URL', async () => {
    const svc = new VBService('notify');
    await svc.get('/messages');
    assert.equal(calls[0].init.method, 'GET');
    assert.match(calls[0].url, /\/go\/notify\/messages$/);
  });

  it('GET serializes params into query string', async () => {
    await new VBService('notify').get('/messages', { page: 2, filter: 'unread' });
    assert.match(calls[0].url, /\/go\/notify\/messages\?/);
    const search = new URL(calls[0].url).searchParams;
    assert.equal(search.get('page'), '2');
    assert.equal(search.get('filter'), 'unread');
  });

  it('POST sends JSON body with content-type header', async () => {
    await new VBService('notify').post('/read', { ids: ['m1', 'm2'] });
    assert.equal(calls[0].init.method, 'POST');
    const headers = /** @type {Record<string, string>} */ (calls[0].init.headers);
    assert.equal(headers['content-type'], 'application/json');
    assert.deepEqual(JSON.parse(/** @type {string} */ (calls[0].init.body)), { ids: ['m1', 'm2'] });
  });

  it('PATCH sends JSON body', async () => {
    await new VBService('notify').patch('/m1', { read: true });
    assert.equal(calls[0].init.method, 'PATCH');
    assert.deepEqual(JSON.parse(/** @type {string} */ (calls[0].init.body)), { read: true });
  });

  it('DELETE has no body', async () => {
    await new VBService('notify').delete('/m1');
    assert.equal(calls[0].init.method, 'DELETE');
    assert.equal(calls[0].init.body, undefined);
  });

  it('path without leading slash is still normalized', async () => {
    await new VBService('notify').get('messages');
    assert.match(calls[0].url, /\/go\/notify\/messages$/);
  });
});

describe('Error normalization', () => {
  it('throws VBServiceError on non-2xx with status, body, role, path', async () => {
    nextResponse = makeResponse({ status: 404, body: { error: 'not found' } });
    await assert.rejects(
      () => new VBService('notify').get('/missing'),
      (err) => {
        assert.ok(err instanceof VBServiceError);
        assert.equal(err.status, 404);
        assert.deepEqual(err.body, { error: 'not found' });
        assert.equal(err.role, 'notify');
        assert.equal(err.path, '/missing');
        return true;
      },
    );
  });

  it('VBServiceError name is VBServiceError for downstream checks', async () => {
    nextResponse = makeResponse({ status: 500, body: 'boom', contentType: 'text/plain' });
    try {
      await new VBService('notify').get('/');
      assert.fail('expected throw');
    } catch (err) {
      assert.equal(err.name, 'VBServiceError');
    }
  });
});

describe('Global headers', () => {
  it('merges configured headers into every request', async () => {
    VBService.configure({ headers: { 'X-Auth': 'token' } });
    await new VBService('notify').get('/');
    const headers = /** @type {Record<string, string>} */ (calls[0].init.headers);
    assert.equal(headers['X-Auth'], 'token');
  });
});
