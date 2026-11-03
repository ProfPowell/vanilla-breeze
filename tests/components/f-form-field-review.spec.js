/**
 * form-field — F-element review fixes (vanilla-breeze-4rtb).
 *
 * Covers: setError clears on the next edit (and leaves foreign custom errors
 * alone); badInput messages; checkbox/radio validity + no success icon; radio
 * groups bound by name; select chevron kept in the valid state; OTP keeps a
 * validatable source + labelled group; password toggle/meter idempotent on
 * move; collapsed error out of the a11y tree; aria-describedby order; the
 * textarea counter never becomes the error output; floating label with a
 * real placeholder; star-rating / combo-box validity bridged; reconnect keeps
 * state; forced-colors icons; validate() shows errors immediately.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

async function load(page, body, { extra = '' } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__f-form-field-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <script type="module">
        import '/src/web-components/form-field/logic.js';
        import '/src/utils/textarea-count-init.js';
        import '/src/utils/floating-label-init.js';
        import { initFormFieldEnhancements } from '/src/lib/form-field-enhancements.js';
        ${extra}
        initFormFieldEnhancements();
        window.__ready = true;
      </script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => /** @type {any} */ (window).__ready && customElements.get('form-field'));
}

/** Chromium-computed accessible description via CDP. */
async function axDescription(page, selector) {
  const cdp = await page.context().newCDPSession(page);
  const { root } = await cdp.send('DOM.getDocument');
  const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector });
  const { nodes } = await cdp.send('Accessibility.getPartialAXTree', { nodeId, fetchRelatives: false });
  return nodes[0]?.description?.value ?? '';
}

test.describe('validation state', () => {
  test('setError sticks until the next edit, then native validation resumes', async ({ page }) => {
    await load(page, `<form-field id="ff"><label for="u">User</label>
      <input id="u" name="u" value="taken" required>
      <output class="error" for="u"></output></form-field>`);
    const ff = page.locator('#ff');
    const r1 = await page.evaluate(() => {
      const f = /** @type {any} */ (document.getElementById('ff'));
      f.setError('Username already taken');
      return { valid: f.validate(), msg: f.querySelector('output.error').textContent };
    });
    expect(r1).toEqual({ valid: false, msg: 'Username already taken' });
    await expect(ff).toHaveAttribute('data-invalid', '');

    await page.locator('#u').fill('fresh');
    await expect(ff).toHaveAttribute('data-valid', '');
    expect(await page.locator('#u').evaluate((i) => /** @type {HTMLInputElement} */ (i).validity.valid)).toBe(true);
    await expect(page.locator('#ff output.error')).toHaveText('');
  });

  test('a custom error set by someone else is not cleared by form-field', async ({ page }) => {
    await load(page, `<form-field id="ff"><label for="c">Confirm</label>
      <input id="c" value="x"><output class="error" for="c"></output></form-field>`);
    const r = await page.evaluate(() => {
      const input = /** @type {HTMLInputElement} */ (document.getElementById('c'));
      input.setCustomValidity('Values do not match');
      const f = /** @type {any} */ (document.getElementById('ff'));
      const valid = f.validate();
      input.dispatchEvent(new Event('input', { bubbles: true }));
      return { valid, msg: f.querySelector('output.error').textContent, still: input.validity.customError };
    });
    expect(r).toEqual({ valid: false, msg: 'Values do not match', still: true });
  });

  test('badInput uses data-message-badinput', async ({ page }) => {
    await load(page, `<form-field id="ff"><label for="n">Age</label>
      <input id="n" type="number" data-message-badinput="Numbers only">
      <output class="error" for="n"></output></form-field>`);
    await page.locator('#n').focus();
    await page.keyboard.type('1e');
    await page.locator('#n').blur();
    await expect(page.locator('#ff output.error')).toHaveText('Numbers only');
  });

  test('validate() on an untouched field shows the error immediately', async ({ page }) => {
    await load(page, `<form-field id="ff"><label for="e">Email</label>
      <input id="e" required data-message-valuemissing="Email is required">
      <output class="error" for="e"></output></form-field>`);
    const valid = await page.evaluate(() => /** @type {any} */ (document.getElementById('ff')).validate());
    expect(valid).toBe(false);
    await expect(page.locator('#ff output.error')).toHaveText('Email is required');
    await expect(page.locator('#ff output.error')).toBeVisible();
    await expect(page.locator('#e')).toHaveAttribute('aria-invalid', 'true');
    // silent check leaves the UI alone
    const silent = await page.evaluate(() => {
      const f = /** @type {any} */ (document.getElementById('ff'));
      f.clearError();
      return { valid: f.validate({ show: false }), invalid: f.hasAttribute('data-invalid') };
    });
    expect(silent).toEqual({ valid: false, invalid: false });
  });
});

