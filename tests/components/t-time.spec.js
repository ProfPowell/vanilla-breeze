/**
 * time-index + time-picker — T review fixes.
 *
 * time-index: safe recently-updated feed (no innerHTML, http(s)/relative
 * links only, one feed across reconnects, generated ids); sort reverses
 * releases and li entries; filter matches .version-tag / data-version / id;
 * aria-pressed toggle; absolute date kept in title; live-region count;
 * data-label-* overrides.
 *
 * time-picker: accessible name from the input's label; empty state +
 * required; min/max/step validity and spinner snapping; hour-scale steps;
 * disabled attribute + fieldset; dialog popup; valuetext on every spinner;
 * focusout closes; change only on real changes with source; stable reset
 * target across reconnects; locale period text.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

async function load(page, tag, body, { lang = 'en', routes = {} } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  for (const [path, json] of Object.entries(routes)) {
    await page.route(`**${path}`, (route) => route.fulfill({
      status: 200, contentType: 'application/json', body: JSON.stringify(json),
    }));
  }
  const url = `/__t-time-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="${lang}"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <script type="module">import '/src/web-components/${tag}/logic.js';</script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction((t) => customElements.get(t), tag);
  await page.waitForSelector(`${tag}[data-upgraded]`, { state: 'attached' });
}

/* ------------------------------------------------------------------ */
/* time-index                                                          */
/* ------------------------------------------------------------------ */

const LIST = `
  <time-index id="ti" versions>
    <ol class="changelog-entries">
      <li><h3><span class="version-tag">v2.1.0</span> <time datetime="2026-03-15" data-relative>15 March 2026</time></h3></li>
      <li><h3><span class="version-tag">v2.0.0</span> <time datetime="2026-02-01" data-relative>1 February 2026</time></h3></li>
      <li data-version="v1.0.0"><h3>First <time datetime="2026-01-15" data-relative>15 January 2026</time></h3></li>
    </ol>
  </time-index>`;

const RELEASES = `
  <time-index id="ti" versions>
    <h1>Changelog</h1>
    <section id="v2-1-0"><h2>v2.1.0</h2>
      <section class="changelog-entries"><article id="a1">a1</article><article id="a2">a2</article></section>
    </section>
    <section id="v2-0-0"><h2>v2.0.0</h2>
      <section class="changelog-entries"><article id="b1">b1</article></section>
    </section>
    <section id="v1-0-0"><h2>v1.0.0</h2>
      <section class="changelog-entries"><article id="c1">c1</article></section>
    </section>
  </time-index>`;

