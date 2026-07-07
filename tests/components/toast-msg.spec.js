/**
 * Toast Msg Web Component Behavior Tests
 *
 * Tests lifecycle, show/dismiss, auto-dismiss timing,
 * dismissAll, and reconnect safety.
 */

import { test, expect } from 'playwright/test';

const demoPage = '/docs/examples/demos/toast-basic.html';

test.describe('toast-msg — baseline', () => {

  test('renders with data-upgraded', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('toast-msg[data-upgraded]', { state: 'attached' });

    const toast = page.locator('toast-msg');
    await expect(toast).toHaveAttribute('data-upgraded', '');
    await expect(toast).toHaveAttribute('role', 'region');
    await expect(toast).toHaveAttribute('aria-label', 'Notifications');
  });

  test('show() creates a visible toast', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('toast-msg[data-upgraded]', { state: 'attached' });

    await page.evaluate(() => {
      document.querySelector('toast-msg').show({
        message: 'Test toast',
        variant: 'info',
        duration: 0
      });
    });

    const toastEl = page.locator('toast-msg .toast');
    await expect(toastEl).toHaveCount(1);
    await expect(toastEl).toHaveAttribute('data-state', 'visible');
  });

  test('toast auto-dismisses after duration', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('toast-msg[data-upgraded]', { state: 'attached' });

    await page.evaluate(() => {
      document.querySelector('toast-msg').show({
        message: 'Auto dismiss',
        variant: 'success',
        duration: 500
      });
    });

    const toastEl = page.locator('toast-msg .toast');
    await expect(toastEl).toHaveCount(1);

    // Wait for auto-dismiss (500ms duration + 300ms animation fallback + buffer)
    await expect(toastEl).toHaveCount(0, { timeout: 3000 });
  });

  test('dismissAll() clears all toasts', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('toast-msg[data-upgraded]', { state: 'attached' });

    // Show multiple toasts
    await page.evaluate(() => {
      const tm = document.querySelector('toast-msg');
      tm.show({ message: 'Toast 1', variant: 'info', duration: 0 });
      tm.show({ message: 'Toast 2', variant: 'success', duration: 0 });
      tm.show({ message: 'Toast 3', variant: 'warning', duration: 0 });
    });

    await expect(page.locator('toast-msg .toast')).toHaveCount(3);

    await page.evaluate(() => {
      document.querySelector('toast-msg').dismissAll();
    });

    // Wait for animation fallback to clear them
    await expect(page.locator('toast-msg .toast')).toHaveCount(0, { timeout: 3000 });
  });
});

test.describe('toast-msg — lifecycle', () => {

  test('reconnect preserves functionality', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('toast-msg[data-upgraded]', { state: 'attached' });

    // Disconnect and reconnect
    await page.evaluate(() => {
      const tm = document.querySelector('toast-msg');
      const parent = tm.parentElement;
      parent.removeChild(tm);
      parent.appendChild(tm);
    });

    // Wait for re-upgrade
    await page.waitForSelector('toast-msg[data-upgraded]', { state: 'attached' });

    // Verify show() still works after reconnect
    await page.evaluate(() => {
      document.querySelector('toast-msg').show({
        message: 'After reconnect',
        variant: 'info',
        duration: 0
      });
    });

    const toastEl = page.locator('toast-msg .toast');
    await expect(toastEl).toHaveCount(1);
    await expect(toastEl).toHaveAttribute('data-state', 'visible');
  });
});
