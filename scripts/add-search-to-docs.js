#!/usr/bin/env node
/**
 * Add search-wc to all documentation pages
 *
 * Updates:
 * 1. Adds search-wc to header-actions (desktop)
 * 2. Adds search-wc to mobile menu
 * 3. Adds data-pagefind-body to main/article content
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const DOCS = join(ROOT, 'docs');

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

// Search button HTML for header
const SEARCH_HEADER = `<search-wc>
          <button data-trigger class="ghost">
            <x-icon name="search" size="sm"></x-icon>
            Search
          </button>
        </search-wc>`;

// Search button HTML for mobile menu
const SEARCH_MOBILE = `<div class="mobile-menu-search">
          <search-wc>
            <button data-trigger class="ghost" style="width: 100%">
              <x-icon name="search" size="sm"></x-icon>
              Search
            </button>
          </search-wc>
        </div>`;

console.log('Adding search-wc to documentation pages...');
const htmlFiles = getHtmlFiles(DOCS);
console.log(`Found ${htmlFiles.length} HTML files to check`);

let updatedCount = 0;

for (const filePath of htmlFiles) {
  let content = readFileSync(filePath, 'utf-8');
  let modified = false;

  // Skip if already has search-wc
  if (content.includes('<search-wc>')) {
    continue;
  }

  // Add search to header-actions (before theme-wc)
  const headerActionsPattern = /(<div class="header-actions">)\s*\n(\s*)(<theme-wc>)/;
  if (headerActionsPattern.test(content)) {
    content = content.replace(
      headerActionsPattern,
      `$1\n$2${SEARCH_HEADER}\n$2$3`
    );
    modified = true;
  }

  // Add search to mobile menu (after the close button, before nav ul)
  const mobileMenuPattern = /(<button class="mobile-menu-close"[^>]*>[\s\S]*?<\/button>)\s*\n(\s*)(<ul>)/;
  if (mobileMenuPattern.test(content)) {
    content = content.replace(
      mobileMenuPattern,
      `$1\n$2${SEARCH_MOBILE}\n$2$3`
    );
    modified = true;
  }

  // Add data-pagefind-body to main element if not present
  if (content.includes('<main>') && !content.includes('data-pagefind-body')) {
    content = content.replace('<main>', '<main data-pagefind-body>');
    modified = true;
  }

  // Add data-pagefind-body to article element if not present
  if (content.includes('<article>') && !content.includes('data-pagefind-body')) {
    content = content.replace('<article>', '<article data-pagefind-body>');
    modified = true;
  }

  if (modified) {
    writeFileSync(filePath, content);
    updatedCount++;
    console.log(`  Updated: ${filePath.replace(ROOT, '')}`);
  }
}

console.log(`\nDone! Updated ${updatedCount} files.`);
