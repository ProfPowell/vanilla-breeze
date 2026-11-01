/**
 * src/tokens/themes/_accents.css is generated from COLOR_ACCENTS in
 * src/lib/theme-data.js (vanilla-breeze-5z8i). Fails when someone edits an
 * accent's seeds without regenerating, so data-accent="forest" and
 * ThemeManager.setAccent('forest') can't drift apart.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderAccentCss } from '../../scripts/generate-accent-css.mjs';
import { COLOR_ACCENTS } from '../../src/lib/theme-data.js';

const file = readFileSync(resolve(import.meta.dirname, '../../src/tokens/themes/_accents.css'), 'utf8');

test('_accents.css matches theme-data.js (run node scripts/generate-accent-css.mjs)', () => {
  assert.equal(file, renderAccentCss());
});

test('derived colours are re-declared at zero specificity; each accent sets its seeds', () => {
  assert.match(file, /:where\(\[data-accent\]\) \{\s+--color-primary: oklch\(var\(--lightness-primary\)/);
  for (const a of COLOR_ACCENTS.filter((x) => x.id !== 'default')) {
    const block = file.split(`[data-accent~="${a.id}"] {`)[1]?.split('}')[0] ?? '';
    assert.match(block, new RegExp(`--hue-primary: ${a.seeds['--hue-primary']};`), a.id);
  }
});

test('accents load after the brand themes (specificity ties go to the accent)', () => {
  const index = readFileSync(resolve(import.meta.dirname, '../../src/tokens/themes/index.css'), 'utf8');
  assert.ok(index.indexOf('@import "./_accents.css"') > index.indexOf('@import "./_brand-classic.css"'));
});
