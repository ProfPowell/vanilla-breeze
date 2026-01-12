#!/usr/bin/env node
/**
 * Rename theme-picker to theme-wc for consistency with other web components
 *
 * Steps:
 * 1. Rename src/web-components/theme-picker/ → src/web-components/theme-wc/
 * 2. Rename docs/elements/web-components/theme-picker.html → theme-wc.html
 * 3. Update all references in source files
 * 4. Update all references in HTML files
 */

import { readFileSync, writeFileSync, renameSync, readdirSync, statSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const DOCS = join(ROOT, 'docs');
const WEB_COMPONENTS = join(ROOT, 'src', 'web-components');

function getHtmlFiles(dir) {
  const files = [];
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...getHtmlFiles(fullPath));
    } else if (entry.endsWith('.html')) {
      files.push(fullPath);
    }
  }

  return files;
}

function getCssJsFiles(dir) {
  const files = [];
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...getCssJsFiles(fullPath));
    } else if (entry.endsWith('.css') || entry.endsWith('.js')) {
      files.push(fullPath);
    }
  }

  return files;
}

// Step 1: Use git mv to rename directory (preserves history)
console.log('Step 1: Renaming directory...');
const oldDir = join(WEB_COMPONENTS, 'theme-picker');
const newDir = join(WEB_COMPONENTS, 'theme-wc');

if (existsSync(oldDir)) {
  try {
    execSync(`git mv "${oldDir}" "${newDir}"`, { cwd: ROOT });
    console.log('  Renamed: theme-picker/ → theme-wc/');
  } catch {
    // If git mv fails, try regular rename
    renameSync(oldDir, newDir);
    console.log('  Renamed: theme-picker/ → theme-wc/ (non-git)');
  }
} else if (existsSync(newDir)) {
  console.log('  Skipped: theme-wc/ already exists');
} else {
  console.log('  Error: theme-picker/ not found');
  process.exit(1);
}

// Step 2: Rename documentation file
console.log('\nStep 2: Renaming documentation file...');
const oldDocPath = join(DOCS, 'elements', 'web-components', 'theme-picker.html');
const newDocPath = join(DOCS, 'elements', 'web-components', 'theme-wc.html');

if (existsSync(oldDocPath)) {
  try {
    execSync(`git mv "${oldDocPath}" "${newDocPath}"`, { cwd: ROOT });
    console.log('  Renamed: theme-picker.html → theme-wc.html');
  } catch {
    renameSync(oldDocPath, newDocPath);
    console.log('  Renamed: theme-picker.html → theme-wc.html (non-git)');
  }
} else if (existsSync(newDocPath)) {
  console.log('  Skipped: theme-wc.html already exists');
}

// Rename demo files
const demos = [
  { old: 'theme-picker-inline.html', new: 'theme-wc-inline.html' },
  { old: 'theme-picker-popover.html', new: 'theme-wc-popover.html' }
];

for (const demo of demos) {
  const oldPath = join(DOCS, 'examples', 'demos', demo.old);
  const newPath = join(DOCS, 'examples', 'demos', demo.new);
  if (existsSync(oldPath)) {
    try {
      execSync(`git mv "${oldPath}" "${newPath}"`, { cwd: ROOT });
      console.log(`  Renamed: ${demo.old} → ${demo.new}`);
    } catch {
      renameSync(oldPath, newPath);
      console.log(`  Renamed: ${demo.old} → ${demo.new} (non-git)`);
    }
  }
}

// Step 3: Update source files (CSS and JS)
console.log('\nStep 3: Updating source files...');
const srcFiles = getCssJsFiles(join(ROOT, 'src'));
let srcReplacements = 0;

const srcReplacements_patterns = [
  // CSS selector and class names
  { pattern: /theme-picker(?!-wc)/g, replacement: 'theme-wc' },
  // Import paths
  { pattern: /theme-picker\//g, replacement: 'theme-wc/' },
  // Custom element name in define()
  { pattern: /define\('theme-picker'/g, replacement: "define('theme-wc'" }
];

for (const filePath of srcFiles) {
  let content = readFileSync(filePath, 'utf-8');
  let modified = false;

  for (const { pattern, replacement } of srcReplacements_patterns) {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      modified = true;
      srcReplacements++;
    }
    // Reset lastIndex for global regex
    pattern.lastIndex = 0;
  }

  if (modified) {
    writeFileSync(filePath, content);
    console.log(`  Updated: ${filePath.replace(ROOT, '')}`);
  }
}

// Step 4: Update HTML files
console.log('\nStep 4: Updating HTML files...');
const htmlFiles = getHtmlFiles(DOCS);
console.log(`  Found ${htmlFiles.length} HTML files to check`);

let htmlReplacements = 0;

const htmlPatterns = [
  // Element usage: <theme-picker> → <theme-wc>
  { pattern: /<theme-picker(?=[>\s])/g, replacement: '<theme-wc' },
  { pattern: /<\/theme-picker>/g, replacement: '</theme-wc>' },
  // href references
  { pattern: /href="([^"]*?)theme-picker\.html"/g, replacement: 'href="$1theme-wc.html"' },
  // Navigation text
  { pattern: />theme-picker</g, replacement: '>theme-wc<' },
  // Demo file references
  { pattern: /theme-picker-inline\.html/g, replacement: 'theme-wc-inline.html' },
  { pattern: /theme-picker-popover\.html/g, replacement: 'theme-wc-popover.html' },
  // CSS class references (if any)
  { pattern: /class="([^"]*?)theme-picker/g, replacement: 'class="$1theme-wc' },
  // Event names (if documented)
  { pattern: /theme-picker-open/g, replacement: 'theme-wc-open' },
  { pattern: /theme-picker-close/g, replacement: 'theme-wc-close' }
];

for (const filePath of htmlFiles) {
  let content = readFileSync(filePath, 'utf-8');
  let modified = false;
  let fileReplacements = 0;

  for (const { pattern, replacement } of htmlPatterns) {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      modified = true;
      fileReplacements++;
    }
    // Reset lastIndex for global regex
    pattern.lastIndex = 0;
  }

  if (modified) {
    writeFileSync(filePath, content);
    htmlReplacements += fileReplacements;
    console.log(`  Updated: ${filePath.replace(ROOT, '')} (${fileReplacements} patterns)`);
  }
}

console.log(`\nDone! Updated ${srcReplacements} source patterns and ${htmlReplacements} HTML patterns.`);
