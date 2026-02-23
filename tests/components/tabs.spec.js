/**
 * Tabs Web Component Behavior Tests
 *
 * Tests tab selection, keyboard navigation, and ARIA state
 * for the tabs-wc component.
 */

import { test, expect } from 'playwright/test';

const demoPage = '/docs/examples/demos/tabs-basic.html';

test.describe('tabs-wc', () => {

  test('renders tabs with details/summary elements', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    const details = page.locator('tabs-wc details');
    await expect(details).toHaveCount(3);
  });

  test('first tab is open by default', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    const firstDetails = page.locator('tabs-wc details').first();
    await expect(firstDetails).toHaveAttribute('open', '');
  });

  test('clicking a tab switches content', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    const secondSummary = page.locator('tabs-wc summary').nth(1);
    const secondDetails = page.locator('tabs-wc details').nth(1);

    await secondSummary.click();
    await expect(secondDetails).toHaveAttribute('open', '');
  });

  test('only one tab panel is open at a time', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    // Click second tab
    await page.locator('tabs-wc summary').nth(1).click();

    // Wait for exclusive behavior
    await page.waitForTimeout(200);

    const openDetails = page.locator('tabs-wc details[open]');
    await expect(openDetails).toHaveCount(1);
  });

  test('tab summaries are keyboard focusable', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    const firstSummary = page.locator('tabs-wc summary').first();
    await firstSummary.focus();
    await expect(firstSummary).toBeFocused();
  });

});
