#!/usr/bin/env node

/**
 * REST API Validator
 * Checks API endpoint files for common patterns and issues.
 *
 * Usage:
 *   node scripts/api-check.js [file...]
 *   node scripts/api-check.js src/api/users.js
 *   node scripts/api-check.js  # checks all files in src/api/
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

/**
 * @typedef {object} CheckResult
 * @property {string} file
 * @property {Issue[]} issues
 */

// Patterns to check
const CHECKS = [
  {
    name: 'missing-status-code',
    description: 'Response without explicit status code',
    severity: 'warning',
    pattern: /res\.(json|send)\s*\(/g,
    negativePattern: /res\.status\s*\(\s*\d+\s*\)/,
    message: 'Response without explicit status code. Use res.status(200).json() instead of res.json()',
    lineCheck: true
  },
  {
    name: 'hardcoded-status-in-json',
    description: 'Status code should be HTTP status, not in body',
    severity: 'warning',
    pattern: /res\.(json|send)\s*\(\s*\{[^}]*status\s*:\s*\d+/g,
    message: 'Avoid status code in response body. Use HTTP status code instead'
  },
  {
    name: 'console-log-in-api',
    description: 'Console.log in API code',
    severity: 'warning',
    pattern: /console\.log\s*\(/g,
    message: 'Use structured logging instead of console.log in production API code'
  },
  {
    name: 'no-error-handling',
    description: 'Async handler without try/catch',
    severity: 'error',
    pattern: /async\s*\([^)]*\)\s*=>\s*\{(?![^}]*try\s*\{)/g,
    message: 'Async route handler should have try/catch or use error middleware'
  },
  {
    name: 'sql-injection-risk',
    description: 'Potential SQL injection',
    severity: 'error',
    pattern: /query\s*\(\s*`[^`]*\$\{/g,
    message: 'Potential SQL injection: use parameterized queries instead of string interpolation'
  },
  {
    name: 'missing-validation',
    description: 'POST/PUT/PATCH without validation',
    severity: 'info',
    pattern: /\.(post|put|patch)\s*\([^,]+,\s*async/g,
    message: 'Consider adding input validation middleware for POST/PUT/PATCH endpoints'
  },
  {
    name: 'missing-rate-limit',
    description: 'Auth endpoint without rate limiting',
    severity: 'warning',
    pattern: /\/(auth|login|register|password)/g,
    negativePattern: /rateLimit/,
    message: 'Auth-related endpoint should have rate limiting'
  },
  {
    name: 'missing-content-type',
    description: 'Missing content-type handling',
    severity: 'info',
    pattern: /app\.(post|put|patch)\s*\(/g,
    negativePattern: /express\.json|express\.urlencoded|bodyParser/,
    message: 'Ensure body parser middleware is configured for POST/PUT/PATCH'
  },
  {
    name: 'api-method-support',
    description: 'Form endpoint without API_METHOD support',
    severity: 'info',
    pattern: /\.(put|patch|delete)\s*\(['"]\/(api\/)?/g,
    negativePattern: /API_METHOD|methodOverride/,
    message: 'Consider supporting API_METHOD for HTML form progressive enhancement',
    fileLevel: true
  },
  {
    name: 'no-versioning',
    description: 'API without versioning',
    severity: 'info',
    pattern: /app\.(get|post|put|patch|delete)\s*\(['"]\//g,
    negativePattern: /Accept-Version|API-Version|\/v\d+\//,
    message: 'Consider implementing API versioning via headers or URL',
    fileLevel: true
  },
  {
    name: 'exposed-stack-trace',
    description: 'Stack trace in error response',
    severity: 'error',
    pattern: /res\.(json|send)\s*\([^)]*\.stack/g,
    message: 'Do not expose stack traces in API responses'
  },
  {
    name: 'missing-cors',
    description: 'CORS headers not configured',
    severity: 'info',
    pattern: /app\.use\s*\(/g,
    negativePattern: /cors\s*\(|Access-Control/,
    message: 'Consider configuring CORS if this API is called from browsers',
    fileLevel: true
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
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...findJsFiles(fullPath));
    } else if (extname(entry) === '.js') {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Check a single file
 * @param {string} filePath
 * @returns {CheckResult}
 */
function checkFile(filePath) {
  const issues = [];

  if (!existsSync(filePath)) {
    return { file: filePath, issues: [{ severity: 'error', message: 'File not found' }] };
  }

  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  // Run each check
  for (const check of CHECKS) {
    // File-level checks (check if pattern exists but negative doesn't)
    if (check.fileLevel) {
      const hasPattern = check.pattern.test(content);
      check.pattern.lastIndex = 0; // Reset regex

      if (hasPattern) {
        const hasNegative = check.negativePattern?.test(content);
        if (check.negativePattern) check.negativePattern.lastIndex = 0;

        if (!hasNegative) {
          issues.push({
            severity: check.severity,
            message: check.message,
            code: check.name
          });
        }
      }
      continue;
    }

    // Line-level checks
    let match;
    while ((match = check.pattern.exec(content)) !== null) {
      // Find line number
      const beforeMatch = content.slice(0, match.index);
      const lineNumber = beforeMatch.split('\n').length;

      // Check negative pattern if exists (on the same line or nearby)
      if (check.negativePattern) {
        const lineContent = lines[lineNumber - 1];
        if (check.negativePattern.test(lineContent)) {
          continue;
        }
        check.negativePattern.lastIndex = 0;
      }

      // For line-check patterns, check if the line before has status
      if (check.lineCheck && check.name === 'missing-status-code') {
        // Look at surrounding context (3 lines before)
        const startLine = Math.max(0, lineNumber - 4);
        const context = lines.slice(startLine, lineNumber).join('\n');
        if (/res\.status\s*\(\s*\d+\s*\)/.test(context)) {
          continue;
        }
      }

      issues.push({
        severity: check.severity,
        message: check.message,
        line: lineNumber,
        code: check.name
      });
    }
  }

  return { file: filePath, issues };
}

/**
 * Check for OpenAPI spec
 * @returns {Issue[]}
 */
function checkOpenApiSpec() {
  const issues = [];
  const specPaths = [
    'openapi.json',
    'openapi.yaml',
    'openapi.yml',
    'docs/openapi.json',
    'docs/openapi.yaml',
    'api/openapi.json',
    'src/api/openapi.json'
  ];

  const hasSpec = specPaths.some(p => existsSync(p));

  if (!hasSpec) {
    issues.push({
      severity: 'info',
      message: 'No OpenAPI specification found. Consider adding openapi.json or openapi.yaml',
      code: 'missing-openapi-spec'
    });
  }

  return issues;
}

/**
 * Format and print results
 * @param {CheckResult[]} results
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
  if (errorCount === 0 && warningCount === 0) {
    console.log(`${colors.green}✓${colors.reset} No issues found`);
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
  const args = process.argv.slice(2);
  const files = [];

  // Collect files to check
  if (args.length === 0) {
    // Default: check src/api directory
    const apiDirs = ['src/api', 'api', 'src/routes', 'routes', 'src/server'];
    for (const dir of apiDirs) {
      files.push(...findJsFiles(dir));
    }

    if (files.length === 0) {
      console.log(`${colors.dim}No API files found in default directories${colors.reset}`);
      console.log(`Checked: ${apiDirs.join(', ')}`);
      process.exit(0);
    }
  } else {
    // Check specified files
    for (const arg of args) {
      if (statSync(arg).isDirectory()) {
        files.push(...findJsFiles(arg));
      } else {
        files.push(arg);
      }
    }
  }

  console.log(`${colors.cyan}REST API Check${colors.reset}`);
  console.log(`Checking ${files.length} file(s)...`);

  // Check all files
  const results = files.map(checkFile);

  // Check for OpenAPI spec
  const specIssues = checkOpenApiSpec();
  if (specIssues.length > 0) {
    results.push({ file: '(project)', issues: specIssues });
  }

  // Print results
  const errorCount = printResults(results);

  process.exit(errorCount > 0 ? 1 : 0);
}

main();
