/**
 * youtube-player — U–Y review fixes.
 *
 * Covers: one control in the facade (no nested interactive host), the
 * default label, data-label-play, autoplay that never takes focus and
 * respects reduced motion, start/end validation, the sd/maxres → hq
 * thumbnail fallback, referrer policies, the local `poster` (no i.ytimg.com
 * request), the activate event, re-facade on reconnect, and social-embed's
 * poster pass-through.
 *
 * Tests the working tree: /src is served from disk, not the build. Every
 * YouTube host is intercepted, so nothing leaves the machine.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');
const POSTER = '/src/assets/placeholders/photo-kitchen-sink-13-640x360.svg';

const svg = (w, h) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="gray"/></svg>`;

/**
 * @param {import('playwright/test').Page} page
 * @param {string} body
 * @param {{ thumbs?: Record<string, number | [number, number]>, modules?: string[] }} [opts]
 *   thumbs: per-file response for i.ytimg.com (status code, or [w, h] image)
 */
async function load(page, body, { thumbs = {}, modules = ['youtube-player'] } = {}) {
  /** @type {string[]} */
  const ytimg = [];
  /** @type {string[]} */
  const embeds = [];
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  await page.route('https://i.ytimg.com/**', (route) => {
    const url = route.request().url();
    ytimg.push(url);
    const file = /** @type {string} */ (url.split('/').pop());
    const spec = thumbs[file] ?? [480, 360];
    if (typeof spec === 'number') return route.fulfill({ status: spec, body: '' });
    return route.fulfill({ status: 200, contentType: 'image/svg+xml', body: svg(spec[0], spec[1]) });
  });
  await page.route('https://www.youtube-nocookie.com/**', (route) => {
    embeds.push(route.request().url());
    return route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>embed</title><p>player</p>' });
  });
  const url = `/__uy-youtube-${Math.random().toString(36).slice(2)}.html`;
  const imports = modules.map((m) => `import '/src/web-components/${m}/logic.js';`).join('');
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <script type="module">${imports}</script>
      </head><body><main><p><a href="#top" id="before">Before</a></p>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => customElements.get('youtube-player'));
  return { ytimg, embeds };
}

const PLAYER = '<youtube-player id="yt" video-id="dQw4w9WgXcQ" title="Never Gonna Give You Up"><a href="https://youtu.be/dQw4w9WgXcQ">Watch on YouTube</a></youtube-player>';

test('facade has one control: the button, not the host', async ({ page }) => {
  await load(page, PLAYER);
  const yt = page.locator('#yt');
  await expect(yt).toHaveAttribute('state', 'ready');
  for (const attr of ['role', 'tabindex', 'aria-label']) {
    await expect(yt).not.toHaveAttribute(attr, /.*/);
  }
  await expect(yt.locator('a')).toHaveCount(0);
  await expect(page.getByRole('button')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Play Never Gonna Give You Up' })).toBeVisible();

  // One tab stop after the link before it.
  await page.locator('#before').focus();
  await page.keyboard.press('Tab');
  await expect(yt.locator('button')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(yt.locator('button')).not.toBeFocused();

  // The button covers the whole facade (click anywhere plays).
  const [host, btn] = await Promise.all([yt.boundingBox(), yt.locator('button').boundingBox()]);
  expect(Math.round(btn.width)).toBe(Math.round(host.width));
  expect(Math.round(btn.height)).toBe(Math.round(host.height));
});

test('facade passes axe (no nested-interactive)', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'viewport-independent');
  await load(page, PLAYER);
  await page.addScriptTag({ path: join(REPO, 'node_modules/axe-core/axe.min.js') });
  const violations = await page.evaluate(async () => {
    const r = await window.axe.run(document.querySelector('youtube-player'), { resultTypes: ['violations'] });
    return r.violations.map((v) => v.id);
  });
  expect(violations).toEqual([]);
});

test('default title is "YouTube video"; data-label-play overrides the name', async ({ page }) => {
  await load(page, `
    <youtube-player id="a" video-id="dQw4w9WgXcQ"></youtube-player>
    <youtube-player id="b" video-id="dQw4w9WgXcQ" title="Clip" data-label-play="Lire « {title} »"></youtube-player>`);
  await expect(page.locator('#a button')).toHaveAttribute('aria-label', 'Play YouTube video');
  await expect(page.locator('#b button')).toHaveAttribute('aria-label', 'Lire « Clip »');
  await page.locator('#a button').click();
  await expect(page.locator('#a iframe')).toHaveAttribute('title', 'YouTube video');
});

test('pressing play inserts the iframe, moves focus, fires activate', async ({ page }) => {
  const { embeds } = await load(page, PLAYER);
  await page.evaluate(() => {
    window.__events = [];
    document.addEventListener('youtube-player:activate', (e) => window.__events.push(e.detail));
  });
  await page.locator('#yt button').focus();
  await page.keyboard.press('Enter');
  const yt = page.locator('#yt');
  await expect(yt).toHaveAttribute('state', 'active');
  const iframe = yt.locator('iframe');
  await expect(iframe).toHaveAttribute('title', 'Never Gonna Give You Up');
  await expect(iframe).toHaveAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
  await expect(iframe).toBeFocused();
  expect(await page.evaluate(() => window.__events)).toEqual([{ videoId: 'dQw4w9WgXcQ', fromUser: true }]);
  await expect.poll(() => embeds.length).toBe(1);
  expect(new URL(embeds[0]).searchParams.get('autoplay')).toBe('1');
});

