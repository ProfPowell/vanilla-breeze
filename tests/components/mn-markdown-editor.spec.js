/**
 * markdown-editor — M+N review fixes.
 *
 * Covers: the authored <textarea> is adopted (attributes, <label for>,
 * accessible name) instead of replaced; native form participation (name,
 * required, reset resyncs the preview, no-JS submit); reconnect keeps the
 * same nodes; one change event per assignment with source/composed; preview
 * is not a live region and follows direction; data-label-* overrides;
 * data-tab-indent escape (Escape then Tab); layout stacks on the editor's
 * own width; the preview stays sanitised.
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
  const url = `/__md-editor-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en" dir="${dir}"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <script type="module">import '/src/web-components/markdown-editor/logic.js';</script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => customElements.get('markdown-editor'));
  await page.waitForSelector('markdown-editor[data-upgraded]', { state: 'attached' });
}

const FORM = `
  <form id="f">
    <label for="body">Message</label>
    <markdown-editor id="ed">
      <textarea id="body" name="body" required minlength="3" maxlength="50"
        aria-describedby="help" placeholder="Say it">Hello **world**</textarea>
    </markdown-editor>
    <p id="help">Markdown is fine.</p>
    <button type="reset">Reset</button>
  </form>`;

/** @param {import('playwright/test').Page} page */
const previewText = (page, sel = '#ed') => page.evaluate(
  (s) => document.querySelector(s)?.querySelector('.md-preview-pane .md-content')?.textContent?.trim() ?? '',
  sel,
);

test('adopts the authored textarea with its attributes and label', async ({ page }) => {
  await load(page, FORM);
  const original = await page.evaluate(() => {
    const ed = /** @type {any} */ (document.getElementById('ed'));
    const ta = ed.textarea;
    return {
      same: ta === document.getElementById('body'),
      inPane: ta.parentElement.classList.contains('md-editor-pane'),
      attrs: ['id', 'name', 'required', 'minlength', 'maxlength', 'aria-describedby', 'placeholder']
        .map((a) => [a, ta.getAttribute(a)]),
      labels: ta.labels.length,
      ariaLabel: ta.getAttribute('aria-label'),
      textareas: ed.querySelectorAll('textarea').length,
    };
  });
  expect(original.same).toBe(true);
  expect(original.inPane).toBe(true);
  expect(original.textareas).toBe(1);
  expect(Object.fromEntries(original.attrs)).toEqual({
    id: 'body', name: 'body', required: '', minlength: '3', maxlength: '50',
    'aria-describedby': 'help', placeholder: 'Say it',
  });
  expect(original.labels).toBe(1);
  // Named by its <label>, so no fallback aria-label is added.
  expect(original.ariaLabel).toBeNull();
  await expect(page.getByRole('textbox', { name: 'Message' })).toBeVisible();
});

test('creates a named textarea only when none is authored', async ({ page }) => {
  await load(page, '<markdown-editor id="ed" data-label-source="Quelle"></markdown-editor>');
  const r = await page.evaluate(() => {
    const ed = /** @type {any} */ (document.getElementById('ed'));
    return {
      count: ed.querySelectorAll('textarea').length,
      label: ed.textarea.getAttribute('aria-label'),
      placeholder: ed.textarea.getAttribute('placeholder'),
      rows: ed.textarea.rows,
    };
  });
  expect(r).toEqual({ count: 1, label: 'Quelle', placeholder: null, rows: 10 });
});

test('reconnect keeps the same textarea, viewer and value', async ({ page }) => {
  await load(page, FORM);
  const r = await page.evaluate(() => {
    const ed = /** @type {any} */ (document.getElementById('ed'));
    const form = document.getElementById('f');
    const ta = ed.textarea;
    const viewer = ed.querySelector('markdown-viewer');
    ta.value = 'typed *text*';
    for (let i = 0; i < 3; i++) { ed.remove(); form.append(ed); }
    return {
      sameTa: ed.textarea === ta,
      sameViewer: ed.querySelector('markdown-viewer') === viewer,
      editorPanes: ed.querySelectorAll('.md-editor-pane').length,
      previewPanes: ed.querySelectorAll('.md-preview-pane').length,
      value: ed.value,
      upgraded: ed.hasAttribute('data-upgraded'),
    };
  });
  expect(r).toEqual({
    sameTa: true, sameViewer: true, editorPanes: 1, previewPanes: 1, value: 'typed *text*', upgraded: true,
  });
  await expect.poll(() => previewText(page)).toBe('typed text');
});

