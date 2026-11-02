/**
 * calendar-event — review fixes (vanilla-breeze-5ac4, i89g, pohq, 25vi, ra3u).
 *
 * Covers: the duration <time> stays in the accessibility tree, ellipsis on
 * long titles, the focus category token, the pointer cursor only when the
 * event holds interactive content, and logical (RTL-safe) positioning of
 * spanning events in <day-view> and <week-view>.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

async function load(page, body, { dir = 'ltr' } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__calendar-event-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en" dir="${dir}"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <script type="module">
        import '/src/web-components/day-view/logic.js';
        import '/src/web-components/week-view/logic.js';
      </script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
}

test('duration <time> is visually hidden but not display:none', async ({ page }) => {
  await load(page, `<calendar-event data-duration="2h">
      <time datetime="10:00">10:00</time><time datetime="PT2H">2 hours</time> Design review
    </calendar-event>`);
  const r = await page.locator('time[datetime="PT2H"]').evaluate((t) => {
    const cs = getComputedStyle(t);
    const rect = t.getBoundingClientRect();
    return { display: cs.display, visibility: cs.visibility, w: rect.width, h: rect.height };
  });
  expect(r.display).not.toBe('none');
  expect(r.visibility).toBe('visible');
  expect(r.w).toBeLessThanOrEqual(1);
  expect(r.h).toBeLessThanOrEqual(1);
  const snapshot = await page.locator('calendar-event').ariaSnapshot();
  expect(snapshot).toContain('2 hours');
});

test('long titles ellipsize (block container, not flex)', async ({ page }) => {
  await load(page, `<section data-layout="stack"><calendar-event>
      <time datetime="09:00">9:00</time> A very long event title that cannot possibly fit in the narrow column at all
    </calendar-event></section>`);
  await page.locator('calendar-event').evaluate((el) => { el.parentElement.style.inlineSize = '10rem'; });
  const r = await page.locator('calendar-event').evaluate((el) => {
    const cs = getComputedStyle(el);
    return { display: cs.display, textOverflow: cs.textOverflow, overflowing: el.scrollWidth > el.clientWidth };
  });
  expect(r).toEqual({ display: 'block', textOverflow: 'ellipsis', overflowing: true });
});

test('the focus category uses a theme token, not a hardcoded colour', async ({ page }) => {
  await load(page, `<calendar-event data-category="focus">Focus</calendar-event>
    <span id="probe">x</span>`);
  const r = await page.evaluate(() => {
    const probe = document.getElementById('probe');
    probe.style.color = 'var(--color-warning)';
    return {
      event: getComputedStyle(document.querySelector('calendar-event')).borderInlineStartColor,
      token: getComputedStyle(probe).color,
    };
  });
  expect(r.event).toBe(r.token);
});

test('pointer cursor only when the event holds a link or button', async ({ page }) => {
  await load(page, `<calendar-event id="plain">Plain</calendar-event>
    <calendar-event id="linked"><a href="#x">Linked</a></calendar-event>`);
  const r = await page.evaluate(() => ({
    plain: getComputedStyle(document.getElementById('plain')).cursor,
    linked: getComputedStyle(document.getElementById('linked')).cursor,
  }));
  expect(r.plain).not.toBe('pointer');
  expect(r.linked).toBe('pointer');
});

const DAY = `<day-view data-date="2026-04-10">
  <ol>
    <li><time datetime="09:00">9 AM</time><hour-view></hour-view></li>
    <li><time datetime="10:00">10 AM</time><hour-view>
      <calendar-event data-duration="2h"><time datetime="10:00">10:00</time> Review</calendar-event>
    </hour-view></li>
    <li><time datetime="11:00">11 AM</time><hour-view></hour-view></li>
    <li><time datetime="12:00">12 PM</time><hour-view></hour-view></li>
  </ol>
</day-view>`;

for (const dir of ['ltr', 'rtl']) {
  test(`day-view spanning event clears the hour labels (${dir})`, async ({ page }) => {
    await load(page, DAY, { dir });
    await page.waitForSelector('calendar-event.dv-spanning');
    const r = await page.evaluate(() => {
      const ev = document.querySelector('calendar-event').getBoundingClientRect();
      const label = document.querySelector('day-view li > time').getBoundingClientRect();
      return { evL: ev.left, evR: ev.right, labelL: label.left, labelR: label.right };
    });
    if (dir === 'ltr') expect(r.evL).toBeGreaterThanOrEqual(r.labelR);
    else expect(r.evR).toBeLessThanOrEqual(r.labelL);
  });

  test(`week-view spanning event stays inside its day column (${dir})`, async ({ page }) => {
    await load(page, `<week-view data-start-date="2026-04-06" data-days="3">
        <calendar-event data-date="2026-04-07" data-duration="2h"><time datetime="10:00">10:00</time> Review</calendar-event>
        <calendar-event data-date="2026-04-06"><time datetime="09:00">9:00</time> Standup</calendar-event>
      </week-view>`, { dir });
    await page.waitForSelector('calendar-event.wv-spanning');
    const r = await page.evaluate(() => {
      const ev = document.querySelector('calendar-event.wv-spanning');
      const evRect = ev.getBoundingClientRect();
      const td = ev.closest('td').getBoundingClientRect();
      return { dl: Math.abs(evRect.left - td.left), dr: Math.abs(evRect.right - td.right), usesLogical: ev.style.left === '' && ev.style.insetInlineStart !== '' };
    });
    expect(r.dl).toBeLessThanOrEqual(3);
    expect(r.dr).toBeLessThanOrEqual(3);
    expect(r.usesLogical).toBe(true);
  });
}
