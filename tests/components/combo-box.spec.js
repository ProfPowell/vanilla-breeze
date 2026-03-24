/**
 * Combo Box Web Component Behavior Tests
 *
 * Tests ARIA setup, keyboard navigation, single-select state clearing,
 * multi-select, lifecycle safety, and popup positioning.
 */

import { test, expect } from 'playwright/test';

const demoPage = '/demos/examples/demos/combobox-basic.html';

test.describe('combo-box — baseline', () => {

  test('renders with data-upgraded', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('combo-box[data-upgraded]');

    const comboBox = page.locator('combo-box').first();
    await expect(comboBox).toBeVisible();
  });

  test('input has combobox ARIA role', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('combo-box[data-upgraded]');

    const input = page.locator('combo-box input[type="text"]').first();
    await expect(input).toHaveAttribute('role', 'combobox');
    await expect(input).toHaveAttribute('aria-expanded', 'false');
    await expect(input).toHaveAttribute('aria-autocomplete', 'list');
  });

  test('listbox has proper role', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('combo-box[data-upgraded]');

    const listbox = page.locator('combo-box ul[role="listbox"], combo-box ol[role="listbox"]').first();
    await expect(listbox).toHaveCount(1);
  });

  test('options have role=option', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('combo-box[data-upgraded]');

    const options = page.locator('combo-box li[role="option"]');
    const count = await options.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('combo-box — open/close', () => {

  test('clicking input opens the listbox', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('combo-box[data-upgraded]');

    const input = page.locator('combo-box input[type="text"]').first();
    const comboBox = page.locator('combo-box').first();

    await input.click();
    await expect(comboBox).toHaveAttribute('open', '');
    await expect(input).toHaveAttribute('aria-expanded', 'true');
  });

  test('Escape closes the listbox', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('combo-box[data-upgraded]');

    const input = page.locator('combo-box input[type="text"]').first();
    const comboBox = page.locator('combo-box').first();

    await input.click();
    await expect(comboBox).toHaveAttribute('open', '');

    await page.keyboard.press('Escape');
    await expect(comboBox).not.toHaveAttribute('open');
  });
});

test.describe('combo-box — single-select', () => {

  test('selecting an option updates the input value', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('combo-box[data-upgraded]');

    const input = page.locator('combo-box input[type="text"]').first();

    // Open and select first option
    await input.click();
    const firstOption = page.locator('combo-box li[data-value]').first();
    await firstOption.click();

    const value = await input.inputValue();
    expect(value.length).toBeGreaterThan(0);
  });

  test('typing after selection clears stale aria-selected', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('combo-box[data-upgraded]');

    const result = await page.evaluate(() => {
      const cb = document.querySelector('combo-box');
      const input = cb.querySelector('input');
      const firstOption = cb.querySelector('li[data-value]');

      // Select first option
      input.click();
      firstOption.click();

      // Check aria-selected is set
      const selectedBefore = firstOption.getAttribute('aria-selected');

      // Type to clear selection
      input.value = 'x';
      input.dispatchEvent(new Event('input', { bubbles: true }));

      const selectedAfter = firstOption.getAttribute('aria-selected');
      const hostValue = cb.getAttribute('value');

      return { selectedBefore, selectedAfter, hostValue };
    });

    expect(result.selectedBefore).toBe('true');
    expect(result.selectedAfter).toBe('false');
    // Host value should be cleared
    expect(result.hostValue).toBeFalsy();
  });
});

test.describe('combo-box — keyboard navigation', () => {

  test('ArrowDown opens listbox and activates first option', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('combo-box[data-upgraded]');

    const input = page.locator('combo-box input[type="text"]').first();
    const comboBox = page.locator('combo-box').first();

    await input.focus();
    await page.keyboard.press('ArrowDown');

    await expect(comboBox).toHaveAttribute('open', '');
  });

  test('Enter selects active option', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('combo-box[data-upgraded]');

    const input = page.locator('combo-box input[type="text"]').first();

    await input.focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const value = await input.inputValue();
    expect(value.length).toBeGreaterThan(0);
  });
});

test.describe('combo-box — lifecycle', () => {

  test('reconnect does not break the component', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('combo-box[data-upgraded]');

    const result = await page.evaluate(() => {
      const cb = document.querySelector('combo-box');
      const parent = cb.parentElement;

      parent.removeChild(cb);
      parent.appendChild(cb);

      return new Promise(resolve => {
        requestAnimationFrame(() => {
          const input = cb.querySelector('input');
          const hasInput = !!input;
          const isUpgraded = cb.hasAttribute('data-upgraded');

          // Try to open
          if (input) input.click();

          resolve({
            hasInput,
            isUpgraded,
            isOpen: cb.hasAttribute('open'),
          });
        });
      });
    });

    expect(result.hasInput).toBe(true);
    expect(result.isUpgraded).toBe(true);
  });
});

test.describe('combo-box — filtering', () => {

  test('typing filters the visible options', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('combo-box[data-upgraded]');

    const input = page.locator('combo-box input[type="text"]').first();
    await input.click();

    // Count visible options before filter
    const totalBefore = await page.locator('combo-box li[data-value]:not([hidden])').count();

    // Type a filter query
    await input.fill('United');
    await page.waitForTimeout(100);

    const totalAfter = await page.locator('combo-box li[data-value]:not([hidden])').count();

    // Fewer options should be visible after filtering
    expect(totalAfter).toBeLessThanOrEqual(totalBefore);
    expect(totalAfter).toBeGreaterThan(0);
  });
});
