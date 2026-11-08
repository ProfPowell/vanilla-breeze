/**
 * reaction-bar — Q+R review fixes.
 *
 * Covers: listeners survive a reconnect (chip, palette, aria-expanded);
 * palette focus on open; per-chip pending guard; forced-colors pressed
 * state; focus kept when the focused chip is removed and the roving index
 * kept across setCount; author labels + Intl counts; RTL arrows; observed
 * data-disabled; no redundant role; labelled palette group.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

async function load(page, body, { dir = 'ltr', lang = 'en' } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__reaction-bar-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="${lang}" dir="${dir}"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <script type="module">import '/src/web-components/reaction-bar/logic.js';</script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => customElements.get('reaction-bar'));
  await page.waitForSelector('reaction-bar[data-upgraded]', { state: 'attached' });
  // Record toggle events on window.
  await page.evaluate(() => {
    /** @type {any} */ (window).toggles = [];
    document.addEventListener('reaction-bar:toggle', (e) => /** @type {any} */ (window).toggles.push(/** @type {CustomEvent} */ (e).detail));
  });
}

const BAR = (attrs = '') => `
  <reaction-bar id="rb" aria-label="Reactions to comment 1" ${attrs}>
    <button data-reaction="thumbsup" data-count="3" data-mine data-label="Thumbs up">👍</button>
    <button data-reaction="heart" data-count="1">❤️</button>
    <template data-palette>
      <button data-reaction="thumbsup" data-label="Thumbs up">👍</button>
      <button data-reaction="laugh" aria-label="Laugh">😄</button>
      <button data-reaction="heart">❤️</button>
      <button data-reaction="rocket" data-label="Rocket">🚀</button>
    </template>
  </reaction-bar>
  <button id="after">After</button>`;

const reconnect = (page) => page.evaluate(() => {
  const rb = document.getElementById('rb');
  const parent = rb.parentNode; const next = rb.nextSibling;
  parent.removeChild(rb); parent.insertBefore(rb, next);
});

test('chip click, palette click and aria-expanded all work after a reconnect', async ({ page }) => {
  await load(page, BAR());
  await reconnect(page);
  await reconnect(page);

  expect(await page.locator('#rb > .reaction-trigger').count()).toBe(1);
  expect(await page.locator('#rb pop-over').count()).toBe(1);

  await page.locator('#rb > button[data-reaction="heart"]').click();
  expect(await page.evaluate(() => /** @type {any} */ (window).toggles)).toEqual([
    { reaction: 'heart', action: 'add', count: 1, mine: false },
  ]);

  await page.locator('#rb > .reaction-trigger').click();
  await expect(page.locator('#rb pop-over')).toBeVisible();
  await expect(page.locator('#rb > .reaction-trigger')).toHaveAttribute('aria-expanded', 'true');
  await page.locator('#rb .reaction-palette-option[data-reaction="rocket"]').click();
  const toggles = await page.evaluate(() => /** @type {any} */ (window).toggles);
  expect(toggles).toHaveLength(2);
  expect(toggles[1]).toEqual({ reaction: 'rocket', action: 'add', count: 0, mine: false });
  await expect(page.locator('#rb > .reaction-trigger')).toHaveAttribute('aria-expanded', 'false');
});

test('opening the palette moves focus to the first option', async ({ page }) => {
  await load(page, BAR());
  await page.locator('#rb > .reaction-trigger').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#rb .reaction-palette-option').first()).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#rb .reaction-palette-option').nth(1)).toBeFocused();
  // Programmatic open focuses too.
  await page.keyboard.press('Escape');
  await page.evaluate(() => /** @type {any} */ (document.getElementById('rb')).openPalette());
  await expect(page.locator('#rb .reaction-palette-option').first()).toBeFocused();
});

test('pending guard: repeat clicks are dropped until setCount', async ({ page }) => {
  await load(page, BAR());
  const chip = page.locator('#rb > button[data-reaction="heart"]');
  await chip.dblclick();
  expect(await page.evaluate(() => /** @type {any} */ (window).toggles.length)).toBe(1);
  await expect(chip).toHaveAttribute('data-pending', '');
  await expect(chip).toHaveAttribute('aria-busy', 'true');

  await page.evaluate(() => /** @type {any} */ (document.getElementById('rb')).setCount('heart', 2, { mine: true }));
  await expect(chip).not.toHaveAttribute('data-pending', '');
  await expect(chip).not.toHaveAttribute('aria-busy', 'true');
  await chip.click();
  expect(await page.evaluate(() => /** @type {any} */ (window).toggles.length)).toBe(2);

  // A palette pick with no chip yet is guarded per reaction too.
  await page.evaluate(() => {
    const rb = /** @type {any} */ (document.getElementById('rb'));
    const opt = rb.querySelector('.reaction-palette-option[data-reaction="rocket"]');
    opt.click(); opt.click();
  });
  expect(await page.evaluate(() => /** @type {any} */ (window).toggles.length)).toBe(3);
});

test('forced colors: pressed chip differs from an unpressed chip', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await load(page, BAR());
  const bg = (sel) => page.locator(sel).evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(await bg('#rb > button[data-reaction="thumbsup"]')).not.toBe(await bg('#rb > button[data-reaction="heart"]'));
});

