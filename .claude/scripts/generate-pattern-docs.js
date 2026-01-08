#!/usr/bin/env node
/**
 * Pattern Documentation Generator
 *
 * Generates markdown documentation for patterns from patterns.json
 *
 * Usage:
 *   node scripts/generate-pattern-docs.js [pattern-name]
 *
 * Without arguments: generates docs for all patterns
 * With pattern name: generates doc for specific pattern
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PATTERNS_FILE = join(ROOT, 'patterns.json');
const DOCS_DIR = join(ROOT, 'docs', 'patterns');

/**
 * Load patterns from patterns.json
 */
function loadPatterns() {
  const content = readFileSync(PATTERNS_FILE, 'utf-8');
  const data = JSON.parse(content);
  return data.patterns || [];
}

/**
 * Generate markdown documentation for a pattern
 */
function generatePatternDoc(pattern) {
  const lines = [];

  // Title
  const title = pattern.name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  lines.push(`# ${title}`);
  lines.push('');

  // Status badge
  if (pattern.status) {
    const statusEmoji = {
      draft: '🚧',
      review: '👀',
      stable: '✅',
      deprecated: '⚠️'
    };
    lines.push(`**Status:** ${statusEmoji[pattern.status] || ''} ${pattern.status}`);
    lines.push('');
  }

  // Description
  lines.push('## Description');
  lines.push('');
  lines.push(pattern.description || 'No description provided.');
  lines.push('');

  // Anatomy
  if (pattern.anatomy && pattern.anatomy.length > 0) {
    lines.push('## Anatomy');
    lines.push('');
    for (const part of pattern.anatomy) {
      const required = part.required !== false ? '' : ' (optional)';
      const element = part.element ? ` \`<${part.element}>\`` : '';
      lines.push(`- **${part.name}**${required}:${element} ${part.description}`);
    }
    lines.push('');
  }

  // States
  if (pattern.states && pattern.states.length > 0) {
    lines.push('## States');
    lines.push('');
    lines.push('| State | Supported |');
    lines.push('|-------|-----------|');
    for (const state of pattern.states) {
      lines.push(`| ${state} | ✓ |`);
    }
    lines.push('');
  }

  // Variants
  if (pattern.variants && pattern.variants.length > 0) {
    lines.push('## Variants');
    lines.push('');
    for (const variant of pattern.variants) {
      lines.push(`### ${variant.name}`);
      lines.push('');
      lines.push(`**Attribute:** \`data-${variant.attribute}\``);
      if (variant.values) {
        lines.push(`**Values:** ${variant.values.map(v => `\`${v}\``).join(', ')}`);
      }
      if (variant.default) {
        lines.push(`**Default:** \`${variant.default}\``);
      }
      lines.push('');
    }
  }

  // Accessibility
  if (pattern.accessibility) {
    lines.push('## Accessibility');
    lines.push('');
    if (pattern.accessibility.role) {
      lines.push(`**Role:** \`${pattern.accessibility.role}\``);
      lines.push('');
    }
    if (pattern.accessibility.aria && pattern.accessibility.aria.length > 0) {
      lines.push('**ARIA attributes:**');
      for (const attr of pattern.accessibility.aria) {
        lines.push(`- \`${attr}\``);
      }
      lines.push('');
    }
    if (pattern.accessibility.keyboard && pattern.accessibility.keyboard.length > 0) {
      lines.push('**Keyboard:**');
      lines.push('');
      lines.push('| Key | Action |');
      lines.push('|-----|--------|');
      for (const kb of pattern.accessibility.keyboard) {
        lines.push(`| ${kb.key} | ${kb.action} |`);
      }
      lines.push('');
    }
  }

  // CSS Properties
  if (pattern.cssProperties && pattern.cssProperties.length > 0) {
    lines.push('## CSS Custom Properties');
    lines.push('');
    lines.push('| Property | Description | Default |');
    lines.push('|----------|-------------|---------|');
    for (const prop of pattern.cssProperties) {
      lines.push(`| \`${prop.name}\` | ${prop.description || ''} | ${prop.default || 'inherit'} |`);
    }
    lines.push('');
  }

  // Events
  if (pattern.events && pattern.events.length > 0) {
    lines.push('## Events');
    lines.push('');
    lines.push('| Event | Description |');
    lines.push('|-------|-------------|');
    for (const event of pattern.events) {
      lines.push(`| \`${event.name}\` | ${event.description || ''} |`);
    }
    lines.push('');
  }

  // Examples
  if (pattern.examples && pattern.examples.length > 0) {
    lines.push('## Examples');
    lines.push('');
    for (const example of pattern.examples) {
      lines.push(`### ${example.name}`);
      lines.push('');
      if (example.description) {
        lines.push(example.description);
        lines.push('');
      }
      lines.push('```html');
      lines.push(example.html);
      lines.push('```');
      lines.push('');
    }
  }

  // Related patterns
  if (pattern.related && pattern.related.length > 0) {
    lines.push('## Related Patterns');
    lines.push('');
    for (const rel of pattern.related) {
      lines.push(`- [${rel}](./${rel}.md)`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Write pattern documentation to file
 */
function writePatternDoc(pattern) {
  const categoryDir = join(DOCS_DIR, pattern.category);

  // Ensure directory exists
  if (!existsSync(categoryDir)) {
    mkdirSync(categoryDir, { recursive: true });
  }

  const docPath = join(categoryDir, `${pattern.name}.md`);
  const content = generatePatternDoc(pattern);

  writeFileSync(docPath, content);
  console.log(`✓ Generated: ${docPath}`);
}

/**
 * Generate index page for pattern library
 */
function generateIndex(patterns) {
  const lines = [];

  lines.push('# Pattern Library');
  lines.push('');
  lines.push('Browse available UI patterns organized by category.');
  lines.push('');

  // Group by category
  const byCategory = {};
  for (const pattern of patterns) {
    const cat = pattern.category || 'uncategorized';
    if (!byCategory[cat]) {
      byCategory[cat] = [];
    }
    byCategory[cat].push(pattern);
  }

  // Output by category
  const categoryOrder = ['form', 'navigation', 'content', 'feedback', 'layout', 'data'];

  for (const cat of categoryOrder) {
    if (!byCategory[cat]) continue;

    const catTitle = cat.charAt(0).toUpperCase() + cat.slice(1);
    lines.push(`## ${catTitle}`);
    lines.push('');

    for (const pattern of byCategory[cat]) {
      const status = pattern.status === 'stable' ? '✅' : pattern.status === 'draft' ? '🚧' : '';
      lines.push(`- [${pattern.name}](./${cat}/${pattern.name}.md) ${status}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Main entry point
 */
function main() {
  const targetPattern = process.argv[2];
  const patterns = loadPatterns();

  if (targetPattern) {
    // Generate specific pattern
    const pattern = patterns.find(p => p.name === targetPattern);
    if (!pattern) {
      console.error(`Pattern not found: ${targetPattern}`);
      process.exit(1);
    }
    writePatternDoc(pattern);
  } else {
    // Generate all patterns
    console.log(`Generating documentation for ${patterns.length} patterns...`);
    for (const pattern of patterns) {
      writePatternDoc(pattern);
    }

    // Generate index
    const indexPath = join(DOCS_DIR, 'README.md');
    writeFileSync(indexPath, generateIndex(patterns));
    console.log(`✓ Generated: ${indexPath}`);

    console.log('Done!');
  }
}

main();
