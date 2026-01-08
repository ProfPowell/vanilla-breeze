#!/usr/bin/env node

/**
 * CSS Token Documentation Generator
 * Auto-documents design tokens from CSS files with visual previews.
 *
 * Features:
 * - Parse CSS custom properties from stylesheets
 * - Generate color swatches with contrast info
 * - Document spacing scale with visual preview
 * - Typography preview with sample text
 *
 * Usage:
 *   node scripts/document-tokens.js [css-file]
 *   node scripts/document-tokens.js examples/demo-site/assets/styles/main.css
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
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
 * Token categories with naming patterns
 */
const TOKEN_CATEGORIES = {
  colors: {
    name: 'Colors',
    patterns: [
      /^--gray-/, /^--white$/, /^--black$/,
      /^--hue-/, /^--primary/, /^--secondary/, /^--accent/,
      /^--success/, /^--warning/, /^--error/, /^--info/,
      /^--background/, /^--surface/, /^--text/, /^--border/, /^--overlay/,
      /^--color-/, /^--tag-/, /^--form-.*-color/, /^--dialog-backdrop/
    ],
    icon: '🎨'
  },
  spacing: {
    name: 'Spacing',
    patterns: [/^--spacing/, /^--space-/, /^--gap/],
    icon: '📏'
  },
  typography: {
    name: 'Typography',
    patterns: [/^--font/, /^--text-/, /^--weight-/, /^--leading-/, /^--tracking-/, /^--line-height/, /^--letter-spacing/],
    icon: '🔤'
  },
  effects: {
    name: 'Effects',
    patterns: [/^--shadow/, /^--transition/, /^--radius/, /^--border-radius/, /^--opacity/, /^--duration-/, /^--ease-/],
    icon: '✨'
  },
  layout: {
    name: 'Layout',
    patterns: [/^--max-/, /^--min-/, /^--content-/, /^--sidebar/, /^--header/, /^--z-/, /^--modal-/, /^--card-/],
    icon: '📐'
  },
  components: {
    name: 'Components',
    patterns: [/^--button-/, /^--input-/, /^--badge-/, /^--avatar-/, /^--spinner-/, /^--progress-/, /^--tab-/, /^--tooltip-/, /^--alert-/, /^--focus-/],
    icon: '🧩'
  },
  other: {
    name: 'Other',
    patterns: [],
    icon: '📦'
  }
};

/**
 * Parse CSS file and extract custom properties
 * @param {string} cssContent - CSS file content
 * @returns {Object} Parsed tokens by category
 */
function parseTokens(cssContent) {
  const tokens = {};
  Object.keys(TOKEN_CATEGORIES).forEach(cat => {
    tokens[cat] = [];
  });

  // Match custom property declarations: --name: value;
  const propertyRegex = /--([a-zA-Z0-9-]+)\s*:\s*([^;]+);/g;
  let match;

  while ((match = propertyRegex.exec(cssContent)) !== null) {
    const name = `--${match[1]}`;
    const value = match[2].trim();

    // Skip if it's a reference to another variable (we want source values)
    // But keep it if it's a color function or has a fallback
    const token = { name, value, rawValue: value };

    // Resolve references for display
    if (value.startsWith('var(')) {
      token.isReference = true;
    }

    // Categorize the token
    let categorized = false;
    for (const [category, config] of Object.entries(TOKEN_CATEGORIES)) {
      if (category === 'other') continue;

      for (const pattern of config.patterns) {
        if (pattern.test(name)) {
          // Avoid duplicates
          if (!tokens[category].some(t => t.name === name)) {
            tokens[category].push(token);
          }
          categorized = true;
          break;
        }
      }
      if (categorized) break;
    }

    if (!categorized) {
      if (!tokens.other.some(t => t.name === name)) {
        tokens.other.push(token);
      }
    }
  }

  return tokens;
}

/**
 * Detect if a value is a color
 * @param {string} value - CSS value
 * @returns {boolean}
 */
