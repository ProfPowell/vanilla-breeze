#!/usr/bin/env node

/**
 * SVG Placeholder Image Generator
 * Generates placeholder images for prototypes and layouts.
 *
 * Types:
 * - simple: Grey box with diagonal X
 * - labeled: Grey box with text label
 * - brand: Uses design token colors (requires --tokens flag)
 *
 * Usage:
 *   node scripts/generate-placeholder.js --type simple --size 400x400
 *   node scripts/generate-placeholder.js --type labeled --label "Hero Image" --size 1200x400
 *   node scripts/generate-placeholder.js --preset product
 *   node scripts/generate-placeholder.js --type simple --size 200x200 --inline
 *   node scripts/generate-placeholder.js --type labeled --label "Product" --size 400x400 --output assets/images/placeholder/
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');

// Colors for terminal output
const colors = {
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  dim: '\x1b[2m'
};

// Size presets
const PRESETS = {
  'avatar-sm': { width: 48, height: 48, label: 'Avatar' },
  'avatar-lg': { width: 128, height: 128, label: 'Avatar' },
  'thumbnail': { width: 150, height: 150, label: 'Thumbnail' },
  'product': { width: 400, height: 400, label: 'Product' },
  'card': { width: 400, height: 225, label: 'Card Image' },
  'hero': { width: 1200, height: 400, label: 'Hero Image' },
  'og': { width: 1200, height: 630, label: 'OG Image' },
  'logo': { width: 200, height: 50, label: 'Logo' },
  'icon': { width: 48, height: 48, label: 'Icon' },
  'banner': { width: 728, height: 90, label: 'Banner' },
  'gallery': { width: 800, height: 600, label: 'Gallery' }
};

// Default colors
const DEFAULT_COLORS = {
  background: '#f3f4f6',
  stroke: '#d1d5db',
  text: '#6b7280',
  accent: '#2563eb',
  accentText: '#ffffff'
};

// Token to color mapping
const TOKEN_MAP = {
  background: ['--background-alt', '--background-main', '--surface-color'],
  stroke: ['--border-color', '--border-light'],
  text: ['--text-muted', '--text-color'],
  accent: ['--primary-color', '--primary', '--accent-color'],
  accentText: ['--text-inverted', '--primary-text']
};

/**
 * Parse CSS file and extract design tokens
 * @param {string} cssPath - Path to CSS file
 * @returns {Object} Extracted colors
 */
function parseTokensFromCSS(cssPath) {
  const colors = { ...DEFAULT_COLORS };

  try {
    const cssContent = readFileSync(cssPath, 'utf-8');

    // Match custom property declarations: --name: value;
    const propertyRegex = /--([a-zA-Z0-9-]+)\s*:\s*([^;]+);/g;
    const tokens = {};
    let match;

    while ((match = propertyRegex.exec(cssContent)) !== null) {
      const name = `--${match[1]}`;
      let value = match[2].trim();

      // Skip var() references for now - use raw values only
      if (!value.startsWith('var(')) {
        tokens[name] = value;
      }
    }

    // Map tokens to colors
    for (const [colorKey, tokenNames] of Object.entries(TOKEN_MAP)) {
      for (const tokenName of tokenNames) {
        if (tokens[tokenName]) {
          colors[colorKey] = tokens[tokenName];
          break;
        }
      }
    }

    return colors;
  } catch (error) {
    console.error(`${colors.yellow}Warning: Could not read CSS file: ${cssPath}${colors.reset}`);
    return colors;
  }
}

/**
 * Find CSS file with tokens
 * @returns {string|null} Path to CSS file or null
 */
function findTokensCSS() {
  const candidates = [
    'src/styles/main.css',
    'src/styles/_tokens.css',
    'src/css/main.css',
    'assets/styles/main.css',
    'assets/css/main.css',
    'styles/main.css',
    'css/main.css'
  ];

  for (const candidate of candidates) {
    const fullPath = join(ROOT, candidate);
    if (existsSync(fullPath)) {
      return fullPath;
    }
  }

  return null;
}

