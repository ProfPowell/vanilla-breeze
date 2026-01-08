#!/usr/bin/env node

/**
 * Resource Budget Checker
 *
 * Enforces size limits on page resources to ensure performance.
 *
 * Checks:
 * - Total page weight (target: < 500KB)
 * - Critical CSS (target: < 14KB)
 * - JavaScript per page (target: < 100KB)
 * - Image count per page
 * - Font file sizes
 *
 * @example
 * node scripts/resource-budget.js [files...]
 * node scripts/resource-budget.js examples/pages/
 * npm run lint:budget
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, relative, dirname, extname } from 'path';

/** Terminal colors */
const colors = {
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  dim: '\x1b[2m',
};

/** Resource budget thresholds */
const BUDGETS = {
  totalPageWeight: 500 * 1024, // 500KB
  criticalCSS: 14 * 1024, // 14KB for inline CSS
  jsPerPage: 100 * 1024, // 100KB total JS
  maxImages: 20, // Max images per page
  fontFile: 100 * 1024, // 100KB per font file
  cssFile: 50 * 1024, // 50KB per CSS file
  warnThreshold: 0.8, // Warn at 80% of budget
};

/**
 * Format bytes to human readable string
 * @param {number} bytes - Number of bytes
 * @returns {string} Formatted string
 */
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
}

/**
 * Calculate percentage of budget used
 * @param {number} actual - Actual size
 * @param {number} budget - Budget limit
 * @returns {number} Percentage
 */
function percentOfBudget(actual, budget) {
  return (actual / budget) * 100;
}

/**
 * Find HTML files recursively in a directory
 * @param {string} dir - Directory to search
 * @param {string[]} files - Accumulated files
 * @returns {string[]} Array of file paths
 */
function findHtmlFiles(dir, files = []) {
  try {
    const entries = readdirSync(dir);

    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        if (entry === 'node_modules' || entry === '.git' || entry === '.beads') {
          continue;
        }
        if (fullPath.includes('test/fixtures/invalid')) {
          continue;
        }
        findHtmlFiles(fullPath, files);
      } else if (entry.endsWith('.html')) {
        files.push(fullPath);
      }
    }
  } catch (err) {
    // Directory doesn't exist or can't be read
  }

  return files;
}

/**
 * Extract resource URLs from HTML
 * @param {string} html - Raw HTML content
 * @returns {object} Categorized resource URLs
 */
function extractResources(html) {
  const resources = {
    styles: [],
    scripts: [],
    images: [],
    fonts: [],
    inlineCSS: '',
    inlineJS: '',
  };

  // Extract link[rel="stylesheet"]
  const stylesheetRegex = /<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = stylesheetRegex.exec(html)) !== null) {
    resources.styles.push(match[1]);
  }

  // Alternative: href before rel
  const stylesheetRegex2 = /<link[^>]*href=["']([^"']+)["'][^>]*rel=["']stylesheet["'][^>]*>/gi;
  while ((match = stylesheetRegex2.exec(html)) !== null) {
    resources.styles.push(match[1]);
  }

  // Extract script[src]
  const scriptRegex = /<script[^>]*src=["']([^"']+)["'][^>]*>/gi;
  while ((match = scriptRegex.exec(html)) !== null) {
    resources.scripts.push(match[1]);
  }

  // Extract inline style tags
  const inlineStyleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  while ((match = inlineStyleRegex.exec(html)) !== null) {
    resources.inlineCSS += match[1] + '\n';
  }

  // Extract inline script tags
  const inlineScriptRegex = /<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi;
  while ((match = inlineScriptRegex.exec(html)) !== null) {
    resources.inlineJS += match[1] + '\n';
  }

  // Extract img[src]
  const imgRegex = /<img[^>]*src=["']([^"']+)["'][^>]*>/gi;
  while ((match = imgRegex.exec(html)) !== null) {
    resources.images.push(match[1]);
  }

  // Extract picture > source[srcset]
  const pictureSourceRegex = /<source[^>]*srcset=["']([^"']+)["'][^>]*>/gi;
  while ((match = pictureSourceRegex.exec(html)) !== null) {
    // srcset can have multiple URLs, extract first one
    const firstUrl = match[1].split(',')[0].trim().split(/\s+/)[0];
    if (firstUrl) {
      resources.images.push(firstUrl);
    }
  }

  // Extract font files from CSS @font-face
  const fontRegex = /@font-face[^}]*url\(["']?([^"')]+\.(?:woff2?|ttf|otf|eot))["']?\)/gi;
  while ((match = fontRegex.exec(resources.inlineCSS)) !== null) {
    resources.fonts.push(match[1]);
  }

  return resources;
}

