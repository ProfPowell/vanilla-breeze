/**
 * date-picker — Japanese and CJK text entry
 *
 * The combobox must parse the format it displays. Under a Japanese locale
 * Intl displays 2026年10月21日, which the parser historically rejected.
 */

import { test, expect } from 'playwright/test';

const url = '/__date-picker-ja-fixture.html';

/**
 * Serve a one-picker page with the given <html lang> and open it.
 * @param {import('playwright/test').Page} page
 * @param {string} lang
 */
async function render(page, lang) {
  await page.route(`**${url}`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'text/html; charset=utf-8',
      body:
        `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><title>date-picker</title>` +
        `<link rel="stylesheet" href="/src/main.css"></head><body>` +
        `<date-picker name="when"><input type="date" id="when" value="2026-04-15"></date-picker>` +
        `<script type="module" src="/src/main.js"></script></body></html>`,
    }),
  );
  await page.goto(url);
  await page.waitForSelector('date-picker[data-upgraded]');
  return {
    box: page.locator('date-picker input:not([type="date"])').first(),
    native: page.locator('date-picker input[type="date"]'),
  };
}

test.describe('date-picker — CJK numeric entry', () => {
  test.use({ locale: 'ja-JP' });

  test('accepts 年月日 dates', async ({ page }) => {
    const { box, native } = await render(page, 'ja');
    await box.fill('2026年10月21日');
    await box.press('Enter');
    await expect(native).toHaveValue('2026-10-21');
  });

  test('accepts full-width digits', async ({ page }) => {
    const { box, native } = await render(page, 'ja');
    await box.fill('２０２６年１０月２１日');
    await box.press('Enter');
    await expect(native).toHaveValue('2026-10-21');
  });

  test('parses the format it displays', async ({ page }) => {
    const { box, native } = await render(page, 'ja');
    const shown = await box.inputValue();
    expect(shown).toBe('2026年4月15日');
    await box.fill('2026-01-01');
    await box.press('Enter');
    await box.fill(shown);
    await box.press('Enter');
    await expect(native).toHaveValue('2026-04-15');
  });

  test('still accepts English month names', async ({ page }) => {
    const { box, native } = await render(page, 'en');
    await box.fill('October 21 2026');
    await box.press('Enter');
    await expect(native).toHaveValue('2026-10-21');
  });
});

test.describe('date-picker — locale follows <html lang>', () => {
  test.use({ locale: 'de-DE' });

  test('displays in the document language, not the browser language', async ({ page }) => {
    const { box } = await render(page, 'ja');
    await expect(box).toHaveValue('2026年4月15日');
  });

  test('calendar month label follows the document language', async ({ page }) => {
    const { box } = await render(page, 'ja');
    await box.press('ArrowDown');
    await expect(page.locator('date-picker').getByText('4月', { exact: true })).toBeVisible();
  });

  test('parses month names in the document language', async ({ page }) => {
    const { box, native } = await render(page, 'fr');
    await box.fill('21 octobre 2026');
    await box.press('Enter');
    await expect(native).toHaveValue('2026-10-21');
  });
});
