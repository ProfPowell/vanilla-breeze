import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseChangelog, versionAnchor, groupBadge } from '../../scripts/lib/changelog.js';

const ROOT = resolve(import.meta.dirname, '../..');

const SAMPLE = `# Changelog

## [Unreleased]

## [1.2.0] - 2026-10-31

Summary line.

### Changed (breaking)

- **Big thing.** detail

### Fixed

- a fix

## [1.0.0] - 2025
`;

test('parses releases, dates, anchors, summary and groups', () => {
  const [a, b, ...rest] = parseChangelog(SAMPLE);
  assert.equal(rest.length, 0, 'empty Unreleased is dropped');
  assert.equal(a.version, '1.2.0');
  assert.equal(a.date, '2026-10-31');
  assert.equal(a.anchor, 'v1-2-0');
  assert.equal(a.summary, 'Summary line.');
  assert.deepEqual(a.groups.map((g) => g.heading), ['Changed (breaking)', 'Fixed']);
  assert.equal(b.date, '2025-01-01');
});

test('Unreleased is included only when asked and non-empty', () => {
  const md = SAMPLE.replace('## [Unreleased]\n', '## [Unreleased]\n\n### Added\n\n- soon\n');
  assert.equal(parseChangelog(md)[0].version, '1.2.0');
  assert.equal(parseChangelog(md, { includeUnreleased: true })[0].anchor, 'unreleased');
  assert.equal(parseChangelog(SAMPLE, { includeUnreleased: true })[0].version, '1.2.0');
});

test('anchors and badges', () => {
  assert.equal(versionAnchor('v0.4.1'), 'v0-4-1');
  assert.equal(groupBadge('Changed (breaking)')?.label, 'breaking');
  assert.equal(groupBadge('Added')?.cls, 'new');
  assert.equal(groupBadge('Internal'), null);
});

test('CHANGELOG.md parses and the /changelog/ page is generated, not hand-written', () => {
  const releases = parseChangelog(readFileSync(resolve(ROOT, 'CHANGELOG.md'), 'utf-8'));
  assert.ok(releases.length > 0);
  const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf-8'));
  assert.equal(releases[0].version, pkg.version, 'top CHANGELOG entry matches package.json version');
  const page = readFileSync(resolve(ROOT, 'site/src/pages/changelog/index.html'), 'utf-8');
  assert.ok(page.includes('<!-- changelog:releases -->'), 'page keeps the generation marker');
  assert.ok(!/<(article|section) id="v\d/.test(page), 'no hand-authored release entries in the page source');
});

// ── Atom feed (vanilla-breeze-bknc) ─────────────────────────────────────
import { renderChangelogFeed } from '../../site/plugins/generate-changelog-feed.js';
import { DOMParser } from 'linkedom';

test('Atom feed: one entry per release, ids match page anchors, Unreleased excluded', () => {
  const md = SAMPLE.replace('## [Unreleased]\n', '## [Unreleased]\n\n### Added\n\n- not yet\n');
  const feed = renderChangelogFeed(md, 'https://example.com/');
  const doc = new DOMParser().parseFromString(feed, 'text/xml');
  const entries = [...doc.querySelectorAll('entry')];
  assert.equal(entries.length, 2);
  assert.equal(entries[0].querySelector('id').textContent, 'https://example.com/changelog/#v1-2-0');
  assert.equal(entries[0].querySelector('updated').textContent, '2026-10-31T00:00:00Z');
  assert.equal(doc.querySelector('feed > updated').textContent, '2026-10-31T00:00:00Z');
  assert.ok(!feed.includes('not yet'), 'Unreleased content leaked into the feed');
  // Entry HTML is escaped, not raw markup inside the XML
  assert.match(feed, /&lt;strong&gt;Big thing\.&lt;\/strong&gt;/);
});

test('Atom feed from the real CHANGELOG.md is well-formed', () => {
  const feed = renderChangelogFeed(readFileSync(resolve(ROOT, 'CHANGELOG.md'), 'utf-8'), 'https://vanilla-breeze.com');
  const doc = new DOMParser().parseFromString(feed, 'text/xml');
  assert.equal(doc.querySelector('feed > title').textContent, 'Vanilla Breeze changelog');
  assert.ok(doc.querySelectorAll('entry').length >= 6);
});
