#!/usr/bin/env node

/**
 * Dark Mode Token Validator
 *
 * Validates that CSS design tokens have corresponding dark mode overrides.
 * Checks for tokens defined in :root that should be redefined in dark mode
 * contexts (prefers-color-scheme: dark or theme toggle selectors).
 *
 * @example
 * node scripts/dark-mode-check.js [directory]
 * node scripts/dark-mode-check.js src/styles/
 * npm run lint:darkmode
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
  bold: '\x1b[1m',
};

/**
 * Token categories that need dark mode overrides
 * These tokens typically change between light and dark themes
 */
const THEMEABLE_PATTERNS = [
  // Surface and background colors
  /^--background/,
  /^--surface/,
  /^--bg-/,

  // Text colors
  /^--text-color/,
  /^--text-muted/,
  /^--text-/,

  // Border colors
  /^--border-color/,
  /^--border-/,

  // Overlay colors
  /^--overlay/,

  // Shadows (often need adjustment for dark mode)
  /^--shadow/,

  // Card/component backgrounds
  /^--card-bg/,
  /^--card-shadow/,
  /^--input-bg/,
  /^--input-border/,
  /^--modal-bg/,
  /^--dropdown-bg/,
  /^--tooltip-bg/,

  // Link colors (sometimes themed)
  /^--link-color/,

  // Focus/outline colors
  /^--focus-ring/,
  /^--outline-color/,
];

/**
 * Token patterns that do NOT need dark mode overrides
 * These remain constant across themes
 */
const NON_THEMEABLE_PATTERNS = [
  // Spacing is the same in both themes
  /^--spacing/,
  /^--gap/,
  /^--padding/,
  /^--margin/,

  // Typography doesn't change
  /^--font-/,
  /^--line-height/,
  /^--letter-spacing/,

  // Layout constants
  /^--content-width/,
  /^--sidebar-width/,
  /^--header-height/,
  /^--z-/,

  // Border radius stays the same
  /^--radius/,
  /^--border-radius/,

  // Transitions and animations
  /^--transition/,
  /^--duration/,
  /^--animation/,

  // Breakpoints (documentation only)
  /^--breakpoint/,

  // Primary/semantic colors (typically consistent)
  /^--primary-color$/,
  /^--primary-hover$/,
  /^--secondary-color$/,
  /^--success-color$/,
  /^--warning-color$/,
  /^--error-color$/,
  /^--info-color$/,

  // Inverted text (already for dark surfaces)
  /^--text-inverted/,
];

/**
 * Dark mode context patterns
 * Selectors that indicate dark mode overrides
 */
