/**
 * date-picker — review fixes (vanilla-breeze-egb6, 8kf7, 8s1z, rb3n, qim5, sg0z, o3es).
 *
 * Covers: reconnect without duplicated UI or accumulated state; the
 * combobox named from the author's <label> / aria-label; keyboard grid
 * navigation (arrows, Monday-first Home/End, clamped PageUp/PageDown,
 * focusable-but-unselectable disabled days); aria-selected on the
 * gridcell; clearing; form value, reset and disabled fieldset; impossible
 * typed dates; re-picking the selected date closes; locale weekday headers
 * and data-label-* overrides.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

async function load(page, body, { lang = 'en-US' } = {}) {
  await page.clock.setFixedTime(new Date('2026-04-15T12:00:00'));
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__date-picker-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="${lang}"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <script type="module">import '/src/web-components/date-picker/logic.js';</script>
      </head><body><main>${body}<button id="outside" type="button">Outside</button></main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => customElements.get('date-picker'));
  await page.waitForSelector('date-picker[data-upgraded]');
}

const BASIC = `
  <form id="f">
    <label for="event">Event date</label>
    <date-picker id="dp">
      <input type="date" id="event" name="event" value="2026-04-15">
    </date-picker>
    <button type="reset">Reset</button>
  </form>`;

/** Open the calendar and focus the grid's roving day. */
async function openGrid(page, sel = '#dp') {
  await page.locator(`${sel} .date-input`).focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator(`${sel} td button[tabindex="0"]`)).toBeFocused();
}

const focusedDate = (page) => page.evaluate(() => document.activeElement?.getAttribute('data-date'));

test('reconnect keeps exactly one trigger and calendar, no stale open state', async ({ page }) => {
  await load(page, `
    <form id="f">
      <label for="d">Date</label>
      <date-picker id="dp" data-disabled-dates="2026-04-20">
        <input type="date" id="d" value="2026-04-15">
      </date-picker>
    </form>`);
  await openGrid(page);
  const r = await page.evaluate(() => {
    const dp = document.getElementById('dp');
    const form = document.getElementById('f');
    for (let i = 0; i < 3; i++) { dp.remove(); form.prepend(dp); }
    // Changing the attribute between connects must replace, not accumulate.
    dp.remove();
    dp.setAttribute('data-disabled-dates', '2026-04-21');
    form.prepend(dp);
    return {
      triggers: dp.querySelectorAll('.date-trigger').length,
      calendars: dp.querySelectorAll('.calendar').length,
      open: dp.hasAttribute('open'),
      expanded: dp.querySelector('.date-input').getAttribute('aria-expanded'),
      value: /** @type {any} */ (dp).value,
    };
  });
  expect(r).toEqual({ triggers: 1, calendars: 1, open: false, expanded: 'false', value: '2026-04-15' });
  await openGrid(page);
  await expect(page.locator('#dp [data-date="2026-04-20"]')).not.toHaveAttribute('aria-disabled', 'true');
  await expect(page.locator('#dp [data-date="2026-04-21"]')).toHaveAttribute('aria-disabled', 'true');
});

test('combobox is named by the inner input <label>', async ({ page }) => {
  await load(page, BASIC);
  await expect(page.getByRole('combobox', { name: 'Event date' })).toBeVisible();
});

test('combobox is named by a <label for> pointing at the host', async ({ page }) => {
  await load(page, `
    <label for="dp">Check-in</label>
    <date-picker id="dp"><input type="date" aria-label="Check-in date"></date-picker>`);
  await expect(page.getByRole('combobox', { name: 'Check-in' })).toBeVisible();
  await page.locator('label').click();
  await expect(page.locator('#dp .date-input')).toBeFocused();
});

test('aria-label on the inner input reaches the combobox; label click focuses it', async ({ page }) => {
  await load(page, `
    <date-picker id="dp"><input type="date" aria-label="Start date"></date-picker>
    <label for="x">Other</label><date-picker id="dp2"><input type="date" id="x"></date-picker>`);
  await expect(page.getByRole('combobox', { name: 'Start date' })).toBeVisible();
  await page.locator('label[for="x"]').click();
  await expect(page.locator('#dp2 .date-input')).toBeFocused();
});

