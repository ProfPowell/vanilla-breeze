/**
 * settings-panel, site-tools, site-legal — S-review fixes.
 *
 * settings-panel: external-change sync applies e.detail; the sticky toggle
 * and Reset touch only <html data-sticky> (sticky-manager owns the banner
 * header, authored header[data-sticky] survives); no duplicate panel or
 * leaked work on reconnect/removal; the data setter applies and is safe
 * before render; open() moves focus in, Escape returns it, Tab out closes;
 * in-panel reset confirm (no window.confirm); reconnect while open resets;
 * per-instance ids/names; data-label-* overrides; live status regions.
 * site-legal: underlined links, decorative separators outside link boxes,
 * wrapped-row leading separator clipped, list form.
 * header.html: the notification bell stays visible on mobile.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';

const REPO = join(import.meta.dirname, '..', '..');

async function load(page, body, { modules = ['/src/web-components/settings-panel/logic.js'], htmlAttrs = '', ready = 'settings-panel[data-upgraded]' } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__s-settings-site-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en" ${htmlAttrs}><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <script type="module">${modules.map((m) => `import '${m}';`).join('')}</script>
      </head><body>${body}</body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  if (ready) await page.waitForSelector(ready, { state: 'attached' });
}

/** Wait for the async VBStore hydration + any pending microtasks. */
const settle = (page) => page.evaluate(() => new Promise((r) => setTimeout(r, 50)));

