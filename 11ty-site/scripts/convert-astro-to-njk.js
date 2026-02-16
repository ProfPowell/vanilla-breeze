#!/usr/bin/env node
/**
 * Astro → Nunjucks Converter
 *
 * Converts .astro page files to .njk templates for the 11ty site.
 * Handles the mechanical transformation for uniform element/pattern/attribute/docs pages.
 *
 * Usage:
 *   node scripts/convert-astro-to-njk.js <astro-file-or-dir> [--dry-run]
 *
 * Examples:
 *   node scripts/convert-astro-to-njk.js ../site/pages/docs/elements/native/a.astro
 *   node scripts/convert-astro-to-njk.js ../site/pages/docs/elements/native/
 *   node scripts/convert-astro-to-njk.js ../site/pages/docs/elements/native/ --dry-run
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, dirname, basename, relative, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE_PAGES = join(__dirname, '../../site/pages');
const OUTPUT_DIR = join(__dirname, '../src/pages');

// Layout mapping
const LAYOUT_MAP = {
  ElementLayout: 'layouts/element.njk',
  DocsLayout: 'layouts/docs.njk',
  PatternLayout: 'layouts/pattern.njk',
  AttributeLayout: 'layouts/attribute.njk',
  LabLayout: 'layouts/lab.njk',
  LandingLayout: 'layouts/landing.njk',
  BlogLayout: 'layouts/blog.njk',
};

// ------------------------------------------------------------------
// Parsing helpers
// ------------------------------------------------------------------

/**
 * Split an .astro file into frontmatter (JS) and template (HTML) parts.
 */
function splitAstro(source) {
  const match = source.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return { frontmatter: '', template: source };
  }
  return { frontmatter: match[1], template: match[2] };
}

/**
 * Extract the layout name from an import statement.
 * e.g. "import ElementLayout from '../../../../layouts/ElementLayout.astro';"
 */
function extractLayoutName(frontmatter) {
  const match = frontmatter.match(/import\s+(\w+)\s+from\s+['"].*?layouts\/\w+\.astro['"]/);
  return match ? match[1] : null;
}

/**
 * Extract template literal variables from JS frontmatter.
 * Handles multi-line backtick strings: const name = `content`;
 */
function extractTemplateLiterals(frontmatter) {
  const vars = {};
  // Match: const name = `content`;
  // Must handle nested backticks that are escaped with \`
  const regex = /const\s+(\w+)\s*=\s*`([\s\S]*?)(?<!\\)`;/g;
  let match;
  while ((match = regex.exec(frontmatter)) !== null) {
    let content = match[2];
    // Unescape template literal escapes
    content = content.replace(/\\`/g, '`');
    content = content.replace(/\\\$/g, '$');
    vars[match[1]] = content;
  }
  return vars;
}

/**
 * Extract props from the layout component opening tag.
 * e.g. <ElementLayout title="button" elementName="button" category="native" ...>
 */
function extractLayoutProps(template, layoutName) {
  // Match the opening tag, which may span multiple lines
  const tagRegex = new RegExp(`<${layoutName}\\b([\\s\\S]*?)>`, 'm');
  const match = template.match(tagRegex);
  if (!match) return {};

  const propsString = match[1];
  const props = {};

  // Match key="value" pairs
  const propRegex = /(\w+)="([^"]*?)"/g;
  let propMatch;
  while ((propMatch = propRegex.exec(propsString)) !== null) {
    props[propMatch[1]] = propMatch[2];
  }

  // Match key={value} pairs (JSX expression props)
  const jsxPropRegex = /(\w+)=\{([^}]+)\}/g;
  while ((propMatch = jsxPropRegex.exec(propsString)) !== null) {
    // For boolean-like values, convert to string
    const val = propMatch[2].trim();
    if (val === 'true' || val === 'false') {
      props[propMatch[1]] = val === 'true';
    } else {
      props[propMatch[1]] = val;
    }
  }

  return props;
}

/**
 * Extract the inner content of the layout component.
 */
