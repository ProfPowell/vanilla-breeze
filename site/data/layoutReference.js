/**
 * @file layoutReference.js
 * @description Build-time source for the /docs/attributes/data-layout/ hub
 * reference tables and the layout-modifier entries in the attribute index.
 *
 * The modifier vocabulary (which data-layout-* attributes exist, their values,
 * their bare forms and the layouts that read them) is NOT written here: it is
 * read back out of the layout CSS by scripts/quality/layout-vocabulary.js, the
 * same parser the vb/layout-attr-value conformance rule uses. Per-layout
 * meanings and defaults come from each layout element's api.json (itself
 * gated against the CSS by tests/unit/layout-manifests.test.js). Only the
 * attribute-only layouts, which have no api.json, carry hand-written meaning
 * text below — and tests/unit/layout-reference-drift.test.js fails the moment
 * the CSS grows a modifier that has no meaning here.
 *
 * Rendered by site/plugins/generate-layout-reference.js (markers in the hub
 * page) and consumed by site/data/attributeIndex.js (index entries).
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  readLayoutVocabulary,
  readLayoutVocabularyByLayout,
} from '../../scripts/quality/layout-vocabulary.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = resolve(HERE, '../..');

export const HUB = '/docs/attributes/data-layout/';
const EL = '/docs/elements/custom-elements/';

/**
 * @typedef {object} LayoutValue
 * @property {string} value          data-layout value
 * @property {'twin'|'attribute'} kind  has a <layout-*> element twin, or attribute-only
 * @property {string} pattern        one-line description (HTML allowed)
 * @property {string} responsive     how it adapts (HTML allowed)
 * @property {string} [element]      element twin tag
 * @property {string} [href]         element page
 * @property {string} [on]           where it may be used (attribute-only)
 * @property {string} [defaults]     defaults without modifiers (attribute-only)
 */

/** @type {LayoutValue[]} Every data-layout value the CSS implements. */
export const LAYOUT_VALUES = [
  { value: 'stack', kind: 'twin', element: 'layout-stack', href: `${EL}stack/`, pattern: 'Vertical flow with a consistent gap', responsive: 'None needed: always one column' },
  { value: 'cluster', kind: 'twin', element: 'layout-cluster', href: `${EL}cluster/`, pattern: 'Horizontal row that wraps', responsive: 'Intrinsic: items wrap when the row runs out of room' },
  { value: 'grid', kind: 'twin', element: 'layout-grid', href: `${EL}grid/`, pattern: 'Auto-fit grid by minimum column width', responsive: 'Intrinsic: column count follows the element&rsquo;s own width' },
  { value: 'center', kind: 'twin', element: 'layout-center', href: `${EL}center/`, pattern: 'Centered column with a max width and gutters', responsive: 'None needed: the max width caps, the gutters stay' },
  { value: 'cover', kind: 'twin', element: 'layout-cover', href: `${EL}cover/`, pattern: 'Principal content vertically centered in a minimum block size', responsive: 'None needed' },
  { value: 'sidebar', kind: 'twin', element: 'layout-sidebar', href: `${EL}sidebar/`, pattern: 'Sidebar beside content', responsive: 'Container: wraps when the content column would drop below its minimum share' },
  { value: 'switcher', kind: 'twin', element: 'layout-switcher', href: `${EL}switcher/`, pattern: 'Row that becomes a column below a threshold', responsive: 'Container: switches at <code>data-layout-threshold</code> of its own width' },
  { value: 'reel', kind: 'twin', element: 'layout-reel', href: `${EL}reel/`, pattern: 'Horizontally scrolling row', responsive: 'None: scrolls instead of wrapping' },
  { value: 'columns', kind: 'twin', element: 'layout-columns', href: `${EL}layout-columns/`, pattern: 'CSS multi-column reading flow', responsive: 'Container: drops to fewer columns as its own width shrinks' },
  { value: 'prose', kind: 'twin', element: 'layout-text', href: `${EL}layout-text/`, pattern: 'Reading column with typographic rhythm (the element is <code>&lt;layout-text&gt;</code>; there is no <code>data-layout="text"</code>)', responsive: 'Container: measure released to 100% in containers under 30rem' },

  { value: 'split', kind: 'attribute', on: 'Any element', pattern: 'Two columns at a fixed ratio', defaults: 'Equal columns, gap <code>xl</code>, <code>align-items: center</code>', responsive: 'Viewport: one column below 48rem unless <code>data-layout-nowrap</code>' },
  { value: 'media', kind: 'attribute', on: 'Any element', pattern: 'Media object: a figure beside the content', defaults: 'Figure column sized to the figure, gap <code>m</code>, align <code>start</code>', responsive: 'Container: figure stacks above the content when the nearest query container is under 25rem' },
  { value: 'regions', kind: 'attribute', on: 'Any element (cards, articles, panels)', pattern: 'Header / content / footer column, no visual chrome', defaults: 'Header first, footer last, <code>section</code> grows; gap <code>0</code>', responsive: 'None needed' },
  { value: 'page-stack', kind: 'attribute', on: 'A full-height container, usually <code>&lt;body&gt;</code>', pattern: 'Header / main / footer column; <code>main</code> grows so the footer sits at the bottom of short pages', defaults: '<code>min-block-size: 100dvh</code>, no gap, no modifiers', responsive: 'None needed' },
  { value: 'sidebar-left', kind: 'attribute', on: '<code>&lt;main&gt;</code> only', pattern: '<code>nav</code> beside the <code>article</code>', defaults: '16rem nav column, gap <code>m</code>', responsive: 'Viewport: below 48rem stacks to article, aside, nav unless <code>data-layout-nowrap</code>' },
  { value: 'sidebar-right', kind: 'attribute', on: '<code>&lt;main&gt;</code> only', pattern: '<code>aside</code> beside the <code>article</code>', defaults: '16rem aside column, gap <code>m</code>', responsive: 'Viewport: below 48rem stacks to article, aside, nav unless <code>data-layout-nowrap</code>' },
];