/**
 * Parse command line arguments
 * @returns {Object} Parsed arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {
    type: 'simple',
    width: 400,
    height: 400,
    label: null,
    output: null,
    inline: false,
    preset: null,
    tokens: null
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case '--type':
      case '-t':
        parsed.type = next;
        i++;
        break;
      case '--size':
      case '-s':
        const [w, h] = next.split('x').map(Number);
        parsed.width = w;
        parsed.height = h;
        i++;
        break;
      case '--label':
      case '-l':
        parsed.label = next;
        i++;
        break;
      case '--output':
      case '-o':
        parsed.output = next;
        i++;
        break;
      case '--inline':
      case '-i':
        parsed.inline = true;
        break;
      case '--preset':
      case '-p':
        parsed.preset = next;
        i++;
        break;
      case '--tokens':
        parsed.tokens = next;
        i++;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
    }
  }

  // Apply preset if specified
  if (parsed.preset && PRESETS[parsed.preset]) {
    const preset = PRESETS[parsed.preset];
    parsed.width = preset.width;
    parsed.height = preset.height;
    if (!parsed.label) {
      parsed.label = preset.label;
    }
    if (parsed.type === 'simple' && preset.label) {
      parsed.type = 'labeled';
    }
  }

  return parsed;
}

/**
 * Print help message
 */
function printHelp() {
  console.log(`
${colors.cyan}SVG Placeholder Generator${colors.reset}

Generate placeholder images for prototypes and layouts.

${colors.yellow}Usage:${colors.reset}
  node scripts/generate-placeholder.js [options]

${colors.yellow}Options:${colors.reset}
  --type, -t     Placeholder type: simple, labeled, brand (default: simple)
  --size, -s     Dimensions as WxH (default: 400x400)
  --label, -l    Text label for labeled/brand types
  --output, -o   Output file path or directory
  --inline, -i   Output as data URI
  --preset, -p   Use size preset (see below)
  --tokens       CSS file to read design tokens from (for brand type)
  --help, -h     Show this help

${colors.yellow}Presets:${colors.reset}
  avatar-sm    48x48      User list avatars
  avatar-lg    128x128    Profile avatars
  thumbnail    150x150    Grid thumbnails
  product      400x400    Product cards
  card         400x225    Blog/article cards
  hero         1200x400   Hero banners
  og           1200x630   Open Graph images
  logo         200x50     Brand logos
  icon         48x48      UI icons
  banner       728x90     Ad banners
  gallery      800x600    Photo galleries

${colors.yellow}Examples:${colors.reset}
  # Simple placeholder
  node scripts/generate-placeholder.js --type simple --size 400x400

  # Labeled placeholder
  node scripts/generate-placeholder.js --type labeled --label "Hero Image" --size 1200x400

  # Brand placeholder with auto-detected tokens
  node scripts/generate-placeholder.js --type brand --label "Product" --preset product

  # Brand placeholder with specific CSS file
  node scripts/generate-placeholder.js --type brand --label "Hero" --size 1200x400 --tokens src/styles/main.css

  # Using preset
  node scripts/generate-placeholder.js --preset product

  # Output to file
  node scripts/generate-placeholder.js --preset hero --output assets/images/placeholder/

  # Inline data URI
  node scripts/generate-placeholder.js --type simple --size 100x100 --inline
`);
}

/**
 * Generate simple placeholder SVG
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {Object} colorScheme - Color scheme to use
 * @returns {string} SVG content
 */
function generateSimple(width, height, colorScheme = DEFAULT_COLORS) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Placeholder image">
  <title>Placeholder image</title>
  <rect width="${width}" height="${height}" fill="${colorScheme.background}"/>
  <line x1="0" y1="0" x2="${width}" y2="${height}" stroke="${colorScheme.stroke}" stroke-width="1"/>
  <line x1="${width}" y1="0" x2="0" y2="${height}" stroke="${colorScheme.stroke}" stroke-width="1"/>
</svg>`;
}

/**
 * Generate labeled placeholder SVG
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {string} label - Text label
 * @param {Object} colorScheme - Color scheme to use
 * @returns {string} SVG content
 */
function generateLabeled(width, height, label, colorScheme = DEFAULT_COLORS) {
  const fontSize = Math.min(Math.max(width / 15, 12), 32);
  const centerX = width / 2;
  const centerY = height / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${label} placeholder">
  <title>${label} placeholder</title>
  <rect width="${width}" height="${height}" fill="${colorScheme.background}"/>
  <line x1="0" y1="0" x2="${width}" y2="${height}" stroke="${colorScheme.stroke}" stroke-width="1"/>
  <line x1="${width}" y1="0" x2="0" y2="${height}" stroke="${colorScheme.stroke}" stroke-width="1"/>
  <text x="${centerX}" y="${centerY}" text-anchor="middle" dominant-baseline="middle" font-family="system-ui, -apple-system, sans-serif" font-size="${fontSize}" fill="${colorScheme.text}">${escapeXml(label)}</text>
</svg>`;
}

