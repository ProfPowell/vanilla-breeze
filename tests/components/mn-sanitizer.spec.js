/**
 * Sanitizer mXSS + markdown-viewer security review fixes (M+N review, S1).
 *
 * - The confirmed MathML mXSS and a corpus of known mutation-XSS payloads:
 *   no handler fires after REAL insertion, whether as nodes
 *   (sanitizeToFragment), through a serialise + re-parse round trip
 *   (innerHTML = sanitizeHTML(...)), through <markdown-viewer>, or through
 *   every in-repo consumer (comment-thread, chat-window, card-list,
 *   glossary-wc, include-file, data-markdown-editable, math-init).
 * - Untrusted profile: <style>, style attributes, form-hijack attributes,
 *   id/name clobbering (user-content- prefix + reference rewrite), buttons.
 * - markdown-viewer: same-origin src + allow-cross-origin, removing src,
 *   data-label-error, callouts, sanitize="off", .markdown.
 * - math-init data-mathml: MathML-only.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';
import { MXSS_CORPUS } from '../unit/fixtures/mxss-corpus.js';

const REPO = join(import.meta.dirname, '..', '..');
const EVIL = 'https://evil.example';

/**
 * @param {import('playwright/test').Page} page
 * @param {string} body
 * @param {{ files?: Record<string, string> }} [opts]
 */
