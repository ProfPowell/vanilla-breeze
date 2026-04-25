#!/usr/bin/env node
/**
 * sign-pages: Stage-4 reference signer for the meta-tag contract v1.
 *
 * Walks built HTML files, computes the canonical document per
 * admin/specs/canonical-document-v1.md, signs it with ECDSA-P256-SHA256,
 * and injects:
 *   - <meta name="vb:hash"      content="sha256-{base64}">
 *   - <meta name="vb:signature" content="{base64}">
 *   - <meta name="vb:signature-algorithm" content="ECDSA-P256-SHA256">
 *   - <link rel="author-key"    href="{key-url}" data-key-id="{kid}">
 *
 * Usage:
 *   node scripts/sign-pages.js [dist-dir] [options]
 *
 * Options:
 *   --strict          Fail (exit 1) on any signing error. Default: lenient
 *                     (log and continue — Stage 4 starts lenient by design;
 *                     promote to --strict once the kinks are out).
 *   --key-url URL     Public key URL emitted in <link rel="author-key">.
 *                     Default: /.well-known/content-keys/{kid}.jwk
 *   --key-id KID      Override the kid stored in the JWK file.
 *   --quiet           Suppress per-page log lines.
 *   --dry-run         Compute everything but don't write files.
 *
 * Environment:
 *   VB_PRIVATE_KEY_JWK   Path to a JWK file with the signing key.
 *                        Default: scripts/demo-keys/vb-release-demo.private.jwk
 *
 * The default key is a publicly-checked-in DEMO key. Read its `metadata.warning`
 * before deploying anywhere that visitors might mistake the badge for an
 * authorship attestation.
 *
 * The signer skips:
 *   - HTML files with no <article data-signable> or other [data-signable]
 *     descendants (canonical content empty -> nothing to sign)
 *   - HTML files that already carry a non-empty vb:signature meta tag
 *     (idempotent re-runs are safe)
 */

import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseHTML } from 'linkedom';

import {
  buildCanonicalDocument,
  serializeCanonical,
  canonicalHash
} from '../src/lib/canonicalize.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');

const ALGORITHM = 'ECDSA-P256-SHA256';

/* ─────────────────────────────────────────── arg parsing ── */

function parseArgs(argv) {
  const args = {
    distDir: 'site/dist/pages',
    strict: false,
    keyUrl: null,
    keyId: null,
    quiet: false,
    dryRun: false
  };
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--strict') args.strict = true;
    else if (a === '--quiet') args.quiet = true;
    else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--key-url') args.keyUrl = argv[++i];
    else if (a === '--key-id') args.keyId = argv[++i];
    else if (a.startsWith('--')) {
      throw new Error(`Unknown option: ${a}`);
    } else {
      positional.push(a);
    }
  }
  if (positional.length) args.distDir = positional[0];
  return args;
}

/* ─────────────────────────────────────────── key loading ── */

