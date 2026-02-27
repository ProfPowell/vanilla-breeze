/**
 * Element-Level Visual Regression Tests
 *
 * Screenshots each element variant in isolation across 4 themes × 2 modes.
 * Uses fixtures generated from the compendium (run fixtures:generate first).
 *
 * Run:   npx playwright test --config tests/element-visual/playwright.config.js
 * Update baselines: add --update-snapshots
 */

import { test, expect } from 'playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';

const manifestPath = join(import.meta.dirname, 'fixtures/generated/manifest.json');

let manifest;
try {
  manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
} catch {
  throw new Error(
    'Fixture manifest not found. Run "npm run fixtures:generate" first.'
  );
}

// Themes to test (default = no theme attr, uses built-in)
const THEMES = ['default', 'swiss', 'organic', 'kawaii'];
const MODES = ['light', 'dark'];

// Kill animations/transitions for deterministic screenshots
const FREEZE_CSS = `
  *, *::before, *::after {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
    scroll-behavior: auto !important;
    caret-color: transparent !important;
  }
`;

test.describe('Element visual regression', () => {
  for (const fixture of manifest) {
    for (const theme of THEMES) {
      for (const mode of MODES) {
        const testName = `${fixture.fixtureId}--${theme}--${mode}`;

        test(testName, async ({ page }) => {
          // Build URL with theme/mode params
          const params = new URLSearchParams();
          if (theme !== 'default') params.set('theme', theme);
          params.set('mode', mode);

          const url = `/tests/element-visual/fixtures/generated/${fixture.filename}?${params}`;
          await page.goto(url);
          await page.waitForLoadState('networkidle');

          // Freeze animations
          await page.addStyleTag({ content: FREEZE_CSS });
          await page.waitForTimeout(200);

          // Interactive fixtures (e.g. dialogs) render in the top layer,
          // so screenshot the dialog element itself rather than the container
          if (fixture.interactive) {
            const dialog = page.locator('dialog[open]');
            await expect(dialog).toBeVisible({ timeout: 5000 });
            await expect(dialog).toHaveScreenshot(`${testName}.png`, {
              maxDiffPixelRatio: 0.02,
            });
          } else {
            const target = page.locator('[data-fixture-target]');
            await expect(target).toBeVisible();
            await expect(target).toHaveScreenshot(`${testName}.png`, {
              maxDiffPixelRatio: 0.02,
            });
          }
        });
      }
    }
  }
});
