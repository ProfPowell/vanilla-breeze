/**
 * day-view / week-view — review fixes.
 *   8kf7  full ISO datetimes place events (shared parseTime)
 *   8s1z  decimal / ISO-8601 durations (shared parseDuration)
 *   qim5  data-start-hour / data-end-hour / data-date are read
 *   rb3n  spans re-measure on resize, overlapping spans in columns,
 *         clipped spans marked data-continues, rAF cancelled on teardown
 *   egb6  keyboard: Enter/Space/Home/End, role + name, roving reset on reconnect
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

/**
 * @param {import('playwright/test').Page} page
 * @param {string} body
 * @param {{ dir?: string, wait?: string }} [opts]
 */
async function load(page, body, { dir = 'ltr', wait = 'day-view' } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__day-view-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en" dir="${dir}"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <script type="module">
        import '/src/web-components/day-view/logic.js';
        import '/src/web-components/week-view/logic.js';
      </script>
      </head><body><main id="host">${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => customElements.get('day-view') && customElements.get('week-view'));
  if (wait) await page.waitForSelector(`${wait}[data-upgraded]`);
}

/** Wait two frames so rAF-scheduled positioning has run. */
const frames = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

/** Hour labels of the generated rows. */
const rowHours = (page, sel = 'day-view') => page.evaluate((s) =>
  [...document.querySelectorAll(`${s} > ol > li > time`)].map((t) => t.getAttribute('datetime')), sel);

// ── 8kf7: ISO times ────────────────────────────────────────────────

test('auto mode places events with full ISO datetimes', async ({ page }) => {
  await load(page, `
    <day-view data-start-hour="auto" data-date="2026-04-10">
      <calendar-event><time datetime="2026-04-10T09:30:00">9:30</time> Standup</calendar-event>
      <calendar-event><time datetime="2026-04-10T13:00Z">1:00</time> Review</calendar-event>
      <calendar-event>Offsite (all day)</calendar-event>
    </day-view>`);
  expect(await rowHours(page)).toEqual(['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00']);
  const r = await page.evaluate(() => {
    const dv = document.querySelector('day-view');
    const standup = /** @type {HTMLElement} */ (dv.querySelector('ol calendar-event'));
    return {
      inGrid: dv.querySelectorAll('ol calendar-event').length,
      allDay: dv.querySelectorAll('.all-day-events calendar-event').length,
      standupRow: standup.closest('li')?.querySelector(':scope > time')?.getAttribute('datetime'),
      standupStart: standup.dataset.start,
      listLabel: dv.querySelector('ol').getAttribute('aria-label'),
    };
  });
  expect(r.inGrid).toBe(2);
  expect(r.allDay).toBe(1);
  expect(r.standupRow).toBe('09:00');
  expect(r.standupStart).toBe('30');
  expect(r.listLabel).toContain('2026');
});

test('.events setter accepts full ISO times', async ({ page }) => {
  await load(page, `<day-view data-start-hour="auto"><calendar-event><time datetime="08:00">8</time> x</calendar-event></day-view>`);
  await page.evaluate(() => {
    /** @type {any} */ (document.querySelector('day-view')).events = [
      { time: '2026-04-10T10:15:00', text: 'Plan' },
      { time: '2026-04-10T11:45:00', text: 'Ship', duration: 'PT1H' },
    ];
  });
  expect(await rowHours(page)).toEqual(['09:00', '10:00', '11:00', '12:00']);
  expect(await page.locator('day-view ol calendar-event').count()).toBe(2);
});

// ── qim5: start/end hour + date ────────────────────────────────────

test('numeric data-start-hour / data-end-hour set the generated range', async ({ page }) => {
  await load(page, `
    <day-view id="a" data-start-hour="6" data-end-hour="9">
      <calendar-event><time datetime="07:00">7</time> Gym</calendar-event>
    </day-view>
    <day-view id="b" data-start-hour="6" data-end-hour="9">
      <calendar-event><time datetime="07:00">7</time> Gym</calendar-event>
      <calendar-event><time datetime="11:00">11</time> Late</calendar-event>
    </day-view>
    <day-view id="c">
      <calendar-event><time datetime="10:00">10</time> Default range</calendar-event>
    </day-view>`);
  expect(await rowHours(page, '#a')).toEqual(['06:00', '07:00', '08:00', '09:00']);
  // Range grows to fit an event outside it rather than dropping it
  expect(await rowHours(page, '#b')).toEqual(['06:00', '07:00', '08:00', '09:00', '10:00', '11:00']);
  const c = await rowHours(page, '#c');
  expect([c[0], c[c.length - 1], c.length]).toEqual(['07:00', '19:00', 13]);
});