async function loadPrivateKey(args) {
  const path = process.env.VB_PRIVATE_KEY_JWK
    || resolve(ROOT, 'scripts/demo-keys/vb-release-demo.private.jwk');
  if (!existsSync(path)) {
    throw new Error(`Private key not found: ${path}`);
  }
  const jwk = JSON.parse(await readFile(path, 'utf-8'));
  const kid = args.keyId || jwk.kid || 'unknown';
  const keyUrl = args.keyUrl || `/.well-known/content-keys/${kid}.jwk`;

  /* Web Crypto importKey rejects a JWK with extras like `metadata`. */
  const { kty, crv, x, y, d, use, key_ops } = jwk;
  const importable = { kty, crv, x, y, d, use: use || 'sig', key_ops: key_ops || ['sign'] };

  const key = await crypto.subtle.importKey(
    'jwk',
    importable,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  const isDemo = jwk.metadata?.warning?.toLowerCase().includes('demo');

  return { key, kid, keyUrl, isDemo, sourcePath: path };
}

/* ─────────────────────────────────────────── per-file work ── */

function bytesToBase64(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

async function signPage(html, opts) {
  const { document } = parseHTML(html);

  const signable = document.querySelector('[data-signable]');
  if (!signable) return { skipped: 'no [data-signable]' };

  const existing = document.querySelector('meta[name="vb:signature"]');
  if (existing && existing.getAttribute('content')) {
    return { skipped: 'already signed' };
  }

  /* Use the canonical absolute URL declared by the page if present, else
     a deterministic placeholder. The signer doesn't know the deployed
     hostname; the build can pass it via --canonical-base in a future v2.
     For now we read from <link rel="canonical"> which Cook's head
     include emits per page. */
  const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href') || '';

  const canonicalDoc = buildCanonicalDocument(document, { url: canonical });
  if (!canonicalDoc.content) {
    return { skipped: 'empty canonical content' };
  }

  const json = serializeCanonical(canonicalDoc);
  const hash = await canonicalHash(json);

  const data = new TextEncoder().encode(json);
  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    opts.key,
    data
  );
  const signature = bytesToBase64(new Uint8Array(sig));

  /* Inject meta tags into <head>. linkedom keeps the original whitespace
     around when we serialize, so we just append. */
  const head = document.querySelector('head');
  if (!head) {
    throw new Error('document has no <head>');
  }

  const upsertMeta = (name, content) => {
    let el = head.querySelector(`meta[name="${name}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute('name', name);
      head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  upsertMeta('vb:hash', `sha256-${hash}`);
  upsertMeta('vb:signature', signature);
  upsertMeta('vb:signature-algorithm', ALGORITHM);

  let keyLink = head.querySelector('link[rel="author-key"]');
  if (!keyLink) {
    keyLink = document.createElement('link');
    keyLink.setAttribute('rel', 'author-key');
    head.appendChild(keyLink);
  }
  keyLink.setAttribute('href', opts.keyUrl);
  keyLink.setAttribute('data-key-id', opts.kid);

  return {
    signed: true,
    bytes: data.byteLength,
    hash,
    signature,
    html: document.toString()
  };
}

/* ─────────────────────────────────────────── walker ── */

async function* walkHtml(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkHtml(path);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      yield path;
    }
  }
}

/* ─────────────────────────────────────────── main ── */

async function main(argv) {
  const args = parseArgs(argv);
  /* Resolve dist dir relative to CWD so this script works whether invoked
     from repo root (`node scripts/sign-pages.js site/dist/pages`) or from
     site/ (`node ../scripts/sign-pages.js dist/pages`). */
  const distDir = resolve(args.distDir);

  if (!existsSync(distDir)) {
    console.error(`[sign-pages] dist directory not found: ${distDir}`);
    process.exit(args.strict ? 1 : 0);
  }

  const keyOpts = await loadPrivateKey(args);
  if (!args.quiet) {
    const mode = args.strict ? 'strict' : 'lenient';
    const demo = keyOpts.isDemo ? ' [DEMO KEY]' : '';
    console.log(`[sign-pages] mode=${mode} kid=${keyOpts.kid} src=${relative(ROOT, keyOpts.sourcePath)}${demo}`);
    console.log(`[sign-pages] dist=${relative(ROOT, distDir)}  key-url=${keyOpts.keyUrl}`);
  }

  const summary = { signed: 0, skipped: 0, errors: 0 };
  const errors = [];

  for await (const file of walkHtml(distDir)) {
    let result;
    try {
      const html = await readFile(file, 'utf-8');
      result = await signPage(html, keyOpts);
    } catch (err) {
      summary.errors += 1;
      errors.push({ file, message: err.message });
      if (!args.quiet) {
        console.error(`[sign-pages] error ${relative(ROOT, file)}: ${err.message}`);
      }
      continue;
    }

    if (result.skipped) {
      summary.skipped += 1;
      if (!args.quiet && process.env.VB_SIGN_VERBOSE) {
        console.log(`[sign-pages] skip  ${relative(ROOT, file)} (${result.skipped})`);
      }
      continue;
    }

    if (result.signed) {
      summary.signed += 1;
      if (!args.dryRun) {
        await writeFile(file, result.html, 'utf-8');
      }
      if (!args.quiet) {
        console.log(`[sign-pages] sign  ${relative(ROOT, file)} ${result.bytes}B`);
      }
    }
  }

  console.log(`[sign-pages] summary: signed=${summary.signed} skipped=${summary.skipped} errors=${summary.errors}`);

  if (summary.errors > 0 && args.strict) {
    console.error('[sign-pages] strict mode: build failed due to signing errors');
    for (const { file, message } of errors) {
      console.error(`  ${relative(ROOT, file)}: ${message}`);
    }
    process.exit(1);
  }
}

main(process.argv.slice(2)).catch((err) => {
  console.error('[sign-pages] fatal:', err);
  process.exit(1);
});
