/**
 * @file generate-glossary.js
 * @description Per-file Cook plugin. Replaces the `<!-- vb:glossary-body -->`
 * sentinel inside site/src/pages/glossary/index.html with HTML rendered
 * from site/src/_data/vocabulary.json (sorted alphabetically, grouped by
 * first letter, `<dl><dt id="term-{id}"><dfn>...</dfn></dt><dd>...</dd></dl>`
 * inside `<section class="glossary-section" id="glossary-{letter}">`).
 *
 * The output structure preserves the light-DOM contract that
 * src/web-components/glossary-index/logic.js depends on (search filter +
 * scroll-spy traverse `.glossary-section, section[id^="glossary-"]` and
 * `dt`/`dd` siblings).
 *
 * Companion plugin: generate-definitions-json.js (after-pass) emits
 * /definitions.json and the popover script + CSS.
 *
 * Spec: admin/shipped/glossary-system.md
 */

import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const VOCAB_PATH = resolve(__dirname, '../src/_data/vocabulary.json');

const SENTINEL = /<!--\s*vb:glossary-body\s*-->/;

let vocabularyCache = null;
async function loadVocabulary() {
  if (vocabularyCache) return vocabularyCache;
  const raw = await readFile(VOCAB_PATH, 'utf-8');
  vocabularyCache = JSON.parse(raw);
  return vocabularyCache;
}

function escHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function groupByLetter(vocab) {
  const concepts = [...(vocab.concepts || [])]
    .filter((c) => c['@id'] && c['skos:prefLabel'])
    .sort((a, b) => a['skos:prefLabel']
      .toLowerCase()
      .localeCompare(b['skos:prefLabel'].toLowerCase()));

  const groups = new Map();
  for (const c of concepts) {
    const letter = c['skos:prefLabel'].charAt(0).toUpperCase();
    if (!groups.has(letter)) groups.set(letter, []);
    groups.get(letter).push(c);
  }
  return groups;
}

function renderJumpNav(groups) {
  const items = [...groups.keys()]
    .map((L) => `        <li><a href="#glossary-${L.toLowerCase()}">${escHtml(L)}</a></li>`)
    .join('\n');
  return `    <nav class="glossary-jump" aria-label="Jump to letter">
      <ol class="inline">
${items}
      </ol>
    </nav>`;
}

function renderDt(concept) {
  const id = concept['@id'];
  const label = concept['skos:prefLabel'];
  return `        <dt id="term-${escHtml(id)}"><dfn>${escHtml(label)}</dfn></dt>`;
}

function renderDd(concept, byId) {
  const def = concept['skos:definition'] || '';
  const altLabels = concept['skos:altLabel'];
  const broader = concept['skos:broader'];
  const related = concept['skos:related'] || [];

  const parts = [];
  if (Array.isArray(altLabels) && altLabels.length) {
    parts.push(`Also known as: ${altLabels.map(escHtml).join(', ')}`);
  } else if (typeof altLabels === 'string' && altLabels) {
    parts.push(`Also known as: ${escHtml(altLabels)}`);
  }
  if (broader) {
    const list = Array.isArray(broader) ? broader : [broader];
    const links = list
      .map((b) => {
        const label = byId.get(b)?.['skos:prefLabel'] || b;
        return `<a href="#term-${escHtml(b)}" rel="up" data-relation="skos:broader" data-concept="${escHtml(b)}">${escHtml(label)}</a>`;
      })
      .join(', ');
    parts.push(`Broader: ${links}`);
  }
  if (Array.isArray(related) && related.length) {
    const links = related
      .map((r) => {
        const label = byId.get(r)?.['skos:prefLabel'] || r;
        return `<a href="#term-${escHtml(r)}" rel="related" data-relation="skos:related" data-concept="${escHtml(r)}">${escHtml(label)}</a>`;
      })
      .join(', ');
    parts.push(`Related: ${links}`);
  }

  const relations = parts.length
    ? `\n          <p data-relations><small>${parts.join(' &middot; ')}</small></p>`
    : '';

  return `        <dd>
          <p>${escHtml(def)}</p>${relations}
        </dd>`;
}

function renderSection(letter, concepts, byId) {
  const lower = letter.toLowerCase();
  const dlInner = concepts
    .map((c) => `${renderDt(c)}\n${renderDd(c, byId)}`)
    .join('\n');
  return `    <section class="glossary-section" id="glossary-${lower}" aria-labelledby="glossary-heading-${lower}">
      <h2 id="glossary-heading-${lower}">${escHtml(letter)}</h2>
      <dl>
${dlInner}
      </dl>
    </section>`;
}

function renderGlossaryBody(vocab) {
  const groups = groupByLetter(vocab);
  const byId = new Map((vocab.concepts || []).map((c) => [c['@id'], c]));
  const nav = renderJumpNav(groups);
  const sections = [...groups.entries()]
    .map(([letter, concepts]) => renderSection(letter, concepts, byId))
    .join('\n\n');
  return `${nav}\n\n${sections}`;
}

export class GenerateGlossary {
  constructor({ file }) {
    this.file = file;
  }

  async init() {
    const file = this.file;
    if (!file?.src || !file.path?.endsWith('.html')) return;
    if (!file.path.includes('glossary/index')) return;
    if (!SENTINEL.test(file.src)) return;

    const vocab = await loadVocabulary();
    const body  = renderGlossaryBody(vocab);
    file.src = file.src.replace(SENTINEL, body);
  }
}
