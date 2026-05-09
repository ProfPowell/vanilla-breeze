/**
 * Unit tests for src/lib/ai/endpoint.js
 *
 * Stubs globalThis.fetch with hand-rolled Response shapes covering both
 * supported response types (text/plain stream, application/json) plus the
 * error and abort paths. Uses Node's built-in TextEncoder / ReadableStream
 * (available since Node 18).
 *
 * Run with: node --test tests/unit/ai/endpoint.test.js
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { callEndpoint } from '../../../src/lib/ai/endpoint.js';

const ORIGINAL_FETCH = globalThis.fetch;

function streamResponse(chunks, { contentType = 'text/plain', status = 200 } = {}) {
  const encoder = new TextEncoder();
  const body = new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
  return new Response(body, { status, headers: { 'Content-Type': contentType } });
}

async function collect(iter) {
  const out = [];
  for await (const chunk of iter) out.push(chunk);
  return out;
}

afterEach(() => { globalThis.fetch = ORIGINAL_FETCH; });

describe('callEndpoint — request shape', () => {
  it('POSTs JSON with prompt/content/mode', async () => {
    let captured;
    globalThis.fetch = async (url, init) => {
      captured = { url, init };
      return streamResponse(['ok']);
    };
    await collect(callEndpoint('/api/x', { prompt: 'hi', content: 'page', mode: 'summarize' }));
    assert.equal(captured.url, '/api/x');
    assert.equal(captured.init.method, 'POST');
    assert.equal(captured.init.headers['Content-Type'], 'application/json');
    assert.deepEqual(JSON.parse(captured.init.body), { prompt: 'hi', content: 'page', mode: 'summarize' });
  });

  it('omits content/mode when not provided', async () => {
    let body;
    globalThis.fetch = async (_url, init) => {
      body = JSON.parse(init.body);
      return streamResponse(['x']);
    };
    await collect(callEndpoint('/api/x', { prompt: 'hi' }));
    assert.deepEqual(body, { prompt: 'hi' });
  });
});

describe('callEndpoint — text/plain streaming', () => {
  it('yields decoded chunks in order', async () => {
    globalThis.fetch = async () => streamResponse(['Hel', 'lo, ', 'world.']);
    const chunks = await collect(callEndpoint('/api/x', { prompt: 'hi' }));
    assert.deepEqual(chunks.join(''), 'Hello, world.');
    assert.ok(chunks.length >= 2, 'expected at least two yielded chunks');
  });
});

describe('callEndpoint — application/json one-shot', () => {
  it('yields the text field once', async () => {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ text: 'one shot' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    const chunks = await collect(callEndpoint('/api/x', { prompt: 'hi' }));
    assert.deepEqual(chunks, ['one shot']);
  });

  it('yields nothing when text is missing or non-string', async () => {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({}), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    assert.deepEqual(await collect(callEndpoint('/api/x', { prompt: 'hi' })), []);
  });
});

describe('callEndpoint — errors', () => {
  it('throws on non-2xx response', async () => {
    globalThis.fetch = async () =>
      new Response('boom', { status: 503, statusText: 'Service Unavailable' });
    await assert.rejects(
      collect(callEndpoint('/api/x', { prompt: 'hi' })),
      /503/,
    );
  });

  it('propagates AbortController.abort()', async () => {
    const ctl = new AbortController();
    globalThis.fetch = async (_url, init) => {
      // Simulate fetch rejecting when its signal is aborted.
      return await new Promise((_, reject) => {
        init.signal.addEventListener('abort', () => {
          const err = new Error('aborted');
          err.name = 'AbortError';
          reject(err);
        });
      });
    };
    queueMicrotask(() => ctl.abort());
    await assert.rejects(
      collect(callEndpoint('/api/x', { prompt: 'hi', signal: ctl.signal })),
      (err) => err.name === 'AbortError',
    );
  });
});
