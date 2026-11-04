/**
 * S-review fixes: score-card, star-rating (+ rating effect), status-wc,
 * status-message.
 *
 * Tests the working tree: /src is served from disk, not the build. Each
 * fixture loads /src/main.css + /src/main.js (all components, the effects
 * runtime and VB.observe) plus the status-message dismiss module.
 */
import { test, expect } from 'playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

/**
 * @param {import('playwright/test').Page} page
 * @param {string} body
 * @param {{ dir?: string, lang?: string, head?: string }} [opts]
 */
async function load(page, body, { dir = 'ltr', lang = 'en', head = '' } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__s5-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="${lang}" dir="${dir}"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">${head}
      <script type="module" src="/src/main.js"></script>
      <script type="module" src="/src/custom-elements/status-message/logic.js"></script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => ['score-card', 'star-rating', 'status-wc'].every((n) => customElements.get(n)));
}

const tick = (page, ms = 60) => page.waitForTimeout(ms);

/** Resolve a CSS colour expression to computed rgb via a probe element. */
async function resolveColor(page, expr, scopeSel = 'main') {
  return page.evaluate(({ expr, scopeSel }) => {
    const probe = document.createElement('span');
    probe.style.color = expr;
    document.querySelector(scopeSel).append(probe);
    const c = getComputedStyle(probe).color;
    probe.remove();
    return c;
  }, { expr, scopeSel });
}

/* ── score-card ─────────────────────────────────────────────────────── */

test.describe('score-card', () => {
  test('static.html fallback: direct children are slotted, optional slots detected', async ({ page }) => {
    const raw = readFileSync(join(REPO, 'src/web-components/score-card/static.html'), 'utf8');
    const markup = raw.replace(/<!--[\s\S]*?-->/g, '');
    await load(page, markup);
    await page.waitForSelector('score-card[data-upgraded]');
    const r = await page.evaluate(() => {
      const el = /** @type {any} */ (document.querySelector('score-card'));
      const slot = (n) => el.shadowRoot.querySelector(`slot[name="${n}"]`).assignedElements().map((e) => e.textContent.trim());
      return {
        title: slot('title'),
        value: slot('value'),
        change: el.matches(':state(has-change)'),
        description: el.matches(':state(has-description)'),
        figure: !!el.querySelector('figure'),
        valueMargin: getComputedStyle(el.querySelector('[slot="value"]')).marginBlockStart,
      };
    });
    expect(r.title).toEqual(['Total Users']);
    expect(r.value).toEqual(['24,521']);
    expect(r.change).toBe(true);
    expect(r.description).toBe(true);
    expect(r.figure).toBe(false);
    expect(r.valueMargin).toBe('0px');
  });

  test('loading mirrors aria-busy; no container-type; trend uses *-text tokens', async ({ page }) => {
    await load(page, `<score-card trend="up" loading>
      <span slot="title">Users</span><data slot="value" value="1">1</data>
      <small slot="change">+1% vs last month</small></score-card>
      <score-card trend="down"><span slot="title">Churn</span><data slot="value" value="2">2</data>
      <small slot="change">-2% vs last month</small></score-card>`);
    await page.waitForSelector('score-card[data-upgraded]');
    const r = await page.evaluate(() => {
      const [a, b] = document.querySelectorAll('score-card');
      const busyOn = a.getAttribute('aria-busy');
      a.removeAttribute('loading');
      return {
        busyOn, busyOff: a.getAttribute('aria-busy'),
        containerType: getComputedStyle(a).containerType,
        up: getComputedStyle(a.querySelector('[slot="change"]')).color,
        down: getComputedStyle(b.querySelector('[slot="change"]')).color,
      };
    });
    expect(r.busyOn).toBe('true');
    expect(r.busyOff).toBeNull();
    expect(r.containerType).toBe('normal');
    expect(r.up).toBe(await resolveColor(page, 'var(--color-success-text)'));
    expect(r.down).toBe(await resolveColor(page, 'var(--color-error-text)'));
  });

  test('forced colours: loading skeleton regions keep an outline', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await load(page, `<score-card loading><span slot="title">T</span><data slot="value" value="1">1</data></score-card>`);
    await page.waitForSelector('score-card[data-upgraded]');
    const outline = await page.evaluate(() => {
      const v = document.querySelector('score-card').shadowRoot.querySelector('.value');
      return getComputedStyle(v).outlineStyle;
    });
    expect(outline).toBe('solid');
  });
});

