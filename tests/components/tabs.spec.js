/**
 * Tabs Web Component Behavior Tests
 *
 * Tests tab selection, keyboard navigation, ARIA state,
 * and lifecycle safety for the tab-set component.
 */

import { test, expect } from 'playwright/test';

const demoPage = '/docs/examples/demos/tabs-basic.html';

test.describe('tab-set — baseline', () => {

  test('renders tabs with details/summary elements', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('tab-set[data-upgraded]');

    const details = page.locator('tab-set details');
    await expect(details).toHaveCount(3);
  });

  test('first tab is open by default', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('tab-set[data-upgraded]');

    const firstDetails = page.locator('tab-set details').first();
    await expect(firstDetails).toHaveAttribute('open', '');
  });

  test('clicking a tab switches content', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('tab-set[data-upgraded]');

    const secondSummary = page.locator('tab-set summary').nth(1);
    const secondDetails = page.locator('tab-set details').nth(1);

    await secondSummary.click();
    await expect(secondDetails).toHaveAttribute('open', '');
  });

  test('only one tab panel is open at a time', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('tab-set[data-upgraded]');

    // Click second tab
    await page.locator('tab-set summary').nth(1).click();

    // Wait for exclusive behavior
    await page.waitForTimeout(200);

    const openDetails = page.locator('tab-set details[open]');
    await expect(openDetails).toHaveCount(1);
  });

  test('tab summaries are keyboard focusable', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('tab-set[data-upgraded]');

    const firstSummary = page.locator('tab-set summary').first();
    await firstSummary.focus();
    await expect(firstSummary).toBeFocused();
  });

});

test.describe('tab-set — ARIA contracts', () => {

  test('summary has aria-controls pointing to panel', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('tab-set[data-upgraded]');

    const summary = page.locator('tab-set summary').first();
    const controlsId = await summary.getAttribute('aria-controls');
    expect(controlsId).toBeTruthy();

    const panel = page.locator(`#${controlsId}`);
    await expect(panel).toHaveCount(1);
  });

  test('panel has aria-labelledby pointing to summary', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('tab-set[data-upgraded]');

    const summary = page.locator('tab-set summary').first();
    const summaryId = await summary.getAttribute('id');

    const controlsId = await summary.getAttribute('aria-controls');
    const panel = page.locator(`#${controlsId}`);

    await expect(panel).toHaveAttribute('aria-labelledby', summaryId);
  });

  test('aria-expanded reflects open state', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('tab-set[data-upgraded]');

    const summaries = page.locator('tab-set summary');

    // First tab is open — should be expanded
    await expect(summaries.first()).toHaveAttribute('aria-expanded', 'true');
    await expect(summaries.nth(1)).toHaveAttribute('aria-expanded', 'false');
    await expect(summaries.nth(2)).toHaveAttribute('aria-expanded', 'false');

    // Switch to second tab
    await summaries.nth(1).click();
    await page.waitForTimeout(200);

    await expect(summaries.first()).toHaveAttribute('aria-expanded', 'false');
    await expect(summaries.nth(1)).toHaveAttribute('aria-expanded', 'true');
    await expect(summaries.nth(2)).toHaveAttribute('aria-expanded', 'false');
  });

  test('tabindex follows roving pattern', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('tab-set[data-upgraded]');

    const summaries = page.locator('tab-set summary');

    // Active tab gets tabindex 0, inactive get -1
    await expect(summaries.first()).toHaveAttribute('tabindex', '0');
    await expect(summaries.nth(1)).toHaveAttribute('tabindex', '-1');
    await expect(summaries.nth(2)).toHaveAttribute('tabindex', '-1');

    // Switch to second tab
    await summaries.nth(1).click();
    await page.waitForTimeout(200);

    await expect(summaries.first()).toHaveAttribute('tabindex', '-1');
    await expect(summaries.nth(1)).toHaveAttribute('tabindex', '0');
    await expect(summaries.nth(2)).toHaveAttribute('tabindex', '-1');
  });

  test('no role overrides on native elements', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('tab-set[data-upgraded]');

    const tabset = page.locator('tab-set');
    const summary = page.locator('tab-set summary').first();
    const controlsId = await summary.getAttribute('aria-controls');
    const panel = page.locator(`#${controlsId}`);

    // The runtime must NOT set role="tablist", role="tab", or role="tabpanel"
    await expect(tabset).not.toHaveAttribute('role');
    await expect(summary).not.toHaveAttribute('role');
    await expect(panel).not.toHaveAttribute('role');
  });

});