test.describe('checkable controls', () => {
  test('unchecked required checkbox is invalid, checked is valid without an icon', async ({ page }) => {
    await load(page, `<form-field id="ff" data-type="checkbox">
      <label><input type="checkbox" id="t" required> I agree</label>
      <output class="error"></output></form-field>`);
    expect(await page.evaluate(() => /** @type {any} */ (document.getElementById('ff')).validate())).toBe(false);
    await page.locator('#t').check();
    await expect(page.locator('#ff')).toHaveAttribute('data-valid', '');
    const icon = await page.locator('#ff').evaluate((el) => getComputedStyle(el, '::after').content);
    expect(['none', 'normal']).toContain(icon);
  });

  test('radio group: every radio bound, checking any clears the error', async ({ page }) => {
    await load(page, `<form><fieldset><legend>Contact</legend>
      <form-field id="ff" data-type="radio">
        <label><input type="radio" name="c" value="e" required> Email</label>
        <output class="error"></output>
      </form-field>
      <form-field data-type="radio"><label><input type="radio" id="phone" name="c" value="p"> Phone</label></form-field>
      </fieldset></form>`);
    expect(await page.evaluate(() => /** @type {any} */ (document.getElementById('ff')).validate())).toBe(false);
    await expect(page.locator('#ff')).toHaveAttribute('data-invalid', '');
    await page.locator('#phone').check();
    await expect(page.locator('#ff')).not.toHaveAttribute('data-invalid', '');
    await expect(page.locator('#ff')).toHaveAttribute('data-valid', '');
  });

  test('required asterisk only on the legend, not on every radio label', async ({ page }) => {
    await load(page, `<form-field id="ff"><fieldset><legend>Size</legend>
      <label><input type="radio" name="s" value="s" required> S</label>
      <label><input type="radio" name="s" value="m"> M</label></fieldset></form-field>`);
    const r = await page.evaluate(() => ({
      legend: getComputedStyle(document.querySelector('#ff legend'), '::after').content,
      label: getComputedStyle(document.querySelector('#ff label'), '::after').content,
    }));
    expect(r.legend).toContain('*');
    expect(r.label).not.toContain('*');
  });
});

test('select keeps its chevron in the valid state', async ({ page }) => {
  await load(page, `<form-field id="ff"><label for="s">Pick</label>
    <select id="s" required><option value="">Choose</option><option value="a">A</option></select></form-field>
    <select id="ref"><option value="a">A</option></select>`);
  await page.locator('#s').selectOption('a');
  await page.evaluate(() => /** @type {any} */ (document.getElementById('ff')).validate());
  await expect(page.locator('#ff')).toHaveAttribute('data-valid', '');
  const r = await page.evaluate(() => {
    const s = document.getElementById('s');
    const ff = document.getElementById('ff');
    return {
      image: getComputedStyle(s).backgroundImage,
      ref: getComputedStyle(document.getElementById('ref')).backgroundImage,
      inset: parseFloat(getComputedStyle(ff, '::after').insetInlineEnd),
    };
  });
  // Same chevron as an unstyled select (gradient, or ::picker-icon → none)
  expect(r.image).toBe(r.ref);
  expect(r.inset).toBeGreaterThan(20);
});