/* ── star-rating + rating effect ─────────────────────────────────────── */

test.describe('star-rating', () => {
  test('FormData holds exactly one entry; reset restores the value attribute', async ({ page }) => {
    await load(page, `<form id="f"><star-rating name="rating" value="2"></star-rating>
      <star-rating name="rating2"></star-rating></form>`);
    await page.waitForSelector('star-rating[data-upgraded]');
    await page.locator('star-rating[name="rating"] input[value="4"]').click({ force: true });
    const r = await page.evaluate(() => {
      const form = /** @type {HTMLFormElement} */ (document.getElementById('f'));
      const entries = [...new FormData(form).entries()].map(([k, v]) => `${k}=${v}`);
      form.reset();
      return { entries, afterReset: /** @type {any} */ (document.querySelector('star-rating')).value };
    });
    expect(r.entries).toEqual(['rating=4']);
    expect(r.afterReset).toBe(2);
  });

  test('value set before connect is applied; observed attributes re-render', async ({ page }) => {
    await load(page, `<form id="f"></form>`);
    const r = await page.evaluate(async () => {
      const el = /** @type {any} */ (document.createElement('star-rating'));
      el.setAttribute('name', 'x');
      el.value = 3;
      document.getElementById('f').append(el);
      const before = el.value;
      const checked = el.querySelector('input:checked')?.value;
      el.setAttribute('max', '3');
      const radios = el.querySelectorAll('input[type="radio"]').length;
      const keptValue = el.value;
      el.setAttribute('label', 'Quality');
      const legend = el.querySelector('legend').textContent;
      el.value = 0;
      el.setAttribute('required', '');
      const invalid = !el.matches(':valid');
      el.removeAttribute('required');
      const validAgain = el.matches(':valid');
      el.setAttribute('value', '2');
      const fromAttr = el.value;
      el.setAttribute('readonly', '');
      const role = el.querySelector('fieldset').getAttribute('role');
      return { before, checked, radios, keptValue, legend, invalid, validAgain, fromAttr, role,
        fieldsets: el.querySelectorAll('fieldset').length };
    });
    expect(r).toEqual({ before: 3, checked: '3', radios: 3, keptValue: 3, legend: 'Quality',
      invalid: true, validAgain: true, fromAttr: 2, role: 'img', fieldsets: 1 });
  });

  test('clear by activating the checked star again and by Delete; events fire once', async ({ page }) => {
    await load(page, `<star-rating name="r" label="Rate"></star-rating>`);
    await page.waitForSelector('star-rating[data-upgraded]');
    await page.evaluate(() => {
      /** @type {any} */ (window).events = [];
      document.querySelector('star-rating').addEventListener('rating:change',
        (e) => /** @type {any} */ (window).events.push(/** @type {CustomEvent} */ (e).detail.value));
    });
    const star3 = page.locator('star-rating input[value="3"]');
    await page.locator('star-rating label').nth(2).click();
    await tick(page);
    expect(await page.evaluate(() => /** @type {any} */ (document.querySelector('star-rating')).value)).toBe(3);
    // Same star again → clear.
    await page.locator('star-rating label').nth(2).click();
    await tick(page, 120);
    expect(await page.evaluate(() => /** @type {any} */ (document.querySelector('star-rating')).value)).toBe(0);
    await expect(page.locator('star-rating [data-rating-live]')).toHaveText('Rating cleared');
    // Keyboard: select 3 with Space, clear with Delete.
    await star3.focus();
    await page.keyboard.press('Space');
    await tick(page);
    await page.keyboard.press('Delete');
    await tick(page);
    const events = await page.evaluate(() => /** @type {any} */ (window).events);
    expect(events).toEqual([3, 0, 3, 0]);
    expect(await page.locator('star-rating [data-rating-live]').count()).toBe(1);
  });

  test('rating effect survives a real removal + reinsert (plain fieldset)', async ({ page }) => {
    await load(page, `<section id="host"><fieldset data-rating data-effect="rating" id="fs">
      <legend>Rate</legend>
      <label><input type="radio" name="p" value="1" aria-label="1 star">&#9733;</label>
      <label><input type="radio" name="p" value="2" aria-label="2 stars">&#9733;</label>
      </fieldset></section>`);
    await page.waitForSelector('#fs [data-rating-live]', { state: 'attached' });
    const r = await page.evaluate(async () => {
      const fs = document.getElementById('fs');
      const host = document.getElementById('host');
      const frames = () => new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)));
      fs.remove();
      await frames();
      host.append(fs);
      await frames();
      const values = [];
      fs.addEventListener('rating:change', (e) => values.push(/** @type {CustomEvent} */ (e).detail.value));
      /** @type {HTMLInputElement} */ (fs.querySelector('input[value="2"]')).click();
      await new Promise((res) => setTimeout(res, 30));
      /** @type {HTMLInputElement} */ (fs.querySelector('input[value="2"]')).click();
      await new Promise((res) => setTimeout(res, 30));
      return { values, live: fs.querySelectorAll('[data-rating-live]').length };
    });
    expect(r).toEqual({ values: [2, 0], live: 1 });
  });

  test('serialized upgraded markup is rebuilt with its own radio group', async ({ page }) => {
    await load(page, `<star-rating id="a" name="r" value="2"></star-rating>`);
    await page.waitForSelector('star-rating[data-upgraded]');
    const r = await page.evaluate(async () => {
      const a = /** @type {any} */ (document.getElementById('a'));
      // Server-rendered / innerHTML copy of an upgraded instance (the
      // data-upgraded marker stripped, as a fresh render would be).
      const html = a.outerHTML.replace('id="a"', 'id="b"').replace(/ data-upgraded=""/, '');
      document.querySelector('main').insertAdjacentHTML('beforeend', html);
      await new Promise((res) => setTimeout(res, 30));
      const b = /** @type {any} */ (document.getElementById('b'));
      /** @type {HTMLInputElement} */ (b.querySelector('input[value="5"]')).click();
      return {
        distinct: a.querySelector('input').name !== b.querySelector('input').name,
        a: a.value, b: b.value, bFieldsets: b.querySelectorAll('fieldset').length,
      };
    });
    expect(r).toEqual({ distinct: true, a: 2, b: 5, bFieldsets: 1 });
  });

  test('i18n: data-label-* templates with Intl number formatting', async ({ page }) => {
    await load(page, `<star-rating lang="de" name="r" allow-half label="Bewertung"
        data-label-one="{n} Stern" data-label-other="{n} Sterne"></star-rating>
      <star-rating lang="de" readonly value="4.2" label="Schnitt"
        data-label-readonly="{label}: {value} von {max}"></star-rating>`);
    await page.waitForSelector('star-rating[data-upgraded]');
    const r = await page.evaluate(() => {
      const [a, b] = document.querySelectorAll('star-rating');
      return {
        one: a.querySelector('input[value="1"]').getAttribute('aria-label'),
        half: a.querySelector('input[value="4.5"]').getAttribute('aria-label'),
        ro: b.querySelector('fieldset').getAttribute('aria-label'),
      };
    });
    expect(r).toEqual({ one: '1 Stern', half: '4,5 Sterne', ro: 'Schnitt: 4,2 von 5' });
  });

  test('RTL: readonly partial star keeps the inline-start fraction', async ({ page }) => {
    await load(page, `<star-rating readonly value="4.25"></star-rating>`, { dir: 'rtl', lang: 'ar' });
    await page.waitForSelector('star-rating[data-upgraded]');
    const clip = await page.evaluate(() =>
      getComputedStyle(document.querySelector('.star-partial-fill')).clipPath);
    expect(clip).toBe('inset(0px 0px 0px 75%)');
  });

  test('filled vs empty differ by shape, and in forced colours', async ({ page }) => {
    for (const forced of [false, true]) {
      await page.emulateMedia({ forcedColors: forced ? 'active' : 'none' });
      await load(page, `<star-rating name="r" value="2"></star-rating>
        <star-rating readonly value="2"></star-rating>`);
      await page.waitForSelector('star-rating[data-upgraded]');
      const r = await page.evaluate(() => {
        const labels = document.querySelectorAll('star-rating:not([readonly]) label');
        const fill = (el) => getComputedStyle(el).webkitTextFillColor;
        const color = (el) => getComputedStyle(el).color;
        const ro = document.querySelector('star-rating[readonly]');
        return {
          filledFill: fill(labels[1]), emptyFill: fill(labels[2]),
          filledColor: color(labels[1]), emptyColor: color(labels[2]),
          roFilled: fill(ro.querySelector('.star-filled')), roEmpty: fill(ro.querySelector('.star-empty')),
          adjust: getComputedStyle(labels[1]).forcedColorAdjust,
        };
      });
      expect(r.emptyFill).toBe('rgba(0, 0, 0, 0)');
      expect(r.filledFill).not.toBe('rgba(0, 0, 0, 0)');
      expect(r.roEmpty).toBe('rgba(0, 0, 0, 0)');
      expect(r.roFilled).not.toBe('rgba(0, 0, 0, 0)');
      expect(r.filledColor).not.toBe(r.emptyColor);
      if (forced) expect(r.adjust).toBe('none');
    }
  });
});

