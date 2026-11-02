/**
 * command-palette — review fixes (vanilla-breeze-5ac4 reconnect, -i89g a11y).
 *
 * The review found every reconnect / .commands assignment appended another
 * <dialog> (and doubled options), the active option was never announced
 * (no combobox / activedescendant), the dialog had no name, Escape closed the
 * dialog without command-palette:close, and data-hotkey badges were unbound.
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
  const url = `/__command-palette-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <script type="module">import '/src/web-components/command-palette/logic.js';</script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForSelector('command-palette[data-upgraded]', { state: 'attached' });
}

const PALETTE = `<command-palette hotkey="ctrl+k">
  <command-group label="Navigation">
    <command-item value="home" data-hotkey="shift+h">Go Home</command-item>
    <command-item value="docs">Documentation</command-item>
  </command-group>
  <command-group label="Actions">
    <command-item value="theme">Toggle Theme</command-item>
  </command-group>
</command-palette>`;

test('reconnect and .commands keep exactly one dialog and no duplicate options', async ({ page }) => {
  await load(page, PALETTE);
  const r = await page.evaluate(() => {
    const cp = document.querySelector('command-palette');
    const main = document.querySelector('main');
    for (let i = 0; i < 3; i++) { cp.remove(); main.append(cp); }
    const afterMoves = {
      dialogs: cp.querySelectorAll('dialog').length,
      options: cp.querySelectorAll('[role="option"]').length,
    };
    cp.commands = [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }];
    cp.commands = [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }];
    return {
      afterMoves,
      dialogs: cp.querySelectorAll('dialog').length,
      options: cp.querySelectorAll('[role="option"]').length,
      upgraded: cp.hasAttribute('data-upgraded'),
    };
  });
  expect(r).toEqual({ afterMoves: { dialogs: 1, options: 3 }, dialogs: 1, options: 2, upgraded: true });
});

test('.commands while disconnected binds nothing and builds no dialog', async ({ page }) => {
  await load(page, PALETTE);
  const r = await page.evaluate(async () => {
    const cp = document.querySelector('command-palette');
    cp.remove();
    cp.commands = [{ value: 'a', label: 'A' }];
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
    await new Promise((res) => setTimeout(res, 20));
    return { dialogs: cp.querySelectorAll('dialog').length, open: cp.isOpen, count: cp.commands.length };
  });
  expect(r).toEqual({ dialogs: 0, open: false, count: 1 });
});

test('combobox + listbox: activedescendant follows the active option', async ({ page }) => {
  await load(page, PALETTE);
  await page.evaluate(() => document.querySelector('command-palette').open());
  const input = page.locator('command-palette input');
  await expect(input).toBeFocused();
  await expect(input).toHaveAttribute('role', 'combobox');
  await expect(input).toHaveAttribute('aria-expanded', 'true');
  const listId = await page.locator('command-palette [role="listbox"]').getAttribute('id');
  await expect(input).toHaveAttribute('aria-controls', listId);

  const active = () => page.evaluate(() => {
    const inp = document.querySelector('command-palette input');
    const el = document.getElementById(inp.getAttribute('aria-activedescendant'));
    return {
      text: el?.querySelector('.command-label').textContent,
      selected: [...document.querySelectorAll('command-palette [aria-selected="true"]')].length,
    };
  });
  expect(await active()).toEqual({ text: 'Go Home', selected: 1 });
  await page.keyboard.press('ArrowDown');
  expect(await active()).toEqual({ text: 'Documentation', selected: 1 });
  await expect(input).toBeFocused();
});

test('dialog is named, groups are role=group, options are not Tab stops', async ({ page }) => {
  await load(page, PALETTE);
  const r = await page.evaluate(() => {
    const cp = document.querySelector('command-palette');
    const groups = [...cp.querySelectorAll('[role="listbox"] > [role="group"]')];
    return {
      name: cp.querySelector('dialog').getAttribute('aria-label'),
      groups: groups.map((g) => document.getElementById(g.getAttribute('aria-labelledby')).textContent),
      tabbable: [...cp.querySelectorAll('[role="option"]')].filter((o) => o.tabIndex >= 0).length,
    };
  });
  expect(r).toEqual({ name: 'Command palette', groups: ['Navigation', 'Actions'], tabbable: 0 });
});

test('label attribute names the dialog', async ({ page }) => {
  await load(page, PALETTE.replace('hotkey="ctrl+k"', 'hotkey="ctrl+k" label="Site actions"'));
  await expect(page.locator('command-palette dialog')).toHaveAttribute('aria-label', 'Site actions');
});

test('Escape (native cancel) dispatches command-palette:close once', async ({ page }) => {
  await load(page, PALETTE);
  await page.evaluate(() => {
    window.__closes = 0;
    const cp = document.querySelector('command-palette');
    cp.addEventListener('command-palette:close', () => window.__closes++);
    cp.open();
    // Move focus off the input so its keydown handler is not involved:
    // this is the dialog's own cancel → close path.
    cp.querySelector('dialog').focus();
    cp.querySelector('[role="listbox"]').tabIndex = -1;
    cp.querySelector('[role="listbox"]').focus();
  });
  await page.keyboard.press('Escape');
  await expect.poll(() => page.evaluate(() => window.__closes)).toBe(1);
  expect(await page.evaluate(() => document.querySelector('command-palette').isOpen)).toBe(false);

  // close() also dispatches exactly once.
  await page.evaluate(() => {
    const cp = document.querySelector('command-palette');
    cp.open();
    cp.close();
  });
  await expect.poll(() => page.evaluate(() => window.__closes)).toBe(2);
});

test('data-hotkey is bound while connected and unbound on disconnect', async ({ page }) => {
  await load(page, PALETTE);
  const r = await page.evaluate(async () => {
    const cp = document.querySelector('command-palette');
    const got = [];
    document.addEventListener('command-palette:select', (e) => got.push(e.detail.value));
    const press = () => document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'H', shiftKey: true, bubbles: true }));
    press();
    await new Promise((res) => setTimeout(res, 20));
    const connected = [...got];
    const open = cp.isOpen;
    const holder = document.createElement('section');
    cp.remove();
    holder.append(cp); // detached: must not fire
    press();
    await new Promise((res) => setTimeout(res, 20));
    return { connected, open, after: got.length };
  });
  expect(r).toEqual({ connected: ['home'], open: false, after: 1 });
});

test('search input shows a focus-visible ring', async ({ page }) => {
  await load(page, PALETTE);
  await page.keyboard.press('Control+k');
  await expect(page.locator('command-palette input')).toBeFocused();
  const outline = await page.evaluate(() => getComputedStyle(document.querySelector('command-palette .command-search')).outlineStyle);
  expect(outline).not.toBe('none');
});
