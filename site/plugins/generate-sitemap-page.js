/**
 * @file generate-sitemap-page.js
 * @description Before-pass Cook plugin. Writes the human sitemap
 * (site/src/pages/sitemap/index.html) from the pages that actually exist, so
 * it cannot drift from the site the way a hand-kept list does.
 *
 * Shape of the page:
 *
 *   - one block per header section (Start, Guide, API, Resources, Explore),
 *     taken from site/data/navigation.json, plus "More" for anything the
 *     navigation does not reach;
 *   - inside a section, one group per menu entry (and, for Guide, per sidebar
 *     group); a page belongs to the entry whose href is the longest prefix of
 *     its URL;
 *   - below a group the URL path is the hierarchy; a branch with more than
 *     BIG direct children is a closed <details> with its page count, so the
 *     few hundred element and attribute pages do not bury the rest.
 *
 * A page changed within RECENT_DAYS of the newest change shows its date, a
 * collapsed branch says how many of its pages changed, and each section
 * names its last change. The dates are git's, via site/data/page-dates.json
 * (scripts/generate-page-dates.mjs), the same file sitemap.xml reads.
 *
 * Runs after generate-topics so the generated topic pages are listed too.
 * /sitemap.xml (scripts/generate-sitemap.js) is the crawler's version; the
 * two share their exclusions.
 */

import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = resolve(__dirname, '..');
const PAGES_SRC = resolve(SITE_ROOT, 'src/pages');
const OUT_SRC = resolve(SITE_ROOT, 'src/pages/sitemap/index.html');
const OUT_DIST = resolve(SITE_ROOT, 'dist/pages/sitemap/index.html');
const NAV_PATH = resolve(SITE_ROOT, 'data/navigation.json');
const DATES_PATH = resolve(SITE_ROOT, 'data/page-dates.json');

/** Days back from the newest change that still count as recent. */
const RECENT_DAYS = 7;

/** A branch with more direct children than this collapses. */
const BIG = 12;

/* Not standalone destinations — kept in step with scripts/generate-sitemap.js. */
const EXCLUDE = [
  /(^|\/)404(\/|$)/,
  /^\/docs\/snippets\/[^/]+\//,
  /^\/docs\/examples\/demos\//,
  /^\/docs\/patterns\/demos\//,
  /^\/docs\/tools\/.+\//,
];

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---/;

export function escHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* Titles are frontmatter strings that may already carry entities
   (&mdash;); decode before escaping so they are not escaped twice. */
function decodeEntities(text) {
  return String(text)
    .replace(/&mdash;/g, '\u2014')
    .replace(/&ndash;/g, '\u2013')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&amp;/g, '&');
}

/**
 * Frontmatter title and redirect only. A double-quoted YAML value may
 * escape quotes and backslashes (title: "data-effect=\"animate-image\"").
 */
