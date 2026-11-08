/**
 * pager-wc + progress-tracker — P-review fixes.
 *
 * pager-wc: data-style API (not the global style attribute), load-more
 * driven by the engine's `visible`, focus kept across re-renders, labels,
 * lazy target resolution, persistent live region.
 * progress-tracker: inner <ol>, keyboard activation via native buttons,
 * the suppress-flag and id-vs-index bugs, no event on upgrade, label nodes
 * kept, late steps decorated, hidden status text, vertical + forced colors.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

async function load(page, body, { dir = 'ltr', wait = 'pager-wc, progress-tracker' } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__p5-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en" dir="${dir}"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <script type="module">
        import '/src/utils/data-paged-init.js';
        import '/src/web-components/pager-wc/logic.js';
        import '/src/web-components/progress-tracker/logic.js';
      </script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => customElements.get('pager-wc') && customElements.get('progress-tracker'));
  if (wait) {
    await page.waitForFunction((sel) => [...document.querySelectorAll(sel)].every((n) => n.hasAttribute('data-upgraded')), wait);
  }
}

const items = (n, p = 'Item') => Array.from({ length: n }, (_, i) => `<li>${p} ${i + 1}</li>`).join('');

/* ───────────────────────── pager-wc ───────────────────────── */

test.describe('pager-wc', () => {
  test('data-style selects the control style; inline style is just CSS', async ({ page }) => {
    await load(page, `
      <ul id="f" data-paged data-paged-size="2" data-paged-controls="none">${items(6)}</ul>
      <pager-wc id="p" target="#f" data-style="prev-next"></pager-wc>`);
    const pager = page.locator('#p');
    await expect(pager.locator('[data-paged-status]')).toHaveText('Page 1 of 3');
    await page.evaluate(() => { document.getElementById('p').style.color = 'red'; });
    await expect(pager.locator('[data-paged-status]')).toHaveText('Page 1 of 3');
    await expect(pager.locator('button[data-paged-action="page"]')).toHaveCount(0);
  });

  test('page buttons are named "Page N"; nav label from data-label-nav', async ({ page }) => {
    await load(page, `
      <ul id="f" data-paged data-paged-size="2" data-paged-controls="none">${items(6)}</ul>
      <pager-wc id="top" target="#f" data-label-nav="Results, top"></pager-wc>
      <pager-wc id="bottom" target="#f" data-label-nav="Results, bottom"></pager-wc>`);
    await expect(page.locator('#top nav')).toHaveAttribute('aria-label', 'Results, top');
    await expect(page.locator('#bottom nav')).toHaveAttribute('aria-label', 'Results, bottom');
    await expect(page.getByRole('button', { name: 'Page 2' })).toHaveCount(2);
  });

  test('label templates are applied', async ({ page }) => {
    await load(page, `
      <ul id="f" data-paged data-paged-size="2" data-paged-controls="none">${items(6)}</ul>
      <pager-wc id="p" target="#f" data-style="prev-next" data-label-prev="Zurück" data-label-next="Weiter"
        data-label-status="Seite {page} von {total}"></pager-wc>
      <ul id="g" data-paged data-paged-size="2" data-paged-style="load-more" data-paged-controls="none">${items(5)}</ul>
      <pager-wc id="lm" target="#g" data-style="load-more" data-label-load-more="Mehr laden ({n})" data-label-no-more="Fertig"></pager-wc>
      <pager-wc id="m" target="#nope" data-label-missing="Kein Ziel"></pager-wc>`);
    await expect(page.locator('#p [data-paged-status]')).toHaveText('Seite 1 von 3');
    await expect(page.locator('#p button[data-paged-action="prev"]')).toHaveText('Zurück');
    await expect(page.locator('#p button[data-paged-action="next"]')).toHaveText('Weiter');
    await expect(page.locator('#lm button')).toHaveText('Mehr laden (3)');
    await expect(page.locator('#m [data-pager-missing]')).toHaveText('Kein Ziel');
    await expect(page.locator('#m [data-pager-missing]')).not.toHaveAttribute('aria-live', /.*/);
  });

  test('load-more counts down from the engine and disables at the end', async ({ page }) => {
    await load(page, `
      <ul id="f" data-paged data-paged-size="3" data-paged-style="load-more" data-paged-controls="none">${items(8)}</ul>
      <pager-wc id="p" target="#f" data-style="load-more"></pager-wc>`);
    // controls="none" is honoured for the progressive style: no engine button.
    await expect(page.locator('#f + nav[data-paged-nav]')).toHaveCount(0);
    const btn = page.locator('#p button[data-paged-loadmore]');
    await expect(btn).toHaveText('Load more (5)');
    await btn.click();
    await expect(btn).toHaveText('Load more (2)');
    await expect(page.locator('#f li').nth(5)).toBeVisible();
    await expect(btn).toBeFocused();
    await btn.click();
    await expect(btn).toHaveText('No more');
    await expect(btn).toBeDisabled();
    await expect(page.locator('#f li').nth(7)).toBeVisible();
  });

  test('focus stays on the activated control across re-render', async ({ page }) => {
    await load(page, `
      <ul id="f" data-paged data-paged-size="2" data-paged-controls="none">${items(8)}</ul>
      <pager-wc id="p" target="#f"></pager-wc>`);
    const pager = page.locator('#p');
    await pager.getByRole('button', { name: 'Page 2' }).click();
    await expect(pager.getByRole('button', { name: 'Page 2' })).toBeFocused();
    await page.keyboard.press('Tab'); // → Page 3
    await page.keyboard.press('Tab'); // → Page 4
    await page.keyboard.press('Tab'); // → Next
    await expect(pager.locator('button[data-paged-action="next"]')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(pager.locator('button[aria-current="page"]')).toHaveText('3');
    await expect(pager.locator('button[data-paged-action="next"]')).toBeFocused();
    await page.keyboard.press('Enter');
    // Next is disabled on the last page → focus falls back to the current page.
    await expect(pager.locator('button[aria-current="page"]')).toHaveText('4');
    await expect(pager.locator('button[aria-current="page"]')).toBeFocused();
  });

  test('prev-next status is one persistent live region', async ({ page }) => {
    await load(page, `
      <ul id="f" data-paged data-paged-size="2" data-paged-controls="none">${items(6)}</ul>
      <pager-wc id="p" target="#f" data-style="prev-next"></pager-wc>`);
    await page.evaluate(() => { window.__status = document.querySelector('#p [data-paged-status]'); });
    await page.locator('#p button[data-paged-action="next"]').click();
    await expect(page.locator('#p [data-paged-status]')).toHaveText('Page 2 of 3');
    expect(await page.evaluate(() => window.__status === document.querySelector('#p [data-paged-status]')
      && window.__status.getAttribute('aria-live') === 'polite')).toBe(true);
  });

  test('target inserted after the pager is picked up; non-[data-paged] is ignored', async ({ page }) => {
    await load(page, `
      <pager-wc id="p" target="#late"></pager-wc>
      <ul id="plain">${items(3)}</ul>
      <pager-wc id="q" target="#plain"></pager-wc>`);
    await expect(page.locator('#p [data-pager-missing]')).toBeVisible();
    await expect(page.locator('#q [data-pager-missing]')).toBeVisible();
    await page.evaluate((html) => {
      document.querySelector('main').insertAdjacentHTML('beforeend',
        `<ul id="late" data-paged data-paged-size="2" data-paged-controls="none">${html}</ul>`);
    }, items(6));
    await expect(page.locator('#p [data-pager-missing]')).toHaveCount(0);
    await page.locator('#p').getByRole('button', { name: 'Page 3' }).click();
    await expect(page.locator('#late li').nth(4)).toBeVisible();
    await expect(page.locator('#late li').nth(0)).toBeHidden();
  });

  test('navigate event: page navigations only, with { page }', async ({ page }) => {
    await load(page, `
      <ul id="f" data-paged data-paged-size="2" data-paged-controls="none">${items(6)}</ul>
      <pager-wc id="p" target="#f"></pager-wc>
      <ul id="g" data-paged data-paged-size="2" data-paged-style="load-more" data-paged-controls="none">${items(6)}</ul>
      <pager-wc id="lm" target="#g" data-style="load-more"></pager-wc>`);
    await page.evaluate(() => {
      window.__nav = [];
      document.addEventListener('pager-wc:navigate', (e) => window.__nav.push([e.target.id, e.detail]));
    });
    await page.locator('#p').getByRole('button', { name: 'Page 2' }).click();
    await page.locator('#lm button').click();
    expect(await page.evaluate(() => window.__nav)).toEqual([['p', { page: 2 }]]);
  });

  test('reconnect keeps a single nav', async ({ page }) => {
    await load(page, `
      <ul id="f" data-paged data-paged-size="2" data-paged-controls="none">${items(6)}</ul>
      <pager-wc id="p" target="#f"></pager-wc>`);
    const n = await page.evaluate(() => {
      const p = document.getElementById('p');
      const main = document.querySelector('main');
      for (let i = 0; i < 3; i++) { p.remove(); main.append(p); }
      return p.querySelectorAll('nav').length;
    });
    expect(n).toBe(1);
  });

  test('forced colors: the current page keeps a distinct cue', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await load(page, `
      <ul id="f" data-paged data-paged-size="2" data-paged-controls="none">${items(6)}</ul>
      <pager-wc id="p" target="#f"></pager-wc>`);
    const [cur, other] = await page.evaluate(() => {
      const s = (el) => { const c = getComputedStyle(el); return { bg: c.backgroundColor, bw: c.borderTopWidth }; };
      return [s(document.querySelector('#p [aria-current="page"]')), s(document.querySelector('#p [data-paged-target="2"]'))];
    });
    expect(cur.bg).not.toBe(other.bg);
    expect(cur.bw).toBe('2px');
  });
});

