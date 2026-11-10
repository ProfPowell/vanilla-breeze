/**
 * note-wc + notification-wc — M+N review fixes.
 *
 * notification-wc: one trigger/panel across reconnects, cancellable async
 * setup (no leaked poll), http(s)-only row links, unread count in the
 * trigger name, focus into/out of the dialog, full tabs pattern,
 * phrasing-only rows, banner dismiss focus + reactive variant, no-JS
 * fallback, data-label-* + Intl dates.
 *
 * note-wc: one button across reconnects, no button standalone, focus
 * restore on Escape/Save/outside click, offset-based highlight matching,
 * data-label-*, positioning hook instead of inline style.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

async function load(page, body, { lang = 'en', modules = ['notification-wc'], wait = true } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  await page.route('**/__feed.json', (route) => route.fulfill({
    status: 200, contentType: 'application/json', body: JSON.stringify([]),
  }));
  const url = `/__mn-note-notification-${Math.random().toString(36).slice(2)}.html`;
  const imports = modules.map((m) => `import '/src/web-components/${m}/logic.js';`).join('\n');
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="${lang}"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <script type="module">${imports}</script>
      </head><body>${body}</body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  if (!wait) return;
  for (const m of modules) await page.waitForFunction((tag) => customElements.get(tag), m);
}

const PANEL = `
  <header><notification-wc id="n">
    <article data-id="a" data-type="update" data-date="2026-04-10">
      <h3>Release</h3><p>Body text.</p><a href="/changelog">More</a>
    </article>
    <article data-id="b" data-type="alert" data-date="2026-04-12">
      <h3>Maintenance</h3><p>Downtime.</p>
    </article>
  </notification-wc></header>
  <main><p id="outside">Outside</p><button id="other">Other</button></main>`;

async function panelReady(page) {
  await page.waitForFunction(() => document.querySelector('#n .notification-panel .notification-list li'));
}

// ── notification-wc ─────────────────────────────────────────────────

test('notification-wc: reconnect keeps one trigger and one panel, aria-controls stays valid', async ({ page }) => {
  await load(page, PANEL);
  await panelReady(page);
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => { const n = document.getElementById('n'); const p = n.parentElement; n.remove(); p.append(n); });
    await page.waitForFunction(() => document.getElementById('n').hasAttribute('data-upgraded'));
  }
  await page.waitForTimeout(100);
  const r = await page.evaluate(() => {
    const n = document.getElementById('n');
    const trigger = n.querySelector(':scope > [data-trigger]');
    return {
      triggers: n.querySelectorAll(':scope > [data-trigger]').length,
      panels: n.querySelectorAll(':scope > .notification-panel').length,
      controlsPanel: document.getElementById(trigger.getAttribute('aria-controls'))?.classList.contains('notification-panel'),
    };
  });
  expect(r).toEqual({ triggers: 1, panels: 1, controlsPanel: true });
});

test('notification-wc: disconnect mid-setup leaks no poll interval or document listener', async ({ page }) => {
  await load(page, '<main id="host"></main>', { wait: true });
  const r = await page.evaluate(async () => {
    let fetches = 0;
    const orig = window.fetch;
    window.fetch = (...a) => { fetches++; return orig(...a); };
    const host = document.getElementById('host');
    const n = document.createElement('notification-wc');
    n.setAttribute('src', '/__feed.json');
    n.setAttribute('poll', '40');
    host.append(n);
    n.remove(); // before VBStore/fetch awaits resolve
    // move case: remove + re-add mid-setup must still produce one panel
    const m = document.createElement('notification-wc');
    m.setAttribute('src', '/__feed.json');
    m.setAttribute('poll', '40');
    host.append(m);
    m.remove(); host.append(m);
    await new Promise((res) => setTimeout(res, 120));
    m.remove();
    const before = fetches;
    await new Promise((res) => setTimeout(res, 300));
    return {
      detachedPanels: n.querySelectorAll('.notification-panel').length,
      movedPanels: m.querySelectorAll(':scope > .notification-panel').length,
      fetchesAfterRemove: fetches - before,
    };
  });
  expect(r.detachedPanels).toBe(0);
  expect(r.movedPanels).toBe(1);
  expect(r.fetchesAfterRemove).toBe(0);
});

