/**
 * tab-set — T-review fixes.
 *
 * Covers: one tab-set:change per activation (opening tab only, with
 * previousIndex/tab/panel, none during setup); per-instance <details> names
 * (the .tabs setter and two sets sharing an authored name); RTL arrow
 * mirroring; data-orientation="vertical" layout + Up/Down keys; many-tab
 * wrapping without sideways overflow; role="group" only when labelled;
 * every panel printed; forced-colors selected cue; summary-less <details>.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

async function load(page, body, { dir = 'ltr', css = '' } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__tab-set-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en" dir="${dir}"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">${css ? `<style>${css}</style>` : ''}
      <script type="module">import '/src/web-components/tab-set/logic.js';</script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => customElements.get('tab-set'));
  if (body.includes('<tab-set')) await page.waitForSelector('tab-set[data-upgraded]', { state: 'attached' });
}

const tabsHtml = (attrs = '', name = 'demo', n = 3, open = 0) => `
  <tab-set ${attrs}>
    ${Array.from({ length: n }, (_, i) => `
    <details name="${name}"${i === open ? ' open' : ''}>
      <summary>Tab ${i + 1}</summary>
      <section><p>Panel ${i + 1}</p></section>
    </details>`).join('')}
  </tab-set>`;

/** Record tab-set:change events on the first tab-set. */
async function record(page) {
  await page.evaluate(() => {
    window.__changes = [];
    document.querySelector('tab-set').addEventListener('tab-set:change', (e) => {
      const ts = e.currentTarget;
      const details = [...ts.querySelectorAll(':scope > details')];
      window.__changes.push({
        index: e.detail.index,
        previousIndex: e.detail.previousIndex,
        tabOk: e.detail.tab === details[e.detail.index],
        panelOk: e.detail.panel === details[e.detail.index].querySelector('section'),
      });
    });
  });
}
const changes = (page) => page.evaluate(() => window.__changes);
const settle = (page) => page.evaluate(() => new Promise((r) => setTimeout(r, 120)));

test.describe('tab-set:change contract', () => {
  test('click fires exactly once, from the opening tab, with previousIndex/tab/panel', async ({ page }) => {
    await load(page, tabsHtml('aria-label="Demo"'));
    await record(page);
    await page.locator('summary').nth(1).click();
    await settle(page);
    expect(await changes(page)).toEqual([{ index: 1, previousIndex: 0, tabOk: true, panelOk: true }]);
  });

  test('arrow key fires exactly once', async ({ page }) => {
    await load(page, tabsHtml());
    await page.locator('summary').nth(1).click();
    await settle(page);
    await record(page);
    await page.keyboard.press('ArrowRight');
    await settle(page);
    expect(await changes(page)).toEqual([{ index: 2, previousIndex: 1, tabOk: true, panelOk: true }]);
  });

  test('clicking the active tab fires nothing', async ({ page }) => {
    await load(page, tabsHtml());
    await record(page);
    await page.locator('summary').first().click();
    await settle(page);
    expect(await changes(page)).toEqual([]);
  });

  test('no event during setup, even when setup opens the first tab', async ({ page }) => {
    await load(page, '<p id="host"></p>');
    const fired = await page.evaluate(async () => {
      const events = [];
      document.addEventListener('tab-set:change', (e) => events.push(e.detail.index));
      const ts = document.createElement('tab-set');
      ts.innerHTML = '<details><summary>A</summary><section>a</section></details>'
        + '<details><summary>B</summary><section>b</section></details>';
      document.getElementById('host').append(ts);
      await new Promise((r) => setTimeout(r, 150));
      return { events, open: ts.querySelector('details').open };
    });
    expect(fired).toEqual({ events: [], open: true });
  });

  test('reconnect keeps a single event per activation', async ({ page }) => {
    await load(page, tabsHtml());
    await page.evaluate(() => {
      const ts = document.querySelector('tab-set');
      const p = ts.parentElement;
      for (let i = 0; i < 3; i++) { ts.remove(); p.append(ts); }
    });
    await record(page);
    await page.locator('summary').nth(2).click();
    await settle(page);
    expect(await changes(page)).toEqual([{ index: 2, previousIndex: 0, tabOk: true, panelOk: true }]);
  });
});

