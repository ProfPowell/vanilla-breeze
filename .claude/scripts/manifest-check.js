#!/usr/bin/env node

/**
 * PWA Manifest Validator
 * Comprehensive validation of manifest.webmanifest/manifest.json files
 *
 * Checks:
 * - JSON syntax
 * - Required fields for PWA installability
 * - Icon files existence and dimensions
 * - Valid display/orientation values
 * - Color format validation
 * - Shortcuts and screenshots validation
 *
 * Usage:
 *   node scripts/manifest-check.js [files...]
 *   node scripts/manifest-check.js src/manifest.webmanifest
 *   npm run lint:manifest
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname, resolve, extname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Colors for terminal output
const colors = {
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m'
};

/**
 * Valid display modes for PWA
 */
const VALID_DISPLAY_MODES = ['fullscreen', 'standalone', 'minimal-ui', 'browser'];

/**
 * Valid orientation values
 */
const VALID_ORIENTATIONS = [
  'any', 'natural', 'landscape', 'portrait',
  'portrait-primary', 'portrait-secondary',
  'landscape-primary', 'landscape-secondary'
];

/**
 * Required icon sizes for PWA installability
 */
const REQUIRED_ICON_SIZES = [
  { size: '192x192', purpose: 'Android home screen' },
  { size: '512x512', purpose: 'PWA splash screen' }
];

/**
 * Recommended icon sizes
 */
const RECOMMENDED_ICON_SIZES = [
  { size: '48x48', purpose: 'Android notification' },
  { size: '72x72', purpose: 'Android legacy' },
  { size: '96x96', purpose: 'Android legacy' },
  { size: '128x128', purpose: 'Chrome Web Store' },
  { size: '144x144', purpose: 'Windows tiles' },
  { size: '152x152', purpose: 'iPad' },
  { size: '180x180', purpose: 'iPhone (apple-touch-icon)' },
  { size: '384x384', purpose: 'Android splash' }
];

/**
 * Validate hex color format
 */
function isValidColor(color) {
  if (!color) return false;

  // Hex colors
  if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(color)) {
    return true;
  }

  // Named colors (basic set)
  const namedColors = [
    'white', 'black', 'red', 'green', 'blue', 'yellow', 'cyan', 'magenta',
    'transparent', 'currentColor'
  ];
  if (namedColors.includes(color.toLowerCase())) {
    return true;
  }

  // RGB/RGBA
  if (/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+\s*)?\)$/.test(color)) {
    return true;
  }

  // HSL/HSLA
  if (/^hsla?\(\s*\d+\s*,\s*[\d.]+%\s*,\s*[\d.]+%\s*(,\s*[\d.]+\s*)?\)$/.test(color)) {
    return true;
  }

  return false;
}

/**
 * Check if icon file exists relative to manifest location
 */
function checkIconExists(iconSrc, manifestDir) {
  // Handle absolute URLs
  if (iconSrc.startsWith('http://') || iconSrc.startsWith('https://')) {
    return { exists: null, message: 'External URL (cannot verify)' };
  }

  // Handle relative paths
  const iconPath = iconSrc.startsWith('/')
    ? join(manifestDir, '..', iconSrc)  // Absolute from site root
    : join(manifestDir, iconSrc);       // Relative to manifest

  if (existsSync(iconPath)) {
    return { exists: true, path: iconPath };
  }

  return { exists: false, path: iconPath };
}

/**
 * Validate a single icon entry
 */
function validateIcon(icon, index, manifestDir) {
  const errors = [];
  const warnings = [];
  const info = [];

  // Check src
  if (!icon.src) {
    errors.push(`icons[${index}]: Missing 'src' property`);
    return { errors, warnings, info };
  }

  // Check if file exists
  const fileCheck = checkIconExists(icon.src, manifestDir);
  if (fileCheck.exists === false) {
    errors.push(`icons[${index}]: File not found: ${icon.src}`);
  } else if (fileCheck.exists === null) {
    info.push(`icons[${index}]: ${fileCheck.message}`);
  }

  // Check sizes
  if (!icon.sizes) {
    warnings.push(`icons[${index}]: Missing 'sizes' property`);
  } else if (!/^\d+x\d+$/.test(icon.sizes) && icon.sizes !== 'any') {
    warnings.push(`icons[${index}]: Invalid sizes format: ${icon.sizes} (expected NxN or 'any')`);
  }

  // Check type
  if (!icon.type) {
    // Infer from extension
    const ext = extname(icon.src).toLowerCase();
    const typeMap = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon'
    };
    if (typeMap[ext]) {
      info.push(`icons[${index}]: No type specified, inferred ${typeMap[ext]}`);
    } else {
      warnings.push(`icons[${index}]: Missing 'type' property`);
    }
  }

  // Check purpose
  if (icon.purpose) {
    const validPurposes = ['monochrome', 'maskable', 'any'];
    const purposes = icon.purpose.split(/\s+/);
    for (const p of purposes) {
      if (!validPurposes.includes(p)) {
        warnings.push(`icons[${index}]: Unknown purpose: ${p}`);
      }
    }
  }

  return { errors, warnings, info };
}

