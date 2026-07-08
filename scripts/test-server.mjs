#!/usr/bin/env node
/**
 * Static server for the Playwright suite.
 *
 * Serves site/dist/pages — the assembled site — which already contains
 * /cdn (copied from dist/cdn), /src (raw source for dev references), and
 * /docs (rewritten demos). Run `npm run build` first to populate it.
 *
 * Spawned automatically by playwright.config.js (webServer); can also be
 * run standalone: node scripts/test-server.mjs
 */

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', 'site', 'dist', 'pages');
const PORT = Number(process.env.TEST_SERVER_PORT ?? 8123);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
  '.webmanifest': 'application/manifest+json',
  '.map': 'application/json',
  '.md': 'text/markdown; charset=utf-8',
  '.wasm': 'application/wasm',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
};

async function resolveFile(urlPath) {
  // Prevent path traversal; normalize collapses ../ segments
  const safe = normalize(urlPath).replace(/^(\.\.[/\\])+/, '');
  const base = join(ROOT, safe);
  if (!base.startsWith(ROOT)) return null;

  // try_files {path} {path}/index.html
  try {
    const s = await stat(base);
    if (s.isFile()) return base;
    if (s.isDirectory()) {
      const index = join(base, 'index.html');
      await stat(index);
      return index;
    }
  } catch { /* fall through */ }
  return null;
}

createServer(async (req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = await resolveFile(urlPath);
  if (!file) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end(`Not found: ${urlPath}`);
    return;
  }
  const body = await readFile(file);
  const type = MIME[extname(file)] ?? 'application/octet-stream';

  // Media elements request byte ranges; without 206 support the browser can
  // re-request indefinitely and the page never reaches networkidle.
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? '');
  if (range && (range[1] || range[2])) {
    const start = range[1] ? Number(range[1]) : Math.max(0, body.length - Number(range[2]));
    const end = range[1] && range[2] ? Math.min(Number(range[2]), body.length - 1) : body.length - 1;
    if (start >= body.length || start > end) {
      res.writeHead(416, { 'content-range': `bytes */${body.length}` });
      res.end();
      return;
    }
    res.writeHead(206, {
      'content-type': type,
      'content-range': `bytes ${start}-${end}/${body.length}`,
      'accept-ranges': 'bytes',
      'cache-control': 'no-store',
    });
    res.end(body.subarray(start, end + 1));
    return;
  }

  res.writeHead(200, {
    'content-type': type,
    'accept-ranges': 'bytes',
    'cache-control': 'no-store',
  });
  res.end(body);
}).listen(PORT, () => {
  console.log(`test-server: serving ${ROOT} at http://127.0.0.1:${PORT}`);
});
