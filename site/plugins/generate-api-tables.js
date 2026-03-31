/**
 * @file generate-api-tables.js
 * @description Per-file plugin that replaces {{ attributeTable(...) }}, {{ structureTable(...) }},
 * {{ childAttributeTable(...) }}, and {{ eventsTable(...) }} macro calls with HTML tables
 * generated from apiRegistry.js data.
 *
 * Replaces the Nunjucks {% from "partials/attribute-table.njk" import ... %} macro pattern.
 * Runs as a Cook "default" plugin (per-file in the build loop).
 */
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load apiRegistry once
let registry = null;
async function getRegistry() {
  if (!registry) {
    const mod = await import(resolve(__dirname, '../data/apiRegistry.js'));
    registry = mod.default || mod;
  }
  return registry;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// --- Table generators (mirror the Nunjucks macros) ---

function renderAttributeTable(elementName, reg) {
  const api = reg[elementName];
  if (!api?.attributes?.length) return '';
  const rows = api.attributes
    .filter(a => a.public !== false && a.purpose !== 'internal-hook')
    .map(attr => {
      let values = '&mdash;';
      if (attr.type === 'enum' && attr.values) {
        values = attr.values.map(v => `<code>"${v}"</code>`).join(', ');
      } else if (attr.type) {
        values = attr.type;
      }
      const defaultVal = (attr.default !== undefined && attr.default !== null)
        ? `<code>${attr.default}</code>` : '&mdash;';
      const reflected = attr.direction === 'output' ? ' <small>(reflected)</small>' : '';
      const deprecated = attr.deprecated ? ' <em>(deprecated)</em>' : '';
      return `<tr><td><code>${attr.name}</code>${reflected}</td><td>${values}</td><td>${defaultVal}</td><td>${escapeHtml(attr.description)}${deprecated}</td></tr>`;
    }).join('\n');
  if (!rows) return '';
  return `<table class="props-table"><thead><tr><th>Attribute</th><th>Values</th><th>Default</th><th>Description</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function renderStructureTable(elementName, reg) {
  const api = reg[elementName];
  if (!api?.structure?.length) return '';
  const rows = api.structure.map(child => {
    const required = child.required !== false ? 'yes' : 'no';
    return `<tr><td><code>${escapeHtml(child.element)}</code></td><td>${required}</td><td>${escapeHtml(child.description)}</td></tr>`;
  }).join('\n');
  return `<table class="props-table"><thead><tr><th>Element</th><th>Required</th><th>Description</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function renderChildAttributeTable(elementName, reg) {
  const api = reg[elementName];
  if (!api?.childAttributes?.length) return '';
  const rows = api.childAttributes.map(attr => {
    let values = '&mdash;';
    if (attr.type === 'enum' && attr.values) {
      values = attr.values.map(v => `<code>"${v}"</code>`).join(', ');
    } else if (attr.type) {
      values = attr.type;
    }
    return `<tr><td><code>${attr.name}</code></td><td><code>${escapeHtml(attr.on)}</code></td><td>${values}</td><td>${escapeHtml(attr.description)}</td></tr>`;
  }).join('\n');
  return `<table class="props-table"><thead><tr><th>Attribute</th><th>On</th><th>Values</th><th>Description</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function renderEventsTable(elementName, reg) {
  const api = reg[elementName];
  if (!api?.events?.length) return '';
  const rows = api.events.map(evt => {
    const detail = evt.detail ? `<code>${escapeHtml(evt.detail)}</code>` : '&mdash;';
    return `<tr><td><code>${evt.name}</code></td><td>${detail}</td><td>${escapeHtml(evt.description)}</td></tr>`;
  }).join('\n');
  return `<table class="props-table"><thead><tr><th>Event</th><th>Detail</th><th>Description</th></tr></thead><tbody>${rows}</tbody></table>`;
}

const MACRO_MAP = {
  attributeTable: renderAttributeTable,
  structureTable: renderStructureTable,
  childAttributeTable: renderChildAttributeTable,
  eventsTable: renderEventsTable,
};

export class GenerateApiTables {
  constructor({ file }) {
    this.file = file;
  }

  async init() {
    // Early exit: no macro calls in this file
    if (!this.file.src.includes('Table(') && !this.file.src.includes('eventsTable(')) return;

    const reg = await getRegistry();

    // Remove {% from ... %} import lines
    this.file.src = this.file.src.replace(/\s*\{%[-\s]*from\s+"[^"]*attribute-table[^"]*"\s+import[^%]*%\}\s*/g, '\n');

    // Replace {{ macroName("element-name", apiRegistry) }} calls
    const macroPattern = /\{\{\s*(attributeTable|structureTable|childAttributeTable|eventsTable)\s*\(\s*"([^"]+)"\s*,\s*apiRegistry\s*\)\s*\}\}/g;

    this.file.src = this.file.src.replace(macroPattern, (match, macroName, elementName) => {
      const renderer = MACRO_MAP[macroName];
      if (!renderer) return match;
      return renderer(elementName, reg);
    });
  }
}
