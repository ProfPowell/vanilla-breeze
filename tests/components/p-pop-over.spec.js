/**
 * pop-over — P-review fixes.
 *
 * Covers: default position-area bottom; anchor-name shared as a list
 * between pop-overs on one anchor (teardown removes only its own name);
 * observed data-mode / data-anchor / data-position; manual no-anchor
 * centring; authored [popover] works before definition; counter-based
 * anchor ident for ids with odd characters; JS fallback measured after
 * show with flip + viewport clamp; event detail.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

async function load(page, body, { dir = 'ltr', script = true, noAnchor = false } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  if (noAnchor) {
    /* Simulate a browser without CSS anchor positioning: the component
       feature-detects through CSS.supports at module load. */
    await page.addInitScript(() => {
      const orig = CSS.supports.bind(CSS);
      CSS.supports = (/** @type {any} */ a, /** @type {any} */ b) =>
        (typeof a === 'string' && /anchor|position-area/.test(a)) ? false : orig(a, b);
    });
  }
  const url = `/__pop-over-${Math.random().toString(36).slice(2)}.html`;
  const mod = script ? `<script type="module">import '/src/web-components/pop-over/logic.js';</script>` : '';
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en" dir="${dir}"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">${mod}
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  if (script) {
    await page.waitForFunction(() => customElements.get('pop-over'));
    await page.waitForSelector('pop-over[data-upgraded]', { state: 'attached' });
  }
}

/** Rects of the popover and its anchor after opening. */
async function openAndMeasure(page, popId, anchorId) {
  return page.evaluate(([p, a]) => {
    const pop = /** @type {any} */ (document.getElementById(p));
    pop.show();
    const pr = pop.getBoundingClientRect();
    const ar = document.getElementById(a).getBoundingClientRect();
    return {
      pop: { top: pr.top, bottom: pr.bottom, left: pr.left, right: pr.right, width: pr.width, height: pr.height },
      anchor: { top: ar.top, bottom: ar.bottom, left: ar.left, right: ar.right },
      vw: document.documentElement.clientWidth,
      vh: document.documentElement.clientHeight,
    };
  }, [popId, anchorId]);
}

test('no data-position defaults to bottom, centred under the anchor', async ({ page }) => {
  await load(page, `
    <p><button id="t" popovertarget="p" style="margin-inline-start: 120px">Trigger</button></p>
    <pop-over id="p"><p>Default</p></pop-over>`);
  const m = await openAndMeasure(page, 'p', 't');
  expect(m.pop.top).toBeGreaterThanOrEqual(m.anchor.bottom);
  expect(m.pop.top - m.anchor.bottom).toBeLessThan(20);
  const popCentre = (m.pop.left + m.pop.right) / 2;
  const anchorCentre = (m.anchor.left + m.anchor.right) / 2;
  expect(Math.abs(popCentre - anchorCentre)).toBeLessThan(2);
  expect(await page.$eval('#p', (el) => getComputedStyle(el).positionArea)).not.toBe('none');
});

test('two pop-overs on one anchor share its anchor-name list', async ({ page }) => {
  await load(page, `
    <p><button id="t" style="margin-inline-start: 200px; margin-block-start: 200px">Trigger</button></p>
    <pop-over id="a" data-anchor="t" data-mode="manual" data-position="bottom"><p>A</p></pop-over>
    <pop-over id="b" data-anchor="t" data-mode="manual" data-position="top"><p>B</p></pop-over>`);
  const names = await page.$eval('#t', (el) => el.style.getPropertyValue('anchor-name'));
  const a = await page.$eval('#a', (el) => el.dataset.anchorName);
  const b = await page.$eval('#b', (el) => el.dataset.anchorName);
  expect(a).not.toBe(b);
  expect(names.split(',').map((s) => s.trim())).toEqual([a, b]);

  const ma = await openAndMeasure(page, 'a', 't');
  const mb = await openAndMeasure(page, 'b', 't');
  expect(ma.pop.top).toBeGreaterThanOrEqual(ma.anchor.bottom);
  expect(mb.pop.bottom).toBeLessThanOrEqual(mb.anchor.top + 1);

  // Removing B leaves only A's name; reconnecting A doesn't duplicate it.
  const after = await page.evaluate(() => {
    const t = document.getElementById('t');
    document.getElementById('b').remove();
    const one = t.style.getPropertyValue('anchor-name');
    const a = document.getElementById('a');
    a.remove(); document.querySelector('main').append(a);
    return { one, two: t.style.getPropertyValue('anchor-name') };
  });
  expect(after.one).toBe(a);
  expect(after.two).toBe(a);
});

