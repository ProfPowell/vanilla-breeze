/**
 * K+L review fixes — layout-sidebar, layout-reel, layout-imposter,
 * layout-canvas, data-splitter (splitter-init) and split-surface.
 *
 * Covers: private --_* props no longer leak into nested sidebars / reels /
 * imposters; imposter logical centring (RTL), full-width shrink-to-fit and
 * contain within the containing block; reel attribute form, logical +
 * scroll-driven hints, proximity snap, forced-colours scrollbar; canvas
 * plain-page / forced-colours edge, mobile parity of element and attribute
 * forms, nested --canvas-bg; splitter aria-orientation, label override,
 * aria-controls, content overflow, initial clamp, RTL keys + drag, cancel
 * cleanup, reconnect safety, splitter:resize; split-surface orientation,
 * label, RTL keys and reconnect safety.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

async function load(page, body, { dir = 'ltr', html = '', head = '' } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__kl-layouts-b-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en" dir="${dir}" ${html}><head><meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <link rel="stylesheet" href="/src/main.css">
      <style>body { margin: 0; padding: 0; }</style>
      <script type="module">import '/src/custom-elements/register.js';</script>
      ${head}
      </head><body>${body}</body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  // layout-* are CSS-only but registered (reset.css suppresses animations
  // on :not(:defined) elements, which would hide the scroll-driven hints).
  await page.waitForFunction(() => customElements.get('layout-reel'));
}

const SPLITTER_HEAD = `<script type="module">import '/src/utils/splitter-init.js';</script>`;
const SPLIT_SURFACE_HEAD = `<script type="module">import '/src/web-components/split-surface/logic.js';</script>`;

/* ---------------------------------------------------------------- sidebar */

test.describe('layout-sidebar', () => {
  test('nested sidebar gets its own defaults, not the outer attribute values', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 800 });
    await load(page, `
      <layout-sidebar id="outer" data-layout-gap="3xl" data-layout-sidebar-width="wide" data-layout-content-min="l">
        <nav>Outer nav</nav>
        <layout-sidebar id="inner">
          <aside id="inner-aside">Inner aside</aside>
          <section id="inner-content">Inner content</section>
        </layout-sidebar>
      </layout-sidebar>
      <layout-sidebar id="ref"><aside>a</aside><section>c</section></layout-sidebar>`);
    const r = await page.evaluate(() => {
      const cs = (id) => getComputedStyle(document.getElementById(id));
      return {
        outerGap: cs('outer').columnGap,
        innerGap: cs('inner').columnGap,
        refGap: cs('ref').columnGap,
        innerBasis: cs('inner-aside').flexBasis,
        innerMin: cs('inner-content').minInlineSize,
      };
    });
    expect(r.outerGap).not.toBe(r.refGap);
    expect(r.innerGap).toBe(r.refGap);
    expect(r.innerBasis).toBe('256px');
    expect(r.innerMin).toBe('50%');
  });

  test('attribute form behaves like the element form', async ({ page }) => {
    await load(page, `<section id="s" data-layout="sidebar" data-layout-sidebar-width="narrow">
      <nav id="n">nav</nav><article>content</article></section>`);
    const basis = await page.evaluate(() => getComputedStyle(document.getElementById('n')).flexBasis);
    expect(basis).toBe('192px');
  });
});

/* -------------------------------------------------------------- splitter */

