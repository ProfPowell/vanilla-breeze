#!/usr/bin/env node
/**
 * convert-njk.js — Mass-convert Nunjucks .njk pages to Cook .html format.
 *
 * Handles the mechanical conversion pattern used by ~366 of 420 pages:
 *   1. Update front matter (layout name, add crumb* vars)
 *   2. Inline {% set varName %}...{% endset %} content into {{ varName | escape }} sites
 *   3. Strip remaining simple Nunjucks syntax
 *   4. Warn on complex patterns ({% for %}, {% if %}, {% from %}, {% block %})
 *
 * Usage:
 *   node scripts/convert-njk.js [--dry-run] [--filter=docs/elements]
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, dirname, relative, extname, basename } from 'node:path';

const SITE_SRC = resolve(import.meta.dirname, '../../site-11ty/src/pages');
const COOK_SRC = resolve(import.meta.dirname, '../src/pages');

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const filterArg = args.find(a => a.startsWith('--filter='));
const FILTER = filterArg ? filterArg.split('=')[1] : null;

// Layout name mapping: 11ty layout path → Cook layout name
const LAYOUT_MAP = {
  'layouts/element.njk': 'element',
  'layouts/attribute.njk': 'attribute',
  'layouts/guide.njk': 'guide',
  'layouts/pattern.njk': 'pattern',
  'layouts/docs.njk': 'docs',
  'layouts/base.njk': null,    // Skip — needs manual porting
  'layouts/lab.njk': null,     // Skip — needs manual porting
  'layouts/blog.njk': null,    // Skip
  'false': null,               // No layout — skip
};

// Breadcrumb data for element pages
const ELEMENT_CRUMBS = {
  native:    { href: '/docs/elements/native/',           label: 'Native Elements' },
  custom:    { href: '/docs/elements/custom-elements/',  label: 'Custom Elements' },
  component: { href: '/docs/elements/web-components/',   label: 'Web Components' },
};

// Breadcrumb data for attribute pages
const ATTRIBUTE_CRUMBS = {
  native: { href: '/docs/attributes/native/', label: 'Native Attributes' },
  data:   { href: '/docs/attributes/data/',   label: 'Data Attributes' },
};

// Stats
const stats = {
  total: 0,
  converted: 0,
  skipped: 0,
  warnings: [],
};

// -------------------------------------------------------------------
// Main
// -------------------------------------------------------------------
function main() {
  const files = findNjkFiles(SITE_SRC);
  console.log(`Found ${files.length} .njk files${FILTER ? ` (filter: ${FILTER})` : ''}\n`);

  for (const filePath of files) {
    stats.total++;
    const relPath = relative(SITE_SRC, filePath);

    // Apply filter
    if (FILTER && !relPath.startsWith(FILTER)) {
      stats.skipped++;
      continue;
    }

    try {
      convertFile(filePath, relPath);
    } catch (err) {
      warn(relPath, `ERROR: ${err.message}`);
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log(`Total: ${stats.total} | Converted: ${stats.converted} | Skipped: ${stats.skipped}`);
  if (stats.warnings.length) {
    console.log(`\nWarnings (${stats.warnings.length}):`);
    for (const w of stats.warnings) {
      console.log(`  ⚠ ${w}`);
    }
  }
}

// -------------------------------------------------------------------
// Convert a single file
// -------------------------------------------------------------------
function convertFile(filePath, relPath) {
  const src = readFileSync(filePath, 'utf-8');

  // Parse front matter
  const fmMatch = src.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!fmMatch) {
    warn(relPath, 'No front matter found');
    stats.skipped++;
    return;
  }

  let frontMatter = fmMatch[1];
  let content = fmMatch[2];

  // Extract layout
  const layoutMatch = frontMatter.match(/^layout:\s*(.+)$/m);
  if (!layoutMatch) {
    warn(relPath, 'No layout in front matter');
    stats.skipped++;
    return;
  }

  const origLayout = layoutMatch[1].trim().replace(/^["']|["']$/g, '');
  const cookLayout = LAYOUT_MAP[origLayout];

  if (cookLayout === undefined) {
    warn(relPath, `Unknown layout: ${origLayout}`);
    stats.skipped++;
    return;
  }

  if (cookLayout === null) {
    // Skip layouts we haven't ported yet
    stats.skipped++;
    return;
  }

  // Update layout in front matter
  frontMatter = frontMatter.replace(/^layout:\s*.+$/m, `layout: ${cookLayout}`);

  // Remove permalink (Cook uses file-based routing)
  frontMatter = frontMatter.replace(/^permalink:\s*.+\n?/m, '');

  // Add breadcrumb data based on layout type
  frontMatter = addBreadcrumbData(frontMatter, cookLayout);

  // --- Content transformations ---

  // 1. Extract all {% set varName %}...{% endset %} blocks
  const setBlocks = extractSetBlocks(content);

  // 2. For each set block, find {{ varName | escape }} and inline the content
  for (const [varName, varContent] of Object.entries(setBlocks)) {
    // Pattern: {{ varName | escape }} — possibly with whitespace
    const escapePattern = new RegExp(`\\{\\{\\s*${escapeRegex(varName)}\\s*\\|\\s*escape\\s*\\}\\}`, 'g');
    const matches = content.match(escapePattern);

    if (matches) {
      // Find the <code-block> (or other element) containing {{ varName | escape }}
      // and replace with the raw content + data-escape attribute
      for (const match of matches) {
        content = inlineIntoCodeBlock(content, match, varContent);
      }
    }
  }

  // 3. Remove {% set %}...{% endset %} blocks (they've been inlined)
  content = content.replace(/\{%[-\s]*set\s+\w+\s*%\}[\s\S]*?\{%[-\s]*endset\s*%\}\n*/g, '');

  // 4. Handle {{ varName | safe }} — used for content in layouts, not in pages
  // In page content, {{ var | safe }} is rare. Replace with just the var reference.
  content = content.replace(/\{\{\s*(\w+)\s*\|\s*safe\s*\}\}/g, (m, varName) => {
    // If it's 'content', it's a layout thing — shouldn't be in pages
    if (varName === 'content') return m;
    return `\${${varName}}`;
  });

  // 5. Warn about remaining complex Nunjucks patterns (not converted)
  const complexPatterns = [
    { pattern: /\{%[-\s]*for\s/g, name: '{% for %}' },
    { pattern: /\{%[-\s]*if\s/g, name: '{% if %}' },
    { pattern: /\{%[-\s]*from\s/g, name: '{% from %}' },
    { pattern: /\{%[-\s]*block\s/g, name: '{% block %}' },
    { pattern: /\{%[-\s]*include\s/g, name: '{% include %}' },
    { pattern: /\{%[-\s]*macro\s/g, name: '{% macro %}' },
  ];

  let hasComplex = false;
  for (const { pattern, name } of complexPatterns) {
    const matches = content.match(pattern);
    if (matches) {
      warn(relPath, `${matches.length}x ${name} (not converted)`);
      hasComplex = true;
    }
  }

  // 6. Convert remaining simple {{ var }} to ${var} for Cook template strings
  // But skip {{ var | escape }} (should already be inlined) and {{ var | safe }}
  content = content.replace(/\{\{\s*(\w[\w.]*)\s*\}\}/g, (m, varName) => {
    return `\${${varName}}`;
  });

  // 7. Strip any remaining simple Nunjucks set statements (e.g., {% set x = "val" %})
  content = content.replace(/\{%[-\s]*set\s+\w+\s*=\s*[^%]*%\}\n*/g, '');

  // Clean up extra blank lines
  content = content.replace(/\n{3,}/g, '\n\n');

  // Build output
  const output = `---\n${frontMatter.trim()}\n---\n${content}`;

  // Write file
  const outPath = resolve(COOK_SRC, relPath.replace(/\.njk$/, '.html'));

  if (DRY_RUN) {
    console.log(`  [dry-run] ${relPath} → ${relative(COOK_SRC, outPath)}${hasComplex ? ' ⚠' : ''}`);
  } else {
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, output, 'utf-8');
    console.log(`  ✓ ${relPath}${hasComplex ? ' ⚠' : ''}`);
  }

  stats.converted++;
}

// -------------------------------------------------------------------
// Extract {% set varName %}...{% endset %} blocks
// -------------------------------------------------------------------
function extractSetBlocks(content) {
  const blocks = {};
  const pattern = /\{%[-\s]*set\s+(\w+)\s*%\}([\s\S]*?)\{%[-\s]*endset\s*%\}/g;
  let match;
  while ((match = pattern.exec(content)) !== null) {
    blocks[match[1]] = match[2];
  }
  return blocks;
}

// -------------------------------------------------------------------
// Inline set-block content into the element containing {{ var | escape }}
// -------------------------------------------------------------------
function inlineIntoCodeBlock(content, escapeRef, rawContent) {
  // Find the code-block (or other tag) that contains this escape reference
  // Pattern: <code-block ...>{{ varName | escape }}</code-block>
  // We need to add data-escape and replace the reference with raw content

  // Try to find a code-block wrapping this reference
  const codeBlockPattern = new RegExp(
    `(<code-block\\b[^>]*>)\\s*${escapeRegex(escapeRef)}\\s*(</code-block>)`,
    'g'
  );

  if (codeBlockPattern.test(content)) {
    // Reset lastIndex after test
    codeBlockPattern.lastIndex = 0;
    return content.replace(codeBlockPattern, (m, openTag, closeTag) => {
      // Add data-escape to the opening tag if not already present
      if (!openTag.includes('data-escape')) {
        openTag = openTag.replace('>', ' data-escape>');
      }
      return `${openTag}${rawContent}${closeTag}`;
    });
  }

  // If not inside a code-block, just replace the reference with raw content
  // (rare case — e.g., inside a <pre> or other element)
  return content.replace(escapeRef, rawContent);
}

// -------------------------------------------------------------------
// Add breadcrumb front matter based on layout type
// -------------------------------------------------------------------
function addBreadcrumbData(frontMatter, layout) {
  if (layout === 'element') {
    const categoryMatch = frontMatter.match(/^category:\s*(.+)$/m);
    if (categoryMatch) {
      const category = categoryMatch[1].trim();
      const crumb = ELEMENT_CRUMBS[category];
      if (crumb && !frontMatter.includes('crumbHref')) {
        frontMatter += `\ncrumbHref: ${crumb.href}`;
        frontMatter += `\ncrumbLabel: ${crumb.label}`;
      }
    }
  }

  if (layout === 'attribute') {
    const typeMatch = frontMatter.match(/^attributeType:\s*(.+)$/m);
    if (typeMatch) {
      const attrType = typeMatch[1].trim();
      const crumb = ATTRIBUTE_CRUMBS[attrType];
      if (crumb && !frontMatter.includes('crumbHref')) {
        frontMatter += `\ncrumbHref: ${crumb.href}`;
        frontMatter += `\ncrumbLabel: ${crumb.label}`;
      }
    }
  }

  return frontMatter;
}

// -------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------
function findNjkFiles(dir) {
  const results = [];
  function walk(d) {
    for (const entry of readdirSync(d)) {
      const full = resolve(d, entry);
      if (statSync(full).isDirectory()) {
        walk(full);
      } else if (extname(full) === '.njk') {
        results.push(full);
      }
    }
  }
  walk(dir);
  return results.sort();
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function warn(file, msg) {
  stats.warnings.push(`${file}: ${msg}`);
}

// Run
main();
