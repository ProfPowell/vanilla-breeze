/**
 * drag-surface — review fixes (beads 8kf7, 8s1z, rb3n, qim5).
 *
 * Covers: data-move-controls single-pointer reorder/transfer (WCAG 2.5.7);
 * keys from nested controls are not hijacked; RTL horizontal drop index and
 * ArrowLeft/Right; disabled rejects dragstart and drops; dynamic child
 * decoration; keyboard transfer then Escape; live region outside role=list;
 * drag state cleared on every surface at dragend.
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
  const url = `/__drag-surface-review-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en" dir="${dir}"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <script type="module">import '/src/web-components/drag-surface/logic.js';</script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForSelector('drag-surface[data-upgraded]');
}

const order = (page, sel = 'drag-surface') =>
  page.evaluate((s) => document.querySelector(s).sortedOrder, sel);

const LIST = `
  <drag-surface id="s" data-move-controls data-layout="stack">
    <article draggable="true" data-id="a">Alpha</article>
    <article draggable="true" data-id="b">Bravo</article>
    <article draggable="true" data-id="c">Charlie</article>
  </drag-surface>`;

const BOARD = `
  <section data-layout="grid" data-layout-min="xs">
    <drag-surface id="todo" group="g" aria-label="To Do" data-move-controls>
      <article draggable="true" data-id="a">Alpha</article>
      <article draggable="true" data-id="b">Bravo</article>
    </drag-surface>
    <drag-surface id="doing" group="g" aria-label="Doing" data-move-controls>
      <article draggable="true" data-id="c">Charlie</article>
    </drag-surface>
  </section>`;

test.describe('move controls (single-pointer alternative)', () => {
  test('renders labelled Move buttons and reorders with a click', async ({ page }) => {
    await load(page, LIST);
    const up = page.getByRole('button', { name: 'Move Bravo up' });
    const down = page.getByRole('button', { name: 'Move Bravo down' });
    await expect(up).toBeVisible();
    await expect(down).toBeVisible();
    // First item cannot move up
    await expect(page.getByRole('button', { name: 'Move Alpha up' })).toHaveAttribute('aria-disabled', 'true');
    // Ungrouped: no transfer buttons exposed
    await expect(page.getByRole('button', { name: /Move Alpha to/ })).toHaveCount(0);

    await page.evaluate(() => {
      window.__ev = null;
      document.getElementById('s').addEventListener('drag-surface:reorder', (e) => {
        window.__ev = { itemId: e.detail.itemId, oldIndex: e.detail.oldIndex, newIndex: e.detail.newIndex };
      });
    });
    await up.click();
    expect(await order(page)).toEqual(['b', 'a', 'c']);
    expect(await page.evaluate(() => window.__ev)).toEqual({ itemId: 'b', oldIndex: 1, newIndex: 0 });
    // Bravo is now first: its up button is disabled but keeps focus
    await expect(up).toHaveAttribute('aria-disabled', 'true');
    await expect(up).toBeFocused();
    // aria-disabled button is a no-op (force: Playwright treats it as disabled)
    await up.click({ force: true });
    expect(await order(page)).toEqual(['b', 'a', 'c']);
  });

  test('labels exclude control text and move to a grouped surface', async ({ page }) => {
    await load(page, BOARD);
    const to = page.getByRole('button', { name: 'Move Alpha to Doing' });
    await expect(to).toBeVisible();
    await expect(page.getByRole('button', { name: /Move Alpha to To Do/ })).toHaveCount(0);
    await to.click();
    expect(await order(page, '#todo')).toEqual(['b']);
    expect(await order(page, '#doing')).toEqual(['c', 'a']);
    // Back button now names the original surface
    await expect(page.getByRole('button', { name: 'Move Alpha to To Do' })).toBeVisible();
  });

  test('removing data-move-controls removes the buttons; disabled surfaces disable them', async ({ page }) => {
    await load(page, LIST);
    await page.evaluate(() => document.getElementById('s').setAttribute('disabled', ''));
    await expect(page.getByRole('button', { name: 'Move Bravo down' })).toHaveAttribute('aria-disabled', 'true');
    await page.evaluate(() => document.getElementById('s').removeAttribute('data-move-controls'));
    await expect(page.locator('[data-drag-surface-controls]')).toHaveCount(0);
  });
});

test.describe('keyboard', () => {
  test('keys from nested controls are not hijacked', async ({ page }) => {
    await load(page, `
      <drag-surface id="s">
        <article draggable="true" data-id="a">Alpha <button type="button" id="btn">Edit</button>
          <input id="field" aria-label="Note"></article>
        <article draggable="true" data-id="b">Bravo</article>
      </drag-surface>`);
    await page.evaluate(() => {
      window.__clicks = 0;
      document.getElementById('btn').addEventListener('click', () => window.__clicks++);
    });
    await page.locator('#btn').focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Space');
    expect(await page.evaluate(() => window.__clicks)).toBe(2);
    await expect(page.locator('[data-id="a"]')).not.toHaveAttribute('data-grabbed');
    await expect(page.locator('#s')).not.toHaveAttribute('data-reorder-mode');

    await page.locator('#field').focus();
    await page.keyboard.type('x y');
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('#field')).toHaveValue('x y');
    await expect(page.locator('#field')).toBeFocused();
  });

  test('RTL horizontal: ArrowLeft moves towards the inline end', async ({ page }) => {
    await load(page, `
      <drag-surface id="s" orientation="horizontal" data-layout="cluster">
        <article draggable="true" data-id="a">A</article>
        <article draggable="true" data-id="b">B</article>
        <article draggable="true" data-id="c">C</article>
      </drag-surface>`, { dir: 'rtl' });
    const a = page.locator('[data-id="a"]');
    await a.focus();
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('Space');
    expect(await order(page)).toEqual(['b', 'a', 'c']);
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Space');
    expect(await order(page)).toEqual(['a', 'b', 'c']);
  });

  test('keyboard transfer hands over the grab; Escape returns to the landing index', async ({ page }) => {
    await load(page, BOARD.replaceAll(' data-move-controls', ''));
    await page.evaluate(() => {
      window.__reorder = null;
      document.addEventListener('drag-surface:reorder', (e) => { window.__reorder = e.detail.oldIndex; });
    });
    await page.locator('[data-id="a"]').focus();
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowRight');
    expect(await order(page, '#doing')).toEqual(['c', 'a']);
    await expect(page.locator('#todo')).not.toHaveAttribute('data-reorder-mode');
    await expect(page.locator('#doing')).toHaveAttribute('data-reorder-mode', '');
    await expect(page.locator('[data-id="a"]')).toHaveAttribute('data-grabbed', '');

    await page.keyboard.press('ArrowUp');
    expect(await order(page, '#doing')).toEqual(['a', 'c']);
    await page.keyboard.press('Escape');
    expect(await order(page, '#doing')).toEqual(['c', 'a']);
    await expect(page.locator('[data-id="a"]')).not.toHaveAttribute('data-grabbed');
    await expect(page.locator('#doing')).not.toHaveAttribute('data-reorder-mode');

    // Drop after a transfer reports a real oldIndex
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('Space');
    expect(await page.evaluate(() => window.__reorder)).toBe(1);
  });

  test('focus leaving a grabbed item cancels the grab', async ({ page }) => {
    await load(page, `${LIST.replace(' data-move-controls', '')}<button type="button" id="out">Out</button>`);
    await page.locator('[data-id="a"]').focus();
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowDown');
    await page.locator('#out').focus();
    await expect(page.locator('#s')).not.toHaveAttribute('data-reorder-mode');
    expect(await order(page)).toEqual(['a', 'b', 'c']);
  });
});

test.describe('pointer drag', () => {
  /** Synthetic HTML5 DnD sequence with explicit coordinates. */
  async function drag(page, fromSel, toSurfaceSel, x, y) {
    return page.evaluate(({ fromSel, toSurfaceSel, x, y }) => {
      const item = document.querySelector(fromSel);
      const target = document.querySelector(toSurfaceSel);
      const dt = new DataTransfer();
      const fire = (el, type, init = {}) => {
        const ev = new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: dt, ...init });
        el.dispatchEvent(ev);
        return ev.defaultPrevented;
      };
      const startPrevented = fire(item, 'dragstart');
      const overAccepted = fire(target, 'dragover', { clientX: x, clientY: y });
      const indicator = target.querySelector('[data-drop-target]')?.dataset.id ?? null;
      const indicatorSide = target.querySelector('[data-drop-target]')?.dataset.dropTarget ?? null;
      fire(target, 'drop', { clientX: x, clientY: y });
      fire(item, 'dragend');
      return { startPrevented, overAccepted, indicator, indicatorSide };
    }, { fromSel, toSurfaceSel, x, y });
  }

  test('RTL horizontal drop index uses the inline start on the right', async ({ page }) => {
    await load(page, `
      <drag-surface id="s" orientation="horizontal" data-layout="cluster">
        <article draggable="true" data-id="a">Alpha</article>
        <article draggable="true" data-id="b">Bravo</article>
        <article draggable="true" data-id="c">Charlie</article>
      </drag-surface>`, { dir: 'rtl' });
    // Drop just left of Charlie's centre (= after Charlie in RTL) → a goes last
    const box = await page.locator('[data-id="c"]').boundingBox();
    const r = await drag(page, '[data-id="a"]', '#s', box.x + box.width / 2 - 2, box.y + box.height / 2);
    expect(r.startPrevented).toBe(false);
    expect(r.overAccepted).toBe(true);
    expect(r.indicator).toBe('c');
    expect(r.indicatorSide).toBe('after');
    expect(await order(page)).toEqual(['b', 'c', 'a']);
  });

  test('disabled surface rejects dragstart and drops', async ({ page }) => {
    await load(page, `
      <drag-surface id="src" group="g" aria-label="Src">
        <article draggable="true" data-id="a">Alpha</article>
      </drag-surface>
      <drag-surface id="dst" group="g" aria-label="Dst" disabled>
        <article draggable="true" data-id="b">Bravo</article>
      </drag-surface>`);
    await expect(page.locator('#dst')).toHaveAttribute('aria-disabled', 'true');
    const box = await page.locator('#dst').boundingBox();
    const r = await drag(page, '[data-id="a"]', '#dst', box.x + 5, box.y + 5);
    expect(r.overAccepted).toBe(false);
    expect(await order(page, '#dst')).toEqual(['b']);
    expect(await order(page, '#src')).toEqual(['a']);

    const r2 = await drag(page, '[data-id="b"]', '#src', 1, 1);
    expect(r2.startPrevented).toBe(true);
  });

  test('dragend clears indicators on every surface', async ({ page }) => {
    await load(page, `
      <drag-surface id="one" group="g" aria-label="One">
        <article draggable="true" data-id="a">Alpha</article>
      </drag-surface>
      <drag-surface id="two" group="g" aria-label="Two">
        <article draggable="true" data-id="b">Bravo</article>
      </drag-surface>`);
    const left = await page.evaluate(() => {
      const item = document.querySelector('[data-id="a"]');
      const two = document.getElementById('two');
      const dt = new DataTransfer();
      const r = two.getBoundingClientRect();
      item.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: dt }));
      two.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt, clientX: r.left + 2, clientY: r.top + 2 }));
      // Cancelled drag (no drop) — dragend fires on the source item only
      item.dispatchEvent(new DragEvent('dragend', { bubbles: true, dataTransfer: dt }));
      return {
        dragOver: document.querySelectorAll('[data-drag-over]').length,
        indicators: document.querySelectorAll('[data-drop-target]').length,
        dragging: document.querySelectorAll('[data-dragging]').length,
      };
    });
    expect(left).toEqual({ dragOver: 0, indicators: 0, dragging: 0 });
  });
});

