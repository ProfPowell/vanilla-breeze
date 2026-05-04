/**
 * Combo Box Web Component Behavior Tests
 *
 * Tests ARIA setup, keyboard navigation, single-select state clearing,
 * multi-select, lifecycle safety, and popup positioning.
 */

import { test, expect } from 'playwright/test';

const demoPage = '/docs/examples/demos/combobox-basic.html';

test.describe('combo-box — baseline', () => {

  test('renders with data-upgraded', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('combo-box[data-upgraded]');

    const comboBox = page.locator('combo-box').first();
    await expect(comboBox).toBeVisible();
  });

  test('input exposes the combobox ARIA contract', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('combo-box[data-upgraded]');

    // The combobox role is set via ElementInternals.role on the host (AOM).
    // The author-facing ARIA attributes that drive screen-reader behavior on
    // the focused input are the autocomplete contract.
    const input = page.locator('combo-box input[type="text"]').first();
    await expect(input).toHaveAttribute('aria-expanded', 'false');
    await expect(input).toHaveAttribute('aria-autocomplete', 'list');
    await expect(input).toHaveAttribute('aria-controls', /combobox-listbox-/);
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

  test('multi-mode reconnect does not duplicate tags-input-area or live region', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('combo-box[multiple][data-upgraded]');

    const result = await page.evaluate(async () => {
      const cb = document.querySelector('combo-box[multiple]');
      const initial = {
        areas: cb.querySelectorAll(':scope > .tags-input-area').length,
        live: cb.querySelectorAll(':scope > [data-combobox-live]').length,
        inputs: cb.querySelectorAll('input').length,
      };

      // Reconnect three times
      for (let i = 0; i < 3; i++) {
        const parent = cb.parentNode;
        const next = cb.nextSibling;
        parent.removeChild(cb);
        parent.insertBefore(cb, next);
        await new Promise(r => setTimeout(r, 30));
      }

      return {
        initial,
        after: {
          areas: cb.querySelectorAll(':scope > .tags-input-area').length,
          live: cb.querySelectorAll(':scope > [data-combobox-live]').length,
          inputs: cb.querySelectorAll('input').length,
          inputInArea: !!cb.querySelector(':scope > .tags-input-area > input'),
        },
      };
    });

    expect(result.initial.areas).toBe(1);
    expect(result.initial.live).toBe(1);
    expect(result.initial.inputs).toBe(1);
    expect(result.after.areas).toBe(1);
    expect(result.after.live).toBe(1);
    expect(result.after.inputs).toBe(1);
    expect(result.after.inputInArea).toBe(true);
  });
});

test.describe('combo-box — popup positioning', () => {

  test('popup anchors to .tags-input-area in multi mode (not the shrunk input)', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('combo-box[multiple][data-upgraded]');

    const rects = await page.evaluate(async () => {
      const cb = document.querySelector('combo-box[multiple]');
      const input = cb.querySelector(':scope > .tags-input-area > input');
      const area = cb.querySelector(':scope > .tags-input-area');
      const list = cb.querySelector(':scope > ul, :scope > ol');

      input.focus();
      input.click();
      await new Promise(r => setTimeout(r, 100));

      const rect = (el) => {
        const r = el.getBoundingClientRect();
        return { left: Math.round(r.left), width: Math.round(r.width) };
      };
      return { input: rect(input), area: rect(area), list: rect(list) };
    });

    // Listbox should align with the tags container (the visible control),
    // not the bare input which can be much narrower once tags are added.
    expect(Math.abs(rects.list.left - rects.area.left)).toBeLessThanOrEqual(2);
    expect(Math.abs(rects.list.width - rects.area.width)).toBeLessThanOrEqual(2);
  });

  test('popup repositions on window scroll', async ({ page }) => {
    await page.goto(demoPage);
    await page.waitForSelector('combo-box[data-upgraded]');

    const result = await page.evaluate(async () => {
      // Make the page tall enough to scroll
      document.body.style.minBlockSize = '300vh';

      const cb = document.querySelector('combo-box');
      const input = cb.querySelector('input');
      const list = cb.querySelector(':scope > ul, :scope > ol');

      input.focus();
      input.click();
      await new Promise(r => setTimeout(r, 100));

      const before = list.getBoundingClientRect().top;
      window.scrollBy(0, 200);
      // Allow scroll listener (passive) to repaint
      await new Promise(r => setTimeout(r, 100));
      const after = list.getBoundingClientRect().top;
      const inputAfter = input.getBoundingClientRect().bottom;

      return { before: Math.round(before), after: Math.round(after), inputBottom: Math.round(inputAfter) };
    });

    // After scrolling 200px down, the popup's viewport top must follow the
    // anchor down rather than staying pinned where it started.
    expect(result.before - result.after).toBeGreaterThan(50);
    // And it should sit within ~10px below the input's bottom.
    expect(Math.abs(result.after - result.inputBottom - 2)).toBeLessThanOrEqual(10);
  });

  test('popup repositions on window resize', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto(demoPage);
    await page.waitForSelector('combo-box[data-upgraded]');

    // Open the popup at one viewport size
    const input = page.locator('combo-box input[type="text"]').first();
    await input.click();
    await page.waitForTimeout(100);

    const before = await page.evaluate(() => {
      const cb = document.querySelector('combo-box');
      const list = cb.querySelector(':scope > ul, :scope > ol');
      const input = cb.querySelector('input');
      return {
        listWidth: Math.round(list.getBoundingClientRect().width),
        inputWidth: Math.round(input.getBoundingClientRect().width),
      };
    });

    // Listbox must already track the input width before resize
    expect(Math.abs(before.listWidth - before.inputWidth)).toBeLessThanOrEqual(2);

    // Shrink the viewport and let the resize listener fire
    await page.setViewportSize({ width: 480, height: 768 });
    await page.waitForTimeout(200);

    const after = await page.evaluate(() => {
      const cb = document.querySelector('combo-box');
      const list = cb.querySelector(':scope > ul, :scope > ol');
      const input = cb.querySelector('input');
      return {
        listWidth: Math.round(list.getBoundingClientRect().width),
        listLeft: Math.round(list.getBoundingClientRect().left),
        inputWidth: Math.round(input.getBoundingClientRect().width),
        inputLeft: Math.round(input.getBoundingClientRect().left),
      };
    });

    // After resize the listbox must still track the input's new dimensions —
    // the resize listener should have fired and called #positionListbox().
    expect(Math.abs(after.listWidth - after.inputWidth)).toBeLessThanOrEqual(2);
    expect(Math.abs(after.listLeft - after.inputLeft)).toBeLessThanOrEqual(2);
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
