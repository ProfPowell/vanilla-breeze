/**
 * emoji-picker — E-review fixes (vanilla-breeze-t7hm).
 *
 * Covers: contenteditable insertion never deletes a selection outside the
 * target; methods are safe before the data loads and data-upgraded means
 * "built"; listbox/toolbar ARIA with roving tabindex; layout-driven arrow keys
 * (incl. across a group heading and Recently used), Home/End, RTL; toolbar
 * arrows + aria-current on scroll; polite result count; focusout close;
 * undo-safe insertion (InputEvent) and no throw on email inputs; reconnect.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

async function load(page, body, { dir = 'ltr', wait = true, recents = null } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__emoji-picker-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en" dir="${dir}"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <script>
        localStorage.removeItem('vb-emoji-recent');
        ${recents ? `localStorage.setItem('vb-emoji-recent', ${JSON.stringify(JSON.stringify(recents))});` : ''}
      </script>
      <script type="module">import '/src/web-components/emoji-picker/logic.js';</script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => customElements.get('emoji-picker'));
  if (wait) await page.waitForSelector('emoji-picker[data-upgraded]');
}

const BASIC = `
  <label for="msg">Message</label>
  <textarea id="msg">hello</textarea>
  <emoji-picker id="ep" for="msg">
    <button data-trigger type="button" aria-label="Insert emoji">😀</button>
  </emoji-picker>
  <button type="button" id="outside">Outside</button>`;

const focusedInfo = (page) => page.evaluate(() => {
  const a = /** @type {HTMLElement} */ (document.activeElement);
  return {
    role: a?.getAttribute('role'),
    shortcode: a?.dataset?.shortcode ?? null,
    group: a?.parentElement?.dataset?.group ?? null,
    tag: a?.tagName,
    tabIndex: a?.tabIndex,
  };
});

test.describe('contenteditable insertion', () => {
  test('a selection elsewhere on the page is never deleted', async ({ page }) => {
    await load(page, `
      <p id="other">Do not delete this text</p>
      <section id="ed" contenteditable="true">Editor</section>
      <emoji-picker id="ep" for="ed"></emoji-picker>`);
    const r = await page.evaluate(async () => {
      const other = document.getElementById('other');
      const range = document.createRange();
      range.selectNodeContents(other);
      const sel = getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      const ep = /** @type {any} */ (document.getElementById('ep'));
      ep.open();
      let inputEvents = 0;
      document.getElementById('ed').addEventListener('input', () => inputEvents++);
      /** @type {HTMLElement} */ (ep.querySelector('[data-group="smileys"] [role="option"]')).click();
      return {
        other: other.textContent,
        editor: document.getElementById('ed').textContent,
        inputEvents,
      };
    });
    expect(r.other).toBe('Do not delete this text');
    expect(r.editor).toBe('Editor😄');
    expect(r.inputEvents).toBeGreaterThan(0);
  });

  test('a caret inside the target is honoured', async ({ page }) => {
    await load(page, `
      <section id="ed" contenteditable="true">AB</section>
      <emoji-picker id="ep" for="ed"></emoji-picker>`);
    const text = await page.evaluate(() => {
      const ed = document.getElementById('ed');
      ed.focus();
      const range = document.createRange();
      range.setStart(/** @type {Text} */ (ed.firstChild), 1);
      range.collapse(true);
      getSelection().removeAllRanges();
      getSelection().addRange(range);
      const ep = /** @type {any} */ (document.getElementById('ep'));
      ep.open();
      /** @type {HTMLElement} */ (ep.querySelector('[data-group="smileys"] [role="option"]')).click();
      return ed.textContent;
    });
    expect(text).toBe('A😄B');
  });
});

