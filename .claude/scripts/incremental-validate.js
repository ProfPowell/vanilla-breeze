#!/usr/bin/env node

/**
 * Incremental Validation Script
 *
 * Only validates changed files for faster feedback loops.
 * Uses git to detect changes and caches results.
 *
 * Usage:
 *   node scripts/incremental-validate.js              # Validate all changed files
 *   node scripts/incremental-validate.js --staged     # Only staged files
 *   node scripts/incremental-validate.js --since=HEAD~3  # Since specific commit
 *   node scripts/incremental-validate.js --type=html  # Only HTML files
 *   node scripts/incremental-validate.js --no-cache   # Skip cache
 */

import { execSync, spawn } from 'child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync, statSync } from 'fs';
import { createHash } from 'crypto';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..');
const CACHE_DIR = join(ROOT_DIR, '.cache');
const CACHE_FILE = join(CACHE_DIR, 'validation-cache.json');

// Colors for terminal output
const colors = {
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  dim: '\x1b[2m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  staged: args.includes('--staged'),
  since: args.find(a => a.startsWith('--since='))?.split('=')[1] || null,
  type: args.find(a => a.startsWith('--type='))?.split('=')[1] || null,
  noCache: args.includes('--no-cache'),
  verbose: args.includes('--verbose') || args.includes('-v'),
  json: args.includes('--json'),
  quiet: args.includes('--quiet') || args.includes('-q'),
};

/**
 * Check if we're in a git repository
 * @returns {boolean}
 */
