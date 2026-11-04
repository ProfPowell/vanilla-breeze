/**
 * toast-msg + tool-tip (+ tooltip-init, autosave toast) — T-review fixes.
 *
 * toast-msg: one live region, spoken variant prefix, localisable labels,
 * auto-dismiss pauses on hover / focus (WCAG 2.2.1), focus survives a
 * dismiss, Escape + programmatic dismiss, bottom exit animation, RTL
 * centring, forced colors, autosave uses the real show() API.
 *
 * tool-tip: title kept as the accessible name, describedby appended and
 * cleaned up, card keyboard + ARIA on the JS path, manual-mode fallback
 * that doesn't close other popovers, centred no-anchor fallback, RTL arrow,
 * forced colors. tooltip-init: name + describedby handling.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

/**
 * @param {import('playwright/test').Page} page
 * @param {string} body
 * @param {{ dir?: string, modules?: string[], wait?: string, head?: string }} [opts]
 */
async function load(page, body, { dir = 'ltr', modules = [], wait, head = '' } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__t6-${Math.random().toString(36).slice(2)}.html`;
  const imports = modules.map((m) => `import '/src/${m}';`).join('\n');
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en" dir="${dir}"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">${head}
      <script type="module">${imports}</script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  if (wait) await page.waitForSelector(wait, { state: 'attached' });
}

const TOAST = 'web-components/toast-msg/logic.js';
const TIP = 'web-components/tool-tip/logic.js';

/* ── toast-msg ─────────────────────────────────────────────────────────── */

test.describe('toast-msg', () => {
  test('host is the single live region; toasts carry no role of their own', async ({ page }) => {
    await load(page, `<toast-msg id="t"></toast-msg>
      <toast-msg id="named" aria-label="Benachrichtigungen" aria-live="assertive"></toast-msg>`,
    { modules: [TOAST], wait: 'toast-msg#named[data-upgraded]' });
    const r = await page.evaluate(() => {
      const t = /** @type {any} */ (document.getElementById('t'));
      t.show({ message: 'Saved', variant: 'success', duration: 0 });
      const n = document.getElementById('named');
      return {
        role: t.getAttribute('role'), live: t.getAttribute('aria-live'), label: t.getAttribute('aria-label'),
        nestedLive: t.querySelectorAll('[role], [aria-live]').length,
        namedLabel: n.getAttribute('aria-label'), namedLive: n.getAttribute('aria-live'),
      };
    });
    expect(r).toEqual({
      role: 'log', live: 'polite', label: 'Notifications', nestedLive: 0,
      namedLabel: 'Benachrichtigungen', namedLive: 'assertive',
    });
  });

  test('variant is spoken via a visually hidden prefix; labels are localisable', async ({ page }) => {
    await load(page, `<toast-msg data-label-error="Fehler" data-label-dismiss="Schließen"></toast-msg>`,
      { modules: [TOAST], wait: 'toast-msg[data-upgraded]' });
    const r = await page.evaluate(() => {
      const t = /** @type {any} */ (document.querySelector('toast-msg'));
      const toast = t.show({ message: 'Upload failed', variant: 'error', duration: 0 });
      const prefix = toast.querySelector('.variant-label');
      return {
        text: toast.querySelector('.message').textContent,
        prefixWidth: prefix.getBoundingClientRect().width,
        close: toast.querySelector('.close').getAttribute('aria-label'),
        queue: t.queue,
      };
    });
    expect(r.text).toBe('Fehler: Upload failed');
    expect(r.prefixWidth).toBeLessThanOrEqual(1);
    expect(r.close).toBe('Schließen');
    expect(r.queue).toEqual([{ message: 'Upload failed', variant: 'error', state: 'visible' }]);
  });

  test('auto-dismiss pauses while hovered and resumes after', async ({ page }) => {
    await load(page, `<toast-msg position="top-start"></toast-msg>`, { modules: [TOAST], wait: 'toast-msg[data-upgraded]' });
    await page.evaluate(() => /** @type {any} */ (document.querySelector('toast-msg')).show({ message: 'Hover me', duration: 400 }));
    const toast = page.locator('toast-msg .toast');
    const box = await toast.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(900);
    await expect(toast).toHaveCount(1);
    await page.mouse.move(700, 500);
    await expect(toast).toHaveCount(0, { timeout: 2000 });
  });

  test('auto-dismiss pauses while focus is inside (action toast)', async ({ page }) => {
    await load(page, `<button id="opener">Open</button><toast-msg></toast-msg>`,
      { modules: [TOAST], wait: 'toast-msg[data-upgraded]' });
    await page.evaluate(() => /** @type {any} */ (document.querySelector('toast-msg'))
      .show({ message: 'Deleted', action: 'Undo', onAction() {}, duration: 400 }));
    await page.locator('toast-msg .action').focus();
    await page.waitForTimeout(900);
    await expect(page.locator('toast-msg .toast')).toHaveCount(1);
    await page.locator('#opener').focus();
    await expect(page.locator('toast-msg .toast')).toHaveCount(0, { timeout: 2000 });
  });

  test('dismissing a focused toast moves focus to the next toast, then back to the opener', async ({ page }) => {
    await load(page, `<button id="opener">Open</button><toast-msg></toast-msg>`,
      { modules: [TOAST], wait: 'toast-msg[data-upgraded]' });
    await page.locator('#opener').focus();
    await page.evaluate(() => {
      const t = /** @type {any} */ (document.querySelector('toast-msg'));
      t.show({ message: 'one', duration: 0 });
      t.show({ message: 'two', duration: 0 });
    });
    await page.locator('toast-msg .toast').first().locator('.close').click();
    const afterFirst = await page.evaluate(() => document.activeElement?.closest('.toast')?.querySelector('.message')?.textContent);
    expect(afterFirst).toContain('two');
    await page.keyboard.press('Escape');
    await expect(page.locator('toast-msg .toast')).toHaveCount(0, { timeout: 2000 });
    expect(await page.evaluate(() => document.activeElement?.id)).toBe('opener');
  });

  test('dismiss() closes a non-dismissible toast; dismissAll() drops the queue', async ({ page }) => {
    await load(page, `<toast-msg max="1"></toast-msg>`, { modules: [TOAST], wait: 'toast-msg[data-upgraded]' });
    const r = await page.evaluate(async () => {
      const t = /** @type {any} */ (document.querySelector('toast-msg'));
      const events = [];
      t.addEventListener('toast-msg:enqueued', (e) => events.push(e.detail.queued));
      const sticky = t.show({ message: 'sticky', dismissible: false, duration: 0 });
      t.show({ message: 'waiting', duration: 0 });
      const hasClose = !!sticky.querySelector('.close');
      t.dismiss(sticky);
      await new Promise((r) => setTimeout(r, 500));
      const afterDismiss = t.queue.map((q) => q.message);
      t.dismissAll();
      await new Promise((r) => setTimeout(r, 500));
      return { hasClose, events, afterDismiss, end: t.queue.length };
    });
    expect(r).toEqual({ hasClose: false, events: [false, true], afterDismiss: ['waiting'], end: 0 });
  });

  test('bottom positions animate out (exit rule is not out-ranked)', async ({ page }) => {
    await load(page, `<toast-msg position="bottom-end"></toast-msg>`, { modules: [TOAST], wait: 'toast-msg[data-upgraded]' });
    const name = await page.evaluate(() => {
      const t = /** @type {any} */ (document.querySelector('toast-msg'));
      const toast = t.show({ message: 'bye', duration: 0 });
      toast.setAttribute('data-state', 'hiding');
      return getComputedStyle(toast).animationName;
    });
    expect(name).toBe('toast-exit');
  });

  test('centred positions stay centred in RTL', async ({ page }) => {
    await load(page, `<toast-msg position="top-center"></toast-msg>`,
      { dir: 'rtl', modules: [TOAST], wait: 'toast-msg[data-upgraded]' });
    const r = await page.evaluate(() => {
      const t = /** @type {any} */ (document.querySelector('toast-msg'));
      const toast = t.show({ message: 'Centred in RTL', duration: 0 });
      const b = toast.getBoundingClientRect();
      return { mid: b.left + b.width / 2, vw: document.documentElement.clientWidth };
    });
    expect(Math.abs(r.mid - r.vw / 2)).toBeLessThan(3);
  });

  test('forced colors: toasts get a visible edge', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await load(page, `<toast-msg></toast-msg>`, { modules: [TOAST], wait: 'toast-msg[data-upgraded]' });
    const style = await page.evaluate(() => {
      const toast = /** @type {any} */ (document.querySelector('toast-msg')).show({ message: 'x', duration: 0 });
      return getComputedStyle(toast).borderTopStyle;
    });
    expect(style).toBe('solid');
  });

  test('autosave announces a restored draft through show()', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('vb:autosave:t6-form', JSON.stringify({ data: { name: 'Ada' }, timestamp: Date.now() }));
    });
    await load(page, `<form data-autosave="t6-form" data-label-restored="Brouillon restauré">
        <label for="n">Name</label><input id="n" name="name"></form>`,
    { modules: [TOAST, 'utils/autosave-init.js'] });
    await expect(page.locator('toast-msg .toast')).toHaveCount(1);
    const r = await page.evaluate(() => ({
      hosts: document.querySelectorAll('toast-msg').length,
      message: document.querySelector('toast-msg .toast')?.getAttribute('data-variant'),
      text: /** @type {any} */ (document.querySelector('toast-msg')).queue[0]?.message,
    }));
    expect(r).toEqual({ hosts: 1, message: 'info', text: 'Brouillon restauré' });
  });
});

/* ── tool-tip ──────────────────────────────────────────────────────────── */

test.describe('tool-tip', () => {
  test('title on an icon-only trigger stays its accessible name', async ({ page }) => {
    await load(page, `<tool-tip id="tt"><button type="button" title="Save"><icon-wc name="save"></icon-wc></button></tool-tip>`,
      { modules: [TIP], wait: 'tool-tip[data-upgraded]' });
    const r = await page.evaluate(() => {
      const tt = document.getElementById('tt');
      const b = tt.querySelector('button');
      const during = { label: b.getAttribute('aria-label'), describedby: b.getAttribute('aria-describedby'), title: b.getAttribute('title') };
      tt.remove();
      const after = { label: b.getAttribute('aria-label'), title: b.getAttribute('title') };
      return { during, after };
    });
    expect(r.during).toEqual({ label: 'Save', describedby: null, title: null });
    expect(r.after).toEqual({ label: null, title: 'Save' });
  });

  test('aria-describedby is appended to authored ids and cleaned up on reconnect', async ({ page }) => {
    await load(page, `<p id="hint">Hint</p>
      <tool-tip id="tt" content="More info"><button type="button" aria-describedby="hint">Help</button></tool-tip>`,
    { modules: [TIP], wait: 'tool-tip[data-upgraded]' });
    const r = await page.evaluate(() => {
      const tt = document.getElementById('tt');
      const b = tt.querySelector('button');
      const tipId = () => tt.querySelector('[role="tooltip"]')?.id;
      const first = b.getAttribute('aria-describedby') === `hint ${tipId()}`;
      const parent = tt.parentNode;
      tt.remove();
      const detached = b.getAttribute('aria-describedby');
      parent.append(tt);
      return { first, detached, again: b.getAttribute('aria-describedby') === `hint ${tipId()}` };
    });
    expect(r).toEqual({ first: true, detached: 'hint', again: true });
  });

  test('card on the JS path: keyboard reaches the content, Escape closes and returns focus', async ({ page }) => {
    await load(page, `<tool-tip id="tt" variant="card" delay="0">
        <span tabindex="0" data-trigger>Jane</span>
        <section data-content><p>Profile</p><a href="#profile">View profile</a></section>
      </tool-tip><button id="after">After</button>`,
    { modules: [TIP], wait: 'tool-tip[data-upgraded]' });
    const trigger = page.locator('[data-trigger]');
    const card = page.locator('pop-over.hover-card');
    await trigger.focus();
    await expect(card).toBeVisible();
    expect(await trigger.getAttribute('aria-expanded')).toBe('true');
    expect(await trigger.getAttribute('aria-controls')).toBe(await card.getAttribute('id'));
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);
    await expect(card).toBeVisible();
    await expect(page.locator('a[href="#profile"]')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(card).toBeHidden();
    await expect(trigger).toBeFocused();
    expect(await trigger.getAttribute('aria-expanded')).toBe('false');
  });

  test('without popover=hint support: manual mode, own Escape, other popovers stay open', async ({ page }) => {
    await page.addInitScript(() => {
      const desc = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'popover');
      Object.defineProperty(HTMLElement.prototype, 'popover', {
        configurable: true,
        get() { const v = desc.get.call(this); return v === 'hint' ? 'manual' : v; },
        set(v) { desc.set.call(this, v); },
      });
    });
    await load(page, `<button popovertarget="menu" id="open-menu">Menu</button>
      <aside id="menu" popover>Menu</aside>
      <tool-tip id="tt" content="Tip"><button type="button" id="tr">Hover</button></tool-tip>`,
    { modules: [TIP], wait: 'tool-tip[data-upgraded]' });
    const r = await page.evaluate(async () => {
      const tt = /** @type {any} */ (document.getElementById('tt'));
      const menu = document.getElementById('menu');
      menu.showPopover();
      tt.show();
      const mode = tt.querySelector('[role="tooltip"]').getAttribute('popover');
      const both = menu.matches(':popover-open') && tt.isVisible;
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      return { mode, both, tipAfterEscape: tt.isVisible };
    });
    expect(r).toEqual({ mode: 'manual', both: true, tipAfterEscape: false });
  });

  test('no anchor positioning: fallback honours position and centres', async ({ page }) => {
    await page.addInitScript(() => {
      const orig = CSS.supports.bind(CSS);
      CSS.supports = (...a) => (String(a[0]).includes('anchor') ? false : orig(...a));
    });
    await load(page, `<p class="pad">x</p><p class="pad">x</p><p class="pad">x</p>
      <tool-tip id="tt" position="top" content="A centred tooltip"><button type="button">Wide trigger button</button></tool-tip>`,
    { modules: [TIP], wait: 'tool-tip[data-upgraded]' });
    const r = await page.evaluate(() => {
      const tt = /** @type {any} */ (document.getElementById('tt'));
      tt.show();
      const tip = tt.querySelector('[role="tooltip"]').getBoundingClientRect();
      const b = tt.querySelector('button').getBoundingClientRect();
      return { above: tip.bottom <= b.top + 1, dx: Math.abs((tip.left + tip.width / 2) - (b.left + b.width / 2)) };
    });
    expect(r.above).toBe(true);
    expect(r.dx).toBeLessThan(2);
  });

  test('RTL: left/right arrows point at the trigger', async ({ page }) => {
    await load(page, `<tool-tip id="tt" position="left" content="Left"><button type="button">Trigger</button></tool-tip>`,
      { dir: 'rtl', modules: [TIP], wait: 'tool-tip[data-upgraded]' });
    const r = await page.evaluate(() => {
      const arrow = document.querySelector('#tt .tooltip-arrow');
      const cs = getComputedStyle(arrow);
      return { right: cs.right, left: cs.left };
    });
    expect(r.right).toBe('-4px');
    expect(r.left).toBe('auto');
  });

  test('forced colors: tooltip gets an edge', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await load(page, `<tool-tip id="tt" content="Tip"><button type="button">Trigger</button></tool-tip>`,
      { modules: [TIP], wait: 'tool-tip[data-upgraded]' });
    const style = await page.evaluate(() => getComputedStyle(document.querySelector('#tt [role="tooltip"]')).borderTopStyle);
    expect(style).toBe('solid');
  });
});

/* ── tooltip-init (data-tooltip) ───────────────────────────────────────── */

test.describe('tooltip-init', () => {
  test('icon-only title becomes the name; authored describedby is kept', async ({ page }) => {
    await load(page, `<p id="hint">Hint</p>
      <button type="button" id="icon" title="Delete" data-tooltip><icon-wc name="trash"></icon-wc></button>
      <button type="button" id="text" title="Saves a draft" aria-describedby="hint" data-tooltip>Save</button>`,
    { modules: ['utils/tooltip-init.js'], wait: '#text[data-tooltip-init]' });
    const r = await page.evaluate(() => {
      const icon = document.getElementById('icon');
      const text = document.getElementById('text');
      const tipId = text.nextElementSibling?.id;
      return {
        iconLabel: icon.getAttribute('aria-label'),
        iconDescribed: icon.getAttribute('aria-describedby'),
        textLabel: text.getAttribute('aria-label'),
        textDescribed: text.getAttribute('aria-describedby') === `hint ${tipId}`,
      };
    });
    expect(r).toEqual({ iconLabel: 'Delete', iconDescribed: null, textLabel: null, textDescribed: true });
  });
});
