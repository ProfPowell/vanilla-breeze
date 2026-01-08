#!/usr/bin/env node

/**
 * Web Vitals Instrumentation Checker
 *
 * Analyzes HTML files to verify they include Core Web Vitals monitoring.
 *
 * Checks:
 * - Presence of web-vitals library import
 * - Initialization of web-vitals metrics (LCP, INP, CLS)
 * - Proper event reporting setup
 *
 * Core Web Vitals Thresholds (for documentation):
 * - LCP (Largest Contentful Paint) < 2.5s
 * - INP (Interaction to Next Paint) < 200ms
 * - CLS (Cumulative Layout Shift) < 0.1
 *
 * @example
 * node scripts/web-vitals-check.js [files...]
 * node scripts/web-vitals-check.js examples/pages/
 * npm run lint:vitals
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

/** Terminal colors */
const colors = {
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  dim: '\x1b[2m',
};

/** Core Web Vitals metrics we check for */
const CORE_VITALS = ['LCP', 'INP', 'CLS'];

/** Additional metrics that may be monitored */
const _OPTIONAL_VITALS = ['FCP', 'FID', 'TTFB'];

/**
 * Find HTML files recursively in a directory
 * @param {string} dir - Directory to search
 * @param {string[]} files - Accumulated files
 * @returns {string[]} Array of file paths
 */
function findHtmlFiles(dir, files = []) {
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

  return files;
}

/**
 * Check if HTML contains web-vitals library import
 * @param {string} html - Raw HTML content
 * @returns {boolean} True if web-vitals is imported
 */