/* ───────────────────────── data-paged engine ───────────────────────── */

test.describe('data-paged engine', () => {
  test('paged:change carries visible + style', async ({ page }) => {
    await load(page, `<ul id="f" data-paged data-paged-size="3" data-paged-style="load-more">${items(7)}</ul>`, { wait: null });
    const detail = await page.evaluate(() => new Promise((resolve) => {
      const f = document.getElementById('f');
      f.addEventListener('paged:change', (e) => resolve(e.detail), { once: true });
      f.dispatchEvent(new CustomEvent('paged:loadmore'));
    }));
    expect(detail).toMatchObject({ total: 7, visible: 6, style: 'load-more' });
  });

  test('in-place nav keeps focus on Next', async ({ page }) => {
    await load(page, `<ul id="f" data-paged data-paged-size="2">${items(6)}</ul>`, { wait: null });
    const next = page.locator('#f + nav button[data-paged-action="next"]');
    await next.click();
    await expect(page.locator('#f + nav button[aria-current="page"]')).toHaveText('2');
    await expect(next).toBeFocused();
  });
});

/* ───────────────────────── progress-tracker ───────────────────────── */

const WIZARD = `
  <progress-tracker id="pt" data-current="3" data-clickable>
    <ol>
      <li data-step="account">Account <small>Email + password</small></li>
      <li data-step="profile">Profile</li>
      <li data-step="prefs">Preferences</li>
      <li data-step="confirm">Confirm</li>
    </ol>
  </progress-tracker>`;

