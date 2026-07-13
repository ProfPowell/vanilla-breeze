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

// picsum.photos serves a different random photo per request — substitute a
// deterministic SVG at the requested size so screenshots are stable.
// (Migrating demos to local placeholders is tracked separately.)
test.beforeEach(async ({ page }) => {
  await page.route('**://*.picsum.photos/**', fulfillPlaceholder);
  await page.route('**://picsum.photos/**', fulfillPlaceholder);
});

function fulfillPlaceholder(route) {
  const m = /picsum\.photos\/(?:seed\/[\w-]+\/)?(\d+)(?:\/(\d+))?/.exec(route.request().url());
  const w = m?.[1] ?? 300;
  const h = m?.[2] ?? m?.[1] ?? 200;
  route.fulfill({
    contentType: 'image/svg+xml',
    body: `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="#b8bcc9"/><line x1="0" y1="0" x2="${w}" y2="${h}" stroke="#8e93a3"/><line x1="${w}" y1="0" x2="0" y2="${h}" stroke="#8e93a3"/></svg>`,
  });
}

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
