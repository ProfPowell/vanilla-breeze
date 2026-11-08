/**
 * fieldset / legend — review fixes (vanilla-breeze-4rtb).
 *
 * Covers: one legend rule (padding = documented --size-s); forced-colors
 * status/invalid border cue; neumorphism + win9x keep state borders; a
 * disabled fieldset dims its controls once; data-variant="minimal" (the old
 * .minimal class is gone, and themes leave it flat); scoped form helper
 * classes don't leak outside forms.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

async function load(page, body, { theme = '', dir = 'ltr' } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__f-fieldset-${Math.random().toString(36).slice(2)}.html`;
  const themeLink = theme ? `<link rel="stylesheet" href="/src/tokens/themes/_extreme-${theme}.css">` : '';
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en" dir="${dir}"${theme ? ` data-theme="${theme}"` : ''}><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">${themeLink}
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
}

const css = (page, sel, props) => page.evaluate(([s, p]) => {
  const cs = getComputedStyle(/** @type {Element} */ (document.querySelector(s)));
  return Object.fromEntries(p.map((k) => [k, cs.getPropertyValue(k)]));
}, [sel, props]);

test('legend has a single rule: padding-inline = --size-s, font-size = --font-size-s', async ({ page }) => {
  await load(page, `<fieldset><legend id="lg">Contact</legend></fieldset>
    <span id="s" style="inline-size: var(--size-s); font-size: var(--font-size-s); display:block"></span>`);
  const r = await page.evaluate(() => {
    const lg = getComputedStyle(document.getElementById('lg'));
    const s = document.getElementById('s');
    return {
      pad: lg.paddingInlineStart,
      expectedPad: `${s.getBoundingClientRect().width}px`,
      font: lg.fontSize,
      expectedFont: getComputedStyle(s).fontSize,
    };
  });
  expect(r.pad).toBe(r.expectedPad);
  expect(r.font).toBe(r.expectedFont);
});

test('forced colors: status and invalid fieldsets get a visible non-colour border', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await load(page, `
    <fieldset id="plain"><legend>Plain</legend></fieldset>
    <fieldset id="ok" data-status="success"><legend>Done</legend></fieldset>
    <fieldset id="warn" data-status="warning"><legend>Check</legend></fieldset>
    <fieldset id="err" data-status="error"><legend>Errors</legend></fieldset>
    <fieldset id="inv" data-invalid><legend>Invalid</legend></fieldset>`);
  const props = ['border-top-style', 'border-top-width'];
  const plain = await css(page, '#plain', props);
  const ok = await css(page, '#ok', props);
  const warn = await css(page, '#warn', props);
  const err = await css(page, '#err', props);
  const inv = await css(page, '#inv', props);
  expect(parseFloat(ok['border-top-width'])).toBeGreaterThan(parseFloat(plain['border-top-width']));
  expect(ok['border-top-style']).toBe('solid');
  expect(warn['border-top-style']).toBe('dotted');
  expect(err['border-top-style']).toBe('double');
  expect(inv['border-top-style']).toBe('double');
});

test('forced colors cue survives the neumorphism border reset', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await load(page, `<fieldset id="err" data-status="error"><legend>Errors</legend></fieldset>`, { theme: 'neumorphism' });
  const r = await css(page, '#err', ['border-top-style', 'border-top-width']);
  expect(r['border-top-style']).toBe('double');
  expect(parseFloat(r['border-top-width'])).toBeGreaterThanOrEqual(3);
});

for (const theme of ['neumorphism', 'win9x']) {
  test(`${theme}: invalid and status fieldsets keep a coloured border`, async ({ page }) => {
    await load(page, `
      <fieldset id="plain"><legend>Plain</legend></fieldset>
      <fieldset id="inv" data-invalid><legend>Invalid</legend><output>Pick one</output></fieldset>
      <fieldset id="err" data-status="error"><legend>Errors</legend></fieldset>
      <fieldset id="min" data-variant="minimal"><legend>Minimal</legend></fieldset>`, { theme });
    const props = ['border-top-style', 'border-top-width', 'border-top-color', 'padding-top'];
    const plain = await css(page, '#plain', props);
    const inv = await css(page, '#inv', props);
    const err = await css(page, '#err', props);
    const min = await css(page, '#min', props);
    // the theme really applies to a plain fieldset
    if (theme === 'neumorphism') expect(plain['border-top-style']).toBe('none');
    else expect(plain['padding-top']).toBe('16px');
    for (const s of [inv, err]) {
      expect(s['border-top-style']).toBe('solid');
      expect(parseFloat(s['border-top-width'])).toBeGreaterThan(0);
      expect(s['border-top-color']).not.toBe(plain['border-top-color']);
    }
    // minimal stays flat in the theme (no group-box padding/border)
    expect(min['border-top-style']).toBe('none');
    expect(min['padding-top']).toBe('0px');
  });
}