test.describe('data-splitter (splitter-init)', () => {
  test('divider: vertical orientation, label override, aria-controls, clamped initial value', async ({ page }) => {
    await load(page, `
      <section id="a" data-layout="sidebar" data-splitter data-label-resize="Resize navigation">
        <nav aria-label="x" data-max="40">nav</nav><main>main</main>
      </section>
      <section id="b" data-layout="stack" data-splitter="vertical">
        <section id="top">top</section><section>bottom</section>
      </section>`, { head: SPLITTER_HEAD });
    await page.waitForSelector('#a > .split-divider');
    const r = await page.evaluate(() => {
      const a = document.querySelector('#a > .split-divider');
      const b = document.querySelector('#b > .split-divider');
      const nav = document.querySelector('#a > nav');
      return {
        aOrient: a.getAttribute('aria-orientation'),
        bOrient: b.getAttribute('aria-orientation'),
        label: a.getAttribute('aria-label'),
        bLabel: b.getAttribute('aria-label'),
        controls: a.getAttribute('aria-controls'),
        navId: nav.id,
        bControls: b.getAttribute('aria-controls'),
        value: a.getAttribute('aria-valuenow'),
        basis: nav.style.flexBasis,
      };
    });
    expect(r.aOrient).toBe('vertical');
    expect(r.bOrient).toBe('horizontal');
    expect(r.label).toBe('Resize navigation');
    expect(r.bLabel).toBe('Resize panels');
    expect(r.navId).not.toBe('');
    expect(r.controls).toBe(r.navId);
    expect(r.bControls).toBe('top');
    expect(r.value).toBe('40');
    expect(r.basis).toBe('40%');
  });

  test('any content child shrinks beside the splitter (no overflow)', async ({ page }) => {
    await page.setViewportSize({ width: 600, height: 600 });
    await load(page, `
      <section id="c" data-layout="sidebar" data-splitter>
        <nav aria-label="x">nav</nav>
        <section data-layout="stack"><p>Stacked content</p></section>
      </section>`, { head: SPLITTER_HEAD });
    await page.waitForSelector('#c > .split-divider');
    const overflow = await page.evaluate(() => {
      const c = document.getElementById('c');
      return c.scrollWidth - c.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('RTL: ArrowLeft grows the first panel, drag math is mirrored', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 600 });
    await load(page, `
      <section id="c" data-layout="sidebar" data-splitter dir="rtl">
        <nav aria-label="x">nav</nav><main>main</main>
      </section>`, { head: SPLITTER_HEAD });
    const divider = page.locator('#c > .split-divider');
    await divider.focus();
    await page.keyboard.press('ArrowLeft');
    await expect(divider).toHaveAttribute('aria-valuenow', '51');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await expect(divider).toHaveAttribute('aria-valuenow', '49');

    // Drag to 25% from the right edge: first panel (on the right) = 25%.
    const box = await page.locator('#c').boundingBox();
    const d = await divider.boundingBox();
    await page.mouse.move(d.x + d.width / 2, d.y + d.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.75, d.y + d.height / 2, { steps: 4 });
    await page.mouse.up();
    const v = Number(await divider.getAttribute('aria-valuenow'));
    expect(v).toBeGreaterThanOrEqual(24);
    expect(v).toBeLessThanOrEqual(26);
  });

  test('pointercancel ends the drag and restores user-select', async ({ page }) => {
    await load(page, `
      <section id="c" data-layout="sidebar" data-splitter>
        <nav aria-label="x">nav</nav><main>main</main>
      </section>`, { head: SPLITTER_HEAD });
    const divider = page.locator('#c > .split-divider');
    const d = await divider.boundingBox();
    await page.mouse.move(d.x + d.width / 2, d.y + d.height / 2);
    await page.mouse.down();
    expect(await page.evaluate(() => document.getElementById('c').style.userSelect)).toBe('none');
    await page.evaluate(() => {
      document.querySelector('#c > .split-divider').dispatchEvent(new PointerEvent('pointercancel', { bubbles: true }));
    });
    expect(await page.evaluate(() => document.getElementById('c').style.userSelect)).toBe('');
    await page.mouse.up();
  });

  test('remove + reinsert and clones never duplicate the divider; fires splitter:resize', async ({ page }) => {
    await load(page, `
      <article id="host">
        <section id="c" data-layout="sidebar" data-splitter>
          <nav aria-label="x">nav</nav><main>main</main>
        </section>
      </article>`, { head: SPLITTER_HEAD });
    await page.waitForSelector('#c > .split-divider');
    const r = await page.evaluate(async () => {
      const host = document.getElementById('host');
      const c = document.getElementById('c');
      for (let i = 0; i < 3; i++) { c.remove(); host.append(c); }
      const clone = /** @type {HTMLElement} */ (c.cloneNode(true));
      clone.id = 'clone';
      host.append(clone);
      await new Promise((res) => setTimeout(res, 50));
      const events = [];
      clone.addEventListener('splitter:resize', (e) => events.push(/** @type {CustomEvent} */ (e).detail.position));
      const div = /** @type {HTMLElement} */ (clone.querySelector('.split-divider'));
      div.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
      return {
        original: c.querySelectorAll(':scope > .split-divider').length,
        clone: clone.querySelectorAll(':scope > .split-divider').length,
        events,
      };
    });
    expect(r.original).toBe(1);
    expect(r.clone).toBe(1);
    expect(r.events).toEqual([90]);
  });
});

/* --------------------------------------------------------- split-surface */

test.describe('split-surface', () => {
  test('orientation, label override, aria-controls, RTL arrow keys', async ({ page }) => {
    await load(page, `
      <split-surface id="s" dir="rtl" data-label-resize="Resize editor">
        <nav aria-label="x">a</nav><main>b</main>
      </split-surface>
      <split-surface id="v" direction="vertical"><section>a</section><section>b</section></split-surface>`,
    { head: SPLIT_SURFACE_HEAD });
    const divider = page.locator('#s > .split-divider');
    await expect(divider).toHaveCount(1);
    await expect(divider).toHaveAttribute('aria-orientation', 'vertical');
    await expect(page.locator('#v > .split-divider')).toHaveAttribute('aria-orientation', 'horizontal');
    await expect(divider).toHaveAttribute('aria-label', 'Resize editor');
    const controls = await divider.getAttribute('aria-controls');
    expect(controls).toBe(await page.locator('#s > nav').getAttribute('id'));
    await divider.focus();
    await page.keyboard.press('ArrowLeft');
    await expect(divider).toHaveAttribute('aria-valuenow', '51');
  });

  test('rapid remove + reinsert keeps exactly one divider', async ({ page }) => {
    await load(page, `<article id="host"><split-surface id="s"><nav aria-label="x">a</nav><main>b</main></split-surface></article>`,
      { head: SPLIT_SURFACE_HEAD });
    await page.waitForSelector('#s > .split-divider');
    const n = await page.evaluate(async () => {
      const host = document.getElementById('host');
      const s = document.getElementById('s');
      for (let i = 0; i < 3; i++) { s.remove(); host.append(s); }
      await new Promise((res) => setTimeout(res, 100));
      return s.querySelectorAll(':scope > .split-divider').length;
    });
    expect(n).toBe(1);
  });
});

/* ------------------------------------------------------------------ reel */

test.describe('layout-reel', () => {
  const items = Array.from({ length: 8 }, (_, i) => `<article>Item ${i + 1}</article>`).join('');

  test('attribute form, proximity snap, nested defaults', async ({ page }) => {
    await load(page, `
      <section id="attr" data-layout="reel" data-layout-gap="xl">${items}</section>
      <layout-reel id="outer" data-layout-gap="3xl" data-layout-padding="l">
        <layout-reel id="inner">${items}</layout-reel>
      </layout-reel>
      <layout-reel id="ref">${items}</layout-reel>`);
    const r = await page.evaluate(() => {
      const cs = (id) => getComputedStyle(document.getElementById(id));
      return {
        attrDisplay: cs('attr').display,
        attrOverflow: cs('attr').overflowX,
        snap: cs('ref').scrollSnapType,
        innerGap: cs('inner').columnGap,
        innerPad: cs('inner').paddingInlineStart,
        refGap: cs('ref').columnGap,
        refPad: cs('ref').paddingInlineStart,
        webkitOverflow: cs('ref').getPropertyValue('-webkit-overflow-scrolling'),
      };
    });
    expect(r.attrDisplay).toBe('flex');
    expect(r.attrOverflow).toBe('auto');
    expect(r.snap).toBe('x'); // proximity is the initial strictness, serialized away
    expect(r.innerGap).toBe(r.refGap);
    expect(r.innerPad).toBe(r.refPad);
  });

  test('scroll hints mirror under RTL', async ({ page }) => {
    await load(page, `<layout-reel id="r" data-scroll-hint>${items}</layout-reel>`, { dir: 'rtl' });
    const mask = await page.evaluate(() => getComputedStyle(document.getElementById('r')).maskImage);
    expect(mask).toContain('to left');
  });

  test('scroll-driven hints: no fade without overflow, start sharp at the start', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 600 });
    await load(page, `
      <layout-reel id="over" data-scroll-hint data-layout-item-width="s">${items}</layout-reel>
      <layout-reel id="fits" data-scroll-hint><article>One</article></layout-reel>`);
    const supported = await page.evaluate(() => CSS.supports('animation-timeline: scroll()'));
    test.skip(!supported, 'scroll-driven animations unsupported');
    const read = () => page.evaluate(() => {
      const v = (id, p) => getComputedStyle(document.getElementById(id)).getPropertyValue(p).trim();
      return {
        overStart: v('over', '--_reel-hint-start'),
        overEnd: v('over', '--_reel-hint-end'),
        fitsStart: v('fits', '--_reel-hint-start'),
        fitsEnd: v('fits', '--_reel-hint-end'),
      };
    });
    const atStart = await read();
    expect(atStart.fitsStart).toBe('0px');
    expect(atStart.fitsEnd).toBe('0px');
    expect(atStart.overStart).toBe('0px');
    expect(atStart.overEnd).not.toBe('0px');
    await page.evaluate(() => {
      const el = document.getElementById('over');
      el.scrollLeft = el.scrollWidth;
    });
    await expect.poll(async () => (await read()).overEnd).toBe('0px');
    expect((await read()).overStart).not.toBe('0px');
  });

  test('scrollbar shows under forced colours', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await load(page, `<layout-reel id="r">${items}</layout-reel>`);
    const sw = await page.evaluate(() => getComputedStyle(document.getElementById('r')).scrollbarWidth);
    expect(sw).toBe('thin');
  });
});

