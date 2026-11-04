/**
 * reader-view + reading-progress — Q+R review fixes.
 *
 * reader-view: pages mode as a modal-like overlay (inert background, scroll
 * lock, focus in/out, Escape), print in pages mode, per-page storage key and
 * opt-in mode restore, no <main>, RTL paging, labelled groups + aria-pressed,
 * page keys from the chrome, data-label-*, observed mode/columns, reconnect.
 * reading-progress: decorative (aria-hidden) bar, missing data-for target
 * fallback + late target, observed data-for, RTL/forced-colors, offset token.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

async function load(page, body, { dir = 'ltr', tag = 'reader-view', path = '' } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__qr-reader${path}-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en" dir="${dir}"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <script type="module">
        import '/src/web-components/reader-view/logic.js';
        import '/src/web-components/reading-progress/logic.js';
      </script>
      </head><body>${body}</body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction((t) => customElements.get(t), tag);
  return url;
}

const PARAS = Array.from({ length: 40 }, (_, i) =>
  `<p>Paragraph ${i + 1}. The column has always been the natural unit of reading; scribes understood that the eye moves most comfortably across a measure of roughly sixty characters, and the page imposes a small contract of completion at every turn.</p>`).join('');

const READER = `
  <header id="site-header"><a href="#x" id="outside-link">Outside link</a></header>
  <main id="page-main">
    <reader-view id="rv">
      <article><h1>Slow Reading</h1>${PARAS}</article>
    </reader-view>
    <p><button type="button" id="after">After</button></p>
  </main>`;

async function enterPages(page) {
  await page.click('[data-reader-action="set-mode-pages"]');
  await page.waitForFunction(() => {
    const t = document.querySelector('[data-reader-output="page-indicator"]')?.textContent ?? '';
    return /\/\s*([2-9]|\d{2,})/.test(t);
  });
}

test.describe('reader-view', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
  });

  test('no <main> landmark, labelled groups, no toolbar role', async ({ page }) => {
    await load(page, READER);
    const r = await page.evaluate(() => {
      const rv = document.getElementById('rv');
      return {
        mains: document.querySelectorAll('main').length,
        toolbar: rv.querySelectorAll('[role="toolbar"]').length,
        groups: [...rv.querySelectorAll('.reader-control-group')].map(g => [g.getAttribute('role'), g.getAttribute('aria-label')]),
        cols: [...rv.querySelectorAll('[data-reader-action="set-columns"]')].map(b => [b.getAttribute('aria-label'), b.getAttribute('aria-pressed')]),
      };
    });
    expect(r.mains).toBe(1);
    expect(r.toolbar).toBe(0);
    expect(r.groups).toEqual([['group', 'Reading mode'], ['group', 'Font size'], ['group', 'Page columns']]);
    expect(r.cols).toEqual([['Auto columns', 'true'], ['1 column', 'false'], ['2 columns', 'false'], ['3 columns', 'false']]);
  });

  test('column buttons sync aria-pressed; columns attribute is observed', async ({ page }) => {
    await load(page, READER);
    await page.click('[data-reader-value="2"]');
    expect(await page.getAttribute('#rv', 'columns')).toBe('2');
    expect(await page.getAttribute('[data-reader-value="2"]', 'aria-pressed')).toBe('true');
    expect(await page.getAttribute('[data-reader-value="auto"]', 'aria-pressed')).toBe('false');
    await page.evaluate(() => document.getElementById('rv').setAttribute('columns', '3'));
    expect(await page.getAttribute('[data-reader-value="3"]', 'aria-pressed')).toBe('true');
    expect(await page.getAttribute('[data-reader-value="2"]', 'aria-pressed')).toBe('false');
  });

  test('pages mode: inert background, scroll lock, focus in, Escape out', async ({ page }) => {
    await load(page, READER);
    await enterPages(page);
    const inside = await page.evaluate(() => {
      const rv = document.getElementById('rv');
      return {
        focusInPager: !!document.activeElement?.closest('.reader-pager'),
        headerInert: document.getElementById('site-header').inert,
        afterInert: document.getElementById('after').closest('p').inert,
        rvInert: rv.inert || !!rv.closest('[inert]'),
        overflow: getComputedStyle(document.documentElement).overflow,
        z: Number(getComputedStyle(rv).zIndex),
      };
    });
    expect(inside).toEqual({ focusInPager: true, headerInert: true, afterInert: true, rvInert: false, overflow: 'hidden', z: 9000 });

    await page.keyboard.press('Escape');
    const outside = await page.evaluate(() => ({
      mode: document.getElementById('rv').getAttribute('mode'),
      headerInert: document.getElementById('site-header').inert,
      afterInert: document.getElementById('after').closest('p').inert,
      focused: document.activeElement?.getAttribute('data-reader-action'),
      overflow: getComputedStyle(document.documentElement).overflow,
    }));
    expect(outside).toEqual({ mode: 'scroll', headerInert: false, afterInert: false, focused: 'set-mode-pages', overflow: 'visible' });
  });

  test('page keys work while focus is on a chrome button; Space still activates it', async ({ page }) => {
    await load(page, READER);
    await enterPages(page);
    await page.focus('[data-reader-action="set-mode-pages"]');
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('[data-reader-output="page-indicator"]')).toHaveText(/^2 \//);
    await page.keyboard.press('End');
    const total = await page.evaluate(() => document.querySelector('[data-reader-output="page-indicator"]').textContent.split('/')[1].trim());
    await expect(page.locator('[data-reader-output="page-indicator"]')).toHaveText(`${total} / ${total}`);
    // Space on the focused "Scroll" button activates it rather than paging
    await page.focus('[data-reader-action="set-mode-scroll"]');
    await page.keyboard.press('Space');
    expect(await page.getAttribute('#rv', 'mode')).toBe('scroll');
  });

  test('print in pages mode shows the article unclipped', async ({ page }) => {
    await load(page, READER);
    await enterPages(page);
    await page.emulateMedia({ media: 'print' });
    const r = await page.evaluate(() => {
      const rv = document.getElementById('rv');
      const pager = rv.querySelector('.reader-pager');
      const cols = rv.querySelector('layout-columns');
      const last = rv.querySelector('article p:last-of-type');
      return {
        pagerDisplay: getComputedStyle(pager).display,
        pagerOverflow: getComputedStyle(pager).overflowX,
        position: getComputedStyle(rv).position,
        columnCount: getComputedStyle(cols).columnCount,
        lastVisible: last.getBoundingClientRect().height > 0,
        scrollsHorizontally: pager.scrollWidth > pager.clientWidth + 1,
      };
    });
    expect(r).toEqual({ pagerDisplay: 'block', pagerOverflow: 'visible', position: 'static', columnCount: 'auto', lastVisible: true, scrollsHorizontally: false });
  });

  test('storage key is per page + id; pages mode is not restored without opt-in', async ({ page }) => {
    const url = await load(page, READER);
    await enterPages(page);
    const key = await page.evaluate(() => Object.keys(localStorage).find(k => k.startsWith('vb-reader')));
    expect(key).toBe(`vb-reader:${new URL(url, 'http://x').pathname}#rv`);

    // Same key, no opt-in: opens in scroll mode
    const fresh = await page.evaluate((k) => {
      localStorage.setItem('shared', localStorage.getItem(k));
      const make = (remember) => {
        const rv = document.createElement('reader-view');
        rv.setAttribute('storage-key', 'shared');
        if (remember) rv.setAttribute('data-remember-mode', '');
        rv.innerHTML = '<article><p>x</p></article>';
        document.body.append(rv);
        const mode = rv.getAttribute('mode');
        rv.remove();
        return mode;
      };
      return { plain: make(false), remember: make(true) };
    }, key);
    expect(fresh).toEqual({ plain: 'scroll', remember: 'pages' });
  });

  test('mode attribute is observed and events carry detail', async ({ page }) => {
    await load(page, READER);
    const events = await page.evaluate(async () => {
      const rv = document.getElementById('rv');
      const log = [];
      for (const t of ['reader-view:mode', 'reader-view:page', 'reader-view:font']) {
        rv.addEventListener(t, (e) => log.push([t, e.detail]));
      }
      rv.setAttribute('mode', 'pages');
      await new Promise(r => setTimeout(r, 150));
      rv.querySelector('[data-reader-action="font-increase"]').click();
      rv.setAttribute('mode', 'scroll');
      return log;
    });
    expect(events[0]).toEqual(['reader-view:mode', { mode: 'pages' }]);
    expect(events.some(([t, d]) => t === 'reader-view:page' && d.total > 1)).toBe(true);
    expect(events).toContainEqual(['reader-view:font', { size: '1.0625rem', index: 3 }]);
    expect(events.at(-1)).toEqual(['reader-view:mode', { mode: 'scroll' }]);
  });

  test('RTL paging: scrollLeft goes negative, arrows mirror, pill centred', async ({ page }) => {
    await load(page, READER, { dir: 'rtl' });
    await enterPages(page);
    await page.click('[data-reader-action="next-page"]');
    await expect(page.locator('[data-reader-output="page-indicator"]')).toHaveText(/^2 \//);
    await page.waitForFunction(() => document.querySelector('.reader-pager').scrollLeft < -10);
    await page.focus('.reader-pager');
    await page.keyboard.press('ArrowLeft'); // forward in RTL
    await expect(page.locator('[data-reader-output="page-indicator"]')).toHaveText(/^3 \//);
    await page.keyboard.press('ArrowRight'); // back in RTL
    await expect(page.locator('[data-reader-output="page-indicator"]')).toHaveText(/^2 \//);
    const r = await page.evaluate(() => {
      const nav = document.querySelector('.reader-page-nav').getBoundingClientRect();
      const book = document.querySelector('.reader-book').getBoundingClientRect();
      return {
        centreDelta: Math.abs((nav.left + nav.right) / 2 - (book.left + book.right) / 2),
        origin: getComputedStyle(document.querySelector('.reader-progress')).transformOrigin,
        width: /** @type {HTMLElement} */ (document.querySelector('.reader-progress')).offsetWidth,
      };
    });
    expect(r.centreDelta).toBeLessThan(2);
    expect(r.origin.startsWith(`${r.width}px`)).toBe(true);
  });

  test('data-label-* overrides UI strings', async ({ page }) => {
    await load(page, `<reader-view data-label-pages="Seiten" data-label-columns-group="Spalten" data-label-column-2="2 Spalten" data-label-page-indicator="Seite {page} von {total}"><article><p>Hallo</p></article></reader-view>`);
    const r = await page.evaluate(() => ({
      pages: document.querySelector('[data-reader-action="set-mode-pages"]').textContent,
      group: document.querySelectorAll('.reader-control-group')[2].getAttribute('aria-label'),
      col2: document.querySelector('[data-reader-value="2"]').getAttribute('aria-label'),
    }));
    expect(r).toEqual({ pages: 'Seiten', group: 'Spalten', col2: '2 Spalten' });
    await page.click('[data-reader-action="set-mode-pages"]');
    await expect(page.locator('[data-reader-output="page-indicator"]')).toHaveText(/^Seite 1 von \d+$/);
  });

  test('remove + reinsert in pages mode keeps one chrome and working controls', async ({ page }) => {
    await load(page, READER);
    await enterPages(page);
    const r = await page.evaluate(async () => {
      const rv = document.getElementById('rv');
      const main = document.getElementById('page-main');
      rv.remove();
      const releasedOnRemove = !document.getElementById('site-header').inert;
      main.prepend(rv);
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      return {
        releasedOnRemove,
        chromes: rv.querySelectorAll('.reader-chrome').length,
        pagers: rv.querySelectorAll('.reader-pager').length,
        mode: rv.getAttribute('mode'),
        headerInert: document.getElementById('site-header').inert,
      };
    });
    expect(r).toEqual({ releasedOnRemove: true, chromes: 1, pagers: 1, mode: 'pages', headerInert: true });
    await page.click('[data-reader-action="next-page"]');
    await expect(page.locator('[data-reader-output="page-indicator"]')).toHaveText(/^2 \//);
    await page.click('[data-reader-action="set-mode-scroll"]');
    expect(await page.evaluate(() => document.getElementById('site-header').inert)).toBe(false);
  });

  test('forced colors: active segment uses Highlight', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await load(page, READER);
    const bg = await page.evaluate(() => {
      const probe = document.createElement('span');
      probe.style.backgroundColor = 'Highlight';
      document.body.append(probe);
      const hl = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return [getComputedStyle(document.querySelector('[data-reader-action="set-mode-scroll"]')).backgroundColor, hl];
    });
    expect(bg[0]).toBe(bg[1]);
  });
});

