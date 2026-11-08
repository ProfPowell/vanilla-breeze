/**
 * Invalid lang tags — calendar-wc, week-view, day-view (vanilla-breeze-nhex).
 *
 * Authors often write POSIX-style tags (lang="en_US"). Every Intl
 * constructor throws RangeError on them, and these components resolve
 * their locale from the nearest [lang], so the throw used to happen
 * mid-render: calendar-wc upgraded with zero day cells. A malformed tag
 * now falls back to en-US, so the output must match lang="en-US" exactly.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

/**
 * Render one component under a given <html lang>; return its text and
 * any page errors.
 * @param {import('playwright/test').Page} page
 * @param {string} lang
 * @param {{ tag: string, markup: string }} c
 */
async function render(page, lang, c) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.clock.setFixedTime(new Date('2026-04-15T12:00:00'));
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__invalid-lang-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="${lang}"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <script type="module">import '/src/web-components/${c.tag}/logic.js';</script>
      </head><body><main>${c.markup}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction((tag) => customElements.get(tag), c.tag);
  await expect(page.locator(`${c.tag}[data-upgraded]`)).toBeAttached();
  const text = await page.locator(c.tag).evaluate((el) => el.textContent.replace(/\s+/g, ' ').trim());
  return { text, errors };
}

const COMPONENTS = [
  {
    tag: 'calendar-wc',
    markup: '<calendar-wc data-month="4" data-year="2026"></calendar-wc>',
  },
  {
    tag: 'week-view',
    markup: `<week-view data-start-date="2026-04-06" data-days="3">
      <calendar-event data-date="2026-04-07"><time datetime="10:00">10:00</time> Review</calendar-event>
    </week-view>`,
  },
  {
    tag: 'day-view',
    markup: `<day-view data-date="2026-04-10"><ol>
      <li><time datetime="09:00">9 AM</time><hour-view></hour-view></li>
      <li><time datetime="10:00">10 AM</time><hour-view>
        <calendar-event><time datetime="10:00">10:00</time> Review</calendar-event>
      </hour-view></li>
    </ol></day-view>`,
  },
];

for (const c of COMPONENTS) {
  test.describe(`${c.tag} with an invalid lang`, () => {
    for (const lang of ['en_US', 'ja_JP', 'en-US-', '日本語']) {
      test(`lang="${lang}" renders like en-US`, async ({ browser }) => {
        const good = await render(await browser.newPage(), 'en-US', c);
        const bad = await render(await browser.newPage(), lang, c);
        expect(bad.errors).toEqual([]);
        expect(bad.text).toBe(good.text);
      });
    }
  });
}
