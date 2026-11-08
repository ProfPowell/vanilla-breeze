/**
 * Form attribute fixes (G4): data-autosave privacy filter, pending-save
 * cancellation, checkbox groups, restore event/announcement, expiry cleanup
 * and clone-safe wiring; data-count / data-grow clone-safe wiring and reset.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');
const AUTOSAVE = '/src/utils/autosave-init.js';
const COUNT = '/src/utils/textarea-count-init.js';
const GROW = '/src/utils/textarea-grow-init.js';

async function load(page, body, { modules = [], init = '' } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__g4-${Math.random().toString(36).slice(2)}.html`;
  const imports = modules.map((m) => `import '${m}';`).join('\n');
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      ${init ? `<script>${init}</script>` : ''}
      <script type="module">${imports}</script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
}

/** @param {import('playwright/test').Page} page @param {string} key */
const stored = (page, key) => page.evaluate((k) => {
  const raw = localStorage.getItem(`vb:autosave:${k}`);
  return raw ? JSON.parse(raw) : null;
}, key);

/**
 * Init script that writes a VBStore envelope before the page's modules run.
 * @param {string} key @param {Record<string, unknown>} data @param {number} [age] ms
 */
const seed = (key, data, age = 0) =>
  `localStorage.setItem('vb:autosave:${key}', JSON.stringify({ data: ${JSON.stringify(data)}, timestamp: Date.now() - ${age} }));`;

const PRIVACY = `
  <form id="f" data-autosave="g4-privacy" method="dialog">
    <input type="hidden" name="csrf" value="fresh-token">
    <label for="n">Name</label><input id="n" name="name">
    <label for="c">Card</label><input id="c" name="card" autocomplete="billing cc-number">
    <label for="o">Code</label><input id="o" name="otp" autocomplete="one-time-code">
    <label for="p">Password</label><input id="p" type="password" name="pw">
    <label for="x">Off</label><input id="x" name="off" autocomplete="off">
    <label for="i">Note</label><textarea id="i" name="note" data-autosave-ignore></textarea>
    <fieldset data-autosave-ignore><legend>Private</legend>
      <label for="s">SSN</label><input id="s" name="ssn"></fieldset>
    <label for="ro">Read only</label><input id="ro" name="ro" value="server" readonly>
    <label for="dis">Disabled</label><input id="dis" name="dis" value="server" disabled>
    <output name="total">0</output>
    <button name="action" value="publish">Publish</button>
    <button name="action" value="draft">Draft</button>
  </form>`;

