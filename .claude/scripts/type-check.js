#!/usr/bin/env node
/**
 * @file Type Check Script
 * @description Runs tsc --checkJs on JavaScript files for PostToolUse hooks
 *
 * This script is called after file edits to provide immediate type error feedback.
 * It uses TypeScript's checkJs feature to validate JSDoc-annotated JavaScript.
 *
 * Usage: node .claude/scripts/type-check.js <file-path>
 */

import { execSync } from 'child_process';
import { extname, dirname, join } from 'path';
import { existsSync } from 'fs';

const filePath = process.argv[2];

// Skip if no file path provided
if (!filePath) {
  process.exit(0);
}

// Skip non-JavaScript files
if (extname(filePath) !== '.js') {
  process.exit(0);
}

// Skip files outside of src/ directories
if (!filePath.includes('/src/') && !filePath.includes('/.claude/scripts/')) {
  process.exit(0);
}

// Find nearest jsconfig.json or tsconfig.json
const configPath = findConfig(filePath);
if (!configPath) {
  process.exit(0);
}

console.log('=== tsc --checkJs ===');

try {
  // Run TypeScript compiler in check mode
  const result = execSync(
    `npx tsc --noEmit --project "${configPath}" 2>&1`,
    {
      encoding: 'utf-8',
      cwd: dirname(configPath),
      maxBuffer: 1024 * 1024 // 1MB buffer
    }
  );

  // If we get here, no errors
  console.log('No type errors');

} catch (error) {
  // tsc exits with non-zero code if there are errors
  const output = error.stdout || error.stderr || '';

  // Filter to only show errors related to the edited file
  const lines = output.split('\n');
  const relevantErrors = [];
  let inRelevantBlock = false;

  for (const line of lines) {
    // Check if this error is about our file
    if (line.includes(filePath) || line.includes(filePath.split('/').pop())) {
      inRelevantBlock = true;
    }

    // Collect error lines
    if (inRelevantBlock) {
      if (line.includes('error TS')) {
        relevantErrors.push(`error: ${line.trim()}`);
      } else if (line.trim() === '') {
        inRelevantBlock = false;
      }
    }
  }

  // Show errors for edited file, or first 5 errors if none specific
  if (relevantErrors.length > 0) {
    for (const err of relevantErrors.slice(0, 10)) {
      console.log(err);
    }
  } else {
    // Show generic error count
    const errorCount = (output.match(/error TS/g) || []).length;
    if (errorCount > 0) {
      console.log(`Found ${errorCount} type error(s) in project`);
      // Show first few
      const firstErrors = lines
        .filter(l => l.includes('error TS'))
        .slice(0, 5);
      for (const err of firstErrors) {
        console.log(`error: ${err.trim()}`);
      }
    }
  }
}

/**
 * Find nearest jsconfig.json or tsconfig.json
 * @param {string} filePath
 * @returns {string | null}
 */
function findConfig(filePath) {
  let dir = dirname(filePath);
  const root = '/';

  while (dir !== root) {
    const jsconfig = join(dir, 'jsconfig.json');
    const tsconfig = join(dir, 'tsconfig.json');

    if (existsSync(jsconfig)) {
      return jsconfig;
    }
    if (existsSync(tsconfig)) {
      return tsconfig;
    }

    dir = dirname(dir);
  }

  return null;
}