/* -------------------------------------------------------------- imposter */

test.describe('layout-imposter', () => {
  const STAGE = 'position: relative; inline-size: 400px; block-size: 300px;';

  test('centred in RTL for center and top', async ({ page }) => {
    await load(page, `
      <section id="stage" dir="rtl" data-test-stage>
        <layout-imposter id="c"><p data-box>box</p></layout-imposter>
        <layout-imposter id="t" data-layout-position="top"><p data-box>box</p></layout-imposter>
      </section>`, { head: `<style>[data-test-stage] { ${STAGE} } [data-box] { inline-size: 100px; margin: 0; }</style>` });
    const r = await page.evaluate(() => {
      const s = document.getElementById('stage').getBoundingClientRect();
      const mid = (id) => { const b = document.getElementById(id).getBoundingClientRect(); return b.left + b.width / 2; };
      return { stageMid: s.left + s.width / 2, c: mid('c'), t: mid('t'), tTop: document.getElementById('t').getBoundingClientRect().top - s.top };
    });
    expect(Math.abs(r.c - r.stageMid)).toBeLessThanOrEqual(1);
    expect(Math.abs(r.t - r.stageMid)).toBeLessThanOrEqual(1);
    expect(r.tTop).toBeLessThanOrEqual(1);
  });

  test('start/end positions are logical in RTL', async ({ page }) => {
    await load(page, `
      <section id="stage" dir="rtl" data-test-stage>
        <layout-imposter id="s" data-layout-position="start" data-layout-margin="s"><p data-box>s</p></layout-imposter>
      </section>`, { head: `<style>[data-test-stage] { ${STAGE} } [data-box] { inline-size: 50px; margin: 0; }</style>` });
    const r = await page.evaluate(() => {
      const st = document.getElementById('stage').getBoundingClientRect();
      const b = document.getElementById('s').getBoundingClientRect();
      return { rightGap: st.right - b.right, leftGap: b.left - st.left };
    });
    expect(r.rightGap).toBeLessThan(r.leftGap);
  });

  test('centred overlay can use the full container width', async ({ page }) => {
    await load(page, `
      <section id="stage" data-test-stage>
        <layout-imposter id="i"><p data-box>${'Long text that should wrap only at the container width. '.repeat(6)}</p></layout-imposter>
      </section>`, { head: `<style>[data-test-stage] { position: relative; inline-size: 600px; block-size: 300px; } [data-box] { margin: 0; }</style>` });
    const w = await page.evaluate(() => document.getElementById('i').getBoundingClientRect().width);
    expect(w).toBeGreaterThan(500);
  });

  test('nested imposter is centred in its outer imposter (no leaked offsets)', async ({ page }) => {
    await load(page, `
      <section id="stage" data-test-stage>
        <layout-imposter id="outer" data-layout-position="top-start" data-layout-margin="m">
          <p data-outer-box>outer</p>
          <layout-imposter id="inner"><p data-box>in</p></layout-imposter>
        </layout-imposter>
      </section>`, { head: `<style>[data-test-stage] { ${STAGE} } [data-outer-box] { inline-size: 200px; block-size: 150px; margin: 0; } [data-box] { inline-size: 40px; margin: 0; }</style>` });
    const r = await page.evaluate(() => {
      const o = document.getElementById('outer').getBoundingClientRect();
      const i = document.getElementById('inner').getBoundingClientRect();
      return { dx: (i.left + i.width / 2) - (o.left + o.width / 2), dy: (i.top + i.height / 2) - (o.top + o.height / 2) };
    });
    expect(Math.abs(r.dx)).toBeLessThanOrEqual(1);
    expect(Math.abs(r.dy)).toBeLessThanOrEqual(1);
  });

  test('contain keeps an absolute imposter inside its container', async ({ page }) => {
    await load(page, `
      <section id="stage" data-test-stage>
        <layout-imposter id="i" data-layout-contain data-layout-margin="m"><p data-box>tall</p></layout-imposter>
      </section>`, { head: `<style>[data-test-stage] { position: relative; inline-size: 300px; block-size: 150px; } [data-box] { block-size: 600px; margin: 0; }</style>` });
    const r = await page.evaluate(() => {
      const s = document.getElementById('stage').getBoundingClientRect();
      const i = document.getElementById('i');
      const b = i.getBoundingClientRect();
      return { top: b.top - s.top, bottom: s.bottom - b.bottom, overflow: getComputedStyle(i).overflowY, z: getComputedStyle(i).zIndex };
    });
    expect(r.top).toBeGreaterThan(0);
    expect(r.bottom).toBeGreaterThan(0);
    expect(r.overflow).toBe('auto');
    expect(r.z).toBe('1');
  });
});