test.describe('OTP', () => {
  const OTP = `<form id="f" novalidate><form-field id="ff" data-no-icon>
    <label for="code">Verification code</label>
    <input type="text" id="code" name="code" data-type="otp" data-length="4"
           inputmode="numeric" autocomplete="one-time-code" required>
    <output class="hint" for="code">Check your SMS.</output>
    <output class="error" for="code"></output></form-field></form>`;

  test('source stays validatable: empty and partial codes block submit', async ({ page }) => {
    await load(page, OTP);
    const r = await page.evaluate(() => {
      const input = /** @type {HTMLInputElement} */ (document.getElementById('code'));
      const form = /** @type {HTMLFormElement} */ (document.getElementById('f'));
      const empty = form.checkValidity();
      input.value = '12';
      const partial = form.checkValidity();
      input.value = '1234';
      return { type: input.type, empty, partial, full: form.checkValidity() };
    });
    expect(r).toEqual({ type: 'text', empty: false, partial: false, full: true });
  });

  test('labelled group, hint description, autocomplete on first digit', async ({ page }) => {
    await load(page, OTP);
    const group = page.getByRole('group', { name: 'Verification code' });
    await expect(group).toBeVisible();
    // Chromium's own computation (Playwright's matcher skips <output> text)
    expect(await axDescription(page, '#ff .otp-wrapper')).toBe('Check your SMS.');
    const digits = page.locator('#ff .otp-digit');
    await expect(digits).toHaveCount(4);
    await expect(digits.first()).toHaveAttribute('autocomplete', 'one-time-code');
    await expect(digits.first()).toHaveAccessibleName('Digit 1 of 4');
    await expect(page.locator('#code')).toHaveAttribute('aria-hidden', 'true');
  });

  test('typing digits fills the source; validate shows incomplete message', async ({ page }) => {
    await load(page, OTP);
    await page.locator('#ff .otp-digit').first().focus();
    await page.keyboard.type('12');
    expect(await page.locator('#code').inputValue()).toBe('12');
    await page.evaluate(() => /** @type {any} */ (document.getElementById('ff')).validate());
    await expect(page.locator('#ff output.error')).toHaveText('Enter all 4 digits');
    await expect(page.locator('#ff .otp-wrapper')).toHaveAttribute('aria-invalid', 'true');
  });

  test('digit labels are localizable', async ({ page }) => {
    await load(page, OTP.replace('data-no-icon', 'data-no-icon data-label-digit="Ziffer {n} von {total}"'));
    await expect(page.locator('#ff .otp-digit').nth(1)).toHaveAccessibleName('Ziffer 2 von 4');
  });
});

test('password toggle + strength meter: moving the field twice keeps one of each', async ({ page }) => {
  await load(page, `<section id="a"><form-field id="ff" data-label-show-password="Passwort zeigen">
    <label for="p">Password</label>
    <input type="password" id="p" data-strength data-rules="length:8,number"></form-field></section>
    <section id="b"></section>`);
  await page.waitForSelector('#ff .password-toggle');
  for (const target of ['#b', '#a']) {
    await page.evaluate((sel) => document.querySelector(sel).append(document.getElementById('ff')), target);
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r(null))));
  }
  const counts = await page.evaluate(() => ({
    toggles: document.querySelectorAll('#ff .password-toggle').length,
    wrappers: document.querySelectorAll('#ff .password-wrapper').length,
    meters: document.querySelectorAll('#ff .strength-meter').length,
    lists: document.querySelectorAll('#ff .strength-rules').length,
  }));
  expect(counts).toEqual({ toggles: 1, wrappers: 1, meters: 1, lists: 1 });
  await expect(page.locator('#ff .password-toggle')).toHaveAccessibleName('Passwort zeigen');
});

