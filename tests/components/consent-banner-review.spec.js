/**
 * consent-banner — review fixes (vanilla-breeze-1fvo).
 *
 * The review found getConsent() ignored expiry, the dialog had no accessible
 * name, blocked localStorage stopped the banner from ever showing, and a
 * `position` change while open had no effect.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

async function load(page, body, { blockStorage = false } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  if (blockStorage) {
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        get() { throw new DOMException('blocked', 'SecurityError'); },
      });
    });
  }
  const url = `/__consent-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <script type="module">
        import { ConsentBanner } from '/src/web-components/consent-banner/logic.js';
        window.ConsentBanner = ConsentBanner;
      </script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => customElements.get('consent-banner') && window.ConsentBanner);
}

const DIALOG = (head = '') => `<dialog>${head}<p>We use cookies.</p>
  <footer><button value="reject">Reject All</button><button value="accept">Accept All</button></footer></dialog>`;

/** Write a consent envelope `daysAgo` days old. */
async function seed(page, key, daysAgo) {
  await page.evaluate(({ key, daysAgo }) => {
    localStorage.setItem(`vb:consent:${key}`, JSON.stringify({
      data: { preferences: { analytics: true }, action: 'accept' },
      timestamp: Date.now() - daysAgo * 86_400_000,
    }));
  }, { key, daysAgo });
}

test('getConsent returns null for consent older than the default 365 days', async ({ page }) => {
  await load(page, '');
  await seed(page, 'old', 400);
  const r = await page.evaluate(() => window.ConsentBanner.getConsent('old'));
  expect(r).toBeNull();
});

test('getConsent honours options.expires and the in-document banner expires', async ({ page }) => {
  await load(page, '<consent-banner persist="short" expires="7" hidden trigger="#x">' + DIALOG() + '</consent-banner>');
  await seed(page, 'short', 10);
  await seed(page, 'fresh', 10);
  const r = await page.evaluate(async () => ({
    derived: await window.ConsentBanner.getConsent('short'),
    explicitShort: await window.ConsentBanner.getConsent('fresh', { expires: 7 }),
    explicitLong: await window.ConsentBanner.getConsent('fresh', { expires: 30 }),
    never: await window.ConsentBanner.getConsent('short', { expires: 'never' }),
  }));
  expect(r.derived).toBeNull();
  expect(r.explicitShort).toBeNull();
  expect(r.explicitLong).toEqual({ preferences: { analytics: true }, action: 'accept' });
  expect(r.never).not.toBeNull();
});

test('dialog is named by its first heading', async ({ page }) => {
  await load(page, '<consent-banner persist="named">' + DIALOG('<header><h2>Cookie Preferences</h2></header>') + '</consent-banner>');
  const dialog = page.locator('consent-banner dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAccessibleName('Cookie Preferences');
});

test('dialog without a heading gets aria-label="Cookie consent"; author names win', async ({ page }) => {
  await load(page, `
    <consent-banner persist="anon">${DIALOG()}</consent-banner>
    <consent-banner persist="authored" position="top"><dialog aria-label="Privacy choices"><h2>Ignored</h2>
      <button value="accept">Accept</button></dialog></consent-banner>`);
  await expect(page.locator('consent-banner[persist="anon"] dialog')).toHaveAccessibleName('Cookie consent');
  await expect(page.locator('consent-banner[persist="authored"] dialog')).toHaveAccessibleName('Privacy choices');
  await expect(page.locator('consent-banner[persist="authored"] dialog')).not.toHaveAttribute('aria-labelledby');
});

test('banner still opens and fires change when localStorage is blocked', async ({ page }) => {
  await load(page, '<consent-banner persist="blocked">' + DIALOG() + '</consent-banner>', { blockStorage: true });
  const dialog = page.locator('consent-banner dialog');
  await expect(dialog).toBeVisible();
  await page.evaluate(() => { /** @type {any} */ (window).__armed = new Promise((res) => {
    document.addEventListener('consent-banner:change', (e) => res(e.detail), { once: true });
  }); });
  const detail = page.evaluate(() => /** @type {any} */ (window).__armed);
  await page.click('button[value="reject"]');
  expect(await detail).toEqual({ preferences: {}, action: 'reject' });
  await expect(page.locator('consent-banner')).toHaveCount(0);
  expect(await page.evaluate(() => window.ConsentBanner.getConsent('blocked'))).toBeNull();
});

test('changing position while open switches between modal and non-modal', async ({ page }) => {
  await load(page, '<consent-banner persist="pos">' + DIALOG() + '</consent-banner>');
  await expect(page.locator('consent-banner dialog')).toBeVisible();
  const modal = () => page.evaluate(() => document.querySelector('consent-banner dialog').matches(':modal'));
  expect(await modal()).toBe(false);
  await page.evaluate(() => document.querySelector('consent-banner').setAttribute('position', 'center'));
  expect(await modal()).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.locator('consent-banner dialog')).toBeVisible();
  await page.evaluate(() => document.querySelector('consent-banner').setAttribute('position', 'top'));
  expect(await modal()).toBe(false);
  await expect(page.locator('consent-banner dialog')).toBeVisible();
});

test('reconnect does not double-bind the click handler', async ({ page }) => {
  await load(page, '<consent-banner persist="move" trigger="#m">' + DIALOG() + '</consent-banner><button id="m">Manage</button>');
  await expect(page.locator('consent-banner dialog')).toBeVisible();
  const count = await page.evaluate(async () => {
    const b = document.querySelector('consent-banner');
    document.body.append(b);
    await new Promise((r) => setTimeout(r, 20));
    let n = 0;
    document.addEventListener('consent-banner:change', () => n++);
    b.querySelector('button[value="accept"]').click();
    await new Promise((r) => setTimeout(r, 50));
    return n;
  });
  expect(count).toBe(1);
});
