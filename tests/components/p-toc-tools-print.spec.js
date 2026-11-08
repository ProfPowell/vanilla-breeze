/**
 * page-tools / page-toc / print-page — P element review fixes.
 *
 * page-tools: the collapsed popover stays hidden until opened and sits above
 * the FAB; toolbar roving tabindex; focus return only when focus was inside;
 * orientation re-resolves; FAB icon is not parsed as HTML; reduced motion wins.
 * page-toc: reconnect does not double handlers/entries; reduced-motion scroll;
 * heading focus; decoded hashes; data-title; wide-screen summary is not a toggle.
 * print-page: afterprint cleanup registered before print(); labelled group;
 * data-label-raw; hidden in print even in raw mode.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

const MODULES = ['page-tools', 'page-toc', 'print-page'];

async function load(page, body, { hash = '' } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__p3-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <link rel="stylesheet" href="/src/main.css">
      <script type="module">${MODULES.map(m => `import '/src/web-components/${m}/logic.js';`).join('\n')}</script>
      </head><body>${body}</body></html>`,
  }));
  await page.goto(url + hash, { waitUntil: 'load' });
  await page.waitForFunction((names) => names.every(n => customElements.get(n)), MODULES);
}

/* ───────────────────────── page-tools ───────────────────────── */

const TOOLS = `
  <main>
    <input id="outside" aria-label="Outside field">
    <page-tools id="pt" data-position="inline">
      <button type="button" id="t1">One</button>
      <button type="button" id="t2">Two</button>
      <button type="button" id="t3">Three</button>
    </page-tools>
    <p>Body text.</p>
  </main>`;