test('data-date is in the event-click detail', async ({ page }) => {
  await load(page, `<day-view data-date="2026-04-10" data-start-hour="auto">
    <calendar-event><time datetime="09:00">9</time> Standup</calendar-event></day-view>`);
  const detail = await page.evaluate(() => new Promise((resolve) => {
    const dv = document.querySelector('day-view');
    dv.addEventListener('day-view:event-click', (e) => resolve({ date: e.detail.date, time: e.detail.time }));
    /** @type {HTMLElement} */ (dv.querySelector('calendar-event')).click();
  }));
  expect(detail).toEqual({ date: '2026-04-10', time: '09:00' });
});

// ── 8s1z / rb3n: spans ─────────────────────────────────────────────

const SPANS = `
  <day-view data-start-hour="8" data-end-hour="17">
    <calendar-event id="dec" data-duration="1.5h"><time datetime="09:00">9</time> Decimal</calendar-event>
    <calendar-event id="iso" data-duration="PT1H30M"><time datetime="12:00">12</time> ISO</calendar-event>
    <calendar-event id="bad" data-duration="soon"><time datetime="15:00">3</time> Garbage</calendar-event>
  </day-view>`;

test('decimal and ISO-8601 durations size spans; garbage falls back to 1 hour', async ({ page }) => {
  await load(page, SPANS);
  await frames(page);
  const r = await page.evaluate(() => {
    const row = /** @type {HTMLElement} */ (document.querySelector('day-view ol > li')).getBoundingClientRect().height;
    const h = (id) => document.getElementById(id).getBoundingClientRect().height / row;
    return { dec: h('dec'), iso: h('iso'), bad: h('bad') };
  });
  expect(r.dec).toBeCloseTo(1.5, 1);
  expect(r.iso).toBeCloseTo(1.5, 1);
  expect(r.bad).toBeCloseTo(1, 1);
});

const OVERLAP = `
  <day-view data-start-hour="9" data-end-hour="13">
    <calendar-event id="a" data-duration="2h"><time datetime="10:00">10</time> Workshop</calendar-event>
    <calendar-event id="b" data-duration="1h"><time datetime="10:30">10:30</time> Interview</calendar-event>
    <calendar-event id="c" data-duration="30m"><time datetime="12:00">12</time> Solo</calendar-event>
  </day-view>`;

test('overlapping spans are laid out side by side', async ({ page }) => {
  await load(page, OVERLAP);
  await frames(page);
  const r = await page.evaluate(() => {
    const rect = (id) => document.getElementById(id).getBoundingClientRect();
    const a = rect('a'); const b = rect('b'); const c = rect('c');
    return { aw: a.width, bw: b.width, cw: c.width, aRight: a.right, bLeft: b.left };
  });
  expect(r.aw).toBeCloseTo(r.bw, 0);
  expect(r.cw).toBeGreaterThan(r.aw * 1.8);
  expect(r.bLeft).toBeGreaterThanOrEqual(r.aRight - 1);
});

test('spans re-measure when the view is resized', async ({ page }) => {
  await load(page, OVERLAP);
  await frames(page);
  const before = await page.evaluate(() => document.getElementById('a').getBoundingClientRect().width);
  await page.evaluate(() => { document.querySelector('day-view').setAttribute('style', 'inline-size: 300px'); });
  await page.waitForFunction((w) => Math.abs(document.getElementById('a').getBoundingClientRect().width - w) > 20, before);
  const after = await page.evaluate(() => {
    const a = document.getElementById('a').getBoundingClientRect();
    const dv = document.querySelector('day-view').getBoundingClientRect();
    return { right: a.right, dvRight: dv.right };
  });
  expect(after.right).toBeLessThanOrEqual(after.dvRight);
});