test.describe('data-autosave', () => {
  test('saves only persistable fields', async ({ page }) => {
    await load(page, PRIVACY, { modules: [AUTOSAVE] });
    await page.waitForSelector('form[data-autosave-init]');
    for (const id of ['n', 'c', 'o', 'p', 'x', 'i', 's']) await page.fill(`#${id}`, `typed-${id}`);
    await page.waitForTimeout(700);
    const env = await stored(page, 'g4-privacy');
    expect(typeof env.timestamp).toBe('number');
    expect(env.data).toEqual({ name: 'typed-n', ro: 'server' });
  });

  test('restore never touches hidden, buttons, secrets, ignored, readonly or disabled controls', async ({ page }) => {
    await load(page, PRIVACY, {
      modules: [AUTOSAVE],
      init: seed('g4-privacy', {
        csrf: 'stale-token', action: 'draft', name: 'Ada', card: '4111', otp: '123456',
        pw: 'hunter2', off: 'x', note: 'secret', ssn: '000', ro: 'stale', dis: 'stale', total: '99',
      }),
    });
    await expect(page.locator('#n')).toHaveValue('Ada');
    const r = await page.evaluate(() => {
      const f = /** @type {HTMLFormElement} */ (document.getElementById('f'));
      const v = (n) => /** @type {any} */ (f.elements.namedItem(n))?.value;
      return {
        csrf: v('csrf'), card: v('card'), otp: v('otp'), pw: v('pw'), off: v('off'),
        note: v('note'), ssn: v('ssn'), ro: v('ro'), dis: v('dis'), total: v('total'),
        buttons: [...f.querySelectorAll('button')].map((b) => b.value),
      };
    });
    expect(r).toEqual({
      csrf: 'fresh-token', card: '', otp: '', pw: '', off: '', note: '', ssn: '',
      ro: 'server', dis: 'server', total: '0', buttons: ['publish', 'draft'],
    });
  });

  test('submit cancels the pending debounced save', async ({ page }) => {
    await load(page, `<form id="f" data-autosave="g4-submit">
        <label for="m">Message</label><textarea id="m" name="m"></textarea>
        <button id="send">Send</button></form>
      <script>document.getElementById('f').addEventListener('submit', (e) => e.preventDefault());</script>`,
    { modules: [AUTOSAVE] });
    await page.waitForSelector('form[data-autosave-init]');
    await page.fill('#m', 'first');
    await page.waitForTimeout(700);
    expect((await stored(page, 'g4-submit')).data).toEqual({ m: 'first' });
    await page.fill('#m', 'sent message');
    await page.click('#send'); // within the 500ms debounce
    await page.waitForTimeout(900);
    expect(await stored(page, 'g4-submit')).toBeNull();
  });

  test('reset cancels the pending save; a cancelled reset keeps the draft', async ({ page }) => {
    await load(page, `<form id="f" data-autosave="g4-reset">
        <label for="m">Message</label><textarea id="m" name="m"></textarea>
        <button type="reset" id="r">Reset</button></form>`,
    { modules: [AUTOSAVE] });
    await page.waitForSelector('form[data-autosave-init]');
    await page.fill('#m', 'typed');
    await page.click('#r');
    await page.waitForTimeout(900);
    expect(await stored(page, 'g4-reset')).toBeNull();
    await expect(page.locator('#m')).toHaveValue('');

    await page.fill('#m', 'keep me');
    await page.waitForTimeout(700);
    await page.evaluate(() => {
      const f = document.getElementById('f');
      f.addEventListener('reset', (e) => e.preventDefault(), { once: true });
      /** @type {HTMLFormElement} */ (f).reset();
    });
    await page.waitForTimeout(100);
    expect((await stored(page, 'g4-reset')).data).toEqual({ m: 'keep me' });
  });

  test('checkbox groups sharing a name round-trip by value', async ({ page }) => {
    const body = `<form data-autosave="g4-group"><fieldset><legend>Notify</legend>
        <label><input type="checkbox" name="notify" value="email"> Email</label>
        <label><input type="checkbox" name="notify" value="sms"> SMS</label>
        <label><input type="checkbox" name="notify" value="push"> Push</label></fieldset>
        <label><input type="checkbox" name="terms"> Terms</label>
        <label><input type="radio" name="theme" value="light"> Light</label>
        <label><input type="radio" name="theme" value="dark"> Dark</label></form>`;
    await load(page, body, { modules: [AUTOSAVE] });
    await page.waitForSelector('form[data-autosave-init]');
    await page.check('input[value="email"]');
    await page.check('input[value="push"]');
    await page.check('input[value="dark"]');
    await page.waitForTimeout(700);
    expect((await stored(page, 'g4-group')).data).toEqual({ notify: ['email', 'push'], terms: [], theme: 'dark' });

    await page.reload({ waitUntil: 'load' });
    await expect(page.locator('input[value="push"]')).toBeChecked();
    const r = await page.evaluate(() => [...document.querySelectorAll('input')].map((i) => i.checked));
    expect(r).toEqual([true, false, true, false, false, true]);
  });

  test('restore fires autosave:restore and announces through a status region without toast-msg', async ({ page }) => {
    await load(page, `<form id="f" data-autosave="g4-event" data-label-restored="Brouillon restauré">
        <label for="n">Name</label><input id="n" name="name">
        <label for="t">Note</label><textarea id="t" name="note" data-count maxlength="10"></textarea></form>
      <script>
        window.__restore = null;
        document.addEventListener('autosave:restore', (e) => { window.__restore = e.detail; });
      </script>`,
    { modules: [COUNT, AUTOSAVE], init: seed('g4-event', { name: 'Ada', note: 'hello' }) });
    await expect.poll(() => page.evaluate(() => /** @type {any} */ (window).__restore)).toEqual({ key: 'g4-event', fields: ['name', 'note'] });
    await expect(page.locator('#f [data-autosave-status][role="status"]')).toHaveText('Brouillon restauré');
    await expect(page.locator('.textarea-counter')).toHaveText('5 of 10 characters');
  });

  test('an expired draft is deleted, not restored', async ({ page }) => {
    await load(page, `<form data-autosave="g4-old"><label for="n">Name</label><input id="n" name="name"></form>`,
      { modules: [AUTOSAVE], init: seed('g4-old', { name: 'Old' }, 25 * 3600 * 1000) });
    await page.waitForSelector('form[data-autosave-init]');
    await expect.poll(() => stored(page, 'g4-old')).toBeNull();
    await expect(page.locator('#n')).toHaveValue('');
  });

  test('a cloned form (copied init flag) is wired', async ({ page }) => {
    await load(page, `<form id="f" data-autosave="g4-orig"><label for="n">Name</label><input id="n" name="name"></form>`,
      { modules: [AUTOSAVE] });
    await page.waitForSelector('form[data-autosave-init]');
    await page.evaluate(() => {
      const clone = /** @type {HTMLFormElement} */ (document.getElementById('f').cloneNode(true));
      clone.id = 'g';
      clone.dataset.autosave = 'g4-clone';
      clone.querySelector('input').id = 'n2';
      document.querySelector('main').append(clone);
    });
    await page.fill('#n2', 'cloned');
    await page.waitForTimeout(700);
    expect((await stored(page, 'g4-clone'))?.data).toEqual({ name: 'cloned' });
  });
});

