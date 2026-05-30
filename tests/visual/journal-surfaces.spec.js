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