test.describe('page-tools', () => {
  test('collapsed popover is hidden until opened, then sits above the FAB', async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 800 });
    await load(page, TOOLS);
    await page.waitForSelector('page-tools[data-collapsed]');

    const closed = await page.evaluate(() => {
      const pop = document.querySelector('.page-tools-popover');
      const t1 = document.getElementById('t1');
      return {
        open: pop.matches(':popover-open'),
        display: getComputedStyle(pop).display,
        toolVisible: t1.checkVisibility(),
        inPopover: pop.contains(t1),
      };
    });
    expect(closed).toEqual({ open: false, display: 'none', toolVisible: false, inPopover: true });

    // Not reachable by Tab while closed
    await page.focus('#outside');
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement?.className)).toBe('page-tools-fab');

    await page.click('.page-tools-fab');
    const open = await page.evaluate(() => {
      const pop = document.querySelector('.page-tools-popover');
      const fab = document.querySelector('.page-tools-fab');
      const p = pop.getBoundingClientRect();
      const f = fab.getBoundingClientRect();
      return {
        open: pop.matches(':popover-open'),
        display: getComputedStyle(pop).display,
        toolVisible: document.getElementById('t1').checkVisibility(),
        aboveFab: p.bottom <= f.top,
        endAligned: Math.abs(p.right - f.right) < 2,
        nearFab: f.top - p.bottom < 40,
        notAtOrigin: p.top > 0 && p.left > 0,
        width: p.width,
      };
    });
    expect(open).toMatchObject({
      open: true, display: 'flex', toolVisible: true,
      aboveFab: true, endAligned: true, nearFab: true, notAtOrigin: true,
    });
    expect(open.width).toBeGreaterThan(40);
    expect(await page.getAttribute('page-tools', 'aria-orientation')).toBe('vertical');
  });

  test('Escape from a tool returns focus to the FAB', async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 800 });
    await load(page, TOOLS);
    await page.waitForSelector('page-tools[data-collapsed]');
    await page.click('.page-tools-fab');
    await page.focus('#t2');
    await page.keyboard.press('Escape');
    await expect(page.locator('.page-tools-popover')).not.toBeVisible();
    await expect(page.locator('.page-tools-fab')).toBeFocused();
  });

  test('light dismiss by clicking elsewhere does not steal focus', async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 800 });
    await load(page, TOOLS);
    await page.waitForSelector('page-tools[data-collapsed]');
    await page.click('.page-tools-fab');
    await expect(page.locator('.page-tools-popover')).toBeVisible();
    await page.click('#outside');
    await expect(page.locator('.page-tools-popover')).not.toBeVisible();
    await expect(page.locator('#outside')).toBeFocused();
  });

  test('toolbar roving tabindex with arrows, Home and End', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await load(page, TOOLS);
    await page.waitForFunction(() => document.getElementById('t2').tabIndex === -1);

    expect(await page.getAttribute('page-tools', 'aria-orientation')).toBe('horizontal');
    const tabIndexes = () => page.evaluate(() => ['t1', 't2', 't3'].map(id => document.getElementById(id).tabIndex));
    expect(await tabIndexes()).toEqual([0, -1, -1]);

    await page.focus('#t1');
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#t2')).toBeFocused();
    expect(await tabIndexes()).toEqual([-1, 0, -1]);
    await page.keyboard.press('End');
    await expect(page.locator('#t3')).toBeFocused();
    await page.keyboard.press('ArrowRight'); // wraps
    await expect(page.locator('#t1')).toBeFocused();
    await page.keyboard.press('ArrowLeft'); // wraps back
    await expect(page.locator('#t3')).toBeFocused();
    await page.keyboard.press('Home');
    await expect(page.locator('#t1')).toBeFocused();
    await page.keyboard.press('ArrowDown'); // wrong axis for horizontal
    await expect(page.locator('#t1')).toBeFocused();

    // Tab leaves the toolbar in one stop
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement?.closest('page-tools'))).toBeNull();
  });

  test('orientation re-resolves when data-orientation / data-position change', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await load(page, TOOLS);
    await page.waitForSelector('page-tools[data-upgraded]');
    const read = () => page.evaluate(() => {
      const pt = document.getElementById('pt');
      return [pt.dataset.resolvedOrientation, pt.getAttribute('aria-orientation')];
    });
    expect(await read()).toEqual(['horizontal', 'horizontal']);
    await page.evaluate(() => { document.getElementById('pt').dataset.position = 'sticky'; });
    expect(await read()).toEqual(['vertical', 'vertical']);
    await page.evaluate(() => { document.getElementById('pt').dataset.orientation = 'horizontal'; });
    expect(await read()).toEqual(['horizontal', 'horizontal']);
  });

  test('data-fab-icon is set as an attribute, never parsed as HTML', async ({ page }) => {
    await load(page, `<page-tools data-fab-icon='x"><img id="pwn" src="data:,">'><button type="button">A</button></page-tools>`);
    await page.waitForSelector('page-tools[data-upgraded]');
    const r = await page.evaluate(() => ({
      img: !!document.getElementById('pwn'),
      name: document.querySelector('.page-tools-fab icon-wc')?.getAttribute('name'),
    }));
    expect(r).toEqual({ img: false, name: 'x"><img id="pwn" src="data:,">' });
  });

  test('reduced motion removes tool-button transitions', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1200, height: 800 });
    await load(page, `<page-tools><print-page>Print</print-page></page-tools>`);
    await page.waitForSelector('page-tools .print-trigger');
    const duration = await page.evaluate(() =>
      getComputedStyle(document.querySelector('page-tools .print-trigger')).transitionDuration);
    expect(duration.split(',').every(d => parseFloat(d) === 0)).toBe(true);
  });

  test('reconnect restores tools and builds one FAB and popover', async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 800 });
    await load(page, TOOLS);
    await page.waitForSelector('page-tools[data-collapsed]');
    const r = await page.evaluate(() => {
      const pt = document.getElementById('pt');
      const parent = pt.parentElement;
      for (let i = 0; i < 2; i++) { pt.remove(); parent.append(pt); }
      return {
        fabs: pt.querySelectorAll('.page-tools-fab').length,
        pops: pt.querySelectorAll('.page-tools-popover').length,
        tools: /** @type {any} */ (pt).tools.map(t => t.id),
      };
    });
    expect(r).toEqual({ fabs: 1, pops: 1, tools: ['t1', 't2', 't3'] });
  });
});

/* ───────────────────────── page-toc ───────────────────────── */

const TOC = `
  <page-toc id="toc" levels="h2,h3" scope="article" data-title="Contents"></page-toc>
  <article>
    <h2 id="one">One</h2><p style="block-size:120vh">Text</p>
    <h3 id="one-a">One A</h3><p style="block-size:120vh">Text</p>
    <h2 id="café">Café</h2><p style="block-size:120vh">Text</p>
  </article>`;

