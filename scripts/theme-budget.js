#!/usr/bin/env node
/**
 * Theme Budget Measurement
 *
 * Measures each pack's total weight (CSS + JS + fonts) and outputs
 * a [pack].budget.json file alongside the pack.
 *
 * Usage:
 *   node scripts/theme-budget.js
 *   npm run budget:themes
 *
 * Outputs:
 *   src/packs/[pack]/[pack].budget.json
 */

import { readdirSync, readFileSync, writeFileSync, statSync, existsSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';
import { gzipSync } from 'zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PACKS_DIR = join(ROOT, 'src', 'packs');

// Load performance budget for thresholds
const budgetPath = join(ROOT, 'budget.json');
const budget = existsSync(budgetPath) ? JSON.parse(readFileSync(budgetPath, 'utf-8')) : null;
const themeMaxKb = budget?.theme?.max_kb ?? 50;
const themeWarnKb = budget?.theme?.warn_kb ?? 35;
const carbonAplusKb = budget?.targets?.carbon_a_plus_kb ?? 270;
const carbonAKb = budget?.targets?.carbon_a_kb ?? 531;

/**
 * Recursively collect all files in a directory
 */
function collectFiles(dir, files = []) {
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFiles(fullPath, files);
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

/**
 * Measure a pack directory
 */
function measurePack(packName) {
  const packDir = join(PACKS_DIR, packName);
  if (!existsSync(packDir)) return null;

  const files = collectFiles(packDir);
  let cssRawBytes = 0;
  let jsRawBytes = 0;
  let fontBytes = 0;
  let assetBytes = 0;
  let cssContent = '';

  for (const file of files) {
    // Skip budget.json files and README
    if (file.endsWith('.budget.json') || file.endsWith('README.md')) continue;

    const ext = extname(file).toLowerCase();
    const size = statSync(file).size;

    switch (ext) {
      case '.css':
        cssRawBytes += size;
        cssContent += readFileSync(file, 'utf-8');
        break;
      case '.js':
        jsRawBytes += size;
        break;
      case '.woff':
      case '.woff2':
      case '.ttf':
      case '.otf':
      case '.eot':
        fontBytes += size;
        break;
      case '.png':
      case '.jpg':
      case '.jpeg':
      case '.webp':
      case '.avif':
      case '.gif':
      case '.svg':
        assetBytes += size;
        break;
      default:
        break;
    }
  }

  const cssGzipBytes = cssContent ? gzipSync(Buffer.from(cssContent)).length : 0;
  const totalRaw = cssRawBytes + jsRawBytes + fontBytes + assetBytes;
  const totalKb = Number((totalRaw / 1024).toFixed(2));

  const withinBudget = totalKb <= themeMaxKb;
  const shareOfPage = Number(((totalKb / carbonAplusKb) * 100).toFixed(1));

  const result = {
    theme: packName,
    generated: new Date().toISOString(),
    targets: {
      a_plus_carbon: carbonAplusKb,
      a_carbon: carbonAKb,
      recommended_max_theme: themeMaxKb
    },
    measured: {
      css_raw_bytes: cssRawBytes,
      css_gzip_bytes: cssGzipBytes,
      js_raw_bytes: jsRawBytes,
      font_bytes: fontBytes,
      asset_bytes: assetBytes,
      total_theme_bytes: totalRaw,
      total_theme_kb: totalKb
    },
    status: {
      within_theme_budget: withinBudget,
      theme_share_of_page_budget_percent: shareOfPage,
      notes: []
    }
  };

  if (totalKb > themeMaxKb) {
    result.status.notes.push(`OVER BUDGET: ${totalKb}KB exceeds ${themeMaxKb}KB limit`);
  } else if (totalKb > themeWarnKb) {
    result.status.notes.push(`WARNING: ${totalKb}KB approaching ${themeMaxKb}KB limit`);
  }

  if (fontBytes > 40 * 1024) {
    result.status.notes.push(`Font weight is ${(fontBytes / 1024).toFixed(1)}KB — consider variable fonts or subset`);
  }

  if (result.status.notes.length === 0) {
    result.status.notes.push('Within budget');
  }

  return result;
}

// Main
const packs = readdirSync(PACKS_DIR, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name);

if (packs.length === 0) {
  console.log('No packs found in src/packs/');
  process.exit(0);
}

const col = { reset: '\x1b[0m', green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m', bold: '\x1b[1m', dim: '\x1b[2m' };

console.log(`\n${col.bold}Theme Budget Report${col.reset}\n`);

let hasFailure = false;

for (const packName of packs) {
  const result = measurePack(packName);
  if (!result) continue;

  const outputPath = join(PACKS_DIR, packName, `${packName}.budget.json`);
  writeFileSync(outputPath, JSON.stringify(result, null, 2) + '\n');

  const status = result.status.within_theme_budget;
  const statusIcon = status ? `${col.green}PASS${col.reset}` : `${col.red}FAIL${col.reset}`;
  if (!status) hasFailure = true;

  console.log(`  ${statusIcon}  ${col.bold}${packName}${col.reset}`);
  console.log(`        CSS: ${(result.measured.css_raw_bytes / 1024).toFixed(1)}KB raw, ${(result.measured.css_gzip_bytes / 1024).toFixed(1)}KB gzip`);
  console.log(`        JS:  ${(result.measured.js_raw_bytes / 1024).toFixed(1)}KB`);
  console.log(`        Fonts: ${(result.measured.font_bytes / 1024).toFixed(1)}KB`);
  console.log(`        Total: ${result.measured.total_theme_kb}KB / ${themeMaxKb}KB budget (${result.status.theme_share_of_page_budget_percent}% of page)`);

  for (const note of result.status.notes) {
    const noteColor = note.startsWith('OVER') ? col.red : note.startsWith('WARNING') ? col.yellow : col.dim;
    console.log(`        ${noteColor}${note}${col.reset}`);
  }
  console.log();
}

if (hasFailure) {
  console.log(`${col.red}Some packs exceed their budget.${col.reset}\n`);
  process.exit(1);
}
