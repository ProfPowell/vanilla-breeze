/**
 * page-tour — P element review fixes.
 *
 * Covers: one scroll handler that follows the current step; start() while
 * running reuses the overlay; auto-trigger timer cleared on disconnect;
 * action gates never steal focus; document-level keys incl. the relaxed Tab
 * trap; aria-modal / aria-disabled on gated steps; centred anchor card that
 * stays in the viewport; only static targets are raised; forced-colors
 * spotlight; missing targets at the ends; data-label-* / logical placement /
 * RTL; data-skippable; spotlight padding; reconnect idempotency.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

async function load(page, body, { dir = 'ltr', head = '' } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__p-page-tour-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en" dir="${dir}"><head><meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <link rel="stylesheet" href="/src/main.css">
      <style>.p2-spacer { block-size: 150vh; }</style>
      ${head}
      <script type="module">import '/src/web-components/page-tour/logic.js';</script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => customElements.get('page-tour'));
}

const upgraded = (page) => page.waitForSelector('page-tour[data-upgraded]', { state: 'attached' });

const PASSIVE = `
  <header id="t0"><p>Header target</p></header>
  <p class="p2-spacer">Spacer</p>
  <p><button id="t1" type="button">Middle target</button></p>
  <p class="p2-spacer">Spacer</p>
  <section id="t2"><h2>Bottom target</h2></section>
  <button id="go" type="button" data-tour="tour">Start</button>
  <page-tour id="tour" data-title="Test tour" data-persist="none">
    <tour-step data-target="#t0" data-scroll="auto"><h3>Zero</h3><p>First.</p></tour-step>
    <tour-step data-target="#t1" data-scroll="auto"><h3>One</h3><p>Second.</p></tour-step>
    <tour-step data-target="#t2" data-scroll="auto"><h3>Two</h3><p>Third.</p></tour-step>
  </page-tour>`;

const tourStep = (page) => page.locator('page-tour').getAttribute('data-step');

// ---------------------------------------------------------------------------

test('scroll keeps the spotlight on the current step after several steps', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); // no spotlight transition to wait out
  await load(page, PASSIVE);
  await upgraded(page);
  await page.evaluate(() => /** @type {any} */ (document.querySelector('page-tour')).start());
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('page-tour')).toHaveAttribute('data-step', '2');
  // Scroll a little and let the rAF reposition run
  await page.evaluate(() => window.scrollBy(0, -40));
  await page.waitForTimeout(150);
  const r = await page.evaluate(() => {
    const spot = document.querySelector('.page-tour-spotlight').getBoundingClientRect();
    const pad = parseFloat(getComputedStyle(document.querySelector('.page-tour-spotlight')).paddingTop);
    const t = document.getElementById('t2').getBoundingClientRect();
    return { spotTop: spot.top + pad, targetTop: t.top };
  });
  expect(Math.abs(r.spotTop - r.targetTop)).toBeLessThan(2);
});

test('start() while running moves to the step without a second overlay', async ({ page }) => {
  await load(page, PASSIVE);
  await upgraded(page);
  await page.locator('#go').click();
  await page.locator('#go').dispatchEvent('click');
  const counts = await page.evaluate(() => {
    const tour = /** @type {any} */ (document.querySelector('page-tour'));
    tour.start(1);
    return {
      cards: document.querySelectorAll('.page-tour-card').length,
      backdrops: document.querySelectorAll('.page-tour-backdrop').length,
      step: tour.dataset.step,
    };
  });
  expect(counts).toEqual({ cards: 1, backdrops: 1, step: '1' });
  await page.evaluate(() => /** @type {any} */ (document.querySelector('page-tour')).stop());
  await expect(page.locator('.page-tour-card, .page-tour-backdrop, .page-tour-spotlight')).toHaveCount(0);
});

