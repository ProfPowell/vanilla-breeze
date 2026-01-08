#!/usr/bin/env node

/**
 * Web Font Validator
 *
 * Validates web font usage for performance and best practices:
 * - font-display property in @font-face
 * - Modern font formats (woff2 preferred)
 * - Preload hints for critical fonts
 * - Font loading patterns
 *
 * @example
 * node scripts/font-check.js [directory]
 * node scripts/font-check.js src/
 * npm run lint:fonts
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, relative, extname } from 'path';

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

/** Font format preferences (most preferred first) */
const FORMAT_PRIORITY = {
  'woff2': { priority: 1, modern: true, description: 'Best compression, wide support' },
  'woff': { priority: 2, modern: true, description: 'Good compression, legacy support' },
  'truetype': { priority: 3, modern: false, description: 'Legacy format, larger files' },
  'opentype': { priority: 3, modern: false, description: 'Legacy format' },
  'embedded-opentype': { priority: 4, modern: false, description: 'IE only, deprecated' },
  'svg': { priority: 5, modern: false, description: 'Deprecated, avoid' },
};

/** Valid font-display values */
const FONT_DISPLAY_VALUES = {
  'swap': { description: 'Show fallback immediately, swap when loaded (recommended for body text)' },
  'optional': { description: 'Show fallback, may not swap if slow (recommended for non-critical)' },
  'fallback': { description: 'Brief invisible period, then fallback' },
  'block': { description: 'Brief invisible period (FOIT risk)' },
  'auto': { description: 'Browser default (usually block)' },
};

/**
 * Extract @font-face declarations from CSS
 * @param {string} css - CSS content
 * @param {string} filePath - File path for error reporting
 * @returns {object[]} Array of font-face declarations
 */