test('disconnect clears the anchor-name and output attribute', async ({ page }) => {
  await load(page, `
    <button id="t" popovertarget="p">Trigger</button>
    <pop-over id="p"><p>x</p></pop-over>`);
  const r = await page.evaluate(() => {
    const p = document.getElementById('p');
    p.remove();
    return {
      anchorName: document.getElementById('t').style.getPropertyValue('anchor-name'),
      out: p.hasAttribute('data-anchor-name'),
      posAnchor: p.style.getPropertyValue('position-anchor'),
    };
  });
  expect(r).toEqual({ anchorName: '', out: false, posAnchor: '' });
});

test('data-mode changes after upgrade update the popover type', async ({ page }) => {
  await load(page, `<pop-over id="p"><p>x</p></pop-over>`);
  const modes = await page.evaluate(() => {
    const p = document.getElementById('p');
    const out = [p.getAttribute('popover')];
    p.dataset.mode = 'manual'; out.push(p.getAttribute('popover'));
    p.dataset.mode = 'hint'; out.push(p.getAttribute('popover'));
    p.dataset.mode = 'bogus'; out.push(p.getAttribute('popover'));
    return out;
  });
  const hint = await page.evaluate(() => {
    const s = document.createElement('span'); s.setAttribute('popover', 'hint');
    return /** @type {any} */ (s).popover === 'hint' ? 'hint' : 'auto';
  });
  expect(modes).toEqual(['auto', 'manual', hint, 'auto']);
});

test('an authored popover attribute wins over data-mode at upgrade', async ({ page }) => {
  await load(page, `<pop-over id="p" popover="manual" data-mode="auto"><p>x</p></pop-over>`);
  expect(await page.$eval('#p', (el) => el.getAttribute('popover'))).toBe('manual');
});

test('data-anchor and data-position changes re-wire the anchor', async ({ page }) => {
  await load(page, `
    <p><button id="t1" style="margin-block-start: 200px">One</button>
       <button id="t2" style="margin-inline-start: 200px">Two</button></p>
    <pop-over id="p" data-mode="manual" data-anchor="t1"><p>x</p></pop-over>`);
  const r = await page.evaluate(() => {
    const p = document.getElementById('p');
    const name = p.dataset.anchorName;
    p.dataset.anchor = 't2';
    return {
      t1: document.getElementById('t1').style.getPropertyValue('anchor-name'),
      t2: document.getElementById('t2').style.getPropertyValue('anchor-name'),
      name, now: p.dataset.anchorName,
    };
  });
  expect(r.t1).toBe('');
  expect(r.t2).toBe(r.name);
  expect(r.now).toBe(r.name);

  const below = await openAndMeasure(page, 'p', 't2');
  expect(below.pop.top).toBeGreaterThanOrEqual(below.anchor.bottom);
  await page.evaluate(() => {
    const p = /** @type {any} */ (document.getElementById('p'));
    p.hide();
    p.dataset.anchor = 't1';
    p.dataset.position = 'top';
  });
  const above = await openAndMeasure(page, 'p', 't1');
  expect(above.pop.bottom).toBeLessThanOrEqual(above.anchor.top + 1);
});

test('manual pop-over without an anchor stays centred', async ({ page }) => {
  await load(page, `<pop-over id="p" data-mode="manual"><p>Centred content</p></pop-over>`);
  const m = await page.evaluate(() => {
    const p = /** @type {any} */ (document.getElementById('p'));
    p.show();
    const r = p.getBoundingClientRect();
    return { cx: (r.left + r.right) / 2, cy: (r.top + r.bottom) / 2,
      vw: document.documentElement.clientWidth, vh: document.documentElement.clientHeight };
  });
  expect(Math.abs(m.cx - m.vw / 2)).toBeLessThan(2);
  expect(Math.abs(m.cy - m.vh / 2)).toBeLessThan(2);
});

test('authored [popover] opens without script', async ({ page }) => {
  await load(page, `
    <button id="t" popovertarget="p">Open</button>
    <pop-over id="p" popover><p>No script</p></pop-over>`, { script: false });
  expect(await page.$eval('#p', (el) => getComputedStyle(el).display)).toBe('none');
  await page.click('#t');
  await expect(page.locator('#p')).toBeVisible();
});

test('script-only host stays hidden before definition', async ({ page }) => {
  await load(page, `<pop-over id="p"><p>Hidden</p></pop-over>`, { script: false });
  await expect(page.locator('#p')).toBeHidden();
});

