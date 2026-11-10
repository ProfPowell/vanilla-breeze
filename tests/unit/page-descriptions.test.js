/**
 * A page's frontmatter description is printed as its lead paragraph and
 * into the head's meta tags without escaping. A raw tag in it
 * (description: "First mention in <dfn>, …") becomes a real element: the
 * word vanishes from the lead and the rest of the sentence is styled by it
 * (glossary-terms page, 2026-11-10). Write &lt;dfn&gt; instead.
 *
 * A double quote (description: "… popover=\"hint\" …") ends the meta
 * tag's content attribute early, truncating the description search engines
 * and link previews show. Use single quotes inside a description.
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

test('page descriptions hold no raw angle brackets', () => {
  const bad = [];
  for (const file of htmlFiles(ROOT)) {
    const src = readFileSync(file, 'utf8');
    if (!src.startsWith('---')) continue;
    const front = src.slice(0, src.indexOf('\n---', 3));
    const m = /^description: (.*)$/m.exec(front);
    if (m && /[<>]/.test(m[1])) bad.push(`${file.slice(ROOT.length)}: ${m[1].slice(0, 80)}`);
  }
  assert.deepEqual(bad, []);
});

test('page descriptions hold no double quotes inside the value', () => {
  const bad = [];
  for (const file of htmlFiles(ROOT)) {
    const src = readFileSync(file, 'utf8');
    if (!src.startsWith('---')) continue;
    const front = src.slice(0, src.indexOf('\n---', 3));
    const m = /^description: "(.*)"\s*$/m.exec(front);
    if (m && /"/.test(m[1])) bad.push(`${file.slice(ROOT.length)}: ${m[1].slice(0, 80)}`);
  }
  assert.deepEqual(bad, []);
});
