/**
 * date-picker — Japanese and CJK text entry.
 *
 * The combobox must parse the format it displays. Under a Japanese locale
 * Intl displays 2026年10月21日, which the parser historically rejected.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

/**
 * Serve a one-picker page with the given <html lang> and open it.
 * @param {import('playwright/test').Page} page
 * @param {string} lang - <html lang>
 * @param {string} [pickerLang] - optional lang on the <date-picker> itself
 */
async function render(page, lang, pickerLang) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__date-picker-ja-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="${lang}"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <script type="module">import '/src/web-components/date-picker/logic.js';</script>
      </head><body><main>
        <label for="when">Date</label>
        <date-picker id="dp"${pickerLang ? ` lang="${pickerLang}"` : ''}><input type="date" id="when" name="when" value="2026-04-15"></date-picker>
      </main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForSelector('date-picker[data-upgraded]');
  return {
    box: page.locator('#dp .date-input'),
    value: () => page.locator('#dp').evaluate((el) => /** @type {any} */ (el).value),
  };
}

/**
 * Type into the combobox and commit with Enter.
 * @param {import('playwright/test').Locator} box
 * @param {string} text
 */
async function enter(box, text) {
  await box.fill(text);
  await box.press('Enter');
}

test.describe('date-picker — CJK numeric entry', () => {
  test.use({ locale: 'ja-JP' });

  test('accepts 年月日 dates', async ({ page }) => {
    const { box, value } = await render(page, 'ja');
    await enter(box, '2026年10月21日');
    await expect.poll(value).toBe('2026-10-21');
  });

  test('accepts full-width digits', async ({ page }) => {
    const { box, value } = await render(page, 'ja');
    await enter(box, '２０２６年１０月２１日');
    await expect.poll(value).toBe('2026-10-21');
  });

  test('rejects impossible 年月日 dates', async ({ page }) => {
    const { box, value } = await render(page, 'ja');
    await enter(box, '2026年2月30日');
    await expect.poll(value).toBe('2026-04-15');
  });

  test('parses the format it displays', async ({ page }) => {
    const { box, value } = await render(page, 'ja');
    const shown = await box.inputValue();
    expect(shown).toBe('2026年4月15日');
    await enter(box, '2026-01-01');
    await enter(box, shown);
    await expect.poll(value).toBe('2026-04-15');
  });

  test('still accepts English month names', async ({ page }) => {
    const { box, value } = await render(page, 'en');
    await enter(box, 'October 21 2026');
    await expect.poll(value).toBe('2026-10-21');
  });
});

test.describe('date-picker — locale follows the nearest lang', () => {
  test.use({ locale: 'de-DE' });

  test('displays in the document language, not the browser language', async ({ page }) => {
    const { box } = await render(page, 'ja');
    await expect(box).toHaveValue('2026年4月15日');
  });

  test('a lang on the picker overrides the document', async ({ page }) => {
    const { box } = await render(page, 'en', 'ja');
    await expect(box).toHaveValue('2026年4月15日');
  });

  test('calendar month label follows the document language', async ({ page }) => {
    const { box } = await render(page, 'ja');
    await box.press('ArrowDown');
    await expect(page.locator('#dp').getByText('4月', { exact: true })).toBeVisible();
  });

  test('parses month names in the document language', async ({ page }) => {
    const { box, value } = await render(page, 'fr');
    await enter(box, '21 octobre 2026');
    await expect.poll(value).toBe('2026-10-21');
  });
});
