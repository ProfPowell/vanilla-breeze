/**
 * VBElement: cloning an upgraded component (vanilla-breeze-kkmj).
 *
 * cloneNode() copies data-upgraded. Before the fix the clone's
 * connectedCallback saw the marker and skipped setup(), so the clone looked
 * built (it carries the original's generated DOM) but had no listeners.
 * Each case clones an upgraded host, inserts the clone, and performs one
 * interaction that only works if setup() wired the clone.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

async function load(page, body) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__vb-clone-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <script type="module" src="/src/main.js"></script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
}

test('a deep clone of an upgraded tab-set upgrades and switches tabs', async ({ page }) => {
  await load(page, `
    <section id="host">
      <tab-set id="orig">
        <details name="t" open><summary>One</summary><p>First</p></details>
        <details name="t"><summary>Two</summary><p>Second</p></details>
      </tab-set>
    </section>`);
  await page.waitForSelector('#orig[data-upgraded]');

  await page.evaluate(() => {
    const clone = /** @type {HTMLElement} */ (document.getElementById('orig').cloneNode(true));
    clone.id = 'copy';
    for (const d of clone.querySelectorAll('details')) d.name = 'c';
    document.getElementById('host').append(clone);
  });
  await page.waitForSelector('#copy[data-upgraded]');

  // Arrow-key navigation is wired in setup(); an inert clone ignores it.
  await page.locator('#copy summary').first().focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#copy details').nth(1)).toHaveAttribute('open', '');
  await expect(page.locator('#copy summary').nth(1)).toBeFocused();
  // The original is untouched by the clone's interaction.
  await expect(page.locator('#orig details').first()).toHaveAttribute('open', '');
});

test('a clone of an upgraded star-rating responds to input', async ({ page }) => {
  await load(page, `
    <form id="host">
      <star-rating id="orig" name="r" max="5" value="2" label="Rating"></star-rating>
    </form>`);
  await page.waitForSelector('#orig[data-upgraded]');

  const before = await page.evaluate(() => {
    const clone = /** @type {HTMLElement} */ (document.getElementById('orig').cloneNode(true));
    clone.id = 'copy';
    clone.setAttribute('name', 'r2');
    document.getElementById('host').append(clone);
    return clone.hasAttribute('data-upgraded');
  });
  // The stale marker is dropped at construction, then restored by setup().
  expect(before).toBe(true);
  await page.waitForSelector('#copy[data-upgraded]');

  const radios = page.locator('#copy input[type="radio"]');
  await radios.nth(3).check({ force: true });
  await expect.poll(() => page.evaluate(() => /** @type {any} */ (document.getElementById('copy')).value)).toBe(4);
});

test('a clone made by importNode upgrades exactly once', async ({ page }) => {
  await load(page, `
    <section id="host">
      <tab-set id="orig">
        <details name="t" open><summary>One</summary><p>First</p></details>
        <details name="t"><summary>Two</summary><p>Second</p></details>
      </tab-set>
    </section>`);
  await page.waitForSelector('#orig[data-upgraded]');

  const upgrades = await page.evaluate(async () => {
    let n = 0;
    document.addEventListener('tab-set:upgraded', (e) => { if (/** @type {HTMLElement} */ (e.target).id === 'copy') n++; });
    const clone = /** @type {HTMLElement} */ (document.importNode(document.getElementById('orig'), true));
    clone.id = 'copy';
    for (const d of clone.querySelectorAll('details')) d.name = 'c';
    document.getElementById('host').append(clone);
    await new Promise((r) => setTimeout(r, 50));
    return n;
  });
  expect(upgrades).toBe(1);
});
