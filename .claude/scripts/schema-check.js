#!/usr/bin/env node

/**
 * Database Schema Validator
 * Checks for schema documentation and migration consistency.
 *
 * Usage:
 *   node scripts/schema-check.js
 *   node scripts/schema-check.js --dir=backend
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, relative, basename } from 'path';

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
 * @property {string} [file]
 */

/**
 * Find database directories
 * @returns {string[]}
 */
function findDbDirs() {
  const candidates = [
    'src/db',
    'db',
    'database',
    'backend/src/db',
    'backend/db',
    'api/src/db'
  ];

  return candidates.filter(dir => existsSync(dir));
}

/**
 * Check for schema.sql documentation
 * @param {string} dbDir
 * @returns {Issue[]}
 */
function checkSchemaDoc(dbDir) {
  const issues = [];
  const schemaPath = join(dbDir, 'schema.sql');

  if (!existsSync(schemaPath)) {
    issues.push({
      severity: 'warning',
      message: `No schema.sql found in ${dbDir}. Consider documenting your database schema.`,
      file: schemaPath
    });
    return issues;
  }

  const content = readFileSync(schemaPath, 'utf-8');
  const lines = content.split('\n');

  // Check for minimum documentation
  if (lines.length < 10) {
    issues.push({
      severity: 'warning',
      message: 'schema.sql appears incomplete. Document all tables and columns.',
      file: schemaPath
    });
  }

  // Check for table documentation
  const tableMatches = content.match(/CREATE TABLE\s+(\w+)/gi) || [];
  const commentMatches = content.match(/COMMENT ON TABLE/gi) || [];

  if (tableMatches.length > 0 && commentMatches.length === 0) {
    issues.push({
      severity: 'info',
      message: 'Consider adding COMMENT ON TABLE statements for documentation',
      file: schemaPath
    });
  }

  // Check for header comments
  if (!content.includes('--') && !content.includes('/*')) {
    issues.push({
      severity: 'info',
      message: 'schema.sql has no comments. Add documentation for maintainability.',
      file: schemaPath
    });
  }

  return issues;
}

/**
 * Check migrations directory
 * @param {string} dbDir
 * @returns {Issue[]}
 */
