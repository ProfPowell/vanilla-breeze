/**
 * diagram-wc — review fixes (vanilla-breeze-c4mc security, -egb6 reconnect,
 * -8kf7 a11y, -8s1z CSS, -sg0z tests).
 *
 * Mermaid is never fetched: the pinned CDN module URL is routed to a local
 * fake module that returns a tiny SVG and records initialize() configs.
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';

const REPO = join(import.meta.dirname, '..', '..');
const MERMAID_URL = 'https://cdn.jsdelivr.net/npm/mermaid@11.14.0/dist/mermaid.esm.min.mjs';

/* Fake Mermaid. render() reads the config AFTER a delay so that a render
   whose initialize() was clobbered by a concurrent element shows it. */
const FAKE_MERMAID = `
let cfg = null;
window.__mermaid = { inits: [], renders: 0 };
export default {
  initialize(c) { cfg = c; window.__mermaid.inits.push(c); },
  async render(id, src) {
    await new Promise((r) => setTimeout(r, 30));
    if (/INVALID/.test(src)) throw new Error('Parse error on line 1:\\nINVALID\\n^');
    window.__mermaid.renders++;
    const t = /accTitle:\\s*(.+)/.exec(src);
    const d = /accDescr:\\s*(.+)/.exec(src);
    const title = t ? '<title id="chart-title-' + id + '">' + t[1].trim() + '</title>' : '';
    const desc = d ? '<desc id="chart-desc-' + id + '">' + d[1].trim() + '</desc>' : '';
    const lab = t ? ' aria-labelledby="chart-title-' + id + '"' : '';
    const des = d ? ' aria-describedby="chart-desc-' + id + '"' : '';
    const label = src.trim().split('\\n').pop().trim();
    return { svg: '<svg id="' + id + '" role="graphics-document document"' + lab + des
      + ' data-theme="' + cfg.theme + '" data-primary="' + cfg.themeVariables.primaryColor + '"'
      + ' viewBox="0 0 100 20" xmlns="http://www.w3.org/2000/svg">' + title + desc
      + '<text x="0" y="15">' + label + '</text></svg>' };
  },
};`;

