/**
 * Accordion Web Component Behavior Tests
 *
 * Tests interactive behavior, keyboard navigation, and ARIA state
 * for the accordion-wc component.
 */

import { test, expect } from 'playwright/test';

const demoPage = '/demos/examples/demos/accordion-basic.html';

test.describe('accordion-wc', () => {

  test('renders accordion with details/summary elements', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    const details = page.locator('accordion-wc details');
    await expect(details).toHaveCount(3);

    const summaries = page.locator('accordion-wc summary');
    await expect(summaries).toHaveCount(3);
  });

  test('click expands and collapses sections', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    const firstDetails = page.locator('accordion-wc details').first();
    const firstSummary = page.locator('accordion-wc summary').first();

    // Click to open
    await firstSummary.click();
    await expect(firstDetails).toHaveAttribute('open', '');

    // Click to close
    await firstSummary.click();
    await expect(firstDetails).not.toHaveAttribute('open', '');
  });

  test('keyboard Enter toggles section', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    const firstSummary = page.locator('accordion-wc summary').first();
    const firstDetails = page.locator('accordion-wc details').first();

    await firstSummary.focus();
    await page.keyboard.press('Enter');
    await expect(firstDetails).toHaveAttribute('open', '');

    await page.keyboard.press('Enter');
    await expect(firstDetails).not.toHaveAttribute('open', '');
  });

  test('keyboard Space toggles section', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    const firstSummary = page.locator('accordion-wc summary').first();
    const firstDetails = page.locator('accordion-wc details').first();

    await firstSummary.focus();
    await page.keyboard.press('Space');
    await expect(firstDetails).toHaveAttribute('open', '');
  });

  test('content is visible when details is open', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    const firstSummary = page.locator('accordion-wc summary').first();
    const firstContent = page.locator('accordion-wc details').first().locator('p');

    await firstSummary.click();
    await expect(firstContent).toBeVisible();
  });

});
