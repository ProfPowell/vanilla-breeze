/**
 * Progressive Enhancement Tests
 *
 * Verifies that components degrade gracefully without JavaScript.
 * Uses details/summary native behavior as the baseline.
 */

import { test, expect } from 'playwright/test';

test.describe('Progressive Enhancement', () => {

  test('accordion works without JS (details/summary)', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();

    await page.goto('/docs/examples/demos/accordion-basic.html');
    await page.waitForLoadState('domcontentloaded');

    // details/summary works natively without JS
    const firstSummary = page.locator('details summary').first();
    const firstDetails = page.locator('details').first();

    await firstSummary.click();
    await expect(firstDetails).toHaveAttribute('open', '');

    await context.close();
  });

  test('tabs degrade to details/summary without JS', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();

    await page.goto('/docs/examples/demos/tabs-basic.html');
    await page.waitForLoadState('domcontentloaded');

    // Without JS, tabs-wc falls back to details/summary
    const details = page.locator('details');
    const count = await details.count();
    expect(count).toBeGreaterThan(0);

    // Content should still be accessible
    const firstDetails = details.first();
    await expect(firstDetails).toHaveAttribute('open', '');

    await context.close();
  });

  test('page content is visible without JS', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();

    await page.goto('/docs/examples/demos/accordion-basic.html');
    await page.waitForLoadState('domcontentloaded');

    // Summary text should be visible
    const summaryText = await page.locator('summary').first().textContent();
    expect(summaryText.length).toBeGreaterThan(0);

    await context.close();
  });

});
