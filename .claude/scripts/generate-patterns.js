#!/usr/bin/env node

/**
 * Pattern Library Generator
 * Auto-generates a living pattern library from custom element definitions
 * and usage examples found in the codebase.
 *
 * Features:
 * - Extracts custom element usage examples from HTML files
 * - Generates HTML previews with syntax highlighting
 * - Documents attributes and variants
 * - Links to skill documentation
 *
 * Usage:
 *   node scripts/generate-patterns.js
 *   node scripts/generate-patterns.js --output=docs/patterns
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, mkdirSync } from 'fs';
import { join, dirname, resolve, relative } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');

// Colors for terminal output
const colors = {
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  dim: '\x1b[2m'
};

/**
 * Load custom element definitions from elements.json
 * @returns {Object} Element definitions
 */
function loadElementDefinitions() {
  const elementsPath = join(ROOT, 'elements.json');
  if (!existsSync(elementsPath)) {
    console.error(`${colors.red}elements.json not found${colors.reset}`);
    process.exit(1);
  }
  return JSON.parse(readFileSync(elementsPath, 'utf-8'));
}

/**
 * Find all HTML files in a directory recursively
 * @param {string} dir - Directory to search
 * @param {string[]} files - Accumulator for found files
 * @returns {string[]} List of HTML file paths
 */
function findHtmlFiles(dir, files = []) {
  if (!existsSync(dir)) return files;

  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      // Skip node_modules, hidden directories, and test fixtures
      if (!entry.startsWith('.') && entry !== 'node_modules' && !fullPath.includes('fixtures/invalid')) {
        findHtmlFiles(fullPath, files);
      }
    } else if (entry.endsWith('.html')) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Find usage examples of an element in HTML files
 * @param {string} elementName - Name of the custom element
 * @param {string[]} htmlFiles - List of HTML files to search
 * @returns {Object[]} Array of usage examples with file path and code snippet
 */
function findUsageExamples(elementName, htmlFiles) {
  const examples = [];
  const regex = new RegExp(`<${elementName}[\\s\\S]*?<\\/${elementName}>|<${elementName}[^>]*/?>`, 'gi');

  for (const file of htmlFiles) {
    const content = readFileSync(file, 'utf-8');
    const matches = content.match(regex);

    if (matches) {
      for (const match of matches) {
        // Only add unique examples (avoid duplicates)
        const normalized = match.trim();
        if (!examples.some(ex => ex.code === normalized)) {
          examples.push({
            file: relative(ROOT, file),
            code: normalized
          });
        }

        // Limit to 3 examples per element
        if (examples.length >= 3) break;
      }
    }

    if (examples.length >= 3) break;
  }

  return examples;
}

/**
 * Extract context around an element (parent element for context)
 * @param {string} elementName - Name of the custom element
 * @param {string[]} htmlFiles - List of HTML files to search
 * @returns {Object|null} Contextual usage example
 */
function findContextualExample(elementName, htmlFiles) {
  for (const file of htmlFiles) {
    const content = readFileSync(file, 'utf-8');

    // Look for the element with surrounding context (section or parent)
    const regex = new RegExp(
      `(<(?:section|article|aside|figure|div)[^>]*>[\\s\\S]*?<${elementName}[\\s\\S]*?<\\/${elementName}>[\\s\\S]*?<\\/(?:section|article|aside|figure|div)>)`,
      'i'
    );
    const match = content.match(regex);

    if (match) {
      return {
        file: relative(ROOT, file),
        code: formatCodeSnippet(match[1])
      };
    }
  }

  return null;
}

/**
 * Format a code snippet for display (normalize indentation)
 * @param {string} code - Raw code snippet
 * @returns {string} Formatted code
 */
function formatCodeSnippet(code) {
  const lines = code.split('\n');

  // Find minimum indentation (excluding empty lines)
  let minIndent = Infinity;
  for (const line of lines) {
    if (line.trim()) {
      const indent = line.match(/^\s*/)[0].length;
      minIndent = Math.min(minIndent, indent);
    }
  }

  // Remove minimum indentation from all lines
  if (minIndent < Infinity && minIndent > 0) {
    return lines.map(line => line.slice(minIndent)).join('\n').trim();
  }

  return code.trim();
}

