/**
 * Native <button> styling (vanilla-breeze-si2n).
 *
 * The button review found: a.button ignored the --btn-color contract;
 * input[type=submit|button|reset] got no VB styling; primary/ghost had no
 * border (invisible in forced colors, and secondary was taller); disabled
 * buttons still reacted to hover; aria-disabled / aria-pressed / icon-only
 * were unstyled; print hid type-less submit buttons.
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
  const url = `/__button-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
}

/** Computed styles for every element matching each selector. */
function styles(page, selectors, props) {
  return page.evaluate(({ selectors, props }) => selectors.map((sel) => {
    const el = document.querySelector(sel);
    const cs = getComputedStyle(el);
    const out = { sel, height: el.getBoundingClientRect().height };
    for (const p of props) out[p] = cs.getPropertyValue(p);
    return out;
  }), { selectors, props });
}

const VARIANTS = ['', 'secondary', 'ghost'];

test.describe('a.button matches <button>', () => {
  for (const custom of [false, true]) {
    test(`colour parity${custom ? ' with a custom --btn-color' : ''}`, async ({ page }) => {
      const style = custom ? ' style="--btn-color: gold"' : '';
      const body = VARIANTS.map((v) => `
        <p><button type="button" class="${v}" id="b-${v || 'primary'}"${style}>Go</button>
        <a href="#x" class="button ${v}" id="a-${v || 'primary'}"${style}>Go</a></p>`).join('');
      await load(page, body);
      for (const v of VARIANTS) {
        const id = v || 'primary';
        const [b, a] = await styles(page, [`#b-${id}`, `#a-${id}`],
          ['color', 'background-color', 'border-top-color']);
        expect.soft({ color: a.color, bg: a['background-color'], border: a['border-top-color'] }, id)
          .toEqual({ color: b.color, bg: b['background-color'], border: b['border-top-color'] });
      }
    });
  }

  test('gold primary uses dark text (contrast contract)', async ({ page }) => {
    await load(page, '<a href="#x" class="button" style="--btn-color: gold">Go</a>');
    const color = await page.locator('a').evaluate((el) => getComputedStyle(el).color);
    expect(color).not.toBe('rgb(255, 255, 255)');
  });
});

test('input[type=submit|button|reset] match <button>', async ({ page }) => {
  await load(page, `<form>
    <button type="submit" id="b">Send</button>
    <input type="submit" value="Send" id="s">
    <input type="button" value="Send" id="i">
    <input type="reset" value="Send" id="r">
    <input type="submit" value="Send" class="secondary" id="s2">
    <button type="submit" class="secondary" id="b2">Send</button>
  </form>`);
  const props = ['background-color', 'color', 'border-top-width', 'border-radius', 'padding-left', 'display'];
  const [b, s, i, r] = await styles(page, ['#b', '#s', '#i', '#r'], props);
  for (const input of [s, i, r]) {
    expect.soft({ ...input, sel: '' }, input.sel).toEqual({ ...b, sel: '' });
  }
  const [s2, b2] = await styles(page, ['#s2', '#b2'], ['background-color', 'color', 'border-top-color']);
  expect.soft({ ...s2, sel: '' }).toEqual({ ...b2, sel: '' });
});

test('input[type=image] does not get text-input chrome', async ({ page }) => {
  await load(page, '<form><input type="image" alt="Go" src="data:image/gif;base64,R0lGODlhAQABAAAAACw="></form>');
  const display = await page.locator('input').evaluate((el) => getComputedStyle(el).display);
  expect(display).not.toBe('block');
});

test('primary, secondary and ghost are the same height', async ({ page }) => {
  // A large font pushes the content above --size-touch-min, so a border
  // difference would show.
  await load(page, `<p style="font-size: 2rem">
    <button type="button" id="p">Go</button>
    <button type="button" class="secondary" id="s">Go</button>
    <button type="button" class="ghost" id="g">Go</button></p>`);
  const [p, s, g] = await styles(page, ['#p', '#s', '#g'], []);
  expect(s.height).toBe(p.height);
  expect(g.height).toBe(p.height);
});

