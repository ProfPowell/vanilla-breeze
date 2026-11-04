/**
 * week-view — U–Y review fixes.
 *
 * Covers: every event reachable by arrow keys (Up/Down walk a day in time
 * order incl. events sharing a cell; Left/Right go to the nearest-in-time
 * event in the closest day that has any); Home/End in date-then-time
 * order; default week from the locale's first day + today marked
 * aria-current="date"; full-date header text; corner label; unplaced
 * events hidden but kept in the events getter; attribute changes after
 * upgrade rebuild and days clamp; grid lines are logical borders that
 * survive forced colors and mirror in RTL; reconnect keeps one table.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

/**
 * @param {import('playwright/test').Page} page
 * @param {string} body
 * @param {{ dir?: string, lang?: string }} [opts]
 */
async function load(page, body, { dir = 'ltr', lang = 'en-US' } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__week-view-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="${lang}" dir="${dir}"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <script type="module">import '/src/web-components/week-view/logic.js';</script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForSelector('week-view[data-upgraded]');
}

const ev = (date, time, text, extra = '') =>
  `<calendar-event data-date="${date}"${extra}><time datetime="${time}">${time}</time> ${text}</calendar-event>`;

// Mon 6 … Sun 12 April 2026. Wed 11:00 shares no row or column with any other
// event; Mon 09:00 and Mon 09:30 share one hour cell.
const SCATTERED = `<week-view id="w" data-start-date="2026-04-06">
  ${ev('2026-04-06', '09:00', 'Mon nine')}
  ${ev('2026-04-06', '09:30', 'Mon half nine')}
  ${ev('2026-04-08', '11:00', 'Wed eleven')}
  ${ev('2026-04-07', '14:00', 'Tue two')}
  ${ev('2026-04-07', '08:00', 'Tue eight')}
  ${ev('2026-04-20', '10:00', 'Out of range')}
</week-view>`;

const focusedText = (page) => page.evaluate(() =>
  document.activeElement?.closest('calendar-event')?.textContent?.replace(/\s+/g, ' ').trim().replace(/^\d\d:\d\d /, ''));

async function focusEvent(page, text) {
  await page.evaluate((t) => {
    const el = [...document.querySelectorAll('#w calendar-event')].find((e) => e.textContent.includes(t));
    /** @type {HTMLElement} */ (el).focus();
  }, text);
}

test('every placed event is reachable with arrow keys alone', async ({ page }) => {
  await load(page, SCATTERED);
  const all = ['Mon nine', 'Mon half nine', 'Wed eleven', 'Tue two', 'Tue eight'];
  const seen = new Set();
  const queue = ['Mon nine'];
  while (queue.length) {
    const from = /** @type {string} */ (queue.shift());
    if (seen.has(from)) continue;
    seen.add(from);
    for (const key of ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']) {
      await focusEvent(page, from);
      await page.keyboard.press(key);
      const to = await focusedText(page);
      if (to && !seen.has(to)) queue.push(to);
    }
  }
  expect([...seen].sort()).toEqual([...all].sort());
});

test('Up/Down walk the day in time order, including events sharing a cell', async ({ page }) => {
  await load(page, SCATTERED);
  await focusEvent(page, 'Mon nine');
  await page.keyboard.press('ArrowDown');
  expect(await focusedText(page)).toBe('Mon half nine');
  await page.keyboard.press('ArrowUp');
  expect(await focusedText(page)).toBe('Mon nine');
  await focusEvent(page, 'Tue eight');
  await page.keyboard.press('ArrowDown');
  expect(await focusedText(page)).toBe('Tue two');
});

test('Left/Right go to the nearest-in-time event of the closest day with events', async ({ page }) => {
  await load(page, SCATTERED);
  await focusEvent(page, 'Mon half nine');
  await page.keyboard.press('ArrowRight');
  expect(await focusedText(page)).toBe('Tue eight');
  await page.keyboard.press('ArrowRight');
  expect(await focusedText(page)).toBe('Wed eleven');
  await page.keyboard.press('ArrowLeft');
  expect(await focusedText(page)).toBe('Tue eight');
});

test('Arrow keys follow the visual direction in RTL', async ({ page }) => {
  await load(page, SCATTERED, { dir: 'rtl' });
  await focusEvent(page, 'Mon nine');
  await page.keyboard.press('ArrowLeft');
  expect(await focusedText(page)).toBe('Tue eight');
});

test('Home/End use date-then-time order', async ({ page }) => {
  await load(page, SCATTERED);
  await focusEvent(page, 'Wed eleven');
  await page.keyboard.press('Home');
  expect(await focusedText(page)).toBe('Mon nine'); // not Tue 08:00 (earliest hour)
  await page.keyboard.press('End');
  expect(await focusedText(page)).toBe('Wed eleven');
});

test('the initial tab stop is the first event in date-then-time order', async ({ page }) => {
  await load(page, SCATTERED);
  const stop = await page.evaluate(() => document.querySelector('#w calendar-event[tabindex="0"]')?.textContent);
  expect(stop).toContain('Mon nine');
});

