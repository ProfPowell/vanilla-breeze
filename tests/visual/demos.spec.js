/**
 * Visual Regression Tests for Demo Pages
 *
 * Auto-discovers all demo HTML files and generates a screenshot test for each.
 * Run: npx playwright test tests/visual/demos.spec.js
 * Update baselines: npx playwright test tests/visual/demos.spec.js --update-snapshots
 */

import { test, expect } from './pinned-fonts.js';
import { readdirSync, readFileSync } from 'fs';
import { basename, join, sep } from 'path';

const demosDir = join(import.meta.dirname, '../../demos/examples/demos');
const MERMAID_STUB = readFileSync(join(import.meta.dirname, '../element-visual/fixtures/static/mermaid-stub.mjs'), 'utf8');

// Demos whose rendering is nondeterministic at screenshot time —
// JS-driven animations or runtime-fetched content. Screenshot comparison
// is meaningless for them; behavior is covered by tests/components/.
const SKIP = new Set([
  'scramble-basic.html',           // rAF text-scramble animation
  'effects-kitchen-sink.html',     // contains a live scramble effect (same reason)
  'content-lens.html',             // renders from fetched /pages.json
  'markdown-viewer-mermaid.html',  // loads Mermaid + D3 from esm.sh at runtime
  'scroll-effects-gallery.html',   // scroll-driven animations settle nondeterministically
  'activity-feed-dashboard.html',  // relative-time badges change with the wall clock
  'mock-portraits.html',           // faces load from a remote portrait CDN; a slow or failed image shifts the page
]);

// Recursive: tutorial/, view-transitions/, quick-start/ and raw-layouts/
// were invisible to the suite before vanilla-breeze-lmyl. Paths use '/'
// on every platform so test titles and SKIP entries are stable.
const demos = readdirSync(demosDir, { recursive: true })
  .map(f => String(f).split(sep).join('/'))
  .filter(f => f.endsWith('.html') && !basename(f).startsWith('_') && !SKIP.has(f))
  .sort();

// Baselines stay flat: 'tutorial/dashboard.html' → 'tutorial--dashboard.html.png'.
const baselineName = (demo) => `${demo.replaceAll('/', '--')}.png`;

for (const demo of demos) {
  test(`visual: ${demo}`, async ({ page }) => {
    // Pin the clock: calendars and anything that renders "today" otherwise
    // drift away from their baseline every month (t5r2). The date is the
    // one the original baselines were captured on.
    await page.clock.setFixedTime(new Date('2026-07-06T12:00:00'));
    // diagram-wc loads Mermaid from jsDelivr; serve the deterministic local
    // stub instead so diagram demos don't depend on the network or on
    // Mermaid's layout engine version.
    await page.route('**/npm/mermaid@*/**', (route) => route.fulfill({
      contentType: 'text/javascript',
      body: MERMAID_STUB,
    }));
    await page.goto(`/docs/examples/demos/${demo}`);
    await page.waitForLoadState('networkidle');

    // Screenshot only after web fonts settle — a font swap mid-capture
    // produces massive spurious diffs.
    await page.evaluate(() => document.fonts.ready);

    // Wait for web components to initialize
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot(baselineName(demo), {
      fullPage: true,
      maxDiffPixelRatio: 0.01,
    });
  });
}
