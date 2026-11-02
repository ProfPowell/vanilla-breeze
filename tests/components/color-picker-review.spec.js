/**
 * color-picker — review fixes (vanilla-breeze-5ac4 reconnect, -i89g a11y).
 *
 * Covers: one trigger/panel across reconnects and a stable reset target;
 * the trigger named from the input's <label>; Escape + focus return; real
 * disabled (attribute + fieldset); slider/swatch semantics; physical
 * positioning in RTL and viewport clamping; exactly one submitted value
 * when the name sits on the inner input.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

async function load(page, body, { dir = 'ltr' } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__color-picker-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en" dir="${dir}"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <script type="module">import '/src/web-components/color-picker/logic.js';</script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => customElements.get('color-picker'));
  await page.waitForSelector('color-picker[data-upgraded]');
}

const LABELLED = `
  <form id="f">
    <label for="brand">Brand color</label>
    <color-picker id="cp">
      <input type="color" id="brand" name="brand" value="#6366f1">
      <datalist>
        <option value="#ef4444">Red</option>
        <option value="#6366f1">Indigo</option>
      </datalist>
    </color-picker>
    <button type="reset">Reset</button>
  </form>
  <p id="outside">Outside</p>`;

test('reconnect keeps exactly one trigger and panel', async ({ page }) => {
  await load(page, LABELLED);
  const counts = await page.evaluate(() => {
    const cp = document.getElementById('cp');
    const form = document.getElementById('f');
    for (let i = 0; i < 3; i++) { cp.remove(); form.prepend(cp); }
    return {
      triggers: cp.querySelectorAll('.color-trigger').length,
      panels: cp.querySelectorAll('.color-panel').length,
      upgraded: cp.hasAttribute('data-upgraded'),
    };
  });
  expect(counts).toEqual({ triggers: 1, panels: 1, upgraded: true });
});

test('reconnect keeps the current colour and the original reset target', async ({ page }) => {
  await load(page, LABELLED);
  const r = await page.evaluate(() => {
    const cp = /** @type {any} */ (document.getElementById('cp'));
    const form = /** @type {HTMLFormElement} */ (document.getElementById('f'));
    cp.value = '#ff0000';
    cp.remove(); form.prepend(cp);
    const afterMove = cp.value;
    form.reset();
    return { afterMove, afterReset: cp.value };
  });
  expect(r.afterMove).toBe('#ff0000');
  expect(r.afterReset).toBe('#6366f1');
});

