/**
 * Journal substrate surfaces — computed-style checks.
 *
 * Server-independent: reads the actual surfaces.css + surface-types.css from
 * disk and injects them, then verifies each [data-surface] journal substrate
 * resolves to a real background and that the dot grid uses the 22px tile.
 */
import { test, expect } from 'playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';

const root = join(import.meta.dirname, '../..');
const tokensCss = readFileSync(join(root, 'src/tokens/extensions/surfaces.css'), 'utf8');
const surfaceCss = readFileSync(join(root, 'src/utils/surface-types.css'), 'utf8');

const SURFACES = ['paper', 'dots', 'grid', 'lines', 'kraft'];

test.beforeEach(async ({ page }) => {
  await page.setContent(
    `<style>${tokensCss}\n${surfaceCss}</style>` +
      SURFACES.map(
        (s) => `<div id="${s}" data-surface="${s}" style="width:200px;height:120px">x</div>`
      ).join('')
  );
});

for (const s of SURFACES) {
  test(`surface "${s}" sets a background`, async ({ page }) => {
    const bg = await page.evaluate((id) => {
      const cs = getComputedStyle(document.getElementById(id));
      return cs.backgroundImage + '|' + cs.backgroundColor;
    }, s);
    expect(bg).not.toBe('none|rgba(0, 0, 0, 0)');
  });
}

test('dots surface uses the 22px journal tile', async ({ page }) => {
  const size = await page.evaluate(
    () => getComputedStyle(document.getElementById('dots')).backgroundSize
  );
  expect(size).toContain('22px');
});

test('dots surface paints a real (non-transparent) dot color', async ({ page }) => {
  const img = await page.evaluate(
    () => getComputedStyle(document.getElementById('dots')).backgroundImage
  );
  expect(img).toContain('radial-gradient');
  // --surface-dot resolves to a real color (oklch / rgb / color()), not transparent-only.
  expect(img).toMatch(/oklch|rgb|color\(/);
});

test('grid surface uses the 22px journal tile', async ({ page }) => {
  const size = await page.evaluate(
    () => getComputedStyle(document.getElementById('grid')).backgroundSize
  );
  expect(size).toContain('22px');
});

test('lines surface draws ruled lines via a repeating gradient', async ({ page }) => {
  const img = await page.evaluate(
    () => getComputedStyle(document.getElementById('lines')).backgroundImage
  );
  expect(img).toContain('repeating-linear-gradient'); // the 28px-pitch rules
});