test('spans past the last visible hour are clipped and marked data-continues', async ({ page }) => {
  await load(page, `
    <day-view data-start-hour="8" data-end-hour="10">
      <calendar-event id="late" data-duration="3h"><time datetime="10:00">10</time> Long</calendar-event>
    </day-view>`);
  await frames(page);
  const r = await page.evaluate(() => {
    const ev = document.getElementById('late');
    const ol = document.querySelector('day-view ol').getBoundingClientRect();
    return {
      continues: ev.hasAttribute('data-continues'),
      label: ev.getAttribute('aria-label'),
      bottomGap: Math.abs(ev.getBoundingClientRect().bottom - ol.bottom),
    };
  });
  expect(r.continues).toBe(true);
  expect(r.label).toContain('continues');
  expect(r.bottomGap).toBeLessThan(2);
});

test('teardown cancels pending positioning and keeps author inline styles', async ({ page }) => {
  await load(page, `<p>x</p>`, { wait: '' });
  const r = await page.evaluate(async () => {
    const host = document.getElementById('host');
    host.insertAdjacentHTML('beforeend', `
      <day-view data-start-hour="auto">
        <calendar-event style="--event-color: rgb(1, 2, 3)" data-duration="2h"><time datetime="09:00">9</time> A</calendar-event>
      </day-view>`);
    const dv = host.querySelector('day-view');
    dv.remove();  // before the scheduled frame
    await new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)));
    const ev = /** @type {HTMLElement} */ (dv.querySelector('calendar-event'));
    const detached = { spanning: ev.classList.contains('dv-spanning'), position: ev.style.position };
    host.append(dv);
    await new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)));
    const attached = ev.classList.contains('dv-spanning');
    dv.remove();
    return { detached, attached, color: ev.style.getPropertyValue('--event-color'), position: ev.style.position };
  });
  expect(r.detached).toEqual({ spanning: false, position: '' });
  expect(r.attached).toBe(true);
  expect(r.color.trim()).toBe('rgb(1, 2, 3)');
  expect(r.position).toBe('');
});

// ── egb6: keyboard + a11y ──────────────────────────────────────────

const KB = `
  <day-view data-start-hour="auto">
    <calendar-event><time datetime="09:00">9:00</time> One <details><summary>More</summary><p>hidden</p></details></calendar-event>
    <calendar-event><time datetime="10:00">10:00</time> Two</calendar-event>
    <calendar-event><time datetime="11:00">11:00</time> Three</calendar-event>
  </day-view>`;

test('events get role=group + a name and exactly one tab stop', async ({ page }) => {
  await load(page, KB);
  const r = await page.evaluate(() => [...document.querySelectorAll('calendar-event')].map((e) => ({
    role: e.getAttribute('role'), label: e.getAttribute('aria-label'), tabindex: e.getAttribute('tabindex'),
  })));
  expect(r.map((e) => e.role)).toEqual(['group', 'group', 'group']);
  expect(r[0].label).toBe('9:00 One');
  expect(r.map((e) => e.tabindex)).toEqual(['0', '-1', '-1']);
});

test('Enter/Space fire event-click; Home/End/arrows move the roving stop', async ({ page }) => {
  await load(page, KB);
  await page.evaluate(() => {
    window.__clicks = [];
    document.querySelector('day-view').addEventListener('day-view:event-click', (e) => window.__clicks.push(e.detail.time));
  });
  const events = page.locator('calendar-event');
  await events.first().focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('End');
  await expect(events.nth(2)).toBeFocused();
  await page.keyboard.press('Space');
  await page.keyboard.press('Home');
  await expect(events.first()).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(events.nth(1)).toBeFocused();
  expect(await page.evaluate(() => window.__clicks)).toEqual(['09:00', '11:00']);
  const tabindexes = await page.evaluate(() => [...document.querySelectorAll('calendar-event')].map((e) => e.getAttribute('tabindex')));
  expect(tabindexes).toEqual(['-1', '0', '-1']);
});

test('Enter on a control inside an event does not fire event-click', async ({ page }) => {
  await load(page, KB);
  const n = await page.evaluate(() => {
    let count = 0;
    document.querySelector('day-view').addEventListener('day-view:event-click', () => { count++; });
    const summary = document.querySelector('summary');
    summary.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    return count;
  });
  expect(n).toBe(0);
});