test.describe('lifecycle and loading', () => {
  test('methods before the data loads do not throw; a queued open applies once built', async ({ page }) => {
    await load(page, '<p>host</p>', { wait: false });
    const r = await page.evaluate(async () => {
      const errors = [];
      const ep = /** @type {any} */ (document.createElement('emoji-picker'));
      try { ep.open(); ep.close(); ep.toggle(); ep.toggle(); ep.open(); } catch (e) { errors.push(String(e)); }
      document.querySelector('main').append(ep);
      const upgradedSync = ep.hasAttribute('data-upgraded');
      try { ep.open(); ep.toggle(); ep.open(); } catch (e) { errors.push(String(e)); }
      await ep.ready;
      return {
        errors,
        upgradedSync,
        upgraded: ep.hasAttribute('data-upgraded'),
        hasPanel: !!ep.querySelector('.picker [role="listbox"]'),
        open: ep.isOpen,
      };
    });
    expect(r.errors).toEqual([]);
    expect(r.upgradedSync).toBe(false);
    expect(r.upgraded).toBe(true);
    expect(r.hasPanel).toBe(true);
    expect(r.open).toBe(true);
  });

  test('data-upgraded is only set once the panel exists', async ({ page }) => {
    await load(page, BASIC);
    const r = await page.evaluate(() => {
      const ep = document.getElementById('ep');
      return { search: !!ep.querySelector('input[type="search"]'), listbox: !!ep.querySelector('[role="listbox"]') };
    });
    expect(r).toEqual({ search: true, listbox: true });
  });

  test('disconnect mid-load leaves no document listeners; reconnect builds one panel', async ({ page }) => {
    await load(page, BASIC);
    const r = await page.evaluate(async () => {
      const ep = /** @type {any} */ (document.createElement('emoji-picker'));
      const main = document.querySelector('main');
      main.append(ep);
      ep.remove(); // before the (cached) module promise resolves
      await new Promise((res) => setTimeout(res, 50));
      const builtWhileDetached = !!ep.querySelector('.picker');
      for (let i = 0; i < 3; i++) { main.append(ep); ep.remove(); }
      main.append(ep);
      await ep.ready;
      await new Promise((res) => setTimeout(res, 50));
      return {
        builtWhileDetached,
        panels: ep.querySelectorAll('.picker').length,
        triggers: ep.querySelectorAll('[data-trigger]').length,
        upgraded: ep.hasAttribute('data-upgraded'),
      };
    });
    expect(r.builtWhileDetached).toBe(false);
    expect(r).toMatchObject({ panels: 1, triggers: 1, upgraded: true });
  });

  test('reconnect keeps one panel, one listener set, and still works', async ({ page }) => {
    await load(page, BASIC);
    const r = await page.evaluate(async () => {
      const ep = /** @type {any} */ (document.getElementById('ep'));
      const main = document.querySelector('main');
      for (let i = 0; i < 3; i++) { ep.remove(); main.append(ep); }
      await new Promise((res) => setTimeout(res, 50));
      let opens = 0;
      ep.addEventListener('emoji-picker:open', () => opens++);
      /** @type {HTMLElement} */ (ep.querySelector('[data-trigger]')).click();
      return { panels: ep.querySelectorAll('.picker').length, opens, open: ep.isOpen };
    });
    expect(r).toEqual({ panels: 1, opens: 1, open: true });
  });
});

