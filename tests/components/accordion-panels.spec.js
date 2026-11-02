/**
 * accordion-wc — panels data API and panel wrapping (vanilla-breeze-z8t3).
 *
 * The A-element review found the `panels` setter double-bound every
 * listener when assigned before connection (one click → two toggles; with
 * `transition` the panel never opened) and dropped data-upgraded when
 * assigned while connected. It also found a lone <p>/<ul> answer reused as
 * the panel and overwritten with role="region".
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
  const url = `/__accordion-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <script type="module">import '/src/web-components/accordion-wc/logic.js';</script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => customElements.get('accordion-wc'));
}

const PANELS = [
  { summary: 'One', content: '<p>First</p>' },
  { summary: 'Two', content: '<p>Second</p>' },
];

test('panels assigned before connection bind listeners once', async ({ page }) => {
  await load(page, '');
  const toggles = await page.evaluate(async (panels) => {
    const acc = document.createElement('accordion-wc');
    acc.panels = panels;
    let n = 0;
    acc.addEventListener('accordion-wc:toggle', () => n++);
    document.querySelector('main').append(acc);
    acc.querySelector('summary').click();
    await new Promise((r) => setTimeout(r, 50));
    return { n, open: acc.querySelector('details').open, upgraded: acc.hasAttribute('data-upgraded') };
  }, PANELS);
  expect(toggles.open).toBe(true);
  expect(toggles.upgraded).toBe(true);
  expect(toggles.n).toBeLessThanOrEqual(1);
});

test('panels assigned while connected keep data-upgraded and one binding', async ({ page }) => {
  await load(page, '<accordion-wc><details><summary>Old</summary><div>x</div></details></accordion-wc>');
  await page.waitForSelector('accordion-wc[data-upgraded]');
  const r = await page.evaluate(async (panels) => {
    const acc = document.querySelector('accordion-wc');
    acc.panels = panels;
    const summary = acc.querySelector('summary');
    summary.click();
    await new Promise((res) => setTimeout(res, 50));
    const afterOne = acc.querySelector('details').open;
    summary.click();
    await new Promise((res) => setTimeout(res, 50));
    return { upgraded: acc.hasAttribute('data-upgraded'), afterOne, afterTwo: acc.querySelector('details').open, count: acc.querySelectorAll('details').length };
  }, PANELS);
  expect(r).toEqual({ upgraded: true, afterOne: true, afterTwo: false, count: 2 });
});

test('panels with transition open on the first click', async ({ page }) => {
  await load(page, '');
  const open = await page.evaluate(async (panels) => {
    const acc = document.createElement('accordion-wc');
    acc.setAttribute('transition', 'fade');
    acc.panels = panels;
    document.querySelector('main').append(acc);
    acc.querySelector('summary').click();
    await new Promise((r) => setTimeout(r, 600));
    return acc.querySelector('details').open;
  }, PANELS);
  expect(open).toBe(true);
});

test('a lone <p> or <ul> answer is wrapped, keeping its own semantics', async ({ page }) => {
  await load(page, `<accordion-wc>
    <details><summary>Q1</summary><p id="ans">Answer</p></details>
    <details><summary>Q2</summary><ul id="list"><li>a</li></ul></details>
    <details><summary>Q3</summary><div id="wrap"><p>Kept</p></div></details>
  </accordion-wc>`);
  await page.waitForSelector('accordion-wc[data-upgraded]');
  await expect(page.locator('#ans')).not.toHaveAttribute('role', /.*/);
  await expect(page.locator('#list')).not.toHaveAttribute('role', /.*/);
  await expect(page.locator('#ans').locator('..')).toHaveAttribute('role', 'region');
  // An authored <div> is still reused as the panel
  await expect(page.locator('#wrap')).toHaveAttribute('role', 'region');
});
