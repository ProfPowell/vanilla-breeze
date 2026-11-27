#!/usr/bin/env node
/**
 * Generate the LLM-facing documentation from data the build already has:
 * the api.json registry, docs page frontmatter and the layout vocabulary.
 *
 * Output, in dist/cdn/llms/ (ships in the npm package, served at /cdn/llms/):
 *   llms.txt             index: conventions, then one line per component
 *   components/<tag>.md  attributes, structure, events, keyboard, an example
 *   patterns/<name>.md   page-level recipes (hero, navbar, footer, pricing…)
 *   themes.md            themes, accents and the tokens to style with
 *   attributes.md        attributes that work on any element
 *   native-elements.md   native elements with dedicated documentation
 *   llms-full.txt        all of the above in one file
 *
 * And in dist/llms/ (copied to the site root by assemble-site.js):
 *   llms.txt, llms-full.txt   the same text with absolute links
 *
 * Run after build:api (the registry) and build:cdn (which owns dist/cdn).
 *
 * Usage: node scripts/build-llms.js [--site-url https://vanilla-breeze.com]
 */

import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readLayoutNames } from './quality/layout-vocabulary.js';
import { parseFrontmatter, firstHtmlExample, componentMarkdown, patternMarkdown, pageReference, indexText } from './lib/llms.js';

const ROOT = resolve(import.meta.dirname, '..');
const DOCS = join(ROOT, 'site/src/pages/docs');
const OUT = join(ROOT, 'dist/cdn/llms');
const SITE_OUT = join(ROOT, 'dist/llms');

const urlFlag = process.argv.indexOf('--site-url');
const siteUrl = (urlFlag > -1 ? process.argv[urlFlag + 1] : 'https://vanilla-breeze.com').replace(/\/$/, '');

const { version } = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const registry = (await import(pathToFileURL(join(ROOT, 'site/src/_data/apiRegistry.js')).href)).default;
const preamble = readFileSync(join(ROOT, 'src/llms/preamble.md'), 'utf8');

/** @returns {import('./lib/llms.js').DocPage[]} */
function readDocPages() {
  const pages = [];
  for (const entry of readdirSync(DOCS, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.html')) continue;
    const file = join(entry.parentPath, entry.name);
    const source = readFileSync(file, 'utf8');
    const meta = parseFrontmatter(source);
    if (!meta.title) continue;
    const derived = `/docs/${relative(DOCS, file).replace(/(?:index)?\.html$/, '').replace(/\/?$/, '/')}`.replace('//', '/');
    pages.push({
      path: meta.currentPath || derived,
      title: meta.title,
      description: meta.description ?? '',
      elementName: meta.elementName,
      attributeName: meta.attributeName,
      category: meta.category,
      layout: meta.layout,
      nativeGroup: meta.nativeGroup,
      example: firstHtmlExample(source),
      source,
    });
  }
  return pages.sort((a, b) => a.path.localeCompare(b.path));
}

const pages = readDocPages();
const byElement = new Map(pages.filter((p) => p.elementName).map((p) => [p.elementName, p]));
const byPath = new Map(pages.map((p) => [p.path, p]));

/**
 * Registry entries that are not for page authors: the grid composer's own
 * elements (src/lib/composer, a design tool). They stay in the validator
 * metadata.
 */
const EXCLUDE = new Set(['vb-composer', 'vb-canvas', 'vb-inspector']);

/**
 * The docs page for an element: its own page, or for a child element that is
 * documented with its parent (foot-note, command-item) the first element page
 * with an example that uses it.
 * @param {string} tag
 * @returns {import('./lib/llms.js').DocPage | undefined}
 */
function pageFor(tag) {
  const own = byElement.get(tag);
  if (own?.example) return own;
  for (const page of pages) {
    if (!page.elementName || !page.source) continue;
    const example = firstHtmlExample(page.source, tag);
    if (example) return own ? { ...own, example } : { ...page, example };
  }
  return own;
}

/** @param {import('./lib/llms.js').DocPage[]} list @param {(p: any) => string} key */
function grouped(list, key) {
  /** @type {Map<string, import('./lib/llms.js').DocPage[]>} */
  const groups = new Map();
  for (const page of list) {
    const name = key(page) || 'Other';
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name)?.push(page);
  }
  return [...groups].sort(([a], [b]) => a.localeCompare(b))
    .map(([heading, groupPages]) => ({ heading: heading.replace(/^./, (c) => c.toUpperCase()), pages: groupPages }));
}

