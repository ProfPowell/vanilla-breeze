/**
 * Theme Visual Regression Tests
 *
 * Tests a representative page across all themes to catch theme-specific regressions.
 * Run: npx playwright test tests/visual/themes.spec.js
 * Update baselines: npx playwright test tests/visual/themes.spec.js --update-snapshots
 */

import { test, expect } from 'playwright/test';

const themes = [
  // Brand/color themes
  'ocean', 'forest', 'sunset', 'rose', 'lavender', 'coral', 'slate', 'emerald', 'amber', 'indigo',
  // Personality themes
  'modern', 'minimal', 'classic',
  // Extreme themes
  'brutalist', 'swiss', 'cyber', 'organic', 'editorial', 'terminal', 'kawaii', '8bit', 'nes', 'win9x', 'rough',
];

const testPage = '/docs/examples/demos/form-validation.html';

for (const theme of themes) {
  test(`theme: ${theme}`, async ({ page }) => {
    await page.goto(testPage);
    await page.waitForLoadState('networkidle');

    // Apply theme via data-attribute
    await page.evaluate(t => {
      document.documentElement.dataset.theme = t;
    }, theme);

    // Wait for theme transition
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot(`theme-${theme}.png`, {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });
}