test('auto-trigger is cancelled when the tour is removed or moved before it fires', async ({ page }) => {
  await load(page, `
    <p id="a">A</p><p id="b">B</p>
    <page-tour id="auto" data-trigger="auto" data-persist="none">
      <tour-step data-target="#a"><h3>A</h3></tour-step>
    </page-tour>
    <page-tour id="auto2" data-trigger="auto" data-persist="none">
      <tour-step data-target="#b"><h3>B</h3></tour-step>
    </page-tour>`);
  await page.evaluate(() => {
    document.getElementById('auto').remove();
    const t2 = document.getElementById('auto2');
    document.body.append(t2); // move: teardown + setup → only one pending timer
  });
  await page.waitForTimeout(700);
  const r = await page.evaluate(() => ({
    cards: document.querySelectorAll('.page-tour-card').length,
    owner: document.querySelector('.page-tour-card')?.closest('page-tour')?.id,
  }));
  expect(r).toEqual({ cards: 1, owner: 'auto2' });
});

const GATED = `
  <form>
    <label for="name">Name</label>
    <input id="name" type="text">
    <button id="save" type="button">Save</button>
  </form>
  <p id="plain">Plain</p>
  <page-tour id="g" data-mode="active" data-persist="none">
    <tour-step data-target="#name" data-action="input" data-action-hint="Type <img src=x onerror=window.__pwned=1> your name"><h3>Name</h3></tour-step>
    <tour-step data-target="#plain"><h3>Plain</h3></tour-step>
  </page-tour>`;

test('input gate: aria-disabled Next, no aria-modal, focus stays while typing', async ({ page }) => {
  await load(page, GATED);
  await upgraded(page);
  await page.evaluate(() => /** @type {any} */ (document.getElementById('g')).start());
  const card = page.locator('.page-tour-card');
  const next = page.locator('.page-tour-next');
  await expect(card).not.toHaveAttribute('aria-modal', /.*/);
  await expect(next).toHaveAttribute('aria-disabled', 'true');
  await expect(next).toHaveAttribute('aria-describedby', /hint/);

  // The hint is text, never markup
  const hint = page.locator('.page-tour-action-hint');
  await expect(hint).toContainText('<img src=x');
  await expect(page.locator('.page-tour-card img')).toHaveCount(0);

  await page.locator('#name').focus();
  await page.keyboard.type('Ada');
  await expect(page.locator('#name')).toHaveValue('Ada');
  await expect(page.locator('#name')).toBeFocused();
  await expect(next).not.toHaveAttribute('aria-disabled', /.*/);
  await expect(hint).toHaveCount(0);
  await expect(page.locator('[id^="page-tour-announcer"]')).toHaveText('Done. Next is available.');

  // Arrow keys inside the field move the caret, not the tour
  await page.keyboard.press('ArrowLeft');
  expect(await tourStep(page)).toBe('0');

  // Ungated step claims modality again
  await next.click();
  await expect(card).toHaveAttribute('aria-modal', 'true');
});

test('keys work from the target: Tab cycles card + target, Escape skips', async ({ page }) => {
  await load(page, GATED);
  await upgraded(page);
  await page.evaluate(() => /** @type {any} */ (document.getElementById('g')).start());
  await page.locator('#name').focus();
  // From the target (last in the cycle) Tab wraps into the card
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => !!document.activeElement?.closest('.page-tour-card'))).toBe(true);
  // Shift+Tab from the card's first button goes back to the target
  await page.locator('.page-tour-skip').focus();
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#name')).toBeFocused();
  // Escape from the target ends the tour
  await page.keyboard.press('Escape');
  await expect(page.locator('.page-tour-card')).toHaveCount(0);
  await expect(page.locator('page-tour')).toHaveAttribute('data-complete', '');
});

