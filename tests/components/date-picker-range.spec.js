/**
 * date-picker — host-owned validity + linked range demo (vanilla-breeze-lywa).
 *
 * The host (ElementInternals) owns valueMissing / rangeUnderflow /
 * rangeOverflow anchored on the visible combobox. min/max changes keep the
 * value and mark it invalid. The hidden native input is detached from the
 * form (never blocks submission with "An invalid form control is not
 * focusable", never submits) but mirrors the message for <form-field>.
 *
 * Tests the working tree: /src and the demo are served from disk.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';

const REPO = join(import.meta.dirname, '..', '..');

async function serve(page, html) {
  await page.clock.setFixedTime(new Date('2026-04-15T12:00:00'));
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__date-picker-range-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200, contentType: 'text/html; charset=utf-8', body: html,
  }));
  /** @type {string[]} */
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url, { waitUntil: 'load' });
  return errors;
}

async function load(page, body) {
  const errors = await serve(page, `<!doctype html><html lang="en-US"><head><meta charset="utf-8">
    <link rel="stylesheet" href="/src/main.css">
    <script type="module">
      import '/src/web-components/date-picker/logic.js';
      import '/src/web-components/form-field/logic.js';
    </script>
    </head><body><main>${body}</main></body></html>`);
  await page.waitForFunction(() => customElements.get('date-picker'));
  await page.waitForSelector('date-picker[data-upgraded]');
  return errors;
}

async function loadDemo(page) {
  const html = readFileSync(join(REPO, 'demos/examples/demos/date-picker-range.html'), 'utf8');
  const errors = await serve(page, html);
  await page.waitForFunction(() => document.querySelectorAll('date-picker[data-upgraded]').length === 4
    && customElements.get('form-field'));
  return errors;
}

/** Type a date into a picker's combobox and commit with Enter. */
async function typeDate(page, sel, text) {
  const input = page.locator(`${sel} .date-input`);
  await input.fill(text);
  await input.press('Enter');
}

const notFocusable = (errors) => errors.filter((e) => /not focusable/i.test(e));