/**
 * Validate icons array
 */
function validateIcons(icons, manifestDir) {
  const errors = [];
  const warnings = [];
  const info = [];

  if (!icons || !Array.isArray(icons)) {
    errors.push('Missing or invalid "icons" array');
    return { errors, warnings, info };
  }

  if (icons.length === 0) {
    errors.push('"icons" array is empty');
    return { errors, warnings, info };
  }

  // Collect all sizes
  const sizes = icons.map(i => i.sizes).filter(Boolean);

  // Check required sizes
  for (const req of REQUIRED_ICON_SIZES) {
    if (!sizes.includes(req.size)) {
      errors.push(`Missing required icon size: ${req.size} (${req.purpose})`);
    }
  }

  // Check for maskable icon
  const hasMaskable = icons.some(i => i.purpose && i.purpose.includes('maskable'));
  if (!hasMaskable) {
    warnings.push('No maskable icon defined (recommended for Android adaptive icons)');
  }

  // Validate each icon
  for (let i = 0; i < icons.length; i++) {
    const result = validateIcon(icons[i], i, manifestDir);
    errors.push(...result.errors);
    warnings.push(...result.warnings);
    info.push(...result.info);
  }

  // Check recommended sizes
  const missingSizes = RECOMMENDED_ICON_SIZES.filter(r => !sizes.includes(r.size));
  if (missingSizes.length > 0 && missingSizes.length <= 3) {
    // Only show a few missing recommended sizes
    for (const missing of missingSizes.slice(0, 2)) {
      info.push(`Consider adding ${missing.size} icon (${missing.purpose})`);
    }
  }

  return { errors, warnings, info };
}

/**
 * Validate shortcuts array
 */
function validateShortcuts(shortcuts, manifestDir) {
  const errors = [];
  const warnings = [];
  const info = [];

  if (!shortcuts) {
    return { errors, warnings, info };
  }

  if (!Array.isArray(shortcuts)) {
    errors.push('"shortcuts" must be an array');
    return { errors, warnings, info };
  }

  if (shortcuts.length > 4) {
    warnings.push(`${shortcuts.length} shortcuts defined, but only 4 may be shown`);
  }

  shortcuts.forEach((shortcut, i) => {
    if (!shortcut.name) {
      errors.push(`shortcuts[${i}]: Missing 'name'`);
    }
    if (!shortcut.url) {
      errors.push(`shortcuts[${i}]: Missing 'url'`);
    }
    if (shortcut.icons && Array.isArray(shortcut.icons)) {
      for (let j = 0; j < shortcut.icons.length; j++) {
        const iconCheck = checkIconExists(shortcut.icons[j].src, manifestDir);
        if (iconCheck.exists === false) {
          warnings.push(`shortcuts[${i}].icons[${j}]: File not found: ${shortcut.icons[j].src}`);
        }
      }
    }
  });

  return { errors, warnings, info };
}

/**
 * Validate screenshots array
 */
function validateScreenshots(screenshots, manifestDir) {
  const errors = [];
  const warnings = [];
  const info = [];

  if (!screenshots) {
    return { errors, warnings, info };
  }

  if (!Array.isArray(screenshots)) {
    errors.push('"screenshots" must be an array');
    return { errors, warnings, info };
  }

  const formFactors = screenshots.map(s => s.form_factor).filter(Boolean);
  const hasWide = formFactors.includes('wide');
  const hasNarrow = formFactors.includes('narrow');

  if (screenshots.length > 0 && !hasWide && !hasNarrow) {
    info.push('Consider adding form_factor ("wide" or "narrow") to screenshots');
  }

  screenshots.forEach((screenshot, i) => {
    if (!screenshot.src) {
      errors.push(`screenshots[${i}]: Missing 'src'`);
    } else {
      const fileCheck = checkIconExists(screenshot.src, manifestDir);
      if (fileCheck.exists === false) {
        warnings.push(`screenshots[${i}]: File not found: ${screenshot.src}`);
      }
    }

    if (!screenshot.sizes) {
      warnings.push(`screenshots[${i}]: Missing 'sizes'`);
    }

    if (!screenshot.type) {
      warnings.push(`screenshots[${i}]: Missing 'type'`);
    }
  });

  return { errors, warnings, info };
}