test('focus gate does not bounce focus away from the target', async ({ page }) => {
  await load(page, `
    <input id="f" aria-label="Field">
    <page-tour data-persist="none">
      <tour-step data-target="#f" data-action="focus"><h3>F</h3></tour-step>
      <tour-step data-target="#f"><h3>G</h3></tour-step>
    </page-tour>`);
  await upgraded(page);
  await page.evaluate(() => /** @type {any} */ (document.querySelector('page-tour')).start());
  await expect(page.locator('.page-tour-content h3')).toBeFocused(); // initial focus settled
  await page.locator('#f').focus();
  await page.waitForTimeout(100);
  await expect(page.locator('#f')).toBeFocused();
  await expect(page.locator('.page-tour-next')).not.toHaveAttribute('aria-disabled', /.*/);
});

test('anchored card is centred on the target and stays in the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 700 });
  await load(page, `
    <p><button id="mid" type="button">Middle</button></p>
    <p class="edge"><button id="edge" type="button">Edge</button></p>
    <page-tour data-persist="none">
      <tour-step data-target="#mid" data-placement="bottom" data-scroll="none"><h3>Mid</h3><p>Centred.</p></tour-step>
      <tour-step data-target="#edge" data-placement="bottom" data-scroll="none"><h3>Edge</h3><p>Near the inline end.</p></tour-step>
    </page-tour>`, { head: `<style>
      #mid { position: fixed; inset-block-start: 100px; inset-inline-start: 450px; }
      #edge { position: fixed; inset-block-start: 100px; inset-inline-end: 4px; }
    </style>` });
  await upgraded(page);
  await page.evaluate(() => /** @type {any} */ (document.querySelector('page-tour')).start());
  await page.waitForTimeout(100);
  const mid = await page.evaluate(() => {
    const c = document.querySelector('.page-tour-card').getBoundingClientRect();
    const t = document.getElementById('mid').getBoundingClientRect();
    return { dx: Math.abs((c.left + c.width / 2) - (t.left + t.width / 2)), below: c.top > t.bottom };
  });
  expect(mid.dx).toBeLessThan(2);
  expect(mid.below).toBe(true);

  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(100);
  const edge = await page.evaluate(() => {
    const c = document.querySelector('.page-tour-card').getBoundingClientRect();
    return { left: c.left, right: c.right, vw: window.innerWidth };
  });
  expect(edge.left).toBeGreaterThanOrEqual(0);
  expect(edge.right).toBeLessThanOrEqual(edge.vw);
});

test('inline-end placement follows the text direction', async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 700 });
  for (const dir of ['ltr', 'rtl']) {
    await load(page, `
      <p><button id="m" type="button">Middle</button></p>
      <page-tour data-persist="none">
        <tour-step data-target="#m" data-placement="inline-end" data-scroll="none" data-action="click" data-action-hint="Click it"><h3>M</h3></tour-step>
      </page-tour>`, { dir, head: '<style>#m { position: fixed; inset-block-start: 300px; inset-inline-start: 450px; }</style>' });
    await upgraded(page);
    await page.evaluate(() => /** @type {any} */ (document.querySelector('page-tour')).start());
    await page.waitForTimeout(100);
    const r = await page.evaluate(() => {
      const c = document.querySelector('.page-tour-card').getBoundingClientRect();
      const t = document.getElementById('m').getBoundingClientRect();
      const hint = getComputedStyle(document.querySelector('.page-tour-action-hint'), '::before').content;
      return { right: c.left >= t.right, left: c.right <= t.left, hint };
    });
    if (dir === 'ltr') {
      expect(r.right).toBe(true);
      expect(r.hint).toContain('→');
    } else {
      expect(r.left).toBe(true);
      expect(r.hint).toContain('←');
    }
  }
});

