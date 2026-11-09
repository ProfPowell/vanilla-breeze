/**
 * data-format-date — date-only values are calendar dates.
 *
 * <time datetime="2026-10-21"> must render October 21 in every time zone.
 * new Date('2026-10-21') is UTC midnight, which is October 20 west of UTC.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

/**
 * Serve <time> elements and wait for data-format-date to enhance them.
 * @param {import('playwright/test').Page} page
 * @param {string} body
 */
async function load(page, body) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__format-date-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en-US"><head><meta charset="utf-8"></head><body>${body}
      <script type="module">import { initFormatDate } from '/src/utils/format-date-init.js'; initFormatDate();</script>
      </body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
}

for (const timezoneId of ['America/Los_Angeles', 'Asia/Tokyo']) {
  test.describe(`data-format-date in ${timezoneId}`, () => {
    test.use({ timezoneId });

    test('a date-only value renders that calendar date', async ({ page }) => {
      await load(page, '<time id="t" datetime="2026-10-21" data-format-date="long">x</time>');
      await expect(page.locator('#t')).toHaveText('October 21, 2026');
    });

    test('the era calendar extension renders the same day', async ({ page }) => {
      await load(page, '<time id="t" datetime="2026-10-21" data-format-date data-locale="ja-JP-u-ca-japanese">x</time>');
      await expect(page.locator('#t')).toHaveText('令和8年10月21日');
    });

    test('an impossible date is left as authored', async ({ page }) => {
      await load(page, '<time id="t" datetime="2026-02-30" data-format-date>as authored</time>');
      await expect(page.locator('#t')).toHaveAttribute('data-format-date-init', '');
      await expect(page.locator('#t')).toHaveText('as authored');
    });

    test('a value with a UTC offset still converts to local time', async ({ page }) => {
      await load(page, '<time id="t" datetime="2026-10-21T03:00:00Z" data-format-date="long">x</time>');
      await expect(page.locator('#t')).toHaveText(
        timezoneId === 'Asia/Tokyo' ? 'October 21, 2026' : 'October 20, 2026',
      );
    });
  });
}
