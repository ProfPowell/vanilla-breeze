#!/usr/bin/env node

/**
 * Component Files Check
 *
 * Ensures every web component directory with a JS entry file
 * also has the required companion files: api.json and static.html.
 *
 * Entry file detection: logic.js takes precedence, then <dirname>.js.
 * Directories without either are silently skipped.
 *
 * Run: node scripts/quality/component-files-check.js
 * Exits non-zero if any required file is missing.
 */

import { readdirSync, readFileSync, statSync, existsSync } from 'fs';
import { join, resolve, basename } from 'path';

const ROOT = resolve(import.meta.dirname, '../..');
const WC_DIR = join(ROOT, 'src', 'web-components');
const OVERRIDES_PATH = join(ROOT, 'src', 'htmlvalidate', 'api-overrides.json');

const REQUIRED_FILES = ['api.json', 'static.html'];

// Elements registered via the api-overrides.json sidecar don't need a
// local api.json file in their component directory.
let overrideElements = new Set();
try {
  const overrides = JSON.parse(readFileSync(OVERRIDES_PATH, 'utf-8'));
  overrideElements = new Set(overrides.map(o => o.element));
} catch {
  // No overrides file \u2014 every component must have its own api.json
}

const errors = [];
let componentCount = 0;

for (const entry of readdirSync(WC_DIR)) {
  const dir = join(WC_DIR, entry);

  // Skip non-directories
  if (!statSync(dir).isDirectory()) continue;

  // Detect JS entry file: logic.js first, then <dirname>.js
  const hasLogic = existsSync(join(dir, 'logic.js'));
  const hasDirnameJs = existsSync(join(dir, `${entry}.js`));

  if (!hasLogic && !hasDirnameJs) continue;

  // This is a component directory
  componentCount++;

  for (const required of REQUIRED_FILES) {
    if (existsSync(join(dir, required))) continue;
    // api.json may live in api-overrides.json instead of the component dir
    if (required === 'api.json' && overrideElements.has(entry)) continue;
    errors.push(`  \u2717 ${entry}: missing ${required}`);
  }
}

// Report
console.log('Component files check');

if (errors.length > 0) {
  for (const e of errors) console.error(e);

  const affectedComponents = new Set(
    errors.map(e => e.match(/\u2717 (.+?):/)?.[1]).filter(Boolean)
  );
  console.error(`\n${errors.length} error${errors.length === 1 ? '' : 's'} in ${affectedComponents.size} component${affectedComponents.size === 1 ? '' : 's'}`);
  process.exit(1);
} else {
  console.log(`  \u2713 All ${componentCount} components have required files (api.json, static.html)`);
}
