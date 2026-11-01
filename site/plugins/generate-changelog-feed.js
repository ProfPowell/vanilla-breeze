/**
 * @file generate-changelog-feed.js
 * @description After-pass Cook plugin: writes dist/pages/changelog/feed.xml,
 * an Atom feed of releases built from CHANGELOG.md (vanilla-breeze-bknc).
 *
 * Same parser (scripts/lib/changelog.js) and markdown renderer as the
 * /changelog/ page (render-dynamic-pages.js), so feed and page always agree.
 * Unreleased is left out: a feed entry should be something you can install.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { marked } from '../../src/vendor/marked/marked.esm.js';
import { parseChangelog } from '../../scripts/lib/changelog.js';
import site from '../data/site.js';

const CHANGELOG_PATH = resolve(import.meta.dirname, '../../CHANGELOG.md');

const xml = (s) => String(s)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

/** ISO date (YYYY-MM-DD) → RFC 3339 timestamp at midnight UTC. */
const stamp = (date) => (/^\d{4}-\d{2}-\d{2}$/.test(date) ? `${date}T00:00:00Z` : new Date(0).toISOString());

/**
 * Render the Atom document. Exported for tests.
 * @param {string} markdown - CHANGELOG.md contents
 * @param {string} baseUrl - Site origin, e.g. https://vanilla-breeze.com
 */
export function renderChangelogFeed(markdown, baseUrl) {
  const origin = baseUrl.replace(/\/$/, '');
  const pageUrl = `${origin}/changelog/`;
  const releases = parseChangelog(markdown);
  const updated = releases[0] ? stamp(releases[0].date) : new Date(0).toISOString();

  const entries = releases.map((r) => {
    const body = [r.summary, ...r.groups.map((g) => `### ${g.heading}\n\n${g.markdown}`)].filter(Boolean).join('\n\n');
    return `  <entry>
    <title>v${xml(r.version)}</title>
    <id>${xml(`${pageUrl}#${r.anchor}`)}</id>
    <link rel="alternate" type="text/html" href="${xml(`${pageUrl}#${r.anchor}`)}"/>
    <updated>${stamp(r.date)}</updated>
    <published>${stamp(r.date)}</published>
    <content type="html">${xml(marked.parse(body))}</content>
  </entry>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Vanilla Breeze changelog</title>
  <subtitle>Releases of the Vanilla Breeze HTML component system</subtitle>
  <id>${xml(pageUrl)}</id>
  <link rel="self" type="application/atom+xml" href="${xml(`${pageUrl}feed.xml`)}"/>
  <link rel="alternate" type="text/html" href="${xml(pageUrl)}"/>
  <updated>${updated}</updated>
  <author><name>Thomas A. Powell</name></author>
${entries}
</feed>
`;
}

export class GenerateChangelogFeed {
  async init() {
    const distDir = resolve(process.cwd(), 'dist/pages');
    if (!existsSync(distDir)) return;
    const outDir = resolve(distDir, 'changelog');
    mkdirSync(outDir, { recursive: true });
    const feed = renderChangelogFeed(readFileSync(CHANGELOG_PATH, 'utf-8'), site.url || 'https://vanilla-breeze.com');
    writeFileSync(resolve(outDir, 'feed.xml'), feed);
    console.log('  ✓ Generated changelog/feed.xml');
  }
}