test.describe('progress-tracker', () => {
  test('no event on upgrade; statuses + hidden text; author nodes kept', async ({ page }) => {
    await page.addInitScript(() => {
      window.__events = [];
      document.addEventListener('progress-tracker:step', (e) => window.__events.push(e.detail));
    });
    await load(page, WIZARD);
    expect(await page.evaluate(() => window.__events)).toEqual([]);
    const lis = page.locator('#pt li');
    await expect(lis.nth(0)).toHaveAttribute('data-status', 'complete');
    await expect(lis.nth(2)).toHaveAttribute('data-status', 'current');
    await expect(lis.nth(2)).toHaveAttribute('aria-current', 'step');
    await expect(lis.nth(3)).toHaveAttribute('data-status', 'upcoming');
    await expect(lis.nth(0).locator('small')).toHaveText('Email + password');
    await expect(lis.nth(0)).not.toHaveAttribute('aria-label', /.*/);
    await expect(lis.nth(0)).toContainText('Step 1 of 4:');
    await expect(lis.nth(0)).toContainText('(completed)');
    await expect(lis.nth(3)).toContainText('(not started)');
  });

  test('completed steps are buttons; current/upcoming are not', async ({ page }) => {
    await load(page, WIZARD);
    await expect(page.locator('#pt li').nth(0).locator('button')).toHaveCount(1);
    await expect(page.locator('#pt li').nth(1).locator('button')).toHaveCount(1);
    await expect(page.locator('#pt li').nth(2).locator('button')).toHaveCount(0);
    await expect(page.locator('#pt li').nth(3).locator('button')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Account/ })).toHaveAccessibleName(/Step 1 of 4: Account.*\(completed\)/);
  });

  test('keyboard: Tab to a completed step, Enter navigates back (one click event)', async ({ page }) => {
    await load(page, `<button id="before">before</button>${WIZARD}`);
    await page.evaluate(() => {
      window.__events = [];
      document.addEventListener('progress-tracker:step', (e) => window.__events.push(e.detail));
    });
    await page.locator('#before').focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab'); // → Profile
    await page.keyboard.press('Enter');
    await expect(page.locator('#pt')).toHaveAttribute('data-current', 'profile');
    await expect(page.locator('#pt li').nth(1)).toHaveAttribute('data-status', 'current');
    expect(await page.evaluate(() => window.__events)).toEqual([
      { step: 'profile', previousStep: 'prefs', source: 'click' },
    ]);
  });

  test('clicking the current step is a no-op and does not swallow the next attr event', async ({ page }) => {
    await load(page, WIZARD);
    await page.evaluate(() => {
      window.__events = [];
      document.addEventListener('progress-tracker:step', (e) => window.__events.push(e.detail));
    });
    await page.locator('#pt li').nth(2).click();
    await page.evaluate(() => document.getElementById('pt').setAttribute('data-current', 'confirm'));
    expect(await page.evaluate(() => window.__events)).toEqual([
      { step: 'confirm', previousStep: 'prefs', source: 'attr' },
    ]);
  });

  test('numeric step ids match before indexes', async ({ page }) => {
    await load(page, `
      <progress-tracker id="pt" data-current="2025" data-clickable>
        <ol>
          <li data-step="2024">Last year</li>
          <li data-step="2025">This year</li>
          <li data-step="10">Ten</li>
        </ol>
      </progress-tracker>`);
    await expect(page.locator('#pt li').nth(1)).toHaveAttribute('data-status', 'current');
    await page.evaluate(() => document.getElementById('pt').setAttribute('data-current', '10'));
    await expect(page.locator('#pt li').nth(2)).toHaveAttribute('data-status', 'current');
    await page.locator('#pt li').nth(0).getByRole('button').click();
    await expect(page.locator('#pt')).toHaveAttribute('data-current', '2024');
    await expect(page.locator('#pt li').nth(0)).toHaveAttribute('data-status', 'current');
  });

  test('steps added later are decorated; data-clickable is observed', async ({ page }) => {
    await load(page, `
      <progress-tracker id="pt" data-current="2">
        <ol><li>One</li><li>Two</li></ol>
      </progress-tracker>`);
    await expect(page.locator('#pt li button')).toHaveCount(0);
    await page.evaluate(() => {
      const li = document.createElement('li');
      li.textContent = 'Three';
      document.querySelector('#pt ol').append(li);
      document.getElementById('pt').setAttribute('data-clickable', '');
    });
    await expect(page.locator('#pt li').nth(2)).toHaveAttribute('data-status', 'upcoming');
    await expect(page.locator('#pt li').nth(2).locator('.pt-circle')).toHaveText('3');
    await expect(page.locator('#pt li').nth(0).locator('button')).toHaveCount(1);
  });

  test('data-label-* localise the hidden text', async ({ page }) => {
    await load(page, `
      <progress-tracker id="pt" data-current="2" data-label-step="Schritt {n} von {total}:"
        data-label-complete="(erledigt)" data-label-upcoming="(offen)" data-label-list="Fortschritt">
        <ol><li>Eins</li><li>Zwei</li><li>Drei</li></ol>
      </progress-tracker>`);
    await expect(page.locator('#pt ol')).toHaveAttribute('aria-label', 'Fortschritt');
    await expect(page.locator('#pt li').nth(0)).toContainText('Schritt 1 von 3:');
    await expect(page.locator('#pt li').nth(0)).toContainText('(erledigt)');
    await expect(page.locator('#pt li').nth(2)).toContainText('(offen)');
  });

  test('error connector uses the error colour; forced colors keep connectors', async ({ page }) => {
    await load(page, `
      <progress-tracker id="pt" data-current="3">
        <ol><li>A</li><li data-error>B</li><li>C</li><li>D</li></ol>
      </progress-tracker>`);
    const colors = await page.evaluate(() => {
      const lis = document.querySelectorAll('#pt li');
      const bg = (el, p) => getComputedStyle(el, p).backgroundColor;
      const circle = getComputedStyle(lis[1].querySelector('.pt-circle')).backgroundColor;
      return { into: bg(lis[2], '::before'), errorCircle: circle };
    });
    expect(colors.into).toBe(colors.errorCircle);

    await page.emulateMedia({ forcedColors: 'active' });
    const fc = await page.evaluate(() => {
      const lis = document.querySelectorAll('#pt li');
      const c = getComputedStyle(lis[2].querySelector('.pt-circle'));
      return { line: getComputedStyle(lis[3], '::before').backgroundColor, outline: c.outlineStyle };
    });
    expect(fc.line).not.toBe('rgba(0, 0, 0, 0)');
    expect(fc.outline).toBe('solid');
  });

  test('vertical direction stacks the steps', async ({ page }) => {
    await load(page, `
      <progress-tracker id="pt" data-current="2" data-direction="vertical">
        <ol><li>One</li><li>Two</li><li>Three</li></ol>
      </progress-tracker>`);
    const boxes = await page.locator('#pt li').evaluateAll((lis) => lis.map((l) => l.getBoundingClientRect().top));
    expect(boxes[1]).toBeGreaterThan(boxes[0]);
    expect(boxes[2]).toBeGreaterThan(boxes[1]);
  });

  test('screenshots (horizontal, vertical, error, rtl, forced colors)', async ({ page }, info) => {
    await page.setViewportSize({ width: 720, height: 900 });
    await load(page, `
      ${WIZARD}
      <progress-tracker data-current="3"><ol><li>Validate</li><li data-error>Upload</li><li>Process</li><li>Done</li></ol></progress-tracker>
      <progress-tracker data-current="2" data-direction="vertical"><ol><li>Placed</li><li>Packed</li><li>Shipped</li></ol></progress-tracker>
      <ul id="f" data-paged data-paged-size="2" data-paged-controls="none">${items(10)}</ul>
      <pager-wc target="#f"></pager-wc>
      <pager-wc target="#f" data-style="prev-next"></pager-wc>`);
    await page.screenshot({ path: process.env.P5_SHOTS ? join(process.env.P5_SHOTS, `${info.project.name}-light.png`) : info.outputPath('p5-light.png'), fullPage: true });
    await page.evaluate(() => { document.documentElement.dir = 'rtl'; });
    await page.screenshot({ path: process.env.P5_SHOTS ? join(process.env.P5_SHOTS, `${info.project.name}-rtl.png`) : info.outputPath('p5-rtl.png'), fullPage: true });
    await page.evaluate(() => { document.documentElement.dir = 'ltr'; });
    await page.emulateMedia({ forcedColors: 'active' });
    await page.screenshot({ path: process.env.P5_SHOTS ? join(process.env.P5_SHOTS, `${info.project.name}-forced.png`) : info.outputPath('p5-forced.png'), fullPage: true });
  });
});
