/**
 * A <code-block data-escape> whose label holds an escaped angle bracket
 * (label="Step 1: inside &lt;body&gt;") breaks the site build's escaping: the
 * tag ends at the decoded ">" and the page shows the rest of the attributes
 * and the encoded sample as text (tutorial rewrite, 2026-11-10).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('../../site/src/pages', import.meta.url).pathname;

function* htmlFiles(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(p);
    else if (entry.name.endsWith('.html')) yield p;
  }
}

test('code-block labels hold no escaped angle brackets', () => {
  const bad = [];
  for (const file of htmlFiles(ROOT)) {
    const src = readFileSync(file, 'utf8');
    for (const m of src.matchAll(/<code-block\b[^>]*\blabel="([^"]*&(?:lt|gt);[^"]*)"/g)) {
      bad.push(`${file.slice(ROOT.length)}: label="${m[1]}"`);
    }
  }
  assert.deepEqual(bad, []);
});
