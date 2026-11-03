/**
 * details / dialog — review fixes (vanilla-breeze-c4mc, -8kf7, -8s1z, -rb3n).
 *
 * details: closed panels print; the chevron points the right way in RTL;
 * adjacent details only join in normal flow, not inside gap layouts.
 * dialog: long content scrolls in the body with header/footer pinned (also
 * for <form method="dialog"> wrapping the whole dialog); the edge survives
 * forced colors; drawers follow the writing direction; modal scroll lock;
 * close animates (exit transition).
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

/**
 * @param {import('playwright/test').Page} page
 * @param {string} body
 * @param {{ dir?: string, head?: string }} [opts]
 */
async function load(page, body, { dir = 'ltr', head = '' } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__d-details-dialog-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en" dir="${dir}"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">${head}
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
}

const NO_TRANSITIONS = '<style>*, *::before, *::after { transition: none !important; }</style>';

/* ------------------------------------------------------------------ details */

test.describe('details', () => {
  test('closed details content is hidden on screen and printed in print media', async ({ page }) => {
    await load(page, `
      <details id="d"><summary>More</summary><p id="c">Hidden panel text.</p></details>`);
    const visible = () => page.evaluate(() => document.getElementById('c').checkVisibility());
    expect(await visible()).toBe(false);
    await page.emulateMedia({ media: 'print' });
    expect(await visible()).toBe(true);
    const h = await page.evaluate(() => document.getElementById('c').getBoundingClientRect().height);
    expect(h).toBeGreaterThan(0);
    expect(await page.evaluate(() => getComputedStyle(document.querySelector('summary'), '::after').display)).toBe('none');
  });

  /** Direction the chevron's vertex points, from the ::after matrix. */
  async function chevron(page) {
    return page.evaluate(() => {
      const cs = getComputedStyle(document.querySelector('summary'), '::after');
      const m = new DOMMatrix(cs.transform);
      // Physical right+bottom corner: the vertex points along (1, 1).
      const x = m.a + m.c;
      const y = m.b + m.d;
      const dir = Math.abs(x) > Math.abs(y) ? (x > 0 ? 'right' : 'left') : (y > 0 ? 'down' : 'up');
      return {
        dir,
        borders: [cs.borderTopWidth, cs.borderRightWidth, cs.borderBottomWidth, cs.borderLeftWidth]
          .map((w) => parseFloat(w) > 0),
      };
    });
  }

  for (const [dir, closed] of [['ltr', 'right'], ['rtl', 'left']]) {
    test(`chevron points ${closed} when closed and down when open (${dir})`, async ({ page }) => {
      await load(page, '<details id="d"><summary>Toggle</summary><p>Body</p></details>', { dir, head: NO_TRANSITIONS });
      const c = await chevron(page);
      expect(c.borders).toEqual([false, true, true, false]);
      expect(c.dir).toBe(closed);
      await page.evaluate(() => { /** @type {HTMLDetailsElement} */ (document.getElementById('d')).open = true; });
      expect((await chevron(page)).dir).toBe('down');
    });
  }

  test('adjacent details join in flow but not inside gap layouts', async ({ page }) => {
    await load(page, `
      <section id="flow"><details><summary>A</summary><p>a</p></details><details><summary>B</summary><p>b</p></details></section>
      <layout-stack id="stack" data-layout-gap="l"><details><summary>A</summary><p>a</p></details><details><summary>B</summary><p>b</p></details></layout-stack>
      <section id="attr" data-layout="stack" data-layout-gap="m"><details><summary>A</summary><p>a</p></details><details><summary>B</summary><p>b</p></details></section>
      <layout-stack id="none" data-layout-gap="none"><details><summary>A</summary><p>a</p></details><details><summary>B</summary><p>b</p></details></layout-stack>`);
    const joined = (id) => page.evaluate((id) => {
      const [first, second] = document.querySelectorAll(`#${id} > details`);
      const a = getComputedStyle(first);
      const b = getComputedStyle(second);
      return {
        overlap: parseFloat(b.marginTop) < 0,
        firstBottomSquare: parseFloat(a.borderBottomLeftRadius) === 0,
        secondTopSquare: parseFloat(b.borderTopLeftRadius) === 0,
      };
    }, id);
    const yes = { overlap: true, firstBottomSquare: true, secondTopSquare: true };
    const no = { overlap: false, firstBottomSquare: false, secondTopSquare: false };
    expect(await joined('flow')).toEqual(yes);
    expect(await joined('stack')).toEqual(no);
    expect(await joined('attr')).toEqual(no);
    expect(await joined('none')).toEqual(yes);
  });
});

/* ------------------------------------------------------------------- dialog */

const LONG = Array.from({ length: 40 }, (_, i) => `<p>Paragraph ${i + 1} of a long terms text.</p>`).join('');