function checkMigrations(dbDir) {
  const issues = [];
  const migrationsDir = join(dbDir, 'migrations');

  if (!existsSync(migrationsDir)) {
    issues.push({
      severity: 'info',
      message: `No migrations directory found at ${migrationsDir}`,
      file: migrationsDir
    });
    return issues;
  }

  const files = readdirSync(migrationsDir)
    .filter(f => f.endsWith('.js') && !f.startsWith('.'))
    .sort();

  if (files.length === 0) {
    issues.push({
      severity: 'info',
      message: 'Migrations directory is empty',
      file: migrationsDir
    });
    return issues;
  }

  // Check each migration file
  for (const file of files) {
    const filePath = join(migrationsDir, file);
    const content = readFileSync(filePath, 'utf-8');

    // Check for up function
    if (!content.includes('export async function up') &&
        !content.includes('export function up')) {
      issues.push({
        severity: 'error',
        message: `Migration missing 'up' function`,
        file: filePath
      });
    }

    // Check for down function
    if (!content.includes('export async function down') &&
        !content.includes('export function down')) {
      issues.push({
        severity: 'warning',
        message: `Migration missing 'down' function (rollback)`,
        file: filePath
      });
    }

    // Check for description
    if (!content.includes('export const description')) {
      issues.push({
        severity: 'info',
        message: `Migration missing 'description' export`,
        file: filePath
      });
    }

    // Check for SQL injection patterns
    if (content.match(/query\s*\(\s*`[^`]*\$\{/)) {
      issues.push({
        severity: 'error',
        message: 'Potential SQL injection in migration - use parameterized queries',
        file: filePath
      });
    }

    // Check for DROP without CASCADE awareness
    if (content.match(/DROP TABLE\s+(?!IF EXISTS)/i)) {
      issues.push({
        severity: 'warning',
        message: 'Use DROP TABLE IF EXISTS for safer rollbacks',
        file: filePath
      });
    }
  }

  // Check migration numbering
  const numbers = files.map(f => {
    const match = f.match(/^(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  });

  for (let i = 1; i < numbers.length; i++) {
    if (numbers[i] <= numbers[i - 1]) {
      issues.push({
        severity: 'warning',
        message: `Migration numbering issue: ${files[i]} should have higher number than ${files[i - 1]}`,
        file: join(migrationsDir, files[i])
      });
    }
  }

  return issues;
}

/**
 * Check seeds directory
 * @param {string} dbDir
 * @returns {Issue[]}
 */
function checkSeeds(dbDir) {
  const issues = [];
  const seedsDir = join(dbDir, 'seeds');

  if (!existsSync(seedsDir)) {
    return issues; // Seeds are optional
  }

  const files = readdirSync(seedsDir)
    .filter(f => f.endsWith('.js') && !f.startsWith('.'));

  for (const file of files) {
    const filePath = join(seedsDir, file);
    const content = readFileSync(filePath, 'utf-8');

    // Check for seed function
    if (!content.includes('export async function seed') &&
        !content.includes('export function seed')) {
      issues.push({
        severity: 'error',
        message: `Seed file missing 'seed' function`,
        file: filePath
      });
    }

    // Check for production safety
    if (!content.includes('ON CONFLICT') && content.includes('INSERT')) {
      issues.push({
        severity: 'info',
        message: 'Consider using ON CONFLICT for idempotent seeds',
        file: filePath
      });
    }
  }

  return issues;
}

/**
 * Check database client
 * @param {string} dbDir
 * @returns {Issue[]}
 */
function checkClient(dbDir) {
  const issues = [];
  const clientPath = join(dbDir, 'client.js');

  if (!existsSync(clientPath)) {
    issues.push({
      severity: 'warning',
      message: 'No database client found at ' + clientPath,
      file: clientPath
    });
    return issues;
  }

  const content = readFileSync(clientPath, 'utf-8');

  // Check for connection pooling
  if (!content.includes('Pool') && !content.includes('pool')) {
    issues.push({
      severity: 'warning',
      message: 'Consider using connection pooling for better performance',
      file: clientPath
    });
  }

  // Check for SSL configuration
  if (!content.includes('ssl')) {
    issues.push({
      severity: 'info',
      message: 'Consider adding SSL configuration for production',
      file: clientPath
    });
  }

  // Check for transaction support
  if (!content.includes('transaction') && !content.includes('BEGIN')) {
    issues.push({
      severity: 'info',
      message: 'Consider adding transaction helper function',
      file: clientPath
    });
  }

  return issues;
}

/**
 * Format and print results
 * @param {Issue[]} issues
 */
function printResults(issues) {
  let errorCount = 0;
  let warningCount = 0;
  let infoCount = 0;

  // Group by file
  const byFile = new Map();
  for (const issue of issues) {
    const file = issue.file || '(general)';
    if (!byFile.has(file)) {
      byFile.set(file, []);
    }
    byFile.get(file).push(issue);
  }

  for (const [file, fileIssues] of byFile) {
    console.log(`\n${colors.cyan}${relative(process.cwd(), file)}${colors.reset}`);

    for (const issue of fileIssues) {
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
    console.log(`${colors.green}✓${colors.reset} Database schema checks passed`);
  } else {
    const parts = [];
    if (errorCount > 0) parts.push(`${colors.red}${errorCount} error(s)${colors.reset}`);
    if (warningCount > 0) parts.push(`${colors.yellow}${warningCount} warning(s)${colors.reset}`);
    if (infoCount > 0) parts.push(`${colors.dim}${infoCount} info${colors.reset}`);
    console.log(`Found: ${parts.join(', ')}`);
  }

  return errorCount;
}

/**
 * Main function
 */
function main() {
  console.log(`${colors.cyan}Database Schema Check${colors.reset}`);

  // Parse arguments
  const args = process.argv.slice(2);
  let customDir = null;

  for (const arg of args) {
    if (arg.startsWith('--dir=')) {
      customDir = arg.slice(6);
    }
  }

  // Find database directories
  const dbDirs = customDir ? [customDir] : findDbDirs();

  if (dbDirs.length === 0) {
    console.log(`${colors.dim}No database directories found${colors.reset}`);
    console.log('Checked: src/db, db, database, backend/src/db');
    process.exit(0);
  }

  console.log(`Checking: ${dbDirs.join(', ')}`);

  // Collect all issues
  const allIssues = [];

  for (const dbDir of dbDirs) {
    allIssues.push(...checkSchemaDoc(dbDir));
    allIssues.push(...checkMigrations(dbDir));
    allIssues.push(...checkSeeds(dbDir));
    allIssues.push(...checkClient(dbDir));
  }

  // Print results
  const errorCount = printResults(allIssues);

  process.exit(errorCount > 0 ? 1 : 0);
}

main();
