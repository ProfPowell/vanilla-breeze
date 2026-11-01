/**
 * Homepage guardrails (vanilla-breeze-0qip).
 *
 * On 2026-11-01 a tab-set change and a gradient-text change broke the live
 * homepage (all three PE panels stacked; hero heading off-centre) while
 * every suite passed: tests/visual covers demos, not site pages. These
 * checks load the built homepage itself.
 */
import { test, expect } from 'playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('.pe-section tab-set[data-upgraded]');
});

test('hero heading is centred', async ({ page }) => {
  const offset = await page.evaluate(() => {
    const h1 = document.querySelector('.hero h1').getBoundingClientRect();
    const hero = document.querySelector('.hero').getBoundingClientRect();
    return Math.abs((h1.x + h1.width / 2) - (hero.x + hero.width / 2));
  });
  expect(offset).toBeLessThan(2);
});

test('PE tabs show one full-width panel at a time, in order', async ({ page }) => {
  const tabs = page.locator('.pe-section tab-set > details > summary');
  await expect(tabs).toHaveCount(3);
  for (const i of [0, 1, 2, 0]) {
    await tabs.nth(i).click();
    const panels = await page.locator('.pe-section tab-set').evaluate((ts) => {
      const host = ts.getBoundingClientRect();
      return [...ts.querySelectorAll(':scope > details')].map((d) => {
        const r = d.querySelector(':scope > :not(summary)').getBoundingClientRect();
        return { open: d.open, area: r.width * r.height, wide: r.width > host.width * 0.8 };
      });
    });
    panels.forEach((p, j) => {
      if (j === i) {
        expect(p.open, `tab ${i + 1} open`).toBe(true);
        expect(p.wide, `tab ${i + 1} panel spans the tab-set`).toBe(true);
      } else {
        expect(p.area, `tab ${j + 1} hidden while tab ${i + 1} is active`).toBe(0);
      }
    });
  }
});

test('no horizontal overflow on a phone', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'phone width only');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
