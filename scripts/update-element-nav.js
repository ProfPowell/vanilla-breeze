#!/usr/bin/env node
/**
 * Update navigation in all doc pages to include all HTML elements
 *
 * This script updates the sidebar navigation in all HTML documentation pages
 * to include all native HTML elements organized by category.
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const DOCS = join(ROOT, 'docs');

// Complete navigation structure for native elements
const NATIVE_ELEMENT_NAV = {
  'Document': [
    { href: 'html.html', label: 'html' },
    { href: 'head.html', label: 'head' },
    { href: 'title.html', label: 'title' },
    { href: 'base.html', label: 'base' },
    { href: 'link.html', label: 'link' },
    { href: 'meta.html', label: 'meta' },
    { href: 'style.html', label: 'style' },
    { href: 'body.html', label: 'body' }
  ],
  'Sectioning': [
    { href: 'sectioning.html', label: 'sectioning overview' },
    { href: 'article.html', label: 'article' },
    { href: 'aside.html', label: 'aside' },
    { href: 'footer.html', label: 'footer' },
    { href: 'header.html', label: 'header' },
    { href: 'hgroup.html', label: 'hgroup' },
    { href: 'main.html', label: 'main' },
    { href: 'nav.html', label: 'nav' },
    { href: 'section.html', label: 'section' },
    { href: 'address.html', label: 'address' },
    { href: 'search.html', label: 'search' }
  ],
  'Headings': [
    { href: 'headings.html', label: 'headings overview' },
    { href: 'h1.html', label: 'h1' },
    { href: 'h2.html', label: 'h2' },
    { href: 'h3.html', label: 'h3' },
    { href: 'h4.html', label: 'h4' },
    { href: 'h5.html', label: 'h5' },
    { href: 'h6.html', label: 'h6' }
  ],
  'Text Content': [
    { href: 'p.html', label: 'p' },
    { href: 'blockquote.html', label: 'blockquote' },
    { href: 'pre.html', label: 'pre' },
    { href: 'hr.html', label: 'hr' },
    { href: 'div.html', label: 'div' },
    { href: 'figure.html', label: 'figure' },
    { href: 'figcaption.html', label: 'figcaption' }
  ],
  'Text Semantics': [
    { href: 'text.html', label: 'text overview' },
    { href: 'a.html', label: 'a' },
    { href: 'strong.html', label: 'strong' },
    { href: 'em.html', label: 'em' },
    { href: 'b.html', label: 'b' },
    { href: 'i.html', label: 'i' },
    { href: 'u.html', label: 'u' },
    { href: 's.html', label: 's' },
    { href: 'small.html', label: 'small' },
    { href: 'span.html', label: 'span' },
    { href: 'br.html', label: 'br' },
    { href: 'wbr.html', label: 'wbr' },
    { href: 'code.html', label: 'code' },
    { href: 'kbd.html', label: 'kbd' },
    { href: 'samp.html', label: 'samp' },
    { href: 'var.html', label: 'var' },
    { href: 'mark.html', label: 'mark' },
    { href: 'abbr.html', label: 'abbr' },
    { href: 'dfn.html', label: 'dfn' },
    { href: 'time.html', label: 'time' },
    { href: 'cite.html', label: 'cite' },
    { href: 'q.html', label: 'q' },
    { href: 'sub.html', label: 'sub' },
    { href: 'sup.html', label: 'sup' },
    { href: 'data.html', label: 'data' },
    { href: 'bdi.html', label: 'bdi' },
    { href: 'bdo.html', label: 'bdo' },
    { href: 'ruby.html', label: 'ruby' },
    { href: 'rt.html', label: 'rt' },
    { href: 'rp.html', label: 'rp' }
  ],
  'Lists': [
    { href: 'lists.html', label: 'lists overview' },
    { href: 'ul.html', label: 'ul' },
    { href: 'ol.html', label: 'ol' },
    { href: 'li.html', label: 'li' },
    { href: 'dl.html', label: 'dl' },
    { href: 'dt.html', label: 'dt' },
    { href: 'dd.html', label: 'dd' },
    { href: 'menu.html', label: 'menu' }
  ],
  'Tables': [
    { href: 'tables.html', label: 'tables overview' },
    { href: 'table.html', label: 'table' },
    { href: 'thead.html', label: 'thead' },
    { href: 'tbody.html', label: 'tbody' },
    { href: 'tfoot.html', label: 'tfoot' },
    { href: 'tr.html', label: 'tr' },
    { href: 'th.html', label: 'th' },
    { href: 'td.html', label: 'td' },
    { href: 'caption.html', label: 'caption' },
    { href: 'col.html', label: 'col' },
    { href: 'colgroup.html', label: 'colgroup' }
  ],
  'Forms': [
    { href: 'forms.html', label: 'forms overview' },
    { href: 'form.html', label: 'form' },
    { href: 'input.html', label: 'input' },
    { href: 'button.html', label: 'button' },
    { href: 'select.html', label: 'select' },
    { href: 'option.html', label: 'option' },
    { href: 'optgroup.html', label: 'optgroup' },
    { href: 'textarea.html', label: 'textarea' },
    { href: 'label.html', label: 'label' },
    { href: 'fieldset.html', label: 'fieldset' },
    { href: 'legend.html', label: 'legend' },
    { href: 'output.html', label: 'output' },
    { href: 'datalist.html', label: 'datalist' },
    { href: 'progress.html', label: 'progress' },
    { href: 'meter.html', label: 'meter' }
  ],
  'Media': [
    { href: 'media.html', label: 'media overview' },
    { href: 'img.html', label: 'img' },
    { href: 'picture.html', label: 'picture' },
    { href: 'source.html', label: 'source' },
    { href: 'video.html', label: 'video' },
    { href: 'audio.html', label: 'audio' },
    { href: 'track.html', label: 'track' },
    { href: 'figure.html', label: 'figure' },
    { href: 'figcaption.html', label: 'figcaption' },
    { href: 'map.html', label: 'map' },
    { href: 'area.html', label: 'area' }
  ],
  'Interactive': [
    { href: 'interactive.html', label: 'interactive overview' },
    { href: 'details.html', label: 'details' },
    { href: 'summary.html', label: 'summary' },
    { href: 'dialog.html', label: 'dialog' }
  ],
  'Embedded': [
    { href: 'iframe.html', label: 'iframe' },
    { href: 'embed.html', label: 'embed' },
    { href: 'object.html', label: 'object' },
    { href: 'canvas.html', label: 'canvas' },
    { href: 'svg.html', label: 'svg' },
    { href: 'math.html', label: 'math' }
  ],
  'Scripting': [
    { href: 'script.html', label: 'script' },
    { href: 'noscript.html', label: 'noscript' },
    { href: 'template.html', label: 'template' },
    { href: 'slot.html', label: 'slot' }
  ],
  'Editing': [
    { href: 'del.html', label: 'del' },
    { href: 'ins.html', label: 'ins' }
  ]
};

// Custom Elements navigation
const CUSTOM_ELEMENTS_NAV = [
  { href: 'stack.html', label: 'layout-stack' },
  { href: 'grid.html', label: 'layout-grid' },
  { href: 'sidebar.html', label: 'layout-sidebar' },
  { href: 'cluster.html', label: 'layout-cluster' },
  { href: 'center.html', label: 'layout-center' },
  { href: 'cover.html', label: 'layout-cover' },
  { href: 'reel.html', label: 'layout-reel' },
  { href: 'switcher.html', label: 'layout-switcher' },
  { href: 'imposter.html', label: 'layout-imposter' },
  { href: 'layout-text.html', label: 'layout-text' },
  { href: 'layout-card.html', label: 'layout-card' },
  { href: 'status-message.html', label: 'status-message' },
  { href: 'user-avatar.html', label: 'user-avatar' },
  { href: 'layout-badge.html', label: 'layout-badge' },
  { href: 'form-field.html', label: 'form-field' }
];

// Web Components navigation
const WEB_COMPONENTS_NAV = [
  { href: 'accordion.html', label: 'accordion-wc' },
  { href: 'tabs.html', label: 'tabs-wc' },
  { href: 'dropdown.html', label: 'dropdown-wc' },
  { href: 'tooltip.html', label: 'tooltip-wc' },
  { href: 'toast.html', label: 'toast-wc' },
  { href: 'theme-wc.html', label: 'theme-wc' },
  { href: 'search-wc.html', label: 'search-wc' },
  { href: 'icons.html', label: 'icon-wc' },
  { href: 'footnotes.html', label: 'footnotes-wc' },
  { href: 'table-wc.html', label: 'table-wc' }
];

// Generate navigation HTML
function generateNavigation(currentPagePath) {
  // Determine if we're on a native element page and which one
  const isNativePage = currentPagePath.includes('/elements/native/');
  const isCustomPage = currentPagePath.includes('/elements/custom-elements/');
  const isWebComponentPage = currentPagePath.includes('/elements/web-components/');

  const currentFile = currentPagePath.split('/').pop();

  let nav = '';
  const indent = '          ';

  // Native Elements section
  nav += `${indent}<details${isNativePage ? ' open' : ''}>\n`;
  nav += `${indent}  <summary>Native Elements</summary>\n`;

  for (const [category, elements] of Object.entries(NATIVE_ELEMENT_NAV)) {
    // Check if current page is in this category
    const isCategoryActive = isNativePage && elements.some(el => el.href === currentFile);

    nav += `${indent}  <details${isCategoryActive ? ' open' : ''}>\n`;
    nav += `${indent}    <summary>${category}</summary>\n`;
    nav += `${indent}    <ul>\n`;

    for (const el of elements) {
      const isCurrent = isNativePage && el.href === currentFile;
      const ariaCurrent = isCurrent ? ' aria-current="page"' : '';
      nav += `${indent}      <li><a href="/docs/elements/native/${el.href}"${ariaCurrent}>${el.label}</a></li>\n`;
    }

    nav += `${indent}    </ul>\n`;
    nav += `${indent}  </details>\n`;
  }

  nav += `${indent}</details>\n`;

  // Custom Elements section
  nav += `${indent}<details${isCustomPage ? ' open' : ''}>\n`;
  nav += `${indent}  <summary>Custom Elements</summary>\n`;
  nav += `${indent}  <ul>\n`;

  for (const el of CUSTOM_ELEMENTS_NAV) {
    const isCurrent = isCustomPage && el.href === currentFile;
    const ariaCurrent = isCurrent ? ' aria-current="page"' : '';
    nav += `${indent}    <li><a href="/docs/elements/custom-elements/${el.href}"${ariaCurrent}>${el.label}</a></li>\n`;
  }

  nav += `${indent}  </ul>\n`;
  nav += `${indent}</details>\n`;

  // Web Components section
  nav += `${indent}<details${isWebComponentPage ? ' open' : ''}>\n`;
  nav += `${indent}  <summary>Web Components</summary>\n`;
  nav += `${indent}  <ul>\n`;

  for (const el of WEB_COMPONENTS_NAV) {
    const isCurrent = isWebComponentPage && el.href === currentFile;
    const ariaCurrent = isCurrent ? ' aria-current="page"' : '';
    nav += `${indent}    <li><a href="/docs/elements/web-components/${el.href}"${ariaCurrent}>${el.label}</a></li>\n`;
  }

  nav += `${indent}  </ul>\n`;
  nav += `${indent}</details>`;

  return nav;
}

// Find all HTML files recursively
function findHtmlFiles(dir) {
  const files = [];
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...findHtmlFiles(fullPath));
    } else if (entry.endsWith('.html')) {
      files.push(fullPath);
    }
  }

  return files;
}

// Update navigation in a single file
function updateFileNavigation(filePath) {
  let content = readFileSync(filePath, 'utf-8');

  // Check if file has the tree nav
  if (!content.includes('<nav class="tree"')) {
    return false;
  }

  // Get relative path for determining current page
  const relativePath = '/' + relative(ROOT, filePath);

  // Generate new navigation
  const newNav = generateNavigation(relativePath);

  // Pattern to match the nav content (between nav opening and the close label)
  // We need to preserve the nav element and its attributes, and the close label
  const navStartPattern = /<nav class="tree"[^>]*aria-label="Elements navigation">\s*<label for="nav-drawer-toggle" class="nav-drawer-close"[^>]*>\s*<icon-wc name="x"><\/icon-wc>\s*<\/label>/;
  const navEndPattern = /<\/nav>\s*<layout-sidebar data-side="end"/;

  const startMatch = content.match(navStartPattern);
  const endMatch = content.match(navEndPattern);

  if (!startMatch || !endMatch) {
    return false;
  }

  const startIdx = startMatch.index + startMatch[0].length;
  const endIdx = content.indexOf('</nav>', startIdx);

  if (endIdx === -1) {
    return false;
  }

  // Build the new content
  const before = content.substring(0, startIdx);
  const after = content.substring(endIdx);

  content = before + '\n' + newNav + '\n        ' + after;

  writeFileSync(filePath, content);
  return true;
}

// Main execution
console.log('=== Updating Element Navigation ===\n');

const htmlFiles = findHtmlFiles(DOCS);
let updated = 0;
let skipped = 0;

for (const file of htmlFiles) {
  const relativePath = relative(DOCS, file);
  if (updateFileNavigation(file)) {
    console.log(`  Updated: ${relativePath}`);
    updated++;
  } else {
    skipped++;
  }
}

console.log(`\n✓ Updated ${updated} files`);
console.log(`  Skipped ${skipped} files (no tree nav)`);