test.describe('ARIA structure', () => {
  test('listbox > group > option, one tabbable option, toolbar of buttons', async ({ page }) => {
    await load(page, BASIC);
    await page.click('#ep [data-trigger]');
    const r = await page.evaluate(() => {
      const ep = document.getElementById('ep');
      const lb = ep.querySelector('[role="listbox"]');
      const search = ep.querySelector('input[type="search"]');
      const groups = [...lb.children];
      const options = [...lb.querySelectorAll('[role="option"]')];
      const tb = ep.querySelector('[role="toolbar"]');
      return {
        trigger: ep.querySelector('[data-trigger]').getAttribute('aria-controls') === ep.querySelector('.picker').id,
        controls: search.getAttribute('aria-controls') === lb.id,
        groupsOk: groups.every((g) => g.getAttribute('role') === 'group' && g.getAttribute('aria-label')),
        headingsHidden: [...lb.querySelectorAll('.group-label')].every((h) => h.getAttribute('aria-hidden') === 'true'),
        nonOptionChildren: groups.flatMap((g) => [...g.children])
          .filter((c) => c.getAttribute('role') !== 'option' && c.getAttribute('aria-hidden') !== 'true').length,
        tabbable: options.filter((o) => o.getAttribute('tabindex') === '0').length,
        labelled: options.every((o) => o.getAttribute('aria-label')),
        firstLabel: options[0].getAttribute('aria-label'),
        tabs: ep.querySelectorAll('[role="tab"], [role="tablist"]').length,
        toolbarTabbable: [...tb.querySelectorAll('button')].filter((b) => b.tabIndex === 0).length,
        noResultsInListbox: !!lb.querySelector('.no-results'),
        status: ep.querySelector('[role="status"]') !== null,
      };
    });
    expect(r).toEqual({
      trigger: true, controls: true, groupsOk: true, headingsHidden: true, nonOptionChildren: 0,
      tabbable: 1, labelled: true, firstLabel: 'Smiling Face with Open Mouth', tabs: 0,
      toolbarTabbable: 1, noResultsInListbox: false, status: true,
    });
  });
});

test.describe('keyboard', () => {
  test('Tab moves search → toolbar → listbox and stays open; leaving closes', async ({ page }) => {
    await load(page, BASIC);
    await page.click('#ep [data-trigger]');
    await expect(page.locator('#ep input[type="search"]')).toBeFocused();
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement.parentElement.getAttribute('role'))).toBe('toolbar');
    await page.keyboard.press('Tab');
    expect((await focusedInfo(page)).role).toBe('option');
    await expect(page.locator('#ep')).toHaveAttribute('open', '');
    await page.keyboard.press('Tab');
    await expect(page.locator('#outside')).toBeFocused();
    await expect(page.locator('#ep')).not.toHaveAttribute('open');
  });

  test('arrows follow the layout, including across a group heading', async ({ page }) => {
    await load(page, BASIC);
    await page.click('#ep [data-trigger]');
    await page.keyboard.press('ArrowDown');
    const first = await focusedInfo(page);
    expect(first).toMatchObject({ role: 'option', group: 'smileys', tabIndex: 0 });

    // Right then Down lands directly below (same column, next row)
    await page.keyboard.press('ArrowRight');
    const col = await page.evaluate(() => document.activeElement.getBoundingClientRect().left);
    await page.keyboard.press('ArrowDown');
    const below = await page.evaluate(() => {
      const r = document.activeElement.getBoundingClientRect();
      return { left: r.left, top: r.top };
    });
    expect(Math.abs(below.left - col)).toBeLessThan(2);

    // Last row of smileys → ArrowDown crosses the "People" heading and keeps the column
    const r = await page.evaluate(() => {
      const ep = document.getElementById('ep');
      const cells = [...ep.querySelectorAll('[data-group="smileys"] [role="option"]')];
      const last = /** @type {HTMLElement} */ (cells[cells.length - 1]);
      last.focus();
      return { left: last.getBoundingClientRect().left };
    });
    await page.keyboard.press('ArrowDown');
    const after = await page.evaluate(() => ({
      group: document.activeElement.parentElement.dataset.group,
      left: document.activeElement.getBoundingClientRect().left,
    }));
    expect(after.group).toBe('people');
    expect(Math.abs(after.left - r.left)).toBeLessThan(2);

    // ArrowUp goes back into smileys, same column
    await page.keyboard.press('ArrowUp');
    expect((await focusedInfo(page)).group).toBe('smileys');
  });

  test('ArrowUp from the first row returns to search; Home/End/PageDown', async ({ page }) => {
    await load(page, BASIC);
    await page.click('#ep [data-trigger]');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowUp');
    await expect(page.locator('#ep input[type="search"]')).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('End');
    expect((await focusedInfo(page)).group).toBe('flags');
    await page.keyboard.press('Home');
    expect(await focusedInfo(page)).toMatchObject({ group: 'smileys', shortcode: 'smile' });
    await page.keyboard.press('PageDown');
    const pd = await focusedInfo(page);
    expect(pd.group).toBe('people');
    await page.keyboard.press('PageUp');
    expect((await focusedInfo(page)).group).toBe('smileys');
    // only one tabbable option at any time
    expect(await page.locator('#ep [role="option"][tabindex="0"]').count()).toBe(1);
  });

  test('Recently used participates in layout navigation', async ({ page }) => {
    await load(page, BASIC, { recents: ['rocket', 'fire', 'tada'] });
    await page.click('#ep [data-trigger]');
    await page.keyboard.press('ArrowDown');
    expect(await focusedInfo(page)).toMatchObject({ group: 'recent', shortcode: 'rocket' });
    await page.keyboard.press('ArrowDown');
    expect(await focusedInfo(page)).toMatchObject({ group: 'smileys', shortcode: 'smile' });
  });

  test('RTL swaps ArrowLeft/ArrowRight in the listbox and toolbar', async ({ page }) => {
    await load(page, BASIC, { dir: 'rtl' });
    await page.click('#ep [data-trigger]');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowLeft');
    expect((await focusedInfo(page)).shortcode).toBe('grinning');
    await page.keyboard.press('ArrowRight');
    expect((await focusedInfo(page)).shortcode).toBe('smile');

    await page.focus('#ep [role="toolbar"] button[tabindex="0"]');
    await page.keyboard.press('ArrowLeft');
    expect(await page.evaluate(() => /** @type {HTMLElement} */ (document.activeElement).dataset.group)).toBe('people');
  });

  test('Escape closes and returns focus to the trigger', async ({ page }) => {
    await load(page, BASIC);
    await page.click('#ep [data-trigger]');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Escape');
    await expect(page.locator('#ep')).not.toHaveAttribute('open');
    await expect(page.locator('#ep [data-trigger]')).toBeFocused();
  });
});