async function load(page, body, { files = {} } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const serve = (route) => {
    const u = new URL(route.request().url());
    const key = u.origin === EVIL ? `${EVIL}${u.pathname}` : u.pathname;
    const f = files[key];
    if (f == null) return route.fulfill({ status: 404, body: 'nope' });
    return route.fulfill({
      status: 200,
      contentType: 'text/markdown; charset=utf-8',
      headers: { 'access-control-allow-origin': '*' },
      body: f,
    });
  };
  await page.route('**/__md/**', serve);
  await page.route(`${EVIL}/**`, serve);
  const url = `/__mn-sanitizer-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <script>window.__hits = 0; window.__hit = () => { window.__hits++; };</script>
      <script type="module">
        import * as s from '/src/lib/sanitize-html.js';
        import '/src/web-components/markdown-viewer/logic.js';
        window.__s = s;
        window.__ready = true;
      </script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => /** @type {any} */ (window).__ready);
}

/** Let image error events / async handlers settle, then read the hit count. */
async function hits(page) {
  await page.waitForTimeout(400);
  return page.evaluate(() => /** @type {any} */ (window).__hits);
}

test('harness control: unsanitized insertion of the baseline payload does fire', async ({ page }) => {
  await load(page, '<section id="out"></section>');
  await page.evaluate(() => {
    document.getElementById('out').innerHTML = '<img src=x onerror=__hit()>';
  });
  expect(await hits(page)).toBeGreaterThan(0);
});

test('the confirmed MathML mglyph/style payload no longer survives', async ({ page }) => {
  await load(page, '');
  const out = await page.evaluate(() => /** @type {any} */ (window).__s.sanitizeHTML(
    '<math><mtext><table><mglyph><style><img src=x onerror=alert(1)>',
  ));
  expect(out).not.toMatch(/<style|<img|onerror|mglyph/i);
});

for (const mode of ['fragment', 'string round trip', 'markdown-viewer']) {
  test(`mXSS corpus: no handler fires (${mode})`, async ({ page }) => {
    await load(page, '<section id="out"></section>');
    const leftovers = await page.evaluate(async ({ corpus, mode }) => {
      const { sanitizeToFragment, sanitizeHTML } = /** @type {any} */ (window).__s;
      const out = document.getElementById('out');
      for (const [, payload] of corpus) {
        const host = document.createElement('article');
        out.append(host);
        if (mode === 'fragment') host.replaceChildren(sanitizeToFragment(payload));
        else if (mode === 'string round trip') host.innerHTML = sanitizeHTML(payload);
        else {
          const v = document.createElement('markdown-viewer');
          v.markdown = payload;
          host.append(v);
        }
      }
      await new Promise((r) => setTimeout(r, 50));
      // No element anywhere in the output may carry an on* handler or be a
      // script/style/raw-text carrier.
      const bad = [];
      for (const el of out.querySelectorAll('*')) {
        if (/^(script|style|iframe|noscript|xmp|noembed|noframes|plaintext|mglyph|malignmark|foreignobject)$/i.test(el.localName)) bad.push(el.localName);
        for (const a of el.attributes) if (/^on/i.test(a.name)) bad.push(`${el.localName}[${a.name}]`);
      }
      return bad;
    }, { corpus: MXSS_CORPUS, mode });
    expect(leftovers).toEqual([]);
    expect(await hits(page)).toBe(0);
  });
}

test('sanitizeHTML output is stable under re-parse for the whole corpus', async ({ page }) => {
  await load(page, '');
  const unstable = await page.evaluate((corpus) => {
    const { sanitizeHTML } = /** @type {any} */ (window).__s;
    return corpus.filter(([, p]) => {
      const once = sanitizeHTML(p);
      return sanitizeHTML(once) !== once;
    }).map(([n]) => n);
  }, MXSS_CORPUS);
  expect(unstable).toEqual([]);
});

test('untrusted profile: style, form hijack, clobbering, buttons, invokers', async ({ page }) => {
  await load(page, '');
  const out = await page.evaluate(() => {
    const { sanitizeHTML } = /** @type {any} */ (window).__s;
    const t = (h, o) => sanitizeHTML(h, o);
    return {
      styleEl: t('<style>body{display:none}</style><p>x</p>'),
      styleAttr: t('<p style="position:fixed;inset:0">x</p>'),
      formAttrs: t('<button form="f1" formaction="https://evil.example" formmethod="post" formtarget="_top">b</button><input form="f1" name="amount">'),
      invokers: t('<button popovertarget="menu" commandfor="dlg" command="show-modal" interestfor="x">b</button>'),
      submit: t('<input type="submit"><input type="image" src="/i.png" alt="i"><button type="reset">r</button>'),
      ids: t('<h2 id="intro">Intro</h2><a href="#intro">jump</a><a href="#top">top</a>'
        + '<label for="q">Q</label><input id="q"><p aria-describedby="q page-secret">d</p>'
        + '<img usemap="#m" src="/i.png" alt=""><map name="m"></map>'),
      autofocus: t('<input autofocus>'),
      ping: t('<a href="/x" ping="https://evil.example/p">x</a>'),
      keep: t('<h2 id="a" style="color: red">x</h2><p style="position: fixed">y</p><style>p{}</style><button popovertarget="a" formaction="/x">b</button>', { keepIds: true, keepStyle: true }),
      idempotent: t(t('<h2 id="a">x</h2><a href="#a">a</a>')),
    };
  });
  expect(out.styleEl).toBe('<p>x</p>');
  expect(out.styleAttr).toBe('<p>x</p>');
  expect(out.formAttrs).toBe('<button type="button">b</button><input name="user-content-amount">');
  expect(out.invokers).toBe('<button type="button">b</button>');
  expect(out.submit).toBe('<input type="button"><input type="button" src="/i.png" alt="i"><button type="button">r</button>');
  expect(out.ids).toBe('<h2 id="user-content-intro">Intro</h2><a href="#user-content-intro">jump</a><a href="#top">top</a>'
    + '<label for="user-content-q">Q</label><input id="user-content-q"><p aria-describedby="user-content-q">d</p>'
    + '<img usemap="#user-content-m" src="/i.png" alt=""><map name="user-content-m"></map>');
  expect(out.autofocus).toBe('<input>');
  expect(out.ping).toBe('<a href="/x">x</a>');
  expect(out.keep).toBe('<h2 id="a" style="color: red">x</h2><p>y</p><button popovertarget="a">b</button>');
  expect(out.idempotent).toBe('<h2 id="user-content-a">x</h2><a href="#user-content-a">a</a>');
});

test('sanitizeMathML keeps MathML only', async ({ page }) => {
  await load(page, '<section id="out"></section>');
  const r = await page.evaluate(() => {
    const { sanitizeMathML } = /** @type {any} */ (window).__s;
    const out = document.getElementById('out');
    const ser = (m) => { const s = document.createElement('span'); s.append(sanitizeMathML(m)); return s.innerHTML; };
    const a = ser('<math><mi onclick="__hit()" href="javascript:__hit()" mathvariant="bold" style="position:fixed">x</mi><mtext><img src=x onerror=__hit()><b>b</b></mtext><mglyph src="x"></mglyph></math>');
    out.innerHTML = '';
    out.append(sanitizeMathML('<img src=x onerror=__hit()><math><mi>y</mi></math><svg onload=__hit()></svg>'));
    return {
      a,
      top: out.innerHTML,
      wrapped: ser('<mi>z</mi>'),
      ns: [...out.querySelectorAll('*')].every((e) => e.namespaceURI === 'http://www.w3.org/1998/Math/MathML'),
    };
  });
  expect(r.a).toBe('<math><mi mathvariant="bold">x</mi><mtext></mtext></math>');
  expect(r.top).toBe('<math><mi>y</mi></math>');
  expect(r.wrapped).toBe('<math><mi>z</mi></math>');
  expect(r.ns).toBe(true);
  expect(await hits(page)).toBe(0);
});

test('math-init: data-mathml is sanitized to MathML', async ({ page }) => {
  await load(page, '<section id="out"></section>');
  const r = await page.evaluate(async () => {
    await import('/src/utils/math-init.js');
    const code = document.createElement('code');
    code.setAttribute('data-math', '');
    code.setAttribute('data-mathml', '<math><mi onclick="__hit()">x</mi><img src=x onerror=__hit()></math><img src=y onerror=__hit()>');
    code.textContent = 'x';
    document.getElementById('out').append(code);
    await new Promise((res) => setTimeout(res, 50));
    const w = document.querySelector('[data-math-rendered]');
    return { html: w?.querySelector('math')?.outerHTML, imgs: document.querySelectorAll('#out img').length };
  });
  // math-init adds alttext from the source so the equation has a text alternative.
  expect(r.html).toBe('<math display="block" alttext="x"><mi>x</mi></math>');
  expect(r.imgs).toBe(0);
  expect(await hits(page)).toBe(0);
});

test('every sanitizeHTML consumer inserts sanitized nodes without firing the payload', async ({ page }) => {
  const P = '<math><mtext><table><mglyph><style><img src=x onerror=__hit()>';
  await load(page, `
    <comment-thread id="ct"></comment-thread>
    <chat-window id="cw"><chat-thread role="log" aria-label="Chat"></chat-thread></chat-window>
    <card-list id="cl"><template><article><p data-field-html="body"></p></article></template></card-list>
    <glossary-wc id="gl"></glossary-wc>
    <include-file id="if"></include-file>`, { files: { '/__md/p.html': P } });
  const r = await page.evaluate(async (P) => {
    await Promise.all([
      import('/src/web-components/comment-thread/logic.js'),
      import('/src/web-components/chat-window/logic.js'),
      import('/src/web-components/card-list/logic.js'),
      import('/src/web-components/glossary-wc/logic.js'),
      import('/src/web-components/include-file/logic.js'),
      import('/src/utils/markdown-editable-init.js'),
    ]);
    await new Promise((res) => setTimeout(res, 50));
    const w = /** @type {any} */ (window);
    const ct = /** @type {any} */ (document.getElementById('ct'));
    ct.addComment?.({ id: 'c1', author: 'a', bodyHtml: P });
    const cw = /** @type {any} */ (document.getElementById('cw'));
    cw.appendMessage('agent', P);
    const cl = /** @type {any} */ (document.getElementById('cl'));
    cl.items = [{ id: 1, body: P }];
    const gl = /** @type {any} */ (document.getElementById('gl'));
    gl.terms = [{ id: 't', term: 'T', definitionHtml: P }];
    const me = document.createElement('p');
    me.id = 'me';
    me.setAttribute('data-markdown-editable', '');
    me.textContent = 'x';
    document.querySelector('main').append(me);
    await new Promise((res) => setTimeout(res, 20));
    me.focus();
    await new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)));
    me.textContent = P;
    me.blur();
    const inc = document.getElementById('if');
    const loaded = new Promise((res) => inc.addEventListener('include-file:loaded', res, { once: true }));
    inc.setAttribute('src', '/__md/p.html');
    await Promise.race([loaded, new Promise((res) => setTimeout(res, 2000))]);
    await new Promise((res) => setTimeout(res, 50));
    return {
      handlers: [...document.querySelectorAll('main *')].filter((e) => [...e.attributes].some((a) => /^on/i.test(a.name))).length,
      styles: document.querySelectorAll('main style, main mglyph').length,
      rendered: ['#ct', '#cw', '#cl', '#gl', '#me', '#if'].filter((s) => document.querySelector(`${s} math`)),
      hits: w.__hits,
    };
  }, P);
  expect(r.handlers).toBe(0);
  expect(r.styles).toBe(0);
  expect(r.rendered).toEqual(['#ct', '#cw', '#cl', '#gl', '#me', '#if']);
  expect(await hits(page)).toBe(0);
});

// ── markdown-viewer ──────────────────────────────────────────────

/** @param {import('playwright/test').Page} page @param {string} sel */
const settled = (page, sel) => page.waitForFunction((s) => {
  const v = document.querySelector(s);
  return v && (v.hasAttribute('data-rendered') || v.hasAttribute('data-error'));
}, sel);

test('markdown-viewer: sanitized default renders the cleaned nodes, sanitize="off" is raw', async ({ page }) => {
  await load(page, `
    <markdown-viewer id="a"><script type="text/markdown"># Hi

<style>body{display:none}</style>
<p style="position:fixed" id="x">ok</p>
</script></markdown-viewer>
    <markdown-viewer id="b" sanitize="off"><script type="text/markdown"><p id="raw" style="color: red">raw</p></script></markdown-viewer>`);
  await settled(page, '#a');
  await settled(page, '#b');
  const r = await page.evaluate(() => ({
    a: document.querySelector('#a .md-content').innerHTML.replace(/\s+/g, ' ').trim(),
    bodyVisible: getComputedStyle(document.body).display !== 'none',
    b: document.querySelector('#b .md-content').innerHTML.trim(),
  }));
  expect(r.a).toBe('<h1>Hi</h1> <p id="user-content-x">ok</p>');
  expect(r.bodyVisible).toBe(true);
  expect(r.b).toBe('<p id="raw" style="color: red">raw</p>');
});

test('markdown-viewer: src is same-origin unless allow-cross-origin', async ({ page }) => {
  await load(page, `
    <markdown-viewer id="same" src="/__md/a.md"></markdown-viewer>
    <markdown-viewer id="cross" src="${EVIL}/a.md" data-label-error="Kon niet laden"></markdown-viewer>
    <markdown-viewer id="opt" src="${EVIL}/a.md" allow-cross-origin></markdown-viewer>
    <markdown-viewer id="js" src="javascript:alert(1)"></markdown-viewer>`,
  { files: { '/__md/a.md': '# Same', [`${EVIL}/a.md`]: '# Evil' } });
  for (const id of ['same', 'cross', 'opt', 'js']) await settled(page, `#${id}`);
  const r = await page.evaluate(() => {
    const q = (id) => document.getElementById(id);
    return {
      same: q('same').querySelector('h1')?.textContent,
      crossErr: q('cross').hasAttribute('data-error'),
      crossMsg: q('cross').querySelector('[role="alert"]')?.textContent,
      crossH1: q('cross').querySelector('h1'),
      opt: q('opt').querySelector('h1')?.textContent,
      js: q('js').hasAttribute('data-error'),
      jsMsg: q('js').querySelector('[role="alert"]')?.textContent,
    };
  });
  expect(r.same).toBe('Same');
  expect(r.crossErr).toBe(true);
  expect(r.crossMsg).toBe('Kon niet laden');
  expect(r.crossH1).toBeNull();
  expect(r.opt).toBe('Evil');
  expect(r.js).toBe(true);
  expect(r.jsMsg).toBe('Failed to load markdown');
});

