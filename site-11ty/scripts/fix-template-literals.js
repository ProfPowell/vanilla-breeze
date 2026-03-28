#!/usr/bin/env node
/**
 * Fix unconverted Astro template literals in 11ty .njk files.
 *
 * Converts:
 *   <code-block ...>{`content`}</code-block>
 *
 * To:
 *   {% set _codeN %}content{% endset %}
 *   <code-block ...>{{ _codeN | escape }}</code-block>
 *
 * Also handles non-code-block contexts (e.g. <td><code>{`...`}</code></td>)
 * by just stripping the {` `} wrapper.
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { resolve, relative } from 'path';

const pagesDir = resolve(import.meta.dirname, '..', 'src', 'pages');

function walkDir(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDir(fullPath));
    } else if (entry.name.endsWith('.njk')) {
      results.push(fullPath);
    }
  }
  return results;
}

const files = walkDir(pagesDir);
let totalFixed = 0;
let filesFixed = 0;

for (const filePath of files) {
  let content = readFileSync(filePath, 'utf8');
  const origContent = content;

  // Match: <code-block ...>{`...`}</code-block>
  const codeBlockRegex = /(<code-block[^>]*>)\{\`([\s\S]*?)\`\}(<\/code-block>)/g;
  const matches = [...content.matchAll(codeBlockRegex)];

  if (matches.length === 0) continue;

  // Count existing _code variables in file to pick starting counter
  const existingVars = [...content.matchAll(/\{%[-\s]*set\s+_code(\d+)\s/g)];
  let counter = existingVars.length > 0
    ? Math.max(...existingVars.map(m => parseInt(m[1], 10))) + 1
    : 1;

  // Replace from end to start to preserve offsets
  for (let i = matches.length - 1; i >= 0; i--) {
    const match = matches[i];
    const [fullMatch, openTag, codeContent, closeTag] = match;
    const varName = `_code${counter++}`;

    // Insert {% set %} before the code-block and use {{ var | escape }} inside
    const replacement = `{% set ${varName} %}${codeContent}{% endset %}\n    ${openTag}{{ ${varName} | escape }}${closeTag}`;

    content =
      content.substring(0, match.index) +
      replacement +
      content.substring(match.index + fullMatch.length);
  }

  if (content !== origContent) {
    writeFileSync(filePath, content);
    const rel = relative(resolve(import.meta.dirname, '..'), filePath);
    console.log(`${rel}: fixed ${matches.length} template literal(s)`);
    totalFixed += matches.length;
    filesFixed++;
  }
}

console.log(`\nDone: ${totalFixed} template literals fixed across ${filesFixed} files`);