test('native form participation: one named value, required, reset resyncs the preview', async ({ page }) => {
  await load(page, FORM);
  await expect.poll(() => previewText(page)).toBe('Hello world');
  const r = await page.evaluate(() => {
    const ed = /** @type {any} */ (document.getElementById('ed'));
    const form = /** @type {HTMLFormElement} */ (document.getElementById('f'));
    const entries = [...new FormData(form).entries()];
    ed.value = '';
    const emptyValid = form.checkValidity();
    ed.value = 'Changed *again*';
    form.reset();
    return { entries, emptyValid, afterReset: ed.value };
  });
  expect(r.entries).toEqual([['body', 'Hello **world**']]);
  expect(r.emptyValid).toBe(false);
  expect(r.afterReset).toBe('Hello **world**');
  await expect.poll(() => previewText(page)).toBe('Hello world');
});

test('value setter fires one composed change (source api); blur does not repeat it', async ({ page }) => {
  await load(page, FORM);
  const r = await page.evaluate(async () => {
    const ed = /** @type {any} */ (document.getElementById('ed'));
    /** @type {any[]} */
    const events = [];
    document.addEventListener('markdown-editor:change', (e) => {
      const ce = /** @type {CustomEvent} */ (e);
      events.push({ ...ce.detail, composed: ce.composed });
    });
    ed.value = 'From the API';
    ed.textarea.focus();
    ed.textarea.blur();
    ed.value = 'From the API'; // idempotent
    return events;
  });
  expect(r).toEqual([{ value: 'From the API', source: 'api', composed: true }]);
  await expect.poll(() => previewText(page)).toBe('From the API');
});

test('typing fires input and a user change on blur', async ({ page }) => {
  await load(page, FORM);
  await page.evaluate(() => {
    /** @type {any} */ (window).__ev = [];
    for (const t of ['markdown-editor:input', 'markdown-editor:change']) {
      document.addEventListener(t, (e) => /** @type {any} */ (window).__ev.push([t, /** @type {CustomEvent} */ (e).detail.source ?? null]));
    }
  });
  await page.locator('#body').click();
  await page.keyboard.press('End');
  await page.keyboard.type('!');
  await page.locator('#help').click();
  const ev = await page.evaluate(() => /** @type {any} */ (window).__ev);
  expect(ev).toEqual([['markdown-editor:input', null], ['markdown-editor:change', 'user']]);
  await expect.poll(() => previewText(page)).toBe('Hello world!');
});

test('preview is not a live region; labels and direction', async ({ page }) => {
  await load(page, `
    <markdown-editor id="ed" data-label-source="Source" data-label-preview="Aperçu">
      <textarea aria-label="Article">שלום **עולם**</textarea>
    </markdown-editor>
    <markdown-editor id="ltr"><textarea aria-label="x" dir="rtl">abc</textarea></markdown-editor>`);
  await expect.poll(() => page.evaluate(() => !!document.querySelector('#ed .md-content')?.textContent?.trim())).toBe(true);
  await expect.poll(() => page.evaluate(() => !!document.querySelector('#ltr .md-content')?.textContent?.trim())).toBe(true);
  const r = await page.evaluate(() => {
    const ed = /** @type {any} */ (document.getElementById('ed'));
    const pane = ed.querySelector('.md-preview-pane');
    const dirOf = (/** @type {string} */ sel) => {
      const el = document.querySelector(sel);
      return el ? getComputedStyle(el).direction : null;
    };
    return {
      live: ed.querySelectorAll('[aria-live]').length,
      sourceLabel: ed.querySelector('.md-editor-pane').getAttribute('aria-label'),
      previewLabel: pane.getAttribute('aria-label'),
      taDir: ed.textarea.dir,
      autoPreview: dirOf('#ed .md-content'),
      authoredPreview: dirOf('#ltr .md-content'),
    };
  });
  expect(r).toEqual({
    live: 0, sourceLabel: 'Source', previewLabel: 'Aperçu', taDir: 'auto',
    autoPreview: 'rtl', authoredPreview: 'rtl',
  });
  await page.evaluate(() => document.getElementById('ed')?.setAttribute('data-label-preview', 'Vorschau'));
  await expect(page.locator('#ed .md-preview-pane')).toHaveAttribute('aria-label', 'Vorschau');
});