function extractLayoutContent(template, layoutName) {
  // Find opening tag end
  const openRegex = new RegExp(`<${layoutName}\\b[\\s\\S]*?>`, 'm');
  const openMatch = template.match(openRegex);
  if (!openMatch) return template.trim();

  const afterOpen = template.slice(openMatch.index + openMatch[0].length);

  // Find closing tag
  const closeRegex = new RegExp(`</${layoutName}>\\s*$`, 'm');
  const closeMatch = afterOpen.match(closeRegex);
  if (!closeMatch) return afterOpen.trim();

  return afterOpen.slice(0, closeMatch.index).trim();
}

/**
 * Determine the permalink from the source file path.
 */
function getPermalink(sourceFile) {
  const rel = relative(SITE_PAGES, sourceFile);
  // Remove .astro extension
  let path = rel.replace(/\.astro$/, '');
  // If it's an index file, the URL is the directory
  if (path.endsWith('/index')) {
    path = path.slice(0, -'/index'.length);
  }
  return '/' + path + '/';
}

// ------------------------------------------------------------------
// Conversion
// ------------------------------------------------------------------

/**
 * Convert variable references {varName} to {{ varName | safe }} in the template body.
 * Only converts references to known template literal variables.
 */
function convertVariableRefs(content, varNames) {
  for (const name of varNames) {
    // Match {varName} but not {{varName}} and not {varName stuff}
    // In Astro, code block content uses {varName} for the code example
    const regex = new RegExp(`\\{${name}\\}`, 'g');
    content = content.replace(regex, `{{ ${name} | safe }}`);
  }
  return content;
}

/**
 * Convert JSX literal expressions like {'{ index: number }'} to plain text.
 * These are JSX expressions that render a literal string.
 */
function convertJsxLiterals(content) {
  // Match {'string'} or {"string"}
  content = content.replace(/\{'([^']*?)'\}/g, '$1');
  content = content.replace(/\{"([^"]*?)"\}/g, '$1');
  return content;
}

/**
 * Convert a single .astro file to .njk format.
 * Returns { outputPath, content } or null if conversion failed.
 */
