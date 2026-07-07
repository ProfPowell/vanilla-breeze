/**
 * Accordion Web Component Behavior Tests
 *
 * Tests interactive behavior, keyboard navigation, ARIA state,
 * lifecycle safety, single-open mode, and multi-sibling content.
 */

import { test, expect } from 'playwright/test';

const demoPage = '/docs/examples/demos/accordion-basic.html';
const singlePage = '/docs/snippets/demos/accordion-exclusive.html';

test.describe('accordion-wc — baseline', () => {

  test('renders accordion with details/summary elements', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('accordion-wc[data-upgraded]');

    const details = page.locator('accordion-wc details');
    await expect(details).toHaveCount(3);

    const summaries = page.locator('accordion-wc summary');
    await expect(summaries).toHaveCount(3);
  });

  test('click expands and collapses sections', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('accordion-wc[data-upgraded]');

    const firstDetails = page.locator('accordion-wc details').first();
    const firstSummary = page.locator('accordion-wc summary').first();

    await firstSummary.click();
    await expect(firstDetails).toHaveAttribute('open', '');

    await firstSummary.click();
    await expect(firstDetails).not.toHaveAttribute('open');
  });

  test('keyboard Enter toggles section', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('accordion-wc[data-upgraded]');

    const firstSummary = page.locator('accordion-wc summary').first();
    const firstDetails = page.locator('accordion-wc details').first();

    await firstSummary.focus();
    await page.keyboard.press('Enter');
    await expect(firstDetails).toHaveAttribute('open', '');

    await page.keyboard.press('Enter');
    await expect(firstDetails).not.toHaveAttribute('open');
  });

  test('content is visible when details is open', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('accordion-wc[data-upgraded]');

    const firstSummary = page.locator('accordion-wc summary').first();
    const firstContent = page.locator('accordion-wc details').first().locator('p');

    await firstSummary.click();
    await expect(firstContent.first()).toBeVisible();
  });
});

test.describe('accordion-wc — ARIA contracts', () => {

  test('summary has aria-expanded reflecting open state', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('accordion-wc[data-upgraded]');

    const summary = page.locator('accordion-wc summary').first();
    const details = page.locator('accordion-wc details').first();

    await expect(summary).toHaveAttribute('aria-expanded', 'false');

    await summary.click();
    await expect(summary).toHaveAttribute('aria-expanded', 'true');

    await summary.click();
    await expect(summary).toHaveAttribute('aria-expanded', 'false');
  });

  test('summary has aria-controls pointing to panel', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('accordion-wc[data-upgraded]');

    const summary = page.locator('accordion-wc summary').first();
    const controlsId = await summary.getAttribute('aria-controls');
    expect(controlsId).toBeTruthy();

    const panel = page.locator(`#${controlsId}`);
    await expect(panel).toHaveCount(1);
  });

  test('panel has role=region and aria-labelledby', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('accordion-wc[data-upgraded]');

    const summary = page.locator('accordion-wc summary').first();
    const summaryId = await summary.getAttribute('id');

    const controlsId = await summary.getAttribute('aria-controls');
    const panel = page.locator(`#${controlsId}`);

    await expect(panel).toHaveAttribute('role', 'region');
    await expect(panel).toHaveAttribute('aria-labelledby', summaryId);
  });
});

test.describe('accordion-wc — keyboard navigation', () => {

  test('ArrowDown moves focus to next summary', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('accordion-wc[data-upgraded]');

    const summaries = page.locator('accordion-wc summary');
    await summaries.first().focus();
    await page.keyboard.press('ArrowDown');

    await expect(summaries.nth(1)).toBeFocused();
  });

  test('ArrowUp moves focus to previous summary', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('accordion-wc[data-upgraded]');

    const summaries = page.locator('accordion-wc summary');
    await summaries.nth(1).focus();
    await page.keyboard.press('ArrowUp');

    await expect(summaries.first()).toBeFocused();
  });

  test('ArrowDown wraps from last to first', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('accordion-wc[data-upgraded]');

    const summaries = page.locator('accordion-wc summary');
    await summaries.last().focus();
    await page.keyboard.press('ArrowDown');

    await expect(summaries.first()).toBeFocused();
  });

  test('Home moves focus to first summary', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('accordion-wc[data-upgraded]');

    const summaries = page.locator('accordion-wc summary');
    await summaries.last().focus();
    await page.keyboard.press('Home');

    await expect(summaries.first()).toBeFocused();
  });

  test('End moves focus to last summary', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('accordion-wc[data-upgraded]');

    const summaries = page.locator('accordion-wc summary');
    await summaries.first().focus();
    await page.keyboard.press('End');

    await expect(summaries.last()).toBeFocused();
  });
});

