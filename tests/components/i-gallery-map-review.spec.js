/**
 * image-gallery + image-map — review fixes (vanilla-breeze-9vrm).
 *
 * image-gallery: no HTML injection from .images captions, empty gallery
 * upgrades and works after the setter, plain close button (no invoker),
 * RTL keys + mirrored chevrons, named dialog, data-label-* strings,
 * captions attribute rebuilds the dialog, setter closes an open lightbox,
 * missing-alt fallback, reconnect, focus return.
 *
 * image-map: keyboard activation dispatches area-activate, tooltip hidden
 * from the a11y tree when closed, hoverable tooltip + Escape anywhere,
 * click-mode disclosure with focus in/out, single build before image load
 * and across reconnects, ids without crypto, regions round-trip,
 * forced-colors strokes.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');
const THUMB = (id) => `/src/assets/placeholders/photo-id-${id}-400x400.svg`;
const FULL = (id) => `/src/assets/placeholders/photo-id-${id}-1200x800.svg`;

async function load(page, body, { dir = 'ltr', tag, ready = true, delayImages = false } = {}) {
  await page.route('**/src/**', async (route) => {
    const path = join(REPO, decodeURIComponent(new URL(route.request().url()).pathname));
    if (delayImages && path.endsWith('-1200x800.svg')) await new Promise(r => setTimeout(r, 400));
    return route.fulfill({ path });
  });
  const url = `/__i-gallery-map-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en" dir="${dir}"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <script type="module">
        import '/src/web-components/icon-wc/icon-wc.js';
        import '/src/web-components/image-gallery/logic.js';
        import '/src/web-components/image-map/logic.js';
      </script>
      </head><body><main>${body}</main><p><button id="outside">Outside</button></p></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction((t) => customElements.get(t), tag);
  if (ready) await page.waitForSelector(`${tag}[data-upgraded]`, { state: 'attached' });
}

const GALLERY = `
  <image-gallery id="g" transition="none">
    <a href="${FULL(10)}"><img src="${THUMB(10)}" alt="Forest"></a>
    <figure>
      <a href="${FULL(15)}"><img src="${THUMB(15)}" alt="Hill"></a>
      <figcaption>Hill <a href="#more">more</a></figcaption>
    </figure>
    <a href="${FULL(20)}"><img src="${THUMB(20)}" alt="Coast"></a>
  </image-gallery>`;

test.describe('image-gallery', () => {
  test('setter captions never parse HTML', async ({ page }) => {
    await load(page, GALLERY, { tag: 'image-gallery' });
    const r = await page.evaluate(() => {
      const g = /** @type {any} */ (document.getElementById('g'));
      window.__pwned = false;
      g.images = [
        { href: '/a.svg', thumbSrc: '/a-t.svg', alt: 'A', caption: '<img src=x onerror="window.__pwned=true">' },
      ];
      g.open(0);
      return {
        gridImgs: g.querySelectorAll('figcaption img').length,
        text: g.querySelector(':scope > figure > figcaption').textContent,
        lightboxImgs: g.querySelectorAll('.gallery-caption-text img').length,
      };
    });
    await page.waitForTimeout(100);
    expect(r.gridImgs).toBe(0);
    expect(r.lightboxImgs).toBe(0);
    expect(r.text).toContain('<img');
    expect(await page.evaluate(() => window.__pwned)).toBe(false);
  });

  test('rich captions via Node/template; authored figcaption markup is cloned', async ({ page }) => {
    await load(page, GALLERY, { tag: 'image-gallery' });
    const r = await page.evaluate(() => {
      const g = /** @type {any} */ (document.getElementById('g'));
      const authored = g.images[1].caption;
      const tpl = document.createElement('template');
      tpl.innerHTML = '<strong>Bold</strong>';
      g.images = [{ href: '/a.svg', thumbSrc: '/a-t.svg', alt: 'A', caption: tpl }];
      return {
        authoredIsFragment: authored instanceof DocumentFragment,
        authoredLink: authored.querySelector('a')?.getAttribute('href'),
        strong: g.querySelector('figcaption strong')?.textContent,
      };
    });
    expect(r).toEqual({ authoredIsFragment: true, authoredLink: '#more', strong: 'Bold' });
  });

  test('empty gallery upgrades and works after the setter', async ({ page }) => {
    await load(page, `<image-gallery id="g" transition="none"></image-gallery>`, { tag: 'image-gallery' });
    await page.evaluate((src) => {
      /** @type {any} */ (document.getElementById('g')).images = [
        { href: src.full, thumbSrc: src.thumb, alt: 'One' },
        { href: src.full, thumbSrc: src.thumb, alt: 'Two' },
      ];
    }, { full: FULL(10), thumb: THUMB(10) });
    await page.locator('#g > a').first().click();
    await expect(page.locator('#g dialog')).toHaveJSProperty('open', true);
    await expect(page.locator('#g .gallery-counter')).toHaveText('Image 1 of 2');
  });

  test('close button is a plain button; dialog is named; labels overridable', async ({ page }) => {
    await load(page, GALLERY.replace('<image-gallery id="g"', '<image-gallery id="g" data-label-close="Fermer" data-label-counter="{n} / {total}"'), { tag: 'image-gallery' });
    await page.locator('#g > a').first().click();
    const close = page.locator('#g .gallery-close');
    expect(await close.getAttribute('command')).toBeNull();
    expect(await close.getAttribute('commandfor')).toBeNull();
    await expect(close).toHaveAttribute('aria-label', 'Fermer');
    await expect(page.locator('#g dialog')).toHaveAttribute('aria-label', 'Image viewer');
    await expect(page.locator('#g .gallery-counter')).toHaveText('1 / 3');
    await close.click();
    await expect(page.locator('#g dialog')).toHaveJSProperty('open', false);
  });

  test('keyboard navigation + focus returns to the thumbnail', async ({ page }) => {
    await load(page, GALLERY, { tag: 'image-gallery' });
    const first = page.locator('#g > a').first();
    await first.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#g dialog')).toHaveJSProperty('open', true);
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#g .gallery-counter')).toHaveText('Image 2 of 3');
    await page.keyboard.press('End');
    await expect(page.locator('#g .gallery-counter')).toHaveText('Image 3 of 3');
    await page.keyboard.press('Escape');
    await expect(page.locator('#g dialog')).toHaveJSProperty('open', false);
    await expect(first).toBeFocused();
  });

  test('morph transition: close button closes after the transition and focus returns', async ({ page }) => {
    await load(page, GALLERY.replace(' transition="none"', ''), { tag: 'image-gallery' });
    const first = page.locator('#g > a').first();
    await first.click();
    await expect(page.locator('#g dialog')).toHaveJSProperty('open', true);
    await page.locator('#g .gallery-close').click();
    await expect(page.locator('#g dialog')).toHaveJSProperty('open', false);
    await expect(first).toBeFocused();
    await expect.poll(() => first.locator('img').evaluate(el => el.style.viewTransitionName)).toBe('');
  });

  test('RTL: arrows follow reading direction, chevrons mirrored', async ({ page }) => {
    await load(page, GALLERY, { tag: 'image-gallery', dir: 'rtl' });
    await page.locator('#g > a').first().click();
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('#g .gallery-counter')).toHaveText('Image 2 of 3');
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#g .gallery-counter')).toHaveText('Image 1 of 3');
    const scale = await page.locator('#g .gallery-next > icon-wc').evaluate(el => getComputedStyle(el).scale);
    expect(scale).toBe('-1 1');
  });

  test('captions attribute change rebuilds the dialog; setter closes an open lightbox', async ({ page }) => {
    await load(page, GALLERY, { tag: 'image-gallery' });
    await page.evaluate(() => /** @type {any} */ (document.getElementById('g')).open(1));
    await expect(page.locator('#g .gallery-caption')).toBeVisible();
    await page.evaluate(() => document.getElementById('g').setAttribute('captions', 'overlay'));
    await expect(page.locator('#g dialog')).toHaveCount(0);
    await page.evaluate(() => /** @type {any} */ (document.getElementById('g')).open(1));
    await expect(page.locator('#g .gallery-frame > figcaption')).toContainText('Hill');
    await expect(page.locator('#g .gallery-caption')).toHaveCount(0);

    await page.evaluate((src) => {
      /** @type {any} */ (document.getElementById('g')).images = [{ href: src.full, thumbSrc: src.thumb, alt: 'X' }];
    }, { full: FULL(10), thumb: THUMB(10) });
    await expect(page.locator('#g dialog')).toHaveCount(0);
    await expect(page.locator('#g')).toHaveAttribute('data-upgraded', '');
  });

  test('missing alt: lazy thumbnail, anchor named, single warning', async ({ page }) => {
    const warnings = [];
    page.on('console', (m) => { if (m.type() === 'warning' && m.text().includes('image-gallery')) warnings.push(m.text()); });
    await load(page, GALLERY, { tag: 'image-gallery' });
    const r = await page.evaluate(() => {
      const g = /** @type {any} */ (document.getElementById('g'));
      g.images = [{ href: '/a.svg', thumbSrc: '/a-t.svg' }, { href: '/b.svg', thumbSrc: '/b-t.svg' }];
      g.images = [{ href: '/a.svg', thumbSrc: '/a-t.svg' }];
      const a = g.querySelector(':scope > a');
      return { label: a.getAttribute('aria-label'), loading: a.querySelector('img').loading };
    });
    expect(r).toEqual({ label: 'Image 1 of 1', loading: 'lazy' });
    expect(warnings.length).toBe(1);
  });

  test('reconnect keeps one dialog and working clicks', async ({ page }) => {
    await load(page, GALLERY, { tag: 'image-gallery' });
    await page.evaluate(() => {
      const g = /** @type {any} */ (document.getElementById('g'));
      g.open(0); g.close();
      const main = document.querySelector('main');
      for (let i = 0; i < 3; i++) { g.remove(); main.append(g); }
    });
    await page.locator('#g > a').nth(1).click();
    await expect(page.locator('#g dialog')).toHaveCount(1);
    await expect(page.locator('#g .gallery-counter')).toHaveText('Image 3 of 3');
  });
});