test('ids with odd characters still get a valid anchor ident', async ({ page }) => {
  await load(page, `
    <p><button id="t" popovertarget="a.b:c d" style="margin-inline-start: 300px">Trigger</button></p>
    <pop-over id="a.b:c d"><p>Odd id</p></pop-over>`);
  const r = await page.evaluate(() => {
    const p = document.querySelector('pop-over');
    return {
      name: p.dataset.anchorName,
      posAnchor: getComputedStyle(p).getPropertyValue('position-anchor'),
      anchorName: getComputedStyle(document.getElementById('t')).getPropertyValue('anchor-name'),
    };
  });
  expect(r.name).toMatch(/^--pop-over-anchor-\d+$/);
  expect(r.posAnchor).toBe(r.name);
  expect(r.anchorName).toBe(r.name);
  const m = await page.evaluate(() => {
    const p = /** @type {any} */ (document.querySelector('pop-over'));
    p.show();
    const pr = p.getBoundingClientRect();
    const ar = document.getElementById('t').getBoundingClientRect();
    return { top: pr.top, anchorBottom: ar.bottom };
  });
  expect(m.top).toBeGreaterThanOrEqual(m.anchorBottom);
});

test('events carry detail.state', async ({ page }) => {
  await load(page, `<button id="t" popovertarget="p">T</button><pop-over id="p"><p>x</p></pop-over>`);
  const states = await page.evaluate(() => {
    const out = [];
    document.addEventListener('pop-over:show', (e) => out.push(['show', /** @type {any} */ (e).detail.state]));
    document.addEventListener('pop-over:hide', (e) => out.push(['hide', /** @type {any} */ (e).detail.state]));
    const p = /** @type {any} */ (document.getElementById('p'));
    p.show(); p.toggle();
    return out;
  });
  expect(states).toEqual([['show', 'open'], ['hide', 'closed']]);
});

test.describe('JS fallback (no anchor positioning)', () => {
  test('popovertarget open is placed before the next frame', async ({ page }) => {
    await load(page, `
      <p><button id="t" popovertarget="p" style="margin-block-start: 300px; margin-inline-start: 100px">T</button></p>
      <pop-over id="p" data-position="top"><p>Several lines</p><p>of content</p></pop-over>`,
    { noAnchor: true });
    await page.click('#t');
    const m = await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => {
      const pr = document.getElementById('p').getBoundingClientRect();
      const ar = document.getElementById('t').getBoundingClientRect();
      resolve({ bottom: pr.bottom, height: pr.height, anchorTop: ar.top });
    })));
    expect(m.height).toBeGreaterThan(20);
    expect(m.bottom).toBeLessThanOrEqual(m.anchorTop);
  });

  test('top placement is measured after show and does not overlap', async ({ page }) => {
    await load(page, `
      <p><button id="t" popovertarget="p" style="margin-block-start: 300px; margin-inline-start: 200px">T</button></p>
      <pop-over id="p" data-position="top"><p>Several lines of content</p><p>to give it height</p></pop-over>`,
    { noAnchor: true });
    expect(await page.$eval('#p', (el) => el.hasAttribute('data-anchor-name'))).toBe(false);
    const m = await openAndMeasure(page, 'p', 't');
    expect(m.pop.height).toBeGreaterThan(20);
    expect(m.pop.bottom).toBeLessThanOrEqual(m.anchor.top);
  });

  test('bottom-end aligns the end edge to the anchor', async ({ page }) => {
    await load(page, `
      <p><button id="t" popovertarget="p" style="margin-inline-start: 200px">Trigger</button></p>
      <pop-over id="p" data-position="bottom-end"><p>Wider content</p></pop-over>`,
    { noAnchor: true });
    const m = await openAndMeasure(page, 'p', 't');
    expect(Math.abs(m.pop.right - m.anchor.right)).toBeLessThan(2);
    expect(m.pop.top).toBeGreaterThanOrEqual(m.anchor.bottom);
  });

  test('flips and clamps into the viewport', async ({ page }) => {
    await page.setViewportSize({ width: 600, height: 400 });
    await load(page, `
      <p><button id="t" popovertarget="p" style="position: fixed; inset-block-start: 4px; inset-inline-end: 4px">T</button></p>
      <pop-over id="p" data-position="top-start"><p>Content that is wider than the trigger</p></pop-over>`,
    { noAnchor: true });
    const m = await openAndMeasure(page, 'p', 't');
    // No room above → flipped below; would hang off the right → clamped.
    expect(m.pop.top).toBeGreaterThanOrEqual(m.anchor.bottom);
    expect(m.pop.right).toBeLessThanOrEqual(m.vw);
    expect(m.pop.left).toBeGreaterThanOrEqual(0);
  });
});