test('unplaced events are hidden but stay in the events getter', async ({ page }) => {
  await load(page, SCATTERED);
  const out = page.locator('#w > calendar-event');
  await expect(out).toHaveCount(1);
  await expect(out).toBeHidden();
  const texts = await page.evaluate(() => /** @type {any} */ (document.getElementById('w')).events.map((e) => e.text));
  expect(texts.some((t) => t.includes('Out of range'))).toBe(true);
});

test('day headers carry the full date; month added when the range crosses one', async ({ page }) => {
  await load(page, `<week-view id="w" data-start-date="2026-04-29" data-days="3" data-label-time="Hora">
    ${ev('2026-04-30', '09:00', 'A')}</week-view>`);
  const headers = page.locator('#w thead th[scope="col"] time');
  await expect(headers).toHaveCount(3);
  await expect(page.getByRole('columnheader', { name: 'Thursday, April 30, 2026' })).toHaveCount(1);
  await expect(page.getByRole('columnheader', { name: 'Friday, May 1, 2026' })).toHaveCount(1);
  await expect(headers.nth(2).locator('[aria-hidden="true"]')).toHaveText(/May/);
  await expect(page.getByRole('columnheader', { name: 'Hora' })).toHaveCount(1);
});

test('no data-start-date: current week from the locale first day, today marked', async ({ page }) => {
  await page.clock.setFixedTime(new Date(2026, 6, 8, 10, 0)); // Wed 8 July 2026
  await load(page, `<week-view id="us"></week-view>
    <section lang="de-DE"><week-view id="de"></week-view></section>`);
  const first = (id) => page.locator(`#${id} thead th[scope="col"] time`).first();
  await expect(first('us')).toHaveAttribute('datetime', '2026-07-05'); // Sunday
  await expect(first('de')).toHaveAttribute('datetime', '2026-07-06'); // Monday
  const today = page.locator('#us thead th[aria-current="date"] time');
  await expect(today).toHaveCount(1);
  await expect(today).toHaveAttribute('datetime', '2026-07-08');
});

test('attribute changes after upgrade rebuild; data-days is clamped', async ({ page }) => {
  await load(page, SCATTERED);
  const cols = page.locator('#w thead th[scope="col"] time');
  await expect(cols).toHaveCount(7);
  await page.evaluate(() => document.getElementById('w').setAttribute('data-days', '2'));
  await expect(cols).toHaveCount(2);
  // Wed is now out of range and hidden; Mon/Tue still placed
  await expect(page.locator('#w > table calendar-event')).toHaveCount(4);
  await page.evaluate(() => document.getElementById('w').setAttribute('data-days', '0'));
  await expect(cols).toHaveCount(1);
  await page.evaluate(() => document.getElementById('w').setAttribute('data-days', 'abc'));
  await expect(cols).toHaveCount(7);
  await page.evaluate(() => document.getElementById('w').setAttribute('data-start-date', '2026-04-07'));
  await expect(cols.first()).toHaveAttribute('datetime', '2026-04-07');
  await expect(page.locator('#w > table')).toHaveCount(1);
  await expect(page.locator('#w > table calendar-event')).toHaveCount(3); // Tue x2 + Wed
});

test('grid lines are logical borders that survive forced colors', async ({ page }) => {
  await load(page, SCATTERED);
  const ltr = await page.evaluate(() => {
    const th = /** @type {HTMLElement} */ (document.querySelector('#w tbody th'));
    const td = /** @type {HTMLElement} */ (document.querySelector('#w tbody td'));
    const a = getComputedStyle(th); const b = getComputedStyle(td);
    return { thRight: a.borderRightStyle, thLeft: a.borderLeftStyle, tdBottom: b.borderBottomStyle, shadow: b.boxShadow };
  });
  expect(ltr).toEqual({ thRight: 'solid', thLeft: 'none', tdBottom: 'solid', shadow: 'none' });
  await page.emulateMedia({ forcedColors: 'active' });
  const forced = await page.evaluate(() => getComputedStyle(/** @type {Element} */ (document.querySelector('#w tbody td'))).borderBottomWidth);
  expect(parseFloat(forced)).toBeGreaterThan(0);
});

test('hour-label divider sits between the labels and the first day in RTL', async ({ page }) => {
  await load(page, SCATTERED, { dir: 'rtl' });
  const s = await page.evaluate(() => {
    const a = getComputedStyle(/** @type {Element} */ (document.querySelector('#w tbody th')));
    return { left: a.borderLeftStyle, right: a.borderRightStyle };
  });
  expect(s).toEqual({ left: 'solid', right: 'none' });
});

test('reconnect keeps one table and the keyboard still works', async ({ page }) => {
  await load(page, SCATTERED);
  await page.evaluate(() => {
    const w = document.getElementById('w');
    const main = document.querySelector('main');
    for (let i = 0; i < 3; i++) { w.remove(); main.append(w); }
  });
  await expect(page.locator('#w > table')).toHaveCount(1);
  await focusEvent(page, 'Mon nine');
  await page.keyboard.press('ArrowDown');
  expect(await focusedText(page)).toBe('Mon half nine');
});
