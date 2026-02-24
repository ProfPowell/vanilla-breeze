#!/usr/bin/env node

/**
 * Project Health Dashboard
 *
 * Runs all validators and provides a summary view of project health.
 *
 * Usage:
 *   node scripts/health-check.js
 *   npm run health
 *
 * Options:
 *   --json    Output as JSON instead of formatted text
 *   --quiet   Only show summary, not individual checks
 */

import { execSync } from 'child_process';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

// Colors for terminal output
const colors = {
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
};

// Parse command line arguments
const args = process.argv.slice(2);
const jsonOutput = args.includes('--json');
const quietMode = args.includes('--quiet');

/**
 * Count files by extension in a directory
 * @param {string} dir - Directory to scan
 * @param {string} ext - File extension to count
 * @param {string[]} ignoreDirs - Directories to ignore
 * @returns {number} File count
 */
function countFiles(dir, ext, ignoreDirs = ['node_modules', '.git', '.beads', 'test/fixtures/invalid']) {
  let count = 0;

  function scan(currentDir) {
    try {
      const entries = readdirSync(currentDir);
      for (const entry of entries) {
        const fullPath = join(currentDir, entry);

        // Skip ignored directories
        if (ignoreDirs.some(ignored => fullPath.includes(ignored))) {
          continue;
        }

        try {
          const stat = statSync(fullPath);
          if (stat.isDirectory()) {
            scan(fullPath);
          } else if (entry.endsWith(ext)) {
            count++;
          }
        } catch {
          // Skip inaccessible files
        }
      }
    } catch {
      // Skip inaccessible directories
    }
  }

  scan(dir);
  return count;
}

/**
 * Run a command and capture output
 * @param {string} command - Command to run
 * @param {boolean} allowFailure - Whether to allow non-zero exit codes
 * @returns {object} Result with success, output, errorCount
 */
function runCommand(command, allowFailure = true) {
  try {
    const output = execSync(command, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      maxBuffer: 10 * 1024 * 1024,
    });
    return { success: true, output, errorCount: 0 };
  } catch (error) {
    if (allowFailure) {
      const output = error.stdout || error.stderr || '';
      // Try to count errors from output
      const errorCount = (output.match(/error|Error|✗|failed/gi) || []).length;
      return { success: false, output, errorCount };
    }
    throw error;
  }
}

/**
 * Check HTML files
 * @returns {object} Check result
 */
function checkHtml() {
  const fileCount = countFiles('.', '.html');

  try {
    // Run html-validate with JSON output
    const result = runCommand("npx html-validate '**/*.html' --formatter json 2>/dev/null || true");
    let errorCount = 0;
    let warningCount = 0;

    if (result.output.trim()) {
      try {
        const parsed = JSON.parse(result.output);
        for (const file of parsed) {
          errorCount += file.errorCount || 0;
          warningCount += file.warningCount || 0;
        }
      } catch {
        // If JSON parsing fails, estimate from text
        errorCount = (result.output.match(/error/gi) || []).length;
      }
    }

    return {
      name: 'HTML',
      fileCount,
      errorCount,
      warningCount,
      status: errorCount === 0 ? 'pass' : 'fail',
    };
  } catch {
    return { name: 'HTML', fileCount, errorCount: -1, warningCount: 0, status: 'error' };
  }
}

/**
 * Check CSS files
 * @returns {object} Check result
 */
function checkCss() {
  const fileCount = countFiles('.', '.css');

  try {
    const result = runCommand("npx stylelint '**/*.css' --formatter json --ignore-pattern 'node_modules/**' --ignore-pattern 'test/fixtures/invalid/**' 2>/dev/null || true");
    let errorCount = 0;
    let warningCount = 0;

    if (result.output.trim()) {
      try {
        const parsed = JSON.parse(result.output);
        for (const file of parsed) {
          for (const warning of file.warnings || []) {
            if (warning.severity === 'error') {
              errorCount++;
            } else {
              warningCount++;
            }
          }
        }
      } catch {
        errorCount = (result.output.match(/error/gi) || []).length;
      }
    }

    return {
      name: 'CSS',
      fileCount,
      errorCount,
      warningCount,
      status: errorCount === 0 ? 'pass' : 'fail',
    };
  } catch {
    return { name: 'CSS', fileCount, errorCount: -1, warningCount: 0, status: 'error' };
  }
}