function convertFile(sourceFile) {
  const source = readFileSync(sourceFile, 'utf-8');
  const { frontmatter, template } = splitAstro(source);

  // Extract layout
  const layoutName = extractLayoutName(frontmatter);
  if (!layoutName) {
    console.warn(`  SKIP: No layout import found in ${sourceFile}`);
    return null;
  }

  const layout = LAYOUT_MAP[layoutName];
  if (!layout) {
    console.warn(`  SKIP: Unknown layout '${layoutName}' in ${sourceFile}`);
    return null;
  }

  // Extract template literal code examples
  const templateLiterals = extractTemplateLiterals(frontmatter);
  const varNames = Object.keys(templateLiterals);

  // Extract layout props
  const props = extractLayoutProps(template, layoutName);

  // Extract inner content
  let content = extractLayoutContent(template, layoutName);

  // Convert variable references
  content = convertVariableRefs(content, varNames);

  // Convert JSX literal expressions
  content = convertJsxLiterals(content);

  // Build permalink
  const permalink = props.currentPath || getPermalink(sourceFile);

  // Build YAML front matter
  const yamlLines = [];
  yamlLines.push(`layout: ${layout}`);
  yamlLines.push(`title: "${(props.title || '').replace(/"/g, '\\"')}"`);

  if (props.description) {
    yamlLines.push(`description: "${props.description.replace(/"/g, '\\"')}"`);
  }

  // Layout-specific props
  if (layoutName === 'ElementLayout') {
    if (props.elementName) yamlLines.push(`elementName: ${props.elementName}`);
    if (props.category) yamlLines.push(`category: ${props.category}`);
    if (props.nativeGroup) yamlLines.push(`nativeGroup: ${props.nativeGroup}`);
  } else if (layoutName === 'PatternLayout') {
    if (props.patternName) yamlLines.push(`patternName: "${props.patternName}"`);
    if (props.category) yamlLines.push(`category: ${props.category}`);
  } else if (layoutName === 'AttributeLayout') {
    if (props.attributeName) yamlLines.push(`attributeName: ${props.attributeName}`);
    if (props.category) yamlLines.push(`category: ${props.category}`);
  } else if (layoutName === 'DocsLayout') {
    if (props.currentSection) yamlLines.push(`currentSection: ${props.currentSection}`);
  } else if (layoutName === 'LabLayout') {
    // No extra props
  }

  yamlLines.push(`currentPath: ${permalink}`);
  yamlLines.push(`permalink: ${permalink}`);

  // Build {% set %} blocks for template literals
  const setBlocks = [];
  for (const [name, value] of Object.entries(templateLiterals)) {
    setBlocks.push(`{% set ${name} %}${value}{% endset %}`);
  }

  // Handle inline <style> blocks - move to extraHead
  let extraHead = '';
  const styleMatch = content.match(/^\s*<style>([\s\S]*?)<\/style>\s*/);
  if (styleMatch) {
    extraHead = `\n{% block extraHead %}\n<style>${styleMatch[1]}</style>\n{% endblock %}\n`;
    content = content.replace(styleMatch[0], '');
  }

  // Assemble output
  const parts = [];
  parts.push('---');
  parts.push(yamlLines.join('\n'));
  parts.push('---');
  if (setBlocks.length > 0) {
    parts.push('');
    parts.push(setBlocks.join('\n\n'));
  }
  if (extraHead) {
    parts.push(extraHead);
  }
  parts.push('');
  parts.push(content);
  parts.push('');

  const output = parts.join('\n');

  // Determine output path
  const rel = relative(SITE_PAGES, sourceFile);
  let outPath = rel.replace(/\.astro$/, '.njk');
  const outputFile = join(OUTPUT_DIR, outPath);

  return { outputPath: outputFile, content: output, permalink };
}

// ------------------------------------------------------------------
// CLI
// ------------------------------------------------------------------

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const targets = args.filter(a => !a.startsWith('--'));

if (targets.length === 0) {
  console.error('Usage: node scripts/convert-astro-to-njk.js <astro-file-or-dir> [--dry-run]');
  process.exit(1);
}

let totalFiles = 0;
let converted = 0;
let skipped = 0;
const errors = [];

function processFile(filePath) {
  if (!filePath.endsWith('.astro')) return;
  totalFiles++;

  try {
    const result = convertFile(filePath);
    if (!result) {
      skipped++;
      return;
    }

    if (dryRun) {
      console.log(`  WOULD WRITE: ${relative(OUTPUT_DIR, result.outputPath)}`);
      console.log(`    permalink: ${result.permalink}`);
    } else {
      mkdirSync(dirname(result.outputPath), { recursive: true });
      writeFileSync(result.outputPath, result.content, 'utf-8');
      console.log(`  WROTE: ${relative(OUTPUT_DIR, result.outputPath)}`);
    }
    converted++;
  } catch (err) {
    errors.push({ file: filePath, error: err.message });
    console.error(`  ERROR: ${filePath}: ${err.message}`);
  }
}

function processDir(dirPath) {
  const entries = readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name);
    if (entry.isDirectory()) {
      processDir(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.astro')) {
      processFile(fullPath);
    }
  }
}

for (const target of targets) {
  const fullTarget = target.startsWith('/') ? target : join(process.cwd(), target);
  const stat = statSync(fullTarget);
  if (stat.isDirectory()) {
    console.log(`Processing directory: ${fullTarget}`);
    processDir(fullTarget);
  } else {
    processFile(fullTarget);
  }
}

console.log(`\nSummary: ${converted} converted, ${skipped} skipped, ${errors.length} errors out of ${totalFiles} files`);
if (errors.length > 0) {
  console.log('\nErrors:');
  for (const { file, error } of errors) {
    console.log(`  ${file}: ${error}`);
  }
}
