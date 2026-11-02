/**
 * calendar-wc — review fixes (vanilla-breeze-5ac4, i89g, pohq, 25vi, ra3u).
 *
 * Covers: reconnect duplicating the UI, arrow keys starting from the wrong
 * day, keyboard access to the day detail in display mode, DST-safe span
 * stepping, aria-selected placement, dialog focus handling, locale-driven
 * first weekday, observed data-month/data-year, year range, month titles.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

async function load(page, body, { lang = 'en' } = {}) {
  await page.clock.setFixedTime(new Date('2026-04-15T12:00:00'));
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__calendar-wc-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="${lang}"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <script type="module">
        import '/src/web-components/day-view/logic.js';
        import '/src/web-components/calendar-wc/logic.js';
      </script>
      </head><body><main><button id="outside" type="button">Outside</button>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForSelector('calendar-wc[data-upgraded]');
}

const EVENTS = JSON.stringify({ '2026-04-10': 'Sprint review', '2026-04-21': [{ label: 'Standup', time: '09:00' }] });

test('reconnecting does not duplicate the header, banner or grid', async ({ page }) => {
  await load(page, '<calendar-wc data-month="4" data-year="2026"></calendar-wc>');
  const counts = await page.evaluate(() => {
    const cal = document.querySelector('calendar-wc');
    const main = document.querySelector('main');
    cal.remove();
    main.append(cal);
    cal.remove();
    main.append(cal);
    return {
      headers: cal.querySelectorAll(':scope > header').length,
      banners: cal.querySelectorAll(':scope > .calendar-banner').length,
      months: cal.querySelectorAll(':scope > .cal-months').length,
      tables: cal.querySelectorAll('table').length,
      upgraded: cal.hasAttribute('data-upgraded'),
    };
  });
  expect(counts).toEqual({ headers: 1, banners: 1, months: 1, tables: 1, upgraded: true });
});

test('exactly one roving tabindex="0" across all visible months', async ({ page }) => {
  await load(page, '<calendar-wc data-month="4" data-year="2026" data-months="3"></calendar-wc>');
  const zero = await page.locator('calendar-wc button[tabindex="0"]').evaluateAll(
    (els) => els.map((b) => b.getAttribute('data-date')));
  // Today (2026-04-15, clock pinned) wins over each month's day 1.
  expect(zero).toEqual(['2026-04-15']);
});

test('arrow keys move from the focused day, not the first tabindex="0"', async ({ page }) => {
  await load(page, '<calendar-wc data-month="4" data-year="2026" data-months="2"></calendar-wc>');
  await page.locator('button[data-date="2026-05-20"]').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('button[data-date="2026-05-21"]')).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await expect(page.locator('button[data-date="2026-05-14"]')).toBeFocused();
  const zero = await page.locator('calendar-wc button[tabindex="0"]').evaluateAll(
    (els) => els.map((b) => b.getAttribute('data-date')));
  expect(zero).toEqual(['2026-05-14']);
});

test('arrow keys skip disabled days', async ({ page }) => {
  await load(page, '<calendar-wc data-month="4" data-year="2026" data-disabled-dates="2026-04-16,2026-04-17"></calendar-wc>');
  await page.locator('button[data-date="2026-04-15"]').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('button[data-date="2026-04-18"]')).toBeFocused();
});

test('display mode: Enter opens the day detail, focus moves in and returns on Escape', async ({ page }) => {
  await load(page, `<calendar-wc data-month="4" data-year="2026" data-events='${EVENTS}'></calendar-wc>`);
  const day = page.locator('button[data-date="2026-04-10"]');
  await day.focus();
  await page.keyboard.press('Enter');
  const dialog = page.locator('calendar-wc .day-detail[role="dialog"]');
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAccessibleName(/April 10, 2026/);
  await expect(dialog.locator('header button')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(day).toBeFocused();
});

test('display mode: Space opens the day detail too', async ({ page }) => {
  await load(page, `<calendar-wc data-month="4" data-year="2026" data-events='${EVENTS}'></calendar-wc>`);
  await page.locator('button[data-date="2026-04-21"]').focus();
  await page.keyboard.press(' ');
  await expect(page.locator('calendar-wc .day-detail')).toBeVisible();
});

test('Escape outside the calendar does not close its day detail', async ({ page }) => {
  await load(page, `<calendar-wc data-month="4" data-year="2026" data-events='${EVENTS}'></calendar-wc>`);
  await page.locator('button[data-date="2026-04-10"]').click();
  await expect(page.locator('calendar-wc .day-detail')).toBeVisible();
  await page.evaluate(() => document.getElementById('outside').dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
  await expect(page.locator('calendar-wc .day-detail')).toBeVisible();
});

test('aria-selected is on the gridcell, not the button', async ({ page }) => {
  await load(page, '<calendar-wc data-month="4" data-year="2026" data-selection="single"></calendar-wc>');
  const btn = page.locator('button[data-date="2026-04-09"]');
  await btn.click();
  const r = await btn.evaluate((b) => ({
    btn: b.getAttribute('aria-selected'),
    td: b.closest('td').getAttribute('aria-selected'),
    other: b.closest('table').querySelector('button[data-date="2026-04-08"]').closest('td').getAttribute('aria-selected'),
    anyButton: b.closest('calendar-wc').querySelectorAll('button[aria-selected]').length,
  }));
  expect(r).toEqual({ btn: null, td: 'true', other: 'false', anyButton: 0 });
});

test.describe('DST', () => {
  test.use({ timezoneId: 'America/New_York' });

  for (const [label, start, end, month, days] of [
    ['fall back', '2026-10-31', '2026-11-03', '10', ['2026-10-31', '2026-11-01', '2026-11-02', '2026-11-03']],
    ['spring forward', '2026-03-07', '2026-03-10', '3', ['2026-03-07', '2026-03-08', '2026-03-09', '2026-03-10']],
  ]) {
    test(`a span across ${label} covers each day exactly once`, async ({ page }) => {
      const events = JSON.stringify({ [start]: { label: 'Trip', end } });
      await load(page, `<calendar-wc data-month="${month}" data-year="2026" data-months="2" data-events='${events}'></calendar-wc>`);
      const counts = await page.evaluate(() => Object.fromEntries(
        [...document.querySelectorAll('calendar-wc td[data-event-count]')].map((td) =>
          [td.querySelector('button[data-date]').getAttribute('data-date'), td.getAttribute('data-event-count')])));
      expect(counts).toEqual(Object.fromEntries(days.map((d) => [d, '1'])));
    });
  }
});

test('first weekday and labels follow the resolved lang, not navigator.language', async ({ page }) => {
  await load(page, '<calendar-wc lang="fr-FR" data-month="4" data-year="2026" data-months="1"></calendar-wc>');
  const r = await page.evaluate(() => {
    const cal = document.querySelector('calendar-wc');
    return {
      nav: navigator.language,
      first: cal.querySelector('th').getAttribute('abbr'),
      label: cal.querySelector('table').getAttribute('aria-label'),
    };
  });
  expect(r.nav).toMatch(/^en/);
  expect(r.first).toBe('lundi');
  expect(r.label).toBe('avril 2026');
});

test('data-label-* attributes override the built-in English strings', async ({ page }) => {
  await load(page, '<calendar-wc lang="fr" data-month="4" data-year="2026" data-label-prev="Mois précédent" data-label-next="Mois suivant" data-label-year="Année"></calendar-wc>');
  await expect(page.locator('calendar-wc header button').first()).toHaveAttribute('aria-label', 'Mois précédent');
  await expect(page.locator('calendar-wc header button').last()).toHaveAttribute('aria-label', 'Mois suivant');
  await expect(page.locator('calendar-wc select')).toHaveAttribute('aria-label', 'Année');
});

test('data-month / data-year changes re-render the view', async ({ page }) => {
  await load(page, '<calendar-wc data-month="4" data-year="2026"></calendar-wc>');
  await page.evaluate(() => {
    const cal = document.querySelector('calendar-wc');
    cal.setAttribute('data-year', '2027');
    cal.setAttribute('data-month', '6');
  });
  await expect(page.locator('calendar-wc table')).toHaveAttribute('aria-label', 'June 2027');
  // Navigating across a year boundary still reflects both attributes.
  await page.evaluate(() => {
    const cal = document.querySelector('calendar-wc');
    cal.setAttribute('data-month', '12');
  });
  await page.locator('calendar-wc header button').last().click();
  await expect(page.locator('calendar-wc')).toHaveAttribute('data-month', '1');
  await expect(page.locator('calendar-wc')).toHaveAttribute('data-year', '2028');
  await expect(page.locator('calendar-wc table')).toHaveAttribute('aria-label', 'January 2028');
});

test('data-events changes re-render and emit events-changed with source "attribute"', async ({ page }) => {
  await load(page, '<calendar-wc data-month="4" data-year="2026"></calendar-wc>');
  const r = await page.evaluate(() => {
    const cal = document.querySelector('calendar-wc');
    const fired = [];
    cal.addEventListener('calendar-wc:events-changed', (e) => fired.push(e.detail.source));
    cal.setAttribute('data-events', '{"2026-04-03":"Launch"}');
    return { fired, count: cal.querySelector('button[data-date="2026-04-03"]').closest('td').getAttribute('data-event-count') };
  });
  expect(r).toEqual({ fired: ['attribute'], count: '1' });
});

test('the year select includes the configured year', async ({ page }) => {
  await load(page, '<calendar-wc data-month="4" data-year="1990"></calendar-wc>');
  await expect(page.locator('calendar-wc select')).toHaveValue('1990');
});

test('multi-month titles are plain text unless data-heading-level is set', async ({ page }) => {
  await load(page, `
    <calendar-wc id="a" data-month="4" data-year="2026" data-months="2"></calendar-wc>
    <calendar-wc id="b" data-month="4" data-year="2026" data-months="2" data-heading-level="3"></calendar-wc>`);
  const r = await page.evaluate(() => ({
    a: [...document.querySelectorAll('#a .cal-month-title')].map((t) => t.localName),
    b: [...document.querySelectorAll('#b .cal-month-title')].map((t) => t.localName),
  }));
  expect(r).toEqual({ a: ['span', 'span'], b: ['h3', 'h3'] });
});