function isGitRepo() {
  try {
    execSync('git rev-parse --git-dir', { cwd: ROOT_DIR, stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get list of changed files from git
 * @returns {string[]}
 */
function getChangedFiles() {
  let command;

  if (options.staged) {
    // Only staged files
    command = 'git diff --cached --name-only --diff-filter=ACMR';
  } else if (options.since) {
    // Changes since a specific commit
    command = `git diff --name-only --diff-filter=ACMR ${options.since}`;
  } else {
    // All changes (staged + unstaged + untracked)
    const staged = execSync('git diff --cached --name-only --diff-filter=ACMR', {
      cwd: ROOT_DIR,
      encoding: 'utf-8',
    }).trim();

    const unstaged = execSync('git diff --name-only --diff-filter=ACMR', {
      cwd: ROOT_DIR,
      encoding: 'utf-8',
    }).trim();

    const untracked = execSync('git ls-files --others --exclude-standard', {
      cwd: ROOT_DIR,
      encoding: 'utf-8',
    }).trim();

    const allFiles = [staged, unstaged, untracked]
      .filter(Boolean)
      .join('\n')
      .split('\n')
      .filter(Boolean);

    // Deduplicate
    return [...new Set(allFiles)];
  }

  try {
    const output = execSync(command, { cwd: ROOT_DIR, encoding: 'utf-8' });
    return output.trim().split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Filter files by extension
 * @param {string[]} files
 * @param {string[]} extensions
 * @returns {string[]}
 */
function filterByExtension(files, extensions) {
  return files.filter(f => {
    const ext = f.split('.').pop()?.toLowerCase();
    return extensions.includes(ext);
  });
}

/**
 * Get file hash for caching
 * @param {string} filePath
 * @returns {string|null}
 */
function getFileHash(filePath) {
  const fullPath = join(ROOT_DIR, filePath);
  if (!existsSync(fullPath)) {
    return null;
  }
  try {
    const content = readFileSync(fullPath);
    return createHash('md5').update(content).digest('hex');
  } catch {
    return null;
  }
}

/**
 * Load validation cache
 * @returns {object}
 */
function loadCache() {
  if (options.noCache || !existsSync(CACHE_FILE)) {
    return {};
  }
  try {
    return JSON.parse(readFileSync(CACHE_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

/**
 * Save validation cache
 * @param {object} cache
 */
function saveCache(cache) {
  if (options.noCache) {
    return;
  }
  try {
    if (!existsSync(CACHE_DIR)) {
      mkdirSync(CACHE_DIR, { recursive: true });
    }
    writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  } catch (error) {
    if (options.verbose) {
      console.error(`${colors.yellow}Warning: Could not save cache: ${error.message}${colors.reset}`);
    }
  }
}

/**
 * Check if file validation is cached and still valid
 * @param {string} filePath
 * @param {string} validatorType
 * @param {object} cache
 * @returns {object|null}
 */
function getCachedResult(filePath, validatorType, cache) {
  const cacheKey = `${validatorType}:${filePath}`;
  const cached = cache[cacheKey];

  if (!cached) {
    return null;
  }

  const currentHash = getFileHash(filePath);
  if (currentHash && cached.hash === currentHash) {
    return cached;
  }

  return null;
}

/**
 * Run a validator command and capture output
 * @param {string} command
 * @param {string[]} args
 * @returns {Promise<{exitCode: number, output: string}>}
 */
function runValidator(command, args) {
  return new Promise((resolve) => {
    const proc = spawn(command, args, {
      cwd: ROOT_DIR,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let output = '';

    proc.stdout.on('data', (data) => {
      output += data.toString();
    });

    proc.stderr.on('data', (data) => {
      output += data.toString();
    });

    proc.on('close', (exitCode) => {
      resolve({ exitCode: exitCode || 0, output });
    });

    proc.on('error', () => {
      resolve({ exitCode: 1, output: 'Failed to run validator' });
    });
  });
}

/**
 * Validate HTML files
 * @param {string[]} files
 * @param {object} cache
 * @returns {Promise<object>}
 */
async function validateHtml(files, cache) {
  const results = { passed: [], failed: [], cached: [], errors: [] };

  for (const file of files) {
    // Check cache
    const cachedResult = getCachedResult(file, 'html', cache);
    if (cachedResult) {
      if (cachedResult.passed) {
        results.cached.push(file);
      } else {
        results.failed.push({ file, output: cachedResult.output });
      }
      continue;
    }

    // Run html-validate
    const { exitCode, output } = await runValidator('npx', ['html-validate', file]);

    const hash = getFileHash(file);
    const passed = exitCode === 0;

    // Update cache
    if (hash) {
      cache[`html:${file}`] = { hash, passed, output, timestamp: Date.now() };
    }

    if (passed) {
      results.passed.push(file);
    } else {
      results.failed.push({ file, output });
      results.errors.push(output);
    }
  }

  return results;
}

/**
 * Validate CSS files
 * @param {string[]} files
 * @param {object} cache
 * @returns {Promise<object>}
 */
async function validateCss(files, cache) {
  const results = { passed: [], failed: [], cached: [], errors: [] };

  for (const file of files) {
    // Skip invalid test fixtures
    if (file.includes('test/fixtures/invalid')) {
      continue;
    }

    // Check cache
    const cachedResult = getCachedResult(file, 'css', cache);
    if (cachedResult) {
      if (cachedResult.passed) {
        results.cached.push(file);
      } else {
        results.failed.push({ file, output: cachedResult.output });
      }
      continue;
    }

    // Run stylelint
    const { exitCode, output } = await runValidator('npx', ['stylelint', file]);

    const hash = getFileHash(file);
    const passed = exitCode === 0;

    // Update cache
    if (hash) {
      cache[`css:${file}`] = { hash, passed, output, timestamp: Date.now() };
    }

    if (passed) {
      results.passed.push(file);
    } else {
      results.failed.push({ file, output });
      results.errors.push(output);
    }
  }

  return results;
}

/**
 * Validate JavaScript files
 * @param {string[]} files
 * @param {object} cache
 * @returns {Promise<object>}
 */
async function validateJs(files, cache) {
  const results = { passed: [], failed: [], cached: [], errors: [] };

  for (const file of files) {
    // Skip invalid test fixtures and node_modules
    if (file.includes('test/fixtures/invalid') || file.includes('node_modules')) {
      continue;
    }

    // Check cache
    const cachedResult = getCachedResult(file, 'js', cache);
    if (cachedResult) {
      if (cachedResult.passed) {
        results.cached.push(file);
      } else {
        results.failed.push({ file, output: cachedResult.output });
      }
      continue;
    }

    // Run eslint
    const { exitCode, output } = await runValidator('npx', ['eslint', file]);

    const hash = getFileHash(file);
    const passed = exitCode === 0;

    // Update cache
    if (hash) {
      cache[`js:${file}`] = { hash, passed, output, timestamp: Date.now() };
    }

    if (passed) {
      results.passed.push(file);
    } else {
      results.failed.push({ file, output });
      results.errors.push(output);
    }
  }

  return results;
}

/**
 * Print results summary
 * @param {object} results
 */
function printResults(results) {
  const { html, css, js } = results;

  if (options.json) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  console.log('');
  console.log(`${colors.cyan}${colors.bold}=== Incremental Validation Results ===${colors.reset}`);
  console.log('');

  // Summary table
  const types = [
    { name: 'HTML', data: html },
    { name: 'CSS', data: css },
    { name: 'JS', data: js },
  ];

  for (const { name, data } of types) {
    if (!data) continue;

    const total = data.passed.length + data.failed.length + data.cached.length;
    if (total === 0) continue;

    const status = data.failed.length === 0
      ? `${colors.green}✓${colors.reset}`
      : `${colors.red}✗${colors.reset}`;

    console.log(`${status} ${colors.bold}${name}${colors.reset}: ${data.passed.length} passed, ${data.failed.length} failed, ${data.cached.length} cached`);

    // Show failed files
    if (data.failed.length > 0 && !options.quiet) {
      for (const { file, output } of data.failed) {
        console.log(`  ${colors.red}•${colors.reset} ${file}`);
        if (options.verbose && output) {
          console.log(`    ${colors.dim}${output.trim().split('\n').join('\n    ')}${colors.reset}`);
        }
      }
    }
  }

  // Overall summary
  const totalFailed = (html?.failed.length || 0) + (css?.failed.length || 0) + (js?.failed.length || 0);
  const totalPassed = (html?.passed.length || 0) + (css?.passed.length || 0) + (js?.passed.length || 0);
  const totalCached = (html?.cached.length || 0) + (css?.cached.length || 0) + (js?.cached.length || 0);

  console.log('');
  if (totalFailed === 0) {
    console.log(`${colors.green}${colors.bold}All validations passed!${colors.reset}`);
  } else {
    console.log(`${colors.red}${colors.bold}${totalFailed} file(s) failed validation${colors.reset}`);
  }

  if (totalCached > 0) {
    console.log(`${colors.dim}${totalCached} file(s) used cached results${colors.reset}`);
  }

  console.log('');
}

/**
 * Main function
 */
async function main() {
  // Check if we're in a git repo
  if (!isGitRepo()) {
    console.error(`${colors.red}Error: Not a git repository${colors.reset}`);
    console.error('Incremental validation requires git to detect changed files.');
    console.error('Use npm run lint:all for full validation instead.');
    process.exit(1);
  }

  // Get changed files
  const changedFiles = getChangedFiles();

  if (changedFiles.length === 0) {
    if (!options.quiet) {
      console.log(`${colors.green}No changed files to validate${colors.reset}`);
    }
    process.exit(0);
  }

  if (options.verbose) {
    console.log(`${colors.dim}Found ${changedFiles.length} changed file(s)${colors.reset}`);
  }

  // Filter by type if specified
  let htmlFiles = filterByExtension(changedFiles, ['html', 'xhtml', 'htm']);
  let cssFiles = filterByExtension(changedFiles, ['css']);
  let jsFiles = filterByExtension(changedFiles, ['js']);

  if (options.type) {
    if (options.type === 'html') {
      cssFiles = [];
      jsFiles = [];
    } else if (options.type === 'css') {
      htmlFiles = [];
      jsFiles = [];
    } else if (options.type === 'js') {
      htmlFiles = [];
      cssFiles = [];
    }
  }

  // Load cache
  const cache = loadCache();

  // Run validators
  const results = {
    html: htmlFiles.length > 0 ? await validateHtml(htmlFiles, cache) : null,
    css: cssFiles.length > 0 ? await validateCss(cssFiles, cache) : null,
    js: jsFiles.length > 0 ? await validateJs(jsFiles, cache) : null,
  };

  // Save cache
  saveCache(cache);

  // Print results
  printResults(results);

  // Exit with error code if any failures
  const totalFailed = (results.html?.failed.length || 0) +
                      (results.css?.failed.length || 0) +
                      (results.js?.failed.length || 0);

  process.exit(totalFailed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
  process.exit(1);
});