test('trigger is named by the input label plus the current value', async ({ page }) => {
  await load(page, LABELLED);
  await expect(page.getByRole('button', { name: /^Brand color\s+#6366f1$/i })).toHaveCount(1);
});

test('label click focuses the trigger instead of the hidden native input', async ({ page }) => {
  await load(page, LABELLED);
  await page.locator('label[for="brand"]').click();
  await expect(page.locator('.color-trigger')).toBeFocused();
});

test('Escape closes the panel and returns focus to the trigger', async ({ page }) => {
  await load(page, LABELLED);
  const trigger = page.locator('.color-trigger');
  await trigger.click();
  await expect(page.locator('color-picker')).toHaveAttribute('open', '');
  await expect(page.locator('.color-area')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('color-picker')).not.toHaveAttribute('open');
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
});

test('outside click closes without stealing focus', async ({ page }) => {
  await load(page, LABELLED);
  await page.locator('.color-trigger').click();
  await expect(page.locator('color-picker')).toHaveAttribute('open', '');
  // Click a point the (viewport-clamped) panel doesn't cover — on a phone
  // viewport it can sit over #outside.
  const panel = await page.locator('.color-panel').boundingBox();
  const vp = page.viewportSize();
  const y = panel.y + panel.height + 8 < vp.height ? panel.y + panel.height + 8 : panel.y - 8;
  await page.mouse.click(4, Math.max(4, y));
  await expect(page.locator('color-picker')).not.toHaveAttribute('open');
  await expect(page.locator('.color-trigger')).not.toBeFocused();
});

test('disabled attribute disables the trigger and the submission', async ({ page }) => {
  await load(page, LABELLED);
  const trigger = page.locator('.color-trigger');
  await page.evaluate(() => document.getElementById('cp').setAttribute('disabled', ''));
  await expect(trigger).toBeDisabled();
  const entries = await page.evaluate(() =>
    [...new FormData(/** @type {HTMLFormElement} */ (document.getElementById('f'))).keys()]);
  expect(entries).not.toContain('brand');
  await page.evaluate(() => document.getElementById('cp').removeAttribute('disabled'));
  await expect(trigger).toBeEnabled();
});

test('a disabled fieldset disables the picker', async ({ page }) => {
  await load(page, `<form><fieldset id="fs"><legend>Theme</legend>
    <color-picker><input type="color" aria-label="Accent" value="#3b82f6"></color-picker>
    </fieldset></form>`);
  await page.evaluate(() => { /** @type {HTMLFieldSetElement} */ (document.getElementById('fs')).disabled = true; });
  await expect(page.locator('.color-trigger')).toBeDisabled();
  await page.evaluate(() => { /** @type {HTMLFieldSetElement} */ (document.getElementById('fs')).disabled = false; });
  await expect(page.locator('.color-trigger')).toBeEnabled();
});

test('colour area exposes slider value semantics', async ({ page }) => {
  await load(page, LABELLED);
  await page.locator('.color-trigger').click();
  const area = page.getByRole('slider', { name: 'Saturation and lightness' });
  await expect(area).toHaveAttribute('aria-valuemin', '0');
  await expect(area).toHaveAttribute('aria-valuemax', '100');
  const before = Number(await area.getAttribute('aria-valuenow'));
  await area.press('ArrowRight');
  await expect(area).toHaveAttribute('aria-valuenow', String(before + 1));
  await expect(area).toHaveAttribute('aria-valuetext', /^Saturation \d+%, lightness \d+%$/);
});

test('swatches are toggle buttons in a group, current one pressed', async ({ page }) => {
  await load(page, LABELLED);
  await page.locator('.color-trigger').click();
  const group = page.getByRole('group', { name: 'Preset colors' });
  await expect(group).toHaveCount(1);
  await expect(page.locator('.color-swatches [role="option"]')).toHaveCount(0);
  await expect(group.getByRole('button', { name: 'Indigo' })).toHaveAttribute('aria-pressed', 'true');
  await group.getByRole('button', { name: 'Red' }).click();
  await expect(group.getByRole('button', { name: 'Red' })).toHaveAttribute('aria-pressed', 'true');
  await expect(group.getByRole('button', { name: 'Indigo' })).toHaveAttribute('aria-pressed', 'false');
});

test('RTL: the area thumb lands under the pointer', async ({ page }) => {
  await load(page, LABELLED, { dir: 'rtl' });
  await page.locator('.color-trigger').click();
  const area = page.locator('.color-area');
  const box = await area.boundingBox();
  await page.mouse.click(box.x + box.width * 0.25, box.y + box.height * 0.5);
  const thumb = await page.locator('.color-area-thumb').boundingBox();
  const thumbCenter = thumb.x + thumb.width / 2;
  expect(Math.abs(thumbCenter - (box.x + box.width * 0.25))).toBeLessThan(4);
});

test('panel stays inside the viewport near the right and bottom edges', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 600 });
  await load(page, `<color-picker id="edge">
      <input type="color" aria-label="Edge" value="#22c55e"></color-picker>`);
  await page.addStyleTag({ content: '#edge { position: fixed; right: 4px; bottom: 4px; }' });
  await page.locator('.color-trigger').click();
  await expect(page.locator('color-picker')).toHaveAttribute('open', '');
  const panel = await page.locator('.color-panel').boundingBox();
  expect(panel.x).toBeGreaterThanOrEqual(0);
  expect(panel.y).toBeGreaterThanOrEqual(0);
  expect(panel.x + panel.width).toBeLessThanOrEqual(800);
  expect(panel.y + panel.height).toBeLessThanOrEqual(600);
});

test('RTL: panel aligns to the trigger end and stays in the viewport', async ({ page }) => {
  await load(page, `<color-picker id="r">
      <input type="color" aria-label="RTL" value="#22c55e"></color-picker>`, { dir: 'rtl' });
  await page.locator('.color-trigger').click();
  await expect(page.locator('color-picker')).toHaveAttribute('open', '');
  const trigger = await page.locator('.color-trigger').boundingBox();
  const panel = await page.locator('.color-panel').boundingBox();
  const vw = page.viewportSize().width;
  expect(panel.x + panel.width).toBeLessThanOrEqual(vw);
  expect(Math.abs((panel.x + panel.width) - (trigger.x + trigger.width))).toBeLessThan(10);
});

test('name on the inner input submits exactly one value after upgrade', async ({ page }) => {
  await load(page, LABELLED);
  const r = await page.evaluate(() => {
    const form = /** @type {HTMLFormElement} */ (document.getElementById('f'));
    return {
      all: new FormData(form).getAll('brand'),
      hostName: document.getElementById('cp').getAttribute('name'),
      inputName: document.getElementById('brand').getAttribute('name'),
    };
  });
  expect(r.all).toEqual(['#6366f1']);
  expect(r.hostName).toBe('brand');
  expect(r.inputName).toBeNull();
});