const MAP = (extra = '') => `
  <image-map id="m">
    <img src="${FULL(10)}" alt="Floor plan">
    <map-area shape="rect" coords="5 5 40 40" label="Hall" href="#hall"><strong>Hall</strong><p>Seats 120.</p></map-area>
    <map-area shape="circle" coords="70 30 10" label="Server"><strong>Server</strong><p>24 racks.</p></map-area>
    <map-area shape="rect" coords="10 60 50 90" label="Book" tooltip="click"><p><a href="#book">Book room</a></p></map-area>
    ${extra}
  </image-map>`;

test.describe('image-map', () => {
  test('Enter/Space on hotspots dispatch area-activate', async ({ page }) => {
    await load(page, MAP(), { tag: 'image-map' });
    await page.evaluate(() => {
      window.__acts = [];
      const m = document.getElementById('m');
      m.addEventListener('image-map:area-activate', (e) => {
        window.__acts.push(/** @type {any} */ (e).detail.area.getAttribute('label'));
        e.preventDefault(); // keep the link from navigating
      });
    });
    const anchors = page.locator('#m .image-map-anchor');
    await anchors.nth(1).focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press(' ');
    await anchors.nth(0).focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press(' ');
    expect(await page.evaluate(() => window.__acts)).toEqual(['Server', 'Server', 'Hall', 'Hall']);
    expect(page.url()).not.toContain('#hall');
  });

  test('tooltip is hidden (out of a11y tree) when closed; per-area description', async ({ page }) => {
    await load(page, MAP(), { tag: 'image-map' });
    const tip = page.locator('#m .image-map-tooltip');
    await expect(tip).toBeHidden();
    expect(await tip.evaluate(el => el.hidden)).toBe(true);
    expect(await tip.getAttribute('aria-live')).toBeNull();
    const r = await page.evaluate(() => {
      const anchors = [...document.querySelectorAll('#m .image-map-anchor')];
      return anchors.map(a => a.getAttribute('aria-describedby'));
    });
    expect(new Set(r.filter(Boolean)).size).toBe(2); // hover areas: distinct; click area: none
    expect(r[2]).toBeNull();

    await page.locator('#m .image-map-anchor').first().focus();
    await expect(tip).toBeVisible();
    await expect(tip).toHaveAttribute('role', 'tooltip');
    await expect(tip).toContainText('Seats 120');
  });

  test('hover tooltip is hoverable and dismissed by Escape anywhere / outside tap', async ({ page }) => {
    await load(page, MAP(), { tag: 'image-map' });
    const tip = page.locator('#m .image-map-tooltip');
    const shape = page.locator('#m svg rect').first();
    await shape.hover();
    await expect(tip).toBeVisible();
    const box = await tip.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 4 });
    await page.waitForTimeout(450);
    await expect(tip).toBeVisible();
    // Focus is outside the host — Escape still dismisses.
    await page.locator('#outside').focus();
    await page.mouse.move(0, 0);
    await shape.hover();
    await expect(tip).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(tip).toBeHidden();
    // Outside tap closes too.
    await page.mouse.move(0, 0);
    await shape.hover();
    await expect(tip).toBeVisible();
    await page.locator('#outside').dispatchEvent('pointerdown');
    await expect(tip).toBeHidden();
  });

  test('tooltip="none" is honoured on focus', async ({ page }) => {
    await load(page, MAP(`<map-area shape="rect" coords="60 60 90 90" label="Quiet" tooltip="none"><p>Nope</p></map-area>`), { tag: 'image-map' });
    await page.locator('#m .image-map-anchor').nth(3).focus();
    await expect(page.locator('#m .image-map-tooltip')).toBeHidden();
  });

  test('click-mode: Enter opens, moves focus in, Escape returns focus', async ({ page }) => {
    await load(page, MAP(), { tag: 'image-map' });
    const anchor = page.locator('#m .image-map-anchor').nth(2);
    await anchor.focus();
    await expect(page.locator('#m .image-map-tooltip')).toBeHidden();
    await page.keyboard.press('Enter');
    await expect(anchor).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#m .image-map-tooltip a')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.locator('#m .image-map-tooltip')).toBeHidden();
    await expect(anchor).toBeFocused();
    await expect(anchor).toHaveAttribute('aria-expanded', 'false');
  });

  test('area-enter/leave fire on focus and blur', async ({ page }) => {
    await load(page, MAP(), { tag: 'image-map' });
    await page.evaluate(() => {
      window.__ev = [];
      const m = document.getElementById('m');
      for (const n of ['image-map:area-enter', 'image-map:area-leave']) {
        m.addEventListener(n, () => window.__ev.push(n.split(':')[1]));
      }
    });
    await page.locator('#m .image-map-anchor').nth(1).focus();
    await page.locator('#outside').focus();
    expect(await page.evaluate(() => window.__ev)).toEqual(['area-enter', 'area-leave']);
  });

  test('single overlay before image load and across reconnects; ids without crypto', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window.crypto, 'randomUUID', { value: () => { throw new Error('insecure'); } });
    });
    await load(page, MAP(), { tag: 'image-map', ready: false, delayImages: true });
    await page.evaluate(() => {
      const m = document.getElementById('m');
      const main = document.querySelector('main');
      m.remove(); main.append(m); // reconnect while the image is still loading
    });
    await page.waitForFunction(() => document.querySelector('#m > svg'));
    await page.waitForTimeout(500);
    await page.evaluate(() => {
      const m = document.getElementById('m');
      const main = document.querySelector('main');
      for (let i = 0; i < 3; i++) { m.remove(); main.append(m); }
    });
    const r = await page.evaluate(() => {
      const m = document.getElementById('m');
      return {
        svgs: m.querySelectorAll(':scope > svg').length,
        tips: m.querySelectorAll('.image-map-tooltip').length,
        anchors: m.querySelectorAll('.image-map-anchor').length,
        tipId: m.querySelector('.image-map-tooltip').id,
      };
    });
    expect(r.svgs).toBe(1);
    expect(r.tips).toBe(1);
    expect(r.anchors).toBe(3);
    expect(r.tipId).toMatch(/^imap-tip-\d+$/);
  });

  test('regions round-trip keeps tooltip, disabled and content (text-only strings)', async ({ page }) => {
    await load(page, MAP(`<map-area shape="rect" coords="60 60 90 90" label="Off" disabled tooltip="click">Closed</map-area>`), { tag: 'image-map' });
    const r = await page.evaluate(() => {
      const m = /** @type {any} */ (document.getElementById('m'));
      window.__pwned = false;
      const before = m.regions;
      m.regions = before;
      const after = m.regions;
      m.regions = [{ shape: 'rect', coords: '0 0 10 10', label: 'X', content: '<img src=x onerror="window.__pwned=true">' }];
      return {
        tooltip: after[3].tooltip,
        disabled: after[3].disabled,
        content3: after[3].content,
        hasRich: after[0].content instanceof DocumentFragment && !!after[0].content.querySelector('strong'),
        clickTooltip: after[2].tooltip,
        injected: m.querySelectorAll('map-area img').length,
      };
    });
    expect(r).toEqual({ tooltip: 'click', disabled: true, content3: 'Closed', hasRich: true, clickTooltip: 'click', injected: 0 });
    await page.waitForTimeout(50);
    expect(await page.evaluate(() => window.__pwned)).toBe(false);
  });

  test('empty label falls back to text content; data-label-map names the group', async ({ page }) => {
    await load(page, `<image-map id="m" data-label-map="Plan"><img src="${FULL(10)}" alt=""><map-area shape="rect" coords="0 0 10 10">Lobby</map-area></image-map>`, { tag: 'image-map' });
    await expect(page.locator('#m .image-map-anchor')).toHaveText('Lobby');
    await expect(page.locator('#m')).toHaveAttribute('aria-label', 'Plan');
  });

  test('forced colors: system strokes, thicker on hover', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await load(page, MAP(), { tag: 'image-map' });
    const shape = page.locator('#m svg rect').first();
    const base = await shape.evaluate(el => parseFloat(getComputedStyle(el).strokeWidth));
    await page.locator('#m .image-map-anchor').first().focus();
    const focused = await shape.evaluate(el => parseFloat(getComputedStyle(el).strokeWidth));
    expect(focused).toBeGreaterThan(base);
  });
});
