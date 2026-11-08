/**
 * Native attribute index drift gate.
 *
 * The native groups on /docs/attributes/, /docs/attributes/native/ and in the
 * "Native Attributes" sidebar are generated from each page's frontmatter
 * (attributeType: native + nativeGroup) by site/data/nativeAttributes.js.
 * This test fails when:
 *
 *   - a native page has no nativeGroup, or one outside the fixed group list,
 *   - a native page has no one-line index copy (INDEX_COPY), or copy exists
 *     for a page that doesn't,
 *   - a native page is missing from the generated index or listed twice,
 *   - an alias row points at a page or #anchor that doesn't exist,
 *   - navigation.json grows hand-written native groups again (the sidebar is
 *     derived from the index; two sources would drift).
 *
 * Run: node --test tests/unit/native-attribute-index.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  NATIVE_GROUPS,
  INDEX_COPY,
  ALIASES,
  readNativePages,
  readFrontmatter,
  buildNativeCategories,
} from '../../site/data/nativeAttributes.js';
import attributeIndex from '../../site/data/attributeIndex.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const pages = readNativePages(ROOT);
const labels = NATIVE_GROUPS.map(([, label]) => label);

/** Source file for a /docs/attributes/<slug>/ href, or null. */
function pageFile(href) {
  const m = href.match(/^\/docs\/attributes\/([a-z0-9-]+)\/(?:#([\w-]+))?$/);
  if (!m) return null;
  const file = resolve(ROOT, 'site/src/pages/docs/attributes', `${m[1]}.html`);
  return existsSync(file) ? { file, anchor: m[2] } : null;
}

describe('native attribute index', () => {
  it('keeps the agreed group order', () => {
    assert.deepEqual(labels, [
      'Global', 'Internationalization', 'Accessibility', 'Forms', 'Interactivity',
      'Links & Security', 'Embeds', 'Media', 'Performance', 'Structure',
    ]);
    assert.deepEqual(
      Object.values(attributeIndex.nativeCategories).map((c) => c.label),
      labels,
    );
  });

  it('finds the native pages, including the 2026-11 additions', () => {
    const slugs = new Set(pages.map((p) => p.slug));
    for (const slug of [
      'minlength-maxlength', 'min-max-step', 'accept', 'formaction',
      'aria-states', 'commandfor', 'interestfor', 'inert',
    ]) {
      assert.ok(slugs.has(slug), `missing native page ${slug}.html`);
    }
    assert.ok(pages.length >= 60, `only ${pages.length} native pages found`);
  });

  it('every native page declares a known nativeGroup', () => {
    const bad = pages.filter((p) => !labels.includes(p.group));
    assert.deepEqual(
      bad.map((p) => `${p.file}: nativeGroup "${p.group}"`),
      [],
      `nativeGroup must be one of: ${labels.join(', ')}`,
    );
  });

  it('every native page has index copy, and every copy entry has a page', () => {
    const slugs = new Set(pages.map((p) => p.slug));
    const missing = pages.filter((p) => !INDEX_COPY[p.slug]).map((p) => p.slug);
    const orphans = Object.keys(INDEX_COPY).filter((slug) => !slugs.has(slug));
    assert.deepEqual(missing, [], 'add a one-line description to INDEX_COPY in site/data/nativeAttributes.js');
    assert.deepEqual(orphans, [], 'INDEX_COPY has entries for pages that are not native attribute pages');
    for (const [slug, text] of Object.entries(INDEX_COPY)) {
      assert.ok(text.length <= 100, `${slug}: index copy is ${text.length} chars (max 100)`);
    }
  });

  it('every native page has a frontmatter description and attributeName', () => {
    const dir = resolve(ROOT, 'site/src/pages/docs/attributes');
    for (const p of pages) {
      const fm = readFrontmatter(readFileSync(resolve(dir, `${p.slug}.html`), 'utf8'));
      assert.ok(fm.description, `${p.file}: missing description`);
      assert.ok(fm.attributeName, `${p.file}: missing attributeName`);
      assert.equal(fm.currentPath, p.href, `${p.file}: currentPath should be ${p.href}`);
    }
  });

  it('lists every native page exactly once, in its own group', () => {
    const seen = new Map();
    for (const cat of Object.values(buildNativeCategories(pages))) {
      for (const item of cat.items) {
        if (item.alias) continue;
        assert.ok(!seen.has(item.href), `${item.href} listed twice`);
        seen.set(item.href, cat.label);
      }
    }
    for (const p of pages) {
      assert.equal(seen.get(p.href), p.group, `${p.href} should be listed under ${p.group}`);
    }
    assert.equal(seen.size, pages.length);
  });

  it('alias rows point at existing pages and anchors, in known groups', () => {
    for (const alias of ALIASES) {
      assert.ok(labels.includes(alias.group), `${alias.name}: unknown group ${alias.group}`);
      const target = pageFile(alias.href);
      assert.ok(target, `${alias.name}: ${alias.href} has no page`);
      if (target.anchor) {
        const html = readFileSync(target.file, 'utf8');
        assert.ok(html.includes(`id="${target.anchor}"`), `${alias.name}: #${target.anchor} not found in ${alias.href}`);
      }
      assert.ok(!pages.some((p) => p.name === alias.name), `${alias.name} has its own page; drop the alias`);
    }
  });

  it('the sidebar has no hand-written native groups', () => {
    const nav = JSON.parse(readFileSync(resolve(ROOT, 'site/data/navigation.json'), 'utf8'));
    assert.equal(nav.attributes.native.groups, undefined,
      'navigation.json attributes.native.groups must stay absent: generate-sidebars.js builds them from the attribute index');
  });
});