test('notification-wc: only http(s)/relative urls become links', async ({ page }) => {
  await load(page, PANEL);
  await panelReady(page);
  const r = await page.evaluate(() => {
    const n = /** @type {any} */ (document.getElementById('n'));
    n.notifications = [
      { id: 'x', title: 'Bad', url: 'javascript:alert(1)', date: '2026-05-01' },
      { id: 'y', title: 'Data', url: 'data:text/html,hi', date: '2026-05-02' },
      { id: 'z', title: 'Good', url: 'https://example.com/', date: '2026-05-03' },
    ];
    const tag = (id) => n.querySelector(`[data-notification-id="${id}"] .notification-row`).tagName;
    return { x: tag('x'), y: tag('y'), z: tag('z'), rel: tag('a'),
      jsHref: [...n.querySelectorAll('a')].some((a) => a.getAttribute('href').startsWith('javascript')) };
  });
  expect(r).toEqual({ x: 'BUTTON', y: 'BUTTON', z: 'A', rel: 'A', jsHref: false });
});

test('notification-wc: trigger name carries the unread count', async ({ page }) => {
  await load(page, PANEL);
  await panelReady(page);
  const trigger = page.locator('#n > [data-trigger]');
  await expect(trigger).toHaveAccessibleName('Notifications, 2 unread');
  await trigger.click();
  await page.locator('#n .notification-mark-all').click();
  await expect(trigger).toHaveAccessibleName('Notifications');
});

test('notification-wc: focus moves into the dialog and Escape returns it', async ({ page }) => {
  await load(page, PANEL);
  await panelReady(page);
  const trigger = page.locator('#n > [data-trigger]');
  await trigger.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Notifications' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  // Tabbing out closes the panel
  await trigger.click();
  await expect(dialog).toBeVisible();
  await page.locator('#other').focus();
  await expect(dialog).toBeHidden();
});

test('notification-wc: dropdown on a wide screen; a sheet on a narrow one or inside a popover', async ({ page }) => {
  // Wide, bell in the header: a dropdown under the bell, no close button
  await page.setViewportSize({ width: 1000, height: 700 });
  await load(page, PANEL);
  await panelReady(page);
  const trigger = page.locator('#n > [data-trigger]');
  const panel = page.locator('#n .notification-panel');
  await trigger.click();
  await expect(panel).toBeVisible();
  expect(await panel.evaluate((el) => [el.hasAttribute('popover'), getComputedStyle(el).position])).toEqual([false, 'absolute']);
  await expect(panel.locator('.notification-close')).toBeHidden();
  await page.keyboard.press('Escape');

  // Narrow: a full-width sheet in the top layer with a backdrop and a close button
  await page.setViewportSize({ width: 360, height: 700 });
  await trigger.click();
  await expect(panel).toBeVisible();
  const sheet = await panel.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { top: r.top, left: r.left, width: r.width, topLayer: el.matches(':popover-open'), overflow: document.documentElement.scrollWidth > innerWidth };
  });
  expect(sheet).toEqual({ top: 0, left: 0, width: 360, topLayer: true, overflow: false });
  await expect(page.getByRole('dialog', { name: 'Notifications' })).toBeFocused();
  await panel.getByRole('button', { name: 'Close notifications' }).click();
  await expect(panel).toBeHidden();
  await expect(trigger).toBeFocused();
  expect(await panel.evaluate((el) => el.hasAttribute('popover'))).toBe(false);
  // Escape and a click on the backdrop close it too
  await trigger.click();
  await expect(panel).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
  await trigger.click();
  await expect(panel).toBeVisible();
  await page.mouse.click(180, 650);
  await expect(panel).toBeHidden();

  // Wide, but inside a popover (a mobile menu at tablet width): still a sheet,
  // centred, and the menu stays open behind it
  await page.setViewportSize({ width: 800, height: 700 });
  await load(page, `
    <button type="button" id="open" popovertarget="menu">Menu</button>
    <nav popover id="menu" style="inline-size:260px">${PANEL.replace('<header>', '<section>').replace('</header>', '</section>')}</nav>`);
  await panelReady(page);
  await page.locator('#open').click();
  await page.locator('#n > [data-trigger]').click();
  const inMenu = page.locator('#n .notification-panel');
  await expect(inMenu).toBeVisible();
  const box = await inMenu.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { wide: r.width > 400, centred: Math.abs((r.left + r.right) / 2 - innerWidth / 2) < 2, topLayer: el.matches(':popover-open'), menuOpen: document.getElementById('menu').matches(':popover-open') };
  });
  expect(box).toEqual({ wide: true, centred: true, topLayer: true, menuOpen: true });
});

