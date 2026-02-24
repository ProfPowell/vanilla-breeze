#!/usr/bin/env node
/**
 * Test Runner
 *
 * Wrapper for Node.js test runner that properly handles:
 * - Running all tests: npm test
 * - Running specific files: npm test -- test/validators/foo.test.js
 * - Running by pattern: npm test -- --test-name-pattern='Foo'
 *
 * @module scripts/test-runner
 */

import { spawn } from 'node:child_process';
import { glob } from 'node:fs';
import { promisify } from 'node:util';

const globAsync = promisify(glob);

const args = process.argv.slice(2);

// Check if any test files were specified
const hasTestFiles = args.some(arg =>
  arg.endsWith('.test.js') || arg.endsWith('.test.mjs')
);

async function run() {
  // Build the command arguments
  const nodeArgs = ['--test'];

  if (hasTestFiles) {
    // User specified test files - use only those
    nodeArgs.push(...args);
  } else {
    // No test files specified - expand glob and run all tests
    const testFiles = await globAsync('test/**/*.test.js');
    nodeArgs.push(...testFiles);
    if (args.length > 0) {
      nodeArgs.push(...args);
    }
  }

  // Run node with the test arguments (no shell needed)
  const child = spawn('node', nodeArgs, {
    stdio: 'inherit',
  });

  child.on('close', (code) => {
    process.exit(code);
  });
}

run();
