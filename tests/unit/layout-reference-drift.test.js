/**
 * Layout reference drift gate.
 *
 * The /docs/attributes/data-layout/ hub tables are generated at build time
 * (site/plugins/generate-layout-reference.js → site/data/layoutReference.js)
 * from the CSS-derived vocabulary in scripts/quality/layout-vocabulary.js and
 * the layout api.json manifests. admin/reference/syntax.md §5 is hand-written.
 * This test fails when either stops matching the CSS:
 *
 *   - the hub's data-layout value list equals the [data-layout="x"] values in
 *     the layout CSS (no imposter/text, no removed holy-grail/dashboard),
 *   - every (layout, modifier) pair the CSS reads has meaning text, and the
 *     rendered modifier table lists exactly those layouts per modifier,
 *   - every data-layout-* attribute in the CSS is documented on the hub,
 *   - syntax.md §5's value table and modifier table name exactly the CSS set,
 *   - the attribute index points at anchors that exist on the hub.
 *
 * Run: node --test tests/unit/layout-reference-drift.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  readLayoutVocabulary,
  readLayoutVocabularyByLayout,
  readPresenceAttrs,
} from '../../scripts/quality/layout-vocabulary.js';
import {
  LAYOUT_VALUES,
  CHILD_MODIFIERS,
  AREA_TEMPLATES,
  readDataLayoutValues,
  buildModifierRows,
  buildGeneralRows,
  renderModifierTable,
  renderValueTable,
} from '../../site/data/layoutReference.js';
import { GenerateLayoutReference } from '../../site/plugins/generate-layout-reference.js';
import attributeIndex from '../../site/data/attributeIndex.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const read = (/** @type {string} */ p) => readFileSync(resolve(root, p), 'utf8');

/** Every data-layout-* attribute name (no prefix) the layout CSS implements. */
const cssAttrs = new Set([...readLayoutVocabulary(root).keys(), ...readPresenceAttrs(root)]);

/** @param {Set<string>|string[]} a */
const sorted = (a) => [...a].sort();

/**
 * Body of a markdown section: from its heading to the next heading of the
 * same or higher level.
 * @param {string} md
 * @param {string} heading
 */