test.describe('page-toc', () => {
  test('reconnect does not double entries, handlers or history entries', async ({ page }) => {
    await load(page, TOC);
    await page.waitForSelector('page-toc .details');
    const r = await page.evaluate(async () => {
      const toc = /** @type {any} */ (document.getElementById('toc'));
      const before = toc.entries.length;
      for (let i = 0; i < 2; i++) { toc.remove(); document.body.prepend(toc); }
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      let events = 0;
      toc.addEventListener('page-toc:navigate', () => events++);
      const historyBefore = history.length;
      toc.querySelector('a[href="#one"]').click();
      return {
        before,
        after: toc.entries.length,
        details: toc.querySelectorAll('details').length,
        events,
        pushes: history.length - historyBefore,
      };
    });
    expect(r).toEqual({ before: 3, after: 3, details: 1, events: 1, pushes: 1 });
  });

  test('refresh() rebuilds once', async ({ page }) => {
    await load(page, TOC);
    await page.waitForSelector('page-toc .details');
    const r = await page.evaluate(() => {
      const toc = /** @type {any} */ (document.getElementById('toc'));
      toc.refresh(); toc.refresh();
      return { details: toc.querySelectorAll('details').length, entries: toc.entries.length };
    });
    expect(r).toEqual({ details: 1, entries: 3 });
  });

  test('manual markup reconnect keeps one handler per link', async ({ page }) => {
    await load(page, `
      <page-toc id="toc">
        <details class="details" open><summary class="summary">On this page</summary>
          <nav class="nav" aria-label="On this page"><ul class="list">
            <li class="item"><a href="#one" class="link">One</a></li>
            <li class="item"><a href="#two" class="link">Two</a></li>
          </ul></nav></details>
      </page-toc>
      <article><h2 id="one">One</h2><p>x</p><h2 id="two">Two</h2><p>y</p></article>`);
    await page.waitForFunction(() => /** @type {any} */ (document.getElementById('toc')).entries.length === 2);
    const r = await page.evaluate(async () => {
      const toc = /** @type {any} */ (document.getElementById('toc'));
      toc.remove(); document.body.prepend(toc);
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      let events = 0;
      toc.addEventListener('page-toc:navigate', () => events++);
      toc.querySelector('a[href="#two"]').click();
      return { entries: toc.entries.length, events, details: toc.querySelectorAll('details').length };
    });
    expect(r).toEqual({ entries: 2, events: 1, details: 1 });
  });

  test('click focuses the heading, marks the link current and sends { id }', async ({ page }) => {
    await load(page, TOC);
    await page.waitForSelector('page-toc .details');
    const r = await page.evaluate(() => {
      const toc = document.getElementById('toc');
      /** @type {any} */
      let detail = null;
      toc.addEventListener('page-toc:navigate', (e) => { detail = /** @type {CustomEvent} */ (e).detail; });
      toc.querySelector('a[href="#one-a"]').click();
      const h = document.getElementById('one-a');
      return {
        detail,
        focused: document.activeElement === h,
        tabindex: h.getAttribute('tabindex'),
        current: toc.querySelector('a[href="#one-a"]').getAttribute('aria-current'),
        hash: location.hash,
      };
    });
    expect(r).toEqual({ detail: { id: 'one-a' }, focused: true, tabindex: '-1', current: 'true', hash: '#one-a' });
  });

  test('reduced motion scrolls without smooth behaviour', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await load(page, TOC);
    await page.waitForSelector('page-toc .details');
    const behavior = await page.evaluate(() => {
      /** @type {any} */
      let opts = null;
      const orig = Element.prototype.scrollIntoView;
      Element.prototype.scrollIntoView = function (o) { opts = o; return orig.call(this, o); };
      document.querySelector('page-toc a[href="#one-a"]').dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      return opts?.behavior;
    });
    expect(behavior).toBe('auto');
  });

  test('percent-encoded hash activates the matching link', async ({ page }) => {
    // Silence scroll-spy so only hash sync can set the active link
    await page.addInitScript(() => {
      window.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } };
    });
    await load(page, TOC, { hash: '#caf%C3%A9' });
    await page.waitForSelector('page-toc .details');
    await expect(page.locator('page-toc a[aria-current="true"]')).toHaveText('Café');
  });

  test('data-title labels the ToC; no global title tooltip', async ({ page }) => {
    await load(page, TOC);
    await page.waitForSelector('page-toc .details');
    const r = await page.evaluate(() => ({
      summary: document.querySelector('page-toc .summary').textContent,
      label: document.querySelector('page-toc nav').getAttribute('aria-label'),
      title: document.getElementById('toc').hasAttribute('title'),
    }));
    expect(r).toEqual({ summary: 'Contents', label: 'Contents', title: false });
  });

  test('wide screens: summary click does not collapse the ToC; narrow screens: it does', async ({ page }) => {
    await page.setViewportSize({ width: 1300, height: 800 });
    await load(page, TOC);
    await page.waitForSelector('page-toc .details');
    await page.click('page-toc .summary');
    expect(await page.evaluate(() => document.querySelector('page-toc details').open)).toBe(true);

    await page.setViewportSize({ width: 600, height: 800 });
    await page.click('page-toc .summary');
    expect(await page.evaluate(() => document.querySelector('page-toc details').open)).toBe(false);
  });

  test('RTL: active link rounds the end edge only (logical radii)', async ({ page }) => {
    await page.setViewportSize({ width: 1300, height: 800 });
    await load(page, `<section dir="rtl">${TOC}</section>`);
    await page.waitForSelector('page-toc .details');
    const r = await page.evaluate(() => {
      const cs = getComputedStyle(document.querySelector('page-toc .link'));
      return { tl: cs.borderTopLeftRadius, tr: cs.borderTopRightRadius };
    });
    // RTL: start (border) edge is on the right → square; end edge (left) is rounded
    expect(r.tr).toBe('0px');
    expect(r.tl).not.toBe('0px');
  });
});

