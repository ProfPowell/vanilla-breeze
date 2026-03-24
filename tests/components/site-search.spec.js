/**
 * Site Search Web Component Behavior Tests
 *
 * Tests upgrade lifecycle, trigger interaction, open/close overlay,
 * keyboard shortcuts, reconnect safety, and body scroll restoration.
 */

import { test, expect } from 'playwright/test';

const demoPage = '/demos/examples/demos/site-search-basic.html';

test.describe('site-search', () => {

  test('renders with data-upgraded', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('site-search[data-upgraded]');

    const search = page.locator('site-search');
    await expect(search).toHaveAttribute('data-upgraded', '');
  });

  test('has a trigger button', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('site-search[data-upgraded]');

    const trigger = page.locator('site-search button[data-trigger]');
    await expect(trigger).toBeVisible();
  });

  test('clicking trigger opens the search overlay', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('site-search[data-upgraded]');

    const search = page.locator('site-search');
    const trigger = search.locator('button[data-trigger]');

    await trigger.click();
    await expect(search).toHaveAttribute('open', '');
  });

  test('Escape closes the overlay', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('site-search[data-upgraded]');

    const search = page.locator('site-search');
    const trigger = search.locator('button[data-trigger]');

    // Open the overlay
    await trigger.click();
    await expect(search).toHaveAttribute('open', '');

    // Close with Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    const isOpen = await search.evaluate(el => el.hasAttribute('open'));
    expect(isOpen).toBe(false);
  });

  test('reconnect does not duplicate overlay DOM', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('site-search[data-upgraded]');

    const search = page.locator('site-search');

    // Remove and reinsert
    await search.evaluate(el => {
      const parent = el.parentElement;
      el.remove();
      parent.appendChild(el);
    });

    // Wait for re-upgrade
    await page.waitForSelector('site-search[data-upgraded]');

    // Should have exactly one dialog overlay, not two
    const dialogCount = await search.evaluate(
      el => el.querySelectorAll('.dialog').length
    );
    expect(dialogCount).toBe(1);
  });

  test('body scroll is restored after close', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('site-search[data-upgraded]');

    const search = page.locator('site-search');
    const trigger = search.locator('button[data-trigger]');

    // Open — body should be scroll-locked
    await trigger.click();
    await expect(search).toHaveAttribute('open', '');

    const overflowWhileOpen = await page.evaluate(() => document.body.style.overflow);
    expect(overflowWhileOpen).toBe('hidden');

    // Close — body scroll should be restored
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    const overflowAfterClose = await page.evaluate(() => document.body.style.overflow);
    expect(overflowAfterClose).toBe('');
  });

});
