/**
 * Phase 5a — command-palette, selection-menu, context-menu, drop-down
 * dual-mode contracts.
 */

import { test, expect } from 'playwright/test';

test('command-palette: .commands setter rebuilds groups + items', async ({ page }) => {
  await page.goto('/docs/examples/demos/command-palette-basic.html');
  await page.waitForFunction(() => document.querySelector('command-palette[data-upgraded]'));

  const result = await page.evaluate(() => {
    const cp = document.querySelector('command-palette');
    const fired = [];
    cp.addEventListener('command-palette:commands-changed', (e) => {
      fired.push({ source: e.detail.source, count: e.detail.commands.length });
    });
    cp.commands = [
      { value: 'open',  label: 'Open',  hotkey: 'ctrl+o', group: 'File' },
      { value: 'save',  label: 'Save',  hotkey: 'ctrl+s', group: 'File' },
      { value: 'close', label: 'Close', group: 'File' },
      { value: 'help',  label: 'Help' },
    ];
    return {
      fired,
      groupCount: cp.querySelectorAll('command-group').length,
      itemCount: cp.querySelectorAll('command-item').length,
      gettable: cp.commands.length,
    };
  });

  expect(result.fired).toEqual([{ source: 'property', count: 4 }]);
  expect(result.groupCount).toBe(2); // File + unlabeled
  expect(result.itemCount).toBe(4);
  expect(result.gettable).toBe(4);
});

test('selection-menu: .actions setter replaces toolbar children', async ({ page }) => {
  await page.goto('/docs/snippets/demos/selection-menu-basic.html');
  await page.waitForFunction(() => document.querySelector('selection-menu[data-upgraded]'));

  const result = await page.evaluate(() => {
    const sm = document.querySelector('selection-menu');
    const fired = [];
    sm.addEventListener('selection-menu:actions-changed', (e) => {
      fired.push({ source: e.detail.source, count: e.detail.actions.length });
    });
    sm.actions = [
      { tag: 'highlight-wc', attrs: { color: 'yellow' } },
      { tag: 'note-wc' },
    ];
    const tags = [...sm.children].map(c => c.tagName.toLowerCase());
    return { fired, tags };
  });

  expect(result.fired[0]?.source).toBe('property');
  expect(result.fired[0]?.count).toBe(2);
  expect(result.tags).toEqual(['highlight-wc', 'note-wc']);
});

test('context-menu: .items setter rebuilds menu with groups + separators', async ({ page }) => {
  await page.goto('/docs/examples/demos/context-menu-icons.html');
  await page.waitForSelector('context-menu[data-upgraded]');

  const result = await page.evaluate(() => {
    const cm = document.querySelector('context-menu');
    const fired = [];
    cm.addEventListener('context-menu:items-changed', (e) => {
      fired.push({ source: e.detail.source, count: e.detail.items.length });
    });
    cm.items = [
      { group: 'Edit' },
      { label: 'Copy',  value: 'copy',  shortcut: 'ctrl+c' },
      { label: 'Paste', value: 'paste', shortcut: 'ctrl+v' },
      { separator: true },
      { label: 'Delete', value: 'del', disabled: true },
    ];
    const menu = cm.querySelector(':scope > menu, :scope > ul[role="menu"]');
    return {
      fired,
      liCount: menu?.querySelectorAll(':scope > li').length,
      hasGroup: !!menu?.querySelector('li[data-group]'),
      hasSeparator: !!menu?.querySelector('li[role="separator"]'),
      hasDisabled: !!menu?.querySelector('button:disabled'),
    };
  });

  expect(result.fired).toEqual([{ source: 'property', count: 5 }]);
  expect(result.liCount).toBe(5);
  expect(result.hasGroup).toBe(true);
  expect(result.hasSeparator).toBe(true);
  expect(result.hasDisabled).toBe(true);
});

test('drop-down: .items setter rebuilds menu', async ({ page }) => {
  await page.goto('/docs/examples/demos/dropdown-basic.html');
  await page.waitForSelector('drop-down[data-upgraded]');

  const result = await page.evaluate(() => {
    const dd = document.querySelector('drop-down');
    const fired = [];
    dd.addEventListener('drop-down:items-changed', (e) => {
      fired.push({ source: e.detail.source, count: e.detail.items.length });
    });
    dd.items = [
      { label: 'Profile',  value: 'profile' },
      { label: 'Settings', value: 'settings' },
      { separator: true },
      { label: 'External', href: 'https://example.com' },
    ];
    const menu = dd.querySelector(':scope > menu, :scope > ul[role="menu"]');
    return {
      fired,
      liCount: menu?.querySelectorAll(':scope > li').length,
      hasSeparator: !!menu?.querySelector('li[role="separator"]'),
      hasLink: !!menu?.querySelector('a[href]'),
    };
  });

  expect(result.fired).toEqual([{ source: 'property', count: 4 }]);
  expect(result.liCount).toBe(4);
  expect(result.hasSeparator).toBe(true);
  expect(result.hasLink).toBe(true);
});
