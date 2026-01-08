#!/usr/bin/env node

/**
 * Image HTML Best Practices Checker
 *
 * Validates <img> elements in HTML files for modern best practices:
 * - Requires loading attribute (lazy/eager)
 * - Requires decoding attribute (async/sync/auto)
 * - Suggests srcset for images likely to be large
 * - Suggests <picture> element for modern format support
 *
 * Usage:
 *   node scripts/image-html-check.js [directories...]
 *   node scripts/image-html-check.js examples/pages examples/demo-site
 */

import { readdir, readFile, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';

// Configuration
const CONFIG = {
  defaultDirs: ['src'],
  // Images that should have srcset (likely large/hero images)
  heroImagePatterns: [/hero/i, /banner/i, /cover/i, /featured/i, /full-?width/i],
  // Allowed loading values
  loadingValues: ['lazy', 'eager'],
  // Allowed decoding values
  decodingValues: ['async', 'sync', 'auto'],
  // Allowed fetchpriority values
  fetchpriorityValues: ['high', 'low', 'auto'],
};

// Track issues
const errors = [];
const warnings = [];

/**
 * Get all HTML files in a directory recursively
 */
async function getHtmlFiles(dir, files = []) {
  try {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
          await getHtmlFiles(fullPath, files);
        }
      } else if (entry.isFile()) {
        const ext = extname(entry.name).toLowerCase();
        if (['.html', '.htm', '.xhtml'].includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  } catch (err) {
    if (err.code !== 'ENOENT') {
      warnings.push(`Could not read directory: ${dir}`);
    }
  }

  return files;
}

/**
 * Extract all <img> elements from HTML
 */
function extractImgElements(html, filePath) {
  const imgRegex = /<img\b([^>]*)\/?\s*>/gi;
  const images = [];
  let match;

  while ((match = imgRegex.exec(html)) !== null) {
    const attrs = match[1];
    const lineNumber = html.substring(0, match.index).split('\n').length;

    images.push({
      full: match[0],
      attrs,
      line: lineNumber,
      file: filePath,
      src: extractAttr(attrs, 'src'),
      alt: extractAttr(attrs, 'alt'),
      loading: extractAttr(attrs, 'loading'),
      decoding: extractAttr(attrs, 'decoding'),
      fetchpriority: extractAttr(attrs, 'fetchpriority'),
      srcset: extractAttr(attrs, 'srcset'),
      sizes: extractAttr(attrs, 'sizes'),
      width: extractAttr(attrs, 'width'),
      height: extractAttr(attrs, 'height'),
    });
  }

  return images;
}

/**
 * Extract attribute value from attribute string
 */
function extractAttr(attrs, name) {
  const regex = new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, 'i');
  const match = attrs.match(regex);
  return match ? match[1] : null;
}

/**
 * Check if image is inside a <picture> element
 */
function isInsidePicture(html, imgIndex) {
  // Look backwards for <picture> and forwards for </picture>
  const before = html.substring(0, imgIndex);
  const after = html.substring(imgIndex);

  const lastPictureOpen = before.lastIndexOf('<picture');
  const lastPictureClose = before.lastIndexOf('</picture>');

  if (lastPictureOpen === -1) return false;
  if (lastPictureClose > lastPictureOpen) return false;

  return after.indexOf('</picture>') !== -1;
}

/**
 * Validate a single image element
 */