test('removing the focused chip moves focus to a neighbour and keeps one tab stop', async ({ page }) => {
  await load(page, BAR());
  await page.locator('#rb > button[data-reaction="thumbsup"]').focus();
  await page.evaluate(() => /** @type {any} */ (document.getElementById('rb')).setCount('thumbsup', 0));
  await expect(page.locator('#rb > button[data-reaction="heart"]')).toBeFocused();
  expect(await page.locator('#rb [tabindex="0"]').count()).toBe(1);
  await expect(page.locator('#rb > button[data-reaction="heart"]')).toHaveAttribute('tabindex', '0');
});

test('setCount keeps the roving position', async ({ page }) => {
  await load(page, BAR());
  await page.locator('#rb > button[data-reaction="thumbsup"]').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#rb > button[data-reaction="heart"]')).toBeFocused();
  await page.evaluate(() => /** @type {any} */ (document.getElementById('rb')).setCount('thumbsup', 4));
  await expect(page.locator('#rb > button[data-reaction="heart"]')).toHaveAttribute('tabindex', '0');
  await expect(page.locator('#rb > button[data-reaction="thumbsup"]')).toHaveAttribute('tabindex', '-1');
});

test('accessible names: author labels kept, Intl count phrase, no "you reacted", no role', async ({ page }) => {
  await load(page, BAR());
  const thumbs = page.locator('#rb > button[data-reaction="thumbsup"]');
  await expect(thumbs).toHaveAttribute('aria-label', 'Thumbs up, 3 reactions');
  await expect(thumbs).toHaveAttribute('aria-pressed', 'true');
  await expect(thumbs).not.toHaveAttribute('role', /.*/);
  await expect(page.locator('#rb > button[data-reaction="heart"]')).toHaveAttribute('aria-label', '❤️, 1 reaction');
  await expect(page.locator('#rb .reaction-palette-option[data-reaction="laugh"]')).toHaveAttribute('aria-label', 'Laugh');
  await expect(page.locator('#rb .reaction-palette-option[data-reaction="rocket"]')).toHaveAttribute('aria-label', 'Rocket');
  await expect(page.locator('#rb .reaction-palette-list')).toHaveAttribute('aria-label', 'Reactions to comment 1');

  // setCount creates the chip from the template button, keeping its label.
  await page.evaluate(() => /** @type {any} */ (document.getElementById('rb')).setCount('rocket', 1234, { mine: true }));
  await expect(page.locator('#rb > button[data-reaction="rocket"]')).toHaveAttribute('aria-label', 'Rocket, 1,234 reactions');
  await expect(page.locator('#rb > button[data-reaction="rocket"] .reaction-count')).toHaveText('1,234');
});

test('data-label-* overrides and the closest lang drive labels and numbers', async ({ page }) => {
  await load(page, `<section lang="de">${BAR('data-label-dialog="Reaktion wählen" data-label-count-one="{count} Reaktion" data-label-count-other="{count} Reaktionen"')}</section>`);
  await expect(page.locator('#rb pop-over')).toHaveAttribute('aria-label', 'Reaktion wählen');
  await expect(page.locator('#rb > button[data-reaction="heart"]')).toHaveAttribute('aria-label', '❤️, 1 Reaktion');
  await page.evaluate(() => /** @type {any} */ (document.getElementById('rb')).setCount('heart', 1500));
  await expect(page.locator('#rb > button[data-reaction="heart"]')).toHaveAttribute('aria-label', '❤️, 1.500 Reaktionen');
});

test('arrow keys follow visual order in RTL', async ({ page }) => {
  await load(page, BAR(), { dir: 'rtl' });
  await page.locator('#rb > button[data-reaction="thumbsup"]').focus();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#rb > button[data-reaction="heart"]')).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#rb > button[data-reaction="thumbsup"]')).toBeFocused();
});

test('data-disabled is observed: trigger, chips and roving set follow it', async ({ page }) => {
  await load(page, BAR());
  await page.evaluate(() => document.getElementById('rb').setAttribute('data-disabled', ''));
  await expect(page.locator('#rb > .reaction-trigger')).toBeDisabled();
  await expect(page.locator('#rb > button[data-reaction="heart"]')).toHaveAttribute('aria-disabled', 'true');
  await page.evaluate(() => /** @type {HTMLElement} */ (document.querySelector('#rb > button[data-reaction="heart"]')).click());
  expect(await page.evaluate(() => /** @type {any} */ (window).toggles.length)).toBe(0);
  // End must land on the last enabled item, not the disabled trigger.
  await page.locator('#rb > button[data-reaction="thumbsup"]').focus();
  await page.keyboard.press('End');
  await expect(page.locator('#rb > button[data-reaction="heart"]')).toBeFocused();

  await page.evaluate(() => document.getElementById('rb').removeAttribute('data-disabled'));
  await expect(page.locator('#rb > .reaction-trigger')).toBeEnabled();
  await expect(page.locator('#rb > button[data-reaction="heart"]')).not.toHaveAttribute('aria-disabled', /.*/);
  await page.locator('#rb > button[data-reaction="heart"]').click();
  expect(await page.evaluate(() => /** @type {any} */ (window).toggles.length)).toBe(1);
});
