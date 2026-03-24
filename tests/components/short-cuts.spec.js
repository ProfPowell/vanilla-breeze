/**
 * Short-Cuts Web Component Behavior Tests
 *
 * Tests upgrade lifecycle, dialog creation, reconnect safety,
 * hotkey toggling, and shortcut entry rendering.
 */

import { test, expect } from 'playwright/test';

const demoPage = '/demos/examples/demos/short-cuts-basic.html';

test.describe('short-cuts — baseline', () => {

  test('renders with data-upgraded', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('short-cuts[data-upgraded]');

    const el = page.locator('short-cuts');
    await expect(el).toHaveAttribute('data-upgraded', '');
  });

  test('has a dialog element inside', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('short-cuts[data-upgraded]');

    const dialog = page.locator('short-cuts dialog');
    await expect(dialog).toHaveCount(1);
  });
});

test.describe('short-cuts — lifecycle', () => {

  test('reconnect does not duplicate dialog', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('short-cuts[data-upgraded]');

    // Remove and reinsert
    await page.evaluate(() => {
      const el = document.querySelector('short-cuts');
      const parent = el.parentElement;
      parent.removeChild(el);
      parent.appendChild(el);
    });

    await page.waitForSelector('short-cuts[data-upgraded]');

    const dialogCount = await page.evaluate(() => {
      return document.querySelectorAll('short-cuts dialog').length;
    });
    expect(dialogCount).toBe(1);
  });

  test('disconnect removes data-upgraded', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('short-cuts[data-upgraded]');

    const hasAttr = await page.evaluate(() => {
      const el = document.querySelector('short-cuts');
      const parent = el.parentElement;
      parent.removeChild(el);
      return el.hasAttribute('data-upgraded');
    });
    expect(hasAttr).toBe(false);
  });
});

test.describe('short-cuts — hotkey', () => {

  test('pressing ? opens the dialog', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('short-cuts[data-upgraded]');

    // Press Shift+? to open
    await page.keyboard.press('Shift+?');
    await page.waitForTimeout(200);

    const isOpen = await page.evaluate(() => {
      const dialog = document.querySelector('short-cuts dialog');
      return dialog?.open;
    });
    expect(isOpen).toBe(true);
  });

  test('pressing ? again closes the dialog', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('short-cuts[data-upgraded]');

    // Open
    await page.keyboard.press('Shift+?');
    await page.waitForTimeout(200);

    // Close
    await page.keyboard.press('Shift+?');
    await page.waitForTimeout(200);

    const isOpen = await page.evaluate(() => {
      const dialog = document.querySelector('short-cuts dialog');
      return dialog?.open;
    });
    expect(isOpen).toBe(false);
  });
});

test.describe('short-cuts — content', () => {

  test('dialog contains shortcut entries from the command registry', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('short-cuts[data-upgraded]');

    // Open the overlay to populate content
    await page.keyboard.press('Shift+?');
    await page.waitForTimeout(200);

    // Should always have the "General" group with the ? shortcut itself
    const generalGroup = page.locator('short-cuts dialog .shortcut-group');
    const groupCount = await generalGroup.count();
    expect(groupCount).toBeGreaterThanOrEqual(1);

    // Should have at least the "Show keyboard shortcuts" entry
    const rows = page.locator('short-cuts dialog .shortcut-row');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThanOrEqual(1);

    // Verify the self-referential entry exists
    const labels = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('short-cuts dialog .shortcut-label'))
        .map(el => el.textContent);
    });
    expect(labels).toContain('Show keyboard shortcuts');
  });

  test('dialog contains kbd badges for shortcuts', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('short-cuts[data-upgraded]');

    await page.keyboard.press('Shift+?');
    await page.waitForTimeout(200);

    const kbdCount = await page.locator('short-cuts dialog kbd.shortcut-kbd').count();
    expect(kbdCount).toBeGreaterThanOrEqual(1);
  });
});
