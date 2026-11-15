/**
 * <page-info> verifier rules (meta-tag contract v1 §B integrity, §E keys):
 * the key must be same-origin, must not be expired, and vb:hash (when
 * present) must match the canonical document.
 *
 * Run: node --test tests/unit/page-info-verify.test.js
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseHTML } from 'linkedom';

import { verifyDocument, keyExpired } from '../../src/web-components/page-info/verify-core.js';
import { signPage } from '../../scripts/sign-pages.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const ORIGIN = 'https://example.org';
const NOW = Date.parse('2026-07-06T12:00:00Z');

const PAGE = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Verify</title>
  <meta name="author" content="Test Author">
</head>
<body>
  <article data-signable>
    <h1>Heading</h1>
    <change-set><p>Buses run every <del>20</del> <ins>15</ins> minutes.</p></change-set>
  </article>
</body>
</html>`;

describe('page-info verifyDocument', () => {
  let pub;
  let signOpts;

  before(async () => {
    const priv = JSON.parse(await readFile(resolve(ROOT, 'scripts/demo-keys/vb-release-demo.private.jwk'), 'utf-8'));
    pub = JSON.parse(await readFile(resolve(ROOT, 'site/src/pages/.well-known/content-keys/vb-release-demo.jwk'), 'utf-8'));
    const { kty, crv, x, y, d } = priv;
    const key = await crypto.subtle.importKey('jwk', { kty, crv, x, y, d, key_ops: ['sign'] },
      { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
    signOpts = { key, kid: priv.kid };
  });

  /** Sign PAGE, optionally edit the signed HTML, verify with a stub fetch. */
  async function run({ keyUrl = '/k.jwk', jwk = pub, edit = (h) => h, now = NOW } = {}) {
    const signed = await signPage(PAGE, { ...signOpts, keyUrl });
    const { document } = parseHTML(edit(signed.html));
    const fetched = [];
    const fetchStub = async (url) => {
      fetched.push(String(url));
      return { ok: true, status: 200, json: async () => jwk };
    };
    const result = await verifyDocument(document, {
      origin: ORIGIN, baseURI: `${ORIGIN}/page/`, fetch: /** @type {any} */ (fetchStub), now
    });
    return { result, fetched };
  }

  it('verifies a signed page with a same-origin key', async () => {
    const { result, fetched } = await run();
    assert.deepEqual(result, { status: 'verified', reason: 'ok' });
    assert.deepEqual(fetched, [`${ORIGIN}/k.jwk`]);
  });

  it('refuses a key on another origin without fetching it', async () => {
    const { result, fetched } = await run({ keyUrl: 'https://keys.elsewhere.example/k.jwk' });
    assert.deepEqual(result, { status: 'failed', reason: 'key-origin', label: 'key-untrusted' });
    assert.deepEqual(fetched, []);
  });

  it('reports an expired key as failed', async () => {
    const jwk = { ...pub, metadata: { ...pub.metadata, expires: '2026-07-06' } };
    const { result } = await run({ jwk });
    assert.deepEqual(result, { status: 'failed', reason: 'key-expired', label: 'key-expired' });
  });

  it('fails when vb:hash does not match the canonical document', async () => {
    const { result } = await run({
      edit: (h) => h.replace(/content="sha256-[^"]+"/, 'content="sha256-AAAA"')
    });
    assert.deepEqual(result, { status: 'failed', reason: 'hash-mismatch' });
  });

  it('vb:hash is optional', async () => {
    let html = '';
    const { result } = await run({ edit: (h) => (html = h.replace(/<meta content="sha256-[^>]*>/, '')) });
    assert.ok(!html.includes('vb:hash'));
    assert.equal(result?.status, 'verified');
  });

  it('text inside <ins> is signed, text inside <del> is not', async () => {
    const ins = await run({ edit: (h) => h.replace('<ins>15</ins>', '<ins>5</ins>') });
    assert.equal(ins.result?.status, 'failed');
    const del = await run({ edit: (h) => h.replace('<del>20</del>', '<del>30</del>') });
    assert.equal(del.result?.status, 'verified');
  });

  it('returns null for an unsigned page', async () => {
    const { document } = parseHTML(PAGE);
    assert.equal(await verifyDocument(document, { origin: ORIGIN }), null);
  });
});

describe('keyExpired', () => {
  it('reads metadata.expires; a date-only value expires at the start of that day (UTC)', () => {
    const jwk = { metadata: { expires: '2027-01-01' } };
    assert.equal(keyExpired(jwk, Date.parse('2026-12-31T23:59:59Z')), false);
    assert.equal(keyExpired(jwk, Date.parse('2027-01-01T00:00:00Z')), true);
  });

  it('no expires means no expiry; an unreadable one counts as expired', () => {
    assert.equal(keyExpired({}, NOW), false);
    assert.equal(keyExpired({ metadata: {} }, NOW), false);
    assert.equal(keyExpired({ metadata: { expires: 'soon' } }, NOW), true);
  });
});
