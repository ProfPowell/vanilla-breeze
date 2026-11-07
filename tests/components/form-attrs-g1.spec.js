/**
 * Form attribute enhancers — data-switch, data-range, data-stepper,
 * data-color, data-mask (form-attr review F1 fixes).
 *
 * Covers: stepper honours disabled / readonly / fieldset and the step base,
 * custom button names; colour input is the single control with aria-hidden
 * decoration; range aria-valuetext, hidden decoration, max=0, Intl format;
 * mask literal digits, caret, incomplete validity, reset, unknown-type
 * retry, non-text types; switch role + registerInit wiring + s/l sizes;
 * every value-mirroring enhancer re-syncs after form.reset(); clones of an
 * enhanced control are re-wired, not skipped.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

const MODULES = ['switch-init', 'range-init', 'number-init', 'color-init', 'mask-init'];

/**
 * @param {import('playwright/test').Page} page
 * @param {string} body
 * @param {{ dir?: string, lang?: string }} [opts]
 */
async function load(page, body, { dir = 'ltr', lang = 'en' } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__form-attrs-g1-${Math.random().toString(36).slice(2)}.html`;
  const imports = MODULES.map((m) => `import '/src/utils/${m}.js';`).join('\n');
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="${lang}" dir="${dir}"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <style>main { inline-size: 480px; }</style>
      <script type="module">${imports}
      window.__ready = true;</script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => /** @type {any} */ (window).__ready);
}

/** Reset the form and wait past the deferred onFormReset callbacks. */
async function resetForm(page, id = 'f') {
  await page.evaluate((fid) => /** @type {HTMLFormElement} */ (document.getElementById(fid)).reset(), id);
  await page.waitForTimeout(50);
}

/* ------------------------------------------------------------------ */
/* data-stepper                                                        */
/* ------------------------------------------------------------------ */

test.describe('data-stepper', () => {
  const FORM = `<form id="f">
    <label for="n">Guests</label>
    <input type="number" id="n" min="2" max="10" value="2" data-stepper
      data-label-decrease="Fewer guests" data-label-increase="More guests">
    <label for="b">Base</label>
    <input type="number" id="b" min="1" step="5" value="2" data-stepper>
    <fieldset id="fs"><legend>Locked</legend>
      <label for="c">Count</label><input type="number" id="c" value="1" data-stepper>
    </fieldset>
  </form>`;

  test('buttons ignore clicks when the input is readonly or disabled', async ({ page }) => {
    await load(page, FORM);
    const inc = page.locator('#n + .number-inc');
    await page.locator('#n').evaluate((/** @type {HTMLInputElement} */ el) => { el.readOnly = true; });
    await page.waitForTimeout(20);
    expect(await inc.isDisabled()).toBe(true);
    await inc.click({ force: true });
    expect(await page.locator('#n').inputValue()).toBe('2');

    await page.locator('#n').evaluate((/** @type {HTMLInputElement} */ el) => { el.readOnly = false; el.disabled = true; });
    await page.waitForTimeout(20);
    expect(await inc.isDisabled()).toBe(true);
    await inc.click({ force: true });
    expect(await page.locator('#n').inputValue()).toBe('2');

    await page.locator('#n').evaluate((/** @type {HTMLInputElement} */ el) => { el.disabled = false; });
    await page.waitForTimeout(20);
    expect(await inc.isDisabled()).toBe(false);
    await inc.click();
    expect(await page.locator('#n').inputValue()).toBe('3');
  });

  test('a disabled fieldset locks the buttons and stepping', async ({ page }) => {
    await load(page, FORM);
    await page.evaluate(() => { /** @type {HTMLFieldSetElement} */ (document.getElementById('fs')).disabled = true; });
    const r = await page.evaluate(() => {
      const btn = /** @type {HTMLButtonElement} */ (document.querySelector('#c + .number-inc'));
      btn.click();
      return { value: /** @type {HTMLInputElement} */ (document.getElementById('c')).value, disabled: btn.matches(':disabled') };
    });
    expect(r).toEqual({ value: '1', disabled: true });
  });

  test('steps from the step base like stepUp()', async ({ page }) => {
    await load(page, FORM);
    await page.locator('#b + .number-inc').click();
    const r = await page.locator('#b').evaluate((/** @type {HTMLInputElement} */ el) => ({ v: el.value, valid: el.validity.valid }));
    expect(r).toEqual({ v: '6', valid: true });
  });

  test('custom button names from data-label-*; icons hidden', async ({ page }) => {
    await load(page, FORM);
    await expect(page.locator('#n ~ .number-inc')).toHaveAttribute('aria-label', 'More guests');
    await expect(page.locator('.number-wrapper:has(#n) .number-dec')).toHaveAttribute('aria-label', 'Fewer guests');
    await expect(page.locator('.number-wrapper:has(#b) .number-dec')).toHaveAttribute('aria-label', 'Decrease');
    await expect(page.locator('.number-wrapper:has(#n) .number-dec svg')).toHaveAttribute('aria-hidden', 'true');
  });

  test('button state re-syncs after form reset', async ({ page }) => {
    await load(page, FORM);
    const dec = page.locator('.number-wrapper:has(#n) .number-dec');
    expect(await dec.isDisabled()).toBe(true);
    await page.locator('#n + .number-inc').click();
    expect(await dec.isDisabled()).toBe(false);
    await resetForm(page);
    expect(await page.locator('#n').inputValue()).toBe('2');
    expect(await dec.isDisabled()).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/* data-color                                                          */
/* ------------------------------------------------------------------ */

test.describe('data-color', () => {
  const FORM = `<form id="f">
    <label for="c">Brand colour</label>
    <input type="color" id="c" name="c" value="#6366f1" data-color>
    <button type="button" id="after">After</button>
  </form>`;

  test('the native input is the only control; display is aria-hidden', async ({ page }) => {
    await load(page, FORM);
    expect(await page.locator('.color-wrapper button').count()).toBe(0);
    await expect(page.locator('.color-display')).toHaveAttribute('aria-hidden', 'true');
    await page.locator('#c').focus();
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement?.id)).toBe('after');
    // The input stays labelled and on top of the display, so clicks reach it.
    const top = await page.evaluate(() => {
      const d = /** @type {HTMLElement} */ (document.querySelector('.color-display')).getBoundingClientRect();
      return document.elementFromPoint(d.left + d.width / 2, d.top + d.height / 2)?.id;
    });
    expect(top).toBe('c');
  });

  test('swatch and hex re-sync after reset and programmatic change', async ({ page }) => {
    await load(page, FORM);
    await page.locator('#c').evaluate((/** @type {HTMLInputElement} */ el) => {
      el.value = '#000000';
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await expect(page.locator('.color-hex')).toHaveText('#000000');
    await resetForm(page);
    await expect(page.locator('.color-hex')).toHaveText('#6366f1');
    const bg = await page.locator('.color-swatch').evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg).toBe('rgb(99, 102, 241)');
  });

  test('forced colours keep the swatch colour', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await load(page, FORM);
    const adjust = await page.locator('.color-swatch').evaluate((el) => getComputedStyle(el).forcedColorAdjust);
    expect(adjust).toBe('none');
  });

  test('a cloned enhanced input is re-wired, not skipped', async ({ page }) => {
    await load(page, FORM);
    await page.evaluate(() => {
      const wrapper = /** @type {Element} */ (document.querySelector('.color-wrapper'));
      const copy = /** @type {Element} */ (wrapper.cloneNode(true));
      /** @type {HTMLInputElement} */ (copy.querySelector('input')).id = 'c2';
      document.querySelector('main')?.append(copy);
    });
    await page.waitForTimeout(20);
    const r = await page.evaluate(() => {
      const input = /** @type {HTMLInputElement} */ (document.getElementById('c2'));
      input.value = '#ff0000';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      const w = /** @type {Element} */ (input.parentElement);
      return { displays: w.querySelectorAll('.color-display').length, hex: w.querySelector('.color-hex')?.textContent };
    });
    expect(r).toEqual({ displays: 1, hex: '#ff0000' });
  });
});

/* ------------------------------------------------------------------ */
/* data-range                                                          */
/* ------------------------------------------------------------------ */

test.describe('data-range', () => {
  const PRICE = `<form id="f">
    <label for="r">Budget</label>
    <input type="range" id="r" min="0" max="2000" step="100" value="500" list="ticks"
      data-range data-bubble data-prefix="$" data-markers>
    <datalist id="ticks"><option value="0" label="Nothing"></option><option value="2000" label="All of it"></option></datalist>
  </form>`;

  test('aria-valuetext carries prefix, Intl format and datalist labels; decoration hidden', async ({ page }) => {
    await load(page, PRICE);
    const r = page.locator('#r');
    await expect(r).toHaveAttribute('aria-valuetext', '$500');
    await r.evaluate((/** @type {HTMLInputElement} */ el) => { el.value = '1500'; el.dispatchEvent(new Event('input', { bubbles: true })); });
    await expect(r).toHaveAttribute('aria-valuetext', '$1,500');
    await expect(page.locator('.range-bubble')).toHaveText('$1,500');
    await r.evaluate((/** @type {HTMLInputElement} */ el) => { el.value = '2000'; el.dispatchEvent(new Event('input', { bubbles: true })); });
    await expect(r).toHaveAttribute('aria-valuetext', 'All of it');
    for (const sel of ['.range-bubble', '.range-labels', '.range-markers']) {
      await expect(page.locator(sel)).toHaveAttribute('aria-hidden', 'true');
    }
  });

  test('locale from the closest [lang]', async ({ page }) => {
    await load(page, `<p lang="de"><label for="d">Menge</label>
      <input type="range" id="d" min="0" max="5000" value="1500" data-range data-bubble></p>`);
    await expect(page.locator('#d')).toHaveAttribute('aria-valuetext', '1.500');
    await expect(page.locator('.range-bubble')).toHaveText('1.500');
  });

  test('plain slider needs no aria-valuetext', async ({ page }) => {
    await load(page, `<label for="p">Volume</label><input type="range" id="p" value="40" data-range>`);
    expect(await page.locator('#p').getAttribute('aria-valuetext')).toBeNull();
  });

  test('max="0" is honoured (negative ranges)', async ({ page }) => {
    await load(page, `<label for="g">Gain</label><input type="range" id="g" min="-100" max="0" value="-25" data-range>`);
    const pct = await page.locator('.range-wrapper').evaluate((el) => /** @type {HTMLElement} */ (el).style.getPropertyValue('--range-pct'));
    expect(pct).toBe('75%');
  });

  test('markers are skipped above 100 steps', async ({ page }) => {
    await load(page, `<label for="m">Fine</label><input type="range" id="m" min="0" max="1000" value="5" data-range data-markers>`);
    expect(await page.locator('.range-markers').count()).toBe(0);
  });

  test('fill, bubble and valuetext re-sync after form reset', async ({ page }) => {
    await load(page, PRICE);
    await page.locator('#r').evaluate((/** @type {HTMLInputElement} */ el) => { el.value = '1800'; el.dispatchEvent(new Event('input', { bubbles: true })); });
    await resetForm(page);
    await expect(page.locator('.range-bubble')).toHaveText('$500');
    await expect(page.locator('#r')).toHaveAttribute('aria-valuetext', '$500');
    const pct = await page.locator('.range-wrapper').evaluate((el) => /** @type {HTMLElement} */ (el).style.getPropertyValue('--range-pct'));
    expect(pct).toBe('25%');
  });

  test('RTL: bubble and labels centre on the thumb', async ({ page }) => {
    await load(page, `<label for="t">Level</label>
      <input type="range" id="t" min="0" max="100" value="30" list="tl" data-range data-bubble data-suffix=" points">
      <datalist id="tl"><option value="0" label="Low"></option><option value="50" label="Mid"></option><option value="100" label="High"></option></datalist>`,
    { dir: 'rtl' });
    const g = await page.evaluate(() => {
      const input = /** @type {HTMLInputElement} */ (document.getElementById('t'));
      const ib = input.getBoundingClientRect();
      const thumb = parseFloat(getComputedStyle(document.documentElement).fontSize) * 1.25;
      // RTL: value fraction measured from the right edge.
      const thumbAt = (/** @type {number} */ v) => ib.right - (thumb / 2 + (v / 100) * (ib.width - thumb));
      const centre = (/** @type {Element} */ el) => { const r = el.getBoundingClientRect(); return r.left + r.width / 2; };
      return {
        bubble: [centre(/** @type {Element} */ (document.querySelector('.range-bubble'))), thumbAt(30)],
        labels: Array.from(document.querySelectorAll('.range-labels span'), (s, i) => [centre(s), thumbAt([0, 50, 100][i])]),
      };
    });
    expect(Math.abs(g.bubble[0] - g.bubble[1])).toBeLessThan(1);
    for (const [at, want] of g.labels) expect(Math.abs(at - want)).toBeLessThan(1);
  });
});

/* ------------------------------------------------------------------ */
/* data-mask                                                           */
/* ------------------------------------------------------------------ */

test.describe('data-mask', () => {
  test('literal digits in a custom pattern are not re-read as input', async ({ page }) => {
    await load(page, `<label for="m">Phone</label>
      <input type="text" id="m" data-mask="custom" data-pattern="+1 ###-####">`);
    await page.locator('#m').pressSequentially('5551234');
    expect(await page.locator('#m').inputValue()).toBe('+1 555-1234');
    expect(await page.locator('#m').getAttribute('data-raw-value')).toBe('5551234');
  });

  test('letters keep their case; * takes letters and digits only', async ({ page }) => {
    await load(page, `<label for="k">Key</label>
      <input type="text" id="k" data-mask="custom" data-pattern="AA-**">`);
    await page.locator('#k').pressSequentially('ab1!c');
    expect(await page.locator('#k').inputValue()).toBe('ab-1c');
  });

  test('caret stays put when an edit leaves nothing before it', async ({ page }) => {
    await load(page, `<label for="p">Phone</label><input type="tel" id="p" data-mask="phone">`);
    const p = page.locator('#p');
    await p.pressSequentially('5551234567');
    expect(await p.inputValue()).toBe('(555) 123-4567');
    await p.evaluate((/** @type {HTMLInputElement} */ el) => el.setSelectionRange(1, 1));
    await page.keyboard.press('Backspace');
    const r = await p.evaluate((/** @type {HTMLInputElement} */ el) => ({ v: el.value, at: el.selectionStart }));
    expect(r).toEqual({ v: '(555) 123-4567', at: 1 });
  });

  test('backspace over a literal deletes the character before it', async ({ page }) => {
    await load(page, `<label for="p">Phone</label><input type="tel" id="p" data-mask="phone">`);
    const p = page.locator('#p');
    await p.pressSequentially('5551234567');
    await p.evaluate((/** @type {HTMLInputElement} */ el) => el.setSelectionRange(10, 10)); // after "-"
    await page.keyboard.press('Backspace');
    expect(await p.inputValue()).toBe('(555) 124-567');
  });

  test('typing in the middle keeps the caret after the typed character', async ({ page }) => {
    await load(page, `<label for="p">Phone</label><input type="tel" id="p" data-mask="phone">`);
    const p = page.locator('#p');
    await p.pressSequentially('555123');
    await p.evaluate((/** @type {HTMLInputElement} */ el) => el.setSelectionRange(2, 2)); // after first 5
    await page.keyboard.type('9');
    const r = await p.evaluate((/** @type {HTMLInputElement} */ el) => ({ v: el.value, at: el.selectionStart }));
    expect(r).toEqual({ v: '(595) 512-3', at: 3 });
  });

  test('an incomplete value is invalid; complete or empty is valid', async ({ page }) => {
    await load(page, `<label for="s">SSN</label>
      <input type="text" id="s" data-mask="ssn" placeholder="123-45-6789">`);
    const s = page.locator('#s');
    await s.pressSequentially('12');
    let r = await s.evaluate((/** @type {HTMLInputElement} */ el) => ({ valid: el.checkValidity(), msg: el.validationMessage }));
    expect(r.valid).toBe(false);
    expect(r.msg).toContain('123-45-6789');
    await s.pressSequentially('3456789');
    expect(await s.evaluate((/** @type {HTMLInputElement} */ el) => el.checkValidity())).toBe(true);
    await s.fill('');
    expect(await s.evaluate((/** @type {HTMLInputElement} */ el) => el.checkValidity())).toBe(true);
  });

  test('form reset re-formats the default and refreshes data-raw-value', async ({ page }) => {
    await load(page, `<form id="f"><label for="p">Phone</label>
      <input type="tel" id="p" value="5551234567" data-mask="phone"></form>`);
    const p = page.locator('#p');
    expect(await p.inputValue()).toBe('(555) 123-4567');
    await p.fill('');
    await p.pressSequentially('999');
    await resetForm(page);
    expect(await p.inputValue()).toBe('(555) 123-4567');
    expect(await p.getAttribute('data-raw-value')).toBe('5551234567');
  });

  test('unknown preset is re-checked when the attribute is fixed', async ({ page }) => {
    await load(page, `<label for="u">Zip</label><input type="text" id="u" data-mask="zipp">`);
    expect(await page.locator('#u').getAttribute('data-mask-init')).toBeNull();
    await page.locator('#u').evaluate((el) => el.setAttribute('data-mask', 'zip'));
    await page.waitForTimeout(20);
    await page.locator('#u').pressSequentially('12a345');
    expect(await page.locator('#u').inputValue()).toBe('12345');
  });

  test('non-text types are left alone (no setSelectionRange errors)', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await load(page, `<label for="e">Email</label><input type="email" id="e" data-mask="custom" data-pattern="AAA">`);
    await page.locator('#e').pressSequentially('abc@d');
    expect(await page.locator('#e').inputValue()).toBe('abc@d');
    expect(await page.locator('#e').getAttribute('data-mask-init')).toBeNull();
    expect(errors).toEqual([]);
  });
});

/* ------------------------------------------------------------------ */
/* data-switch                                                         */
/* ------------------------------------------------------------------ */

test.describe('data-switch', () => {
  test('role=switch on initial and added switches; authored role kept', async ({ page }) => {
    await load(page, `<label><input type="checkbox" data-switch id="a"> A</label>
      <label><input type="checkbox" data-switch role="checkbox" id="b"> B</label>`);
    await expect(page.locator('#a')).toHaveAttribute('role', 'switch');
    await expect(page.locator('#b')).toHaveAttribute('role', 'checkbox');
    await page.evaluate(() => {
      const label = document.createElement('label');
      label.innerHTML = '<input type="checkbox" data-switch id="c"> C';
      document.querySelector('main')?.append(label);
    });
    await expect(page.locator('#c')).toHaveAttribute('role', 'switch');
  });

  test('s and l sizes', async ({ page }) => {
    await load(page, `<input type="checkbox" data-switch="s" id="s" aria-label="s">
      <input type="checkbox" data-switch id="m" aria-label="m">
      <input type="checkbox" data-switch="l" id="l" aria-label="l">`);
    const w = await page.evaluate(() => ['s', 'm', 'l'].map((id) =>
      /** @type {HTMLElement} */ (document.getElementById(id)).getBoundingClientRect().width));
    expect(w[0]).toBeLessThan(w[1]);
    expect(w[1]).toBeLessThan(w[2]);
  });
});
