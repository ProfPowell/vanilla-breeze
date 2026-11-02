/**
 * context-menu — review fixes (vanilla-breeze-5ac4 reconnect, -i89g a11y).
 *
 * The review found context-menu:select always carried item: undefined
 * (close() reset the active index before it was read), the .items setter
 * doubled every listener, reconnects stacked shortcut badges, the menu had
 * no keyboard way to open, and the role="menu" structure was incomplete.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

async function load(page, body) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__context-menu-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <script type="module">import '/src/web-components/context-menu/logic.js';</script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForSelector('context-menu[data-upgraded]', { state: 'attached' });
}

const BASIC = `<context-menu>
  <p data-trigger>Right-click here</p>
  <menu>
    <li><button type="button" data-value="rename" data-shortcut="f2">Rename</button></li>
    <li><button type="button" data-value="share" data-disabled>Share</button></li>
    <li><button type="button" data-value="dup">Duplicate</button></li>
    <li role="separator"></li>
    <li><button type="button" class="danger" data-value="del">Delete</button></li>
  </menu>
</context-menu>`;

const GROUPED = `<context-menu>
  <p data-trigger>Right-click here</p>
  <menu>
    <li data-group>Edit</li>
    <li><button type="button">Cut</button></li>
    <li><button type="button">Copy</button></li>
    <li data-group>View</li>
    <li><button type="button">Zoom In</button></li>
    <li role="separator"></li>
    <li><button type="button" class="danger">Delete</button></li>
  </menu>
</context-menu>`;

async function openWithMouse(page) {
  await page.evaluate(() => {
    document.querySelector('[data-trigger]').dispatchEvent(new MouseEvent('contextmenu', {
      bubbles: true, cancelable: true, clientX: 40, clientY: 40,
    }));
  });
  await page.waitForSelector('context-menu[data-open]', { state: 'attached' });
}

test('select detail.item is the clicked item (pointer and keyboard)', async ({ page }) => {
  await load(page, BASIC);
  await page.evaluate(() => {
    window.__sel = [];
    document.querySelector('context-menu').addEventListener('context-menu:select', (e) => {
      window.__sel.push(e.detail.item?.dataset.value ?? null);
    });
  });
  await openWithMouse(page);
  await page.locator('button[data-value="dup"]').click();
  await openWithMouse(page);
  await page.keyboard.press('Enter'); // first item has focus on open
  expect(await page.evaluate(() => window.__sel)).toEqual(['dup', 'rename']);
});

test('.items setter binds listeners once (ArrowDown moves one, select fires once)', async ({ page }) => {
  await load(page, BASIC);
  const r = await page.evaluate(() => {
    const cm = document.querySelector('context-menu');
    cm.items = [
      { label: 'One', value: 'one' },
      { label: 'Two', value: 'two' },
      { label: 'Three', value: 'three' },
    ];
    return { upgraded: cm.hasAttribute('data-upgraded') };
  });
  expect(r.upgraded).toBe(true);
  await page.evaluate(() => {
    window.__n = 0;
    document.querySelector('context-menu').addEventListener('context-menu:select', () => window.__n++);
  });
  await openWithMouse(page);
  await page.keyboard.press('ArrowDown');
  expect(await page.evaluate(() => document.activeElement.textContent.trim())).toBe('Two');
  await page.keyboard.press('Enter');
  expect(await page.evaluate(() => window.__n)).toBe(1);
});

test('reconnect does not stack shortcut badges or bindings', async ({ page }) => {
  await load(page, BASIC);
  const r = await page.evaluate(async () => {
    const cm = document.querySelector('context-menu');
    const main = document.querySelector('main');
    for (let i = 0; i < 3; i++) { cm.remove(); main.append(cm); }
    let n = 0;
    cm.addEventListener('context-menu:select', () => n++);
    document.body.focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'F2', bubbles: true }));
    await new Promise((res) => setTimeout(res, 20));
    return {
      badges: cm.querySelectorAll('.ctx-kbd').length,
      n,
      label: cm.items[0].label,
    };
  });
  expect(r).toEqual({ badges: 1, n: 1, label: 'Rename' });
});

test('keyboard: trigger is focusable, Shift+F10 opens at the trigger, Escape returns focus', async ({ page }) => {
  await load(page, BASIC);
  const trigger = page.locator('[data-trigger]');
  await expect(trigger).toHaveAttribute('tabindex', '0');
  await expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await trigger.focus();
  await page.keyboard.press('Shift+F10');
  await page.waitForSelector('context-menu[data-open]', { state: 'attached' });
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  expect(await page.evaluate(() => document.activeElement.dataset.value)).toBe('rename');
  // Positioned at the trigger, not at 0,0.
  const pos = await page.evaluate(() => {
    const t = document.querySelector('[data-trigger]').getBoundingClientRect();
    const p = document.querySelector('pop-over[data-context-menu-host]').getBoundingClientRect();
    return { dx: Math.abs(p.left - t.left), dy: Math.abs(p.top - t.bottom) };
  });
  expect(pos.dx).toBeLessThan(2);
  expect(pos.dy).toBeLessThan(2);

  await page.keyboard.press('Escape');
  await expect(page.locator('context-menu')).not.toHaveAttribute('data-open', '');
  expect(await page.evaluate(() => document.activeElement.hasAttribute('data-trigger'))).toBe(true);
});

test('keyboard-originated contextmenu (no pointer coords) opens at the trigger', async ({ page }) => {
  await load(page, BASIC);
  await page.evaluate(() => {
    document.querySelector('[data-trigger]').dispatchEvent(new MouseEvent('contextmenu', {
      bubbles: true, cancelable: true, clientX: 0, clientY: 0,
    }));
  });
  await page.waitForSelector('context-menu[data-open]', { state: 'attached' });
  const top = await page.evaluate(() => parseFloat(document.querySelector('pop-over[data-context-menu-host]').style.top));
  const bottom = await page.evaluate(() => document.querySelector('[data-trigger]').getBoundingClientRect().bottom);
  expect(Math.abs(top - bottom)).toBeLessThan(2);
});

test('selecting an item returns focus to the trigger', async ({ page }) => {
  await load(page, BASIC);
  await page.locator('[data-trigger]').focus();
  await page.keyboard.press('Shift+F10');
  await page.waitForSelector('context-menu[data-open]', { state: 'attached' });
  await page.keyboard.press('Enter');
  expect(await page.evaluate(() => document.activeElement.hasAttribute('data-trigger'))).toBe(true);
});

test('menu structure: li role=none, separators, aria-disabled kept in roving order but inert', async ({ page }) => {
  await load(page, BASIC);
  const r = await page.evaluate(() => {
    const menu = document.querySelector('menu');
    const lis = [...menu.querySelectorAll(':scope > li')];
    return {
      roles: lis.map((li) => li.getAttribute('role')),
      disabled: menu.querySelector('[data-value="share"]').getAttribute('aria-disabled'),
      shortcut: menu.querySelector('[data-value="rename"]').getAttribute('aria-keyshortcuts'),
    };
  });
  expect(r.roles).toEqual(['none', 'none', 'none', 'separator', 'none']);
  expect(r.disabled).toBe('true');
  expect(r.shortcut).toBe('F2');

  await page.evaluate(() => {
    window.__sel = 0;
    window.__clicks = 0;
    document.querySelector('context-menu').addEventListener('context-menu:select', () => window.__sel++);
    document.querySelector('[data-value="share"]').addEventListener('click', () => window.__clicks++);
  });
  await openWithMouse(page);
  await page.keyboard.press('ArrowDown');
  expect(await page.evaluate(() => document.activeElement.dataset.value)).toBe('share');
  await page.keyboard.press('Enter');
  // force: Playwright refuses to click aria-disabled elements; a pointer user can.
  await page.locator('[data-value="share"]').click({ force: true });
  expect(await page.evaluate(() => ({ sel: window.__sel, clicks: window.__clicks }))).toEqual({ sel: 0, clicks: 0 });
  await expect(page.locator('context-menu')).toHaveAttribute('data-open', '');
});

test('group labels become role=group wrappers named by the label; items getter round-trips', async ({ page }) => {
  await load(page, GROUPED);
  const r = await page.evaluate(() => {
    const cm = document.querySelector('context-menu');
    const groups = [...cm.querySelectorAll('menu > li[role="group"]')].map((g) => ({
      name: document.getElementById(g.getAttribute('aria-labelledby'))?.textContent.trim(),
      items: [...g.querySelectorAll('[role="menuitem"]')].map((b) => b.textContent.trim()),
    }));
    return { groups, items: cm.items };
  });
  expect(r.groups).toEqual([
    { name: 'Edit', items: ['Cut', 'Copy'] },
    { name: 'View', items: ['Zoom In'] },
  ]);
  expect(r.items.map((i) => i.group ?? i.label ?? (i.separator && '---'))).toEqual(
    ['Edit', 'Cut', 'Copy', 'View', 'Zoom In', '---', 'Delete']);

  // Reconnect restores and re-wraps — never nests wrappers.
  const after = await page.evaluate(() => {
    const cm = document.querySelector('context-menu');
    const main = document.querySelector('main');
    cm.remove(); main.append(cm);
    return {
      groups: cm.querySelectorAll('li[role="group"]').length,
      nested: cm.querySelectorAll('li[role="group"] li[role="group"]').length,
    };
  });
  expect(after).toEqual({ groups: 2, nested: 0 });
});

test('focused item shows a visible outline under keyboard focus', async ({ page }) => {
  await load(page, BASIC);
  await page.locator('[data-trigger]').focus();
  await page.keyboard.press('Shift+F10');
  await page.waitForSelector('context-menu[data-open]', { state: 'attached' });
  const outline = await page.evaluate(() => {
    const cs = getComputedStyle(document.activeElement);
    return { style: cs.outlineStyle, width: parseFloat(cs.outlineWidth) };
  });
  expect(outline.style).not.toBe('none');
  expect(outline.width).toBeGreaterThan(0);
});