async function load(page, body, { files = {} } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  await page.route(MERMAID_URL, (route) => route.fulfill({
    status: 200,
    contentType: 'text/javascript',
    headers: { 'access-control-allow-origin': '*' },
    body: FAKE_MERMAID,
  }));
  for (const [path, content] of Object.entries(files)) {
    await page.route(`**${path}`, (route) => route.fulfill({ status: 200, contentType: 'text/plain', body: content }));
  }
  const url = `/__diagram-wc-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <script type="module">import '/src/web-components/diagram-wc/logic.js';</script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => customElements.get('diagram-wc'));
}

const fence = (src, attrs = '') => `<diagram-wc id="d" ${attrs}><pre><code class="language-mermaid">${src}</code></pre></diagram-wc>`;

const BASIC = fence('flowchart LR\n  A --> B');

test('renders the SVG figure and removes the source <pre>', async ({ page }) => {
  await load(page, BASIC);
  await page.waitForSelector('#d > .dwc-figure svg');
  const r = await page.evaluate(() => {
    const d = /** @type {any} */ (document.getElementById('d'));
    return {
      pres: d.querySelectorAll(':scope > pre').length,
      figures: d.querySelectorAll(':scope > .dwc-figure').length,
      rendering: d.hasAttribute('data-rendering'),
      svg: d.svg.startsWith('<svg'),
      source: d.source,
    };
  });
  expect(r).toEqual({ pres: 0, figures: 1, rendering: false, svg: true, source: 'flowchart LR\n  A --> B' });
});

test('a11y: no role=img; name from accTitle, description includes accDescr + source', async ({ page }) => {
  await load(page, fence('flowchart LR\n  accTitle: Login flow\n  accDescr: Form to session\n  A --> B', 'caption="Cap"'));
  await page.waitForSelector('#d .dwc-figure svg');
  const r = await page.evaluate(() => {
    const fig = document.querySelector('#d .dwc-figure');
    const svg = fig.querySelector('svg');
    const ids = (svg.getAttribute('aria-describedby') || '').split(' ');
    return {
      figRole: fig.getAttribute('role'),
      svgRole: svg.getAttribute('role'),
      name: document.getElementById(svg.getAttribute('aria-labelledby'))?.textContent,
      desc: ids.map((id) => document.getElementById(id)?.textContent),
      details: fig.querySelector('details.dwc-source > summary')?.textContent,
      caption: fig.lastElementChild?.tagName,
    };
  });
  expect(r.figRole).toBeNull();
  expect(r.svgRole).toBe('graphics-document document');
  expect(r.name).toBe('Login flow');
  expect(r.desc[0]).toBe('Form to session');
  expect(r.desc[1]).toContain('accTitle: Login flow');
  expect(r.details).toBe('Diagram source');
  expect(r.caption).toBe('FIGCAPTION');
  const snap = await page.locator('#d svg').ariaSnapshot();
  expect(snap).toContain('Login flow');
});

test('a11y: caption names the SVG when there is no accTitle; no generic default', async ({ page }) => {
  await load(page, `${fence('flowchart LR\n  A --> B', 'caption="Checkout"')}
    <diagram-wc id="bare"><pre><code class="language-mermaid">flowchart LR\n  C --> D</code></pre></diagram-wc>`);
  await page.waitForSelector('#d svg');
  await page.waitForSelector('#bare svg');
  const r = await page.evaluate(() => {
    const svg = document.querySelector('#d svg');
    const bare = document.querySelector('#bare svg');
    return {
      name: document.getElementById(svg.getAttribute('aria-labelledby'))?.textContent,
      bareLabel: bare.getAttribute('aria-label'),
      bareLabelledby: bare.getAttribute('aria-labelledby'),
      bareFigLabel: document.querySelector('#bare .dwc-figure').getAttribute('aria-label'),
    };
  });
  expect(r).toEqual({ name: 'Checkout', bareLabel: null, bareLabelledby: null, bareFigLabel: null });
});

test('error with nothing rendered: <pre> source shown + error note + event', async ({ page }) => {
  await load(page, '');
  const r = await page.evaluate(async () => {
    const d = document.createElement('diagram-wc');
    d.innerHTML = '<pre><code class="language-mermaid">INVALID diagram</code></pre>';
    const ev = new Promise((res) => d.addEventListener('diagram-wc:error', (e) => res(/** @type {CustomEvent} */ (e).detail), { once: true }));
    document.querySelector('main').append(d);
    const detail = /** @type {any} */ (await ev);
    const pre = d.querySelector(':scope > pre');
    return {
      error: d.hasAttribute('data-error'),
      preVisible: pre ? getComputedStyle(pre).display !== 'none' : false,
      note: d.querySelector('.dwc-error')?.textContent,
      noteRole: d.querySelector('.dwc-error')?.getAttribute('role'),
      figure: !!d.querySelector('.dwc-figure'),
      detailSource: detail.source,
    };
  });
  expect(r.error).toBe(true);
  expect(r.preVisible).toBe(true);
  expect(r.note).toBe('Diagram syntax error: Parse error on line 1:');
  expect(r.noteRole).toBe('status');
  expect(r.figure).toBe(false);
  expect(r.detailSource).toBe('INVALID diagram');
});

test('source setter keeps the prior figure on error and swaps it on success', async ({ page }) => {
  await load(page, BASIC);
  await page.waitForSelector('#d svg');
  const r = await page.evaluate(async () => {
    const d = /** @type {any} */ (document.getElementById('d'));
    const first = d.querySelector('.dwc-figure');
    const err = new Promise((res) => d.addEventListener('diagram-wc:error', res, { once: true }));
    d.source = 'INVALID';
    const immediatelyAfterSet = d.querySelector('.dwc-figure') === first;
    await err;
    const afterError = {
      same: d.querySelector('.dwc-figure') === first,
      note: !!d.querySelector('.dwc-error'),
      dataError: d.hasAttribute('data-error'),
      pre: !!d.querySelector(':scope > pre'),
    };
    const ok = new Promise((res) => d.addEventListener('diagram-wc:ready', res, { once: true }));
    d.source = 'flowchart LR\n  X --> Y';
    await ok;
    return {
      immediatelyAfterSet,
      afterError,
      figures: d.querySelectorAll(':scope > .dwc-figure').length,
      replaced: d.querySelector('.dwc-figure') !== first,
      noteCleared: !d.querySelector('.dwc-error'),
      text: d.querySelector('svg text').textContent,
    };
  });
  expect(r.immediatelyAfterSet).toBe(true);
  expect(r.afterError).toEqual({ same: true, note: true, dataError: false, pre: false });
  expect(r).toMatchObject({ figures: 1, replaced: true, noteCleared: true, text: 'X --> Y' });
});

test('JS-set source on a never-rendered element falls back to a <pre> of that source on error', async ({ page }) => {
  await load(page, '');
  const r = await page.evaluate(async () => {
    const d = /** @type {any} */ (document.createElement('diagram-wc'));
    d.source = 'INVALID from js';
    const ev = new Promise((res) => d.addEventListener('diagram-wc:error', res, { once: true }));
    document.querySelector('main').append(d);
    await ev;
    return d.querySelector(':scope > pre code')?.textContent;
  });
  expect(r).toBe('INVALID from js');
});

test('reconnect: one figure, JS-set source kept, no re-render, src not refetched', async ({ page }) => {
  let fetches = 0;
  await load(page, `<diagram-wc id="s" src="/__dwc-test.mmd"></diagram-wc>${BASIC}`);
  await page.route('**/__dwc-test.mmd', (route) => { fetches++; route.fulfill({ status: 200, contentType: 'text/plain', body: 'flowchart LR\n  From --> File' }); });
  // The page already requested the .mmd before the counting route existed;
  // reload so every request is counted.
  await page.reload({ waitUntil: 'load' });
  await page.waitForSelector('#s svg');
  await page.waitForSelector('#d svg');
  const before = fetches;
  const r = await page.evaluate(async () => {
    const d = /** @type {any} */ (document.getElementById('d'));
    const s = document.getElementById('s');
    const main = document.querySelector('main');
    const ok = new Promise((res) => d.addEventListener('diagram-wc:ready', res, { once: true }));
    d.source = 'flowchart LR\n  Js --> Set';
    await ok;
    const renders = /** @type {any} */ (window).__mermaid.renders;
    for (let i = 0; i < 3; i++) { d.remove(); main.append(d); s.remove(); main.prepend(s); }
    await new Promise((res) => setTimeout(res, 200));
    return {
      figures: d.querySelectorAll(':scope > .dwc-figure').length,
      pres: d.querySelectorAll(':scope > pre').length,
      source: d.source,
      text: d.querySelector('svg text').textContent,
      sFigures: s.querySelectorAll(':scope > .dwc-figure').length,
      extraRenders: /** @type {any} */ (window).__mermaid.renders - renders,
      upgraded: d.hasAttribute('data-upgraded'),
    };
  });
  expect(r).toEqual({
    figures: 1, pres: 0, source: 'flowchart LR\n  Js --> Set', text: 'Js --> Set',
    sFigures: 1, extraRenders: 0, upgraded: true,
  });
  expect(fetches).toBe(before);
});

test('src takes priority over inline source', async ({ page }) => {
  await load(page, fence('flowchart LR\n  Inline --> Src', 'src="/__dwc-prio.mmd"'), {
    files: { '/__dwc-prio.mmd': 'flowchart LR\n  From --> File' },
  });
  await page.waitForSelector('#d svg');
  await expect(page.locator('#d svg text')).toHaveText('From --> File');
});

test('theme change re-renders with fresh tokens', async ({ page }) => {
  await load(page, BASIC);
  await page.waitForSelector('#d svg');
  const r = await page.evaluate(async () => {
    const d = document.getElementById('d');
    const before = d.querySelector('svg').dataset.primary;
    d.style.setProperty('--color-primary', 'rgb(255, 0, 0)');
    const ok = new Promise((res) => d.addEventListener('diagram-wc:ready', res, { once: true }));
    window.dispatchEvent(new CustomEvent('vb:theme-change'));
    await ok;
    return { before, after: d.querySelector('svg').dataset.primary, figures: d.querySelectorAll('.dwc-figure').length };
  });
  expect(r.after).toBe('rgb(255,0,0)');
  expect(r.before).not.toBe(r.after);
  expect(r.figures).toBe(1);
});

test('concurrent renders with different base themes do not cross configs', async ({ page }) => {
  await load(page, `
    <diagram-wc id="a" data-theme-base="dark"><pre><code class="language-mermaid">flowchart LR\n  A1 --> A2</code></pre></diagram-wc>
    <diagram-wc id="b" data-theme-base="forest"><pre><code class="language-mermaid">flowchart LR\n  B1 --> B2</code></pre></diagram-wc>
    <diagram-wc id="c"><pre><code class="language-mermaid">flowchart LR\n  C1 --> C2</code></pre></diagram-wc>`);
  await page.waitForSelector('#a svg');
  await page.waitForSelector('#b svg');
  await page.waitForSelector('#c svg');
  const themes = await page.evaluate(() => ['a', 'b', 'c'].map((id) => document.querySelector(`#${id} svg`).dataset.theme));
  expect(themes).toEqual(['dark', 'forest', 'base']);
});