const DARK_MODE_CONTEXTS = [
  /@media\s*\(\s*prefers-color-scheme\s*:\s*dark\s*\)/,
  /:root:has\([^)]*theme-dark[^)]*:checked\)/,
  /:root\[data-theme\s*=\s*["']?dark["']?\]/,
  /\.dark\s*\{/,
  /\[data-theme\s*=\s*["']?dark["']?\]/,
  /\.theme-dark/,
];

/**
 * Extract CSS custom property definitions from a CSS block
 * @param {string} css - CSS content
 * @returns {string[]} Array of property names
 */
function extractTokens(css) {
  const tokens = new Set();
  const propertyRegex = /(--[\w-]+)\s*:/g;
  let match;

  while ((match = propertyRegex.exec(css)) !== null) {
    tokens.add(match[1]);
  }

  return Array.from(tokens);
}

/**
 * Extract tokens from :root context (light theme)
 * @param {string} css - CSS content
 * @returns {string[]} Array of token names
 */
function extractRootTokens(css) {
  const tokens = new Set();

  // Match :root { ... } blocks (not inside dark mode contexts)
  const rootBlockRegex = /:root\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g;
  let match;

  while ((match = rootBlockRegex.exec(css)) !== null) {
    // Check if this :root block is inside a dark mode context
    const beforeMatch = css.substring(0, match.index);
    const isInDarkContext = DARK_MODE_CONTEXTS.some(pattern => {
      const contextMatch = beforeMatch.match(pattern);
      if (!contextMatch) return false;
      // Simple heuristic: if dark context is within 200 chars before, it's likely containing this
      return beforeMatch.length - beforeMatch.lastIndexOf(contextMatch[0]) < 200;
    });

    // Also check for :has in the :root selector itself
    const selectorPart = css.substring(Math.max(0, match.index - 100), match.index + 5);
    const hasDarkToggle = /:root:has\([^)]*dark[^)]*\)/.test(selectorPart);

    if (!isInDarkContext && !hasDarkToggle) {
      const blockContent = match[1];
      extractTokens(blockContent).forEach(token => tokens.add(token));
    }
  }

  return Array.from(tokens);
}

/**
 * Extract tokens from dark mode contexts
 * @param {string} css - CSS content
 * @returns {string[]} Array of token names
 */
function extractDarkModeTokens(css) {
  const tokens = new Set();

  // Find all dark mode contexts and extract tokens
  DARK_MODE_CONTEXTS.forEach(pattern => {
    // Find positions of dark mode contexts
    let searchCss = css;
    let offset = 0;

    while (true) {
      const match = searchCss.match(pattern);
      if (!match) break;

      const contextStart = match.index + offset;
      const afterContext = css.substring(contextStart);

      // Find the corresponding block
      let braceCount = 0;
      let inBlock = false;
      let blockContent = '';

      for (let i = 0; i < afterContext.length; i++) {
        if (afterContext[i] === '{') {
          braceCount++;
          inBlock = true;
        } else if (afterContext[i] === '}') {
          braceCount--;
          if (braceCount === 0 && inBlock) {
            blockContent = afterContext.substring(0, i + 1);
            break;
          }
        }
      }

      extractTokens(blockContent).forEach(token => tokens.add(token));

      offset = contextStart + match[0].length;
      searchCss = css.substring(offset);
    }
  });

  return Array.from(tokens);
}

/**
 * Check if a token is themeable (needs dark mode variant)
 * @param {string} token - Token name
 * @returns {boolean}
 */
function isThemeable(token) {
  // First check if explicitly non-themeable
  if (NON_THEMEABLE_PATTERNS.some(pattern => pattern.test(token))) {
    return false;
  }

  // Then check if matches themeable patterns
  return THEMEABLE_PATTERNS.some(pattern => pattern.test(token));
}

/**
 * Categorize a token
 * @param {string} token - Token name
 * @returns {string} Category name
 */
function categorizeToken(token) {
  if (/^--background|^--surface|^--bg-/.test(token)) return 'surfaces';
  if (/^--text/.test(token)) return 'text';
  if (/^--border/.test(token)) return 'borders';
  if (/^--overlay/.test(token)) return 'overlays';
  if (/^--shadow/.test(token)) return 'shadows';
  if (/^--card|^--input|^--modal|^--dropdown|^--tooltip/.test(token)) return 'components';
  if (/^--link|^--focus|^--outline/.test(token)) return 'interactive';
  return 'other';
}

/**
 * Find all CSS files in a directory
 * @param {string} dir - Directory path
 * @returns {string[]} Array of file paths
 */
function findCssFiles(dir) {
  const files = [];

  function walk(currentDir) {
    try {
      const entries = readdirSync(currentDir);
      for (const entry of entries) {
        const fullPath = join(currentDir, entry);
        const stat = statSync(fullPath);

        if (stat.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules') {
          walk(fullPath);
        } else if (entry.endsWith('.css') && !entry.startsWith('.')) {
          files.push(fullPath);
        }
      }
    } catch {
      // Ignore permission errors
    }
  }

  walk(dir);
  return files;
}

/**
 * Analyze CSS files for dark mode token coverage
 * @param {string[]} files - Array of file paths
 * @returns {object} Analysis results
 */
function analyzeFiles(files) {
  let allCss = '';
  const fileContents = {};

  // Read all CSS files
  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf8');
      allCss += content + '\n';
      fileContents[file] = content;
    } catch {
      // Ignore read errors
    }
  }

  // Extract tokens
  const rootTokens = extractRootTokens(allCss);
  const darkTokens = extractDarkModeTokens(allCss);

  // Find themeable tokens
  const themeableTokens = rootTokens.filter(isThemeable);

  // Find missing dark mode overrides
  const darkTokenSet = new Set(darkTokens);
  const missingTokens = themeableTokens.filter(token => !darkTokenSet.has(token));
  const coveredTokens = themeableTokens.filter(token => darkTokenSet.has(token));

  // Categorize missing tokens
  const missingByCategory = {};
  for (const token of missingTokens) {
    const category = categorizeToken(token);
    if (!missingByCategory[category]) {
      missingByCategory[category] = [];
    }
    missingByCategory[category].push(token);
  }

  // Check for dark mode context existence
  const hasDarkModeContext = DARK_MODE_CONTEXTS.some(pattern => pattern.test(allCss));

  return {
    totalRootTokens: rootTokens.length,
    themeableCount: themeableTokens.length,
    coveredCount: coveredTokens.length,
    missingCount: missingTokens.length,
    missingTokens,
    missingByCategory,
    coveredTokens,
    hasDarkModeContext,
    darkTokens,
  };
}

/**
 * Print analysis results
 * @param {object} results - Analysis results
 * @param {boolean} verbose - Show detailed output
 */
