/**
 * Element index data must match the source (vanilla-breeze-toym).
 *
 * site/data/webComponents.js and customElements.js drive the categorized
 * index pages; site/data/elements.js drives the A-Z index and the homepage
 * stats. They drifted: 8 registered components were missing from the
 * landing page, the custom-element list carried a web component and a
 * <progress> enhancement, and six documented custom elements were absent.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../..');
const load = async (rel) => (await import(join(ROOT, rel))).default;

/**
 * Primary web components: each src/web-components/<dir>/api.json names its
 * element (the directory name when there is no manifest). Child elements a component also registers (command-item,
 * tour-step, foot-note, …) are part of their parent's page, not entries.
 * The primary tag must actually be registered by a .js file in its dir.
 * @returns {{ primary: Set<string>, unregistered: string[] }}
 */
function primaryComponents() {
  const dir = join(ROOT, 'src/web-components');
  const primary = new Set();
  const unregistered = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('_')) continue;
    const manifest = join(dir, entry.name, 'api.json');
    // No local manifest (brand-mark's lives in src/htmlvalidate/api-overrides.json): the directory name is the tag
    const tag = existsSync(manifest) ? JSON.parse(readFileSync(manifest, 'utf8')).element : entry.name;
    const registers = readdirSync(join(dir, entry.name)).filter((f) => f.endsWith('.js')).some((f) =>
      new RegExp(`(?:registerComponent|customElements\\.define)\\(\\s*['"]${tag}['"]`).test(readFileSync(join(dir, entry.name, f), 'utf8')));
    if (registers) primary.add(tag); else unregistered.push(tag);
  }
  return { primary, unregistered };
}

const pageFor = (href) => {
  const rel = href.replace(/^\/|\/$/g, '');
  return [join(ROOT, 'site/src/pages', `${rel}.html`), join(ROOT, 'site/src/pages', rel, 'index.html')].find((p) => existsSync(p));
};

test('webComponents.js lists exactly the registered web components', async () => {
  const wc = await load('site/data/webComponents.js');
  const listed = new Set(Object.values(wc).flat().map((e) => e.name));
  const { primary, unregistered } = primaryComponents();
  assert.deepEqual(unregistered, [], 'api.json names an element its directory never registers');
  assert.deepEqual([...primary].filter((t) => !listed.has(t)).sort(), [], 'registered but missing from webComponents.js');
  assert.deepEqual([...listed].filter((t) => !primary.has(t)).sort(), [], 'listed but not a registered component');
});

test('every index entry links to an existing doc page', async () => {
  const wc = await load('site/data/webComponents.js');
  const ce = await load('site/data/customElements.js');
  const dead = [...Object.values(wc).flat(), ...ce.all].filter((e) => !pageFor(e.href)).map((e) => `${e.name} → ${e.href}`);
  assert.deepEqual(dead, []);
});

test('customElements.js covers every documented custom element', async () => {
  const ce = await load('site/data/customElements.js');
  const dir = join(ROOT, 'site/src/pages/docs/elements/custom-elements');
  const linked = new Set(ce.all.map((e) => e.href));
  const missing = readdirSync(dir)
    .filter((f) => f.endsWith('.html') && f !== 'index.html')
    // Redirect stubs (e.g. form-field moved to web components) are not entries
    .filter((f) => !/^description:\s*"?Redirects/m.test(readFileSync(join(dir, f), 'utf8')))
    .map((f) => `/docs/elements/custom-elements/${f.replace(/\.html$/, '')}/`)
    .filter((href) => !linked.has(href));
  assert.deepEqual(missing, []);
  for (const e of ce.all) assert.ok(e.href.startsWith('/docs/elements/custom-elements/'), `${e.name} is not a custom element page`);
});

test('elements.js counts (homepage stats) agree with the lists', async () => {
  const el = await load('site/data/elements.js');
  const wc = await load('site/data/webComponents.js');
  const ce = await load('site/data/customElements.js');
  assert.equal(el.componentCount, Object.values(wc).flat().length, 'web component count');
  assert.equal(el.customCount, ce.all.length, 'custom element count');
});