test('markdown-viewer: removing src falls back to the slot; .markdown setter', async ({ page }) => {
  await load(page, `<markdown-viewer id="v" src="/__md/a.md"><pre># From pre</pre></markdown-viewer>`,
    { files: { '/__md/a.md': '# From src' } });
  await settled(page, '#v');
  expect(await page.locator('#v .md-content h1').textContent()).toBe('From src');
  await page.evaluate(() => document.getElementById('v').removeAttribute('src'));
  await expect(page.locator('#v .md-content h1')).toHaveText('From pre');
  await page.evaluate(() => { /** @type {any} */ (document.getElementById('v')).markdown = '## Set'; });
  await expect(page.locator('#v .md-content h2')).toHaveText('Set');
  expect(await page.evaluate(() => /** @type {any} */ (document.getElementById('v')).markdown)).toBe('## Set');
});

test('markdown-viewer: callout blocks render with the vendored marked', async ({ page }) => {
  await load(page, `<markdown-viewer id="v"><script type="text/markdown">
:::warning
**Careful!** Cannot be undone.
:::

:::tip Pro tip
Use \`highlight\`.
:::

Plain paragraph.
</script></markdown-viewer>`);
  await settled(page, '#v');
  const r = await page.evaluate(() => [...document.querySelectorAll('#v aside[data-callout]')].map((c) => ({
    kind: c.getAttribute('data-callout'),
    role: c.getAttribute('role'),
    title: c.querySelector('[data-callout-title]')?.textContent,
    strong: c.querySelector('p:not([data-callout-title]) strong')?.textContent ?? null,
  })));
  expect(r).toEqual([
    { kind: 'warning', role: 'note', title: 'Warning', strong: 'Careful!' },
    { kind: 'tip', role: 'note', title: 'Pro tip', strong: null },
  ]);
  expect(await page.locator('#v .md-content > p').last().textContent()).toBe('Plain paragraph.');
});

test('markdown-viewer: nested viewer in sanitized content cannot fetch or opt out', async ({ page }) => {
  await load(page, `<markdown-viewer id="v"><script type="text/markdown"><markdown-viewer src="${EVIL}/a.md" sanitize="off" allow-cross-origin><pre>inner</pre></markdown-viewer></script></markdown-viewer>`,
    { files: { [`${EVIL}/a.md`]: '<img src=x onerror=__hit()>' } });
  await settled(page, '#v');
  const inner = page.locator('#v .md-content markdown-viewer');
  await expect(inner).toHaveCount(1);
  expect(await inner.evaluate((e) => [...e.attributes].map((a) => a.name).filter((n) => !n.startsWith('data-')))).toEqual([]);
  expect(await hits(page)).toBe(0);
});