/**
 * Check JavaScript files
 * @returns {object} Check result
 */
function checkJavaScript() {
  const fileCount = countFiles('.', '.js');

  try {
    const result = runCommand("npx eslint '**/*.js' --format json --ignore-pattern 'node_modules' --ignore-pattern 'test/fixtures/invalid/**' 2>/dev/null || true");
    let errorCount = 0;
    let warningCount = 0;

    if (result.output.trim()) {
      try {
        const parsed = JSON.parse(result.output);
        for (const file of parsed) {
          errorCount += file.errorCount || 0;
          warningCount += file.warningCount || 0;
        }
      } catch {
        errorCount = (result.output.match(/error/gi) || []).length;
      }
    }

    return {
      name: 'JavaScript',
      fileCount,
      errorCount,
      warningCount,
      status: errorCount === 0 ? 'pass' : 'fail',
    };
  } catch {
    return { name: 'JavaScript', fileCount, errorCount: -1, warningCount: 0, status: 'error' };
  }
}

/**
 * Check images
 * @returns {object} Check result
 */
function checkImages() {
  const jpgCount = countFiles('.', '.jpg') + countFiles('.', '.jpeg');
  const pngCount = countFiles('.', '.png');
  const webpCount = countFiles('.', '.webp');
  const avifCount = countFiles('.', '.avif');
  const totalImages = jpgCount + pngCount + webpCount + avifCount;

  // Check if modern formats exist
  const hasModernFormats = webpCount > 0 || avifCount > 0;
  const modernFormatRatio = totalImages > 0 ? ((webpCount + avifCount) / totalImages * 100).toFixed(0) : 0;

  return {
    name: 'Images',
    fileCount: totalImages,
    details: {
      jpg: jpgCount,
      png: pngCount,
      webp: webpCount,
      avif: avifCount,
      modernRatio: `${modernFormatRatio}%`,
    },
    status: hasModernFormats || totalImages === 0 ? 'pass' : 'warn',
    warningCount: hasModernFormats ? 0 : (jpgCount + pngCount),
    errorCount: 0,
  };
}

/**
 * Check spelling
 * @returns {object} Check result
 */
function checkSpelling() {
  try {
    const result = runCommand("npx cspell '**/*.html' --config .config/cspell.json --quiet 2>&1 || true");
    const issues = (result.output.match(/Unknown word/gi) || []).length;

    return {
      name: 'Spelling',
      errorCount: issues,
      warningCount: 0,
      status: issues === 0 ? 'pass' : 'warn',
    };
  } catch {
    return { name: 'Spelling', errorCount: -1, warningCount: 0, status: 'error' };
  }
}

/**
 * Check internal links
 * @returns {object} Check result
 */
function checkLinks() {
  try {
    const result = runCommand('npx link-checker examples --json 2>/dev/null || true');
    let brokenCount = 0;

    if (result.output.trim()) {
      try {
        const parsed = JSON.parse(result.output);
        brokenCount = parsed.brokenLinks?.length || 0;
      } catch {
        brokenCount = (result.output.match(/broken|404|not found/gi) || []).length;
      }
    }

    return {
      name: 'Links',
      errorCount: brokenCount,
      warningCount: 0,
      status: brokenCount === 0 ? 'pass' : 'fail',
    };
  } catch {
    return { name: 'Links', errorCount: -1, warningCount: 0, status: 'error' };
  }
}

/**
 * Check npm audit for vulnerabilities
 * @returns {object} Check result
 */
function checkSecurity() {
  try {
    const result = runCommand('npm audit --json 2>/dev/null || true');
    let vulnerabilities = 0;

    if (result.output.trim()) {
      try {
        const parsed = JSON.parse(result.output);
        vulnerabilities = parsed.metadata?.vulnerabilities?.total || 0;
      } catch {
        vulnerabilities = (result.output.match(/vulnerabilit/gi) || []).length;
      }
    }

    return {
      name: 'Security',
      errorCount: vulnerabilities,
      warningCount: 0,
      status: vulnerabilities === 0 ? 'pass' : 'warn',
      details: { vulnerabilities },
    };
  } catch {
    return { name: 'Security', errorCount: -1, warningCount: 0, status: 'error' };
  }
}