function isColorValue(value) {
  // Hex colors
  if (/^#[0-9a-fA-F]{3,8}$/.test(value)) return true;
  // RGB/RGBA/HSL/HSLA
  if (/^(rgb|rgba|hsl|hsla|oklab|oklch|color-mix)\s*\(/.test(value)) return true;
  // Named colors (basic set)
  const namedColors = ['white', 'black', 'red', 'green', 'blue', 'transparent'];
  if (namedColors.includes(value.toLowerCase())) return true;
  return false;
}

/**
 * Detect if a value is a spacing/size value
 * @param {string} value - CSS value
 * @returns {boolean}
 */
function _isSpacingValue(value) {
  return /^[\d.]+\s*(rem|em|px|%|vh|vw)$/.test(value);
}

/**
 * Generate color swatch HTML
 * @param {Object} token - Token object
 * @returns {string} HTML for color swatch
 */
function generateColorSwatch(token) {
  const { name, value, isReference } = token;
  const displayValue = isReference ? value : value;

  return `<article>
<figure style="background: ${value}; width: 100%; height: 80px; border-radius: 8px; border: 1px solid #e5e7eb;"></figure>
<dl>
<dt>Name</dt>
<dd><code>${escapeHtml(name)}</code></dd>
<dt>Value</dt>
<dd><code>${escapeHtml(displayValue)}</code></dd>
</dl>
</article>`;
}

/**
 * Generate spacing preview HTML
 * @param {Object} token - Token object
 * @returns {string} HTML for spacing preview
 */
function generateSpacingPreview(token) {
  const { name, value } = token;

  return `<tr>
<td><code>${escapeHtml(name)}</code></td>
<td><code>${escapeHtml(value)}</code></td>
<td><figure style="background: #3b82f6; height: 16px; width: ${value}; border-radius: 2px;"></figure></td>
</tr>`;
}

/**
 * Generate typography preview HTML
 * @param {Object} token - Token object
 * @returns {string} HTML for typography preview
 */
function generateTypographyPreview(token) {
  const { name, value } = token;
  let previewStyle = '';
  let sampleText = 'The quick brown fox jumps over the lazy dog';

  if (name.includes('font-size')) {
    previewStyle = `font-size: ${value}`;
    sampleText = `Sample at ${value}`;
  } else if (name.includes('font-weight')) {
    previewStyle = `font-weight: ${value}`;
    sampleText = `Weight ${value}`;
  } else if (name.includes('line-height')) {
    previewStyle = `line-height: ${value}`;
  } else if (name.includes('font-family') || name.includes('font-sans') || name.includes('font-mono') || name.includes('font-serif')) {
    previewStyle = `font-family: ${value}`;
  } else if (name.includes('letter-spacing')) {
    previewStyle = `letter-spacing: ${value}`;
  }

  return `<tr>
<td><code>${escapeHtml(name)}</code></td>
<td><code>${escapeHtml(value)}</code></td>
<td><span style="${previewStyle}">${escapeHtml(sampleText)}</span></td>
</tr>`;
}

/**
 * Generate effects preview HTML
 * @param {Object} token - Token object
 * @returns {string} HTML for effects preview
 */
function generateEffectsPreview(token) {
  const { name, value } = token;
  let previewStyle = '';

  if (name.includes('shadow')) {
    previewStyle = `box-shadow: ${value}; background: white; padding: 16px;`;
  } else if (name.includes('radius')) {
    previewStyle = `border-radius: ${value}; background: #3b82f6; width: 48px; height: 48px;`;
  } else if (name.includes('transition')) {
    previewStyle = `background: #3b82f6; width: 48px; height: 24px; border-radius: 4px;`;
  }

  const preview = previewStyle
    ? `<figure style="${previewStyle}"></figure>`
    : '<span>—</span>';

  return `<tr>
<td><code>${escapeHtml(name)}</code></td>
<td><code>${escapeHtml(value)}</code></td>
<td>${preview}</td>
</tr>`;
}

/**
 * Generate generic token table row
 * @param {Object} token - Token object
 * @returns {string} HTML table row
 */
function generateGenericRow(token) {
  const { name, value } = token;

  return `<tr>
<td><code>${escapeHtml(name)}</code></td>
<td><code>${escapeHtml(value)}</code></td>
</tr>`;
}

/**
 * Escape HTML entities
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
 * Generate the token documentation HTML
 * @param {Object} tokens - Parsed tokens by category
 * @param {string} sourceFile - Source CSS file path
 * @returns {string} Complete HTML document
 */
function generateDocumentationHtml(tokens, sourceFile) {
  const timestamp = new Date().toISOString();
  const totalTokens = Object.values(tokens).reduce((sum, cat) => sum + cat.length, 0);

  // Generate sections for each category
  const sections = [];

  // Colors section - grid of swatches
  if (tokens.colors.length > 0) {
    const swatches = tokens.colors
      .filter(t => isColorValue(t.value) || t.value.startsWith('var('))
      .map(generateColorSwatch)
      .join('\n');

    sections.push(`<section id="colors" aria-labelledby="colors-heading">
<h2 id="colors-heading">${TOKEN_CATEGORIES.colors.icon} ${TOKEN_CATEGORIES.colors.name}</h2>
<p><strong>${tokens.colors.length}</strong> color tokens defined.</p>
<section class="color-grid">
${swatches}
</section>
</section>`);
  }

  // Spacing section - table with visual bars
  if (tokens.spacing.length > 0) {
    const rows = tokens.spacing.map(generateSpacingPreview).join('\n');

    sections.push(`<section id="spacing" aria-labelledby="spacing-heading">
<h2 id="spacing-heading">${TOKEN_CATEGORIES.spacing.icon} ${TOKEN_CATEGORIES.spacing.name}</h2>
<p><strong>${tokens.spacing.length}</strong> spacing tokens defined.</p>
<table>
<thead>
<tr>
<th scope="col">Token</th>
<th scope="col">Value</th>
<th scope="col">Preview</th>
</tr>
</thead>
<tbody>
${rows}
</tbody>
</table>
</section>`);
  }

  // Typography section - table with text previews
  if (tokens.typography.length > 0) {
    const rows = tokens.typography.map(generateTypographyPreview).join('\n');

    sections.push(`<section id="typography" aria-labelledby="typography-heading">
<h2 id="typography-heading">${TOKEN_CATEGORIES.typography.icon} ${TOKEN_CATEGORIES.typography.name}</h2>
<p><strong>${tokens.typography.length}</strong> typography tokens defined.</p>
<table>
<thead>
<tr>
<th scope="col">Token</th>
<th scope="col">Value</th>
<th scope="col">Preview</th>
</tr>
</thead>
<tbody>
${rows}
</tbody>
</table>
</section>`);
  }

  // Effects section - table with visual previews
  if (tokens.effects.length > 0) {
    const rows = tokens.effects.map(generateEffectsPreview).join('\n');

    sections.push(`<section id="effects" aria-labelledby="effects-heading">
<h2 id="effects-heading">${TOKEN_CATEGORIES.effects.icon} ${TOKEN_CATEGORIES.effects.name}</h2>
<p><strong>${tokens.effects.length}</strong> effect tokens defined.</p>
<table>
<thead>
<tr>
<th scope="col">Token</th>
<th scope="col">Value</th>
<th scope="col">Preview</th>
</tr>
</thead>
<tbody>
${rows}
</tbody>
</table>
</section>`);
  }

  // Layout section - simple table
  if (tokens.layout.length > 0) {
    const rows = tokens.layout.map(generateGenericRow).join('\n');

    sections.push(`<section id="layout" aria-labelledby="layout-heading">
<h2 id="layout-heading">${TOKEN_CATEGORIES.layout.icon} ${TOKEN_CATEGORIES.layout.name}</h2>
<p><strong>${tokens.layout.length}</strong> layout tokens defined.</p>
<table>
<thead>
<tr>
<th scope="col">Token</th>
<th scope="col">Value</th>
</tr>
</thead>
<tbody>
${rows}
</tbody>
</table>
</section>`);
  }

  // Other section - simple table
  if (tokens.other.length > 0) {
    const rows = tokens.other.map(generateGenericRow).join('\n');

    sections.push(`<section id="other" aria-labelledby="other-heading">
<h2 id="other-heading">${TOKEN_CATEGORIES.other.icon} ${TOKEN_CATEGORIES.other.name}</h2>
<p><strong>${tokens.other.length}</strong> other tokens defined.</p>
<table>
<thead>
<tr>
<th scope="col">Token</th>
<th scope="col">Value</th>
</tr>
</thead>
<tbody>
${rows}
</tbody>
</table>
</section>`);
  }

  // Generate table of contents
  const toc = Object.entries(TOKEN_CATEGORIES)
    .filter(([key]) => tokens[key].length > 0)
    .map(([key, config]) => `<li><a href="#${key}">${config.icon} ${config.name} (${tokens[key].length})</a></li>`)
    .join('\n');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Design Token Documentation</title>
<meta name="description" content="Living documentation of CSS design tokens with visual previews."/>
<meta name="generator" content="document-tokens.js"/>
<style>
:root {
--color-bg: #fafafa;
--color-surface: #fff;
--color-text: #1a1a1a;
--color-text-dim: #666;
--color-border: #e0e0e0;
--color-primary: #3b82f6;
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
--color-primary: #60a5fa;
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

nav ul {
display: flex;
flex-wrap: wrap;
gap: var(--space-sm);
list-style: none;
padding: 0;
margin: var(--space-md) 0;
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
font-size: 0.9rem;
}

nav a:hover { text-decoration: underline; }

.color-grid {
display: grid;
grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
gap: var(--space-md);
margin-top: var(--space-md);
}

.color-grid article {
background: var(--color-surface);
border: 1px solid var(--color-border);
border-radius: 8px;
padding: var(--space-md);
}

.color-grid dl {
display: grid;
grid-template-columns: auto 1fr;
gap: var(--space-xs) var(--space-sm);
margin: var(--space-sm) 0 0;
font-size: 0.85rem;
}

.color-grid dt {
font-weight: 600;
color: var(--color-text-dim);
}

.color-grid dd { margin: 0; overflow: hidden; text-overflow: ellipsis; }

table {
width: 100%;
border-collapse: collapse;
background: var(--color-surface);
border-radius: 8px;
overflow: hidden;
border: 1px solid var(--color-border);
margin-top: var(--space-md);
}

th, td {
padding: var(--space-sm) var(--space-md);
text-align: left;
border-bottom: 1px solid var(--color-border);
}

th {
background: var(--color-bg);
font-weight: 600;
}

tr:last-child td { border-bottom: none; }

code {
font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
font-size: 0.85em;
background: var(--color-bg);
padding: 2px 4px;
border-radius: 3px;
}

figure {
margin: 0;
display: inline-block;
}

footer {
margin-top: var(--space-xl);
padding-top: var(--space-lg);
border-top: 1px solid var(--color-border);
color: var(--color-text-dim);
font-size: 0.85rem;
}

@media (max-width: 600px) {
.color-grid { grid-template-columns: 1fr; }
}
</style>
</head>
<body>
<header>
<h1>Design Token Documentation</h1>
<p>Living documentation of CSS design tokens.</p>
<p><strong>${totalTokens}</strong> tokens documented from <code>${escapeHtml(sourceFile)}</code></p>
</header>

<nav aria-label="Token categories">
<ul>
${toc}
</ul>
</nav>

<main>
${sections.join('\n\n')}
</main>

<footer>
<p>Generated: <time datetime="${timestamp}">${new Date().toLocaleString()}</time></p>
<p>Source: <code>${escapeHtml(sourceFile)}</code></p>
</footer>
</body>
</html>
`;
}

/**
 * Find default CSS file to document
 * @returns {string|null} Path to CSS file
 */
function findDefaultCssFile() {
  // First check for the new token system
  const tokensDir = join(ROOT, 'styles', 'tokens');
  if (existsSync(tokensDir)) {
    return tokensDir; // Return directory path for multi-file scanning
  }

  const candidates = [
    'examples/demo-site/assets/styles/main.css',
    'examples/demo-site-claude-2/styles/main.css',
    'examples/demo-code/styles/main.css',
    'patterns/components/components.css'
  ];

  for (const candidate of candidates) {
    const fullPath = join(ROOT, candidate);
    if (existsSync(fullPath)) {
      return fullPath;
    }
  }

  return null;
}

/**
 * Read all CSS files from a directory (recursively)
 * @param {string} dir - Directory path
 * @returns {string} Combined CSS content
 */
function readTokensDirectory(dir) {
  const { readdirSync, statSync } = require('fs');
  let combined = '';

  const files = readdirSync(dir);
  for (const file of files) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      combined += readTokensDirectory(filePath);
    } else if (file.endsWith('.css')) {
      combined += `\n/* === ${file} === */\n`;
      combined += readFileSync(filePath, 'utf-8');
    }
  }

  return combined;
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  let cssFile = null;
  let outputDir = join(ROOT, 'docs', 'tokens');

  // Parse arguments
  for (const arg of args) {
    if (arg.startsWith('--output=')) {
      outputDir = resolve(arg.split('=')[1]);
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
${colors.cyan}Design Token Documentation Generator${colors.reset}

Generates visual documentation for CSS design tokens.

Usage:
  node scripts/document-tokens.js [css-file] [options]

Options:
  --output=PATH   Output directory (default: docs/tokens)
  --help, -h      Show this help

Examples:
  node scripts/document-tokens.js
  node scripts/document-tokens.js examples/demo-site/assets/styles/main.css
  node scripts/document-tokens.js --output=./my-docs

Output:
  docs/tokens/index.html - Token documentation with visual previews
`);
      process.exit(0);
    } else if (!arg.startsWith('--')) {
      cssFile = resolve(arg);
    }
  }

  // Find CSS file if not specified
  if (!cssFile) {
    cssFile = findDefaultCssFile();
    if (!cssFile) {
      console.error(`${colors.red}No CSS file found. Specify a file as an argument.${colors.reset}`);
      process.exit(1);
    }
  }

  if (!existsSync(cssFile)) {
    console.error(`${colors.red}CSS file not found: ${cssFile}${colors.reset}`);
    process.exit(1);
  }

  console.log(`${colors.cyan}Design Token Documentation Generator${colors.reset}\n`);

  // Read and parse CSS (support both single file and directory)
  const { statSync } = require('fs');
  const isDirectory = statSync(cssFile).isDirectory();

  console.log(`${colors.dim}Reading CSS ${isDirectory ? 'directory' : 'file'}...${colors.reset}`);
  console.log(`  Source: ${relative(ROOT, cssFile)}`);

  let cssContent;
  if (isDirectory) {
    cssContent = readTokensDirectory(cssFile);
    console.log(`  ${colors.dim}(scanning all .css files recursively)${colors.reset}`);
  } else {
    cssContent = readFileSync(cssFile, 'utf-8');
  }

  console.log(`\n${colors.dim}Parsing tokens...${colors.reset}`);
  const tokens = parseTokens(cssContent);

  // Display token counts
  let totalTokens = 0;
  for (const [category, config] of Object.entries(TOKEN_CATEGORIES)) {
    const count = tokens[category].length;
    totalTokens += count;
    if (count > 0) {
      console.log(`  ${colors.green}✓${colors.reset} ${config.name}: ${count} tokens`);
    }
  }
  console.log(`\n  Total: ${totalTokens} tokens found\n`);

  if (totalTokens === 0) {
    console.log(`${colors.yellow}No tokens found in the CSS file.${colors.reset}`);
    process.exit(0);
  }

  // Create output directory
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
    console.log(`${colors.dim}Created output directory: ${outputDir}${colors.reset}`);
  }

  // Generate documentation
  console.log(`${colors.dim}Generating documentation...${colors.reset}`);
  const html = generateDocumentationHtml(tokens, relative(ROOT, cssFile));

  // Write output file
  const outputPath = join(outputDir, 'index.html');
  writeFileSync(outputPath, html, 'utf-8');

  console.log(`\n${colors.green}✓ Token documentation generated${colors.reset}`);
  console.log(`  Output: ${relative(ROOT, outputPath)}`);
  console.log(`  Tokens: ${totalTokens}`);
}

main();
