/**
 * Every var(--x) reference resolves (vanilla-breeze-nnw3).
 *
 * src/tokens/index.css promises "no token may be undefined", but nothing
 * checked the other direction: references to names nothing defines. A bare
 * var(--missing) makes the declaration invalid at computed-value time, so
 * the property silently inherits or resets (nav-bar's focus outline was
 * var(--focus-ring), which never existed: no visible focus ring). With a
 * fallback, a stale or misspelled token name hides behind the fallback
 * forever (--radius-lg, --font-size-base, --color-danger).
 *
 * Rules, over src/, demos/ and site/src (comments and code samples skipped):
 *   1. A reference with no fallback must name a defined custom property.
 *   2. A reference to a VB token family name (--color-*, --size-*,
 *      --radius-*, --font-size-*, --z-*, …) must name a defined token, even
 *      with a fallback.
 * Component hook properties with fallbacks (--card-padding, --vb-duration)
 * are customization points authors set, and stay allowed.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../..');
const DIRS = ['src', 'demos', 'site/src'];
const SKIP = /node_modules|\/vendor\/|\/dist\/|\.min\./;
const TOKEN_FAMILY = /^--(color|size|space|radius|shadow|font|font-size|font-weight|line-height|leading|duration|ease|z|border|opacity|bp|content|measure|letter-spacing|tracking)-/;

function files() {
  const out = [];
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (SKIP.test(p)) continue;
      if (e.isDirectory()) walk(p);
      else if (/\.(css|html|js|mjs)$/.test(e.name)) out.push(p);
    }
  };
  for (const d of DIRS) walk(join(ROOT, d));
  return out;
}

/** Strip what isn't a live reference: CSS comments, HTML code samples, template-built names. */
function liveSource(file) {
  let src = readFileSync(file, 'utf8');
  const blank = (m) => m.replace(/[^\n]/g, ' ');
  src = src.replace(/\/\*[\s\S]*?\*\//g, blank);
  if (file.endsWith('.html')) src = src.replace(/<(code-block|pre|code)\b[\s\S]*?<\/\1>/g, blank);
  return src.replace(/var\(\s*--[a-zA-Z0-9_-]*\$\{/g, 'var(TEMPLATE{');
}

function scan() {
  const defined = new Set();
  const refs = [];
  for (const file of files()) {
    const src = liveSource(file);
    for (const m of src.matchAll(/(?:^|[\s{;("'`])(--[a-zA-Z0-9_-]+)\s*:/g)) defined.add(m[1]);
    for (const m of src.matchAll(/@property\s+(--[a-zA-Z0-9_-]+)/g)) defined.add(m[1]);
    for (const m of src.matchAll(/setProperty\(\s*['"`](--[a-zA-Z0-9_-]+)/g)) defined.add(m[1]);
    for (const m of src.matchAll(/var\(\s*(--[a-zA-Z0-9_-]+)\s*(,)?/g)) {
      refs.push({ name: m[1], fallback: Boolean(m[2]), where: `${relative(ROOT, file)}:${src.slice(0, m.index).split('\n').length}` });
    }
  }
  return { defined, refs };
}

const { defined, refs } = scan();

test('no bare var() reference to an undefined custom property', () => {
  const bad = refs.filter((r) => !r.fallback && !defined.has(r.name)).map((r) => `${r.name}  ${r.where}`);
  assert.deepEqual(bad, [], `undefined, no fallback (declaration is invalid at computed-value time):\n  ${bad.join('\n  ')}`);
});

test('no reference to an undefined VB token, even with a fallback', () => {
  const bad = refs.filter((r) => TOKEN_FAMILY.test(r.name) && !defined.has(r.name)).map((r) => `${r.name}  ${r.where}`);
  assert.deepEqual(bad, [], `token-family names nothing defines (rename to the real token or define it in src/tokens):\n  ${bad.join('\n  ')}`);
});
