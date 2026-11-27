/**
 * The html-validate plugin (src/htmlvalidate/plugin.js) and the vb-check bin.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { HtmlValidate, StaticConfigLoader } from 'html-validate';
import plugin from '../../../src/htmlvalidate/plugin.js';

const ROOT = resolve(import.meta.dirname, '../../..');
const BIN = join(ROOT, 'bin/vb-check.js');

const validator = new HtmlValidate(new StaticConfigLoader({
  root: true,
  plugins: [/** @type {any} */ (plugin)],
  extends: ['html-validate:recommended', 'vanilla-breeze:recommended'],
}));

/**
 * Rule ids reported for a fragment, as "severity rule" strings.
 * @param {string} html
 */
async function check(html) {
  const report = await validator.validateString(html, 'test.html');
  return (report.results[0]?.messages ?? []).map((m) => `${m.severity === 2 ? 'error' : 'warn'} ${m.ruleId}`);
}

/** @param {string} html */
const messages = async (html) => ((await validator.validateString(html, 'test.html')).results[0]?.messages ?? []);

test('clean Vanilla Breeze markup reports nothing', async () => {
  assert.deepEqual(await check(`
    <main data-layout="stack" data-layout-gap="l">
      <h1>Title</h1>
      <section data-layout="grid" style="--layout-min: 12rem"><p>One</p><p>Two</p></section>
      <tab-set aria-label="Tabs" data-orientation="vertical">
        <details name="t" open><summary>A</summary><section>Panel</section></details>
      </tab-set>
      <dl><div><dt>Term</dt><dd>Value</dd></div></dl>
      <form action="/x" method="post">
        <form-field><label for="e">Email</label><input id="e" name="e" type="email" required /></form-field>
        <button type="submit">Send</button>
      </form>
      <icon-wc name="check"></icon-wc>
      <svg role="img" aria-label="Chart" viewBox="0 0 1 1"><path d="M0 0" /></svg>
    </main>`), []);
});

test('unknown elements and attribute values come from the element metadata', async () => {
  assert.deepEqual(await check('<fancy-widget></fancy-widget>'), ['error no-unknown-elements']);
  assert.deepEqual(await check('<tab-set data-orientation="diagonal"></tab-set>'), ['error attribute-allowed-values']);
  assert.deepEqual(await check('<section data-layout="stak"><p>x</p></section>'), ['error attribute-allowed-values']);
});

test('vb/no-div flags divs, names the alternative, and allows the dl group', async () => {
  const found = await messages('<div class="card-grid"><p>a</p><p>b</p></div><div><section><p>x</p></section></div><div><p>y</p></div>');
  assert.deepEqual(found.map((m) => m.ruleId), ['vb/no-div', 'vb/no-div', 'vb/no-div']);
  assert.match(found[0].message, /data-layout="grid"/);
  assert.match(found[1].message, /wraps a single <section>/);
  assert.match(found[2].message, /semantic element/);
  assert.equal(found[0].line, 1);
  assert.deepEqual(await check('<dl><div><dt>T</dt><dd>D</dd></div></dl>'), []);
});

test('vb/no-inline-style allows only the documented layout escape hatches', async () => {
  assert.deepEqual(await check('<p style="margin: 0">x</p>'), ['error vb/no-inline-style']);
  assert.deepEqual(await check('<section style="--layout-min: 10rem; color: red"><p>x</p></section>'), ['error vb/no-inline-style']);
  assert.deepEqual(await check('<section style="--made-up: 1"><p>x</p></section>'), ['error vb/no-inline-style']);
  assert.deepEqual(await check('<section style="--layout-min: 10rem; --layout-threshold: 30rem"><p>x</p></section>'), []);
});

test('vb/no-class-for-state matches whole class tokens and skips <output>', async () => {
  assert.deepEqual(await check('<p class="note active">x</p>'), ['warn vb/no-class-for-state']);
  assert.deepEqual(await check('<p class="badge-success visually-hidden">x</p>'), []);
  assert.deepEqual(await check('<form-field><label for="a">A</label><input id="a" name="a" /><output class="error" for="a"></output></form-field>'), []);
});

