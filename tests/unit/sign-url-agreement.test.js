/**
 * Signer / verifier `url` agreement (canonical-document v1 §G-1).
 *
 * scripts/sign-pages.js signs at build time (no deployed origin); the
 * <page-info> verifier runs in the browser. Both must feed the same `url`
 * into buildCanonicalDocument or every page without an absolute canonical
 * link verifies as `failed` (reason `mismatch`). The shared rule is
 * canonicalLinkHref(doc): the raw <link rel="canonical"> href, '' if none.
 *
 * The verifier half below mirrors PageInfo#verifySignature exactly:
 * buildCanonicalDocument(document, { url: canonicalLinkHref(document) }).
 *
 * Run: node --test tests/unit/sign-url-agreement.test.js
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
  canonicalLinkHref,
  _internal
} from '../../src/lib/canonicalize.js';
import { signPage } from '../../scripts/sign-pages.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const PRIVATE_JWK_PATH = resolve(ROOT, 'scripts/demo-keys/vb-release-demo.private.jwk');
const PUBLIC_JWK_PATH = resolve(ROOT, 'site/src/pages/.well-known/content-keys/vb-release-demo.jwk');

async function importJwk(jwk, ops) {
  const importable = { kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y, use: jwk.use || 'sig', key_ops: ops };
  if (ops.includes('sign')) importable.d = jwk.d;
  return crypto.subtle.importKey('jwk', importable, { name: 'ECDSA', namedCurve: 'P-256' }, false, ops);
}

const page = (canonicalLink) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>URL agreement</title>
  ${canonicalLink}
  <meta name="author" content="Test Author">
  <meta name="vb:provenance" content="human">
</head>
<body>
  <main>
    <article data-signable>
      <h1>Heading</h1>
      <p>Signed body text for the url agreement test.</p>
    </article>
  </main>
</body>
</html>`;

/** Browser-side verification, as <page-info> performs it. */
async function verifyLikePageInfo(signedHtml, publicKey) {
  const { document } = parseHTML(signedHtml);
  const signature = document.querySelector('meta[name="vb:signature"]')?.getAttribute('content') ?? '';
  const json = serializeCanonical(buildCanonicalDocument(document, { url: canonicalLinkHref(document) }));
  return crypto.subtle.verify(
    { name: 'ECDSA', hash: 'SHA-256' },
    publicKey,
    /** @type {BufferSource} */ (Uint8Array.from(atob(signature), (c) => c.charCodeAt(0))),
    new TextEncoder().encode(json)
  );
}

describe('signer and verifier compute the same signed url', () => {
  let opts;
  let publicKey;

  before(async () => {
    const priv = JSON.parse(await readFile(PRIVATE_JWK_PATH, 'utf-8'));
    const pub = JSON.parse(await readFile(PUBLIC_JWK_PATH, 'utf-8'));
    opts = { key: await importJwk(priv, ['sign']), kid: priv.kid, keyUrl: '/k.jwk' };
    publicKey = await importJwk(pub, ['verify']);
  });

  const cases = [
    ['absolute canonical', '<link rel="canonical" href="https://Example.com:443/docs/a/?q=1#x">'],
    ['relative canonical', '<link rel="canonical" href="/docs/a/?utm=1">'],
    ['no canonical link', '']
  ];

  for (const [name, link] of cases) {
    it(`${name}: page verifies`, async () => {
      const result = await signPage(page(link), opts);
      assert.equal(result.signed, true);
      assert.equal(await verifyLikePageInfo(result.html, publicKey), true);
    });
  }

  it('the old verifier input (resolved href / location) would not match a relative canonical', async () => {
    const result = await signPage(page('<link rel="canonical" href="/docs/a/">'), opts);
    const { document } = parseHTML(result.html);
    const signature = document.querySelector('meta[name="vb:signature"]')?.getAttribute('content') ?? '';
    const json = serializeCanonical(buildCanonicalDocument(document, { url: 'https://example.com/docs/a/' }));
    const ok = await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' }, publicKey,
      /** @type {BufferSource} */ (Uint8Array.from(atob(signature), (c) => c.charCodeAt(0))),
      new TextEncoder().encode(json)
    );
    assert.equal(ok, false);
  });

  it('tampered content still fails', async () => {
    const result = await signPage(page(''), opts);
    const tampered = result.html.replace('Signed body text', 'Changed body text');
    assert.equal(await verifyLikePageInfo(tampered, publicKey), false);
  });
});

describe('canonicalUrl / canonicalLinkHref', () => {
  const { canonicalUrl } = _internal;

  it('normalizes absolute URLs (host case, default port, query, fragment)', () => {
    assert.equal(canonicalUrl('https://Example.com:443/a/?q=1#f'), 'https://example.com/a/');
  });

  it('keeps relative URLs as authored minus query and fragment', () => {
    assert.equal(canonicalUrl(' /a/b/?q=1#f '), '/a/b/');
    assert.equal(canonicalUrl(''), '');
  });

  it('reads the raw canonical href, empty when missing', () => {
    assert.equal(canonicalLinkHref(parseHTML('<html><head><link rel="Canonical" href="/x/"></head></html>').document), '/x/');
    assert.equal(canonicalLinkHref(parseHTML('<html><head></head></html>').document), '');
  });
});