test.describe('exclusivity (per-instance names)', () => {
  test('.tabs setter output stays exclusive after a click; panels are <section>', async ({ page }) => {
    await load(page, tabsHtml());
    await page.evaluate(() => {
      document.querySelector('tab-set').tabs = [
        { label: 'One', content: 'A' }, { label: 'Two', content: 'B' }, { label: 'Three', content: 'C' },
      ];
    });
    await page.locator('summary').nth(1).click();
    await settle(page);
    const r = await page.evaluate(() => {
      const d = [...document.querySelectorAll('tab-set > details')];
      return {
        open: d.map((x) => x.open),
        names: new Set(d.map((x) => x.getAttribute('name'))).size,
        named: d.every((x) => x.getAttribute('name')),
        panels: d.map((x) => x.lastElementChild.localName),
      };
    });
    expect(r).toEqual({ open: [false, true, false], names: 1, named: true, panels: ['section', 'section', 'section'] });
  });

  test('two tab-sets that share an authored name do not close each other', async ({ page }) => {
    await load(page, tabsHtml('id="a"', 'shared') + tabsHtml('id="b"', 'shared'));
    await page.locator('#a summary').nth(1).click();
    await page.locator('#b summary').nth(2).click();
    await settle(page);
    const r = await page.evaluate(() => ['a', 'b'].map((id) =>
      [...document.querySelectorAll(`#${id} > details`)].map((d) => d.open)));
    expect(r).toEqual([[false, true, false], [false, false, true]]);
  });

  test('a unique authored name is kept', async ({ page }) => {
    await load(page, tabsHtml('', 'mine'));
    const names = await page.evaluate(() =>
      [...document.querySelectorAll('tab-set > details')].map((d) => d.getAttribute('name')));
    expect(names).toEqual(['mine', 'mine', 'mine']);
  });
});

test.describe('keyboard', () => {
  test('RTL mirrors the arrows (ArrowLeft = next)', async ({ page }) => {
    await load(page, tabsHtml(), { dir: 'rtl' });
    const s = page.locator('summary');
    await s.first().focus();
    await page.keyboard.press('ArrowLeft');
    await expect(s.nth(1)).toBeFocused();
    await expect(page.locator('details').nth(1)).toHaveAttribute('open', '');
    await page.keyboard.press('ArrowRight');
    await expect(s.first()).toBeFocused();
  });

  test('LTR horizontal ignores ArrowDown (page can scroll)', async ({ page }) => {
    await load(page, tabsHtml());
    await page.locator('summary').first().focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('summary').first()).toBeFocused();
  });
});

test.describe('data-orientation="vertical"', () => {
  test('tabs stack in one column with the panel beside them; Up/Down move', async ({ page }) => {
    await load(page, tabsHtml('data-orientation="vertical" aria-label="Settings"'));
    const m = await page.evaluate(() => {
      const ts = document.querySelector('tab-set');
      const sums = [...ts.querySelectorAll('summary')].map((s) => s.getBoundingClientRect());
      const panel = ts.querySelector('details[open] > section').getBoundingClientRect();
      return { lefts: sums.map((r) => Math.round(r.left)), tops: sums.map((r) => Math.round(r.top)),
        sumRight: Math.max(...sums.map((r) => r.right)), panelLeft: panel.left, panelTop: panel.top, firstTop: sums[0].top };
    });
    expect(new Set(m.lefts).size).toBe(1);
    expect(m.tops[1]).toBeGreaterThan(m.tops[0]);
    expect(m.tops[2]).toBeGreaterThan(m.tops[1]);
    expect(m.panelLeft).toBeGreaterThanOrEqual(m.sumRight - 2);
    expect(Math.abs(m.panelTop - m.firstTop)).toBeLessThan(2);

    const s = page.locator('summary');
    await s.first().focus();
    await page.keyboard.press('ArrowDown');
    await expect(s.nth(1)).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await expect(s.first()).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await expect(s.nth(2)).toBeFocused();
    await expect(page.locator('details').nth(2)).toHaveAttribute('open', '');
  });
});

