/**
 * Themes work on any element ([data-theme~=id]), so <article data-theme="amber">
 * on a swiss page must get amber's colours. A custom property's var()
 * references resolve on the element that declares it, so a derived token
 * declared only on :root (--color-primary: oklch(var(--lightness-primary) …))
 * stays frozen at the page's value for every descendant, whatever seeds a
 * scoped theme sets. Static checks:
 *   1. Every colour-derived token declared on :root in the token files is
 *      also declared on a zero-specificity :where([data-theme]) rule.
 *   2. Those re-derivations live outside any @layer block in the token files
 *      (they are imported into @layer tokens, below bundle-theme, so a
 *      theme's own literal --color-* still wins) and use :where() so they
 *      add no specificity.
 *   3. Every theme's same-element mode variant ([data-theme~=x][data-mode=dark])
 *      also matches a themed element inside a region of that mode, so
 *      <html data-mode="dark"> gives the article its theme's dark values.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import postcss from 'postcss';

const repo = resolve(import.meta.dirname, '../..');
const TOKEN_FILES = [
  ...readdirSync(join(repo, 'src/tokens')).filter((f) => f.endsWith('.css')).map((f) => `src/tokens/${f}`),
  ...readdirSync(join(repo, 'src/tokens/extensions')).filter((f) => f.endsWith('.css')).map((f) => `src/tokens/extensions/${f}`),
  'src/charts/tokens.css',
];
// Values that follow theme-set inputs (directly or via another derived
// token): colours and seeds, font stacks, radii, shadows, border width and
// glass opacities. Not listed, on purpose: --size-unit (the one theme that
// sets it, a11y-large-text, also sets every --size-* literally, and
// re-deriving the scale would drop [data-layout-density] spacing inside a
// themed element), --ease-3/--ease-in-2/--ease-out-3, --opacity-* and
// --filter-rough-* (no theme sets them).
const THEME_DEPENDENT = /var\(--(color-|hue-|lightness-|chroma-|scrollbar-|control-border|progress-track-bg|font-(sans|serif|mono)\b|radius-(full|m)\b|shadow-s\b|border-width-thin\b|glass-(surface|border)-opacity\b)/;
// Page-level tokens painted on <html>/<body> or the backdrop canvas only.
const PAGE_ONLY = new Set(['--page-bg-color', '--canvas-bg']);

const parse = (rel) => postcss.parse(readFileSync(join(repo, rel), 'utf8'), { from: rel });
/** Top-level selector list items (commas inside :not()/:where() kept). */
function items(sel) {
  const out = [];
  let depth = 0, cur = '';
  for (const ch of sel) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = ''; } else cur += ch;
  }
  out.push(cur.trim());
  return out;
}

test('colour-derived :root tokens are re-derived on :where([data-theme])', () => {
  const rootDerived = new Map();
  const scoped = new Set();
  for (const rel of TOKEN_FILES) {
    parse(rel).walkRules((rule) => {
      const sel = items(rule.selector);
      rule.walkDecls(/^--/, (d) => {
        if (sel.includes(':root') && THEME_DEPENDENT.test(d.value) && !PAGE_ONLY.has(d.prop)) rootDerived.set(d.prop, rel);
        if (sel.some((x) => x.startsWith(':where([data-theme]'))) scoped.add(d.prop);
      });
    });
  }
  const missing = [...rootDerived].filter(([p]) => !scoped.has(p)).map(([p, rel]) => `${rel}: ${p}`);
  assert.ok(rootDerived.size > 70, `only ${rootDerived.size} derived tokens found`);
  assert.deepEqual(missing, [], 'declare these on :where([data-theme]) too, or a scoped theme keeps the page value');
});