test('autoplay loads at once without taking focus', async ({ page }) => {
  await load(page, '<youtube-player id="yt" autoplay video-id="dQw4w9WgXcQ" title="Clip"></youtube-player>');
  const yt = page.locator('#yt');
  await expect(yt).toHaveAttribute('state', 'active');
  await expect(yt.locator('iframe')).toHaveCount(1);
  expect(await page.evaluate(() => document.activeElement === document.body)).toBe(true);
});

test('autoplay is skipped under reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await load(page, '<youtube-player id="yt" autoplay video-id="dQw4w9WgXcQ" title="Clip"></youtube-player>');
  const yt = page.locator('#yt');
  await expect(yt).toHaveAttribute('state', 'ready');
  await expect(yt.locator('iframe')).toHaveCount(0);
  await expect(yt.locator('button')).toHaveCount(1);
});

test('start and end accept whole seconds only', async ({ page }) => {
  const { embeds } = await load(page, `
    <youtube-player id="ok" video-id="dQw4w9WgXcQ" start="30" end="90"></youtube-player>
    <youtube-player id="bad" video-id="dQw4w9WgXcQ" start="1m30s" end="-5"></youtube-player>`);
  await page.locator('#ok button').click();
  await page.locator('#bad button').click();
  await expect.poll(() => embeds.length).toBe(2);
  const ok = new URL(/** @type {string} */ (await page.locator('#ok iframe').getAttribute('src'))).searchParams;
  expect(ok.get('start')).toBe('30');
  expect(ok.get('end')).toBe('90');
  const bad = new URL(/** @type {string} */ (await page.locator('#bad iframe').getAttribute('src'))).searchParams;
  expect(bad.has('start')).toBe(false);
  expect(bad.has('end')).toBe(false);
});

test('thumbnail: no-referrer, and maxres/sd fall back to hq', async ({ page }) => {
  const { ytimg } = await load(page, `
    <youtube-player id="hq" video-id="dQw4w9WgXcQ"></youtube-player>
    <youtube-player id="max" video-id="aaaaaaaaaaa" thumbnail="maxres"></youtube-player>
    <youtube-player id="sd" video-id="bbbbbbbbbbb" thumbnail="sd"></youtube-player>`, {
    thumbs: { 'maxresdefault.jpg': 404, 'sddefault.jpg': [120, 90] },
  });
  await expect(page.locator('#hq img')).toHaveAttribute('referrerpolicy', 'no-referrer');
  await expect(page.locator('#hq img')).toHaveAttribute('src', 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
  await expect(page.locator('#max img')).toHaveAttribute('src', 'https://i.ytimg.com/vi/aaaaaaaaaaa/hqdefault.jpg');
  await expect(page.locator('#sd img')).toHaveAttribute('src', 'https://i.ytimg.com/vi/bbbbbbbbbbb/hqdefault.jpg');
  expect(ytimg.some((u) => u.endsWith('/aaaaaaaaaaa/maxresdefault.jpg'))).toBe(true);
});

test('poster: local image, no i.ytimg.com request', async ({ page }) => {
  const { ytimg } = await load(page, `<youtube-player id="yt" video-id="dQw4w9WgXcQ" title="Clip" poster="${POSTER}"></youtube-player>`);
  const img = page.locator('#yt img');
  await expect(img).toHaveAttribute('src', POSTER);
  await expect(img).toHaveAttribute('alt', '');
  await expect.poll(() => img.evaluate((el) => /** @type {HTMLImageElement} */ (el).complete && /** @type {HTMLImageElement} */ (el).naturalWidth > 0)).toBe(true);
  expect(ytimg).toEqual([]);
});

test('reconnect re-renders the facade (one img, one button, no iframe)', async ({ page }) => {
  await load(page, PLAYER);
  await page.locator('#yt button').click();
  await expect(page.locator('#yt')).toHaveAttribute('state', 'active');
  const counts = await page.evaluate(() => {
    const yt = /** @type {HTMLElement} */ (document.getElementById('yt'));
    const main = /** @type {HTMLElement} */ (document.querySelector('main'));
    for (let i = 0; i < 3; i++) { yt.remove(); main.append(yt); }
    return {
      state: yt.getAttribute('state'),
      imgs: yt.querySelectorAll('img').length,
      buttons: yt.querySelectorAll('button').length,
      iframes: yt.querySelectorAll('iframe').length,
      focusOnBody: document.activeElement === document.body,
    };
  });
  expect(counts).toEqual({ state: 'ready', imgs: 1, buttons: 1, iframes: 0, focusOnBody: true });
  await page.locator('#yt button').click();
  await expect(page.locator('#yt')).toHaveAttribute('state', 'active');
  await expect(page.locator('#yt iframe')).toHaveCount(1);
});

test('invalid video-id does not upgrade and keeps the fallback', async ({ page }) => {
  await load(page, '<youtube-player id="yt" video-id="bad id!"><a href="https://youtu.be/x">Watch</a></youtube-player>');
  const yt = page.locator('#yt');
  await expect(yt).not.toHaveAttribute('data-upgraded', '');
  await expect(yt.locator('a')).toHaveCount(1);
  await expect(yt.locator('button')).toHaveCount(0);
});

test('social-embed passes poster through to the YouTube player', async ({ page }) => {
  const { ytimg } = await load(page, `
    <social-embed url="https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1m30s" data-title="Clip" poster="${POSTER}">
      <a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ">Watch on YouTube</a>
    </social-embed>`, { modules: ['social-embed'] });
  const yt = page.locator('social-embed youtube-player');
  await expect(yt).toHaveAttribute('poster', POSTER);
  await expect(yt).toHaveAttribute('start', '90');
  await expect(yt.locator('img')).toHaveAttribute('src', POSTER);
  await expect(page.getByRole('button', { name: 'Play Clip' })).toHaveCount(1);
  expect(ytimg).toEqual([]);
});