test('only static targets get position: relative; sticky targets keep theirs', async ({ page }) => {
  await load(page, `
    <header id="sticky">Sticky header</header>
    <p id="static">Static</p>
    <page-tour data-persist="none">
      <tour-step data-target="#sticky"><h3>S</h3></tour-step>
      <tour-step data-target="#static"><h3>T</h3></tour-step>
    </page-tour>`, { head: '<style>#sticky { position: sticky; inset-block-start: 0; }</style>' });
  await upgraded(page);
  await page.evaluate(() => /** @type {any} */ (document.querySelector('page-tour')).start());
  expect(await page.evaluate(() => getComputedStyle(document.getElementById('sticky')).position)).toBe('sticky');
  await page.keyboard.press('ArrowRight');
  const r = await page.evaluate(() => ({
    sticky: document.getElementById('sticky').hasAttribute('data-tour-target'),
    pos: getComputedStyle(document.getElementById('static')).position,
    raised: document.getElementById('static').getAttribute('data-tour-target'),
  }));
  expect(r).toEqual({ sticky: false, pos: 'relative', raised: 'raised' });
  await page.evaluate(() => /** @type {any} */ (document.querySelector('page-tour')).stop());
  expect(await page.evaluate(() => document.getElementById('static').hasAttribute('style'))).toBe(false);
});

test('forced colors outline the spotlight with Highlight', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await load(page, PASSIVE);
  await upgraded(page);
  await page.evaluate(() => /** @type {any} */ (document.querySelector('page-tour')).start());
  const o = await page.evaluate(() => {
    const cs = getComputedStyle(document.querySelector('.page-tour-spotlight'));
    return { style: cs.outlineStyle, width: cs.outlineWidth };
  });
  expect(o).toEqual({ style: 'solid', width: '3px' });
});

test('missing targets: skipped at start, Next finishes when no later target exists', async ({ page }) => {
  await load(page, `
    <p id="x">X</p>
    <page-tour data-persist="none">
      <tour-step data-target="#nope-first"><h3>Gone</h3></tour-step>
      <tour-step data-target="#x"><h3>X</h3></tour-step>
      <tour-step data-target="#nope-last"><h3>Gone too</h3></tour-step>
    </page-tour>`);
  await upgraded(page);
  await page.evaluate(() => /** @type {any} */ (document.querySelector('page-tour')).start());
  await expect(page.locator('page-tour')).toHaveAttribute('data-step', '1');
  await expect(page.locator('.page-tour-content h3')).toHaveText('X');
  await expect(page.locator('.page-tour-prev')).toHaveCount(0);
  await expect(page.locator('.page-tour-next')).toHaveText('Finish');
  // Prev with nothing before stays put (card still matches the state)
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('.page-tour-content h3')).toHaveText('X');
  await page.locator('.page-tour-next').click();
  await expect(page.locator('.page-tour-card')).toHaveCount(0);
  await expect(page.locator('page-tour')).toHaveAttribute('data-complete', '');
});

test('no target at all: start() leaves no overlay behind', async ({ page }) => {
  await load(page, `
    <page-tour data-persist="none">
      <tour-step data-target="#a1"><h3>A</h3></tour-step>
      <tour-step data-target="#a2"><h3>B</h3></tour-step>
    </page-tour>`);
  await upgraded(page);
  await page.evaluate(() => /** @type {any} */ (document.querySelector('page-tour')).start());
  await expect(page.locator('.page-tour-card, .page-tour-backdrop')).toHaveCount(0);
  await expect(page.locator('page-tour')).not.toHaveAttribute('data-active', /.*/);
});

test('data-label-* overrides every rendered string', async ({ page }) => {
  await load(page, `
    <p id="l1">One</p><p id="l2">Two</p>
    <page-tour data-persist="none" data-title="Visite" data-label-step="Étape {n} sur {total}"
      data-label-skip="Passer" data-label-close="Fermer" data-label-prev="Précédent"
      data-label-next="Suivant" data-label-finish="Terminer" data-label-nav="Navigation">
      <tour-step data-target="#l1"><h3>Un</h3></tour-step>
      <tour-step data-target="#l2"><h3>Deux</h3></tour-step>
    </page-tour>`);
  await upgraded(page);
  await page.evaluate(() => /** @type {any} */ (document.querySelector('page-tour')).start());
  await expect(page.locator('.page-tour-card')).toHaveAttribute('aria-label', 'Visite');
  await expect(page.locator('.page-tour-step-count')).toHaveText('Étape 1 sur 2');
  await expect(page.locator('.page-tour-skip')).toHaveText('Passer');
  await expect(page.locator('.page-tour-next')).toHaveText('Suivant');
  await expect(page.locator('.page-tour-nav')).toHaveAttribute('aria-label', 'Navigation');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.page-tour-prev')).toHaveText('Précédent');
  await expect(page.locator('.page-tour-next')).toHaveText('Terminer');
  await expect(page.locator('.page-tour-skip')).toHaveText('Fermer');
});

