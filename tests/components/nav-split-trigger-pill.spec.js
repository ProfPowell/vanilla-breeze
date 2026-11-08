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