/** Layouts with no data-layout form, and what to use instead. */
export const ELEMENT_ONLY = [
  { element: 'layout-imposter', href: `${EL}imposter/`, note: 'Element only: the element is the positioning box. Its <code>data-layout-*</code> modifiers appear in the table below.' },
  { element: 'layout-card', href: `${EL}layout-card/`, note: 'Element only. For a surface on a semantic element use <a href="/docs/attributes/data-canvas/"><code>data-canvas</code></a>.' },
  { element: 'layout-badge', href: `${EL}layout-badge/`, note: 'Element only (an inline label, not a layout container).' },
  { element: 'layout-canvas', href: `${EL}layout-canvas/`, note: 'Attribute form is <a href="/docs/attributes/data-canvas/"><code>data-canvas</code></a> (surfaces use bare <code>data-*</code> modifiers, not <code>data-layout-*</code>).' },
];

/**
 * Vocabulary keys (from readLayoutVocabularyByLayout) → how the hub labels
 * them and which api.json documents them. `text` is <layout-text>, whose
 * attribute form is `prose`, so the two keys merge into one column entry.
 * @type {Record<string, {label: string, api?: string, elementOnly?: boolean, page?: boolean}>}
 */
const LAYOUT_KEYS = {
  stack: { label: 'stack', api: 'layout-stack' },
  cluster: { label: 'cluster', api: 'layout-cluster' },
  grid: { label: 'grid', api: 'layout-grid' },
  center: { label: 'center', api: 'layout-center' },
  cover: { label: 'cover', api: 'layout-cover' },
  sidebar: { label: 'sidebar', api: 'layout-sidebar' },
  switcher: { label: 'switcher', api: 'layout-switcher' },
  reel: { label: 'reel', api: 'layout-reel' },
  columns: { label: 'columns', api: 'layout-columns' },
  prose: { label: 'prose', api: 'layout-text' },
  text: { label: 'prose', api: 'layout-text' },
  imposter: { label: 'layout-imposter', api: 'layout-imposter', elementOnly: true },
  split: { label: 'split' },
  media: { label: 'media' },
  regions: { label: 'regions' },
  'sidebar-left': { label: 'sidebar-left' },
  'sidebar-right': { label: 'sidebar-right' },
  'page-layout': { label: 'data-page-layout', page: true },
};

