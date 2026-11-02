/**
 * compare-surface — review fixes (vanilla-breeze-ra3u).
 *
 * Covers: observed `position` attribute, silent setup/programmatic writes,
 * direction-aware position model (dir="rtl"), slider a11y (valuetext,
 * Home/End/PageUp/PageDown, label), pointercancel ending a drag, and
 * hiding extra children.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

const PANELS = `<article style="block-size:200px;background:#c33">A</article>
  <article style="block-size:200px;background:#33c">B</article>`;

async function load(page, body, { dir = 'ltr' } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__compare-surface-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en" dir="${dir}"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <script>
        window.__changes = [];
        document.addEventListener('compare-surface:change', (e) => window.__changes.push(e.detail.position));
      </script>
      <script type="module">import '/src/web-components/compare-surface/logic.js';</script>
      </head><body><main style="inline-size:600px">${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForSelector('compare-surface[data-upgraded]');
}

const divider = (page) => page.locator('compare-surface .comparison-divider');

test('position attribute is observed after setup', async ({ page }) => {
  await load(page, `<compare-surface>${PANELS}</compare-surface>`);
  await page.evaluate(() => document.querySelector('compare-surface').setAttribute('position', '30'));
  await expect(divider(page)).toHaveAttribute('aria-valuenow', '30');
  const pos = await page.evaluate(() => document.querySelector('compare-surface').style.getPropertyValue('--_position'));
  expect(pos).toBe('30%');
});

test('setup keeps the author attribute and fires no change event', async ({ page }) => {
  await load(page, `<compare-surface position="25.6">${PANELS}</compare-surface>`);
  await page.waitForTimeout(50);
  const r = await page.evaluate(() => ({
    attr: document.querySelector('compare-surface').getAttribute('position'),
    changes: window.__changes.length,
  }));
  expect(r).toEqual({ attr: '25.6', changes: 0 });
  await expect(divider(page)).toHaveAttribute('aria-valuenow', '26');
});

test('property writes are silent; user changes fire integer detail and reflect', async ({ page }) => {
  await load(page, `<compare-surface>${PANELS}</compare-surface>`);
  await page.evaluate(() => { document.querySelector('compare-surface').position = 40.4; });
  expect(await page.evaluate(() => window.__changes)).toEqual([]);
  await expect(page.locator('compare-surface')).toHaveAttribute('position', '40');
  await divider(page).focus();
  await page.keyboard.press('ArrowRight');
  expect(await page.evaluate(() => window.__changes)).toEqual([41]);
  await expect(page.locator('compare-surface')).toHaveAttribute('position', '41');
});

test('slider a11y: valuetext, Home/End/PageUp/PageDown, label', async ({ page }) => {
  await load(page, `<compare-surface label="Kitchen before and after">${PANELS}</compare-surface>`);
  const d = divider(page);
  await expect(d).toHaveAttribute('aria-label', 'Kitchen before and after');
  await expect(d).toHaveAttribute('aria-valuetext', '50%');
  await d.focus();
  await page.keyboard.press('End');
  await expect(d).toHaveAttribute('aria-valuenow', '100');
  await page.keyboard.press('PageDown');
  await expect(d).toHaveAttribute('aria-valuenow', '90');
  await page.keyboard.press('Home');
  await expect(d).toHaveAttribute('aria-valuenow', '0');
  await page.keyboard.press('PageUp');
  await expect(d).toHaveAttribute('aria-valuenow', '10');
  await expect(d).toHaveAttribute('aria-valuetext', '10%');
  await page.evaluate(() => document.querySelector('compare-surface').setAttribute('label', 'Renamed'));
  await expect(d).toHaveAttribute('aria-label', 'Renamed');
});

test('LTR: divider, clip and pointer agree (position from left)', async ({ page }) => {
  await load(page, `<compare-surface position="25">${PANELS}</compare-surface>`);
  const geo = await page.evaluate(() => {
    const host = document.querySelector('compare-surface').getBoundingClientRect();
    const d = document.querySelector('.comparison-divider').getBoundingClientRect();
    return { host, center: d.left + d.width / 2 };
  });
  expect(Math.abs(geo.center - (geo.host.left + geo.host.width * 0.25))).toBeLessThan(3);
  // Drag to 75% from the left
  const box = await divider(page).boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(geo.host.left + geo.host.width * 0.75, box.y + box.height / 2, { steps: 4 });
  await page.mouse.up();
  await expect(divider(page)).toHaveAttribute('aria-valuenow', '75');
});

test('RTL: position is measured from the right; divider, clip, pointer and keys agree', async ({ page }) => {
  await load(page, `<compare-surface position="25">${PANELS}</compare-surface>`, { dir: 'rtl' });
  const geo = await page.evaluate(() => {
    const hostEl = document.querySelector('compare-surface');
    const host = hostEl.getBoundingClientRect();
    const d = document.querySelector('.comparison-divider').getBoundingClientRect();
    const second = hostEl.children[1];
    return { host, center: d.left + d.width / 2, clip: getComputedStyle(second).clipPath };
  });
  // Divider sits 25% from the right edge
  expect(Math.abs(geo.center - (geo.host.right - geo.host.width * 0.25))).toBeLessThan(3);
  // Second child is clipped from the right (inline-start) side
  expect(geo.clip).toMatch(/inset\(0(px)? 25% 0(px)? 0(px)?\)/);

  // Drag to the point 60% from the right
  const box = await divider(page).boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(geo.host.right - geo.host.width * 0.6, box.y + box.height / 2, { steps: 4 });
  await page.mouse.up();
  await expect(divider(page)).toHaveAttribute('aria-valuenow', '60');

  // ArrowRight moves the divider visually right = toward inline-start = smaller position
  await divider(page).focus();
  await page.keyboard.press('ArrowRight');
  await expect(divider(page)).toHaveAttribute('aria-valuenow', '59');
});

test('pointercancel ends the drag', async ({ page }) => {
  await load(page, `<compare-surface>${PANELS}</compare-surface>`);
  const box = await divider(page).boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.evaluate(() => {
    document.querySelector('.comparison-divider')
      .dispatchEvent(new PointerEvent('pointercancel', { bubbles: true, pointerId: 1 }));
  });
  const host = await page.locator('compare-surface').boundingBox();
  await page.mouse.move(host.x + host.width * 0.9, box.y + box.height / 2, { steps: 4 });
  await expect(divider(page)).toHaveAttribute('aria-valuenow', '50');
  await page.mouse.up();
});

test('extra children are hidden once upgraded', async ({ page }) => {
  await load(page, `<compare-surface>${PANELS}<article id="extra">C</article></compare-surface>`);
  await expect(page.locator('#extra')).toBeHidden();
  await expect(divider(page)).toBeVisible();
});