export function readMeta(text) {
  const match = text.match(FRONTMATTER_RE);
  if (!match) return null;
  const meta = {};
  for (const line of match[1].split(/\r?\n/)) {
    const m = line.match(/^(title|redirect)\s*:\s*(.*)$/);
    if (!m) continue;
    const raw = m[2].trim();
    const quoted = raw.match(/^(["'])(.*)\1$/);
    meta[m[1]] = !quoted ? raw
      : quoted[1] === '"' ? quoted[2].replace(/\\(["\\])/g, '$1')
      : quoted[2].replace(/''/g, "'");
  }
  return meta;
}

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else if (entry.isFile() && entry.name.endsWith('.html')) yield path;
  }
}

function urlOf(file) {
  const rel = relative(PAGES_SRC, file).replace(/\\/g, '/');
  if (rel === 'index.html') return '/';
  return '/' + rel.replace(/\/index\.html$/, '/').replace(/\.html$/, '/');
}

/** "web-components" → "Web components" */
function labelFromSegment(segment) {
  const text = segment.replace(/-/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true });

/**
 * Sections and their groups, from the navigation data.
 * @returns {{ sections: any[], anchors: { href: string, group: any }[] }}
 */
export function sectionsFromNavigation(nav) {
  const sections = [];
  const anchors = [];
  const group = (section, label, href) => {
    const g = { label, href, page: null, children: new Map() };
    section.groups.push(g);
    return g;
  };

  for (const item of nav.header?.nav ?? []) {
    const section = { label: item.label, href: item.href, groups: [] };
    sections.push(section);
    if (item.section === 'guide' && Array.isArray(nav.guideSidebar)) {
      // Guide's menu entries are the first page of each sidebar group; the
      // sidebar is the fuller list, so it supplies the groups.
      for (const side of nav.guideSidebar) {
        const g = group(section, side.label, null);
        for (const page of side.items ?? []) anchors.push({ href: page.href, group: g });
      }
      continue;
    }
    for (const child of item.children ?? []) {
      anchors.push({ href: child.href, group: group(section, child.label, child.href) });
    }
  }

  const explore = sections.find((s) => s.label === 'Explore');
  if (explore && nav.header?.releases) {
    const { label, href } = nav.header.releases;
    anchors.push({ href, group: group(explore, label, href) });
  }
  return { sections, anchors };
}

/**
 * Place every page in a section group and build the tree under it.
 * @param {{ url: string, title: string }[]} pages
 */
export function buildSitemap(pages, nav, dates = {}) {
  pages = pages.map((page) => ({ ...page, updated: dates[page.url] ?? '' }));
  const { sections, anchors } = sectionsFromNavigation(nav);
  const start = sections[0];
  const guide = sections.find((s) => s.label === 'Guide');
  const more = { label: 'More', href: null, groups: [] };
  const loose = new Map();

  /** A catch-all group, created on first use. */
  const looseGroup = (section, label, first = false) => {
    const key = `${section.label}/${label}`;
    if (!loose.has(key)) {
      const g = { label, href: null, page: null, children: new Map() };
      if (first) section.groups.unshift(g); else section.groups.push(g);
      loose.set(key, g);
    }
    return loose.get(key);
  };

  for (const page of pages) {
    let best = null;
    for (const anchor of anchors) {
      if (anchor.href === '/' || !page.url.startsWith(anchor.href)) continue;
      if (!best || anchor.href.length > best.href.length) best = anchor;
    }

    let groupNode;
    let rest;
    if (best) {
      groupNode = best.group;
      // A group with its own href holds that page; a sidebar group is only
      // a label, so its anchor pages are children.
      rest = groupNode.href ? page.url.slice(best.href.length) : page.url.split('/').filter(Boolean).pop() ?? '';
    } else if (page.url === '/' || page.url === '/docs/') {
      groupNode = looseGroup(start, 'Overview', true);
      rest = page.url === '/' ? 'home/' : 'docs/';
    } else if (page.url.startsWith('/docs/') && guide) {
      groupNode = looseGroup(guide, 'More guides');
      rest = page.url.slice('/docs/'.length);
    } else {
      groupNode = looseGroup(more, 'Other pages');
      rest = page.url.slice(1);
    }

    const segments = rest.split('/').filter(Boolean);
    if (!segments.length) { groupNode.page = page; continue; }
    let node = groupNode;
    for (const segment of segments) {
      if (!node.children.has(segment)) {
        node.children.set(segment, { label: labelFromSegment(segment), page: null, children: new Map() });
      }
      node = node.children.get(segment);
    }
    node.page = page;
  }

  if (more.groups.length) sections.push(more);
  for (const section of sections) {
    section.groups = section.groups.filter((g) => g.page || g.children.size);
    for (const g of section.groups) splitByPrefix(g);
  }
  return sections.filter((s) => s.groups.length);
}

/**
 * A long flat run of leaves in which many share a "data-" prefix (the
 * attribute reference) reads better as two branches.
 */
function splitByPrefix(node) {
  for (const child of node.children.values()) splitByPrefix(child);
  const entries = [...node.children.entries()];
  const leaves = entries.filter(([, n]) => !n.children.size);
  const data = leaves.filter(([key]) => key.startsWith('data-'));
  if (leaves.length <= BIG * 3 || data.length < BIG || data.length === leaves.length) return;
  const branch = (label, items) => ({ label, page: null, children: new Map(items) });
  const dataKeys = new Set(data.map(([key]) => key));
  node.children = new Map([
    ...entries.filter(([, n]) => n.children.size),
    ['~data', branch('data-* attributes', data)],
    ['~other', branch(`Other ${node.label.toLowerCase()}`, leaves.filter(([key]) => !dataKeys.has(key)))],
  ]);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-11-09" → "Nov 9" (with the year when asked) */
function fmtDate(iso, year = false) {
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return '';
  return `${MONTHS[Number(m[2]) - 1]} ${Number(m[3])}${year ? `, ${m[1]}` : ''}`;
}

/**
 * The first day that counts as recent. It is measured back from the newest
 * change in the data, not from the build day, so the same data always gives
 * the same page.
 */
export function recentSince(dates) {
  const newest = Object.values(dates).sort().at(-1);
  if (!newest) return '9999';
  const day = new Date(`${newest}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() - (RECENT_DAYS - 1));
  return day.toISOString().slice(0, 10);
}

/** Pages under a node, for counts and dates. */
function pagesOf(node, out = []) {
  if (node.page) out.push(node.page);
  for (const child of node.children.values()) pagesOf(child, out);
  return out;
}

function countPages(node) {
  let n = node.page ? 1 : 0;
  for (const child of node.children.values()) n += countPages(child);
  return n;
}

const labelOf = (node) => node.page?.title || node.label;

function sortedChildren(node) {
  return [...node.children.values()].sort((a, b) => collator.compare(labelOf(a), labelOf(b)));
}

function renderNode(node, indent, since, groupLabel) {
  const pad = '  '.repeat(indent);
  const label = escHtml(groupLabel ?? labelOf(node));
  const href = node.page?.url ?? node.href;
  const link = href ? `<a href="${escHtml(href)}">${label}</a>` : `<span data-sitemap-label>${label}</span>`;
  // A recently changed page carries its date; older ones stay bare
  const date = node.page?.updated;
  const stamp = date && date >= since
    ? ` <small data-sitemap-updated><time datetime="${escHtml(date)}">${fmtDate(date)}</time></small>`
    : '';
  const children = sortedChildren(node);
  if (!children.length) return `${pad}<li>${link}${stamp}</li>`;

  const items = children.map((child) => renderNode(child, indent + 2, since)).join('\n');
  if (children.length > BIG) {
    // The branch's own page leads the list: a summary cannot also be a link.
    const own = href ? `${pad}      <li>${link.replace(label, `${label} overview`)}${stamp}</li>\n` : '';
    const recent = pagesOf(node).filter((p) => p.updated && p.updated >= since).length;
    const churn = recent ? ` <small data-sitemap-updated>${recent} updated</small>` : '';
    return `${pad}<li>
${pad}  <details>
${pad}    <summary>${label} <small>${countPages(node)}</small>${churn}</summary>
${pad}    <ul data-sitemap-leaves>
${own}${items.replace(/^/gm, '  ')}
${pad}    </ul>
${pad}  </details>
${pad}</li>`;
  }
  return `${pad}<li>
${pad}  ${link}${stamp}
${pad}  <ul>
${items}
${pad}  </ul>
${pad}</li>`;
}

export function renderSitemap(sections, dates = {}) {
  const since = recentSince(dates);
  const newest = Object.values(dates).sort().at(-1);
  const total = sections.reduce((sum, s) => sum + s.groups.reduce((n, g) => n + countPages(g), 0), 0);
  const blocks = sections.map((section) => {
    const count = section.groups.reduce((n, g) => n + countPages(g), 0);
    const title = escHtml(section.label);
    const heading = section.href ? `<a href="${escHtml(section.href)}">${title}</a>` : title;
    const groups = section.groups.map((g) => renderNode(g, 6, since, g.label)).join('\n');
    const latest = section.groups.flatMap((g) => pagesOf(g)).map((p) => p.updated).filter(Boolean).sort().at(-1);
    const changed = latest
      ? ` <small data-sitemap-updated>last change <time datetime="${escHtml(latest)}">${fmtDate(latest, true)}</time></small>`
      : '';
    return `        <li data-sitemap-section>
          <h2>${heading} <small>${count} ${count === 1 ? 'page' : 'pages'}</small>${changed}</h2>
          <ul>
${groups}
          </ul>
        </li>`;
  }).join('\n');

  return `---
layout: docs
title: "Sitemap"
description: "Every page of the Vanilla Breeze documentation, grouped by section. The machine-readable version for search engines is /sitemap.xml."
currentSection: explore
currentPath: /sitemap/
author: "Thomas A. Powell"
authorUrl: "/team/tpowell/"
published: "2026-04-24"
lastModified: "${newest || '2026-11-10'}"
keywords: ["sitemap", "navigation", "structure"]
license: "CC BY 4.0"
licenseUrl: "https://creativecommons.org/licenses/by/4.0/"
provenance: "human"
review: "editor-reviewed"
status: "published"
concepts: ["sitemap", "content-lens"]
---

<!-- Generated by site/plugins/generate-sitemap-page.js. Do not edit by hand. -->
<section data-layout="center" data-layout-max="wide" data-layout-gap="l">
  <site-map>
    <h1>Sitemap</h1>
    <p class="lead">All ${total} pages of the documentation, grouped by section. ${newest ? `Pages changed in the week to ${fmtDate(newest, true)} show their date. ` : ''}Search engines read <a href="/sitemap.xml">sitemap.xml</a>.</p>

    <nav aria-label="Full site map" data-sitemap>
      <ul>
${blocks}
      </ul>
    </nav>
  </site-map>
</section>
`;
}

export class GenerateSitemapPage {
  async init() {
    if (!existsSync(NAV_PATH)) return;
    const nav = JSON.parse(await readFile(NAV_PATH, 'utf-8'));

    const pages = [];
    for await (const file of walk(PAGES_SRC)) {
      const url = urlOf(file);
      if (EXCLUDE.some((rx) => rx.test(url))) continue;
      const meta = readMeta(await readFile(file, 'utf-8'));
      // No frontmatter is a redirect stub or a bare document, not a page
      if (!meta || meta.redirect) continue;
      pages.push({ url, title: url === '/' ? 'Home' : decodeEntities(meta.title || '') });
    }
    pages.sort((a, b) => a.url.localeCompare(b.url));

    const dates = existsSync(DATES_PATH) ? JSON.parse(await readFile(DATES_PATH, 'utf-8')).pages ?? {} : {};
    const html = renderSitemap(buildSitemap(pages, nav, dates), dates);
    /* Cook copies src/ to dist/ before the before-pass runs and then builds
       from dist/ (see generate-topics.js), so write both trees. */
    for (const out of [OUT_SRC, OUT_DIST]) {
      if (out === OUT_DIST && !existsSync(resolve(SITE_ROOT, 'dist/pages'))) continue;
      await mkdir(dirname(out), { recursive: true });
      await writeFile(out, html, 'utf-8');
    }
    console.log(`  ✓ Generated sitemap page (${pages.length} pages)`);
  }
}