test('notification-wc: tabs pattern with aria-controls, tabpanels and arrow keys', async ({ page }) => {
  await load(page, PANEL);
  await panelReady(page);
  await page.locator('#n > [data-trigger]').click();
  const all = page.getByRole('tab', { name: 'All' });
  const watching = page.getByRole('tab', { name: /Watching/ });
  await expect(page.getByRole('tablist')).toHaveCount(1);
  const tablistTag = await page.getByRole('tablist').evaluate((el) => el.tagName);
  expect(tablistTag).not.toBe('NAV');
  const controls = await all.getAttribute('aria-controls');
  expect(await page.locator(`#${controls}`).getAttribute('role')).toBe('tabpanel');
  await all.focus();
  await page.keyboard.press('ArrowRight');
  await expect(watching).toBeFocused();
  await expect(watching).toHaveAttribute('aria-selected', 'true');
  await expect(all).toHaveAttribute('tabindex', '-1');
  const wid = await watching.getAttribute('aria-controls');
  await expect(page.locator(`#${wid}`)).toBeVisible();
  await expect(page.locator(`#${controls}`)).toBeHidden();
  await page.keyboard.press('Home');
  await expect(all).toBeFocused();
});

test('notification-wc: row buttons contain phrasing content only', async ({ page }) => {
  await load(page, PANEL);
  await panelReady(page);
  const bad = await page.evaluate(() =>
    document.querySelectorAll('#n .notification-row div, #n .notification-row h1, #n .notification-row h2, #n .notification-row h3, #n .notification-row h4, #n .notification-row p').length);
  expect(bad).toBe(0);
});

test('notification-wc: one delegated row listener marks read', async ({ page }) => {
  await load(page, PANEL);
  await panelReady(page);
  await page.locator('#n > [data-trigger]').click();
  const ids = [];
  await page.exposeFunction('__read', (id) => ids.push(id));
  await page.evaluate(() => document.getElementById('n').addEventListener('notification-wc:read', (e) => window.__read(e.detail.id)));
  // Re-render a few times (setter) — handler must not stack
  await page.evaluate(() => { const n = document.getElementById('n'); for (let i = 0; i < 3; i++) n.notifications = []; });
  await page.locator('#n [data-notification-id="b"] .notification-row').click();
  await page.waitForTimeout(50);
  expect(ids).toEqual(['b']);
  await expect(page.locator('#n [data-notification-id="b"]')).toHaveAttribute('data-read', '');
});

test('notification-wc: data-label-* overrides and Intl dates in the document language', async ({ page }) => {
  await load(page, `<header><notification-wc id="n" data-label-trigger="Mitteilungen" data-label-unread="{n} ungelesen" data-label-mark-all="Alle gelesen" data-label-all="Alle">
    <article data-id="a" data-date="2026-04-10"><h3>Neu</h3></article>
  </notification-wc></header><main></main>`, { lang: 'de' });
  await panelReady(page);
  await expect(page.locator('#n > [data-trigger]')).toHaveAccessibleName('Mitteilungen, 1 ungelesen');
  const r = await page.evaluate(() => ({
    markAll: document.querySelector('#n .notification-mark-all').textContent,
    all: document.querySelector('#n [role="tab"][data-tab="all"]').textContent.trim(),
    time: document.querySelector('#n time').textContent,
  }));
  expect(r.markAll).toBe('Alle gelesen');
  expect(r.all).toBe('Alle');
  expect(r.time).toBe('10.04.2026'); // de, date-only shown as that calendar day
});

test('notification-wc: banner dismiss moves focus to main; variant/position are reactive', async ({ page }) => {
  await load(page, `<notification-wc id="b" mode="banner" persist="mn-test-banner" variant="info">
      <strong>Hi</strong> <button type="button" value="dismiss">Dismiss</button>
    </notification-wc><main><h1>Page</h1></main>`);
  await page.evaluate(() => localStorage.clear());
  await page.waitForSelector('#b[data-upgraded]');
  await page.waitForTimeout(50);
  await page.evaluate(() => { const b = document.getElementById('b'); b.setAttribute('variant', 'warning'); b.setAttribute('position', 'bottom'); });
  const ds = await page.evaluate(() => ({ ...document.getElementById('b').dataset }));
  expect(ds.variant).toBe('warning');
  expect(ds.position).toBe('bottom');
  await page.locator('#b button').focus();
  await page.locator('#b button').press('Enter');
  await expect(page.locator('#b')).toBeHidden();
  await expect(page.locator('main')).toBeFocused();
});