const ARTICLE = `<article id="story">${PARAS}</article>`;

test.describe('reading-progress', () => {
  test('bar is decorative: aria-hidden progress, no label', async ({ page }) => {
    await load(page, `<reading-progress></reading-progress>${ARTICLE}`, { tag: 'reading-progress' });
    await page.waitForSelector('reading-progress[data-upgraded]');
    const r = await page.evaluate(() => {
      const p = document.querySelector('reading-progress progress');
      return { hidden: p.getAttribute('aria-hidden'), label: p.getAttribute('aria-label') };
    });
    expect(r).toEqual({ hidden: 'true', label: null });
    const snap = await page.locator('body').ariaSnapshot();
    expect(snap).not.toContain('progressbar');
  });

  test('data-for ratio follows the target', async ({ page }) => {
    await load(page, `<reading-progress data-for="story"></reading-progress><p>Intro</p>${ARTICLE}<p>Outro</p>`, { tag: 'reading-progress' });
    await page.waitForSelector('reading-progress[data-upgraded]');
    const read = () => page.evaluate(() => Number(getComputedStyle(document.querySelector('reading-progress')).getPropertyValue('--vb-reading-progress')));
    expect(await read()).toBe(0);
    await page.evaluate(() => {
      const r = document.getElementById('story').getBoundingClientRect();
      window.scrollTo(0, window.scrollY + r.top + (r.height - innerHeight) / 2);
    });
    await expect.poll(read).toBeGreaterThan(0.4);
    expect(await read()).toBeLessThan(0.6);
  });

  test('missing data-for target falls back to document progress, then adopts a late target', async ({ page }) => {
    await load(page, `<reading-progress data-for="later"></reading-progress>${ARTICLE}<section id="slot"></section>`, { tag: 'reading-progress' });
    await page.waitForSelector('reading-progress[data-upgraded]');
    const read = () => page.evaluate(() => Number(getComputedStyle(document.querySelector('reading-progress')).getPropertyValue('--vb-reading-progress')));
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect.poll(read).toBeGreaterThan(0.95);
    // The target appears below the current viewport: progress drops to 0
    await page.evaluate(() => {
      const late = document.createElement('article');
      late.id = 'later';
      late.style.blockSize = '300vh';
      document.getElementById('slot').append(late);
    });
    await page.evaluate(() => window.scrollBy(0, 1));
    await expect.poll(read).toBeLessThan(0.05);
  });

  test('data-for is observed', async ({ page }) => {
    await load(page, `<reading-progress data-for="story"></reading-progress>${ARTICLE}<article id="other"><p>Short</p></article>`, { tag: 'reading-progress' });
    await page.waitForSelector('reading-progress[data-upgraded]');
    const target = await page.evaluate(async () => {
      const rp = /** @type {any} */ (document.querySelector('reading-progress'));
      rp.dataset.for = 'other';
      return rp.target?.id;
    });
    expect(target).toBe('other');
    expect(await page.locator('reading-progress progress').count()).toBe(1);
  });

  test('RTL fills from the right; forced colors paint Highlight; offset token', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await load(page, `<reading-progress style="--reading-progress-offset: 4rem"></reading-progress>${ARTICLE}`, { dir: 'rtl', tag: 'reading-progress' });
    await page.waitForSelector('reading-progress[data-upgraded]');
    const r = await page.evaluate(() => {
      const rp = document.querySelector('reading-progress');
      const after = getComputedStyle(rp, '::after');
      const probe = document.createElement('span');
      probe.style.backgroundColor = 'Highlight';
      document.body.append(probe);
      const hl = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return {
        origin: after.transformOrigin,
        width: rp.getBoundingClientRect().width,
        bg: after.backgroundColor === hl,
        top: rp.getBoundingClientRect().top,
      };
    });
    expect(r.origin.startsWith(`${r.width}px`)).toBe(true);
    expect(r.bg).toBe(true);
    expect(r.top).toBe(64);
  });

  test('reconnect keeps one progress child and keeps tracking', async ({ page }) => {
    await load(page, `<reading-progress data-for="story"></reading-progress>${ARTICLE}`, { tag: 'reading-progress' });
    await page.waitForSelector('reading-progress[data-upgraded]');
    await page.evaluate(() => {
      const rp = document.querySelector('reading-progress');
      rp.remove(); document.body.prepend(rp);
    });
    expect(await page.locator('reading-progress progress').count()).toBe(1);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect.poll(() => page.evaluate(() => Number(getComputedStyle(document.querySelector('reading-progress')).getPropertyValue('--vb-reading-progress')))).toBeGreaterThan(0.95);
  });
});