/* ── status-wc ──────────────────────────────────────────────────────── */

test.describe('status-wc', () => {
  test('no change event on upgrade; reconnect and clone keep one dot and label', async ({ page }) => {
    await load(page, `<section id="box"><status-wc id="s" data-variant="online">Online</status-wc></section>`, {
      head: `<script>window.changes = 0; document.addEventListener('status-wc:change', () => window.changes++);</script>`,
    });
    await page.waitForSelector('status-wc[data-upgraded]');
    const r = await page.evaluate(async () => {
      const el = document.getElementById('s');
      const box = document.getElementById('box');
      const upgradeChanges = /** @type {any} */ (window).changes;
      for (let i = 0; i < 3; i++) { el.remove(); box.append(el); }
      el.remove();
      await new Promise((res) => setTimeout(res, 30));
      box.append(el);
      const clone = /** @type {HTMLElement} */ (el.cloneNode(true));
      box.append(clone);
      const shape = (n) => [n.querySelectorAll('.status-dot').length, n.querySelectorAll('.status-label').length,
        n.querySelectorAll('.status-label .status-label, .status-label .status-dot').length, n.textContent.trim()];
      /** @type {any} */ (el).variant = 'away';
      return { upgradeChanges, el: shape(el), clone: shape(clone), changes: /** @type {any} */ (window).changes };
    });
    expect(r.upgradeChanges).toBe(0);
    expect(r.el).toEqual([1, 1, 0, 'Online']);
    expect(r.clone).toEqual([1, 1, 0, 'Online']);
    expect(r.changes).toBe(1);
  });

  test('bare dot gets a hidden default label that follows the variant', async ({ page }) => {
    await load(page, `<status-wc id="a" data-variant="busy" data-position="only"></status-wc>
      <status-wc id="b" data-variant="online" data-label-away="Absent"></status-wc>
      <status-wc id="c" data-variant="online">Available</status-wc>
      <status-wc id="d" data-variant="online" data-live="off"></status-wc>`);
    await page.waitForSelector('status-wc[data-upgraded]');
    const r = await page.evaluate(() => {
      const g = (id) => document.querySelector(`#${id} .status-default-label`).textContent;
      const before = [g('a'), g('b'), g('c')];
      document.getElementById('a').setAttribute('data-variant', 'away');
      document.getElementById('b').setAttribute('data-variant', 'away');
      const label = document.querySelector('#a .status-default-label');
      return {
        before, after: [g('a'), g('b')],
        hidden: getComputedStyle(label).position === 'absolute' && label.getBoundingClientRect().width <= 1,
        role: document.getElementById('a').getAttribute('role'),
        decorativeRole: document.getElementById('d').getAttribute('role'),
      };
    });
    expect(r.before).toEqual(['Busy', 'Online', '']);
    expect(r.after).toEqual(['Away', 'Absent']);
    expect(r.hidden).toBe(true);
    expect(r.role).toBe('status');
    expect(r.decorativeRole).toBeNull();
  });

  test('forced colours paint the dot; light-mode ring is darker than an amber fill', async ({ page }) => {
    await load(page, `<status-wc data-variant="away">Away</status-wc>`);
    await page.waitForSelector('status-wc[data-upgraded]');
    const ring = await page.evaluate(() => {
      const d = getComputedStyle(document.querySelector('.status-dot'));
      return { border: d.borderTopColor, bg: d.backgroundColor, width: d.borderTopWidth };
    });
    expect(ring.width).toBe('1px');
    expect(ring.border).not.toBe(ring.bg);

    await page.emulateMedia({ forcedColors: 'active' });
    await load(page, `<status-wc data-variant="online" data-position="only"></status-wc>`);
    await page.waitForSelector('status-wc[data-upgraded]');
    const r = await page.evaluate(() => {
      const d = getComputedStyle(document.querySelector('.status-dot'));
      return { adjust: d.forcedColorAdjust, bg: d.backgroundColor, w: d.width };
    });
    expect(r.adjust).toBe('none');
    expect(r.bg).not.toBe('rgba(0, 0, 0, 0)');
  });
});

