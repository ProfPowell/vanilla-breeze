#!/usr/bin/env node
/**
 * Link and content-integrity gate for the built docs site (vanilla-breeze-2zsd).
 *
 * Checks site/dist/pages after `npm run build`:
 *   1. Docs pages: every internal <a href>, asset reference and #fragment
 *      resolves. Fragments may target an id in the HTML or one that
 *      <heading-links> generates at runtime from a heading's text.
 *   2. Demo pages (/demos/, standalone *.html, /src/, /docs/alpenglow/):
 *      asset references only. Demos use placeholder links (/dashboard,
 *      #profile) on purpose.
 *   3. Every source page builds with as many <code-block>s as its source.
 *      A cook-ssg bug once ate code-block closers and the HTML after them
 *      on 52 pages; only this count exposed it.
 *   4. The output root has a 404.html, so unknown URLs get HTTP 404
 *      instead of Cloudflare's home-page fallback with HTTP 200.
 *   5. --external: also HEAD/GET external URLs from docs pages (off by
 *      default: third-party sites make CI flaky).
 *
 * Usage:
 *   node scripts/check-links.mjs [--root site/dist/pages] [--src site/src/pages]
 *                                [--external] [--json out.json]
 * Exits 1 when anything is broken.
 */

import { readFileSync, readdirSync, statSync, existsSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { parseHTML } from 'linkedom';

const SITE_ORIGIN = 'https://vanilla-breeze.com';

/*
 * heading-links id rules — MIRROR of src/web-components/heading-links/logic.js
 * (headingSlug, uniqueSlug, parseLevels and the skipped contexts). Change both
 * together; tests/unit/check-links.test.js asserts parity on a fixture list.
 */

/** Heading text → id slug (Unicode-aware; empty → "section"). */
export function headingSlug(text) {
  const slug = String(text).normalize('NFC').toLowerCase().trim()
    .replace(/[^\p{L}\p{M}\p{N}\s_-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const cut = Array.from(slug).slice(0, 50).join('').replace(/-$/, '');
  return cut || 'section';
}

/** First free id: base, base-1, base-2… */
export function uniqueSlug(base, taken) {
  let id = base;
  let counter = 1;
  while (taken(id)) id = `${base}-${counter++}`;
  return id;
}

/** levels attribute → validated h1–h6 list (default h2,h3). */
export function parseLevels(value) {
  const tokens = (value ?? '').split(',').map((t) => t.trim().toLowerCase()).filter((t) => /^h[1-6]$/.test(t));
  return tokens.length ? [...new Set(tokens)] : ['h2', 'h3'];
}

// Mirrors SKIP_CONTEXT in src/web-components/_shared/toc-skip.js (heading-links + page-toc).
const HEADING_LINKS_SKIP = 'dialog, [data-toc-ignore], browser-window';

/** Demo-ish pages: only their asset references are checked. */
export function isDemoPage(urlPath) {
  return /\/demos\//.test(urlPath)
    || /\.html$/.test(urlPath)
    || urlPath.startsWith('/src/')
    || urlPath.startsWith('/docs/alpenglow/')
    || urlPath.startsWith('/r-n-d/');
}

/** URL paths served by Pages Functions, not files. */
const FUNCTION_PATHS = /^\/(go|api)\//;

/** Built HTML file → URL path ("/docs/x/", "/docs/demo.html"). */
export function fileToUrl(root, file) {
  const rel = '/' + relative(root, file).split('\\').join('/');
  return rel.replace(/\/index\.html$/, '/');
}

/** Resolve a URL path to a built file, or null. */
export function resolveUrl(root, pathname) {
  let p;
  try { p = decodeURIComponent(pathname); } catch { p = pathname; }
  const base = join(root, p);
  const candidates = p.endsWith('/') ? [join(base, 'index.html')] : [base, `${base}.html`, join(base, 'index.html')];
  for (const c of candidates) {
    try { if (statSync(c).isFile()) return c; } catch { /* next */ }
  }
  return null;
}

/** Ids a fragment can target in a built page: static ids/names + heading-links ids. */
export function fragmentTargets(html) {
  const { document } = parseHTML(html);
  const ids = new Set();
  for (const el of document.querySelectorAll('[id]')) ids.add(el.getAttribute('id'));
  // Runtime dedupe uses getElementById, which ignores a[name]: snapshot ids first.
  const domIds = new Set(ids);
  for (const el of document.querySelectorAll('a[name]')) ids.add(el.getAttribute('name'));
  // Hosts upgrade in document order; each generates ids in heading order,
  // deduping against every id already in the document (static + generated).
  for (const host of document.querySelectorAll('heading-links')) {
    for (const h of host.querySelectorAll(parseLevels(host.getAttribute('levels')).join(','))) {
      if (h.closest('heading-links') !== host || h.closest(HEADING_LINKS_SKIP)) continue;
      if (h.getAttribute('id')) continue;
      const id = uniqueSlug(headingSlug(h.textContent), (x) => domIds.has(x));
      h.setAttribute('id', id);
      domIds.add(id);
      ids.add(id);
    }
  }
  return ids;
}

function walkHtml(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'pagefind' || entry.name === 'node_modules') continue;
    const full = join(dir, entry.name);
    let isDir = entry.isDirectory();
    let isFile = entry.isFile();
    if (entry.isSymbolicLink()) {
      try { const s = statSync(full); isDir = s.isDirectory(); isFile = s.isFile(); } catch { continue; }
    }
    if (isDir) walkHtml(full, out);
    else if (isFile && entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

/**
 * @returns {{ broken: Array<{page, kind, href, why}>, external: Map<string, Set<string>>, pages: number }}
 */
export function checkSite(root) {
  const files = walkHtml(root);
  const targetCache = new Map();
  const targetsOf = (file) => {
    if (!targetCache.has(file)) targetCache.set(file, fragmentTargets(readFileSync(file, 'utf-8')));
    return targetCache.get(file);
  };
  const broken = [];
  const external = new Map();

  for (const file of files) {
    const pageUrl = fileToUrl(root, file);
    const demo = isDemoPage(pageUrl);
    const { document } = parseHTML(readFileSync(file, 'utf-8'));
    // Markup shown as code is not live
    for (const el of document.querySelectorAll('code-block, pre, template, textarea')) el.remove();

    const refs = [];
    if (!demo) for (const a of document.querySelectorAll('a[href]')) refs.push(['a', a.getAttribute('href')]);
    // browser-window[src] / include-file[src] embed demos and fragments: a
    // missing target is a blank "Failed to load" frame on the docs page.
    for (const el of document.querySelectorAll('img[src], script[src], source[src], iframe[src], video[src], audio[src], browser-window[src], include-file[src]')) {
      // data-link-check="ignore": a deliberately missing target (error-state demos).
      if (el.getAttribute('data-link-check') === 'ignore') continue;
      refs.push([el.localName, el.getAttribute('src')]);
    }
    for (const l of document.querySelectorAll('link[href]')) {
      if (/stylesheet|icon|manifest|preload|modulepreload/.test(l.getAttribute('rel') || '')) refs.push(['link', l.getAttribute('href')]);
    }

    for (const [kind, raw] of refs) {
      const href = (raw || '').trim();
      if (!href || /^(mailto:|tel:|javascript:|data:|blob:|about:)/i.test(href) || href.includes('${')) continue;
      let url;
      try { url = new URL(href, SITE_ORIGIN + pageUrl); } catch { broken.push({ page: pageUrl, kind, href, why: 'unparseable' }); continue; }
      if (url.origin !== SITE_ORIGIN) {
        if (/^https?:$/.test(url.protocol) && !demo) {
          const key = url.href.split('#')[0];
          if (!external.has(key)) external.set(key, new Set());
          external.get(key).add(pageUrl);
        }
        continue;
      }
      if (FUNCTION_PATHS.test(url.pathname)) continue;
      // Placeholder media in component static.html files are not shipped assets
      if (demo && kind !== 'link' && kind !== 'script' && pageUrl.startsWith('/src/')) continue;
      const target = url.pathname === pageUrl ? file : resolveUrl(root, url.pathname);
      if (!target) { broken.push({ page: pageUrl, kind, href, why: 'missing' }); continue; }
      if (kind === 'a' && url.hash && target.endsWith('.html')) {
        let frag;
        try { frag = decodeURIComponent(url.hash.slice(1)); } catch { frag = url.hash.slice(1); }
        if (frag && frag !== 'top' && !targetsOf(target).has(frag)) broken.push({ page: pageUrl, kind, href, why: 'no-anchor' });
      }
    }
  }
  return { broken, external, pages: files.length };
}

/** Source pages whose built copy has a different number of <code-block>s. */
export function codeBlockMismatches(srcRoot, distRoot) {
  const out = [];
  for (const src of walkHtml(srcRoot)) {
    const rel = relative(srcRoot, src);
    const built = rel.endsWith('index.html') ? join(distRoot, rel) : join(distRoot, rel.replace(/\.html$/, ''), 'index.html');
    if (!existsSync(built)) continue;
    const count = (s) => (s.match(/<code-block\b/g) || []).length;
    const a = count(readFileSync(src, 'utf-8'));
    const b = count(readFileSync(built, 'utf-8'));
    if (a !== b) out.push({ page: rel, source: a, built: b });
  }
  return out;
}

async function checkExternal(external) {
  const failures = [];
  const list = [...external].filter(([u]) => !/localhost|example\.(com|org)|\{/.test(u));
  let i = 0;
  const probe = async (u) => {
    for (const method of ['HEAD', 'GET']) {
      try {
        const r = await fetch(u, { method, redirect: 'follow', signal: AbortSignal.timeout(15000), headers: { 'user-agent': 'Mozilla/5.0 (vanilla-breeze link check)' } });
        if (r.status < 400) return null;
        // Bot walls and rate limits are not dead links
        if (method === 'GET') return [401, 403, 405, 429].includes(r.status) ? null : r.status;
      } catch (e) {
        if (method === 'GET') return `ERR ${e.cause?.code || e.name}`;
      }
    }
    return null;
  };
  await Promise.all(Array.from({ length: 8 }, async () => {
    while (i < list.length) {
      const [u, pages] = list[i++];
      const status = await probe(u);
      if (status) failures.push({ url: u, status, pages: [...pages].slice(0, 3) });
    }
  }));
  return failures;
}

async function main() {
  const argv = process.argv.slice(2);
  const arg = (name, fallback) => { const i = argv.indexOf(`--${name}`); return i >= 0 ? argv[i + 1] : fallback; };
  const repo = resolve(import.meta.dirname, '..');
  const root = resolve(repo, arg('root', 'site/dist/pages'));
  const srcRoot = resolve(repo, arg('src', 'site/src/pages'));
  if (!existsSync(root)) { console.error(`check-links: ${root} not found — run npm run build first`); process.exit(2); }

  const { broken, external, pages } = checkSite(root);
  // Cloudflare Pages answers unknown URLs with the home page and HTTP 200
  // unless the output root has a 404.html (vanilla-breeze-f0d6).
  if (!existsSync(join(root, '404.html'))) {
    broken.push({ page: '/', kind: 'file', href: '/404.html', why: 'missing' });
  }
  const mismatches = codeBlockMismatches(srcRoot, root);
  const externalFailures = argv.includes('--external') ? await checkExternal(external) : [];

  const json = arg('json');
  if (json) writeFileSync(json, JSON.stringify({ pages, broken, mismatches, externalFailures }, null, 2));

  console.log(`check-links: ${pages} pages, ${broken.length} broken refs, ${mismatches.length} code-block mismatches${argv.includes('--external') ? `, ${externalFailures.length} dead external URLs (of ${external.size})` : ''}`);
  for (const b of broken) console.log(`  ${b.why.padEnd(9)} ${b.href}  ← ${b.page}`);
  for (const m of mismatches) console.log(`  code-block ${m.page}: source ${m.source}, built ${m.built}`);
  for (const f of externalFailures) console.log(`  external  ${f.status} ${f.url}  ← ${f.pages.join(' ')}`);
  if (broken.length || mismatches.length || externalFailures.length) process.exit(1);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
