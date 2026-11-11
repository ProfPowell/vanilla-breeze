/**
 * The generated sitemap page (site/plugins/generate-sitemap-page.js): pages
 * land in the section and group whose navigation href is the longest prefix
 * of their URL, large branches collapse, and titles are escaped once.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSitemap, renderSitemap } from '../../site/plugins/generate-sitemap-page.js';

const NAV = {
  header: {
    nav: [
      { label: 'Start', href: '/docs/quick-start/', section: 'start', children: [{ label: 'Quick Start', href: '/docs/quick-start/' }] },
      { label: 'Guide', href: '/docs/layouts/', section: 'guide', children: [{ label: 'Layouts', href: '/docs/layouts/' }] },
      { label: 'API', href: '/docs/elements/', section: 'api', children: [{ label: 'Elements', href: '/docs/elements/' }] },
      { label: 'Explore', href: '/glossary/', section: 'explore', children: [{ label: 'Glossary', href: '/glossary/' }] },
    ],
    releases: { label: 'Releases', href: '/changelog/' },
  },
  guideSidebar: [{ label: 'Layouts', items: [{ label: 'Layouts', href: '/docs/layouts/' }, { label: 'Grid', href: '/docs/grid/' }] }],
};

const page = (url, title) => ({ url, title });
const many = Array.from({ length: 14 }, (_, i) => page(`/docs/elements/native/el-${i}/`, `el-${i}`));

const PAGES = [
  page('/', 'Home'),
  page('/docs/quick-start/', 'Quick Start'),
  page('/docs/layouts/', 'Layouts'),
  page('/docs/grid/', 'Grid'),
  page('/docs/orphan/', 'Orphan <b>guide</b>'),
  page('/docs/elements/', 'Elements'),
  ...many,
  page('/glossary/', 'Glossary'),
  page('/changelog/', 'Releases'),
  page('/stats/', 'Stats'),
];

test('pages are grouped under the navigation entry with the longest matching href', () => {
  const sections = buildSitemap(PAGES, NAV);
  assert.deepEqual(sections.map((s) => s.label), ['Start', 'Guide', 'API', 'Explore', 'More']);
  const groups = (label) => sections.find((s) => s.label === label).groups.map((g) => g.label);
  assert.deepEqual(groups('Start'), ['Overview', 'Quick Start']);
  assert.deepEqual(groups('Guide'), ['Layouts', 'More guides']);
  assert.deepEqual(groups('Explore'), ['Glossary', 'Releases']);
  const elements = sections.find((s) => s.label === 'API').groups[0];
  assert.equal(elements.page.url, '/docs/elements/');
  assert.equal(elements.children.get('native').children.size, 14);
});

test('every page is linked, large branches collapse, titles are escaped', () => {
  const html = renderSitemap(buildSitemap(PAGES, NAV));
  // A section heading may repeat its first group's link; no page is left out
  for (const p of PAGES) assert.ok(html.includes(`<a href="${p.url}">`), p.url);
  assert.match(html, /All 23 pages/);
  assert.match(html, /<summary>Native <small>14<\/small><\/summary>\s*<ul data-sitemap-leaves>/);
  assert.match(html, /Orphan &lt;b&gt;guide&lt;\/b&gt;/);
  assert.doesNotMatch(html, /&amp;lt;/);
});
