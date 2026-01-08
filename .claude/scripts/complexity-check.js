/**
 * JavaScript Complexity Analysis Script
 *
 * Runs ESLint complexity rules and reports violations:
 * - Cyclomatic complexity (target: < 10 per function)
 * - Max nesting depth (target: < 4)
 * - Max lines per function (target: < 50)
 * - Max nested callbacks (target: < 3)
 *
 * @example
 * node scripts/complexity-check.js [files...]
 * node scripts/complexity-check.js examples/demo-code
 */

import { execSync } from 'child_process';
import { readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

/** Complexity rules to check */
const COMPLEXITY_RULES = [
  'complexity',
  'max-depth',
  'max-lines-per-function',
  'max-nested-callbacks',
];

/** Thresholds (for display) */
const THRESHOLDS = {
  'complexity': 10,
  'max-depth': 4,
  'max-lines-per-function': 50,
  'max-nested-callbacks': 3,
};

/**
 * Recursively find all JS files in a directory
 * @param {string} dir - Directory to search
 * @param {string[]} files - Accumulated files
 * @returns {string[]} Array of file paths
 */
function findJsFiles(dir, files = []) {
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      if (entry === 'node_modules' || entry === '.git' || entry === '.beads') {
        continue;
      }
      findJsFiles(fullPath, files);
    } else if (entry.endsWith('.js') && !fullPath.includes('test/fixtures/invalid')) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Run ESLint and get JSON output
 * @param {string[]} files - Files to lint
 * @returns {object[]} ESLint results
 */
function runEslint(files) {
  const fileArgs = files.map(f => `"${f}"`).join(' ');

  try {
    // Run eslint with JSON formatter
    const output = execSync(
      `npx eslint ${fileArgs} --format json --no-error-on-unmatched-pattern`,
      { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
    );
    return JSON.parse(output);
  } catch (error) {
    // ESLint exits with code 1 when there are warnings/errors
    if (error.stdout) {
      try {
        return JSON.parse(error.stdout);
      } catch {
        console.error('Failed to parse ESLint output');
        return [];
      }
    }
    return [];
  }
}

/**
 * Filter results to only complexity-related warnings
 * @param {object[]} results - ESLint results
 * @returns {object} Filtered violations and summary
 */
function filterComplexityViolations(results) {
  const violations = [];
  let totalFiles = 0;
  let filesWithIssues = 0;

  for (const result of results) {
    if (!result.messages || result.messages.length === 0) {
      totalFiles++;
      continue;
    }

    totalFiles++;
    const relativePath = relative(process.cwd(), result.filePath);
    let fileHasComplexityIssue = false;

    for (const msg of result.messages) {
      if (COMPLEXITY_RULES.includes(msg.ruleId)) {
        violations.push({
          file: relativePath,
          line: msg.line,
          column: msg.column,
          rule: msg.ruleId,
          message: msg.message,
          severity: msg.severity === 2 ? 'error' : 'warning',
        });
        fileHasComplexityIssue = true;
      }
    }

    if (fileHasComplexityIssue) {
      filesWithIssues++;
    }
  }

  return { violations, totalFiles, filesWithIssues };
}

/**
 * Print results to console
 * @param {object} filtered - Filtered results
 */
function printResults(filtered) {
  const { violations, totalFiles, filesWithIssues } = filtered;

  console.log('=== JavaScript Complexity Analysis ===\n');

  // Print violations grouped by file
  if (violations.length > 0) {
    console.log('Complexity Issues:');
    let currentFile = '';

    for (const v of violations) {
      if (v.file !== currentFile) {
        currentFile = v.file;
        console.log(`\n  ${currentFile}`);
      }
      const icon = v.severity === 'error' ? '✗' : '⚠';
      console.log(`    ${icon} ${v.line}:${v.column} [${v.rule}] ${v.message}`);
    }
    console.log('');
  }

  // Print summary
  console.log('Summary:');
  console.log(`  Files analyzed: ${totalFiles}`);
  console.log(`  Files with complexity issues: ${filesWithIssues}`);
  console.log(`  Total complexity violations: ${violations.length}`);
  console.log('');

  // Print thresholds
  console.log('Thresholds:');
  console.log(`  Max cyclomatic complexity: ${THRESHOLDS.complexity}`);
  console.log(`  Max nesting depth: ${THRESHOLDS['max-depth']}`);
  console.log(`  Max lines per function: ${THRESHOLDS['max-lines-per-function']}`);
  console.log(`  Max nested callbacks: ${THRESHOLDS['max-nested-callbacks']}`);

  return violations.length;
}

/**
 * Main entry point
 */
function main() {
  const args = process.argv.slice(2);
  let files = [];

  if (args.length === 0) {
    // Default: analyze demo-code and scripts directories
    const defaultDirs = ['src', '.claude/scripts'];
    for (const dir of defaultDirs) {
      try {
        files = files.concat(findJsFiles(dir));
      } catch {
        // Directory doesn't exist
      }
    }

    // Also check root-level JS files
    try {
      const rootFiles = readdirSync('.').filter(f => f.endsWith('.js'));
      files = files.concat(rootFiles);
    } catch {
      // Ignore
    }
  } else {
    // Use provided paths
    for (const arg of args) {
      try {
        const stat = statSync(arg);
        if (stat.isDirectory()) {
          files = files.concat(findJsFiles(arg));
        } else if (arg.endsWith('.js')) {
          files.push(arg);
        }
      } catch {
        console.error(`Warning: Could not access ${arg}`);
      }
    }
  }

  if (files.length === 0) {
    console.log('No JavaScript files found to analyze.');
    process.exit(0);
  }

  // Run ESLint
  const results = runEslint(files);

  // Filter and print results
  const filtered = filterComplexityViolations(results);
  const violationCount = printResults(filtered);

  // Exit with error if violations found (as errors, not warnings)
  const errorCount = filtered.violations.filter(v => v.severity === 'error').length;
  if (errorCount > 0) {
    process.exit(1);
  }
}

main();
