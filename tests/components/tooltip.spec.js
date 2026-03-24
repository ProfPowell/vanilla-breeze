/**
 * Tooltip Web Component Behavior Tests
 *
 * Tests lifecycle (upgrade, cleanup, reconnect) and title preservation
 * for the tool-tip component.
 */

import { test, expect } from 'playwright/test';

const titleFallbackPage = '/docs/examples/demos/tooltip-title-fallback.html';

/** Wait for tool-tip WC to initialize */
async function waitForUpgrade(page) {
  await page.waitForSelector('tool-tip[data-upgraded]', { timeout: 5000 });
}

test.describe('tool-tip', () => {

  test('renders with data-upgraded attribute', async ({ page }) => {
    await page.goto(titleFallbackPage);
    await waitForUpgrade(page);

    const upgraded = await page.evaluate(() => {
      const tt = document.querySelector('tool-tip');
      return tt?.hasAttribute('data-upgraded');
    });
    expect(upgraded).toBe(true);
  });

  test('trigger has no title attribute after upgrade', async ({ page }) => {
    await page.goto(titleFallbackPage);
    await waitForUpgrade(page);

    const result = await page.evaluate(() => {
      const tt = document.querySelector('tool-tip');
      const trigger = tt?.querySelector(':scope > :not(template):not([popover])');
      return {
        hasTitle: trigger?.hasAttribute('title'),
        tagName: trigger?.tagName,
      };
    });
    expect(result.hasTitle).toBe(false);
    expect(result.tagName).toBe('BUTTON');
  });

  test('tooltip popover element is created inside tool-tip', async ({ page }) => {
    await page.goto(titleFallbackPage);
    await waitForUpgrade(page);

    const result = await page.evaluate(() => {
      const tt = document.querySelector('tool-tip');
      const popover = tt?.querySelector('[role="tooltip"][popover]');
      return {
        exists: !!popover,
        hasId: !!popover?.id,
      };
    });
    expect(result.exists).toBe(true);
    expect(result.hasId).toBe(true);
  });

  test('tooltip is hidden by default', async ({ page }) => {
    await page.goto(titleFallbackPage);
    await waitForUpgrade(page);

    const popover = page.locator('tool-tip [role="tooltip"]');
    await expect(popover.first()).not.toBeVisible();
  });

  test('reconnect does not duplicate tooltip elements', async ({ page }) => {
    await page.goto(titleFallbackPage);
    await waitForUpgrade(page);

    const tooltipCount = await page.evaluate(async () => {
      const tt = document.querySelector('tool-tip');
      const parent = tt.parentElement;

      // Disconnect
      tt.remove();
      // Allow microtask
      await new Promise(r => setTimeout(r, 0));

      // Reconnect
      parent.appendChild(tt);
      // Wait for connectedCallback to fire
      await new Promise(r => setTimeout(r, 50));

      // Count tooltip popovers inside
      return tt.querySelectorAll('[role="tooltip"]').length;
    });
    expect(tooltipCount).toBe(1);
  });

  test('reconnect restores original title on the trigger', async ({ page }) => {
    await page.goto(titleFallbackPage);
    await waitForUpgrade(page);

    const result = await page.evaluate(async () => {
      const tt = document.querySelector('tool-tip');
      const trigger = tt.querySelector(':scope > button');
      const parent = tt.parentElement;

      // Verify title is removed after upgrade
      const titleBeforeDisconnect = trigger.getAttribute('title');

      // Disconnect
      tt.remove();
      await new Promise(r => setTimeout(r, 0));

      // Title should be restored after disconnect
      const titleAfterDisconnect = trigger.getAttribute('title');

      // Reconnect
      parent.appendChild(tt);
      await new Promise(r => setTimeout(r, 50));

      // Title should be removed again after re-upgrade
      const titleAfterReconnect = trigger.getAttribute('title');

      return {
        titleBeforeDisconnect,
        titleAfterDisconnect,
        titleAfterReconnect,
      };
    });

    // Before disconnect: title should be removed (moved to tooltip)
    expect(result.titleBeforeDisconnect).toBeNull();
    // After disconnect: title should be restored
    expect(result.titleAfterDisconnect).toBeTruthy();
    // After reconnect: title should be removed again
    expect(result.titleAfterReconnect).toBeNull();
  });

  test('data-upgraded is removed on disconnect', async ({ page }) => {
    await page.goto(titleFallbackPage);
    await waitForUpgrade(page);

    const result = await page.evaluate(async () => {
      const tt = document.querySelector('tool-tip');
      const parent = tt.parentElement;

      // Disconnect
      tt.remove();
      await new Promise(r => setTimeout(r, 0));

      const upgradedAfterDisconnect = tt.hasAttribute('data-upgraded');

      // Reconnect (restore DOM)
      parent.appendChild(tt);
      await new Promise(r => setTimeout(r, 50));

      const upgradedAfterReconnect = tt.hasAttribute('data-upgraded');

      return { upgradedAfterDisconnect, upgradedAfterReconnect };
    });

    expect(result.upgradedAfterDisconnect).toBe(false);
    expect(result.upgradedAfterReconnect).toBe(true);
  });

});
