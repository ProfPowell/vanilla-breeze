/**
 * Effects review follow-ups (integration pass).
 *
 * - The full-tier guard table loads emoji-init.js when [data-emoji] shows up
 *   after boot (attribute added to an existing element, or element inserted).
 * - view-transition-init.js keeps no marker attribute: clones, changed values
 *   and removed attributes all end with the right view-transition-name.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

async function load(page, body, script) {
  /** @type {string[]} */
  const fetched = [];
  await page.route('**/src/**', (route) => {
    const path = decodeURIComponent(new URL(route.request().url()).pathname);
    fetched.push(path);
    return route.fulfill({ path: join(REPO, path) });
  });
  const url = `/__effects-followups-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
      <script type="module">${script}
      window.__ready = true;</script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__ready === true);
  return fetched;
}

const GUARDS = `import { runFullGuards } from '/src/lib/lazy-guards-full.js'; runFullGuards();`;
const emojiLoaded = (fetched) => fetched.some((p) => p.endsWith('/utils/emoji-init.js'));

test.describe('late [data-emoji] loads the emoji module', () => {
  test('attribute added to an existing element', async ({ page }) => {
    const fetched = await load(page, '<p id="p">Hot :fire: take</p>', GUARDS);
    await page.waitForTimeout(100);
    expect(emojiLoaded(fetched)).toBe(false);
    await page.evaluate(() => { document.getElementById('p').dataset.emoji = ''; });
    await expect(page.locator('#p')).toHaveText('Hot 🔥 take');
    expect(emojiLoaded(fetched)).toBe(true);
  });

  test('element inserted after boot', async ({ page }) => {
    await load(page, '<p>Nothing here</p>', GUARDS);
    await page.evaluate(() => {
      const p = document.createElement('p');
      p.id = 'late';
      p.dataset.emoji = '';
      p.textContent = 'Launch :rocket:';
      document.querySelector('main').append(p);
    });
    await expect(page.locator('#late')).toHaveText('Launch 🚀');
  });
});

test.describe('view-transition-init', () => {
  const VT = `import '/src/utils/view-transition-init.js';`;
  const name = (page, sel) => page.locator(sel).evaluate((el) => el.style.viewTransitionName);

  test('no marker attribute; value changes and removal re-apply', async ({ page }) => {
    await load(page, '<img id="a" alt="" data-vt-name="hero-1">', VT);
    expect(await name(page, '#a')).toBe('hero-1');
    expect(await page.locator('#a').getAttribute('data-vt-name-init')).toBeNull();
    await page.evaluate(() => { document.getElementById('a').dataset.vtName = 'hero-2'; });
    await expect.poll(() => name(page, '#a')).toBe('hero-2');
    await page.evaluate(() => { document.getElementById('a').removeAttribute('data-vt-name'); });
    await expect.poll(() => name(page, '#a')).toBe('');
  });

  test('a clone renamed before insertion gets its own name; stale marker stripped', async ({ page }) => {
    await load(page, '<img id="a" alt="" data-vt-name="hero-1" data-vt-name-init>', VT);
    expect(await page.locator('#a').getAttribute('data-vt-name-init')).toBeNull();
    await page.evaluate(() => {
      const c = /** @type {HTMLElement} */ (document.getElementById('a').cloneNode(true));
      c.id = 'b';
      c.dataset.vtName = 'hero-9';
      document.querySelector('main').append(c);
    });
    await expect.poll(() => name(page, '#b')).toBe('hero-9');
    expect(await name(page, '#a')).toBe('hero-1');
  });
});

test.describe('click:replay on text effects (demo + docs pattern)', () => {
  test('typewriter replays one run per click, text ends fully typed', async ({ page }) => {
    await load(page,
      '<p id="t" data-effect="typewriter" data-trigger="click:replay" style="--vb-typewriter-speed: 5ms">Café ☕ ok</p>',
      `import '/src/main.js';`);
    await page.waitForFunction(() => /** @type {any} */ (window).VB?._effects?.has('typewriter'));
    const t = page.locator('#t');
    const visibleChars = t.locator('.vb-typewriter-char:not([hidden])');
    await t.click();
    await expect(visibleChars).toHaveCount(9);
    await t.click();
    await expect(t).toHaveAttribute('data-effect-active', '');
    await expect(visibleChars).toHaveCount(9);
    await expect(t.locator('.vb-split')).toHaveCount(1);
    await expect(t).toMatchAriaSnapshot('- paragraph: Café ☕ ok');
  });
});
