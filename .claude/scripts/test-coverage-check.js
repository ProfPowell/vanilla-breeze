#!/usr/bin/env node

/**
 * Test Coverage Check
 * Checks which scripts in scripts/ have corresponding test files.
 *
 * Usage:
 *   node scripts/test-coverage-check.js
 *   npm run test:coverage
 */

import { readdirSync, existsSync } from 'fs';
import { join, basename, dirname, resolve } from 'path';
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

// Scripts that don't need tests (utilities, config, etc.)
const EXCLUDED_SCRIPTS = [
  'test-runner.js',      // Meta - runs tests itself
  'fix-suggestions.js'   // Called by hooks, tested implicitly
];

/**
 * Get all JavaScript files in scripts/ directory
 */
function getScripts() {
  const scriptsDir = join(ROOT, 'scripts');
  return readdirSync(scriptsDir)
    .filter(file => file.endsWith('.js'))
    .filter(file => !EXCLUDED_SCRIPTS.includes(file))
    .map(file => ({
      name: file,
      path: join(scriptsDir, file),
      baseName: basename(file, '.js')
    }));
}

/**
 * Find corresponding test file for a script
 */
function findTestFile(scriptBaseName) {
  const possiblePaths = [
    join(ROOT, 'test', 'validators', `${scriptBaseName}.test.js`),
    join(ROOT, 'test', `${scriptBaseName}.test.js`)
  ];

  for (const testPath of possiblePaths) {
    if (existsSync(testPath)) {
      return testPath;
    }
  }

  return null;
}

/**
 * Main function
 */
function main() {
  console.log(`${colors.cyan}Test Coverage Check${colors.reset}`);
  console.log(`${colors.dim}Checking scripts/ for test coverage...${colors.reset}`);
  console.log();

  const scripts = getScripts();
  const withTests = [];
  const withoutTests = [];

  for (const script of scripts) {
    const testFile = findTestFile(script.baseName);
    if (testFile) {
      withTests.push({ script, testFile });
    } else {
      withoutTests.push(script);
    }
  }

  // Report scripts with tests
  if (withTests.length > 0) {
    console.log(`${colors.green}Scripts with tests (${withTests.length}):${colors.reset}`);
    for (const { script } of withTests) {
      console.log(`  ${colors.green}✓${colors.reset} ${script.name}`);
    }
    console.log();
  }

  // Report scripts without tests
  if (withoutTests.length > 0) {
    console.log(`${colors.yellow}Scripts missing tests (${withoutTests.length}):${colors.reset}`);
    for (const script of withoutTests) {
      console.log(`  ${colors.yellow}⚠${colors.reset} ${script.name}`);
      console.log(`    ${colors.dim}Expected: test/validators/${script.baseName}.test.js${colors.reset}`);
    }
    console.log();
  }

  // Summary
  const total = scripts.length;
  const covered = withTests.length;
  const missing = withoutTests.length;
  const percentage = total > 0 ? Math.round((covered / total) * 100) : 100;

  console.log(`${colors.cyan}Summary${colors.reset}`);
  console.log(`  Total scripts:  ${total}`);
  console.log(`  With tests:     ${colors.green}${covered}${colors.reset}`);
  console.log(`  Missing tests:  ${missing > 0 ? colors.yellow : colors.green}${missing}${colors.reset}`);
  console.log(`  Coverage:       ${percentage >= 80 ? colors.green : colors.yellow}${percentage}%${colors.reset}`);
  console.log();

  // Exit with error if coverage is below threshold
  if (missing > 0) {
    console.log(`${colors.dim}To create a test file, use: /skill unit-testing${colors.reset}`);
    process.exit(1);
  }

  console.log(`${colors.green}All scripts have test files.${colors.reset}`);
  return 0;
}

main();