test.describe('aria wiring', () => {
  const FIELD = `<form-field id="ff"><label for="n">Name</label>
    <input id="n" required aria-describedby="extra">
    <output class="hint" id="n-hint" for="n">As on your ID.</output>
    <output class="error" for="n">Please enter your name.</output></form-field>
    <p id="extra">Extra</p>`;

  test('collapsed error is not in the accessibility tree', async ({ page }) => {
    await load(page, FIELD);
    const snap = await page.locator('#ff').ariaSnapshot();
    expect(snap).not.toContain('Please enter your name');
    await page.evaluate(() => /** @type {any} */ (document.getElementById('ff')).validate());
    await expect(page.locator('#ff output.error')).toBeVisible();
    await expect.poll(() => page.locator('#ff').ariaSnapshot()).toContain('Please enter your name');
  });

  test('describedby: author ids, hints, then the error only while invalid', async ({ page }) => {
    await load(page, FIELD);
    const input = page.locator('#n');
    await expect(input).toHaveAttribute('aria-describedby', 'extra n-hint');
    await page.evaluate(() => /** @type {any} */ (document.getElementById('ff')).validate());
    const errorId = await page.locator('#ff output.error').getAttribute('id');
    await expect(input).toHaveAttribute('aria-describedby', `extra n-hint ${errorId}`);
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    // authored text becomes the fallback message
    await expect(page.locator('#ff output.error')).toHaveText('Please enter your name.');
    await input.fill('Ada');
    await expect(input).toHaveAttribute('aria-describedby', 'extra n-hint');
    await expect(input).not.toHaveAttribute('aria-invalid', 'true');
  });

  test('textarea counter is described and never overwritten by the error', async ({ page }) => {
    await load(page, `<form-field id="ff"><label for="m">Message</label>
      <textarea id="m" required minlength="5" maxlength="20" data-count></textarea></form-field>`);
    await page.waitForSelector('#ff .textarea-counter');
    await page.evaluate(() => /** @type {any} */ (document.getElementById('ff')).validate());
    const counter = page.locator('#ff .textarea-counter');
    await expect(counter).toHaveText('0 / 20');
    const id = await counter.getAttribute('id');
    expect(await page.locator('#m').getAttribute('aria-describedby')).toContain(id);
    await expect(counter).toHaveAttribute('aria-live', 'off');
  });
});

test('floating label floats above a real placeholder; password input padded', async ({ page }) => {
  await load(page, `<form-field id="ff" data-floating-label><label for="e">Email</label>
    <input id="e" placeholder="you@example.com"></form-field>
    <form-field id="pw" data-floating-label><label for="p">Password</label><input id="p" type="password"></form-field>
    <form-field id="plain" data-floating-label><label for="x">Plain</label><input id="x"></form-field>`);
  await page.waitForSelector('#ff[data-floating-label-ready]');
  await page.waitForSelector('#pw .password-wrapper');
  const r = await page.evaluate(() => {
    const t = (sel) => getComputedStyle(document.querySelector(sel)).transform;
    return {
      withPlaceholder: t('#ff > label'),
      plain: t('#plain > label'),
      placeholder: document.getElementById('e').getAttribute('placeholder'),
      pwPad: getComputedStyle(document.getElementById('p')).paddingBlockStart,
      plainPad: getComputedStyle(document.getElementById('x')).paddingBlockStart,
    };
  });
  expect(r.placeholder).toBe('you@example.com');
  expect(r.withPlaceholder).not.toBe(r.plain);
  expect(r.pwPad).toBe(r.plainPad);
});