test.describe('category toolbar', () => {
  test('arrows rove, click scrolls, aria-current follows scrolling', async ({ page }) => {
    await load(page, BASIC);
    await page.click('#ep [data-trigger]');
    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    const g = await page.evaluate(() => /** @type {HTMLElement} */ (document.activeElement).dataset.group);
    expect(g).toBe('animals');
    await page.keyboard.press('End');
    expect(await page.evaluate(() => /** @type {HTMLElement} */ (document.activeElement).dataset.group)).toBe('flags');
    await page.keyboard.press('ArrowRight'); // wraps
    expect(await page.evaluate(() => /** @type {HTMLElement} */ (document.activeElement).dataset.group)).toBe('smileys');

    await expect(page.locator('#ep [role="toolbar"] [aria-current="true"]')).toHaveAttribute('data-group', 'smileys');

    // Scroll the listbox to the food group — IntersectionObserver syncs aria-current
    await page.evaluate(() => {
      const ep = document.getElementById('ep');
      const grid = /** @type {HTMLElement} */ (ep.querySelector('[role="listbox"]'));
      grid.scrollTop = /** @type {HTMLElement} */ (grid.querySelector('[data-group="food"]')).offsetTop;
    });
    await expect(page.locator('#ep [role="toolbar"] [aria-current="true"]')).toHaveAttribute('data-group', 'food');

    // Clicking a category moves there and makes its first emoji the Tab stop
    await page.click('#ep [role="toolbar"] [data-group="travel"]');
    await expect(page.locator('#ep [role="toolbar"] [aria-current="true"]')).toHaveAttribute('data-group', 'travel');
    const tabStopGroup = await page.evaluate(() =>
      /** @type {HTMLElement} */ (document.querySelector('#ep [role="option"][tabindex="0"]')).parentElement.dataset.group);
    expect(tabStopGroup).toBe('travel');
  });
});