test('disabled fieldset dims its button once (no compounded opacity)', async ({ page }) => {
  await load(page, `
    <fieldset id="fs" disabled>
      <legend>Account</legend>
      <label for="n">Name</label><input id="n" value="x">
      <button id="b" type="button">Save</button>
      <fieldset id="inner"><legend>Inner</legend><button id="b2" type="button">Go</button></fieldset>
    </fieldset>`);
  const r = await page.evaluate(() => {
    /** @param {Element} el */
    const effective = (el) => {
      let o = 1;
      for (let n = el; n; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity);
      return o;
    };
    const fs = document.getElementById('fs');
    return {
      button: effective(document.getElementById('b')),
      nested: effective(document.getElementById('b2')),
      fsOpacity: getComputedStyle(fs).opacity,
      fsBorder: getComputedStyle(fs).borderTopStyle,
      legendColor: getComputedStyle(fs.querySelector('legend')).color,
      bodyColor: getComputedStyle(document.body).color,
    };
  });
  expect(r.fsOpacity).toBe('1');
  expect(r.button).toBeCloseTo(0.5, 2);
  expect(r.nested).toBeCloseTo(0.5, 2);
  // still visibly disabled: dashed border + muted legend
  expect(r.fsBorder).toBe('dashed');
  expect(r.legendColor).not.toBe(r.bodyColor);
});

test('data-variant="minimal" drops border and padding; the .minimal class no longer applies', async ({ page }) => {
  await load(page, `
    <fieldset id="min" data-variant="minimal"><legend id="lg">Prefs</legend></fieldset>
    <fieldset id="old" class="minimal"><legend>Old</legend></fieldset>`);
  const min = await css(page, '#min', ['border-top-style', 'padding-top', 'padding-inline-start']);
  const lg = await css(page, '#lg', ['padding-inline-start', 'margin-block-end']);
  const old = await css(page, '#old', ['border-top-style']);
  expect(min).toEqual({ 'border-top-style': 'none', 'padding-top': '0px', 'padding-inline-start': '0px' });
  expect(lg['padding-inline-start']).toBe('0px');
  expect(parseFloat(lg['margin-block-end'])).toBeGreaterThan(0);
  expect(old['border-top-style']).toBe('solid');
});

test('form helper classes stay scoped to forms and their elements', async ({ page }) => {
  await load(page, `
    <section class="group" id="out-group">x</section>
    <section class="actions" id="out-actions">x</section>
    <form>
      <section class="group" id="in-group">x</section>
      <section class="actions end" id="in-actions">x</section>
      <span class="help" id="in-help">h</span>
      <small class="error" id="in-error">e</small>
    </form>
    <dialog open><footer class="actions" id="dlg-actions">x</footer></dialog>`);
  const d = (id) => page.evaluate((i) => getComputedStyle(document.getElementById(i)).display, id);
  expect(await d('out-group')).not.toBe('flex');
  expect(await d('out-actions')).not.toBe('flex');
  expect(await d('in-group')).toBe('flex');
  expect(await d('in-actions')).toBe('flex');
  expect(await d('dlg-actions')).toBe('flex');
  const r = await page.evaluate(() => {
    const c = (id) => getComputedStyle(document.getElementById(id));
    const probe = document.createElement('span');
    probe.style.color = 'var(--color-error)';
    document.body.append(probe);
    const err = getComputedStyle(probe).color;
    return {
      inError: c('in-error').color, err,
      helpFont: c('in-help').fontSize, bodyFont: getComputedStyle(document.body).fontSize,
    };
  });
  expect(r.inError).toBe(r.err);
  expect(r.helpFont).not.toBe(r.bodyFont);
});

test('RTL: legend padding is logical', async ({ page }) => {
  await load(page, `<fieldset><legend id="lg">Contact</legend></fieldset>`, { dir: 'rtl' });
  const r = await css(page, '#lg', ['padding-inline-start', 'padding-inline-end']);
  expect(r['padding-inline-start']).toBe(r['padding-inline-end']);
  expect(parseFloat(r['padding-inline-start'])).toBeGreaterThan(0);
});