/* ---------------------------------------------------------------- canvas */

test.describe('layout-canvas', () => {
  test('plain page draws a hairline; data-backdrop keeps it transparent; nested sets --canvas-bg', async ({ page }) => {
    await load(page, `
      <article id="plain" data-canvas><p>plain</p>
        <aside id="nested" data-canvas><p>nested</p></aside>
      </article>
      <section data-backdrop><article id="bd" data-canvas><p>backdrop</p></article></section>`);
    const r = await page.evaluate(() => {
      const cs = (id) => getComputedStyle(document.getElementById(id));
      return {
        plainWidth: cs('plain').borderTopWidth,
        plainColor: cs('plain').borderTopColor,
        bdColor: cs('bd').borderTopColor,
        nestedBg: cs('nested').getPropertyValue('--canvas-bg').trim(),
        nestedPaint: cs('nested').backgroundColor,
        plainPaint: cs('plain').backgroundColor,
      };
    });
    expect(r.plainWidth).toBe('1px');
    expect(r.plainColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(r.bdColor).toBe('rgba(0, 0, 0, 0)');
    expect(r.nestedBg).not.toBe('');
    expect(r.nestedPaint).not.toBe(r.plainPaint);
  });

  test('forced colours: the edge is drawn', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await load(page, `<section data-backdrop><article id="c" data-canvas><p>c</p></article></section>`);
    const color = await page.evaluate(() => getComputedStyle(document.getElementById('c')).borderTopColor);
    expect(color).not.toBe('rgba(0, 0, 0, 0)');
  });

  test('mobile: element and attribute forms both go flush (elevated + depth)', async ({ page }) => {
    await page.setViewportSize({ width: 500, height: 800 });
    await load(page, `
      <layout-canvas id="el" data-variant="elevated"><p>e</p></layout-canvas>
      <section id="at" data-canvas="elevated"><p>a</p></section>
      <layout-canvas id="dep" data-canvas-depth="2"><p>d</p></layout-canvas>`);
    const r = await page.evaluate(() => ['el', 'at', 'dep'].map((id) => {
      const cs = getComputedStyle(document.getElementById(id));
      return { shadow: cs.boxShadow, radius: cs.borderTopLeftRadius };
    }));
    for (const s of r) {
      expect(s.shadow).toBe('none');
      expect(s.radius).toBe('0px');
    }
  });

  test('wide: elevated variant and depth apply', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await load(page, `
      <layout-canvas id="el" data-variant="elevated"><p>e</p></layout-canvas>
      <section id="at" data-canvas="elevated"><p>a</p></section>`);
    const r = await page.evaluate(() => ['el', 'at'].map((id) => getComputedStyle(document.getElementById(id)).boxShadow));
    expect(r[0]).not.toBe('none');
    expect(r[0]).toBe(r[1]);
  });

  test('narrow width falls back to 40rem', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 800 });
    await load(page, `<article id="n" data-canvas data-max="narrow"><p>n</p></article>`);
    const w = await page.evaluate(() => getComputedStyle(document.getElementById('n')).maxInlineSize);
    expect(w).toBe('640px');
  });
});
