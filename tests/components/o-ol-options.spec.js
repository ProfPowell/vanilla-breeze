/**
 * ol / optgroup / option — O element review fixes.
 *
 * ol: the indent widens for lists that carry long markers (roman, start,
 * reversed, li value, 27+ letters, 100+ items) so "VIII." / "100." no longer
 * overflow the list edge, --ol-indent overrides it, the variants still reset
 * it, and ol.meta honours data-separator like ul.meta.
 * select/optgroup/option (customizable select): base-select is limited to
 * single-row selects (a size > 1 listbox keeps its rows reachable), group
 * headings look the same from label or <legend> without shrinking options,
 * disabled options get no hover fill, and forced colors repaint the picker
 * icon, disabled options and the hovered option in system colours.
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
  await page.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, (route) => route.abort());
  const url = `/__o-ol-options-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en" dir="${dir}"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
}

const pad = (page, sel) => page.$eval(sel, (el) => parseFloat(getComputedStyle(el).paddingInlineStart));
const items = (n) => Array.from({ length: n }, (_, i) => `<li>Item ${i + 1}</li>`).join('');

/* ---------- ol ---------- */

test('ol indent widens only for lists with long markers', async ({ page }) => {
  await load(page, `
    <ol id="plain">${items(3)}</ol>
    <ol id="ten">${items(12)}</ol>
    <ol id="roman" type="I">${items(3)}</ol>
    <ol id="roman-lower" type="i">${items(3)}</ol>
    <ol id="start" start="98">${items(3)}</ol>
    <ol id="reversed" reversed>${items(3)}</ol>
    <ol id="value"><li>One</li><li value="250">Jump</li></ol>
    <ol id="hundred">${items(100)}</ol>
    <ol id="alpha-short" type="a">${items(5)}</ol>
    <ol id="alpha-long" type="A">${items(27)}</ol>
    <ol id="custom" type="I" style="--ol-indent: 4rem">${items(2)}</ol>
    <ol id="custom-plain" style="--ol-indent: 3rem">${items(2)}</ol>
    <ol id="inline" class="inline" start="5">${items(3)}</ol>
    <ol id="unstyled" class="unstyled" type="I">${items(3)}</ol>`);
  const fs = await page.$eval('#plain', (el) => parseFloat(getComputedStyle(el).fontSize));
  expect(await pad(page, '#plain')).toBe(24);
  expect(await pad(page, '#ten')).toBe(24);
  expect(await pad(page, '#alpha-short')).toBe(24);
  for (const id of ['roman', 'roman-lower', 'start', 'reversed', 'value', 'hundred', 'alpha-long']) {
    expect(await pad(page, `#${id}`), id).toBeCloseTo(fs * 2.5, 1);
  }
  expect(await pad(page, '#custom')).toBe(64);
  expect(await pad(page, '#custom-plain')).toBe(48);
  expect(await pad(page, '#inline')).toBe(0);
  expect(await pad(page, '#unstyled')).toBe(0);
});

for (const dir of ['ltr', 'rtl']) {
  test(`wide markers fit inside the indent (${dir})`, async ({ page }) => {
    await load(page, `
      <ol id="roman" type="I" start="8"><li>Eighth</li></ol>
      <ol id="big" start="100"><li>Hundredth</li></ol>
      <p><span id="probe"></span></p>`, { dir });
    const fit = await page.evaluate(() => {
      const probe = document.getElementById('probe');
      const width = (text) => { probe.textContent = text; return probe.getBoundingClientRect().width; };
      const p = (id) => parseFloat(getComputedStyle(document.getElementById(id)).paddingInlineStart);
      return { roman: [width('VIII.'), p('roman')], big: [width('100.'), p('big')] };
    });
    expect(fit.roman[0]).toBeLessThan(fit.roman[1]);
    expect(fit.big[0]).toBeLessThan(fit.big[1]);
  });
}

test('ol.meta honours data-separator like ul.meta', async ({ page }) => {
  await load(page, `
    <ol class="meta" data-separator="pipe"><li>A</li><li id="pipe">B</li></ol>
    <ol class="meta" data-separator="slash"><li>A</li><li id="slash">B</li></ol>
    <ul class="meta" data-separator="dash"><li>A</li><li id="dash">B</li></ul>`);
  const before = (sel) => page.$eval(sel, (el) => getComputedStyle(el, '::before').content);
  expect(await before('#pipe')).toBe('"|"');
  expect(await before('#slash')).toBe('"/"');
  expect(await before('#dash')).toBe('"–"');
});

/* ---------- select / optgroup / option ---------- */

const GROUPED = `
  <label for="s">Food</label>
  <select id="s">
    <option id="first">Pick one</option>
    <option id="plain">Anything</option>
    <optgroup id="g1" label="Fruits"><option id="o1">Apple</option><option id="dis" disabled>Banana</option><option id="o3">Cherry</option></optgroup>
    <optgroup id="g2" label="Vegetables"><legend id="lg">Vegetables</legend><option id="o4">Carrot</option></optgroup>
    <optgroup id="g3" label="Closed" disabled><option id="o5">Kale</option></optgroup>
  </select>
  <label for="lb">Listbox</label>
  <select id="lb" size="5">
    <option id="lb-first">First</option>
    <optgroup label="Group"><option selected>Second</option><option>Third</option></optgroup>
    <option>Fourth</option>
  </select>
  <label for="one">Size 1</label>
  <select id="one" size="1"><option>Only</option></select>`;

/* Picker entry and option hover fills are transitioned — wait them out. */
const settle = (page) => page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running'));

