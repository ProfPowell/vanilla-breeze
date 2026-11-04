/**
 * main + map/area — M+N review fixes.
 *
 * Covers: capped variants (contained/narrow/wide) no longer collapse to
 * their padding as grid/flex items; main.with-sidebar's content column shrinks below wide content
 * (minmax(0, 1fr)); main.narrow follows --measure-normal; the map/area
 * focus ring still applies after moving to native-elements/map; the
 * full-page demo gives main the stretch row and keeps every heading in a
 * landmark.
 *
 * Tests the working tree: /src and the demo are served from disk.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';

const REPO = join(import.meta.dirname, '..', '..');

async function routeSrc(page) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
}

async function load(page, body, { head = '' } = {}) {
  await routeSrc(page);
  const url = `/__mn-main-map-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">${head}
      </head><body>${body}</body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
}

test('with-sidebar: a wide <pre> does not push the grid past its container', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 700 });
  await load(page, `
    <section id="box" style="inline-size: 800px">
      <main class="with-sidebar" id="m">
        <article><pre>${'x'.repeat(400)}</pre></article>
        <aside><p>Side</p></aside>
      </main>
    </section>`);
  const r = await page.evaluate(() => {
    const m = document.getElementById('m');
    return {
      main: m.getBoundingClientRect().width,
      scroll: m.scrollWidth,
      aside: m.querySelector('aside').getBoundingClientRect().right,
      box: document.getElementById('box').getBoundingClientRect().right,
    };
  });
  expect(r.main).toBeLessThanOrEqual(800);
  expect(r.scroll).toBeLessThanOrEqual(800);
  expect(r.aside).toBeLessThanOrEqual(r.box + 0.5);
});

for (const cls of ['contained', 'narrow', 'wide']) {
  test(`${cls}: does not collapse as a grid or flex item (auto margins + container-type)`, async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 700 });
    await load(page, `
      <section id="g" style="display: grid; grid-template-columns: 1fr"><main class="${cls}"><p>Grid</p></main></section>
      <section id="f" style="display: flex; flex-direction: column"><main class="${cls}"><p>Flex</p></main></section>`);
    const widths = await page.evaluate(() =>
      [...document.querySelectorAll('main')].map((m) => m.getBoundingClientRect().width));
    for (const w of widths) expect(w).toBeGreaterThan(300);
  });
}

test('narrow: max-inline-size tracks --measure-normal', async ({ page }) => {
  await load(page, `<main class="narrow" id="m" style="--measure-normal: 30ch"><p>Text</p></main>
    <p id="probe" style="inline-size: 30ch">probe</p>`);
  const r = await page.evaluate(() => ({
    max: getComputedStyle(document.getElementById('m')).maxInlineSize,
    probe: getComputedStyle(document.getElementById('probe')).inlineSize,
  }));
  expect(r.max).toBe(r.probe);
});

test('area keeps the interactive focus ring from native-elements/map', async ({ page }) => {
  const svg = encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><rect width="200" height="100" fill="#ccc"/></svg>');
  await load(page, `<main>
    <img src="data:image/svg+xml,${svg}" alt="Plan" usemap="#p" width="200" height="100">
    <map name="p"><area shape="rect" coords="0,0,100,100" href="#a" alt="Room A"></map>
  </main>`);
  await page.keyboard.press('Tab');
  const r = await page.evaluate(() => {
    const a = document.querySelector('area');
    const probe = document.createElement('span');
    probe.style.color = 'var(--color-interactive)';
    document.body.append(probe);
    return {
      focused: document.activeElement === a,
      style: getComputedStyle(a).outlineStyle,
      color: getComputedStyle(a).outlineColor,
      expected: getComputedStyle(probe).color,
    };
  });
  test.skip(!r.focused, 'browser does not tab to image-map areas here');
  expect(r.style).toBe('solid');
  expect(r.color).toBe(r.expected);
});

test('full-page demo: main takes the stretch row, headings sit in landmarks', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 800 });
  await routeSrc(page);
  const html = readFileSync(join(REPO, 'demos/snippets/demos/main-full-page.html'), 'utf8');
  await page.route('**/__mn-full-page.html', (route) => route.fulfill({
    status: 200, contentType: 'text/html; charset=utf-8', body: html,
  }));
  await page.goto('/__mn-full-page.html', { waitUntil: 'load' });
  const r = await page.evaluate(() => {
    const rect = (s) => document.querySelector(s).getBoundingClientRect();
    return {
      main: rect('main').height,
      header: rect('body > header').height,
      footerBottom: rect('body > footer').bottom,
      vh: innerHeight,
      strayHeadings: [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')]
        .filter((h) => !h.closest('main, header, footer, nav, aside')).length,
    };
  });
  expect(r.main).toBeGreaterThan(r.header * 2);
  expect(Math.abs(r.footerBottom - r.vh)).toBeLessThan(2);
  expect(r.strayHeadings).toBe(0);
});
