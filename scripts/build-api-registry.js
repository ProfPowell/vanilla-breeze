#!/usr/bin/env node

/**
 * Build API Registry
 *
 * Discovers api.json manifests across all component directories,
 * validates them against the schema, and generates:
 *
 *   1. src/htmlvalidate/elements.cjs  — html-validate element definitions
 *   2. site/src/_data/apiRegistry.js  — 11ty data file for doc templates
 *   3. Drift report to stdout
 *
 * Modes:
 *   --validate-only   Schema-check + drift report, no file generation
 *
 * Run: node scripts/build-api-registry.js
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC = join(ROOT, 'src');
const validateOnly = process.argv.includes('--validate-only');

// ── Discover api.json files ──────────────────────────────────────────

function discoverManifests() {
  const manifests = [];
  const dirs = [
    join(SRC, 'web-components'),
    join(SRC, 'custom-elements'),
  ];

  for (const base of dirs) {
    if (!existsSync(base)) continue;
    for (const entry of readdirSync(base)) {
      const apiPath = join(base, entry, 'api.json');
      if (existsSync(apiPath)) {
        manifests.push(apiPath);
      }
    }
  }

  // Fallback overrides for elements without component directories
  const overridesPath = join(SRC, 'htmlvalidate', 'api-overrides.json');
  if (existsSync(overridesPath)) {
    manifests.push(overridesPath);
  }

  return manifests;
}

// ── Schema validation ────────────────────────────────────────────────

const VALID_KINDS = ['native', 'aria', 'host-api', 'data', 'class'];
const VALID_PURPOSES = ['semantic-state', 'config', 'visual-variant', 'output-state', 'internal-hook'];
const VALID_DIRECTIONS = ['input', 'output', 'both'];
const VALID_TYPES = ['boolean', 'string', 'number', 'enum'];
const VALID_ELEMENT_TYPES = ['web-component', 'custom-element', 'native'];
const ELEMENT_NAME_RE = /^[a-z][a-z0-9-]*$/;

function validateManifest(manifest, filePath) {
  const errors = [];
  const rel = relative(ROOT, filePath);

  function err(path, msg) {
    errors.push(`${rel} ${path}: ${msg}`);
  }

  // Top-level required
  if (!manifest.element) err('$.element', 'required');
  if (!manifest.type) err('$.type', 'required');
  if (!manifest.attributes) err('$.attributes', 'required');

  // element name format
  if (manifest.element && !ELEMENT_NAME_RE.test(manifest.element)) {
    err('$.element', `invalid format "${manifest.element}"`);
  }

  // type enum
  if (manifest.type && !VALID_ELEMENT_TYPES.includes(manifest.type)) {
    err('$.type', `invalid "${manifest.type}" (expected: ${VALID_ELEMENT_TYPES.join(', ')})`);
  }

  // htmlvalidate object
  if (manifest.htmlvalidate) {
    const hv = manifest.htmlvalidate;
    if (hv.permittedContent && !Array.isArray(hv.permittedContent)) {
      err('$.htmlvalidate.permittedContent', 'must be array');
    }
  }

  // attributes array
  if (manifest.attributes) {
    if (!Array.isArray(manifest.attributes)) {
      err('$.attributes', 'must be array');
    } else {
      const seen = new Set();
      for (let i = 0; i < manifest.attributes.length; i++) {
        const attr = manifest.attributes[i];
        const p = `$.attributes[${i}]`;

        if (!attr.name) err(p, 'name required');
        if (!attr.kind) err(p, 'kind required');

        if (attr.name) {
          if (seen.has(attr.name)) err(`${p}.name`, `duplicate "${attr.name}"`);
          seen.add(attr.name);
        }
        if (attr.kind && !VALID_KINDS.includes(attr.kind)) {
          err(`${p}.kind`, `invalid "${attr.kind}"`);
        }
        if (attr.purpose && !VALID_PURPOSES.includes(attr.purpose)) {
          err(`${p}.purpose`, `invalid "${attr.purpose}"`);
        }
        if (attr.direction && !VALID_DIRECTIONS.includes(attr.direction)) {
          err(`${p}.direction`, `invalid "${attr.direction}"`);
        }
        if (attr.type && !VALID_TYPES.includes(attr.type)) {
          err(`${p}.type`, `invalid "${attr.type}"`);
        }
        if (attr.type === 'enum' && (!attr.values || !Array.isArray(attr.values))) {
          err(`${p}.values`, 'required when type is enum');
        }
        if (attr.values && attr.type !== 'enum') {
          err(`${p}.values`, 'only allowed when type is enum');
        }
      }
    }
  }

  // childAttributes array
  if (manifest.childAttributes) {
    if (!Array.isArray(manifest.childAttributes)) {
      err('$.childAttributes', 'must be array');
    } else {
      for (let i = 0; i < manifest.childAttributes.length; i++) {
        const ca = manifest.childAttributes[i];
        const p = `$.childAttributes[${i}]`;
        if (!ca.name) err(p, 'name required');
        if (!ca.on) err(p, 'on required');
        if (ca.type && !VALID_TYPES.includes(ca.type)) {
          err(`${p}.type`, `invalid "${ca.type}"`);
        }
        if (ca.type === 'enum' && (!ca.values || !Array.isArray(ca.values))) {
          err(`${p}.values`, 'required when type is enum');
        }
      }
    }
  }

  // structure array
  if (manifest.structure) {
    if (!Array.isArray(manifest.structure)) {
      err('$.structure', 'must be array');
    } else {
      for (let i = 0; i < manifest.structure.length; i++) {
        const child = manifest.structure[i];
        const p = `$.structure[${i}]`;
        if (!child.element) err(p, 'element required');
        if (!child.description) err(p, 'description required');
      }
    }
  }

  // events array
  if (manifest.events) {
    if (!Array.isArray(manifest.events)) {
      err('$.events', 'must be array');
    } else {
      for (let i = 0; i < manifest.events.length; i++) {
        if (!manifest.events[i].name) {
          err(`$.events[${i}]`, 'name required');
        }
      }
    }
  }

  return errors;
}

// ── Parse overrides file (array of manifests) ────────────────────────

function loadManifests(paths) {
  const all = [];       // { manifest, filePath }
  const errors = [];

  for (const p of paths) {
    let raw;
    try {
      raw = JSON.parse(readFileSync(p, 'utf8'));
    } catch (e) {
      errors.push(`${relative(ROOT, p)}: invalid JSON — ${e.message}`);
      continue;
    }

    // api-overrides.json is an array of manifests
    const items = Array.isArray(raw) ? raw : [raw];
    for (const manifest of items) {
      const errs = validateManifest(manifest, p);
      errors.push(...errs);
      all.push({ manifest, filePath: p });
    }
  }

  // Check for duplicate element names
  const seen = new Map();
  for (const { manifest, filePath } of all) {
    if (!manifest.element) continue;
    if (seen.has(manifest.element)) {
      errors.push(`${relative(ROOT, filePath)}: duplicate element "${manifest.element}" (also in ${relative(ROOT, seen.get(manifest.element))})`);
    }
    seen.set(manifest.element, filePath);
  }

  return { manifests: all.map(m => m.manifest), errors };
}

// ── Generate elements.cjs ────────────────────────────────────────────

function generateElementsCjs(manifests) {
  // Group by category for section comments
  const customElements = [];
  const webComponents = [];
  const docComponents = [];
  const other = [];

  for (const m of manifests) {
    const name = m.element;
    if (name.startsWith('layout-') || ['brand-mark', 'dl', 'dl-item', 'form-field',
      'loading-spinner', 'mobile-menu', 'progress-ring', 'site-legal', 'site-tools', 'status-message', 'text-divider',
      'user-avatar', 'token-swatch', 'layout-badge'].includes(name)) {
      if (name.startsWith('layout-')) customElements.unshift(m);
      else customElements.push(m);
    } else if (['browser-window', 'code-block', 'vb-composer', 'vb-canvas', 'vb-inspector'].includes(name)) {
      docComponents.push(m);
    } else {
      webComponents.push(m);
    }
  }

  const lines = ['// @generated from api.json manifests — do not edit by hand', 'module.exports = {'];

  function writeSection(label, items) {
    if (items.length === 0) return;
    lines.push(`  // ── ${label} ${'─'.repeat(Math.max(0, 60 - label.length))}`);
    lines.push('');
    for (const m of items) {
      writeElement(m);
    }
  }

  function writeElement(m) {
    const props = [];

    // flow / phrasing / void
    const hv = m.htmlvalidate || {};
    if (hv.flow) props.push('    flow: true');
    if (hv.phrasing) props.push('    phrasing: true');
    if (hv.void) props.push('    void: true');

    // permittedContent
    if (hv.permittedContent) {
      const items = hv.permittedContent.map(s => `"${s}"`).join(', ');
      props.push(`    permittedContent: [${items}]`);
    }

    // attributes — only public, non-internal-hook
    const publicAttrs = (m.attributes || []).filter(a =>
      a.public !== false && a.purpose !== 'internal-hook'
    );

    if (publicAttrs.length > 0) {
      const attrLines = [];
      for (const attr of publicAttrs) {
        const obj = {};
        if (attr.required) obj.required = true;
        if (attr.type === 'boolean') obj.boolean = true;
        if (attr.type === 'enum' && attr.values) obj.enum = attr.values;

        const keys = Object.keys(obj);
        if (keys.length === 0) {
          attrLines.push(`      "${attr.name}": {}`);
        } else {
          const parts = [];
          if (obj.required) parts.push('required: true');
          if (obj.boolean) parts.push('boolean: true');
          if (obj.enum) parts.push(`enum: [${obj.enum.map(v => `"${v}"`).join(', ')}]`);
          attrLines.push(`      "${attr.name}": { ${parts.join(', ')} }`);
        }
      }
      props.push('    attributes: {\n' + attrLines.join(',\n') + '\n    }');
    }

    lines.push(`  "${m.element}": {`);
    lines.push(props.join(',\n'));
    lines.push('  },');
    lines.push('');
  }

  writeSection('Layout Custom Elements', customElements);
  writeSection('Other Custom Elements', other);
  writeSection('Web Components', webComponents);
  writeSection('Doc-Site Components', docComponents);

  lines.push('};');
  lines.push('');

  return lines.join('\n');
}

// ── Generate apiRegistry.js (11ty data file) ─────────────────────────

function generateApiRegistry(manifests) {
  const registry = {};
  for (const m of manifests) {
    registry[m.element] = m;
  }

  const lines = [
    '// @generated from api.json manifests — do not edit by hand',
    `export default ${JSON.stringify(registry, null, 2)};`,
    '',
  ];
  return lines.join('\n');
}

// ── Drift detection ──────────────────────────────────────────────────

function detectDrift(manifests) {
  const elementsCjsPath = join(SRC, 'htmlvalidate', 'elements.cjs');
  if (!existsSync(elementsCjsPath)) return [];

  // Parse elements.cjs top-level element keys (exactly 2-space indent before quote)
  const content = readFileSync(elementsCjsPath, 'utf8');
  const currentElements = new Set();
  const elementRe = /^  "([a-z][a-z0-9-]*)"\s*:\s*\{/gm;
  let match;
  while ((match = elementRe.exec(content))) {
    currentElements.add(match[1]);
  }

  const manifestElements = new Set(manifests.map(m => m.element));
  const report = [];

  // Elements in elements.cjs but not in any manifest
  for (const el of currentElements) {
    if (!manifestElements.has(el)) {
      report.push(`  ⚠ ${el} — in elements.cjs but no api.json manifest`);
    }
  }

  // Elements in manifests but not in elements.cjs (new additions)
  for (const el of manifestElements) {
    if (!currentElements.has(el)) {
      report.push(`  + ${el} — in manifest but not yet in elements.cjs`);
    }
  }

  return report;
}

// ── Main ─────────────────────────────────────────────────────────────

const paths = discoverManifests();

if (paths.length === 0) {
  console.log('No api.json manifests found. Nothing to do.');
  process.exit(0);
}

const { manifests, errors } = loadManifests(paths);

// Sort manifests by element name for stable output
manifests.sort((a, b) => {
  // Layout elements first, then other custom elements, then web components, then doc components
  const order = (m) => {
    if (m.element.startsWith('layout-')) return 0;
    if (m.type === 'custom-element') return 1;
    if (['browser-window', 'code-block', 'vb-composer', 'vb-canvas', 'vb-inspector'].includes(m.element)) return 3;
    return 2;
  };
  const oa = order(a), ob = order(b);
  if (oa !== ob) return oa - ob;
  return a.element.localeCompare(b.element);
});

// Report validation errors
if (errors.length > 0) {
  console.error(`\nAPI manifest validation failed with ${errors.length} error(s):\n`);
  for (const e of errors) {
    console.error(`  ✗ ${e}`);
  }
  console.error('');
}

// Drift report
const drift = detectDrift(manifests);
if (drift.length > 0) {
  console.log(`\nDrift report (${drift.length} item(s)):\n`);
  for (const line of drift) {
    console.log(line);
  }
  console.log('');
}

if (errors.length > 0) {
  process.exit(1);
}

if (validateOnly) {
  console.log(`✓ ${manifests.length} manifest(s) valid`);
  process.exit(0);
}

// Generate outputs
const elementsCjs = generateElementsCjs(manifests);
const elementsOut = join(SRC, 'htmlvalidate', 'elements.cjs');
writeFileSync(elementsOut, elementsCjs);
console.log(`✓ Generated ${relative(ROOT, elementsOut)} (${manifests.length} elements)`);

const registryJs = generateApiRegistry(manifests);
const registryOut = join(ROOT, 'site', 'src', '_data', 'apiRegistry.js');
writeFileSync(registryOut, registryJs);
console.log(`✓ Generated ${relative(ROOT, registryOut)}`);

console.log(`\nAPI registry build complete.`);