function validateImage(img, html) {
  const issues = { errors: [], warnings: [] };
  const loc = `${img.file}:${img.line}`;

  // Check loading attribute
  if (!img.loading) {
    issues.warnings.push(`${loc}: Missing loading attribute on <img src="${img.src || '...'}">`);
  } else if (!CONFIG.loadingValues.includes(img.loading)) {
    issues.errors.push(`${loc}: Invalid loading="${img.loading}" (use: ${CONFIG.loadingValues.join(', ')})`);
  }

  // Check decoding attribute
  if (!img.decoding) {
    issues.warnings.push(`${loc}: Missing decoding attribute on <img src="${img.src || '...'}">`);
  } else if (!CONFIG.decodingValues.includes(img.decoding)) {
    issues.errors.push(`${loc}: Invalid decoding="${img.decoding}" (use: ${CONFIG.decodingValues.join(', ')})`);
  }

  // Check fetchpriority if present
  if (img.fetchpriority && !CONFIG.fetchpriorityValues.includes(img.fetchpriority)) {
    issues.errors.push(`${loc}: Invalid fetchpriority="${img.fetchpriority}" (use: ${CONFIG.fetchpriorityValues.join(', ')})`);
  }

  // Suggest srcset for likely hero/large images
  if (!img.srcset && img.src) {
    const isLikelyLarge = CONFIG.heroImagePatterns.some(pattern => pattern.test(img.src));
    if (isLikelyLarge) {
      issues.warnings.push(`${loc}: Consider adding srcset for responsive image: ${img.src}`);
    }
  }

  // Check srcset/sizes consistency
  if (img.srcset && img.srcset.includes('w') && !img.sizes) {
    issues.errors.push(`${loc}: srcset with width descriptors requires sizes attribute`);
  }
  if (img.sizes && !img.srcset) {
    issues.errors.push(`${loc}: sizes attribute requires srcset`);
  }

  // Suggest <picture> for non-picture images
  const imgIndex = html.indexOf(img.full);
  if (!isInsidePicture(html, imgIndex)) {
    // Only suggest for images that look like they could benefit
    if (img.src && /\.(jpe?g|png)$/i.test(img.src) && !img.src.includes('icon')) {
      issues.warnings.push(`${loc}: Consider using <picture> with WebP/AVIF sources for: ${img.src}`);
    }
  }

  // Check for width/height (helps prevent layout shift)
  if (!img.width || !img.height) {
    issues.warnings.push(`${loc}: Consider adding width and height attributes to prevent layout shift`);
  }

  return issues;
}

/**
 * Validate a single HTML file
 */
async function validateFile(filePath) {
  const html = await readFile(filePath, 'utf-8');
  const images = extractImgElements(html, filePath);
  const fileIssues = { errors: [], warnings: [] };

  for (const img of images) {
    const issues = validateImage(img, html);
    fileIssues.errors.push(...issues.errors);
    fileIssues.warnings.push(...issues.warnings);
  }

  return { images: images.length, ...fileIssues };
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const directories = args.length > 0 ? args : CONFIG.defaultDirs;

  console.log('Image HTML Best Practices Check');
  console.log('================================');
  console.log(`Checking directories: ${directories.join(', ')}`);
  console.log('');

  // Collect all HTML files
  const allFiles = [];
  for (const dir of directories) {
    await getHtmlFiles(dir, allFiles);
  }

  if (allFiles.length === 0) {
    console.log('No HTML files found.');
    process.exit(0);
  }

  console.log(`Found ${allFiles.length} HTML file(s)\n`);

  let totalImages = 0;
  let totalErrors = 0;
  let totalWarnings = 0;

  for (const file of allFiles) {
    const result = await validateFile(file);
    totalImages += result.images;
    totalErrors += result.errors.length;
    totalWarnings += result.warnings.length;

    if (result.errors.length > 0 || result.warnings.length > 0) {
      for (const error of result.errors) {
        console.log(`  \x1b[31m✗ ERROR:\x1b[0m ${error}`);
      }
      for (const warning of result.warnings) {
        console.log(`  \x1b[33m⚠ WARN:\x1b[0m ${warning}`);
      }
    }
  }

  // Print global warnings
  for (const warning of warnings) {
    console.log(`\n\x1b[33m⚠\x1b[0m ${warning}`);
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`Images checked: ${totalImages}`);

  if (totalErrors === 0 && totalWarnings === 0) {
    console.log('\x1b[32m✓ All image elements follow best practices!\x1b[0m');
    process.exit(0);
  } else {
    console.log(`\nSummary: ${totalErrors} error(s), ${totalWarnings} warning(s)`);

    if (totalErrors > 0) {
      console.log('\n\x1b[31m✗ Validation failed.\x1b[0m');
      console.log('\nTo fix:');
      console.log('  - Add loading="lazy" or loading="eager" to all images');
      console.log('  - Add decoding="async" for non-critical images');
      console.log('  - Use <picture> with modern format sources');
      console.log('  - Add srcset/sizes for responsive images');
      process.exit(1);
    } else {
      console.log('\n\x1b[33m⚠ Validation passed with warnings.\x1b[0m');
      process.exit(0);
    }
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