function extractFontFaces(css, filePath) {
  const fontFaces = [];
  const fontFaceRegex = /@font-face\s*\{([^}]+)\}/gi;
  let match;

  while ((match = fontFaceRegex.exec(css)) !== null) {
    const block = match[1];
    const fontFace = {
      file: filePath,
      raw: match[0],
      properties: {},
    };

    // Extract font-family
    const familyMatch = block.match(/font-family\s*:\s*(['"]?)([^;'"]+)\1/i);
    if (familyMatch) {
      fontFace.properties.fontFamily = familyMatch[2].trim();
    }

    // Extract font-display
    const displayMatch = block.match(/font-display\s*:\s*(\w+)/i);
    if (displayMatch) {
      fontFace.properties.fontDisplay = displayMatch[1].toLowerCase();
    }

    // Extract src
    const srcMatch = block.match(/src\s*:\s*([^;]+)/i);
    if (srcMatch) {
      fontFace.properties.src = srcMatch[1].trim();
      fontFace.formats = extractFormats(srcMatch[1]);
    }

    // Extract font-weight
    const weightMatch = block.match(/font-weight\s*:\s*([^;]+)/i);
    if (weightMatch) {
      fontFace.properties.fontWeight = weightMatch[1].trim();
    }

    // Extract font-style
    const styleMatch = block.match(/font-style\s*:\s*(\w+)/i);
    if (styleMatch) {
      fontFace.properties.fontStyle = styleMatch[1].trim();
    }

    // Extract unicode-range
    const unicodeMatch = block.match(/unicode-range\s*:\s*([^;]+)/i);
    if (unicodeMatch) {
      fontFace.properties.unicodeRange = unicodeMatch[1].trim();
    }

    fontFaces.push(fontFace);
  }

  return fontFaces;
}

/**
 * Extract font formats from src value
 * @param {string} src - src property value
 * @returns {string[]} Array of format names
 */
function extractFormats(src) {
  const formats = [];

  // Match format() hints
  const formatRegex = /format\s*\(\s*['"]?(\w+)['"]?\s*\)/gi;
  let match;
  while ((match = formatRegex.exec(src)) !== null) {
    formats.push(match[1].toLowerCase());
  }

  // Infer from file extensions if no format() hints
  if (formats.length === 0) {
    if (src.includes('.woff2')) formats.push('woff2');
    if (src.includes('.woff') && !src.includes('.woff2')) formats.push('woff');
    if (src.includes('.ttf')) formats.push('truetype');
    if (src.includes('.otf')) formats.push('opentype');
    if (src.includes('.eot')) formats.push('embedded-opentype');
    if (src.includes('.svg')) formats.push('svg');
  }

  return formats;
}

/**
 * Extract font preload links from HTML
 * @param {string} html - HTML content
 * @param {string} filePath - File path for reporting
 * @returns {object[]} Array of preload declarations
 */
function extractFontPreloads(html, filePath) {
  const preloads = [];
  const preloadRegex = /<link[^>]+rel\s*=\s*["']preload["'][^>]+as\s*=\s*["']font["'][^>]*>/gi;

  let match;
  while ((match = preloadRegex.exec(html)) !== null) {
    const tag = match[0];

    // Extract href
    const hrefMatch = tag.match(/href\s*=\s*["']([^"']+)["']/i);
    const typeMatch = tag.match(/type\s*=\s*["']([^"']+)["']/i);
    const crossoriginMatch = tag.match(/crossorigin/i);

    preloads.push({
      file: filePath,
      href: hrefMatch ? hrefMatch[1] : null,
      type: typeMatch ? typeMatch[1] : null,
      hasCrossorigin: !!crossoriginMatch,
      raw: tag,
    });
  }

  // Also check for fonts loaded via preload with different attribute order
  const preloadAltRegex = /<link[^>]+as\s*=\s*["']font["'][^>]+rel\s*=\s*["']preload["'][^>]*>/gi;
  while ((match = preloadAltRegex.exec(html)) !== null) {
    const tag = match[0];
    const hrefMatch = tag.match(/href\s*=\s*["']([^"']+)["']/i);
    const typeMatch = tag.match(/type\s*=\s*["']([^"']+)["']/i);
    const crossoriginMatch = tag.match(/crossorigin/i);

    preloads.push({
      file: filePath,
      href: hrefMatch ? hrefMatch[1] : null,
      type: typeMatch ? typeMatch[1] : null,
      hasCrossorigin: !!crossoriginMatch,
      raw: tag,
    });
  }

  return preloads;
}

/**
 * Find files by extension
 * @param {string} dir - Directory to search
 * @param {string[]} extensions - File extensions to match
 * @returns {string[]} Array of file paths
 */
function findFiles(dir, extensions) {
  const files = [];

  function walk(currentDir) {
    try {
      const entries = readdirSync(currentDir);
      for (const entry of entries) {
        if (entry.startsWith('.') || entry === 'node_modules') continue;

        const fullPath = join(currentDir, entry);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
          walk(fullPath);
        } else if (extensions.includes(extname(entry).toLowerCase())) {
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
 * Validate font-face declarations
 * @param {object[]} fontFaces - Array of font-face objects
 * @returns {object} Validation results
 */
function validateFontFaces(fontFaces) {
  const results = {
    errors: [],
    warnings: [],
    info: [],
    passed: [],
  };

  const fontFamilies = new Map();

  for (const fontFace of fontFaces) {
    const family = fontFace.properties.fontFamily || 'Unknown';
    const relPath = fontFace.file;

    // Track font families
    if (!fontFamilies.has(family)) {
      fontFamilies.set(family, []);
    }
    fontFamilies.get(family).push(fontFace);

    // Check font-display
    if (!fontFace.properties.fontDisplay) {
      results.errors.push({
        file: relPath,
        message: `Missing font-display in @font-face for "${family}"`,
        suggestion: 'Add font-display: swap; or font-display: optional;',
      });
    } else {
      const display = fontFace.properties.fontDisplay;
      if (!FONT_DISPLAY_VALUES[display]) {
        results.warnings.push({
          file: relPath,
          message: `Unknown font-display value "${display}" for "${family}"`,
        });
      } else if (display === 'block') {
        results.warnings.push({
          file: relPath,
          message: `font-display: block may cause FOIT (Flash of Invisible Text) for "${family}"`,
          suggestion: 'Consider font-display: swap for better UX',
        });
      } else if (display === 'auto') {
        results.warnings.push({
          file: relPath,
          message: `font-display: auto leaves behavior to browser for "${family}"`,
          suggestion: 'Explicitly set font-display: swap or optional',
        });
      } else {
        results.passed.push({
          file: relPath,
          message: `font-display: ${display} for "${family}"`,
        });
      }
    }

    // Check font formats
    if (fontFace.formats && fontFace.formats.length > 0) {
      const hasWoff2 = fontFace.formats.includes('woff2');
      const hasLegacy = fontFace.formats.some(f =>
        ['truetype', 'opentype', 'embedded-opentype', 'svg'].includes(f)
      );

      if (!hasWoff2) {
        results.warnings.push({
          file: relPath,
          message: `No woff2 format for "${family}" (formats: ${fontFace.formats.join(', ')})`,
          suggestion: 'woff2 offers best compression and is widely supported',
        });
      } else {
        results.passed.push({
          file: relPath,
          message: `Uses woff2 format for "${family}"`,
        });
      }

      if (hasLegacy && !hasWoff2) {
        results.warnings.push({
          file: relPath,
          message: `Only legacy formats for "${family}" - consider adding woff2`,
        });
      }

      // Check for deprecated formats
      if (fontFace.formats.includes('svg')) {
        results.errors.push({
          file: relPath,
          message: `SVG font format is deprecated for "${family}"`,
          suggestion: 'Remove SVG format, use woff2 instead',
        });
      }

      if (fontFace.formats.includes('embedded-opentype')) {
        results.info.push({
          file: relPath,
          message: `EOT format only needed for IE8 support for "${family}"`,
        });
      }
    }

    // Check for unicode-range (subsetting)
    if (fontFace.properties.unicodeRange) {
      results.info.push({
        file: relPath,
        message: `Uses unicode-range subsetting for "${family}"`,
      });
    }
  }

  // Summary info
  results.info.push({
    message: `Found ${fontFaces.length} @font-face declarations for ${fontFamilies.size} font families`,
  });

  return results;
}

/**
 * Validate font preloads
 * @param {object[]} preloads - Array of preload objects
 * @returns {object} Validation results
 */
function validatePreloads(preloads) {
  const results = {
    errors: [],
    warnings: [],
    info: [],
    passed: [],
  };

  for (const preload of preloads) {
    // Check for crossorigin attribute (required for fonts)
    if (!preload.hasCrossorigin) {
      results.errors.push({
        file: preload.file,
        message: `Font preload missing crossorigin attribute: ${preload.href}`,
        suggestion: 'Add crossorigin="anonymous" to font preload links',
      });
    } else {
      results.passed.push({
        file: preload.file,
        message: `Correct crossorigin on preload: ${preload.href}`,
      });
    }

    // Check type attribute
    if (!preload.type) {
      results.warnings.push({
        file: preload.file,
        message: `Font preload missing type attribute: ${preload.href}`,
        suggestion: 'Add type="font/woff2" for woff2 fonts',
      });
    }

    // Check format
    if (preload.href) {
      if (preload.href.endsWith('.woff2')) {
        results.passed.push({
          file: preload.file,
          message: `Preloading woff2 font: ${preload.href}`,
        });
      } else if (preload.href.endsWith('.woff')) {
        results.info.push({
          file: preload.file,
          message: `Preloading woff font (woff2 preferred): ${preload.href}`,
        });
      } else if (preload.href.match(/\.(ttf|otf|eot)$/)) {
        results.warnings.push({
          file: preload.file,
          message: `Preloading legacy font format: ${preload.href}`,
          suggestion: 'Prefer preloading woff2 format',
        });
      }
    }
  }

  if (preloads.length > 0) {
    results.info.push({
      message: `Found ${preloads.length} font preload(s)`,
    });
  }

  return results;
}

/**
 * Check for common font loading patterns in CSS/JS
 * @param {string} content - File content
 * @param {string} filePath - File path
 * @returns {object} Pattern detection results
 */
function checkFontLoadingPatterns(content, filePath) {
  const results = {
    warnings: [],
    info: [],
  };

  // Check for Google Fonts
  if (content.includes('fonts.googleapis.com') || content.includes('fonts.gstatic.com')) {
    results.info.push({
      file: filePath,
      message: 'Uses Google Fonts',
      suggestion: 'Consider self-hosting for better privacy and performance',
    });
  }

  // Check for Adobe Fonts (Typekit)
  if (content.includes('use.typekit.net')) {
    results.info.push({
      file: filePath,
      message: 'Uses Adobe Fonts (Typekit)',
    });
  }

  // Check for Font Face Observer
  if (content.includes('FontFaceObserver')) {
    results.info.push({
      file: filePath,
      message: 'Uses FontFaceObserver for font loading detection',
    });
  }

  // Check for CSS Font Loading API
  if (content.includes('document.fonts') || content.includes('FontFace(')) {
    results.info.push({
      file: filePath,
      message: 'Uses CSS Font Loading API',
    });
  }

  return results;
}

/**
 * Print results
 * @param {object} results - Combined results
 * @param {boolean} verbose - Show all details
 */
function printResults(results, verbose) {
  console.log(`${colors.cyan}=== Web Font Validator ===${colors.reset}\n`);

  // Errors
  if (results.errors.length > 0) {
    console.log(`${colors.red}${colors.bold}Errors (${results.errors.length}):${colors.reset}`);
    for (const error of results.errors) {
      console.log(`  ${colors.red}✗${colors.reset} ${error.message}`);
      if (error.file) console.log(`    ${colors.dim}${error.file}${colors.reset}`);
      if (error.suggestion) console.log(`    ${colors.dim}→ ${error.suggestion}${colors.reset}`);
    }
    console.log();
  }

  // Warnings
  if (results.warnings.length > 0) {
    console.log(`${colors.yellow}${colors.bold}Warnings (${results.warnings.length}):${colors.reset}`);
    for (const warning of results.warnings) {
      console.log(`  ${colors.yellow}⚠${colors.reset} ${warning.message}`);
      if (warning.file) console.log(`    ${colors.dim}${warning.file}${colors.reset}`);
      if (warning.suggestion) console.log(`    ${colors.dim}→ ${warning.suggestion}${colors.reset}`);
    }
    console.log();
  }

  // Passed (verbose only)
  if (verbose && results.passed.length > 0) {
    console.log(`${colors.green}${colors.bold}Passed (${results.passed.length}):${colors.reset}`);
    for (const pass of results.passed) {
      console.log(`  ${colors.green}✓${colors.reset} ${pass.message}`);
      if (pass.file) console.log(`    ${colors.dim}${pass.file}${colors.reset}`);
    }
    console.log();
  }

  // Info
  if (results.info.length > 0) {
    console.log(`${colors.dim}${colors.bold}Info:${colors.reset}`);
    for (const info of results.info) {
      console.log(`  ${colors.dim}ℹ ${info.message}${colors.reset}`);
      if (info.file) console.log(`    ${info.file}`);
      if (info.suggestion) console.log(`    → ${info.suggestion}`);
    }
    console.log();
  }

  // Summary
  const total = results.errors.length + results.warnings.length;
  if (total === 0) {
    console.log(`${colors.green}✓ No font issues found${colors.reset}`);
  } else {
    console.log(`${colors.bold}Summary:${colors.reset} ${results.errors.length} errors, ${results.warnings.length} warnings`);
  }

  return results.errors.length;
}

/**
 * Show help
 */
function showHelp() {
  console.log(`
${colors.cyan}Web Font Validator${colors.reset}

Validates web font usage for performance and best practices.

${colors.bold}Usage:${colors.reset}
  node scripts/font-check.js [options] [directory]

${colors.bold}Options:${colors.reset}
  --help, -h     Show this help
  --verbose, -v  Show passed checks too
  --strict       Exit with error on warnings

${colors.bold}Checks Performed:${colors.reset}

  @font-face declarations:
    • font-display property (required)
    • Modern formats (woff2 preferred)
    • Deprecated formats (svg, eot)
    • Unicode-range subsetting

  Font preloads:
    • crossorigin attribute (required for fonts)
    • type attribute
    • Format preference

  Font loading patterns:
    • Google Fonts detection
    • Font loading API usage

${colors.bold}Recommended font-display values:${colors.reset}
  swap      Show fallback immediately, swap when ready (body text)
  optional  May skip swap if slow (decorative fonts)
  fallback  Brief invisible, then fallback

${colors.bold}Examples:${colors.reset}
  node scripts/font-check.js src/
  node scripts/font-check.js --verbose
  npm run lint:fonts
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

  if (!existsSync(targetDir)) {
    console.log(`${colors.yellow}Directory not found: ${targetDir}${colors.reset}`);
    process.exit(0);
  }

  // Find CSS and HTML files
  const cssFiles = findFiles(targetDir, ['.css']);
  const htmlFiles = findFiles(targetDir, ['.html', '.htm']);

  if (cssFiles.length === 0 && htmlFiles.length === 0) {
    console.log(`${colors.yellow}No CSS or HTML files found in ${targetDir}${colors.reset}`);
    process.exit(0);
  }

  console.log(`${colors.dim}Analyzing ${cssFiles.length} CSS and ${htmlFiles.length} HTML files in ${targetDir}${colors.reset}\n`);

  // Collect all font-faces
  const allFontFaces = [];
  const allPreloads = [];
  const patternResults = { warnings: [], info: [] };

  // Process CSS files
  for (const file of cssFiles) {
    try {
      const content = readFileSync(file, 'utf8');
      const relPath = relative(process.cwd(), file);

      const fontFaces = extractFontFaces(content, relPath);
      allFontFaces.push(...fontFaces);

      const patterns = checkFontLoadingPatterns(content, relPath);
      patternResults.warnings.push(...patterns.warnings);
      patternResults.info.push(...patterns.info);
    } catch {
      // Ignore read errors
    }
  }

  // Process HTML files
  for (const file of htmlFiles) {
    try {
      const content = readFileSync(file, 'utf8');
      const relPath = relative(process.cwd(), file);

      const preloads = extractFontPreloads(content, relPath);
      allPreloads.push(...preloads);

      const patterns = checkFontLoadingPatterns(content, relPath);
      patternResults.warnings.push(...patterns.warnings);
      patternResults.info.push(...patterns.info);
    } catch {
      // Ignore read errors
    }
  }

  // Validate
  const fontFaceResults = validateFontFaces(allFontFaces);
  const preloadResults = validatePreloads(allPreloads);

  // Combine results
  const combinedResults = {
    errors: [...fontFaceResults.errors, ...preloadResults.errors],
    warnings: [...fontFaceResults.warnings, ...preloadResults.warnings, ...patternResults.warnings],
    info: [...fontFaceResults.info, ...preloadResults.info, ...patternResults.info],
    passed: [...fontFaceResults.passed, ...preloadResults.passed],
  };

  const errorCount = printResults(combinedResults, verbose);

  if (strict && combinedResults.warnings.length > 0) {
    process.exit(1);
  }

  process.exit(errorCount > 0 ? 1 : 0);
}

main();