test.describe('time-index', () => {
  test('sort reverses li entries; toggle has a stable label and aria-pressed', async ({ page }) => {
    await load(page, 'time-index', LIST);
    const btn = page.locator('[data-timeline-controls] button');
    await expect(btn).toHaveText('Oldest first');
    await expect(btn).toHaveAttribute('aria-pressed', 'false');
    await btn.click();
    await expect(btn).toHaveText('Oldest first');
    await expect(btn).toHaveAttribute('aria-pressed', 'true');
    const order = await page.$$eval('.changelog-entries > li', (lis) => lis.map((li) => li.querySelector('.version-tag')?.textContent || li.dataset.version));
    expect(order).toEqual(['v1.0.0', 'v2.0.0', 'v2.1.0']);
  });

  test('sort reverses top-level release sections and their entries', async ({ page }) => {
    await load(page, 'time-index', RELEASES);
    await page.locator('[data-timeline-controls] button').click();
    const r = await page.evaluate(() => ({
      releases: [...document.querySelectorAll('#ti > section')].map((s) => s.id),
      first: [...document.querySelectorAll('#v2-1-0 article')].map((a) => a.id),
      controlsFirst: document.querySelector('#ti > [data-timeline-controls]')?.nextElementSibling?.id,
    }));
    expect(r.releases).toEqual(['v1-0-0', 'v2-0-0', 'v2-1-0']);
    expect(r.first).toEqual(['a2', 'a1']);
    expect(r.controlsFirst).toBe('v1-0-0');
  });

  test('filter matches .version-tag / data-version and announces the count', async ({ page }) => {
    await load(page, 'time-index', LIST);
    const select = page.locator('[data-timeline-controls] select');
    expect(await select.locator('option').allTextContents()).toEqual(['All versions', 'v2.1.0', 'v2.0.0', 'v1.0.0']);
    await select.selectOption('v1.0.0');
    const hidden = await page.$$eval('.changelog-entries > li', (lis) => lis.map((li) => li.hidden));
    expect(hidden).toEqual([true, true, false]);
    const status = page.locator('[data-timeline-status]');
    await expect(status).toHaveAttribute('role', 'status');
    await expect(status).toHaveText('Showing 1 of 3 entries for v1.0.0');
    await select.selectOption('');
    await expect(status).toHaveText('Showing all 3 entries');
  });

  test('filter reads v2-1-0 ids on release sections', async ({ page }) => {
    await load(page, 'time-index', RELEASES);
    await page.locator('[data-timeline-controls] select').selectOption('v2.0.0');
    await expect(page.locator('#v2-0-0')).toBeVisible();
    await expect(page.locator('#v2-1-0')).toBeHidden();
    await expect(page.locator('#v1-0-0')).toBeHidden();
  });

  test('relative dates keep the absolute date in title', async ({ page }) => {
    await load(page, 'time-index', LIST);
    const t = page.locator('time[datetime="2026-03-15"]');
    await expect(t).toHaveAttribute('title', 'March 15, 2026');
    await expect(t).toHaveText(/ago/);
  });

  test('data-label-* overrides the UI strings; options are text, not HTML', async ({ page }) => {
    await load(page, 'time-index', `
      <time-index versions data-label-sort="Älteste zuerst" data-label-all="Alle" data-label-filter="Version" data-label-controls="Steuerung">
        <ol class="changelog-entries"><li><span class="version-tag">&lt;img src=x onerror=alert(1)&gt;</span></li></ol>
      </time-index>`);
    await expect(page.locator('[data-timeline-controls]')).toHaveAttribute('aria-label', 'Steuerung');
    await expect(page.locator('[data-timeline-controls] button')).toHaveText('Älteste zuerst');
    await expect(page.locator('[data-timeline-controls] select')).toHaveAttribute('aria-label', 'Version');
    const opts = await page.$$eval('[data-timeline-controls] option', (o) => o.map((x) => x.textContent));
    expect(opts).toEqual(['Alle', '<img src=x onerror=alert(1)>']);
    expect(await page.locator('[data-timeline-controls] img').count()).toBe(0);
  });

  test('updates feed: text only, unsafe links dropped, one feed across reconnects, unique ids', async ({ page }) => {
    const feed = [
      { title: '<img src=x onerror="window.__xss=1">Evil', href: '/ok/' },
      { title: 'Script link', href: 'javascript:window.__xss=2' },
      { title: 'Data link', url: 'data:text/html,hi' },
      { title: 'Good', url: 'https://example.com/a', modified: '2026-01-01' },
      { title: 'Bad date', href: '/b/', modified: '" onmouseover="x' },
    ];
    await load(page, 'time-index', `
      <time-index id="one" updates-src="/__feed.json"><ol class="changelog-entries"><li>x</li></ol></time-index>
      <time-index id="two" updates-src="/__feed.json"><ol class="changelog-entries"><li>y</li></ol></time-index>`,
    { routes: { '/__feed.json': feed } });
    await page.waitForSelector('#one > section[data-recent-pages]');
    await page.waitForSelector('#two > section[data-recent-pages]');
    const r = await page.evaluate(async () => {
      const one = document.getElementById('one');
      for (let i = 0; i < 2; i++) { const p = one.parentNode; const n = one.nextSibling; one.remove(); p.insertBefore(one, n); }
      await new Promise((res) => setTimeout(res, 300));
      const links = [...one.querySelectorAll('.recent-pages a')];
      const ids = [...document.querySelectorAll('section[data-recent-pages] h2')].map((h) => h.id);
      return {
        feeds: one.querySelectorAll(':scope > section[data-recent-pages]').length,
        controls: one.querySelectorAll(':scope > [data-timeline-controls]').length,
        texts: links.map((a) => a.textContent),
        hrefs: links.map((a) => a.getAttribute('href')),
        imgs: one.querySelectorAll('section[data-recent-pages] img').length,
        times: [...one.querySelectorAll('.recent-pages time')].map((t) => t.getAttribute('datetime')),
        ids,
        labelled: one.querySelector('section[data-recent-pages]').getAttribute('aria-labelledby'),
        xss: /** @type {any} */ (window).__xss ?? null,
      };
    });
    expect(r.feeds).toBe(1);
    expect(r.controls).toBe(1);
    expect(r.texts).toEqual(['<img src=x onerror="window.__xss=1">Evil', 'Good', 'Bad date']);
    expect(r.hrefs[0]).toMatch(/^http:\/\/[^/]+\/ok\/$/);
    expect(r.hrefs[1]).toBe('https://example.com/a');
    expect(r.imgs).toBe(0);
    expect(r.times).toEqual(['2026-01-01']);
    expect(new Set(r.ids).size).toBe(2);
    expect(r.labelled).toBe(r.ids[0]);
    expect(r.xss).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/* time-picker                                                         */
/* ------------------------------------------------------------------ */

const FORM = `
  <form id="f">
    <label for="meet">Meeting</label>
    <time-picker id="tp" name="meet" data-format="24h">
      <input type="time" id="meet" value="14:30">
    </time-picker>
    <label for="slot">Slot</label>
    <time-picker id="slot-tp" name="slot" data-format="24h" required>
      <input type="time" id="slot" min="09:00" max="17:00" step="900">
    </time-picker>
    <fieldset id="fs">
      <time-picker id="fs-tp" name="fs" aria-label="Fieldset time" data-format="24h">
        <input type="time" value="08:00">
      </time-picker>
    </fieldset>
    <button type="reset">Reset</button>
  </form>
  <p id="outside" tabindex="0">Outside</p>`;

test.describe('time-picker', () => {
  test('combobox is named by the input label and pops up a dialog', async ({ page }) => {
    await load(page, 'time-picker', FORM);
    const ti = page.locator('#tp .time-input');
    await expect(ti).toHaveAccessibleName('Meeting');
    await expect(ti).toHaveAttribute('aria-haspopup', 'dialog');
    await expect(page.locator('#tp .time-panel')).toHaveAttribute('role', 'dialog');
    await expect(page.locator('#fs-tp .time-input')).toHaveAccessibleName('Fieldset time');
  });

  test('empty value: unset submits nothing, required → valueMissing; clearing works', async ({ page }) => {
    await load(page, 'time-picker', FORM);
    const r = await page.evaluate(() => {
      const slot = /** @type {any} */ (document.getElementById('slot-tp'));
      const tp = /** @type {any} */ (document.getElementById('tp'));
      const fd1 = new FormData(/** @type {HTMLFormElement} */ (document.getElementById('f')));
      const before = { value: slot.value, missing: slot.validity.valueMissing, text: slot.querySelector('.time-input').value, submitted: fd1.get('slot') };
      tp.value = '';
      const fd2 = new FormData(/** @type {HTMLFormElement} */ (document.getElementById('f')));
      return { before, cleared: tp.value, meet: fd2.get('meet'), innerName: document.getElementById('meet').getAttribute('name') };
    });
    expect(r.before).toEqual({ value: '', missing: true, text: '', submitted: null });
    expect(r.cleared).toBe('');
    expect(r.meet).toBeNull();
    expect(r.innerName).toBeNull();

    // Clearing by typing: empty text + Enter.
    await page.locator('#tp .time-input').fill('09:15');
    await page.locator('#tp .time-input').press('Enter');
    expect(await page.evaluate(() => /** @type {any} */ (document.getElementById('tp')).value)).toBe('09:15');
    await page.locator('#tp .time-input').fill('');
    await page.locator('#tp .time-input').press('Enter');
    expect(await page.evaluate(() => /** @type {any} */ (document.getElementById('tp')).value)).toBe('');
  });

  test('min/max/step: typed values flagged, spinners snap and clamp', async ({ page }) => {
    await load(page, 'time-picker', FORM);
    const r = await page.evaluate(() => {
      const slot = /** @type {any} */ (document.getElementById('slot-tp'));
      const flags = () => ({ v: slot.value, under: slot.validity.rangeUnderflow, over: slot.validity.rangeOverflow, step: slot.validity.stepMismatch, valid: slot.validity.valid });
      slot.value = '08:00'; const under = flags();
      slot.value = '18:00'; const over = flags();
      slot.value = '10:07'; const step = flags();
      slot.value = '10:15'; const ok = flags();
      return { under, over, step, ok };
    });
    expect(r.under).toMatchObject({ under: true, valid: false });
    expect(r.over).toMatchObject({ over: true, valid: false });
    expect(r.step).toMatchObject({ step: true, valid: false });
    expect(r.ok).toMatchObject({ valid: true });

    // Spinner from an off-step value snaps to the grid.
    await page.evaluate(() => { /** @type {any} */ (document.getElementById('slot-tp')).value = '10:07'; });
    const minutes = page.locator('#slot-tp .time-spinner[data-unit="minute"]');
    await page.locator('#slot-tp .time-input').press('ArrowDown');
    await minutes.focus();
    await minutes.press('ArrowUp');
    expect(await page.evaluate(() => /** @type {any} */ (document.getElementById('slot-tp')).value)).toBe('10:15');
    // Hours clamp at max.
    const hours = page.locator('#slot-tp .time-spinner[data-unit="hour"]');
    await hours.focus();
    await hours.press('End');
    expect(await page.evaluate(() => /** @type {any} */ (document.getElementById('slot-tp')).value)).toBe('17:00');
    await expect(hours).toHaveAttribute('aria-valuemin', '9');
    await expect(hours).toHaveAttribute('aria-valuemax', '17');
  });

  test('spinning from empty starts at min', async ({ page }) => {
    await load(page, 'time-picker', FORM);
    await page.locator('#slot-tp .time-input').press('ArrowDown');
    const hours = page.locator('#slot-tp .time-spinner[data-unit="hour"]');
    await expect(hours).toHaveAttribute('aria-valuetext', 'Not set');
    await hours.focus();
    await hours.press('ArrowUp');
    expect(await page.evaluate(() => /** @type {any} */ (document.getElementById('slot-tp')).value)).toBe('09:00');
  });

  test('hour-scale step steps the hours spinner; minutes are read-only', async ({ page }) => {
    await load(page, 'time-picker', `
      <time-picker id="h" aria-label="Shift" data-format="24h"><input type="time" value="06:00" step="7200"></time-picker>`);
    await page.locator('#h .time-input').press('ArrowDown');
    const hours = page.locator('#h .time-spinner[data-unit="hour"]');
    await hours.focus();
    await hours.press('ArrowUp');
    expect(await page.evaluate(() => /** @type {any} */ (document.getElementById('h')).value)).toBe('08:00');
    await expect(page.locator('#h .time-spinner[data-unit="minute"]')).toHaveAttribute('aria-readonly', 'true');
  });

  test('every spinner has aria-valuetext; spinners are keyed by unit', async ({ page }) => {
    await load(page, 'time-picker', `
      <time-picker id="s" aria-label="Lap" data-format="12h" data-label-hours="Stunden"><input type="time" value="14:05:09" step="1"></time-picker>`);
    const t = await page.$$eval('#s .time-spinner', (els) => els.map((e) => [e.dataset.unit, e.getAttribute('aria-label'), e.getAttribute('aria-valuetext').replace(/\s/g, ' ')]));
    expect(t).toEqual([
      ['hour', 'Stunden', '2 PM'],
      ['minute', 'Minutes', '5 minutes'],
      ['second', 'Seconds', '9 seconds'],
    ]);
    // Localised label still adjusts the hours.
    await page.locator('#s .time-input').press('ArrowDown');
    await page.locator('#s .time-spinner[data-unit="hour"]').press('ArrowUp');
    expect(await page.evaluate(() => /** @type {any} */ (document.getElementById('s')).value)).toBe('15:05:09');
  });

  test('disabled attribute and disabled fieldset are honoured live', async ({ page }) => {
    await load(page, 'time-picker', FORM);
    const r = await page.evaluate(() => {
      const tp = document.getElementById('tp');
      const fsTp = document.getElementById('fs-tp');
      tp.setAttribute('disabled', '');
      const a = tp.querySelector('.time-input').disabled;
      tp.removeAttribute('disabled');
      const b = tp.querySelector('.time-input').disabled;
      document.getElementById('fs').disabled = true;
      const c = fsTp.querySelector('.time-input').disabled;
      const submitted = new FormData(/** @type {HTMLFormElement} */ (document.getElementById('f'))).get('fs');
      return { a, b, c, submitted };
    });
    expect(r).toEqual({ a: true, b: false, c: true, submitted: null });
  });

  test('focus leaving the component closes the panel', async ({ page }) => {
    await load(page, 'time-picker', FORM);
    await page.locator('#tp .time-input').press('ArrowDown');
    const minutes = page.locator('#tp .time-spinner[data-unit="minute"]');
    await minutes.focus();
    await expect(page.locator('#tp .time-input')).toHaveAttribute('aria-expanded', 'true');
    await page.locator('#outside').focus();
    await expect(page.locator('#tp .time-input')).toHaveAttribute('aria-expanded', 'false');
  });

  test('change fires only on real changes, always with source; reset is silent', async ({ page }) => {
    await load(page, 'time-picker', FORM);
    const r = await page.evaluate(async () => {
      const tp = /** @type {any} */ (document.getElementById('tp'));
      const events = [];
      tp.addEventListener('time-picker:change', (e) => events.push(e.detail));
      tp.value = '14:30';                       // same → no event
      tp.value = '15:00';                       // api
      const ti = tp.querySelector('.time-input');
      ti.focus(); ti.blur();                    // blur without change → no event
      /** @type {HTMLFormElement} */ (document.getElementById('f')).reset();  // silent
      return { events, afterReset: tp.value };
    });
    expect(r.events).toEqual([{ value: '15:00', hours: 15, minutes: 0, seconds: 0, source: 'api' }]);
    expect(r.afterReset).toBe('14:30');
  });

  test('reconnect keeps one UI and the authored reset target', async ({ page }) => {
    await load(page, 'time-picker', FORM);
    const r = await page.evaluate(() => {
      const tp = /** @type {any} */ (document.getElementById('tp'));
      const form = /** @type {HTMLFormElement} */ (document.getElementById('f'));
      tp.value = '11:11';
      for (let i = 0; i < 2; i++) { const n = tp.nextSibling; tp.remove(); form.insertBefore(tp, n); }
      const afterMove = tp.value;
      const ui = [tp.querySelectorAll('.time-trigger').length, tp.querySelectorAll('.time-panel').length];
      form.reset();
      return { afterMove, ui, afterReset: tp.value };
    });
    expect(r).toEqual({ afterMove: '11:11', ui: [1, 1], afterReset: '14:30' });
    // Still interactive after the move.
    await page.evaluate(() => document.querySelector('#tp .time-trigger-icon').click());
    await expect(page.locator('#tp .time-input')).toHaveAttribute('aria-expanded', 'true');
  });

  test('locale period text and order come from Intl (ja: period first)', async ({ page }) => {
    await load(page, 'time-picker', `
      <time-picker id="ja" aria-label="時刻" data-format="12h"><input type="time" value="14:30"></time-picker>`, { lang: 'ja' });
    const r = await page.evaluate(() => {
      const el = document.getElementById('ja');
      const panel = el.querySelector('.time-panel');
      return {
        text: el.querySelector('.time-input').value,
        first: panel.firstElementChild.className,
        period: el.querySelector('.period-toggle').textContent,
      };
    });
    expect(r.text).toContain('午後');
    expect(r.first).toBe('period-toggle');
    expect(r.period).toBe('午後');
    // Typing the localised form parses back.
    await page.locator('#ja .time-input').fill('午前9:05');
    await page.locator('#ja .time-input').press('Enter');
    expect(await page.evaluate(() => /** @type {any} */ (document.getElementById('ja')).value)).toBe('09:05');
  });

  test('12h display uses Intl in en; period button announces state', async ({ page }) => {
    await load(page, 'time-picker', `
      <time-picker id="am" aria-label="Alarm" data-format="12h"><input type="time" value="07:30"></time-picker>`);
    const text = await page.locator('#am .time-input').inputValue();
    expect(text.replace(/\s/g, ' ')).toBe('7:30 AM');
    await expect(page.locator('#am .period-toggle')).toHaveAttribute('aria-label', 'AM/PM: AM');
    await page.evaluate(() => document.querySelector('#am .time-trigger-icon').click());
    await page.locator('#am .period-toggle').click();
    expect(await page.evaluate(() => /** @type {any} */ (document.getElementById('am')).value)).toBe('19:30');
  });
});
