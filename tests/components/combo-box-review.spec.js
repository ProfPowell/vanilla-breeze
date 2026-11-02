/**
 * combo-box — review fixes (vanilla-breeze-i89g a11y, -25vi docs).
 *
 * Covers: re-choosing the selected option closes the list; real disabled
 * (attribute + fieldset); exactly one submitted value when the name sits on
 * the inner input; <label for> naming the combobox; removeAttribute('value')
 * clears; change detail `source`; aria-invalid mirrored after `invalid`.
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
  const url = `/__combo-box-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <script type="module">import '/src/web-components/combo-box/logic.js';</script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => customElements.get('combo-box'));
  await page.waitForSelector('combo-box[data-upgraded]');
}

const OPTIONS = `<ul>
  <li data-value="apple">Apple</li>
  <li data-value="banana">Banana</li>
  <li data-value="cherry">Cherry</li>
</ul>`;

const SINGLE = `<form id="f">
  <label for="fruit">Fruit</label>
  <combo-box id="cb" value="banana">
    <input type="text" id="fruit" name="fruit">
    ${OPTIONS}
  </combo-box>
  <button type="reset">Reset</button>
</form>`;

test('re-choosing the selected option closes the list', async ({ page }) => {
  await load(page, SINGLE);
  const input = page.locator('#fruit');
  await input.click();
  await page.keyboard.press('ArrowDown');
  const cb = page.locator('combo-box');
  await expect(cb).toHaveAttribute('open', '');
  let changes = 0;
  await page.exposeFunction('countChange', () => { changes++; });
  await page.evaluate(() => document.getElementById('cb')
    .addEventListener('combo-box:change', () => /** @type {any} */ (window).countChange()));
  await page.locator('li[data-value="banana"]').click();
  await expect(cb).not.toHaveAttribute('open');
  await expect(input).toHaveAttribute('aria-expanded', 'false');
  await expect(input).toHaveValue('Banana');
  expect(changes).toBe(0);
});

test('disabled attribute disables the input and blocks opening', async ({ page }) => {
  await load(page, SINGLE);
  const input = page.locator('#fruit');
  await input.click();
  await expect(page.locator('combo-box')).toHaveAttribute('open', '');
  await page.evaluate(() => document.getElementById('cb').setAttribute('disabled', ''));
  await expect(input).toBeDisabled();
  await expect(page.locator('combo-box')).not.toHaveAttribute('open');
  const keys = await page.evaluate(() =>
    [...new FormData(/** @type {HTMLFormElement} */ (document.getElementById('f'))).keys()]);
  expect(keys).not.toContain('fruit');
  await page.evaluate(() => document.getElementById('cb').removeAttribute('disabled'));
  await expect(input).toBeEnabled();
});

test('a disabled fieldset disables the combobox (multi keeps max lock)', async ({ page }) => {
  await load(page, `<form><fieldset id="fs"><legend>Tags</legend>
    <label for="t">Tags</label>
    <combo-box multiple max="1"><input type="text" id="t">${OPTIONS}</combo-box>
  </fieldset></form>`);
  const input = page.locator('#t');
  await page.evaluate(() => { /** @type {HTMLFieldSetElement} */ (document.getElementById('fs')).disabled = true; });
  await expect(input).toBeDisabled();
  await page.evaluate(() => { /** @type {HTMLFieldSetElement} */ (document.getElementById('fs')).disabled = false; });
  await expect(input).toBeEnabled();
});

test('name on the inner input submits exactly one value (the option value)', async ({ page }) => {
  await load(page, SINGLE);
  const r = await page.evaluate(() => ({
    all: new FormData(/** @type {HTMLFormElement} */ (document.getElementById('f'))).getAll('fruit'),
    host: document.getElementById('cb').getAttribute('name'),
    input: document.getElementById('fruit').getAttribute('name'),
  }));
  expect(r).toEqual({ all: ['banana'], host: 'fruit', input: null });
});

test('<label for> on the inner input names the combobox', async ({ page }) => {
  await load(page, SINGLE);
  await expect(page.getByRole('combobox', { name: 'Fruit' })).toHaveCount(1);
});

test('removeAttribute("value") clears the selection', async ({ page }) => {
  await load(page, SINGLE);
  const r = await page.evaluate(() => {
    const cb = /** @type {any} */ (document.getElementById('cb'));
    cb.removeAttribute('value');
    return {
      value: cb.value,
      text: /** @type {HTMLInputElement} */ (document.getElementById('fruit')).value,
      selected: cb.querySelectorAll('[aria-selected="true"]').length,
      form: new FormData(/** @type {HTMLFormElement} */ (document.getElementById('f'))).getAll('fruit'),
    };
  });
  expect(r).toEqual({ value: '', text: '', selected: 0, form: [] });
});

test('multi-mode change detail carries source', async ({ page }) => {
  await load(page, `<label for="t">Tags</label>
    <combo-box id="m" multiple><input type="text" id="t">${OPTIONS}</combo-box>`);
  const p = page.evaluate(() => new Promise((res) => {
    document.getElementById('m').addEventListener('combo-box:change',
      (e) => res(/** @type {CustomEvent} */ (e).detail.source), { once: true });
  }));
  await page.locator('#t').click();
  await page.locator('li[data-value="apple"]').click();
  expect(await p).toBe('internal');
});

test('aria-invalid mirrors validity after an invalid check', async ({ page }) => {
  await load(page, `<form id="f"><label for="r">Fruit</label>
    <combo-box id="rq" name="fruit" required><input type="text" id="r">${OPTIONS}</combo-box></form>`);
  const input = page.locator('#r');
  await expect(input).not.toHaveAttribute('aria-invalid', /.*/);
  await page.evaluate(() => /** @type {HTMLFormElement} */ (document.getElementById('f')).checkValidity());
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  await page.evaluate(() => { /** @type {any} */ (document.getElementById('rq')).value = 'cherry'; });
  await expect(input).not.toHaveAttribute('aria-invalid', /.*/);
});