/**
 * Resolve relative URL to absolute file path
 * @param {string} url - Resource URL
 * @param {string} htmlPath - Path to HTML file
 * @returns {string|null} Absolute file path or null
 */
function resolveResourcePath(url, htmlPath) {
  // Skip external URLs
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) {
    return null;
  }

  // Skip data URIs
  if (url.startsWith('data:')) {
    return null;
  }

  // Skip protocol-relative or absolute URLs
  if (url.startsWith('/')) {
    // Could be resolved from project root, but for now skip
    return null;
  }

  // Remove query strings and fragments
  const cleanUrl = url.split('?')[0].split('#')[0];

  // Resolve relative to HTML file directory
  const htmlDir = dirname(htmlPath);
  const resolved = join(htmlDir, cleanUrl);

  return resolved;
}

/**
 * Get file size safely
 * @param {string} filePath - Path to file
 * @returns {number} File size in bytes, or 0 if not found
 */
function getFileSize(filePath) {
  try {
    if (existsSync(filePath)) {
      const stats = statSync(filePath);
      return stats.size;
    }
  } catch {
    // File not accessible
  }
  return 0;
}

/**
 * Analyze resource budget for a single HTML file
 * @param {string} filePath - Path to HTML file
 * @returns {object} Analysis results
 */
