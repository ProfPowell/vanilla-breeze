/**
 * S-review fixes: slide-accept, stepper-wc, split-surface.
 *
 * slide-accept: single-pointer alternative (tap), Enter/Space, RTL drag +
 * arrows + mirrored icon, focus kept + valuetext after activation, authored
 * label, observed labels, form association, forced colors, reconnect.
 * stepper-wc: spinbutton named from <label for> / aria-label /
 * aria-labelledby, authored reset target, hold timers cleared on removal,
 * translated button names, readonly + fieldset disabled, RTL arrows, forced
 * colors focus.
 * split-surface: Enter collapse, inert collapsed panel, no keyboard trap,
 * valuemin/valuetext, JS API before init, persisted layout wins, resize
 * source, NaN guard, observed attributes, RTL grip, forced colors.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

async function load(page, body, { dir = 'ltr', lang = 'en' } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__s6-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="${lang}" dir="${dir}"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <script type="module">
        import '/src/web-components/slide-accept/logic.js';
        import '/src/web-components/stepper-wc/logic.js';
        import '/src/web-components/split-surface/logic.js';
      </script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => customElements.get('slide-accept')
    && customElements.get('stepper-wc') && customElements.get('split-surface'));
}

/* ------------------------------------------------------------------ */
/* slide-accept                                                        */
/* ------------------------------------------------------------------ */

