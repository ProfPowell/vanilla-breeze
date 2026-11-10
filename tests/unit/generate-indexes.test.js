/**
 * The element and attribute index loops are never rendered from their
 * templates: site/plugins/generate-indexes.js replaces each {% for %} block
 * with its own HTML. These tests keep that HTML in step with the templates'
 * loop bodies (the 0.6.0 class clean-up renamed the template classes but not
 * the plugin's, leaving both index pages unstyled with dead filters).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { generateElementIndex, generateAttributeItems } from '../../site/plugins/generate-indexes.js';

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');

/** Classes and element names used inside the outermost {% for %} … {% endfor %} blocks. */
function loopVocabulary(src) {
  const body = [...src.matchAll(/\{%\s*for[\s\S]*?\{%\s*endfor\s*%\}/g)].map((m) => m[0]).join('\n');
  return vocabulary(body);
}

function vocabulary(html) {
  const classes = new Set();
  for (const m of html.matchAll(/class="([^"]+)"/g)) m[1].split(/\s+/).forEach((c) => classes.add(c));
  const tags = new Set([...html.matchAll(/<([a-z][a-z0-9-]*)/g)].map((m) => m[1]));
  return { classes, tags };
}

const sorted = (set) => [...set].sort();

const item = { href: '/x/', name: 'x', type: 'native', badgeColor: 'green', description: 'Desc', pack: 'ui' };
const elementHtml = () => generateElementIndex({ elements: { byLetter: { X: [item] } } }) ?? '';
const attributeHtml = () => generateAttributeItems({ g: { label: 'Global', items: [item] } }, 'native') ?? '';

test('element index output uses the template loop classes and elements', () => {
  const want = loopVocabulary(read('site/src/pages/docs/elements/index.html'));
  const got = vocabulary(elementHtml());
  assert.deepEqual(sorted(got.classes), sorted(want.classes));
  assert.deepEqual(sorted(got.tags), sorted(want.tags));
});

test('attribute index output uses the template loop classes and elements', () => {
  const want = loopVocabulary(read('site/src/pages/docs/attributes/index.html'));
  const got = vocabulary(attributeHtml());
  assert.deepEqual(sorted(got.classes), sorted(want.classes));
  assert.deepEqual(sorted(got.tags), sorted(want.tags));
});

test('every generated index class has a rule in docs.css', () => {
  const css = read('demos/docs.css');
  const got = vocabulary(elementHtml() + attributeHtml());
  for (const c of got.classes) assert.match(css, new RegExp(`\\.${c}\\b`), `.${c} has no rule in demos/docs.css`);
});

test('the index page scripts query the generated classes', () => {
  for (const page of ['elements', 'attributes']) {
    const src = read(`site/src/pages/docs/${page}/index.html`);
    for (const sel of src.matchAll(/querySelectorAll\('\.([a-z-]+)'\)/g)) {
      assert.ok(vocabulary(src).classes.has(sel[1]), `${page}: script queries .${sel[1]}, which the page does not use`);
    }
  }
});

test('badge colour and description are carried through', () => {
  const html = attributeHtml();
  assert.match(html, /<layout-badge data-variant="subtle" data-color="green">native<\/layout-badge>/);
  assert.match(html, /<p>Desc<\/p>/);
});
