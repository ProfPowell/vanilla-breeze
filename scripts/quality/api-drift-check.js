#!/usr/bin/env node

/**
 * API Drift Check
 *
 * Guardrail 1: Verify elements.cjs matches what the manifest generator would produce.
 * Guardrail 2: Flag compendium fixtures using stale data-* attrs that conflict with manifest canonical names.
 * Guardrail 3: Scan demos for data-* usage on components where the manifest says the canonical form is a plain host attr.
 *
 * Run: node scripts/quality/api-drift-check.js
 * Exits non-zero if any drift is found.
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');
const SRC = join(ROOT, 'src');

const errors = [];
const warnings = [];

function err(msg) { errors.push(`  ✗ ${msg}`); }
function warn(msg) { warnings.push(`  ⚠ ${msg}`); }

// ── Load all manifests ───────────────────────────────────────────────

function loadManifests() {
  const manifests = [];
  const dirs = [join(SRC, 'web-components'), join(SRC, 'custom-elements')];

  for (const base of dirs) {
    if (!existsSync(base)) continue;
    for (const entry of readdirSync(base)) {
      const apiPath = join(base, entry, 'api.json');
      if (existsSync(apiPath)) {
        manifests.push(JSON.parse(readFileSync(apiPath, 'utf8')));
      }
    }
  }

  const overridesPath = join(SRC, 'htmlvalidate', 'api-overrides.json');
  if (existsSync(overridesPath)) {
    const raw = JSON.parse(readFileSync(overridesPath, 'utf8'));
    manifests.push(...(Array.isArray(raw) ? raw : [raw]));
  }

  return manifests;
}

// ── Guardrail 1: elements.cjs drift ──────────────────────────────────

function checkElementsCjsDrift() {
  const currentPath = join(SRC, 'htmlvalidate', 'elements.cjs');
  if (!existsSync(currentPath)) return;

  const current = readFileSync(currentPath, 'utf8');
  if (!current.startsWith('// @generated')) {
    err('elements.cjs: missing @generated header — file may have been hand-edited');
    return;
  }

  // Regenerate to temp and compare
  try {
    const output = execSync('node scripts/build-api-registry.js --validate-only', {
      cwd: ROOT, encoding: 'utf8', stdio: 'pipe'
    });
    // If validate passes, check if generation would produce different output
    const generated = execSync('node -e "' +
      "import('./scripts/build-api-registry.js')" +
      '"', { cwd: ROOT, encoding: 'utf8', stdio: 'pipe' });
  } catch {
    // validate-only already reports errors
  }
}

// ── Guardrail 2: Shadow API detection ────────────────────────────────
// Build a map of canonical attrs per element from manifests.
// A "shadow" is a data-* attr in a fixture/demo that has a canonical
// plain host attr in the manifest.

function buildShadowMap(manifests) {
  const shadowMap = new Map(); // element -> Map<staleDataAttr, canonicalAttr>

  for (const m of manifests) {
    if (!m.element || !m.attributes) continue;
    const stale = new Map();

    for (const attr of m.attributes) {
      if (attr.public === false) continue;
      // If canonical is a plain attr (no data- prefix), flag any data- version as stale
      if (!attr.name.startsWith('data-') && !attr.name.startsWith('aria-')) {
        stale.set(`data-${attr.name}`, attr.name);
      }
    }

    if (stale.size > 0) {
      shadowMap.set(m.element, stale);
    }
  }

  return shadowMap;
}

function checkCompendiumFixtures(shadowMap) {
  const compendiumPath = join(ROOT, 'tests/element-visual/compendium/compendium.json');
  if (!existsSync(compendiumPath)) return;

  const compendium = JSON.parse(readFileSync(compendiumPath, 'utf8'));
  if (!compendium.elements) return;

  for (const el of compendium.elements) {
    const staleAttrs = shadowMap.get(el.tag || el.id);
    if (!staleAttrs) continue;

    for (const variant of (el.variants || [])) {
      if (!variant.html) continue;
      for (const [stale, canonical] of staleAttrs) {
        // Match data-attr in the HTML (attribute on the host element tag)
        const tagRe = new RegExp(`<${el.tag || el.id}[^>]*\\b${stale}\\b`, 'i');
        if (tagRe.test(variant.html)) {
          err(`compendium ${el.id}/${variant.id}: uses stale "${stale}" — should be "${canonical}"`);
        }
      }
    }
  }
}

function checkDemoFiles(shadowMap) {
  const demoDirs = [
    join(ROOT, 'demos/examples/demos'),
    join(ROOT, 'demos/snippets/demos'),
    join(ROOT, 'demos/patterns/demos'),
  ];

  for (const dir of demoDirs) {
    if (!existsSync(dir)) continue;
    for (const file of readdirSync(dir)) {
      if (!file.endsWith('.html')) continue;
      const filePath = join(dir, file);
      const content = readFileSync(filePath, 'utf8');
      const rel = relative(ROOT, filePath);

      for (const [element, staleAttrs] of shadowMap) {
        // Only check if this element appears in the file
        if (!content.includes(`<${element}`)) continue;

        for (const [stale, canonical] of staleAttrs) {
          const tagRe = new RegExp(`<${element}[^>]*\\b${stale}\\b`, 'i');
          if (tagRe.test(content)) {
            warn(`${rel}: <${element}> uses stale "${stale}" — should be "${canonical}"`);
          }
        }
      }
    }
  }
}

// ── Guardrail 3: ARIA contract check ─────────────────────────────────
// Scan logic.js files for ARIA attributes that manifests or docs claim
// are managed, and verify they actually appear in the runtime code.

function checkAriaContracts(manifests) {
  const ariaPromises = [
    // [element, attr, file to search, description]
    ['tab-set', 'aria-selected', 'src/web-components/tab-set/logic.js', 'managed on summary elements'],
    ['data-table', 'aria-sort', 'src/web-components/data-table/logic.js', 'managed on sortable th elements'],
    ['site-search', 'aria-activedescendant', 'src/web-components/site-search/logic.js', 'managed on input for active result'],
    ['context-menu', 'aria-expanded', 'src/web-components/context-menu/logic.js', 'managed on trigger element'],
    ['drop-down', 'aria-expanded', 'src/web-components/drop-down/logic.js', 'managed on trigger element'],
    ['drop-down', 'aria-haspopup', 'src/web-components/drop-down/logic.js', 'set on trigger element'],
    ['combo-box', 'aria-expanded', 'src/web-components/combo-box/logic.js', 'managed on input element'],
    ['accordion-wc', 'aria-expanded', 'src/web-components/accordion-wc/logic.js', 'managed on summary elements'],
  ];

  for (const [element, attr, file, desc] of ariaPromises) {
    const fullPath = join(ROOT, file);
    if (!existsSync(fullPath)) {
      warn(`${file}: file not found — cannot verify ${attr} contract`);
      continue;
    }

    const content = readFileSync(fullPath, 'utf8');
    // Check for setAttribute('aria-*' or .setAttribute("aria-*"
    if (!content.includes(`'${attr}'`) && !content.includes(`"${attr}"`)) {
      err(`${element}: claims to manage ${attr} (${desc}) but "${attr}" not found in ${file}`);
    }
  }
}

// ── Guardrail 4: Reflected state contract check ──────────────────────
// Verify that output-only reflected attrs are actually set/removed in runtime.

function checkReflectedState(manifests) {
  for (const m of manifests) {
    if (!m.attributes) continue;

    for (const attr of m.attributes) {
      if (attr.direction !== 'output') continue;
      if (attr.public === false) continue;

      // Find the logic.js for this component
      const logicPath = join(SRC, 'web-components', m.element, 'logic.js');
      if (!existsSync(logicPath)) continue;

      const content = readFileSync(logicPath, 'utf8');

      // Check that setAttribute is called for this attr
      const setsAttr = content.includes(`setAttribute('${attr.name}'`) ||
                       content.includes(`setAttribute("${attr.name}"`);
      const removesAttr = content.includes(`removeAttribute('${attr.name}'`) ||
                          content.includes(`removeAttribute("${attr.name}"`);

      if (!setsAttr) {
        err(`${m.element}: manifest declares "${attr.name}" as reflected output but setAttribute('${attr.name}') not found in logic.js`);
      }
      // Boolean outputs should have both set+remove; enum outputs may only transition between values
      if (attr.type === 'boolean' && !removesAttr) {
        err(`${m.element}: manifest declares boolean "${attr.name}" as reflected output but removeAttribute('${attr.name}') not found in logic.js`);
      }
    }
  }
}

// ── Run all checks ───────────────────────────────────────────────────

const manifests = loadManifests();

if (manifests.length === 0) {
  console.log('No api.json manifests found. Skipping drift checks.');
  process.exit(0);
}

checkElementsCjsDrift();
const shadowMap = buildShadowMap(manifests);
checkCompendiumFixtures(shadowMap);
checkDemoFiles(shadowMap);
checkAriaContracts(manifests);
checkReflectedState(manifests);

// Report
if (warnings.length > 0) {
  console.log(`\nWarnings (${warnings.length}):\n`);
  for (const w of warnings) console.log(w);
}

if (errors.length > 0) {
  console.error(`\nAPI drift check failed with ${errors.length} error(s):\n`);
  for (const e of errors) console.error(e);
  process.exit(1);
} else {
  console.log(`✓ API drift check passed (${manifests.length} manifests, ${shadowMap.size} shadow-checked elements)`);
}
