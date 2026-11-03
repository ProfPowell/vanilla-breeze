/**
 * Data setters re-run the lifecycle through VBElement#_reinit (egb6).
 *
 * Before: setters stripped data-upgraded and called setup() directly, so
 * data-upgraded never came back (day-view fell back to its no-JS styles),
 * listen() handlers from the old render were never released, and setup()
 * ran even while disconnected. For each component: assign the data setter
 * (twice) and assert data-upgraded is back and exactly one generated
 * structure exists; assigning while disconnected must not render.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

const IMG = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><rect width="200" height="100" fill="#ccc"/></svg>'
);

/**
 * @param {import('playwright/test').Page} page
 * @param {string} tag
 * @param {string} body
 */
async function load(page, tag, body) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__setter-reinit-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <script type="module">import '/src/web-components/${tag}/logic.js';</script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction((t) => customElements.get(t), tag);
  await page.waitForSelector(`${tag}[data-upgraded]`);
}

const CASES = [
  {
    tag: 'day-view',
    body: `<day-view data-start-hour="auto"><calendar-event><time datetime="09:00">9</time> A</calendar-event></day-view>`,
    prop: 'events',
    value: [{ time: '09:00', text: 'One' }, { time: '11:00', text: 'Two', duration: '2h' }],
    structure: ':scope > ol',
  },
  {
    tag: 'week-view',
    body: `<week-view data-start-date="2026-04-06"><calendar-event data-date="2026-04-06"><time datetime="09:00">9</time> A</calendar-event></week-view>`,
    prop: 'events',
    value: [{ date: '2026-04-07', time: '10:00', text: 'Plan' }],
    structure: ':scope > table',
  },
  {
    tag: 'tab-set',
    body: `<tab-set><details open><summary>One</summary><p>1</p></details><details><summary>Two</summary><p>2</p></details></tab-set>`,
    prop: 'tabs',
    value: [{ label: 'A', content: 'a' }, { label: 'B', content: 'b' }, { label: 'C', content: 'c' }],
    structure: ':scope > details[open]',
  },
  {
    tag: 'glossary-wc',
    body: `<glossary-wc><dl><div data-term-id="a"><dt>Alpha</dt><dd>First</dd></div></dl></glossary-wc>`,
    prop: 'terms',
    value: [{ id: 'b', term: 'Beta', definition: 'Second' }, { id: 'g', term: 'Gamma', definition: 'Third' }],
    structure: '.gloss-categories',
  },
  {
    tag: 'image-map',
    body: `<image-map><img src="${IMG}" alt="Plan"><map-area shape="rect" coords="0,0,50,50" label="A"></map-area></image-map>`,
    prop: 'regions',
    value: [{ shape: 'rect', coords: '10,10,40,40', label: 'B' }, { shape: 'circle', coords: '70,50,10', label: 'C' }],
    structure: ':scope > svg',
  },
  {
    tag: 'site-map',
    body: `<site-map mode="ia-tree" title="IA"><nav><ul><li><a href="/">Home</a></li></ul></nav></site-map>`,
    prop: 'pages',
    value: [{ label: 'Home', href: '/', children: [{ label: 'About', href: '/about' }] }],
    structure: '.sm-header',
  },
];

for (const c of CASES) {
  test(`${c.tag}: .${c.prop} setter restores data-upgraded with one rendered structure`, async ({ page }) => {
    await load(page, c.tag, c.body);
    // Let async builds (image load, rAF) settle before reassigning.
    await page.waitForTimeout(50);
    const r = await page.evaluate(({ tag, prop, value, structure }) => {
      const el = /** @type {any} */ (document.querySelector(tag));
      el[prop] = value;
      el[prop] = value;
      return {
        upgraded: el.hasAttribute('data-upgraded'),
        structures: el.querySelectorAll(structure).length,
      };
    }, c);
    expect(r.upgraded).toBe(true);
    expect(r.structures).toBe(1);
  });

  test(`${c.tag}: .${c.prop} setter while disconnected does not run setup`, async ({ page }) => {
    await load(page, c.tag, c.body);
    await page.waitForTimeout(50);
    const r = await page.evaluate(({ tag, prop, value, structure }) => {
      const el = /** @type {any} */ (document.querySelector(tag));
      const parent = el.parentElement;
      el.remove();
      el[prop] = value;
      const whileDetached = {
        upgraded: el.hasAttribute('data-upgraded'),
        structures: el.querySelectorAll(structure).length,
      };
      parent.append(el);
      return {
        whileDetached,
        upgraded: el.hasAttribute('data-upgraded'),
        structures: el.querySelectorAll(structure).length,
      };
    }, c);
    expect(r.whileDetached.upgraded).toBe(false);
    expect(r.upgraded).toBe(true);
    expect(r.structures).toBe(1);
  });
}

test('flow-diagram: attribute refresh restores data-upgraded with one container', async ({ page }) => {
  await load(page, 'flow-diagram',
    `<flow-diagram title="Flow"><ol><li data-type="start">Begin</li><li data-type="end">Done</li></ol></flow-diagram>`);
  await page.evaluate(() => {
    const fd = /** @type {any} */ (document.querySelector('flow-diagram'));
    fd.setAttribute('title', 'Renamed');
    fd.setAttribute('title', 'Renamed again');
  });
  await page.waitForFunction(() => document.querySelector('flow-diagram .fd-title')?.textContent === 'Renamed again');
  const r = await page.evaluate(() => {
    const fd = /** @type {any} */ (document.querySelector('flow-diagram'));
    return {
      upgraded: fd.hasAttribute('data-upgraded'),
      containers: fd.querySelectorAll('.fd-container').length,
      live: fd.querySelectorAll('.fd-live').length,
    };
  });
  expect(r).toEqual({ upgraded: true, containers: 1, live: 1 });
});

test('day-view: one event-click per click after repeated .events assignment (no stacked listeners)', async ({ page }) => {
  await load(page, 'day-view', CASES[0].body);
  const count = await page.evaluate(() => {
    const dv = /** @type {any} */ (document.querySelector('day-view'));
    let n = 0;
    dv.addEventListener('day-view:event-click', () => { n++; });
    for (let i = 0; i < 3; i++) dv.events = [{ time: '09:00', text: 'Only' }];
    /** @type {HTMLElement} */ (dv.querySelector('calendar-event')).click();
    return n;
  });
  expect(count).toBe(1);
});
