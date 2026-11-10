/**
 * Doc-site regions the demo and element suites never see.
 *
 * 0.6.0 shipped with the element and attribute indexes unstyled: their grids
 * are written by site/plugins/generate-indexes.js, not the template, and the
 * class clean-up renamed only the template's classes. The same release left
 * list-wrapped cards on the guide pages at uneven heights, the kitchen-sink
 * jump box unstyled and the tokens spacing chart stretched. Each region is
 * screenshotted here; the index pages also check that search and the type
 * filters still hide entries (they query the generated classes).
 */
import { test, expect } from './pinned-fonts.js';

const REGIONS = [
  ['elements-index', '/docs/elements/', 'nav[aria-label="All elements"] > :nth-child(-n+12)'],
  ['attributes-index', '/docs/attributes/', 'nav[aria-label="All attributes"] > :nth-child(-n+10)'],
  ['semantic-layouts-cards', '/docs/semantic-layouts/', 'ul[data-layout="grid"]'],
  ['kitchen-sink-jump', '/docs/examples/kitchen-sink/', 'nav[aria-labelledby="jump-to-section"]'],
  ['tokens-spacing', '/docs/tokens/', 'layout-stack:has(> token-scale)'],
  ['tutorial-hub-cards', '/docs/tutorial/', 'ol[data-layout="grid"]'],
  ['tutorial-pager', '/docs/tutorial/dashboard/', 'nav[aria-label="Tutorials"]'],
];

async function open(page, path) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(path, { waitUntil: 'networkidle' });
  // Fixed overlays (the kitchen sink's demo consent banner, the site's
  // settings button) would sit on top of the regions; keep them out.
  await page.addStyleTag({ content: 'consent-banner, site-tools, settings-panel { display: none !important; }' });
  await page.evaluate(() => document.fonts.ready);
}

test.describe('site index and guide regions', () => {
  for (const [id, path, selector] of REGIONS) {
    test(id, async ({ page }) => {
      await open(page, path);
      const region = page.locator(selector);
      await region.first().scrollIntoViewIfNeeded();
      // Several matches (the first rows of an index): shoot their bounding box.
      const boxes = await region.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().toJSON()));
      expect(boxes.length, `${selector} matched nothing`).toBeGreaterThan(0);
      const top = Math.min(...boxes.map((b) => b.top)) + await page.evaluate(() => scrollY);
      const bottom = Math.max(...boxes.map((b) => b.bottom)) + await page.evaluate(() => scrollY);
      const left = Math.min(...boxes.map((b) => b.left));
      const right = Math.max(...boxes.map((b) => b.right));
      await expect(page).toHaveScreenshot(`${id}.png`, {
        fullPage: true,
        clip: { x: left, y: top, width: right - left, height: bottom - top },
        animations: 'disabled',
        maxDiffPixelRatio: 0.01,
      });
    });
  }

  for (const [id, path, query] of [['elements', '/docs/elements/', 'dialog'], ['attributes', '/docs/attributes/', 'autocomplete']]) {
    test(`${id} index search and filters hide entries`, async ({ page }, info) => {
      test.skip(info.project.name !== 'desktop', 'behaviour; viewport-independent');
      await open(page, path);
      const visible = () => page.locator('.index-entry:visible').count();
      const all = await visible();
      expect(all).toBeGreaterThan(50);
      await page.fill('.index-search', query);
      await expect.poll(visible).toBeLessThan(10);
      await expect.poll(visible).toBeGreaterThan(0);
      await page.fill('.index-search', '');
      await expect.poll(visible).toBe(all);
      await page.locator('[data-filter]:not([data-filter="all"])').first().click({ force: true });
      await expect.poll(visible).toBeLessThan(all);
    });
  }
});
