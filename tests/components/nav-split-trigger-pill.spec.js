/**
 * nav + drop-down split trigger: the pill covers the link AND its chevron.
 *
 * drop-down's disclosure pattern renders the nav trigger as a link plus a
 * sibling <button data-dropdown-toggle>. The nav pill used to be painted on
 * the link alone, so it ended just after the text (the link's end padding is
 * trimmed so the chevron sits close) and the chevron sat outside it —
 * the off-centre "Guide" pill on the docs header (2026-11-06).
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

const NAV = (cls) => `
  <header>
    <nav class="${cls}" aria-label="Main">
      <drop-down id="cur" position="bottom-start" hover>
        <a href="/guide/" data-trigger aria-current="page">Guide</a>
        <menu><li><a href="/a/">A</a></li></menu>
      </drop-down>
      <drop-down id="other" position="bottom-start" hover>
        <a href="/api/" data-trigger>API</a>
        <menu><li><a href="/b/">B</a></li></menu>
      </drop-down>
    </nav>
  </header>`;

async function load(page, body) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__nav-split-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en" data-mode="light"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <script type="module" src="/src/main.js"></script>
      </head><body>${body}</body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForSelector('#cur > button[data-dropdown-toggle]');
  await page.waitForSelector('#other > button[data-dropdown-toggle]');
}

/** Host paint, link paint and the geometry of the pair inside the host. */
function measure(page, id) {
  return page.evaluate((hostId) => {
    const host = document.getElementById(hostId);
    const link = host.querySelector(':scope > [data-trigger]');
    const toggle = host.querySelector(':scope > button[data-dropdown-toggle]');
    const h = host.getBoundingClientRect();
    const l = link.getBoundingClientRect();
    const t = toggle.getBoundingClientRect();
    return {
      hostBg: getComputedStyle(host).backgroundColor,
      linkBg: getComputedStyle(link).backgroundColor,
      toggleColor: getComputedStyle(toggle).color,
      linkColor: getComputedStyle(link).color,
      toggleInside: t.left >= h.left - 0.5 && t.right <= h.right + 0.5,
      startPad: l.left - h.left + parseFloat(getComputedStyle(link).paddingInlineStart),
      endPad: h.right - t.right,
    };
  }, id);
}

const TRANSPARENT = 'rgba(0, 0, 0, 0)';

test('current item: one pill wraps the link and the chevron, chevron takes the active colour', async ({ page }) => {
  await load(page, NAV('horizontal pills'));
  // The toggle is added on upgrade, so the link fades out of its old pill.
  await expect.poll(async () => (await measure(page, 'cur')).linkBg).toBe(TRANSPARENT);
  const m = await measure(page, 'cur');
  expect(m.hostBg).not.toBe(TRANSPARENT);
  expect(m.toggleInside).toBe(true);
  expect(m.toggleColor).toBe(m.linkColor);
  // Balanced: the space after the chevron is within a few px of the space
  // before the text (it was ~2px against ~13px).
  expect(m.endPad).toBeGreaterThan(2);
  expect(Math.abs(m.startPad - m.endPad)).toBeLessThan(m.startPad);
});

test('hover and open paint the whole item, not just the link', async ({ page }) => {
  await load(page, NAV('horizontal pills'));
  expect((await measure(page, 'other')).hostBg).toBe(TRANSPARENT);

  await page.hover('#other > [data-trigger]');
  await expect.poll(async () => (await measure(page, 'other')).hostBg).not.toBe(TRANSPARENT);
  await expect.poll(async () => (await measure(page, 'other')).linkBg).toBe(TRANSPARENT);

  await page.mouse.move(0, 0);
  await page.click('#other > button[data-dropdown-toggle]');
  await expect(page.locator('#other > button[data-dropdown-toggle]')).toHaveAttribute('aria-expanded', 'true');
  await page.mouse.move(0, 0);
  await expect.poll(async () => (await measure(page, 'other')).hostBg).not.toBe(TRANSPARENT);
});

test('tabs variant keeps its underline and paints no pill', async ({ page }) => {
  await load(page, NAV('tabs'));
  const m = await measure(page, 'cur');
  expect(m.hostBg).toBe(TRANSPARENT);
});

/* ── 2026-11-10 tutorial review ─────────────────────────────────────────── */

const lum = (page, color) => page.evaluate((c) => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 1;
  const x = cv.getContext('2d'); x.fillStyle = c; x.fillRect(0, 0, 1, 1);
  const [r, g, b] = [...x.getImageData(0, 0, 1, 1).data].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}, color);
const contrast = async (page, a, b) => { const [p, q] = [await lum(page, a), await lum(page, b)].sort((m, n) => n - m); return (p + 0.05) / (q + 0.05); };