/**
 * Get test status
 * @returns {object} Check result
 */
function checkTests() {
  try {
    const result = runCommand('npm test 2>&1 || true');
    const passMatch = result.output.match(/pass (\d+)/);
    const failMatch = result.output.match(/fail (\d+)/);

    const passed = passMatch ? parseInt(passMatch[1], 10) : 0;
    const failed = failMatch ? parseInt(failMatch[1], 10) : 0;

    return {
      name: 'Tests',
      details: { passed, failed },
      errorCount: failed,
      warningCount: 0,
      status: failed === 0 ? 'pass' : 'fail',
    };
  } catch {
    return { name: 'Tests', errorCount: -1, warningCount: 0, status: 'error' };
  }
}

/**
 * Strip ANSI escape codes from a string
 * @param {string} str - String with potential ANSI codes
 * @returns {string} Plain string without ANSI codes
 */
function stripAnsi(str) {
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

/**
 * Get visible width of a string (excluding ANSI codes)
 * @param {string} str - String to measure
 * @returns {number} Visible character count
 */
function visibleWidth(str) {
  return stripAnsi(str).length;
}

/**
 * Pad a string to a fixed visible width
 * @param {string} str - String to pad (may contain ANSI codes)
 * @param {number} width - Desired visible width
 * @returns {string} Padded string
 */
function padEnd(str, width) {
  const visible = visibleWidth(str);
  const padding = Math.max(0, width - visible);
  return str + ' '.repeat(padding);
}

/**
 * Format status icon
 * @param {string} status - Status value
 * @returns {string} Formatted icon
 */
function statusIcon(status) {
  switch (status) {
    case 'pass': return `${colors.green}✓${colors.reset}`;
    case 'warn': return `${colors.yellow}⚠${colors.reset}`;
    case 'fail': return `${colors.red}✗${colors.reset}`;
    default: return `${colors.dim}?${colors.reset}`;
  }
}

/**
 * Format count with color
 * @param {number} count - Count value
 * @param {string} type - 'error' or 'warning'
 * @returns {string} Formatted count
 */
function formatCount(count, type) {
  if (count === 0) {
    return `${colors.green}0${colors.reset}`;
  }
  if (count === -1) {
    return `${colors.dim}?${colors.reset}`;
  }
  const color = type === 'error' ? colors.red : colors.yellow;
  return `${color}${count}${colors.reset}`;
}

/**
 * Print a row in the dashboard box
 * @param {string} content - Content to display (may contain ANSI codes)
 * @param {number} boxWidth - Width of the box interior
 */
function printRow(content, boxWidth) {
  const contentWidth = visibleWidth(content);
  const padding = Math.max(0, boxWidth - contentWidth);
  console.log(`${colors.cyan}║${colors.reset}${content}${' '.repeat(padding)}${colors.cyan}║${colors.reset}`);
}

/**
 * Print the health dashboard
 * @param {object[]} results - Check results
 */
function printDashboard(results) {
  const boxWidth = 60;
  const innerWidth = boxWidth; // Content area width

  console.log('');
  console.log(`${colors.bold}${colors.cyan}╔${'═'.repeat(boxWidth)}╗${colors.reset}`);

  // Title row
  const title = `  ${colors.bold}Project Health Report${colors.reset}`;
  printRow(title, innerWidth);

  console.log(`${colors.bold}${colors.cyan}╠${'═'.repeat(boxWidth)}╣${colors.reset}`);

  // Summary counts
  const passCount = results.filter(r => r.status === 'pass').length;
  const warnCount = results.filter(r => r.status === 'warn').length;
  const failCount = results.filter(r => r.status === 'fail').length;

  const summary = `  ${colors.green}✓ ${passCount} passed${colors.reset}  ${colors.yellow}⚠ ${warnCount} warnings${colors.reset}  ${colors.red}✗ ${failCount} failed${colors.reset}`;
  printRow(summary, innerWidth);

  console.log(`${colors.cyan}╠${'─'.repeat(boxWidth)}╣${colors.reset}`);

  // Individual results
  for (const result of results) {
    const icon = statusIcon(result.status);
    const name = result.name;
    let details = '';

    if (result.fileCount !== undefined) {
      details += `${result.fileCount} files`;
    }
    if (result.errorCount > 0) {
      details += details ? ', ' : '';
      details += `${formatCount(result.errorCount, 'error')} errors`;
    }
    if (result.warningCount > 0) {
      details += details ? ', ' : '';
      details += `${formatCount(result.warningCount, 'warning')} warnings`;
    }
    if (result.details) {
      if (result.details.passed !== undefined) {
        details = `${result.details.passed} passed, ${result.details.failed} failed`;
      }
      if (result.details.vulnerabilities !== undefined) {
        details = result.details.vulnerabilities === 0 ? 'No vulnerabilities' : `${result.details.vulnerabilities} vulnerabilities`;
      }
      if (result.details.modernRatio !== undefined) {
        details += ` (${result.details.modernRatio} modern formats)`;
      }
    }

    // Build the row: "  icon name    details"
    // Fixed widths: 2 spaces, 1 icon, 1 space, 12 chars name = 16 chars before details
    const nameField = padEnd(name, 12);
    const row = `  ${icon} ${nameField}${details}`;
    printRow(row, innerWidth);
  }

  console.log(`${colors.cyan}╚${'═'.repeat(boxWidth)}╝${colors.reset}`);
  console.log('');

  // Overall status
  if (failCount > 0) {
    console.log(`${colors.red}${colors.bold}Overall: NEEDS ATTENTION${colors.reset}`);
    console.log(`${colors.dim}Run 'npm run lint:all' for detailed error output${colors.reset}`);
  } else if (warnCount > 0) {
    console.log(`${colors.yellow}${colors.bold}Overall: GOOD (with warnings)${colors.reset}`);
  } else {
    console.log(`${colors.green}${colors.bold}Overall: HEALTHY${colors.reset}`);
  }
  console.log('');
}

/**
 * Main entry point
 */
async function main() {
  if (!quietMode && !jsonOutput) {
    console.log(`${colors.dim}Running health checks...${colors.reset}`);
  }

  // Run all checks
  const results = [];

  if (!quietMode && !jsonOutput) {
    process.stdout.write(`${colors.dim}  Checking HTML...${colors.reset}`);
  }
  results.push(checkHtml());
  if (!quietMode && !jsonOutput) {
    process.stdout.write(`\r${' '.repeat(30)}\r`);
    process.stdout.write(`${colors.dim}  Checking CSS...${colors.reset}`);
  }

  results.push(checkCss());
  if (!quietMode && !jsonOutput) {
    process.stdout.write(`\r${' '.repeat(30)}\r`);
    process.stdout.write(`${colors.dim}  Checking JavaScript...${colors.reset}`);
  }

  results.push(checkJavaScript());
  if (!quietMode && !jsonOutput) {
    process.stdout.write(`\r${' '.repeat(30)}\r`);
    process.stdout.write(`${colors.dim}  Checking Images...${colors.reset}`);
  }

  results.push(checkImages());
  if (!quietMode && !jsonOutput) {
    process.stdout.write(`\r${' '.repeat(30)}\r`);
    process.stdout.write(`${colors.dim}  Checking Spelling...${colors.reset}`);
  }

  results.push(checkSpelling());
  if (!quietMode && !jsonOutput) {
    process.stdout.write(`\r${' '.repeat(30)}\r`);
    process.stdout.write(`${colors.dim}  Checking Links...${colors.reset}`);
  }

  results.push(checkLinks());
  if (!quietMode && !jsonOutput) {
    process.stdout.write(`\r${' '.repeat(30)}\r`);
    process.stdout.write(`${colors.dim}  Checking Security...${colors.reset}`);
  }

  results.push(checkSecurity());
  if (!quietMode && !jsonOutput) {
    process.stdout.write(`\r${' '.repeat(30)}\r`);
    process.stdout.write(`${colors.dim}  Running Tests...${colors.reset}`);
  }

  results.push(checkTests());
  if (!quietMode && !jsonOutput) {
    process.stdout.write(`\r${' '.repeat(30)}\r`);
  }

  // Output results
  if (jsonOutput) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    printDashboard(results);
  }

  // Exit with appropriate code
  const hasFailures = results.some(r => r.status === 'fail');
  process.exit(hasFailures ? 1 : 0);
}

main();