function printResults(results, verbose) {
  console.log(`${colors.cyan}=== Dark Mode Token Validator ===${colors.reset}\n`);

  // Summary stats
  console.log(`${colors.bold}Token Analysis:${colors.reset}`);
  console.log(`  Total :root tokens:    ${results.totalRootTokens}`);
  console.log(`  Themeable tokens:      ${results.themeableCount}`);
  console.log(`  With dark override:    ${colors.green}${results.coveredCount}${colors.reset}`);
  console.log(`  Missing dark override: ${results.missingCount > 0 ? colors.yellow : colors.green}${results.missingCount}${colors.reset}`);

  // Coverage percentage
  const coverage = results.themeableCount > 0
    ? Math.round((results.coveredCount / results.themeableCount) * 100)
    : 100;

  const coverageColor = coverage === 100 ? colors.green : coverage >= 80 ? colors.yellow : colors.red;
  console.log(`\n  ${colors.bold}Dark mode coverage: ${coverageColor}${coverage}%${colors.reset}`);

  // Dark mode context check
  if (!results.hasDarkModeContext) {
    console.log(`\n${colors.yellow}⚠ No dark mode context found${colors.reset}`);
    console.log(`${colors.dim}  Add @media (prefers-color-scheme: dark) or theme toggle support${colors.reset}`);
  }

  // Missing tokens by category
  if (results.missingCount > 0) {
    console.log(`\n${colors.bold}Missing Dark Mode Overrides:${colors.reset}`);

    const categoryOrder = ['surfaces', 'text', 'borders', 'overlays', 'shadows', 'components', 'interactive', 'other'];

    for (const category of categoryOrder) {
      const tokens = results.missingByCategory[category];
      if (tokens && tokens.length > 0) {
        console.log(`\n  ${colors.cyan}${category}${colors.reset} (${tokens.length})`);
        for (const token of tokens) {
          console.log(`    ${colors.yellow}⚠${colors.reset} ${token}`);
        }
      }
    }
  }

  // Verbose: show covered tokens
  if (verbose && results.coveredCount > 0) {
    console.log(`\n${colors.bold}Tokens with Dark Mode Override:${colors.reset}`);
    for (const token of results.coveredTokens) {
      console.log(`  ${colors.green}✓${colors.reset} ${token}`);
    }
  }

  // Suggestions
  if (results.missingCount > 0) {
    console.log(`\n${colors.dim}─────────────────────────────────────${colors.reset}`);
    console.log(`${colors.bold}Suggested Fix:${colors.reset}`);
    console.log(`${colors.dim}Add overrides in your CSS:${colors.reset}\n`);
    console.log(`${colors.cyan}@media (prefers-color-scheme: dark) {`);
    console.log(`  :root {`);

    // Show a few examples
    const examples = results.missingTokens.slice(0, 5);
    for (const token of examples) {
      console.log(`    ${token}: /* dark value */;`);
    }
    if (results.missingTokens.length > 5) {
      console.log(`    /* ... ${results.missingTokens.length - 5} more tokens */`);
    }

    console.log(`  }`);
    console.log(`}${colors.reset}`);
  }

  return results.missingCount > 0 ? 1 : 0;
}

/**
 * Show help
 */
function showHelp() {
  console.log(`
${colors.cyan}Dark Mode Token Validator${colors.reset}

Validates that CSS design tokens have corresponding dark mode overrides.

${colors.bold}Usage:${colors.reset}
  node scripts/dark-mode-check.js [options] [directory]

${colors.bold}Options:${colors.reset}
  --help, -h     Show this help
  --verbose, -v  Show all tokens including covered ones
  --strict       Exit with error if any tokens missing

${colors.bold}What it checks:${colors.reset}

  Tokens that SHOULD have dark mode variants:
    --background-*, --surface-*, --bg-*
    --text-color, --text-muted, --text-*
    --border-color, --border-*
    --overlay-*, --shadow-*
    --card-bg, --input-bg, --modal-bg, etc.

  Tokens that DON'T need dark mode variants:
    --spacing-*, --font-*, --line-height-*
    --radius-*, --transition-*, --z-*
    --primary-color, --success-color, etc.

${colors.bold}Examples:${colors.reset}
  node scripts/dark-mode-check.js src/styles/
  node scripts/dark-mode-check.js --verbose
  npm run lint:darkmode
`);
}

/**
 * Main entry point
 */
function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  const verbose = args.includes('--verbose') || args.includes('-v');
  const strict = args.includes('--strict');
  const paths = args.filter(a => !a.startsWith('-'));
  const targetDir = paths[0] || 'src';

  // Find CSS files
  const cssFiles = findCssFiles(targetDir);

  if (cssFiles.length === 0) {
    console.log(`${colors.yellow}No CSS files found in ${targetDir}${colors.reset}`);
    console.log(`${colors.dim}Looking for *.css files...${colors.reset}`);

    // Try current directory
    const fallbackFiles = findCssFiles('.');
    if (fallbackFiles.length === 0) {
      console.log(`${colors.red}No CSS files found${colors.reset}`);
      process.exit(0);
    }

    console.log(`${colors.dim}Found ${fallbackFiles.length} CSS file(s) in current directory${colors.reset}\n`);
    const results = analyzeFiles(fallbackFiles);
    const exitCode = printResults(results, verbose);
    process.exit(strict ? exitCode : 0);
  }

  console.log(`${colors.dim}Analyzing ${cssFiles.length} CSS file(s) in ${targetDir}${colors.reset}\n`);

  const results = analyzeFiles(cssFiles);
  const exitCode = printResults(results, verbose);

  process.exit(strict ? exitCode : 0);
}

main();
