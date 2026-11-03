/**
 * drop-down — D-review fixes (egb6 reconnect, 8kf7 items/disabled,
 * 8s1z nav disclosure, rb3n api/events, qim5 nested + keyboard, sg0z tests).
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

async function load(page, body, { dir = 'ltr' } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__dropdown-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en" dir="${dir}"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <script type="module">import '/src/web-components/drop-down/logic.js';</script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => customElements.get('drop-down'));
  await page.waitForSelector('drop-down[data-upgraded]', { state: 'attached' });
}

const ACTION = `
  <button id="before">Before</button>
  <drop-down id="dd">
    <button data-trigger>Options</button>
    <menu>
      <li><button data-value="edit">Edit</button></li>
      <li><button data-value="dup">Duplicate</button></li>
      <li><button data-value="del" data-disabled>Delete</button></li>
      <li role="separator"></li>
      <li><button data-value="dl">Download</button></li>
    </menu>
  </drop-down>`;

const focusedText = (page) => page.evaluate(() => document.activeElement?.textContent.trim());

test.describe('action menu (APG menu button)', () => {
  test('Enter on trigger opens and focuses the first item; ArrowUp focuses last', async ({ page }) => {
    await load(page, ACTION);
    const trigger = page.locator('#dd > [data-trigger]');
    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#dd')).toHaveAttribute('open', '');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(await focusedText(page)).toBe('Edit');

    await page.keyboard.press('Escape');
    await expect(page.locator('#dd')).not.toHaveAttribute('open', '');
    await expect(trigger).toBeFocused();

    await page.keyboard.press('ArrowUp');
    expect(await focusedText(page)).toBe('Download');
    await page.keyboard.press('Escape');
    await page.keyboard.press(' ');
    expect(await focusedText(page)).toBe('Edit');
  });

  test('arrows, Home/End and typeahead move focus; disabled row stays in roving order', async ({ page }) => {
    await load(page, ACTION);
    await page.locator('#dd > [data-trigger]').focus();
    await page.keyboard.press('ArrowDown');
    expect(await focusedText(page)).toBe('Edit');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    expect(await focusedText(page)).toBe('Delete');
    await expect(page.locator('button[data-value="del"]')).toHaveAttribute('aria-disabled', 'true');
    await page.keyboard.press('End');
    expect(await focusedText(page)).toBe('Download');
    await page.keyboard.press('ArrowDown');
    expect(await focusedText(page)).toBe('Edit');
    await page.keyboard.press('Home');
    expect(await focusedText(page)).toBe('Edit');

    // Typeahead: "d" cycles Duplicate → Delete → Download; "do" jumps.
    await page.keyboard.press('d');
    expect(await focusedText(page)).toBe('Duplicate');
    await page.keyboard.press('d');
    expect(await focusedText(page)).toBe('Delete');
    await page.waitForTimeout(600);
    await page.keyboard.type('do');
    expect(await focusedText(page)).toBe('Download');
  });

  test('roles: menu, menuitem, li role=none, separator', async ({ page }) => {
    await load(page, ACTION);
    const roles = await page.evaluate(() => {
      const dd = document.getElementById('dd');
      return {
        haspopup: dd.querySelector('[data-trigger]').getAttribute('aria-haspopup'),
        menu: dd.querySelector('menu').getAttribute('role'),
        items: [...dd.querySelectorAll('menu button')].map(b => b.getAttribute('role')),
        li: dd.querySelector('menu > li').getAttribute('role'),
        sep: dd.querySelector('menu > li:empty').getAttribute('role'),
      };
    });
    expect(roles).toEqual({
      haspopup: 'menu', menu: 'menu', items: ['menuitem', 'menuitem', 'menuitem', 'menuitem'],
      li: 'none', sep: 'separator',
    });
  });

  test('select event carries item + value; disabled item does not activate', async ({ page }) => {
    await load(page, ACTION);
    await page.evaluate(() => {
      window.selected = [];
      document.getElementById('dd').addEventListener('drop-down:select', (e) => {
        window.selected.push({ value: e.detail.value, tag: e.detail.item.localName });
      });
    });
    await page.locator('#dd > [data-trigger]').click();
    await page.locator('button[data-value="del"]').click({ force: true });
    await expect(page.locator('#dd')).toHaveAttribute('open', '');
    await page.locator('button[data-value="dup"]').click();
    await expect(page.locator('#dd')).not.toHaveAttribute('open', '');
    await expect(page.locator('#dd > [data-trigger]')).toBeFocused();
    expect(await page.evaluate(() => window.selected)).toEqual([{ value: 'dup', tag: 'button' }]);
  });

  test('Escape returns focus to the trigger', async ({ page }) => {
    await load(page, ACTION);
    await page.locator('#dd > [data-trigger]').click();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Escape');
    await expect(page.locator('#dd')).not.toHaveAttribute('open', '');
    await expect(page.locator('#dd > [data-trigger]')).toBeFocused();
  });

  test('trigger click toggles closed while open', async ({ page }) => {
    await load(page, ACTION);
    const trigger = page.locator('#dd > [data-trigger]');
    await trigger.click();
    await expect(page.locator('#dd')).toHaveAttribute('open', '');
    await trigger.click();
    await expect(page.locator('#dd')).not.toHaveAttribute('open', '');
  });
});

test.describe('lifecycle + data API', () => {
  test('reconnect while open resets state so it can open again', async ({ page }) => {
    await load(page, ACTION);
    const state = await page.evaluate(async () => {
      const dd = document.getElementById('dd');
      dd.open();
      const parent = dd.parentElement;
      dd.remove();
      parent.append(dd);
      const afterReconnect = {
        isOpen: dd.isOpen,
        open: dd.hasAttribute('open'),
        expanded: dd.querySelector('[data-trigger]').getAttribute('aria-expanded'),
      };
      dd.open();
      const reopened = dd.isOpen && dd.querySelector('pop-over').matches(':popover-open');
      dd.close();
      return { afterReconnect, reopened, closed: !dd.isOpen, popovers: dd.querySelectorAll('pop-over').length };
    });
    expect(state).toEqual({
      afterReconnect: { isOpen: false, open: false, expanded: 'false' },
      reopened: true, closed: true, popovers: 1,
    });
  });

  test('items setter keeps data-upgraded; disabled link is aria-disabled and not activatable', async ({ page }) => {
    await load(page, ACTION);
    await page.evaluate(() => {
      window.changes = 0;
      window.selected = [];
      const dd = document.getElementById('dd');
      dd.addEventListener('drop-down:items-changed', () => window.changes++);
      dd.addEventListener('drop-down:select', (e) => window.selected.push(e.detail.value));
      dd.items = [
        { label: 'Docs', href: '#docs', value: 'docs' },
        { label: 'Billing', href: '#billing', disabled: true, value: 'billing' },
        { separator: true },
        { label: 'Archive', value: 'archive', disabled: true },
      ];
    });
    const dd = page.locator('#dd');
    await expect(dd).toHaveAttribute('data-upgraded', '');
    expect(await page.evaluate(() => window.changes)).toBe(1);
    const billing = dd.locator('a[href="#billing"]');
    await expect(billing).toHaveAttribute('aria-disabled', 'true');
    await expect(billing).toHaveAttribute('role', 'menuitem');
    await expect(dd.locator('button', { hasText: 'Archive' })).toHaveAttribute('aria-disabled', 'true');

    // Keyboard reaches the disabled link but Enter does not activate it.
    await dd.locator('[data-trigger]').focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    expect(await focusedText(page)).toBe('Billing');
    await page.keyboard.press('Enter');
    await billing.click({ force: true });
    expect(page.url()).not.toContain('#billing');
    expect(await page.evaluate(() => window.selected)).toEqual([]);
    await expect(dd).toHaveAttribute('open', '');

    expect(await page.evaluate(() => document.getElementById('dd').items)).toEqual([
      { label: 'Docs', value: 'docs', href: '#docs' },
      { label: 'Billing', value: 'billing', href: '#billing', disabled: true },
      { separator: true },
      { label: 'Archive', value: 'archive', disabled: true },
    ]);
  });
});

test.describe('nested drop-downs', () => {
  const NESTED = `
    <drop-down id="outer">
      <button data-trigger>File</button>
      <menu>
        <li><button data-value="new">New</button></li>
        <li>
          <drop-down id="inner" position="bottom-end">
            <button data-trigger>Export</button>
            <menu>
              <li><button data-value="pdf">PDF</button></li>
              <li><button data-value="png">PNG</button></li>
            </menu>
          </drop-down>
        </li>
        <li><button data-value="close">Close</button></li>
      </menu>
    </drop-down>`;

  test('inner open/close does not toggle the outer, items are not shared', async ({ page }) => {
    await load(page, NESTED);
    await page.waitForSelector('#inner[data-upgraded]', { state: 'attached' });
    const outer = page.locator('#outer');
    const inner = page.locator('#inner');

    const outerRoles = await page.evaluate(() =>
      [...document.querySelectorAll('#outer [role="menuitem"]')].map(el => el.textContent.trim()));
    // Inner rows are menuitems of the inner menu; outer owns New, Export, Close.
    expect(outerRoles).toEqual(['New', 'Export', 'PDF', 'PNG', 'Close']);

    await page.evaluate(() => {
      window.log = [];
      for (const id of ['outer', 'inner']) {
        const el = document.getElementById(id);
        for (const t of ['open', 'close', 'select']) {
          el.addEventListener(`drop-down:${t}`, (e) => {
            if (e.target === el) window.log.push(`${id}:${t}${e.detail?.value ? `:${e.detail.value}` : ''}`);
          });
        }
      }
    });

    await outer.locator(':scope > [data-trigger]').click();
    await expect(outer).toHaveAttribute('open', '');
    await inner.locator(':scope > [data-trigger]').click();
    await expect(inner).toHaveAttribute('open', '');
    await expect(outer).toHaveAttribute('open', '');

    // Arrow keys in the inner menu move within the inner menu only.
    await page.keyboard.press('ArrowDown');
    expect(await focusedText(page)).toBe('PDF');
    await page.keyboard.press('ArrowDown');
    expect(await focusedText(page)).toBe('PNG');

    await page.keyboard.press('Enter');
    await expect(inner).not.toHaveAttribute('open', '');
    await expect(outer).toHaveAttribute('open', '');
    expect(await page.evaluate(() => window.log)).toEqual([
      'outer:open', 'inner:open', 'inner:select:png', 'inner:close',
    ]);
  });
});

test.describe('navigation disclosure ([hover])', () => {
  const NAV = `
    <nav aria-label="Main"><ul>
      <li>
        <drop-down id="nav1" hover>
          <a href="#start" data-trigger>Start</a>
          <menu>
            <li><a href="#quick">Quick Start</a></li>
            <li><a href="#tutorial">Tutorial</a></li>
          </menu>
        </drop-down>
      </li>
      <li>
        <drop-down id="nav2" hover>
          <a href="#guide" data-trigger>Guide</a>
          <menu>
            <li><a href="#layouts">Layouts</a></li>
          </menu>
        </drop-down>
      </li>
      <li><a id="after" href="#after">After</a></li>
    </ul></nav>`;

  test('no menu roles; generated toggle button carries aria-expanded', async ({ page }) => {
    await load(page, NAV);
    const info = await page.evaluate(() => {
      const dd = document.getElementById('nav1');
      const link = dd.querySelector(':scope > a');
      const toggle = dd.querySelector(':scope > button[data-dropdown-toggle]');
      return {
        menuRole: dd.querySelector('menu').getAttribute('role'),
        itemRoles: [...dd.querySelectorAll('menu a')].map(a => a.getAttribute('role')),
        itemTabindex: [...dd.querySelectorAll('menu a')].map(a => a.getAttribute('tabindex')),
        linkHaspopup: link.getAttribute('aria-haspopup'),
        linkExpanded: link.getAttribute('aria-expanded'),
        toggleExpanded: toggle?.getAttribute('aria-expanded'),
        toggleControls: toggle?.getAttribute('aria-controls') === dd.querySelector('menu').id,
        toggleLabel: toggle?.getAttribute('aria-label'),
        toggleAfterLink: link.nextElementSibling === toggle,
        anyMenuRole: !!document.querySelector('[role="menu"], [role="menuitem"], [aria-haspopup]'),
      };
    });
    expect(info).toEqual({
      menuRole: null, itemRoles: [null, null], itemTabindex: [null, null],
      linkHaspopup: null, linkExpanded: null,
      toggleExpanded: 'false', toggleControls: true, toggleLabel: 'Start submenu',
      toggleAfterLink: true, anyMenuRole: false,
    });
  });

  test('tabbing across the nav does not open menus', async ({ page }) => {
    await load(page, NAV);
    await page.locator('#nav1 > a').focus();
    for (let i = 0; i < 4; i++) await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.querySelectorAll('drop-down[open]').length)).toBe(0);
    await expect(page.locator('#after')).toBeFocused();
  });

  test('toggle opens via click/Enter; links reachable by Tab; Escape returns to toggle', async ({ page }) => {
    await load(page, NAV);
    const toggle = page.locator('#nav1 > button[data-dropdown-toggle]');
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#nav1')).toHaveAttribute('open', '');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Tab');
    expect(await focusedText(page)).toBe('Quick Start');
    await page.keyboard.press('Escape');
    await expect(page.locator('#nav1')).not.toHaveAttribute('open', '');
    await expect(toggle).toBeFocused();

    // Click toggles; focus leaving the drop-down closes it.
    // (moving onto the toggle hover-opens; that click pins, the next closes)
    await toggle.click();
    await expect(page.locator('#nav1')).toHaveAttribute('open', '');
    await toggle.click();
    await expect(page.locator('#nav1')).not.toHaveAttribute('open', '');
    await toggle.click();
    await expect(page.locator('#nav1')).toHaveAttribute('open', '');
    await page.locator('#after').focus();
    await expect(page.locator('#nav1')).not.toHaveAttribute('open', '');
  });

  test('mouse hover opens, leaving closes after grace', async ({ page }) => {
    await load(page, NAV);
    await page.locator('#nav2 > a').hover();
    await expect(page.locator('#nav2')).toHaveAttribute('open', '');
    await page.mouse.move(5, 500);
    await expect(page.locator('#nav2')).not.toHaveAttribute('open', '');
  });

  test('button trigger is its own toggle (no generated button)', async ({ page }) => {
    await load(page, `<drop-down id="b" hover><button data-trigger>More</button>
      <menu><li><a href="#x">X</a></li></menu></drop-down>`);
    const info = await page.evaluate(() => {
      const dd = document.getElementById('b');
      return {
        generated: dd.querySelectorAll('[data-dropdown-toggle]').length,
        expanded: dd.querySelector('[data-trigger]').getAttribute('aria-expanded'),
        haspopup: dd.querySelector('[data-trigger]').getAttribute('aria-haspopup'),
      };
    });
    expect(info).toEqual({ generated: 0, expanded: 'false', haspopup: null });
  });
});

test.describe('positioning', () => {
  for (const where of ['html', 'section']) {
    test(`bottom-start hangs from the inline-start edge in RTL (dir on ${where})`, async ({ page }) => {
      const section = where === 'section' ? '<section dir="rtl">' : '<section>';
      await load(page, `${section}<drop-down id="r" no-flip><button data-trigger>Options menu trigger</button>
        <menu><li><button>A much longer item label here</button></li></menu></drop-down></section>`,
      { dir: where === 'html' ? 'rtl' : 'ltr' });
      await page.locator('#r > [data-trigger]').click();
      const box = await page.evaluate(() => {
        const t = document.querySelector('#r > [data-trigger]').getBoundingClientRect();
        const p = document.querySelector('#r > pop-over').getBoundingClientRect();
        return { triggerRight: Math.round(t.right), popRight: Math.round(p.right), popLeft: Math.round(p.left), triggerLeft: Math.round(t.left) };
      });
      // pop-over's margin (offset token) insets it slightly from the edge.
      expect(box.triggerRight - box.popRight).toBeGreaterThanOrEqual(0);
      expect(box.triggerRight - box.popRight).toBeLessThanOrEqual(12);
      expect(box.popLeft).toBeLessThan(box.triggerLeft);
    });
  }

  test('bottom-start hangs from the left edge in LTR; bottom-end from the right', async ({ page }) => {
    // Wide enough that neither menu is clamped by the viewport edge.
    await page.setViewportSize({ width: 1000, height: 600 });
    await load(page, `<section><drop-down id="s" no-flip><button data-trigger>Options menu trigger</button>
      <menu><li><button>A much longer item label here</button></li></menu></drop-down>
      <drop-down id="e" position="bottom-end" no-flip><button data-trigger>Options menu trigger</button>
      <menu><li><button>A much longer item label here</button></li></menu></drop-down></section>`);
    const measure = (id) => page.evaluate((id) => {
      document.getElementById(id).open();
      const t = document.querySelector(`#${id} > [data-trigger]`).getBoundingClientRect();
      const p = document.querySelector(`#${id} > pop-over`).getBoundingClientRect();
      document.getElementById(id).close();
      return { dl: Math.round(p.left - t.left), dr: Math.round(t.right - p.right) };
    }, id);
    const start = await measure('s');
    expect(start.dl).toBeGreaterThanOrEqual(0);
    expect(start.dl).toBeLessThanOrEqual(12);
    const end = await measure('e');
    expect(end.dr).toBeGreaterThanOrEqual(0);
    expect(end.dr).toBeLessThanOrEqual(12);
  });

  test('no-flip disables position-try-fallbacks', async ({ page }) => {
    await load(page, `<drop-down id="nf" no-flip><button data-trigger>X</button>
      <menu><li><button>A</button></li></menu></drop-down>
      <drop-down id="f"><button data-trigger>Y</button><menu><li><button>B</button></li></menu></drop-down>`);
    const v = await page.evaluate(() => ({
      nf: getComputedStyle(document.querySelector('#nf > pop-over')).positionTryFallbacks,
      f: getComputedStyle(document.querySelector('#f > pop-over')).positionTryFallbacks,
    }));
    expect(v.nf).toBe('none');
    expect(v.f).toContain('flip-block');
  });
});
