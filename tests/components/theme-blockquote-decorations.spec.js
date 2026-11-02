/**
 * Theme blockquote decorations — vanilla-breeze-ve4g.
 *
 * Themes and packs decorate blockquotes with ::before glyphs. Those glyphs
 * must be silent to assistive tech (alt-text form `content: "x" / ""`) and
 * positioned logically so they sit at the inline-start edge in RTL, with
 * directional glyphs mirrored.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

async function load(page, { theme, css, dir }) {
  await page.route('**/fonts.googleapis.com/**', (route) => route.abort());
  await page.route('**/fonts.gstatic.com/**', (route) => route.abort());
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__theme-blockquote-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en" dir="${dir}" data-theme="${theme}"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <link rel="stylesheet" href="${css}">
      </head><body><main><article>
        <blockquote id="bq"><p>Simplicity is prerequisite for reliability.</p></blockquote>
      </article></main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
}

const THEMES = 'src/tokens/themes';
// glyph: LTR content; rtlGlyph: mirrored glyph in RTL (defaults to glyph);
// positioned: absolutely positioned pseudo whose side must flip in RTL;
// flip: RTL mirrors the glyph with a transform instead of a different char.
const CASES = [
  { name: 'claymorphism', css: `${THEMES}/_extreme-claymorphism.css`, glyph: '“', rtlGlyph: '”', positioned: true },
  { name: 'neumorphism', css: `${THEMES}/_extreme-neumorphism.css`, glyph: '“', rtlGlyph: '”', positioned: true },
  { name: 'organic', css: `${THEMES}/_extreme-organic.css`, glyph: '“', rtlGlyph: '”', positioned: true },
  { name: 'cottagecore', css: `${THEMES}/_extreme-cottagecore.css`, glyph: '“', rtlGlyph: '”', positioned: true },
  { name: 'nes', css: `${THEMES}/_extreme-nes.css`, glyph: '“', rtlGlyph: '”', positioned: true },
  { name: '8bit', css: `${THEMES}/_extreme-8bit.css`, glyph: '💬', positioned: true, flip: true },
  { name: 'kawaii', css: `${THEMES}/_extreme-kawaii.css`, glyph: '💭', positioned: true, flip: true },
  { name: 'kawaii', label: 'kawaii pack', css: 'src/packs/kawaii/kawaii.effects.css', glyph: '💭', positioned: true, flip: true },
  { name: 'memphis', label: 'memphis pack', css: 'src/packs/memphis/memphis.theme.css', glyph: '❝', rtlGlyph: '❞', positioned: true },
  { name: 'vaporwave', css: `${THEMES}/_extreme-vaporwave.css`, glyph: '▓', positioned: true },
  { name: 'bauhaus', css: `${THEMES}/_extreme-bauhaus.css`, glyph: null, positioned: true },
  { name: 'rough', css: `${THEMES}/_extreme-rough.css`, glyph: null, positioned: true },
  { name: 'cyber', css: `${THEMES}/_extreme-cyber.css`, glyph: '"' },
  { name: 'brutalist', css: `${THEMES}/_extreme-brutalist.css`, glyph: '"' },
  { name: 'super2026', css: `${THEMES}/_extreme-super2026.css`, glyph: '"' },
  { name: 'terminal', css: `${THEMES}/_extreme-terminal.css`, glyph: '[!] SYSTEM MESSAGE:' },
];

const cssString = (s) => `"${s.replace(/["\\]/g, (c) => `\\${c}`)}"`;

function readPseudo(page) {
  return page.evaluate(() => {
    const bq = document.getElementById('bq');
    const cs = getComputedStyle(bq, '::before');
    return {
      content: cs.content,
      position: cs.position,
      left: parseFloat(cs.left),
      right: parseFloat(cs.right),
      transform: cs.transform,
    };
  });
}

for (const c of CASES) {
  test.describe(`${c.label ?? c.name} blockquote ::before`, () => {
    test('LTR: glyph is silent and sits at the left (inline-start) edge', async ({ page }) => {
      await load(page, { theme: c.name, css: `/${c.css}`, dir: 'ltr' });
      const p = await readPseudo(page);
      if (c.glyph) {
        expect(p.content).toBe(`${cssString(c.glyph)} / ""`);
        const snap = await page.locator('#bq').ariaSnapshot();
        expect(snap).not.toContain(c.glyph);
        expect(snap).toContain('Simplicity is prerequisite');
      } else {
        expect(p.content).toBe('""');
      }
      if (c.positioned) {
        expect(p.position).toBe('absolute');
        expect(p.left).toBeLessThan(p.right);
      }
    });

    test('RTL: glyph is silent, mirrored, and sits at the right (inline-start) edge', async ({ page }) => {
      await load(page, { theme: c.name, css: `/${c.css}`, dir: 'rtl' });
      const p = await readPseudo(page);
      if (c.glyph) {
        expect(p.content).toBe(`${cssString(c.rtlGlyph ?? c.glyph)} / ""`);
        const snap = await page.locator('#bq').ariaSnapshot();
        expect(snap).not.toContain(c.rtlGlyph ?? c.glyph);
      } else {
        expect(p.content).toBe('""');
      }
      if (c.flip) expect(p.transform).toBe('matrix(-1, 0, 0, 1, 0, 0)');
      if (c.positioned) {
        expect(p.position).toBe('absolute');
        expect(p.right).toBeLessThan(p.left);
      }
    });
  });
}

test('control: glyph without alt text is exposed in the aria snapshot', async ({ page }) => {
  // Proves the snapshot assertion above can fail: an un-silenced glyph shows up.
  await load(page, { theme: 'none', css: '/src/main.css', dir: 'ltr' });
  await page.addStyleTag({ content: '#bq::before { content: "\\201C"; }' });
  expect(await page.locator('#bq').ariaSnapshot()).toContain('“');
});
