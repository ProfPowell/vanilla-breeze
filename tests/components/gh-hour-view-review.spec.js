/**
 * hour-view — review fixes (vanilla-breeze-wja7).
 *
 * Covers: plain hour-view stacks events instead of drawing them on top of
 * each other; data-overlap gives N equal columns that long titles cannot
 * widen; :30 placement survives both modes; day-view / week-view only set
 * data-overlap when events share a half-hour row; hour-view placement is
 * owned by day-view (week-view cells unaffected).
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

async function load(page, body, { modules = [] } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__hour-view-${Math.random().toString(36).slice(2)}.html`;
  const imports = modules.map((m) => `import '/src/web-components/${m}/logic.js';`).join('\n');
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <script type="module">${imports}</script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  for (const m of modules) {
    await page.waitForFunction((n) => customElements.get(n), m);
    await page.waitForSelector(`${m}[data-upgraded]`);
  }
}

/** Bounding rects of the given hour-view's events (relative to the hour-view). */
function rects(page, selector) {
  return page.evaluate((sel) => {
    const hv = document.querySelector(sel);
    const base = hv.getBoundingClientRect();
    return {
      width: base.width,
      height: base.height,
      events: [...hv.querySelectorAll(':scope > calendar-event')].map((e) => {
        const r = e.getBoundingClientRect();
        return { left: r.left - base.left, top: r.top - base.top, width: r.width, height: r.height };
      }),
    };
  }, selector);
}

const overlaps = (a, b) =>
  a.left < b.left + b.width - 0.5 && b.left < a.left + a.width - 0.5 &&
  a.top < b.top + b.height - 0.5 && b.top < a.top + a.height - 0.5;

const ev = (time, title, attrs = '') =>
  `<calendar-event data-category="meeting"${attrs}><time datetime="${time}">${time}</time> ${title}</calendar-event>`;

/** Hand-authored day-view (pre-built <ol>) with one hour-view per row. */
const authored = (hours) => `<day-view data-date="2026-07-06" style="inline-size: 480px"><ol>${
  hours.map(([h, attrs, events], i) =>
    `<li><time datetime="${h}:00">${h}</time><hour-view id="h${i}"${attrs}>${events.join('')}</hour-view></li>`).join('')
}</ol></day-view>`;

test('plain hour-view stacks two events instead of overlapping them', async ({ page }) => {
  await load(page, authored([['09', '', [ev('09:00', 'Standup'), ev('09:00', 'Planning')]]]), { modules: ['day-view'] });
  const { width, events } = await rects(page, '#h0');
  expect(events).toHaveLength(2);
  expect(overlaps(events[0], events[1])).toBe(false);
  expect(events[1].top).toBeGreaterThan(events[0].top);
  // Full width each
  for (const e of events) expect(e.width).toBeGreaterThan(width * 0.9);
});

test('plain hour-view keeps :00 on top and data-start="30" on the bottom half', async ({ page }) => {
  await load(page, authored([['12', '', [ev('12:30', 'Lunch', ' data-start="30"'), ev('12:00', 'Call')]]]), { modules: ['day-view'] });
  const { height, events } = await rects(page, '#h0');
  const [lunch, call] = events;
  expect(call.top).toBeLessThan(height / 2);
  expect(lunch.top).toBeGreaterThanOrEqual(height / 2 - 2);
  expect(overlaps(lunch, call)).toBe(false);
});

test('standalone hour-view (no day-view) also stacks', async ({ page }) => {
  await load(page, `<hour-view id="h0">${ev('09:00', 'A')}${ev('09:00', 'B')}${ev('09:00', 'C')}</hour-view>`);
  const { events } = await rects(page, '#h0');
  expect(overlaps(events[0], events[1])).toBe(false);
  expect(overlaps(events[1], events[2])).toBe(false);
});

test('data-overlap with three events gives equal columns that long titles cannot widen', async ({ page }) => {
  const long = 'Quarterly business review with the extended leadership team and partners';
  await load(page, authored([
    ['14', ' data-overlap', [ev('14:00', 'Review'), ev('14:00', '1:1'), ev('14:00', long)]],
    ['15', ' data-overlap', [ev('15:00', 'A'), ev('15:00', 'B')]],
  ]), { modules: ['day-view'] });
  const three = await rects(page, '#h0');
  const widths = three.events.map((e) => e.width);
  expect(Math.max(...widths) - Math.min(...widths)).toBeLessThan(1.5);
  expect(widths[0] * 3).toBeLessThanOrEqual(three.width + 1);
  // Same row, side by side, none overlapping, all inside the hour-view
  for (let i = 0; i < 3; i++) {
    expect(three.events[i].top).toBeCloseTo(three.events[0].top, 0);
    expect(three.events[i].left + three.events[i].width).toBeLessThanOrEqual(three.width + 0.5);
    for (let j = i + 1; j < 3; j++) expect(overlaps(three.events[i], three.events[j])).toBe(false);
  }
  const two = await rects(page, '#h1');
  expect(Math.abs(two.events[0].width - two.events[1].width)).toBeLessThan(1.5);
  expect(overlaps(two.events[0], two.events[1])).toBe(false);
  // Hour-view itself does not grow past its day-view column
  expect(three.width).toBeCloseTo(two.width, 0);
});