// ── Component files ─────────────────────────────────────────────────────────
/** Elements the docs use that come from their own packages, not this one. */
const EXTERNAL = new Set(['browser-window', 'code-block']);
const EXTERNAL_KIND = 'Web component from a separate package. Not in the Vanilla Breeze bundle; load its own script.';

const entries = Object.values(registry).filter((e) => !EXCLUDE.has(e.element)).sort((a, b) => a.element.localeCompare(b.element));
const pageOf = new Map(entries.map((e) => [e.element, pageFor(e.element)]));
/** @type {Map<string, string>} */
const componentFiles = new Map();
for (const entry of entries) {
  componentFiles.set(entry.element, componentMarkdown(entry, {
    page: pageOf.get(entry.element),
    siteUrl,
    version,
    kind: EXTERNAL.has(entry.element) ? EXTERNAL_KIND : undefined,
  }));
}

// ── Pattern files ───────────────────────────────────────────────────────────
// One file per docs pattern page (hero, navbar, footer, pricing, contact form…):
// the page-level recipes, with the HTML and the small CSS each one needs.
/** @type {{ file: string, page: import('./lib/llms.js').DocPage, markdown: string }[]} */
const patterns = [];
for (const page of pages) {
  if (page.layout !== 'pattern' || !page.source) continue;
  const markdown = patternMarkdown(page.source, { page, siteUrl, version });
  if (!markdown) continue;
  const file = `patterns/${page.path.replace(/^\/docs\/patterns\//, '').replace(/\/$/, '').replaceAll('/', '-')}.md`;
  patterns.push({ file, page, markdown });
}

// ── Themes ──────────────────────────────────────────────────────────────────
const themeRegistry = (await import(pathToFileURL(join(ROOT, 'site/data/themeRegistry.js')).href)).default;
const themesMd = (() => {
  const tier = (/** @type {string} */ name) => themeRegistry.filter((/** @type {any} */ t) => t.tier === name);
  const list = (/** @type {any[]} */ themes) => themes.map((t) => `- \`${t.id}\`: ${t.character}`).join('\n');
  const standalone = [...tier('showcase'), ...tier('community')];
  return [
    `# Vanilla Breeze ${version}: themes\n`,
    'A theme changes colour, type, shape and shadow for the whole page or for one element and its descendants. Pick one that suits the content; do not restyle components by hand to get a look a theme already provides.\n',
    '## Use a theme\n',
    '```html\n<html lang="en" data-theme="modern">\n```\n',
    `Colour scheme is separate: \`data-mode="light"\` or \`data-mode="dark"\` on \`<html>\` forces one; without it the page follows the visitor's system setting. Every theme has both.\n`,
    '## Core themes (in the main stylesheet)\n',
    `${list(tier('core'))}\n`,
    '## Accents (in the main stylesheet)\n',
    'An accent swaps the brand hues and keeps everything else. It is a separate attribute, so it combines with a theme: `<html data-theme="modern" data-accent="forest">`.\n',
    `${list(tier('accent'))}\n`,
    '## Standalone themes (one extra stylesheet each)\n',
    'Add the theme file after the main stylesheet, then set `data-theme`:\n',
    '```html\n<link rel="stylesheet" href="node_modules/vanilla-breeze/dist/cdn/vanilla-breeze.css">\n<link rel="stylesheet" href="node_modules/vanilla-breeze/dist/cdn/themes/nord.css">\n```\n',
    `${list(standalone)}\n`,
    '## Your own colours and spacing\n',
    'When a page needs a rule of its own, write it in a stylesheet with design tokens, never literal values: `var(--color-primary)`, `var(--color-surface)`, `var(--color-text-muted)`, `var(--size-m)` (sizes run `3xs` to `3xl`), `var(--radius-m)`, `var(--shadow-m)`. Tokens follow the theme and the colour scheme.\n',
    `Documentation: ${siteUrl}/docs/themes/ and ${siteUrl}/docs/tokens/`,
  ].join('\n') + '\n';
})();

// ── Reference files ─────────────────────────────────────────────────────────
const attributesMd = pageReference({
  title: `Vanilla Breeze ${version}: attributes`,
  intro: 'Attributes that work on any element (or on the native elements named in each page). Component-specific attributes are in each component file. Each link is the full documentation page.',
  groups: grouped(pages.filter((p) => p.attributeName), (p) => p.category),
  siteUrl,
  label: (p) => p.attributeName ?? p.title,
});

const nativeMd = pageReference({
  title: `Vanilla Breeze ${version}: native elements`,
  intro: 'Native HTML elements are styled with no classes. These pages document the variants and attributes Vanilla Breeze adds to each.',
  groups: grouped(pages.filter((p) => p.category === 'native' && p.elementName), (p) => /** @type {any} */ (p).nativeGroup),
  siteUrl,
  label: (p) => `<${p.elementName}>`,
});

