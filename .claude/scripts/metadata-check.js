#!/usr/bin/env node

/**
 * Metadata validation script
 * Checks HTML files against metadata profiles
 *
 * Usage:
 *   node scripts/metadata-check.js [files...]
 *   node scripts/metadata-check.js examples/pages/homepage/index.html
 *   node scripts/metadata-check.js --profile=article examples/pages/press-release/index.html
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
 * Load a metadata profile
 */
function loadProfile(profileName) {
  const profilePath = resolve(__dirname, '../.claude/skills/metadata/profiles', `${profileName}.json`);

  if (!existsSync(profilePath)) {
    console.error(`${colors.red}Profile not found: ${profileName}${colors.reset}`);
    process.exit(1);
  }

  const profile = JSON.parse(readFileSync(profilePath, 'utf-8'));

  // Handle inheritance
  if (profile.extends) {
    const parentProfile = loadProfile(profile.extends);
    return mergeProfiles(parentProfile, profile);
  }

  return profile;
}

/**
 * Merge child profile with parent
 */
function mergeProfiles(parent, child) {
  return {
    name: child.name,
    description: child.description,
    required: [...(parent.required || []), ...(child.required || [])],
    recommended: [...(parent.recommended || []), ...(child.recommended || [])],
    order: child.order || parent.order
  };
}

/**
 * Extract <head> content from HTML
 */
function extractHead(html) {
  const match = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  return match ? match[1] : '';
}

/**
 * Check if element exists in head
 */