test('data-tab-indent: Tab indents, Escape then Tab leaves, hint describes it', async ({ page }) => {
  await load(page, `
    <markdown-editor id="ed" data-tab-indent><textarea aria-label="Code"></textarea></markdown-editor>
    <button id="after">After</button>`);
  const ta = page.locator('#ed textarea');
  await ta.click();
  await page.keyboard.press('Tab');
  await expect(ta).toBeFocused();
  await expect(ta).toHaveValue('  ');
  await page.keyboard.press('Escape');
  await page.keyboard.press('Tab');
  await expect(page.locator('#after')).toBeFocused();
  // The release is one-shot: back in the textarea, Tab indents again.
  await ta.focus();
  await page.keyboard.press('Tab');
  await expect(ta).toBeFocused();
  await expect(ta).toHaveValue('    ');
  const description = await page.evaluate(() => {
    const t = /** @type {HTMLTextAreaElement} */ (document.querySelector('#ed textarea'));
    return (t.getAttribute('aria-describedby') ?? '').split(' ')
      .map((id) => document.getElementById(id)?.textContent).join(' ');
  });
  expect(description).toContain('Escape');
});

test('panes stack when the editor is narrow inside a wide page', async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 900 });
  await load(page, `
    <section id="narrow"><markdown-editor id="ed"><textarea aria-label="n">x</textarea></markdown-editor></section>
    <markdown-editor id="wide"><textarea aria-label="w">x</textarea></markdown-editor>`);
  await page.addStyleTag({ content: '#narrow { inline-size: 400px; }' });
  const r = await page.evaluate(() => {
    const tops = (/** @type {string} */ id) => [...document.querySelectorAll(`#${id} > section`)]
      .map((s) => Math.round(s.getBoundingClientRect().top));
    return { narrow: tops('ed'), wide: tops('wide') };
  });
  expect(r.narrow[0]).toBeLessThan(r.narrow[1]);
  expect(r.wide[0]).toBe(r.wide[1]);
});

test('preview strips script handlers from typed markdown', async ({ page }) => {
  await load(page, '<markdown-editor id="ed"><textarea aria-label="x"></textarea></markdown-editor>');
  await page.evaluate(() => {
    /** @type {any} */ (window).__x = 0;
    /** @type {any} */ (document.getElementById('ed')).value =
      'hi <img src=x onerror="window.__x++"> <a href="javascript:window.__x++">l</a>';
  });
  await expect.poll(() => previewText(page)).toContain('hi');
  await page.waitForTimeout(100);
  const r = await page.evaluate(() => ({
    x: /** @type {any} */ (window).__x,
    handler: document.querySelector('#ed .md-content img')?.hasAttribute('onerror') ?? false,
  }));
  expect(r).toEqual({ x: 0, handler: false });
});

test('preview resists the MathML mglyph/style mutation-XSS payload', async ({ page }) => {
  await load(page, '<markdown-editor id="ed"><textarea aria-label="x"></textarea></markdown-editor>');
  await page.evaluate(() => {
    /** @type {any} */ (window).__y = 0;
    /** @type {any} */ (document.getElementById('ed')).value =
      'x <math><mtext><table><mglyph><style><img src=x onerror="window.__y++">';
  });
  await expect.poll(() => page.evaluate(() => !!document.querySelector('#ed markdown-viewer[data-rendered]'))).toBe(true);
  await page.waitForTimeout(150);
  const r = await page.evaluate(() => ({
    y: /** @type {any} */ (window).__y,
    imgs: document.querySelectorAll('#ed .md-content img[onerror]').length,
  }));
  expect(r).toEqual({ y: 0, imgs: 0 });
});

test('without JavaScript the textarea submits its name', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL: test.info().project.use.baseURL });
  const page = await context.newPage();
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  await page.route('**/__md-nojs.html', (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css"></head><body>
      <form method="get" action="/__md-nojs-submit">
        <label for="b">Body</label>
        <markdown-editor><textarea id="b" name="body"># Hi</textarea></markdown-editor>
        <button>Send</button>
      </form></body></html>`,
  }));
  /** @type {string | null} */
  let submitted = null;
  await page.route('**/__md-nojs-submit**', (route) => {
    submitted = new URL(route.request().url()).searchParams.get('body');
    return route.fulfill({ status: 200, contentType: 'text/html', body: '<p>ok</p>' });
  });
  await page.goto('/__md-nojs.html');
  await page.getByRole('button', { name: 'Send' }).click();
  await expect.poll(() => submitted).toBe('# Hi');
  await context.close();
});