/**
 * Generate brand placeholder SVG
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {string} label - Text label
 * @param {Object} colorScheme - Color scheme to use
 * @returns {string} SVG content
 */
function generateBrand(width, height, label, colorScheme = DEFAULT_COLORS) {
  const fontSize = Math.min(Math.max(width / 20, 10), 24);
  const centerX = width / 2;
  const centerY = height / 2;

  // Button dimensions
  const btnWidth = Math.min(width * 0.4, 200);
  const btnHeight = Math.min(height * 0.15, 50);
  const btnX = centerX - btnWidth / 2;
  const btnY = centerY - btnHeight / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${label} placeholder">
  <title>${label} placeholder</title>
  <rect width="${width}" height="${height}" fill="${colorScheme.background}"/>
  <line x1="0" y1="0" x2="${width}" y2="${height}" stroke="${colorScheme.stroke}" stroke-width="1"/>
  <line x1="${width}" y1="0" x2="0" y2="${height}" stroke="${colorScheme.stroke}" stroke-width="1"/>
  <rect x="${btnX}" y="${btnY}" width="${btnWidth}" height="${btnHeight}" rx="4" fill="${colorScheme.accent}"/>
  <text x="${centerX}" y="${centerY}" text-anchor="middle" dominant-baseline="middle" font-family="system-ui, -apple-system, sans-serif" font-size="${fontSize}" fill="${colorScheme.accentText}">${escapeXml(label)}</text>
</svg>`;
}

/**
 * Escape XML special characters
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Convert SVG to data URI
 * @param {string} svg - SVG content
 * @returns {string} Data URI
 */
function toDataUri(svg) {
  const encoded = encodeURIComponent(svg)
    .replace(/'/g, '%27')
    .replace(/"/g, '%22');
  return `data:image/svg+xml,${encoded}`;
}

/**
 * Main function
 */
function main() {
  const args = parseArgs();

  // Validate type
  if (!['simple', 'labeled', 'brand'].includes(args.type)) {
    console.error(`${colors.red}Error: Invalid type "${args.type}". Use: simple, labeled, or brand${colors.reset}`);
    process.exit(1);
  }

  // Require label for labeled/brand types
  if ((args.type === 'labeled' || args.type === 'brand') && !args.label) {
    console.error(`${colors.red}Error: --label is required for ${args.type} type${colors.reset}`);
    process.exit(1);
  }

  // Get color scheme
  let colorScheme = DEFAULT_COLORS;
  if (args.type === 'brand') {
    // Try to find and parse CSS tokens
    const cssPath = args.tokens ? resolve(args.tokens) : findTokensCSS();
    if (cssPath) {
      colorScheme = parseTokensFromCSS(cssPath);
      if (!args.inline && !args.output) {
        console.error(`${colors.dim}Using tokens from: ${cssPath}${colors.reset}`);
      }
    } else if (!args.tokens) {
      console.error(`${colors.yellow}Note: No CSS file found. Using default brand colors.${colors.reset}`);
      console.error(`${colors.dim}Tip: Use --tokens path/to/main.css to specify your CSS file${colors.reset}`);
    }
  }

  // Generate SVG
  let svg;
  switch (args.type) {
    case 'simple':
      svg = generateSimple(args.width, args.height, colorScheme);
      break;
    case 'labeled':
      svg = generateLabeled(args.width, args.height, args.label, colorScheme);
      break;
    case 'brand':
      svg = generateBrand(args.width, args.height, args.label, colorScheme);
      break;
  }

  // Output
  if (args.inline) {
    console.log(toDataUri(svg));
  } else if (args.output) {
    let outputPath = args.output;

    // If output is a directory, generate filename
    if (outputPath.endsWith('/') || (existsSync(outputPath) && !outputPath.endsWith('.svg'))) {
      const sanitizedLabel = args.label
        ? args.label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        : args.type;
      outputPath = join(outputPath, `${sanitizedLabel}-${args.width}x${args.height}.svg`);
    }

    // Ensure directory exists
    const dir = dirname(outputPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    writeFileSync(outputPath, svg);
    console.log(`${colors.green}✓${colors.reset} Generated: ${outputPath}`);
  } else {
    console.log(svg);
  }
}

main();
