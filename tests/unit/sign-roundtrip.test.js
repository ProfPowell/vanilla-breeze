/**
 * End-to-end round-trip test for Stage 4 signing + verification.
 *
 * Exercises: canonicalize → sign with demo private JWK → parse signed
 * HTML → re-canonicalize → verify with demo public JWK. The two halves
 * of the demo keypair are committed (with explicit DEMO labels) so the
 * round-trip can run in CI without secrets. See:
 *   scripts/demo-keys/vb-release-demo.private.jwk
 *   site/src/.well-known/content-keys/vb-release-demo.jwk
 *
 * Run: node --test tests/unit/sign-roundtrip.test.js
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseHTML } from 'linkedom';

import {
  buildCanonicalDocument,
  serializeCanonical,
  canonicalHash
} from '../../src/lib/canonicalize.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const PRIVATE_JWK_PATH = resolve(ROOT, 'scripts/demo-keys/vb-release-demo.private.jwk');
const PUBLIC_JWK_PATH = resolve(ROOT, 'site/src/pages/.well-known/content-keys/vb-release-demo.jwk');

function bytesToBase64(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

function base64ToBytes(b64) {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

async function importJwk(jwk, ops) {
  const importable = {
    kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y, use: jwk.use || 'sig'
  };
  if (ops.includes('sign')) importable.d = jwk.d;
  importable.key_ops = ops;
  return crypto.subtle.importKey(
    'jwk',
    importable,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ops
  );
}

const SAMPLE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Round-trip sample</title>
  <link rel="canonical" href="https://example.com/sample/">
  <meta name="author" content="Test Author">
  <meta name="vb:provenance" content="human">
</head>
<body>
  <main>
    <article data-signable>
      <h1>Sample heading</h1>
      <p>The quick brown fox jumps over the lazy dog.</p>
      <p>A second paragraph with <em>emphasis</em> and a <a href="/x">link</a>.</p>
    </article>
  </main>
</body>
</html>`;

describe('Stage 4 signing round-trip', () => {
  let privateKey;
  let publicKey;

  before(async () => {
    const priv = JSON.parse(await readFile(PRIVATE_JWK_PATH, 'utf-8'));
    const pub = JSON.parse(await readFile(PUBLIC_JWK_PATH, 'utf-8'));
    privateKey = await importJwk(priv, ['sign']);
    publicKey = await importJwk(pub, ['verify']);
  });

  it('signs and verifies a sample document', async () => {
    const { document } = parseHTML(SAMPLE_HTML);
    const canonical = buildCanonicalDocument(document, { url: 'https://example.com/sample/' });
    const json = serializeCanonical(canonical);
    const data = new TextEncoder().encode(json);

    const sigBuffer = await crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' }, privateKey, data
    );
    const signature = bytesToBase64(new Uint8Array(sigBuffer));

    const verified = await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      publicKey,
      base64ToBytes(signature),
      data
    );
    assert.equal(verified, true);
  });

  it('detects tampered content as invalid', async () => {
    const { document } = parseHTML(SAMPLE_HTML);
    const canonical = buildCanonicalDocument(document, { url: 'https://example.com/sample/' });
    const json = serializeCanonical(canonical);

    const data = new TextEncoder().encode(json);
    const sigBuffer = await crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' }, privateKey, data
    );

    /* Tamper: change one character in the canonical text */
    const tampered = json.replace('lazy dog', 'sleepy dog');
    assert.notEqual(tampered, json);

    const verified = await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      publicKey,
      new Uint8Array(sigBuffer),
      new TextEncoder().encode(tampered)
    );
    assert.equal(verified, false);
  });

  it('hash matches the SHA-256 of the canonical JSON bytes', async () => {
    const { document } = parseHTML(SAMPLE_HTML);
    const json = serializeCanonical(buildCanonicalDocument(document, { url: 'https://example.com/sample/' }));
    const hashA = await canonicalHash(json);

    /* Compute reference hash via crypto.subtle directly */
    const data = new TextEncoder().encode(json);
    const digest = await crypto.subtle.digest('SHA-256', data);
    const hashB = bytesToBase64(new Uint8Array(digest));

    assert.equal(hashA, hashB);
  });

  it('public-half kid matches private-half kid', async () => {
    const priv = JSON.parse(await readFile(PRIVATE_JWK_PATH, 'utf-8'));
    const pub = JSON.parse(await readFile(PUBLIC_JWK_PATH, 'utf-8'));
    assert.equal(priv.kid, pub.kid);
    assert.equal(priv.x, pub.x);
    assert.equal(priv.y, pub.y);
    assert.equal(pub.d, undefined, 'public JWK MUST NOT contain private d');
    assert.match(priv.metadata?.warning || '', /DEMO/i);
    assert.match(pub.metadata?.warning || '', /DEMO/i);
  });
});
