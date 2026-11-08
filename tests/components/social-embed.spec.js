/**
 * social-embed — lifecycle basics.
 *
 * Upgrade, unsupported fallback, missing url, disconnect, reconnect and the
 * visible activation mode. Provider rendering, security and a11y live in
 * tests/components/s-social-embed.spec.js.
 *
 * Tests the working tree (/src from disk); every https request is stubbed or
 * aborted, so nothing reaches a live network.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');
const FRAME = join(REPO, 'tests/fixtures/social-embed/frame.html');
const BSKY = 'https://bsky.app/profile/did:plc:z72i7hdynmk6r22z27h6tvur/post/3l6oveex3ii2l';

async function load(page, body) {
  await page.route(/^https:\/\//, (route) => route.abort());
  await page.route('https://embed.bsky.app/**', (route) => route.fulfill({ path: FRAME, contentType: 'text/html' }));
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__social-embed-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      </head><body><main>${body}</main>
      <script type="module" src="/src/web-components/social-embed/logic.js"></script></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => customElements.get('social-embed'));
}

test('upgrades parsed markup to idle with the fallback link visible', async ({ page }) => {
  await load(page, `<social-embed id="e" url="${BSKY}"><a href="${BSKY}">View post on Bluesky</a></social-embed>`);
  const el = page.locator('#e');
  await expect(el).toHaveAttribute('data-upgraded', '');
  await expect(el).toHaveAttribute('state', 'idle');
  await expect(el.getByRole('link', { name: 'View post on Bluesky' })).toBeVisible();
});

test('unsupported URL keeps the fallback with no facade', async ({ page }) => {
  await load(page, '<social-embed id="e" url="https://example.com/unknown"><a href="https://example.com/unknown">Visit</a></social-embed>');
  const el = page.locator('#e');
  await expect(el).toHaveAttribute('state', 'unsupported');
  await expect(el).toHaveAttribute('data-upgraded', '');
  await expect(el.locator('button, [data-embed-facade]')).toHaveCount(0);
});

test('missing url does not upgrade', async ({ page }) => {
  await load(page, '<social-embed id="e"><a href="/">x</a></social-embed><social-embed id="ok" url="https://example.com/"></social-embed>');
  await expect(page.locator('#ok')).toHaveAttribute('data-upgraded', '');
  await expect(page.locator('#e')).not.toHaveAttribute('data-upgraded', /.*/);
  await expect(page.locator('#e')).not.toHaveAttribute('state', /.*/);
});

test('data-upgraded is removed on disconnect and restored on reconnect without growing children', async ({ page }) => {
  await load(page, `<social-embed id="e" url="${BSKY}"><a href="${BSKY}">View</a></social-embed>`);
  const result = await page.evaluate(() => {
    const el = document.getElementById('e');
    const before = el.childElementCount;
    el.remove();
    const removed = el.hasAttribute('data-upgraded');
    document.querySelector('main').append(el);
    return { before, after: el.childElementCount, removed, upgraded: el.hasAttribute('data-upgraded'), state: el.getAttribute('state') };
  });
  expect(result).toEqual({ before: 2, after: 2, removed: false, upgraded: true, state: 'idle' });
});

test('activate="visible" loads when scrolled near the viewport', async ({ page }) => {
  await load(page, `<p style="block-size: 300vh">spacer</p><social-embed id="e" activate="visible" url="${BSKY}"><a href="${BSKY}">View</a></social-embed>`);
  const el = page.locator('#e');
  await expect(el).toHaveAttribute('state', 'idle');
  await el.scrollIntoViewIfNeeded();
  await expect(el).toHaveAttribute('state', 'loaded');
  await expect(el.locator('iframe[data-embed-frame]')).toHaveCount(1);
});
