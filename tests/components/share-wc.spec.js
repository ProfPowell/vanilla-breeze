/**
 * Share Web Component Behavior Tests
 *
 * Tests upgrade lifecycle, platform button rendering, reconnect safety,
 * and share event dispatching for the share-wc component.
 */

import { test, expect } from 'playwright/test';

const demoPage = '/demos/examples/demos/share-basic.html';

test.describe('share-wc', () => {

  test('renders with data-upgraded', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('share-wc[data-upgraded]');

    const upgraded = page.locator('share-wc[data-upgraded]');
    await expect(upgraded.first()).toBeVisible();
  });

  test('has share buttons visible (platform tier)', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('share-wc[data-upgraded]');

    // The second share-wc has tier="platforms" forced
    const platformShare = page.locator('share-wc[tier="platforms"]').first();
    await expect(platformShare).toBeVisible();

    const buttons = platformShare.locator('button[data-platform]');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('sets data-tier-resolved without overwriting tier attribute', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('share-wc[data-upgraded]');

    // The forced tier="platforms" element should keep its original tier attribute
    const el = page.locator('share-wc[tier="platforms"]').first();
    await expect(el).toHaveAttribute('tier', 'platforms');
    await expect(el).toHaveAttribute('data-tier-resolved', 'platforms');
  });

  test('reconnect does not duplicate nav or buttons', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(demoPage);
    await page.waitForSelector('share-wc[data-upgraded]');

    const el = page.locator('share-wc[tier="platforms"]').first();

    // Count buttons before
    const countBefore = await el.locator('button[data-platform]').count();

    // Remove and reinsert
    await el.evaluate(node => {
      const parent = node.parentElement;
      const next = node.nextSibling;
      node.remove();
      parent.insertBefore(node, next);
    });

    // Wait for re-upgrade
    await page.waitForSelector('share-wc[tier="platforms"][data-upgraded]');

    // Count buttons after — should be the same
    const countAfter = await el.locator('button[data-platform]').count();
    expect(countAfter).toBe(countBefore);

    // Count nav elements — should be exactly 1
    const navCount = await el.locator('nav').count();
    expect(navCount).toBe(1);

    expect(errors).toEqual([]);
  });

  test('click dispatches share-wc:open event', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('share-wc[data-upgraded]');

    const el = page.locator('share-wc[tier="platforms"]').first();

    // Listen for the share-wc:open event
    const eventPromise = el.evaluate(node => {
      return new Promise(resolve => {
        node.addEventListener('share-wc:open', (e) => {
          resolve(e.detail);
        }, { once: true });
      });
    });

    // Stub window.open so it doesn't actually open a window
    await page.evaluate(() => {
      window.open = () => null;
    });

    // Click the first non-copy platform button
    const btn = el.locator('button[data-platform]:not([data-platform="copy"])').first();
    await btn.click();

    const detail = await eventPromise;
    expect(detail.platform).toBeTruthy();
  });

  test('click dispatches share-wc:success event', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('share-wc[data-upgraded]');

    const el = page.locator('share-wc[tier="platforms"]').first();

    // Listen for the share-wc:success event
    const eventPromise = el.evaluate(node => {
      return new Promise(resolve => {
        node.addEventListener('share-wc:success', (e) => {
          resolve(e.detail);
        }, { once: true });
      });
    });

    // Stub window.open
    await page.evaluate(() => {
      window.open = () => null;
    });

    // Click the first non-copy platform button
    const btn = el.locator('button[data-platform]:not([data-platform="copy"])').first();
    await btn.click();

    const detail = await eventPromise;
    expect(detail.platform).toBeTruthy();
  });

  test('data-upgraded is removed on disconnect', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('share-wc[data-upgraded]');

    const el = page.locator('share-wc[tier="platforms"]').first();

    const hasUpgradedAfterRemove = await el.evaluate(node => {
      node.remove();
      return node.hasAttribute('data-upgraded');
    });

    expect(hasUpgradedAfterRemove).toBe(false);
  });

});