test('arrow keys move by day and week', async ({ page }) => {
  await load(page, BASIC);
  await openGrid(page);
  expect(await focusedDate(page)).toBe('2026-04-15');
  await page.keyboard.press('ArrowRight');
  expect(await focusedDate(page)).toBe('2026-04-16');
  await page.keyboard.press('ArrowDown');
  expect(await focusedDate(page)).toBe('2026-04-23');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowUp');
  expect(await focusedDate(page)).toBe('2026-04-15');
});

test('Home/End go to the week edges for a Monday-first locale', async ({ page }) => {
  await load(page, BASIC, { lang: 'en-GB' });
  // Locale weekday headers, Monday first
  await expect(page.locator('#dp th').first()).toHaveAttribute('abbr', 'Monday');
  await openGrid(page);
  // 2026-04-15 is a Wednesday: Monday 13 .. Sunday 19
  await page.keyboard.press('Home');
  expect(await focusedDate(page)).toBe('2026-04-13');
  await page.keyboard.press('End');
  expect(await focusedDate(page)).toBe('2026-04-19');
  // From a Sunday (last column in en-GB) Home goes back 6 days, not forward
  await page.keyboard.press('Home');
  expect(await focusedDate(page)).toBe('2026-04-13');
});

test('Home/End for a Sunday-first locale', async ({ page }) => {
  await load(page, BASIC);
  await expect(page.locator('#dp th').first()).toHaveAttribute('abbr', 'Sunday');
  await openGrid(page);
  await page.keyboard.press('Home');
  expect(await focusedDate(page)).toBe('2026-04-12');
  await page.keyboard.press('End');
  expect(await focusedDate(page)).toBe('2026-04-18');
});

test('PageUp/PageDown clamp to the target month length', async ({ page }) => {
  await load(page, `
    <date-picker id="dp"><input type="date" aria-label="D" value="2026-01-31"></date-picker>`);
  await openGrid(page);
  await page.keyboard.press('PageDown');
  expect(await focusedDate(page)).toBe('2026-02-28');
  await page.keyboard.press('PageUp');
  expect(await focusedDate(page)).toBe('2026-01-28');
  // Header next button clamps too
  await page.evaluate(() => { /** @type {any} */ (document.getElementById('dp')).value = '2026-03-31'; });
  await openGrid(page);
  await page.keyboard.press('Shift+PageUp');
  expect(await focusedDate(page)).toBe('2025-03-31');
});

test('Shift+PageDown from Feb 29 lands on Feb 28', async ({ page }) => {
  await load(page, `
    <date-picker id="dp"><input type="date" aria-label="D" value="2028-02-29"></date-picker>`);
  await openGrid(page);
  await page.keyboard.press('Shift+PageDown');
  expect(await focusedDate(page)).toBe('2029-02-28');
});

test('disabled days are focusable but cannot be selected', async ({ page }) => {
  await load(page, `
    <date-picker id="dp" data-disabled-dates="2026-04-16:booked">
      <input type="date" aria-label="D" value="2026-04-15">
    </date-picker>`);
  await openGrid(page);
  await page.keyboard.press('ArrowRight');
  expect(await focusedDate(page)).toBe('2026-04-16');
  const day = page.locator('#dp [data-date="2026-04-16"]');
  await expect(day).toHaveAttribute('aria-disabled', 'true');
  expect(await day.evaluate((b) => /** @type {HTMLButtonElement} */ (b).disabled)).toBe(false);
  await page.keyboard.press('Enter');
  await day.click({ force: true });
  expect(await page.evaluate(() => /** @type {any} */ (document.getElementById('dp')).value)).toBe('2026-04-15');
  await expect(page.locator('#dp')).toHaveAttribute('open', '');
  // Moving on still works (focus was never lost)
  await page.keyboard.press('ArrowRight');
  expect(await focusedDate(page)).toBe('2026-04-17');
});

test('aria-selected is on the gridcell, never the button', async ({ page }) => {
  await load(page, BASIC);
  await openGrid(page);
  await expect(page.locator('#dp td[aria-selected="true"] [data-date="2026-04-15"]')).toHaveCount(1);
  await expect(page.locator('#dp td[aria-selected="true"]')).toHaveCount(1);
  await expect(page.locator('#dp button[aria-selected]')).toHaveCount(0);
});

