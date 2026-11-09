/**
 * Every relative url(...) in the built CSS under dist/cdn must resolve to a
 * file a published package would contain (package.json "files").
 *
 * The self-hosted fonts (Atkinson Hyperlegible, Latin Modern Math) are
 * referenced as url("./fonts/...woff2"); dist/cdn/fonts was once never
 * committed and nothing noticed. This guards that class of break.
 *
 * Run: node --test tests/unit/dist-css-urls.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { resolve, dirname, relative, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const cdn = join(root, 'dist/cdn');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

/** Glob (** and * only) to RegExp, matched against a posix path from root. */
function globToRegExp(glob) {
  const body = glob
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*\//g, '\u0000')
    .replace(/\*\*/g, '\u0001')
    .replace(/\*/g, '[^/]*')
    .replace(/\u0000/g, '(?:.*/)?')
    .replace(/\u0001/g, '.*');
  return new RegExp(`^${body}(?:/.*)?$`);
}

const includes = pkg.files.filter((f) => !f.startsWith('!')).map((f) => globToRegExp(f.replace(/\/$/, '')));
const excludes = pkg.files.filter((f) => f.startsWith('!')).map((f) => globToRegExp(f.slice(1).replace(/\/$/, '')));

/** Would `npm pack` include this root-relative posix path? */
const isPublished = (rel) => includes.some((r) => r.test(rel)) && !excludes.some((r) => r.test(rel));

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

/**
 * Known, deliberate gaps: "<file>|<url>" -> reason. A stale entry fails the test.
 */
const KNOWN_UNSHIPPED = new Map([]);

/** Relative url() targets in CSS text (comments stripped). */
function relativeUrls(css) {
  const out = [];
  for (const m of css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)"'\s]*))\s*\)/g)) {
    const raw = (m[1] ?? m[2] ?? m[3] ?? '').trim();
    if (!raw || raw.startsWith('#')) continue;
    if (/^(?:data:|https?:|\/\/|blob:)/i.test(raw)) continue;
    out.push(raw);
  }
  return out;
}

describe('dist/cdn CSS url() targets', () => {
  it('dist/cdn exists', () => {
    assert.ok(existsSync(cdn), 'dist/cdn is missing; run npm run build:cdn');
  });

  it('every relative url() resolves to a file in the published package', () => {
    const missing = [];
    const seenKnown = new Set();
    let checked = 0;
    const cssFiles = walk(cdn).filter((f) => f.endsWith('.css'));
    assert.ok(cssFiles.length > 0, 'no CSS files found under dist/cdn');
    for (const file of cssFiles) {
      const fileRel = relative(root, file).split(sep).join('/');
      if (!isPublished(fileRel)) continue; // CSS that is not shipped may point anywhere
      for (const url of relativeUrls(readFileSync(file, 'utf8'))) {
        checked++;
        const target = resolve(dirname(file), url.split(/[?#]/)[0]);
        const targetRel = relative(root, target).split(sep).join('/');
        const key = `${fileRel}|${url}`;
        if (KNOWN_UNSHIPPED.has(key)) { seenKnown.add(key); continue; }
        const ok = existsSync(target) && statSync(target).isFile();
        if (!ok) missing.push(`${fileRel}: url(${url}) -> ${targetRel} (not found)`);
        else if (!isPublished(targetRel)) missing.push(`${fileRel}: url(${url}) -> ${targetRel} (excluded from package "files")`);
      }
    }
    assert.ok(checked > 0, 'found no relative url() references at all; the extractor is probably broken');
    for (const key of KNOWN_UNSHIPPED.keys()) {
      if (!seenKnown.has(key)) missing.push(`stale KNOWN_UNSHIPPED entry (no longer referenced): ${key}`);
    }
    assert.deepEqual(missing, [], `Unresolved url() targets:\n${missing.join('\n')}`);
  });

  it('icons pack CSS loads Material Symbols from Google Fonts, first, with no local font url()', () => {
    const GF = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap';
    // esbuild minifies `@import url("x");` to `@import"x";`; accept either form.
    const IMPORT = new RegExp(`^@import\\s*(?:url\\(\\s*)?["']${GF.replace(/[.+?^${}()|[\]\\]/g, '\\$&')}["']\\s*\\)?\\s*;`);
    for (const name of ['icons.theme.css', 'icons.full.css']) {
      const css = readFileSync(join(cdn, 'packs', name), 'utf8');
      const body = css.replace(/^@charset[^;]*;\s*/i, '').replace(/^(?:\/\*[\s\S]*?\*\/\s*)+/, '');
      assert.ok(IMPORT.test(body), `${name} must start with the Google Fonts @import (after @charset)`);
      assert.ok(!/url\([^)]*material-symbols/i.test(css.replace(IMPORT, '')), `${name} must not reference a local material-symbols file`);
      assert.ok(!/@font-face\s*\{[^}]*Material Symbols/i.test(css), `${name} must not declare a local Material Symbols @font-face`);
    }
  });
});