test.describe('search', () => {
  test('filters with hidden, announces count politely, and the empty state', async ({ page }) => {
    await load(page, BASIC);
    await page.click('#ep [data-trigger]');
    const total = await page.locator('#ep [role="option"]').count();
    await page.fill('#ep input[type="search"]', 'heart');
    const status = page.locator('#ep [role="status"]');
    await expect(status).toHaveText(/^\d+ emoji found$/);
    const visible = await page.locator('#ep [role="option"]:not([hidden])').count();
    expect(visible).toBeGreaterThan(0);
    expect(visible).toBeLessThan(total);
    expect(await page.locator('#ep [role="option"]').count()).toBe(total); // built once
    expect(await status.textContent()).toBe(`${visible} emoji found`);
    await expect(page.locator('#ep .no-results')).toBeHidden();

    await page.fill('#ep input[type="search"]', 'zzzzqqq');
    await expect(status).toHaveText('No emoji found');
    await expect(page.locator('#ep .no-results')).toBeVisible();
    await expect(page.locator('#ep [role="status"]')).toHaveAttribute('role', 'status');
  });

  test('data-label-* localizes UI strings and the count template', async ({ page }) => {
    await load(page, `
      <emoji-picker id="ep" data-label-placeholder="Buscar…" data-label-results="{count} resultados"
        data-label-empty="Sin resultados" data-label-smileys="Caritas" data-label-dialog="Selector"></emoji-picker>`);
    await page.click('#ep [data-trigger]');
    const r = await page.evaluate(() => {
      const ep = document.getElementById('ep');
      return {
        placeholder: ep.querySelector('input[type="search"]').getAttribute('placeholder'),
        dialog: ep.querySelector('.picker').getAttribute('aria-label'),
        tab: ep.querySelector('[role="toolbar"] [data-group="smileys"]').getAttribute('aria-label'),
        group: ep.querySelector('[role="group"][data-group="smileys"]').getAttribute('aria-label'),
      };
    });
    expect(r).toEqual({ placeholder: 'Buscar…', dialog: 'Selector', tab: 'Caritas', group: 'Caritas' });
    await page.fill('#ep input[type="search"]', 'rocket');
    await expect(page.locator('#ep [role="status"]')).toHaveText('1 resultados');
    await page.fill('#ep input[type="search"]', 'zzzzqqq');
    await expect(page.locator('#ep [role="status"]')).toHaveText('Sin resultados');
  });
});

test.describe('focus and positioning', () => {
  test('focus leaving the component closes it', async ({ page }) => {
    await load(page, BASIC);
    await page.click('#ep [data-trigger]');
    await page.focus('#outside');
    await expect(page.locator('#ep')).not.toHaveAttribute('open');
  });

  test('panel is in the top layer and not clipped by an overflow container', async ({ page }) => {
    await load(page, `
      <section id="clip" style="overflow:hidden;block-size:3rem">
        <emoji-picker id="ep"></emoji-picker>
      </section>`);
    await page.click('#ep [data-trigger]');
    const r = await page.evaluate(() => {
      const panel = document.querySelector('#ep .picker');
      const rect = panel.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height - 20;
      return { popoverOpen: panel.matches(':popover-open'), hit: panel.contains(document.elementFromPoint(x, y)) };
    });
    expect(r).toEqual({ popoverOpen: true, hit: true });
  });
});

