#!/usr/bin/env node
/**
 * Update Web Components sidebar navigation across all doc pages
 *
 * This script adds missing entries to the Web Components navigation
 * in all documentation pages.
 *
 * Usage: node scripts/update-wc-sidebar.js
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const DOCS_DIR = 'docs/elements/web-components';

// The complete, correct sidebar entries for Web Components
const CORRECT_SIDEBAR = `          <details open>
            <summary>Web Components</summary>
            <ul>
              <li><a href="/docs/elements/web-components/accordion.html">accordion-wc</a></li>
              <li><a href="/docs/elements/web-components/tabs.html">tabs-wc</a></li>
              <li><a href="/docs/elements/web-components/dropdown.html">dropdown-wc</a></li>
              <li><a href="/docs/elements/web-components/tooltip.html">tooltip-wc</a></li>
              <li><a href="/docs/elements/web-components/toast.html">toast-wc</a></li>
              <li><a href="/docs/elements/web-components/theme-wc.html">theme-wc</a></li>
              <li><a href="/docs/elements/web-components/search-wc.html">search-wc</a></li>
              <li><a href="/docs/elements/web-components/icons.html">icon-wc</a></li>
              <li><a href="/docs/elements/web-components/footnotes.html">footnotes-wc</a></li>
              <li><a href="/docs/elements/web-components/table-wc.html">table-wc</a></li>
              <li><a href="/docs/elements/web-components/heading-links.html">heading-links</a></li>
              <li><a href="/docs/elements/web-components/page-toc.html">page-toc</a></li>
            </ul>
          </details>`;

// Pattern to match the existing Web Components details section
const SIDEBAR_PATTERN = /<details(?:\s+open)?>\s*<summary>Web Components<\/summary>\s*<ul>[\s\S]*?<\/ul>\s*<\/details>/;

async function updateFile(filePath) {
  const content = await readFile(filePath, 'utf-8');

  if (!SIDEBAR_PATTERN.test(content)) {
    console.log(`  Skipped: ${filePath} (no Web Components sidebar found)`);
    return false;
  }

  // Check if already has the new entries
  if (content.includes('heading-links.html') && content.includes('page-toc.html')) {
    console.log(`  Skipped: ${filePath} (already up to date)`);
    return false;
  }

  // Determine which page this is to set aria-current
  const filename = filePath.split('/').pop();
  let sidebarToUse = CORRECT_SIDEBAR;

  // Add aria-current="page" for the current page
  const pageMap = {
    'accordion.html': 'accordion.html',
    'tabs.html': 'tabs.html',
    'dropdown.html': 'dropdown.html',
    'tooltip.html': 'tooltip.html',
    'toast.html': 'toast.html',
    'theme-wc.html': 'theme-wc.html',
    'search-wc.html': 'search-wc.html',
    'icons.html': 'icons.html',
    'footnotes.html': 'footnotes.html',
    'table-wc.html': 'table-wc.html',
    'heading-links.html': 'heading-links.html',
    'page-toc.html': 'page-toc.html'
  };

  if (pageMap[filename]) {
    const href = `/docs/elements/web-components/${pageMap[filename]}`;
    sidebarToUse = sidebarToUse.replace(
      `<a href="${href}">`,
      `<a href="${href}" aria-current="page">`
    );
  }

  const updated = content.replace(SIDEBAR_PATTERN, sidebarToUse);
  await writeFile(filePath, updated, 'utf-8');
  console.log(`  Updated: ${filePath}`);
  return true;
}

async function main() {
  console.log('Updating Web Components sidebar navigation...\n');

  const files = await readdir(DOCS_DIR);
  const htmlFiles = files.filter(f => f.endsWith('.html') && f !== 'index.html');

  let updated = 0;
  let skipped = 0;

  for (const file of htmlFiles) {
    const filePath = join(DOCS_DIR, file);
    const wasUpdated = await updateFile(filePath);
    if (wasUpdated) updated++;
    else skipped++;
  }

  console.log(`\nDone! Updated: ${updated}, Skipped: ${skipped}`);
}

main().catch(console.error);
