/**
 * Settings Panel Web Component Behavior Tests
 *
 * Tests lifecycle upgrade guard, trigger rendering, open/close behavior,
 * attribute reflection, keyboard dismissal, and reconnect safety.
 */

import { test, expect } from 'playwright/test';

const demoPage = '/docs/examples/demos/settings-panel-basic.html';

test.describe('settings-panel — baseline', () => {

  test('renders with data-upgraded attribute', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('settings-panel[data-upgraded]');

    const panel = page.locator('settings-panel');
    await expect(panel).toHaveAttribute('data-upgraded', '');
  });

  test('has a trigger button', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('settings-panel[data-upgraded]');

    const trigger = page.locator('settings-panel [data-trigger]');
    await expect(trigger).toHaveCount(1);
    await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  test('panel starts closed', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('settings-panel[data-upgraded]');

    const panel = page.locator('settings-panel');
    const isOpen = await panel.evaluate(el => el.hasAttribute('open'));
    expect(isOpen).toBe(false);
  });
});

test.describe('settings-panel — open/close', () => {

  test('trigger click opens the panel', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('settings-panel[data-upgraded]');

    const trigger = page.locator('settings-panel [data-trigger]');
    await trigger.click();
    await page.waitForTimeout(200);

    const panel = page.locator('settings-panel');
    await expect(panel).toHaveAttribute('open', '');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  test('trigger click toggles the panel closed', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('settings-panel[data-upgraded]');

    const trigger = page.locator('settings-panel [data-trigger]');

    // Open
    await trigger.click();
    await page.waitForTimeout(200);
    await expect(page.locator('settings-panel')).toHaveAttribute('open', '');

    // Close
    await trigger.click();
    await page.waitForTimeout(200);
    await expect(page.locator('settings-panel')).not.toHaveAttribute('open');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  test('open attribute is reflected when panel opens', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('settings-panel[data-upgraded]');

    const panel = page.locator('settings-panel');

    // Verify no open attribute initially
    await expect(panel).not.toHaveAttribute('open');

    // Open via trigger
    const trigger = page.locator('settings-panel [data-trigger]');
    await trigger.click();
    await page.waitForTimeout(200);

    // open attribute should now be reflected
    await expect(panel).toHaveAttribute('open', '');
  });

  test('Escape closes the panel', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('settings-panel[data-upgraded]');

    const trigger = page.locator('settings-panel [data-trigger]');
    const panel = page.locator('settings-panel');

    // Open
    await trigger.click();
    await page.waitForTimeout(200);
    await expect(panel).toHaveAttribute('open', '');

    // Press Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    // Should be closed
    await expect(panel).not.toHaveAttribute('open');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });
});

test.describe('settings-panel — lifecycle', () => {

  test('reconnect does not duplicate the panel DOM', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('settings-panel[data-upgraded]');

    const panelCount = await page.evaluate(() => {
      return new Promise(resolve => {
        const el = document.querySelector('settings-panel');
        const parent = el.parentElement;

        // Count panels before
        const before = el.querySelectorAll('.settings-panel').length;

        // Disconnect and reconnect
        parent.removeChild(el);
        parent.appendChild(el);

        // Wait for reconnect upgrade
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const after = el.querySelectorAll('.settings-panel').length;
            resolve({ before, after });
          });
        });
      });
    });

    expect(panelCount.before).toBe(1);
    expect(panelCount.after).toBe(1);
  });

  test('reconnected element still opens and closes', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('settings-panel[data-upgraded]');

    // Reconnect the element
    await page.evaluate(() => {
      const el = document.querySelector('settings-panel');
      const parent = el.parentElement;
      parent.removeChild(el);
      parent.appendChild(el);
    });

    // Wait for re-upgrade
    await page.waitForSelector('settings-panel[data-upgraded]');

    const trigger = page.locator('settings-panel [data-trigger]');
    const panel = page.locator('settings-panel');

    // Open
    await trigger.click();
    await page.waitForTimeout(200);
    await expect(panel).toHaveAttribute('open', '');

    // Close with Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    await expect(panel).not.toHaveAttribute('open');
  });
});