test.describe('dialog', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1000, height: 700 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test('long content scrolls in the body; header, footer and top stay reachable with an autofocused footer button', async ({ page }) => {
    await load(page, `
      <dialog id="dlg" aria-labelledby="t">
        <header><h2 id="t">Terms</h2></header>
        <section id="body"><p id="first">First paragraph.</p>${LONG}</section>
        <footer><button type="button" id="ok" autofocus>Accept</button></footer>
      </dialog>`);
    await page.evaluate(() => /** @type {HTMLDialogElement} */ (document.getElementById('dlg')).showModal());
    const r = await page.evaluate(() => {
      const dlg = document.getElementById('dlg').getBoundingClientRect();
      const body = document.getElementById('body');
      const header = document.querySelector('#dlg > header').getBoundingClientRect();
      const footer = document.querySelector('#dlg > footer').getBoundingClientRect();
      const first = document.getElementById('first').getBoundingClientRect();
      return {
        dlgHeight: dlg.height,
        vh: innerHeight,
        headerInDialog: header.top >= dlg.top - 1 && header.bottom <= dlg.bottom + 1,
        footerInDialog: footer.top >= dlg.top - 1 && footer.bottom <= dlg.bottom + 1,
        bodyScrolls: body.scrollHeight > body.clientHeight + 10,
        bodyOverflow: getComputedStyle(body).overflowY,
        scrollTop: body.scrollTop,
        firstVisible: first.top >= body.getBoundingClientRect().top - 1 && first.bottom <= footer.top,
        focused: document.activeElement?.id,
      };
    });
    expect(r.dlgHeight).toBeLessThanOrEqual(r.vh * 0.85 + 1);
    expect(r.headerInDialog).toBe(true);
    expect(r.footerInDialog).toBe(true);
    expect(r.bodyScrolls).toBe(true);
    expect(r.bodyOverflow).toBe('auto');
    expect(r.focused).toBe('ok');
    expect(r.scrollTop).toBe(0);
    expect(r.firstVisible).toBe(true);
    // The end of the content is reachable by scrolling the body.
    const end = await page.evaluate(() => {
      const body = document.getElementById('body');
      body.scrollTop = body.scrollHeight;
      return body.scrollTop > 0;
    });
    expect(end).toBe(true);
  });

  test('<form method="dialog"> wrapping header/body/footer: full-width footer, styled header, scrolling body', async ({ page }) => {
    await load(page, `
      <dialog id="dlg" aria-labelledby="t">
        <form method="dialog">
          <header><h2 id="t">Choose</h2></header>
          <section id="body">${LONG}</section>
          <footer><button value="ok">OK</button></footer>
        </form>
      </dialog>`);
    await page.evaluate(() => /** @type {HTMLDialogElement} */ (document.getElementById('dlg')).showModal());
    const r = await page.evaluate(() => {
      const dlg = document.getElementById('dlg');
      const form = dlg.querySelector('form');
      const header = form.querySelector('header');
      const footer = form.querySelector('footer');
      const body = document.getElementById('body');
      const d = dlg.getBoundingClientRect();
      return {
        formPadding: getComputedStyle(form).paddingTop,
        footerWidth: footer.getBoundingClientRect().width,
        dialogInner: dlg.clientWidth,
        headerBorder: getComputedStyle(header).borderBottomStyle,
        headerPadding: parseFloat(getComputedStyle(header).paddingLeft),
        footerBorder: getComputedStyle(footer).borderTopStyle,
        footerInDialog: footer.getBoundingClientRect().bottom <= d.bottom + 1,
        bodyScrolls: body.scrollHeight > body.clientHeight + 10,
      };
    });
    expect(r.formPadding).toBe('0px');
    expect(Math.abs(r.footerWidth - r.dialogInner)).toBeLessThanOrEqual(1);
    expect(r.headerBorder).toBe('solid');
    expect(r.headerPadding).toBeGreaterThan(0);
    expect(r.footerBorder).toBe('solid');
    expect(r.footerInDialog).toBe(true);
    expect(r.bodyScrolls).toBe(true);
  });

  test('a fields-only form stays a padded body', async ({ page }) => {
    await load(page, `
      <dialog id="dlg"><header><h2>Sub</h2></header>
        <form id="f" method="dialog"><label>Email <input type="email"></label></form>
        <footer><button form="f">Go</button></footer></dialog>`);
    await page.evaluate(() => /** @type {HTMLDialogElement} */ (document.getElementById('dlg')).showModal());
    const pad = await page.evaluate(() => parseFloat(getComputedStyle(document.getElementById('f')).paddingTop));
    expect(pad).toBeGreaterThan(0);
  });

  test('forced colors: the dialog keeps a visible border', async ({ page }) => {
    await load(page, '<dialog id="dlg"><p>Hi</p></dialog>');
    await page.evaluate(() => /** @type {HTMLDialogElement} */ (document.getElementById('dlg')).showModal());
    const normal = await page.evaluate(() => getComputedStyle(document.getElementById('dlg')).borderTopColor);
    expect(normal).toBe('rgba(0, 0, 0, 0)');
    await page.emulateMedia({ forcedColors: 'active' });
    const r = await page.evaluate(() => {
      const cs = getComputedStyle(document.getElementById('dlg'));
      return { width: parseFloat(cs.borderTopWidth), style: cs.borderTopStyle, color: cs.borderTopColor };
    });
    expect(r.width).toBeGreaterThan(0);
    expect(r.style).toBe('solid');
    expect(r.color).not.toBe('rgba(0, 0, 0, 0)');
  });

  for (const dir of ['ltr', 'rtl']) {
    test(`drawers attach to the inline edge with logical radii (${dir})`, async ({ page }) => {
      await load(page, `
        <dialog id="end" data-position="end"><header><h2>End</h2></header><section>x</section></dialog>
        <dialog id="start" data-position="start"><header><h2>Start</h2></header><section>x</section></dialog>`, { dir });
      const probe = (id) => page.evaluate((id) => {
        const d = /** @type {HTMLDialogElement} */ (document.getElementById(id));
        d.showModal();
        const r = d.getBoundingClientRect();
        const cs = getComputedStyle(d);
        const out = {
          left: Math.round(r.left),
          rightGap: Math.round(innerWidth - r.right),
          topLeftRadius: parseFloat(cs.borderTopLeftRadius) > 0,
          topRightRadius: parseFloat(cs.borderTopRightRadius) > 0,
        };
        d.close();
        return out;
      }, id);
      const end = await probe('end');
      const start = await probe('start');
      if (dir === 'ltr') {
        expect(end.rightGap).toBe(0);
        expect([end.topLeftRadius, end.topRightRadius]).toEqual([true, false]);
        expect(start.left).toBe(0);
        expect([start.topLeftRadius, start.topRightRadius]).toEqual([false, true]);
      } else {
        expect(end.left).toBe(0);
        expect([end.topLeftRadius, end.topRightRadius]).toEqual([false, true]);
        expect(start.rightGap).toBe(0);
        expect([start.topLeftRadius, start.topRightRadius]).toEqual([true, false]);
      }
    });
  }

  test('drawer slide direction follows the writing direction', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await load(page, `
      <dialog id="end" data-position="end"><p>x</p></dialog>
      <section dir="rtl"><dialog id="end-rtl" data-position="end"><p>x</p></dialog></section>`);
    // The closed dialog has no box, so read the hidden transform it slides
    // from/to rather than the resolved matrix.
    const hidden = await page.evaluate(() => ['end', 'end-rtl'].map((id) =>
      getComputedStyle(document.getElementById(id)).getPropertyValue('--_dialog-hidden').trim()));
    expect(hidden).toEqual(['translateX(100%)', 'translateX(-100%)']);
  });

  test('modal dialogs lock background scroll; non-modal ones do not', async ({ page }) => {
    await load(page, `<p style="block-size: 3000px">Tall page</p>
      <dialog id="dlg"><p>Hi</p></dialog>`);
    const overflow = () => page.evaluate(() => getComputedStyle(document.documentElement).overflowY);
    expect(await overflow()).not.toBe('hidden');
    await page.evaluate(() => /** @type {HTMLDialogElement} */ (document.getElementById('dlg')).showModal());
    expect(await overflow()).toBe('hidden');
    await page.evaluate(() => /** @type {HTMLDialogElement} */ (document.getElementById('dlg')).close());
    expect(await overflow()).not.toBe('hidden');
    await page.evaluate(() => /** @type {HTMLDialogElement} */ (document.getElementById('dlg')).show());
    expect(await overflow()).not.toBe('hidden');
  });

  test('closing animates out (display held during the exit transition)', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await load(page, '<dialog id="dlg"><p>Hi</p></dialog>');
    await page.evaluate(() => /** @type {HTMLDialogElement} */ (document.getElementById('dlg')).showModal());
    await page.waitForTimeout(500);
    const r = await page.evaluate(() => {
      const d = /** @type {HTMLDialogElement} */ (document.getElementById('dlg'));
      d.close();
      return {
        display: getComputedStyle(d).display,
        running: d.getAnimations().length,
      };
    });
    expect(r.display).not.toBe('none');
    expect(r.running).toBeGreaterThan(0);
    await expect.poll(() => page.evaluate(() => getComputedStyle(document.getElementById('dlg')).display)).toBe('none');
  });
});
