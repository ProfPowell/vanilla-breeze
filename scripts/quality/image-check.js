#!/usr/bin/env node

/**
 * Image Validation Script
 *
 * Checks images for:
 * - File size (must be under 200KB)
 * - Modern format alternatives (WebP/AVIF required for JPEG/PNG)
 * - Reasonable dimensions
 *
 * Usage:
 *   node scripts/image-check.js [directories...]
 *   node scripts/image-check.js examples/pages examples/demo-site
 *
 * Exit codes:
 *   0 - All checks passed
 *   1 - Validation errors found
 */

import { readdir, stat } from 'node:fs/promises';
import { join, extname, basename, dirname } from 'node:path';
import sharp from 'sharp';

// Configuration
const CONFIG = {
  maxFileSize: 200 * 1024, // 200KB in bytes
  maxDimension: 4000, // Max width or height
  sourceFormats: ['.jpg', '.jpeg', '.png'],
  modernFormats: ['.webp', '.avif'],
  defaultDirs: ['src'],
};

// Track errors and warnings
const errors = [];
const warnings = [];

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
}

/**
 * Get all image files in a directory recursively
 */
async function getImageFiles(dir, files = []) {
  try {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip node_modules and hidden directories
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
          await getImageFiles(fullPath, files);
        }
      } else if (entry.isFile()) {
        const ext = extname(entry.name).toLowerCase();
        if ([...CONFIG.sourceFormats, ...CONFIG.modernFormats].includes(ext)) {
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
 * Check if modern format alternatives exist
 */
async function checkModernFormats(imagePath) {
  const ext = extname(imagePath).toLowerCase();

  // Only check source formats (JPEG/PNG)
  if (!CONFIG.sourceFormats.includes(ext)) {
    return [];
  }

  const dir = dirname(imagePath);
  const name = basename(imagePath, ext);
  const missing = [];

  for (const modernExt of CONFIG.modernFormats) {
    const modernPath = join(dir, `${name}${modernExt}`);
    try {
      await stat(modernPath);
    } catch {
      missing.push(modernExt.slice(1).toUpperCase()); // Remove dot, uppercase
    }
  }

  return missing;
}

/**
 * Validate a single image file
 */
async function validateImage(imagePath) {
  const results = {
    path: imagePath,
    errors: [],
    warnings: [],
  };

  try {
    // Get file stats
    const fileStats = await stat(imagePath);
    const fileSize = fileStats.size;

    // Check file size
    if (fileSize > CONFIG.maxFileSize) {
      results.errors.push(
        `File size ${formatBytes(fileSize)} exceeds limit of ${formatBytes(CONFIG.maxFileSize)}`
      );
    }

    // Get image metadata using sharp
    const metadata = await sharp(imagePath).metadata();

    // Check dimensions
    if (metadata.width > CONFIG.maxDimension || metadata.height > CONFIG.maxDimension) {
      results.warnings.push(
        `Large dimensions: ${metadata.width}x${metadata.height} (max recommended: ${CONFIG.maxDimension}px)`
      );
    }

    // Check for modern format alternatives
    const missingFormats = await checkModernFormats(imagePath);
    if (missingFormats.length > 0) {
      results.errors.push(
        `Missing modern format alternatives: ${missingFormats.join(', ')}`
      );
    }

    // Calculate bytes per pixel for optimization opportunity
    const pixels = metadata.width * metadata.height;
    const bpp = fileSize / pixels;
    if (bpp > 1.5) {
      results.warnings.push(
        `High bytes/pixel ratio (${bpp.toFixed(2)}): may benefit from additional compression`
      );
    }

  } catch (err) {
    results.errors.push(`Could not analyze image: ${err.message}`);
  }

  return results;
}

/**
 * Main validation function
 */
async function main() {
  // Get directories from command line or use defaults
  const args = process.argv.slice(2);
  const directories = args.length > 0 ? args : CONFIG.defaultDirs;

  console.log('Image Validation Check');
  console.log('======================');
  console.log(`Checking directories: ${directories.join(', ')}`);
  console.log(`Max file size: ${formatBytes(CONFIG.maxFileSize)}`);
  console.log(`Required formats: WebP and AVIF for all JPEG/PNG files`);
  console.log('');

  // Collect all image files
  const allFiles = [];
  for (const dir of directories) {
    await getImageFiles(dir, allFiles);
  }

  if (allFiles.length === 0) {
    console.log('No image files found.');
    process.exit(0);
  }

  console.log(`Found ${allFiles.length} image files\n`);

  // Validate each image
  let errorCount = 0;
  let warningCount = 0;

  for (const file of allFiles) {
    const result = await validateImage(file);

    if (result.errors.length > 0 || result.warnings.length > 0) {
      console.log(`\n${result.path}`);

      for (const error of result.errors) {
        console.log(`  ❌ ERROR: ${error}`);
        errorCount++;
      }

      for (const warning of result.warnings) {
        console.log(`  ⚠️  WARN: ${warning}`);
        warningCount++;
      }
    }
  }

  // Print global warnings
  for (const warning of warnings) {
    console.log(`\n⚠️  ${warning}`);
    warningCount++;
  }

  // Summary
  console.log('\n' + '='.repeat(50));

  if (errorCount === 0 && warningCount === 0) {
    console.log('✅ All images passed validation!');
    process.exit(0);
  } else {
    console.log(`\nSummary: ${errorCount} error(s), ${warningCount} warning(s)`);

    if (errorCount > 0) {
      console.log('\n❌ Validation failed.');
      console.log('\nTo fix missing modern formats, run:');
      console.log('  npm run optimize:images');
      process.exit(1);
    } else {
      console.log('\n⚠️  Validation passed with warnings.');
      process.exit(0);
    }
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
