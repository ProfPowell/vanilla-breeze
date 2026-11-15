/**
 * verify-core: signature verification for <page-info>, free of the element
 * so it runs under Node (unit tests) as well as in the browser.
 *
 * Contract: admin/specs/meta-tag-contract-v1.md §B (integrity) and §E (keys),
 * canonical form per admin/specs/canonical-document-v1.md.
 */

import {
  buildCanonicalDocument, serializeCanonical, canonicalHash, canonicalLinkHref
} from '../../lib/canonicalize.js';

const ALGORITHM = 'ECDSA-P256-SHA256';

/**
 * @typedef {object} VerifyResult
 * @property {'verified' | 'failed' | 'key-unavailable'} status
 * @property {string} reason
 * @property {string} [label] - Tier label key when it differs from `status`
 */

/**
 * True when the JWK's `metadata.expires` (§E) has passed. A date-only value
 * is UTC midnight at the start of that day. No value means no expiry; a
 * value that does not parse as a date counts as expired.
 *
 * @param {any} jwk
 * @param {number} [now] - Milliseconds since the epoch
 * @returns {boolean}
 */
export function keyExpired(jwk, now = Date.now()) {
  const raw = jwk?.metadata?.expires;
  if (raw == null || raw === '') return false;
  const expires = Date.parse(String(raw));
  return Number.isNaN(expires) || now >= expires;
}

/**
 * @param {Document} doc
 * @param {string} selector
 * @param {string} attr
 */
function read(doc, selector, attr) {
  return doc.querySelector(selector)?.getAttribute(attr)?.trim() || '';
}

/**
 * Verify the document's `vb:signature`. Resolves to null when the page has
 * no signature or the signal aborted, otherwise to the tier and a reason.
 *
 * @param {Document} doc
 * @param {object} opts
 * @param {string} opts.origin - Origin of the page; the key must share it
 * @param {string} [opts.baseURI] - Base for a relative key href (default doc.baseURI)
 * @param {typeof fetch} [opts.fetch]
 * @param {number} [opts.now]
 * @param {AbortSignal} [opts.signal]
 * @returns {Promise<VerifyResult | null>}
 */
export async function verifyDocument(doc, opts) {
  const { origin, signal, now } = opts;
  const fetchKey = opts.fetch ?? globalThis.fetch;

  const signature = read(doc, 'meta[name="vb:signature"]', 'content');
  if (!signature) return null;

  const algorithm = read(doc, 'meta[name="vb:signature-algorithm"]', 'content');
  if (algorithm && algorithm !== ALGORITHM) {
    return { status: 'failed', reason: `unsupported-algorithm:${algorithm}` };
  }

  const keyHref = read(doc, 'link[rel~="author-key" i]', 'href');
  if (!keyHref) return { status: 'failed', reason: 'missing-author-key' };

  let jwk;
  let publicKey;
  try {
    const url = new URL(keyHref, opts.baseURI ?? doc.baseURI);
    /* §E: keys are published on the page's own domain. A key from any other
       origin proves nothing about this site, so it is never fetched. */
    if (url.origin !== origin) {
      return { status: 'failed', reason: 'key-origin', label: 'key-untrusted' };
    }
    // redirect: 'error' so a same-origin URL cannot hand off to another host.
    const res = await fetchKey(url, { credentials: 'omit', redirect: 'error', signal });
    if (!res.ok) throw new Error(`status ${res.status}`);
    jwk = await res.json();
    publicKey = await crypto.subtle.importKey(
      'jwk',
      { kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y, use: jwk.use || 'sig', key_ops: ['verify'] },
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['verify']
    );
  } catch (err) {
    if (signal?.aborted) return null;
    return { status: 'key-unavailable', reason: /** @type {Error} */ (err).message };
  }
  if (signal?.aborted) return null;

  if (keyExpired(jwk, now)) {
    return { status: 'failed', reason: 'key-expired', label: 'key-expired' };
  }

  let canonical;
  try {
    /* Same `url` input as scripts/sign-pages.js: the raw canonical href. */
    canonical = serializeCanonical(buildCanonicalDocument(doc, { url: canonicalLinkHref(doc) }));
  } catch (err) {
    return { status: 'failed', reason: `canonicalize:${/** @type {Error} */ (err).message}` };
  }

  let isValid;
  try {
    /* vb:hash is optional; when present it must match the canonical bytes. */
    const hash = read(doc, 'meta[name="vb:hash"]', 'content');
    if (hash && hash !== `sha256-${await canonicalHash(canonical)}`) {
      return signal?.aborted ? null : { status: 'failed', reason: 'hash-mismatch' };
    }
    const sig = Uint8Array.from(atob(signature), (c) => c.charCodeAt(0));
    isValid = await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' }, publicKey, sig, new TextEncoder().encode(canonical)
    );
  } catch (err) {
    if (signal?.aborted) return null;
    return { status: 'failed', reason: `verify:${/** @type {Error} */ (err).message}` };
  }
  if (signal?.aborted) return null;

  return isValid ? { status: 'verified', reason: 'ok' } : { status: 'failed', reason: 'mismatch' };
}