function analyzePage(filePath) {
  const html = readFileSync(filePath, 'utf8');
  const resources = extractResources(html);

  const errors = [];
  const warnings = [];
  const info = [];

  // Track total page weight
  let totalWeight = 0;
  let jsWeight = 0;
  let cssWeight = 0;
  let imageWeight = 0;
  let fontWeight = 0;

  // Add HTML file size
  const htmlSize = getFileSize(filePath);
  totalWeight += htmlSize;
  info.push(`HTML: ${formatBytes(htmlSize)}`);

  // Check inline CSS size (critical CSS)
  const inlineCSSSize = Buffer.from(resources.inlineCSS).length;
  if (inlineCSSSize > 0) {
    totalWeight += inlineCSSSize;
    cssWeight += inlineCSSSize;

    if (inlineCSSSize > BUDGETS.criticalCSS) {
      errors.push(
        `Inline CSS ${formatBytes(inlineCSSSize)} exceeds critical CSS budget of ${formatBytes(BUDGETS.criticalCSS)}`
      );
    } else if (inlineCSSSize > BUDGETS.criticalCSS * BUDGETS.warnThreshold) {
      warnings.push(
        `Inline CSS ${formatBytes(inlineCSSSize)} is ${percentOfBudget(inlineCSSSize, BUDGETS.criticalCSS).toFixed(0)}% of critical CSS budget`
      );
    }
    info.push(`Inline CSS: ${formatBytes(inlineCSSSize)}`);
  }

  // Check inline JS size
  const inlineJSSize = Buffer.from(resources.inlineJS).length;
  if (inlineJSSize > 0) {
    totalWeight += inlineJSSize;
    jsWeight += inlineJSSize;
    info.push(`Inline JS: ${formatBytes(inlineJSSize)}`);
  }

  // Check external CSS files
  for (const cssUrl of resources.styles) {
    const cssPath = resolveResourcePath(cssUrl, filePath);
    if (cssPath) {
      const size = getFileSize(cssPath);
      if (size > 0) {
        totalWeight += size;
        cssWeight += size;

        if (size > BUDGETS.cssFile) {
          warnings.push(
            `CSS file ${relative(process.cwd(), cssPath)} (${formatBytes(size)}) exceeds ${formatBytes(BUDGETS.cssFile)} recommendation`
          );
        }
      }
    }
  }

  if (cssWeight > 0) {
    info.push(`Total CSS: ${formatBytes(cssWeight)}`);
  }

  // Check external JS files
  for (const jsUrl of resources.scripts) {
    const jsPath = resolveResourcePath(jsUrl, filePath);
    if (jsPath) {
      const size = getFileSize(jsPath);
      if (size > 0) {
        totalWeight += size;
        jsWeight += size;
      }
    }
  }

  if (jsWeight > 0) {
    if (jsWeight > BUDGETS.jsPerPage) {
      errors.push(
        `Total JavaScript ${formatBytes(jsWeight)} exceeds budget of ${formatBytes(BUDGETS.jsPerPage)}`
      );
    } else if (jsWeight > BUDGETS.jsPerPage * BUDGETS.warnThreshold) {
      warnings.push(
        `Total JavaScript ${formatBytes(jsWeight)} is ${percentOfBudget(jsWeight, BUDGETS.jsPerPage).toFixed(0)}% of budget`
      );
    }
    info.push(`Total JS: ${formatBytes(jsWeight)}`);
  }

  // Check image count and sizes
  const uniqueImages = [...new Set(resources.images)];
  if (uniqueImages.length > BUDGETS.maxImages) {
    warnings.push(
      `${uniqueImages.length} images exceed recommended maximum of ${BUDGETS.maxImages} per page`
    );
  }

  for (const imgUrl of uniqueImages) {
    const imgPath = resolveResourcePath(imgUrl, filePath);
    if (imgPath) {
      const size = getFileSize(imgPath);
      if (size > 0) {
        totalWeight += size;
        imageWeight += size;
      }
    }
  }

  if (imageWeight > 0) {
    info.push(`Images: ${uniqueImages.length} files, ${formatBytes(imageWeight)}`);
  } else if (uniqueImages.length > 0) {
    info.push(`Images: ${uniqueImages.length} files (external or not found)`);
  }

  // Check font files
  for (const fontUrl of resources.fonts) {
    const fontPath = resolveResourcePath(fontUrl, filePath);
    if (fontPath) {
      const size = getFileSize(fontPath);
      if (size > 0) {
        totalWeight += size;
        fontWeight += size;

        if (size > BUDGETS.fontFile) {
          warnings.push(
            `Font file ${relative(process.cwd(), fontPath)} (${formatBytes(size)}) exceeds ${formatBytes(BUDGETS.fontFile)} recommendation`
          );
        }
      }
    }
  }

  if (fontWeight > 0) {
    info.push(`Fonts: ${formatBytes(fontWeight)}`);
  }

  // Check total page weight
  if (totalWeight > BUDGETS.totalPageWeight) {
    errors.push(
      `Total page weight ${formatBytes(totalWeight)} exceeds budget of ${formatBytes(BUDGETS.totalPageWeight)}`
    );
  } else if (totalWeight > BUDGETS.totalPageWeight * BUDGETS.warnThreshold) {
    warnings.push(
      `Total page weight ${formatBytes(totalWeight)} is ${percentOfBudget(totalWeight, BUDGETS.totalPageWeight).toFixed(0)}% of budget`
    );
  }

  info.push(`Total page weight: ${formatBytes(totalWeight)}`);

  return {
    file: relative(process.cwd(), filePath),
    totalWeight,
    jsWeight,
    cssWeight,
    imageWeight,
    fontWeight,
    imageCount: uniqueImages.length,
    errors,
    warnings,
    info,
    passed: errors.length === 0,
  };
}

/**
 * Print analysis results
 * @param {object[]} results - Analysis results
 * @returns {number} Number of files with errors
 */
