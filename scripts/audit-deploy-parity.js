#!/usr/bin/env node
/**
 * Audit prod deploy parity vs the local build.
 *
 * For each critical asset, fetches it from https://vanilla-breeze.com AND
 * from site/dist/pages/ on disk, hashes both, and reports whether they
 * match. Turns "the fix didn't land" hand-waving into a specific list of
 * files that diff / are missing on prod.
 *
 * Usage:
 *   node scripts/audit-deploy-parity.js
 *   SITE_URL=https://staging.example node scripts/audit-deploy-parity.js
 *
 * Exit codes:
 *   0 — all checked assets match (or local file is absent; see "Note")
 *   1 — at least one asset mismatches or is missing on prod when local has it
 *
 * Note: if an asset is absent locally (user hasn't run `npm run build`),
 * we don't fail — we just skip with a 'local missing' note. The audit
 * only fails on true parity violations.
 */

import { createHash } from 'node:crypto';
import { readFile, access } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const pagesDir = join(repoRoot, 'site', 'dist', 'pages');

const SITE_URL = process.env.SITE_URL || 'https://vanilla-breeze.com';

// Mix of CDN bundles (where cache bites hardest), page HTML, and special
// files. Add to this list whenever a new deploy-drift class surfaces.
const ASSETS = [
  '/cdn/vanilla-breeze-core.css',
  '/cdn/vanilla-breeze-core.js',
  '/cdn/vanilla-breeze.css',
  '/cdn/vanilla-breeze.js',
  '/cdn/vanilla-breeze-autoload.js',
  '/cdn/components/watch-wc.js',
  '/cdn/components/notification-wc.js',
  '/src/web-components/page-tools/styles.css',
  '/src/web-components/watch-wc/logic.js',
  '/src/custom-elements/layout-sidebar/styles.css',
  '/docs/typography/',
  '/docs/concepts/feel/',
  '/docs/alpenglow/',
  '/sitemap.xml',
];

function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex').slice(0, 16);
}

/** Resolve a URL path to the local file it corresponds to. */
function localPath(urlPath) {
  // Treat /foo/ as /foo/index.html
  let p = urlPath;
  if (p.endsWith('/')) p += 'index.html';
  // /cdn/* and /src/* are served from outside site/dist/pages — but
  // assemble-site copies /cdn/ into site/dist/pages/cdn. /src/ uses a
  // symlink locally; the fair comparison is what's deployed from the
  // post-assemble pages dir.
  return join(pagesDir, p.replace(/^\//, ''));
}

async function fetchProd(urlPath) {
  const url = `${SITE_URL}${urlPath}`;
  try {
    const res = await fetch(url, { redirect: 'manual' });
    if (res.status === 301 || res.status === 302) {
      return { status: res.status, redirect: res.headers.get('location'), hash: null, size: 0 };
    }
    if (!res.ok) return { status: res.status, hash: null, size: 0 };
    const buf = Buffer.from(await res.arrayBuffer());
    return { status: res.status, hash: sha256(buf), size: buf.length };
  } catch (err) {
    return { status: 'error', error: String(err.message || err), hash: null, size: 0 };
  }
}

async function readLocal(urlPath) {
  const path = localPath(urlPath);
  try {
    await access(path);
    const buf = await readFile(path);
    return { hash: sha256(buf), size: buf.length, path };
  } catch {
    return { hash: null, size: 0, path, missing: true };
  }
}

function fmtRow(asset, prod, local) {
  const status = (() => {
    if (prod.status !== 200) return `PROD ${prod.status}${prod.redirect ? ` → ${prod.redirect}` : ''}`;
    if (local.missing) return `local-missing`;
    if (prod.hash === local.hash) return `match`;
    return `MISMATCH`;
  })();

  const mark = status === 'match' ? '✓' : status === 'local-missing' ? '~' : '✗';
  const sizes = local.missing
    ? `prod=${prod.size}B`
    : `prod=${prod.size}B local=${local.size}B`;
  return `  ${mark} ${asset.padEnd(54)} ${status.padEnd(22)} ${sizes}`;
}

async function main() {
  console.log(`\nAudit: ${SITE_URL} vs ${pagesDir}\n`);
  console.log(`  legend: ✓ match  ✗ mismatch/missing  ~ local absent (skip)\n`);

  let mismatches = 0;
  let skipped = 0;
  let matched = 0;

  for (const asset of ASSETS) {
    const [prod, local] = await Promise.all([fetchProd(asset), readLocal(asset)]);
    const matches = prod.status === 200 && !local.missing && prod.hash === local.hash;
    if (matches) matched += 1;
    else if (local.missing) skipped += 1;
    else mismatches += 1;
    console.log(fmtRow(asset, prod, local));
  }

  console.log(`\n  ${matched} matched, ${mismatches} mismatched, ${skipped} local-missing\n`);

  if (mismatches > 0) {
    console.log(`  Next: inspect the hash of a mismatching asset with:`);
    console.log(`    curl -s ${SITE_URL}/cdn/vanilla-breeze-core.css | shasum -a 256`);
    console.log(`    shasum -a 256 site/dist/pages/cdn/vanilla-breeze-core.css`);
    console.log(`  Equal locally but different on prod = CF build didn't run or cache is stale.\n`);
  }

  process.exit(mismatches > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