test.describe('structure', () => {
  test('role=list owns only listitems (live region is a sibling)', async ({ page }) => {
    await load(page, LIST);
    const r = await page.evaluate(() => {
      const s = document.getElementById('s');
      return {
        nonItems: [...s.children].filter(c => c.getAttribute('role') !== 'listitem').length,
        sibling: s.nextElementSibling?.getAttribute('role'),
        inlineStyle: s.nextElementSibling?.hasAttribute('style'),
        ariaGrabbed: s.querySelectorAll('[aria-grabbed]').length,
      };
    });
    expect(r).toEqual({ nonItems: 0, sibling: 'status', inlineStyle: false, ariaGrabbed: 0 });
  });

  test('dynamically added items are decorated', async ({ page }) => {
    await load(page, LIST);
    await page.evaluate(() => {
      const el = document.createElement('article');
      el.draggable = true;
      el.dataset.id = 'd';
      el.textContent = 'Delta';
      document.getElementById('s').append(el);
    });
    const d = page.locator('[data-id="d"]');
    await expect(d).toHaveAttribute('role', 'listitem');
    await expect(d).toHaveAttribute('tabindex', '0');
    await expect(page.getByRole('button', { name: 'Move Delta up' })).toBeVisible();
    // Charlie is no longer last
    await expect(page.getByRole('button', { name: 'Move Charlie down' })).toHaveAttribute('aria-disabled', 'false');
  });

  test('teardown clears reorder mode and grab state', async ({ page }) => {
    await load(page, LIST);
    await page.locator('[data-id="a"]').focus();
    await page.keyboard.press('Space');
    const r = await page.evaluate(() => {
      const s = document.getElementById('s');
      const parent = s.parentElement;
      s.remove();
      const state = {
        mode: s.hasAttribute('data-reorder-mode'),
        grabbed: s.querySelectorAll('[data-grabbed]').length,
        controls: s.querySelectorAll('[data-drag-surface-controls]').length,
        live: parent.querySelectorAll('[data-drag-surface-live]').length,
      };
      parent.append(s);
      return state;
    });
    expect(r).toEqual({ mode: false, grabbed: 0, controls: 0, live: 0 });
  });
});