/**
 * Escape HTML entities for display in HTML
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Get element type description
 * @param {Object} definition - Element definition from elements.json
 * @returns {string} Human-readable type description
 */
function getElementType(definition) {
  const types = [];

  if (definition.void) {
    types.push('void (self-closing)');
  }
  if (definition.phrasing) {
    types.push('inline');
  }
  if (definition.flow) {
    types.push('block');
  }

  return types.join(', ') || 'block';
}

/**
 * Format permitted content for display
 * @param {string[]|undefined} permittedContent - Permitted content array
 * @returns {string} Formatted content description
 */
function formatPermittedContent(permittedContent) {
  if (!permittedContent || permittedContent.length === 0) {
    return 'None (empty element)';
  }

  return permittedContent
    .map(c => {
      if (c === '@flow') return 'Flow content (block elements)';
      if (c === '@phrasing') return 'Phrasing content (inline elements)';
      if (c === '@interactive') return 'Interactive elements';
      return `<code>&lt;${c}&gt;</code>`;
    })
    .join(', ');
}

/**
 * Format attributes for display
 * @param {Object} attributes - Attributes definition
 * @returns {string} HTML table rows for attributes
 */
function formatAttributes(attributes) {
  if (!attributes || Object.keys(attributes).length === 0) {
    return '<tr><td colspan="4"><em>No attributes defined</em></td></tr>';
  }

  return Object.entries(attributes)
    .map(([name, def]) => {
      const required = def.required ? '<strong>Yes</strong>' : 'No';
      let type = 'String';
      if (def.boolean) {
        type = 'Boolean';
      } else if (def.enum) {
        type = `Enum: ${def.enum.join(', ')}`;
      }
      const description = def.boolean ? 'Boolean attribute (presence = true)' : '';

      return `<tr>
<td><code>${name}</code></td>
<td>${type}</td>
<td>${required}</td>
<td>${description}</td>
</tr>`;
    })
    .join('\n');
}

/**
 * Find related skill documentation
 * @param {string} elementName - Element name
 * @returns {Object|null} Related skill info
 */
function findRelatedSkill(elementName) {
  const skillMappings = {
    'form-field': { name: 'forms', path: '.claude/skills/forms/SKILL.md' },
    'faq-list': { name: 'patterns', path: '.claude/skills/patterns/SKILL.md' },
    'faq-question': { name: 'patterns', path: '.claude/skills/patterns/SKILL.md' },
    'faq-answer': { name: 'patterns', path: '.claude/skills/patterns/SKILL.md' },
    'product-card': { name: 'patterns', path: '.claude/skills/patterns/SKILL.md' },
    'gallery-grid': { name: 'responsive-images', path: '.claude/skills/responsive-images/SKILL.md' },
    'gallery-item': { name: 'responsive-images', path: '.claude/skills/responsive-images/SKILL.md' }
  };

  return skillMappings[elementName] || { name: 'custom-elements', path: '.claude/skills/custom-elements/SKILL.md' };
}

/**
 * Generate the pattern library HTML
 * @param {Object} elements - Element definitions
 * @param {Object} usageData - Usage examples for each element
 * @returns {string} Complete HTML document
 */