async function needsBaseSelect(page) {
  const ok = await page.evaluate(() => CSS.supports('appearance: base-select'));
  test.skip(!ok, 'customizable select not supported in this browser');
}

test('base-select applies to single-row selects only; listbox rows stay reachable', async ({ page }) => {
  await load(page, GROUPED);
  await needsBaseSelect(page);
  const r = await page.evaluate(() => {
    const app = (id) => getComputedStyle(document.getElementById(id)).appearance;
    const lb = document.getElementById('lb');
    const first = document.getElementById('lb-first');
    return {
      single: app('s'), one: app('one'), listbox: app('lb'),
      firstTop: first.getBoundingClientRect().top, boxTop: lb.getBoundingClientRect().top,
      scrollTop: lb.scrollTop,
    };
  });
  expect(r.single).toBe('base-select');
  expect(r.one).toBe('base-select');
  expect(r.listbox).not.toBe('base-select');
  expect(r.firstTop).toBeGreaterThanOrEqual(r.boxTop);
});

test('optgroup headings match for label and legend; options keep full size', async ({ page }) => {
  await load(page, GROUPED);
  await needsBaseSelect(page);
  const r = await page.evaluate(() => {
    const cs = (id) => getComputedStyle(document.getElementById(id));
    return {
      selectSize: cs('s').fontSize,
      g1: { size: cs('g1').fontSize, tt: cs('g1').textTransform, color: cs('g1').color },
      g2: { size: cs('g2').fontSize, tt: cs('g2').textTransform, color: cs('g2').color },
      legend: { size: cs('lg').fontSize, tt: cs('lg').textTransform, color: cs('lg').color },
      plain: { size: cs('plain').fontSize, tt: cs('plain').textTransform, ls: cs('plain').letterSpacing, w: cs('plain').fontWeight, color: cs('plain').color },
      grouped: { size: cs('o1').fontSize, tt: cs('o1').textTransform, ls: cs('o1').letterSpacing, w: cs('o1').fontWeight, color: cs('o1').color },
      disabled: cs('dis').color,
      groupDisabled: cs('o5').color,
      headingDisabled: cs('g3').color,
    };
  });
  expect(r.g1.tt).toBe('uppercase');
  expect(parseFloat(r.g1.size)).toBeCloseTo(parseFloat(r.selectSize) * 0.75, 1);
  expect(r.legend).toEqual(r.g1);
  expect(r.g2).toEqual(r.g1);
  expect(r.grouped).toEqual(r.plain);
  // Disabled options (alone or via a disabled group) and a disabled group's
  // heading stay dimmed despite the explicit grouped-option colour.
  expect(r.disabled).not.toBe(r.grouped.color);
  expect(r.groupDisabled).toBe(r.disabled);
  expect(r.headingDisabled).not.toBe(r.g1.color);
});

test('disabled options get no hover fill; enabled ones do', async ({ page }) => {
  await load(page, GROUPED);
  await needsBaseSelect(page);
  await page.click('#s');
  await page.waitForFunction(() => document.getElementById('s').matches(':open'));
  const bg = (sel) => page.$eval(sel, (el) => getComputedStyle(el).backgroundColor);
  await page.hover('#dis');
  await settle(page);
  expect(await bg('#dis')).toBe('rgba(0, 0, 0, 0)');
  await page.hover('#o3');
  await settle(page);
  expect(await bg('#o3')).not.toBe('rgba(0, 0, 0, 0)');
});

test('forced colors: picker icon, disabled options and hovered option use system colours', async ({ page }) => {
  await load(page, `${GROUPED}<span id="gray">x</span><span id="field">x</span><span id="hl">x</span>`);
  await needsBaseSelect(page);
  await page.emulateMedia({ forcedColors: 'active' });
  await page.addStyleTag({ content: '#gray{color:GrayText}#field{color:FieldText}#hl{background:Highlight}' });
  await page.click('#s');
  await page.waitForFunction(() => document.getElementById('s').matches(':open'));
  await page.hover('#o1');
  await settle(page);
  const r = await page.evaluate(() => {
    const cs = (id) => getComputedStyle(document.getElementById(id));
    const icon = getComputedStyle(document.getElementById('s'), '::picker-icon');
    return {
      gray: cs('gray').color, field: cs('field').color, hl: cs('hl').backgroundColor,
      iconColor: icon.color, iconOpacity: icon.opacity,
      dis: cs('dis').color, groupDis: cs('o5').color, enabled: cs('o4').color,
      hover: cs('o1').backgroundColor,
    };
  });
  expect(r.iconColor).toBe(r.field);
  expect(r.iconOpacity).toBe('1');
  expect(r.dis).toBe(r.gray);
  expect(r.groupDis).toBe(r.gray);
  expect(r.enabled).not.toBe(r.gray);
  expect(r.hover).toBe(r.hl);
});

test('dark mode: options follow the theme text colour on the themed picker', async ({ page }) => {
  await load(page, `${GROUPED}<span id="ref">x</span>`);
  await needsBaseSelect(page);
  await page.evaluate(() => { document.documentElement.dataset.mode = 'dark'; });
  await page.addStyleTag({ content: '#ref{color:var(--color-text)}' });
  const r = await page.evaluate(() => {
    const c = (id) => getComputedStyle(document.getElementById(id)).color;
    return { ref: c('ref'), plain: c('plain'), grouped: c('o1') };
  });
  expect(r.plain).toBe(r.ref);
  expect(r.grouped).toBe(r.ref);
});