/**
 * Validate manifest content
 */
function validateManifest(content, manifestPath) {
  const errors = [];
  const warnings = [];
  const info = [];
  const manifestDir = dirname(manifestPath);

  // Parse JSON
  let manifest;
  try {
    manifest = JSON.parse(content);
  } catch (e) {
    errors.push(`Invalid JSON: ${e.message}`);
    return { errors, warnings, info };
  }

  // Check name (required for installability)
  if (!manifest.name) {
    if (manifest.short_name) {
      warnings.push('Has "short_name" but missing "name"');
    } else {
      errors.push('Missing "name" (required for PWA installability)');
    }
  } else {
    if (manifest.name.length > 45) {
      warnings.push(`"name" is ${manifest.name.length} chars (may be truncated, keep under 45)`);
    }
  }

  // Check short_name
  if (manifest.short_name) {
    if (manifest.short_name.length > 12) {
      warnings.push(`"short_name" is ${manifest.short_name.length} chars (keep under 12 for home screen)`);
    }
  } else {
    info.push('No "short_name" (recommended for home screen display)');
  }

  // Check start_url (required for installability)
  if (!manifest.start_url) {
    errors.push('Missing "start_url" (required for PWA installability)');
  }

  // Check display mode
  if (!manifest.display) {
    warnings.push('Missing "display" mode (defaults to "browser")');
  } else if (!VALID_DISPLAY_MODES.includes(manifest.display)) {
    errors.push(`Invalid display mode: "${manifest.display}" (valid: ${VALID_DISPLAY_MODES.join(', ')})`);
  } else if (manifest.display === 'browser') {
    info.push('display: "browser" - will not feel like a standalone app');
  }

  // Check orientation
  if (manifest.orientation && !VALID_ORIENTATIONS.includes(manifest.orientation)) {
    errors.push(`Invalid orientation: "${manifest.orientation}"`);
  }

  // Check colors
  if (manifest.theme_color) {
    if (!isValidColor(manifest.theme_color)) {
      warnings.push(`Invalid theme_color format: "${manifest.theme_color}"`);
    }
  } else {
    warnings.push('Missing "theme_color" (affects browser UI color)');
  }

  if (manifest.background_color) {
    if (!isValidColor(manifest.background_color)) {
      warnings.push(`Invalid background_color format: "${manifest.background_color}"`);
    }
  } else {
    warnings.push('Missing "background_color" (affects splash screen)');
  }

  // Check scope
  if (manifest.scope) {
    if (!manifest.scope.startsWith('/') && !manifest.scope.startsWith('http')) {
      warnings.push(`"scope" should be an absolute path or URL: "${manifest.scope}"`);
    }
  }

  // Check id (modern PWA requirement)
  if (!manifest.id) {
    info.push('No "id" field (recommended for consistent app identity)');
  }

  // Check description
  if (!manifest.description) {
    info.push('No "description" (recommended for app stores)');
  } else if (manifest.description.length > 300) {
    warnings.push(`"description" is ${manifest.description.length} chars (keep under 300)`);
  }

  // Check categories
  if (manifest.categories && !Array.isArray(manifest.categories)) {
    warnings.push('"categories" should be an array');
  }

  // Validate icons
  const iconResults = validateIcons(manifest.icons, manifestDir);
  errors.push(...iconResults.errors);
  warnings.push(...iconResults.warnings);
  info.push(...iconResults.info);

  // Validate shortcuts
  const shortcutResults = validateShortcuts(manifest.shortcuts, manifestDir);
  errors.push(...shortcutResults.errors);
  warnings.push(...shortcutResults.warnings);
  info.push(...shortcutResults.info);

  // Validate screenshots
  const screenshotResults = validateScreenshots(manifest.screenshots, manifestDir);
  errors.push(...screenshotResults.errors);
  warnings.push(...screenshotResults.warnings);
  info.push(...screenshotResults.info);

  return { errors, warnings, info };
}

/**
 * Find manifest files
 */