test.describe('linked range demo', () => {
  test('valid range submits exactly one ISO value per picker', async ({ page }) => {
    const errors = await loadDemo(page);
    await typeDate(page, '#check-in', '2026-04-10');
    await typeDate(page, '#check-out', '2026-04-14');
    await expect(page.locator('#stay-info')).toContainText('4 nights');
    // check-out min follows check-in (+1 night)
    expect(await page.locator('#check-out').evaluate((el) => /** @type {any} */ (el).min)).toBe('2026-04-11');

    await page.locator('#booking-form button[type="submit"]').click();
    await expect(page.locator('#form-output')).toHaveText('check_in: 2026-04-10\ncheck_out: 2026-04-14');
    const entries = await page.evaluate(() => [...new FormData(/** @type {HTMLFormElement} */ (document.getElementById('booking-form'))).entries()]);
    expect(entries).toEqual([['check_in', '2026-04-10'], ['check_out', '2026-04-14']]);
    expect(notFocusable(errors)).toEqual([]);
  });

  test('moving the start past the end keeps the end, marks it invalid and shows the message', async ({ page }) => {
    const errors = await loadDemo(page);
    await typeDate(page, '#start-date', '2026-04-10');
    await typeDate(page, '#end-date', '2026-04-12');
    await expect(page.locator('#duration-info')).toContainText('2 days');

    await typeDate(page, '#start-date', '2026-04-20');
    const state = await page.locator('#end-date').evaluate((el) => {
      const dp = /** @type {any} */ (el);
      return {
        value: dp.value,
        min: dp.min,
        valid: dp.checkValidity(),
        underflow: dp.validity.rangeUnderflow,
        message: dp.validationMessage,
        invalidPseudo: el.matches(':invalid'),
      };
    });
    expect(state).toEqual({
      value: '2026-04-12',
      min: '2026-04-20',
      valid: false,
      underflow: true,
      message: 'Choose a date on or after April 20, 2026',
      invalidPseudo: true,
    });
    await expect(page.locator('#end-date .date-input')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#end-date').locator('xpath=ancestor::form-field')).toHaveAttribute('data-invalid', '');
    await expect(page.locator('#end-date-msg')).toHaveText('Choose a date on or after April 20, 2026');
    await expect(page.locator('#duration-info')).toBeHidden();

    // Submitting is blocked and focus lands on the visible combobox.
    await page.locator('#timeline-form button[type="submit"]').click();
    await expect(page.locator('#end-date .date-input')).toBeFocused();
    await expect(page.locator('#timeline-output')).toHaveText('Submit the form to see data here');
    const threw = await page.evaluate(() => {
      try { /** @type {HTMLFormElement} */ (document.getElementById('timeline-form')).requestSubmit(); return null; }
      catch (e) { return String(e); }
    });
    expect(threw).toBeNull();
    expect(notFocusable(errors)).toEqual([]);

    // Fixing the end date clears the error and submits.
    await typeDate(page, '#end-date', '2026-04-27');
    await expect(page.locator('#end-date-msg')).toHaveText('');
    await expect(page.locator('#end-date .date-input')).not.toHaveAttribute('aria-invalid', /.*/);
    await page.locator('#timeline-form button[type="submit"]').click();
    await expect(page.locator('#timeline-output')).toHaveText('start_date: 2026-04-20\nend_date: 2026-04-27');
  });

  test('reset restores values and the derived min', async ({ page }) => {
    await loadDemo(page);
    await typeDate(page, '#check-in', '2026-04-10');
    expect(await page.locator('#check-out').evaluate((el) => /** @type {any} */ (el).min)).toBe('2026-04-11');
    await page.locator('#booking-form button[type="reset"]').click();
    await expect.poll(() => page.locator('#check-out').evaluate((el) => /** @type {any} */ (el).min)).toBe('2026-04-01');
    expect(await page.locator('#check-in').evaluate((el) => /** @type {any} */ (el).value)).toBe('');
  });
});

test.describe('host-owned validity', () => {
  test('hidden native input is detached from the form and never submits', async ({ page }) => {
    await load(page, `
      <form id="f">
        <date-picker id="dp" required>
          <input type="date" id="d" name="when" value="2026-04-15" min="2026-04-01" required>
        </date-picker>
      </form>`);
    const r = await page.evaluate(() => {
      const form = /** @type {HTMLFormElement} */ (document.getElementById('f'));
      const inner = /** @type {HTMLInputElement} */ (document.getElementById('d'));
      return {
        innerForm: inner.form,
        inElements: [...form.elements].includes(inner),
        hostInElements: [...form.elements].includes(/** @type {any} */ (document.getElementById('dp'))),
        entries: [...new FormData(form).entries()],
      };
    });
    expect(r).toEqual({
      innerForm: null, inElements: false, hostInElements: true, entries: [['when', '2026-04-15']],
    });
  });

  test('an authored form attribute on the inner input moves to the host', async ({ page }) => {
    await load(page, `
      <form id="other"></form>
      <date-picker id="dp"><input type="date" name="when" value="2026-04-15" form="other"></date-picker>`);
    const r = await page.evaluate(() => ({
      hostForm: /** @type {any} */ (document.getElementById('dp')).form?.id,
      entries: [...new FormData(/** @type {HTMLFormElement} */ (document.getElementById('other'))).entries()],
    }));
    expect(r).toEqual({ hostForm: 'other', entries: [['when', '2026-04-15']] });
  });

  test('min/max changes keep the value and flag underflow/overflow', async ({ page }) => {
    await load(page, `<form id="f"><date-picker id="dp"><input type="date" name="d" value="2026-04-15"></date-picker></form>`);
    const r = await page.evaluate(() => {
      const dp = /** @type {any} */ (document.getElementById('dp'));
      const out = [];
      const snap = () => out.push({ value: dp.value, valid: dp.checkValidity(), u: dp.validity.rangeUnderflow, o: dp.validity.rangeOverflow, msg: dp.validationMessage });
      dp.min = '2026-04-20'; snap();
      dp.min = ''; dp.max = '2026-04-10'; snap();
      dp.max = ''; snap();
      return out;
    });
    expect(r).toEqual([
      { value: '2026-04-15', valid: false, u: true, o: false, msg: 'Choose a date on or after April 20, 2026' },
      { value: '2026-04-15', valid: false, u: false, o: true, msg: 'Choose a date on or before April 10, 2026' },
      { value: '2026-04-15', valid: true, u: false, o: false, msg: '' },
    ]);
  });

  test('an authored out-of-range value is invalid at upgrade; messages are overridable', async ({ page }) => {
    await load(page, `
      <date-picker id="a" data-label-range-underflow="Not before {date}!">
        <input type="date" value="2026-03-01" min="2026-04-01">
      </date-picker>
      <date-picker id="b">
        <input type="date" value="2026-05-01" max="2026-04-30" data-message-rangeoverflow="Too late">
      </date-picker>`);
    const r = await page.evaluate(() => ['a', 'b'].map((id) => /** @type {any} */ (document.getElementById(id)).validationMessage));
    expect(r).toEqual(['Not before April 1, 2026!', 'Too late']);
  });

  test('requestSubmit on an invalid picker focuses the combobox, never the hidden input', async ({ page }) => {
    const errors = await load(page, `
      <form id="f">
        <date-picker id="dp"><input type="date" id="d" name="d" value="2026-04-15" min="2026-04-01" required></date-picker>
        <button id="go">Go</button>
      </form>`);
    await page.evaluate(() => {
      /** @type {any} */ (document.getElementById('dp')).min = '2026-04-20';
      window.submitted = false;
      document.getElementById('f').addEventListener('submit', (e) => { e.preventDefault(); window.submitted = true; });
      /** @type {HTMLFormElement} */ (document.getElementById('f')).requestSubmit();
    });
    await expect(page.locator('#dp .date-input')).toBeFocused();
    expect(await page.evaluate(() => window.submitted)).toBe(false);
    expect(notFocusable(errors)).toEqual([]);
  });

  test('required + empty: invalid on the host, aria-invalid only once touched', async ({ page }) => {
    await load(page, `
      <form id="f">
        <form-field>
          <label for="d">When</label>
          <date-picker id="dp" required><input type="date" id="d" name="d"></date-picker>
          <output class="error" for="d" aria-live="polite"></output>
        </form-field>
        <button id="go">Go</button>
      </form>`);
    const combo = page.locator('#dp .date-input');
    expect(await page.locator('#dp').evaluate((el) => /** @type {any} */ (el).validity.valueMissing)).toBe(true);
    await expect(combo).not.toHaveAttribute('aria-invalid', /.*/);
    await page.locator('#go').click();
    await expect(combo).toBeFocused();
    await expect(combo).toHaveAttribute('aria-invalid', 'true');
    // The host's invalid event lets <form-field> show the message on submit.
    await expect(page.locator('form-field')).toHaveAttribute('data-invalid', '');
    await expect(page.locator('form-field output.error')).toHaveText('Please select a date');
  });
});