test.describe('layout', () => {
  test('many tabs wrap instead of overflowing a narrow container', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 700 });
    await load(page, tabsHtml('', 'many', 8), { css: 'main { padding: 0 }' });
    const m = await page.evaluate(() => {
      const ts = document.querySelector('tab-set');
      const sizes = [...ts.querySelectorAll(':scope > details')].map((d) => {
        const r = d.querySelector('section').getBoundingClientRect();
        return { open: d.open, area: r.width * r.height, w: r.width };
      });
      return { sw: ts.scrollWidth, cw: ts.clientWidth, doc: document.documentElement.scrollWidth, sizes, host: ts.clientWidth };
    });
    expect(m.sw).toBeLessThanOrEqual(m.cw + 1);
    expect(m.doc).toBeLessThanOrEqual(360);
    for (const s of m.sizes) {
      if (s.open) expect(s.w).toBeGreaterThan(m.host - 2);
      else expect(s.area).toBe(0);
    }
  });

  test('closed panels stay hidden under an unlayered author display rule', async ({ page }) => {
    await load(page, tabsHtml(), { css: 'tab-set > details > :not(summary) { display: grid; }' });
    const sizes = await page.evaluate(() => [...document.querySelectorAll('tab-set > details')].map((d) => {
      const r = d.querySelector('section').getBoundingClientRect();
      return { open: d.open, area: r.width * r.height };
    }));
    for (const s of sizes) {
      if (s.open) expect(s.area).toBeGreaterThan(0);
      else expect(s.area).toBe(0);
    }
  });

  test('print shows every panel under its tab label', async ({ page }) => {
    await load(page, tabsHtml());
    await page.emulateMedia({ media: 'print' });
    const r = await page.evaluate(() => [...document.querySelectorAll('tab-set > details')].map((d) => {
      const s = d.querySelector('summary').getBoundingClientRect();
      const p = d.querySelector('section').getBoundingClientRect();
      return { visible: p.height > 0, below: p.top >= s.bottom - 1 };
    }));
    expect(r).toEqual(Array(3).fill({ visible: true, below: true }));
  });
});

test.describe('a11y', () => {
  test('host gets role="group" only when labelled; removed on teardown', async ({ page }) => {
    await load(page, tabsHtml('id="l" aria-label="Labelled"') + tabsHtml('id="u"', 'u') + tabsHtml('id="r" role="region" aria-label="Own role"', 'r'));
    const r = await page.evaluate(() => {
      const roles = ['l', 'u', 'r'].map((id) => document.getElementById(id).getAttribute('role'));
      const l = document.getElementById('l');
      l.remove();
      const detached = l.getAttribute('role');
      document.querySelector('main').append(l);
      return { roles, detached, back: l.getAttribute('role') };
    });
    expect(r).toEqual({ roles: ['group', null, 'region'], detached: null, back: 'group' });
    const summaryRole = await page.locator('#l summary').first().getAttribute('role');
    expect(summaryRole).toBeNull();
  });

  test('forced colors keeps a visible selected cue', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await load(page, tabsHtml());
    const c = await page.evaluate(() => [...document.querySelectorAll('tab-set summary')]
      .map((s) => getComputedStyle(s).borderBlockEndColor));
    expect(c[0]).not.toBe(c[1]);
    expect(c[0]).not.toMatch(/rgba\(0, 0, 0, 0\)|transparent/);
  });

  test('a <details> without <summary> does not throw on toggle', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await load(page, `<tab-set>
      <details name="x" open><summary>A</summary><section>a</section></details>
      <details name="x"><section>no summary</section></details>
      <details name="x"><summary>C</summary><section>c</section></details>
    </tab-set>`);
    await page.locator('summary', { hasText: 'C' }).click();
    await settle(page);
    expect(errors).toEqual([]);
    await expect(page.locator('summary', { hasText: 'C' })).toHaveAttribute('aria-expanded', 'true');
  });
});