test('default title is "Page Tour"', async ({ page }) => {
  await load(page, `<p id="d">D</p><page-tour data-persist="none"><tour-step data-target="#d"><h3>D</h3></tour-step></page-tour>`);
  await upgraded(page);
  await page.evaluate(() => /** @type {any} */ (document.querySelector('page-tour')).start());
  await expect(page.locator('.page-tour-card')).toHaveAttribute('aria-label', 'Page Tour');
});

test('data-skippable="false" removes skipping on that step only', async ({ page }) => {
  await load(page, `
    <p id="s1">One</p><p id="s2">Two</p>
    <page-tour data-persist="none">
      <tour-step data-target="#s1" data-skippable="false"><h3>Must see</h3></tour-step>
      <tour-step data-target="#s2"><h3>Optional</h3></tour-step>
    </page-tour>`);
  await upgraded(page);
  await page.evaluate(() => /** @type {any} */ (document.querySelector('page-tour')).start());
  await expect(page.locator('.page-tour-skip')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await page.locator('.page-tour-backdrop').click({ position: { x: 3, y: 3 }, force: true });
  await expect(page.locator('.page-tour-card')).toHaveCount(1);
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.page-tour-skip')).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(page.locator('.page-tour-card')).toHaveCount(0);
});

test('spotlight padding: token default and data-spotlight-padding override', async ({ page }) => {
  await load(page, `
    <p><button id="p" type="button">Pad</button></p>
    <page-tour id="pt" data-persist="none"><tour-step data-target="#p" data-scroll="none"><h3>P</h3></tour-step></page-tour>`);
  await upgraded(page);
  const measure = () => page.evaluate(() => {
    const s = document.querySelector('.page-tour-spotlight').getBoundingClientRect();
    const t = document.getElementById('p').getBoundingClientRect();
    return Math.round(t.left - s.left);
  });
  await page.evaluate(() => /** @type {any} */ (document.getElementById('pt')).start());
  await page.waitForTimeout(400);
  expect(await measure()).toBe(8);
  await page.evaluate(() => {
    const t = /** @type {any} */ (document.getElementById('pt'));
    t.stop();
    t.dataset.spotlightPadding = '20';
    t.start();
  });
  await page.waitForTimeout(400);
  expect(await measure()).toBe(20);
});

test('reconnect: moving an active tour stops it cleanly and re-wires once', async ({ page }) => {
  await load(page, PASSIVE + '<section id="dest"></section>');
  await upgraded(page);
  await page.locator('#go').click();
  const r = await page.evaluate(async () => {
    const tour = /** @type {any} */ (document.getElementById('tour'));
    const dest = document.getElementById('dest');
    for (let i = 0; i < 3; i++) { dest.append(tour); document.querySelector('main').append(tour); }
    const afterMove = {
      cards: document.querySelectorAll('.page-tour-card').length,
      active: tour.hasAttribute('data-active'),
      upgraded: tour.hasAttribute('data-upgraded'),
      raised: document.querySelectorAll('[data-tour-target]').length,
    };
    let starts = 0, steps = 0;
    tour.addEventListener('tour:start', () => starts++);
    tour.addEventListener('tour:step', () => steps++);
    document.getElementById('go').click();
    tour.next();
    return { afterMove, starts, steps, cards: document.querySelectorAll('.page-tour-card').length };
  });
  expect(r).toEqual({
    afterMove: { cards: 0, active: false, upgraded: true, raised: 0 },
    starts: 1, steps: 2, cards: 1,
  });
});