function generatePatternLibraryHtml(elements, usageData) {
  const elementNames = Object.keys(elements).sort();
  const timestamp = new Date().toISOString();

  // Generate table of contents
  const toc = elementNames
    .map(name => `<li><a href="#${name}">&lt;${name}&gt;</a></li>`)
    .join('\n');

  // Generate element sections
  const sections = elementNames.map(name => {
    const def = elements[name];
    const usage = usageData[name] || { examples: [], contextual: null };
    const skill = findRelatedSkill(name);

    // Examples HTML
    let examplesHtml = '';
    if (usage.examples.length > 0) {
      examplesHtml = usage.examples
        .map(ex => `<figure>
<figcaption>From: <code>${escapeHtml(ex.file)}</code></figcaption>
<pre><code>${escapeHtml(ex.code)}</code></pre>
</figure>`)
        .join('\n');
    } else {
      examplesHtml = '<p><em>No usage examples found in codebase.</em></p>';
    }

    // Contextual example HTML
    let contextualHtml = '';
    if (usage.contextual) {
      contextualHtml = `<h4>Full Context Example</h4>
<figure>
<figcaption>From: <code>${escapeHtml(usage.contextual.file)}</code></figcaption>
<pre><code>${escapeHtml(usage.contextual.code)}</code></pre>
</figure>`;
    }

    return `<section id="${name}" aria-labelledby="${name}-heading">
<h2 id="${name}-heading">&lt;${name}&gt;</h2>
<dl>
<dt>Type</dt>
<dd>${getElementType(def)}</dd>
<dt>Permitted Content</dt>
<dd>${formatPermittedContent(def.permittedContent)}</dd>
<dt>Related Skill</dt>
<dd><a href="${skill.path}">${skill.name}</a></dd>
</dl>
<h3>Attributes</h3>
<table>
<thead>
<tr>
<th scope="col">Name</th>
<th scope="col">Type</th>
<th scope="col">Required</th>
<th scope="col">Description</th>
</tr>
</thead>
<tbody>
${formatAttributes(def.attributes)}
</tbody>
</table>
<h3>Usage Examples</h3>
${examplesHtml}
${contextualHtml}
</section>`;
  }).join('\n');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Pattern Library - Custom Elements</title>
  <meta name="description" content="Living pattern library of custom elements with usage examples and documentation."/>
  <meta name="generator" content="generate-patterns.js"/>
  <style>
    :root {
      --color-bg: #fafafa;
      --color-surface: #fff;
      --color-text: #1a1a1a;
      --color-text-dim: #666;
      --color-border: #e0e0e0;
      --color-primary: #0066cc;
      --color-code-bg: #f5f5f5;
      --space-xs: 0.25rem;
      --space-sm: 0.5rem;
      --space-md: 1rem;
      --space-lg: 2rem;
      --space-xl: 4rem;
    }

    @media (prefers-color-scheme: dark) {
      :root {
        --color-bg: #1a1a1a;
        --color-surface: #2a2a2a;
        --color-text: #e0e0e0;
        --color-text-dim: #999;
        --color-border: #444;
        --color-primary: #66b3ff;
        --color-code-bg: #333;
      }
    }

    * { box-sizing: border-box; }

    body {
      font-family: system-ui, -apple-system, sans-serif;
      line-height: 1.6;
      max-width: 1200px;
      margin: 0 auto;
      padding: var(--space-lg);
      background: var(--color-bg);
      color: var(--color-text);
    }

    header {
      margin-bottom: var(--space-xl);
      padding-bottom: var(--space-lg);
      border-bottom: 1px solid var(--color-border);
    }

    h1 { margin-top: 0; }

    h2 {
      margin-top: var(--space-xl);
      padding-top: var(--space-lg);
      border-top: 1px solid var(--color-border);
    }

    h2:first-of-type {
      margin-top: 0;
      padding-top: 0;
      border-top: none;
    }

    nav ul {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-sm);
      list-style: none;
      padding: 0;
      margin: 0;
    }

    nav li {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 4px;
    }

    nav a {
      display: block;
      padding: var(--space-xs) var(--space-sm);
      color: var(--color-primary);
      text-decoration: none;
      font-family: monospace;
      font-size: 0.9rem;
    }

    nav a:hover {
      text-decoration: underline;
    }

    dl {
      display: grid;
      grid-template-columns: max-content 1fr;
      gap: var(--space-xs) var(--space-md);
      background: var(--color-surface);
      padding: var(--space-md);
      border-radius: 8px;
      border: 1px solid var(--color-border);
    }

    dt {
      font-weight: 600;
      color: var(--color-text-dim);
    }

    dd { margin: 0; }

    table {
      width: 100%;
      border-collapse: collapse;
      background: var(--color-surface);
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid var(--color-border);
    }

    th, td {
      padding: var(--space-sm) var(--space-md);
      text-align: left;
      border-bottom: 1px solid var(--color-border);
    }

    th {
      background: var(--color-code-bg);
      font-weight: 600;
    }

    tr:last-child td {
      border-bottom: none;
    }

    pre {
      background: var(--color-code-bg);
      padding: var(--space-md);
      border-radius: 8px;
      overflow-x: auto;
      border: 1px solid var(--color-border);
    }

    code {
      font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
      font-size: 0.9em;
    }

    pre code {
      display: block;
      white-space: pre;
    }

    figure {
      margin: var(--space-md) 0;
    }

    figcaption {
      font-size: 0.85rem;
      color: var(--color-text-dim);
      margin-bottom: var(--space-xs);
    }

    footer {
      margin-top: var(--space-xl);
      padding-top: var(--space-lg);
      border-top: 1px solid var(--color-border);
      color: var(--color-text-dim);
      font-size: 0.85rem;
    }

    @media (max-width: 600px) {
      dl {
        grid-template-columns: 1fr;
      }

      dt {
        margin-top: var(--space-sm);
      }

      dt:first-child {
        margin-top: 0;
      }
    }
  </style>
