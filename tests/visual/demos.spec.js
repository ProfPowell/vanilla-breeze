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

// Demos whose rendering is nondeterministic at screenshot time —
// JS-driven animations or runtime-fetched content. Screenshot comparison
// is meaningless for them; behavior is covered by tests/components/.
const SKIP = new Set([
  'scramble-basic.html',           // rAF text-scramble animation
  'content-lens.html',             // renders from fetched /pages.json
  'scroll-effects-gallery.html',   // scroll-driven animations settle nondeterministically
  'activity-feed-dashboard.html',  // relative-time badges change with the wall clock
]);

const demos = readdirSync(demosDir)
  .filter(f => f.endsWith('.html') && !f.startsWith('_') && !SKIP.has(f))
  .sort();

for (const demo of demos) {
  test(`visual: ${demo}`, async ({ page }) => {
    await page.goto(`/docs/examples/demos/${demo}`);
    await page.waitForLoadState('networkidle');

    // Screenshot only after web fonts settle — a font swap mid-capture
    // produces massive spurious diffs.
    await page.evaluate(() => document.fonts.ready);

    // Wait for web components to initialize
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot(`${demo}.png`, {
      fullPage: true,
      maxDiffPixelRatio: 0.01,
    });
  });
}