test('data-overlap keeps :30 events in the bottom half', async ({ page }) => {
  await load(page, authored([['10', ' data-overlap', [ev('10:00', 'A'), ev('10:00', 'B'), ev('10:30', 'C', ' data-start="30"')]]]), { modules: ['day-view'] });
  const { height, events } = await rects(page, '#h0');
  expect(events[0].top).toBeLessThan(height / 2);
  expect(events[1].top).toBeLessThan(height / 2);
  expect(events[2].top).toBeGreaterThanOrEqual(height / 2 - 2);
  for (const e of events) for (const f of events) if (e !== f) expect(overlaps(e, f)).toBe(false);
});

test('day-view generated grid: :00 + :30 are not split, same-half clash is', async ({ page }) => {
  await load(page, `<day-view data-date="2026-07-06" data-start-hour="8" data-end-hour="12" style="inline-size: 480px">
    ${ev('09:00', 'Standup')}${ev('09:30', 'Sync')}
    ${ev('10:00', 'Review')}${ev('10:00', '1:1')}
    ${ev('11:00', 'Workshop', ' data-duration="2h"')}${ev('11:00', 'Call')}
  </day-view>`, { modules: ['day-view'] });
  const flags = await page.evaluate(() => Object.fromEntries([...document.querySelectorAll('day-view hour-view')].map((hv) =>
    [hv.closest('li').querySelector('time').getAttribute('datetime'), hv.hasAttribute('data-overlap')])));
  expect(flags['09:00']).toBe(false);
  expect(flags['10:00']).toBe(true);
  expect(flags['11:00']).toBe(false); // the spanning event is laid out by JS
  await page.evaluate(() => {
    document.querySelectorAll('day-view li').forEach((li, i) => { li.querySelector('hour-view').id = `g${i}`; });
  });
  const nine = await rects(page, 'day-view li:nth-child(2) > hour-view');
  for (const e of nine.events) expect(e.width).toBeGreaterThan(nine.width * 0.9);
  expect(overlaps(nine.events[0], nine.events[1])).toBe(false);
});

test('hour-view sits in day-view column 2 spanning both rows', async ({ page }) => {
  await load(page, authored([['09', '', [ev('09:00', 'Standup')]]]), { modules: ['day-view'] });
  const r = await page.evaluate(() => {
    const hv = document.querySelector('#h0');
    const cs = getComputedStyle(hv);
    const li = hv.parentElement.getBoundingClientRect();
    const t = hv.parentElement.querySelector('time').getBoundingClientRect();
    const h = hv.getBoundingClientRect();
    return { col: cs.gridColumnStart, row: cs.gridRowEnd, afterLabel: h.left >= t.right - 0.5, fullHeight: Math.abs(h.height - li.height) < 2 };
  });
  expect(r).toEqual({ col: '2', row: '-1', afterLabel: true, fullHeight: true });
});

test('week-view: cells fill, non-clashing halves not split, clashes are', async ({ page }) => {
  await load(page, `<week-view data-start-date="2026-07-06" data-days="3" data-start-hour="8" data-end-hour="11" style="inline-size: 720px">
    <calendar-event data-date="2026-07-06"><time datetime="09:00">9:00</time> A</calendar-event>
    <calendar-event data-date="2026-07-06"><time datetime="09:30">9:30</time> B</calendar-event>
    <calendar-event data-date="2026-07-07"><time datetime="10:00">10:00</time> C</calendar-event>
    <calendar-event data-date="2026-07-07"><time datetime="10:00">10:00</time> D</calendar-event>
    <calendar-event data-date="2026-07-07"><time datetime="10:00">10:00</time> E</calendar-event>
  </week-view>`, { modules: ['week-view'] });
  const r = await page.evaluate(() => [...document.querySelectorAll('week-view td > hour-view')].map((hv) => {
    const td = hv.parentElement.getBoundingClientRect();
    const h = hv.getBoundingClientRect();
    const evs = [...hv.children].map((e) => e.getBoundingClientRect());
    return {
      overlap: hv.hasAttribute('data-overlap'),
      fills: Math.abs(h.height - td.height) < 2 && Math.abs(h.width - td.width) < 2,
      widths: evs.map((e) => Math.round(e.width)),
      hv: Math.round(h.width),
    };
  }));
  expect(r).toHaveLength(2);
  const [ab, cde] = r;
  expect(ab.overlap).toBe(false);
  expect(ab.fills).toBe(true);
  for (const w of ab.widths) expect(w).toBeGreaterThan(ab.hv * 0.9);
  expect(cde.overlap).toBe(true);
  expect(cde.fills).toBe(true);
  expect(Math.max(...cde.widths) - Math.min(...cde.widths)).toBeLessThanOrEqual(1);
  expect(cde.widths[0] * 3).toBeLessThanOrEqual(cde.hv + 1);
});
