#!/usr/bin/env node

/**
 * Fix Suggestions Script
 *
 * Parses validator output from stdin and suggests fixes for common errors.
 * Designed to be piped after validator output in PostToolUse hooks.
 *
 * Usage:
 *   npx eslint file.js 2>&1 | node scripts/fix-suggestions.js --type=js
 *   npx stylelint file.css 2>&1 | node scripts/fix-suggestions.js --type=css
 *   npx html-validate file.html 2>&1 | node scripts/fix-suggestions.js --type=html
 *   npx markdownlint file.md 2>&1 | node scripts/fix-suggestions.js --type=md
 */

import { createInterface } from 'readline';

// Parse command line arguments
const args = process.argv.slice(2);
const typeArg = args.find(a => a.startsWith('--type='));
const fileType = typeArg ? typeArg.split('=')[1] : 'unknown';

// Colors for terminal output
const colors = {
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  dim: '\x1b[2m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

// Collect all input lines
const lines = [];

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

rl.on('line', (line) => {
  // Pass through the original output
  console.log(line);
  lines.push(line);
});

rl.on('close', () => {
  const suggestions = analyzeLinesAndSuggest(lines, fileType);
  if (suggestions.length > 0) {
    printSuggestions(suggestions);
  }
});

/**
 * Analyze output lines and generate fix suggestions
 * @param {string[]} lines - Output lines from validators
 * @param {string} type - File type (js, css, html)
 * @returns {object[]} Array of suggestion objects
 */
function analyzeLinesAndSuggest(lines, type) {
  const suggestions = [];
  const fullOutput = lines.join('\n');
  const seenSuggestions = new Set();

  // Helper to add unique suggestions
  const addSuggestion = (suggestion) => {
    const key = suggestion.fix || suggestion.message;
    if (!seenSuggestions.has(key)) {
      seenSuggestions.add(key);
      suggestions.push(suggestion);
    }
  };

  // JavaScript/ESLint patterns
  if (type === 'js') {
    if (fullOutput.includes('Unexpected var')) {
      addSuggestion({
        error: 'var usage detected',
        message: 'Use const or let instead of var',
        fix: 'npm run lint:js:fix',
        autoFixable: true,
      });
    }
    if (fullOutput.includes('prefer-const')) {
      addSuggestion({
        error: 'let could be const',
        message: 'Variable is never reassigned, use const',
        fix: 'npm run lint:js:fix',
        autoFixable: true,
      });
    }
    if (fullOutput.includes('prefer-template')) {
      addSuggestion({
        error: 'String concatenation',
        message: 'Use template literals instead of string concatenation',
        fix: 'npm run lint:js:fix',
        autoFixable: true,
      });
    }
    if (fullOutput.includes('eqeqeq')) {
      addSuggestion({
        error: 'Loose equality',
        message: 'Use === instead of ==',
        fix: 'npm run lint:js:fix',
        autoFixable: true,
      });
    }
    if (fullOutput.includes('no-console')) {
      addSuggestion({
        error: 'console statement',
        message: 'Consider using a debug logging pattern instead of console',
        fix: null,
        autoFixable: false,
      });
    }
    if (fullOutput.includes('complexity')) {
      addSuggestion({
        error: 'High complexity',
        message: 'Function is too complex, consider breaking into smaller functions',
        fix: null,
        autoFixable: false,
      });
    }
    if (fullOutput.includes('no-unused-vars')) {
      addSuggestion({
        error: 'Unused variable',
        message: 'Remove unused variable or prefix with _ if intentional',
        fix: null,
        autoFixable: false,
      });
    }
    if (fullOutput.includes('Unexpected default export')) {
      addSuggestion({
        error: 'Default export',
        message: 'Use named exports: export { Name } instead of export default',
        fix: null,
        autoFixable: false,
      });
    }
    if (fullOutput.includes('Missing test file:')) {
      addSuggestion({
        error: 'Missing tests',
        message: 'Script in scripts/ directory has no corresponding test file',
        fix: 'Use /skill unit-testing for test templates',
        autoFixable: false,
      });
    }
  }

  // CSS/Stylelint patterns
  if (type === 'css') {
    if (fullOutput.includes('max-nesting-depth')) {
      addSuggestion({
        error: 'Deep nesting',
        message: 'Reduce nesting depth to 3 or less',
        fix: null,
        autoFixable: false,
      });
    }
    if (fullOutput.includes('block-no-empty')) {
      addSuggestion({
        error: 'Empty block',
        message: 'Remove empty CSS blocks or add declarations',
        fix: 'npm run lint:css:fix',
        autoFixable: true,
      });
    }
    if (fullOutput.includes('declaration-block-no-duplicate-properties')) {
      addSuggestion({
        error: 'Duplicate property',
        message: 'Remove duplicate CSS property declarations',
        fix: null,
        autoFixable: false,
      });
    }
    if (fullOutput.includes('color-named')) {
      addSuggestion({
        error: 'Named color',
        message: 'Use custom properties or hex/rgb values instead of named colors',
        fix: null,
        autoFixable: false,
      });
    }
    if (fullOutput.includes('property-no-unknown')) {
      addSuggestion({
        error: 'Unknown property',
        message: 'Check property name spelling',
        fix: null,
        autoFixable: false,
      });
    }
    if (fullOutput.includes('value-no-vendor-prefix') || fullOutput.includes('property-no-vendor-prefix')) {
      addSuggestion({
        error: 'Vendor prefix',
        message: 'Remove vendor prefixes, use autoprefixer if needed',
        fix: 'npm run lint:css:fix',
        autoFixable: true,
      });
    }
  }

  // HTML patterns
  if (type === 'html') {
    if (fullOutput.includes('void-style') || fullOutput.includes('self-closing')) {
      addSuggestion({
        error: 'Void element syntax',
        message: 'Use self-closing syntax: <br/>, <img/>, <meta/>, <input/>, etc.',
        fix: null,
        autoFixable: false,
      });
    }
    if (fullOutput.includes('element-case') || fullOutput.includes('should be lowercase')) {
      addSuggestion({
        error: 'Element case',
        message: 'Use lowercase for all HTML elements and attributes',
        fix: null,
        autoFixable: false,
      });
    }
    if (fullOutput.includes('attr-quotes') || fullOutput.includes('must be quoted')) {
      addSuggestion({
        error: 'Unquoted attribute',
        message: 'Quote all attribute values with double quotes',
        fix: null,
        autoFixable: false,
      });
    }
    if (fullOutput.includes('multiple <h1>') || fullOutput.includes('unique-landmark')) {
      addSuggestion({
        error: 'Multiple h1 elements',
        message: 'Use only one <h1> per page, use <h2>-<h6> for subsections',
        fix: null,
        autoFixable: false,
      });
    }
    if (fullOutput.includes('no-inline-style')) {
      addSuggestion({
        error: 'Inline style',
        message: 'Move inline styles to a CSS file',
        fix: null,
        autoFixable: false,
      });
    }
    if (fullOutput.includes('missing alt') || fullOutput.includes('require-img-alt')) {
      addSuggestion({
        error: 'Missing alt attribute',
        message: 'Add alt attribute to <img> elements',
        fix: null,
        autoFixable: false,
      });
    }
    if (fullOutput.includes('form-dup-name') || fullOutput.includes('input-missing-label')) {
      addSuggestion({
        error: 'Form accessibility',
        message: 'Add <label> elements with for attribute matching input id',
        fix: null,
        autoFixable: false,
      });
    }
    if (fullOutput.includes('doctype')) {
      addSuggestion({
        error: 'Missing/incorrect doctype',
        message: 'Add <!doctype html> at the start of the file',
        fix: null,
        autoFixable: false,
      });
    }
    if (fullOutput.includes('Unknown word')) {
      addSuggestion({
        error: 'Unknown word (spelling)',
        message: 'Fix spelling or add to dictionary',
        fix: '/add-word <word>',
        autoFixable: false,
      });
    }

    // Div blacklist (element-name rule)
    if (fullOutput.includes('is blacklisted') && fullOutput.includes('div')) {
      addSuggestion({
        error: 'Div element detected',
        message: 'Replace <div> with semantic element. See xhtml-author skill for alternatives.',
        fix: null,
        autoFixable: false,
      });
    }

    // Semantic check patterns
    if (fullOutput.includes('semantic/form-field')) {
      addSuggestion({
        error: 'Form without form-field',
        message: 'Use <form-field> custom element for form inputs. Invoke forms skill.',
        fix: '/skill forms',
        autoFixable: false,
      });
    }
    if (fullOutput.includes('semantic/no-div')) {
      addSuggestion({
        error: 'Div with class detected',
        message: 'Consider semantic alternatives to <div>. Check skill output for specific suggestions.',
        fix: null,
        autoFixable: false,
      });
    }
    if (fullOutput.includes('semantic/use-time')) {
      addSuggestion({
        error: 'Year without <time> element',
        message: 'Wrap years in <time datetime="YYYY"> for semantic markup',
        fix: null,
        autoFixable: false,
      });
    }

    // Accessibility (pa11y) patterns
    if (fullOutput.includes('WCAG2AA') || fullOutput.includes('pa11y')) {
      if (fullOutput.includes('Elements must have sufficient color contrast')) {
        addSuggestion({
          error: 'Low color contrast',
          message: 'Increase contrast ratio between text and background',
          fix: null,
          autoFixable: false,
        });
      }
      if (fullOutput.includes('Links must have discernible text')) {
        addSuggestion({
          error: 'Empty link text',
          message: 'Add text content or aria-label to links',
          fix: null,
          autoFixable: false,
        });
      }
    }
  }

  // JSON/YAML/Config patterns
  if (type === 'json' || type === 'yaml' || type === 'config') {
    if (fullOutput.includes('Trailing comma')) {
      addSuggestion({
        error: 'Trailing comma',
        message: 'Remove trailing comma (not valid in JSON)',
        fix: null,
        autoFixable: false,
      });
    }
    if (fullOutput.includes('JSON parse error')) {
      addSuggestion({
        error: 'JSON syntax error',
        message: 'Check for missing quotes, brackets, or commas',
        fix: null,
        autoFixable: false,
      });
    }
    if (fullOutput.includes('tabs not allowed')) {
      addSuggestion({
        error: 'Tabs in YAML',
        message: 'Replace tabs with spaces (2-space indentation recommended)',
        fix: null,
        autoFixable: false,
      });
    }
    if (fullOutput.includes('missing space after colon')) {
      addSuggestion({
        error: 'YAML formatting',
        message: 'Add space after colon in key: value pairs',
        fix: null,
        autoFixable: false,
      });
    }
    if (fullOutput.includes('package.json: missing')) {
      addSuggestion({
        error: 'Missing package.json field',
        message: 'Add required fields to package.json',
        fix: null,
        autoFixable: false,
      });
    }
    if (fullOutput.includes('consider adding "type": "module"')) {
      addSuggestion({
        error: 'ESM not configured',
        message: 'Add "type": "module" to package.json for ESM support',
        fix: null,
        autoFixable: false,
      });
    }
    if (fullOutput.includes('both dependencies and devDependencies')) {
      addSuggestion({
        error: 'Duplicate dependency',
        message: 'Package appears in both dependencies and devDependencies',
        fix: null,
        autoFixable: false,
      });
    }
  }

  // Markdown patterns
  if (type === 'md') {
    // Heading structure issues
    if (fullOutput.includes('MD001') || fullOutput.includes('heading-increment')) {
      addSuggestion({
        error: 'Heading increment',
        message: 'Headings should only increment by one level at a time',
        fix: null,
        autoFixable: false,
      });
    }
    if (fullOutput.includes('MD003') || fullOutput.includes('heading-style')) {
      addSuggestion({
        error: 'Heading style',
        message: 'Use ATX-style headings (# Heading)',
        fix: 'npm run lint:markdown:fix',
        autoFixable: true,
      });
    }
    if (fullOutput.includes('MD025') || fullOutput.includes('single-h1')) {
      addSuggestion({
        error: 'Multiple H1 headings',
        message: 'Document should have only one H1 heading as the title',
        fix: null,
        autoFixable: false,
      });
    }
    if (fullOutput.includes('MD041') || fullOutput.includes('first-line-h1')) {
      addSuggestion({
        error: 'First line not H1',
        message: 'First line should be a top-level heading',
        fix: null,
        autoFixable: false,
      });
    }

    // List formatting
    if (fullOutput.includes('MD004') || fullOutput.includes('ul-style')) {
      addSuggestion({
        error: 'List style',
        message: 'Use dashes (-) for unordered lists',
        fix: 'npm run lint:markdown:fix',
        autoFixable: true,
      });
    }
    if (fullOutput.includes('MD007') || fullOutput.includes('ul-indent')) {
      addSuggestion({
        error: 'List indentation',
        message: 'Use 2-space indentation for nested lists',
        fix: 'npm run lint:markdown:fix',
        autoFixable: true,
      });
    }
    if (fullOutput.includes('MD029') || fullOutput.includes('ol-prefix')) {
      addSuggestion({
        error: 'Ordered list prefix',
        message: 'Use ordered (1. 2. 3.) numbering for lists',
        fix: 'npm run lint:markdown:fix',
        autoFixable: true,
      });
    }

    // Code blocks
    if (fullOutput.includes('MD040') || fullOutput.includes('fenced-code-language')) {
      addSuggestion({
        error: 'Missing code language',
        message: 'Specify language for fenced code blocks (```javascript)',
        fix: null,
        autoFixable: false,
      });
    }
    if (fullOutput.includes('MD046') || fullOutput.includes('code-block-style')) {
      addSuggestion({
        error: 'Code block style',
        message: 'Use fenced code blocks (```) instead of indented',
        fix: null,
        autoFixable: false,
      });
    }
    if (fullOutput.includes('MD048') || fullOutput.includes('code-fence-style')) {
      addSuggestion({
        error: 'Code fence style',
        message: 'Use backticks (```) for code fences, not tildes',
        fix: 'npm run lint:markdown:fix',
        autoFixable: true,
      });
    }

    // Whitespace and formatting
    if (fullOutput.includes('MD009') || fullOutput.includes('no-trailing-spaces')) {
      addSuggestion({
        error: 'Trailing spaces',
        message: 'Remove trailing whitespace (except 2 spaces for line breaks)',
        fix: 'npm run lint:markdown:fix',
        autoFixable: true,
      });
    }
    if (fullOutput.includes('MD010') || fullOutput.includes('no-hard-tabs')) {
      addSuggestion({
        error: 'Hard tabs',
        message: 'Use spaces instead of tabs for indentation',
        fix: 'npm run lint:markdown:fix',
        autoFixable: true,
      });
    }
    if (fullOutput.includes('MD012') || fullOutput.includes('no-multiple-blanks')) {
      addSuggestion({
        error: 'Multiple blank lines',
        message: 'Use only one blank line between blocks',
        fix: 'npm run lint:markdown:fix',
        autoFixable: true,
      });
    }
    if (fullOutput.includes('MD022') || fullOutput.includes('blanks-around-headings')) {
      addSuggestion({
        error: 'Heading spacing',
        message: 'Add blank lines before and after headings',
        fix: 'npm run lint:markdown:fix',
        autoFixable: true,
      });
    }
    if (fullOutput.includes('MD031') || fullOutput.includes('blanks-around-fences')) {
      addSuggestion({
        error: 'Code block spacing',
        message: 'Add blank lines before and after code blocks',
        fix: 'npm run lint:markdown:fix',
        autoFixable: true,
      });
    }
    if (fullOutput.includes('MD032') || fullOutput.includes('blanks-around-lists')) {
      addSuggestion({
        error: 'List spacing',
        message: 'Add blank lines before and after lists',
        fix: 'npm run lint:markdown:fix',
        autoFixable: true,
      });
    }
    if (fullOutput.includes('MD047') || fullOutput.includes('single-trailing-newline')) {
      addSuggestion({
        error: 'File ending',
        message: 'Files should end with a single newline',
        fix: 'npm run lint:markdown:fix',
        autoFixable: true,
      });
    }

    // Links and images
    if (fullOutput.includes('MD034') || fullOutput.includes('no-bare-urls')) {
      addSuggestion({
        error: 'Bare URL',
        message: 'Use proper link syntax [text](url) instead of bare URLs',
        fix: null,
        autoFixable: false,
      });
    }
    if (fullOutput.includes('MD042') || fullOutput.includes('no-empty-links')) {
      addSuggestion({
        error: 'Empty link',
        message: 'Links should have text content and valid URLs',
        fix: null,
        autoFixable: false,
      });
    }
    if (fullOutput.includes('MD045') || fullOutput.includes('no-alt-text')) {
      addSuggestion({
        error: 'Missing alt text',
        message: 'Add alt text to images ![description](image.png)',
        fix: null,
        autoFixable: false,
      });
    }
    if (fullOutput.includes('MD051') || fullOutput.includes('link-fragments')) {
      addSuggestion({
        error: 'Invalid link fragment',
        message: 'Link fragment (#section) does not match any heading',
        fix: null,
        autoFixable: false,
      });
    }

    // Emphasis and formatting
    if (fullOutput.includes('MD036') || fullOutput.includes('no-emphasis-as-heading')) {
      addSuggestion({
        error: 'Emphasis as heading',
        message: 'Use proper headings instead of bold/emphasis for titles',
        fix: null,
        autoFixable: false,
      });
    }
    if (fullOutput.includes('MD037') || fullOutput.includes('no-space-in-emphasis')) {
      addSuggestion({
        error: 'Space in emphasis',
        message: 'Remove spaces inside emphasis markers: *text* not * text *',
        fix: 'npm run lint:markdown:fix',
        autoFixable: true,
      });
    }
    if (fullOutput.includes('MD049') || fullOutput.includes('emphasis-style')) {
      addSuggestion({
        error: 'Emphasis style',
        message: 'Use asterisks (*text*) for emphasis, not underscores',
        fix: 'npm run lint:markdown:fix',
        autoFixable: true,
      });
    }
    if (fullOutput.includes('MD050') || fullOutput.includes('strong-style')) {
      addSuggestion({
        error: 'Bold style',
        message: 'Use asterisks (**text**) for bold, not underscores',
        fix: 'npm run lint:markdown:fix',
        autoFixable: true,
      });
    }

    // Inline code
    if (fullOutput.includes('MD038') || fullOutput.includes('no-space-in-code')) {
      addSuggestion({
        error: 'Space in code',
        message: 'Remove spaces inside inline code: `code` not ` code `',
        fix: 'npm run lint:markdown:fix',
        autoFixable: true,
      });
    }

    // Spelling (cspell)
    if (fullOutput.includes('Unknown word')) {
      addSuggestion({
        error: 'Unknown word (spelling)',
        message: 'Fix spelling or add word to dictionary',
        fix: '/add-word <word>',
        autoFixable: false,
      });
    }
  }

  return suggestions;
}

/**
 * Print fix suggestions in a formatted box
 * @param {object[]} suggestions - Array of suggestion objects
 */
function printSuggestions(suggestions) {
  console.log('');
  console.log(`${colors.cyan}${colors.bold}=== Fix Suggestions ===${colors.reset}`);

  const autoFixable = suggestions.filter(s => s.autoFixable);
  const manual = suggestions.filter(s => !s.autoFixable);

  if (autoFixable.length > 0) {
    console.log(`${colors.green}${colors.bold}Auto-fixable:${colors.reset}`);
    const fixCommands = [...new Set(autoFixable.map(s => s.fix).filter(Boolean))];
    for (const cmd of fixCommands) {
      console.log(`  ${colors.dim}$${colors.reset} ${cmd}`);
    }
  }

  if (manual.length > 0) {
    console.log(`${colors.yellow}${colors.bold}Manual fixes needed:${colors.reset}`);
    for (const s of manual) {
      console.log(`  ${colors.dim}•${colors.reset} ${s.message}`);
      if (s.fix) {
        console.log(`    ${colors.dim}Try:${colors.reset} ${s.fix}`);
      }
    }
  }

  console.log('');
}
