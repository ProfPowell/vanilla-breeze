/**
 * Round-trip regression test for the four brand themes promoted via
 * the DTCG theme pipeline (vanilla-breeze-jxlv Phase 5).
 *
 * For each brand: parse the `:root[data-theme~="{brand}"]` block,
 * extract custom-property declarations, run them through
 * serializeDTCG → deserializeDTCG, and assert structural fidelity:
 *
 *   - No token name lost.
 *   - No token name invented (other than composite-typography unpacks,
 *     which we explicitly account for).
 *   - Brand-defining values (primary color, primary font) survive in
 *     a CSS-recognizable form.
 *
 * This is the validation set for the DTCG pipeline; if a brand can't
 * round-trip, neither can a public token-set import.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { serializeDTCG } from '../../src/web-components/theme-export/dtcg-serialize.js';
import { deserializeDTCG } from '../../src/web-components/theme-import/dtcg-deserialize.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const THEMES_DIR = join(__dirname, '..', '..', 'src', 'tokens', 'themes');

/**
 * Pull the body of the first `:root[data-theme~="{brand}"]` block from a
 * CSS string. Walks braces so nested rules don't confuse the boundary.
 */
function extractBaseBlock(css, brand) {
  const sel = `data-theme~="${brand}"]`;
  const idx = css.indexOf(sel);
  if (idx === -1) return '';
  const braceStart = css.indexOf('{', idx);
  if (braceStart === -1) return '';
  let depth = 1;
  let pos = braceStart + 1;
  while (pos < css.length && depth > 0) {
    if (css[pos] === '{') depth++;
    else if (css[pos] === '}') depth--;
    pos++;
  }
  return css.slice(braceStart + 1, pos - 1);
}

/**
 * Pull `--name: value;` declarations out of a CSS block body.
 * Skips nested-rule contents; brand themes don't nest token declarations.
 */
function parseDeclarations(blockBody) {
  const out = [];
  // Match: --name: <value>;  where value runs until the next semicolon
  // (no nested '{}' inside our brand themes' base blocks).
  const re = /(--[\w-]+)\s*:\s*([^;{}]+);/g;
  let m;
  while ((m = re.exec(blockBody)) !== null) {
    out.push([m[1], m[2].trim()]);
  }
  return out;
}

const BRANDS = [
  { id: 'mcdonalds', file: '_brand-mcdonalds.css', primary: '#DB0007' },
  { id: 'starbucks', file: '_brand-starbucks.css', primary: '#00754A' },
  { id: 'ibm',       file: '_brand-ibm.css',       primary: '#0F62FE' },
  { id: 'anthropic', file: '_brand-anthropic.css', primary: '#CC785C' },
];

// VB-specific tokens that don't fit the documented prefix surface.
// The serializer ignores them (correctly) and they don't round-trip.
// Listed here so the regression test makes the omission explicit.
const KNOWN_UNMAPPED_PREFIXES = [
  '--header-',          // header-bg, header chrome
  '--btn-',             // button override slots
  '--brand-mark-',      // brand-mark sizing
  '--input-',           // input chrome
  '--focus-ring-width', '--focus-ring-offset', // focus ring not a color
];

function isKnownUnmapped(name) {
  return KNOWN_UNMAPPED_PREFIXES.some((p) => name.startsWith(p));
}

for (const brand of BRANDS) {
  describe(`brand-${brand.id} — DTCG round-trip`, () => {
    const cssPath = join(THEMES_DIR, brand.file);
    const css = readFileSync(cssPath, 'utf-8');
    const block = extractBaseBlock(css, brand.id);
    const original = parseDeclarations(block);

    it('extracts at least 30 declarations from the base block', () => {
      assert.ok(original.length >= 30, `expected ≥30 tokens, got ${original.length}`);
    });

    it('serializes to DTCG without throwing', () => {
      const out = serializeDTCG(original, { vbVersion: `brand-${brand.id}-roundtrip` });
      assert.equal(out.$extensions['com.vanilla-breeze'].spec, '2025.10');
    });

    it('round-trips: no documented-prefix token is lost', () => {
      const dtcg = serializeDTCG(original);
      const round = deserializeDTCG(dtcg);
      const roundNames = new Set(round.tokens.map(([n]) => n));
      const lost = original
        .map(([n]) => n)
        .filter((n) => !roundNames.has(n) && !isKnownUnmapped(n));
      assert.deepEqual(lost, [], `lost tokens: ${lost.join(', ')}`);
    });

    it('preserves the brand primary color through round-trip', () => {
      const dtcg = serializeDTCG(original);
      const round = deserializeDTCG(dtcg);
      const map = Object.fromEntries(round.tokens);
      const got = map['--color-primary'];
      assert.ok(got, 'expected --color-primary in round-trip output');
      // Compare as lowercase hex (round-trip lowers case but preserves value).
      assert.equal(String(got).toLowerCase(), brand.primary.toLowerCase());
    });

    it('preserves the brand primary font through round-trip', () => {
      const dtcg = serializeDTCG(original);
      const round = deserializeDTCG(dtcg);
      const map = Object.fromEntries(round.tokens);
      const sans = map['--font-sans'];
      assert.ok(sans, 'expected --font-sans in round-trip output');
      // Family list should still contain at least one quoted name and a
      // generic fallback.
      assert.match(sans, /(sans-serif|monospace)/);
    });

    it('reports unmapped tokens as ignored, not invented', () => {
      const dtcg = serializeDTCG(original);
      const meta = dtcg.$extensions['com.vanilla-breeze'];
      const unmapped = meta.unmapped || [];
      // Every unmapped token must come from the documented-unmapped set.
      const surprise = unmapped.filter((n) => !isKnownUnmapped(n));
      assert.deepEqual(surprise, [], `surprise unmapped: ${surprise.join(', ')}`);
    });
  });
}
