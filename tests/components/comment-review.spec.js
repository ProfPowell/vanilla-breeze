/**
 * comment-box / comment-thread / comment-wc — review fixes
 * (vanilla-breeze-1fvo security, -5ac4 reconnect, -i89g a11y).
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

async function load(page, body, modules) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__comment-${Math.random().toString(36).slice(2)}.html`;
  const imports = modules.map((m) => `import '/src/web-components/${m}/logic.js';`).join('\n');
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <script type="module">${imports}</script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  for (const m of modules) await page.waitForFunction((n) => customElements.get(n), m);
}

const editorReady = (page, sel = 'comment-box') =>
  page.waitForSelector(`${sel} markdown-editor[data-upgraded] textarea`, { state: 'attached' });

// ── comment-box ──────────────────────────────────────────────────────

test.describe('comment-box', () => {
  test('waitUntil: busy while pending, clears on resolve, keeps text on reject', async ({ page }) => {
    await load(page, '<comment-box id="b"></comment-box>', ['comment-box']);
    await editorReady(page);
    const r = await page.evaluate(async () => {
      const box = document.getElementById('b');
      const out = {};
      let settle;
      box.addEventListener('comment-box:submit', (e) => {
        e.detail.waitUntil(new Promise((res, rej) => { settle = { res, rej }; }));
      });
      box.value = 'first try';
      box.querySelector('.comment-box-submit').click();
      out.busy = box.busy && box.getAttribute('aria-busy') === 'true'
        && box.querySelector('.comment-box-submit').getAttribute('aria-disabled') === 'true';
      out.keptWhileBusy = box.value;
      settle.rej(new Error('500'));
      await new Promise((r) => setTimeout(r, 0));
      out.afterReject = { value: box.value, busy: box.busy };
      box.querySelector('.comment-box-submit').click();
      settle.res();
      await new Promise((r) => setTimeout(r, 0));
      out.afterResolve = { value: box.value, busy: box.hasAttribute('aria-busy') };
      return out;
    });
    expect(r).toEqual({
      busy: true,
      keptWhileBusy: 'first try',
      afterReject: { value: 'first try', busy: false },
      afterResolve: { value: '', busy: false },
    });
  });

  test('waitUntil after an await throws; sync preventDefault keeps the value', async ({ page }) => {
    await load(page, '<comment-box id="b"></comment-box>', ['comment-box']);
    await editorReady(page);
    const r = await page.evaluate(async () => {
      const box = document.getElementById('b');
      let late;
      const h = async (e) => { e.preventDefault(); await null; try { e.detail.waitUntil(Promise.resolve()); late = 'no throw'; } catch (err) { late = err.name; } };
      box.addEventListener('comment-box:submit', h);
      box.value = 'keep me';
      box.querySelector('.comment-box-submit').click();
      await new Promise((r) => setTimeout(r, 0));
      return { late, value: box.value };
    });
    expect(r).toEqual({ late: 'InvalidStateError', value: 'keep me' });
  });

  test('toolbar children and input wiring survive a reconnect', async ({ page }) => {
    await load(page, `<comment-box id="b" data-max-length="50">
      <button slot="toolbar" type="button">Attach</button><button slot="toolbar" type="button">Mention</button>
    </comment-box>`, ['comment-box']);
    await editorReady(page);
    await page.evaluate(() => {
      const box = document.getElementById('b');
      const main = document.querySelector('main');
      box.remove();
      main.append(box);
    });
    await page.waitForSelector('#b[data-upgraded] markdown-editor[data-upgraded] textarea', { state: 'attached' });
    const tools = await page.locator('#b .comment-box-toolbar button').allTextContents();
    expect(tools).toEqual(['Attach', 'Mention']);
    await page.locator('#b textarea').fill('hello');
    await expect(page.locator('#b .comment-box-counter')).toHaveText('5 / 50');
  });

  test('placeholder reaches the textarea; name stays on the host', async ({ page }) => {
    await load(page, '<form><comment-box name="body" placeholder="Say something"></comment-box></form>', ['comment-box']);
    await editorReady(page);
    const ta = page.locator('comment-box textarea');
    await expect(ta).toHaveAttribute('placeholder', 'Say something');
    await ta.fill('x');
    const entries = await page.evaluate(() => [...new FormData(document.querySelector('form')).entries()]);
    expect(entries).toEqual([['body', 'x']]);
  });

  test('textarea gets an accessible name (default, label attr, associated <label>)', async ({ page }) => {
    await load(page, `<comment-box id="a"></comment-box>
      <comment-box id="b" label="Reply to Ada"></comment-box>
      <label for="c">Comment body</label><comment-box id="c"></comment-box>`, ['comment-box']);
    await page.waitForFunction(() => document.querySelectorAll('markdown-editor[data-upgraded]').length === 3);
    await expect(page.locator('#a textarea')).toHaveAccessibleName('Comment');
    await expect(page.locator('#b textarea')).toHaveAccessibleName('Reply to Ada');
    await expect(page.locator('#c textarea')).toHaveAccessibleName('Comment body');
  });

  test('blocked submit reports validity instead of failing silently', async ({ page }) => {
    await load(page, '<comment-box id="b" required></comment-box>', ['comment-box']);
    await editorReady(page);
    const r = await page.evaluate(() => {
      const box = document.getElementById('b');
      let invalid = 0; let submitted = 0;
      box.addEventListener('invalid', () => invalid++);
      box.addEventListener('comment-box:submit', () => submitted++);
      box.querySelector('.comment-box-submit').click();
      return { invalid, submitted, focused: document.activeElement === box.querySelector('textarea') };
    });
    expect(r).toEqual({ invalid: 1, submitted: 0, focused: true });
  });

  test('counter speaks only near the limit; tool row is a group only with children', async ({ page }) => {
    await load(page, `<comment-box id="b" data-max-length="100"><button slot="toolbar" type="button">T</button></comment-box>
      <comment-box id="e"></comment-box>`, ['comment-box']);
    await page.waitForFunction(() => document.querySelectorAll('markdown-editor[data-upgraded]').length === 2);
    await expect(page.locator('#b .comment-box-counter')).toHaveAttribute('aria-hidden', 'true');
    const status = page.locator('#b [role="status"]');
    await page.locator('#b textarea').fill('a'.repeat(50));
    await expect(status).toHaveText('');
    await page.locator('#b textarea').fill('a'.repeat(95));
    await expect(status).toHaveText('5 characters remaining');
    await page.locator('#b textarea').fill('a'.repeat(103));
    await expect(status).toHaveText('3 characters over the limit');
    await expect(page.locator('#b .comment-box-toolbar')).toHaveAttribute('role', 'group');
    await expect(page.locator('#e .comment-box-toolbar')).not.toHaveAttribute('role', /./);
    expect(await page.locator('comment-box [role="toolbar"]').count()).toBe(0);
  });

  test('a disabled fieldset disables the editor and buttons', async ({ page }) => {
    await load(page, '<form><fieldset disabled><comment-box data-show-cancel></comment-box></fieldset></form>', ['comment-box']);
    await editorReady(page);
    await expect(page.locator('comment-box textarea')).toBeDisabled();
    await expect(page.locator('comment-box .comment-box-submit')).toBeDisabled();
    await page.evaluate(() => { document.querySelector('fieldset').disabled = false; });
    await expect(page.locator('comment-box textarea')).toBeEnabled();
  });
});

// ── comment-thread ───────────────────────────────────────────────────

const THREAD = `<comment-thread id="t">
  <article data-comment id="c1" data-author="Ada" data-time="2026-05-14T08:00:00Z" data-mine><section data-comment-body><p>One</p></section></article>
  <article data-comment id="c2" data-author="Bob" data-time="2026-05-14T09:00:00Z" data-parent="c1"><section data-comment-body><p>Two</p></section></article>
  <article data-comment id="c3" data-author="Cy" data-time="2026-05-14T10:00:00Z" data-parent="c2"><section data-comment-body><p>Three</p></section></article>
  <article data-comment id="c4" data-author="Dee" data-time="not a date" data-mine><section data-comment-body><p>Four</p></section></article>
  <template data-reply-form><comment-box submit-label="Reply"></comment-box></template>
</comment-thread>`;

test.describe('comment-thread', () => {
  test('Reply / Edit / Delete still work after the thread is moved', async ({ page }) => {
    await load(page, THREAD, ['comment-thread']);
    await page.waitForSelector('#t[data-upgraded]');
    const r = await page.evaluate(() => {
      const t = document.getElementById('t');
      const main = document.querySelector('main');
      t.remove();
      main.append(t);
      const seen = [];
      t.addEventListener('comment-thread:edit-request', (e) => seen.push(`edit:${e.detail.commentId}`));
      t.addEventListener('comment-thread:delete-request', (e) => seen.push(`delete:${e.detail.commentId}`));
      t.querySelector('#c1 .comment-edit').click();
      t.querySelector('#c1 .comment-delete').click();
      t.querySelector('#c1 .comment-reply').click();
      return { seen, form: !!t.querySelector('#c1 > .comment-reply-form comment-box') };
    });
    expect(r).toEqual({ seen: ['edit:c1', 'delete:c1'], form: true });
  });

  test('bodyText is inert, bodyHtml is sanitized, javascript: author href is not a link', async ({ page }) => {
    await load(page, '<comment-thread id="t"></comment-thread>', ['comment-thread']);
    await page.waitForSelector('#t[data-upgraded]', { state: 'attached' });
    const r = await page.evaluate(() => {
      window.__pwned = 0;
      const t = document.getElementById('t');
      const a = t.addComment({ id: 'x1', author: 'Eve', time: '2026-05-14T08:00:00Z', bodyText: '<img src=x onerror="window.__pwned++">', authorHref: 'javascript:window.__pwned++' });
      const b = t.addComment({ id: 'x2', author: 'Eve', time: '2026-05-14T08:00:00Z', bodyHtml: '<p>ok</p><img src="x" onerror="window.__pwned++"><script>window.__pwned++</script>' });
      t.updateComment('x2', { bodyHtml: '<a href="javascript:alert(1)">l</a>' });
      const c = t.addComment({ id: 'x3', author: 'Rel', time: '2026-05-14T08:00:00Z', bodyText: 'hi', authorHref: '/users/rel' });
      return {
        textBody: a.querySelector('[data-comment-body]').textContent,
        textImgs: a.querySelectorAll('img').length,
        evilLink: a.querySelector('.comment-author').localName,
        htmlHasHandler: /onerror|script/.test(b.querySelector('[data-comment-body]').innerHTML),
        updatedHref: b.querySelector('[data-comment-body] a').hasAttribute('href'),
        relLink: c.querySelector('a.comment-author')?.getAttribute('href'),
      };
    });
    await page.waitForTimeout(50);
    expect(r).toEqual({
      textBody: '<img src=x onerror="window.__pwned++">',
      textImgs: 0,
      evilLink: 'span',
      htmlHasHandler: false,
      updatedHref: false,
      relLink: '/users/rel',
    });
    expect(await page.evaluate(() => window.__pwned)).toBe(0);
  });

  test('a reply is inserted after the parent\'s last descendant', async ({ page }) => {
    await load(page, THREAD, ['comment-thread']);
    await page.waitForSelector('#t[data-upgraded]');
    const order = await page.evaluate(() => {
      const t = document.getElementById('t');
      t.addComment({ id: 'r1', author: 'You', time: new Date().toISOString(), bodyText: 'reply', parentId: 'c1' });
      t.addComment({ id: 'top', author: 'You', time: new Date().toISOString(), bodyText: 'top' });
      return [...t.querySelectorAll(':scope > article')].map((a) => a.id);
    });
    expect(order).toEqual(['c1', 'c2', 'c3', 'r1', 'c4', 'top']);
  });

  test('articles are named by author + time; no aria-level; relative time never NaN', async ({ page }) => {
    await load(page, THREAD, ['comment-thread']);
    await page.waitForSelector('#t[data-upgraded]');
    await expect(page.locator('#c2')).toHaveAccessibleName(/^Bob .+ago$/);
    expect(await page.locator('#t [aria-level]').count()).toBe(0);
    await expect(page.locator('#c4 .comment-time')).toHaveText('not a date');
    expect(await page.locator('#t').textContent()).not.toContain('NaN');
  });

  test('action names are distinct per comment; footer is a group', async ({ page }) => {
    await load(page, THREAD, ['comment-thread']);
    await page.waitForSelector('#t[data-upgraded]');
    const edits = await page.locator('#t .comment-edit').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')));
    expect(edits).toHaveLength(2);
    expect(edits[0]).toContain('2026');
    expect(new Set(edits).size).toBe(2);
    await expect(page.locator('#c1 > .comment-footer')).toHaveAttribute('role', 'group');
    expect(await page.locator('#t [role="toolbar"]').count()).toBe(0);
  });

  test('focus returns to the Reply button when the reply form closes', async ({ page }) => {
    await load(page, THREAD, ['comment-thread']);
    await page.waitForSelector('#t[data-upgraded]');
    await page.locator('#c2 .comment-reply').click();
    await page.waitForSelector('#c2 .comment-reply-form markdown-editor[data-upgraded] textarea', { state: 'attached' });
    await page.locator('#c2 .comment-box-cancel').click();
    await expect(page.locator('#c2 .comment-reply-form')).toHaveCount(0);
    await expect(page.locator('#c2 .comment-reply')).toBeFocused();
  });

  test('reply is cancelable and waitUntil keeps the text when the POST fails', async ({ page }) => {
    await load(page, THREAD, ['comment-thread']);
    await page.waitForSelector('#t[data-upgraded]');
    await page.locator('#c1 .comment-reply').click();
    await page.waitForSelector('#c1 .comment-reply-form markdown-editor[data-upgraded] textarea', { state: 'attached' });
    const r = await page.evaluate(async () => {
      const t = document.getElementById('t');
      const box = t.querySelector('#c1 .comment-reply-form comment-box');
      const out = {};
      let mode = 'prevent';
      t.addEventListener('comment-thread:reply', (e) => {
        if (mode === 'prevent') e.preventDefault();
        else if (mode === 'fail') e.detail.waitUntil(Promise.reject(new Error('500')));
        else e.detail.waitUntil(new Promise((r) => setTimeout(r, 10)));
      });
      box.value = 'my reply';
      box.querySelector('.comment-box-submit').click();
      out.prevented = { open: box.isConnected, value: box.value };
      mode = 'fail';
      box.querySelector('.comment-box-submit').click();
      await new Promise((r) => setTimeout(r, 20));
      out.failed = { open: box.isConnected, value: box.value };
      mode = 'ok';
      box.querySelector('.comment-box-submit').click();
      out.pending = box.isConnected;
      await new Promise((r) => setTimeout(r, 40));
      out.done = { open: box.isConnected, focus: document.activeElement === t.querySelector('#c1 .comment-reply') };
      return out;
    });
    expect(r).toEqual({
      prevented: { open: true, value: 'my reply' },
      failed: { open: true, value: 'my reply' },
      pending: true,
      done: { open: false, focus: true },
    });
  });
});

// ── comment-wc ───────────────────────────────────────────────────────

test.describe('comment-wc', () => {
  test('unavailable state: aria-disabled + described reason, no inline style or title', async ({ page }) => {
    await load(page, '<p id="art">Text</p><selection-menu for="art"><comment-wc></comment-wc></selection-menu>', ['selection-menu', 'comment-wc']);
    await page.waitForSelector('comment-wc[data-upgraded]', { state: 'attached' });
    const r = await page.evaluate(() => {
      const btn = document.querySelector('comment-wc > button');
      const desc = document.getElementById(btn.getAttribute('aria-describedby') || '');
      return {
        disabled: btn.getAttribute('aria-disabled'),
        style: btn.getAttribute('style'),
        title: btn.getAttribute('title'),
        desc: desc?.textContent,
        hidden: desc?.classList.contains('visually-hidden'),
      };
    });
    expect(r).toEqual({ disabled: 'true', style: null, title: null, desc: expect.stringContaining('unavailable'), hidden: true });
  });

  test('review-surface is resolved on click and `for` is escaped', async ({ page }) => {
    await load(page, '<p id=\'a"b\'>Text</p><selection-menu for=\'a"b\'><comment-wc></comment-wc></selection-menu>', ['selection-menu', 'comment-wc']);
    await page.waitForSelector('comment-wc[data-upgraded]', { state: 'attached' });
    const r = await page.evaluate(() => {
      const errors = [];
      window.addEventListener('error', (e) => errors.push(e.message));
      const surface = document.createElement('review-surface');
      surface.setAttribute('for', 'a"b');
      document.querySelector('main').append(surface);
      const btn = document.querySelector('comment-wc > button');
      btn.click();
      return { disabled: btn.getAttribute('aria-disabled'), errors };
    });
    expect(r).toEqual({ disabled: null, errors: [] });
  });
});