</head>
<body>
  <header>
    <h1>Pattern Library</h1>
    <p>Living documentation of custom elements defined in this project.</p>
    <p><strong>${elementNames.length}</strong> custom elements documented.</p>
  </header>

  <nav aria-label="Element navigation">
    <h2>Elements</h2>
    <ul>
      ${toc}
    </ul>
  </nav>

  <main>
    ${sections}
  </main>

  <footer>
    <p>Generated: <time datetime="${timestamp}">${new Date().toLocaleString()}</time></p>
    <p>Source: <code>elements.json</code> + usage examples from <code>examples/</code></p>
  </footer>
</body>
</html>
`;
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  let outputDir = join(ROOT, 'patterns');

  // Parse arguments
  for (const arg of args) {
    if (arg.startsWith('--output=')) {
      outputDir = resolve(arg.split('=')[1]);
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
${colors.cyan}Pattern Library Generator${colors.reset}

Generates a living pattern library from custom element definitions.

Usage:
  node scripts/generate-patterns.js [options]

Options:
  --output=PATH   Output directory (default: patterns)
  --help, -h      Show this help

Output:
  patterns/index.html - Main pattern library page
`);
      process.exit(0);
    }
  }

  console.log(`${colors.cyan}Pattern Library Generator${colors.reset}\n`);

  // Load element definitions
  console.log(`${colors.dim}Loading element definitions...${colors.reset}`);
  const elements = loadElementDefinitions();
  const elementCount = Object.keys(elements).length;
  console.log(`  Found ${elementCount} custom elements\n`);

  // Find HTML files for usage examples
  console.log(`${colors.dim}Scanning for usage examples...${colors.reset}`);
  const examplesDir = join(ROOT, 'examples');
  const htmlFiles = findHtmlFiles(examplesDir);
  console.log(`  Found ${htmlFiles.length} HTML files\n`);

  // Find usage examples for each element
  console.log(`${colors.dim}Extracting usage examples...${colors.reset}`);
  const usageData = {};
  let totalExamples = 0;

  for (const elementName of Object.keys(elements)) {
    const examples = findUsageExamples(elementName, htmlFiles);
    const contextual = findContextualExample(elementName, htmlFiles);

    usageData[elementName] = { examples, contextual };
    totalExamples += examples.length;

    if (examples.length > 0) {
      console.log(`  ${colors.green}✓${colors.reset} <${elementName}> - ${examples.length} example(s)`);
    } else {
      console.log(`  ${colors.yellow}○${colors.reset} <${elementName}> - no examples found`);
    }
  }
  console.log(`\n  Total: ${totalExamples} usage examples found\n`);

  // Create output directory
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
    console.log(`${colors.dim}Created output directory: ${outputDir}${colors.reset}`);
  }

  // Generate pattern library HTML
  console.log(`${colors.dim}Generating pattern library...${colors.reset}`);
  const html = generatePatternLibraryHtml(elements, usageData);

  // Write output file
  const outputPath = join(outputDir, 'index.html');
  writeFileSync(outputPath, html, 'utf-8');

  console.log(`\n${colors.green}✓ Pattern library generated${colors.reset}`);
  console.log(`  Output: ${relative(ROOT, outputPath)}`);
  console.log(`  Elements: ${elementCount}`);
  console.log(`  Examples: ${totalExamples}`);
}

main();