/**
 * Meaning + default for modifiers of layouts that have no api.json.
 * Keyed by the hub label, then modifier name (no data-layout- prefix).
 * @type {Record<string, Record<string, {text: string, default?: string}>>}
 */
export const ATTRIBUTE_ONLY_MEANINGS = {
  split: {
    ratio: { text: 'Column ratio: 2:1, 1:2, 3:1, 1:3 or golden (1.618:1).', default: 'equal (1:1)' },
    gap: { text: 'Gap between the two columns, on the shared size scale.', default: 'xl' },
    align: { text: 'Block-axis alignment of the two columns (align-items).', default: 'center' },
    fill: { text: 'At least the full viewport height (min-block-size: 100dvh), for full-height sign-in pages.' },
    nowrap: { text: 'Keep two columns below 48rem (viewport) instead of stacking.' },
  },
  media: {
    gap: { text: 'Gap between the figure and the content, and between content rows.', default: 'm' },
    align: { text: 'Block-axis alignment of the figure and the content.', default: 'start' },
    reverse: { text: 'Figure on the end side. Visual only: DOM and reading order are unchanged.' },
  },
  regions: {
    gap: { text: 'Gap between the header, content and footer regions.', default: 'none' },
  },
  'sidebar-left': {
    gap: { text: 'Gap between the nav and the article.', default: 'm' },
    'sidebar-width': { text: 'Nav column: 12 / 16 / 20rem.', default: 'normal' },
    nowrap: { text: 'Keep nav and article side by side below 48rem.' },
  },
  'sidebar-right': {
    gap: { text: 'Gap between the article and the aside.', default: 'm' },
    'sidebar-width': { text: 'Aside column: 12 / 16 / 20rem.', default: 'normal' },
    nowrap: { text: 'Keep article and aside side by side below 48rem.' },
  },
  'data-page-layout': {
    gap: { text: 'Gap between the page regions.', default: 'm' },
    'sidebar-width': { text: 'Sidebar column: 12 / 16 / 20rem.', default: 'normal' },
    nowrap: { text: 'Keep the template below 48rem instead of collapsing to one column.' },
  },
};

/**
 * Child modifiers (set on a child of the layout, not the host) → the layouts
 * whose children read them. readLayoutVocabularyByLayout() reports child
 * attributes without their layout, so this map supplies it; the drift test
 * asserts its keys equal the CSS-derived child set.
 */
export const CHILD_MODIFIERS = {
  principal: ['cover'],
  'cover-top': ['cover'],
  'cover-bottom': ['cover'],
  sticky: ['sidebar', 'data-page-layout'],
  bleed: ['data-page-layout'],
};

/** Child modifiers documented in the general-purpose table instead of the modifier table. */
const GENERAL_CHILD_MODIFIERS = new Set(['sticky', 'bleed']);

/** Real VB templates that define each data-layout-area name. */
export const AREA_TEMPLATES = {
  hero: '<a href="/docs/attributes/data-page-layout/"><code>data-page-layout="landing"</code></a>',
  feature: '<a href="/docs/attributes/data-page-layout/"><code>data-page-layout="landing"</code></a>',
  cta: '<a href="/docs/attributes/data-page-layout/"><code>data-page-layout="landing"</code></a>',
};

/** @param {string} css */
const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

/**
 * @param {string} s
 * @returns {string}
 */
export const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** @param {string} root */
function layoutCssFiles(root) {
  const base = join(root, 'src', 'custom-elements');
  const files = [join(base, 'layout-attributes.css')];
  for (const entry of readdirSync(base, { withFileTypes: true })) {
    if (entry.isDirectory() && entry.name.startsWith('layout-')) {
      const f = join(base, entry.name, 'styles.css');
      if (existsSync(f)) files.push(f);
    }
  }
  return files;
}

