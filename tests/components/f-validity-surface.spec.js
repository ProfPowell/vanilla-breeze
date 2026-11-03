/**
 * F review additions: VBElement exposes the native constraint-validation
 * surface on form-associated components (so <form-field> can read
 * star-rating / combo-box messages), and the textarea counter's unlimited
 * text is localizable with plural categories.
 *
 * Tests the working tree: /src is served from disk.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

async function load(page, body, { lang = 'en' } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__validity-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="${lang}"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <script type="module" src="/src/main.js"></script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
}

test('required star-rating exposes validity, validationMessage and checkValidity', async ({ page }) => {
  await load(page, `<form id="f"><star-rating id="s" name="r" required></star-rating></form>`);
  await page.waitForFunction(() => customElements.get('star-rating'));
  await page.waitForSelector('star-rating[data-upgraded]');
  const r = await page.evaluate(() => {
    const s = /** @type {any} */ (document.getElementById('s'));
    return { missing: s.validity?.valueMissing, msg: s.validationMessage, ok: s.checkValidity(), form: s.form?.id };
  });
  expect(r.missing).toBe(true);
  expect(r.msg.length).toBeGreaterThan(0);
  expect(r.ok).toBe(false);
  expect(r.form).toBe('f');
});

test('non-form-associated VB element has an inert validity surface', async ({ page }) => {
  await load(page, `<tab-set id="t"><details open><summary>A</summary><p>a</p></details></tab-set>`);
  await page.waitForSelector('tab-set[data-upgraded]');
  const r = await page.evaluate(() => {
    const t = /** @type {any} */ (document.getElementById('t'));
    return { v: t.validity === undefined, ok: t.checkValidity(), form: t.form };
  });
  expect(r).toEqual({ v: true, ok: true, form: null });
});

test('unlimited counter text uses data-label plural categories for the page language', async ({ page }) => {
  await load(page, `<form-field><label for="ta">Bio</label>
    <textarea id="ta" data-count data-label-characters-one="{count} Zeichen" data-label-characters-other="{count} Zeichen insgesamt"></textarea></form-field>`, { lang: 'de' });
  const ta = page.locator('#ta');
  const counter = page.locator('form-field output.counter, form-field .textarea-counter').first();
  await ta.fill('a');
  await expect(counter).toHaveText('1 Zeichen');
  await ta.fill('abc');
  await expect(counter).toHaveText('3 Zeichen insgesamt');
});

test('unlimited counter defaults to English plurals', async ({ page }) => {
  await load(page, `<textarea id="ta" data-count="words"></textarea>`);
  const counter = page.locator('.textarea-counter, output.counter').first();
  await page.locator('#ta').fill('one');
  await expect(counter).toHaveText('1 word');
  await page.locator('#ta').fill('one two');
  await expect(counter).toHaveText('2 words');
});