test('vb/icon-wc-required flags a bare inline svg', async () => {
  assert.deepEqual(await check('<svg viewBox="0 0 1 1"><path d="M0 0" /></svg>'), ['error vb/icon-wc-required']);
  assert.deepEqual(await check('<svg aria-hidden="true" viewBox="0 0 1 1"><path d="M0 0" /></svg>'), []);
});

test('vb/use-form-field warns once per form with a validated control outside form-field', async () => {
  const form = (/** @type {string} */ body) => `<form action="/x" method="post">${body}<button type="submit">Go</button></form>`;
  assert.deepEqual(await check(form('<label for="a">A</label><input id="a" name="a" required /><label for="b">B</label><input id="b" name="b" type="email" />')), ['warn vb/use-form-field']);
  assert.deepEqual(await check(form('<label for="q">Search</label><input id="q" name="q" type="search" />')), []);
});

test('vb/layout-attribute and vb/known-data-attribute catch invented data attributes', async () => {
  assert.deepEqual(await check('<section data-layout="stack" data-layout-spacing="l"><p>x</p></section>'), ['error vb/layout-attribute']);
  assert.deepEqual(await check('<tab-set data-zoom="2"></tab-set>'), ['warn vb/known-data-attribute']);
  // The author's own hooks on native elements, and label overrides, are fine.
  assert.deepEqual(await check('<section data-my-hook="1"><p>x</p></section>'), []);
  assert.deepEqual(await check('<tab-set data-label-anything="Text" data-theme="nord"></tab-set>'), []);
});

/** @param {string[]} args @param {string} cwd */
const run = (args, cwd) => spawnSync(process.execPath, [BIN, ...args], { cwd, encoding: 'utf8' });

test('vb-check lists problems with location and rule, and exits 1 on errors', () => {
  const dir = mkdtempSync(join(tmpdir(), 'vb-check-'));
  mkdirSync(join(dir, 'pages'));
  writeFileSync(join(dir, 'pages/bad.html'), '<!doctype html>\n<html lang="en"><head><title>T</title></head><body>\n<div><p>x</p><p>y</p></div>\n</body></html>\n');
  writeFileSync(join(dir, 'pages/good.html'), '<main data-layout="stack"><h1>Fine</h1><p>Text</p></main>\n');
  writeFileSync(join(dir, 'warn.html'), '<p class="active">x</p>\n');

  const bad = run(['pages'], dir);
  assert.equal(bad.status, 1);
  assert.match(bad.stdout, /^pages\/bad\.html:3:2 {2}error {2}<div>: use a semantic element.* \[vb\/no-div\]$/m);
  assert.match(bad.stdout, /2 files checked: 1 error, 0 warnings/);

  const good = run(['pages/good.html'], dir);
  assert.equal(good.status, 0);
  assert.match(good.stdout, /1 file checked: 0 errors, 0 warnings\. No problems found\./);

  const warn = run(['warn.html'], dir);
  assert.equal(warn.status, 0, 'warnings alone do not fail');
  assert.match(warn.stdout, /warning .*\[vb\/no-class-for-state\]/);
  assert.equal(run(['warn.html', '--quiet'], dir).stdout.includes('vb/no-class-for-state'), false);

  const json = JSON.parse(run(['pages/bad.html', '--json'], dir).stdout);
  assert.equal(json.errors, 1);
  assert.deepEqual(Object.keys(json.files[0].messages[0]), ['line', 'column', 'severity', 'rule', 'message', 'url']);
  assert.equal(json.files[0].messages[0].rule, 'vb/no-div');
});

test('vb-check exits 2 on bad usage', () => {
  assert.equal(run([], ROOT).status, 2);
  assert.equal(run(['no-such-file.html'], ROOT).status, 2);
  assert.equal(run(['--help'], ROOT).status, 0);
});