// ── Index ───────────────────────────────────────────────────────────────────
const describe = (/** @type {any} */ entry) => entry.description || (byElement.get(entry.element) ?? {}).description || '';
const componentItem = (/** @type {any} */ entry) => ({
  name: `<${entry.element}>`,
  href: `components/${entry.element}.md`,
  description: describe(entry).split(/(?<=\.)\s/)[0],
});

const GUIDES = ['/docs/quick-start/', '/docs/principles/', '/docs/semantic-layouts/', '/docs/layouts/', '/docs/themes/', '/docs/tokens/', '/docs/accessibility/'];
const guideItems = GUIDES.map((path) => byPath.get(path)).filter((page) => page !== undefined)
  .map((page) => ({ name: page.title, href: `${siteUrl}${page.path}`, description: page.description }));

const isLayout = (/** @type {any} */ e) => e.element.startsWith('layout-');
const isExternal = (/** @type {any} */ e) => EXTERNAL.has(e.element);
const sections = [
  { heading: 'Page patterns (start here for a page section)', items: patterns.map(({ file, page }) => ({ name: page.title.replace(/ Patterns?$/, ''), href: file, description: page.description })) },
  { heading: 'Layouts', items: entries.filter(isLayout).map(componentItem) },
  { heading: 'Web components (need the script; children are the fallback)', items: entries.filter((e) => e.type === 'web-component').map(componentItem) },
  { heading: 'CSS-only elements', items: entries.filter((e) => e.type !== 'web-component' && !isLayout(e) && !isExternal(e)).map(componentItem) },
  { heading: 'Separate packages (not in the bundle)', items: entries.filter(isExternal).map(componentItem) },
  {
    heading: 'Reference',
    items: [
      { name: 'Themes', href: 'themes.md', description: 'Every theme and accent with a one-line character, how to load one, and the design tokens to use in your own rules' },
      { name: 'Attributes', href: 'attributes.md', description: 'Attributes that work on any element, grouped by purpose' },
      { name: 'Native elements', href: 'native-elements.md', description: 'Native elements with dedicated documentation' },
      { name: 'Everything in one file', href: 'llms-full.txt', description: 'This index, every component file and both reference files' },
    ],
  },
  { heading: 'Guides', items: guideItems },
];

const layouts = readLayoutNames(ROOT);
const index = (/** @type {string} */ base) => indexText({ preamble, version, layouts, base, sections });
const full = (/** @type {string} */ base) => [index(base), ...patterns.map((p) => p.markdown), ...componentFiles.values(), themesMd, attributesMd, nativeMd].join('\n---\n\n');

// ── Write ───────────────────────────────────────────────────────────────────
rmSync(OUT, { recursive: true, force: true });
rmSync(SITE_OUT, { recursive: true, force: true });
mkdirSync(join(OUT, 'components'), { recursive: true });
mkdirSync(join(OUT, 'patterns'), { recursive: true });
mkdirSync(SITE_OUT, { recursive: true });

for (const [tag, markdown] of componentFiles) writeFileSync(join(OUT, 'components', `${tag}.md`), markdown);
for (const { file, markdown } of patterns) writeFileSync(join(OUT, file), markdown);
writeFileSync(join(OUT, 'themes.md'), themesMd);
writeFileSync(join(OUT, 'attributes.md'), attributesMd);
writeFileSync(join(OUT, 'native-elements.md'), nativeMd);
writeFileSync(join(OUT, 'llms.txt'), index(''));
writeFileSync(join(OUT, 'llms-full.txt'), full(''));

const absolute = `${siteUrl}/cdn/llms/`;
writeFileSync(join(SITE_OUT, 'llms.txt'), index(absolute));
writeFileSync(join(SITE_OUT, 'llms-full.txt'), full(absolute));

const kb = (/** @type {string} */ text) => `${(Buffer.byteLength(text) / 1024).toFixed(1)} KB`;
const withoutDescription = entries.filter((e) => !describe(e)).map((e) => e.element);
const withoutExample = entries.filter((e) => !pageOf.get(e.element)?.example).map((e) => e.element);
console.log(`build:llms ${version}: ${componentFiles.size} component files, ${patterns.length} pattern files, llms.txt ${kb(index(''))}, llms-full.txt ${kb(full(''))}`);
if (withoutDescription.length) console.log(`  no description for ${withoutDescription.length}: ${withoutDescription.join(', ')}`);
if (withoutExample.length) console.log(`  no example found for ${withoutExample.length}: ${withoutExample.join(', ')}`);
