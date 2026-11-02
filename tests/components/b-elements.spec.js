/**
 * B-element review fixes (vanilla-breeze-7d4m): bidi defaults, blockquote
 * attribution scoping, data-loading submitter handling.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

async function load(page, body, { script = '' } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__b-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">${script}
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
}

test.describe('bidi', () => {
  test('<bdo dir="rtl"> reverses its text', async ({ page }) => {
    await load(page, '<p><bdo id="b" dir="rtl">ABCDEF</bdo></p>');
    const xs = await page.locator('#b').evaluate((el) => {
      const t = el.firstChild; const r = document.createRange(); const out = [];
      for (let i = 0; i < 6; i++) { r.setStart(t, i); r.setEnd(t, i + 1); out.push(r.getBoundingClientRect().x); }
      return out;
    });
    // Reversed: each later character sits further left
    for (let i = 1; i < xs.length; i++) expect(xs[i]).toBeLessThan(xs[i - 1]);
  });

  test('UA bidi defaults are left in place', async ({ page }) => {
    await load(page, '<p><bdo id="o" dir="rtl">x</bdo> <bdi id="i">y</bdi> <span id="r" dir="rtl">z</span></p>');
    const ub = (sel) => page.locator(sel).evaluate((el) => getComputedStyle(el).unicodeBidi);
    expect(await ub('#o')).toBe('isolate-override');
    expect(await ub('#i')).toBe('isolate');
    expect(await ub('#r')).toBe('isolate');
  });
});

test.describe('blockquote attribution', () => {
  test('<cite> inside the footer stays inline, one dash', async ({ page }) => {
    await load(page, `<blockquote><p>Quote <cite id="inline">Walden</cite> text.</p>
      <footer id="f">Arthur C. Clarke, <cite id="c">Profiles of the Future</cite></footer></blockquote>`);
    const s = (sel, prop, pseudo) => page.locator(sel).evaluate((el, a) => getComputedStyle(el, a[1] || null)[a[0]], [prop, pseudo]);
    expect(await s('#c', 'display')).toBe('inline');
    expect(await s('#c', 'content', '::before')).toBe('none');
    expect(await s('#inline', 'display')).toBe('inline');
    expect(await s('#f', 'display')).toBe('block');
    expect(await s('#f', 'content', '::before')).toMatch(/"— "\s*\/\s*""/);
  });
});

test.describe('data-loading buttons', () => {
  const SCRIPT = `<script type="module">import '/src/utils/loading-button-init.js';</script>`;

  test('the submitter keeps its name/value in the form data', async ({ page }) => {
    await load(page, `<form id="f"><input name="q" value="1">
      <button id="save" name="action" value="save" data-loading="Saving">Save</button>
      <button id="del" name="action" value="delete" data-loading="Deleting">Delete</button></form>`, { script: SCRIPT });
    await page.waitForTimeout(100);
    await page.evaluate(() => {
      document.getElementById('f').addEventListener('submit', (e) => e.preventDefault());
      document.getElementById('del').click();
    });
    const after = await page.evaluate(() => {
      const f = document.getElementById('f');
      const del = document.getElementById('del');
      return {
        entries: [...new FormData(f, del).entries()],
        delDisabled: del.disabled,
        delBusy: del.getAttribute('aria-busy'),
        saveBusy: document.getElementById('save').getAttribute('aria-busy'),
      };
    });
    expect(after.delDisabled).toBe(false);
    expect(after.delBusy).toBe('true');
    expect(after.saveBusy).toBeNull();
    expect(after.entries).toContainEqual(['action', 'delete']);
  });

  test('a real submission carries the submitter', async ({ page }) => {
    let posted = '';
    await page.route('**/__submit', (route) => { posted = route.request().postData() || ''; route.fulfill({ status: 200, body: 'ok' }); });
    await load(page, `<form method="post" action="/__submit"><input name="q" value="1">
      <button id="save" name="action" value="save" data-loading="Saving">Save</button>
      <button id="del" name="action" value="delete" data-loading="">Delete</button></form>`, { script: SCRIPT });
    await page.waitForTimeout(100);
    await Promise.all([page.waitForURL('**/__submit'), page.click('#del')]);
    expect(posted).toContain('action=delete');
  });

  test('spinner-only keeps an accessible name and blocks repeat clicks', async ({ page }) => {
    await load(page, `<form id="f"><button id="go" data-loading="">Send report</button></form>`, { script: SCRIPT });
    await page.waitForTimeout(100);
    const r = await page.evaluate(() => {
      const f = document.getElementById('f'); let submits = 0;
      f.addEventListener('submit', (e) => { e.preventDefault(); submits++; });
      const b = document.getElementById('go');
      b.click(); b.click();
      return { submits, text: b.textContent.trim(), ariaDisabled: b.getAttribute('aria-disabled'), focusable: !b.disabled };
    });
    expect(r.submits).toBe(1);
    expect(r.text).toBe('Send report');
    expect(r.ariaDisabled).toBe('true');
    expect(r.focusable).toBe(true);
  });
});