function section(md, heading) {
  const start = md.indexOf(heading);
  assert.ok(start !== -1, `syntax.md is missing "${heading}"`);
  const level = /** @type {RegExpMatchArray} */ (heading.match(/^#+/))[0].length;
  const rest = md.slice(start + heading.length);
  const next = rest.search(new RegExp(`\\n#{1,${level}} `));
  return next === -1 ? rest : rest.slice(0, next);
}

/** First-column cells of the markdown tables in a section (header rows skipped). */
function firstColumn(/** @type {string} */ body) {
  return body.split('\n')
    .filter((l) => l.startsWith('| ') && !/^\|\s*-/.test(l))
    .map((l) => l.split('|')[1].trim())
    .filter((c) => !/^(Value|Attribute)$/.test(c));
}

describe('data-layout hub matches the layout CSS', () => {
  it('lists exactly the data-layout values the CSS implements', () => {
    assert.deepEqual(
      sorted(LAYOUT_VALUES.map((v) => v.value)),
      sorted(readDataLayoutValues(root)),
      'site/data/layoutReference.js LAYOUT_VALUES drifted from the [data-layout="x"] selectors in src/custom-elements/layout-*.',
    );
  });

  it('has meaning text for every (layout, modifier) pair', () => {
    const { missing } = buildModifierRows(root);
    assert.deepEqual(missing, [], 'Add the missing text to the layout api.json or to ATTRIBUTE_ONLY_MEANINGS in site/data/layoutReference.js.');
  });

  it('maps every CSS child modifier to its layouts', () => {
    const { childAttrs } = readLayoutVocabularyByLayout(root);
    assert.deepEqual(sorted(Object.keys(CHILD_MODIFIERS)), sorted(childAttrs));
  });

  it('documents every data-layout-* attribute on the hub', () => {
    const documented = new Set([
      ...buildModifierRows(root).rows.map((r) => r.name),
      ...buildGeneralRows(root).map((g) => g.attr.replace(/^data-layout-/, '')),
      'density', // its own page, linked from the hub
    ]);
    const undocumented = [...cssAttrs].filter((a) => !documented.has(a));
    assert.deepEqual(undocumented, []);
  });

  it('renders each modifier row with exactly the layouts that read it', () => {
    const { byLayout } = readLayoutVocabularyByLayout(root);
    const html = renderModifierTable(root);
    const label = (/** @type {string} */ k) => ({ text: 'prose', imposter: 'layout-imposter', 'page-layout': 'data-page-layout' })[k] ?? k;
    for (const [layout, attrs] of byLayout) {
      for (const attr of attrs.keys()) {
        const row = html.match(new RegExp(`<tr id="modifier-${attr}">([\\s\\S]*?)</tr>`));
        assert.ok(row, `no hub row for data-layout-${attr}`);
        const name = label(layout);
        const text = row[1].replace(/&lt;|&gt;/g, '');
        assert.ok(text.includes(`<code>${name}</code>`), `hub row data-layout-${attr} does not list ${name}`);
      }
    }
  });

  it('only maps areas the CSS selects and a VB template defines', () => {
    const areas = readLayoutVocabulary(root).get('area') ?? new Set();
    const css = read('src/custom-elements/layout-attributes.css');
    for (const area of Object.keys(AREA_TEMPLATES)) {
      assert.ok(areas.has(area), `data-layout-area="${area}" has no CSS rule`);
      assert.match(css, new RegExp(`"[^"\\n]*\\b${area}\\b[^"\\n]*"`), `no grid-template string defines the "${area}" area`);
    }
  });

  it('the hub page uses every generated table and no removed values', async () => {
    const file = { src: read('site/src/pages/docs/attributes/data-layout.html') };
    for (const marker of ['layoutValueTable("twin")', 'layoutValueTable("attribute")', 'layoutElementOnlyTable()', 'layoutModifierTable()', 'layoutGeneralTable()']) {
      assert.ok(file.src.includes(`{{ ${marker} }}`), `hub page lost the {{ ${marker} }} marker`);
    }
    await new GenerateLayoutReference({ file }).init();
    assert.doesNotMatch(file.src, /\{\{\s*layout/, 'unreplaced layout-reference marker');
    assert.doesNotMatch(file.src, /data-layout="(holy-grail|dashboard)"/, "page templates belong to data-page-layout");
    const ids = new Set([...file.src.matchAll(/id="([^"]+)"/g)].map((m) => m[1]));
    for (const href of [...file.src.matchAll(/href="#([^"]+)"/g)].map((m) => m[1])) {
      assert.ok(ids.has(href), `in-page link #${href} has no target`);
    }
  });

  it('renders a value row per layout value', () => {
    const html = renderValueTable('twin') + renderValueTable('attribute');
    for (const v of LAYOUT_VALUES) assert.ok(html.includes(`id="layout-${v.value}"`), v.value);
  });
});

describe('attribute index points at the hub', () => {
  it('every layout-modifier entry targets an anchor the hub renders', async () => {
    const file = { src: read('site/src/pages/docs/attributes/data-layout.html') };
    await new GenerateLayoutReference({ file }).init();
    const ids = new Set([...file.src.matchAll(/id="([^"]+)"/g)].map((m) => m[1]));
    const items = attributeIndex.dataCategories['layout-modifiers'].items;
    assert.ok(items.length > 20);
    for (const item of items) {
      const [path, anchor] = item.href.split('#');
      assert.equal(path, '/docs/attributes/data-layout/');
      assert.ok(ids.has(anchor), `${item.name} → #${anchor} is not on the hub`);
    }
  });

  it('types infrastructure attributes as something other than layout', () => {
    for (const item of attributeIndex.dataCategories.infrastructure.items) {
      assert.notEqual(item.type, 'layout', item.name);
    }
  });
});

describe('syntax.md §5 matches the layout CSS', () => {
  const md = read('admin/reference/syntax.md');

  it('data-layout value table lists exactly the CSS values', () => {
    const values = firstColumn(section(md, '### `data-layout` Attribute Values'))
      .map((c) => c.replace(/`/g, ''));
    assert.deepEqual(sorted(values), sorted(readDataLayoutValues(root)));
  });

  it('modifier table names exactly the data-layout-* attributes the CSS implements', () => {
    const body = section(md, '### Layout Modifier Attributes');
    const named = new Set(firstColumn(body)
      .flatMap((c) => [...c.matchAll(/`data-layout-([a-z-]+)`/g)].map((m) => m[1])));
    assert.deepEqual(sorted(named), sorted(cssAttrs));
  });
});