test.describe('tab-set — keyboard navigation', () => {

  test('ArrowRight moves focus to next tab', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('tab-set[data-upgraded]');

    const summaries = page.locator('tab-set summary');
    await summaries.first().focus();
    await page.keyboard.press('ArrowRight');

    await expect(summaries.nth(1)).toBeFocused();
  });

  test('ArrowLeft moves focus to previous tab', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('tab-set[data-upgraded]');

    const summaries = page.locator('tab-set summary');
    await summaries.nth(1).focus();
    await page.keyboard.press('ArrowLeft');

    await expect(summaries.first()).toBeFocused();
  });

  test('ArrowRight wraps from last to first', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('tab-set[data-upgraded]');

    const summaries = page.locator('tab-set summary');
    await summaries.last().focus();
    await page.keyboard.press('ArrowRight');

    await expect(summaries.first()).toBeFocused();
  });

  test('Home moves focus to first tab', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('tab-set[data-upgraded]');

    const summaries = page.locator('tab-set summary');
    await summaries.last().focus();
    await page.keyboard.press('Home');

    await expect(summaries.first()).toBeFocused();
  });

  test('End moves focus to last tab', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('tab-set[data-upgraded]');

    const summaries = page.locator('tab-set summary');
    await summaries.first().focus();
    await page.keyboard.press('End');

    await expect(summaries.last()).toBeFocused();
  });

});

test.describe('tab-set — lifecycle', () => {

  test('reconnect does not duplicate events', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('tab-set[data-upgraded]');

    const counts = await page.evaluate(() => {
      return new Promise(resolve => {
        const tabset = document.querySelector('tab-set');

        // Measure baseline event count (no reconnect)
        let baseline = 0;
        const baselineHandler = () => baseline++;
        tabset.addEventListener('tab-set:change', baselineHandler);

        const summaries = tabset.querySelectorAll('summary');
        summaries[1].click();

        setTimeout(() => {
          tabset.removeEventListener('tab-set:change', baselineHandler);

          // Reset to first tab
          summaries[0].click();

          setTimeout(() => {
            // Disconnect and reconnect
            const parent = tabset.parentElement;
            parent.removeChild(tabset);
            parent.appendChild(tabset);

            // Wait for reconnect upgrade
            requestAnimationFrame(() => {
              let afterReconnect = 0;
              tabset.addEventListener('tab-set:change', () => afterReconnect++);

              // Click second summary again
              const newSummaries = tabset.querySelectorAll('summary');
              newSummaries[1].click();

              setTimeout(() => resolve({ baseline, afterReconnect }), 200);
            });
          }, 200);
        }, 200);
      });
    });

    // After reconnect, event count should equal baseline (no duplicates)
    expect(counts.afterReconnect).toBe(counts.baseline);
  });

  test('reconnect restores keyboard navigation', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('tab-set[data-upgraded]');

    // Reconnect the element
    await page.evaluate(() => {
      const tabset = document.querySelector('tab-set');
      const parent = tabset.parentElement;
      parent.removeChild(tabset);
      parent.appendChild(tabset);
    });

    // Wait for re-upgrade
    await page.waitForSelector('tab-set[data-upgraded]');

    const summaries = page.locator('tab-set summary');
    await summaries.first().focus();
    await page.keyboard.press('ArrowRight');

    await expect(summaries.nth(1)).toBeFocused();
  });

});
