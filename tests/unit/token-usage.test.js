/**
 * No dead core tokens (vanilla-breeze-p0wn).
 *
 * Every custom property defined under src/tokens/ (themes excluded) must be
 * read via var(--x) somewhere in the framework, the demos, the docs, a theme
 * or a pack. 72 tokens that nothing read — Open Props numeric aliases, unused
 * easings, color harmonics, surface gradients — were pruned; this gate stops
 * the set regrowing.
 *
 * The allowlists below name the tokens kept although nothing reads them, by
 * category, each with its reason.
 *
 * Run: node --test tests/unit/token-usage.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

/**
 * Tokens nothing reads today that stay on purpose. Three kinds:
 *  - PUBLIC_CONTENT_TOKENS: author-facing typographic characters documented on
 *    the characters page; content uses them, the framework never will.
 *  - PUBLIC_SCALE_TOKENS: documented members of a scale (duration, line-height,
 *    easing, shadow, overlay). A scale with holes is worse than an unread step.
 *  - THEME_STATE_TOKENS: the seed-and-derive state colours themes override
 *    (--color-accent-hover is set 92 times) but no component reads — components
 *    derive states locally. Wire-or-prune decision: vanilla-breeze-o4tj.
 * Shrink these lists, never grow them without a reason here.
 */
const PUBLIC_CONTENT_TOKENS = [
  '--sep-mdash', '--sep-para', '--marker-default', '--char-times', '--char-minus',
  '--char-degree', '--key-option', '--key-shift', '--key-ctrl', '--key-return',
];
const PUBLIC_SCALE_TOKENS = [
  '--color-black', // the palette anchor; taught in the tokens starter
  '--duration-slower', '--line-height-snug', '--line-height-loose',
  '--ease-elastic-1', '--ease-elastic-2', '--shadow-inner', '--shadow-none',
  '--color-overlay-subtle',
];
const THEME_STATE_TOKENS = [
  '--color-primary-active', '--color-secondary-hover', '--color-secondary-subtle',
  '--color-accent-hover', '--color-border-focus',
];
const UNREAD_BUT_KEPT = new Set([...PUBLIC_CONTENT_TOKENS, ...PUBLIC_SCALE_TOKENS, ...THEME_STATE_TOKENS]);


const walk = (dir, exts) =>
  readdirSync(resolve(root, dir), { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name), exts) : exts.test(e.name) ? [join(dir, e.name)] : [],
  );
const readAll = (dir, exts) => walk(dir, exts).map((f) => readFileSync(resolve(root, f), 'utf8')).join('\n');

describe('every core token is read somewhere', () => {
  const tokenFiles = walk('src/tokens', /\.css$/).filter((f) => !f.includes('/themes/'));
  const defined = new Map();
  for (const f of tokenFiles) {
    for (const m of readFileSync(resolve(root, f), 'utf8').matchAll(/^\s*(--[a-z0-9-]+)\s*:/gm)) defined.set(m[1], f);
  }
  const corpus =
    readAll('src', /\.(css|js)$/) + readAll('demos', /\.(html|css)$/) + readAll('site/src', /\.(html|njk|css|js)$/);
  const read = new Set([...corpus.matchAll(/var\(\s*(--[a-z0-9-]+)/g)].map((m) => m[1]));

  it('finds the token files', () => {
    assert.ok(defined.size > 300, `only ${defined.size} tokens found`);
  });

  it('has no unread token outside the tracked list (and --bp-* reference values)', () => {
    const dead = [...defined].filter(([t]) => !read.has(t) && !UNREAD_BUT_KEPT.has(t) && !t.startsWith('--bp-'));
    assert.deepEqual(
      dead.map(([t, f]) => `${t} (${f})`),
      [],
      'Tokens nothing reads. Either use them, or remove them — dead tokens ship in every page load.',
    );
  });

  it('the tracked list only holds tokens that are still defined and still unread', () => {
    const stale = [...UNREAD_BUT_KEPT].filter((t) => !defined.has(t) || read.has(t));
    assert.deepEqual(stale, [], 'Remove these from UNREAD_BUT_KEPT — they were pruned or gained a reader.');
  });
});