test('selecting the already-selected date closes the calendar', async ({ page }) => {
  await load(page, BASIC);
  await page.evaluate(() => {
    window.__changes = 0;
    document.getElementById('dp').addEventListener('date-picker:change', () => { window.__changes++; });
  });
  await openGrid(page);
  await page.keyboard.press('Enter');
  await expect(page.locator('#dp')).not.toHaveAttribute('open', '');
  await expect(page.locator('#dp .date-input')).toBeFocused();
  expect(await page.evaluate(() => window.__changes)).toBe(0);
});

test('clearing the text clears the value, form value, and fires change', async ({ page }) => {
  await load(page, `
    <form id="f">
      <label for="d">Date</label>
      <date-picker id="dp" required><input type="date" id="d" name="when" value="2026-04-15"></date-picker>
    </form>`);
  await page.evaluate(() => {
    window.__detail = null;
    document.getElementById('dp').addEventListener('date-picker:change', (e) => { window.__detail = /** @type {CustomEvent} */ (e).detail; });
  });
  await page.locator('#dp .date-input').fill('');
  await page.locator('#outside').focus();
  const r = await page.evaluate(() => {
    const dp = /** @type {any} */ (document.getElementById('dp'));
    return {
      value: dp.value,
      form: new FormData(/** @type {HTMLFormElement} */ (document.getElementById('f'))).get('when'),
      valid: dp.checkValidity(),
      detail: window.__detail,
    };
  });
  expect(r).toEqual({ value: '', form: null, valid: false, detail: { value: '', date: null, source: 'keyboard' } });
});

test("value = '' clears through the API", async ({ page }) => {
  await load(page, BASIC);
  const r = await page.evaluate(() => {
    const dp = /** @type {any} */ (document.getElementById('dp'));
    let detail = null;
    dp.addEventListener('date-picker:change', (e) => { detail = e.detail; });
    dp.value = '';
    return { value: dp.value, text: dp.querySelector('.date-input').value, detail };
  });
  expect(r).toEqual({ value: '', text: '', detail: { value: '', date: null, source: 'api' } });
});

test('impossible typed dates are rejected, not rolled over', async ({ page }) => {
  await load(page, BASIC);
  for (const text of ['2026-02-31', 'April 31, 2026', '31 Apr 2026']) {
    await page.locator('#dp .date-input').fill(text);
    await page.locator('#outside').focus();
    expect(await page.evaluate(() => /** @type {any} */ (document.getElementById('dp')).value)).toBe('2026-04-15');
  }
  // ...and the API ignores them too
  expect(await page.evaluate(() => {
    const dp = /** @type {any} */ (document.getElementById('dp'));
    dp.value = '2026-02-30';
    return dp.value;
  })).toBe('2026-04-15');
});

test('typed commit on blur carries source and skips unchanged values', async ({ page }) => {
  await load(page, BASIC);
  await page.evaluate(() => {
    window.__details = [];
    document.getElementById('dp').addEventListener('date-picker:change', (e) => { window.__details.push(/** @type {CustomEvent} */ (e).detail.value + ':' + /** @type {CustomEvent} */ (e).detail.source); });
  });
  await page.locator('#dp .date-input').fill('2026-04-15');
  await page.locator('#outside').focus();
  await page.locator('#dp .date-input').fill('2026-05-01');
  await page.locator('#outside').focus();
  expect(await page.evaluate(() => window.__details)).toEqual(['2026-05-01:keyboard']);
});

test('form value, single submitted name, and reset to the authored value', async ({ page }) => {
  await load(page, BASIC);
  const r = await page.evaluate(() => {
    const dp = /** @type {any} */ (document.getElementById('dp'));
    const form = /** @type {HTMLFormElement} */ (document.getElementById('f'));
    dp.value = '2026-06-01';
    const submitted = new FormData(form).getAll('event');
    // A reconnect must not move the reset target
    dp.remove(); form.prepend(dp);
    form.reset();
    return { submitted, afterReset: dp.value, host: dp.getAttribute('name') };
  });
  expect(r).toEqual({ submitted: ['2026-06-01'], afterReset: '2026-04-15', host: 'event' });
});