test('reconnect keeps exactly one roving tab stop', async ({ page }) => {
  await load(page, KB);
  const events = page.locator('calendar-event');
  await events.first().focus();
  await page.keyboard.press('ArrowDown');
  const r = await page.evaluate(() => {
    const dv = document.querySelector('day-view');
    const host = dv.parentElement;
    for (let i = 0; i < 2; i++) { dv.remove(); host.append(dv); }
    return {
      upgraded: dv.hasAttribute('data-upgraded'),
      tabindexes: [...dv.querySelectorAll('calendar-event')].map((e) => e.getAttribute('tabindex')),
      lists: dv.querySelectorAll(':scope > ol').length,
    };
  });
  expect(r).toEqual({ upgraded: true, tabindexes: ['-1', '0', '-1'], lists: 1 });
});

// ── week-view: same parsing + keyboard ─────────────────────────────

const WEEK = `
  <week-view data-start-date="2026-04-06" data-days="3">
    <calendar-event id="w1" data-date="2026-04-06" data-duration="1.5h"><time datetime="2026-04-06T09:00">9</time> Plan</calendar-event>
    <calendar-event id="w2" data-date="2026-04-06" data-duration="PT1H"><time datetime="09:30">9:30</time> Sync</calendar-event>
    <calendar-event id="w3" data-date="2026-04-08"><time datetime="2026-04-08T11:00:00Z">11</time> Review</calendar-event>
  </week-view>`;

test('week-view: ISO times, decimal/ISO durations, overlap columns', async ({ page }) => {
  await load(page, WEEK, { wait: 'week-view' });
  await frames(page);
  const r = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('week-view tbody th time')].map((t) => t.getAttribute('datetime'));
    const rowH = /** @type {HTMLElement} */ (document.querySelector('week-view tbody tr')).getBoundingClientRect().height;
    const rect = (id) => document.getElementById(id).getBoundingClientRect();
    const w1 = rect('w1'); const w2 = rect('w2');
    return {
      rows,
      w3Day: document.getElementById('w3').closest('td')?.cellIndex,
      w1h: w1.height / rowH,
      w2h: w2.height / rowH,
      sideBySide: w2.left >= w1.right - 1,
    };
  });
  expect(r.rows).toEqual(['08:00', '09:00', '10:00', '11:00', '12:00']);
  expect(r.w3Day).toBe(3);
  expect(r.w1h).toBeCloseTo(1.5, 1);
  expect(r.w2h).toBeCloseTo(1, 1);
  expect(r.sideBySide).toBe(true);
});

test('week-view: Enter/Home/End, role/name, roving reset on reconnect and setter', async ({ page }) => {
  await load(page, WEEK, { wait: 'week-view' });
  await page.evaluate(() => {
    window.__clicks = [];
    document.querySelector('week-view').addEventListener('week-view:event-click', (e) => window.__clicks.push(e.detail.date));
  });
  const events = page.locator('week-view calendar-event');
  await events.first().focus();
  await page.keyboard.press('End');
  await expect(page.locator('#w3')).toBeFocused();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Home');
  await expect(events.first()).toBeFocused();
  const r = await page.evaluate(() => {
    const wv = /** @type {any} */ (document.querySelector('week-view'));
    const host = wv.parentElement;
    document.getElementById('w3').setAttribute('tabindex', '0'); // stale stop
    wv.remove(); host.append(wv);
    const afterReconnect = [...wv.querySelectorAll('calendar-event')].filter((e) => e.getAttribute('tabindex') === '0').length;
    wv.events = [{ time: '2026-04-07T14:00', text: 'Derived date' }];
    const ev = wv.querySelector('calendar-event');
    return {
      clicks: window.__clicks,
      role: document.getElementById('w1')?.getAttribute('role') ?? ev.getAttribute('role'),
      afterReconnect,
      upgraded: wv.hasAttribute('data-upgraded'),
      derivedDate: ev.dataset.date,
      placed: !!ev.closest('td'),
    };
  });
  expect(r.clicks).toEqual(['2026-04-08']);
  expect(r.role).toBe('group');
  expect(r.afterReconnect).toBe(1);
  expect(r.upgraded).toBe(true);
  expect(r.derivedDate).toBe('2026-04-07');
  expect(r.placed).toBe(true);
});