test('notification-wc: banner variant has a text prefix, not colour alone', async ({ page }) => {
  await load(page, `<notification-wc id="b" mode="banner" persist="mn-test-prefix" variant="warning" data-label-variant-error="Fehler:">
      <strong>Disk almost full</strong> <button type="button" value="dismiss">Dismiss</button>
    </notification-wc>`);
  await page.evaluate(() => localStorage.clear());
  await page.waitForSelector('#b[data-upgraded]');
  await expect(page.locator('#b strong')).toHaveText('Warning: Disk almost full');
  await page.evaluate(() => document.getElementById('b').setAttribute('variant', 'error'));
  await expect(page.locator('#b strong')).toHaveText('Fehler: Disk almost full');
  expect(await page.locator('#b [data-variant-prefix]').count()).toBe(1);
});

test('notification-wc: without scripting the banner and static articles show', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await load(page, `<notification-wc mode="banner" persist="k"><strong>Banner text</strong></notification-wc>
    <notification-wc id="n"><article data-id="a"><h3>Static article</h3></article></notification-wc>`, { wait: false });
  await expect(page.getByText('Banner text')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Static article' })).toBeVisible();
  await context.close();
});

test('notification-wc: Changed badge uses dark text on warning (AA)', async ({ page }) => {
  await load(page, PANEL);
  await panelReady(page);
  const color = await page.evaluate(() => {
    const s = document.createElement('span');
    s.className = 'notification-changed-badge';
    document.getElementById('n').append(s);
    return getComputedStyle(s).color;
  });
  expect(color).not.toBe('rgb(255, 255, 255)');
});

// ── note-wc ─────────────────────────────────────────────────────────

const NOTE_PAGE = `
  <main>
    <note-wc id="page-note" for="art"></note-wc>
    <note-wc id="bare"></note-wc>
    <article id="art" data-highlights="mn-note-test">
      <p id="p1">The quick brown fox jumps over the lazy dog and the cat watches the fox.</p>
    </article>
    <p id="outside">Outside text</p>
  </main>`;

async function loadNote(page, body = NOTE_PAGE) {
  await load(page, body, { modules: ['note-wc', 'selection-menu'] });
  await page.evaluate(() => localStorage.clear());
  await page.waitForSelector('#page-note[data-upgraded]');
}

/** Create a highlight on [start,end) of #p1's text via the controller. */
async function highlight(page, start, end) {
  return page.evaluate(async ([s, e]) => {
    const { initHighlights } = await import('/src/utils/highlights-init.js');
    const art = document.getElementById('art');
    const c = initHighlights(art);
    const t = document.getElementById('p1').firstChild;
    const r = document.createRange(); r.setStart(t, s); r.setEnd(t, e);
    const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
    c._createFromSelection('yellow');
    return c.getHighlights().length;
  }, [start, end]);
}

test('note-wc: reconnect keeps one button; bare note-wc renders none', async ({ page }) => {
  await loadNote(page);
  const r = await page.evaluate(() => {
    const n = document.getElementById('page-note');
    const main = n.parentElement;
    for (let i = 0; i < 3; i++) { n.remove(); main.prepend(n); }
    return {
      buttons: n.querySelectorAll(':scope > button').length,
      bare: document.querySelectorAll('#bare button').length,
    };
  });
  expect(r).toEqual({ buttons: 1, bare: 0 });
  await expect(page.locator('#page-note > button')).toHaveAccessibleName('View notes');
});

test('note-wc: Escape anywhere in the panel closes it and returns focus to the opener', async ({ page }) => {
  await loadNote(page);
  await highlight(page, 4, 9); // "quick"
  const btn = page.locator('#page-note > button');
  await btn.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Private note' });
  await expect(dialog).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Note for highlighted text' })).toBeFocused();
  // Escape from the Save button (not just the textarea)
  await dialog.getByRole('button', { name: 'Save' }).focus();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(btn).toBeFocused();
});

test('note-wc: Save stores the note and returns focus; no inline position on the target', async ({ page }) => {
  await loadNote(page);
  await highlight(page, 4, 9);
  const before = await page.evaluate(() => document.getElementById('art').style.position);
  const btn = page.locator('#page-note > button');
  await btn.click();
  expect(await page.evaluate(() => document.getElementById('art').style.position)).toBe(before);
  await page.getByRole('textbox', { name: 'Note for highlighted text' }).fill('A note');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(btn).toBeFocused();
  const r = await page.evaluate(async () => {
    const { initHighlights } = await import('/src/utils/highlights-init.js');
    const art = document.getElementById('art');
    return {
      note: initHighlights(art).getHighlights()[0].note,
      host: art.hasAttribute('data-note-host'),
      position: art.style.position,
    };
  });
  expect(r).toEqual({ note: 'A note', host: false, position: before });
});

