/**
 * Native-elements classes are element-scoped modifiers that something uses
 * (vanilla-breeze-hl9c).
 *
 * The layer contract in main.css used to say "No classes" while the CSS
 * defined 147 class selectors. The amended rule: element-scoped semantic
 * modifier classes (p.lead, section.hero, article.card) and classes written by
 * the framework's own init modules are fine; dead ones are not. Seven classes
 * nothing used (hn-action-remove, hn-swatch, code-inputs, ratio-landscape,
 * changelog-year/-month, ultrawide) were pruned; this gate keeps the set
 * honest. A class passes when it appears in a demo or docs class attribute,
 * or as a string token in a framework JS module.
 *
 * Run: node --test tests/unit/native-element-classes.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const walk = (dir, exts) =>
  readdirSync(resolve(root, dir), { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name), exts) : exts.test(e.name) ? [join(dir, e.name)] : [],
  );
const readAll = (dir, exts) => walk(dir, exts).map((f) => readFileSync(resolve(root, f), 'utf8')).join('\n');

describe('every class selector in native-elements is used', () => {
  const css = walk('src/native-elements', /\.css$/);
  const classes = new Map();
  for (const f of css) {
    const text = readFileSync(resolve(root, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    for (const m of text.matchAll(/(?:^|[\s,>+~(])(?:[a-z][a-z0-9-]*)?\.([a-z][a-z0-9_-]*)/gm)) {
      if (!classes.has(m[1])) classes.set(m[1], f);
    }
  }
  const html = readAll('demos', /\.html$/) + readAll('site/src', /\.(html|njk)$/);
  const js = readAll('src', /\.js$/) + readAll('scripts', /\.js$/);
  const usedInHtml = new Set([...html.matchAll(/class="([^"]+)"/g)].flatMap((m) => m[1].split(/\s+/)));

  it('finds the classes', () => {
    assert.ok(classes.size > 100, `only ${classes.size} classes found`);
  });

  it('has no class that neither the corpus nor a framework module uses', () => {
    const dead = [...classes].filter(([c]) => {
      if (usedInHtml.has(c)) return false;
      const re = new RegExp(`['"\`\\s.]${c.replace(/-/g, '\\-')}['"\`\\s.<]`);
      return !re.test(js);
    });
    assert.deepEqual(
      dead.map(([c, f]) => `.${c} (${f})`),
      [],
      'Dead classes in native-elements — remove the rule, or use the class.',
    );
  });
});
