#!/usr/bin/env node
/**
 * Vendor Project Nayuki's QR Code generator (TypeScript/JavaScript edition,
 * MIT) as an ES module for <qr-code>.
 *
 * src/vendor/qrcodegen/upstream/qrcodegen.ts is the verbatim upstream file at the
 * commit pinned below. This script strips its types with esbuild and appends
 * ES module exports, writing src/vendor/qrcodegen/qrcodegen.js. The licence
 * header is copied across unchanged.
 *
 *   node scripts/vendor-qrcodegen.mjs           # regenerate .js from the local .ts
 *   node scripts/vendor-qrcodegen.mjs --fetch   # re-download the pinned .ts first
 *
 * To move to a newer upstream commit: change COMMIT and SHA256, run with
 * --fetch, update src/vendor/qrcodegen/README.md, and run
 * tests/unit/qr-code-decode.test.js (it round-trips codes through jsQR).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformSync } from 'esbuild';

export const COMMIT = '2c9044de6b049ca25cb3cd1649ed7e27aa055138';
export const SHA256 = '1dc03fb5a10e0e2318ea162755bbdb9977ca6ce52cff959e9c9b6deafdccda9c';
const URL_TS = `https://raw.githubusercontent.com/nayuki/QR-Code-generator/${COMMIT}/typescript-javascript/qrcodegen.ts`;

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'vendor', 'qrcodegen');
export const TS_PATH = join(dir, 'upstream', 'qrcodegen.ts');
export const JS_PATH = join(dir, 'qrcodegen.js');

/**
 * Turn the upstream TypeScript source into the vendored ES module text.
 * Pure function of its input so the unit test can check the committed copy.
 *
 * @param {string} source - Upstream qrcodegen.ts contents.
 * @returns {string}
 */
export function toModule(source) {
  const header = source.match(/^\/\*[\s\S]*?\*\//)?.[0];
  if (!header || !header.includes('MIT License')) throw new Error('qrcodegen.ts: licence header not found');
  const { code } = transformSync(source, { loader: 'ts', format: 'esm', target: 'es2022', legalComments: 'none' });
  return [
    header,
    '',
    '// Vendored by scripts/vendor-qrcodegen.mjs from',
    `// github.com/nayuki/QR-Code-generator @ ${COMMIT} (typescript-javascript/qrcodegen.ts).`,
    '// Types stripped with esbuild; ES module exports appended. Do not edit by hand.',
    '// @ts-nocheck',
    '',
    code.trimEnd(),
    '',
    'export default qrcodegen;',
    'export const QrCode = qrcodegen.QrCode;',
    'export const QrSegment = qrcodegen.QrSegment;',
    '',
  ].join('\n');
}

const sha = (text) => createHash('sha256').update(text).digest('hex');

async function main() {
  if (process.argv.includes('--fetch')) {
    const res = await fetch(URL_TS);
    if (!res.ok) throw new Error(`fetch ${URL_TS}: ${res.status}`);
    const text = await res.text();
    if (sha(text) !== SHA256) throw new Error(`sha256 mismatch for pinned qrcodegen.ts: got ${sha(text)}`);
    mkdirSync(dirname(TS_PATH), { recursive: true });
    writeFileSync(TS_PATH, text);
  }
  const source = readFileSync(TS_PATH, 'utf8');
  if (sha(source) !== SHA256) throw new Error('src/vendor/qrcodegen/upstream/qrcodegen.ts is not the pinned upstream file (sha256 mismatch)');
  writeFileSync(JS_PATH, toModule(source));
  console.log(`wrote ${JS_PATH}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => { console.error(err.message); process.exit(1); });
}