test.describe('accordion-wc — single-open mode', () => {

  test('opening one panel closes others in single mode', async ({ page }) => {
    await page.goto(singlePage);
    await page.waitForSelector('accordion-wc[data-upgraded]');

    const accordion = page.locator('accordion-wc[single]').first();
    if (await accordion.count() === 0) return;

    const details = accordion.locator('details');
    const summaries = accordion.locator('summary');

    // Open first
    await summaries.first().click();
    await expect(details.first()).toHaveAttribute('open', '');

    // Open second — first should close
    await summaries.nth(1).click();
    await expect(details.nth(1)).toHaveAttribute('open', '');
    await expect(details.first()).not.toHaveAttribute('open');
  });
});

test.describe('accordion-wc — lifecycle', () => {

  test('reconnect does not duplicate toggle events', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('accordion-wc[data-upgraded]');

    const eventCount = await page.evaluate(() => {
      return new Promise(resolve => {
        const accordion = document.querySelector('accordion-wc');
        const parent = accordion.parentElement;

        // Disconnect and reconnect
        parent.removeChild(accordion);
        parent.appendChild(accordion);

        // Wait for reconnect upgrade
        requestAnimationFrame(() => {
          let count = 0;
          accordion.addEventListener('accordion-wc:toggle', () => count++);

          // Click first summary
          const summary = accordion.querySelector('summary');
          summary.click();

          // Let toggle events settle
          setTimeout(() => resolve(count), 200);
        });
      });
    });

    expect(eventCount).toBe(1);
  });

  test('reconnect restores keyboard navigation', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('accordion-wc[data-upgraded]');

    // Reconnect the element
    await page.evaluate(() => {
      const accordion = document.querySelector('accordion-wc');
      const parent = accordion.parentElement;
      parent.removeChild(accordion);
      parent.appendChild(accordion);
    });

    // Wait for re-upgrade
    await page.waitForSelector('accordion-wc[data-upgraded]');

    const summaries = page.locator('accordion-wc summary');
    await summaries.first().focus();
    await page.keyboard.press('ArrowDown');

    await expect(summaries.nth(1)).toBeFocused();
  });
});

test.describe('accordion-wc — multi-sibling content', () => {

  test('details with multiple children after summary still upgrades', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('accordion-wc[data-upgraded]');

    // Inject a multi-sibling details into the accordion
    const hasPanel = await page.evaluate(() => {
      const accordion = document.querySelector('accordion-wc');
      const details = document.createElement('details');
      details.innerHTML = `
        <summary>Multi-child test</summary>
        <p>First paragraph</p>
        <p>Second paragraph</p>
        <ul><li>A list item</li></ul>
      `;
      accordion.appendChild(details);

      // Force re-upgrade by disconnecting/reconnecting
      const parent = accordion.parentElement;
      parent.removeChild(accordion);
      parent.appendChild(accordion);

      return new Promise(resolve => {
        requestAnimationFrame(() => {
          const newDetails = accordion.querySelector('details:last-child');
          const summary = newDetails.querySelector('summary');
          const panel = newDetails.querySelector('[role="region"]');
          resolve({
            hasPanel: !!panel,
            hasAriaControls: !!summary?.getAttribute('aria-controls'),
            childrenWrapped: panel ? panel.children.length >= 2 : false
          });
        });
      });
    });

    expect(hasPanel.hasPanel).toBe(true);
    expect(hasPanel.hasAriaControls).toBe(true);
    expect(hasPanel.childrenWrapped).toBe(true);
  });
});