/* ── status-message ─────────────────────────────────────────────────── */

test.describe('status-message', () => {
  const MSG = `
    <status-message id="m" data-variant="success">
      <section data-content><strong data-title>Saved</strong><p data-description>Done.</p></section>
      <button data-dismiss type="button" aria-label="Dismiss">x</button>
    </status-message>
    <p><button type="button" id="next">Next</button></p>`;

  test('dismiss hides the message and moves focus to the next control', async ({ page }) => {
    await load(page, MSG);
    await page.locator('#m [data-dismiss]').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#m')).toBeHidden();
    expect(await page.evaluate(() => document.activeElement?.id)).toBe('next');
  });

  test('dismiss is cancelable; data-dismiss="remove" removes; data-dismiss-focus targets', async ({ page }) => {
    await load(page, `${MSG}
      <status-message id="r" data-dismiss-focus="#h"><p data-content>Temp</p>
        <button data-dismiss="remove" type="button" aria-label="Dismiss">x</button></status-message>
      <h2 id="h">Heading</h2>`);
    const r = await page.evaluate(() => {
      const m = document.getElementById('m');
      m.addEventListener('status-message:dismiss', (e) => e.preventDefault(), { once: true });
      /** @type {HTMLButtonElement} */ (m.querySelector('[data-dismiss]')).click();
      const kept = !m.hidden;
      const rb = /** @type {HTMLButtonElement} */ (document.querySelector('#r [data-dismiss]'));
      rb.focus();
      rb.click();
      return { kept, removed: !document.getElementById('r'), focus: document.activeElement?.id };
    });
    expect(r).toEqual({ kept: true, removed: true, focus: 'h' });
  });

  test('variant title text uses the *-text token; filled messages keep a border in forced colours', async ({ page }) => {
    await load(page, `<status-message id="m" data-variant="success"><p data-content>Saved</p></status-message>
      <status-message id="f" data-variant="warning" data-filled><p data-content>Careful</p></status-message>`);
    const color = await page.evaluate(() => getComputedStyle(document.getElementById('m')).color);
    expect(color).toBe(await resolveColor(page, 'var(--color-success-text)'));

    await page.emulateMedia({ forcedColors: 'active' });
    await load(page, `<status-message id="f" data-variant="warning" data-filled><p data-content>Careful</p></status-message>`);
    const border = await page.evaluate(() => {
      const s = getComputedStyle(document.getElementById('f'));
      return [s.borderTopStyle, s.borderTopWidth];
    });
    expect(border).toEqual(['solid', '1px']);
  });
});
