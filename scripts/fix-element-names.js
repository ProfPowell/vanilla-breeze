#!/usr/bin/env node
/**
 * Fix incorrect custom element names in navigation and file names
 *
 * Renames:
 * - prose → layout-text
 * - card → layout-card
 * - alert → status-message
 * - avatar → user-avatar
 * - badge → layout-badge
 */

import { readFileSync, writeFileSync, renameSync, readdirSync, statSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const DOCS = join(ROOT, 'docs');
const CUSTOM_ELEMENTS = join(DOCS, 'elements', 'custom-elements');

// Mapping of old names to new names
const NAME_MAP = {
  'prose': 'layout-text',
  'card': 'layout-card',
  'alert': 'status-message',
  'avatar': 'user-avatar',
  'badge': 'layout-badge'
};

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

// Step 1: Rename files in custom-elements directory
console.log('Step 1: Renaming files...');
for (const [oldName, newName] of Object.entries(NAME_MAP)) {
  const oldPath = join(CUSTOM_ELEMENTS, `${oldName}.html`);
  const newPath = join(CUSTOM_ELEMENTS, `${newName}.html`);

  if (existsSync(oldPath)) {
    renameSync(oldPath, newPath);
    console.log(`  Renamed: ${oldName}.html → ${newName}.html`);
  } else {
    console.log(`  Skipped: ${oldName}.html (not found)`);
  }
}

// Step 2: Update all HTML files with new references
console.log('\nStep 2: Updating references in HTML files...');
const htmlFiles = getHtmlFiles(DOCS);
console.log(`  Found ${htmlFiles.length} HTML files to check`);

let totalReplacements = 0;

for (const filePath of htmlFiles) {
  let content = readFileSync(filePath, 'utf-8');
  let modified = false;
  let fileReplacements = 0;

  for (const [oldName, newName] of Object.entries(NAME_MAP)) {
    // Replace href references
    const hrefPattern = new RegExp(
      `href="/docs/elements/custom-elements/${oldName}\\.html"`,
      'g'
    );
    const hrefReplacement = `href="/docs/elements/custom-elements/${newName}.html"`;

    if (content.includes(`/custom-elements/${oldName}.html`)) {
      content = content.replace(hrefPattern, hrefReplacement);
      modified = true;
      fileReplacements++;
    }

    // Replace display text in navigation links
    // Pattern: >oldName</a> → >newName</a>
    const textPattern = new RegExp(`>${oldName}</a>`, 'g');
    const textReplacement = `>${newName}</a>`;

    if (content.match(textPattern)) {
      content = content.replace(textPattern, textReplacement);
      modified = true;
      fileReplacements++;
    }
  }

  if (modified) {
    writeFileSync(filePath, content);
    totalReplacements += fileReplacements;
    console.log(`  Updated: ${filePath.replace(ROOT, '')} (${fileReplacements} replacements)`);
  }
}

console.log(`\nDone! Made ${totalReplacements} replacements across ${htmlFiles.length} files.`);
