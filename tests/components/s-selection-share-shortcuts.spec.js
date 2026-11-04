/**
 * S review — selection-menu, share-wc, short-cuts.
 *
 * selection-menu: keyboard open (Shift selection + Alt+F10), toolbar role /
 * name / roving tabindex, Escape returns focus and the range, observer
 * teardown on reconnect, scroll follow, escaped id selector, no stray
 * data-selection-menu="" on for targets.
 * share-wc: localized visible name (no aria-label override), label via
 * textContent, data-label-* strings, selection share uses the resolved
 * URL + announces in a document-level region, native failure falls back
 * to copy, shareTitle/url setters re-substitute slotted tokens and survive
 * reconnect, hidden tier display cleared, brand colour off the label.
 * short-cuts: shortcuts setter feeds the dialog, hotkey remap/none,
 * named dialog + close button + show()/close()/toggle(), section/h3/dl,
 * spoken key names, data-label-*.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

/**
 * @param {import('playwright/test').Page} page
 * @param {string} body
 * @param {{ modules: string[], head?: string, init?: string }} opts
 */
async function load(page, body, { modules, head = '', init = '' }) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__s4-${Math.random().toString(36).slice(2)}.html`;
  const imports = modules.map((m) => `import '/src/web-components/${m}/logic.js';`).join('\n');
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>S4 fixture</title>${head}
      <link rel="stylesheet" href="/src/main.css">
      <script>${init}</script>
      <script type="module">${imports}</script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction((names) => names.every((n) => customElements.get(n)), modules);
}

/* ---------------- selection-menu ---------------- */

const MENU = `
  <article id="a1"><p id="p1">Alpha bravo charlie delta echo foxtrot golf hotel.</p></article>
  <selection-menu id="m" for="a1" data-label="Reader tools">
    <button type="button" id="b1">One</button>
    <button type="button" id="b2">Two</button>
    <button type="button" id="b3">Three</button>
  </selection-menu>`;

/** Select a word of #p1 with the keyboard: place the caret, then Shift+Arrows. */
async function keyboardSelect(page) {
  await page.evaluate(() => {
    const p = document.getElementById('p1');
    p.setAttribute('tabindex', '-1');
    p.focus();
    const r = document.createRange();
    r.setStart(p.firstChild, 0);
    r.collapse(true);
    const s = window.getSelection();
    s.removeAllRanges();
    s.addRange(r);
  });
  // Headless Chromium has no caret browsing, so Shift+Arrow does not extend
  // a selection in static text: extend it with Selection.modify() while
  // Shift is held, as caret browsing / assistive tech would.
  await page.keyboard.down('Shift');
  await page.evaluate(() => {
    for (let i = 0; i < 5; i++) window.getSelection().modify('extend', 'forward', 'character');
  });
  await page.keyboard.up('Shift');
}

test.describe('selection-menu', () => {
  test('toolbar semantics on the composed pop-over', async ({ page }) => {
    await load(page, MENU, { modules: ['selection-menu'] });
    const pop = page.locator('pop-over[data-selection-menu-host]');
    await expect(pop).toHaveAttribute('role', 'toolbar');
    await expect(pop).toHaveAttribute('aria-label', 'Reader tools');
    await expect(pop).toHaveAttribute('aria-orientation', 'horizontal');
  });

  test('keyboard selection opens the toolbar; Alt+F10 focuses it; arrows rove', async ({ page }) => {
    await load(page, MENU, { modules: ['selection-menu'] });
    await keyboardSelect(page);
    const pop = page.locator('pop-over[data-selection-menu-host]');
    await expect(pop).toBeVisible();
    await page.keyboard.press('Alt+F10');
    await expect(page.locator('#b1')).toBeFocused();
    await expect(page.locator('#b1')).toHaveAttribute('tabindex', '0');
    await expect(page.locator('#b2')).toHaveAttribute('tabindex', '-1');
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#b2')).toBeFocused();
    await page.keyboard.press('End');
    await expect(page.locator('#b3')).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#b1')).toBeFocused();
    await page.keyboard.press('Home');
    await expect(page.locator('#b1')).toBeFocused();
  });

  test('a keyboard-driven selectionchange opens it without a Shift keyup (debounced)', async ({ page }) => {
    await load(page, MENU, { modules: ['selection-menu'] });
    await page.keyboard.press('Tab');
    await page.evaluate(() => {
      const p = document.getElementById('p1');
      const r = document.createRange();
      r.setStart(p.firstChild, 6);
      r.setEnd(p.firstChild, 11);
      const s = window.getSelection();
      s.removeAllRanges();
      s.addRange(r);
    });
    const pop = page.locator('pop-over[data-selection-menu-host]');
    await expect(pop).toBeVisible();
    expect(await page.evaluate(() => /** @type {any} */ (document.getElementById('m')).getSelection().text)).toBe('bravo');
  });

  test('Escape from inside the toolbar returns focus and the selection', async ({ page }) => {
    await load(page, MENU, { modules: ['selection-menu'] });
    await keyboardSelect(page);
    await page.keyboard.press('Alt+F10');
    await expect(page.locator('#b1')).toBeFocused();
    await page.keyboard.press('Escape');
    const pop = page.locator('pop-over[data-selection-menu-host]');
    await expect(pop).toBeHidden();
    const r = await page.evaluate(() => ({
      focus: document.activeElement?.id,
      sel: window.getSelection()?.toString(),
    }));
    expect(['a1', 'p1']).toContain(r.focus);
    expect(r.sel).toBe('Alpha');
    // Our own re-selection must not reopen the toolbar.
    await page.waitForTimeout(500);
    await expect(pop).toBeHidden();
  });

  test('an action that calls dismiss() from the keyboard returns focus and stays closed', async ({ page }) => {
    await load(page, MENU, { modules: ['selection-menu'] });
    await page.evaluate(() => document.getElementById('b2').addEventListener('click', () => {
      /** @type {any} */ (document.getElementById('m')).dismiss();
    }));
    await keyboardSelect(page);
    await page.keyboard.press('Alt+F10');
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#b2')).toBeFocused();
    await page.keyboard.press('Enter');
    const pop = page.locator('pop-over[data-selection-menu-host]');
    await expect(pop).toBeHidden();
    expect(await page.evaluate(() => document.activeElement?.id)).toMatch(/^(a1|p1)$/);
    await page.waitForTimeout(500);
    await expect(pop).toBeHidden();
  });

  test('Escape respects defaultPrevented', async ({ page }) => {
    await load(page, MENU, { modules: ['selection-menu'] });
    await page.evaluate(() => document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') e.preventDefault();
    }, { capture: true }));
    await keyboardSelect(page);
    const pop = page.locator('pop-over[data-selection-menu-host]');
    await expect(pop).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(pop).toBeVisible();
  });

  test('pointer selection still opens, select event carries detail', async ({ page }) => {
    await load(page, MENU, { modules: ['selection-menu'] });
    await page.evaluate(() => { /** @type {any} */ (window).__armed = new Promise((res) => {
      document.addEventListener('selection-menu:select', (e) => {
        const d = /** @type {CustomEvent} */ (e).detail;
        res({ text: d.text, target: d.target.id, range: d.range instanceof Range });
      }, { once: true });
    }); });
    const detail = page.evaluate(() => /** @type {any} */ (window).__armed);
    const box = await page.locator('#p1').boundingBox();
    await page.mouse.move(box.x + 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + 120, box.y + box.height / 2, { steps: 5 });
    await page.mouse.up();
    await expect(page.locator('pop-over[data-selection-menu-host]')).toBeVisible();
    const d = await detail;
    expect(d.target).toBe('a1');
    expect(d.range).toBe(true);
    expect(d.text.length).toBeGreaterThan(0);
  });

  test('toolbar follows the selection on scroll and hides when it leaves view', async ({ page }) => {
    await load(page, `<p style="block-size:40vh">Spacer</p>${MENU}<p style="block-size:300vh">Tail</p>`,
      { modules: ['selection-menu'] });
    await keyboardSelect(page);
    const pop = page.locator('pop-over[data-selection-menu-host]');
    await expect(pop).toBeVisible();
    const before = await pop.boundingBox();
    await page.evaluate(() => window.scrollBy(0, 100));
    await expect.poll(async () => (await pop.boundingBox())?.y).toBeLessThan(before.y - 50);
    await page.evaluate(() => window.scrollBy(0, 3000));
    await expect(pop).toBeHidden();
  });

  test('reconnect: one pop-over, observer disconnected, no listeners stacked', async ({ page }) => {
    await page.addInitScript(() => {
      const Orig = window.MutationObserver;
      /** @type {any} */ (window).__mo = { live: 0 };
      window.MutationObserver = class extends Orig {
        observe(...a) { /** @type {any} */ (window).__mo.live++; this.__on = true; return super.observe(...a); }
        disconnect() { if (this.__on) { /** @type {any} */ (window).__mo.live--; this.__on = false; } return super.disconnect(); }
      };
    });
    await load(page, MENU, { modules: ['selection-menu'] });
    const r = await page.evaluate(() => {
      const before = /** @type {any} */ (window).__mo.live;
      const m = document.getElementById('m');
      const main = document.querySelector('main');
      for (let i = 0; i < 3; i++) { m.remove(); main.append(m); }
      return {
        delta: /** @type {any} */ (window).__mo.live - before,
        pops: m.querySelectorAll('pop-over').length,
        buttons: m.querySelectorAll('button').length,
        upgraded: m.hasAttribute('data-upgraded'),
      };
    });
    expect(r).toEqual({ delta: 0, pops: 1, buttons: 3, upgraded: true });
    // Still works after the moves.
    let selects = 0;
    await page.exposeFunction('__onSelect', () => { selects++; });
    await page.evaluate(() => document.addEventListener('selection-menu:select', () => /** @type {any} */ (window).__onSelect()));
    await keyboardSelect(page);
    await expect(page.locator('pop-over[data-selection-menu-host]')).toBeVisible();
    await page.waitForTimeout(400);
    expect(selects).toBeGreaterThanOrEqual(1);
    expect(selects).toBeLessThanOrEqual(2);
  });

  test('for= without id leaves the target unmarked; quoted ids do not throw', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await load(page, `<p id="t">Text to select here.</p><selection-menu for="t"><button type="button">X</button></selection-menu>
      <p data-selection-menu='q"x'>Quoted</p><selection-menu id='q"x'><button type="button">Y</button></selection-menu>`,
    { modules: ['selection-menu'] });
    expect(await page.locator('#t').getAttribute('data-selection-menu')).toBeNull();
    expect(errors).toEqual([]);
  });

  test('touch selection places the toolbar below the selection', async ({ page }) => {
    await load(page, `<p style="block-size:30vh">Spacer</p>${MENU}`, { modules: ['selection-menu'] });
    await page.evaluate(() => {
      const p = document.getElementById('p1');
      const r = document.createRange();
      r.setStart(p.firstChild, 0);
      r.setEnd(p.firstChild, 5);
      const s = window.getSelection();
      s.removeAllRanges();
      s.addRange(r);
      document.dispatchEvent(new PointerEvent('pointerdown', { pointerType: 'touch', bubbles: true }));
      document.dispatchEvent(new PointerEvent('pointerup', { pointerType: 'touch', bubbles: true }));
    });
    const pop = page.locator('pop-over[data-selection-menu-host]');
    await expect(pop).toBeVisible();
    const sel = await page.evaluate(() => window.getSelection().getRangeAt(0).getBoundingClientRect().bottom);
    await expect.poll(async () => (await pop.boundingBox())?.y ?? 0).toBeGreaterThanOrEqual(sel);
  });
});

/* ---------------- share-wc ---------------- */

test.describe('share-wc', () => {
  test('native button: visible localized label is the name; label is text, not markup', async ({ page }) => {
    await load(page, '<share-wc id="s" label="<img src=x onerror=window.__xss=1>Teilen"></share-wc>', {
      modules: ['share-wc'],
      init: 'navigator.share = async () => {};',
    });
    await page.waitForSelector('share-wc[data-upgraded]', { state: 'attached' });
    const btn = page.locator('#s .share-trigger');
    await expect(btn).not.toHaveAttribute('aria-label', /.*/);
    await expect(btn).toHaveAccessibleName('<img src=x onerror=window.__xss=1>Teilen');
    expect(await page.evaluate(() => /** @type {any} */ (window).__xss)).toBeUndefined();
    expect(await page.locator('#s img').count()).toBe(0);
  });

  test('data-label-* localizes every generated string', async ({ page }) => {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await load(page, `<share-wc id="s" tier="platforms" platforms="x,copy"
      data-label-share-page="Diese Seite teilen" data-label-share-on="Auf {platform} teilen"
      data-label-copy="Link kopieren" data-label-copied="Kopiert!" data-label-link-copied="Link kopiert"></share-wc>`,
    { modules: ['share-wc'] });
    await page.waitForSelector('share-wc[data-upgraded]', { state: 'attached' });
    await expect(page.locator('#s nav')).toHaveAttribute('aria-label', 'Diese Seite teilen');
    await expect(page.locator('#s [data-platform="x"]')).toHaveAccessibleName('Auf X teilen');
    const copy = page.locator('#s [data-platform="copy"]');
    await expect(copy).toHaveAccessibleName('Link kopieren');
    await copy.click();
    await expect(copy.locator('.share-label')).toHaveText('Kopiert!');
    await expect(page.locator('[role="status"]', { hasText: 'Link kopiert' })).toHaveCount(1);
  });

  test('native share failure falls back to copying the link', async ({ page }) => {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await load(page, '<share-wc id="s" url="https://example.com/a"></share-wc>', {
      modules: ['share-wc'],
      init: 'navigator.share = async () => { throw new DOMException("no", "NotAllowedError"); };',
    });
    await page.waitForSelector('share-wc[data-upgraded]', { state: 'attached' });
    const events = page.evaluate(() => new Promise((res) => {
      const seen = [];
      const s = document.getElementById('s');
      s.addEventListener('share-wc:error', (e) => seen.push(['error', /** @type {CustomEvent} */ (e).detail.platform]));
      s.addEventListener('share-wc:success', (e) => { seen.push(['success', /** @type {CustomEvent} */ (e).detail.platform]); res(seen); });
    }));
    await page.locator('#s .share-trigger').click();
    expect(await events).toEqual([['error', 'native'], ['success', 'copy']]);
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('https://example.com/a');
  });

  test('share() copies the link outside the native tier', async ({ page }) => {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await load(page, '<share-wc id="s" tier="platforms" url="https://example.com/b"></share-wc>', { modules: ['share-wc'] });
    await page.waitForSelector('share-wc[data-upgraded]', { state: 'attached' });
    const ok = await page.evaluate(() => /** @type {any} */ (document.getElementById('s')).share());
    expect(ok).toBe(true);
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('https://example.com/b');
  });

  test('url/shareTitle setters re-substitute slotted tokens and survive reconnect', async ({ page }) => {
    await load(page, `<share-wc id="s" tier="platforms" url="https://example.com/old" title="Old">
      <a data-platform="x" href="https://x.com/intent/post?url={url}&text={title}">X</a></share-wc>`,
    { modules: ['share-wc'] });
    await page.waitForSelector('share-wc[data-upgraded]', { state: 'attached' });
    const link = page.locator('#s a[data-platform="x"]');
    await expect(link).toHaveAttribute('href', /old/);
    const r = await page.evaluate(() => {
      const s = /** @type {any} */ (document.getElementById('s'));
      s.url = 'https://example.com/new';
      s.shareTitle = 'New title';
      const tooltip = s.title;
      s.remove();
      document.querySelector('main').append(s);
      return { tooltip, url: s.url, title: s.shareTitle };
    });
    expect(r).toEqual({ tooltip: 'Old', url: 'https://example.com/new', title: 'New title' });
    await expect(link).toHaveAttribute('href', 'https://x.com/intent/post?url=https%3A%2F%2Fexample.com%2Fnew&text=New%20title');
  });

  test('slotted copy button copies once per click', async ({ page }) => {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await load(page, `<share-wc id="s" tier="platforms" url="https://example.com/c">
      <button type="button" data-platform="copy"><span class="share-label">Copy</span></button></share-wc>`,
    { modules: ['share-wc'] });
    await page.waitForSelector('share-wc[data-upgraded]', { state: 'attached' });
    const count = await page.evaluate(async () => {
      let n = 0;
      document.getElementById('s').addEventListener('share-wc:success', () => n++);
      const s = document.getElementById('s');
      s.remove(); document.querySelector('main').append(s);
      /** @type {HTMLElement} */ (s.querySelector('[data-platform="copy"]')).click();
      await new Promise((r) => setTimeout(r, 300));
      return n;
    });
    expect(count).toBe(1);
  });

  test('tier=hidden inline display is cleared on teardown', async ({ page }) => {
    await load(page, '<share-wc id="s" tier="native"></share-wc>', {
      modules: ['share-wc'],
      init: 'delete Navigator.prototype.share; navigator.share = undefined;',
    });
    await page.waitForSelector('share-wc[data-upgraded]', { state: 'attached' });
    expect(await page.evaluate(() => document.getElementById('s').style.display)).toBe('none');
    expect(await page.evaluate(() => { const s = document.getElementById('s'); s.remove(); return s.style.display; })).toBe('');
  });

  test('brand colours stay off the label text', async ({ page }) => {
    await load(page, '<share-wc id="s" tier="platforms" platforms="whatsapp" color></share-wc>', { modules: ['share-wc'] });
    await page.waitForSelector('share-wc[data-upgraded]', { state: 'attached' });
    const c = await page.evaluate(() => {
      const btn = document.querySelector('#s [data-platform="whatsapp"]');
      return {
        label: getComputedStyle(btn.querySelector('.share-label')).color,
        icon: getComputedStyle(btn.querySelector('icon-wc')).color,
        text: getComputedStyle(document.body).color,
      };
    });
    expect(c.label).toBe(c.text);
    expect(c.icon).not.toBe(c.text);
  });

  test('selection share copies the quote with the resolved URL and announces at document level', async ({ page }) => {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await load(page, `<article id="a1"><p id="p1">Alpha bravo charlie delta.</p></article>
      <selection-menu for="a1"><share-wc url="https://example.com/post" data-label-selection-copied="Zitat kopiert"></share-wc></selection-menu>`,
    { modules: ['selection-menu', 'share-wc'], init: 'navigator.share = undefined;' });
    await page.waitForSelector('share-wc[data-upgraded]', { state: 'attached' });
    await keyboardSelect(page);
    await expect(page.locator('pop-over[data-selection-menu-host]')).toBeVisible();
    await page.locator('.share-selection').click();
    await expect(page.locator('pop-over[data-selection-menu-host]')).toBeHidden();
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    expect(clip).toBe('"Alpha" — https://example.com/post#:~:text=Alpha');
    const region = page.locator('body > [role="status"]', { hasText: 'Zitat kopiert' });
    await expect(region).toHaveCount(1);
  });
});

/* ---------------- short-cuts ---------------- */

test.describe('short-cuts', () => {
  test('named dialog, close button, show/close/toggle, section/h3/dl', async ({ page }) => {
    await load(page, '<short-cuts id="sc"></short-cuts>', { modules: ['short-cuts'] });
    await page.waitForSelector('short-cuts[data-upgraded]', { state: 'attached' });
    await page.evaluate(() => /** @type {any} */ (document.getElementById('sc')).show());
    const dialog = page.getByRole('dialog', { name: 'Keyboard shortcuts' });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('section.shortcut-group > h3')).toHaveText(['General']);
    await expect(dialog.locator('dl dt.shortcut-label')).toHaveText(['Show keyboard shortcuts']);
    await dialog.getByRole('button', { name: 'Close' }).click();
    await expect(dialog).toBeHidden();
    await page.evaluate(() => /** @type {any} */ (document.getElementById('sc')).toggle());
    await expect(dialog).toBeVisible();
    await page.evaluate(() => /** @type {any} */ (document.getElementById('sc')).close());
    await expect(dialog).toBeHidden();
  });

  test('kbd badges carry a spoken name', async ({ page }) => {
    await load(page, '<short-cuts id="sc"></short-cuts>', { modules: ['short-cuts'] });
    await page.waitForSelector('short-cuts[data-upgraded]', { state: 'attached' });
    await page.evaluate(() => /** @type {any} */ (document.getElementById('sc')).show());
    const spoken = await page.locator('kbd.shortcut-kbd .visually-hidden').first().textContent();
    expect(spoken).toMatch(/Shift \?/);
    await expect(page.locator('kbd.shortcut-kbd > [aria-hidden="true"]').first()).toBeVisible();
  });

  test('shortcuts setter replaces the registry list', async ({ page }) => {
    await load(page, '<button type="button" data-hotkey="alt+z">Zap</button><short-cuts id="sc"></short-cuts>',
      { modules: ['short-cuts'] });
    await page.waitForSelector('short-cuts[data-upgraded]', { state: 'attached' });
    await page.evaluate(() => {
      const sc = /** @type {any} */ (document.getElementById('sc'));
      sc.shortcuts = { Editing: [{ label: 'Bold', shortcut: 'meta+b' }, { label: 'Italic', shortcut: 'meta+i' }] };
      sc.show();
    });
    await expect(page.locator('short-cuts h3')).toHaveText(['General', 'Editing']);
    await expect(page.locator('short-cuts dt')).toHaveText(['Show keyboard shortcuts', 'Bold', 'Italic']);
    // Updating while open re-renders.
    await page.evaluate(() => { /** @type {any} */ (document.getElementById('sc')).shortcuts = { Misc: [{ label: 'Go', shortcut: 'g' }] }; });
    await expect(page.locator('short-cuts h3')).toHaveText(['General', 'Misc']);
  });

  test('hotkey remap and hotkey="none"', async ({ page }) => {
    await load(page, '<p>Body</p><short-cuts id="sc" hotkey="alt+k"></short-cuts>', { modules: ['short-cuts'] });
    await page.waitForSelector('short-cuts[data-upgraded]', { state: 'attached' });
    const dialog = page.locator('short-cuts dialog');
    await page.keyboard.press('Shift+?');
    await expect(dialog).toBeHidden();
    await page.keyboard.press('Alt+k');
    await expect(dialog).toBeVisible();
    await expect(page.locator('short-cuts dt')).toHaveText(['Show keyboard shortcuts']);
    await page.keyboard.press('Escape');
    await page.evaluate(() => document.getElementById('sc').setAttribute('hotkey', 'none'));
    await page.keyboard.press('Alt+k');
    await page.keyboard.press('Shift+?');
    await expect(dialog).toBeHidden();
    await page.evaluate(() => /** @type {any} */ (document.getElementById('sc')).show());
    await expect(page.locator('short-cuts h3')).toHaveCount(0);
  });

  test('data-label-* localizes the dialog', async ({ page }) => {
    await load(page, `<short-cuts id="sc" data-label-title="Tastenkürzel" data-label-general="Allgemein"
      data-label-self="Tastenkürzel anzeigen" data-label-close="Schließen"></short-cuts>`, { modules: ['short-cuts'] });
    await page.waitForSelector('short-cuts[data-upgraded]', { state: 'attached' });
    await page.keyboard.press('Shift+?');
    const dialog = page.getByRole('dialog', { name: 'Tastenkürzel' });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('h3')).toHaveText(['Allgemein']);
    await expect(dialog.locator('dt')).toHaveText(['Tastenkürzel anzeigen']);
    await expect(dialog.getByRole('button', { name: 'Schließen' })).toBeVisible();
  });

  test('reconnect keeps one dialog and one binding', async ({ page }) => {
    await load(page, '<p>Body</p><short-cuts id="sc"></short-cuts>', { modules: ['short-cuts'] });
    await page.waitForSelector('short-cuts[data-upgraded]', { state: 'attached' });
    await page.evaluate(() => {
      const sc = document.getElementById('sc');
      const main = document.querySelector('main');
      for (let i = 0; i < 3; i++) { sc.remove(); main.append(sc); }
    });
    await expect(page.locator('short-cuts dialog')).toHaveCount(1);
    await page.keyboard.press('Shift+?');
    await expect(page.locator('short-cuts dialog')).toBeVisible();
    // A second press closes (a stacked binding would toggle twice).
    await page.keyboard.press('Shift+?');
    await expect(page.locator('short-cuts dialog')).toBeHidden();
  });
});