test.describe('form-associated custom elements', () => {
  test('required star-rating shows the form-field error', async ({ page }) => {
    await load(page, `<form-field id="ff"><star-rating name="r" label="Rating" required
      data-message-valuemissing="Please rate us"></star-rating>
      <output class="error"></output></form-field>`,
    { extra: "import '/src/web-components/star-rating/logic.js';" });
    await page.waitForSelector('star-rating fieldset');
    const r = await page.evaluate(() => {
      const f = /** @type {any} */ (document.getElementById('ff'));
      return { tag: f.input?.localName, valid: f.validate(), msg: f.querySelector('output.error').textContent };
    });
    expect(r).toEqual({ tag: 'star-rating', valid: false, msg: 'Please rate us' });
    await page.locator('star-rating label').nth(3).click();
    await expect(page.locator('#ff')).toHaveAttribute('data-valid', '');
  });

  test('required combo-box shows the form-field error', async ({ page }) => {
    await load(page, `<form-field id="ff"><label for="cb">Fruit</label>
      <combo-box required><input id="cb" name="fruit">
      <ul><li data-value="a">Apple</li><li data-value="b">Banana</li></ul></combo-box>
      <output class="error">Choose a fruit</output></form-field>`,
    { extra: "import '/src/web-components/combo-box/logic.js';" });
    await page.waitForSelector('combo-box[data-upgraded]');
    const r = await page.evaluate(() => {
      const f = /** @type {any} */ (document.getElementById('ff'));
      return { tag: f.input?.localName, valid: f.validate(), msg: f.querySelector('output.error').textContent };
    });
    // The component's own validationMessage (now public via VBElement) is
    // used, like a native control's; authored output text is the no-JS
    // fallback, and data-message-* still overrides.
    expect(r.tag).toBe('combo-box');
    expect(r.valid).toBe(false);
    expect(r.msg).toBe(await page.evaluate(() => /** @type {any} */ (document.querySelector('combo-box')).validationMessage));
    expect(r.msg.length).toBeGreaterThan(0);
  });

  test('data-message-valuemissing overrides a custom control message', async ({ page }) => {
    await load(page, `<form-field id="ff" data-message-valuemissing="Choose a fruit"><label for="cb">Fruit</label>
      <combo-box required><input id="cb" name="fruit">
      <ul><li data-value="a">Apple</li><li data-value="b">Banana</li></ul></combo-box>
      <output class="error"></output></form-field>`,
    { extra: "import '/src/web-components/combo-box/logic.js';" });
    await page.waitForSelector('combo-box[data-upgraded]');
    const msg = await page.evaluate(() => {
      const f = /** @type {any} */ (document.getElementById('ff'));
      f.validate();
      return f.querySelector('output.error').textContent;
    });
    expect(msg).toBe('Choose a fruit');
  });

  test('form-field defined before star-rating rebinds to it once it upgrades', async ({ page }) => {
    await load(page, `<form-field id="ff"><star-rating name="r" label="Rating" required></star-rating>
      <output class="error"></output></form-field>`);
    await page.evaluate(() => import('/src/web-components/star-rating/logic.js'));
    await expect.poll(() => page.evaluate(() => /** @type {any} */ (document.getElementById('ff')).input?.localName))
      .toBe('star-rating');
  });
});

test('reconnect keeps invalid state and eager re-validation consistent', async ({ page }) => {
  await load(page, `<section id="a"><form-field id="ff"><label for="n">Name</label>
    <input id="n" required><output class="error"></output></form-field></section><section id="b"></section>`);
  await page.evaluate(() => /** @type {any} */ (document.getElementById('ff')).validate());
  await page.evaluate(() => document.getElementById('b').append(document.getElementById('ff')));
  await expect(page.locator('#ff')).toHaveAttribute('data-invalid', '');
  await expect(page.locator('#n')).toHaveAttribute('aria-invalid', 'true');
  // still eager: typing clears the error without a blur
  await page.locator('#n').pressSequentially('A');
  await expect(page.locator('#ff')).toHaveAttribute('data-valid', '');
  await expect(page.locator('#n')).not.toHaveAttribute('aria-invalid', 'true');
});

test('forced colors: state icons use system colours', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await load(page, `<form-field id="ff"><label for="n">Name</label><input id="n" required>
    <output class="error"></output></form-field>`);
  await page.evaluate(() => /** @type {any} */ (document.getElementById('ff')).validate());
  const r = await page.locator('#ff').evaluate((el) => {
    const s = getComputedStyle(el, '::after');
    return { adjust: s.forcedColorAdjust, bg: s.backgroundColor, content: s.content };
  });
  expect(r.content).toBe('""');
  expect(r.adjust).toBe('none');
  expect(r.bg).not.toBe('rgba(0, 0, 0, 0)');
});
