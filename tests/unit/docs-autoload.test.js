/**
 * Docs pages must autoload per-component chunks (vanilla-breeze-ze67).
 *
 * Docs layouts load core + extras + packs/ui + doc-extras, not the autoload
 * bundle. ~34 components (page-info, time-index, site-map, star-rating, …)
 * ship only as per-component chunks, so without the autoloader they never
 * upgrade on the built site. doc-extras.js starts it; every layout has to
 * load doc-extras.js for that to reach every page.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../..');

test('doc-extras.js starts the component autoloader', () => {
  const src = readFileSync(resolve(ROOT, 'src/doc-extras.js'), 'utf-8');
  assert.match(src, /import\s*\{\s*initAutoloader\s*\}\s*from\s*'\.\/lib\/autoloader\.js'/);
  assert.match(src, /initAutoloader\(\)/);
});

test('every docs layout that loads site.js also loads doc-extras', () => {
  const dir = resolve(ROOT, 'site/src/layouts');
  const missing = readdirSync(dir)
    .filter((f) => f.endsWith('.html'))
    .filter((f) => {
      const html = readFileSync(resolve(dir, f), 'utf-8');
      return html.includes('${site.js}') && !html.includes('${site.docExtrasJs}');
    });
  assert.deepEqual(missing, [], `layouts missing doc-extras: ${missing.join(', ')}`);
});