test('the scoped re-derivations add no specificity and sit in no explicit layer', () => {
  for (const rel of TOKEN_FILES) {
    parse(rel).walkRules((rule) => {
      const scopedItems = items(rule.selector).filter((s) => s.includes('[data-theme]'));
      for (const s of scopedItems) assert.match(s, /^:where\(/, `${rel}: "${s}" must be wrapped in :where()`);
      if (!scopedItems.length) return;
      for (let p = rule.parent; p && p.type !== 'root'; p = p.parent) {
        assert.notEqual(/** @type {any} */ (p).name, 'layer', `${rel}: [data-theme] re-derivation inside an @layer block`);
      }
    });
  }
});

test('colors.css re-derives the dark surfaces for a themed element in a dark region', () => {
  const css = readFileSync(join(repo, 'src/tokens/colors.css'), 'utf8');
  assert.match(css, /:where\(\[data-mode="dark"\] \[data-theme\]:not\(\[data-mode="light"\], \[data-mode="light"\] \[data-theme\]\)\) \{\s+color-scheme: dark;/);
  assert.match(css, /@media \(prefers-color-scheme: dark\) \{\s+:root:not\(\[data-mode="light"\]\),\s+:where\(\[data-theme\]:not\(\[data-mode="light"\], \[data-mode="light"\] \[data-theme\]\)\) \{/);
});

test('every theme mode variant also matches a themed element inside that mode', () => {
  const dir = join(repo, 'src/tokens/themes');
  const missing = [];
  let seen = 0;
  for (const f of readdirSync(dir).filter((x) => x.startsWith('_') && x.endsWith('.css'))) {
    parse(`src/tokens/themes/${f}`).walkRules((rule) => {
      const sel = items(rule.selector);
      for (const s of sel) {
        const m = /^\[data-theme(~?=)"([\w-]+)"\]\[data-mode="(light|dark)"\]$/.exec(s);
        if (!m) continue;
        seen++;
        const [, op, id, mode] = m;
        const want = `[data-mode="${mode}"] [data-theme${op}"${id}"]`;
        if (!sel.some((x) => x.startsWith(want))) missing.push(`${f}: ${s}`);
      }
    });
  }
  assert.ok(seen > 40, `only ${seen} theme mode variants found`);
  assert.deepEqual(missing, [], 'add the descendant selector, e.g. [data-mode="dark"] [data-theme~="x"]:where(:not([data-mode], [data-mode="light"] [data-theme~="x"]))');
});

test('fonts-display pack keeps its slots on scoped themes (fonts.css re-derives them there)', () => {
  const css = readFileSync(join(repo, 'src/packs/fonts-display/fonts-display.theme.css'), 'utf8');
  assert.match(css, /:root,\s+:where\(\[data-theme\]\) \{\s+--font-display: 'Fraunces'/);
});

test('a scoped theme sets its own text font (body resolves --font-sans on body)', () => {
  const css = readFileSync(join(repo, 'src/base/reset.css'), 'utf8');
  assert.match(css, /:where\(\[data-theme\]:not\(:root\)\) \{\s+font-family: var\(--font-sans\);/);
});

test('theme content rules under :is(main, article) also match the themed main/article itself', () => {
  // Cook's "Article only" scope puts data-theme on the <article>, VP's editor
  // on <main>: `[data-theme~=x] :is(main, article) h1` alone needs a main or
  // article INSIDE the themed element. Each must be
  // `:is(& :is(main, article), &:is(main, article))` (same specificity).
  const dir = join(repo, 'src/tokens/themes');
  const bare = [];
  let fixed = 0;
  for (const f of readdirSync(dir).filter((x) => x.startsWith('_') && x.endsWith('.css'))) {
    parse(`src/tokens/themes/${f}`).walkRules((rule) => {
      for (const s of items(rule.selector)) {
        if (s.startsWith(':root[')) continue; // root-only selectors
        if (/:is\(& :is\(main, article\), &:is\(main, article\)\)|:is\(\[data-theme~="[\w-]+"\] :is\(main, article\), :is\(main, article\)\[data-theme~="[\w-]+"\]\)/.test(s)) { fixed++; continue; }
        if (/:is\(main, article\)/.test(s) && /^(&|\[data-theme)/.test(s)) bare.push(`${f}: ${s}`);
      }
    });
  }
  assert.ok(fixed > 200, `only ${fixed} rewritten selectors found`);
  assert.deepEqual(bare, []);
});
