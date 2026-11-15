/**
 * Round trip over every shipped theme: the custom properties a theme sets
 * → serializeDTCG → deserializeDTCG must give back the same CSS.
 *
 * The theme token files in dist/cdn/themes/ are written by the build from
 * these same blocks with the same serializer, so the source CSS is tested
 * here and no build is needed.
 *
 * "The same CSS" is exact text, except for a finished value that DTCG
 * holds as structured data. That comes back as the same value in one
 * fixed notation (keeping the source text for every token would make a
 * change made in another tool have no effect on import):
 *   - OKLCH lightness as a number:      oklch(55% …)  → oklch(0.55 …)
 *   - a unitless zero length with px:   0             → 0px
 *   - numbers without trailing zeros:   0.10          → 0.1
 *   - every non-generic font name quoted: Georgia     → "Georgia"
 *   - single spaces between parts
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { serializeDTCG } from '../../src/lib/dtcg/dtcg-serialize.js';
import { deserializeDTCG } from '../../src/lib/dtcg/dtcg-deserialize.js';
import {
  extractBaseBlock, extractDarkBlock, parseDeclarations, parseDefaultDeclarations,
} from '../../src/lib/dtcg/theme-css-parse.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TOKENS_DIR = join(__dirname, '..', '..', 'src', 'tokens');
const THEMES_DIR = join(TOKENS_DIR, 'themes');
const VB_NS = 'com.vanilla-breeze';

// Same file filter and context as buildThemes() in scripts/build-cdn.js.
const themeFiles = readdirSync(THEMES_DIR).filter((f) =>
  f.endsWith('.css') && !f.includes('template') && (f.startsWith('_brand-') || f.startsWith('_extreme-')));

const libraryLight = [];
const libraryDark = [];
for (const dir of [TOKENS_DIR, join(TOKENS_DIR, 'extensions')]) {
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.css') && f !== 'index.css')) {
    const css = readFileSync(join(dir, f), 'utf-8');
    libraryLight.push(...parseDefaultDeclarations(css));
    libraryDark.push(...parseDefaultDeclarations(css, { dark: true }));
  }
}

/** One fixed notation for a finished value (see the list at the top). */
function notation(name, value) {
  let v = value.replace(/\s+/g, ' ')
    .replace(/oklch\((-?[\d.]+)%/g, (_, l) => `oklch(${parseFloat(l) / 100}`)
    .replace(/(?<![\w#.-])(\d*\.\d+|\d+)(?![\w.])/g, (n) => String(parseFloat(n)));
  if (/^--(shadow|radius|size|font-size|letter-spacing|border-width)-/.test(name)) {
    v = v.replace(/(^|[\s,])0(?=$|[\s,])/g, '$10px');
  }
  if (name.startsWith('--font-')) v = v.replace(/"([A-Za-z][\w-]*)"/g, '$1');
  return v;
}

const sets = [];
for (const file of themeFiles) {
  const id = file.replace(/^_(brand|extreme)-/, '').replace('.css', '');
  const css = readFileSync(join(THEMES_DIR, file), 'utf-8');
  const base = parseDeclarations(extractBaseBlock(css, id));
  const dark = parseDeclarations(extractDarkBlock(css, id) || '');
  if (base.length) sets.push({ label: `${id}.tokens.json`, entries: base, context: libraryLight });
  if (dark.length) sets.push({ label: `${id}-dark.tokens.json`, entries: dark, context: [...libraryLight, ...libraryDark, ...base] });
}

describe('shipped themes — DTCG round trip', () => {
  it('covers every theme', () => {
    assert.ok(sets.length >= 70, `expected ≥70 token sets, got ${sets.length}`);
  });

  for (const { label, entries, context } of sets) {
    it(`${label} re-imports to the CSS it was written from`, () => {
      const doc = JSON.parse(JSON.stringify(serializeDTCG(entries, { context })));
      const unmapped = new Set(doc.$extensions[VB_NS].unmapped || []);
      const back = new Map(deserializeDTCG(doc).tokens);
      const wrong = [];
      for (const [name, value] of new Map(entries)) {
        if (unmapped.has(name)) continue;
        const got = back.get(name);
        if (got !== value && (got == null || notation(name, got) !== notation(name, value))) {
          wrong.push(`${name}: ${value} → ${got}`);
        }
      }
      assert.deepEqual(wrong, []);
    });
  }

  it('only leaves out values DTCG has no type for', () => {
    // steps() easing and a multi-value radius. Everything else is a token.
    const left = new Set();
    for (const { entries, context } of sets) {
      const cssOnly = serializeDTCG(entries, { context }).$extensions[VB_NS].cssOnly || {};
      for (const [name, value] of Object.entries(cssOnly)) {
        if (!/^steps\(/.test(value) && name !== '--radius-organic') left.add(`${name}: ${value}`);
      }
    }
    assert.deepEqual([...left], []);
  });

  it('writes no stand-in values', () => {
    const black = JSON.stringify({ colorSpace: 'srgb', components: [0, 0, 0] });
    const bad = [];
    const visit = (node, path, label) => {
      if (!node || typeof node !== 'object') return;
      const ext = node.$extensions?.[VB_NS];
      if (ext && (ext.literal || ext.expression) && node.$type === 'color' && JSON.stringify(node.$value) === black) {
        bad.push(`${label} ${path}`);
      }
      for (const [key, child] of Object.entries(node)) {
        if (key !== '$extensions' && key !== '$value') visit(child, `${path}.${key}`, label);
      }
    };
    for (const { label, entries, context } of sets) visit(serializeDTCG(entries, { context }), '', label);
    assert.deepEqual(bad, []);
  });

  it('computes the Classic hover color from the library default it refers to', () => {
    const classic = sets.find((s) => s.label === 'classic.tokens.json');
    const tok = serializeDTCG(classic.entries, { context: classic.context }).color['primary-hover'];
    assert.equal(tok.$value.colorSpace, 'oklch');
    assert.match(tok.$extensions[VB_NS].expression, /^oklch\(from var\(--color-primary\)/);
  });
});