function printResults(results) {
  console.log(`${colors.cyan}=== Resource Budget Analysis ===${colors.reset}\n`);

  const passed = results.filter(r => r.passed);
  const failed = results.filter(r => !r.passed);

  if (failed.length > 0) {
    console.log(`${colors.red}Pages exceeding budgets:${colors.reset}`);
    for (const r of failed) {
      console.log(`\n${colors.dim}─────────────────────────────────────────${colors.reset}`);
      console.log(`${r.file}`);

      for (const error of r.errors) {
        console.log(`  ${colors.red}✗ ERROR:${colors.reset} ${error}`);
      }

      for (const warning of r.warnings) {
        console.log(`  ${colors.yellow}⚠ WARN:${colors.reset} ${warning}`);
      }

      for (const i of r.info) {
        console.log(`  ${colors.dim}ℹ ${i}${colors.reset}`);
      }
    }
    console.log('');
  }

  if (passed.length > 0) {
    console.log(`${colors.green}Pages within budget:${colors.reset}`);
    for (const r of passed) {
      const warningCount = r.warnings.length;
      const warningNote = warningCount > 0 ? ` ${colors.yellow}(${warningCount} warnings)${colors.reset}` : '';
      console.log(`  ${colors.green}✓${colors.reset} ${r.file} - ${formatBytes(r.totalWeight)}${warningNote}`);

      if (warningCount > 0) {
        for (const warning of r.warnings) {
          console.log(`    ${colors.yellow}⚠${colors.reset} ${warning}`);
        }
      }
    }
    console.log('');
  }

  console.log(`${colors.dim}─────────────────────────────────────────${colors.reset}`);
  console.log(`Total: ${results.length} pages, ${colors.green}${passed.length} passed${colors.reset}, ${colors.red}${failed.length} failed${colors.reset}`);
  console.log('');

  console.log(`${colors.dim}Resource Budgets:${colors.reset}`);
  console.log(`  Total page weight: ${formatBytes(BUDGETS.totalPageWeight)}`);
  console.log(`  Critical CSS (inline): ${formatBytes(BUDGETS.criticalCSS)}`);
  console.log(`  JavaScript per page: ${formatBytes(BUDGETS.jsPerPage)}`);
  console.log(`  Images per page: ${BUDGETS.maxImages} max`);
  console.log(`  Font file size: ${formatBytes(BUDGETS.fontFile)}`);
  console.log(`  CSS file size: ${formatBytes(BUDGETS.cssFile)}`);

  return failed.length;
}

/**
 * Main entry point
 */
function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
${colors.cyan}Resource Budget Checker${colors.reset}

Usage:
  node scripts/resource-budget.js [options] [files...]

Options:
  --help, -h    Show this help

Examples:
  node scripts/resource-budget.js examples/pages/
  node scripts/resource-budget.js examples/pages/homepage/index.html
  npm run lint:budget

Budgets:
  Total page weight: ${formatBytes(BUDGETS.totalPageWeight)}
  Critical CSS: ${formatBytes(BUDGETS.criticalCSS)}
  JavaScript per page: ${formatBytes(BUDGETS.jsPerPage)}
  Images per page: ${BUDGETS.maxImages} max
  Font file: ${formatBytes(BUDGETS.fontFile)}
  CSS file: ${formatBytes(BUDGETS.cssFile)}
`);
    process.exit(0);
  }

  let files = [];

  const paths = args.filter(arg => !arg.startsWith('-'));

  if (paths.length === 0) {
    const defaultDirs = ['examples'];
    for (const dir of defaultDirs) {
      try {
        files = files.concat(findHtmlFiles(dir));
      } catch {
        // Directory doesn't exist
      }
    }
  } else {
    for (const arg of paths) {
      try {
        const stat = statSync(arg);
        if (stat.isDirectory()) {
          files = files.concat(findHtmlFiles(arg));
        } else if (arg.endsWith('.html')) {
          files.push(arg);
        }
      } catch {
        console.error(`${colors.yellow}Warning: Could not access ${arg}${colors.reset}`);
      }
    }
  }

  if (files.length === 0) {
    console.log('No HTML files found to analyze.');
    process.exit(0);
  }

  const results = files.map(f => analyzePage(f));
  const failedCount = printResults(results);

  if (failedCount > 0) {
    process.exit(1);
  }
}

main();