test.describe('data-count', () => {
  test('a cloned field adopts its copied counter and counts on its own', async ({ page }) => {
    await load(page, `<form id="f"><form-field id="ff"><label for="t">Bio</label>
        <textarea id="t" maxlength="20" data-count>abc</textarea></form-field>
        <button type="reset" id="r">Reset</button></form>`,
    { modules: [COUNT] });
    await expect(page.locator('#ff .textarea-counter')).toHaveText('3 of 20 characters');
    await page.evaluate(() => {
      const clone = /** @type {HTMLElement} */ (document.getElementById('ff').cloneNode(true));
      clone.id = 'ff2';
      clone.querySelector('textarea').id = 't2';
      document.getElementById('f').append(clone);
    });
    await page.fill('#t2', 'abcdef');
    await expect(page.locator('#ff2 .textarea-counter')).toHaveCount(1);
    await expect(page.locator('#ff2 .textarea-counter')).toHaveText('6 of 20 characters');
    await expect(page.locator('#ff .textarea-counter')).toHaveText('3 of 20 characters');
    const ids = await page.evaluate(() => ({
      describedby: document.getElementById('t2').getAttribute('aria-describedby'),
      counter: document.querySelector('#ff2 .textarea-counter').id,
      original: document.querySelector('#ff .textarea-counter').id,
    }));
    expect(ids.describedby).toBe(ids.counter);
    expect(ids.counter).not.toBe(ids.original);

    await page.click('#r');
    await expect(page.locator('#ff2 .textarea-counter')).toHaveText('3 of 20 characters');
  });
});

test.describe('data-grow', () => {
  test('a cloned fallback-path textarea gets its own resize listener', async ({ page }) => {
    await load(page, `<form id="f"><label for="g">Grow</label>
        <textarea id="g" data-grow rows="2"></textarea><button type="reset" id="r">Reset</button></form>`, {
      modules: [GROW],
      init: `const s = CSS.supports.bind(CSS); CSS.supports = (p, v) => (String(p).includes('field-sizing') ? false : s(p, v));`,
    });
    await expect(page.locator('#g')).toHaveAttribute('data-grow-init', 'fallback');
    await page.evaluate(() => {
      const clone = /** @type {HTMLTextAreaElement} */ (document.getElementById('g').cloneNode(true));
      clone.id = 'g2';
      document.getElementById('f').append(clone);
    });
    const before = await page.locator('#g2').evaluate((el) => el.getBoundingClientRect().height);
    await page.fill('#g2', 'one\ntwo\nthree\nfour\nfive\nsix\nseven');
    const after = await page.locator('#g2').evaluate((el) => el.getBoundingClientRect().height);
    expect(after).toBeGreaterThan(before + 20);

    await page.click('#r');
    await expect.poll(() => page.locator('#g2').evaluate((el) => el.getBoundingClientRect().height)).toBeLessThan(after - 20);
  });
});