test('security: data-mermaid-src is ignored; only window.VB_MERMAID_URL picks the module', async ({ page }) => {
  let evilRequested = false;
  await page.route('**/__evil.mjs', (route) => {
    evilRequested = true;
    route.fulfill({ status: 200, contentType: 'text/javascript', body: 'window.__evil = true; export default {};' });
  });
  await load(page, fence('flowchart LR\n  A --> B', 'data-mermaid-src="/__evil.mjs"'));
  await page.waitForSelector('#d svg');
  expect(evilRequested).toBe(false);
  expect(await page.evaluate(() => /** @type {any} */ (window).__evil)).toBeUndefined();
});

test('page-script window.VB_MERMAID_URL overrides the default module URL', async ({ page }) => {
  let requested = false;
  await page.route('**/__self-hosted-mermaid.mjs', (route) => {
    requested = true;
    route.fulfill({ status: 200, contentType: 'text/javascript', body: FAKE_MERMAID });
  });
  await page.addInitScript(() => { /** @type {any} */ (window).VB_MERMAID_URL = '/__self-hosted-mermaid.mjs'; });
  await load(page, BASIC);
  await page.waitForSelector('#d svg');
  expect(requested).toBe(true);
});

test('primed figure (markdown bridge cache) is decorated without role=img', async ({ page }) => {
  await load(page, '<section id="host"><pre><code class="language-mermaid">flowchart LR\n  P --> Q</code></pre></section>');
  const r = await page.evaluate(async () => {
    const { enhanceMermaidFences } = await import('/src/web-components/diagram-wc/logic.js');
    const [dw] = enhanceMermaidFences(document.getElementById('host'), {
      primingSvgs: ['<svg role="graphics-document document"><text>cached</text></svg>'],
    });
    const fig = dw.querySelector('.dwc-figure');
    return {
      role: fig.getAttribute('role'),
      describedby: !!document.getElementById(fig.querySelector('svg').getAttribute('aria-describedby')),
      details: !!fig.querySelector('details.dwc-source'),
    };
  });
  expect(r).toEqual({ role: null, describedby: true, details: true });
});

test('no-JS: the <pre> source is the readable fallback', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  await page.route('**/__dwc-nojs.html', (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8"><link rel="stylesheet" href="/src/main.css"></head>
      <body><main>${BASIC}</main></body></html>`,
  }));
  await page.goto('/__dwc-nojs.html', { waitUntil: 'load' });
  await expect(page.locator('#d > pre')).toBeVisible();
  await expect(page.locator('#d > pre')).toContainText('A --> B');
  await ctx.close();
});

test('CSS: crossfade timing is scoped to diagram transitions', async ({ page }) => {
  const css = readFileSync(join(REPO, 'src/web-components/diagram-wc/styles.css'), 'utf8');
  expect(css).not.toMatch(/::view-transition-(old|new)\(\*\)/);
  expect(css).toMatch(/::view-transition-old\(\*\.dwc\)/);
  expect(css).not.toMatch(/#ef4444/);
  await load(page, BASIC);
  const cls = await page.evaluate(() => getComputedStyle(document.getElementById('d')).getPropertyValue('view-transition-class'));
  expect(cls).toBe('dwc');
});
