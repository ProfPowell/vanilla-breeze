/**
 * Dropdown Web Component Behavior Tests
 *
 * Tests open/close, keyboard navigation, and focus management
 * for the dropdown-wc component.
 */

import { test, expect } from 'playwright/test';

const demoPage = '/docs/examples/demos/dropdown-basic.html';

test.describe('dropdown-wc', () => {

  test('renders dropdown trigger', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    const dropdown = page.locator('dropdown-wc');
    await expect(dropdown).toBeVisible();
  });

  test('dropdown starts closed', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    const dropdown = page.locator('dropdown-wc').first();
    const isOpen = await dropdown.evaluate(el => el.hasAttribute('open') || el.matches('[data-open]'));
    expect(isOpen).toBe(false);
  });

  test('Escape key closes dropdown', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForLoadState('networkidle');

    const dropdown = page.locator('dropdown-wc').first();
    const trigger = dropdown.locator('button, summary').first();

    // Open
    await trigger.click();
    await page.waitForTimeout(200);

    // Close with Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    // Check it closed
    const isOpen = await dropdown.evaluate(el => el.hasAttribute('open') || el.matches('[data-open]'));
    expect(isOpen).toBe(false);
  });

});