function findManifests(dir, files = []) {
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      if (!entry.startsWith('.') && entry !== 'node_modules') {
        findManifests(fullPath, files);
      }
    } else if (entry === 'manifest.webmanifest' || entry === 'manifest.json') {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Show help
 */
function showHelp() {
  console.log(`
${colors.cyan}PWA Manifest Validator${colors.reset}

Validates manifest.webmanifest/manifest.json files for PWA compliance.

${colors.bold}Usage:${colors.reset}
  node scripts/manifest-check.js [options] [files...]

${colors.bold}Options:${colors.reset}
  --help, -h     Show this help
  --strict       Treat warnings as errors

${colors.bold}Checks Performed:${colors.reset}

  ${colors.green}Required for Installability:${colors.reset}
    • name - App name
    • start_url - Entry point
    • icons - 192x192 and 512x512 minimum
    • display - standalone, fullscreen, or minimal-ui

  ${colors.green}Recommended:${colors.reset}
    • short_name - For home screen (max 12 chars)
    • theme_color - Browser UI color
    • background_color - Splash screen color
    • description - App store description
    • id - Consistent app identity

  ${colors.green}Icons:${colors.reset}
    • File existence verification
    • Required sizes (192x192, 512x512)
    • Maskable icon for Android
    • Valid type and purpose values

  ${colors.green}Optional Features:${colors.reset}
    • shortcuts - Quick actions (max 4)
    • screenshots - App store preview
    • categories - App classification

${colors.bold}Examples:${colors.reset}
  node scripts/manifest-check.js src/manifest.webmanifest
  node scripts/manifest-check.js --strict
  npm run lint:manifest
`);
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  const strict = args.includes('--strict');
  let files = args.filter(a => !a.startsWith('-'));

  // If no files specified, find all manifests
  if (files.length === 0) {
    const srcDir = resolve(__dirname, '../src');
    if (existsSync(srcDir)) {
      files = findManifests(srcDir);
    }

    const examplesDir = resolve(__dirname, '../examples');
    if (existsSync(examplesDir)) {
      files = files.concat(findManifests(examplesDir));
    }

    // Check root too
    const rootManifest = resolve(__dirname, '../manifest.webmanifest');
    const rootManifestJson = resolve(__dirname, '../manifest.json');
    if (existsSync(rootManifest)) files.push(rootManifest);
    if (existsSync(rootManifestJson)) files.push(rootManifestJson);
  }

  if (files.length === 0) {
    console.log(`${colors.yellow}No manifest files found${colors.reset}`);
    console.log(`${colors.dim}Looking for manifest.webmanifest or manifest.json${colors.reset}`);
    process.exit(0);
  }

  console.log(`${colors.cyan}PWA Manifest Validator${colors.reset}\n`);

  let totalErrors = 0;
  let totalWarnings = 0;

  for (const file of files) {
    if (!existsSync(file)) {
      console.log(`${colors.yellow}File not found: ${file}${colors.reset}`);
      continue;
    }

    const content = readFileSync(file, 'utf-8');
    const { errors, warnings, info } = validateManifest(content, file);

    totalErrors += errors.length;
    totalWarnings += warnings.length;

    if (errors.length === 0 && warnings.length === 0) {
      console.log(`${colors.green}✓${colors.reset} ${file}`);
      for (const i of info) {
        console.log(`  ${colors.dim}ℹ ${i}${colors.reset}`);
      }
    } else {
      console.log(`${colors.dim}─────────────────────────────────────────${colors.reset}`);
      console.log(`${file}`);

      for (const error of errors) {
        console.log(`  ${colors.red}✗ ERROR:${colors.reset} ${error}`);
      }

      for (const warning of warnings) {
        console.log(`  ${colors.yellow}⚠ WARN:${colors.reset} ${warning}`);
      }

      for (const i of info) {
        console.log(`  ${colors.dim}ℹ ${i}${colors.reset}`);
      }
    }
  }

  console.log(`\n${colors.dim}─────────────────────────────────────────${colors.reset}`);
  console.log(`Total: ${files.length} manifest(s) checked`);
  console.log(`Results: ${colors.red}${totalErrors} errors${colors.reset}, ${colors.yellow}${totalWarnings} warnings${colors.reset}`);

  if (totalErrors > 0) {
    process.exit(1);
  }

  if (strict && totalWarnings > 0) {
    console.log(`${colors.dim}(--strict mode: warnings treated as errors)${colors.reset}`);
    process.exit(1);
  }
}

main();