test.describe('states', () => {
  test('disabled and aria-disabled buttons do not change on hover', async ({ page }) => {
    await load(page, `<p>
      <button type="button" id="d" disabled>Off</button>
      <button type="button" id="a" aria-disabled="true">Off</button>
      <button type="button" id="n">On</button></p>`);
    for (const id of ['d', 'a']) {
      const before = await page.locator(`#${id}`).evaluate((el) => getComputedStyle(el).backgroundColor);
      await page.locator(`#${id}`).hover({ force: true });
      await page.waitForTimeout(300);
      const after = await page.locator(`#${id}`).evaluate((el) => getComputedStyle(el).backgroundColor);
      expect.soft(after, id).toBe(before);
    }
    // Sanity: an enabled button does change.
    const before = await page.locator('#n').evaluate((el) => getComputedStyle(el).backgroundColor);
    await page.locator('#n').hover();
    await page.waitForTimeout(300);
    const after = await page.locator('#n').evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(after).not.toBe(before);
  });

  test('aria-disabled looks like disabled', async ({ page }) => {
    await load(page, `<p><button type="button" id="d" disabled>Off</button>
      <button type="button" id="a" aria-disabled="true">Off</button></p>`);
    const [d, a] = await styles(page, ['#d', '#a'], ['opacity', 'cursor']);
    expect(a.opacity).toBe(d.opacity);
    expect(a.cursor).toBe('not-allowed');
  });

  test('aria-pressed="true" differs from the resting state', async ({ page }) => {
    await load(page, VARIANTS.map((v) => `<p>
      <button type="button" class="${v}" aria-pressed="false" id="off-${v || 'primary'}">B</button>
      <button type="button" class="${v}" aria-pressed="true" id="on-${v || 'primary'}">B</button></p>`).join(''));
    for (const v of VARIANTS) {
      const id = v || 'primary';
      const [off, on] = await styles(page, [`#off-${id}`, `#on-${id}`], ['background-color', 'box-shadow']);
      expect.soft(`${on['background-color']} ${on['box-shadow']}`, id)
        .not.toBe(`${off['background-color']} ${off['box-shadow']}`);
    }
  });

  test('icon-only buttons get square padding', async ({ page }) => {
    await load(page, `<p>
      <button type="button" aria-label="Close" id="icon"><icon-wc name="x"></icon-wc></button>
      <button type="button" id="text"><icon-wc name="x"></icon-wc> Close</button></p>`);
    const [icon, text] = await styles(page, ['#icon', '#text'], ['padding-top', 'padding-left']);
    expect(icon['padding-left']).toBe(icon['padding-top']);
    expect(text['padding-left']).not.toBe(text['padding-top']);
  });
});

test.describe('forced colors', () => {
  // test.use({ forcedColors }) does not reach the media query here;
  // emulateMedia before navigation does.
  test('every variant keeps a visible border; disabled uses GrayText', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await load(page, `<p>
      <button type="button" id="p">P</button>
      <button type="button" class="ghost" id="g">G</button>
      <button type="button" disabled id="d">D</button>
      <span id="gray" style="color: GrayText; forced-color-adjust: none">x</span></p>`);
    const [p, g, d, gray] = await styles(page, ['#p', '#g', '#d', '#gray'],
      ['border-top-width', 'border-top-style', 'border-top-color', 'color']);
    for (const b of [p, g]) {
      expect.soft(b['border-top-style'], b.sel).toBe('solid');
      expect.soft(parseFloat(b['border-top-width']), b.sel).toBeGreaterThan(0);
      expect.soft(b['border-top-color'], b.sel).not.toBe('rgba(0, 0, 0, 0)');
    }
    expect(d.color).toBe(gray.color);
  });
});

test('print keeps submit buttons (explicit or type-less in a form), hides the rest', async ({ page }) => {
  await load(page, `<form>
      <button id="implicit">Send</button>
      <button type="submit" id="explicit">Send</button>
      <button type="button" id="plain">Menu</button>
      <button type="reset" id="reset">Reset</button>
    </form>
    <button id="outside">Toggle</button>`);
  await page.emulateMedia({ media: 'print' });
  const shown = await page.evaluate(() => Object.fromEntries(
    [...document.querySelectorAll('button')].map((b) => [b.id, getComputedStyle(b).display !== 'none']),
  ));
  expect(shown).toEqual({ implicit: true, explicit: true, plain: false, reset: false, outside: false });
});