/**
 * Every value used in a `[data-layout="x"]` selector in the layout CSS.
 * @param {string} [root]
 * @returns {Set<string>}
 */
export function readDataLayoutValues(root = DEFAULT_ROOT) {
  const out = new Set();
  for (const f of layoutCssFiles(root)) {
    const css = stripComments(readFileSync(f, 'utf8'));
    for (const [, v] of css.matchAll(/\[data-layout="([a-z-]+)"\]/g)) out.add(v);
  }
  return out;
}

/**
 * Values and bare form of an attribute selector in one CSS file.
 * @param {string} file  absolute path
 * @param {string} attr  full attribute name
 * @returns {{ values: string[], bare: boolean }}
 */
function cssAttrValues(file, attr) {
  const css = stripComments(readFileSync(file, 'utf8'));
  const values = new Set();
  let bare = false;
  const re = new RegExp(`\\[${attr}(?:="([^"]*)")?\\]`, 'g');
  for (const [, v] of css.matchAll(re)) {
    if (v == null) bare = true;
    else values.add(v);
  }
  return { values: [...values], bare };
}

/**
 * @param {string} root
 * @param {string} name
 * @returns {any}
 */
function readApi(root, name) {
  const f = join(root, 'src', 'custom-elements', name, 'api.json');
  return existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null;
}

/**
 * @typedef {object} LayoutUse
 * @property {string} layout     hub label (stack, prose, data-page-layout…)
 * @property {string[]} values   values this layout reads
 * @property {boolean} bare      the bare attribute does something here
 * @property {string|undefined} default   value when the attribute is absent
 * @property {string} [bareValue]          value the bare attribute stands for
 * @property {string|undefined} meaning
 * @property {boolean} [child]   set on a child of this layout
 *
 * @typedef {object} ModifierRow
 * @property {string} name       modifier name without the data-layout- prefix
 * @property {string} attr       full attribute name
 * @property {string} id         anchor id on the hub
 * @property {string[]} values   union of values across layouts
 * @property {boolean} presence  bare-only (no value vocabulary)
 * @property {LayoutUse[]} uses
 */

/** Natural ordering for size-scale and other token values. */
const ORDER = ['', 'none', '3xs', '2xs', 'xs', 's', 'm', 'l', 'xl', '2xl', '3xl', 'narrow', 'normal', 'wide', 'prose', 'auto', 'full', 'start', 'center', 'end', 'stretch', 'baseline', 'between', 'justify'];
/** @param {string[]} vals */
const sortValues = (vals) => [...vals].sort((a, b) => {
  const ia = ORDER.indexOf(a); const ib = ORDER.indexOf(b);
  if (ia !== -1 && ib !== -1) return ia - ib;
  if (ia !== -1) return -1;
  if (ib !== -1) return 1;
  return a.localeCompare(b, 'en', { numeric: true });
});

/**
 * Build the modifier reference rows from the CSS vocabulary.
 * @param {string} [root]
 * @returns {{ rows: ModifierRow[], missing: string[] }}  missing = (layout, modifier) pairs with no meaning text
 */
