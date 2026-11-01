/**
 * No two docs source files may build to the same URL (vanilla-breeze-joss).
 *
 * Cook turns X.html into X/index.html, so a source tree holding both X.html
 * and X/index.html silently ships only one of them. Four attribute pages
 * (data-layout, data-page-layout, data-sticky, data-layout-density) had a
 * hidden twin for months; the dead copies kept receiving edits nobody could
 * see, and the live ones drifted from the CSS.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, existsSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const PAGES = resolve(import.meta.dirname, '../../site/src/pages');

test('no X.html alongside X/index.html in site/src/pages', () => {
  const clashes = [];
  (function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.html') && entry.name !== 'index.html') {
        const twin = join(dir, entry.name.slice(0, -'.html'.length), 'index.html');
        if (existsSync(twin)) clashes.push(`${relative(PAGES, full)} + ${relative(PAGES, twin)}`);
      }
    }
  })(PAGES);
  assert.deepEqual(clashes, [], `source pages that build to the same URL:\n  ${clashes.join('\n  ')}`);
});
