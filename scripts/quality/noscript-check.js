#!/usr/bin/env node

/**
 * Noscript Validator
 * Checks HTML files for proper <noscript> fallbacks when JavaScript is required.
 *
 * Usage:
 *   node scripts/noscript-check.js [file...]
 *   node scripts/noscript-check.js src/app.html
 *   node scripts/noscript-check.js  # checks all HTML files
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, relative, extname } from 'path';

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
 * Patterns indicating JavaScript is required
 */
const JS_REQUIRED_PATTERNS = [
  /<script[^>]*src=/i,                    // External scripts
  /<script[^>]*type="module"/i,           // ES modules
  /onclick=/i,                            // Inline handlers
  /onload=/i,
  /onsubmit=/i,
  /data-js-required/i,                    // Explicit marker
  /<[^>]+\s@[a-z]+=/i,                   // Vue/Alpine directives
  /x-data=/i,                             // Alpine.js
  /ng-[a-z]+=/i,                          // Angular
  /:on[A-Z]/,                             // React/Solid handlers
];

/**
 * Patterns indicating noscript is handled
 */
const NOSCRIPT_PATTERNS = [
  /<noscript[^>]*>/i,                     // <noscript> element
  /@media\s*\(\s*scripting\s*:\s*none\s*\)/i,  // CSS scripting query
];

/**
 * Find all HTML files in a directory
 * @param {string} dir
 * @returns {string[]}
 */
function findHtmlFiles(dir) {
  const files = [];

  if (!existsSync(dir)) {
    return files;
  }

  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;

    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...findHtmlFiles(fullPath));
    } else if (['.html', '.htm', '.xhtml'].includes(extname(entry))) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Check if file requires JavaScript
 * @param {string} content - File content
 * @returns {boolean}
 */
function requiresJavaScript(content) {
  return JS_REQUIRED_PATTERNS.some(pattern => pattern.test(content));
}

/**
 * Check if file has noscript handling
 * @param {string} content - File content
 * @returns {boolean}
 */
function hasNoscriptHandling(content) {
  return NOSCRIPT_PATTERNS.some(pattern => pattern.test(content));
}

/**
 * Analyze noscript implementation quality
 * @param {string} content - File content
 * @returns {string[]} - Suggestions for improvement
 */
function analyzeNoscript(content) {
  const suggestions = [];

  const hasNoscript = /<noscript[^>]*>/i.test(content);
  const hasScriptingQuery = /@media\s*\(\s*scripting\s*:\s*none\s*\)/i.test(content);

  if (hasNoscript) {
    // Check for common issues

    // Empty noscript
    if (/<noscript[^>]*>\s*<\/noscript>/i.test(content)) {
      suggestions.push('Empty <noscript> element - add fallback content');
    }

    // No helpful message
    if (!/<noscript[^>]*>[\s\S]*?(javascript|enable|required|disabled)/i.test(content)) {
      suggestions.push('Consider explaining why JavaScript is needed');
    }

    // No help link
    if (!/<noscript[^>]*>[\s\S]*?<a\s/i.test(content)) {
      suggestions.push('Consider adding a link to help users enable JavaScript');
    }

    // Noscript in head without body fallback
    const headNoscript = /<head[^>]*>[\s\S]*?<noscript/i.test(content);
    const bodyNoscript = /<body[^>]*>[\s\S]*?<noscript/i.test(content);
    if (headNoscript && !bodyNoscript) {
      suggestions.push('Add <noscript> in <body> for visible user message');
    }
  }

  // Suggest CSS scripting query as modern alternative
  if (hasNoscript && !hasScriptingQuery) {
    suggestions.push('Consider also using @media (scripting: none) for modern browsers');
  }

  return suggestions;
}

/**
 * Check a single file
 * @param {string} filePath
 * @returns {{ file: string, issues: Array }}
 */
function checkFile(filePath) {
  const issues = [];

  if (!existsSync(filePath)) {
    return { file: filePath, issues: [{ severity: 'error', message: 'File not found' }] };
  }

  const content = readFileSync(filePath, 'utf-8');

  // Check if file requires JS but has no noscript
  if (requiresJavaScript(content) && !hasNoscriptHandling(content)) {
    issues.push({
      severity: 'warning',
      message: 'File uses JavaScript but has no <noscript> fallback',
      code: 'missing-noscript'
    });
  }

  // Analyze existing noscript implementation
  if (hasNoscriptHandling(content)) {
    const suggestions = analyzeNoscript(content);
    for (const suggestion of suggestions) {
      issues.push({
        severity: 'info',
        message: suggestion,
        code: 'noscript-improvement'
      });
    }
  }

  return { file: filePath, issues };
}

/**
 * Format and print results
 * @param {{ file: string, issues: Array }[]} results
 * @returns {number} Error count
 */
function printResults(results) {
  let errorCount = 0;
  let warningCount = 0;
  let infoCount = 0;

  for (const result of results) {
    if (result.issues.length === 0) continue;

    console.log(`\n${colors.cyan}${relative(process.cwd(), result.file)}${colors.reset}`);

    for (const issue of result.issues) {
      let prefix;
      let color;

      switch (issue.severity) {
        case 'error':
          prefix = '✗';
          color = colors.red;
          errorCount++;
          break;
        case 'warning':
          prefix = '⚠';
          color = colors.yellow;
          warningCount++;
          break;
        default:
          prefix = 'ℹ';
          color = colors.dim;
          infoCount++;
      }

      console.log(`  ${color}${prefix}${colors.reset} ${issue.message}`);
    }
  }

  // Summary
  console.log('');
  if (errorCount === 0 && warningCount === 0 && infoCount === 0) {
    console.log(`${colors.green}✓${colors.reset} All files have proper noscript handling`);
  } else {
    const parts = [];
    if (errorCount > 0) parts.push(`${colors.red}${errorCount} error(s)${colors.reset}`);
    if (warningCount > 0) parts.push(`${colors.yellow}${warningCount} warning(s)${colors.reset}`);
    if (infoCount > 0) parts.push(`${colors.dim}${infoCount} suggestion(s)${colors.reset}`);
    console.log(`Found: ${parts.join(', ')}`);
  }

  return errorCount;
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  let files = [];

  if (args.length === 0) {
    // Default: check src directory
    const srcDirs = ['src', 'app', 'pages', 'views'];
    for (const dir of srcDirs) {
      files.push(...findHtmlFiles(dir));
    }

    if (files.length === 0) {
      console.log(`${colors.dim}No HTML files found${colors.reset}`);
      process.exit(0);
    }
  } else {
    // Check specified files
    for (const arg of args) {
      if (existsSync(arg) && statSync(arg).isDirectory()) {
        files.push(...findHtmlFiles(arg));
      } else {
        files.push(arg);
      }
    }
  }

  console.log(`${colors.cyan}Noscript Check${colors.reset}`);
  console.log(`Checking ${files.length} file(s)...`);

  // Check all files
  const results = files.map(checkFile);

  // Print results
  const errorCount = printResults(results);

  process.exit(errorCount > 0 ? 1 : 0);
}

main();
