#!/usr/bin/env node
/**
 * Navigation Update Script
 *
 * Updates all HTML files in docs/ to use the new navigation structure:
 * Home | Docs (dropdown) | API (dropdown) | Examples (dropdown) | Integrations
 *
 * Replaces both desktop nav (<nav class="horizontal pills">) and
 * mobile nav (<nav popover id="mobile-menu">).
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const DOCS_DIR = 'docs';

// Determine which navigation section a file belongs to
function getActiveSection(filePath) {
  const relativePath = relative(DOCS_DIR, filePath);

  if (relativePath === 'index.html') {
    return 'home';
  }
  if (relativePath === 'quick-start.html' ||
      relativePath === 'tutorial.html') {
    return 'docs';
  }
  if (relativePath.startsWith('tokens') ||
      relativePath.startsWith('elements') ||
      relativePath.startsWith('attributes') ||
      relativePath === 'themes.html') {
    return 'api';
  }
  if (relativePath.startsWith('snippets') ||
      relativePath.startsWith('examples')) {
    return 'examples';
  }
  if (relativePath.startsWith('integrations')) {
    return 'integrations';
  }
  return 'home';
}

// Generate the desktop navigation HTML
function generateDesktopNav(activeSection) {
  const isHome = activeSection === 'home';
  const isDocs = activeSection === 'docs';
  const isApi = activeSection === 'api';
  const isExamples = activeSection === 'examples';
  const isIntegrations = activeSection === 'integrations';

  return `<nav class="horizontal pills" aria-label="Main navigation">
      <ul>
        <li><a href="/docs/"${isHome ? ' aria-current="page"' : ''}>Home</a></li>
        <li>
          <dropdown-wc data-position="bottom-start" data-hover>
            <a href="/docs/quick-start.html" data-trigger${isDocs ? ' aria-current="true"' : ''}>Docs</a>
            <menu>
              <li><a href="/docs/quick-start.html">Quick Start</a></li>
              <li><a href="/docs/tutorial.html">Tutorial</a></li>
            </menu>
          </dropdown-wc>
        </li>
        <li>
          <dropdown-wc data-position="bottom-start" data-hover>
            <a href="/docs/elements/" data-trigger${isApi ? ' aria-current="true"' : ''}>API</a>
            <menu>
              <li><a href="/docs/elements/">Elements</a></li>
              <li><a href="/docs/attributes/">Attributes</a></li>
              <li><a href="/docs/tokens/">Tokens</a></li>
              <li><a href="/docs/themes.html">Themes</a></li>
            </menu>
          </dropdown-wc>
        </li>
        <li>
          <dropdown-wc data-position="bottom-start" data-hover>
            <a href="/docs/snippets/" data-trigger${isExamples ? ' aria-current="true"' : ''}>Examples</a>
            <menu>
              <li><a href="/docs/snippets/">Snippets</a></li>
              <li><a href="/docs/examples/">Demos</a></li>
            </menu>
          </dropdown-wc>
        </li>
        <li><a href="/docs/integrations/"${isIntegrations ? ' aria-current="page"' : ''}>Integrations</a></li>
      </ul>
    </nav>`;
}

// Generate the mobile navigation HTML
function generateMobileNav(activeSection) {
  const isHome = activeSection === 'home';
  const isDocs = activeSection === 'docs';
  const isApi = activeSection === 'api';
  const isExamples = activeSection === 'examples';
  const isIntegrations = activeSection === 'integrations';

  return `<nav popover id="mobile-menu" class="mobile-menu">
      <button class="mobile-menu-close" popovertarget="mobile-menu" popovertargetaction="hide" aria-label="Close menu">
        <icon-wc name="x"></icon-wc>
      </button>
      <div class="mobile-menu-search">
        <search-wc>
          <button data-trigger class="ghost" style="width: 100%">
            <icon-wc name="search" size="sm"></icon-wc>
            Search
          </button>
        </search-wc>
      </div>
      <ul>
        <li><a href="/docs/"${isHome ? ' aria-current="page"' : ''}>Home</a></li>
        <li class="mobile-section">
          <span class="mobile-section-title"${isDocs ? ' aria-current="true"' : ''}>Docs</span>
          <ul>
            <li><a href="/docs/quick-start.html">Quick Start</a></li>
            <li><a href="/docs/tutorial.html">Tutorial</a></li>
          </ul>
        </li>
        <li class="mobile-section">
          <span class="mobile-section-title"${isApi ? ' aria-current="true"' : ''}>API</span>
          <ul>
            <li><a href="/docs/elements/">Elements</a></li>
            <li><a href="/docs/attributes/">Attributes</a></li>
            <li><a href="/docs/tokens/">Tokens</a></li>
            <li><a href="/docs/themes.html">Themes</a></li>
          </ul>
        </li>
        <li class="mobile-section">
          <span class="mobile-section-title"${isExamples ? ' aria-current="true"' : ''}>Examples</span>
          <ul>
            <li><a href="/docs/snippets/">Snippets</a></li>
            <li><a href="/docs/examples/">Demos</a></li>
          </ul>
        </li>
        <li><a href="/docs/integrations/"${isIntegrations ? ' aria-current="page"' : ''}>Integrations</a></li>
      </ul>
      <div class="mobile-menu-theme">
        <theme-wc>
          <button data-trigger class="ghost">
            <icon-wc name="palette" size="sm"></icon-wc>
            Theme
          </button>
        </theme-wc>
      </div>
    </nav>`;
}

// Process a single HTML file
function processHtmlFile(filePath) {
  let content = readFileSync(filePath, 'utf-8');
  let modified = false;

  const activeSection = getActiveSection(filePath);

  // Replace desktop navigation
  // Match from <nav class="horizontal pills" to the closing </nav>
  const desktopNavRegex = /<nav\s+class="horizontal pills"[^>]*>[\s\S]*?<\/ul>\s*<\/nav>/;
  if (desktopNavRegex.test(content)) {
    const newDesktopNav = generateDesktopNav(activeSection);
    content = content.replace(desktopNavRegex, newDesktopNav);
    modified = true;
  }

  // Replace mobile navigation
  // Match from <nav popover id="mobile-menu" to its closing </nav>
  const mobileNavRegex = /<nav\s+popover\s+id="mobile-menu"[^>]*>[\s\S]*?<\/nav>/;
  if (mobileNavRegex.test(content)) {
    const newMobileNav = generateMobileNav(activeSection);
    content = content.replace(mobileNavRegex, newMobileNav);
    modified = true;
  }

  if (modified) {
    writeFileSync(filePath, content);
    console.log(`  Updated: ${filePath} (${activeSection})`);
    return true;
  }

  return false;
}

// Recursively process all HTML files in a directory
function processDirectory(dir) {
  const entries = readdirSync(dir);
  let count = 0;

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      count += processDirectory(fullPath);
    } else if (entry.endsWith('.html')) {
      if (processHtmlFile(fullPath)) {
        count++;
      }
    }
  }

  return count;
}

// Main
console.log('Updating navigation across all docs...\n');
const updatedCount = processDirectory(DOCS_DIR);
console.log(`\nNavigation update complete! Updated ${updatedCount} files.`);
