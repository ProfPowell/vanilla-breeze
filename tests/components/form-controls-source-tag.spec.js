/**
 * Form controls — source-tagged change events (Phase 3e)
 *
 * Verifies the audit pass that added a `source` field to each form
 * control's :change event detail and made .value setters idempotent.
 * Reactive frameworks can filter `source === 'api'` to avoid feedback
 * loops when their own assignment echoes back as an event.
 */

import { test, expect } from 'playwright/test';

const colorPickerPage = '/docs/examples/demos/color-picker-basic.html';

test.describe('form controls — source-tagged :change events', () => {

  test('color-picker: .value assignment emits with source: "api"', async ({ page }) => {
    await page.goto(colorPickerPage);
    await page.waitForSelector('color-picker[data-upgraded]');

    const result = await page.evaluate(() => {
      const cp = document.querySelector('color-picker');
      const fired = [];
      cp.addEventListener('color-picker:change', (e) => {
        fired.push({ source: e.detail.source, hex: e.detail.hex });
      });

      cp.value = '#ff0000';
      cp.value = '#00ff00';

      // Idempotent: re-assigning same value should NOT fire again.
      cp.value = '#00ff00';

      return fired;
    });

    expect(result.length).toBe(2);
    expect(result.every(r => r.source === 'api')).toBe(true);
    expect(result[0].hex.toLowerCase()).toBe('#ff0000');
    expect(result[1].hex.toLowerCase()).toBe('#00ff00');
  });

  test('color-picker: invalid value is rejected silently (no event)', async ({ page }) => {
    await page.goto(colorPickerPage);
    await page.waitForSelector('color-picker[data-upgraded]');

    const fired = await page.evaluate(() => {
      const cp = document.querySelector('color-picker');
      let count = 0;
      cp.addEventListener('color-picker:change', () => { count += 1; });
      cp.value = 'not-a-color';
      cp.value = '#zzz';
      return count;
    });

    expect(fired).toBe(0);
  });
});
