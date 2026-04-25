#!/usr/bin/env node
/**
 * generate-key: produce a fresh ECDSA-P256 keypair for VB content signing.
 *
 * Usage:
 *   node scripts/generate-key.js [options]
 *
 * Options:
 *   --kid ID                 Key ID. Default: random 8 hex chars
 *   --owner NAME             Owner name baked into JWK metadata
 *   --domain DOMAIN          Domain claimed by this key
 *   --contact URL            Contact URL or email
 *   --out-public PATH        Where to write the public JWK
 *                            Default: site/src/.well-known/content-keys/{kid}.jwk
 *   --out-private PATH       Where to write the private JWK
 *                            Default: .vb-keys/{kid}.private.jwk (gitignored)
 *
 * After generating:
 *   1. Commit the public JWK so verifiers can fetch it.
 *   2. Keep the private JWK off the public internet.
 *   3. Set VB_PRIVATE_KEY_JWK to the private path before running sign-pages.
 *   4. Add the key to /.well-known/content-authenticity.json.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function parseArgs(argv) {
  const args = {
    kid: null,
    owner: '',
    domain: '',
    contact: '',
    outPublic: null,
    outPrivate: null
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--kid') args.kid = argv[++i];
    else if (a === '--owner') args.owner = argv[++i];
    else if (a === '--domain') args.domain = argv[++i];
    else if (a === '--contact') args.contact = argv[++i];
    else if (a === '--out-public') args.outPublic = argv[++i];
    else if (a === '--out-private') args.outPrivate = argv[++i];
    else throw new Error(`Unknown arg: ${a}`);
  }
  return args;
}

function randomHex(n) {
  return [...crypto.getRandomValues(new Uint8Array(n))]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function main(argv) {
  const args = parseArgs(argv);
  const kid = args.kid || randomHex(4);
  const today = new Date().toISOString().slice(0, 10);
  const expires = new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().slice(0, 10);

  const pair = await crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify']
  );
  const pub = await crypto.subtle.exportKey('jwk', pair.publicKey);
  const priv = await crypto.subtle.exportKey('jwk', pair.privateKey);

  const metadata = {
    owner: args.owner,
    domain: args.domain,
    created: today,
    expires,
    contact: args.contact
  };

  const pubJwk = {
    kty: pub.kty,
    crv: pub.crv,
    use: 'sig',
    kid,
    x: pub.x,
    y: pub.y,
    key_ops: ['verify'],
    metadata
  };
  const privJwk = {
    kty: priv.kty,
    crv: priv.crv,
    use: 'sig',
    kid,
    x: priv.x,
    y: priv.y,
    d: priv.d,
    key_ops: ['sign'],
    metadata
  };

  const pubPath = resolve(ROOT, args.outPublic
    || `site/src/.well-known/content-keys/${kid}.jwk`);
  const privPath = resolve(ROOT, args.outPrivate
    || `.vb-keys/${kid}.private.jwk`);

  await mkdir(dirname(pubPath), { recursive: true });
  await mkdir(dirname(privPath), { recursive: true });
  await writeFile(pubPath, JSON.stringify(pubJwk, null, 2) + '\n', 'utf-8');
  await writeFile(privPath, JSON.stringify(privJwk, null, 2) + '\n', 'utf-8');

  console.log(`Generated ECDSA-P256 keypair for kid=${kid}`);
  console.log(`  public  -> ${pubPath}`);
  console.log(`  private -> ${privPath}`);
  console.log('');
  console.log('Next steps:');
  console.log(`  export VB_PRIVATE_KEY_JWK=${privPath}`);
  console.log('  npm run build  # signer picks up the env var');
  console.log('');
  console.log('Add this key to site/src/.well-known/content-authenticity.json:');
  console.log(JSON.stringify({
    id: kid,
    owner: args.owner,
    url: `/.well-known/content-keys/${kid}.jwk`,
    active: true
  }, null, 2));
}

main(process.argv.slice(2)).catch((err) => {
  console.error('generate-key failed:', err);
  process.exit(1);
});
