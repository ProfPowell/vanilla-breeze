/**
 * Self-hosted typefaces (src/fonts/, written by scripts/vendor-fonts.mjs).
 *
 * Guards three things: the generator's parsing, that every family on its
 * list is on disk with its licence and files, and that no theme goes back to
 * loading a font from a third party.
 *
 * Run: node --test tests/unit/vendored-fonts.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FAMILIES, faceRule, parseFaces } from '../../scripts/vendor-fonts.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const fonts = join(root, 'src/fonts');
const themes = join(root, 'src/tokens/themes');

describe('vendor-fonts parsing', () => {
  const css = `/* nunito-latin-wght-normal */
@font-face {
  font-family: 'Nunito Variable';
  font-style: normal;
  font-display: swap;
  font-weight: 200 1000;
  src: url(./files/nunito-latin-wght-normal.woff2) format('woff2-variations');
  unicode-range: U+0000-00FF,U+0131;
}`;

  it('keys each face by its comment and reads its descriptors', () => {
    const faces = parseFaces(css);
    assert.deepEqual([...faces.keys()], ['nunito-latin-wght-normal']);
    assert.equal(faces.get('nunito-latin-wght-normal')?.['font-weight'], '200 1000');
  });

  it('writes a rule with the plain family name and a local file', () => {
    const rule = faceRule('Nunito', 'nunito-latin-wght-normal.woff2', parseFaces(css).get('nunito-latin-wght-normal') ?? {});
    assert.match(rule, /font-family: "Nunito";/);
    assert.match(rule, /url\("\.\/nunito-latin-wght-normal\.woff2"\) format\("woff2"\)/);
    assert.match(rule, /unicode-range: U\+0000-00FF, U\+0131;/);
  });
});

describe('vendored font files', () => {
  for (const fam of FAMILIES) {
    it(`${fam.id}: stylesheet, licence and every file it names`, () => {
      const cssPath = join(fonts, `${fam.id}.css`);
      assert.ok(existsSync(cssPath), `${fam.id}.css missing; run node scripts/vendor-fonts.mjs ${fam.id}`);
      assert.ok(existsSync(join(fonts, `${fam.id}-OFL.txt`)), `${fam.id}-OFL.txt missing`);
      const css = readFileSync(cssPath, 'utf8');
      const urls = [...css.matchAll(/url\("\.\/([^"]+)"\)/g)].map((m) => m[1]);
      assert.ok(urls.length >= fam.variants.length);
      for (const u of urls) assert.ok(existsSync(join(fonts, u)), `${u} missing`);
      assert.ok(css.includes(`font-family: "${fam.family}";`));
    });
  }
});

describe('themes load no third-party fonts', () => {
  const files = readdirSync(themes).filter((f) => f.endsWith('.css'));

  it('no theme imports from a font host', () => {
    const bad = files.filter((f) => /fonts\.(googleapis|gstatic)\.com/.test(readFileSync(join(themes, f), 'utf8')));
    assert.deepEqual(bad, []);
  });

  it('every font import in a theme resolves', () => {
    for (const f of files) {
      for (const m of readFileSync(join(themes, f), 'utf8').matchAll(/@import\s+"(\.\.\/\.\.\/fonts\/[^"]+)"/g)) {
        assert.ok(existsSync(resolve(themes, m[1])), `${f}: ${m[1]}`);
      }
    }
  });
});