test('note-wc: outside click closes and focus does not drop to body', async ({ page }) => {
  await loadNote(page);
  await highlight(page, 4, 9);
  const btn = page.locator('#page-note > button');
  await btn.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.waitForTimeout(50); // outside listener attaches next frame
  // Click a non-focusable spot away from the panel (it covers #outside on mobile)
  const vw = page.viewportSize()?.width ?? 800;
  await page.mouse.click(vw - 4, 4);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.waitForTimeout(50);
  await expect(btn).toBeFocused();
});

test('note-wc: closing before the next frame leaves no outside-click listener', async ({ page }) => {
  await loadNote(page);
  await highlight(page, 4, 9);
  const r = await page.evaluate(async () => {
    const { initHighlights } = await import('/src/utils/highlights-init.js');
    const c = initHighlights(document.getElementById('art'));
    const host = /** @type {any} */ (document.getElementById('bare'));
    host.openFor(c.getHighlights()[0], c);
    host.remove(); // closes synchronously, before the rAF
    await new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)));
    return {
      panels: document.querySelectorAll('.hn-note-panel').length,
      textareaFocused: document.activeElement?.classList.contains('hn-note-textarea') ?? false,
    };
  });
  expect(r).toEqual({ panels: 0, textareaFocused: false });
});

test('note-wc: selection-menu reuses only a highlight that contains the selection', async ({ page }) => {
  await loadNote(page, `
    <selection-menu for="art"><note-wc id="sm-note"></note-wc></selection-menu>
    <main>
      <article id="art" data-highlights="mn-note-sm">
        <p id="p1">The quick brown fox jumps over the lazy dog and the cat watches the fox.</p>
      </article>
    </main>
    <note-wc id="page-note" for="art"></note-wc>`);
  // Existing short highlight "the" at 31..34 ("over the lazy")
  await highlight(page, 31, 34);
  // Select "lazy dog and the cat" (35..55) — it contains the substring "the"
  // but not that highlight's range, so a new highlight must be created.
  await page.evaluate(() => {
    const t = document.getElementById('p1').firstChild;
    const r = document.createRange(); r.setStart(t, 35); r.setEnd(t, 55);
    const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
    document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
  });
  await page.waitForFunction(() => /** @type {any} */ (document.querySelector('selection-menu')).getSelection());
  await expect(page.locator('#sm-note > button')).toHaveAttribute('aria-label', 'Add private note');
  await page.locator('#sm-note > button').click();
  const quote = page.locator('.hn-note-quote');
  await expect(quote).toHaveText('lazy dog and the cat');
  const count = await page.evaluate(async () => {
    const { initHighlights } = await import('/src/utils/highlights-init.js');
    return initHighlights(document.getElementById('art')).getHighlights().length;
  });
  expect(count).toBe(2);
  // Focus does not drop to body (menu is dismissed, so it lands on the mark/article)
  await page.keyboard.press('Escape');
  const active = await page.evaluate(() => document.activeElement?.tagName);
  expect(active).not.toBe('BODY');
});

test('note-wc: data-label-* overrides the panel strings', async ({ page }) => {
  await loadNote(page, `
    <main>
      <note-wc id="page-note" for="art" data-label-view="Notizen" data-label-dialog="Notiz" data-label-save="Speichern" data-label-cancel="Abbrechen" data-label-textarea="Notiztext"></note-wc>
      <article id="art" data-highlights="mn-note-labels"><p id="p1">The quick brown fox jumps.</p></article>
    </main>`);
  await highlight(page, 4, 9);
  await expect(page.locator('#page-note > button')).toHaveAccessibleName('Notizen');
  await page.locator('#page-note > button').click();
  const dialog = page.getByRole('dialog', { name: 'Notiz' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Speichern' })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Abbrechen' })).toBeVisible();
  await expect(dialog.getByRole('textbox', { name: 'Notiztext' })).toBeVisible();
  const heading = await dialog.locator('.hn-note-header small').textContent();
  expect(heading).toBe('Private note'); // not an uppercase literal
});
