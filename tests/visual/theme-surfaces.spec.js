/**
 * Theme Surface Visual Regression Tests
 *
 * Tests each theme lab surface page across a representative subset of themes.
 * Run: npx playwright test tests/visual/theme-surfaces.spec.js
 * Update baselines: npx playwright test tests/visual/theme-surfaces.spec.js --update-snapshots
 */

import { test, expect } from 'playwright/test';
import { readdirSync } from 'fs';
import { join } from 'path';

const surfacesDir = join(import.meta.dirname, '../../docs/tools/theme-lab/surfaces');
const surfaces = readdirSync(surfacesDir)
  .filter(f => f.endsWith('.html') && !f.startsWith('_'))
  .sort();

const themes = [
  'ocean', 'forest', 'modern', 'minimal',
  'swiss', 'brutalist', 'cyber', 'kawaii',
  '8bit', 'nord', 'dracula', 'glassmorphism',
];

for (const surface of surfaces) {
  for (const theme of themes) {
    test(`${surface} / ${theme}`, async ({ page }) => {
      await page.goto(`/docs/tools/theme-lab/surfaces/${surface}?theme=${theme}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
      await expect(page).toHaveScreenshot(
        `surface-${surface.replace('.html', '')}-${theme}.png`,
        { fullPage: true, maxDiffPixelRatio: 0.02 }
      );
    });
  }
}