function elementExists(head, rule) {
  const { element, attributes } = rule;

  if (element === 'title') {
    return /<title[^>]*>[\s\S]+?<\/title>/i.test(head);
  }

  if (element === 'meta') {
    if (attributes.charset) {
      return /<meta[^>]*charset\s*=\s*["']?utf-8["']?[^>]*\/?>/i.test(head);
    }
    if (attributes.name) {
      const regex = new RegExp(`<meta[^>]*name\\s*=\\s*["']?${escapeRegex(attributes.name)}["']?[^>]*/?>`, 'i');
      return regex.test(head);
    }
    if (attributes.property) {
      const regex = new RegExp(`<meta[^>]*property\\s*=\\s*["']?${escapeRegex(attributes.property)}["']?[^>]*/?>`, 'i');
      return regex.test(head);
    }
    if (attributes['http-equiv']) {
      const regex = new RegExp(`<meta[^>]*http-equiv\\s*=\\s*["']?${escapeRegex(attributes['http-equiv'])}["']?[^>]*/?>`, 'i');
      return regex.test(head);
    }
  }

  if (element === 'link') {
    if (attributes.rel) {
      const regex = new RegExp(`<link[^>]*rel\\s*=\\s*["']?${escapeRegex(attributes.rel)}["']?[^>]*/?>`, 'i');
      return regex.test(head);
    }
  }

  return false;
}

/**
 * Get title content
 */
function getTitleContent(head) {
  const match = head.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? match[1].trim() : '';
}

/**
 * Get meta content by name or property
 */
function getMetaContent(head, attr, value) {
  const regex = new RegExp(`<meta[^>]*${attr}\\s*=\\s*["']?${escapeRegex(value)}["']?[^>]*content\\s*=\\s*["']([^"']+)["'][^>]*/?>`, 'i');
  const match = head.match(regex);
  if (match) return match[1];

  // Try reverse order (content before name/property)
  const regex2 = new RegExp(`<meta[^>]*content\\s*=\\s*["']([^"']+)["'][^>]*${attr}\\s*=\\s*["']?${escapeRegex(value)}["']?[^>]*/?>`, 'i');
  const match2 = head.match(regex2);
  return match2 ? match2[1] : null;
}

/**
 * Check if charset is first element
 */
function isCharsetFirst(head) {
  const firstMeta = head.match(/<meta[^>]*\/?>/i);
  if (!firstMeta) return false;
  return /charset\s*=\s*["']?utf-8["']?/i.test(firstMeta[0]);
}

/**
 * Escape special regex characters
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * OG Image recommended dimensions
 */
const OG_IMAGE_REQUIREMENTS = {
  recommended: { width: 1200, height: 630 },  // Facebook/LinkedIn optimal
  minimum: { width: 600, height: 315 },        // Minimum for most platforms
  twitter: { width: 1200, height: 600 },       // Twitter large card (2:1)
  square: { width: 1200, height: 1200 }        // Square format
};

/**
 * Get image dimensions using sharp (if available)
 */
async function getImageDimensions(imagePath) {
  try {
    const sharp = require('sharp');
    const metadata = await sharp(imagePath).metadata();
    return { width: metadata.width, height: metadata.height };
  } catch {
    // Sharp not available or image can't be read
    return null;
  }
}

/**
 * Validate OG image dimensions and meta tags
 */
async function validateOgImage(head, filePath) {
  const warnings = [];
  const info = [];

  // Get og:image content
  const ogImage = getMetaContent(head, 'property', 'og:image');
  if (!ogImage) {
    return { warnings, info };
  }

  // Check for og:image:width and og:image:height meta tags
  const declaredWidth = getMetaContent(head, 'property', 'og:image:width');
  const declaredHeight = getMetaContent(head, 'property', 'og:image:height');

  if (declaredWidth && declaredHeight) {
    const w = parseInt(declaredWidth, 10);
    const h = parseInt(declaredHeight, 10);

    if (isNaN(w) || isNaN(h)) {
      warnings.push('og:image:width or og:image:height has invalid value');
    } else {
      // Validate declared dimensions
      const dimensionWarnings = checkOgDimensions(w, h);
      warnings.push(...dimensionWarnings.warnings);
      info.push(...dimensionWarnings.info);
      info.push(`og:image dimensions declared: ${w}x${h}`);
    }
  } else if (declaredWidth || declaredHeight) {
    warnings.push('og:image has width but no height (or vice versa) - include both');
  } else {
    // No dimensions declared, recommend adding them
    info.push('Consider adding og:image:width and og:image:height meta tags');
  }

  // Check og:image:type
  const ogImageType = getMetaContent(head, 'property', 'og:image:type');
  if (!ogImageType) {
    info.push('Consider adding og:image:type (e.g., image/jpeg, image/png)');
  }

  // Check og:image:alt
  const ogImageAlt = getMetaContent(head, 'property', 'og:image:alt');
  if (!ogImageAlt) {
    warnings.push('Missing og:image:alt - important for accessibility');
  }

  // If local file, try to validate actual dimensions
  if (!ogImage.startsWith('http://') && !ogImage.startsWith('https://')) {
    const htmlDir = dirname(filePath);
    const imagePath = ogImage.startsWith('/')
      ? resolve(htmlDir, '..', ogImage.slice(1))  // Absolute from root
      : resolve(htmlDir, ogImage);                 // Relative

    if (existsSync(imagePath)) {
      const dimensions = await getImageDimensions(imagePath);
      if (dimensions) {
        const { width, height } = dimensions;
        info.push(`Actual image size: ${width}x${height}`);

        // Check actual vs declared
        if (declaredWidth && declaredHeight) {
          const dw = parseInt(declaredWidth, 10);
          const dh = parseInt(declaredHeight, 10);
          if (dw !== width || dh !== height) {
            warnings.push(`Declared dimensions (${dw}x${dh}) don't match actual (${width}x${height})`);
          }
        }

        // Validate actual dimensions
        const dimensionWarnings = checkOgDimensions(width, height);
        warnings.push(...dimensionWarnings.warnings);
        // Don't duplicate info if we already have declared dimensions
        if (!declaredWidth) {
          info.push(...dimensionWarnings.info);
        }
      }
    } else {
      warnings.push(`og:image file not found: ${ogImage}`);
    }
  }

  // Check Twitter card image
  const twitterImage = getMetaContent(head, 'name', 'twitter:image');
  const twitterCard = getMetaContent(head, 'name', 'twitter:card');

  if (twitterCard === 'summary_large_image' && !twitterImage) {
    info.push('twitter:card is summary_large_image but no twitter:image (will use og:image)');
  }

  return { warnings, info };
}

/**
 * Check OG image dimensions against requirements
 */
function checkOgDimensions(width, height) {
  const warnings = [];
  const info = [];
  const ratio = width / height;

  // Check minimum size
  if (width < OG_IMAGE_REQUIREMENTS.minimum.width || height < OG_IMAGE_REQUIREMENTS.minimum.height) {
    warnings.push(`OG image too small: ${width}x${height} (minimum: ${OG_IMAGE_REQUIREMENTS.minimum.width}x${OG_IMAGE_REQUIREMENTS.minimum.height})`);
  }

  // Check recommended size
  if (width < OG_IMAGE_REQUIREMENTS.recommended.width || height < OG_IMAGE_REQUIREMENTS.recommended.height) {
    if (width >= OG_IMAGE_REQUIREMENTS.minimum.width) {
      info.push(`Consider larger image: ${width}x${height} (recommended: 1200x630)`);
    }
  }

  // Check aspect ratio (should be close to 1.91:1 for Facebook or 2:1 for Twitter)
  const fbRatio = 1.91;  // 1200/630
  const twRatio = 2.0;   // 1200/600

  if (Math.abs(ratio - fbRatio) < 0.1) {
    info.push('Aspect ratio optimal for Facebook/LinkedIn (1.91:1)');
  } else if (Math.abs(ratio - twRatio) < 0.1) {
    info.push('Aspect ratio optimal for Twitter (2:1)');
  } else if (Math.abs(ratio - 1) < 0.1) {
    info.push('Square image - works but 1.91:1 recommended for better display');
  } else if (ratio < 1) {
    warnings.push(`Portrait orientation not recommended for social sharing (ratio: ${ratio.toFixed(2)}:1)`);
  }

  // Maximum file size note (can't check without loading, but mention it)
  if (width > 2000 || height > 2000) {
    info.push('Very large image - ensure file size is under 8MB for Facebook');
  }

  return { warnings, info };
}

/**
 * Validate a single file against a profile
 */
async function validateFile(filePath, profile) {
  const html = readFileSync(filePath, 'utf-8');
  const head = extractHead(html);

  const errors = [];
  const warnings = [];
  const info = [];

  if (!head) {
    errors.push('No <head> element found');
    return { errors, warnings, info };
  }

  // Check required elements
  for (const rule of profile.required || []) {
    if (!elementExists(head, rule)) {
      errors.push(rule.message || `Missing required: ${JSON.stringify(rule)}`);
    } else {
      // Check constraints
      if (rule.constraints) {
        if (rule.element === 'title') {
          const title = getTitleContent(head);
          if (rule.constraints.minLength && title.length < rule.constraints.minLength) {
            errors.push(`Title too short: ${title.length} chars (min: ${rule.constraints.minLength})`);
          }
          if (rule.constraints.maxLength && title.length > rule.constraints.maxLength) {
            warnings.push(`Title may be too long: ${title.length} chars (max: ${rule.constraints.maxLength})`);
          }
        }
        if (rule.element === 'meta' && rule.attributes.name === 'description') {
          const desc = getMetaContent(head, 'name', 'description');
          if (desc) {
            if (rule.constraints.minLength && desc.length < rule.constraints.minLength) {
              errors.push(`Description too short: ${desc.length} chars (min: ${rule.constraints.minLength})`);
            }
            if (rule.constraints.maxLength && desc.length > rule.constraints.maxLength) {
              warnings.push(`Description may be too long: ${desc.length} chars (max: ${rule.constraints.maxLength})`);
            }
          }
        }
      }

      // Check position constraint
      if (rule.position === 'first' && rule.element === 'meta' && rule.attributes.charset) {
        if (!isCharsetFirst(head)) {
          errors.push('charset must be the first meta element in <head>');
        }
      }
    }
  }

  // Check recommended elements
  for (const rule of profile.recommended || []) {
    if (!elementExists(head, rule)) {
      warnings.push(rule.message || `Missing recommended: ${JSON.stringify(rule)}`);
    } else {
      // Check absolute URL constraint for og:image and og:url
      if (rule.constraints?.absoluteUrl) {
        const attrType = rule.attributes.property ? 'property' : 'name';
        const attrValue = rule.attributes.property || rule.attributes.name;
        const content = getMetaContent(head, attrType, attrValue);
        if (content && !content.startsWith('http://') && !content.startsWith('https://')) {
          warnings.push(`${attrValue} should use absolute URL (got: ${content})`);
        }
      }
    }
  }

  // Validate OG image dimensions
  const ogImageResult = await validateOgImage(head, filePath);
  warnings.push(...ogImageResult.warnings);
  info.push(...ogImageResult.info);

  return { errors, warnings, info };
}

/**
 * Find HTML files recursively
 */
function findHtmlFiles(dir, files = []) {
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      // Skip node_modules and hidden directories
      if (!entry.startsWith('.') && entry !== 'node_modules') {
        findHtmlFiles(fullPath, files);
      }
    } else if (entry.endsWith('.html')) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  let profileName = 'default';
  let files = [];
  let verbose = false;

  // Parse arguments
  for (const arg of args) {
    if (arg.startsWith('--profile=')) {
      profileName = arg.split('=')[1];
    } else if (arg === '--verbose' || arg === '-v') {
      verbose = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
${colors.cyan}Metadata Validator${colors.reset}

Usage:
  node scripts/metadata-check.js [options] [files...]

Options:
  --profile=NAME    Use specific profile (default, article, product)
  --verbose, -v     Show info messages (OG image details)
  --help, -h        Show this help

Examples:
  node scripts/metadata-check.js examples/pages/**/*.html
  node scripts/metadata-check.js --profile=article examples/pages/press-release/index.html
  node scripts/metadata-check.js                    # Check all HTML in examples/pages/

OG Image Validation:
  Validates og:image dimensions, og:image:alt, and checks actual file sizes.
  Recommended: 1200x630 (Facebook/LinkedIn) or 1200x600 (Twitter).
`);
      process.exit(0);
    } else {
      files.push(arg);
    }
  }

  // If no files specified, find all HTML files in examples
  if (files.length === 0) {
    const examplesDir = resolve(__dirname, '../examples');
    if (existsSync(examplesDir)) {
      files = findHtmlFiles(examplesDir);
    }
  }

  if (files.length === 0) {
    console.log(`${colors.yellow}No HTML files found${colors.reset}`);
    process.exit(0);
  }

  const profile = loadProfile(profileName);
  console.log(`${colors.cyan}Using profile: ${profile.name}${colors.reset}\n`);

  let totalErrors = 0;
  let totalWarnings = 0;

  for (const file of files) {
    if (!existsSync(file)) {
      console.log(`${colors.yellow}File not found: ${file}${colors.reset}`);
      continue;
    }

    const { errors, warnings, info } = await validateFile(file, profile);
    totalErrors += errors.length;
    totalWarnings += warnings.length;

    if (errors.length === 0 && warnings.length === 0 && (!verbose || info.length === 0)) {
      console.log(`${colors.green}✓${colors.reset} ${file}`);
    } else {
      console.log(`${colors.dim}─────────────────────────────────────────${colors.reset}`);
      console.log(`${file}`);

      for (const error of errors) {
        console.log(`  ${colors.red}✗ ERROR:${colors.reset} ${error}`);
      }

      for (const warning of warnings) {
        console.log(`  ${colors.yellow}⚠ WARN:${colors.reset} ${warning}`);
      }

      if (verbose) {
        for (const i of info) {
          console.log(`  ${colors.dim}ℹ ${i}${colors.reset}`);
        }
      }
    }
  }

  console.log(`\n${colors.dim}─────────────────────────────────────────${colors.reset}`);
  console.log(`Total: ${files.length} files, ${colors.red}${totalErrors} errors${colors.reset}, ${colors.yellow}${totalWarnings} warnings${colors.reset}`);

  // Exit with error code if there were errors
  if (totalErrors > 0) {
    process.exit(1);
  }
}

main();
