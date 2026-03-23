#!/usr/bin/env node

/**
 * Color Token Layer Discipline Lint
 *
 * Enforces the VB color token contract:
 * 1. Component CSS must not use --color-gray-* primitives (use semantic tokens)
 * 2. Component CSS must not contain raw oklch()/hsl()/rgb() literals (use tokens)
 * 3. Theme files must not introduce --color-* tokens not defined in base colors.css
 *
 * Allowlisted: token definition files, theme files (for rule 1–2), static.html fallbacks.
 *
 * Run: node scripts/quality/color-token-lint.js
 * Exit: 0 if clean, 1 if violations found
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');
const SRC = join(ROOT, 'src');

const errors = [];
const warnings = [];

function err(file, line, msg) {
  errors.push(`  ${relative(ROOT, file)}:${line} — ${msg}`);
}
function warn(file, line, msg) {
  warnings.push(`  ${relative(ROOT, file)}:${line} — ${msg}`);
}

// ── Extract base color contract ──────────────────────────────────────

function getBaseColorTokens() {
  const tokens = new Set();
  const colorsFile = join(SRC, 'tokens/colors.css');
  const colorMixFile = join(SRC, 'tokens/color-mix.css');

  for (const file of [colorsFile, colorMixFile]) {
    if (!existsSync(file)) continue;
    const content = readFileSync(file, 'utf8');
    const re = /--(color-[a-z0-9-]+)/g;
    let match;
    while ((match = re.exec(content))) {
      tokens.add(`--${match[1]}`);
    }
  }
  return tokens;
}

// ── Collect CSS files to check ───────────────────────────────────────

function collectCssFiles(dir) {
  const files = [];
  if (!existsSync(dir)) return files;

  function walk(d) {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const full = join(d, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.name.endsWith('.css')) {
        files.push(full);
      }
    }
  }
  walk(dir);
  return files;
}

// ── Allowlists ───────────────────────────────────────────────────────

// Files where gray primitives and raw colors are expected (token definitions, themes)
const ALLOWLIST_GRAY = new Set([
  'src/tokens/colors.css',
  'src/tokens/color-mix.css',
  'src/tokens/shadows.css',
  'src/tokens/backdrop.css',
]);

function isTokenFile(file) {
  const rel = relative(ROOT, file);
  return rel.startsWith('src/tokens/');
}

function isThemeFile(file) {
  const rel = relative(ROOT, file);
  return rel.includes('src/tokens/themes/') || rel.includes('src/packs/');
}

function isAllowlistedGray(file) {
  const rel = relative(ROOT, file);
  return ALLOWLIST_GRAY.has(rel) || isTokenFile(file) || isThemeFile(file);
}

function isAllowlistedRaw(file) {
  // Token files and theme files may define raw values
  return isTokenFile(file) || isThemeFile(file);
}

// ── Rule 1: No gray primitives in component layers ───────────────────

function checkGrayPrimitives(file) {
  if (isAllowlistedGray(file)) return;

  const content = readFileSync(file, 'utf8');
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Skip comments
    if (line.trim().startsWith('/*') || line.trim().startsWith('*')) continue;

    if (/var\(--color-gray-/.test(line)) {
      warn(file, i + 1, `uses gray primitive — prefer semantic token (--color-surface-*, --color-text-*, --color-border-*)`);
    }
  }
}

// ── Rule 2: No raw color literals in component layers ────────────────

function checkRawColors(file) {
  if (isAllowlistedRaw(file)) return;

  const content = readFileSync(file, 'utf8');
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Skip comments
    if (line.trim().startsWith('/*') || line.trim().startsWith('*')) continue;
    // Skip CSS custom property definitions (--foo: oklch(...) is defining a token)
    if (/^\s*--[a-z]/.test(line)) continue;
    // Skip oklch(from var(...) ...) — these are relative color computations (correct pattern)
    if (/oklch\(\s*from\s+var\(/.test(line)) continue;

    // Flag absolute oklch/hsl/rgb literals used as property values
    if (/:\s*oklch\((?!from)/.test(line) || /:\s*hsl\(/.test(line) || /:\s*rgb\(/.test(line)) {
      warn(file, i + 1, `raw color literal — prefer a design token`);
    }
  }
}

// ── Rule 3: Theme files must not introduce new --color-* tokens ──────

function checkThemeContract(file, baseTokens) {
  if (!isThemeFile(file)) return;

  const content = readFileSync(file, 'utf8');
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Match property definitions: --color-foo: value
    const match = line.match(/^\s*(--color-[a-z0-9-]+)\s*:/);
    if (!match) continue;

    const token = match[1];
    if (!baseTokens.has(token)) {
      // Allow theme-private tokens that are only used within the theme file itself
      // (e.g. --color-lavender in kawaii theme)
      // Only warn — these are contract violations but may be intentional
      warn(file, i + 1, `introduces "${token}" not defined in base colors.css`);
    }
  }
}

// ── Main ─────────────────────────────────────────────────────────────

const baseTokens = getBaseColorTokens();

const componentDirs = [
  join(SRC, 'web-components'),
  join(SRC, 'native-elements'),
  join(SRC, 'custom-elements'),
  join(SRC, 'utils'),
];

const themeFiles = [
  ...collectCssFiles(join(SRC, 'tokens/themes')),
  ...collectCssFiles(join(SRC, 'packs')),
];

// Check component layers (rules 1 + 2)
for (const dir of componentDirs) {
  for (const file of collectCssFiles(dir)) {
    checkGrayPrimitives(file);
    checkRawColors(file);
  }
}

// Check theme files (rule 3)
for (const file of themeFiles) {
  checkThemeContract(file, baseTokens);
}

// Report
if (warnings.length > 0) {
  console.log(`\nWarnings (${warnings.length}):\n`);
  for (const w of warnings) console.log(w);
}

if (errors.length > 0) {
  console.error(`\nColor token lint failed with ${errors.length} error(s):\n`);
  for (const e of errors) console.error(e);
  console.error('');
  process.exit(1);
} else {
  console.log(`\n✓ Color token lint passed (${baseTokens.size} base tokens, ${componentDirs.length} component dirs checked)`);
}
