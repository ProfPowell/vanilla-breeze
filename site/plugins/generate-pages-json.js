/**
 * @file generate-pages-json.js
 * @description After every doc page is built, walk dist/pages and emit
 * a single dist/pages/pages.json index that VB lens components fetch
 * at runtime. One entry per page that carries provenance frontmatter.
 *
 * Schema (one record per page):
 *   {
 *     url: "/docs/concepts/document-provenance/",
 *     title: "Document Provenance",
 *     description: "…",
 *     author: "Thomas A. Powell",
 *     authorUrl: "/team/tpowell/",
 *     published: "2026-04-24",
 *     modified: "2026-04-24",
 *     version: "0.1.0",
 *     keywords: ["provenance", "trust", "metadata"],
 *     concepts: ["provenance", "data-provenance", "page-info"],
 *     provenance: "ai-assisted",
 *     review: "editor-reviewed",
 *     status: "published",
 *     license: "CC BY 4.0",
 *     signed: true
 *   }
 *
 * v1.1 (2026-04-27): `topic` (single dotted-path string) replaced by
 * `concepts` (array of SKOS concept @ids harvested from repeated
 * <meta name="concept"> tags). See admin/specs/meta-tag-contract-v1.md.
 *
 * Runs as an `after` Cook plugin so it sees every page in its final form.
 * Pages without any provenance metadata are skipped.
 */

import { readdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';

const META_RE = /<meta\s+([^>]+?)\/?>/gi;
const ATTR_RE = /(\w[\w:-]*)\s*=\s*"([^"]*)"/g;

function parseMetaTags(html) {
  const tags = { name: {}, property: {}, itemprop: {}, concepts: [] };
  for (const match of html.matchAll(META_RE)) {
    const attrs = {};
    for (const a of match[1].matchAll(ATTR_RE)) {
      attrs[a[1].toLowerCase()] = a[2];
    }
    if (attrs.name && attrs.content) {
      if (attrs.name === 'concept') tags.concepts.push(attrs.content);
      else tags.name[attrs.name] = attrs.content;
    }
    if (attrs.property && attrs.content) tags.property[attrs.property] = attrs.content;
    if (attrs.itemprop && attrs.content) tags.itemprop[attrs.itemprop] = attrs.content;
  }
  return tags;
}

function linkHref(html, rel) {
  const re = new RegExp(`<link\\s+[^>]*\\brel="${rel}"[^>]*\\bhref="([^"]+)"`, 'i');
  const m = html.match(re) || html.match(new RegExp(`<link\\s+[^>]*\\bhref="([^"]+)"[^>]*\\brel="${rel}"`, 'i'));
  return m ? m[1] : '';
}

function extractTitle(html, ogTitle) {
  if (ogTitle) return ogTitle.split('|')[0].trim();
  const m = html.match(/<title>([^<]*)<\/title>/i);
  return m ? m[1].split('|')[0].trim() : '';
}

function urlFromPath(file, distDir) {
  const rel = relative(distDir, file);
  if (rel === 'index.html') return '/';
  return '/' + rel.replace(/\/index\.html$/, '/').replace(/\.html$/, '/');
}

function asKeywords(value) {
  if (!value) return [];
  return value.split(',').map((s) => s.trim()).filter(Boolean);
}

async function* walkHtml(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'pagefind' || entry.name === '.well-known') continue;
      yield* walkHtml(path);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      yield path;
    }
  }
}

export class GeneratePagesJson {
  constructor({ data }) {
    this.data = data;
  }

  async init() {
    const cwd = process.cwd();
    const distDir = resolve(cwd, 'dist/pages');
    if (!existsSync(distDir)) return;

    const pages = [];

    for await (const file of walkHtml(distDir)) {
      let html;
      try {
        html = await readFile(file, 'utf-8');
      } catch {
        continue;
      }

      const meta = parseMetaTags(html);
      const m = meta.name;
      const p = meta.property;
      const ip = meta.itemprop;

      /* Skip pages without ANY provenance signal — keeps pages.json
         scoped to "pages the author has explicitly described". */
      const hasSignal = m['vb:provenance'] || m['vb:review'] || m['vb:status']
        || meta.concepts.length > 0 || m['author'] || ip['version'];
      if (!hasSignal) continue;

      const url = urlFromPath(file, distDir);
      const title = extractTitle(html, p['og:title']);
      const description = m['description'] || p['og:description'] || '';

      pages.push({
        url,
        title,
        description,
        author: m['author'] || '',
        authorUrl: p['article:author'] || linkHref(html, 'author') || '',
        published: (p['article:published_time'] || '').slice(0, 10),
        modified: (m['last-modified'] || p['article:modified_time'] || '').slice(0, 10),
        version: ip['version'] || '',
        keywords: asKeywords(m['keywords']),
        concepts: meta.concepts,
        provenance: m['vb:provenance'] || '',
        review: m['vb:review'] || '',
        status: m['vb:status'] || '',
        aiTools: m['vb:ai-tools'] || '',
        license: linkHref(html, 'license') || m['license'] || '',
        signed: !!m['vb:signature']
      });
    }

    pages.sort((a, b) => a.url.localeCompare(b.url));
    const out = {
      '@version': 1,
      generated: new Date().toISOString(),
      count: pages.length,
      pages
    };

    const outPath = resolve(distDir, 'pages.json');
    await writeFile(outPath, JSON.stringify(out, null, 2) + '\n', 'utf-8');
    console.log(`  ✓ Generated pages.json (${pages.length} entries)`);

    /* Expose vocabulary.json at /vocabulary.json so SKOS-aware lens
       components (e.g. <topic-map>) can fetch it alongside pages.json.
       Cook copies _data/ into dist/_data/ verbatim, but lens components
       are a runtime contract that lives at the site root. */
    const vocabSrc = resolve(cwd, 'src/_data/vocabulary.json');
    if (existsSync(vocabSrc)) {
      const vocabDest = resolve(distDir, 'vocabulary.json');
      await copyFile(vocabSrc, vocabDest);
      console.log('  ✓ Copied vocabulary.json to dist root');
    }
  }
}