function hasWebVitalsImport(html) {
  // Check for local import patterns (no CDN/network dependencies)
  const patterns = [
    // ES module import from npm package
    /import\s+.*from\s+['"]web-vitals['"]/i,
    // Dynamic import from npm package
    /import\s*\(['"]\s*web-vitals\s*['"]\)/i,
    // Local script reference (bundled or copied)
    /<script[^>]*src=["'][^"']*\/web-vitals[^"']*["']/i,
  ];

  return patterns.some(pattern => pattern.test(html));
}

/**
 * Check if HTML contains web-vitals metric initialization
 * @param {string} html - Raw HTML content
 * @returns {{found: string[], missing: string[]}} Found and missing metrics
 */
function checkWebVitalsMetrics(html) {
  const found = [];
  const missing = [];

  for (const metric of CORE_VITALS) {
    // Check for onLCP, onINP, onCLS function calls
    const patterns = [
      new RegExp(`on${metric}\\s*\\(`, 'i'),
      new RegExp(`['"]${metric}['"]`, 'i'),
      new RegExp(`${metric.toLowerCase()}\\s*:`, 'i'),
    ];

    if (patterns.some(pattern => pattern.test(html))) {
      found.push(metric);
    } else {
      missing.push(metric);
    }
  }

  return { found, missing };
}

/**
 * Check if HTML contains any script tags (allows instrumentation)
 * @param {string} html - Raw HTML content
 * @returns {boolean} True if script tags present
 */
function hasScriptTags(html) {
  return /<script/i.test(html);
}

/**
 * Analyze a single HTML file
 * @param {string} filePath - Path to HTML file
 * @returns {object} Analysis results
 */
function analyzeFile(filePath) {
  const html = readFileSync(filePath, 'utf8');

  const hasImport = hasWebVitalsImport(html);
  const hasScripts = hasScriptTags(html);
  const metrics = checkWebVitalsMetrics(html);

  const errors = [];
  const warnings = [];
  const info = [];

  // If no scripts at all, this is likely a minimal HTML template
  if (!hasScripts) {
    info.push('No script tags found - minimal HTML template');
    return {
      file: relative(process.cwd(), filePath),
      skipped: true,
      reason: 'No JavaScript - minimal template',
      errors,
      warnings,
      info,
    };
  }

  // Check for web-vitals library import
  if (!hasImport) {
    errors.push('Missing web-vitals library import');
  } else {
    info.push('✓ web-vitals library imported');
  }

  // Check for metric initialization
  if (hasImport) {
    if (metrics.missing.length > 0) {
      warnings.push(`Missing Core Web Vitals metrics: ${metrics.missing.join(', ')}`);
    }

    if (metrics.found.length > 0) {
      info.push(`Monitoring: ${metrics.found.join(', ')}`);
    }
  }

  const passed = errors.length === 0;

  return {
    file: relative(process.cwd(), filePath),
    skipped: false,
    hasImport,
    metricsFound: metrics.found,
    metricsMissing: metrics.missing,
    errors,
    warnings,
    info,
    passed,
  };
}

/**
 * Generate instrumentation snippet for HTML files
 * @returns {string} Code snippet to add to HTML
 */
function getInstrumentationSnippet() {
  return `
<!-- Web Vitals Monitoring -->
<!-- First: npm install web-vitals -->
<script type="module">
  // Import from local node_modules (requires bundler) or use importmap
  import { onLCP, onINP, onCLS } from 'web-vitals';

  function sendToAnalytics(metric) {
    // Send to your analytics endpoint
    console.log('[Web Vitals]', metric.name, metric.value);

    // Example: send to Google Analytics
    // gtag('event', metric.name, {
    //   value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
    //   metric_id: metric.id,
    //   metric_value: metric.value,
    //   metric_delta: metric.delta,
    // });
  }

  // Monitor Core Web Vitals
  onLCP(sendToAnalytics);  // Largest Contentful Paint (< 2.5s)
  onINP(sendToAnalytics);  // Interaction to Next Paint (< 200ms)
  onCLS(sendToAnalytics);  // Cumulative Layout Shift (< 0.1)
</script>
`.trim();
}

/**
 * Print analysis results
 * @param {object[]} results - Analysis results
 * @returns {number} Number of files with errors
 */
function printResults(results) {
  console.log(`${colors.cyan}=== Web Vitals Instrumentation Check ===${colors.reset}\n`);

  const analyzed = results.filter(r => !r.skipped);
  const skipped = results.filter(r => r.skipped);
  const passed = analyzed.filter(r => r.passed);
  const failed = analyzed.filter(r => !r.passed);

  // Print failed files first
  if (failed.length > 0) {
    console.log(`${colors.red}Files Missing Web Vitals Instrumentation:${colors.reset}`);
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

  // Print passed files
  if (passed.length > 0) {
    console.log(`${colors.green}Files with Web Vitals Monitoring:${colors.reset}`);
    for (const r of passed) {
      const warningCount = r.warnings.length;
      const warningNote = warningCount > 0 ? ` ${colors.yellow}(${warningCount} warnings)${colors.reset}` : '';
      console.log(`  ${colors.green}✓${colors.reset} ${r.file}${warningNote}`);

      if (warningCount > 0) {
        for (const warning of r.warnings) {
          console.log(`    ${colors.yellow}⚠${colors.reset} ${warning}`);
        }
      }

      // Show info for passed files too
      for (const i of r.info) {
        console.log(`    ${colors.dim}ℹ ${i}${colors.reset}`);
      }
    }
    console.log('');
  }

  // Print skipped files
  if (skipped.length > 0) {
    console.log(`${colors.dim}Skipped Files (no JavaScript):${colors.reset}`);
    for (const r of skipped) {
      console.log(`  ${colors.dim}○${colors.reset} ${r.file} - ${r.reason}`);
    }
    console.log('');
  }

  // Print summary
  console.log(`${colors.dim}─────────────────────────────────────────${colors.reset}`);
  console.log(`Total: ${results.length} files`);
  console.log(`  ${colors.green}Instrumented:${colors.reset} ${passed.length}`);
  console.log(`  ${colors.red}Missing:${colors.reset} ${failed.length}`);
  console.log(`  ${colors.dim}Skipped:${colors.reset} ${skipped.length}`);
  console.log('');

  // Print thresholds and snippet
  if (failed.length > 0) {
    console.log(`${colors.cyan}Core Web Vitals Thresholds:${colors.reset}`);
    console.log(`  ${colors.green}LCP${colors.reset} (Largest Contentful Paint):  < 2.5s`);
    console.log(`  ${colors.green}INP${colors.reset} (Interaction to Next Paint): < 200ms`);
    console.log(`  ${colors.green}CLS${colors.reset} (Cumulative Layout Shift):   < 0.1`);
    console.log('');

    console.log(`${colors.cyan}Add Web Vitals Monitoring:${colors.reset}`);
    console.log(colors.dim + getInstrumentationSnippet() + colors.reset);
    console.log('');
  }

  return failed.length;
}

/**
 * Main entry point
 */
function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
${colors.cyan}Web Vitals Instrumentation Checker${colors.reset}

Checks HTML files for Core Web Vitals monitoring instrumentation.

Usage:
  node scripts/web-vitals-check.js [options] [files...]

Options:
  --help, -h    Show this help
  --snippet     Show instrumentation snippet and exit

Examples:
  node scripts/web-vitals-check.js examples/pages/
  node scripts/web-vitals-check.js examples/pages/index.html
  node scripts/web-vitals-check.js --snippet
  npm run lint:vitals

Core Web Vitals:
  LCP (Largest Contentful Paint)  - Measures loading performance (< 2.5s)
  INP (Interaction to Next Paint) - Measures interactivity (< 200ms)
  CLS (Cumulative Layout Shift)   - Measures visual stability (< 0.1)

Resources:
  https://web.dev/vitals/
  https://github.com/GoogleChrome/web-vitals
`);
    process.exit(0);
  }

  if (args.includes('--snippet')) {
    console.log(getInstrumentationSnippet());
    process.exit(0);
  }

  let files = [];
  const paths = args.filter(arg => !arg.startsWith('-'));

  if (paths.length === 0) {
    // Default: analyze examples directory
    const defaultDirs = ['examples'];
    for (const dir of defaultDirs) {
      try {
        files = files.concat(findHtmlFiles(dir));
      } catch {
        // Directory doesn't exist
      }
    }
  } else {
    // Use provided paths
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

  // Analyze all files
  const results = files.map(f => analyzeFile(f));

  // Print results
  const failedCount = printResults(results);

  // Exit with error if any files failed
  if (failedCount > 0) {
    process.exit(1);
  }
}

main();
