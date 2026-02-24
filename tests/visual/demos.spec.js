/**
 * Visual Regression Tests for Demo Pages
 *
 * Auto-discovers all demo HTML files and generates a screenshot test for each.
 * Run: npx playwright test tests/visual/demos.spec.js
 * Update baselines: npx playwright test tests/visual/demos.spec.js --update-snapshots
 */

import { test, expect } from 'playwright/test';
import { readdirSync } from 'fs';
import { join } from 'path';

const demosDir = join(import.meta.dirname, '../../demos/examples/demos');

const demos = readdirSync(demosDir)
  .filter(f => f.endsWith('.html') && !f.startsWith('_'))
  .sort();

for (const demo of demos) {
  test(`visual: ${demo}`, async ({ page }) => {
    await page.goto(`/docs/examples/demos/${demo}`);
    await page.waitForLoadState('networkidle');

    // Wait for web components to initialize
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot(`${demo}.png`, {
      fullPage: true,
      maxDiffPixelRatio: 0.01,
    });
  });
}