/* ───────────────────────── print-page ───────────────────────── */

test.describe('print-page (working tree)', () => {
  test('raw mode clears data-print-raw via afterprint fired inside print()', async ({ page }) => {
    await load(page, `<print-page raw-toggle>Print</print-page>`);
    await page.waitForSelector('print-page .print-trigger');
    const r = await page.evaluate(() => {
      let rawDuringPrint = false;
      // Model Chromium: print() blocks and fires afterprint before returning
      window.print = () => {
        rawDuringPrint = document.documentElement.hasAttribute('data-print-raw');
        window.dispatchEvent(new Event('afterprint'));
      };
      /** @type {HTMLInputElement} */ (document.querySelector('print-page input')).checked = true;
      /** @type {HTMLButtonElement} */ (document.querySelector('print-page .print-trigger')).click();
      return { rawDuringPrint, rawAfter: document.documentElement.hasAttribute('data-print-raw') };
    });
    expect(r).toEqual({ rawDuringPrint: true, rawAfter: false });
  });

  test('raw-toggle group is labelled; checkbox text is configurable', async ({ page }) => {
    await load(page, `<print-page raw-toggle data-label-raw="Ohne VB-Stile drucken">Seite drucken</print-page>`);
    await page.waitForSelector('print-page .print-trigger');
    const r = await page.evaluate(() => {
      const el = document.querySelector('print-page');
      return { role: el.getAttribute('role'), label: el.getAttribute('aria-label'), raw: el.querySelector('label').textContent };
    });
    expect(r).toEqual({ role: 'group', label: 'Seite drucken', raw: 'Ohne VB-Stile drucken' });
  });

  test('default variant is icon-only with the label as accessible name', async ({ page }) => {
    await load(page, `<print-page>Print this page</print-page>`);
    await page.waitForSelector('print-page .print-trigger');
    const r = await page.evaluate(() => {
      const b = document.querySelector('print-page .print-trigger');
      return { label: b.getAttribute('aria-label'), text: b.textContent.trim(), icon: !!b.querySelector('icon-wc') };
    });
    expect(r).toEqual({ label: 'Print this page', text: '', icon: true });
  });

  test('hidden in print media even in raw mode', async ({ page }) => {
    await load(page, `<print-page raw-toggle>Print</print-page>`);
    await page.waitForSelector('print-page .print-trigger');
    await page.evaluate(() => document.documentElement.setAttribute('data-print-raw', ''));
    await page.emulateMedia({ media: 'print' });
    expect(await page.evaluate(() => getComputedStyle(document.querySelector('print-page')).display)).toBe('none');
  });
});