test.describe('slide-accept', () => {
  test('a tap on the handle confirms; focus stays, value text + live region', async ({ page }) => {
    await load(page, `<slide-accept id="sa" activated-label="Done!">Slide to pay</slide-accept>`);
    await page.waitForSelector('#sa[data-upgraded]');
    await page.evaluate(() => {
      window.__accepts = 0;
      document.getElementById('sa').addEventListener('slide-accept:accept', () => { window.__accepts++; });
    });
    await page.locator('#sa .slide-handle').click();
    const r = await page.evaluate(() => {
      const el = document.getElementById('sa');
      const handle = el.querySelector('.slide-handle');
      return {
        activated: el.activated,
        attr: el.hasAttribute('data-activated'),
        accepts: window.__accepts,
        focused: document.activeElement === handle,
        tabindex: handle.getAttribute('tabindex'),
        ariaDisabled: handle.getAttribute('aria-disabled'),
        valuetext: handle.getAttribute('aria-valuetext'),
        statusRole: el.querySelector('.slide-label').getAttribute('role'),
        labelText: el.querySelector('.slide-label').textContent,
        name: handle.getAttribute('aria-label'),
      };
    });
    expect(r).toEqual({
      activated: true, attr: true, accepts: 1, focused: true, tabindex: '0',
      ariaDisabled: 'true', valuetext: 'Done!', statusRole: 'status', labelText: 'Done!',
      name: 'Slide to pay',
    });
  });

  test('Enter and Space confirm', async ({ page }) => {
    await load(page, `<slide-accept id="a">Slide</slide-accept><slide-accept id="b">Slide</slide-accept>`);
    await page.waitForSelector('#b[data-upgraded]');
    await page.locator('#a .slide-handle').focus();
    await page.keyboard.press('Enter');
    await page.locator('#b .slide-handle').focus();
    await page.keyboard.press('Space');
    expect(await page.evaluate(() => [
      document.getElementById('a').activated, document.getElementById('b').activated,
    ])).toEqual([true, true]);
  });

  test('a short drag springs back without confirming; valuetext reports percent', async ({ page }) => {
    await load(page, `<slide-accept id="sa" style="inline-size: 400px">Slide</slide-accept>`);
    await page.waitForSelector('#sa[data-upgraded]');
    const handle = page.locator('#sa .slide-handle');
    await handle.focus();
    await page.keyboard.press('ArrowRight');
    expect(await handle.getAttribute('aria-valuetext')).toBe('5%');
    await page.keyboard.press('Home');
    const box = await handle.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 60, box.y + box.height / 2, { steps: 5 });
    await page.mouse.up();
    await expect(handle).toHaveAttribute('aria-valuenow', '0');
    expect(await page.evaluate(() => document.getElementById('sa').activated)).toBe(false);
  });

  test('RTL: dragging towards the left confirms, ArrowLeft advances, chevron mirrored', async ({ page }) => {
    await load(page, `<slide-accept id="sa" style="inline-size: 400px">اسحب</slide-accept>`, { dir: 'rtl', lang: 'ar' });
    await page.waitForSelector('#sa[data-upgraded]');
    const handle = page.locator('#sa .slide-handle');
    await handle.focus();
    await page.keyboard.press('ArrowLeft');
    expect(await handle.getAttribute('aria-valuenow')).toBe('5');
    await page.keyboard.press('ArrowRight');
    expect(await handle.getAttribute('aria-valuenow')).toBe('0');

    const scale = await page.evaluate(() => getComputedStyle(document.querySelector('#sa .slide-handle icon-wc')).scale);
    expect(scale).toBe('-1 1');

    const box = await handle.boundingBox();
    const track = await page.locator('#sa .slide-track').boundingBox();
    // The handle starts at the right edge in RTL.
    expect(box.x + box.width).toBeGreaterThan(track.x + track.width - 10);
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(track.x + 5, box.y + box.height / 2, { steps: 10 });
    await page.mouse.up();
    expect(await page.evaluate(() => document.getElementById('sa').activated)).toBe(true);
  });

  test('authored text is the default label; label attribute wins and is observed', async ({ page }) => {
    await load(page, `<slide-accept id="sa">Deslizar para confirmar</slide-accept>`, { lang: 'es' });
    await page.waitForSelector('#sa[data-upgraded]');
    const read = () => page.evaluate(() => {
      const el = document.getElementById('sa');
      return [el.querySelector('.slide-label').textContent, el.querySelector('.slide-handle').getAttribute('aria-label'),
        el.querySelector('.slide-hint').textContent];
    });
    expect(await read()).toEqual(['Deslizar para confirmar', 'Deslizar para confirmar', 'Press Enter to confirm']);
    await page.evaluate(() => {
      const el = document.getElementById('sa');
      el.setAttribute('label', 'Desliza');
      el.setAttribute('data-label-hint', 'Pulsa Intro para confirmar');
    });
    expect(await read()).toEqual(['Desliza', 'Desliza', 'Pulsa Intro para confirmar']);
  });

  test('form association: required blocks submit until confirmed; reset clears', async ({ page }) => {
    await load(page, `<form id="f"><slide-accept id="sa" name="consent" required>Accept</slide-accept></form>`);
    await page.waitForSelector('#sa[data-upgraded]');
    const before = await page.evaluate(() => ({
      valid: document.getElementById('f').checkValidity(),
      value: new FormData(document.getElementById('f')).get('consent'),
    }));
    expect(before).toEqual({ valid: false, value: null });
    await page.locator('#sa .slide-handle').focus();
    await page.keyboard.press('Enter');
    const after = await page.evaluate(() => {
      const f = document.getElementById('f');
      const r = { valid: f.checkValidity(), value: new FormData(f).get('consent') };
      f.reset();
      return { ...r, afterReset: document.getElementById('sa').activated };
    });
    expect(after).toEqual({ valid: true, value: 'on', afterReset: false });
  });

  test('a disabled fieldset blocks confirming', async ({ page }) => {
    await load(page, `<form><fieldset disabled><slide-accept id="sa">Slide</slide-accept></fieldset></form>`);
    await page.waitForSelector('#sa[data-upgraded]');
    await page.locator('#sa .slide-handle').focus();
    await page.keyboard.press('Enter');
    const r = await page.evaluate(() => ({
      activated: document.getElementById('sa').activated,
      ariaDisabled: document.querySelector('#sa .slide-handle').getAttribute('aria-disabled'),
    }));
    expect(r).toEqual({ activated: false, ariaDisabled: 'true' });
  });

  test('forced colors: the handle has a system-colour border', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await load(page, `<slide-accept id="sa">Slide</slide-accept>`);
    await page.waitForSelector('#sa[data-upgraded]');
    const width = await page.evaluate(() => getComputedStyle(document.querySelector('#sa .slide-handle')).borderTopWidth);
    expect(parseFloat(width)).toBeGreaterThan(0);
  });

  test('reconnect keeps one handle and working keys', async ({ page }) => {
    await load(page, `<section id="host"><slide-accept id="sa">Slide</slide-accept></section>`);
    await page.waitForSelector('#sa[data-upgraded]');
    await page.evaluate(() => {
      const el = document.getElementById('sa');
      for (let i = 0; i < 3; i++) { el.remove(); document.getElementById('host').append(el); }
    });
    await page.waitForSelector('#sa[data-upgraded]');
    expect(await page.locator('#sa .slide-handle').count()).toBe(1);
    await page.locator('#sa .slide-handle').focus();
    await page.keyboard.press('Enter');
    expect(await page.evaluate(() => document.getElementById('sa').activated)).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/* stepper-wc                                                          */
/* ------------------------------------------------------------------ */

test.describe('stepper-wc', () => {
  test('the spinbutton is named by <label for>, aria-labelledby and aria-label', async ({ page }) => {
    await load(page, `
      <label for="qty">Quantity</label>
      <stepper-wc id="qty" data-suffix=" pcs" data-min="0" value="1"></stepper-wc>
      <span id="sev">Severity</span>
      <stepper-wc id="s2" aria-labelledby="sev" data-options="low,high"></stepper-wc>
      <stepper-wc id="s3" aria-label="Spacing" data-values="0,4,8"></stepper-wc>`);
    await page.waitForSelector('#s3[data-upgraded]');
    await expect(page.getByRole('spinbutton', { name: 'Quantity' })).toHaveCount(1);
    await expect(page.getByRole('spinbutton', { name: 'Severity' })).toHaveCount(1);
    await expect(page.getByRole('spinbutton', { name: 'Spacing' })).toHaveCount(1);

    await page.evaluate(() => document.getElementById('s3').setAttribute('aria-label', 'Gap'));
    await expect(page.getByRole('spinbutton', { name: 'Gap' })).toHaveCount(1);

    await page.locator('label[for="qty"]').click();
    expect(await page.evaluate(() => document.activeElement?.classList.contains('stepper-value')
      && document.activeElement.closest('stepper-wc').id)).toBe('qty');
  });

  test('form reset restores the authored value even after a move', async ({ page }) => {
    await load(page, `<form id="f"><stepper-wc id="s" name="n" data-suffix="px" data-min="0" value="12"></stepper-wc></form>`);
    await page.waitForSelector('#s[data-upgraded]');
    const r = await page.evaluate(async () => {
      const s = /** @type {any} */ (document.getElementById('s'));
      const f = /** @type {HTMLFormElement} */ (document.getElementById('f'));
      s.value = '20';
      s.remove(); f.append(s);
      await new Promise(requestAnimationFrame);
      const moved = s.value;
      f.reset();
      return { moved, reset: s.value };
    });
    expect(r).toEqual({ moved: '20', reset: '12' });
  });

  test('removing the element mid-hold stops auto-stepping', async ({ page }) => {
    await load(page, `<stepper-wc id="s" data-suffix="px" data-min="0" data-max="1000" data-accelerate value="0"></stepper-wc>`);
    await page.waitForSelector('#s[data-upgraded]');
    const box = await page.locator('#s .stepper-inc').boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(700);
    const counts = await page.evaluate(async () => {
      const s = document.getElementById('s');
      let n = 0;
      s.addEventListener('input', () => n++);
      s.remove();
      await new Promise((r) => setTimeout(r, 600));
      return n;
    });
    await page.mouse.up();
    expect(counts).toBe(0);
  });

  test('data-label-decrease / -increase name the buttons', async ({ page }) => {
    await load(page, `<stepper-wc id="s" aria-label="Talla" data-options="s,m,l" data-label-decrease="Menos" data-label-increase="Más"></stepper-wc>`, { lang: 'es' });
    await page.waitForSelector('#s[data-upgraded]');
    const r = await page.evaluate(() => [...document.querySelectorAll('#s button')].map((b) => b.getAttribute('aria-label')));
    expect(r).toEqual(['Menos', 'Más']);
  });

  test('readonly: aria-readonly and disabled buttons; fieldset disabled disables', async ({ page }) => {
    await load(page, `
      <stepper-wc id="ro" aria-label="A" data-options="s,m,l" value="m" readonly></stepper-wc>
      <fieldset id="fs"><stepper-wc id="fd" aria-label="B" data-options="s,m,l" value="m"></stepper-wc></fieldset>`);
    await page.waitForSelector('#fd[data-upgraded]');
    const ro = await page.evaluate(() => {
      const el = document.getElementById('ro');
      return {
        readonly: el.querySelector('.stepper-value').getAttribute('aria-readonly'),
        buttons: [...el.querySelectorAll('button')].map((b) => b.disabled),
      };
    });
    expect(ro).toEqual({ readonly: 'true', buttons: [true, true] });

    await page.evaluate(() => { document.getElementById('fs').disabled = true; });
    const fd = await page.evaluate(() => {
      const v = document.querySelector('#fd .stepper-value');
      return { disabled: v.getAttribute('aria-disabled'), tabindex: v.getAttribute('tabindex') };
    });
    expect(fd).toEqual({ disabled: 'true', tabindex: null });
    await page.evaluate(() => { document.getElementById('fs').disabled = false; });
    await expect(page.locator('#fd .stepper-value')).toHaveAttribute('tabindex', '0');
  });

  test('RTL: ArrowLeft steps up', async ({ page }) => {
    await load(page, `<stepper-wc id="s" aria-label="N" data-suffix="px" data-min="0" value="5"></stepper-wc>`, { dir: 'rtl' });
    await page.waitForSelector('#s[data-upgraded]');
    await page.locator('#s .stepper-value').focus();
    await page.keyboard.press('ArrowLeft');
    expect(await page.evaluate(() => document.getElementById('s').value)).toBe('6');
  });

  test('forced colors: keyboard focus draws an outline on the spinbutton', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await load(page, `<button type="button" id="before">before</button><stepper-wc id="s" aria-label="N" data-suffix="px" value="1"></stepper-wc>`);
    await page.waitForSelector('#s[data-upgraded]');
    await page.locator('#before').focus();
    await page.keyboard.press('Tab');
    const style = await page.evaluate(() => getComputedStyle(document.querySelector('#s .stepper-value')).outlineStyle);
    expect(style).toBe('solid');
  });

  test('numeric-mode console hint is logged once, not per reconnect', async ({ page }) => {
    const infos = [];
    page.on('console', (m) => { if (m.type() === 'info' && m.text().includes('[stepper-wc]')) infos.push(m.text()); });
    await load(page, `<section id="h"><stepper-wc id="s" aria-label="N"></stepper-wc><stepper-wc aria-label="M"></stepper-wc></section>`);
    await page.waitForSelector('#s[data-upgraded]');
    await page.evaluate(() => { const s = document.getElementById('s'); s.remove(); document.getElementById('h').append(s); });
    await page.waitForTimeout(50);
    expect(infos.length).toBe(1);
  });
});

/* ------------------------------------------------------------------ */
/* split-surface                                                       */
/* ------------------------------------------------------------------ */

const PANELS = `<nav id="p1"><a href="#x">Link</a></nav><article><p>Main</p></article>`;

test.describe('split-surface', () => {
  test('Enter collapses (inert panel, valuemin 0, valuetext) and arrows expand again', async ({ page }) => {
    await load(page, `<split-surface id="ss" collapsible position="30" style="block-size: 200px">${PANELS}</split-surface>`);
    await page.waitForSelector('#ss .split-divider');
    const divider = page.locator('#ss .split-divider');
    await expect(divider).toHaveAttribute('aria-valuemin', '0');
    await expect(divider).toHaveAttribute('aria-valuetext', '30%');
    await divider.focus();
    await page.keyboard.press('Enter');
    const collapsed = await page.evaluate(() => ({
      collapsed: document.getElementById('ss').collapsed,
      inert: document.getElementById('p1').inert,
      now: document.querySelector('#ss .split-divider').getAttribute('aria-valuenow'),
      text: document.querySelector('#ss .split-divider').getAttribute('aria-valuetext'),
    }));
    expect(collapsed).toEqual({ collapsed: true, inert: true, now: '0', text: 'Collapsed' });

    await page.keyboard.press('ArrowRight');
    const expanded = await page.evaluate(() => ({
      collapsed: document.getElementById('ss').collapsed,
      inert: document.getElementById('p1').inert,
      now: Number(document.querySelector('#ss .split-divider').getAttribute('aria-valuenow')),
    }));
    expect(expanded).toEqual({ collapsed: false, inert: false, now: 10 });

    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await expect(divider).toHaveAttribute('aria-valuenow', '10');
  });

  test('Enter does nothing without collapsible', async ({ page }) => {
    await load(page, `<split-surface id="ss" style="block-size: 200px">${PANELS}</split-surface>`);
    await page.waitForSelector('#ss .split-divider');
    await page.locator('#ss .split-divider').focus();
    await page.keyboard.press('Enter');
    expect(await page.evaluate(() => document.getElementById('ss').collapsed)).toBe(false);
    await expect(page.locator('#ss .split-divider')).toHaveAttribute('aria-valuemin', '10');
  });

  test('JS API is safe (queued) before the divider exists', async ({ page }) => {
    await load(page, `<section id="host"></section>`);
    const r = await page.evaluate(async () => {
      const make = () => {
        const s = /** @type {any} */ (document.createElement('split-surface'));
        s.setAttribute('collapsible', '');
        s.innerHTML = '<nav>A</nav><article>B</article>';
        return s;
      };
      const a = make();
      a.position = 25;               // before connect
      document.getElementById('host').append(a);
      const b = make();
      document.getElementById('host').append(b);
      b.collapsed = true;            // right after append, before async init
      const c = make();
      c.setAttribute('position', '40');
      document.getElementById('host').append(c);
      c.position = 70;
      c.reset();                     // reset wins: back to the attribute
      await new Promise((res) => setTimeout(res, 50));
      return {
        a: a.position, b: b.collapsed, bNow: b.querySelector('.split-divider').getAttribute('aria-valuenow'),
        c: c.position,
      };
    });
    expect(r).toEqual({ a: 25, b: true, bNow: '0', c: 40 });
  });

  test('a persisted layout wins over the position attribute, including collapsed', async ({ page }) => {
    const key = `s6-${Math.random().toString(36).slice(2)}`;
    await load(page, `<section id="host"><split-surface id="ss" collapsible position="30" persist="${key}" style="block-size: 200px">${PANELS}</split-surface></section>`);
    await page.waitForSelector('#ss .split-divider');
    await page.locator('#ss .split-divider').focus();
    await page.keyboard.press('Shift+ArrowRight');   // 40
    await page.waitForTimeout(100);
    const first = await page.evaluate(async (k) => {
      const s = document.createElement('split-surface');
      s.setAttribute('position', '30');
      s.setAttribute('persist', k);
      s.setAttribute('collapsible', '');
      s.innerHTML = '<nav>A</nav><article>B</article>';
      document.getElementById('host').append(s);
      await new Promise((res) => setTimeout(res, 100));
      return /** @type {any} */ (s).position;
    }, key);
    expect(first).toBe(40);

    await page.keyboard.press('Enter');               // collapse the original
    await page.waitForTimeout(100);
    const second = await page.evaluate(async (k) => {
      const s = /** @type {any} */ (document.createElement('split-surface'));
      s.setAttribute('position', '30');
      s.setAttribute('persist', k);
      s.setAttribute('collapsible', '');
      s.innerHTML = '<nav>A</nav><article>B</article>';
      document.getElementById('host').append(s);
      await new Promise((res) => setTimeout(res, 100));
      const collapsed = s.collapsed;
      s.collapsed = false;
      return { collapsed, restored: s.position };
    }, key);
    expect(second).toEqual({ collapsed: true, restored: 40 });
  });

  test('resize: not fired on init; carries source; NaN ignored', async ({ page }) => {
    await page.addInitScript(() => {
      window.__resizes = [];
      document.addEventListener('split-surface:resize', (e) => window.__resizes.push(e.detail));
    });
    await load(page, `<split-surface id="ss" position="30" style="block-size: 200px">${PANELS}</split-surface>`);
    await page.waitForSelector('#ss .split-divider');
    await page.waitForTimeout(50);
    expect(await page.evaluate(() => window.__resizes.length)).toBe(0);
    await page.locator('#ss .split-divider').focus();
    await page.keyboard.press('ArrowRight');
    await page.evaluate(() => {
      const s = /** @type {any} */ (document.getElementById('ss'));
      s.position = 50;
      s.position = 'abc';
    });
    const r = await page.evaluate(() => ({
      events: window.__resizes,
      now: document.querySelector('#ss .split-divider').getAttribute('aria-valuenow'),
    }));
    expect(r).toEqual({
      events: [{ position: 31, source: 'keyboard' }, { position: 50, source: 'api' }],
      now: '50',
    });
  });

  test('position / min / direction changes after upgrade are applied', async ({ page }) => {
    await load(page, `<split-surface id="ss" style="block-size: 200px">${PANELS}</split-surface>`);
    await page.waitForSelector('#ss .split-divider');
    await page.evaluate(() => {
      const s = document.getElementById('ss');
      s.setAttribute('min', '35');
      s.setAttribute('position', '20');
      s.setAttribute('direction', 'vertical');
    });
    const r = await page.evaluate(() => {
      const d = document.querySelector('#ss .split-divider');
      return {
        min: d.getAttribute('aria-valuemin'),
        now: d.getAttribute('aria-valuenow'),
        orientation: d.getAttribute('aria-orientation'),
      };
    });
    expect(r).toEqual({ min: '35', now: '35', orientation: 'horizontal' });
  });

  test('reconnect keeps the live position', async ({ page }) => {
    await load(page, `<section id="host"><split-surface id="ss" position="30" style="block-size: 200px">${PANELS}</split-surface></section>`);
    await page.waitForSelector('#ss .split-divider');
    const r = await page.evaluate(async () => {
      const s = /** @type {any} */ (document.getElementById('ss'));
      s.position = 60;
      s.remove(); document.getElementById('host').append(s);
      await new Promise((res) => setTimeout(res, 50));
      return { pos: s.position, dividers: s.querySelectorAll('.split-divider').length };
    });
    expect(r).toEqual({ pos: 60, dividers: 1 });
  });

  test('RTL: the grip is centred on the divider', async ({ page }) => {
    await load(page, `<split-surface id="ss" style="block-size: 200px">${PANELS}</split-surface>`, { dir: 'rtl' });
    await page.waitForSelector('#ss .split-divider');
    const r = await page.evaluate(() => {
      const d = document.querySelector('#ss .split-divider');
      const cs = getComputedStyle(d, '::after');
      const centre = parseFloat(cs.left) + parseFloat(cs.marginLeft) + parseFloat(cs.width) / 2;
      return { centre, half: d.getBoundingClientRect().width / 2 };
    });
    expect(Math.abs(r.centre - r.half)).toBeLessThan(1);
  });

  test('forced colors: the divider is drawn', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await load(page, `<split-surface id="ss" style="block-size: 200px">${PANELS}</split-surface>`);
    await page.waitForSelector('#ss .split-divider');
    const bg = await page.evaluate(() => getComputedStyle(document.querySelector('#ss .split-divider')).backgroundColor);
    expect(bg).not.toBe('rgba(0, 0, 0, 0)');
    const canvas = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bg).not.toBe(canvas);
  });
});