test('disabled fieldset and disabled attribute disable the combobox', async ({ page }) => {
  await load(page, `
    <form><fieldset id="fs">
      <label for="d">Date</label>
      <date-picker id="dp"><input type="date" id="d" name="d" value="2026-04-15"></date-picker>
    </fieldset></form>
    <label for="e">Other</label>
    <date-picker id="dp2"><input type="date" id="e"></date-picker>`);
  const input = page.locator('#dp .date-input');
  await expect(input).toBeEnabled();
  await page.evaluate(() => { /** @type {HTMLFieldSetElement} */ (document.getElementById('fs')).disabled = true; });
  await expect(input).toBeDisabled();
  await expect(page.locator('#dp .date-trigger-icon')).toBeDisabled();
  await page.evaluate(() => { /** @type {HTMLFieldSetElement} */ (document.getElementById('fs')).disabled = false; });
  await expect(input).toBeEnabled();

  await page.evaluate(() => document.getElementById('dp2').setAttribute('disabled', ''));
  await expect(page.locator('#dp2 .date-input')).toBeDisabled();
  await page.evaluate(() => document.getElementById('dp2').removeAttribute('disabled'));
  await expect(page.locator('#dp2 .date-input')).toBeEnabled();
});

test('required is observed', async ({ page }) => {
  await load(page, `<label for="d">Date</label><date-picker id="dp"><input type="date" id="d"></date-picker>`);
  const valid = () => page.evaluate(() => /** @type {any} */ (document.getElementById('dp')).checkValidity());
  expect(await valid()).toBe(true);
  await page.evaluate(() => document.getElementById('dp').setAttribute('required', ''));
  expect(await valid()).toBe(false);
  await expect(page.locator('#dp .date-input')).toHaveAttribute('aria-required', 'true');
});

test('data-label-* overrides the UI strings and validation message', async ({ page }) => {
  await load(page, `
    <date-picker id="dp" required lang="de"
      data-label-toggle="Kalender umschalten" data-label-dialog="Datum wählen"
      data-label-prev="Vorheriger Monat" data-label-next="Nächster Monat" data-label-year="Jahr"
      data-label-placeholder="Datum eingeben" data-label-required="Bitte ein Datum wählen"
      data-label-input="Datum">
      <input type="date">
    </date-picker>`);
  const dp = page.locator('#dp');
  await expect(dp.locator('.date-trigger-icon')).toHaveAttribute('aria-label', 'Kalender umschalten');
  await expect(dp.locator('.calendar')).toHaveAttribute('aria-label', 'Datum wählen');
  await expect(dp.locator('.calendar-nav').first()).toHaveAttribute('aria-label', 'Vorheriger Monat');
  await expect(dp.locator('.calendar-nav').last()).toHaveAttribute('aria-label', 'Nächster Monat');
  await expect(dp.locator('.calendar-year')).toHaveAttribute('aria-label', 'Jahr');
  await expect(dp.locator('.date-input')).toHaveAttribute('placeholder', 'Datum eingeben');
  await expect(page.getByRole('combobox', { name: 'Datum' })).toBeVisible();
  expect(await dp.evaluate((el) => /** @type {any} */ (el).validationMessage)).toBe('Bitte ein Datum wählen');
  // lang="de": Monday-first, German weekday names
  await expect(dp.locator('th').first()).toHaveAttribute('abbr', 'Montag');
});

test('the doc hero demo (date-picker-basic.html) upgrades with named comboboxes', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-04-15T12:00:00'));
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  await page.route('**/__dp-demo/basic.html', (route) => route.fulfill({
    path: join(REPO, 'demos/examples/demos/date-picker-basic.html'),
    contentType: 'text/html; charset=utf-8',
  }));
  await page.goto('/__dp-demo/basic.html', { waitUntil: 'load' });
  await expect(page.locator('date-picker[data-upgraded]')).toHaveCount(2);
  await expect(page.getByRole('combobox', { name: 'Event date' })).toHaveValue('April 15, 2026');
  await expect(page.getByRole('combobox', { name: /Appointment/ })).toBeVisible();
  await page.getByRole('button', { name: 'Submit' }).click();
  // Required + empty appointment blocks submission
  await expect(page.locator('#form-output')).toHaveText('Submit the form to see data here');
  expect(errors).toEqual([]);
});
