/**
 * <analytics-panel> — the panel must report what the analytics runtime is
 * really doing (Analytics.getStatus()), honour every opt-out signal, keep
 * focus and its live region across updates, and stay legible in dark mode.
 *
 * Tests the WORKING TREE: /src/** is served from disk so the spec does not
 * depend on the state of the built site snapshot.
 */
import { test, expect } from 'playwright/test';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/**
 * @param {import('playwright/test').Page} page
 * @param {{ init?: object | null, htmlAttrs?: string, gpc?: boolean }} [opts]
 */
async function load(page, {
  init = { transport: 'beacon', siteId: 'test' }, htmlAttrs = '', gpc = false,
  panelAttrs = 'heading="Your analytics data"',
} = {}) {
  if (gpc) {
    await page.addInitScript(() => {
      Object.defineProperty(Navigator.prototype, 'globalPrivacyControl', { get: () => true, configurable: true });
    });
  }
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const beacons = [];
  await page.route('**/api/analytics/**', (route) => {
    beacons.push(route.request().url());
    return route.fulfill({ status: 204 });
  });
  const url = `/__analytics-panel-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en" ${htmlAttrs}><head><meta charset="utf-8">
      <meta name="vb:topic" content="privacy">
      <link rel="stylesheet" href="/src/main.css"></head><body><main>
      <analytics-panel id="panel" ${panelAttrs}></analytics-panel>
      </main>
      <script type="module">
        const { Analytics } = await import('/src/lib/analytics.js');
        await import('/src/web-components/analytics-panel/logic.js');
        const init = ${JSON.stringify(init)};
        if (init) Analytics.init(init);
        window.Analytics = Analytics;
        window.__ready = true;
      </script></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__ready === true);
  await expect(page.locator('#panel')).toHaveAttribute('data-upgraded', '');
  return { beacons };
}

test.afterEach(async ({ page }) => {
  await page.evaluate(() => sessionStorage.clear()).catch(() => {});
});

test('normal visitor: active, fields come from the runtime', async ({ page }) => {
  await load(page);
  const panel = page.locator('#panel');
  await expect(panel).toHaveAttribute('data-state', 'active');
  await expect(panel).not.toHaveAttribute('data-reason', /.*/);
  await expect(panel.getByRole('status')).toContainText('Active');
  await expect(panel.getByRole('status')).toContainText('/api/analytics/hit');

  const collects = await page.evaluate(() => window.Analytics.getStatus().collects);
  expect(collects).toEqual(['name', 'ts', 'site', 'path', 'referrer', 'context', 'props']);
  const fields = panel.locator('dt', { hasText: 'Fields' }).locator('xpath=following-sibling::dd[1]');
  await expect(fields).toHaveText(collects.join(', '));
  // Page context lists the vb:* taxonomy key the page actually carries.
  await expect(panel.locator('dt', { hasText: 'Page context' }).locator('xpath=following-sibling::dd[1]'))
    .toContainText('topic');
  // The automatic page view was sent and counted.
  await expect(panel.locator('dt', { hasText: 'Sent from this page' }).locator('xpath=following-sibling::dd[1]'))
    .toHaveText('1');
  // Nothing local to clear, so no "Clear my data" button.
  await expect(panel.getByRole('button', { name: /clear/i })).toHaveCount(0);
});

test('GPC: off with reason gpc, Resume unavailable with an explanation', async ({ page }) => {
  const { beacons } = await load(page, { gpc: true });
  const panel = page.locator('#panel');
  await expect(panel).toHaveAttribute('data-state', 'off');
  await expect(panel).toHaveAttribute('data-reason', 'gpc');
  await expect(panel.getByRole('status')).toContainText('Global Privacy Control');
  expect(beacons).toEqual([]);

  const toggle = panel.locator('[data-analytics-action="toggle"]');
  await toggle.click();
  await expect(toggle).toHaveText('Resume analytics');
  await expect(toggle).toHaveAttribute('aria-disabled', 'true');
  await expect(toggle).toHaveAccessibleDescription(/Resume is unavailable.*Global Privacy Control/);
  await toggle.click({ force: true }); // ignored while aria-disabled
  await expect(toggle).toHaveText('Resume analytics');
  expect(await page.evaluate(() => sessionStorage.getItem('vb_optout'))).toBe('1');
});

test('runtime not initialised: says so instead of "active"', async ({ page }) => {
  await load(page, { init: null });
  const panel = page.locator('#panel');
  await expect(panel).toHaveAttribute('data-state', 'off');
  await expect(panel).toHaveAttribute('data-reason', 'uninitialized');
  await expect(panel.getByRole('status')).toContainText('not running');
});

test('transport disabled: off with reason disabled', async ({ page }) => {
  await load(page, { init: { transport: 'disabled' } });
  await expect(page.locator('#panel')).toHaveAttribute('data-reason', 'disabled');
});

test('Pause: opts out via the runtime, keeps focus and the live region', async ({ page }) => {
  const { beacons } = await load(page);
  const panel = page.locator('#panel');
  const toggle = panel.locator('[data-analytics-action="toggle"]');
  await expect(toggle).toHaveText('Pause analytics');
  await page.evaluate(() => { document.querySelector('#panel [role="status"]').__marker = true; });

  await toggle.focus();
  await page.keyboard.press('Enter');

  await expect(panel).toHaveAttribute('data-state', 'paused');
  await expect(panel).toHaveAttribute('data-reason', 'user');
  await expect(toggle).toHaveText('Resume analytics');
  await expect(toggle).toBeFocused();
  expect(await page.evaluate(() => window.Analytics.getStatus().reason)).toBe('user');
  expect(await page.evaluate(() => sessionStorage.getItem('vb_optout'))).toBe('1');
  expect(await panel.getByRole('status').count()).toBe(1);
  expect(await page.evaluate(() => document.querySelector('#panel [role="status"]').__marker)).toBe(true);
  await expect(panel.getByRole('status')).toContainText('Paused');

  // While paused, track() sends nothing.
  const before = beacons.length;
  await page.evaluate(() => window.Analytics.track('test.event'));
  await page.waitForTimeout(100);
  expect(beacons.length).toBe(before);

  await page.keyboard.press('Enter');
  await expect(panel).toHaveAttribute('data-state', 'active');
  await expect(toggle).toBeFocused();
});

test('updates when consent changes through the API', async ({ page }) => {
  await load(page);
  await page.evaluate(() => window.Analytics.setConsent(false));
  await expect(page.locator('#panel')).toHaveAttribute('data-state', 'paused');
});

test('heading: text from the heading attribute, no host tooltip, level 2 by default', async ({ page }) => {
  await load(page);
  const panel = page.locator('#panel');
  await expect(panel).not.toHaveAttribute('title', /.*/);
  await expect(panel.getByRole('heading', { level: 2 })).toHaveText('Your analytics data');
  await expect(panel.getByRole('heading', { level: 3 })).toHaveText('What an event from this page contains');
  // The field section stays labelled by its (re-levelled) subheading.
  await expect(panel.getByRole('region', { name: 'What an event from this page contains' })).toHaveCount(1);

  await panel.evaluate((el) => el.removeAttribute('heading'));
  await expect(panel.getByRole('heading', { level: 2 })).toHaveText('Analytics on this page');
});

test('heading-level: sets the panel and subheading levels, live and clamped', async ({ page }) => {
  await load(page, { panelAttrs: 'heading="What we send" heading-level="4"' });
  const panel = page.locator('#panel');
  await expect(panel.getByRole('heading', { level: 4 })).toHaveText('What we send');
  await expect(panel.getByRole('heading', { level: 5 })).toHaveText('What an event from this page contains');

  await panel.evaluate((el) => el.setAttribute('heading-level', '6'));
  await expect(panel.getByRole('heading', { level: 6 })).toHaveCount(2);
  await expect(panel.locator('h6[data-part="heading"]')).toHaveText('What we send');
  await expect(panel.getByRole('region', { name: 'What an event from this page contains' })).toHaveCount(1);

  await panel.evaluate((el) => el.setAttribute('heading-level', 'banana'));
  await expect(panel.locator('h2[data-part="heading"]')).toHaveText('What we send');
  await expect(panel.locator('h3[data-part="fields-heading"]')).toHaveCount(1);
});

test('runtime values are rendered as text, not HTML', async ({ page }) => {
  const evil = '/x/"><img src=x onerror="window.__xss=1">';
  await load(page, {
    init: { transport: 'beacon', siteId: 'test', endpoint: '/api/analytics/<b id="inj">hit</b>' },
  });
  const panel = page.locator('#panel');
  await expect(panel.getByRole('status')).toContainText('<b id="inj">hit</b>');
  await expect(panel.locator('dt', { hasText: 'Sent to' }).locator('xpath=following-sibling::dd[1]'))
    .toContainText('/api/analytics/<b id="inj">hit</b>');
  await expect(panel.locator('#inj')).toHaveCount(0);
  await page.evaluate((p) => history.replaceState(null, '', p), evil);
  await panel.locator('[data-analytics-action="refresh"]').click();
  await expect(panel.locator('img')).toHaveCount(0);
  expect(await page.evaluate(() => window.__xss)).toBeUndefined();
});

test('compact: smaller heading, text and buttons than the default panel', async ({ page }) => {
  await load(page, { panelAttrs: 'heading="Default"' });
  const measure = () => page.evaluate(() => {
    const p = document.getElementById('panel');
    const px = (el, prop) => parseFloat(getComputedStyle(el)[prop]);
    const btn = p.querySelector('[data-analytics-action="toggle"]');
    return {
      heading: px(p.querySelector('[data-part="heading"]'), 'fontSize'),
      text: px(p.querySelector('dd'), 'fontSize'),
      button: btn.getBoundingClientRect().height,
      buttonFont: px(btn, 'fontSize'),
      padding: px(p, 'paddingTop'),
    };
  });
  const normal = await measure();
  await page.locator('#panel').evaluate((el) => el.setAttribute('compact', ''));
  const compact = await measure();
  expect(compact.heading).toBeLessThan(normal.heading);
  expect(compact.text).toBeLessThan(normal.text);
  expect(compact.buttonFont).toBeLessThan(normal.buttonFont);
  expect(compact.button).toBeLessThan(normal.button);
  expect(compact.button).toBeGreaterThanOrEqual(24); // WCAG 2.5.8 target size
  expect(compact.padding).toBeLessThan(normal.padding);
});

for (const mode of ['dark', 'light']) {
  test(`${mode} mode: text meets 4.5:1 against the panel background`, async ({ page }) => {
    await load(page, { htmlAttrs: `data-mode="${mode}"` });
    const results = await page.evaluate(() => {
      const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
      const rgba = (c) => {
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = '#000'; ctx.fillStyle = c; ctx.fillRect(0, 0, 1, 1);
        return [...ctx.getImageData(0, 0, 1, 1).data];
      };
      const lum = ([r, g, b]) => {
        const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
      };
      const bgOf = (el) => {
        for (let n = el; n; n = n.parentElement) {
          const c = rgba(getComputedStyle(n).backgroundColor);
          if (c[3] > 0) return c;
        }
        return [255, 255, 255, 255];
      };
      const panel = document.getElementById('panel');
      const sel = ['[data-part="heading"]', '[role="status"] [data-part="status"]', '[data-part="fields-heading"]', 'dt', 'dd',
        '.analytics-panel__note', '[data-analytics-action="toggle"]'];
      return sel.map((s) => {
        const el = panel.querySelector(s);
        const fg = lum(rgba(getComputedStyle(el).color));
        const bg = lum(bgOf(el));
        const ratio = (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
        return { s, ratio: Math.round(ratio * 100) / 100 };
      });
    });
    for (const r of results) {
      expect(r.ratio, `${r.s} contrast`).toBeGreaterThanOrEqual(4.5);
    }
  });
}
