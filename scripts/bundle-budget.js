#!/usr/bin/env node
/**
 * Bundle Size Budget Checker
 *
 * Scans dist/cdn/ for all CSS/JS artifacts, measures raw + gzip + brotli sizes,
 * compares against budgets in bundle-budget.config.json, and reports results.
 *
 * Outputs:
 *   - Formatted table to stdout
 *   - Machine-readable dist/cdn/budget-report.json
 *
 * Exit code 1 if any budget is exceeded.
 */

import { readdirSync, readFileSync, writeFileSync, statSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { gzipSync, brotliCompressSync, constants } from 'zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CDN = join(ROOT, 'dist', 'cdn');
const CONFIG_PATH = join(__dirname, 'bundle-budget.config.json');
const REPORT_PATH = join(CDN, 'budget-report.json');

// Load budget config
const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
const budgets = config.budgets;

/**
 * Measure sizes for a file
 */
function measure(filePath) {
  const content = readFileSync(filePath);
  const raw = content.length;
  const gzip = gzipSync(content, { level: 9 }).length;
  const brotli = brotliCompressSync(content, {
    params: { [constants.BROTLI_PARAM_QUALITY]: 11 }
  }).length;
  return { raw, gzip, brotli };
}

/**
 * Find the budget entry for a given artifact path (relative to CDN dir)
 */
function findBudget(relativePath) {
  // Direct match first
  if (budgets[relativePath]) return budgets[relativePath];

  // Wildcard match: themes/* or components/*
  const dir = relativePath.split('/')[0];
  const wildcard = `${dir}/*`;
  if (budgets[wildcard]) return budgets[wildcard];

  return null;
}

/**
 * Collect all .css and .js files under a directory
 */
function collectFiles(dir, prefix = '') {
  const results = [];
  if (!existsSync(dir)) return results;

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      results.push(...collectFiles(join(dir, entry.name), relativePath));
    } else if (entry.name.endsWith('.css') || entry.name.endsWith('.js')) {
      // Skip source maps and manifests
      if (entry.name.endsWith('.map') || entry.name.endsWith('.json')) continue;
      results.push(relativePath);
    }
  }
  return results;
}

/**
 * Format bytes to human-readable string
 */
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  return `${kb.toFixed(1)} KB`;
}

/**
 * Pad or truncate string to fixed width
 */
function pad(str, width, align = 'left') {
  const s = String(str);
  if (s.length >= width) return s.slice(0, width);
  const padding = ' '.repeat(width - s.length);
  return align === 'right' ? padding + s : s + padding;
}

// --- Main ---

if (!existsSync(CDN)) {
  console.error('Error: dist/cdn/ not found. Run `npm run build:cdn` first.');
  process.exit(1);
}

const files = collectFiles(CDN);
const report = { generated: new Date().toISOString(), artifacts: {} };
let exceeded = false;

// Measure all files
const rows = [];
for (const file of files) {
  const filePath = join(CDN, file);
  const sizes = measure(filePath);
  const budget = findBudget(file);
  const budgetGzip = budget?.gzip ?? null;
  const over = budgetGzip !== null && sizes.gzip > budgetGzip;
  if (over) exceeded = true;

  rows.push({ file, ...sizes, budgetGzip, over });
  report.artifacts[file] = {
    raw: sizes.raw,
    gzip: sizes.gzip,
    brotli: sizes.brotli,
    budget: budgetGzip,
    status: budgetGzip === null ? 'no-budget' : over ? 'exceeded' : 'ok'
  };
}

// Sort: top-level files first, then subdirectories
rows.sort((a, b) => {
  const aDepth = a.file.split('/').length;
  const bDepth = b.file.split('/').length;
  if (aDepth !== bDepth) return aDepth - bDepth;
  return a.file.localeCompare(b.file);
});

// Print table
const COL = { file: 40, raw: 10, gzip: 10, brotli: 10, budget: 10, status: 8 };
const divider = '-'.repeat(COL.file + COL.raw + COL.gzip + COL.brotli + COL.budget + COL.status + 10);

console.log('\nBundle Size Budget Report');
console.log(divider);
console.log(
  pad('Artifact', COL.file) + '  ' +
  pad('Raw', COL.raw, 'right') + '  ' +
  pad('Gzip', COL.gzip, 'right') + '  ' +
  pad('Brotli', COL.brotli, 'right') + '  ' +
  pad('Budget', COL.budget, 'right') + '  ' +
  pad('Status', COL.status)
);
console.log(divider);

for (const row of rows) {
  const status = row.budgetGzip === null ? '  --' : row.over ? '  OVER' : '  OK';
  console.log(
    pad(row.file, COL.file) + '  ' +
    pad(formatSize(row.raw), COL.raw, 'right') + '  ' +
    pad(formatSize(row.gzip), COL.gzip, 'right') + '  ' +
    pad(formatSize(row.brotli), COL.brotli, 'right') + '  ' +
    pad(row.budgetGzip !== null ? formatSize(row.budgetGzip) : '--', COL.budget, 'right') + '  ' +
    status
  );
}

console.log(divider);

// Totals
const totalRaw = rows.reduce((sum, r) => sum + r.raw, 0);
const totalGzip = rows.reduce((sum, r) => sum + r.gzip, 0);
const totalBrotli = rows.reduce((sum, r) => sum + r.brotli, 0);
console.log(
  pad('TOTAL', COL.file) + '  ' +
  pad(formatSize(totalRaw), COL.raw, 'right') + '  ' +
  pad(formatSize(totalGzip), COL.gzip, 'right') + '  ' +
  pad(formatSize(totalBrotli), COL.brotli, 'right')
);

// Write report
report.totals = { raw: totalRaw, gzip: totalGzip, brotli: totalBrotli };
writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
console.log(`\nReport written to dist/cdn/budget-report.json`);

if (exceeded) {
  console.error('\nBudget exceeded! One or more artifacts are over their gzip budget.');
  process.exit(1);
} else {
  console.log('\nAll budgets OK.');
}
