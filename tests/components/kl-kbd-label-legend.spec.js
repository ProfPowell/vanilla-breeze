/**
 * kbd / label / legend — K+L element review fixes.
 *
 * Covers: nested kbd reset (one cap size, unboxed wrapper, also in buttons
 * and the magna theme); data-hotkey caps aria-hidden with a spelled-out
 * visually-hidden name, named keys, plus alias, data-label-* overrides,
 * idempotent re-runs and LTR order in RTL; checkbox/radio labels aligned to
 * the first line of wrapped text without moving segmented controls; the
 * label/legend demos no longer double the form-field asterisk.
 *
 * Tests the working tree: /src and /demos are served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

async function routeDisk(page) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  await page.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, (route) => route.abort());
}

async function load(page, body, { dir = 'ltr', head = '', htmlAttrs = '' } = {}) {
  await routeDisk(page);
  const url = `/__kl-kbd-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en" dir="${dir}" ${htmlAttrs}><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      ${head}
      <style>*, *::before, *::after { transition: none !important; animation: none !important; }</style>
      <script type="module">import '/src/main.js';</script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
}

async function loadDemo(page, file) {
  await routeDisk(page);
  const url = `/__kl-demo-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    path: join(REPO, 'demos', 'snippets', 'demos', file),
    contentType: 'text/html; charset=utf-8',
  }));
  await page.goto(url, { waitUntil: 'load' });
}

const capsReady = (page, n = 1) => page.waitForFunction(
  (min) => document.querySelectorAll('kbd[data-hotkey-init]').length >= min, n);

test.describe('kbd', () => {
  test('nested kbd: wrapper unboxed, inner caps sized once', async ({ page }) => {
    await load(page, `
      <p id="p">Text <kbd id="solo">K</kbd>
        <kbd id="outer"><kbd id="inner">Ctrl</kbd>+<kbd>S</kbd></kbd></p>
      <p><button type="button"><kbd id="b-outer"><kbd id="b-inner">Ctrl</kbd>+<kbd>S</kbd></kbd></button></p>`);
    const s = await page.evaluate(() => {
      const cs = (id) => getComputedStyle(document.getElementById(id));
      return {
        solo: cs('solo').fontSize, inner: cs('inner').fontSize, outerSize: cs('outer').fontSize, p: cs('p').fontSize,
        outerBorder: cs('outer').borderTopStyle, outerBg: cs('outer').backgroundColor,
        outerShadow: cs('outer').boxShadow, outerPad: cs('outer').paddingInlineStart,
        innerBorder: cs('inner').borderTopStyle,
        bOuterBg: cs('b-outer').backgroundColor, bOuterShadow: cs('b-outer').boxShadow,
        bInnerBorder: cs('b-inner').borderTopStyle,
      };
    });
    expect(s.outerSize).toBe(s.p);
    expect(s.inner).toBe(s.solo);
    expect(s.outerBorder).toBe('none');
    expect(s.outerBg).toBe('rgba(0, 0, 0, 0)');
    expect(s.outerShadow).toBe('none');
    expect(s.outerPad).toBe('0px');
    expect(s.innerBorder).toBe('solid');
    expect(s.bOuterBg).toBe('rgba(0, 0, 0, 0)');
    expect(s.bOuterShadow).toBe('none');
    expect(s.bInnerBorder).toBe('solid');
  });

  test('data-hotkey: fallback is one cap, enhanced caps are standalone size', async ({ page }) => {
    await load(page, `<p id="p">Press <kbd id="solo">K</kbd> <kbd id="hk" data-hotkey="ctrl+shift+p">Ctrl+Shift+P</kbd></p>`);
    await capsReady(page);
    const s = await page.evaluate(() => {
      const hk = document.getElementById('hk');
      const caps = [...hk.querySelectorAll(':scope > kbd')];
      return {
        caps: caps.map((k) => k.textContent),
        hidden: caps.every((k) => k.getAttribute('aria-hidden') === 'true'),
        seps: [...hk.querySelectorAll(':scope > span[aria-hidden="true"]')].map((n) => n.textContent),
        spoken: hk.querySelector('.visually-hidden')?.textContent,
        ariaLabel: hk.getAttribute('aria-label'),
        capSize: getComputedStyle(caps[0]).fontSize,
        solo: getComputedStyle(document.getElementById('solo')).fontSize,
        wrapper: getComputedStyle(hk).display,
        wrapperBorder: getComputedStyle(hk).borderTopStyle,
      };
    });
    expect(s.caps.length).toBe(3);
    expect(s.hidden).toBe(true);
    expect(s.ariaLabel).toBeNull();
    expect(s.spoken).toBe('Control Shift P'); // ctrl is "Control" on every platform
    expect(s.capSize).toBe(s.solo);
    expect(s.wrapper).toBe('inline-flex');
    expect(s.wrapperBorder).toBe('none');
  });

  test('data-hotkey named keys, plus alias and spoken names', async ({ page }) => {
    await load(page, `
      <kbd id="esc" data-hotkey="escape">Esc</kbd>
      <kbd id="up" data-hotkey="arrowup">Up</kbd>
      <kbd id="pg" data-hotkey="pagedown">PgDn</kbd>
      <kbd id="plus" data-hotkey="ctrl+plus">Ctrl++</kbd>
      <kbd id="plus2" data-hotkey="ctrl++">Ctrl++</kbd>
      <kbd id="space" data-hotkey="shift+space">Shift+Space</kbd>`);
    await capsReady(page, 6);
    const r = await page.evaluate(() => Object.fromEntries(['esc', 'up', 'pg', 'plus', 'plus2', 'space'].map((id) => {
      const el = document.getElementById(id);
      return [id, {
        caps: [...el.querySelectorAll(':scope > kbd')].map((k) => k.textContent),
        spoken: el.querySelector('.visually-hidden').textContent,
      }];
    })));
    expect(r.esc).toEqual({ caps: ['Esc'], spoken: 'Escape' });
    expect(r.up).toEqual({ caps: ['↑'], spoken: 'Up arrow' });
    expect(r.pg).toEqual({ caps: ['PgDn'], spoken: 'Page down' });
    expect(r.plus.caps).toHaveLength(2);
    expect(r.plus.caps[1]).toBe('+');
    expect(r.plus.spoken).toMatch(/ Plus$/);
    expect(r.plus2).toEqual(r.plus);
    expect(r.space.caps[1]).toBe('Space');
  });

  test('data-label-* overrides from the element or an ancestor', async ({ page }) => {
    await load(page, `<p>Speichern: <kbd id="s" data-hotkey="ctrl+s">Strg+S</kbd>
        <kbd id="e" data-hotkey="escape" data-label-escape="Entf">Esc</kbd></p>`,
    { htmlAttrs: 'data-label-ctrl="Strg"' });
    await capsReady(page, 2);
    const r = await page.evaluate(async () => {
      const { isMac } = await import('/src/utils/hotkey-format.js');
      const el = (id) => document.getElementById(id);
      return {
        isMac,
        sCaps: [...el('s').querySelectorAll(':scope > kbd')].map((k) => k.textContent),
        sSpoken: el('s').querySelector('.visually-hidden').textContent,
        eCaps: [...el('e').querySelectorAll(':scope > kbd')].map((k) => k.textContent),
        eSpoken: el('e').querySelector('.visually-hidden').textContent,
      };
    });
    expect(r.sSpoken).toBe('Strg S');
    // Mac keeps the ⌃ glyph; elsewhere the override is shown.
    expect(r.sCaps[0]).toBe(r.isMac ? '⌃' : 'Strg');
    expect(r.eCaps).toEqual(['Entf']);
    expect(r.eSpoken).toBe('Entf');
  });

  test('re-running / reconnecting does not duplicate caps; a changed combo re-renders', async ({ page }) => {
    await load(page, `<p id="host"><kbd id="hk" data-hotkey="meta+k">Ctrl+K</kbd></p><p id="other"></p>`);
    await capsReady(page);
    const r = await page.evaluate(async () => {
      const { initHotkeys } = await import('/src/utils/hotkey-init.js');
      const hk = document.getElementById('hk');
      initHotkeys();
      initHotkeys();
      document.getElementById('other').append(hk); // move → observer re-sees it
      await new Promise((res) => setTimeout(res, 50));
      const afterMove = hk.querySelectorAll('kbd').length;
      hk.dataset.hotkey = 'meta+shift+k';
      initHotkeys();
      return { afterMove, afterChange: hk.querySelectorAll('kbd').length, spokenCount: hk.querySelectorAll('.visually-hidden').length };
    });
    expect(r.afterMove).toBe(2);
    expect(r.afterChange).toBe(3);
    expect(r.spokenCount).toBe(1);
  });

  test('accessible name of a button with a hotkey hint is spelled out', async ({ page }) => {
    await load(page, `<button type="button" id="b">Save <kbd data-hotkey="meta+s">Ctrl+S</kbd></button>`);
    await capsReady(page);
    const name = await page.getByRole('button').evaluate((b) => b.textContent.replace(/\s+/g, ' ').trim());
    expect(name).toMatch(/Save .*(Command|Control) S$/);
    const snap = await page.locator('#b').ariaSnapshot();
    expect(snap).toMatch(/button "Save (Command|Control) S"/);
  });

  test('RTL keeps the caps in left-to-right order', async ({ page }) => {
    await load(page, `<p><kbd id="hk" data-hotkey="ctrl+s">Ctrl+S</kbd></p>`, { dir: 'rtl' });
    await capsReady(page);
    const r = await page.evaluate(() => {
      const caps = [...document.querySelectorAll('#hk > kbd')].map((k) => k.getBoundingClientRect().left);
      return { dir: getComputedStyle(document.getElementById('hk')).direction, caps };
    });
    expect(r.dir).toBe('ltr');
    expect(r.caps[0]).toBeLessThan(r.caps[1]);
  });

  test('magna theme leaves the nested / data-hotkey wrapper unboxed', async ({ page }) => {
    await load(page, `<p><kbd id="solo">K</kbd> <kbd id="outer"><kbd>:</kbd><kbd>w</kbd></kbd>
        <kbd id="hk" data-hotkey="ctrl+s">Ctrl+S</kbd></p>`,
    { head: '<link rel="stylesheet" href="/src/tokens/themes/_extreme-magna.css">', htmlAttrs: 'data-theme="magna"' });
    await capsReady(page);
    const r = await page.evaluate(() => {
      const cs = (sel) => getComputedStyle(document.querySelector(sel));
      return {
        solo: cs('#solo').backgroundColor,
        outerBg: cs('#outer').backgroundColor, outerPad: cs('#outer').paddingInlineStart,
        hkBg: cs('#hk').backgroundColor, hkPad: cs('#hk').paddingInlineStart,
        innerBg: cs('#hk > kbd').backgroundColor,
      };
    });
    expect(r.solo).not.toBe('rgba(0, 0, 0, 0)');
    expect(r.innerBg).toBe(r.solo);
    expect(r.outerBg).toBe('rgba(0, 0, 0, 0)');
    expect(r.outerPad).toBe('0px');
    expect(r.hkBg).toBe('rgba(0, 0, 0, 0)');
    expect(r.hkPad).toBe('0px');
  });
});

test.describe('label', () => {
  test('checkbox label aligns to the first line of wrapped text', async ({ page }) => {
    await load(page, `<p><label id="l" style="inline-size: 12rem"><input type="checkbox" id="c" />
      Send me a weekly digest of new releases, security advisories and upcoming changes</label></p>
      <p><label id="one"><input type="checkbox" id="c1" /> One line</label></p>`);
    const r = await page.evaluate(() => {
      const l = document.getElementById('l').getBoundingClientRect();
      const c = document.getElementById('c').getBoundingClientRect();
      const lh = parseFloat(getComputedStyle(document.getElementById('l')).lineHeight);
      const one = document.getElementById('one').getBoundingClientRect();
      const c1 = document.getElementById('c1').getBoundingClientRect();
      return { align: getComputedStyle(document.getElementById('l')).alignItems, lTop: l.top, lH: l.height, cTop: c.top, cH: c.height, lh, oneH: one.height, oneTop: one.top, c1Top: c1.top, c1H: c1.height };
    });
    expect(r.align).toMatch(/^(first )?baseline$/); // serialises as "baseline"
    expect(r.lH).toBeGreaterThan(r.lh * 2); // really wraps
    // The box sits within the first line, not the block's middle.
    expect(r.cTop - r.lTop).toBeLessThan(r.lh);
    // A single-line label still holds the 24px target and the box inside it.
    expect(r.oneH).toBeGreaterThanOrEqual(24);
    expect(r.c1Top).toBeGreaterThanOrEqual(r.oneTop - 1);
    expect(r.c1Top + r.c1H).toBeLessThanOrEqual(r.oneTop + r.oneH + 1);
  });

  test('segmented control labels stay centred', async ({ page }) => {
    await load(page, `<fieldset data-segmented><legend class="visually-hidden">Mode</legend>
      <label id="seg"><input type="radio" name="m" checked>Auto</label>
      <label><input type="radio" name="m">Dark</label></fieldset>`);
    const align = await page.locator('#seg').evaluate((l) => getComputedStyle(l).alignItems);
    expect(align).toBe('center');
  });

  for (const file of ['label-patterns.html', 'legend-examples.html']) {
    test(`${file}: no typed asterisk inside form-field labels/legends`, async ({ page }) => {
      await loadDemo(page, file);
      const typed = await page.evaluate(() => [...document.querySelectorAll('form-field label, form-field legend')]
        .filter((n) => n.textContent.includes('*')).map((n) => n.textContent.trim()));
      expect(typed).toEqual([]);
      const inline = await page.evaluate(() => document.querySelectorAll('body [style]').length);
      expect(inline).toBe(0);
    });
  }

  test('form-field required label shows exactly one (silent) asterisk', async ({ page }) => {
    await loadDemo(page, 'label-patterns.html');
    const r = await page.evaluate(() => {
      const label = document.querySelector('label[for="req-name"]');
      const after = getComputedStyle(label, '::after').content;
      return { text: label.textContent.trim(), after };
    });
    expect(r.text).toBe('Name');
    expect(r.after).toMatch(/" \*" \/ ""/);
  });
});

test.describe('legend', () => {
  test('disabled fieldset legend is muted; required group legend gets the asterisk', async ({ page }) => {
    await loadDemo(page, 'legend-examples.html');
    const r = await page.evaluate(() => {
      const probe = document.createElement('span');
      probe.style.color = 'var(--color-text-muted)';
      document.body.append(probe);
      const muted = getComputedStyle(probe).color;
      const dis = document.querySelector('fieldset[disabled] > legend');
      const req = [...document.querySelectorAll('form-field > fieldset > legend')][0];
      return { muted, dis: getComputedStyle(dis).color, reqAfter: getComputedStyle(req, '::after').content };
    });
    expect(r.dis).toBe(r.muted);
    expect(r.reqAfter).toMatch(/" \*"/);
  });

  test('legend sits at inline-start in RTL', async ({ page }) => {
    await load(page, `<fieldset id="f"><legend id="lg">Contact</legend><label for="x">Name</label><input id="x"></fieldset>`, { dir: 'rtl' });
    const r = await page.evaluate(() => {
      const f = document.getElementById('f').getBoundingClientRect();
      const l = document.getElementById('lg').getBoundingClientRect();
      return { fRight: f.right, lRight: l.right, fLeft: f.left, lLeft: l.left };
    });
    expect(r.fRight - r.lRight).toBeLessThan(r.lLeft - r.fLeft);
  });
});

test('checkbox box is centred on the first line; switch label stays centred', async ({ page }) => {
  await load(page, `<p><label id="one"><input type="checkbox" id="c1" /> One line label</label></p>
    <p><label id="sw"><input type="checkbox" data-switch id="s1" /> Wi-Fi</label></p>`);
  const r = await page.evaluate(() => {
    const box = (id) => document.getElementById(id).getBoundingClientRect();
    const range = document.createRange();
    const text = document.getElementById('one').lastChild;
    range.selectNodeContents(text);
    const t = range.getBoundingClientRect();
    return { c: box('c1'), t: { top: t.top, bottom: t.bottom }, sw: getComputedStyle(document.getElementById('sw')).alignItems };
  });
  const boxMid = r.c.top + r.c.height / 2;
  const textMid = (r.t.top + r.t.bottom) / 2;
  expect(Math.abs(boxMid - textMid)).toBeLessThan(3);
  expect(r.sw).toBe('center');
});