export function buildModifierRows(root = DEFAULT_ROOT) {
  const { byLayout, childAttrs } = readLayoutVocabularyByLayout(root);
  /** @type {Map<string, Map<string, LayoutUse>>} */
  const byAttr = new Map();
  const missing = [];
  /** @type {Map<string, any>} */
  const apiCache = new Map();
  /** @param {string} name */
  const api = (name) => {
    if (!apiCache.has(name)) apiCache.set(name, readApi(root, name));
    return apiCache.get(name);
  };

  for (const [key, attrs] of byLayout) {
    const info = LAYOUT_KEYS[key];
    const label = info ? info.label : key;
    for (const [attr, { values, bare }] of attrs) {
      if (!byAttr.has(attr)) byAttr.set(attr, new Map());
      const uses = /** @type {Map<string, LayoutUse>} */ (byAttr.get(attr));
      const prev = uses.get(label);
      let meaning; let def;
      const apiName = info?.api;
      if (apiName) {
        const a = api(apiName)?.attributes?.find((/** @type {any} */ x) => x.name === `data-layout-${attr}`);
        meaning = a?.description;
        def = a?.default;
      } else {
        const m = ATTRIBUTE_ONLY_MEANINGS[label]?.[attr];
        meaning = m?.text;
        def = m?.default;
      }
      if (!meaning) missing.push(`${label}: data-layout-${attr}`);
      const allValues = sortValues([...new Set([...(prev?.values ?? []), ...values])]);
      const isBare = Boolean(prev?.bare || bare);
      // A bare form beside a value vocabulary (center gap, cluster overlap,
      // grid subgrid) switches the feature on: the manifest default is the
      // bare value, and without the attribute the feature is off.
      const switchesOn = isBare && allValues.length > 0;
      uses.set(label, {
        layout: label,
        values: allValues,
        bare: isBare,
        bareValue: switchesOn ? def : undefined,
        default: switchesOn ? undefined : def,
        meaning,
      });
    }
  }

  for (const attr of childAttrs) {
    if (GENERAL_CHILD_MODIFIERS.has(attr)) continue;
    const layouts = CHILD_MODIFIERS[/** @type {keyof typeof CHILD_MODIFIERS} */ (attr)] ?? [];
    if (!byAttr.has(attr)) byAttr.set(attr, new Map());
    const uses = /** @type {Map<string, LayoutUse>} */ (byAttr.get(attr));
    for (const label of layouts) {
      const key = Object.keys(LAYOUT_KEYS).find((k) => LAYOUT_KEYS[k].label === label);
      const info = key ? LAYOUT_KEYS[key] : undefined;
      const apiName = info?.api;
      const c = apiName ? api(apiName)?.childAttributes?.find((/** @type {any} */ x) => x.name === `data-layout-${attr}`) : undefined;
      if (!c?.description) missing.push(`${label}: data-layout-${attr} (child)`);
      uses.set(label, { layout: label, values: [], bare: true, default: undefined, meaning: c?.description, child: true });
    }
  }

  const presenceOnly = (/** @type {Map<string, LayoutUse>} */ uses) => [...uses.values()].every((u) => u.values.length === 0);
  const rows = [...byAttr.entries()]
    .map(([name, uses]) => ({
      name,
      attr: `data-layout-${name}`,
      id: `modifier-${name}`,
      values: sortValues([...new Set([...uses.values()].flatMap((u) => u.values))]),
      presence: presenceOnly(uses),
      uses: [...uses.values()].sort((a, b) => layoutOrder(a.layout) - layoutOrder(b.layout)),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return { rows, missing };
}

const LABEL_ORDER = [...LAYOUT_VALUES.map((v) => v.value), 'data-page-layout', 'layout-imposter'];
/** @param {string} label */
const layoutOrder = (label) => {
  const i = LABEL_ORDER.indexOf(label);
  return i === -1 ? 999 : i;
};

/**
 * @typedef {object} GeneralRow
 * @property {string} attr
 * @property {string} id
 * @property {string[]} values
 * @property {boolean} bare
 * @property {string} on      where it applies (HTML)
 * @property {string} effect  what it does (HTML)
 * @property {string} [href]  dedicated page
 */

/**
 * General-purpose layout attributes: not a modifier of one layout, but read
 * on children or on any element. Values are read from the CSS.
 * @param {string} [root]
 * @returns {GeneralRow[]}
 */
export function buildGeneralRows(root = DEFAULT_ROOT) {
  const base = join(root, 'src', 'custom-elements');
  const la = join(base, 'layout-attributes.css');
  const text = join(base, 'layout-text', 'styles.css');
  const reel = join(base, 'layout-reel', 'styles.css');
  const vocab = readLayoutVocabulary(root);

  const areas = sortValues([...(vocab.get('area') ?? [])]);
  const real = areas.filter((a) => a in AREA_TEMPLATES);
  const orphan = areas.filter((a) => !(a in AREA_TEMPLATES));
  const areaList = real.map((a) => `<li><code>${esc(a)}</code>: ${AREA_TEMPLATES[/** @type {keyof typeof AREA_TEMPLATES} */ (a)]}</li>`).join('');
  const orphanNote = orphan.length
    ? `<p>${orphan.map((a) => `<code>${esc(a)}</code>`).join(', ')} also exist, but no VB template defines ${orphan.length > 1 ? 'those areas' : 'that area'}: use ${orphan.length > 1 ? 'them' : 'it'} only inside your own <code>grid-template-areas</code>, or the child lands in an implicit track.</p>`
    : '';
  const container = cssAttrValues(la, 'data-container');
  const measure = cssAttrValues(text, 'data-measure');
  const hint = cssAttrValues(reel, 'data-scroll-hint');
  const bleed = cssAttrValues(text, 'data-bleed');

  return [
    {
      attr: 'data-layout-area', id: 'modifier-area', values: areas, bare: false,
      on: 'A direct child of a grid with named areas',
      effect: `Places the child in a named grid area. Areas that VB templates define:<ul>${areaList}</ul>${orphanNote}Header, nav, main, aside and footer children of <code>data-page-layout</code> are placed by element type and need no attribute.`,
    },
    {
      attr: 'data-layout-order', id: 'modifier-order', values: sortValues([...(vocab.get('order') ?? [])]), bare: false,
      on: 'A child of a flex or auto-placed grid layout (stack, cluster, grid, split, switcher, sidebar, reel, media, regions)',
      effect: '<code>order</code>: <code>-1</code> moves the child first, <code>1</code> after its unordered siblings, <code>99</code> last. No effect on children placed by named area (<code>data-page-layout</code>, <code>main</code> sidebar-left/right) or on the header and footer of <code>regions</code>, which stay first and last. Visual only: see <a href="#accessibility">Accessibility</a>.',
    },
    {
      attr: 'data-layout-sticky', id: 'modifier-sticky', values: [], bare: true,
      on: '<code>nav</code> / <code>aside</code> children of <code>data-layout="sidebar"</code> or <code>&lt;layout-sidebar&gt;</code>; <code>header</code> / <code>nav</code> / <code>aside</code> children of <code>data-page-layout</code>',
      effect: 'Sticky with its own scroll (header: sticky at the top). Active only when the page opts in with <a href="/docs/attributes/data-sticky/"><code>&lt;html data-sticky&gt;</code></a>, which keeps <code>--sticky-offset</code> in sync.',
    },
    {
      attr: 'data-layout-bleed', id: 'modifier-bleed', values: [], bare: true,
      on: 'A direct child of <code>data-page-layout</code>',
      effect: 'Spans every template column (<code>grid-column: 1 / -1</code>). Does nothing elsewhere; inside reading containers use <a href="#data-bleed"><code>data-bleed</code></a>.',
    },
    {
      attr: 'data-bleed', id: 'data-bleed', values: bleed.values, bare: true,
      on: 'A direct child of <code>data-layout="prose"</code> / <code>&lt;layout-text&gt;</code>, <code>data-layout="columns"</code> / <code>&lt;layout-columns&gt;</code> or <code>article[data-measure]</code>; also <code>section.hero</code>',
      effect: 'Breaks out of the reading measure to the full inline size of the nearest query container (<code>100cqi</code>), spanning every column in a multi-column flow. On <code>section.hero</code> the background extends behind a transparent site header instead.',
    },
    {
      attr: 'data-container', id: 'data-container', values: container.values, bare: container.bare, href: '/docs/attributes/data-container/',
      on: 'Any element',
      effect: '<code>container-type: inline-size</code>; <code>card</code>, <code>panel</code> and <code>media</code> also name the container. The escape hatch for <code>main</code>/<code>article</code>/<code>section</code>/<code>aside</code> children of cluster, reel, centered cover and start/center/end stack, which otherwise drop <code>container-type</code> so they size to their content, and of a <code>data-layout-subgrid</code> grid, where they drop it so they can be subgrids.',
    },
    {
      attr: 'data-measure', id: 'data-measure', values: measure.values, bare: measure.bare,
      on: '<code>&lt;article&gt;</code>',
      effect: 'Reading width only (centered, <code>--measure-*</code>: 45 / 65 / 80ch; bare = normal), without the vertical rhythm of <code>data-layout="prose"</code>.',
    },
    {
      attr: 'data-scroll-hint', id: 'data-scroll-hint', values: hint.values, bare: hint.bare,
      on: '<code>data-layout="reel"</code> / <code>&lt;layout-reel&gt;</code>',
      effect: 'Fades the inline edges to hint at overflow (mirrored in RTL). Where scroll-driven animations are supported each edge fades only while there is more content that way. <code>start</code>: only the end edge fades.',
    },
  ];
}

/**
 * Attribute-index entries for every modifier and general-purpose attribute,
 * each pointing at its anchored row on the hub. Plain-text descriptions (the
 * index escapes them).
 * @param {string} [root]
 * @returns {{name: string, type: string, href: string, description: string}[]}
 */
export function modifierIndexItems(root = DEFAULT_ROOT) {
  const { rows } = buildModifierRows(root);
  const items = rows.map((r) => ({
    name: r.attr,
    type: 'layout',
    href: `${HUB}#${r.id}`,
    description: `data-layout modifier for ${r.uses.map((u) => u.layout).join(', ')}${r.presence ? ' (presence)' : `: ${r.values.filter(Boolean).join(', ')}`}`,
  }));
  for (const g of buildGeneralRows(root)) {
    items.push({
      name: g.attr,
      type: 'layout',
      href: g.href ?? `${HUB}#${g.id}`,
      description: `Layout utility${g.values.length ? `: ${g.values.filter(Boolean).join(', ')}` : ' (presence)'}. See the data-layout reference.`,
    });
  }
  return items.sort((a, b) => a.name.localeCompare(b.name));
}

// ---------------------------------------------------------------------------
// Rendering (used by site/plugins/generate-layout-reference.js)
// ---------------------------------------------------------------------------

/** @param {string[]} vals */
const codeList = (vals) => vals.filter(Boolean).map((v) => `<code>${esc(v)}</code>`).join(' &middot; ');

/** @param {string} label */
function layoutLink(label) {
  const v = LAYOUT_VALUES.find((x) => x.value === label);
  if (v) return `<a href="${v.href ?? `#layout-${v.value}`}"><code>${esc(label)}</code></a>`;
  if (label === 'data-page-layout') return '<a href="/docs/attributes/data-page-layout/"><code>data-page-layout</code></a>';
  const e = ELEMENT_ONLY.find((x) => x.element === label);
  if (e) return `<a href="${e.href}"><code>&lt;${esc(label)}&gt;</code></a>`;
  return `<code>${esc(label)}</code>`;
}

/**
 * @param {'twin'|'attribute'} kind
 * @returns {string}
 */
export function renderValueTable(kind) {
  const rows = LAYOUT_VALUES.filter((v) => v.kind === kind);
  if (kind === 'twin') {
    const body = rows.map((v) => `<tr id="layout-${v.value}"><td><code>${v.value}</code></td><td>${v.pattern}</td><td>${v.responsive}</td><td><a href="${v.href}"><code>&lt;${v.element}&gt;</code></a></td></tr>`).join('\n');
    return `<table class="props-table"><thead><tr><th scope="col">Value</th><th scope="col">Pattern</th><th scope="col">Responsive</th><th scope="col">Element twin</th></tr></thead><tbody>\n${body}\n</tbody></table>`;
  }
  const body = rows.map((v) => `<tr id="layout-${v.value}"><td><code>${v.value}</code></td><td>${v.pattern}</td><td>${v.on}</td><td>${v.defaults}</td><td>${v.responsive}</td></tr>`).join('\n');
  return `<table class="props-table"><thead><tr><th scope="col">Value</th><th scope="col">Pattern</th><th scope="col">Use on</th><th scope="col">Defaults</th><th scope="col">Responsive</th></tr></thead><tbody>\n${body}\n</tbody></table>`;
}

/** @returns {string} */
export function renderElementOnlyTable() {
  const body = ELEMENT_ONLY.map((e) => `<tr><td><a href="${e.href}"><code>&lt;${e.element}&gt;</code></a></td><td>${e.note}</td></tr>`).join('\n');
  return `<table class="props-table"><thead><tr><th scope="col">Element</th><th scope="col">Attribute form</th></tr></thead><tbody>\n${body}\n</tbody></table>`;
}

/**
 * @param {string} [root]
 * @returns {string}
 */
export function renderModifierTable(root = DEFAULT_ROOT) {
  const { rows } = buildModifierRows(root);
  const body = rows.map((r) => {
    const bareUses = r.uses.filter((u) => u.bare);
    let bareCell;
    if (r.presence) bareCell = 'Presence only';
    else if (bareUses.length) bareCell = bareUses.map((u) => `${esc(u.layout)}: bare = <code>${esc(u.bareValue ?? '')}</code>`).join('<br>');
    else bareCell = '&mdash;';
    const defaults = [...new Set(r.uses.map((u) => u.default ?? ''))];
    const defCell = r.presence ? 'Off'
      : defaults.length === 1 ? (defaults[0] ? `<code>${esc(defaults[0])}</code>` : (bareUses.length ? 'Off' : '&mdash;'))
      : 'Per layout';
    const uses = r.uses.map((u) => {
      const parts = [layoutLink(u.layout)];
      if (u.child) parts.push('(on a child)');
      if (!r.presence && u.values.join() !== r.values.join()) parts.push(`(${codeList(u.values)}${u.bare && u.values.length ? ' or bare' : ''})`);
      if (!r.presence && defaults.length > 1) parts.push(u.default ? `default <code>${esc(u.default)}</code>` : u.bareValue ? 'off unless set' : '');
      return `<li>${parts.filter(Boolean).join(' ')}: ${esc(u.meaning ?? '')}</li>`;
    }).join('');
    return `<tr id="${r.id}"><th scope="row"><a href="#${r.id}"><code>${r.attr}</code></a></th><td>${r.presence ? 'Boolean' : codeList(r.values)}</td><td>${bareCell}</td><td>${defCell}</td><td><ul>${uses}</ul></td></tr>`;
  }).join('\n');
  return `<table class="props-table" data-layout-reference="modifiers"><thead><tr><th scope="col">Modifier</th><th scope="col">Values</th><th scope="col">Bare form</th><th scope="col">Default</th><th scope="col">Layouts and meaning</th></tr></thead><tbody>\n${body}\n</tbody></table>`;
}

/**
 * @param {string} [root]
 * @returns {string}
 */
export function renderGeneralTable(root = DEFAULT_ROOT) {
  const body = buildGeneralRows(root).map((g) => {
    const vals = g.values.length
      ? `${codeList(g.values)}${g.bare ? ' or bare' : ''}`
      : 'Boolean';
    const name = g.href
      ? `<a href="#${g.id}"><code>${g.attr}</code></a> (<a href="${g.href}">page</a>)`
      : `<a href="#${g.id}"><code>${g.attr}</code></a>`;
    return `<tr id="${g.id}"><th scope="row">${name}</th><td>${vals}</td><td>${g.on}</td><td>${g.effect}</td></tr>`;
  }).join('\n');
  return `<table class="props-table" data-layout-reference="general"><thead><tr><th scope="col">Attribute</th><th scope="col">Values</th><th scope="col">Applies to</th><th scope="col">Effect</th></tr></thead><tbody>\n${body}\n</tbody></table>`;
}