test.describe('settings-panel', () => {
  test('external vb:* events apply their detail (no stale state written back)', async ({ page }) => {
    await load(page, '<main><settings-panel id="sp"></settings-panel></main>');
    await settle(page);
    const r = await page.evaluate(() => {
      const sp = /** @type {any} */ (document.getElementById('sp'));
      window.dispatchEvent(new CustomEvent('vb:extensions-change', { detail: { motionFx: false, sounds: false } }));
      window.dispatchEvent(new CustomEvent('vb:a11y-themes-change', { detail: ['a11y-dyslexia'] }));
      const motion = /** @type {HTMLInputElement} */ (sp.querySelector('input[data-ext="motionFx"]')).checked;
      const dys = /** @type {HTMLInputElement} */ (sp.querySelector('input[data-a11y="a11y-dyslexia"]')).checked;
      // Toggling another a11y theme now must keep the externally-set one
      const large = /** @type {HTMLInputElement} */ (sp.querySelector('input[data-a11y="a11y-large-text"]'));
      large.checked = true;
      large.dispatchEvent(new Event('change'));
      return { motion, dys, data: sp.data };
    });
    expect(r.motion).toBe(false);
    expect(r.dys).toBe(true);
    expect(r.data.extensions.motionFx).toBe(false);
    expect(r.data.a11yThemes).toEqual(['a11y-dyslexia', 'a11y-large-text']);
  });

  test('sticky toggle owns only <html data-sticky>; authored header[data-sticky] survives off + Reset', async ({ page }) => {
    await load(page, `
      <main><article><header id="card-h"><h2>Card</h2></header></article></main>
      <header id="banner" data-sticky><p>Banner</p></header>
      <footer><settings-panel id="sp"></settings-panel></footer>`);
    await settle(page);
    const toggle = async (on) => page.evaluate(async (on) => {
      const input = /** @type {HTMLInputElement} */ (document.querySelector('#sp input[data-sticky-toggle]'));
      input.checked = on;
      input.dispatchEvent(new Event('change'));
      await new Promise((r) => setTimeout(r, 50));
    }, on);
    const state = () => page.evaluate(() => ({
      root: document.documentElement.hasAttribute('data-sticky'),
      banner: document.getElementById('banner').hasAttribute('data-sticky'),
      card: document.getElementById('card-h').hasAttribute('data-sticky'),
    }));
    await toggle(true);
    expect(await state()).toEqual({ root: true, banner: true, card: false });
    await toggle(false);
    expect(await state()).toEqual({ root: false, banner: true, card: false });
    await toggle(true);
    await page.evaluate(async () => {
      const sp = document.getElementById('sp');
      /** @type {HTMLButtonElement} */ (sp.querySelector('.settings-reset')).click();
      /** @type {HTMLButtonElement} */ (sp.querySelector('[data-action="reset-confirm"]')).click();
      await new Promise((r) => setTimeout(r, 50));
    });
    expect(await state()).toEqual({ root: false, banner: true, card: false });
  });

  test('sticky manager adds and removes the banner attribute it owns', async ({ page }) => {
    await load(page, `
      <header id="banner"><p>Banner</p></header>
      <main><settings-panel id="sp"></settings-panel></main>`);
    await settle(page);
    const set = (on) => page.evaluate(async (on) => {
      /** @type {any} */ (document.getElementById('sp')).data = { sticky: on };
      await new Promise((r) => setTimeout(r, 50));
      return {
        root: document.documentElement.hasAttribute('data-sticky'),
        banner: document.getElementById('banner').hasAttribute('data-sticky'),
        toggle: /** @type {HTMLInputElement} */ (document.querySelector('#sp input[data-sticky-toggle]')).checked,
      };
    }, on);
    expect(await set(true)).toEqual({ root: true, banner: true, toggle: true });
    expect(await set(false)).toEqual({ root: false, banner: false, toggle: false });
  });

  test('remove/reinsert during hydration and removal for good leave one or zero panels', async ({ page }) => {
    await load(page, '<main id="host"></main>', { ready: null });
    await page.waitForFunction(() => customElements.get('settings-panel'));
    const r = await page.evaluate(async () => {
      const host = document.getElementById('host');
      const a = document.createElement('settings-panel');
      host.append(a);
      a.remove();
      host.append(a);
      a.remove();
      host.append(a);
      const b = document.createElement('settings-panel');
      host.append(b);
      b.remove();
      await new Promise((res) => setTimeout(res, 100));
      return {
        aPanels: a.querySelectorAll('.settings-panel').length,
        aTriggers: a.querySelectorAll('[data-trigger]').length,
        bPanels: b.querySelectorAll('.settings-panel').length,
      };
    });
    expect(r).toEqual({ aPanels: 1, aTriggers: 1, bPanels: 0 });
  });

  test('data setter applies to the page and is safe before render; open() before render is queued', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await load(page, '<main id="host"></main>', { ready: null });
    await page.waitForFunction(() => customElements.get('settings-panel'));
    const r = await page.evaluate(async () => {
      const el = /** @type {any} */ (document.createElement('settings-panel'));
      el.data = { a11yThemes: ['a11y-large-text'], extensions: { motionFx: false } };
      el.open();
      const themeBefore = document.documentElement.dataset.theme || '';
      const reduced = document.documentElement.hasAttribute('data-motion-reduced');
      document.getElementById('host').append(el);
      await new Promise((res) => setTimeout(res, 100));
      return {
        themeBefore,
        reduced,
        open: el.hasAttribute('open'),
        expanded: el.querySelector('[data-trigger]').getAttribute('aria-expanded'),
        large: el.querySelector('input[data-a11y="a11y-large-text"]').checked,
      };
    });
    expect(r.themeBefore).toContain('a11y-large-text');
    expect(r.reduced).toBe(true);
    expect(r.open).toBe(true);
    expect(r.expanded).toBe('true');
    expect(r.large).toBe(true);
    expect(errors).toEqual([]);
  });

  test('open moves focus in; Escape closes and returns focus; Tab out closes', async ({ page }) => {
    await load(page, '<main><button id="before">Before</button><settings-panel id="sp"></settings-panel><button id="after">After</button></main>');
    const trigger = page.locator('#sp [data-trigger]');
    await trigger.click();
    await expect(page.locator('#sp')).toHaveAttribute('open', '');
    expect(await page.evaluate(() => document.activeElement?.classList.contains('settings-panel'))).toBe(true);
    await page.keyboard.press('Escape');
    await expect(page.locator('#sp')).not.toHaveAttribute('open');
    expect(await page.evaluate(() => document.activeElement?.hasAttribute('data-trigger'))).toBe(true);

    await trigger.click();
    await page.locator('#after').focus();
    await expect(page.locator('#sp')).not.toHaveAttribute('open');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  test('reset asks in-panel (no window.confirm) and cancel restores focus', async ({ page }) => {
    let dialogs = 0;
    page.on('dialog', (d) => { dialogs++; d.dismiss(); });
    await load(page, '<main><settings-panel id="sp"></settings-panel></main>');
    await page.locator('#sp [data-trigger]').click();
    await page.locator('#sp .settings-reset').click();
    const confirmRow = page.locator('#sp .settings-reset-confirm');
    await expect(confirmRow).toBeVisible();
    await expect(page.locator('#sp [data-action="reset-cancel"]')).toBeFocused();
    await page.locator('#sp [data-action="reset-cancel"]').click();
    await expect(confirmRow).toBeHidden();
    await expect(page.locator('#sp .settings-reset')).toBeFocused();
    await page.locator('#sp .settings-reset').click();
    await page.locator('#sp [data-action="reset-confirm"]').click();
    await expect(page.locator('#sp [data-live]')).toHaveText('Settings reset to defaults');
    expect(dialogs).toBe(0);
  });

  test('reconnect while open resets to closed with a matching trigger', async ({ page }) => {
    await load(page, '<main id="host"><settings-panel id="sp"></settings-panel></main>');
    const r = await page.evaluate(async () => {
      const sp = /** @type {any} */ (document.getElementById('sp'));
      sp.open();
      sp.remove();
      document.getElementById('host').append(sp);
      await new Promise((res) => setTimeout(res, 50));
      return {
        open: sp.hasAttribute('open'),
        expanded: sp.querySelector('[data-trigger]').getAttribute('aria-expanded'),
        panels: sp.querySelectorAll('.settings-panel').length,
      };
    });
    expect(r).toEqual({ open: false, expanded: 'false', panels: 1 });
    await page.locator('#sp [data-trigger]').click();
    await expect(page.locator('#sp')).toHaveAttribute('open', '');
  });

  test('two instances get unique ids and radio names', async ({ page }) => {
    await load(page, '<main><settings-panel id="a"></settings-panel><settings-panel id="b"></settings-panel></main>');
    const r = await page.evaluate(() => {
      const ids = [...document.querySelectorAll('[id]')].map((e) => e.id);
      const dupIds = ids.filter((id, i) => ids.indexOf(id) !== i);
      const nameA = document.querySelector('#a input[data-field="mode"]').getAttribute('name');
      const nameB = document.querySelector('#b input[data-field="mode"]').getAttribute('name');
      const labelB = /** @type {HTMLLabelElement} */ (document.querySelector('#b label[for^="settings-theme-"]'));
      return { dupIds, differ: nameA !== nameB, labelOwn: document.getElementById('b').contains(labelB.control) };
    });
    expect(r).toEqual({ dupIds: [], differ: true, labelOwn: true });
  });

  test('data-label-* overrides strings; status lines are live regions', async ({ page }) => {
    await load(page, '<main><settings-panel id="sp" data-label-trigger="Ajustes del sitio" data-label-title="Ajustes" data-label-reset="Restablecer"></settings-panel></main>');
    const sp = page.locator('#sp');
    await expect(sp.locator('[data-trigger]')).toHaveAttribute('aria-label', 'Ajustes del sitio');
    await expect(sp.locator('.settings-header strong')).toHaveText('Ajustes');
    await expect(sp.locator('.settings-reset')).toHaveText('Restablecer');
    await expect(sp.locator('[data-sw-status]')).toHaveAttribute('role', 'status');
    await expect(sp.locator('[data-live]')).toHaveAttribute('role', 'status');
  });

  test('authored trigger keeps its own name', async ({ page }) => {
    await load(page, '<main><settings-panel id="sp"><button type="button" data-trigger>Preferences</button></settings-panel></main>');
    const trigger = page.locator('#sp [data-trigger]');
    await expect(trigger).toHaveCount(1);
    expect(await trigger.getAttribute('aria-label')).toBeNull();
    await expect(page.getByRole('button', { name: 'Preferences' })).toHaveAttribute('aria-haspopup', 'dialog');
  });
});

test.describe('site-legal', () => {
  const LEGAL = `<footer>
    <site-legal id="flat">
      <span>&copy; 2026 Acme Inc</span>
      <a href="#p">Privacy</a>
      <a href="#t">Terms</a>
    </site-legal>
    <site-legal id="narrow" data-justify="start">
      <span>&copy; 2026 Acme Incorporated</span>
      <span>MIT License</span>
      <a href="#p">Privacy Policy</a>
      <a href="#t">Terms of Service</a>
      <a href="#c">Cookie Policy</a>
    </site-legal>
    <site-legal id="list"><ul role="list"><li>&copy; 2026 Acme</li><li><a href="#p">Privacy</a></li></ul></site-legal>
  </footer>
  <style>#narrow { max-inline-size: 14rem; }</style>`;

  test('links are underlined and the separator stays out of the link name and box', async ({ page }) => {
    await load(page, LEGAL, { modules: [], ready: 'site-legal' });
    const r = await page.evaluate(() => {
      const a = /** @type {HTMLElement} */ (document.querySelector('#flat a'));
      const before = getComputedStyle(a, '::before');
      return {
        underline: getComputedStyle(a).textDecorationLine,
        position: before.position,
        pointer: before.pointerEvents,
        content: before.content,
      };
    });
    expect(r.underline).toBe('underline');
    expect(r.position).toBe('absolute');
    expect(r.pointer).toBe('none');
    expect(r.content).toContain('·');
    await expect(page.getByRole('link', { name: 'Privacy', exact: true }).first()).toBeVisible();
  });

  test('a wrapped start-aligned row begins at the clipped edge; list form separates <li>s', async ({ page }) => {
    await load(page, LEGAL, { modules: [], ready: 'site-legal' });
    const r = await page.evaluate(() => {
      const box = document.getElementById('narrow');
      const left = box.getBoundingClientRect().left;
      const items = [...box.children].map((c) => c.getBoundingClientRect());
      const firstTop = items[0].top;
      const wrapped = items.find((rect) => rect.top > firstTop + 2);
      const li = /** @type {HTMLElement} */ (document.querySelector('#list li + li'));
      return {
        overflow: getComputedStyle(box).overflowX,
        wrappedAtEdge: wrapped ? Math.abs(wrapped.left - left) < 1 : null,
        liSep: getComputedStyle(li, '::before').content,
        listStyle: getComputedStyle(document.querySelector('#list ul')).listStyleType,
      };
    });
    expect(r.overflow).toBe('clip');
    expect(r.wrappedAtEdge).toBe(true);
    expect(r.liSep).toContain('·');
    expect(r.listStyle).toBe('none');
  });
});

test.describe('site header (header.html)', () => {
  test('notification bell collapses into the mobile menu and stays reachable', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 700 });
    await page.route('**/go/notify/messages', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    const header = readFileSync(join(REPO, 'site/src/includes/header.html'), 'utf8');
    await load(page, header, {
      modules: ['/src/custom-elements/mobile-menu/logic.js', '/src/web-components/notification-wc/logic.js'],
      ready: 'notification-wc[data-upgraded]',
    });
    const r = await page.evaluate(() => ({
      bells: document.querySelectorAll('notification-wc').length,
      inHeader: !!document.querySelector('header > notification-wc'),
      inSlot: !!document.querySelector('.mobile-menu-panel [data-mobile-menu-slot] > notification-wc'),
      toolsHidden: getComputedStyle(document.querySelector('header > site-tools')).display === 'none',
    }));
    expect(r).toEqual({ bells: 1, inHeader: false, inSlot: true, toolsHidden: true });
    // The header's static release note is unread: the menu button says so
    await expect(page.locator('notification-wc')).toHaveAttribute('data-unread', /\d+/);
    expect(await page.locator('mobile-menu > [data-trigger]').evaluate((el) => getComputedStyle(el, '::after').content)).not.toBe('none');

    // Open the menu: the bell is there, clear of the close button, and its
    // list opens as a sheet over the menu rather than squeezed inside it
    await page.locator('mobile-menu > [data-trigger]').click();
    const bell = page.locator('.mobile-menu-panel notification-wc [data-trigger]');
    await expect(bell).toBeVisible();
    const overlap = await page.evaluate(() => {
      const a = document.querySelector('.mobile-menu-panel notification-wc [data-trigger]').getBoundingClientRect();
      const b = document.querySelector('.mobile-menu-panel .mobile-menu-close').getBoundingClientRect();
      return !(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top);
    });
    expect(overlap).toBe(false);
    await bell.click();
    const sheet = page.locator('.mobile-menu-panel .notification-panel');
    await expect(sheet).toBeVisible();
    const fit = await sheet.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { top: r.top, left: r.left, width: r.width, vw: innerWidth, topLayer: el.matches(':popover-open'), overflow: document.documentElement.scrollWidth > innerWidth };
    });
    // 375px wide: a full-width sheet from the top edge, in the top layer
    expect(fit).toEqual({ top: 0, left: 0, width: 375, vw: 375, topLayer: true, overflow: false });
    await expect(page.locator('.mobile-menu-panel')).toBeVisible();
    // Its close button returns to the bell with the menu still open
    await sheet.locator('.notification-close').click();
    await expect(sheet).toBeHidden();
    await expect(bell).toBeFocused();
    await expect(page.locator('.mobile-menu-panel')).toBeVisible();

    // Wide: one bell, back in the header after the menu
    await page.keyboard.press('Escape');
    await page.setViewportSize({ width: 1200, height: 700 });
    await expect(page.locator('header > notification-wc')).toBeVisible();
    await expect(page.locator('notification-wc')).toHaveCount(1);
  });
});