for (const mode of ['light', 'dark']) {
  test(`current pill keeps a readable label while hovered and open (${mode})`, async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop', 'hover');
    await load(page, NAV('horizontal pills'));
    await page.evaluate((m) => { document.documentElement.dataset.mode = m; }, mode);
    await page.hover('#cur > [data-trigger]');
    await expect(page.locator('#cur > button[data-dropdown-toggle]')).toHaveAttribute('aria-expanded', 'true');
    await page.waitForTimeout(300); // colour transition
    const m = await page.evaluate(() => {
      const host = document.getElementById('cur');
      const cs = (el) => getComputedStyle(el);
      return {
        bg: cs(host).backgroundColor,
        label: cs(host.querySelector(':scope > [data-trigger]')).color,
        chevron: cs(host.querySelector(':scope > button[data-dropdown-toggle]')).color,
      };
    });
    expect(await contrast(page, m.label, m.bg), JSON.stringify(m)).toBeGreaterThanOrEqual(4.5);
    expect(await contrast(page, m.chevron, m.bg), JSON.stringify(m)).toBeGreaterThanOrEqual(3);
  });

  test(`a .button inside a nav keeps a readable label on hover (${mode})`, async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop', 'hover');
    await load(page, `${NAV('horizontal pills')}
      <nav aria-label="Pager"><a id="next" class="button" href="/next/">Next</a>
        <a id="prev" class="button secondary" href="/prev/">Previous</a></nav>`);
    await page.evaluate((m) => { document.documentElement.dataset.mode = m; }, mode);
    for (const id of ['next', 'prev']) {
      await page.hover(`#${id}`);
      await page.waitForTimeout(300);
      const m = await page.evaluate((i) => {
        const el = document.getElementById(i); const cs = getComputedStyle(el);
        // Composite the (possibly translucent) fill over the page background.
        const cv = document.createElement('canvas'); cv.width = cv.height = 1;
        const x = cv.getContext('2d');
        x.fillStyle = getComputedStyle(document.documentElement).backgroundColor; x.fillRect(0, 0, 1, 1);
        x.fillStyle = getComputedStyle(document.body).backgroundColor; x.fillRect(0, 0, 1, 1);
        x.fillStyle = cs.backgroundColor; x.fillRect(0, 0, 1, 1);
        const [r, g, b] = x.getImageData(0, 0, 1, 1).data;
        return { color: cs.color, bg: `rgb(${r}, ${g}, ${b})` };
      }, id);
      expect(await contrast(page, m.color, m.bg), `${id} ${JSON.stringify(m)}`).toBeGreaterThanOrEqual(4.5);
    }
  });
}

test('nav-bar marks the section trigger when only a nested menu link matches', async ({ page }) => {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
    <link rel="stylesheet" href="/src/main.css"><script type="module" src="/src/main.js"></script></head><body>
    <nav-bar><nav class="horizontal pills" aria-label="Main"><ul>
      <li><drop-down id="start" hover><a href="/docs/quick-start/" data-trigger data-nav-link>Start</a>
        <menu><li><a href="/docs/quick-start/">Quick Start</a></li><li><a href="/docs/tutorial/">Tutorial</a></li></menu></drop-down></li>
      <li><drop-down id="api" hover><a href="/docs/elements/" data-trigger data-nav-link>API</a>
        <menu><li><a href="/docs/elements/">Elements</a></li><li><a href="/docs/attributes/">Attributes</a></li></menu></drop-down></li>
    </ul></nav></nav-bar></body></html>`;
  const state = () => page.evaluate(() => Object.fromEntries([...document.querySelectorAll('a[data-nav-link]')]
    .map((a) => [a.textContent, a.getAttribute('aria-current')])));
  for (const [path, want] of [
    ['/docs/tutorial/landing-page/', { Start: 'true', API: null }],   // nested prefix
    ['/docs/attributes/', { Start: null, API: 'true' }],              // nested exact
    ['/docs/quick-start/', { Start: 'page', API: null }],             // the trigger's own page
    ['/docs/elements/native/a/', { Start: null, API: 'page' }],       // trigger prefix (unchanged)
    ['/elsewhere/', { Start: null, API: null }],
  ]) {
    await page.route(`**${path}`, (route) => route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: html }));
    await page.goto(path, { waitUntil: 'load' });
    await page.waitForSelector('nav-bar[data-upgraded]');
    expect(await state(), path).toEqual(want);
  }
  // The section trigger is painted like a current one.
  await page.goto('/docs/attributes/', { waitUntil: 'load' });
  await page.waitForSelector('#api > button[data-dropdown-toggle]');
  const bgs = await page.evaluate(() => ['start', 'api'].map((id) => getComputedStyle(document.getElementById(id)).backgroundColor));
  expect(bgs[1]).not.toBe(bgs[0]);
});