test.describe('input insertion', () => {
  test('inserts at the caret with an insertText InputEvent', async ({ page }) => {
    await load(page, BASIC);
    const r = await page.evaluate(async () => {
      const ta = /** @type {HTMLTextAreaElement} */ (document.getElementById('msg'));
      ta.focus();
      ta.setSelectionRange(2, 2);
      /** @type {any[]} */
      const events = [];
      ta.addEventListener('input', (e) => events.push({ type: e.constructor.name, inputType: /** @type {InputEvent} */ (e).inputType, data: /** @type {InputEvent} */ (e).data }));
      const ep = /** @type {any} */ (document.getElementById('ep'));
      ep.open();
      /** @type {HTMLElement} */ (ep.querySelector('[data-group="smileys"] [role="option"]')).click();
      return { value: ta.value, events, focused: document.activeElement === ta, open: ep.isOpen };
    });
    expect(r.value).toBe('he😄llo');
    expect(r.events).toEqual([{ type: 'InputEvent', inputType: 'insertText', data: '😄' }]);
    expect(r.focused).toBe(true);
    expect(r.open).toBe(false);
  });

  test('the insertion is undoable', async ({ page }) => {
    await load(page, BASIC);
    await page.evaluate(() => {
      const ta = /** @type {HTMLTextAreaElement} */ (document.getElementById('msg'));
      ta.focus();
      ta.setSelectionRange(5, 5);
      const ep = /** @type {any} */ (document.getElementById('ep'));
      ep.open();
      /** @type {HTMLElement} */ (ep.querySelector('[data-group="smileys"] [role="option"]')).click();
    });
    await expect(page.locator('#msg')).toHaveValue('hello😄');
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+z' : 'Control+z');
    await expect(page.locator('#msg')).toHaveValue('hello');
  });

  test('email input does not throw', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await load(page, `
      <label for="em">Email</label>
      <input type="email" id="em" value="a@b.c">
      <emoji-picker id="ep" for="em"></emoji-picker>`);
    const r = await page.evaluate(() => {
      const ep = /** @type {any} */ (document.getElementById('ep'));
      let threw = null;
      try {
        ep.open();
        /** @type {HTMLElement} */ (ep.querySelector('[data-group="smileys"] [role="option"]')).click();
      } catch (e) { threw = String(e); }
      return { threw, value: /** @type {HTMLInputElement} */ (document.getElementById('em')).value };
    });
    expect(r.threw).toBeNull();
    expect(r.value).toContain('😄');
    expect(errors).toEqual([]);
  });

  test('no target: select event fires and focus returns to the trigger', async ({ page }) => {
    await load(page, '<emoji-picker id="ep"></emoji-picker>');
    // Register the listener before interacting, and wait for the panel to be
    // open with the search box focused — on a slow runner the keys otherwise
    // land before the picker has built and the select event never fires.
    await page.evaluate(() => {
      window.__epDetail = new Promise((res) => {
        document.getElementById('ep').addEventListener('emoji-picker:select', (e) => res(/** @type {CustomEvent} */ (e).detail), { once: true });
      });
    });
    await page.click('#ep [data-trigger]');
    await expect(page.locator('#ep')).toHaveAttribute('open', '');
    await expect(page.locator('#ep input[type="search"]')).toBeFocused();
    const detail = page.evaluate(() => window.__epDetail);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    expect(await detail).toMatchObject({ shortcode: 'smile', emoji: '😄' });
    await expect(page.locator('#ep [data-trigger]')).toBeFocused();
  });
});

test.describe('extended set', () => {
  test('arriving after the picker is built shows up on next open', async ({ page }) => {
    await load(page, BASIC);
    const before = await page.evaluate(() => {
      const ep = /** @type {any} */ (document.getElementById('ep'));
      return ep.querySelectorAll('[role="option"]').length;
    });
    await page.addScriptTag({ type: 'module', url: '/src/data/emoji-data-extended.js' });
    await page.click('#ep [data-trigger]');
    await page.fill('#ep input[type="search"]', 'melting');
    await expect(page.locator('#ep [role="option"]:not([hidden])')).toHaveCount(1);
    const after = await page.locator('#ep [role="option"]').count();
    expect(after).toBeGreaterThan(before + 1000);
  });
});
