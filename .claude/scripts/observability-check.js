#!/usr/bin/env node

/**
 * Observability Validator
 * Checks JavaScript files for error handling and performance patterns.
 *
 * Usage:
 *   node scripts/observability-check.js [file...]
 *   node scripts/observability-check.js src/app.js
 *   node scripts/observability-check.js  # checks all JS files
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
 * @typedef {object} Issue
 * @property {'error'|'warning'|'info'} severity
 * @property {string} message
 * @property {number} [line]
 * @property {string} [code]
 */

// Checks for observability patterns
const CHECKS = [
  {
    name: 'global-error-handler',
    description: 'Missing window.onerror handler',
    severity: 'warning',
    pattern: /window\.onerror/,
    required: true,
    message: 'Consider adding window.onerror for global error handling',
    fileLevel: true,
    appOnly: true
  },
  {
    name: 'unhandled-rejection',
    description: 'Missing unhandledrejection handler',
    severity: 'warning',
    pattern: /unhandledrejection/,
    required: true,
    message: 'Consider adding window.onunhandledrejection handler',
    fileLevel: true,
    appOnly: true
  },
  {
    name: 'async-no-try-catch',
    description: 'Async function without error handling',
    severity: 'warning',
    pattern: /async\s+(?:function\s+\w+|\w+)\s*\([^)]*\)\s*\{(?![^}]*(?:try\s*\{|\.catch\())/g,
    message: 'Async function should have try/catch or .catch()'
  },
  {
    name: 'fetch-no-error',
    description: 'Fetch without error handling',
    severity: 'warning',
    pattern: /fetch\s*\([^)]+\)(?![^;]*\.catch)(?![^;]*try)/g,
    message: 'Fetch calls should handle network errors'
  },
  {
    name: 'promise-no-catch',
    description: 'Promise chain without .catch()',
    severity: 'info',
    pattern: /\.then\s*\([^)]+\)(?!\s*\.(?:catch|finally))/g,
    message: 'Promise chains should have .catch() for error handling'
  },
  {
    name: 'performance-mark',
    description: 'Check for performance marks',
    severity: 'info',
    pattern: /performance\.mark/,
    required: true,
    message: 'Consider adding performance.mark() for timing critical operations',
    fileLevel: true,
    appOnly: true
  },
  {
    name: 'console-error-prod',
    description: 'Console.error without reporting',
    severity: 'info',
    pattern: /console\.error\s*\(/g,
    message: 'Consider reporting errors to a monitoring service, not just console'
  },
  {
    name: 'error-boundary',
    description: 'No error boundary components',
    severity: 'info',
    pattern: /error-boundary|ErrorBoundary/,
    required: true,
    message: 'Consider using error boundaries for component error handling',
    fileLevel: true,
    appOnly: true
  },
  {
    name: 'empty-catch',
    description: 'Empty catch block',
    severity: 'warning',
    pattern: /catch\s*\([^)]*\)\s*\{\s*\}/g,
    message: 'Empty catch blocks swallow errors silently'
  },
  {
    name: 'throw-string',
    description: 'Throwing string instead of Error',
    severity: 'warning',
    pattern: /throw\s+['"`][^'"`]+['"`]/g,
    message: 'Throw Error objects instead of strings for stack traces'
  },
  {
    name: 'sendbeacon',
    description: 'Error reporting with sendBeacon',
    severity: 'info',
    pattern: /navigator\.sendBeacon|sendBeacon/,
    required: true,
    message: 'Consider using navigator.sendBeacon for reliable error reporting',
    fileLevel: true,
    appOnly: true
  }
];

/**
 * Find all JavaScript files in a directory
 * @param {string} dir
 * @returns {string[]}
 */
function findJsFiles(dir) {
  const files = [];

  if (!existsSync(dir)) {
    return files;
  }

  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;

    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...findJsFiles(fullPath));
    } else if (extname(entry) === '.js' && !entry.endsWith('.test.js')) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Check a single file
 * @param {string} filePath
 * @param {boolean} isEntryPoint
 * @returns {{ file: string, issues: Issue[] }}
 */
function checkFile(filePath, isEntryPoint = false) {
  const issues = [];

  if (!existsSync(filePath)) {
    return { file: filePath, issues: [{ severity: 'error', message: 'File not found' }] };
  }

  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  for (const check of CHECKS) {
    // Skip app-level checks for non-entry files
    if (check.appOnly && !isEntryPoint) continue;

    if (check.fileLevel) {
      // File-level check: pattern should exist if required
      const hasPattern = check.pattern.test(content);
      check.pattern.lastIndex = 0;

      if (check.required && !hasPattern) {
        issues.push({
          severity: check.severity,
          message: check.message,
          code: check.name
        });
      }
    } else {
      // Line-level check: find all occurrences
      let match;
      while ((match = check.pattern.exec(content)) !== null) {
        const beforeMatch = content.slice(0, match.index);
        const lineNumber = beforeMatch.split('\n').length;

        issues.push({
          severity: check.severity,
          message: check.message,
          line: lineNumber,
          code: check.name
        });
      }
    }
  }

  return { file: filePath, issues };
}

/**
 * Format and print results
 * @param {{ file: string, issues: Issue[] }[]} results
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
      const lineInfo = issue.line ? `:${issue.line}` : '';
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

      console.log(`  ${color}${prefix}${colors.reset} ${lineInfo} ${issue.message}`);
    }
  }

  // Summary
  console.log('');
  if (errorCount === 0 && warningCount === 0 && infoCount === 0) {
    console.log(`${colors.green}✓${colors.reset} No issues found`);
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
  let entryPoints = new Set();

  if (args.length === 0) {
    // Default: check src directory
    const srcDirs = ['src', 'app', 'lib'];
    for (const dir of srcDirs) {
      files.push(...findJsFiles(dir));
    }

    // Mark entry points
    const entryPatterns = ['index.js', 'main.js', 'app.js', 'client.js'];
    for (const file of files) {
      if (entryPatterns.some(p => file.endsWith(p))) {
        entryPoints.add(file);
      }
    }

    if (files.length === 0) {
      console.log(`${colors.dim}No JavaScript files found${colors.reset}`);
      process.exit(0);
    }
  } else {
    // Check specified files
    for (const arg of args) {
      if (existsSync(arg) && statSync(arg).isDirectory()) {
        files.push(...findJsFiles(arg));
      } else {
        files.push(arg);
      }
    }
    // All specified files considered entry points
    entryPoints = new Set(files);
  }

  console.log(`${colors.cyan}Observability Check${colors.reset}`);
  console.log(`Checking ${files.length} file(s)...`);

  // Check all files
  const results = files.map(f => checkFile(f, entryPoints.has(f)));

  // Print results
  const errorCount = printResults(results);

  process.exit(errorCount > 0 ? 1 : 0);
}

main();
